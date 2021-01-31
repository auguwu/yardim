(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker/babel/src/es2015_linker_plugin", ["require", "exports", "tslib", "@babel/types", "@angular/compiler-cli/linker", "@angular/compiler-cli/linker/babel/src/ast/babel_ast_factory", "@angular/compiler-cli/linker/babel/src/ast/babel_ast_host", "@angular/compiler-cli/linker/babel/src/babel_declaration_scope"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEs2015LinkerPlugin = void 0;
    var tslib_1 = require("tslib");
    var t = require("@babel/types");
    var linker_1 = require("@angular/compiler-cli/linker");
    var babel_ast_factory_1 = require("@angular/compiler-cli/linker/babel/src/ast/babel_ast_factory");
    var babel_ast_host_1 = require("@angular/compiler-cli/linker/babel/src/ast/babel_ast_host");
    var babel_declaration_scope_1 = require("@angular/compiler-cli/linker/babel/src/babel_declaration_scope");
    /**
     * Create a Babel plugin that visits the program, identifying and linking partial declarations.
     *
     * The plugin delegates most of its work to a generic `FileLinker` for each file (`t.Program` in
     * Babel) that is visited.
     */
    function createEs2015LinkerPlugin(_a) {
        var fileSystem = _a.fileSystem, logger = _a.logger, options = tslib_1.__rest(_a, ["fileSystem", "logger"]);
        var fileLinker = null;
        return {
            visitor: {
                Program: {
                    /**
                     * Create a new `FileLinker` as we enter each file (`t.Program` in Babel).
                     */
                    enter: function (path) {
                        var _a, _b;
                        assertNull(fileLinker);
                        // Babel can be configured with a `filename` or `relativeFilename` (or both, or neither) -
                        // possibly relative to the optional `cwd` path.
                        var file = path.hub.file;
                        var filename = (_a = file.opts.filename) !== null && _a !== void 0 ? _a : file.opts.filenameRelative;
                        if (!filename) {
                            throw new Error('No filename (nor filenameRelative) provided by Babel. This is required for the linking of partially compiled directives and components.');
                        }
                        var sourceUrl = fileSystem.resolve((_b = file.opts.cwd) !== null && _b !== void 0 ? _b : '.', filename);
                        var linkerEnvironment = linker_1.LinkerEnvironment.create(fileSystem, logger, new babel_ast_host_1.BabelAstHost(), new babel_ast_factory_1.BabelAstFactory(sourceUrl), options);
                        fileLinker = new linker_1.FileLinker(linkerEnvironment, sourceUrl, file.code);
                    },
                    /**
                     * On exiting the file, insert any shared constant statements that were generated during
                     * linking of the partial declarations.
                     */
                    exit: function () {
                        var e_1, _a;
                        assertNotNull(fileLinker);
                        try {
                            for (var _b = tslib_1.__values(fileLinker.getConstantStatements()), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _d = _c.value, constantScope = _d.constantScope, statements = _d.statements;
                                insertStatements(constantScope, statements);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        fileLinker = null;
                    }
                },
                /**
                 * Test each call expression to see if it is a partial declaration; it if is then replace it
                 * with the results of linking the declaration.
                 */
                CallExpression: function (call) {
                    if (fileLinker === null) {
                        // Any statements that are inserted upon program exit will be visited outside of an active
                        // linker context. These call expressions are known not to contain partial declarations,
                        // so it's safe to skip visiting those call expressions.
                        return;
                    }
                    try {
                        var calleeName = getCalleeName(call);
                        if (calleeName === null) {
                            return;
                        }
                        var args = call.node.arguments;
                        if (!fileLinker.isPartialDeclaration(calleeName) || !isExpressionArray(args)) {
                            return;
                        }
                        var declarationScope = new babel_declaration_scope_1.BabelDeclarationScope(call.scope);
                        var replacement = fileLinker.linkPartialDeclaration(calleeName, args, declarationScope);
                        call.replaceWith(replacement);
                    }
                    catch (e) {
                        var node = linker_1.isFatalLinkerError(e) ? e.node : call.node;
                        throw buildCodeFrameError(call.hub.file, e.message, node);
                    }
                }
            }
        };
    }
    exports.createEs2015LinkerPlugin = createEs2015LinkerPlugin;
    /**
     * Insert the `statements` at the location defined by `path`.
     *
     * The actual insertion strategy depends upon the type of the `path`.
     */
    function insertStatements(path, statements) {
        if (path.isFunction()) {
            insertIntoFunction(path, statements);
        }
        else if (path.isProgram()) {
            insertIntoProgram(path, statements);
        }
    }
    /**
     * Insert the `statements` at the top of the body of the `fn` function.
     */
    function insertIntoFunction(fn, statements) {
        var body = fn.get('body');
        body.unshiftContainer('body', statements);
    }
    /**
     * Insert the `statements` at the top of the `program`, below any import statements.
     */
    function insertIntoProgram(program, statements) {
        var body = program.get('body');
        var importStatements = body.filter(function (statement) { return statement.isImportDeclaration(); });
        if (importStatements.length === 0) {
            program.unshiftContainer('body', statements);
        }
        else {
            importStatements[importStatements.length - 1].insertAfter(statements);
        }
    }
    function getCalleeName(call) {
        var callee = call.node.callee;
        if (t.isIdentifier(callee)) {
            return callee.name;
        }
        else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            return callee.property.name;
        }
        else {
            return null;
        }
    }
    /**
     * Return true if all the `nodes` are Babel expressions.
     */
    function isExpressionArray(nodes) {
        return nodes.every(function (node) { return t.isExpression(node); });
    }
    /**
     * Assert that the given `obj` is `null`.
     */
    function assertNull(obj) {
        if (obj !== null) {
            throw new Error('BUG - expected `obj` to be null');
        }
    }
    /**
     * Assert that the given `obj` is not `null`.
     */
    function assertNotNull(obj) {
        if (obj === null) {
            throw new Error('BUG - expected `obj` not to be null');
        }
    }
    /**
     * Create a string representation of an error that includes the code frame of the `node`.
     */
    function buildCodeFrameError(file, message, node) {
        var filename = file.opts.filename || '(unknown file)';
        var error = file.buildCodeFrameError(node, message);
        return filename + ": " + error.message;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXMyMDE1X2xpbmtlcl9wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbGlua2VyL2JhYmVsL3NyYy9lczIwMTVfbGlua2VyX3BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBU0EsZ0NBQWtDO0lBRWxDLHVEQUFrRjtJQUVsRixrR0FBd0Q7SUFDeEQsNEZBQWtEO0lBQ2xELDBHQUFtRjtJQUluRjs7Ozs7T0FLRztJQUNILFNBQWdCLHdCQUF3QixDQUFDLEVBQXFEO1FBQXBELElBQUEsVUFBVSxnQkFBQSxFQUFFLE1BQU0sWUFBQSxFQUFLLE9BQU8sc0JBQS9CLHdCQUFnQyxDQUFEO1FBRXRFLElBQUksVUFBVSxHQUFrRSxJQUFJLENBQUM7UUFFckYsT0FBTztZQUNMLE9BQU8sRUFBRTtnQkFDUCxPQUFPLEVBQUU7b0JBRVA7O3VCQUVHO29CQUNILEtBQUssRUFBTCxVQUFNLElBQXlCOzt3QkFDN0IsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUN2QiwwRkFBMEY7d0JBQzFGLGdEQUFnRDt3QkFDaEQsSUFBTSxJQUFJLEdBQWMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7d0JBQ3RDLElBQU0sUUFBUSxTQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxtQ0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDO3dCQUNsRSxJQUFJLENBQUMsUUFBUSxFQUFFOzRCQUNiLE1BQU0sSUFBSSxLQUFLLENBQ1gseUlBQXlJLENBQUMsQ0FBQzt5QkFDaEo7d0JBQ0QsSUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE9BQU8sT0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsbUNBQUksR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUVyRSxJQUFNLGlCQUFpQixHQUFHLDBCQUFpQixDQUFDLE1BQU0s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QUksRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7U0FDcEQ7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLGFBQWEsQ0FBSSxHQUFXO1FBQ25DLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7U0FDeEQ7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLG1CQUFtQixDQUFDLElBQWUsRUFBRSxPQUFlLEVBQUUsSUFBWTtRQUN6RSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQztRQUN4RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELE9BQVUsUUFBUSxVQUFLLEtBQUssQ0FBQyxPQUFTLENBQUM7SUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtQbHVnaW5PYmp9IGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCB7Tm9kZVBhdGh9IGZyb20gJ0BiYWJlbC90cmF2ZXJzZSc7XG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcyc7XG5cbmltcG9ydCB7RmlsZUxpbmtlciwgaXNGYXRhbExpbmtlckVycm9yLCBMaW5rZXJFbnZpcm9ubWVudH0gZnJvbSAnLi4vLi4vLi4vbGlua2VyJztcblxuaW1wb3J0IHtCYWJlbEFzdEZhY3Rvcnl9IGZyb20gJy4vYXN0L2JhYmVsX2FzdF9mYWN0b3J5JztcbmltcG9ydCB7QmFiZWxBc3RIb3N0fSBmcm9tICcuL2FzdC9iYWJlbF9hc3RfaG9zdCc7XG5pbXBvcnQge0JhYmVsRGVjbGFyYXRpb25TY29wZSwgQ29uc3RhbnRTY29wZVBhdGh9IGZyb20gJy4vYmFiZWxfZGVjbGFyYXRpb25fc2NvcGUnO1xuaW1wb3J0IHtMaW5rZXJQbHVnaW5PcHRpb25zfSBmcm9tICcuL2xpbmtlcl9wbHVnaW5fb3B0aW9ucyc7XG5cblxuLyoqXG4gKiBDcmVhdGUgYSBCYWJlbCBwbHVnaW4gdGhhdCB2aXNpdHMgdGhlIHByb2dyYW0sIGlkZW50aWZ5aW5nIGFuZCBsaW5raW5nIHBhcnRpYWwgZGVjbGFyYXRpb25zLlxuICpcbiAqIFRoZSBwbHVnaW4gZGVsZWdhdGVzIG1vc3Qgb2YgaXRzIHdvcmsgdG8gYSBnZW5lcmljIGBGaWxlTGlua2VyYCBmb3IgZWFjaCBmaWxlIChgdC5Qcm9ncmFtYCBpblxuICogQmFiZWwpIHRoYXQgaXMgdmlzaXRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVzMjAxNUxpbmtlclBsdWdpbih7ZmlsZVN5c3RlbSwgbG9nZ2VyLCAuLi5vcHRpb25zfTogTGlua2VyUGx1Z2luT3B0aW9ucyk6XG4gICAgUGx1Z2luT2JqIHtcbiAgbGV0IGZpbGVMaW5rZXI6IEZpbGVMaW5rZXI8Q29uc3RhbnRTY29wZVBhdGgsIHQuU3RhdGVtZW50LCB0LkV4cHJlc3Npb24+fG51bGwgPSBudWxsO1xuXG4gIHJldHVybiB7XG4gICAgdmlzaXRvcjoge1xuICAgICAgUHJvZ3JhbToge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgYEZpbGVMaW5rZXJgIGFzIHdlIGVudGVyIGVhY2ggZmlsZSAoYHQuUHJvZ3JhbWAgaW4gQmFiZWwpLlxuICAgICAgICAgKi9cbiAgICAgICAgZW50ZXIocGF0aDogTm9kZVBhdGg8dC5Qcm9ncmFtPik6IHZvaWQge1xuICAgICAgICAgIGFzc2VydE51bGwoZmlsZUxpbmtlcik7XG4gICAgICAgICAgLy8gQmFiZWwgY2FuIGJlIGNvbmZpZ3VyZWQgd2l0aCBhIGBmaWxlbmFtZWAgb3IgYHJlbGF0aXZlRmlsZW5hbWVgIChvciBib3RoLCBvciBuZWl0aGVyKSAtXG4gICAgICAgICAgLy8gcG9zc2libHkgcmVsYXRpdmUgdG8gdGhlIG9wdGlvbmFsIGBjd2RgIHBhdGguXG4gICAgICAgICAgY29uc3QgZmlsZTogQmFiZWxGaWxlID0gcGF0aC5odWIuZmlsZTtcbiAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IGZpbGUub3B0cy5maWxlbmFtZSA/PyBmaWxlLm9wdHMuZmlsZW5hbWVSZWxhdGl2ZTtcbiAgICAgICAgICBpZiAoIWZpbGVuYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgJ05vIGZpbGVuYW1lIChub3IgZmlsZW5hbWVSZWxhdGl2ZSkgcHJvdmlkZWQgYnkgQmFiZWwuIFRoaXMgaXMgcmVxdWlyZWQgZm9yIHRoZSBsaW5raW5nIG9mIHBhcnRpYWxseSBjb21waWxlZCBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzb3VyY2VVcmwgPSBmaWxlU3lzdGVtLnJlc29sdmUoZmlsZS5vcHRzLmN3ZCA/PyAnLicsIGZpbGVuYW1lKTtcblxuICAgICAgICAgIGNvbnN0IGxpbmtlckVudmlyb25tZW50ID0gTGlua2VyRW52aXJvbm1lbnQuY3JlYXRlPHQuU3RhdGVtZW50LCB0LkV4cHJlc3Npb24+KFxuICAgICAgICAgICAgICBmaWxlU3lzdGVtLCBsb2dnZXIsIG5ldyBCYWJlbEFzdEhvc3QoKSwgbmV3IEJhYmVsQXN0RmFjdG9yeShzb3VyY2VVcmwpLCBvcHRpb25zKTtcbiAgICAgICAgICBmaWxlTGlua2VyID0gbmV3IEZpbGVMaW5rZXIobGlua2VyRW52aXJvbm1lbnQsIHNvdXJjZVVybCwgZmlsZS5jb2RlKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT24gZXhpdGluZyB0aGUgZmlsZSwgaW5zZXJ0IGFueSBzaGFyZWQgY29uc3RhbnQgc3RhdGVtZW50cyB0aGF0IHdlcmUgZ2VuZXJhdGVkIGR1cmluZ1xuICAgICAgICAgKiBsaW5raW5nIG9mIHRoZSBwYXJ0aWFsIGRlY2xhcmF0aW9ucy5cbiAgICAgICAgICovXG4gICAgICAgIGV4aXQoKTogdm9pZCB7XG4gICAgICAgICAgYXNzZXJ0Tm90TnVsbChmaWxlTGlua2VyKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHtjb25zdGFudFNjb3BlLCBzdGF0ZW1lbnRzfSBvZiBmaWxlTGlua2VyLmdldENvbnN0YW50U3RhdGVtZW50cygpKSB7XG4gICAgICAgICAgICBpbnNlcnRTdGF0ZW1lbnRzKGNvbnN0YW50U2NvcGUsIHN0YXRlbWVudHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWxlTGlua2VyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBUZXN0IGVhY2ggY2FsbCBleHByZXNzaW9uIHRvIHNlZSBpZiBpdCBpcyBhIHBhcnRpYWwgZGVjbGFyYXRpb247IGl0IGlmIGlzIHRoZW4gcmVwbGFjZSBpdFxuICAgICAgICogd2l0aCB0aGUgcmVzdWx0cyBvZiBsaW5raW5nIHRoZSBkZWNsYXJhdGlvbi5cbiAgICAgICAqL1xuICAgICAgQ2FsbEV4cHJlc3Npb24oY2FsbDogTm9kZVBhdGg8dC5DYWxsRXhwcmVzc2lvbj4pOiB2b2lkIHtcbiAgICAgICAgaWYgKGZpbGVMaW5rZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBBbnkgc3RhdGVtZW50cyB0aGF0IGFyZSBpbnNlcnRlZCB1cG9uIHByb2dyYW0gZXhpdCB3aWxsIGJlIHZpc2l0ZWQgb3V0c2lkZSBvZiBhbiBhY3RpdmVcbiAgICAgICAgICAvLyBsaW5rZXIgY29udGV4dC4gVGhlc2UgY2FsbCBleHByZXNzaW9ucyBhcmUga25vd24gbm90IHRvIGNvbnRhaW4gcGFydGlhbCBkZWNsYXJhdGlvbnMsXG4gICAgICAgICAgLy8gc28gaXQncyBzYWZlIHRvIHNraXAgdmlzaXRpbmcgdGhvc2UgY2FsbCBleHByZXNzaW9ucy5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNhbGxlZU5hbWUgPSBnZXRDYWxsZWVOYW1lKGNhbGwpO1xuICAgICAgICAgIGlmIChjYWxsZWVOYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGFyZ3MgPSBjYWxsLm5vZGUuYXJndW1lbnRzO1xuICAgICAgICAgIGlmICghZmlsZUxpbmtlci5pc1BhcnRpYWxEZWNsYXJhdGlvbihjYWxsZWVOYW1lKSB8fCAhaXNFeHByZXNzaW9uQXJyYXkoYXJncykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBkZWNsYXJhdGlvblNjb3BlID0gbmV3IEJhYmVsRGVjbGFyYXRpb25TY29wZShjYWxsLnNjb3BlKTtcbiAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IGZpbGVMaW5rZXIubGlua1BhcnRpYWxEZWNsYXJhdGlvbihjYWxsZWVOYW1lLCBhcmdzLCBkZWNsYXJhdGlvblNjb3BlKTtcblxuICAgICAgICAgIGNhbGwucmVwbGFjZVdpdGgocmVwbGFjZW1lbnQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IGlzRmF0YWxMaW5rZXJFcnJvcihlKSA/IGUubm9kZSBhcyB0Lk5vZGUgOiBjYWxsLm5vZGU7XG4gICAgICAgICAgdGhyb3cgYnVpbGRDb2RlRnJhbWVFcnJvcihjYWxsLmh1Yi5maWxlLCBlLm1lc3NhZ2UsIG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgYHN0YXRlbWVudHNgIGF0IHRoZSBsb2NhdGlvbiBkZWZpbmVkIGJ5IGBwYXRoYC5cbiAqXG4gKiBUaGUgYWN0dWFsIGluc2VydGlvbiBzdHJhdGVneSBkZXBlbmRzIHVwb24gdGhlIHR5cGUgb2YgdGhlIGBwYXRoYC5cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0U3RhdGVtZW50cyhwYXRoOiBDb25zdGFudFNjb3BlUGF0aCwgc3RhdGVtZW50czogdC5TdGF0ZW1lbnRbXSk6IHZvaWQge1xuICBpZiAocGF0aC5pc0Z1bmN0aW9uKCkpIHtcbiAgICBpbnNlcnRJbnRvRnVuY3Rpb24ocGF0aCwgc3RhdGVtZW50cyk7XG4gIH0gZWxzZSBpZiAocGF0aC5pc1Byb2dyYW0oKSkge1xuICAgIGluc2VydEludG9Qcm9ncmFtKHBhdGgsIHN0YXRlbWVudHMpO1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBgc3RhdGVtZW50c2AgYXQgdGhlIHRvcCBvZiB0aGUgYm9keSBvZiB0aGUgYGZuYCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0SW50b0Z1bmN0aW9uKGZuOiBOb2RlUGF0aDx0LkZ1bmN0aW9uPiwgc3RhdGVtZW50czogdC5TdGF0ZW1lbnRbXSk6IHZvaWQge1xuICBjb25zdCBib2R5ID0gZm4uZ2V0KCdib2R5Jyk7XG4gIGJvZHkudW5zaGlmdENvbnRhaW5lcignYm9keScsIHN0YXRlbWVudHMpO1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgYHN0YXRlbWVudHNgIGF0IHRoZSB0b3Agb2YgdGhlIGBwcm9ncmFtYCwgYmVsb3cgYW55IGltcG9ydCBzdGF0ZW1lbnRzLlxuICovXG5mdW5jdGlvbiBpbnNlcnRJbnRvUHJvZ3JhbShwcm9ncmFtOiBOb2RlUGF0aDx0LlByb2dyYW0+LCBzdGF0ZW1lbnRzOiB0LlN0YXRlbWVudFtdKTogdm9pZCB7XG4gIGNvbnN0IGJvZHkgPSBwcm9ncmFtLmdldCgnYm9keScpO1xuICBjb25zdCBpbXBvcnRTdGF0ZW1lbnRzID0gYm9keS5maWx0ZXIoc3RhdGVtZW50ID0+IHN0YXRlbWVudC5pc0ltcG9ydERlY2xhcmF0aW9uKCkpO1xuICBpZiAoaW1wb3J0U3RhdGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBwcm9ncmFtLnVuc2hpZnRDb250YWluZXIoJ2JvZHknLCBzdGF0ZW1lbnRzKTtcbiAgfSBlbHNlIHtcbiAgICBpbXBvcnRTdGF0ZW1lbnRzW2ltcG9ydFN0YXRlbWVudHMubGVuZ3RoIC0gMV0uaW5zZXJ0QWZ0ZXIoc3RhdGVtZW50cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Q2FsbGVlTmFtZShjYWxsOiBOb2RlUGF0aDx0LkNhbGxFeHByZXNzaW9uPik6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgY2FsbGVlID0gY2FsbC5ub2RlLmNhbGxlZTtcbiAgaWYgKHQuaXNJZGVudGlmaWVyKGNhbGxlZSkpIHtcbiAgICByZXR1cm4gY2FsbGVlLm5hbWU7XG4gIH0gZWxzZSBpZiAodC5pc01lbWJlckV4cHJlc3Npb24oY2FsbGVlKSAmJiB0LmlzSWRlbnRpZmllcihjYWxsZWUucHJvcGVydHkpKSB7XG4gICAgcmV0dXJuIGNhbGxlZS5wcm9wZXJ0eS5uYW1lO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgYWxsIHRoZSBgbm9kZXNgIGFyZSBCYWJlbCBleHByZXNzaW9ucy5cbiAqL1xuZnVuY3Rpb24gaXNFeHByZXNzaW9uQXJyYXkobm9kZXM6IHQuTm9kZVtdKTogbm9kZXMgaXMgdC5FeHByZXNzaW9uW10ge1xuICByZXR1cm4gbm9kZXMuZXZlcnkobm9kZSA9PiB0LmlzRXhwcmVzc2lvbihub2RlKSk7XG59XG5cbi8qKlxuICogQXNzZXJ0IHRoYXQgdGhlIGdpdmVuIGBvYmpgIGlzIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0TnVsbDxUPihvYmo6IFR8bnVsbCk6IGFzc2VydHMgb2JqIGlzIG51bGwge1xuICBpZiAob2JqICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCVUcgLSBleHBlY3RlZCBgb2JqYCB0byBiZSBudWxsJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBc3NlcnQgdGhhdCB0aGUgZ2l2ZW4gYG9iamAgaXMgbm90IGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0Tm90TnVsbDxUPihvYmo6IFR8bnVsbCk6IGFzc2VydHMgb2JqIGlzIFQge1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCVUcgLSBleHBlY3RlZCBgb2JqYCBub3QgdG8gYmUgbnVsbCcpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGFuIGVycm9yIHRoYXQgaW5jbHVkZXMgdGhlIGNvZGUgZnJhbWUgb2YgdGhlIGBub2RlYC5cbiAqL1xuZnVuY3Rpb24gYnVpbGRDb2RlRnJhbWVFcnJvcihmaWxlOiBCYWJlbEZpbGUsIG1lc3NhZ2U6IHN0cmluZywgbm9kZTogdC5Ob2RlKTogc3RyaW5nIHtcbiAgY29uc3QgZmlsZW5hbWUgPSBmaWxlLm9wdHMuZmlsZW5hbWUgfHwgJyh1bmtub3duIGZpbGUpJztcbiAgY29uc3QgZXJyb3IgPSBmaWxlLmJ1aWxkQ29kZUZyYW1lRXJyb3Iobm9kZSwgbWVzc2FnZSk7XG4gIHJldHVybiBgJHtmaWxlbmFtZX06ICR7ZXJyb3IubWVzc2FnZX1gO1xufVxuXG4vKipcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIG1ha2luZyB1cCBmb3IgdGhlIGZhY3QgdGhhdCB0aGUgQmFiZWwgdHlwaW5ncyBmb3IgYE5vZGVQYXRoLmh1Yi5maWxlYCBhcmVcbiAqIGxhY2tpbmcuXG4gKi9cbmludGVyZmFjZSBCYWJlbEZpbGUge1xuICBjb2RlOiBzdHJpbmc7XG4gIG9wdHM6IHtcbiAgICBmaWxlbmFtZT86IHN0cmluZyxcbiAgICBmaWxlbmFtZVJlbGF0aXZlPzogc3RyaW5nLFxuICAgIGN3ZD86IHN0cmluZyxcbiAgfTtcblxuICBidWlsZENvZGVGcmFtZUVycm9yKG5vZGU6IHQuTm9kZSwgbWVzc2FnZTogc3RyaW5nKTogRXJyb3I7XG59XG4iXX0=
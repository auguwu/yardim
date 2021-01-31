(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker/src/file_linker/file_linker", ["require", "exports", "tslib", "@angular/compiler-cli/linker/src/ast/ast_value", "@angular/compiler-cli/linker/src/file_linker/emit_scopes/emit_scope", "@angular/compiler-cli/linker/src/file_linker/emit_scopes/iife_emit_scope", "@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_linker_selector"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileLinker = exports.NO_STATEMENTS = void 0;
    var tslib_1 = require("tslib");
    var ast_value_1 = require("@angular/compiler-cli/linker/src/ast/ast_value");
    var emit_scope_1 = require("@angular/compiler-cli/linker/src/file_linker/emit_scopes/emit_scope");
    var iife_emit_scope_1 = require("@angular/compiler-cli/linker/src/file_linker/emit_scopes/iife_emit_scope");
    var partial_linker_selector_1 = require("@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_linker_selector");
    exports.NO_STATEMENTS = [];
    /**
     * This class is responsible for linking all the partial declarations found in a single file.
     */
    var FileLinker = /** @class */ (function () {
        function FileLinker(linkerEnvironment, sourceUrl, code) {
            this.linkerEnvironment = linkerEnvironment;
            this.emitScopes = new Map();
            this.linkerSelector =
                new partial_linker_selector_1.PartialLinkerSelector(this.linkerEnvironment, sourceUrl, code);
        }
        /**
         * Return true if the given callee name matches a partial declaration that can be linked.
         */
        FileLinker.prototype.isPartialDeclaration = function (calleeName) {
            return this.linkerSelector.supportsDeclaration(calleeName);
        };
        /**
         * Link the metadata extracted from the args of a call to a partial declaration function.
         *
         * The `declarationScope` is used to determine the scope and strategy of emission of the linked
         * definition and any shared constant statements.
         *
         * @param declarationFn the name of the function used to declare the partial declaration - e.g.
         *     `ɵɵngDeclareDirective`.
         * @param args the arguments passed to the declaration function, should be a single object that
         *     corresponds to the `R3DeclareDirectiveMetadata` or `R3DeclareComponentMetadata` interfaces.
         * @param declarationScope the scope that contains this call to the declaration function.
         */
        FileLinker.prototype.linkPartialDeclaration = function (declarationFn, args, declarationScope) {
            if (args.length !== 1) {
                throw new Error("Invalid function call: It should have only a single object literal argument, but contained " + args.length + ".");
            }
            var metaObj = ast_value_1.AstObject.parse(args[0], this.linkerEnvironment.host);
            var ngImport = metaObj.getNode('ngImport');
            var emitScope = this.getEmitScope(ngImport, declarationScope);
            var version = metaObj.getString('version');
            var linker = this.linkerSelector.getLinker(declarationFn, version);
            var definition = linker.linkPartialDeclaration(emitScope.constantPool, metaObj);
            return emitScope.translateDefinition(definition);
        };
        /**
         * Return all the shared constant statements and their associated constant scope references, so
         * that they can be inserted into the source code.
         */
        FileLinker.prototype.getConstantStatements = function () {
            var e_1, _a;
            var results = [];
            try {
                for (var _b = tslib_1.__values(this.emitScopes.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = tslib_1.__read(_c.value, 2), constantScope = _d[0], emitScope = _d[1];
                    var statements = emitScope.getConstantStatements();
                    results.push({ constantScope: constantScope, statements: statements });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return results;
        };
        FileLinker.prototype.getEmitScope = function (ngImport, declarationScope) {
            var constantScope = declarationScope.getConstantScopeRef(ngImport);
            if (constantScope === null) {
                // There is no constant scope so we will emit extra statements into the definition IIFE.
                return new iife_emit_scope_1.IifeEmitScope(ngImport, this.linkerEnvironment.translator, this.linkerEnvironment.factory);
            }
            if (!this.emitScopes.has(constantScope)) {
                this.emitScopes.set(constantScope, new emit_scope_1.EmitScope(ngImport, this.linkerEnvironment.translator));
            }
            return this.emitScopes.get(constantScope);
        };
        return FileLinker;
    }());
    exports.FileLinker = FileLinker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZV9saW5rZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbGlua2VyL3NyYy9maWxlX2xpbmtlci9maWxlX2xpbmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBU0EsNEVBQTJDO0lBRTNDLGtHQUFtRDtJQUNuRCw0R0FBNEQ7SUFFNUQsZ0lBQWdGO0lBRW5FLFFBQUEsYUFBYSxHQUFvQixFQUFXLENBQUM7SUFFMUQ7O09BRUc7SUFDSDtRQUlFLG9CQUNZLGlCQUE2RCxFQUNyRSxTQUF5QixFQUFFLElBQVk7WUFEL0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE0QztZQUhqRSxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQXNELENBQUM7WUFLakYsSUFBSSxDQUFDLGNBQWM7Z0JBQ2YsSUFBSSwrQ0FBcUIsQ0FBMEIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCx5Q0FBb0IsR0FBcEIsVUFBcUIsVUFBa0I7WUFDckMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRDs7Ozs7Ozs7Ozs7V0FXRztRQUNILDJDQUFzQixHQUF0QixVQUNJLGFBQXFCLEVBQUUsSUFBbUIsRUFDMUMsZ0JBQStEO1lBQ2pFLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQ1gsZ0dBQ0ksSUFBSSxDQUFDLE1BQU0sTUFBRyxDQUFDLENBQUM7YUFDekI7WUFFRCxJQUFNLE9BQU8sR0FDVCxxQkFBUyxDQUFDLEtBQUssQ0FBb0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3RixJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFaEUsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckUsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbEYsT0FBTyxTQUFTLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVEOzs7V0FHRztRQUNILDBDQUFxQixHQUFyQjs7WUFDRSxJQUFNLE9BQU8sR0FBZ0UsRUFBRSxDQUFDOztnQkFDaEYsS0FBeUMsSUFBQSxLQUFBLGlCQUFBLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUEsZ0JBQUEsNEJBQUU7b0JBQXpELElBQUEsS0FBQSwyQkFBMEIsRUFBekIsYUFBYSxRQUFBLEVBQUUsU0FBUyxRQUFBO29CQUNsQyxJQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDckQsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFDLGFBQWEsZUFBQSxFQUFFLFVBQVUsWUFBQSxFQUFDLENBQUMsQ0FBQztpQkFDM0M7Ozs7Ozs7OztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7UUFFTyxpQ0FBWSxHQUFwQixVQUNJLFFBQXFCLEVBQUUsZ0JBQStEO1lBRXhGLElBQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JFLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDMUIsd0ZBQXdGO2dCQUN4RixPQUFPLElBQUksK0JBQWEsQ0FDcEIsUUFBUSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ2xGO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FDZixhQUFhLEVBQUUsSUFBSSxzQkFBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUNoRjtZQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFFLENBQUM7UUFDN0MsQ0FBQztRQUNILGlCQUFDO0lBQUQsQ0FBQyxBQWhGRCxJQWdGQztJQWhGWSxnQ0FBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtSM1BhcnRpYWxEZWNsYXJhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aH0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7QXN0T2JqZWN0fSBmcm9tICcuLi9hc3QvYXN0X3ZhbHVlJztcbmltcG9ydCB7RGVjbGFyYXRpb25TY29wZX0gZnJvbSAnLi9kZWNsYXJhdGlvbl9zY29wZSc7XG5pbXBvcnQge0VtaXRTY29wZX0gZnJvbSAnLi9lbWl0X3Njb3Blcy9lbWl0X3Njb3BlJztcbmltcG9ydCB7SWlmZUVtaXRTY29wZX0gZnJvbSAnLi9lbWl0X3Njb3Blcy9paWZlX2VtaXRfc2NvcGUnO1xuaW1wb3J0IHtMaW5rZXJFbnZpcm9ubWVudH0gZnJvbSAnLi9saW5rZXJfZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtQYXJ0aWFsTGlua2VyU2VsZWN0b3J9IGZyb20gJy4vcGFydGlhbF9saW5rZXJzL3BhcnRpYWxfbGlua2VyX3NlbGVjdG9yJztcblxuZXhwb3J0IGNvbnN0IE5PX1NUQVRFTUVOVFM6IFJlYWRvbmx5PGFueVtdPiA9IFtdIGFzIGNvbnN0O1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgcmVzcG9uc2libGUgZm9yIGxpbmtpbmcgYWxsIHRoZSBwYXJ0aWFsIGRlY2xhcmF0aW9ucyBmb3VuZCBpbiBhIHNpbmdsZSBmaWxlLlxuICovXG5leHBvcnQgY2xhc3MgRmlsZUxpbmtlcjxUQ29uc3RhbnRTY29wZSwgVFN0YXRlbWVudCwgVEV4cHJlc3Npb24+IHtcbiAgcHJpdmF0ZSBsaW5rZXJTZWxlY3RvcjogUGFydGlhbExpbmtlclNlbGVjdG9yPFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPjtcbiAgcHJpdmF0ZSBlbWl0U2NvcGVzID0gbmV3IE1hcDxUQ29uc3RhbnRTY29wZSwgRW1pdFNjb3BlPFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgbGlua2VyRW52aXJvbm1lbnQ6IExpbmtlckVudmlyb25tZW50PFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPixcbiAgICAgIHNvdXJjZVVybDogQWJzb2x1dGVGc1BhdGgsIGNvZGU6IHN0cmluZykge1xuICAgIHRoaXMubGlua2VyU2VsZWN0b3IgPVxuICAgICAgICBuZXcgUGFydGlhbExpbmtlclNlbGVjdG9yPFRTdGF0ZW1lbnQsIFRFeHByZXNzaW9uPih0aGlzLmxpbmtlckVudmlyb25tZW50LCBzb3VyY2VVcmwsIGNvZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBjYWxsZWUgbmFtZSBtYXRjaGVzIGEgcGFydGlhbCBkZWNsYXJhdGlvbiB0aGF0IGNhbiBiZSBsaW5rZWQuXG4gICAqL1xuICBpc1BhcnRpYWxEZWNsYXJhdGlvbihjYWxsZWVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5saW5rZXJTZWxlY3Rvci5zdXBwb3J0c0RlY2xhcmF0aW9uKGNhbGxlZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpbmsgdGhlIG1ldGFkYXRhIGV4dHJhY3RlZCBmcm9tIHRoZSBhcmdzIG9mIGEgY2FsbCB0byBhIHBhcnRpYWwgZGVjbGFyYXRpb24gZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoZSBgZGVjbGFyYXRpb25TY29wZWAgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHNjb3BlIGFuZCBzdHJhdGVneSBvZiBlbWlzc2lvbiBvZiB0aGUgbGlua2VkXG4gICAqIGRlZmluaXRpb24gYW5kIGFueSBzaGFyZWQgY29uc3RhbnQgc3RhdGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGRlY2xhcmF0aW9uRm4gdGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gZGVjbGFyZSB0aGUgcGFydGlhbCBkZWNsYXJhdGlvbiAtIGUuZy5cbiAgICogICAgIGDJtcm1bmdEZWNsYXJlRGlyZWN0aXZlYC5cbiAgICogQHBhcmFtIGFyZ3MgdGhlIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIGRlY2xhcmF0aW9uIGZ1bmN0aW9uLCBzaG91bGQgYmUgYSBzaW5nbGUgb2JqZWN0IHRoYXRcbiAgICogICAgIGNvcnJlc3BvbmRzIHRvIHRoZSBgUjNEZWNsYXJlRGlyZWN0aXZlTWV0YWRhdGFgIG9yIGBSM0RlY2xhcmVDb21wb25lbnRNZXRhZGF0YWAgaW50ZXJmYWNlcy5cbiAgICogQHBhcmFtIGRlY2xhcmF0aW9uU2NvcGUgdGhlIHNjb3BlIHRoYXQgY29udGFpbnMgdGhpcyBjYWxsIHRvIHRoZSBkZWNsYXJhdGlvbiBmdW5jdGlvbi5cbiAgICovXG4gIGxpbmtQYXJ0aWFsRGVjbGFyYXRpb24oXG4gICAgICBkZWNsYXJhdGlvbkZuOiBzdHJpbmcsIGFyZ3M6IFRFeHByZXNzaW9uW10sXG4gICAgICBkZWNsYXJhdGlvblNjb3BlOiBEZWNsYXJhdGlvblNjb3BlPFRDb25zdGFudFNjb3BlLCBURXhwcmVzc2lvbj4pOiBURXhwcmVzc2lvbiB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEludmFsaWQgZnVuY3Rpb24gY2FsbDogSXQgc2hvdWxkIGhhdmUgb25seSBhIHNpbmdsZSBvYmplY3QgbGl0ZXJhbCBhcmd1bWVudCwgYnV0IGNvbnRhaW5lZCAke1xuICAgICAgICAgICAgICBhcmdzLmxlbmd0aH0uYCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWV0YU9iaiA9XG4gICAgICAgIEFzdE9iamVjdC5wYXJzZTxSM1BhcnRpYWxEZWNsYXJhdGlvbiwgVEV4cHJlc3Npb24+KGFyZ3NbMF0sIHRoaXMubGlua2VyRW52aXJvbm1lbnQuaG9zdCk7XG4gICAgY29uc3QgbmdJbXBvcnQgPSBtZXRhT2JqLmdldE5vZGUoJ25nSW1wb3J0Jyk7XG4gICAgY29uc3QgZW1pdFNjb3BlID0gdGhpcy5nZXRFbWl0U2NvcGUobmdJbXBvcnQsIGRlY2xhcmF0aW9uU2NvcGUpO1xuXG4gICAgY29uc3QgdmVyc2lvbiA9IG1ldGFPYmouZ2V0U3RyaW5nKCd2ZXJzaW9uJyk7XG4gICAgY29uc3QgbGlua2VyID0gdGhpcy5saW5rZXJTZWxlY3Rvci5nZXRMaW5rZXIoZGVjbGFyYXRpb25GbiwgdmVyc2lvbik7XG4gICAgY29uc3QgZGVmaW5pdGlvbiA9IGxpbmtlci5saW5rUGFydGlhbERlY2xhcmF0aW9uKGVtaXRTY29wZS5jb25zdGFudFBvb2wsIG1ldGFPYmopO1xuXG4gICAgcmV0dXJuIGVtaXRTY29wZS50cmFuc2xhdGVEZWZpbml0aW9uKGRlZmluaXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhbGwgdGhlIHNoYXJlZCBjb25zdGFudCBzdGF0ZW1lbnRzIGFuZCB0aGVpciBhc3NvY2lhdGVkIGNvbnN0YW50IHNjb3BlIHJlZmVyZW5jZXMsIHNvXG4gICAqIHRoYXQgdGhleSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgc291cmNlIGNvZGUuXG4gICAqL1xuICBnZXRDb25zdGFudFN0YXRlbWVudHMoKToge2NvbnN0YW50U2NvcGU6IFRDb25zdGFudFNjb3BlLCBzdGF0ZW1lbnRzOiBUU3RhdGVtZW50W119W10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IHtjb25zdGFudFNjb3BlOiBUQ29uc3RhbnRTY29wZSwgc3RhdGVtZW50czogVFN0YXRlbWVudFtdfVtdID0gW107XG4gICAgZm9yIChjb25zdCBbY29uc3RhbnRTY29wZSwgZW1pdFNjb3BlXSBvZiB0aGlzLmVtaXRTY29wZXMuZW50cmllcygpKSB7XG4gICAgICBjb25zdCBzdGF0ZW1lbnRzID0gZW1pdFNjb3BlLmdldENvbnN0YW50U3RhdGVtZW50cygpO1xuICAgICAgcmVzdWx0cy5wdXNoKHtjb25zdGFudFNjb3BlLCBzdGF0ZW1lbnRzfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFbWl0U2NvcGUoXG4gICAgICBuZ0ltcG9ydDogVEV4cHJlc3Npb24sIGRlY2xhcmF0aW9uU2NvcGU6IERlY2xhcmF0aW9uU2NvcGU8VENvbnN0YW50U2NvcGUsIFRFeHByZXNzaW9uPik6XG4gICAgICBFbWl0U2NvcGU8VFN0YXRlbWVudCwgVEV4cHJlc3Npb24+IHtcbiAgICBjb25zdCBjb25zdGFudFNjb3BlID0gZGVjbGFyYXRpb25TY29wZS5nZXRDb25zdGFudFNjb3BlUmVmKG5nSW1wb3J0KTtcbiAgICBpZiAoY29uc3RhbnRTY29wZSA9PT0gbnVsbCkge1xuICAgICAgLy8gVGhlcmUgaXMgbm8gY29uc3RhbnQgc2NvcGUgc28gd2Ugd2lsbCBlbWl0IGV4dHJhIHN0YXRlbWVudHMgaW50byB0aGUgZGVmaW5pdGlvbiBJSUZFLlxuICAgICAgcmV0dXJuIG5ldyBJaWZlRW1pdFNjb3BlKFxuICAgICAgICAgIG5nSW1wb3J0LCB0aGlzLmxpbmtlckVudmlyb25tZW50LnRyYW5zbGF0b3IsIHRoaXMubGlua2VyRW52aXJvbm1lbnQuZmFjdG9yeSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmVtaXRTY29wZXMuaGFzKGNvbnN0YW50U2NvcGUpKSB7XG4gICAgICB0aGlzLmVtaXRTY29wZXMuc2V0KFxuICAgICAgICAgIGNvbnN0YW50U2NvcGUsIG5ldyBFbWl0U2NvcGUobmdJbXBvcnQsIHRoaXMubGlua2VyRW52aXJvbm1lbnQudHJhbnNsYXRvcikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lbWl0U2NvcGVzLmdldChjb25zdGFudFNjb3BlKSE7XG4gIH1cbn1cbiJdfQ==
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/host/commonjs_umd_utils", ["require", "exports", "typescript", "@angular/compiler-cli/src/ngtsc/util/src/typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skipAliases = exports.isExportsStatement = exports.isExportsAssignment = exports.isExportsDeclaration = exports.isExternalImport = exports.isRequireCall = exports.extractGetterFnExpression = exports.isDefinePropertyReexportStatement = exports.isWildcardReexportStatement = exports.findRequireCallReference = exports.findNamespaceOfIdentifier = void 0;
    var ts = require("typescript");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    /**
     * Return the "namespace" of the specified `ts.Identifier` if the identifier is the RHS of a
     * property access expression, i.e. an expression of the form `<namespace>.<id>` (in which case a
     * `ts.Identifier` corresponding to `<namespace>` will be returned). Otherwise return `null`.
     */
    function findNamespaceOfIdentifier(id) {
        return id.parent && ts.isPropertyAccessExpression(id.parent) && id.parent.name === id &&
            ts.isIdentifier(id.parent.expression) ?
            id.parent.expression :
            null;
    }
    exports.findNamespaceOfIdentifier = findNamespaceOfIdentifier;
    /**
     * Return the `RequireCall` that is used to initialize the specified `ts.Identifier`, if the
     * specified indentifier was indeed initialized with a require call in a declaration of the form:
     * `var <id> = require('...')`
     */
    function findRequireCallReference(id, checker) {
        var _a, _b;
        var symbol = checker.getSymbolAtLocation(id) || null;
        var declaration = (_a = symbol === null || symbol === void 0 ? void 0 : symbol.valueDeclaration) !== null && _a !== void 0 ? _a : (_b = symbol === null || symbol === void 0 ? void 0 : symbol.declarations) === null || _b === void 0 ? void 0 : _b[0];
        var initializer = declaration && ts.isVariableDeclaration(declaration) && declaration.initializer || null;
        return initializer && isRequireCall(initializer) ? initializer : null;
    }
    exports.findRequireCallReference = findRequireCallReference;
    /**
     * Check whether the specified `ts.Statement` is a wildcard re-export statement.
     * I.E. an expression statement of one of the following forms:
     * - `__export(<foo>)`
     * - `__exportStar(<foo>)`
     * - `tslib.__export(<foo>, exports)`
     * - `tslib.__exportStar(<foo>, exports)`
     */
    function isWildcardReexportStatement(stmt) {
        // Ensure it is a call expression statement.
        if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) {
            return false;
        }
        // Get the called function identifier.
        // NOTE: Currently, it seems that `__export()` is used when emitting helpers inline and
        //       `__exportStar()` when importing them
        //       ([source](https://github.com/microsoft/TypeScript/blob/d7c83f023/src/compiler/transformers/module/module.ts#L1796-L1797)).
        //       So, theoretically, we only care about the formats `__export(<foo>)` and
        //       `tslib.__exportStar(<foo>, exports)`.
        //       The current implementation accepts the other two formats (`__exportStar(...)` and
        //       `tslib.__export(...)`) as well to be more future-proof (given that it is unlikely that
        //       they will introduce false positives).
        var fnName = null;
        if (ts.isIdentifier(stmt.expression.expression)) {
            // Statement of the form `someFn(...)`.
            fnName = stmt.expression.expression.text;
        }
        else if (ts.isPropertyAccessExpression(stmt.expression.expression) &&
            ts.isIdentifier(stmt.expression.expression.name)) {
            // Statement of the form `tslib.someFn(...)`.
            fnName = stmt.expression.expression.name.text;
        }
        // Ensure the called function is either `__export()` or `__exportStar()`.
        if ((fnName !== '__export') && (fnName !== '__exportStar')) {
            return false;
        }
        // Ensure there is at least one argument.
        // (The first argument is the exported thing and there will be a second `exports` argument in the
        // case of imported helpers).
        return stmt.expression.arguments.length > 0;
    }
    exports.isWildcardReexportStatement = isWildcardReexportStatement;
    /**
     * Check whether the statement is a re-export of the form:
     *
     * ```
     * Object.defineProperty(exports, "<export-name>",
     *     { enumerable: true, get: function () { return <import-name>; } });
     * ```
     */
    function isDefinePropertyReexportStatement(stmt) {
        if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) {
            return false;
        }
        // Check for Object.defineProperty
        if (!ts.isPropertyAccessExpression(stmt.expression.expression) ||
            !ts.isIdentifier(stmt.expression.expression.expression) ||
            stmt.expression.expression.expression.text !== 'Object' ||
            !ts.isIdentifier(stmt.expression.expression.name) ||
            stmt.expression.expression.name.text !== 'defineProperty') {
            return false;
        }
        var args = stmt.expression.arguments;
        if (args.length !== 3) {
            return false;
        }
        var exportsObject = args[0];
        if (!ts.isIdentifier(exportsObject) || exportsObject.text !== 'exports') {
            return false;
        }
        var propertyKey = args[1];
        if (!ts.isStringLiteral(propertyKey)) {
            return false;
        }
        var propertyDescriptor = args[2];
        if (!ts.isObjectLiteralExpression(propertyDescriptor)) {
            return false;
        }
        return (propertyDescriptor.properties.some(function (prop) { return prop.name !== undefined && ts.isIdentifier(prop.name) && prop.name.text === 'get'; }));
    }
    exports.isDefinePropertyReexportStatement = isDefinePropertyReexportStatement;
    /**
     * Extract the "value" of the getter in a `defineProperty` statement.
     *
     * This will return the `ts.Expression` value of a single `return` statement in the `get` method
     * of the property definition object, or `null` if that is not possible.
     */
    function extractGetterFnExpression(statement) {
        var args = statement.expression.arguments;
        var getterFn = args[2].properties.find(function (prop) { return prop.name !== undefined && ts.isIdentifier(prop.name) && prop.name.text === 'get'; });
        if (getterFn === undefined || !ts.isPropertyAssignment(getterFn) ||
            !ts.isFunctionExpression(getterFn.initializer)) {
            return null;
        }
        var returnStatement = getterFn.initializer.body.statements[0];
        if (!ts.isReturnStatement(returnStatement) || returnStatement.expression === undefined) {
            return null;
        }
        return returnStatement.expression;
    }
    exports.extractGetterFnExpression = extractGetterFnExpression;
    /**
     * Check whether the specified `ts.Node` represents a `require()` call, i.e. an call expression of
     * the form: `require('<foo>')`
     */
    function isRequireCall(node) {
        return ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
            node.expression.text === 'require' && node.arguments.length === 1 &&
            ts.isStringLiteral(node.arguments[0]);
    }
    exports.isRequireCall = isRequireCall;
    /**
     * Check whether the specified `path` is an "external" import.
     * In other words, that it comes from a entry-point outside the current one.
     */
    function isExternalImport(path) {
        return !/^\.\.?(\/|$)/.test(path);
    }
    exports.isExternalImport = isExternalImport;
    /**
     * Check whether the specified `node` is a property access expression of the form
     * `exports.<foo>`.
     */
    function isExportsDeclaration(expr) {
        return expr.parent && isExportsAssignment(expr.parent);
    }
    exports.isExportsDeclaration = isExportsDeclaration;
    /**
     * Check whether the specified `node` is an assignment expression of the form
     * `exports.<foo> = <bar>`.
     */
    function isExportsAssignment(expr) {
        return typescript_1.isAssignment(expr) && ts.isPropertyAccessExpression(expr.left) &&
            ts.isIdentifier(expr.left.expression) && expr.left.expression.text === 'exports' &&
            ts.isIdentifier(expr.left.name);
    }
    exports.isExportsAssignment = isExportsAssignment;
    /**
     * Check whether the specified `stmt` is an expression statement of the form
     * `exports.<foo> = <bar>;`.
     */
    function isExportsStatement(stmt) {
        return ts.isExpressionStatement(stmt) && isExportsAssignment(stmt.expression);
    }
    exports.isExportsStatement = isExportsStatement;
    /**
     * Find the far right hand side of a sequence of aliased assignements of the form
     *
     * ```
     * exports.MyClass = alias1 = alias2 = <<declaration>>
     * ```
     *
     * @param node the expression to parse
     * @returns the original `node` or the far right expression of a series of assignments.
     */
    function skipAliases(node) {
        while (typescript_1.isAssignment(node)) {
            node = node.right;
        }
        return node;
    }
    exports.skipAliases = skipAliases;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uanNfdW1kX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL25nY2Mvc3JjL2hvc3QvY29tbW9uanNfdW1kX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUVqQyxrRkFBb0U7SUFrRHBFOzs7O09BSUc7SUFDSCxTQUFnQix5QkFBeUIsQ0FBQyxFQUFpQjtRQUN6RCxPQUFPLEVBQUUsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxFQUFFO1lBQzdFLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzNDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDO0lBQ1gsQ0FBQztJQUxELDhEQUtDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLHdCQUF3QixDQUFDLEVBQWlCLEVBQUUsT0FBdUI7O1FBRWpGLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDdkQsSUFBTSxXQUFXLFNBQUcsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLGdCQUFnQix5Q0FBSSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsWUFBWSwwQ0FBRyxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFNLFdBQVcsR0FDYixXQUFXLElBQUksRUFBRSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDO1FBQzVGLE9BQU8sV0FBVyxJQUFJLGFBQWEs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LHlCQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDakUsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxTQUFTO1lBQ2hGLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBSkQsa0RBSUM7SUFTRDs7O09BR0c7SUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxJQUFhO1FBQzlDLE9BQU8sRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRkQsZ0RBRUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxTQUFnQixXQUFXLENBQUMsSUFBbUI7UUFDN0MsT0FBTyx5QkFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3pCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQ25CO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBTEQsa0NBS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0RlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQge2lzQXNzaWdubWVudH0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL3V0aWwvc3JjL3R5cGVzY3JpcHQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEV4cG9ydERlY2xhcmF0aW9uIHtcbiAgbmFtZTogc3RyaW5nO1xuICBkZWNsYXJhdGlvbjogRGVjbGFyYXRpb247XG59XG5cbi8qKlxuICogQSBDb21tb25KUyBvciBVTUQgd2lsZGNhcmQgcmUtZXhwb3J0IHN0YXRlbWVudC5cbiAqXG4gKiBUaGUgQ29tbW9uSlMgb3IgVU1EIHZlcnNpb24gb2YgYGV4cG9ydCAqIGZyb20gJ2JsYWgnO2AuXG4gKlxuICogVGhlc2Ugc3RhdGVtZW50cyBjYW4gaGF2ZSBzZXZlcmFsIGZvcm1zIChkZXBlbmRpbmcsIGZvciBleGFtcGxlLCBvbiB3aGV0aGVyXG4gKiB0aGUgVHlwZVNjcmlwdCBoZWxwZXJzIGFyZSBpbXBvcnRlZCBvciBlbWl0dGVkIGlubGluZSkuIFRoZSBleHByZXNzaW9uIGNhbiBoYXZlIG9uZSBvZiB0aGVcbiAqIGZvbGxvd2luZyBmb3JtczpcbiAqIC0gYF9fZXhwb3J0KGZpcnN0QXJnKWBcbiAqIC0gYF9fZXhwb3J0U3RhcihmaXJzdEFyZylgXG4gKiAtIGB0c2xpYi5fX2V4cG9ydChmaXJzdEFyZywgZXhwb3J0cylgXG4gKiAtIGB0c2xpYi5fX2V4cG9ydFN0YXIoZmlyc3RBcmcsIGV4cG9ydHMpYFxuICpcbiAqIEluIGFsbCBjYXNlcywgd2Ugb25seSBjYXJlIGFib3V0IGBmaXJzdEFyZ2AsIHdoaWNoIGlzIHRoZSBmaXJzdCBhcmd1bWVudCBvZiB0aGUgcmUtZXhwb3J0IGNhbGxcbiAqIGV4cHJlc3Npb24gYW5kIGNhbiBiZSBlaXRoZXIgYSBgcmVxdWlyZSgnLi4uJylgIGNhbGwgb3IgYW4gaWRlbnRpZmllciAoaW5pdGlhbGl6ZWQgdmlhIGFcbiAqIGByZXF1aXJlKCcuLi4nKWAgY2FsbCkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2lsZGNhcmRSZWV4cG9ydFN0YXRlbWVudCBleHRlbmRzIHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQge1xuICBleHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbjtcbn1cblxuLyoqXG4gKiBBIENvbW1vbkpTIG9yIFVNRCByZS1leHBvcnQgc3RhdGVtZW50IHVzaW5nIGFuIGBPYmplY3QuZGVmaW5lUHJvcGVydHkoKWAgY2FsbC5cbiAqIEZvciBleGFtcGxlOlxuICpcbiAqIGBgYFxuICogT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiPGV4cG9ydGVkLWlkPlwiLFxuICogICAgIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiA8aW1wb3J0ZWQtaWQ+OyB9IH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmaW5lUHJvcGVydHlSZWV4cG9ydFN0YXRlbWVudCBleHRlbmRzIHRzLkV4cHJlc3Npb25TdGF0ZW1lbnQge1xuICBleHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbiZcbiAgICAgIHthcmd1bWVudHM6IFt0cy5JZGVudGlmaWVyLCB0cy5TdHJpbmdMaXRlcmFsLCB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbl19O1xufVxuXG4vKipcbiAqIEEgY2FsbCBleHByZXNzaW9uIHRoYXQgaGFzIGEgc3RyaW5nIGxpdGVyYWwgZm9yIGl0cyBmaXJzdCBhcmd1bWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXF1aXJlQ2FsbCBleHRlbmRzIHRzLkNhbGxFeHByZXNzaW9uIHtcbiAgYXJndW1lbnRzOiB0cy5DYWxsRXhwcmVzc2lvblsnYXJndW1lbnRzJ10mW3RzLlN0cmluZ0xpdGVyYWxdO1xufVxuXG5cbi8qKlxuICogUmV0dXJuIHRoZSBcIm5hbWVzcGFjZVwiIG9mIHRoZSBzcGVjaWZpZWQgYHRzLklkZW50aWZpZXJgIGlmIHRoZSBpZGVudGlmaWVyIGlzIHRoZSBSSFMgb2YgYVxuICogcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb24sIGkuZS4gYW4gZXhwcmVzc2lvbiBvZiB0aGUgZm9ybSBgPG5hbWVzcGFjZT4uPGlkPmAgKGluIHdoaWNoIGNhc2UgYVxuICogYHRzLklkZW50aWZpZXJgIGNvcnJlc3BvbmRpbmcgdG8gYDxuYW1lc3BhY2U+YCB3aWxsIGJlIHJldHVybmVkKS4gT3RoZXJ3aXNlIHJldHVybiBgbnVsbGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTmFtZXNwYWNlT2ZJZGVudGlmaWVyKGlkOiB0cy5JZGVudGlmaWVyKTogdHMuSWRlbnRpZmllcnxudWxsIHtcbiAgcmV0dXJuIGlkLnBhcmVudCAmJiB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihpZC5wYXJlbnQpICYmIGlkLnBhcmVudC5uYW1lID09PSBpZCAmJlxuICAgICAgICAgIHRzLmlzSWRlbnRpZmllcihpZC5wYXJlbnQuZXhwcmVzc2lvbikgP1xuICAgICAgaWQucGFyZW50LmV4cHJlc3Npb24gOlxuICAgICAgbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGBSZXF1aXJlQ2FsbGAgdGhhdCBpcyB1c2VkIHRvIGluaXRpYWxpemUgdGhlIHNwZWNpZmllZCBgdHMuSWRlbnRpZmllcmAsIGlmIHRoZVxuICogc3BlY2lmaWVkIGluZGVudGlmaWVyIHdhcyBpbmRlZWQgaW5pdGlhbGl6ZWQgd2l0aCBhIHJlcXVpcmUgY2FsbCBpbiBhIGRlY2xhcmF0aW9uIG9mIHRoZSBmb3JtOlxuICogYHZhciA8aWQ+ID0gcmVxdWlyZSgnLi4uJylgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUmVxdWlyZUNhbGxSZWZlcmVuY2UoaWQ6IHRzLklkZW50aWZpZXIsIGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogUmVxdWlyZUNhbGx8XG4gICAgbnVsbCB7XG4gIGNvbnN0IHN5bWJvbCA9IGNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihpZCkgfHwgbnVsbDtcbiAgY29uc3QgZGVjbGFyYXRpb24gPSBzeW1ib2w/LnZhbHVlRGVjbGFyYXRpb24gPz8gc3ltYm9sPy5kZWNsYXJhdGlvbnM/LlswXTtcbiAgY29uc3QgaW5pdGlhbGl6ZXIgPVxuICAgICAgZGVjbGFyYXRpb24gJiYgdHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9uKSAmJiBkZWNsYXJhdGlvbi5pbml0aWFsaXplciB8fCBudWxsO1xuICByZXR1cm4gaW5pdGlhbGl6ZXIgJiYgaXNSZXF1aXJlQ2FsbChpbml0aWFsaXplcikgPyBpbml0aWFsaXplciA6IG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgc3BlY2lmaWVkIGB0cy5TdGF0ZW1lbnRgIGlzIGEgd2lsZGNhcmQgcmUtZXhwb3J0IHN0YXRlbWVudC5cbiAqIEkuRS4gYW4gZXhwcmVzc2lvbiBzdGF0ZW1lbnQgb2Ygb25lIG9mIHRoZSBmb2xsb3dpbmcgZm9ybXM6XG4gKiAtIGBfX2V4cG9ydCg8Zm9vPilgXG4gKiAtIGBfX2V4cG9ydFN0YXIoPGZvbz4pYFxuICogLSBgdHNsaWIuX19leHBvcnQoPGZvbz4sIGV4cG9ydHMpYFxuICogLSBgdHNsaWIuX19leHBvcnRTdGFyKDxmb28+LCBleHBvcnRzKWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzV2lsZGNhcmRSZWV4cG9ydFN0YXRlbWVudChzdG10OiB0cy5TdGF0ZW1lbnQpOiBzdG10IGlzIFdpbGRjYXJkUmVleHBvcnRTdGF0ZW1lbnQge1xuICAvLyBFbnN1cmUgaXQgaXMgYSBjYWxsIGV4cHJlc3Npb24gc3RhdGVtZW50LlxuICBpZiAoIXRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChzdG10KSB8fCAhdHMuaXNDYWxsRXhwcmVzc2lvbihzdG10LmV4cHJlc3Npb24pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBjYWxsZWQgZnVuY3Rpb24gaWRlbnRpZmllci5cbiAgLy8gTk9URTogQ3VycmVudGx5LCBpdCBzZWVtcyB0aGF0IGBfX2V4cG9ydCgpYCBpcyB1c2VkIHdoZW4gZW1pdHRpbmcgaGVscGVycyBpbmxpbmUgYW5kXG4gIC8vICAgICAgIGBfX2V4cG9ydFN0YXIoKWAgd2hlbiBpbXBvcnRpbmcgdGhlbVxuICAvLyAgICAgICAoW3NvdXJjZV0oaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2Jsb2IvZDdjODNmMDIzL3NyYy9jb21waWxlci90cmFuc2Zvcm1lcnMvbW9kdWxlL21vZHVsZS50cyNMMTc5Ni1MMTc5NykpLlxuICAvLyAgICAgICBTbywgdGhlb3JldGljYWxseSwgd2Ugb25seSBjYXJlIGFib3V0IHRoZSBmb3JtYXRzIGBfX2V4cG9ydCg8Zm9vPilgIGFuZFxuICAvLyAgICAgICBgdHNsaWIuX19leHBvcnRTdGFyKDxmb28+LCBleHBvcnRzKWAuXG4gIC8vICAgICAgIFRoZSBjdXJyZW50IGltcGxlbWVudGF0aW9uIGFjY2VwdHMgdGhlIG90aGVyIHR3byBmb3JtYXRzIChgX19leHBvcnRTdGFyKC4uLilgIGFuZFxuICAvLyAgICAgICBgdHNsaWIuX19leHBvcnQoLi4uKWApIGFzIHdlbGwgdG8gYmUgbW9yZSBmdXR1cmUtcHJvb2YgKGdpdmVuIHRoYXQgaXQgaXMgdW5saWtlbHkgdGhhdFxuICAvLyAgICAgICB0aGV5IHdpbGwgaW50cm9kdWNlIGZhbHNlIHBvc2l0aXZlcykuXG4gIGxldCBmbk5hbWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHRzLmlzSWRlbnRpZmllcihzdG10LmV4cHJlc3Npb24uZXhwcmVzc2lvbikpIHtcbiAgICAvLyBTdGF0ZW1lbnQgb2YgdGhlIGZvcm0gYHNvbWVGbiguLi4pYC5cbiAgICBmbk5hbWUgPSBzdG10LmV4cHJlc3Npb24uZXhwcmVzc2lvbi50ZXh0O1xuICB9IGVsc2UgaWYgKFxuICAgICAgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24oc3RtdC5leHByZXNzaW9uLmV4cHJlc3Npb24pICYmXG4gICAgICB0cy5pc0lkZW50aWZpZXIoc3RtdC5leHByZXNzaW9uLmV4cHJlc3Npb24ubmFtZSkpIHtcbiAgICAvLyBTdGF0ZW1lbnQgb2YgdGhlIGZvcm0gYHRzbGliLnNvbWVGbiguLi4pYC5cbiAgICBmbk5hbWUgPSBzdG10LmV4cHJlc3Npb24uZXhwcmVzc2lvbi5uYW1lLnRleHQ7XG4gIH1cblxuICAvLyBFbnN1cmUgdGhlIGNhbGxlZCBmdW5jdGlvbiBpcyBlaXRoZXIgYF9fZXhwb3J0KClgIG9yIGBfX2V4cG9ydFN0YXIoKWAuXG4gIGlmICgoZm5OYW1lICE9PSAnX19leHBvcnQnKSAmJiAoZm5OYW1lICE9PSAnX19leHBvcnRTdGFyJykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBFbnN1cmUgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIGFyZ3VtZW50LlxuICAvLyAoVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHRoZSBleHBvcnRlZCB0aGluZyBhbmQgdGhlcmUgd2lsbCBiZSBhIHNlY29uZCBgZXhwb3J0c2AgYXJndW1lbnQgaW4gdGhlXG4gIC8vIGNhc2Ugb2YgaW1wb3J0ZWQgaGVscGVycykuXG4gIHJldHVybiBzdG10LmV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDA7XG59XG5cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBzdGF0ZW1lbnQgaXMgYSByZS1leHBvcnQgb2YgdGhlIGZvcm06XG4gKlxuICogYGBgXG4gKiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCI8ZXhwb3J0LW5hbWU+XCIsXG4gKiAgICAgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDxpbXBvcnQtbmFtZT47IH0gfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmaW5lUHJvcGVydHlSZWV4cG9ydFN0YXRlbWVudChzdG10OiB0cy5TdGF0ZW1lbnQpOlxuICAgIHN0bXQgaXMgRGVmaW5lUHJvcGVydHlSZWV4cG9ydFN0YXRlbWVudCB7XG4gIGlmICghdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KHN0bXQpIHx8ICF0cy5pc0NhbGxFeHByZXNzaW9uKHN0bXQuZXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gIGlmICghdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24oc3RtdC5leHByZXNzaW9uLmV4cHJlc3Npb24pIHx8XG4gICAgICAhdHMuaXNJZGVudGlmaWVyKHN0bXQuZXhwcmVzc2lvbi5leHByZXNzaW9uLmV4cHJlc3Npb24pIHx8XG4gICAgICBzdG10LmV4cHJlc3Npb24uZXhwcmVzc2lvbi5leHByZXNzaW9uLnRleHQgIT09ICdPYmplY3QnIHx8XG4gICAgICAhdHMuaXNJZGVudGlmaWVyKHN0bXQuZXhwcmVzc2lvbi5leHByZXNzaW9uLm5hbWUpIHx8XG4gICAgICBzdG10LmV4cHJlc3Npb24uZXhwcmVzc2lvbi5uYW1lLnRleHQgIT09ICdkZWZpbmVQcm9wZXJ0eScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBhcmdzID0gc3RtdC5leHByZXNzaW9uLmFyZ3VtZW50cztcbiAgaWYgKGFyZ3MubGVuZ3RoICE9PSAzKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGV4cG9ydHNPYmplY3QgPSBhcmdzWzBdO1xuICBpZiAoIXRzLmlzSWRlbnRpZmllcihleHBvcnRzT2JqZWN0KSB8fCBleHBvcnRzT2JqZWN0LnRleHQgIT09ICdleHBvcnRzJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHByb3BlcnR5S2V5ID0gYXJnc1sxXTtcbiAgaWYgKCF0cy5pc1N0cmluZ0xpdGVyYWwocHJvcGVydHlLZXkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgcHJvcGVydHlEZXNjcmlwdG9yID0gYXJnc1syXTtcbiAgaWYgKCF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKHByb3BlcnR5RGVzY3JpcHRvcikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gKHByb3BlcnR5RGVzY3JpcHRvci5wcm9wZXJ0aWVzLnNvbWUoXG4gICAgICBwcm9wID0+IHByb3AubmFtZSAhPT0gdW5kZWZpbmVkICYmIHRzLmlzSWRlbnRpZmllcihwcm9wLm5hbWUpICYmIHByb3AubmFtZS50ZXh0ID09PSAnZ2V0JykpO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgdGhlIFwidmFsdWVcIiBvZiB0aGUgZ2V0dGVyIGluIGEgYGRlZmluZVByb3BlcnR5YCBzdGF0ZW1lbnQuXG4gKlxuICogVGhpcyB3aWxsIHJldHVybiB0aGUgYHRzLkV4cHJlc3Npb25gIHZhbHVlIG9mIGEgc2luZ2xlIGByZXR1cm5gIHN0YXRlbWVudCBpbiB0aGUgYGdldGAgbWV0aG9kXG4gKiBvZiB0aGUgcHJvcGVydHkgZGVmaW5pdGlvbiBvYmplY3QsIG9yIGBudWxsYCBpZiB0aGF0IGlzIG5vdCBwb3NzaWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RHZXR0ZXJGbkV4cHJlc3Npb24oc3RhdGVtZW50OiBEZWZpbmVQcm9wZXJ0eVJlZXhwb3J0U3RhdGVtZW50KTpcbiAgICB0cy5FeHByZXNzaW9ufG51bGwge1xuICBjb25zdCBhcmdzID0gc3RhdGVtZW50LmV4cHJlc3Npb24uYXJndW1lbnRzO1xuICBjb25zdCBnZXR0ZXJGbiA9IGFyZ3NbMl0ucHJvcGVydGllcy5maW5kKFxuICAgICAgcHJvcCA9PiBwcm9wLm5hbWUgIT09IHVuZGVmaW5lZCAmJiB0cy5pc0lkZW50aWZpZXIocHJvcC5uYW1lKSAmJiBwcm9wLm5hbWUudGV4dCA9PT0gJ2dldCcpO1xuICBpZiAoZ2V0dGVyRm4gPT09IHVuZGVmaW5lZCB8fCAhdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQoZ2V0dGVyRm4pIHx8XG4gICAgICAhdHMuaXNGdW5jdGlvbkV4cHJlc3Npb24oZ2V0dGVyRm4uaW5pdGlhbGl6ZXIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgcmV0dXJuU3RhdGVtZW50ID0gZ2V0dGVyRm4uaW5pdGlhbGl6ZXIuYm9keS5zdGF0ZW1lbnRzWzBdO1xuICBpZiAoIXRzLmlzUmV0dXJuU3RhdGVtZW50KHJldHVyblN0YXRlbWVudCkgfHwgcmV0dXJuU3RhdGVtZW50LmV4cHJlc3Npb24gPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiByZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbjtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgYHRzLk5vZGVgIHJlcHJlc2VudHMgYSBgcmVxdWlyZSgpYCBjYWxsLCBpLmUuIGFuIGNhbGwgZXhwcmVzc2lvbiBvZlxuICogdGhlIGZvcm06IGByZXF1aXJlKCc8Zm9vPicpYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZXF1aXJlQ2FsbChub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyBSZXF1aXJlQ2FsbCB7XG4gIHJldHVybiB0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICBub2RlLmV4cHJlc3Npb24udGV4dCA9PT0gJ3JlcXVpcmUnICYmIG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgdHMuaXNTdHJpbmdMaXRlcmFsKG5vZGUuYXJndW1lbnRzWzBdKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgYHBhdGhgIGlzIGFuIFwiZXh0ZXJuYWxcIiBpbXBvcnQuXG4gKiBJbiBvdGhlciB3b3JkcywgdGhhdCBpdCBjb21lcyBmcm9tIGEgZW50cnktcG9pbnQgb3V0c2lkZSB0aGUgY3VycmVudCBvbmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0V4dGVybmFsSW1wb3J0KHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gIS9eXFwuXFwuPyhcXC98JCkvLnRlc3QocGF0aCk7XG59XG5cbi8qKlxuICogQSBVTUQvQ29tbW9uSlMgc3R5bGUgZXhwb3J0IGRlY2xhcmF0aW9uIG9mIHRoZSBmb3JtIGBleHBvcnRzLjxuYW1lPmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhwb3J0c0RlY2xhcmF0aW9uIGV4dGVuZHMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uIHtcbiAgbmFtZTogdHMuSWRlbnRpZmllcjtcbiAgZXhwcmVzc2lvbjogdHMuSWRlbnRpZmllcjtcbiAgcGFyZW50OiBFeHBvcnRzQXNzaWdubWVudDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgYG5vZGVgIGlzIGEgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb24gb2YgdGhlIGZvcm1cbiAqIGBleHBvcnRzLjxmb28+YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRXhwb3J0c0RlY2xhcmF0aW9uKGV4cHI6IHRzLk5vZGUpOiBleHByIGlzIEV4cG9ydHNEZWNsYXJhdGlvbiB7XG4gIHJldHVybiBleHByLnBhcmVudCAmJiBpc0V4cG9ydHNBc3NpZ25tZW50KGV4cHIucGFyZW50KTtcbn1cblxuLyoqXG4gKiBBIFVNRC9Db21tb25KUyBzdHlsZSBleHBvcnQgYXNzaWdubWVudCBvZiB0aGUgZm9ybSBgZXhwb3J0cy48Zm9vPiA9IDxiYXI+YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeHBvcnRzQXNzaWdubWVudCBleHRlbmRzIHRzLkJpbmFyeUV4cHJlc3Npb24ge1xuICBsZWZ0OiBFeHBvcnRzRGVjbGFyYXRpb247XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgc3BlY2lmaWVkIGBub2RlYCBpcyBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24gb2YgdGhlIGZvcm1cbiAqIGBleHBvcnRzLjxmb28+ID0gPGJhcj5gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFeHBvcnRzQXNzaWdubWVudChleHByOiB0cy5Ob2RlKTogZXhwciBpcyBFeHBvcnRzQXNzaWdubWVudCB7XG4gIHJldHVybiBpc0Fzc2lnbm1lbnQoZXhwcikgJiYgdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24oZXhwci5sZWZ0KSAmJlxuICAgICAgdHMuaXNJZGVudGlmaWVyKGV4cHIubGVmdC5leHByZXNzaW9uKSAmJiBleHByLmxlZnQuZXhwcmVzc2lvbi50ZXh0ID09PSAnZXhwb3J0cycgJiZcbiAgICAgIHRzLmlzSWRlbnRpZmllcihleHByLmxlZnQubmFtZSk7XG59XG5cbi8qKlxuICogQW4gZXhwcmVzc2lvbiBzdGF0ZW1lbnQgb2YgdGhlIGZvcm0gYGV4cG9ydHMuPGZvbz4gPSA8YmFyPjtgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4cG9ydHNTdGF0ZW1lbnQgZXh0ZW5kcyB0cy5FeHByZXNzaW9uU3RhdGVtZW50IHtcbiAgZXhwcmVzc2lvbjogRXhwb3J0c0Fzc2lnbm1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgc3BlY2lmaWVkIGBzdG10YCBpcyBhbiBleHByZXNzaW9uIHN0YXRlbWVudCBvZiB0aGUgZm9ybVxuICogYGV4cG9ydHMuPGZvbz4gPSA8YmFyPjtgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFeHBvcnRzU3RhdGVtZW50KHN0bXQ6IHRzLk5vZGUpOiBzdG10IGlzIEV4cG9ydHNTdGF0ZW1lbnQge1xuICByZXR1cm4gdHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KHN0bXQpICYmIGlzRXhwb3J0c0Fzc2lnbm1lbnQoc3RtdC5leHByZXNzaW9uKTtcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBmYXIgcmlnaHQgaGFuZCBzaWRlIG9mIGEgc2VxdWVuY2Ugb2YgYWxpYXNlZCBhc3NpZ25lbWVudHMgb2YgdGhlIGZvcm1cbiAqXG4gKiBgYGBcbiAqIGV4cG9ydHMuTXlDbGFzcyA9IGFsaWFzMSA9IGFsaWFzMiA9IDw8ZGVjbGFyYXRpb24+PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG5vZGUgdGhlIGV4cHJlc3Npb24gdG8gcGFyc2VcbiAqIEByZXR1cm5zIHRoZSBvcmlnaW5hbCBgbm9kZWAgb3IgdGhlIGZhciByaWdodCBleHByZXNzaW9uIG9mIGEgc2VyaWVzIG9mIGFzc2lnbm1lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2tpcEFsaWFzZXMobm9kZTogdHMuRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb24ge1xuICB3aGlsZSAoaXNBc3NpZ25tZW50KG5vZGUpKSB7XG4gICAgbm9kZSA9IG5vZGUucmlnaHQ7XG4gIH1cbiAgcmV0dXJuIG5vZGU7XG59XG4iXX0=
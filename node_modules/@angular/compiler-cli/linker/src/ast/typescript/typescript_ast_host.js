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
        define("@angular/compiler-cli/linker/src/ast/typescript/typescript_ast_host", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/linker/src/fatal_linker_error", "@angular/compiler-cli/linker/src/ast/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeScriptAstHost = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var fatal_linker_error_1 = require("@angular/compiler-cli/linker/src/fatal_linker_error");
    var utils_1 = require("@angular/compiler-cli/linker/src/ast/utils");
    /**
     * This implementation of `AstHost` is able to get information from TypeScript AST nodes.
     *
     * This host is not actually used at runtime in the current code.
     *
     * It is implemented here to ensure that the `AstHost` abstraction is not unfairly skewed towards
     * the Babel implementation. It could also provide a basis for a 3rd TypeScript compiler plugin to
     * do linking in the future.
     */
    var TypeScriptAstHost = /** @class */ (function () {
        function TypeScriptAstHost() {
            this.isStringLiteral = ts.isStringLiteral;
            this.isNumericLiteral = ts.isNumericLiteral;
            this.isArrayLiteral = ts.isArrayLiteralExpression;
            this.isObjectLiteral = ts.isObjectLiteralExpression;
            this.isCallExpression = ts.isCallExpression;
        }
        TypeScriptAstHost.prototype.getSymbolName = function (node) {
            if (ts.isIdentifier(node)) {
                return node.text;
            }
            else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
                return node.name.text;
            }
            else {
                return null;
            }
        };
        TypeScriptAstHost.prototype.parseStringLiteral = function (str) {
            utils_1.assert(str, this.isStringLiteral, 'a string literal');
            return str.text;
        };
        TypeScriptAstHost.prototype.parseNumericLiteral = function (num) {
            utils_1.assert(num, this.isNumericLiteral, 'a numeric literal');
            return parseInt(num.text);
        };
        TypeScriptAstHost.prototype.isBooleanLiteral = function (node) {
            return node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword;
        };
        TypeScriptAstHost.prototype.parseBooleanLiteral = function (bool) {
            utils_1.assert(bool, this.isBooleanLiteral, 'a boolean literal');
            return bool.kind === ts.SyntaxKind.TrueKeyword;
        };
        TypeScriptAstHost.prototype.parseArrayLiteral = function (array) {
            utils_1.assert(array, this.isArrayLiteral, 'an array literal');
            return array.elements.map(function (element) {
                utils_1.assert(element, isNotEmptyElement, 'element in array not to be empty');
                utils_1.assert(element, isNotSpreadElement, 'element in array not to use spread syntax');
                return element;
            });
        };
        TypeScriptAstHost.prototype.parseObjectLiteral = function (obj) {
            var e_1, _a;
            utils_1.assert(obj, this.isObjectLiteral, 'an object literal');
            var result = new Map();
            try {
                for (var _b = tslib_1.__values(obj.properties), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var property = _c.value;
                    utils_1.assert(property, ts.isPropertyAssignment, 'a property assignment');
                    utils_1.assert(property.name, isPropertyName, 'a property name');
                    result.set(property.name.text, property.initializer);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        };
        TypeScriptAstHost.prototype.isFunctionExpression = function (node) {
            return ts.isFunctionExpression(node) || ts.isArrowFunction(node);
        };
        TypeScriptAstHost.prototype.parseReturnValue = function (fn) {
            utils_1.assert(fn, this.isFunctionExpression, 'a function');
            if (!ts.isBlock(fn.body)) {
                // it is a simple array function expression: `(...) => expr`
                return fn.body;
            }
            // it is a function (arrow or normal) with a body. E.g.:
            // * `(...) => { stmt; ... }`
            // * `function(...) { stmt; ... }`
            if (fn.body.statements.length !== 1) {
                throw new fatal_linker_error_1.FatalLinkerError(fn.body, 'Unsupported syntax, expected a function body with a single return statement.');
            }
            var stmt = fn.body.statements[0];
            utils_1.assert(stmt, ts.isReturnStatement, 'a function body with a single return statement');
            if (stmt.expression === undefined) {
                throw new fatal_linker_error_1.FatalLinkerError(stmt, 'Unsupported syntax, expected function to return a value.');
            }
            return stmt.expression;
        };
        TypeScriptAstHost.prototype.parseCallee = function (call) {
            utils_1.assert(call, ts.isCallExpression, 'a call expression');
            return call.expression;
        };
        TypeScriptAstHost.prototype.parseArguments = function (call) {
            utils_1.assert(call, ts.isCallExpression, 'a call expression');
            return call.arguments.map(function (arg) {
                utils_1.assert(arg, isNotSpreadElement, 'argument not to use spread syntax');
                return arg;
            });
        };
        TypeScriptAstHost.prototype.getRange = function (node) {
            var file = node.getSourceFile();
            if (file === undefined) {
                throw new fatal_linker_error_1.FatalLinkerError(node, 'Unable to read range for node - it is missing parent information.');
            }
            var startPos = node.getStart();
            var endPos = node.getEnd();
            var _a = ts.getLineAndCharacterOfPosition(file, startPos), startLine = _a.line, startCol = _a.character;
            return { startLine: startLine, startCol: startCol, startPos: startPos, endPos: endPos };
        };
        return TypeScriptAstHost;
    }());
    exports.TypeScriptAstHost = TypeScriptAstHost;
    /**
     * Return true if the expression does not represent an empty element in an array literal.
     * For example in `[,foo]` the first element is "empty".
     */
    function isNotEmptyElement(e) {
        return !ts.isOmittedExpression(e);
    }
    /**
     * Return true if the expression is not a spread element of an array literal.
     * For example in `[x, ...rest]` the `...rest` expression is a spread element.
     */
    function isNotSpreadElement(e) {
        return !ts.isSpreadElement(e);
    }
    /**
     * Return true if the expression can be considered a text based property name.
     */
    function isPropertyName(e) {
        return ts.isIdentifier(e) || ts.isStringLiteral(e) || ts.isNumericLiteral(e);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF9hc3RfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9saW5rZXIvc3JjL2FzdC90eXBlc2NyaXB0L3R5cGVzY3JpcHRfYXN0X2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILCtCQUFpQztJQUVqQywwRkFBMEQ7SUFFMUQsb0VBQWdDO0lBR2hDOzs7Ozs7OztPQVFHO0lBQ0g7UUFBQTtZQVdFLG9CQUFlLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQztZQU9yQyxxQkFBZ0IsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7WUFnQnZDLG1CQUFjLEdBQUcsRUFBRSxDQUFDLHdCQUF3QixDQUFDO1lBVzdDLG9CQUFlLEdBQUcsRUFBRSxDQUFDLHlCQUF5QixDQUFDO1lBMEMvQyxxQkFBZ0IsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7UUEwQnpDLENBQUM7UUFoSEMseUNBQWEsR0FBYixVQUFjLElBQW1CO1lBQy9CLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2xCO2lCQUFNLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1RSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDO2FBQ2I7UUFDSCxDQUFDO1FBSUQsOENBQWtCLEdBQWxCLFVBQW1CLEdBQWtCO1lBQ25DLGNBQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sR0FB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Q0FBQztZQUN2QixJQUFBLEtBQXlDLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQWxGLFNBQVMsVUFBQSxFQUFhLFFBQVEsZUFBb0QsQ0FBQztZQUNoRyxPQUFPLEVBQUMsU0FBUyxXQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0gsd0JBQUM7SUFBRCxDQUFDLEFBakhELElBaUhDO0lBakhZLDhDQUFpQjtJQW1IOUI7OztPQUdHO0lBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxDQUNvQjtRQUM3QyxPQUFPLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGtCQUFrQixDQUFDLENBQWlDO1FBQzNELE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsY0FBYyxDQUFDLENBQWtCO1FBQ3hDLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0ZhdGFsTGlua2VyRXJyb3J9IGZyb20gJy4uLy4uL2ZhdGFsX2xpbmtlcl9lcnJvcic7XG5pbXBvcnQge0FzdEhvc3QsIFJhbmdlfSBmcm9tICcuLi9hc3RfaG9zdCc7XG5pbXBvcnQge2Fzc2VydH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5cbi8qKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBvZiBgQXN0SG9zdGAgaXMgYWJsZSB0byBnZXQgaW5mb3JtYXRpb24gZnJvbSBUeXBlU2NyaXB0IEFTVCBub2Rlcy5cbiAqXG4gKiBUaGlzIGhvc3QgaXMgbm90IGFjdHVhbGx5IHVzZWQgYXQgcnVudGltZSBpbiB0aGUgY3VycmVudCBjb2RlLlxuICpcbiAqIEl0IGlzIGltcGxlbWVudGVkIGhlcmUgdG8gZW5zdXJlIHRoYXQgdGhlIGBBc3RIb3N0YCBhYnN0cmFjdGlvbiBpcyBub3QgdW5mYWlybHkgc2tld2VkIHRvd2FyZHNcbiAqIHRoZSBCYWJlbCBpbXBsZW1lbnRhdGlvbi4gSXQgY291bGQgYWxzbyBwcm92aWRlIGEgYmFzaXMgZm9yIGEgM3JkIFR5cGVTY3JpcHQgY29tcGlsZXIgcGx1Z2luIHRvXG4gKiBkbyBsaW5raW5nIGluIHRoZSBmdXR1cmUuXG4gKi9cbmV4cG9ydCBjbGFzcyBUeXBlU2NyaXB0QXN0SG9zdCBpbXBsZW1lbnRzIEFzdEhvc3Q8dHMuRXhwcmVzc2lvbj4ge1xuICBnZXRTeW1ib2xOYW1lKG5vZGU6IHRzLkV4cHJlc3Npb24pOiBzdHJpbmd8bnVsbCB7XG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGUudGV4dDtcbiAgICB9IGVsc2UgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpKSB7XG4gICAgICByZXR1cm4gbm9kZS5uYW1lLnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGlzU3RyaW5nTGl0ZXJhbCA9IHRzLmlzU3RyaW5nTGl0ZXJhbDtcblxuICBwYXJzZVN0cmluZ0xpdGVyYWwoc3RyOiB0cy5FeHByZXNzaW9uKTogc3RyaW5nIHtcbiAgICBhc3NlcnQoc3RyLCB0aGlzLmlzU3RyaW5nTGl0ZXJhbCwgJ2Egc3RyaW5nIGxpdGVyYWwnKTtcbiAgICByZXR1cm4gc3RyLnRleHQ7XG4gIH1cblxuICBpc051bWVyaWNMaXRlcmFsID0gdHMuaXNOdW1lcmljTGl0ZXJhbDtcblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKG51bTogdHMuRXhwcmVzc2lvbik6IG51bWJlciB7XG4gICAgYXNzZXJ0KG51bSwgdGhpcy5pc051bWVyaWNMaXRlcmFsLCAnYSBudW1lcmljIGxpdGVyYWwnKTtcbiAgICByZXR1cm4gcGFyc2VJbnQobnVtLnRleHQpO1xuICB9XG5cbiAgaXNCb29sZWFuTGl0ZXJhbChub2RlOiB0cy5FeHByZXNzaW9uKTogbm9kZSBpcyB0cy5GYWxzZUxpdGVyYWx8dHMuVHJ1ZUxpdGVyYWwge1xuICAgIHJldHVybiBub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQgfHwgbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZDtcbiAgfVxuXG4gIHBhcnNlQm9vbGVhbkxpdGVyYWwoYm9vbDogdHMuRXhwcmVzc2lvbik6IGJvb2xlYW4ge1xuICAgIGFzc2VydChib29sLCB0aGlzLmlzQm9vbGVhbkxpdGVyYWwsICdhIGJvb2xlYW4gbGl0ZXJhbCcpO1xuICAgIHJldHVybiBib29sLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQ7XG4gIH1cblxuICBpc0FycmF5TGl0ZXJhbCA9IHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbjtcblxuICBwYXJzZUFycmF5TGl0ZXJhbChhcnJheTogdHMuRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb25bXSB7XG4gICAgYXNzZXJ0KGFycmF5LCB0aGlzLmlzQXJyYXlMaXRlcmFsLCAnYW4gYXJyYXkgbGl0ZXJhbCcpO1xuICAgIHJldHVybiBhcnJheS5lbGVtZW50cy5tYXAoZWxlbWVudCA9PiB7XG4gICAgICBhc3NlcnQoZWxlbWVudCwgaXNOb3RFbXB0eUVsZW1lbnQsICdlbGVtZW50IGluIGFycmF5IG5vdCB0byBiZSBlbXB0eScpO1xuICAgICAgYXNzZXJ0KGVsZW1lbnQsIGlzTm90U3ByZWFkRWxlbWVudCwgJ2VsZW1lbnQgaW4gYXJyYXkgbm90IHRvIHVzZSBzcHJlYWQgc3ludGF4Jyk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9KTtcbiAgfVxuXG4gIGlzT2JqZWN0TGl0ZXJhbCA9IHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG5cbiAgcGFyc2VPYmplY3RMaXRlcmFsKG9iajogdHMuRXhwcmVzc2lvbik6IE1hcDxzdHJpbmcsIHRzLkV4cHJlc3Npb24+IHtcbiAgICBhc3NlcnQob2JqLCB0aGlzLmlzT2JqZWN0TGl0ZXJhbCwgJ2FuIG9iamVjdCBsaXRlcmFsJyk7XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgdHMuRXhwcmVzc2lvbj4oKTtcbiAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIG9iai5wcm9wZXJ0aWVzKSB7XG4gICAgICBhc3NlcnQocHJvcGVydHksIHRzLmlzUHJvcGVydHlBc3NpZ25tZW50LCAnYSBwcm9wZXJ0eSBhc3NpZ25tZW50Jyk7XG4gICAgICBhc3NlcnQocHJvcGVydHkubmFtZSwgaXNQcm9wZXJ0eU5hbWUsICdhIHByb3BlcnR5IG5hbWUnKTtcbiAgICAgIHJlc3VsdC5zZXQocHJvcGVydHkubmFtZS50ZXh0LCBwcm9wZXJ0eS5pbml0aWFsaXplcik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpc0Z1bmN0aW9uRXhwcmVzc2lvbihub2RlOiB0cy5FeHByZXNzaW9uKTogbm9kZSBpcyB0cy5GdW5jdGlvbkV4cHJlc3Npb258dHMuQXJyb3dGdW5jdGlvbiB7XG4gICAgcmV0dXJuIHRzLmlzRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpIHx8IHRzLmlzQXJyb3dGdW5jdGlvbihub2RlKTtcbiAgfVxuXG4gIHBhcnNlUmV0dXJuVmFsdWUoZm46IHRzLkV4cHJlc3Npb24pOiB0cy5FeHByZXNzaW9uIHtcbiAgICBhc3NlcnQoZm4sIHRoaXMuaXNGdW5jdGlvbkV4cHJlc3Npb24sICdhIGZ1bmN0aW9uJyk7XG4gICAgaWYgKCF0cy5pc0Jsb2NrKGZuLmJvZHkpKSB7XG4gICAgICAvLyBpdCBpcyBhIHNpbXBsZSBhcnJheSBmdW5jdGlvbiBleHByZXNzaW9uOiBgKC4uLikgPT4gZXhwcmBcbiAgICAgIHJldHVybiBmbi5ib2R5O1xuICAgIH1cblxuICAgIC8vIGl0IGlzIGEgZnVuY3Rpb24gKGFycm93IG9yIG5vcm1hbCkgd2l0aCBhIGJvZHkuIEUuZy46XG4gICAgLy8gKiBgKC4uLikgPT4geyBzdG10OyAuLi4gfWBcbiAgICAvLyAqIGBmdW5jdGlvbiguLi4pIHsgc3RtdDsgLi4uIH1gXG5cbiAgICBpZiAoZm4uYm9keS5zdGF0ZW1lbnRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgICAgZm4uYm9keSwgJ1Vuc3VwcG9ydGVkIHN5bnRheCwgZXhwZWN0ZWQgYSBmdW5jdGlvbiBib2R5IHdpdGggYSBzaW5nbGUgcmV0dXJuIHN0YXRlbWVudC4nKTtcbiAgICB9XG4gICAgY29uc3Qgc3RtdCA9IGZuLmJvZHkuc3RhdGVtZW50c1swXTtcbiAgICBhc3NlcnQoc3RtdCwgdHMuaXNSZXR1cm5TdGF0ZW1lbnQsICdhIGZ1bmN0aW9uIGJvZHkgd2l0aCBhIHNpbmdsZSByZXR1cm4gc3RhdGVtZW50Jyk7XG4gICAgaWYgKHN0bXQuZXhwcmVzc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRmF0YWxMaW5rZXJFcnJvcihzdG10LCAnVW5zdXBwb3J0ZWQgc3ludGF4LCBleHBlY3RlZCBmdW5jdGlvbiB0byByZXR1cm4gYSB2YWx1ZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RtdC5leHByZXNzaW9uO1xuICB9XG5cbiAgaXNDYWxsRXhwcmVzc2lvbiA9IHRzLmlzQ2FsbEV4cHJlc3Npb247XG5cbiAgcGFyc2VDYWxsZWUoY2FsbDogdHMuRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb24ge1xuICAgIGFzc2VydChjYWxsLCB0cy5pc0NhbGxFeHByZXNzaW9uLCAnYSBjYWxsIGV4cHJlc3Npb24nKTtcbiAgICByZXR1cm4gY2FsbC5leHByZXNzaW9uO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoY2FsbDogdHMuRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb25bXSB7XG4gICAgYXNzZXJ0KGNhbGwsIHRzLmlzQ2FsbEV4cHJlc3Npb24sICdhIGNhbGwgZXhwcmVzc2lvbicpO1xuICAgIHJldHVybiBjYWxsLmFyZ3VtZW50cy5tYXAoYXJnID0+IHtcbiAgICAgIGFzc2VydChhcmcsIGlzTm90U3ByZWFkRWxlbWVudCwgJ2FyZ3VtZW50IG5vdCB0byB1c2Ugc3ByZWFkIHN5bnRheCcpO1xuICAgICAgcmV0dXJuIGFyZztcbiAgICB9KTtcbiAgfVxuXG4gIGdldFJhbmdlKG5vZGU6IHRzLkV4cHJlc3Npb24pOiBSYW5nZSB7XG4gICAgY29uc3QgZmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBGYXRhbExpbmtlckVycm9yKFxuICAgICAgICAgIG5vZGUsICdVbmFibGUgdG8gcmVhZCByYW5nZSBmb3Igbm9kZSAtIGl0IGlzIG1pc3NpbmcgcGFyZW50IGluZm9ybWF0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCBzdGFydFBvcyA9IG5vZGUuZ2V0U3RhcnQoKTtcbiAgICBjb25zdCBlbmRQb3MgPSBub2RlLmdldEVuZCgpO1xuICAgIGNvbnN0IHtsaW5lOiBzdGFydExpbmUsIGNoYXJhY3Rlcjogc3RhcnRDb2x9ID0gdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oZmlsZSwgc3RhcnRQb3MpO1xuICAgIHJldHVybiB7c3RhcnRMaW5lLCBzdGFydENvbCwgc3RhcnRQb3MsIGVuZFBvc307XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgZXhwcmVzc2lvbiBkb2VzIG5vdCByZXByZXNlbnQgYW4gZW1wdHkgZWxlbWVudCBpbiBhbiBhcnJheSBsaXRlcmFsLlxuICogRm9yIGV4YW1wbGUgaW4gYFssZm9vXWAgdGhlIGZpcnN0IGVsZW1lbnQgaXMgXCJlbXB0eVwiLlxuICovXG5mdW5jdGlvbiBpc05vdEVtcHR5RWxlbWVudChlOiB0cy5FeHByZXNzaW9ufHRzLlNwcmVhZEVsZW1lbnR8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0cy5PbWl0dGVkRXhwcmVzc2lvbik6IGUgaXMgdHMuRXhwcmVzc2lvbnx0cy5TcHJlYWRFbGVtZW50IHtcbiAgcmV0dXJuICF0cy5pc09taXR0ZWRFeHByZXNzaW9uKGUpO1xufVxuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIHRoZSBleHByZXNzaW9uIGlzIG5vdCBhIHNwcmVhZCBlbGVtZW50IG9mIGFuIGFycmF5IGxpdGVyYWwuXG4gKiBGb3IgZXhhbXBsZSBpbiBgW3gsIC4uLnJlc3RdYCB0aGUgYC4uLnJlc3RgIGV4cHJlc3Npb24gaXMgYSBzcHJlYWQgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gaXNOb3RTcHJlYWRFbGVtZW50KGU6IHRzLkV4cHJlc3Npb258dHMuU3ByZWFkRWxlbWVudCk6IGUgaXMgdHMuRXhwcmVzc2lvbiB7XG4gIHJldHVybiAhdHMuaXNTcHJlYWRFbGVtZW50KGUpO1xufVxuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIHRoZSBleHByZXNzaW9uIGNhbiBiZSBjb25zaWRlcmVkIGEgdGV4dCBiYXNlZCBwcm9wZXJ0eSBuYW1lLlxuICovXG5mdW5jdGlvbiBpc1Byb3BlcnR5TmFtZShlOiB0cy5Qcm9wZXJ0eU5hbWUpOiBlIGlzIHRzLklkZW50aWZpZXJ8dHMuU3RyaW5nTGl0ZXJhbHx0cy5OdW1lcmljTGl0ZXJhbCB7XG4gIHJldHVybiB0cy5pc0lkZW50aWZpZXIoZSkgfHwgdHMuaXNTdHJpbmdMaXRlcmFsKGUpIHx8IHRzLmlzTnVtZXJpY0xpdGVyYWwoZSk7XG59XG4iXX0=
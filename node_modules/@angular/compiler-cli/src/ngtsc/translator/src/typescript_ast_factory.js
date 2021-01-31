(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/translator/src/typescript_ast_factory", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.attachComments = exports.createTemplateTail = exports.createTemplateMiddle = exports.TypeScriptAstFactory = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    var UNARY_OPERATORS = {
        '+': ts.SyntaxKind.PlusToken,
        '-': ts.SyntaxKind.MinusToken,
        '!': ts.SyntaxKind.ExclamationToken,
    };
    var BINARY_OPERATORS = {
        '&&': ts.SyntaxKind.AmpersandAmpersandToken,
        '>': ts.SyntaxKind.GreaterThanToken,
        '>=': ts.SyntaxKind.GreaterThanEqualsToken,
        '&': ts.SyntaxKind.AmpersandToken,
        '/': ts.SyntaxKind.SlashToken,
        '==': ts.SyntaxKind.EqualsEqualsToken,
        '===': ts.SyntaxKind.EqualsEqualsEqualsToken,
        '<': ts.SyntaxKind.LessThanToken,
        '<=': ts.SyntaxKind.LessThanEqualsToken,
        '-': ts.SyntaxKind.MinusToken,
        '%': ts.SyntaxKind.PercentToken,
        '*': ts.SyntaxKind.AsteriskToken,
        '!=': ts.SyntaxKind.ExclamationEqualsToken,
        '!==': ts.SyntaxKind.ExclamationEqualsEqualsToken,
        '||': ts.SyntaxKind.BarBarToken,
        '+': ts.SyntaxKind.PlusToken,
    };
    var VAR_TYPES = {
        'const': ts.NodeFlags.Const,
        'let': ts.NodeFlags.Let,
        'var': ts.NodeFlags.None,
    };
    /**
     * A TypeScript flavoured implementation of the AstFactory.
     */
    var TypeScriptAstFactory = /** @class */ (function () {
        function TypeScriptAstFactory() {
            this.externalSourceFiles = new Map();
            this.attachComments = attachComments;
            this.createArrayLiteral = ts.createArrayLiteral;
            this.createConditional = ts.createConditional;
            this.createElementAccess = ts.createElementAccess;
            this.createExpressionStatement = ts.createExpressionStatement;
            this.createIdentifier = ts.createIdentifier;
            this.createParenthesizedExpression = ts.createParen;
            this.createPropertyAccess = ts.createPropertyAccess;
            this.createThrowStatement = ts.createThrow;
            this.createTypeOfExpression = ts.createTypeOf;
        }
        TypeScriptAstFactory.prototype.createAssignment = function (target, value) {
            return ts.createBinary(target, ts.SyntaxKind.EqualsToken, value);
        };
        TypeScriptAstFactory.prototype.createBinaryExpression = function (leftOperand, operator, rightOperand) {
            return ts.createBinary(leftOperand, BINARY_OPERATORS[operator], rightOperand);
        };
        TypeScriptAstFactory.prototype.createBlock = function (body) {
            return ts.createBlock(body);
        };
        TypeScriptAstFactory.prototype.createCallExpression = function (callee, args, pure) {
            var call = ts.createCall(callee, undefined, args);
            if (pure) {
                ts.addSyntheticLeadingComment(call, ts.SyntaxKind.MultiLineCommentTrivia, '@__PURE__', /* trailing newline */ false);
            }
            return call;
        };
        TypeScriptAstFactory.prototype.createFunctionDeclaration = function (functionName, parameters, body) {
            if (!ts.isBlock(body)) {
                throw new Error("Invalid syntax, expected a block, but got " + ts.SyntaxKind[body.kind] + ".");
            }
            return ts.createFunctionDeclaration(undefined, undefined, undefined, functionName, undefined, parameters.map(function (param) { return ts.createParameter(undefined, undefined, undefined, param); }), undefined, body);
        };
        TypeScriptAstFactory.prototype.createFunctionExpression = function (functionName, parameters, body) {
            if (!ts.isBlock(body)) {
                throw new Error("Invalid syntax, expected a block, but got " + ts.SyntaxKind[body.kind] + ".");
            }
            return ts.createFunctionExpression(undefined, undefined, functionName !== null && functionName !== void 0 ? functionName : undefined, undefined, parameters.map(function (param) { return ts.createParameter(undefined, undefined, undefined, param); }), undefined, body);
        };
        TypeScriptAstFactory.prototype.createIfStatement = function (condition, thenStatement, elseStatement) {
            return ts.createIf(condition, thenStatement, elseStatement !== null && elseStatement !== void 0 ? elseStatement : undefined);
        };
        TypeScriptAstFactory.prototype.createLiteral = function (value) {
            if (value === undefined) {
                return ts.createIdentifier('undefined');
            }
            else if (value === null) {
                return ts.createNull();
            }
            else {
                return ts.createLiteral(value);
            }
        };
        TypeScriptAstFactory.prototype.createNewExpression = function (expression, args) {
            return ts.createNew(expression, undefined, args);
        };
        TypeScriptAstFactory.prototype.createObjectLiteral = function (properties) {
            return ts.createObjectLiteral(properties.map(function (prop) { return ts.createPropertyAssignment(prop.quoted ? ts.createLiteral(prop.propertyName) :
                ts.createIdentifier(prop.propertyName), prop.value); }));
        };
        TypeScriptAstFactory.prototype.createReturnStatement = function (expression) {
            return ts.createReturn(expression !== null && expression !== void 0 ? expression : undefined);
        };
        TypeScriptAstFactory.prototype.createTaggedTemplate = function (tag, template) {
            var templateLiteral;
            var length = template.elements.length;
            var head = template.elements[0];
            if (length === 1) {
                templateLiteral = ts.createNoSubstitutionTemplateLiteral(head.cooked, head.raw);
            }
            else {
                var spans = [];
                // Create the middle parts
                for (var i = 1; i < length - 1; i++) {
                    var _a = template.elements[i], cooked = _a.cooked, raw = _a.raw, range = _a.range;
                    var middle = createTemplateMiddle(cooked, raw);
                    if (range !== null) {
                        this.setSourceMapRange(middle, range);
                    }
                    spans.push(ts.createTemplateSpan(template.expressions[i - 1], middle));
                }
                // Create the tail part
                var resolvedExpression = template.expressions[length - 2];
                var templatePart = template.elements[length - 1];
                var templateTail = createTemplateTail(templatePart.cooked, templatePart.raw);
                if (templatePart.range !== null) {
                    this.setSourceMapRange(templateTail, templatePart.range);
                }
                spans.push(ts.createTemplateSpan(resolvedExpression, templateTail));
                // Put it all together
                templateLiteral =
                    ts.createTemplateExpression(ts.createTemplateHead(head.cooked, head.raw), spans);
            }
            if (head.range !== null) {
                this.setSourceMapRange(templateLiteral, head.range);
            }
            return ts.createTaggedTemplate(tag, templateLiteral);
        };
        TypeScriptAstFactory.prototype.createUnaryExpression = function (operator, operand) {
            return ts.createPrefix(UNARY_OPERATORS[operator], operand);
        };
        TypeScriptAstFactory.prototype.createVariableDeclaration = function (variableName, initializer, type) {
            return ts.createVariableStatement(undefined, ts.createVariableDeclarationList([ts.createVariableDeclaration(variableName, undefined, initializer !== null && initializer !== void 0 ? initializer : undefined)], VAR_TYPES[type]));
        };
        TypeScriptAstFactory.prototype.setSourceMapRange = function (node, sourceMapRange) {
            if (sourceMapRange === null) {
                return node;
            }
            var url = sourceMapRange.url;
            if (!this.externalSourceFiles.has(url)) {
                this.externalSourceFiles.set(url, ts.createSourceMapSource(url, sourceMapRange.content, function (pos) { return pos; }));
            }
            var source = this.externalSourceFiles.get(url);
            ts.setSourceMapRange(node, { pos: sourceMapRange.start.offset, end: sourceMapRange.end.offset, source: source });
            return node;
        };
        return TypeScriptAstFactory;
    }());
    exports.TypeScriptAstFactory = TypeScriptAstFactory;
    // HACK: Use this in place of `ts.createTemplateMiddle()`.
    // Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed.
    function createTemplateMiddle(cooked, raw) {
        var node = ts.createTemplateHead(cooked, raw);
        node.kind = ts.SyntaxKind.TemplateMiddle;
        return node;
    }
    exports.createTemplateMiddle = createTemplateMiddle;
    // HACK: Use this in place of `ts.createTemplateTail()`.
    // Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed.
    function createTemplateTail(cooked, raw) {
        var node = ts.createTemplateHead(cooked, raw);
        node.kind = ts.SyntaxKind.TemplateTail;
        return node;
    }
    exports.createTemplateTail = createTemplateTail;
    /**
     * Attach the given `leadingComments` to the `statement` node.
     *
     * @param statement The statement that will have comments attached.
     * @param leadingComments The comments to attach to the statement.
     */
    function attachComments(statement, leadingComments) {
        var e_1, _a, e_2, _b;
        try {
            for (var leadingComments_1 = tslib_1.__values(leadingComments), leadingComments_1_1 = leadingComments_1.next(); !leadingComments_1_1.done; leadingComments_1_1 = leadingComments_1.next()) {
                var comment = leadingComments_1_1.value;
                var commentKind = comment.multiline ? ts.SyntaxKind.MultiLineCommentTrivia :
                    ts.SyntaxKind.SingleLineCommentTrivia;
                if (comment.multiline) {
                    ts.addSyntheticLeadingComment(statement, commentKind, comment.toString(), comment.trailingNewline);
                }
                else {
                    try {
                        for (var _c = (e_2 = void 0, tslib_1.__values(comment.toString().split('\n'))), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var line = _d.value;
                            ts.addSyntheticLeadingComment(statement, commentKind, line, comment.trailingNewline);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (leadingComments_1_1 && !leadingComments_1_1.done && (_a = leadingComments_1.return)) _a.call(leadingComments_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    exports.attachComments = attachComments;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdF9hc3RfZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHJhbnNsYXRvci9zcmMvdHlwZXNjcmlwdF9hc3RfZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsK0JBQWlDO0lBSWpDLElBQU0sZUFBZSxHQUFrRDtRQUNyRSxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTO1FBQzVCLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVU7UUFDN0IsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQ3BDLENBQUM7SUFFRixJQUFNLGdCQUFnQixHQUE4QztRQUNsRSxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUI7UUFDM0MsR0FBRyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQ25DLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFzQjtRQUMxQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjO1FBQ2pDLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVU7UUFDN0IsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCO1FBQ3JDLEtBQUssRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QjtRQUM1QyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhO1FBQ2hDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUN2QyxHQUFHLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVO1FBQzdCLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVk7UUFDL0IsR0FBRyxFQUFF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SSxDQUFDLElBQXNCLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7UUFDMUQsT0FBTyxJQUF1QixDQUFDO0lBQ2pDLENBQUM7SUFKRCxnREFJQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsY0FBYyxDQUFDLFNBQXVCLEVBQUUsZUFBaUM7OztZQUN2RixLQUFzQixJQUFBLG9CQUFBLGlCQUFBLGVBQWUsQ0FBQSxnREFBQSw2RUFBRTtnQkFBbEMsSUFBTSxPQUFPLDRCQUFBO2dCQUNoQixJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUM7b0JBQ3RDLEVBQUUsQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUM7Z0JBQzlFLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtvQkFDckIsRUFBRSxDQUFDLDBCQUEwQixDQUN6QixTQUFTLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7aUJBQzFFO3FCQUFNOzt3QkFDTCxLQUFtQixJQUFBLG9CQUFBLGlCQUFBLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQSxnQkFBQSw0QkFBRTs0QkFBOUMsSUFBTSxJQUFJLFdBQUE7NEJBQ2IsRUFBRSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzt5QkFDdEY7Ozs7Ozs7OztpQkFDRjthQUNGOzs7Ozs7Ozs7SUFDSCxDQUFDO0lBYkQsd0NBYUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0FzdEZhY3RvcnksIEJpbmFyeU9wZXJhdG9yLCBMZWFkaW5nQ29tbWVudCwgT2JqZWN0TGl0ZXJhbFByb3BlcnR5LCBTb3VyY2VNYXBSYW5nZSwgVGVtcGxhdGVMaXRlcmFsLCBVbmFyeU9wZXJhdG9yLCBWYXJpYWJsZURlY2xhcmF0aW9uVHlwZX0gZnJvbSAnLi9hcGkvYXN0X2ZhY3RvcnknO1xuXG5jb25zdCBVTkFSWV9PUEVSQVRPUlM6IFJlY29yZDxVbmFyeU9wZXJhdG9yLCB0cy5QcmVmaXhVbmFyeU9wZXJhdG9yPiA9IHtcbiAgJysnOiB0cy5TeW50YXhLaW5kLlBsdXNUb2tlbixcbiAgJy0nOiB0cy5TeW50YXhLaW5kLk1pbnVzVG9rZW4sXG4gICchJzogdHMuU3ludGF4S2luZC5FeGNsYW1hdGlvblRva2VuLFxufTtcblxuY29uc3QgQklOQVJZX09QRVJBVE9SUzogUmVjb3JkPEJpbmFyeU9wZXJhdG9yLCB0cy5CaW5hcnlPcGVyYXRvcj4gPSB7XG4gICcmJic6IHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kQW1wZXJzYW5kVG9rZW4sXG4gICc+JzogdHMuU3ludGF4S2luZC5HcmVhdGVyVGhhblRva2VuLFxuICAnPj0nOiB0cy5TeW50YXhLaW5kLkdyZWF0ZXJUaGFuRXF1YWxzVG9rZW4sXG4gICcmJzogdHMuU3ludGF4S2luZC5BbXBlcnNhbmRUb2tlbixcbiAgJy8nOiB0cy5TeW50YXhLaW5kLlNsYXNoVG9rZW4sXG4gICc9PSc6IHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzVG9rZW4sXG4gICc9PT0nOiB0cy5TeW50YXhLaW5kLkVxdWFsc0VxdWFsc0VxdWFsc1Rva2VuLFxuICAnPCc6IHRzLlN5bnRheEtpbmQuTGVzc1RoYW5Ub2tlbixcbiAgJzw9JzogdHMuU3ludGF4S2luZC5MZXNzVGhhbkVxdWFsc1Rva2VuLFxuICAnLSc6IHRzLlN5bnRheEtpbmQuTWludXNUb2tlbixcbiAgJyUnOiB0cy5TeW50YXhLaW5kLlBlcmNlbnRUb2tlbixcbiAgJyonOiB0cy5TeW50YXhLaW5kLkFzdGVyaXNrVG9rZW4sXG4gICchPSc6IHRzLlN5bnRheEtpbmQuRXhjbGFtYXRpb25FcXVhbHNUb2tlbixcbiAgJyE9PSc6IHRzLlN5bnRheEtpbmQuRXhjbGFtYXRpb25FcXVhbHNFcXVhbHNUb2tlbixcbiAgJ3x8JzogdHMuU3ludGF4S2luZC5CYXJCYXJUb2tlbixcbiAgJysnOiB0cy5TeW50YXhLaW5kLlBsdXNUb2tlbixcbn07XG5cbmNvbnN0IFZBUl9UWVBFUzogUmVjb3JkPFZhcmlhYmxlRGVjbGFyYXRpb25UeXBlLCB0cy5Ob2RlRmxhZ3M+ID0ge1xuICAnY29uc3QnOiB0cy5Ob2RlRmxhZ3MuQ29uc3QsXG4gICdsZXQnOiB0cy5Ob2RlRmxhZ3MuTGV0LFxuICAndmFyJzogdHMuTm9kZUZsYWdzLk5vbmUsXG59O1xuXG4vKipcbiAqIEEgVHlwZVNjcmlwdCBmbGF2b3VyZWQgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFzdEZhY3RvcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBUeXBlU2NyaXB0QXN0RmFjdG9yeSBpbXBsZW1lbnRzIEFzdEZhY3Rvcnk8dHMuU3RhdGVtZW50LCB0cy5FeHByZXNzaW9uPiB7XG4gIHByaXZhdGUgZXh0ZXJuYWxTb3VyY2VGaWxlcyA9IG5ldyBNYXA8c3RyaW5nLCB0cy5Tb3VyY2VNYXBTb3VyY2U+KCk7XG5cbiAgYXR0YWNoQ29tbWVudHMgPSBhdHRhY2hDb21tZW50cztcblxuICBjcmVhdGVBcnJheUxpdGVyYWwgPSB0cy5jcmVhdGVBcnJheUxpdGVyYWw7XG5cbiAgY3JlYXRlQXNzaWdubWVudCh0YXJnZXQ6IHRzLkV4cHJlc3Npb24sIHZhbHVlOiB0cy5FeHByZXNzaW9uKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUJpbmFyeSh0YXJnZXQsIHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4sIHZhbHVlKTtcbiAgfVxuXG4gIGNyZWF0ZUJpbmFyeUV4cHJlc3Npb24oXG4gICAgICBsZWZ0T3BlcmFuZDogdHMuRXhwcmVzc2lvbiwgb3BlcmF0b3I6IEJpbmFyeU9wZXJhdG9yLFxuICAgICAgcmlnaHRPcGVyYW5kOiB0cy5FeHByZXNzaW9uKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUJpbmFyeShsZWZ0T3BlcmFuZCwgQklOQVJZX09QRVJBVE9SU1tvcGVyYXRvcl0sIHJpZ2h0T3BlcmFuZCk7XG4gIH1cblxuICBjcmVhdGVCbG9jayhib2R5OiB0cy5TdGF0ZW1lbnRbXSk6IHRzLlN0YXRlbWVudCB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUJsb2NrKGJvZHkpO1xuICB9XG5cbiAgY3JlYXRlQ2FsbEV4cHJlc3Npb24oY2FsbGVlOiB0cy5FeHByZXNzaW9uLCBhcmdzOiB0cy5FeHByZXNzaW9uW10sIHB1cmU6IGJvb2xlYW4pOiB0cy5FeHByZXNzaW9uIHtcbiAgICBjb25zdCBjYWxsID0gdHMuY3JlYXRlQ2FsbChjYWxsZWUsIHVuZGVmaW5lZCwgYXJncyk7XG4gICAgaWYgKHB1cmUpIHtcbiAgICAgIHRzLmFkZFN5bnRoZXRpY0xlYWRpbmdDb21tZW50KFxuICAgICAgICAgIGNhbGwsIHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSwgJ0BfX1BVUkVfXycsIC8qIHRyYWlsaW5nIG5ld2xpbmUgKi8gZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbDtcbiAgfVxuXG4gIGNyZWF0ZUNvbmRpdGlvbmFsID0gdHMuY3JlYXRlQ29uZGl0aW9uYWw7XG5cbiAgY3JlYXRlRWxlbWVudEFjY2VzcyA9IHRzLmNyZWF0ZUVsZW1lbnRBY2Nlc3M7XG5cbiAgY3JlYXRlRXhwcmVzc2lvblN0YXRlbWVudCA9IHRzLmNyZWF0ZUV4cHJlc3Npb25TdGF0ZW1lbnQ7XG5cbiAgY3JlYXRlRnVuY3Rpb25EZWNsYXJhdGlvbihmdW5jdGlvbk5hbWU6IHN0cmluZywgcGFyYW1ldGVyczogc3RyaW5nW10sIGJvZHk6IHRzLlN0YXRlbWVudCk6XG4gICAgICB0cy5TdGF0ZW1lbnQge1xuICAgIGlmICghdHMuaXNCbG9jayhib2R5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHN5bnRheCwgZXhwZWN0ZWQgYSBibG9jaywgYnV0IGdvdCAke3RzLlN5bnRheEtpbmRbYm9keS5raW5kXX0uYCk7XG4gICAgfVxuICAgIHJldHVybiB0cy5jcmVhdGVGdW5jdGlvbkRlY2xhcmF0aW9uKFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbk5hbWUsIHVuZGVmaW5lZCxcbiAgICAgICAgcGFyYW1ldGVycy5tYXAocGFyYW0gPT4gdHMuY3JlYXRlUGFyYW1ldGVyKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHBhcmFtKSksXG4gICAgICAgIHVuZGVmaW5lZCwgYm9keSk7XG4gIH1cblxuICBjcmVhdGVGdW5jdGlvbkV4cHJlc3Npb24oZnVuY3Rpb25OYW1lOiBzdHJpbmd8bnVsbCwgcGFyYW1ldGVyczogc3RyaW5nW10sIGJvZHk6IHRzLlN0YXRlbWVudCk6XG4gICAgICB0cy5FeHByZXNzaW9uIHtcbiAgICBpZiAoIXRzLmlzQmxvY2soYm9keSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzeW50YXgsIGV4cGVjdGVkIGEgYmxvY2ssIGJ1dCBnb3QgJHt0cy5TeW50YXhLaW5kW2JvZHkua2luZF19LmApO1xuICAgIH1cbiAgICByZXR1cm4gdHMuY3JlYXRlRnVuY3Rpb25FeHByZXNzaW9uKFxuICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb25OYW1lID8/IHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICAgICBwYXJhbWV0ZXJzLm1hcChwYXJhbSA9PiB0cy5jcmVhdGVQYXJhbWV0ZXIodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcGFyYW0pKSxcbiAgICAgICAgdW5kZWZpbmVkLCBib2R5KTtcbiAgfVxuXG4gIGNyZWF0ZUlkZW50aWZpZXIgPSB0cy5jcmVhdGVJZGVudGlmaWVyO1xuXG4gIGNyZWF0ZUlmU3RhdGVtZW50KFxuICAgICAgY29uZGl0aW9uOiB0cy5FeHByZXNzaW9uLCB0aGVuU3RhdGVtZW50OiB0cy5TdGF0ZW1lbnQsXG4gICAgICBlbHNlU3RhdGVtZW50OiB0cy5TdGF0ZW1lbnR8bnVsbCk6IHRzLlN0YXRlbWVudCB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUlmKGNvbmRpdGlvbiwgdGhlblN0YXRlbWVudCwgZWxzZVN0YXRlbWVudCA/PyB1bmRlZmluZWQpO1xuICB9XG5cbiAgY3JlYXRlTGl0ZXJhbCh2YWx1ZTogc3RyaW5nfG51bWJlcnxib29sZWFufG51bGx8dW5kZWZpbmVkKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0cy5jcmVhdGVJZGVudGlmaWVyKCd1bmRlZmluZWQnKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdHMuY3JlYXRlTnVsbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHMuY3JlYXRlTGl0ZXJhbCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTmV3RXhwcmVzc2lvbihleHByZXNzaW9uOiB0cy5FeHByZXNzaW9uLCBhcmdzOiB0cy5FeHByZXNzaW9uW10pOiB0cy5FeHByZXNzaW9uIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlTmV3KGV4cHJlc3Npb24sIHVuZGVmaW5lZCwgYXJncyk7XG4gIH1cblxuICBjcmVhdGVPYmplY3RMaXRlcmFsKHByb3BlcnRpZXM6IE9iamVjdExpdGVyYWxQcm9wZXJ0eTx0cy5FeHByZXNzaW9uPltdKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZU9iamVjdExpdGVyYWwocHJvcGVydGllcy5tYXAoXG4gICAgICAgIHByb3AgPT4gdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgICAgICAgcHJvcC5xdW90ZWQgPyB0cy5jcmVhdGVMaXRlcmFsKHByb3AucHJvcGVydHlOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZUlkZW50aWZpZXIocHJvcC5wcm9wZXJ0eU5hbWUpLFxuICAgICAgICAgICAgcHJvcC52YWx1ZSkpKTtcbiAgfVxuXG4gIGNyZWF0ZVBhcmVudGhlc2l6ZWRFeHByZXNzaW9uID0gdHMuY3JlYXRlUGFyZW47XG5cbiAgY3JlYXRlUHJvcGVydHlBY2Nlc3MgPSB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcztcblxuICBjcmVhdGVSZXR1cm5TdGF0ZW1lbnQoZXhwcmVzc2lvbjogdHMuRXhwcmVzc2lvbnxudWxsKTogdHMuU3RhdGVtZW50IHtcbiAgICByZXR1cm4gdHMuY3JlYXRlUmV0dXJuKGV4cHJlc3Npb24gPz8gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNyZWF0ZVRhZ2dlZFRlbXBsYXRlKHRhZzogdHMuRXhwcmVzc2lvbiwgdGVtcGxhdGU6IFRlbXBsYXRlTGl0ZXJhbDx0cy5FeHByZXNzaW9uPik6XG4gICAgICB0cy5FeHByZXNzaW9uIHtcbiAgICBsZXQgdGVtcGxhdGVMaXRlcmFsOiB0cy5UZW1wbGF0ZUxpdGVyYWw7XG4gICAgY29uc3QgbGVuZ3RoID0gdGVtcGxhdGUuZWxlbWVudHMubGVuZ3RoO1xuICAgIGNvbnN0IGhlYWQgPSB0ZW1wbGF0ZS5lbGVtZW50c1swXTtcbiAgICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICB0ZW1wbGF0ZUxpdGVyYWwgPSB0cy5jcmVhdGVOb1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbChoZWFkLmNvb2tlZCwgaGVhZC5yYXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzcGFuczogdHMuVGVtcGxhdGVTcGFuW10gPSBbXTtcbiAgICAgIC8vIENyZWF0ZSB0aGUgbWlkZGxlIHBhcnRzXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICBjb25zdCB7Y29va2VkLCByYXcsIHJhbmdlfSA9IHRlbXBsYXRlLmVsZW1lbnRzW2ldO1xuICAgICAgICBjb25zdCBtaWRkbGUgPSBjcmVhdGVUZW1wbGF0ZU1pZGRsZShjb29rZWQsIHJhdyk7XG4gICAgICAgIGlmIChyYW5nZSAhPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuc2V0U291cmNlTWFwUmFuZ2UobWlkZGxlLCByYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3BhbnMucHVzaCh0cy5jcmVhdGVUZW1wbGF0ZVNwYW4odGVtcGxhdGUuZXhwcmVzc2lvbnNbaSAtIDFdLCBtaWRkbGUpKTtcbiAgICAgIH1cbiAgICAgIC8vIENyZWF0ZSB0aGUgdGFpbCBwYXJ0XG4gICAgICBjb25zdCByZXNvbHZlZEV4cHJlc3Npb24gPSB0ZW1wbGF0ZS5leHByZXNzaW9uc1tsZW5ndGggLSAyXTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlUGFydCA9IHRlbXBsYXRlLmVsZW1lbnRzW2xlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgdGVtcGxhdGVUYWlsID0gY3JlYXRlVGVtcGxhdGVUYWlsKHRlbXBsYXRlUGFydC5jb29rZWQsIHRlbXBsYXRlUGFydC5yYXcpO1xuICAgICAgaWYgKHRlbXBsYXRlUGFydC5yYW5nZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnNldFNvdXJjZU1hcFJhbmdlKHRlbXBsYXRlVGFpbCwgdGVtcGxhdGVQYXJ0LnJhbmdlKTtcbiAgICAgIH1cbiAgICAgIHNwYW5zLnB1c2godHMuY3JlYXRlVGVtcGxhdGVTcGFuKHJlc29sdmVkRXhwcmVzc2lvbiwgdGVtcGxhdGVUYWlsKSk7XG4gICAgICAvLyBQdXQgaXQgYWxsIHRvZ2V0aGVyXG4gICAgICB0ZW1wbGF0ZUxpdGVyYWwgPVxuICAgICAgICAgIHRzLmNyZWF0ZVRlbXBsYXRlRXhwcmVzc2lvbih0cy5jcmVhdGVUZW1wbGF0ZUhlYWQoaGVhZC5jb29rZWQsIGhlYWQucmF3KSwgc3BhbnMpO1xuICAgIH1cbiAgICBpZiAoaGVhZC5yYW5nZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5zZXRTb3VyY2VNYXBSYW5nZSh0ZW1wbGF0ZUxpdGVyYWwsIGhlYWQucmFuZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHMuY3JlYXRlVGFnZ2VkVGVtcGxhdGUodGFnLCB0ZW1wbGF0ZUxpdGVyYWwpO1xuICB9XG5cbiAgY3JlYXRlVGhyb3dTdGF0ZW1lbnQgPSB0cy5jcmVhdGVUaHJvdztcblxuICBjcmVhdGVUeXBlT2ZFeHByZXNzaW9uID0gdHMuY3JlYXRlVHlwZU9mO1xuXG5cbiAgY3JlYXRlVW5hcnlFeHByZXNzaW9uKG9wZXJhdG9yOiBVbmFyeU9wZXJhdG9yLCBvcGVyYW5kOiB0cy5FeHByZXNzaW9uKTogdHMuRXhwcmVzc2lvbiB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVByZWZpeChVTkFSWV9PUEVSQVRPUlNbb3BlcmF0b3JdLCBvcGVyYW5kKTtcbiAgfVxuXG4gIGNyZWF0ZVZhcmlhYmxlRGVjbGFyYXRpb24oXG4gICAgICB2YXJpYWJsZU5hbWU6IHN0cmluZywgaW5pdGlhbGl6ZXI6IHRzLkV4cHJlc3Npb258bnVsbCxcbiAgICAgIHR5cGU6IFZhcmlhYmxlRGVjbGFyYXRpb25UeXBlKTogdHMuU3RhdGVtZW50IHtcbiAgICByZXR1cm4gdHMuY3JlYXRlVmFyaWFibGVTdGF0ZW1lbnQoXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbkxpc3QoXG4gICAgICAgICAgICBbdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbih2YXJpYWJsZU5hbWUsIHVuZGVmaW5lZCwgaW5pdGlhbGl6ZXIgPz8gdW5kZWZpbmVkKV0sXG4gICAgICAgICAgICBWQVJfVFlQRVNbdHlwZV0pLFxuICAgICk7XG4gIH1cblxuICBzZXRTb3VyY2VNYXBSYW5nZTxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCwgc291cmNlTWFwUmFuZ2U6IFNvdXJjZU1hcFJhbmdlfG51bGwpOiBUIHtcbiAgICBpZiAoc291cmNlTWFwUmFuZ2UgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIGNvbnN0IHVybCA9IHNvdXJjZU1hcFJhbmdlLnVybDtcbiAgICBpZiAoIXRoaXMuZXh0ZXJuYWxTb3VyY2VGaWxlcy5oYXModXJsKSkge1xuICAgICAgdGhpcy5leHRlcm5hbFNvdXJjZUZpbGVzLnNldChcbiAgICAgICAgICB1cmwsIHRzLmNyZWF0ZVNvdXJjZU1hcFNvdXJjZSh1cmwsIHNvdXJjZU1hcFJhbmdlLmNvbnRlbnQsIHBvcyA9PiBwb3MpKTtcbiAgICB9XG4gICAgY29uc3Qgc291cmNlID0gdGhpcy5leHRlcm5hbFNvdXJjZUZpbGVzLmdldCh1cmwpO1xuICAgIHRzLnNldFNvdXJjZU1hcFJhbmdlKFxuICAgICAgICBub2RlLCB7cG9zOiBzb3VyY2VNYXBSYW5nZS5zdGFydC5vZmZzZXQsIGVuZDogc291cmNlTWFwUmFuZ2UuZW5kLm9mZnNldCwgc291cmNlfSk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbn1cblxuLy8gSEFDSzogVXNlIHRoaXMgaW4gcGxhY2Ugb2YgYHRzLmNyZWF0ZVRlbXBsYXRlTWlkZGxlKClgLlxuLy8gUmV2ZXJ0IG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNTM3NCBpcyBmaXhlZC5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZU1pZGRsZShjb29rZWQ6IHN0cmluZywgcmF3OiBzdHJpbmcpOiB0cy5UZW1wbGF0ZU1pZGRsZSB7XG4gIGNvbnN0IG5vZGU6IHRzLlRlbXBsYXRlTGl0ZXJhbExpa2VOb2RlID0gdHMuY3JlYXRlVGVtcGxhdGVIZWFkKGNvb2tlZCwgcmF3KTtcbiAgKG5vZGUua2luZCBhcyB0cy5TeW50YXhLaW5kKSA9IHRzLlN5bnRheEtpbmQuVGVtcGxhdGVNaWRkbGU7XG4gIHJldHVybiBub2RlIGFzIHRzLlRlbXBsYXRlTWlkZGxlO1xufVxuXG4vLyBIQUNLOiBVc2UgdGhpcyBpbiBwbGFjZSBvZiBgdHMuY3JlYXRlVGVtcGxhdGVUYWlsKClgLlxuLy8gUmV2ZXJ0IG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNTM3NCBpcyBmaXhlZC5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZW1wbGF0ZVRhaWwoY29va2VkOiBzdHJpbmcsIHJhdzogc3RyaW5nKTogdHMuVGVtcGxhdGVUYWlsIHtcbiAgY29uc3Qgbm9kZTogdHMuVGVtcGxhdGVMaXRlcmFsTGlrZU5vZGUgPSB0cy5jcmVhdGVUZW1wbGF0ZUhlYWQoY29va2VkLCByYXcpO1xuICAobm9kZS5raW5kIGFzIHRzLlN5bnRheEtpbmQpID0gdHMuU3ludGF4S2luZC5UZW1wbGF0ZVRhaWw7XG4gIHJldHVybiBub2RlIGFzIHRzLlRlbXBsYXRlVGFpbDtcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIGdpdmVuIGBsZWFkaW5nQ29tbWVudHNgIHRvIHRoZSBgc3RhdGVtZW50YCBub2RlLlxuICpcbiAqIEBwYXJhbSBzdGF0ZW1lbnQgVGhlIHN0YXRlbWVudCB0aGF0IHdpbGwgaGF2ZSBjb21tZW50cyBhdHRhY2hlZC5cbiAqIEBwYXJhbSBsZWFkaW5nQ29tbWVudHMgVGhlIGNvbW1lbnRzIHRvIGF0dGFjaCB0byB0aGUgc3RhdGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoQ29tbWVudHMoc3RhdGVtZW50OiB0cy5TdGF0ZW1lbnQsIGxlYWRpbmdDb21tZW50czogTGVhZGluZ0NvbW1lbnRbXSk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGNvbW1lbnQgb2YgbGVhZGluZ0NvbW1lbnRzKSB7XG4gICAgY29uc3QgY29tbWVudEtpbmQgPSBjb21tZW50Lm11bHRpbGluZSA/IHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRzLlN5bnRheEtpbmQuU2luZ2xlTGluZUNvbW1lbnRUcml2aWE7XG4gICAgaWYgKGNvbW1lbnQubXVsdGlsaW5lKSB7XG4gICAgICB0cy5hZGRTeW50aGV0aWNMZWFkaW5nQ29tbWVudChcbiAgICAgICAgICBzdGF0ZW1lbnQsIGNvbW1lbnRLaW5kLCBjb21tZW50LnRvU3RyaW5nKCksIGNvbW1lbnQudHJhaWxpbmdOZXdsaW5lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGNvbW1lbnQudG9TdHJpbmcoKS5zcGxpdCgnXFxuJykpIHtcbiAgICAgICAgdHMuYWRkU3ludGhldGljTGVhZGluZ0NvbW1lbnQoc3RhdGVtZW50LCBjb21tZW50S2luZCwgbGluZSwgY29tbWVudC50cmFpbGluZ05ld2xpbmUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19
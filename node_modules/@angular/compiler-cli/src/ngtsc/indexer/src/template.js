(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/indexer/src/template", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler-cli/src/ngtsc/indexer/src/api"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTemplateIdentifiers = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var compiler_1 = require("@angular/compiler");
    var api_1 = require("@angular/compiler-cli/src/ngtsc/indexer/src/api");
    /**
     * Visits the AST of an Angular template syntax expression, finding interesting
     * entities (variable references, etc.). Creates an array of Entities found in
     * the expression, with the location of the Entities being relative to the
     * expression.
     *
     * Visiting `text {{prop}}` will return
     * `[TopLevelIdentifier {name: 'prop', span: {start: 7, end: 11}}]`.
     */
    var ExpressionVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(ExpressionVisitor, _super);
        function ExpressionVisitor(expressionStr, absoluteOffset, boundTemplate, targetToIdentifier) {
            var _this = _super.call(this) || this;
            _this.expressionStr = expressionStr;
            _this.absoluteOffset = absoluteOffset;
            _this.boundTemplate = boundTemplate;
            _this.targetToIdentifier = targetToIdentifier;
            _this.identifiers = [];
            return _this;
        }
        /**
         * Returns identifiers discovered in an expression.
         *
         * @param ast expression AST to visit
         * @param source expression AST source code
         * @param absoluteOffset absolute byte offset from start of the file to the start of the AST
         * source code.
         * @param boundTemplate bound target of the entire template, which can be used to query for the
         * entities expressions target.
         * @param targetToIdentifier closure converting a template target node to its identifier.
         */
        ExpressionVisitor.getIdentifiers = function (ast, source, absoluteOffset, boundTemplate, targetToIdentifier) {
            var visitor = new ExpressionVisitor(source, absoluteOffset, boundTemplate, targetToIdentifier);
            visitor.visit(ast);
            return visitor.identifiers;
        };
        ExpressionVisitor.prototype.visit = function (ast) {
            ast.visit(this);
        };
        ExpressionVisitor.prototype.visitMethodCall = function (ast, context) {
            this.visitIdentifier(ast, api_1.IdentifierKind.Method);
            _super.prototype.visitMethodCall.call(this, ast, context);
        };
        ExpressionVisitor.prototype.visitPropertyRead = function (ast, context) {
            this.visitIdentifier(ast, api_1.IdentifierKind.Property);
            _super.prototype.visitPropertyRead.call(this, ast, context);
        };
        ExpressionVisitor.prototype.visitPropertyWrite = function (ast, context) {
            this.visitIdentifier(ast, api_1.IdentifierKind.Property);
            _super.prototype.visitPropertyWrite.call(this, ast, context);
        };
        /**
         * Visits an identifier, adding it to the identifier store if it is useful for indexing.
         *
         * @param ast expression AST the identifier is in
         * @param kind identifier kind
         */
        ExpressionVisitor.prototype.visitIdentifier = function (ast, kind) {
            // The definition of a non-top-level property such as `bar` in `{{foo.bar}}` is currently
            // impossible to determine by an indexer and unsupported by the indexing module.
            // The indexing module also does not currently support references to identifiers declared in the
            // template itself, which have a non-null expression target.
            if (!(ast.receiver instanceof compiler_1.ImplicitReceiver)) {
                return;
            }
            // The source span of the requested AST starts at a location that is offset from the expression.
            var identifierStart = ast.sourceSpan.start - this.absoluteOffset;
            if (!this.expressionStr.substring(identifierStart).startsWith(ast.name)) {
                throw new Error("Impossible state: \"" + ast.name + "\" not found in \"" + this.expressionStr + "\" at location " + identifierStart);
            }
            // Join the relative position of the expression within a node with the absolute position
            // of the node to get the absolute position of the expression in the source code.
            var absoluteStart = this.absoluteOffset + identifierStart;
            var span = new api_1.AbsoluteSourceSpan(absoluteStart, absoluteStart + ast.name.length);
            var targetAst = this.boundTemplate.getExpressionTarget(ast);
            var target = targetAst ? this.targetToIdentifier(targetAst) : null;
            var identifier = {
                name: ast.name,
                span: span,
                kind: kind,
                target: target,
            };
            this.identifiers.push(identifier);
        };
        return ExpressionVisitor;
    }(compiler_1.RecursiveAstVisitor));
    /**
     * Visits the AST of a parsed Angular template. Discovers and stores
     * identifiers of interest, deferring to an `ExpressionVisitor` as needed.
     */
    var TemplateVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(TemplateVisitor, _super);
        /**
         * Creates a template visitor for a bound template target. The bound target can be used when
         * deferred to the expression visitor to get information about the target of an expression.
         *
         * @param boundTemplate bound template target
         */
        function TemplateVisitor(boundTemplate) {
            var _this = _super.call(this) || this;
            _this.boundTemplate = boundTemplate;
            // Identifiers of interest found in the template.
            _this.identifiers = new Set();
            // Map of targets in a template to their identifiers.
            _this.targetIdentifierCache = new Map();
            // Map of elements and templates to their identifiers.
            _this.elementAndTemplateIdentifierCache = new Map();
            return _this;
        }
        /**
         * Visits a node in the template.
         *
         * @param node node to visit
         */
        TemplateVisitor.prototype.visit = function (node) {
            node.visit(this);
        };
        TemplateVisitor.prototype.visitAll = function (nodes) {
            var _this = this;
            nodes.forEach(function (node) { return _this.visit(node); });
        };
        /**
         * Add an identifier for an HTML element and visit its children recursively.
         *
         * @param element
         */
        TemplateVisitor.prototype.visitElement = function (element) {
            var elementIdentifier = this.elementOrTemplateToIdentifier(element);
            this.identifiers.add(elementIdentifier);
            this.visitAll(element.references);
            this.visitAll(element.inputs);
            this.visitAll(element.attributes);
            this.visitAll(element.children);
            this.visitAll(element.outputs);
        };
        TemplateVisitor.prototype.visitTemplate = function (template) {
            var templateIdentifier = this.elementOrTemplateToIdentifier(template);
            this.identifiers.add(templateIdentifier);
            this.visitAll(template.variables);
            this.visitAll(template.attributes);
            this.visitAll(template.templateAttrs);
            this.visitAll(template.children);
            this.visitAll(template.references);
        };
        TemplateVisitor.prototype.visitBoundAttribute = function (attribute) {
            var _this = this;
            // If the bound attribute has no value, it cannot have any identifiers in the value expression.
            if (attribute.valueSpan === undefined) {
                return;
            }
            var identifiers = ExpressionVisitor.getIdentifiers(attribute.value, attribute.valueSpan.toString(), attribute.valueSpan.start.offset, this.boundTemplate, this.targetToIdentifier.bind(this));
            identifiers.forEach(function (id) { return _this.identifiers.add(id); });
        };
        TemplateVisitor.prototype.visitBoundEvent = function (attribute) {
            this.visitExpression(attribute.handler);
        };
        TemplateVisitor.prototype.visitBoundText = function (text) {
            this.visitExpression(text.value);
        };
        TemplateVisitor.prototype.visitReference = function (reference) {
            var referenceIdentifer = this.targetToIdentifier(reference);
            this.identifiers.add(referenceIdentifer);
        };
        TemplateVisitor.prototype.visitVariable = function (variable) {
            var variableIdentifier = this.targetToIdentifier(variable);
            this.identifiers.add(variableIdentifier);
        };
        /** Creates an identifier for a template element or template node. */
        TemplateVisitor.prototype.elementOrTemplateToIdentifier = function (node) {
            // If this node has already been seen, return the cached result.
            if (this.elementAndTemplateIdentifierCache.has(node)) {
                return this.elementAndTemplateIdentifierCache.get(node);
            }
            var name;
            var kind;
            if (node instanceof compiler_1.TmplAstTemplate) {
                name = node.tagName;
                kind = api_1.IdentifierKind.Template;
            }
            else {
                name = node.name;
                kind = api_1.IdentifierKind.Element;
            }
            var sourceSpan = node.startSourceSpan;
            // An element's or template's source span can be of the form `<element>`, `<element />`, or
            // `<element></element>`. Only the selector is interesting to the indexer, so the source is
            // searched for the first occurrence of the element (selector) name.
            var start = this.getStartLocation(name, sourceSpan);
            var absoluteSpan = new api_1.AbsoluteSourceSpan(start, start + name.length);
            // Record the nodes's attributes, which an indexer can later traverse to see if any of them
            // specify a used directive on the node.
            var attributes = node.attributes.map(function (_a) {
                var name = _a.name, sourceSpan = _a.sourceSpan;
                return {
                    name: name,
                    span: new api_1.AbsoluteSourceSpan(sourceSpan.start.offset, sourceSpan.end.offset),
                    kind: api_1.IdentifierKind.Attribute,
                };
            });
            var usedDirectives = this.boundTemplate.getDirectivesOfNode(node) || [];
            var identifier = {
                name: name,
                span: absoluteSpan,
                kind: kind,
                attributes: new Set(attributes),
                usedDirectives: new Set(usedDirectives.map(function (dir) {
                    return {
                        node: dir.ref.node,
                        selector: dir.selector,
                    };
                })),
            };
            this.elementAndTemplateIdentifierCache.set(node, identifier);
            return identifier;
        };
        /** Creates an identifier for a template reference or template variable target. */
        TemplateVisitor.prototype.targetToIdentifier = function (node) {
            // If this node has already been seen, return the cached result.
            if (this.targetIdentifierCache.has(node)) {
                return this.targetIdentifierCache.get(node);
            }
            var name = node.name, sourceSpan = node.sourceSpan;
            var start = this.getStartLocation(name, sourceSpan);
            var span = new api_1.AbsoluteSourceSpan(start, start + name.length);
            var identifier;
            if (node instanceof compiler_1.TmplAstReference) {
                // If the node is a reference, we care about its target. The target can be an element, a
                // template, a directive applied on a template or element (in which case the directive field
                // is non-null), or nothing at all.
                var refTarget = this.boundTemplate.getReferenceTarget(node);
                var target = null;
                if (refTarget) {
                    if (refTarget instanceof compiler_1.TmplAstElement || refTarget instanceof compiler_1.TmplAstTemplate) {
                        target = {
                            node: this.elementOrTemplateToIdentifier(refTarget),
                            directive: null,
                        };
                    }
                    else {
                        target = {
                            node: this.elementOrTemplateToIdentifier(refTarget.node),
                            directive: refTarget.directive.ref.node,
                        };
                    }
                }
                identifier = {
                    name: name,
                    span: span,
                    kind: api_1.IdentifierKind.Reference,
                    target: target,
                };
            }
            else {
                identifier = {
                    name: name,
                    span: span,
                    kind: api_1.IdentifierKind.Variable,
                };
            }
            this.targetIdentifierCache.set(node, identifier);
            return identifier;
        };
        /** Gets the start location of a string in a SourceSpan */
        TemplateVisitor.prototype.getStartLocation = function (name, context) {
            var localStr = context.toString();
            if (!localStr.includes(name)) {
                throw new Error("Impossible state: \"" + name + "\" not found in \"" + localStr + "\"");
            }
            return context.start.offset + localStr.indexOf(name);
        };
        /**
         * Visits a node's expression and adds its identifiers, if any, to the visitor's state.
         * Only ASTs with information about the expression source and its location are visited.
         *
         * @param node node whose expression to visit
         */
        TemplateVisitor.prototype.visitExpression = function (ast) {
            var _this = this;
            // Only include ASTs that have information about their source and absolute source spans.
            if (ast instanceof compiler_1.ASTWithSource && ast.source !== null) {
                // Make target to identifier mapping closure stateful to this visitor instance.
                var targetToIdentifier = this.targetToIdentifier.bind(this);
                var absoluteOffset = ast.sourceSpan.start;
                var identifiers = ExpressionVisitor.getIdentifiers(ast, ast.source, absoluteOffset, this.boundTemplate, targetToIdentifier);
                identifiers.forEach(function (id) { return _this.identifiers.add(id); });
            }
        };
        return TemplateVisitor;
    }(compiler_1.TmplAstRecursiveVisitor));
    /**
     * Traverses a template AST and builds identifiers discovered in it.
     *
     * @param boundTemplate bound template target, which can be used for querying expression targets.
     * @return identifiers in template
     */
    function getTemplateIdentifiers(boundTemplate) {
        var visitor = new TemplateVisitor(boundTemplate);
        if (boundTemplate.target.template !== undefined) {
            visitor.visitAll(boundTemplate.target.template);
        }
        return visitor.identifiers;
    }
    exports.getTemplateIdentifiers = getTemplateIdentifiers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2luZGV4ZXIvc3JjL3RlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw4Q0FBeVU7SUFDelUsdUVBQTROO0lBaUI1Tjs7Ozs7Ozs7T0FRRztJQUNIO1FBQWdDLDZDQUFtQjtRQUdqRCwyQkFDcUIsYUFBcUIsRUFBbUIsY0FBc0IsRUFDOUQsYUFBeUMsRUFDekMsa0JBQTREO1lBSGpGLFlBSUUsaUJBQU8sU0FDUjtZQUpvQixtQkFBYSxHQUFiLGFBQWEsQ0FBUTtZQUFtQixvQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUM5RCxtQkFBYSxHQUFiLGFBQWEsQ0FBNEI7WUFDekMsd0JBQWtCLEdBQWxCLGtCQUFrQixDQUEwQztZQUx4RSxpQkFBVyxHQUEyQixFQUFFLENBQUM7O1FBT2xELENBQUM7UUFFRDs7Ozs7Ozs7OztXQVVHO1FBQ0ksZ0NBQWMsR0FBckIsVUFDSSxHQUFRLEVBQUUsTUFBYyxFQUFFLGNBQXNCLEVBQUUsYUFBeUMsRUFDM0Ysa0JBQTREO1lBQzlELElBQU0sT0FBTyxHQUNULElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNyRixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQztRQUM3QixDQUFDO1FBRUQsaUNBQUssR0FBTCxVQUFNLEdBQVE7WUFDWixHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFRCwyQ0FBZSxHQUFmLFVBQWdCLEdBQWUsRUFBRSxPQUFXO1lBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFF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LENBQUMsQUExTkQsQ0FBOEIsa0NBQXVCLEdBME5wRDtJQUVEOzs7OztPQUtHO0lBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsYUFBeUM7UUFFOUUsSUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkQsSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDL0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQzdCLENBQUM7SUFQRCx3REFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBU1QsIEFTVFdpdGhTb3VyY2UsIEJvdW5kVGFyZ2V0LCBJbXBsaWNpdFJlY2VpdmVyLCBNZXRob2RDYWxsLCBQYXJzZVNvdXJjZVNwYW4sIFByb3BlcnR5UmVhZCwgUHJvcGVydHlXcml0ZSwgUmVjdXJzaXZlQXN0VmlzaXRvciwgVG1wbEFzdEJvdW5kQXR0cmlidXRlLCBUbXBsQXN0Qm91bmRFdmVudCwgVG1wbEFzdEJvdW5kVGV4dCwgVG1wbEFzdEVsZW1lbnQsIFRtcGxBc3ROb2RlLCBUbXBsQXN0UmVjdXJzaXZlVmlzaXRvciwgVG1wbEFzdFJlZmVyZW5jZSwgVG1wbEFzdFRlbXBsYXRlLCBUbXBsQXN0VmFyaWFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7QWJzb2x1dGVTb3VyY2VTcGFuLCBBdHRyaWJ1dGVJZGVudGlmaWVyLCBFbGVtZW50SWRlbnRpZmllciwgSWRlbnRpZmllcktpbmQsIE1ldGhvZElkZW50aWZpZXIsIFByb3BlcnR5SWRlbnRpZmllciwgUmVmZXJlbmNlSWRlbnRpZmllciwgVGVtcGxhdGVOb2RlSWRlbnRpZmllciwgVG9wTGV2ZWxJZGVudGlmaWVyLCBWYXJpYWJsZUlkZW50aWZpZXJ9IGZyb20gJy4vYXBpJztcbmltcG9ydCB7Q29tcG9uZW50TWV0YX0gZnJvbSAnLi9jb250ZXh0JztcblxuLyoqXG4gKiBBIHBhcnNlZCBub2RlIGluIGEgdGVtcGxhdGUsIHdoaWNoIG1heSBoYXZlIGEgbmFtZSAoaWYgaXQgaXMgYSBzZWxlY3Rvcikgb3JcbiAqIGJlIGFub255bW91cyAobGlrZSBhIHRleHQgc3BhbikuXG4gKi9cbmludGVyZmFjZSBIVE1MTm9kZSBleHRlbmRzIFRtcGxBc3ROb2RlIHtcbiAgdGFnTmFtZT86IHN0cmluZztcbiAgbmFtZT86IHN0cmluZztcbn1cblxudHlwZSBFeHByZXNzaW9uSWRlbnRpZmllciA9IFByb3BlcnR5SWRlbnRpZmllcnxNZXRob2RJZGVudGlmaWVyO1xudHlwZSBUbXBsVGFyZ2V0ID0gVG1wbEFzdFJlZmVyZW5jZXxUbXBsQXN0VmFyaWFibGU7XG50eXBlIFRhcmdldElkZW50aWZpZXIgPSBSZWZlcmVuY2VJZGVudGlmaWVyfFZhcmlhYmxlSWRlbnRpZmllcjtcbnR5cGUgVGFyZ2V0SWRlbnRpZmllck1hcCA9IE1hcDxUbXBsVGFyZ2V0LCBUYXJnZXRJZGVudGlmaWVyPjtcblxuLyoqXG4gKiBWaXNpdHMgdGhlIEFTVCBvZiBhbiBBbmd1bGFyIHRlbXBsYXRlIHN5bnRheCBleHByZXNzaW9uLCBmaW5kaW5nIGludGVyZXN0aW5nXG4gKiBlbnRpdGllcyAodmFyaWFibGUgcmVmZXJlbmNlcywgZXRjLikuIENyZWF0ZXMgYW4gYXJyYXkgb2YgRW50aXRpZXMgZm91bmQgaW5cbiAqIHRoZSBleHByZXNzaW9uLCB3aXRoIHRoZSBsb2NhdGlvbiBvZiB0aGUgRW50aXRpZXMgYmVpbmcgcmVsYXRpdmUgdG8gdGhlXG4gKiBleHByZXNzaW9uLlxuICpcbiAqIFZpc2l0aW5nIGB0ZXh0IHt7cHJvcH19YCB3aWxsIHJldHVyblxuICogYFtUb3BMZXZlbElkZW50aWZpZXIge25hbWU6ICdwcm9wJywgc3Bhbjoge3N0YXJ0OiA3LCBlbmQ6IDExfX1dYC5cbiAqL1xuY2xhc3MgRXhwcmVzc2lvblZpc2l0b3IgZXh0ZW5kcyBSZWN1cnNpdmVBc3RWaXNpdG9yIHtcbiAgcmVhZG9ubHkgaWRlbnRpZmllcnM6IEV4cHJlc3Npb25JZGVudGlmaWVyW10gPSBbXTtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBleHByZXNzaW9uU3RyOiBzdHJpbmcsIHByaXZhdGUgcmVhZG9ubHkgYWJzb2x1dGVPZmZzZXQ6IG51bWJlcixcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgYm91bmRUZW1wbGF0ZTogQm91bmRUYXJnZXQ8Q29tcG9uZW50TWV0YT4sXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IHRhcmdldFRvSWRlbnRpZmllcjogKHRhcmdldDogVG1wbFRhcmdldCkgPT4gVGFyZ2V0SWRlbnRpZmllcikge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBpZGVudGlmaWVycyBkaXNjb3ZlcmVkIGluIGFuIGV4cHJlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBhc3QgZXhwcmVzc2lvbiBBU1QgdG8gdmlzaXRcbiAgICogQHBhcmFtIHNvdXJjZSBleHByZXNzaW9uIEFTVCBzb3VyY2UgY29kZVxuICAgKiBAcGFyYW0gYWJzb2x1dGVPZmZzZXQgYWJzb2x1dGUgYnl0ZSBvZmZzZXQgZnJvbSBzdGFydCBvZiB0aGUgZmlsZSB0byB0aGUgc3RhcnQgb2YgdGhlIEFTVFxuICAgKiBzb3VyY2UgY29kZS5cbiAgICogQHBhcmFtIGJvdW5kVGVtcGxhdGUgYm91bmQgdGFyZ2V0IG9mIHRoZSBlbnRpcmUgdGVtcGxhdGUsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHF1ZXJ5IGZvciB0aGVcbiAgICogZW50aXRpZXMgZXhwcmVzc2lvbnMgdGFyZ2V0LlxuICAgKiBAcGFyYW0gdGFyZ2V0VG9JZGVudGlmaWVyIGNsb3N1cmUgY29udmVydGluZyBhIHRlbXBsYXRlIHRhcmdldCBub2RlIHRvIGl0cyBpZGVudGlmaWVyLlxuICAgKi9cbiAgc3RhdGljIGdldElkZW50aWZpZXJzKFxuICAgICAgYXN0OiBBU1QsIHNvdXJjZTogc3RyaW5nLCBhYnNvbHV0ZU9mZnNldDogbnVtYmVyLCBib3VuZFRlbXBsYXRlOiBCb3VuZFRhcmdldDxDb21wb25lbnRNZXRhPixcbiAgICAgIHRhcmdldFRvSWRlbnRpZmllcjogKHRhcmdldDogVG1wbFRhcmdldCkgPT4gVGFyZ2V0SWRlbnRpZmllcik6IFRvcExldmVsSWRlbnRpZmllcltdIHtcbiAgICBjb25zdCB2aXNpdG9yID1cbiAgICAgICAgbmV3IEV4cHJlc3Npb25WaXNpdG9yKHNvdXJjZSwgYWJzb2x1dGVPZmZzZXQsIGJvdW5kVGVtcGxhdGUsIHRhcmdldFRvSWRlbnRpZmllcik7XG4gICAgdmlzaXRvci52aXNpdChhc3QpO1xuICAgIHJldHVybiB2aXNpdG9yLmlkZW50aWZpZXJzO1xuICB9XG5cbiAgdmlzaXQoYXN0OiBBU1QpIHtcbiAgICBhc3QudmlzaXQodGhpcyk7XG4gIH1cblxuICB2aXNpdE1ldGhvZENhbGwoYXN0OiBNZXRob2RDYWxsLCBjb250ZXh0OiB7fSkge1xuICAgIHRoaXMudmlzaXRJZGVudGlmaWVyKGFzdCwgSWRlbnRpZmllcktpbmQuTWV0aG9kKTtcbiAgICBzdXBlci52aXNpdE1ldGhvZENhbGwoYXN0LCBjb250ZXh0KTtcbiAgfVxuXG4gIHZpc2l0UHJvcGVydHlSZWFkKGFzdDogUHJvcGVydHlSZWFkLCBjb250ZXh0OiB7fSkge1xuICAgIHRoaXMudmlzaXRJZGVudGlmaWVyKGFzdCwgSWRlbnRpZmllcktpbmQuUHJvcGVydHkpO1xuICAgIHN1cGVyLnZpc2l0UHJvcGVydHlSZWFkKGFzdCwgY29udGV4dCk7XG4gIH1cblxuICB2aXNpdFByb3BlcnR5V3JpdGUoYXN0OiBQcm9wZXJ0eVdyaXRlLCBjb250ZXh0OiB7fSkge1xuICAgIHRoaXMudmlzaXRJZGVudGlmaWVyKGFzdCwgSWRlbnRpZmllcktpbmQuUHJvcGVydHkpO1xuICAgIHN1cGVyLnZpc2l0UHJvcGVydHlXcml0ZShhc3QsIGNvbnRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyBhbiBpZGVudGlmaWVyLCBhZGRpbmcgaXQgdG8gdGhlIGlkZW50aWZpZXIgc3RvcmUgaWYgaXQgaXMgdXNlZnVsIGZvciBpbmRleGluZy5cbiAgICpcbiAgICogQHBhcmFtIGFzdCBleHByZXNzaW9uIEFTVCB0aGUgaWRlbnRpZmllciBpcyBpblxuICAgKiBAcGFyYW0ga2luZCBpZGVudGlmaWVyIGtpbmRcbiAgICovXG4gIHByaXZhdGUgdmlzaXRJZGVudGlmaWVyKFxuICAgICAgYXN0OiBBU1Qme25hbWU6IHN0cmluZywgcmVjZWl2ZXI6IEFTVH0sIGtpbmQ6IEV4cHJlc3Npb25JZGVudGlmaWVyWydraW5kJ10pIHtcbiAgICAvLyBUaGUgZGVmaW5pdGlvbiBvZiBhIG5vbi10b3AtbGV2ZWwgcHJvcGVydHkgc3VjaCBhcyBgYmFyYCBpbiBge3tmb28uYmFyfX1gIGlzIGN1cnJlbnRseVxuICAgIC8vIGltcG9zc2libGUgdG8gZGV0ZXJtaW5lIGJ5IGFuIGluZGV4ZXIgYW5kIHVuc3VwcG9ydGVkIGJ5IHRoZSBpbmRleGluZyBtb2R1bGUuXG4gICAgLy8gVGhlIGluZGV4aW5nIG1vZHVsZSBhbHNvIGRvZXMgbm90IGN1cnJlbnRseSBzdXBwb3J0IHJlZmVyZW5jZXMgdG8gaWRlbnRpZmllcnMgZGVjbGFyZWQgaW4gdGhlXG4gICAgLy8gdGVtcGxhdGUgaXRzZWxmLCB3aGljaCBoYXZlIGEgbm9uLW51bGwgZXhwcmVzc2lvbiB0YXJnZXQuXG4gICAgaWYgKCEoYXN0LnJlY2VpdmVyIGluc3RhbmNlb2YgSW1wbGljaXRSZWNlaXZlcikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgc291cmNlIHNwYW4gb2YgdGhlIHJlcXVlc3RlZCBBU1Qgc3RhcnRzIGF0IGEgbG9jYXRpb24gdGhhdCBpcyBvZmZzZXQgZnJvbSB0aGUgZXhwcmVzc2lvbi5cbiAgICBjb25zdCBpZGVudGlmaWVyU3RhcnQgPSBhc3Quc291cmNlU3Bhbi5zdGFydCAtIHRoaXMuYWJzb2x1dGVPZmZzZXQ7XG4gICAgaWYgKCF0aGlzLmV4cHJlc3Npb25TdHIuc3Vic3RyaW5nKGlkZW50aWZpZXJTdGFydCkuc3RhcnRzV2l0aChhc3QubmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW1wb3NzaWJsZSBzdGF0ZTogXCIke2FzdC5uYW1lfVwiIG5vdCBmb3VuZCBpbiBcIiR7XG4gICAgICAgICAgdGhpcy5leHByZXNzaW9uU3RyfVwiIGF0IGxvY2F0aW9uICR7aWRlbnRpZmllclN0YXJ0fWApO1xuICAgIH1cblxuICAgIC8vIEpvaW4gdGhlIHJlbGF0aXZlIHBvc2l0aW9uIG9mIHRoZSBleHByZXNzaW9uIHdpdGhpbiBhIG5vZGUgd2l0aCB0aGUgYWJzb2x1dGUgcG9zaXRpb25cbiAgICAvLyBvZiB0aGUgbm9kZSB0byBnZXQgdGhlIGFic29sdXRlIHBvc2l0aW9uIG9mIHRoZSBleHByZXNzaW9uIGluIHRoZSBzb3VyY2UgY29kZS5cbiAgICBjb25zdCBhYnNvbHV0ZVN0YXJ0ID0gdGhpcy5hYnNvbHV0ZU9mZnNldCArIGlkZW50aWZpZXJTdGFydDtcbiAgICBjb25zdCBzcGFuID0gbmV3IEFic29sdXRlU291cmNlU3BhbihhYnNvbHV0ZVN0YXJ0LCBhYnNvbHV0ZVN0YXJ0ICsgYXN0Lm5hbWUubGVuZ3RoKTtcblxuICAgIGNvbnN0IHRhcmdldEFzdCA9IHRoaXMuYm91bmRUZW1wbGF0ZS5nZXRFeHByZXNzaW9uVGFyZ2V0KGFzdCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0QXN0ID8gdGhpcy50YXJnZXRUb0lkZW50aWZpZXIodGFyZ2V0QXN0KSA6IG51bGw7XG4gICAgY29uc3QgaWRlbnRpZmllciA9IHtcbiAgICAgIG5hbWU6IGFzdC5uYW1lLFxuICAgICAgc3BhbixcbiAgICAgIGtpbmQsXG4gICAgICB0YXJnZXQsXG4gICAgfSBhcyBFeHByZXNzaW9uSWRlbnRpZmllcjtcblxuICAgIHRoaXMuaWRlbnRpZmllcnMucHVzaChpZGVudGlmaWVyKTtcbiAgfVxufVxuXG4vKipcbiAqIFZpc2l0cyB0aGUgQVNUIG9mIGEgcGFyc2VkIEFuZ3VsYXIgdGVtcGxhdGUuIERpc2NvdmVycyBhbmQgc3RvcmVzXG4gKiBpZGVudGlmaWVycyBvZiBpbnRlcmVzdCwgZGVmZXJyaW5nIHRvIGFuIGBFeHByZXNzaW9uVmlzaXRvcmAgYXMgbmVlZGVkLlxuICovXG5jbGFzcyBUZW1wbGF0ZVZpc2l0b3IgZXh0ZW5kcyBUbXBsQXN0UmVjdXJzaXZlVmlzaXRvciB7XG4gIC8vIElkZW50aWZpZXJzIG9mIGludGVyZXN0IGZvdW5kIGluIHRoZSB0ZW1wbGF0ZS5cbiAgcmVhZG9ubHkgaWRlbnRpZmllcnMgPSBuZXcgU2V0PFRvcExldmVsSWRlbnRpZmllcj4oKTtcblxuICAvLyBNYXAgb2YgdGFyZ2V0cyBpbiBhIHRlbXBsYXRlIHRvIHRoZWlyIGlkZW50aWZpZXJzLlxuICBwcml2YXRlIHJlYWRvbmx5IHRhcmdldElkZW50aWZpZXJDYWNoZTogVGFyZ2V0SWRlbnRpZmllck1hcCA9IG5ldyBNYXAoKTtcblxuICAvLyBNYXAgb2YgZWxlbWVudHMgYW5kIHRlbXBsYXRlcyB0byB0aGVpciBpZGVudGlmaWVycy5cbiAgcHJpdmF0ZSByZWFkb25seSBlbGVtZW50QW5kVGVtcGxhdGVJZGVudGlmaWVyQ2FjaGUgPVxuICAgICAgbmV3IE1hcDxUbXBsQXN0RWxlbWVudHxUbXBsQXN0VGVtcGxhdGUsIEVsZW1lbnRJZGVudGlmaWVyfFRlbXBsYXRlTm9kZUlkZW50aWZpZXI+KCk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB0ZW1wbGF0ZSB2aXNpdG9yIGZvciBhIGJvdW5kIHRlbXBsYXRlIHRhcmdldC4gVGhlIGJvdW5kIHRhcmdldCBjYW4gYmUgdXNlZCB3aGVuXG4gICAqIGRlZmVycmVkIHRvIHRoZSBleHByZXNzaW9uIHZpc2l0b3IgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSB0YXJnZXQgb2YgYW4gZXhwcmVzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIGJvdW5kVGVtcGxhdGUgYm91bmQgdGVtcGxhdGUgdGFyZ2V0XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGJvdW5kVGVtcGxhdGU6IEJvdW5kVGFyZ2V0PENvbXBvbmVudE1ldGE+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWaXNpdHMgYSBub2RlIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIG5vZGUgbm9kZSB0byB2aXNpdFxuICAgKi9cbiAgdmlzaXQobm9kZTogSFRNTE5vZGUpIHtcbiAgICBub2RlLnZpc2l0KHRoaXMpO1xuICB9XG5cbiAgdmlzaXRBbGwobm9kZXM6IFRtcGxBc3ROb2RlW10pIHtcbiAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4gdGhpcy52aXNpdChub2RlKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGlkZW50aWZpZXIgZm9yIGFuIEhUTUwgZWxlbWVudCBhbmQgdmlzaXQgaXRzIGNoaWxkcmVuIHJlY3Vyc2l2ZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudFxuICAgKi9cbiAgdmlzaXRFbGVtZW50KGVsZW1lbnQ6IFRtcGxBc3RFbGVtZW50KSB7XG4gICAgY29uc3QgZWxlbWVudElkZW50aWZpZXIgPSB0aGlzLmVsZW1lbnRPclRlbXBsYXRlVG9JZGVudGlmaWVyKGVsZW1lbnQpO1xuXG4gICAgdGhpcy5pZGVudGlmaWVycy5hZGQoZWxlbWVudElkZW50aWZpZXIpO1xuXG4gICAgdGhpcy52aXNpdEFsbChlbGVtZW50LnJlZmVyZW5jZXMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5pbnB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnZpc2l0QWxsKGVsZW1lbnQuY2hpbGRyZW4pO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5vdXRwdXRzKTtcbiAgfVxuICB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBUbXBsQXN0VGVtcGxhdGUpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZUlkZW50aWZpZXIgPSB0aGlzLmVsZW1lbnRPclRlbXBsYXRlVG9JZGVudGlmaWVyKHRlbXBsYXRlKTtcblxuICAgIHRoaXMuaWRlbnRpZmllcnMuYWRkKHRlbXBsYXRlSWRlbnRpZmllcik7XG5cbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLnZhcmlhYmxlcyk7XG4gICAgdGhpcy52aXNpdEFsbCh0ZW1wbGF0ZS5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLnRlbXBsYXRlQXR0cnMpO1xuICAgIHRoaXMudmlzaXRBbGwodGVtcGxhdGUuY2hpbGRyZW4pO1xuICAgIHRoaXMudmlzaXRBbGwodGVtcGxhdGUucmVmZXJlbmNlcyk7XG4gIH1cbiAgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZSkge1xuICAgIC8vIElmIHRoZSBib3VuZCBhdHRyaWJ1dGUgaGFzIG5vIHZhbHVlLCBpdCBjYW5ub3QgaGF2ZSBhbnkgaWRlbnRpZmllcnMgaW4gdGhlIHZhbHVlIGV4cHJlc3Npb24uXG4gICAgaWYgKGF0dHJpYnV0ZS52YWx1ZVNwYW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGlkZW50aWZpZXJzID0gRXhwcmVzc2lvblZpc2l0b3IuZ2V0SWRlbnRpZmllcnMoXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZSwgYXR0cmlidXRlLnZhbHVlU3Bhbi50b1N0cmluZygpLCBhdHRyaWJ1dGUudmFsdWVTcGFuLnN0YXJ0Lm9mZnNldCxcbiAgICAgICAgdGhpcy5ib3VuZFRlbXBsYXRlLCB0aGlzLnRhcmdldFRvSWRlbnRpZmllci5iaW5kKHRoaXMpKTtcbiAgICBpZGVudGlmaWVycy5mb3JFYWNoKGlkID0+IHRoaXMuaWRlbnRpZmllcnMuYWRkKGlkKSk7XG4gIH1cbiAgdmlzaXRCb3VuZEV2ZW50KGF0dHJpYnV0ZTogVG1wbEFzdEJvdW5kRXZlbnQpIHtcbiAgICB0aGlzLnZpc2l0RXhwcmVzc2lvbihhdHRyaWJ1dGUuaGFuZGxlcik7XG4gIH1cbiAgdmlzaXRCb3VuZFRleHQodGV4dDogVG1wbEFzdEJvdW5kVGV4dCkge1xuICAgIHRoaXMudmlzaXRFeHByZXNzaW9uKHRleHQudmFsdWUpO1xuICB9XG4gIHZpc2l0UmVmZXJlbmNlKHJlZmVyZW5jZTogVG1wbEFzdFJlZmVyZW5jZSkge1xuICAgIGNvbnN0IHJlZmVyZW5jZUlkZW50aWZlciA9IHRoaXMudGFyZ2V0VG9JZGVudGlmaWVyKHJlZmVyZW5jZSk7XG5cbiAgICB0aGlzLmlkZW50aWZpZXJzLmFkZChyZWZlcmVuY2VJZGVudGlmZXIpO1xuICB9XG4gIHZpc2l0VmFyaWFibGUodmFyaWFibGU6IFRtcGxBc3RWYXJpYWJsZSkge1xuICAgIGNvbnN0IHZhcmlhYmxlSWRlbnRpZmllciA9IHRoaXMudGFyZ2V0VG9JZGVudGlmaWVyKHZhcmlhYmxlKTtcblxuICAgIHRoaXMuaWRlbnRpZmllcnMuYWRkKHZhcmlhYmxlSWRlbnRpZmllcik7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBpZGVudGlmaWVyIGZvciBhIHRlbXBsYXRlIGVsZW1lbnQgb3IgdGVtcGxhdGUgbm9kZS4gKi9cbiAgcHJpdmF0ZSBlbGVtZW50T3JUZW1wbGF0ZVRvSWRlbnRpZmllcihub2RlOiBUbXBsQXN0RWxlbWVudHxUbXBsQXN0VGVtcGxhdGUpOiBFbGVtZW50SWRlbnRpZmllclxuICAgICAgfFRlbXBsYXRlTm9kZUlkZW50aWZpZXIge1xuICAgIC8vIElmIHRoaXMgbm9kZSBoYXMgYWxyZWFkeSBiZWVuIHNlZW4sIHJldHVybiB0aGUgY2FjaGVkIHJlc3VsdC5cbiAgICBpZiAodGhpcy5lbGVtZW50QW5kVGVtcGxhdGVJZGVudGlmaWVyQ2FjaGUuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5lbGVtZW50QW5kVGVtcGxhdGVJZGVudGlmaWVyQ2FjaGUuZ2V0KG5vZGUpITtcbiAgICB9XG5cbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGxldCBraW5kOiBJZGVudGlmaWVyS2luZC5FbGVtZW50fElkZW50aWZpZXJLaW5kLlRlbXBsYXRlO1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgVG1wbEFzdFRlbXBsYXRlKSB7XG4gICAgICBuYW1lID0gbm9kZS50YWdOYW1lO1xuICAgICAga2luZCA9IElkZW50aWZpZXJLaW5kLlRlbXBsYXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbm9kZS5uYW1lO1xuICAgICAga2luZCA9IElkZW50aWZpZXJLaW5kLkVsZW1lbnQ7XG4gICAgfVxuICAgIGNvbnN0IHNvdXJjZVNwYW4gPSBub2RlLnN0YXJ0U291cmNlU3BhbjtcbiAgICAvLyBBbiBlbGVtZW50J3Mgb3IgdGVtcGxhdGUncyBzb3VyY2Ugc3BhbiBjYW4gYmUgb2YgdGhlIGZvcm0gYDxlbGVtZW50PmAsIGA8ZWxlbWVudCAvPmAsIG9yXG4gICAgLy8gYDxlbGVtZW50PjwvZWxlbWVudD5gLiBPbmx5IHRoZSBzZWxlY3RvciBpcyBpbnRlcmVzdGluZyB0byB0aGUgaW5kZXhlciwgc28gdGhlIHNvdXJjZSBpc1xuICAgIC8vIHNlYXJjaGVkIGZvciB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGUgZWxlbWVudCAoc2VsZWN0b3IpIG5hbWUuXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmdldFN0YXJ0TG9jYXRpb24obmFtZSwgc291cmNlU3Bhbik7XG4gICAgY29uc3QgYWJzb2x1dGVTcGFuID0gbmV3IEFic29sdXRlU291cmNlU3BhbihzdGFydCwgc3RhcnQgKyBuYW1lLmxlbmd0aCk7XG5cbiAgICAvLyBSZWNvcmQgdGhlIG5vZGVzJ3MgYXR0cmlidXRlcywgd2hpY2ggYW4gaW5kZXhlciBjYW4gbGF0ZXIgdHJhdmVyc2UgdG8gc2VlIGlmIGFueSBvZiB0aGVtXG4gICAgLy8gc3BlY2lmeSBhIHVzZWQgZGlyZWN0aXZlIG9uIHRoZSBub2RlLlxuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXMubWFwKCh7bmFtZSwgc291cmNlU3Bhbn0pOiBBdHRyaWJ1dGVJZGVudGlmaWVyID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHNwYW46IG5ldyBBYnNvbHV0ZVNvdXJjZVNwYW4oc291cmNlU3Bhbi5zdGFydC5vZmZzZXQsIHNvdXJjZVNwYW4uZW5kLm9mZnNldCksXG4gICAgICAgIGtpbmQ6IElkZW50aWZpZXJLaW5kLkF0dHJpYnV0ZSxcbiAgICAgIH07XG4gICAgfSk7XG4gICAgY29uc3QgdXNlZERpcmVjdGl2ZXMgPSB0aGlzLmJvdW5kVGVtcGxhdGUuZ2V0RGlyZWN0aXZlc09mTm9kZShub2RlKSB8fCBbXTtcblxuICAgIGNvbnN0IGlkZW50aWZpZXIgPSB7XG4gICAgICBuYW1lLFxuICAgICAgc3BhbjogYWJzb2x1dGVTcGFuLFxuICAgICAga2luZCxcbiAgICAgIGF0dHJpYnV0ZXM6IG5ldyBTZXQoYXR0cmlidXRlcyksXG4gICAgICB1c2VkRGlyZWN0aXZlczogbmV3IFNldCh1c2VkRGlyZWN0aXZlcy5tYXAoZGlyID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBkaXIucmVmLm5vZGUsXG4gICAgICAgICAgc2VsZWN0b3I6IGRpci5zZWxlY3RvcixcbiAgICAgICAgfTtcbiAgICAgIH0pKSxcbiAgICAgIC8vIGNhc3QgYi9jIHByZS1UeXBlU2NyaXB0IDMuNSB1bmlvbnMgYXJlbid0IHdlbGwgZGlzY3JpbWluYXRlZFxuICAgIH0gYXMgRWxlbWVudElkZW50aWZpZXIgfFxuICAgICAgICBUZW1wbGF0ZU5vZGVJZGVudGlmaWVyO1xuXG4gICAgdGhpcy5lbGVtZW50QW5kVGVtcGxhdGVJZGVudGlmaWVyQ2FjaGUuc2V0KG5vZGUsIGlkZW50aWZpZXIpO1xuICAgIHJldHVybiBpZGVudGlmaWVyO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gaWRlbnRpZmllciBmb3IgYSB0ZW1wbGF0ZSByZWZlcmVuY2Ugb3IgdGVtcGxhdGUgdmFyaWFibGUgdGFyZ2V0LiAqL1xuICBwcml2YXRlIHRhcmdldFRvSWRlbnRpZmllcihub2RlOiBUbXBsQXN0UmVmZXJlbmNlfFRtcGxBc3RWYXJpYWJsZSk6IFRhcmdldElkZW50aWZpZXIge1xuICAgIC8vIElmIHRoaXMgbm9kZSBoYXMgYWxyZWFkeSBiZWVuIHNlZW4sIHJldHVybiB0aGUgY2FjaGVkIHJlc3VsdC5cbiAgICBpZiAodGhpcy50YXJnZXRJZGVudGlmaWVyQ2FjaGUuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy50YXJnZXRJZGVudGlmaWVyQ2FjaGUuZ2V0KG5vZGUpITtcbiAgICB9XG5cbiAgICBjb25zdCB7bmFtZSwgc291cmNlU3Bhbn0gPSBub2RlO1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5nZXRTdGFydExvY2F0aW9uKG5hbWUsIHNvdXJjZVNwYW4pO1xuICAgIGNvbnN0IHNwYW4gPSBuZXcgQWJzb2x1dGVTb3VyY2VTcGFuKHN0YXJ0LCBzdGFydCArIG5hbWUubGVuZ3RoKTtcbiAgICBsZXQgaWRlbnRpZmllcjogUmVmZXJlbmNlSWRlbnRpZmllcnxWYXJpYWJsZUlkZW50aWZpZXI7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBUbXBsQXN0UmVmZXJlbmNlKSB7XG4gICAgICAvLyBJZiB0aGUgbm9kZSBpcyBhIHJlZmVyZW5jZSwgd2UgY2FyZSBhYm91dCBpdHMgdGFyZ2V0LiBUaGUgdGFyZ2V0IGNhbiBiZSBhbiBlbGVtZW50LCBhXG4gICAgICAvLyB0ZW1wbGF0ZSwgYSBkaXJlY3RpdmUgYXBwbGllZCBvbiBhIHRlbXBsYXRlIG9yIGVsZW1lbnQgKGluIHdoaWNoIGNhc2UgdGhlIGRpcmVjdGl2ZSBmaWVsZFxuICAgICAgLy8gaXMgbm9uLW51bGwpLCBvciBub3RoaW5nIGF0IGFsbC5cbiAgICAgIGNvbnN0IHJlZlRhcmdldCA9IHRoaXMuYm91bmRUZW1wbGF0ZS5nZXRSZWZlcmVuY2VUYXJnZXQobm9kZSk7XG4gICAgICBsZXQgdGFyZ2V0ID0gbnVsbDtcbiAgICAgIGlmIChyZWZUYXJnZXQpIHtcbiAgICAgICAgaWYgKHJlZlRhcmdldCBpbnN0YW5jZW9mIFRtcGxBc3RFbGVtZW50IHx8IHJlZlRhcmdldCBpbnN0YW5jZW9mIFRtcGxBc3RUZW1wbGF0ZSkge1xuICAgICAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgICAgIG5vZGU6IHRoaXMuZWxlbWVudE9yVGVtcGxhdGVUb0lkZW50aWZpZXIocmVmVGFyZ2V0KSxcbiAgICAgICAgICAgIGRpcmVjdGl2ZTogbnVsbCxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRhcmdldCA9IHtcbiAgICAgICAgICAgIG5vZGU6IHRoaXMuZWxlbWVudE9yVGVtcGxhdGVUb0lkZW50aWZpZXIocmVmVGFyZ2V0Lm5vZGUpLFxuICAgICAgICAgICAgZGlyZWN0aXZlOiByZWZUYXJnZXQuZGlyZWN0aXZlLnJlZi5ub2RlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWRlbnRpZmllciA9IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgc3BhbixcbiAgICAgICAga2luZDogSWRlbnRpZmllcktpbmQuUmVmZXJlbmNlLFxuICAgICAgICB0YXJnZXQsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZGVudGlmaWVyID0ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBzcGFuLFxuICAgICAgICBraW5kOiBJZGVudGlmaWVyS2luZC5WYXJpYWJsZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy50YXJnZXRJZGVudGlmaWVyQ2FjaGUuc2V0KG5vZGUsIGlkZW50aWZpZXIpO1xuICAgIHJldHVybiBpZGVudGlmaWVyO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHN0YXJ0IGxvY2F0aW9uIG9mIGEgc3RyaW5nIGluIGEgU291cmNlU3BhbiAqL1xuICBwcml2YXRlIGdldFN0YXJ0TG9jYXRpb24obmFtZTogc3RyaW5nLCBjb250ZXh0OiBQYXJzZVNvdXJjZVNwYW4pOiBudW1iZXIge1xuICAgIGNvbnN0IGxvY2FsU3RyID0gY29udGV4dC50b1N0cmluZygpO1xuICAgIGlmICghbG9jYWxTdHIuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW1wb3NzaWJsZSBzdGF0ZTogXCIke25hbWV9XCIgbm90IGZvdW5kIGluIFwiJHtsb2NhbFN0cn1cImApO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dC5zdGFydC5vZmZzZXQgKyBsb2NhbFN0ci5pbmRleE9mKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyBhIG5vZGUncyBleHByZXNzaW9uIGFuZCBhZGRzIGl0cyBpZGVudGlmaWVycywgaWYgYW55LCB0byB0aGUgdmlzaXRvcidzIHN0YXRlLlxuICAgKiBPbmx5IEFTVHMgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZXhwcmVzc2lvbiBzb3VyY2UgYW5kIGl0cyBsb2NhdGlvbiBhcmUgdmlzaXRlZC5cbiAgICpcbiAgICogQHBhcmFtIG5vZGUgbm9kZSB3aG9zZSBleHByZXNzaW9uIHRvIHZpc2l0XG4gICAqL1xuICBwcml2YXRlIHZpc2l0RXhwcmVzc2lvbihhc3Q6IEFTVCkge1xuICAgIC8vIE9ubHkgaW5jbHVkZSBBU1RzIHRoYXQgaGF2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVpciBzb3VyY2UgYW5kIGFic29sdXRlIHNvdXJjZSBzcGFucy5cbiAgICBpZiAoYXN0IGluc3RhbmNlb2YgQVNUV2l0aFNvdXJjZSAmJiBhc3Quc291cmNlICE9PSBudWxsKSB7XG4gICAgICAvLyBNYWtlIHRhcmdldCB0byBpZGVudGlmaWVyIG1hcHBpbmcgY2xvc3VyZSBzdGF0ZWZ1bCB0byB0aGlzIHZpc2l0b3IgaW5zdGFuY2UuXG4gICAgICBjb25zdCB0YXJnZXRUb0lkZW50aWZpZXIgPSB0aGlzLnRhcmdldFRvSWRlbnRpZmllci5iaW5kKHRoaXMpO1xuICAgICAgY29uc3QgYWJzb2x1dGVPZmZzZXQgPSBhc3Quc291cmNlU3Bhbi5zdGFydDtcbiAgICAgIGNvbnN0IGlkZW50aWZpZXJzID0gRXhwcmVzc2lvblZpc2l0b3IuZ2V0SWRlbnRpZmllcnMoXG4gICAgICAgICAgYXN0LCBhc3Quc291cmNlLCBhYnNvbHV0ZU9mZnNldCwgdGhpcy5ib3VuZFRlbXBsYXRlLCB0YXJnZXRUb0lkZW50aWZpZXIpO1xuICAgICAgaWRlbnRpZmllcnMuZm9yRWFjaChpZCA9PiB0aGlzLmlkZW50aWZpZXJzLmFkZChpZCkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBhIHRlbXBsYXRlIEFTVCBhbmQgYnVpbGRzIGlkZW50aWZpZXJzIGRpc2NvdmVyZWQgaW4gaXQuXG4gKlxuICogQHBhcmFtIGJvdW5kVGVtcGxhdGUgYm91bmQgdGVtcGxhdGUgdGFyZ2V0LCB3aGljaCBjYW4gYmUgdXNlZCBmb3IgcXVlcnlpbmcgZXhwcmVzc2lvbiB0YXJnZXRzLlxuICogQHJldHVybiBpZGVudGlmaWVycyBpbiB0ZW1wbGF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVtcGxhdGVJZGVudGlmaWVycyhib3VuZFRlbXBsYXRlOiBCb3VuZFRhcmdldDxDb21wb25lbnRNZXRhPik6XG4gICAgU2V0PFRvcExldmVsSWRlbnRpZmllcj4ge1xuICBjb25zdCB2aXNpdG9yID0gbmV3IFRlbXBsYXRlVmlzaXRvcihib3VuZFRlbXBsYXRlKTtcbiAgaWYgKGJvdW5kVGVtcGxhdGUudGFyZ2V0LnRlbXBsYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2aXNpdG9yLnZpc2l0QWxsKGJvdW5kVGVtcGxhdGUudGFyZ2V0LnRlbXBsYXRlKTtcbiAgfVxuICByZXR1cm4gdmlzaXRvci5pZGVudGlmaWVycztcbn1cbiJdfQ==
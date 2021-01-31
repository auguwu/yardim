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
        define("@angular/compiler/src/constant_pool", ["require", "exports", "tslib", "@angular/compiler/src/output/output_ast", "@angular/compiler/src/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConstantPool = void 0;
    var tslib_1 = require("tslib");
    var o = require("@angular/compiler/src/output/output_ast");
    var util_1 = require("@angular/compiler/src/util");
    var CONSTANT_PREFIX = '_c';
    /**
     * `ConstantPool` tries to reuse literal factories when two or more literals are identical.
     * We determine whether literals are identical by creating a key out of their AST using the
     * `KeyVisitor`. This constant is used to replace dynamic expressions which can't be safely
     * converted into a key. E.g. given an expression `{foo: bar()}`, since we don't know what
     * the result of `bar` will be, we create a key that looks like `{foo: <unknown>}`. Note
     * that we use a variable, rather than something like `null` in order to avoid collisions.
     */
    var UNKNOWN_VALUE_KEY = o.variable('<unknown>');
    /**
     * Context to use when producing a key.
     *
     * This ensures we see the constant not the reference variable when producing
     * a key.
     */
    var KEY_CONTEXT = {};
    /**
     * Generally all primitive values are excluded from the `ConstantPool`, but there is an exclusion
     * for strings that reach a certain length threshold. This constant defines the length threshold for
     * strings.
     */
    var POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS = 50;
    /**
     * A node that is a place-holder that allows the node to be replaced when the actual
     * node is known.
     *
     * This allows the constant pool to change an expression from a direct reference to
     * a constant to a shared constant. It returns a fix-up node that is later allowed to
     * change the referenced expression.
     */
    var FixupExpression = /** @class */ (function (_super) {
        tslib_1.__extends(FixupExpression, _super);
        function FixupExpression(resolved) {
            var _this = _super.call(this, resolved.type) || this;
            _this.resolved = resolved;
            _this.original = resolved;
            return _this;
        }
        FixupExpression.prototype.visitExpression = function (visitor, context) {
            if (context === KEY_CONTEXT) {
                // When producing a key we want to traverse the constant not the
                // variable used to refer to it.
                return this.original.visitExpression(visitor, context);
            }
            else {
                return this.resolved.visitExpression(visitor, context);
            }
        };
        FixupExpression.prototype.isEquivalent = function (e) {
            return e instanceof FixupExpression && this.resolved.isEquivalent(e.resolved);
        };
        FixupExpression.prototype.isConstant = function () {
            return true;
        };
        FixupExpression.prototype.fixup = function (expression) {
            this.resolved = expression;
            this.shared = true;
        };
        return FixupExpression;
    }(o.Expression));
    /**
     * A constant pool allows a code emitter to share constant in an output context.
     *
     * The constant pool also supports sharing access to ivy definitions references.
     */
    var ConstantPool = /** @class */ (function () {
        function ConstantPool(isClosureCompilerEnabled) {
            if (isClosureCompilerEnabled === void 0) { isClosureCompilerEnabled = false; }
            this.isClosureCompilerEnabled = isClosureCompilerEnabled;
            this.statements = [];
            this.literals = new Map();
            this.literalFactories = new Map();
            this.injectorDefinitions = new Map();
            this.directiveDefinitions = new Map();
            this.componentDefinitions = new Map();
            this.pipeDefinitions = new Map();
            this.nextNameIndex = 0;
        }
        ConstantPool.prototype.getConstLiteral = function (literal, forceShared) {
            if ((literal instanceof o.LiteralExpr && !isLongStringLiteral(literal)) ||
                literal instanceof FixupExpression) {
                // Do no put simple literals into the constant pool or try to produce a constant for a
                // reference to a constant.
                return literal;
            }
            var key = this.keyOf(literal);
            var fixup = this.literals.get(key);
            var newValue = false;
            if (!fixup) {
                fixup = new FixupExpression(literal);
                this.literals.set(key, fixup);
                newValue = true;
            }
            if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
                // Replace the expression with a variable
                var name_1 = this.freshName();
                var definition = void 0;
                var usage = void 0;
                if (this.isClosureCompilerEnabled && isLongStringLiteral(literal)) {
                    // For string literals, Closure will **always** inline the string at
                    // **all** usages, duplicating it each time. For large strings, this
                    // unnecessarily bloats bundle size. To work around this restriction, we
                    // wrap the string in a function, and call that function for each usage.
                    // This tricks Closure into using inline logic for functions instead of
                    // string literals. Function calls are only inlined if the body is small
                    // enough to be worth it. By doing this, very large strings will be
                    // shared across multiple usages, rather than duplicating the string at
                    // each usage site.
                    //
                    // const myStr = function() { return "very very very long string"; };
                    // const usage1 = myStr();
                    // const usage2 = myStr();
                    definition = o.variable(name_1).set(new o.FunctionExpr([], // Params.
                    [
                        // Statements.
                        new o.ReturnStatement(literal),
                    ]));
                    usage = o.variable(name_1).callFn([]);
                }
                else {
                    // Just declare and use the variable directly, without a function call
                    // indirection. This saves a few bytes and avoids an unncessary call.
                    definition = o.variable(name_1).set(literal);
                    usage = o.variable(name_1);
                }
                this.statements.push(definition.toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
                fixup.fixup(usage);
            }
            return fixup;
        };
        ConstantPool.prototype.getDefinition = function (type, kind, ctx, forceShared) {
            if (forceShared === void 0) { forceShared = false; }
            var definitions = this.definitionsOf(kind);
            var fixup = definitions.get(type);
            var newValue = false;
            if (!fixup) {
                var property = this.propertyNameOf(kind);
                fixup = new FixupExpression(ctx.importExpr(type).prop(property));
                definitions.set(type, fixup);
                newValue = true;
            }
            if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
                var name_2 = this.freshName();
                this.statements.push(o.variable(name_2).set(fixup.resolved).toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
                fixup.fixup(o.variable(name_2));
            }
            return fixup;
        };
        ConstantPool.prototype.getLiteralFactory = function (literal) {
            // Create a pure function that builds an array of a mix of constant and variable expressions
            if (literal instanceof o.LiteralArrayExpr) {
                var argumentsForKey = literal.entries.map(function (e) { return e.isConstant() ? e : UNKNOWN_VALUE_KEY; });
                var key = this.keyOf(o.literalArr(argumentsForKey));
                return this._getLiteralFactory(key, literal.entries, function (entries) { return o.literalArr(entries); });
            }
            else {
                var expressionForKey = o.literalMap(literal.entries.map(function (e) { return ({
                    key: e.key,
                    value: e.value.isConstant() ? e.value : UNKNOWN_VALUE_KEY,
                    quoted: e.quoted
                }); }));
                var key = this.keyOf(expressionForKey);
                return this._getLiteralFactory(key, literal.entries.map(function (e) { return e.value; }), function (entries) { return o.literalMap(entries.map(function (value, index) { return ({
                    key: literal.entries[index].key,
                    value: value,
                    quoted: literal.entries[index].quoted
                }); })); });
            }
        };
        ConstantPool.prototype._getLiteralFactory = function (key, values, resultMap) {
            var _this = this;
            var literalFactory = this.literalFactories.get(key);
            var literalFactoryArguments = values.filter((function (e) { return !e.isConstant(); }));
            if (!literalFactory) {
                var resultExpressions = values.map(function (e, index) { return e.isConstant() ? _this.getConstLiteral(e, true) : o.variable("a" + index); });
                var parameters = resultExpressions.filter(isVariable).map(function (e) { return new o.FnParam(e.name, o.DYNAMIC_TYPE); });
                var pureFunctionDeclaration = o.fn(parameters, [new o.ReturnStatement(resultMap(resultExpressions))], o.INFERRED_TYPE);
                var name_3 = this.freshName();
                this.statements.push(o.variable(name_3).set(pureFunctionDeclaration).toDeclStmt(o.INFERRED_TYPE, [
                    o.StmtModifier.Final
                ]));
                literalFactory = o.variable(name_3);
                this.literalFactories.set(key, literalFactory);
            }
            return { literalFactory: literalFactory, literalFactoryArguments: literalFactoryArguments };
        };
        /**
         * Produce a unique name.
         *
         * The name might be unique among different prefixes if any of the prefixes end in
         * a digit so the prefix should be a constant string (not based on user input) and
         * must not end in a digit.
         */
        ConstantPool.prototype.uniqueName = function (prefix) {
            return "" + prefix + this.nextNameIndex++;
        };
        ConstantPool.prototype.definitionsOf = function (kind) {
            switch (kind) {
                case 2 /* Component */:
                    return this.componentDefinitions;
                case 1 /* Directive */:
                    return this.directiveDefinitions;
                case 0 /* Injector */:
                    return this.injectorDefinitions;
                case 3 /* Pipe */:
                    return this.pipeDefinitions;
            }
            util_1.error("Unknown definition kind " + kind);
            return this.componentDefinitions;
        };
        ConstantPool.prototype.propertyNameOf = function (kind) {
            switch (kind) {
                case 2 /* Component */:
                    return 'ɵcmp';
                case 1 /* Directive */:
                    return 'ɵdir';
                case 0 /* Injector */:
                    return 'ɵinj';
                case 3 /* Pipe */:
                    return 'ɵpipe';
            }
            util_1.error("Unknown definition kind " + kind);
            return '<unknown>';
        };
        ConstantPool.prototype.freshName = function () {
            return this.uniqueName(CONSTANT_PREFIX);
        };
        ConstantPool.prototype.keyOf = function (expression) {
            return expression.visitExpression(new KeyVisitor(), KEY_CONTEXT);
        };
        return ConstantPool;
    }());
    exports.ConstantPool = ConstantPool;
    /**
     * Visitor used to determine if 2 expressions are equivalent and can be shared in the
     * `ConstantPool`.
     *
     * When the id (string) generated by the visitor is equal, expressions are considered equivalent.
     */
    var KeyVisitor = /** @class */ (function () {
        function KeyVisitor() {
            this.visitWrappedNodeExpr = invalid;
            this.visitWriteVarExpr = invalid;
            this.visitWriteKeyExpr = invalid;
            this.visitWritePropExpr = invalid;
            this.visitInvokeMethodExpr = invalid;
            this.visitInvokeFunctionExpr = invalid;
            this.visitTaggedTemplateExpr = invalid;
            this.visitInstantiateExpr = invalid;
            this.visitConditionalExpr = invalid;
            this.visitNotExpr = invalid;
            this.visitAssertNotNullExpr = invalid;
            this.visitCastExpr = invalid;
            this.visitFunctionExpr = invalid;
            this.visitUnaryOperatorExpr = invalid;
            this.visitBinaryOperatorExpr = invalid;
            this.visitReadPropExpr = invalid;
            this.visitReadKeyExpr = invalid;
            this.visitCommaExpr = invalid;
            this.visitLocalizedString = invalid;
        }
        KeyVisitor.prototype.visitLiteralExpr = function (ast) {
            return "" + (typeof ast.value === 'string' ? '"' + ast.value + '"' : ast.value);
        };
        KeyVisitor.prototype.visitLiteralArrayExpr = function (ast, context) {
            var _this = this;
            return "[" + ast.entries.map(function (entry) { return entry.visitExpression(_this, context); }).join(',') + "]";
        };
        KeyVisitor.prototype.visitLiteralMapExpr = function (ast, context) {
            var _this = this;
            var mapKey = function (entry) {
                var quote = entry.quoted ? '"' : '';
                return "" + quote + entry.key + quote;
            };
            var mapEntry = function (entry) {
                return mapKey(entry) + ":" + entry.value.visitExpression(_this, context);
            };
            return "{" + ast.entries.map(mapEntry).join(',');
        };
        KeyVisitor.prototype.visitExternalExpr = function (ast) {
            return ast.value.moduleName ? "EX:" + ast.value.moduleName + ":" + ast.value.name :
                "EX:" + ast.value.runtime.name;
        };
        KeyVisitor.prototype.visitReadVarExpr = function (node) {
            return "VAR:" + node.name;
        };
        KeyVisitor.prototype.visitTypeofExpr = function (node, context) {
            return "TYPEOF:" + node.expr.visitExpression(this, context);
        };
        return KeyVisitor;
    }());
    function invalid(arg) {
        throw new Error("Invalid state: Visitor " + this.constructor.name + " doesn't handle " + arg.constructor.name);
    }
    function isVariable(e) {
        return e instanceof o.ReadVarExpr;
    }
    function isLongStringLiteral(expr) {
        return expr instanceof o.LiteralExpr && typeof expr.value === 'string' &&
            expr.value.length >= POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRfcG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb25zdGFudF9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBeUM7SUFDekMsbURBQTRDO0lBRTVDLElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQztJQUU3Qjs7Ozs7OztPQU9HO0lBQ0gsSUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBU2xEOzs7OztPQUtHO0lBQ0gsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBRXZCOzs7O09BSUc7SUFDSCxJQUFNLDJDQUEyQyxHQUFHLEVBQUUsQ0FBQztJQUV2RDs7Ozs7OztPQU9HO0lBQ0g7UUFBOEIsMkNBQVk7UUFNeEMseUJBQW1CLFFBQXNCO1lBQXpDLFlBQ0Usa0JBQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxTQUVyQjtZQUhrQixjQUFRLEdBQVIsUUFBUSxDQUFjO1lBRXZDLEtBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOztRQUMzQixDQUFDO1FBRUQseUNBQWUsR0FBZixVQUFnQixPQUE0QixFQUFFLE9BQVk7WUFDeEQsSUFBSSxPQUFPLEtBQUssV0FBVyxFQUFFO2dCQUMzQixnRUFBZ0U7Z0JBQ2hFLGdDQUFnQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDeEQ7aUJBQU07Z0JBQ0wsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDeEQ7UUFDSCxDQUFDO1FBRUQsc0NBQVksR0FBWixVQUFhLENBQWU7WUFDMUIsT0FBTyxDQUFDLFlBQVksZUFBZSxJQUFJLElBQUksQ0FBQyxRQUFRLENB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Q0FBQztnQkFDaEQsUUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFNLENBQUM7UUFDL0QsQ0FBQztRQUVELHFDQUFnQixHQUFoQixVQUFpQixJQUFtQjtZQUNsQyxPQUFPLFNBQU8sSUFBSSxDQUFDLElBQU0sQ0FBQztRQUM1QixDQUFDO1FBRUQsb0NBQWUsR0FBZixVQUFnQixJQUFrQixFQUFFLE9BQVk7WUFDOUMsT0FBTyxZQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUcsQ0FBQztRQUM5RCxDQUFDO1FBcUJILGlCQUFDO0lBQUQsQ0FBQyxBQW5ERCxJQW1EQztJQUVELFNBQVMsT0FBTyxDQUErQixHQUE2QjtRQUMxRSxNQUFNLElBQUksS0FBSyxDQUNYLDRCQUEwQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksd0JBQW1CLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBTSxDQUFDLENBQUM7SUFDaEcsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLENBQWU7UUFDakMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUNwQyxDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFrQjtRQUM3QyxPQUFPLElBQUksWUFBWSxDQUFDLENBQUMsV0FBVyxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRO1lBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLDJDQUEyQyxDQUFDO0lBQ3ZFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICcuL291dHB1dC9vdXRwdXRfYXN0JztcbmltcG9ydCB7ZXJyb3IsIE91dHB1dENvbnRleHR9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IENPTlNUQU5UX1BSRUZJWCA9ICdfYyc7XG5cbi8qKlxuICogYENvbnN0YW50UG9vbGAgdHJpZXMgdG8gcmV1c2UgbGl0ZXJhbCBmYWN0b3JpZXMgd2hlbiB0d28gb3IgbW9yZSBsaXRlcmFscyBhcmUgaWRlbnRpY2FsLlxuICogV2UgZGV0ZXJtaW5lIHdoZXRoZXIgbGl0ZXJhbHMgYXJlIGlkZW50aWNhbCBieSBjcmVhdGluZyBhIGtleSBvdXQgb2YgdGhlaXIgQVNUIHVzaW5nIHRoZVxuICogYEtleVZpc2l0b3JgLiBUaGlzIGNvbnN0YW50IGlzIHVzZWQgdG8gcmVwbGFjZSBkeW5hbWljIGV4cHJlc3Npb25zIHdoaWNoIGNhbid0IGJlIHNhZmVseVxuICogY29udmVydGVkIGludG8gYSBrZXkuIEUuZy4gZ2l2ZW4gYW4gZXhwcmVzc2lvbiBge2ZvbzogYmFyKCl9YCwgc2luY2Ugd2UgZG9uJ3Qga25vdyB3aGF0XG4gKiB0aGUgcmVzdWx0IG9mIGBiYXJgIHdpbGwgYmUsIHdlIGNyZWF0ZSBhIGtleSB0aGF0IGxvb2tzIGxpa2UgYHtmb286IDx1bmtub3duPn1gLiBOb3RlXG4gKiB0aGF0IHdlIHVzZSBhIHZhcmlhYmxlLCByYXRoZXIgdGhhbiBzb21ldGhpbmcgbGlrZSBgbnVsbGAgaW4gb3JkZXIgdG8gYXZvaWQgY29sbGlzaW9ucy5cbiAqL1xuY29uc3QgVU5LTk9XTl9WQUxVRV9LRVkgPSBvLnZhcmlhYmxlKCc8dW5rbm93bj4nKTtcblxuZXhwb3J0IGNvbnN0IGVudW0gRGVmaW5pdGlvbktpbmQge1xuICBJbmplY3RvcixcbiAgRGlyZWN0aXZlLFxuICBDb21wb25lbnQsXG4gIFBpcGVcbn1cblxuLyoqXG4gKiBDb250ZXh0IHRvIHVzZSB3aGVuIHByb2R1Y2luZyBhIGtleS5cbiAqXG4gKiBUaGlzIGVuc3VyZXMgd2Ugc2VlIHRoZSBjb25zdGFudCBub3QgdGhlIHJlZmVyZW5jZSB2YXJpYWJsZSB3aGVuIHByb2R1Y2luZ1xuICogYSBrZXkuXG4gKi9cbmNvbnN0IEtFWV9DT05URVhUID0ge307XG5cbi8qKlxuICogR2VuZXJhbGx5IGFsbCBwcmltaXRpdmUgdmFsdWVzIGFyZSBleGNsdWRlZCBmcm9tIHRoZSBgQ29uc3RhbnRQb29sYCwgYnV0IHRoZXJlIGlzIGFuIGV4Y2x1c2lvblxuICogZm9yIHN0cmluZ3MgdGhhdCByZWFjaCBhIGNlcnRhaW4gbGVuZ3RoIHRocmVzaG9sZC4gVGhpcyBjb25zdGFudCBkZWZpbmVzIHRoZSBsZW5ndGggdGhyZXNob2xkIGZvclxuICogc3RyaW5ncy5cbiAqL1xuY29uc3QgUE9PTF9JTkNMVVNJT05fTEVOR1RIX1RIUkVTSE9MRF9GT1JfU1RSSU5HUyA9IDUwO1xuXG4vKipcbiAqIEEgbm9kZSB0aGF0IGlzIGEgcGxhY2UtaG9sZGVyIHRoYXQgYWxsb3dzIHRoZSBub2RlIHRvIGJlIHJlcGxhY2VkIHdoZW4gdGhlIGFjdHVhbFxuICogbm9kZSBpcyBrbm93bi5cbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgY29uc3RhbnQgcG9vbCB0byBjaGFuZ2UgYW4gZXhwcmVzc2lvbiBmcm9tIGEgZGlyZWN0IHJlZmVyZW5jZSB0b1xuICogYSBjb25zdGFudCB0byBhIHNoYXJlZCBjb25zdGFudC4gSXQgcmV0dXJucyBhIGZpeC11cCBub2RlIHRoYXQgaXMgbGF0ZXIgYWxsb3dlZCB0b1xuICogY2hhbmdlIHRoZSByZWZlcmVuY2VkIGV4cHJlc3Npb24uXG4gKi9cbmNsYXNzIEZpeHVwRXhwcmVzc2lvbiBleHRlbmRzIG8uRXhwcmVzc2lvbiB7XG4gIHByaXZhdGUgb3JpZ2luYWw6IG8uRXhwcmVzc2lvbjtcblxuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgc2hhcmVkITogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVzb2x2ZWQ6IG8uRXhwcmVzc2lvbikge1xuICAgIHN1cGVyKHJlc29sdmVkLnR5cGUpO1xuICAgIHRoaXMub3JpZ2luYWwgPSByZXNvbHZlZDtcbiAgfVxuXG4gIHZpc2l0RXhwcmVzc2lvbih2aXNpdG9yOiBvLkV4cHJlc3Npb25WaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGlmIChjb250ZXh0ID09PSBLRVlfQ09OVEVYVCkge1xuICAgICAgLy8gV2hlbiBwcm9kdWNpbmcgYSBrZXkgd2Ugd2FudCB0byB0cmF2ZXJzZSB0aGUgY29uc3RhbnQgbm90IHRoZVxuICAgICAgLy8gdmFyaWFibGUgdXNlZCB0byByZWZlciB0byBpdC5cbiAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsLnZpc2l0RXhwcmVzc2lvbih2aXNpdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQudmlzaXRFeHByZXNzaW9uKHZpc2l0b3IsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGlzRXF1aXZhbGVudChlOiBvLkV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gZSBpbnN0YW5jZW9mIEZpeHVwRXhwcmVzc2lvbiAmJiB0aGlzLnJlc29sdmVkLmlzRXF1aXZhbGVudChlLnJlc29sdmVkKTtcbiAgfVxuXG4gIGlzQ29uc3RhbnQoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmaXh1cChleHByZXNzaW9uOiBvLkV4cHJlc3Npb24pIHtcbiAgICB0aGlzLnJlc29sdmVkID0gZXhwcmVzc2lvbjtcbiAgICB0aGlzLnNoYXJlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGNvbnN0YW50IHBvb2wgYWxsb3dzIGEgY29kZSBlbWl0dGVyIHRvIHNoYXJlIGNvbnN0YW50IGluIGFuIG91dHB1dCBjb250ZXh0LlxuICpcbiAqIFRoZSBjb25zdGFudCBwb29sIGFsc28gc3VwcG9ydHMgc2hhcmluZyBhY2Nlc3MgdG8gaXZ5IGRlZmluaXRpb25zIHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zdGFudFBvb2wge1xuICBzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdID0gW107XG4gIHByaXZhdGUgbGl0ZXJhbHMgPSBuZXcgTWFwPHN0cmluZywgRml4dXBFeHByZXNzaW9uPigpO1xuICBwcml2YXRlIGxpdGVyYWxGYWN0b3JpZXMgPSBuZXcgTWFwPHN0cmluZywgby5FeHByZXNzaW9uPigpO1xuICBwcml2YXRlIGluamVjdG9yRGVmaW5pdGlvbnMgPSBuZXcgTWFwPGFueSwgRml4dXBFeHByZXNzaW9uPigpO1xuICBwcml2YXRlIGRpcmVjdGl2ZURlZmluaXRpb25zID0gbmV3IE1hcDxhbnksIEZpeHVwRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBjb21wb25lbnREZWZpbml0aW9ucyA9IG5ldyBNYXA8YW55LCBGaXh1cEV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgcGlwZURlZmluaXRpb25zID0gbmV3IE1hcDxhbnksIEZpeHVwRXhwcmVzc2lvbj4oKTtcblxuICBwcml2YXRlIG5leHROYW1lSW5kZXggPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaXNDbG9zdXJlQ29tcGlsZXJFbmFibGVkOiBib29sZWFuID0gZmFsc2UpIHt9XG5cbiAgZ2V0Q29uc3RMaXRlcmFsKGxpdGVyYWw6IG8uRXhwcmVzc2lvbiwgZm9yY2VTaGFyZWQ/OiBib29sZWFuKTogby5FeHByZXNzaW9uIHtcbiAgICBpZiAoKGxpdGVyYWwgaW5zdGFuY2VvZiBvLkxpdGVyYWxFeHByICYmICFpc0xvbmdTdHJpbmdMaXRlcmFsKGxpdGVyYWwpKSB8fFxuICAgICAgICBsaXRlcmFsIGluc3RhbmNlb2YgRml4dXBFeHByZXNzaW9uKSB7XG4gICAgICAvLyBEbyBubyBwdXQgc2ltcGxlIGxpdGVyYWxzIGludG8gdGhlIGNvbnN0YW50IHBvb2wgb3IgdHJ5IHRvIHByb2R1Y2UgYSBjb25zdGFudCBmb3IgYVxuICAgICAgLy8gcmVmZXJlbmNlIHRvIGEgY29uc3RhbnQuXG4gICAgICByZXR1cm4gbGl0ZXJhbDtcbiAgICB9XG4gICAgY29uc3Qga2V5ID0gdGhpcy5rZXlPZihsaXRlcmFsKTtcbiAgICBsZXQgZml4dXAgPSB0aGlzLmxpdGVyYWxzLmdldChrZXkpO1xuICAgIGxldCBuZXdWYWx1ZSA9IGZhbHNlO1xuICAgIGlmICghZml4dXApIHtcbiAgICAgIGZpeHVwID0gbmV3IEZpeHVwRXhwcmVzc2lvbihsaXRlcmFsKTtcbiAgICAgIHRoaXMubGl0ZXJhbHMuc2V0KGtleSwgZml4dXApO1xuICAgICAgbmV3VmFsdWUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICgoIW5ld1ZhbHVlICYmICFmaXh1cC5zaGFyZWQpIHx8IChuZXdWYWx1ZSAmJiBmb3JjZVNoYXJlZCkpIHtcbiAgICAgIC8vIFJlcGxhY2UgdGhlIGV4cHJlc3Npb24gd2l0aCBhIHZhcmlhYmxlXG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIGxldCBkZWZpbml0aW9uOiBvLldyaXRlVmFyRXhwcjtcbiAgICAgIGxldCB1c2FnZTogby5FeHByZXNzaW9uO1xuICAgICAgaWYgKHRoaXMuaXNDbG9zdXJlQ29tcGlsZXJFbmFibGVkICYmIGlzTG9uZ1N0cmluZ0xpdGVyYWwobGl0ZXJhbCkpIHtcbiAgICAgICAgLy8gRm9yIHN0cmluZyBsaXRlcmFscywgQ2xvc3VyZSB3aWxsICoqYWx3YXlzKiogaW5saW5lIHRoZSBzdHJpbmcgYXRcbiAgICAgICAgLy8gKiphbGwqKiB1c2FnZXMsIGR1cGxpY2F0aW5nIGl0IGVhY2ggdGltZS4gRm9yIGxhcmdlIHN0cmluZ3MsIHRoaXNcbiAgICAgICAgLy8gdW5uZWNlc3NhcmlseSBibG9hdHMgYnVuZGxlIHNpemUuIFRvIHdvcmsgYXJvdW5kIHRoaXMgcmVzdHJpY3Rpb24sIHdlXG4gICAgICAgIC8vIHdyYXAgdGhlIHN0cmluZyBpbiBhIGZ1bmN0aW9uLCBhbmQgY2FsbCB0aGF0IGZ1bmN0aW9uIGZvciBlYWNoIHVzYWdlLlxuICAgICAgICAvLyBUaGlzIHRyaWNrcyBDbG9zdXJlIGludG8gdXNpbmcgaW5saW5lIGxvZ2ljIGZvciBmdW5jdGlvbnMgaW5zdGVhZCBvZlxuICAgICAgICAvLyBzdHJpbmcgbGl0ZXJhbHMuIEZ1bmN0aW9uIGNhbGxzIGFyZSBvbmx5IGlubGluZWQgaWYgdGhlIGJvZHkgaXMgc21hbGxcbiAgICAgICAgLy8gZW5vdWdoIHRvIGJlIHdvcnRoIGl0LiBCeSBkb2luZyB0aGlzLCB2ZXJ5IGxhcmdlIHN0cmluZ3Mgd2lsbCBiZVxuICAgICAgICAvLyBzaGFyZWQgYWNyb3NzIG11bHRpcGxlIHVzYWdlcywgcmF0aGVyIHRoYW4gZHVwbGljYXRpbmcgdGhlIHN0cmluZyBhdFxuICAgICAgICAvLyBlYWNoIHVzYWdlIHNpdGUuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIGNvbnN0IG15U3RyID0gZnVuY3Rpb24oKSB7IHJldHVybiBcInZlcnkgdmVyeSB2ZXJ5IGxvbmcgc3RyaW5nXCI7IH07XG4gICAgICAgIC8vIGNvbnN0IHVzYWdlMSA9IG15U3RyKCk7XG4gICAgICAgIC8vIGNvbnN0IHVzYWdlMiA9IG15U3RyKCk7XG4gICAgICAgIGRlZmluaXRpb24gPSBvLnZhcmlhYmxlKG5hbWUpLnNldChuZXcgby5GdW5jdGlvbkV4cHIoXG4gICAgICAgICAgICBbXSwgIC8vIFBhcmFtcy5cbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgLy8gU3RhdGVtZW50cy5cbiAgICAgICAgICAgICAgbmV3IG8uUmV0dXJuU3RhdGVtZW50KGxpdGVyYWwpLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICkpO1xuICAgICAgICB1c2FnZSA9IG8udmFyaWFibGUobmFtZSkuY2FsbEZuKFtdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEp1c3QgZGVjbGFyZSBhbmQgdXNlIHRoZSB2YXJpYWJsZSBkaXJlY3RseSwgd2l0aG91dCBhIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgLy8gaW5kaXJlY3Rpb24uIFRoaXMgc2F2ZXMgYSBmZXcgYnl0ZXMgYW5kIGF2b2lkcyBhbiB1bm5jZXNzYXJ5IGNhbGwuXG4gICAgICAgIGRlZmluaXRpb24gPSBvLnZhcmlhYmxlKG5hbWUpLnNldChsaXRlcmFsKTtcbiAgICAgICAgdXNhZ2UgPSBvLnZhcmlhYmxlKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YXRlbWVudHMucHVzaChkZWZpbml0aW9uLnRvRGVjbFN0bXQoby5JTkZFUlJFRF9UWVBFLCBbby5TdG10TW9kaWZpZXIuRmluYWxdKSk7XG4gICAgICBmaXh1cC5maXh1cCh1c2FnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpeHVwO1xuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbih0eXBlOiBhbnksIGtpbmQ6IERlZmluaXRpb25LaW5kLCBjdHg6IE91dHB1dENvbnRleHQsIGZvcmNlU2hhcmVkOiBib29sZWFuID0gZmFsc2UpOlxuICAgICAgby5FeHByZXNzaW9uIHtcbiAgICBjb25zdCBkZWZpbml0aW9ucyA9IHRoaXMuZGVmaW5pdGlvbnNPZihraW5kKTtcbiAgICBsZXQgZml4dXAgPSBkZWZpbml0aW9ucy5nZXQodHlwZSk7XG4gICAgbGV0IG5ld1ZhbHVlID0gZmFsc2U7XG4gICAgaWYgKCFmaXh1cCkge1xuICAgICAgY29uc3QgcHJvcGVydHkgPSB0aGlzLnByb3BlcnR5TmFtZU9mKGtpbmQpO1xuICAgICAgZml4dXAgPSBuZXcgRml4dXBFeHByZXNzaW9uKGN0eC5pbXBvcnRFeHByKHR5cGUpLnByb3AocHJvcGVydHkpKTtcbiAgICAgIGRlZmluaXRpb25zLnNldCh0eXBlLCBmaXh1cCk7XG4gICAgICBuZXdWYWx1ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCghbmV3VmFsdWUgJiYgIWZpeHVwLnNoYXJlZCkgfHwgKG5ld1ZhbHVlICYmIGZvcmNlU2hhcmVkKSkge1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMuZnJlc2hOYW1lKCk7XG4gICAgICB0aGlzLnN0YXRlbWVudHMucHVzaChcbiAgICAgICAgICBvLnZhcmlhYmxlKG5hbWUpLnNldChmaXh1cC5yZXNvbHZlZCkudG9EZWNsU3RtdChvLklORkVSUkVEX1RZUEUsIFtvLlN0bXRNb2RpZmllci5GaW5hbF0pKTtcbiAgICAgIGZpeHVwLmZpeHVwKG8udmFyaWFibGUobmFtZSkpO1xuICAgIH1cbiAgICByZXR1cm4gZml4dXA7XG4gIH1cblxuICBnZXRMaXRlcmFsRmFjdG9yeShsaXRlcmFsOiBvLkxpdGVyYWxBcnJheUV4cHJ8by5MaXRlcmFsTWFwRXhwcik6XG4gICAgICB7bGl0ZXJhbEZhY3Rvcnk6IG8uRXhwcmVzc2lvbiwgbGl0ZXJhbEZhY3RvcnlBcmd1bWVudHM6IG8uRXhwcmVzc2lvbltdfSB7XG4gICAgLy8gQ3JlYXRlIGEgcHVyZSBmdW5jdGlvbiB0aGF0IGJ1aWxkcyBhbiBhcnJheSBvZiBhIG1peCBvZiBjb25zdGFudCBhbmQgdmFyaWFibGUgZXhwcmVzc2lvbnNcbiAgICBpZiAobGl0ZXJhbCBpbnN0YW5jZW9mIG8uTGl0ZXJhbEFycmF5RXhwcikge1xuICAgICAgY29uc3QgYXJndW1lbnRzRm9yS2V5ID0gbGl0ZXJhbC5lbnRyaWVzLm1hcChlID0+IGUuaXNDb25zdGFudCgpID8gZSA6IFVOS05PV05fVkFMVUVfS0VZKTtcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMua2V5T2Yoby5saXRlcmFsQXJyKGFyZ3VtZW50c0ZvcktleSkpO1xuICAgICAgcmV0dXJuIHRoaXMuX2dldExpdGVyYWxGYWN0b3J5KGtleSwgbGl0ZXJhbC5lbnRyaWVzLCBlbnRyaWVzID0+IG8ubGl0ZXJhbEFycihlbnRyaWVzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb25Gb3JLZXkgPSBvLmxpdGVyYWxNYXAoXG4gICAgICAgICAgbGl0ZXJhbC5lbnRyaWVzLm1hcChlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogZS5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlLnZhbHVlLmlzQ29uc3RhbnQoKSA/IGUudmFsdWUgOiBVTktOT1dOX1ZBTFVFX0tFWSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVvdGVkOiBlLnF1b3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMua2V5T2YoZXhwcmVzc2lvbkZvcktleSk7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0TGl0ZXJhbEZhY3RvcnkoXG4gICAgICAgICAga2V5LCBsaXRlcmFsLmVudHJpZXMubWFwKGUgPT4gZS52YWx1ZSksXG4gICAgICAgICAgZW50cmllcyA9PiBvLmxpdGVyYWxNYXAoZW50cmllcy5tYXAoKHZhbHVlLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogbGl0ZXJhbC5lbnRyaWVzW2luZGV4XS5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1b3RlZDogbGl0ZXJhbC5lbnRyaWVzW2luZGV4XS5xdW90ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSkpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRMaXRlcmFsRmFjdG9yeShcbiAgICAgIGtleTogc3RyaW5nLCB2YWx1ZXM6IG8uRXhwcmVzc2lvbltdLCByZXN1bHRNYXA6IChwYXJhbWV0ZXJzOiBvLkV4cHJlc3Npb25bXSkgPT4gby5FeHByZXNzaW9uKTpcbiAgICAgIHtsaXRlcmFsRmFjdG9yeTogby5FeHByZXNzaW9uLCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50czogby5FeHByZXNzaW9uW119IHtcbiAgICBsZXQgbGl0ZXJhbEZhY3RvcnkgPSB0aGlzLmxpdGVyYWxGYWN0b3JpZXMuZ2V0KGtleSk7XG4gICAgY29uc3QgbGl0ZXJhbEZhY3RvcnlBcmd1bWVudHMgPSB2YWx1ZXMuZmlsdGVyKChlID0+ICFlLmlzQ29uc3RhbnQoKSkpO1xuICAgIGlmICghbGl0ZXJhbEZhY3RvcnkpIHtcbiAgICAgIGNvbnN0IHJlc3VsdEV4cHJlc3Npb25zID0gdmFsdWVzLm1hcChcbiAgICAgICAgICAoZSwgaW5kZXgpID0+IGUuaXNDb25zdGFudCgpID8gdGhpcy5nZXRDb25zdExpdGVyYWwoZSwgdHJ1ZSkgOiBvLnZhcmlhYmxlKGBhJHtpbmRleH1gKSk7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJzID1cbiAgICAgICAgICByZXN1bHRFeHByZXNzaW9ucy5maWx0ZXIoaXNWYXJpYWJsZSkubWFwKGUgPT4gbmV3IG8uRm5QYXJhbShlLm5hbWUhLCBvLkRZTkFNSUNfVFlQRSkpO1xuICAgICAgY29uc3QgcHVyZUZ1bmN0aW9uRGVjbGFyYXRpb24gPVxuICAgICAgICAgIG8uZm4ocGFyYW1ldGVycywgW25ldyBvLlJldHVyblN0YXRlbWVudChyZXN1bHRNYXAocmVzdWx0RXhwcmVzc2lvbnMpKV0sIG8uSU5GRVJSRURfVFlQRSk7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKFxuICAgICAgICAgIG8udmFyaWFibGUobmFtZSkuc2V0KHB1cmVGdW5jdGlvbkRlY2xhcmF0aW9uKS50b0RlY2xTdG10KG8uSU5GRVJSRURfVFlQRSwgW1xuICAgICAgICAgICAgby5TdG10TW9kaWZpZXIuRmluYWxcbiAgICAgICAgICBdKSk7XG4gICAgICBsaXRlcmFsRmFjdG9yeSA9IG8udmFyaWFibGUobmFtZSk7XG4gICAgICB0aGlzLmxpdGVyYWxGYWN0b3JpZXMuc2V0KGtleSwgbGl0ZXJhbEZhY3RvcnkpO1xuICAgIH1cbiAgICByZXR1cm4ge2xpdGVyYWxGYWN0b3J5LCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50c307XG4gIH1cblxuICAvKipcbiAgICogUHJvZHVjZSBhIHVuaXF1ZSBuYW1lLlxuICAgKlxuICAgKiBUaGUgbmFtZSBtaWdodCBiZSB1bmlxdWUgYW1vbmcgZGlmZmVyZW50IHByZWZpeGVzIGlmIGFueSBvZiB0aGUgcHJlZml4ZXMgZW5kIGluXG4gICAqIGEgZGlnaXQgc28gdGhlIHByZWZpeCBzaG91bGQgYmUgYSBjb25zdGFudCBzdHJpbmcgKG5vdCBiYXNlZCBvbiB1c2VyIGlucHV0KSBhbmRcbiAgICogbXVzdCBub3QgZW5kIGluIGEgZGlnaXQuXG4gICAqL1xuICB1bmlxdWVOYW1lKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7dGhpcy5uZXh0TmFtZUluZGV4Kyt9YDtcbiAgfVxuXG4gIHByaXZhdGUgZGVmaW5pdGlvbnNPZihraW5kOiBEZWZpbml0aW9uS2luZCk6IE1hcDxhbnksIEZpeHVwRXhwcmVzc2lvbj4ge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5Db21wb25lbnQ6XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudERlZmluaXRpb25zO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5EaXJlY3RpdmU6XG4gICAgICAgIHJldHVybiB0aGlzLmRpcmVjdGl2ZURlZmluaXRpb25zO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5JbmplY3RvcjpcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0b3JEZWZpbml0aW9ucztcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuUGlwZTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGlwZURlZmluaXRpb25zO1xuICAgIH1cbiAgICBlcnJvcihgVW5rbm93biBkZWZpbml0aW9uIGtpbmQgJHtraW5kfWApO1xuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudERlZmluaXRpb25zO1xuICB9XG5cbiAgcHVibGljIHByb3BlcnR5TmFtZU9mKGtpbmQ6IERlZmluaXRpb25LaW5kKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuQ29tcG9uZW50OlxuICAgICAgICByZXR1cm4gJ8m1Y21wJztcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuRGlyZWN0aXZlOlxuICAgICAgICByZXR1cm4gJ8m1ZGlyJztcbiAgICAgIGNhc2UgRGVmaW5pdGlvbktpbmQuSW5qZWN0b3I6XG4gICAgICAgIHJldHVybiAnybVpbmonO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5QaXBlOlxuICAgICAgICByZXR1cm4gJ8m1cGlwZSc7XG4gICAgfVxuICAgIGVycm9yKGBVbmtub3duIGRlZmluaXRpb24ga2luZCAke2tpbmR9YCk7XG4gICAgcmV0dXJuICc8dW5rbm93bj4nO1xuICB9XG5cbiAgcHJpdmF0ZSBmcmVzaE5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy51bmlxdWVOYW1lKENPTlNUQU5UX1BSRUZJWCk7XG4gIH1cblxuICBwcml2YXRlIGtleU9mKGV4cHJlc3Npb246IG8uRXhwcmVzc2lvbikge1xuICAgIHJldHVybiBleHByZXNzaW9uLnZpc2l0RXhwcmVzc2lvbihuZXcgS2V5VmlzaXRvcigpLCBLRVlfQ09OVEVYVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBWaXNpdG9yIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIDIgZXhwcmVzc2lvbnMgYXJlIGVxdWl2YWxlbnQgYW5kIGNhbiBiZSBzaGFyZWQgaW4gdGhlXG4gKiBgQ29uc3RhbnRQb29sYC5cbiAqXG4gKiBXaGVuIHRoZSBpZCAoc3RyaW5nKSBnZW5lcmF0ZWQgYnkgdGhlIHZpc2l0b3IgaXMgZXF1YWwsIGV4cHJlc3Npb25zIGFyZSBjb25zaWRlcmVkIGVxdWl2YWxlbnQuXG4gKi9cbmNsYXNzIEtleVZpc2l0b3IgaW1wbGVtZW50cyBvLkV4cHJlc3Npb25WaXNpdG9yIHtcbiAgdmlzaXRMaXRlcmFsRXhwcihhc3Q6IG8uTGl0ZXJhbEV4cHIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0eXBlb2YgYXN0LnZhbHVlID09PSAnc3RyaW5nJyA/ICdcIicgKyBhc3QudmFsdWUgKyAnXCInIDogYXN0LnZhbHVlfWA7XG4gIH1cblxuICB2aXNpdExpdGVyYWxBcnJheUV4cHIoYXN0OiBvLkxpdGVyYWxBcnJheUV4cHIsIGNvbnRleHQ6IG9iamVjdCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBbJHthc3QuZW50cmllcy5tYXAoZW50cnkgPT4gZW50cnkudmlzaXRFeHByZXNzaW9uKHRoaXMsIGNvbnRleHQpKS5qb2luKCcsJyl9XWA7XG4gIH1cblxuICB2aXNpdExpdGVyYWxNYXBFeHByKGFzdDogby5MaXRlcmFsTWFwRXhwciwgY29udGV4dDogb2JqZWN0KTogc3RyaW5nIHtcbiAgICBjb25zdCBtYXBLZXkgPSAoZW50cnk6IG8uTGl0ZXJhbE1hcEVudHJ5KSA9PiB7XG4gICAgICBjb25zdCBxdW90ZSA9IGVudHJ5LnF1b3RlZCA/ICdcIicgOiAnJztcbiAgICAgIHJldHVybiBgJHtxdW90ZX0ke2VudHJ5LmtleX0ke3F1b3RlfWA7XG4gICAgfTtcbiAgICBjb25zdCBtYXBFbnRyeSA9IChlbnRyeTogby5MaXRlcmFsTWFwRW50cnkpID0+XG4gICAgICAgIGAke21hcEtleShlbnRyeSl9OiR7ZW50cnkudmFsdWUudmlzaXRFeHByZXNzaW9uKHRoaXMsIGNvbnRleHQpfWA7XG4gICAgcmV0dXJuIGB7JHthc3QuZW50cmllcy5tYXAobWFwRW50cnkpLmpvaW4oJywnKX1gO1xuICB9XG5cbiAgdmlzaXRFeHRlcm5hbEV4cHIoYXN0OiBvLkV4dGVybmFsRXhwcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGFzdC52YWx1ZS5tb2R1bGVOYW1lID8gYEVYOiR7YXN0LnZhbHVlLm1vZHVsZU5hbWV9OiR7YXN0LnZhbHVlLm5hbWV9YCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYEVYOiR7YXN0LnZhbHVlLnJ1bnRpbWUubmFtZX1gO1xuICB9XG5cbiAgdmlzaXRSZWFkVmFyRXhwcihub2RlOiBvLlJlYWRWYXJFeHByKSB7XG4gICAgcmV0dXJuIGBWQVI6JHtub2RlLm5hbWV9YDtcbiAgfVxuXG4gIHZpc2l0VHlwZW9mRXhwcihub2RlOiBvLlR5cGVvZkV4cHIsIGNvbnRleHQ6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBUWVBFT0Y6JHtub2RlLmV4cHIudmlzaXRFeHByZXNzaW9uKHRoaXMsIGNvbnRleHQpfWA7XG4gIH1cblxuICB2aXNpdFdyYXBwZWROb2RlRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0V3JpdGVWYXJFeHByID0gaW52YWxpZDtcbiAgdmlzaXRXcml0ZUtleUV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFdyaXRlUHJvcEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEludm9rZU1ldGhvZEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEludm9rZUZ1bmN0aW9uRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0VGFnZ2VkVGVtcGxhdGVFeHByID0gaW52YWxpZDtcbiAgdmlzaXRJbnN0YW50aWF0ZUV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdENvbmRpdGlvbmFsRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Tm90RXhwciA9IGludmFsaWQ7XG4gIHZpc2l0QXNzZXJ0Tm90TnVsbEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdENhc3RFeHByID0gaW52YWxpZDtcbiAgdmlzaXRGdW5jdGlvbkV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFVuYXJ5T3BlcmF0b3JFeHByID0gaW52YWxpZDtcbiAgdmlzaXRCaW5hcnlPcGVyYXRvckV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFJlYWRQcm9wRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0UmVhZEtleUV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdENvbW1hRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0TG9jYWxpemVkU3RyaW5nID0gaW52YWxpZDtcbn1cblxuZnVuY3Rpb24gaW52YWxpZDxUPih0aGlzOiBvLkV4cHJlc3Npb25WaXNpdG9yLCBhcmc6IG8uRXhwcmVzc2lvbnxvLlN0YXRlbWVudCk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgc3RhdGU6IFZpc2l0b3IgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGFuZGxlICR7YXJnLmNvbnN0cnVjdG9yLm5hbWV9YCk7XG59XG5cbmZ1bmN0aW9uIGlzVmFyaWFibGUoZTogby5FeHByZXNzaW9uKTogZSBpcyBvLlJlYWRWYXJFeHByIHtcbiAgcmV0dXJuIGUgaW5zdGFuY2VvZiBvLlJlYWRWYXJFeHByO1xufVxuXG5mdW5jdGlvbiBpc0xvbmdTdHJpbmdMaXRlcmFsKGV4cHI6IG8uRXhwcmVzc2lvbik6IGJvb2xlYW4ge1xuICByZXR1cm4gZXhwciBpbnN0YW5jZW9mIG8uTGl0ZXJhbEV4cHIgJiYgdHlwZW9mIGV4cHIudmFsdWUgPT09ICdzdHJpbmcnICYmXG4gICAgICBleHByLnZhbHVlLmxlbmd0aCA+PSBQT09MX0lOQ0xVU0lPTl9MRU5HVEhfVEhSRVNIT0xEX0ZPUl9TVFJJTkdTO1xufVxuIl19
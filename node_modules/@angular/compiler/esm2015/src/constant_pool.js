/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from './output/output_ast';
import { error } from './util';
const CONSTANT_PREFIX = '_c';
/**
 * `ConstantPool` tries to reuse literal factories when two or more literals are identical.
 * We determine whether literals are identical by creating a key out of their AST using the
 * `KeyVisitor`. This constant is used to replace dynamic expressions which can't be safely
 * converted into a key. E.g. given an expression `{foo: bar()}`, since we don't know what
 * the result of `bar` will be, we create a key that looks like `{foo: <unknown>}`. Note
 * that we use a variable, rather than something like `null` in order to avoid collisions.
 */
const UNKNOWN_VALUE_KEY = o.variable('<unknown>');
/**
 * Context to use when producing a key.
 *
 * This ensures we see the constant not the reference variable when producing
 * a key.
 */
const KEY_CONTEXT = {};
/**
 * Generally all primitive values are excluded from the `ConstantPool`, but there is an exclusion
 * for strings that reach a certain length threshold. This constant defines the length threshold for
 * strings.
 */
const POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS = 50;
/**
 * A node that is a place-holder that allows the node to be replaced when the actual
 * node is known.
 *
 * This allows the constant pool to change an expression from a direct reference to
 * a constant to a shared constant. It returns a fix-up node that is later allowed to
 * change the referenced expression.
 */
class FixupExpression extends o.Expression {
    constructor(resolved) {
        super(resolved.type);
        this.resolved = resolved;
        this.original = resolved;
    }
    visitExpression(visitor, context) {
        if (context === KEY_CONTEXT) {
            // When producing a key we want to traverse the constant not the
            // variable used to refer to it.
            return this.original.visitExpression(visitor, context);
        }
        else {
            return this.resolved.visitExpression(visitor, context);
        }
    }
    isEquivalent(e) {
        return e instanceof FixupExpression && this.resolved.isEquivalent(e.resolved);
    }
    isConstant() {
        return true;
    }
    fixup(expression) {
        this.resolved = expression;
        this.shared = true;
    }
}
/**
 * A constant pool allows a code emitter to share constant in an output context.
 *
 * The constant pool also supports sharing access to ivy definitions references.
 */
export class ConstantPool {
    constructor(isClosureCompilerEnabled = false) {
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
    getConstLiteral(literal, forceShared) {
        if ((literal instanceof o.LiteralExpr && !isLongStringLiteral(literal)) ||
            literal instanceof FixupExpression) {
            // Do no put simple literals into the constant pool or try to produce a constant for a
            // reference to a constant.
            return literal;
        }
        const key = this.keyOf(literal);
        let fixup = this.literals.get(key);
        let newValue = false;
        if (!fixup) {
            fixup = new FixupExpression(literal);
            this.literals.set(key, fixup);
            newValue = true;
        }
        if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
            // Replace the expression with a variable
            const name = this.freshName();
            let definition;
            let usage;
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
                definition = o.variable(name).set(new o.FunctionExpr([], // Params.
                [
                    // Statements.
                    new o.ReturnStatement(literal),
                ]));
                usage = o.variable(name).callFn([]);
            }
            else {
                // Just declare and use the variable directly, without a function call
                // indirection. This saves a few bytes and avoids an unncessary call.
                definition = o.variable(name).set(literal);
                usage = o.variable(name);
            }
            this.statements.push(definition.toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
            fixup.fixup(usage);
        }
        return fixup;
    }
    getDefinition(type, kind, ctx, forceShared = false) {
        const definitions = this.definitionsOf(kind);
        let fixup = definitions.get(type);
        let newValue = false;
        if (!fixup) {
            const property = this.propertyNameOf(kind);
            fixup = new FixupExpression(ctx.importExpr(type).prop(property));
            definitions.set(type, fixup);
            newValue = true;
        }
        if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
            const name = this.freshName();
            this.statements.push(o.variable(name).set(fixup.resolved).toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
            fixup.fixup(o.variable(name));
        }
        return fixup;
    }
    getLiteralFactory(literal) {
        // Create a pure function that builds an array of a mix of constant and variable expressions
        if (literal instanceof o.LiteralArrayExpr) {
            const argumentsForKey = literal.entries.map(e => e.isConstant() ? e : UNKNOWN_VALUE_KEY);
            const key = this.keyOf(o.literalArr(argumentsForKey));
            return this._getLiteralFactory(key, literal.entries, entries => o.literalArr(entries));
        }
        else {
            const expressionForKey = o.literalMap(literal.entries.map(e => ({
                key: e.key,
                value: e.value.isConstant() ? e.value : UNKNOWN_VALUE_KEY,
                quoted: e.quoted
            })));
            const key = this.keyOf(expressionForKey);
            return this._getLiteralFactory(key, literal.entries.map(e => e.value), entries => o.literalMap(entries.map((value, index) => ({
                key: literal.entries[index].key,
                value,
                quoted: literal.entries[index].quoted
            }))));
        }
    }
    _getLiteralFactory(key, values, resultMap) {
        let literalFactory = this.literalFactories.get(key);
        const literalFactoryArguments = values.filter((e => !e.isConstant()));
        if (!literalFactory) {
            const resultExpressions = values.map((e, index) => e.isConstant() ? this.getConstLiteral(e, true) : o.variable(`a${index}`));
            const parameters = resultExpressions.filter(isVariable).map(e => new o.FnParam(e.name, o.DYNAMIC_TYPE));
            const pureFunctionDeclaration = o.fn(parameters, [new o.ReturnStatement(resultMap(resultExpressions))], o.INFERRED_TYPE);
            const name = this.freshName();
            this.statements.push(o.variable(name).set(pureFunctionDeclaration).toDeclStmt(o.INFERRED_TYPE, [
                o.StmtModifier.Final
            ]));
            literalFactory = o.variable(name);
            this.literalFactories.set(key, literalFactory);
        }
        return { literalFactory, literalFactoryArguments };
    }
    /**
     * Produce a unique name.
     *
     * The name might be unique among different prefixes if any of the prefixes end in
     * a digit so the prefix should be a constant string (not based on user input) and
     * must not end in a digit.
     */
    uniqueName(prefix) {
        return `${prefix}${this.nextNameIndex++}`;
    }
    definitionsOf(kind) {
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
        error(`Unknown definition kind ${kind}`);
        return this.componentDefinitions;
    }
    propertyNameOf(kind) {
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
        error(`Unknown definition kind ${kind}`);
        return '<unknown>';
    }
    freshName() {
        return this.uniqueName(CONSTANT_PREFIX);
    }
    keyOf(expression) {
        return expression.visitExpression(new KeyVisitor(), KEY_CONTEXT);
    }
}
/**
 * Visitor used to determine if 2 expressions are equivalent and can be shared in the
 * `ConstantPool`.
 *
 * When the id (string) generated by the visitor is equal, expressions are considered equivalent.
 */
class KeyVisitor {
    constructor() {
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
    visitLiteralExpr(ast) {
        return `${typeof ast.value === 'string' ? '"' + ast.value + '"' : ast.value}`;
    }
    visitLiteralArrayExpr(ast, context) {
        return `[${ast.entries.map(entry => entry.visitExpression(this, context)).join(',')}]`;
    }
    visitLiteralMapExpr(ast, context) {
        const mapKey = (entry) => {
            const quote = entry.quoted ? '"' : '';
            return `${quote}${entry.key}${quote}`;
        };
        const mapEntry = (entry) => `${mapKey(entry)}:${entry.value.visitExpression(this, context)}`;
        return `{${ast.entries.map(mapEntry).join(',')}`;
    }
    visitExternalExpr(ast) {
        return ast.value.moduleName ? `EX:${ast.value.moduleName}:${ast.value.name}` :
            `EX:${ast.value.runtime.name}`;
    }
    visitReadVarExpr(node) {
        return `VAR:${node.name}`;
    }
    visitTypeofExpr(node, context) {
        return `TYPEOF:${node.expr.visitExpression(this, context)}`;
    }
}
function invalid(arg) {
    throw new Error(`Invalid state: Visitor ${this.constructor.name} doesn't handle ${arg.constructor.name}`);
}
function isVariable(e) {
    return e instanceof o.ReadVarExpr;
}
function isLongStringLiteral(expr) {
    return expr instanceof o.LiteralExpr && typeof expr.value === 'string' &&
        expr.value.length >= POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRfcG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb25zdGFudF9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxDQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDekMsT0FBTyxFQUFDLEtBQUssRUFBZ0IsTUFBTSxRQUFRLENBQUM7QUFFNUMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBRTdCOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFTbEQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFFdkI7Ozs7R0FJRztBQUNILE1BQU0sMkNBQTJDLEdBQUcsRUFBRSxDQUFDO0FBRXZEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLGVBQWdCLFNBQVEsQ0FBQyxDQUFDLFVBQVU7SUFNeEMsWUFBbUIsUUFBc0I7UUFDdkMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURKLGFBQVEsR0FBUixRQUFRLENBQWM7UUFFdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDM0IsQ0FBQztJQUVELGVBQWUsQ0FBQyxPQUE0QixFQUFFLE9BQVk7UUFDeEQsSUFBSSxPQUFPLEtBQUssV0FBVyxFQUFFO1lBQzNCLGdFQUFnRTtZQUNoRSxnQ0FBZ0M7WUFDaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDeEQ7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3hEO0lBQ0gsQ0FBQztJQUVELFlBQVksQ0FBQyxDQUFlO1FBQzFCLE9BQU8s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LENBQUMsV0FBVyxDQUFDLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNoRyxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsQ0FBZTtJQUNqQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQ3BDLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQWtCO0lBQzdDLE9BQU8sSUFBSSxZQUFZLENBQUMsQ0FBQyxXQUFXLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVE7UUFDbEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksMkNBQTJDLENBQUM7QUFDdkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtlcnJvciwgT3V0cHV0Q29udGV4dH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgQ09OU1RBTlRfUFJFRklYID0gJ19jJztcblxuLyoqXG4gKiBgQ29uc3RhbnRQb29sYCB0cmllcyB0byByZXVzZSBsaXRlcmFsIGZhY3RvcmllcyB3aGVuIHR3byBvciBtb3JlIGxpdGVyYWxzIGFyZSBpZGVudGljYWwuXG4gKiBXZSBkZXRlcm1pbmUgd2hldGhlciBsaXRlcmFscyBhcmUgaWRlbnRpY2FsIGJ5IGNyZWF0aW5nIGEga2V5IG91dCBvZiB0aGVpciBBU1QgdXNpbmcgdGhlXG4gKiBgS2V5VmlzaXRvcmAuIFRoaXMgY29uc3RhbnQgaXMgdXNlZCB0byByZXBsYWNlIGR5bmFtaWMgZXhwcmVzc2lvbnMgd2hpY2ggY2FuJ3QgYmUgc2FmZWx5XG4gKiBjb252ZXJ0ZWQgaW50byBhIGtleS4gRS5nLiBnaXZlbiBhbiBleHByZXNzaW9uIGB7Zm9vOiBiYXIoKX1gLCBzaW5jZSB3ZSBkb24ndCBrbm93IHdoYXRcbiAqIHRoZSByZXN1bHQgb2YgYGJhcmAgd2lsbCBiZSwgd2UgY3JlYXRlIGEga2V5IHRoYXQgbG9va3MgbGlrZSBge2ZvbzogPHVua25vd24+fWAuIE5vdGVcbiAqIHRoYXQgd2UgdXNlIGEgdmFyaWFibGUsIHJhdGhlciB0aGFuIHNvbWV0aGluZyBsaWtlIGBudWxsYCBpbiBvcmRlciB0byBhdm9pZCBjb2xsaXNpb25zLlxuICovXG5jb25zdCBVTktOT1dOX1ZBTFVFX0tFWSA9IG8udmFyaWFibGUoJzx1bmtub3duPicpO1xuXG5leHBvcnQgY29uc3QgZW51bSBEZWZpbml0aW9uS2luZCB7XG4gIEluamVjdG9yLFxuICBEaXJlY3RpdmUsXG4gIENvbXBvbmVudCxcbiAgUGlwZVxufVxuXG4vKipcbiAqIENvbnRleHQgdG8gdXNlIHdoZW4gcHJvZHVjaW5nIGEga2V5LlxuICpcbiAqIFRoaXMgZW5zdXJlcyB3ZSBzZWUgdGhlIGNvbnN0YW50IG5vdCB0aGUgcmVmZXJlbmNlIHZhcmlhYmxlIHdoZW4gcHJvZHVjaW5nXG4gKiBhIGtleS5cbiAqL1xuY29uc3QgS0VZX0NPTlRFWFQgPSB7fTtcblxuLyoqXG4gKiBHZW5lcmFsbHkgYWxsIHByaW1pdGl2ZSB2YWx1ZXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIGBDb25zdGFudFBvb2xgLCBidXQgdGhlcmUgaXMgYW4gZXhjbHVzaW9uXG4gKiBmb3Igc3RyaW5ncyB0aGF0IHJlYWNoIGEgY2VydGFpbiBsZW5ndGggdGhyZXNob2xkLiBUaGlzIGNvbnN0YW50IGRlZmluZXMgdGhlIGxlbmd0aCB0aHJlc2hvbGQgZm9yXG4gKiBzdHJpbmdzLlxuICovXG5jb25zdCBQT09MX0lOQ0xVU0lPTl9MRU5HVEhfVEhSRVNIT0xEX0ZPUl9TVFJJTkdTID0gNTA7XG5cbi8qKlxuICogQSBub2RlIHRoYXQgaXMgYSBwbGFjZS1ob2xkZXIgdGhhdCBhbGxvd3MgdGhlIG5vZGUgdG8gYmUgcmVwbGFjZWQgd2hlbiB0aGUgYWN0dWFsXG4gKiBub2RlIGlzIGtub3duLlxuICpcbiAqIFRoaXMgYWxsb3dzIHRoZSBjb25zdGFudCBwb29sIHRvIGNoYW5nZSBhbiBleHByZXNzaW9uIGZyb20gYSBkaXJlY3QgcmVmZXJlbmNlIHRvXG4gKiBhIGNvbnN0YW50IHRvIGEgc2hhcmVkIGNvbnN0YW50LiBJdCByZXR1cm5zIGEgZml4LXVwIG5vZGUgdGhhdCBpcyBsYXRlciBhbGxvd2VkIHRvXG4gKiBjaGFuZ2UgdGhlIHJlZmVyZW5jZWQgZXhwcmVzc2lvbi5cbiAqL1xuY2xhc3MgRml4dXBFeHByZXNzaW9uIGV4dGVuZHMgby5FeHByZXNzaW9uIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbDogby5FeHByZXNzaW9uO1xuXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBzaGFyZWQhOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZXNvbHZlZDogby5FeHByZXNzaW9uKSB7XG4gICAgc3VwZXIocmVzb2x2ZWQudHlwZSk7XG4gICAgdGhpcy5vcmlnaW5hbCA9IHJlc29sdmVkO1xuICB9XG5cbiAgdmlzaXRFeHByZXNzaW9uKHZpc2l0b3I6IG8uRXhwcmVzc2lvblZpc2l0b3IsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgaWYgKGNvbnRleHQgPT09IEtFWV9DT05URVhUKSB7XG4gICAgICAvLyBXaGVuIHByb2R1Y2luZyBhIGtleSB3ZSB3YW50IHRvIHRyYXZlcnNlIHRoZSBjb25zdGFudCBub3QgdGhlXG4gICAgICAvLyB2YXJpYWJsZSB1c2VkIHRvIHJlZmVyIHRvIGl0LlxuICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWwudmlzaXRFeHByZXNzaW9uKHZpc2l0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlZC52aXNpdEV4cHJlc3Npb24odmlzaXRvciwgY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgaXNFcXVpdmFsZW50KGU6IG8uRXhwcmVzc2lvbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlIGluc3RhbmNlb2YgRml4dXBFeHByZXNzaW9uICYmIHRoaXMucmVzb2x2ZWQuaXNFcXVpdmFsZW50KGUucmVzb2x2ZWQpO1xuICB9XG5cbiAgaXNDb25zdGFudCgpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZpeHVwKGV4cHJlc3Npb246IG8uRXhwcmVzc2lvbikge1xuICAgIHRoaXMucmVzb2x2ZWQgPSBleHByZXNzaW9uO1xuICAgIHRoaXMuc2hhcmVkID0gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEEgY29uc3RhbnQgcG9vbCBhbGxvd3MgYSBjb2RlIGVtaXR0ZXIgdG8gc2hhcmUgY29uc3RhbnQgaW4gYW4gb3V0cHV0IGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnN0YW50IHBvb2wgYWxzbyBzdXBwb3J0cyBzaGFyaW5nIGFjY2VzcyB0byBpdnkgZGVmaW5pdGlvbnMgcmVmZXJlbmNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnN0YW50UG9vbCB7XG4gIHN0YXRlbWVudHM6IG8uU3RhdGVtZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBsaXRlcmFscyA9IG5ldyBNYXA8c3RyaW5nLCBGaXh1cEV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgbGl0ZXJhbEZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBvLkV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgaW5qZWN0b3JEZWZpbml0aW9ucyA9IG5ldyBNYXA8YW55LCBGaXh1cEV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgZGlyZWN0aXZlRGVmaW5pdGlvbnMgPSBuZXcgTWFwPGFueSwgRml4dXBFeHByZXNzaW9uPigpO1xuICBwcml2YXRlIGNvbXBvbmVudERlZmluaXRpb25zID0gbmV3IE1hcDxhbnksIEZpeHVwRXhwcmVzc2lvbj4oKTtcbiAgcHJpdmF0ZSBwaXBlRGVmaW5pdGlvbnMgPSBuZXcgTWFwPGFueSwgRml4dXBFeHByZXNzaW9uPigpO1xuXG4gIHByaXZhdGUgbmV4dE5hbWVJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBpc0Nsb3N1cmVDb21waWxlckVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZSkge31cblxuICBnZXRDb25zdExpdGVyYWwobGl0ZXJhbDogby5FeHByZXNzaW9uLCBmb3JjZVNoYXJlZD86IGJvb2xlYW4pOiBvLkV4cHJlc3Npb24ge1xuICAgIGlmICgobGl0ZXJhbCBpbnN0YW5jZW9mIG8uTGl0ZXJhbEV4cHIgJiYgIWlzTG9uZ1N0cmluZ0xpdGVyYWwobGl0ZXJhbCkpIHx8XG4gICAgICAgIGxpdGVyYWwgaW5zdGFuY2VvZiBGaXh1cEV4cHJlc3Npb24pIHtcbiAgICAgIC8vIERvIG5vIHB1dCBzaW1wbGUgbGl0ZXJhbHMgaW50byB0aGUgY29uc3RhbnQgcG9vbCBvciB0cnkgdG8gcHJvZHVjZSBhIGNvbnN0YW50IGZvciBhXG4gICAgICAvLyByZWZlcmVuY2UgdG8gYSBjb25zdGFudC5cbiAgICAgIHJldHVybiBsaXRlcmFsO1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSB0aGlzLmtleU9mKGxpdGVyYWwpO1xuICAgIGxldCBmaXh1cCA9IHRoaXMubGl0ZXJhbHMuZ2V0KGtleSk7XG4gICAgbGV0IG5ld1ZhbHVlID0gZmFsc2U7XG4gICAgaWYgKCFmaXh1cCkge1xuICAgICAgZml4dXAgPSBuZXcgRml4dXBFeHByZXNzaW9uKGxpdGVyYWwpO1xuICAgICAgdGhpcy5saXRlcmFscy5zZXQoa2V5LCBmaXh1cCk7XG4gICAgICBuZXdWYWx1ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCghbmV3VmFsdWUgJiYgIWZpeHVwLnNoYXJlZCkgfHwgKG5ld1ZhbHVlICYmIGZvcmNlU2hhcmVkKSkge1xuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhwcmVzc2lvbiB3aXRoIGEgdmFyaWFibGVcbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmZyZXNoTmFtZSgpO1xuICAgICAgbGV0IGRlZmluaXRpb246IG8uV3JpdGVWYXJFeHByO1xuICAgICAgbGV0IHVzYWdlOiBvLkV4cHJlc3Npb247XG4gICAgICBpZiAodGhpcy5pc0Nsb3N1cmVDb21waWxlckVuYWJsZWQgJiYgaXNMb25nU3RyaW5nTGl0ZXJhbChsaXRlcmFsKSkge1xuICAgICAgICAvLyBGb3Igc3RyaW5nIGxpdGVyYWxzLCBDbG9zdXJlIHdpbGwgKiphbHdheXMqKiBpbmxpbmUgdGhlIHN0cmluZyBhdFxuICAgICAgICAvLyAqKmFsbCoqIHVzYWdlcywgZHVwbGljYXRpbmcgaXQgZWFjaCB0aW1lLiBGb3IgbGFyZ2Ugc3RyaW5ncywgdGhpc1xuICAgICAgICAvLyB1bm5lY2Vzc2FyaWx5IGJsb2F0cyBidW5kbGUgc2l6ZS4gVG8gd29yayBhcm91bmQgdGhpcyByZXN0cmljdGlvbiwgd2VcbiAgICAgICAgLy8gd3JhcCB0aGUgc3RyaW5nIGluIGEgZnVuY3Rpb24sIGFuZCBjYWxsIHRoYXQgZnVuY3Rpb24gZm9yIGVhY2ggdXNhZ2UuXG4gICAgICAgIC8vIFRoaXMgdHJpY2tzIENsb3N1cmUgaW50byB1c2luZyBpbmxpbmUgbG9naWMgZm9yIGZ1bmN0aW9ucyBpbnN0ZWFkIG9mXG4gICAgICAgIC8vIHN0cmluZyBsaXRlcmFscy4gRnVuY3Rpb24gY2FsbHMgYXJlIG9ubHkgaW5saW5lZCBpZiB0aGUgYm9keSBpcyBzbWFsbFxuICAgICAgICAvLyBlbm91Z2ggdG8gYmUgd29ydGggaXQuIEJ5IGRvaW5nIHRoaXMsIHZlcnkgbGFyZ2Ugc3RyaW5ncyB3aWxsIGJlXG4gICAgICAgIC8vIHNoYXJlZCBhY3Jvc3MgbXVsdGlwbGUgdXNhZ2VzLCByYXRoZXIgdGhhbiBkdXBsaWNhdGluZyB0aGUgc3RyaW5nIGF0XG4gICAgICAgIC8vIGVhY2ggdXNhZ2Ugc2l0ZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc3QgbXlTdHIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwidmVyeSB2ZXJ5IHZlcnkgbG9uZyBzdHJpbmdcIjsgfTtcbiAgICAgICAgLy8gY29uc3QgdXNhZ2UxID0gbXlTdHIoKTtcbiAgICAgICAgLy8gY29uc3QgdXNhZ2UyID0gbXlTdHIoKTtcbiAgICAgICAgZGVmaW5pdGlvbiA9IG8udmFyaWFibGUobmFtZSkuc2V0KG5ldyBvLkZ1bmN0aW9uRXhwcihcbiAgICAgICAgICAgIFtdLCAgLy8gUGFyYW1zLlxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAvLyBTdGF0ZW1lbnRzLlxuICAgICAgICAgICAgICBuZXcgby5SZXR1cm5TdGF0ZW1lbnQobGl0ZXJhbCksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIHVzYWdlID0gby52YXJpYWJsZShuYW1lKS5jYWxsRm4oW10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSnVzdCBkZWNsYXJlIGFuZCB1c2UgdGhlIHZhcmlhYmxlIGRpcmVjdGx5LCB3aXRob3V0IGEgZnVuY3Rpb24gY2FsbFxuICAgICAgICAvLyBpbmRpcmVjdGlvbi4gVGhpcyBzYXZlcyBhIGZldyBieXRlcyBhbmQgYXZvaWRzIGFuIHVubmNlc3NhcnkgY2FsbC5cbiAgICAgICAgZGVmaW5pdGlvbiA9IG8udmFyaWFibGUobmFtZSkuc2V0KGxpdGVyYWwpO1xuICAgICAgICB1c2FnZSA9IG8udmFyaWFibGUobmFtZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKGRlZmluaXRpb24udG9EZWNsU3RtdChvLklORkVSUkVEX1RZUEUsIFtvLlN0bXRNb2RpZmllci5GaW5hbF0pKTtcbiAgICAgIGZpeHVwLmZpeHVwKHVzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZml4dXA7XG4gIH1cblxuICBnZXREZWZpbml0aW9uKHR5cGU6IGFueSwga2luZDogRGVmaW5pdGlvbktpbmQsIGN0eDogT3V0cHV0Q29udGV4dCwgZm9yY2VTaGFyZWQ6IGJvb2xlYW4gPSBmYWxzZSk6XG4gICAgICBvLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGRlZmluaXRpb25zID0gdGhpcy5kZWZpbml0aW9uc09mKGtpbmQpO1xuICAgIGxldCBmaXh1cCA9IGRlZmluaXRpb25zLmdldCh0eXBlKTtcbiAgICBsZXQgbmV3VmFsdWUgPSBmYWxzZTtcbiAgICBpZiAoIWZpeHVwKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eSA9IHRoaXMucHJvcGVydHlOYW1lT2Yoa2luZCk7XG4gICAgICBmaXh1cCA9IG5ldyBGaXh1cEV4cHJlc3Npb24oY3R4LmltcG9ydEV4cHIodHlwZSkucHJvcChwcm9wZXJ0eSkpO1xuICAgICAgZGVmaW5pdGlvbnMuc2V0KHR5cGUsIGZpeHVwKTtcbiAgICAgIG5ld1ZhbHVlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoKCFuZXdWYWx1ZSAmJiAhZml4dXAuc2hhcmVkKSB8fCAobmV3VmFsdWUgJiYgZm9yY2VTaGFyZWQpKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5mcmVzaE5hbWUoKTtcbiAgICAgIHRoaXMuc3RhdGVtZW50cy5wdXNoKFxuICAgICAgICAgIG8udmFyaWFibGUobmFtZSkuc2V0KGZpeHVwLnJlc29sdmVkKS50b0RlY2xTdG10KG8uSU5GRVJSRURfVFlQRSwgW28uU3RtdE1vZGlmaWVyLkZpbmFsXSkpO1xuICAgICAgZml4dXAuZml4dXAoby52YXJpYWJsZShuYW1lKSk7XG4gICAgfVxuICAgIHJldHVybiBmaXh1cDtcbiAgfVxuXG4gIGdldExpdGVyYWxGYWN0b3J5KGxpdGVyYWw6IG8uTGl0ZXJhbEFycmF5RXhwcnxvLkxpdGVyYWxNYXBFeHByKTpcbiAgICAgIHtsaXRlcmFsRmFjdG9yeTogby5FeHByZXNzaW9uLCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50czogby5FeHByZXNzaW9uW119IHtcbiAgICAvLyBDcmVhdGUgYSBwdXJlIGZ1bmN0aW9uIHRoYXQgYnVpbGRzIGFuIGFycmF5IG9mIGEgbWl4IG9mIGNvbnN0YW50IGFuZCB2YXJpYWJsZSBleHByZXNzaW9uc1xuICAgIGlmIChsaXRlcmFsIGluc3RhbmNlb2Ygby5MaXRlcmFsQXJyYXlFeHByKSB7XG4gICAgICBjb25zdCBhcmd1bWVudHNGb3JLZXkgPSBsaXRlcmFsLmVudHJpZXMubWFwKGUgPT4gZS5pc0NvbnN0YW50KCkgPyBlIDogVU5LTk9XTl9WQUxVRV9LRVkpO1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5rZXlPZihvLmxpdGVyYWxBcnIoYXJndW1lbnRzRm9yS2V5KSk7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0TGl0ZXJhbEZhY3Rvcnkoa2V5LCBsaXRlcmFsLmVudHJpZXMsIGVudHJpZXMgPT4gby5saXRlcmFsQXJyKGVudHJpZXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbkZvcktleSA9IG8ubGl0ZXJhbE1hcChcbiAgICAgICAgICBsaXRlcmFsLmVudHJpZXMubWFwKGUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBlLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGUudmFsdWUuaXNDb25zdGFudCgpID8gZS52YWx1ZSA6IFVOS05PV05fVkFMVUVfS0VZLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdW90ZWQ6IGUucXVvdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSkpO1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5rZXlPZihleHByZXNzaW9uRm9yS2V5KTtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRMaXRlcmFsRmFjdG9yeShcbiAgICAgICAgICBrZXksIGxpdGVyYWwuZW50cmllcy5tYXAoZSA9PiBlLnZhbHVlKSxcbiAgICAgICAgICBlbnRyaWVzID0+IG8ubGl0ZXJhbE1hcChlbnRyaWVzLm1hcCgodmFsdWUsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBsaXRlcmFsLmVudHJpZXNbaW5kZXhdLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVvdGVkOiBsaXRlcmFsLmVudHJpZXNbaW5kZXhdLnF1b3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldExpdGVyYWxGYWN0b3J5KFxuICAgICAga2V5OiBzdHJpbmcsIHZhbHVlczogby5FeHByZXNzaW9uW10sIHJlc3VsdE1hcDogKHBhcmFtZXRlcnM6IG8uRXhwcmVzc2lvbltdKSA9PiBvLkV4cHJlc3Npb24pOlxuICAgICAge2xpdGVyYWxGYWN0b3J5OiBvLkV4cHJlc3Npb24sIGxpdGVyYWxGYWN0b3J5QXJndW1lbnRzOiBvLkV4cHJlc3Npb25bXX0ge1xuICAgIGxldCBsaXRlcmFsRmFjdG9yeSA9IHRoaXMubGl0ZXJhbEZhY3Rvcmllcy5nZXQoa2V5KTtcbiAgICBjb25zdCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50cyA9IHZhbHVlcy5maWx0ZXIoKGUgPT4gIWUuaXNDb25zdGFudCgpKSk7XG4gICAgaWYgKCFsaXRlcmFsRmFjdG9yeSkge1xuICAgICAgY29uc3QgcmVzdWx0RXhwcmVzc2lvbnMgPSB2YWx1ZXMubWFwKFxuICAgICAgICAgIChlLCBpbmRleCkgPT4gZS5pc0NvbnN0YW50KCkgPyB0aGlzLmdldENvbnN0TGl0ZXJhbChlLCB0cnVlKSA6IG8udmFyaWFibGUoYGEke2luZGV4fWApKTtcbiAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPVxuICAgICAgICAgIHJlc3VsdEV4cHJlc3Npb25zLmZpbHRlcihpc1ZhcmlhYmxlKS5tYXAoZSA9PiBuZXcgby5GblBhcmFtKGUubmFtZSEsIG8uRFlOQU1JQ19UWVBFKSk7XG4gICAgICBjb25zdCBwdXJlRnVuY3Rpb25EZWNsYXJhdGlvbiA9XG4gICAgICAgICAgby5mbihwYXJhbWV0ZXJzLCBbbmV3IG8uUmV0dXJuU3RhdGVtZW50KHJlc3VsdE1hcChyZXN1bHRFeHByZXNzaW9ucykpXSwgby5JTkZFUlJFRF9UWVBFKTtcbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmZyZXNoTmFtZSgpO1xuICAgICAgdGhpcy5zdGF0ZW1lbnRzLnB1c2goXG4gICAgICAgICAgby52YXJpYWJsZShuYW1lKS5zZXQocHVyZUZ1bmN0aW9uRGVjbGFyYXRpb24pLnRvRGVjbFN0bXQoby5JTkZFUlJFRF9UWVBFLCBbXG4gICAgICAgICAgICBvLlN0bXRNb2RpZmllci5GaW5hbFxuICAgICAgICAgIF0pKTtcbiAgICAgIGxpdGVyYWxGYWN0b3J5ID0gby52YXJpYWJsZShuYW1lKTtcbiAgICAgIHRoaXMubGl0ZXJhbEZhY3Rvcmllcy5zZXQoa2V5LCBsaXRlcmFsRmFjdG9yeSk7XG4gICAgfVxuICAgIHJldHVybiB7bGl0ZXJhbEZhY3RvcnksIGxpdGVyYWxGYWN0b3J5QXJndW1lbnRzfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlIGEgdW5pcXVlIG5hbWUuXG4gICAqXG4gICAqIFRoZSBuYW1lIG1pZ2h0IGJlIHVuaXF1ZSBhbW9uZyBkaWZmZXJlbnQgcHJlZml4ZXMgaWYgYW55IG9mIHRoZSBwcmVmaXhlcyBlbmQgaW5cbiAgICogYSBkaWdpdCBzbyB0aGUgcHJlZml4IHNob3VsZCBiZSBhIGNvbnN0YW50IHN0cmluZyAobm90IGJhc2VkIG9uIHVzZXIgaW5wdXQpIGFuZFxuICAgKiBtdXN0IG5vdCBlbmQgaW4gYSBkaWdpdC5cbiAgICovXG4gIHVuaXF1ZU5hbWUocHJlZml4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHt0aGlzLm5leHROYW1lSW5kZXgrK31gO1xuICB9XG5cbiAgcHJpdmF0ZSBkZWZpbml0aW9uc09mKGtpbmQ6IERlZmluaXRpb25LaW5kKTogTWFwPGFueSwgRml4dXBFeHByZXNzaW9uPiB7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkNvbXBvbmVudDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcG9uZW50RGVmaW5pdGlvbnM7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkRpcmVjdGl2ZTpcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlyZWN0aXZlRGVmaW5pdGlvbnM7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLkluamVjdG9yOlxuICAgICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZmluaXRpb25zO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5QaXBlOlxuICAgICAgICByZXR1cm4gdGhpcy5waXBlRGVmaW5pdGlvbnM7XG4gICAgfVxuICAgIGVycm9yKGBVbmtub3duIGRlZmluaXRpb24ga2luZCAke2tpbmR9YCk7XG4gICAgcmV0dXJuIHRoaXMuY29tcG9uZW50RGVmaW5pdGlvbnM7XG4gIH1cblxuICBwdWJsaWMgcHJvcGVydHlOYW1lT2Yoa2luZDogRGVmaW5pdGlvbktpbmQpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5Db21wb25lbnQ6XG4gICAgICAgIHJldHVybiAnybVjbXAnO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5EaXJlY3RpdmU6XG4gICAgICAgIHJldHVybiAnybVkaXInO1xuICAgICAgY2FzZSBEZWZpbml0aW9uS2luZC5JbmplY3RvcjpcbiAgICAgICAgcmV0dXJuICfJtWluaic7XG4gICAgICBjYXNlIERlZmluaXRpb25LaW5kLlBpcGU6XG4gICAgICAgIHJldHVybiAnybVwaXBlJztcbiAgICB9XG4gICAgZXJyb3IoYFVua25vd24gZGVmaW5pdGlvbiBraW5kICR7a2luZH1gKTtcbiAgICByZXR1cm4gJzx1bmtub3duPic7XG4gIH1cblxuICBwcml2YXRlIGZyZXNoTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnVuaXF1ZU5hbWUoQ09OU1RBTlRfUFJFRklYKTtcbiAgfVxuXG4gIHByaXZhdGUga2V5T2YoZXhwcmVzc2lvbjogby5FeHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIGV4cHJlc3Npb24udmlzaXRFeHByZXNzaW9uKG5ldyBLZXlWaXNpdG9yKCksIEtFWV9DT05URVhUKTtcbiAgfVxufVxuXG4vKipcbiAqIFZpc2l0b3IgdXNlZCB0byBkZXRlcm1pbmUgaWYgMiBleHByZXNzaW9ucyBhcmUgZXF1aXZhbGVudCBhbmQgY2FuIGJlIHNoYXJlZCBpbiB0aGVcbiAqIGBDb25zdGFudFBvb2xgLlxuICpcbiAqIFdoZW4gdGhlIGlkIChzdHJpbmcpIGdlbmVyYXRlZCBieSB0aGUgdmlzaXRvciBpcyBlcXVhbCwgZXhwcmVzc2lvbnMgYXJlIGNvbnNpZGVyZWQgZXF1aXZhbGVudC5cbiAqL1xuY2xhc3MgS2V5VmlzaXRvciBpbXBsZW1lbnRzIG8uRXhwcmVzc2lvblZpc2l0b3Ige1xuICB2aXNpdExpdGVyYWxFeHByKGFzdDogby5MaXRlcmFsRXhwcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3R5cGVvZiBhc3QudmFsdWUgPT09ICdzdHJpbmcnID8gJ1wiJyArIGFzdC52YWx1ZSArICdcIicgOiBhc3QudmFsdWV9YDtcbiAgfVxuXG4gIHZpc2l0TGl0ZXJhbEFycmF5RXhwcihhc3Q6IG8uTGl0ZXJhbEFycmF5RXhwciwgY29udGV4dDogb2JqZWN0KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFske2FzdC5lbnRyaWVzLm1hcChlbnRyeSA9PiBlbnRyeS52aXNpdEV4cHJlc3Npb24odGhpcywgY29udGV4dCkpLmpvaW4oJywnKX1dYDtcbiAgfVxuXG4gIHZpc2l0TGl0ZXJhbE1hcEV4cHIoYXN0OiBvLkxpdGVyYWxNYXBFeHByLCBjb250ZXh0OiBvYmplY3QpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hcEtleSA9IChlbnRyeTogby5MaXRlcmFsTWFwRW50cnkpID0+IHtcbiAgICAgIGNvbnN0IHF1b3RlID0gZW50cnkucXVvdGVkID8gJ1wiJyA6ICcnO1xuICAgICAgcmV0dXJuIGAke3F1b3RlfSR7ZW50cnkua2V5fSR7cXVvdGV9YDtcbiAgICB9O1xuICAgIGNvbnN0IG1hcEVudHJ5ID0gKGVudHJ5OiBvLkxpdGVyYWxNYXBFbnRyeSkgPT5cbiAgICAgICAgYCR7bWFwS2V5KGVudHJ5KX06JHtlbnRyeS52YWx1ZS52aXNpdEV4cHJlc3Npb24odGhpcywgY29udGV4dCl9YDtcbiAgICByZXR1cm4gYHske2FzdC5lbnRyaWVzLm1hcChtYXBFbnRyeSkuam9pbignLCcpfWA7XG4gIH1cblxuICB2aXNpdEV4dGVybmFsRXhwcihhc3Q6IG8uRXh0ZXJuYWxFeHByKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYXN0LnZhbHVlLm1vZHVsZU5hbWUgPyBgRVg6JHthc3QudmFsdWUubW9kdWxlTmFtZX06JHthc3QudmFsdWUubmFtZX1gIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgRVg6JHthc3QudmFsdWUucnVudGltZS5uYW1lfWA7XG4gIH1cblxuICB2aXNpdFJlYWRWYXJFeHByKG5vZGU6IG8uUmVhZFZhckV4cHIpIHtcbiAgICByZXR1cm4gYFZBUjoke25vZGUubmFtZX1gO1xuICB9XG5cbiAgdmlzaXRUeXBlb2ZFeHByKG5vZGU6IG8uVHlwZW9mRXhwciwgY29udGV4dDogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFRZUEVPRjoke25vZGUuZXhwci52aXNpdEV4cHJlc3Npb24odGhpcywgY29udGV4dCl9YDtcbiAgfVxuXG4gIHZpc2l0V3JhcHBlZE5vZGVFeHByID0gaW52YWxpZDtcbiAgdmlzaXRXcml0ZVZhckV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdFdyaXRlS2V5RXhwciA9IGludmFsaWQ7XG4gIHZpc2l0V3JpdGVQcm9wRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0SW52b2tlTWV0aG9kRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0SW52b2tlRnVuY3Rpb25FeHByID0gaW52YWxpZDtcbiAgdmlzaXRUYWdnZWRUZW1wbGF0ZUV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEluc3RhbnRpYXRlRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Q29uZGl0aW9uYWxFeHByID0gaW52YWxpZDtcbiAgdmlzaXROb3RFeHByID0gaW52YWxpZDtcbiAgdmlzaXRBc3NlcnROb3ROdWxsRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Q2FzdEV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEZ1bmN0aW9uRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0VW5hcnlPcGVyYXRvckV4cHIgPSBpbnZhbGlkO1xuICB2aXNpdEJpbmFyeU9wZXJhdG9yRXhwciA9IGludmFsaWQ7XG4gIHZpc2l0UmVhZFByb3BFeHByID0gaW52YWxpZDtcbiAgdmlzaXRSZWFkS2V5RXhwciA9IGludmFsaWQ7XG4gIHZpc2l0Q29tbWFFeHByID0gaW52YWxpZDtcbiAgdmlzaXRMb2NhbGl6ZWRTdHJpbmcgPSBpbnZhbGlkO1xufVxuXG5mdW5jdGlvbiBpbnZhbGlkPFQ+KHRoaXM6IG8uRXhwcmVzc2lvblZpc2l0b3IsIGFyZzogby5FeHByZXNzaW9ufG8uU3RhdGVtZW50KTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgSW52YWxpZCBzdGF0ZTogVmlzaXRvciAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gZG9lc24ndCBoYW5kbGUgJHthcmcuY29uc3RydWN0b3IubmFtZX1gKTtcbn1cblxuZnVuY3Rpb24gaXNWYXJpYWJsZShlOiBvLkV4cHJlc3Npb24pOiBlIGlzIG8uUmVhZFZhckV4cHIge1xuICByZXR1cm4gZSBpbnN0YW5jZW9mIG8uUmVhZFZhckV4cHI7XG59XG5cbmZ1bmN0aW9uIGlzTG9uZ1N0cmluZ0xpdGVyYWwoZXhwcjogby5FeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiBleHByIGluc3RhbmNlb2Ygby5MaXRlcmFsRXhwciAmJiB0eXBlb2YgZXhwci52YWx1ZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgIGV4cHIudmFsdWUubGVuZ3RoID49IFBPT0xfSU5DTFVTSU9OX0xFTkdUSF9USFJFU0hPTERfRk9SX1NUUklOR1M7XG59XG4iXX0=
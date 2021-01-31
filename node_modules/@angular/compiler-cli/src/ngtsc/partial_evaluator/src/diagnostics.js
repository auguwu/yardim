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
        define("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/diagnostics", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/dynamic", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/result"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.traceDynamicValue = exports.describeResolvedType = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var dynamic_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/dynamic");
    var result_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/result");
    /**
     * Derives a type representation from a resolved value to be reported in a diagnostic.
     *
     * @param value The resolved value for which a type representation should be derived.
     * @param maxDepth The maximum nesting depth of objects and arrays, defaults to 1 level.
     */
    function describeResolvedType(value, maxDepth) {
        var _a, _b;
        if (maxDepth === void 0) { maxDepth = 1; }
        if (value === null) {
            return 'null';
        }
        else if (value === undefined) {
            return 'undefined';
        }
        else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
            return typeof value;
        }
        else if (value instanceof Map) {
            if (maxDepth === 0) {
                return 'object';
            }
            var entries = Array.from(value.entries()).map(function (_a) {
                var _b = tslib_1.__read(_a, 2), key = _b[0], v = _b[1];
                return quoteKey(key) + ": " + describeResolvedType(v, maxDepth - 1);
            });
            return entries.length > 0 ? "{ " + entries.join('; ') + " }" : '{}';
        }
        else if (value instanceof result_1.ResolvedModule) {
            return '(module)';
        }
        else if (value instanceof result_1.EnumValue) {
            return (_a = value.enumRef.debugName) !== null && _a !== void 0 ? _a : '(anonymous)';
        }
        else if (value instanceof imports_1.Reference) {
            return (_b = value.debugName) !== null && _b !== void 0 ? _b : '(anonymous)';
        }
        else if (Array.isArray(value)) {
            if (maxDepth === 0) {
                return 'Array';
            }
            return "[" + value.map(function (v) { return describeResolvedType(v, maxDepth - 1); }).join(', ') + "]";
        }
        else if (value instanceof dynamic_1.DynamicValue) {
            return '(not statically analyzable)';
        }
        else if (value instanceof result_1.KnownFn) {
            return 'Function';
        }
        else {
            return 'unknown';
        }
    }
    exports.describeResolvedType = describeResolvedType;
    function quoteKey(key) {
        if (/^[a-z0-9_]+$/i.test(key)) {
            return key;
        }
        else {
            return "'" + key.replace(/'/g, '\\\'') + "'";
        }
    }
    /**
     * Creates an array of related information diagnostics for a `DynamicValue` that describe the trace
     * of why an expression was evaluated as dynamic.
     *
     * @param node The node for which a `ts.Diagnostic` is to be created with the trace.
     * @param value The dynamic value for which a trace should be created.
     */
    function traceDynamicValue(node, value) {
        return value.accept(new TraceDynamicValueVisitor(node));
    }
    exports.traceDynamicValue = traceDynamicValue;
    var TraceDynamicValueVisitor = /** @class */ (function () {
        function TraceDynamicValueVisitor(node) {
            this.node = node;
            this.currentContainerNode = null;
        }
        TraceDynamicValueVisitor.prototype.visitDynamicInput = function (value) {
            var trace = value.reason.accept(this);
            if (this.shouldTrace(value.node)) {
                var info = diagnostics_1.makeRelatedInformation(value.node, 'Unable to evaluate this expression statically.');
                trace.unshift(info);
            }
            return trace;
        };
        TraceDynamicValueVisitor.prototype.visitDynamicString = function (value) {
            return [diagnostics_1.makeRelatedInformation(value.node, 'A string value could not be determined statically.')];
        };
        TraceDynamicValueVisitor.prototype.visitExternalReference = function (value) {
            var name = value.reason.debugName;
            var description = name !== null ? "'" + name + "'" : 'an anonymous declaration';
            return [diagnostics_1.makeRelatedInformation(value.node, "A value for " + description + " cannot be determined statically, as it is an external declaration.")];
        };
        TraceDynamicValueVisitor.prototype.visitComplexFunctionCall = function (value) {
            return [
                diagnostics_1.makeRelatedInformation(value.node, 'Unable to evaluate function call of complex function. A function must have exactly one return statement.'),
                diagnostics_1.makeRelatedInformation(value.reason.node, 'Function is declared here.')
            ];
        };
        TraceDynamicValueVisitor.prototype.visitInvalidExpressionType = function (value) {
            return [diagnostics_1.makeRelatedInformation(value.node, 'Unable to evaluate an invalid expression.')];
        };
        TraceDynamicValueVisitor.prototype.visitUnknown = function (value) {
            return [diagnostics_1.makeRelatedInformation(value.node, 'Unable to evaluate statically.')];
        };
        TraceDynamicValueVisitor.prototype.visitUnknownIdentifier = function (value) {
            return [diagnostics_1.makeRelatedInformation(value.node, 'Unknown reference.')];
        };
        TraceDynamicValueVisitor.prototype.visitUnsupportedSyntax = function (value) {
            return [diagnostics_1.makeRelatedInformation(value.node, 'This syntax is not supported.')];
        };
        /**
         * Determines whether the dynamic value reported for the node should be traced, i.e. if it is not
         * part of the container for which the most recent trace was created.
         */
        TraceDynamicValueVisitor.prototype.shouldTrace = function (node) {
            if (node === this.node) {
                // Do not include a dynamic value for the origin node, as the main diagnostic is already
                // reported on that node.
                return false;
            }
            var container = getContainerNode(node);
            if (container === this.currentContainerNode) {
                // The node is part of the same container as the previous trace entry, so this dynamic value
                // should not become part of the trace.
                return false;
            }
            this.currentContainerNode = container;
            return true;
        };
        return TraceDynamicValueVisitor;
    }());
    /**
     * Determines the closest parent node that is to be considered as container, which is used to reduce
     * the granularity of tracing the dynamic values to a single entry per container. Currently, full
     * statements and destructuring patterns are considered as container.
     */
    function getContainerNode(node) {
        var currentNode = node;
        while (currentNode !== undefined) {
            switch (currentNode.kind) {
                case ts.SyntaxKind.ExpressionStatement:
                case ts.SyntaxKind.VariableStatement:
                case ts.SyntaxKind.ReturnStatement:
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.SwitchStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.ContinueStatement:
                case ts.SyntaxKind.BreakStatement:
                case ts.SyntaxKind.ThrowStatement:
                case ts.SyntaxKind.ObjectBindingPattern:
                case ts.SyntaxKind.ArrayBindingPattern:
                    return currentNode;
            }
            currentNode = currentNode.parent;
        }
        return node.getSourceFile();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yL3NyYy9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQWlDO0lBRWpDLDJFQUF5RDtJQUN6RCxtRUFBd0M7SUFFeEMseUZBQTREO0lBQzVELHVGQUEyRTtJQUUzRTs7Ozs7T0FLRztJQUNILFNBQWdCLG9CQUFvQixDQUFDLEtBQW9CLEVBQUUsUUFBb0I7O1FBQXBCLHlCQUFBLEVBQUEsWUFBb0I7UUFDN0UsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE9BQU8sTUFBTSxDQUFDO1NBQ2Y7YUFBTSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDOUIsT0FBTyxXQUFXLENBQUM7U0FDcEI7YUFBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQy9GLE9BQU8sT0FBTyxLQUFLLENBQUM7U0FDckI7YUFBTSxJQUFJLEtBQUssWUFBWSxHQUFHLEVBQUU7WUFDL0IsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFO2dCQUNsQixPQUFPLFFBQVEsQ0FBQzthQUNqQjtZQUNELElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBUTtvQkFBUixLQUFBLHFCQUFRLEVBQVAsR0FBRyxRQUFBLEVBQUUsQ0FBQyxRQUFBO2dCQUN0RCxPQUFVLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBSyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBRyxDQUFDO1lB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VSxDQUFDLG9CQUFvQixDQUFDO2dCQUN4QyxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO29CQUNwQyxPQUFPLFdBQVcsQ0FBQzthQUN0QjtZQUVELFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHttYWtlUmVsYXRlZEluZm9ybWF0aW9ufSBmcm9tICcuLi8uLi9kaWFnbm9zdGljcyc7XG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge0Z1bmN0aW9uRGVmaW5pdGlvbn0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5pbXBvcnQge0R5bmFtaWNWYWx1ZSwgRHluYW1pY1ZhbHVlVmlzaXRvcn0gZnJvbSAnLi9keW5hbWljJztcbmltcG9ydCB7RW51bVZhbHVlLCBLbm93bkZuLCBSZXNvbHZlZE1vZHVsZSwgUmVzb2x2ZWRWYWx1ZX0gZnJvbSAnLi9yZXN1bHQnO1xuXG4vKipcbiAqIERlcml2ZXMgYSB0eXBlIHJlcHJlc2VudGF0aW9uIGZyb20gYSByZXNvbHZlZCB2YWx1ZSB0byBiZSByZXBvcnRlZCBpbiBhIGRpYWdub3N0aWMuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSByZXNvbHZlZCB2YWx1ZSBmb3Igd2hpY2ggYSB0eXBlIHJlcHJlc2VudGF0aW9uIHNob3VsZCBiZSBkZXJpdmVkLlxuICogQHBhcmFtIG1heERlcHRoIFRoZSBtYXhpbXVtIG5lc3RpbmcgZGVwdGggb2Ygb2JqZWN0cyBhbmQgYXJyYXlzLCBkZWZhdWx0cyB0byAxIGxldmVsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVSZXNvbHZlZFR5cGUodmFsdWU6IFJlc29sdmVkVmFsdWUsIG1heERlcHRoOiBudW1iZXIgPSAxKTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuICdudWxsJztcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWU7XG4gIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXApIHtcbiAgICBpZiAobWF4RGVwdGggPT09IDApIHtcbiAgICAgIHJldHVybiAnb2JqZWN0JztcbiAgICB9XG4gICAgY29uc3QgZW50cmllcyA9IEFycmF5LmZyb20odmFsdWUuZW50cmllcygpKS5tYXAoKFtrZXksIHZdKSA9PiB7XG4gICAgICByZXR1cm4gYCR7cXVvdGVLZXkoa2V5KX06ICR7ZGVzY3JpYmVSZXNvbHZlZFR5cGUodiwgbWF4RGVwdGggLSAxKX1gO1xuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzLmxlbmd0aCA+IDAgPyBgeyAke2VudHJpZXMuam9pbignOyAnKX0gfWAgOiAne30nO1xuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVzb2x2ZWRNb2R1bGUpIHtcbiAgICByZXR1cm4gJyhtb2R1bGUpJztcbiAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVudW1WYWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5lbnVtUmVmLmRlYnVnTmFtZSA/PyAnKGFub255bW91cyknO1xuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVmZXJlbmNlKSB7XG4gICAgcmV0dXJuIHZhbHVlLmRlYnVnTmFtZSA/PyAnKGFub255bW91cyknO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgaWYgKG1heERlcHRoID09PSAwKSB7XG4gICAgICByZXR1cm4gJ0FycmF5JztcbiAgICB9XG4gICAgcmV0dXJuIGBbJHt2YWx1ZS5tYXAodiA9PiBkZXNjcmliZVJlc29sdmVkVHlwZSh2LCBtYXhEZXB0aCAtIDEpKS5qb2luKCcsICcpfV1gO1xuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgRHluYW1pY1ZhbHVlKSB7XG4gICAgcmV0dXJuICcobm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZSknO1xuICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgS25vd25Gbikge1xuICAgIHJldHVybiAnRnVuY3Rpb24nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAndW5rbm93bic7XG4gIH1cbn1cblxuZnVuY3Rpb24gcXVvdGVLZXkoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoL15bYS16MC05X10rJC9pLnRlc3Qoa2V5KSkge1xuICAgIHJldHVybiBrZXk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAnJHtrZXkucmVwbGFjZSgvJy9nLCAnXFxcXFxcJycpfSdgO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiByZWxhdGVkIGluZm9ybWF0aW9uIGRpYWdub3N0aWNzIGZvciBhIGBEeW5hbWljVmFsdWVgIHRoYXQgZGVzY3JpYmUgdGhlIHRyYWNlXG4gKiBvZiB3aHkgYW4gZXhwcmVzc2lvbiB3YXMgZXZhbHVhdGVkIGFzIGR5bmFtaWMuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgZm9yIHdoaWNoIGEgYHRzLkRpYWdub3N0aWNgIGlzIHRvIGJlIGNyZWF0ZWQgd2l0aCB0aGUgdHJhY2UuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIGR5bmFtaWMgdmFsdWUgZm9yIHdoaWNoIGEgdHJhY2Ugc2hvdWxkIGJlIGNyZWF0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFjZUR5bmFtaWNWYWx1ZShcbiAgICBub2RlOiB0cy5Ob2RlLCB2YWx1ZTogRHluYW1pY1ZhbHVlKTogdHMuRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbltdIHtcbiAgcmV0dXJuIHZhbHVlLmFjY2VwdChuZXcgVHJhY2VEeW5hbWljVmFsdWVWaXNpdG9yKG5vZGUpKTtcbn1cblxuY2xhc3MgVHJhY2VEeW5hbWljVmFsdWVWaXNpdG9yIGltcGxlbWVudHMgRHluYW1pY1ZhbHVlVmlzaXRvcjx0cy5EaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uW10+IHtcbiAgcHJpdmF0ZSBjdXJyZW50Q29udGFpbmVyTm9kZTogdHMuTm9kZXxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IHRzLk5vZGUpIHt9XG5cbiAgdmlzaXREeW5hbWljSW5wdXQodmFsdWU6IER5bmFtaWNWYWx1ZTxEeW5hbWljVmFsdWU+KTogdHMuRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbltdIHtcbiAgICBjb25zdCB0cmFjZSA9IHZhbHVlLnJlYXNvbi5hY2NlcHQodGhpcyk7XG4gICAgaWYgKHRoaXMuc2hvdWxkVHJhY2UodmFsdWUubm9kZSkpIHtcbiAgICAgIGNvbnN0IGluZm8gPVxuICAgICAgICAgIG1ha2VSZWxhdGVkSW5mb3JtYXRpb24odmFsdWUubm9kZSwgJ1VuYWJsZSB0byBldmFsdWF0ZSB0aGlzIGV4cHJlc3Npb24gc3RhdGljYWxseS4nKTtcbiAgICAgIHRyYWNlLnVuc2hpZnQoaW5mbyk7XG4gICAgfVxuICAgIHJldHVybiB0cmFjZTtcbiAgfVxuXG4gIHZpc2l0RHluYW1pY1N0cmluZyh2YWx1ZTogRHluYW1pY1ZhbHVlKTogdHMuRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbltdIHtcbiAgICByZXR1cm4gW21ha2VSZWxhdGVkSW5mb3JtYXRpb24oXG4gICAgICAgIHZhbHVlLm5vZGUsICdBIHN0cmluZyB2YWx1ZSBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZCBzdGF0aWNhbGx5LicpXTtcbiAgfVxuXG4gIHZpc2l0RXh0ZXJuYWxSZWZlcmVuY2UodmFsdWU6IER5bmFtaWNWYWx1ZTxSZWZlcmVuY2U8dHMuRGVjbGFyYXRpb24+Pik6XG4gICAgICB0cy5EaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uW10ge1xuICAgIGNvbnN0IG5hbWUgPSB2YWx1ZS5yZWFzb24uZGVidWdOYW1lO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gbmFtZSAhPT0gbnVsbCA/IGAnJHtuYW1lfSdgIDogJ2FuIGFub255bW91cyBkZWNsYXJhdGlvbic7XG4gICAgcmV0dXJuIFttYWtlUmVsYXRlZEluZm9ybWF0aW9uKFxuICAgICAgICB2YWx1ZS5ub2RlLFxuICAgICAgICBgQSB2YWx1ZSBmb3IgJHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9ufSBjYW5ub3QgYmUgZGV0ZXJtaW5lZCBzdGF0aWNhbGx5LCBhcyBpdCBpcyBhbiBleHRlcm5hbCBkZWNsYXJhdGlvbi5gKV07XG4gIH1cblxuICB2aXNpdENvbXBsZXhGdW5jdGlvbkNhbGwodmFsdWU6IER5bmFtaWNWYWx1ZTxGdW5jdGlvbkRlZmluaXRpb24+KTpcbiAgICAgIHRzLkRpYWdub3N0aWNSZWxhdGVkSW5mb3JtYXRpb25bXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIG1ha2VSZWxhdGVkSW5mb3JtYXRpb24oXG4gICAgICAgICAgdmFsdWUubm9kZSxcbiAgICAgICAgICAnVW5hYmxlIHRvIGV2YWx1YXRlIGZ1bmN0aW9uIGNhbGwgb2YgY29tcGxleCBmdW5jdGlvbi4gQSBmdW5jdGlvbiBtdXN0IGhhdmUgZXhhY3RseSBvbmUgcmV0dXJuIHN0YXRlbWVudC4nKSxcbiAgICAgIG1ha2VSZWxhdGVkSW5mb3JtYXRpb24odmFsdWUucmVhc29uLm5vZGUsICdGdW5jdGlvbiBpcyBkZWNsYXJlZCBoZXJlLicpXG4gICAgXTtcbiAgfVxuXG4gIHZpc2l0SW52YWxpZEV4cHJlc3Npb25UeXBlKHZhbHVlOiBEeW5hbWljVmFsdWUpOiB0cy5EaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uW10ge1xuICAgIHJldHVybiBbbWFrZVJlbGF0ZWRJbmZvcm1hdGlvbih2YWx1ZS5ub2RlLCAnVW5hYmxlIHRvIGV2YWx1YXRlIGFuIGludmFsaWQgZXhwcmVzc2lvbi4nKV07XG4gIH1cblxuICB2aXNpdFVua25vd24odmFsdWU6IER5bmFtaWNWYWx1ZSk6IHRzLkRpYWdub3N0aWNSZWxhdGVkSW5mb3JtYXRpb25bXSB7XG4gICAgcmV0dXJuIFttYWtlUmVsYXRlZEluZm9ybWF0aW9uKHZhbHVlLm5vZGUsICdVbmFibGUgdG8gZXZhbHVhdGUgc3RhdGljYWxseS4nKV07XG4gIH1cblxuICB2aXNpdFVua25vd25JZGVudGlmaWVyKHZhbHVlOiBEeW5hbWljVmFsdWUpOiB0cy5EaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uW10ge1xuICAgIHJldHVybiBbbWFrZVJlbGF0ZWRJbmZvcm1hdGlvbih2YWx1ZS5ub2RlLCAnVW5rbm93biByZWZlcmVuY2UuJyldO1xuICB9XG5cbiAgdmlzaXRVbnN1cHBvcnRlZFN5bnRheCh2YWx1ZTogRHluYW1pY1ZhbHVlKTogdHMuRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbltdIHtcbiAgICByZXR1cm4gW21ha2VSZWxhdGVkSW5mb3JtYXRpb24odmFsdWUubm9kZSwgJ1RoaXMgc3ludGF4IGlzIG5vdCBzdXBwb3J0ZWQuJyldO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciB0aGUgZHluYW1pYyB2YWx1ZSByZXBvcnRlZCBmb3IgdGhlIG5vZGUgc2hvdWxkIGJlIHRyYWNlZCwgaS5lLiBpZiBpdCBpcyBub3RcbiAgICogcGFydCBvZiB0aGUgY29udGFpbmVyIGZvciB3aGljaCB0aGUgbW9zdCByZWNlbnQgdHJhY2Ugd2FzIGNyZWF0ZWQuXG4gICAqL1xuICBwcml2YXRlIHNob3VsZFRyYWNlKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICBpZiAobm9kZSA9PT0gdGhpcy5ub2RlKSB7XG4gICAgICAvLyBEbyBub3QgaW5jbHVkZSBhIGR5bmFtaWMgdmFsdWUgZm9yIHRoZSBvcmlnaW4gbm9kZSwgYXMgdGhlIG1haW4gZGlhZ25vc3RpYyBpcyBhbHJlYWR5XG4gICAgICAvLyByZXBvcnRlZCBvbiB0aGF0IG5vZGUuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyID0gZ2V0Q29udGFpbmVyTm9kZShub2RlKTtcbiAgICBpZiAoY29udGFpbmVyID09PSB0aGlzLmN1cnJlbnRDb250YWluZXJOb2RlKSB7XG4gICAgICAvLyBUaGUgbm9kZSBpcyBwYXJ0IG9mIHRoZSBzYW1lIGNvbnRhaW5lciBhcyB0aGUgcHJldmlvdXMgdHJhY2UgZW50cnksIHNvIHRoaXMgZHluYW1pYyB2YWx1ZVxuICAgICAgLy8gc2hvdWxkIG5vdCBiZWNvbWUgcGFydCBvZiB0aGUgdHJhY2UuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50Q29udGFpbmVyTm9kZSA9IGNvbnRhaW5lcjtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgdGhlIGNsb3Nlc3QgcGFyZW50IG5vZGUgdGhhdCBpcyB0byBiZSBjb25zaWRlcmVkIGFzIGNvbnRhaW5lciwgd2hpY2ggaXMgdXNlZCB0byByZWR1Y2VcbiAqIHRoZSBncmFudWxhcml0eSBvZiB0cmFjaW5nIHRoZSBkeW5hbWljIHZhbHVlcyB0byBhIHNpbmdsZSBlbnRyeSBwZXIgY29udGFpbmVyLiBDdXJyZW50bHksIGZ1bGxcbiAqIHN0YXRlbWVudHMgYW5kIGRlc3RydWN0dXJpbmcgcGF0dGVybnMgYXJlIGNvbnNpZGVyZWQgYXMgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRDb250YWluZXJOb2RlKG5vZGU6IHRzLk5vZGUpOiB0cy5Ob2RlIHtcbiAgbGV0IGN1cnJlbnROb2RlOiB0cy5Ob2RlfHVuZGVmaW5lZCA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgc3dpdGNoIChjdXJyZW50Tm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuRXhwcmVzc2lvblN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5WYXJpYWJsZVN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5SZXR1cm5TdGF0ZW1lbnQ6XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuSWZTdGF0ZW1lbnQ6XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU3dpdGNoU3RhdGVtZW50OlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkRvU3RhdGVtZW50OlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLldoaWxlU3RhdGVtZW50OlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZvclN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Gb3JJblN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Gb3JPZlN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Db250aW51ZVN0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5CcmVha1N0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5UaHJvd1N0YXRlbWVudDpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5PYmplY3RCaW5kaW5nUGF0dGVybjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5BcnJheUJpbmRpbmdQYXR0ZXJuOlxuICAgICAgICByZXR1cm4gY3VycmVudE5vZGU7XG4gICAgfVxuXG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIG5vZGUuZ2V0U291cmNlRmlsZSgpO1xufVxuIl19
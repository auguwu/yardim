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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/completion", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler/src/compiler", "typescript", "@angular/compiler-cli/src/ngtsc/typecheck/api", "@angular/compiler-cli/src/ngtsc/typecheck/src/comments"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompletionEngine = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var compiler_2 = require("@angular/compiler/src/compiler");
    var ts = require("typescript");
    var api_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/api");
    var comments_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/comments");
    /**
     * Powers autocompletion for a specific component.
     *
     * Internally caches autocompletion results, and must be discarded if the component template or
     * surrounding TS program have changed.
     */
    var CompletionEngine = /** @class */ (function () {
        function CompletionEngine(tcb, data, shimPath) {
            this.tcb = tcb;
            this.data = data;
            this.shimPath = shimPath;
            /**
             * Cache of `GlobalCompletion`s for various levels of the template, including the root template
             * (`null`).
             */
            this.globalCompletionCache = new Map();
            this.expressionCompletionCache = new Map();
        }
        /**
         * Get global completions within the given template context - either a `TmplAstTemplate` embedded
         * view, or `null` for the root template context.
         */
        CompletionEngine.prototype.getGlobalCompletions = function (context) {
            var e_1, _a;
            if (this.globalCompletionCache.has(context)) {
                return this.globalCompletionCache.get(context);
            }
            // Find the component completion expression within the TCB. This looks like: `ctx. /* ... */;`
            var globalRead = comments_1.findFirstMatchingNode(this.tcb, {
                filter: ts.isPropertyAccessExpression,
                withExpressionIdentifier: comments_1.ExpressionIdentifier.COMPONENT_COMPLETION
            });
            if (globalRead === null) {
                return null;
            }
            var completion = {
                componentContext: {
                    shimPath: this.shimPath,
                    // `globalRead.name` is an empty `ts.Identifier`, so its start position immediately follows
                    // the `.` in `ctx.`. TS autocompletion APIs can then be used to access completion results
                    // for the component context.
                    positionInShimFile: globalRead.name.getStart(),
                },
                templateContext: new Map(),
            };
            try {
                // The bound template already has details about the references and variables in scope in the
                // `context` template - they just need to be converted to `Completion`s.
                for (var _b = tslib_1.__values(this.data.boundTarget.getEntitiesInTemplateScope(context)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var node = _c.value;
                    if (node instanceof compiler_1.TmplAstReference) {
                        completion.templateContext.set(node.name, {
                            kind: api_1.CompletionKind.Reference,
                            node: node,
                        });
                    }
                    else {
                        completion.templateContext.set(node.name, {
                            kind: api_1.CompletionKind.Variable,
                            node: node,
                        });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.globalCompletionCache.set(context, completion);
            return completion;
        };
        CompletionEngine.prototype.getExpressionCompletionLocation = function (expr) {
            if (this.expressionCompletionCache.has(expr)) {
                return this.expressionCompletionCache.get(expr);
            }
            // Completion works inside property reads and method calls.
            var tsExpr = null;
            if (expr instanceof compiler_2.PropertyRead || expr instanceof compiler_2.MethodCall ||
                expr instanceof compiler_2.PropertyWrite) {
                // Non-safe navigation operations are trivial: `foo.bar` or `foo.bar()`
                tsExpr = comments_1.findFirstMatchingNode(this.tcb, {
                    filter: ts.isPropertyAccessExpression,
                    withSpan: expr.nameSpan,
                });
            }
            else if (expr instanceof compiler_2.SafePropertyRead || expr instanceof compiler_2.SafeMethodCall) {
                // Safe navigation operations are a little more complex, and involve a ternary. Completion
                // happens in the "true" case of the ternary.
                var ternaryExpr = comments_1.findFirstMatchingNode(this.tcb, {
                    filter: ts.isParenthesizedExpression,
                    withSpan: expr.sourceSpan,
                });
                if (ternaryExpr === null || !ts.isConditionalExpression(ternaryExpr.expression)) {
                    return null;
                }
                var whenTrue = ternaryExpr.expression.whenTrue;
                if (expr instanceof compiler_2.SafePropertyRead && ts.isPropertyAccessExpression(whenTrue)) {
                    tsExpr = whenTrue;
                }
                else if (expr instanceof compiler_2.SafeMethodCall && ts.isCallExpression(whenTrue) &&
                    ts.isPropertyAccessExpression(whenTrue.expression)) {
                    tsExpr = whenTrue.expression;
                }
            }
            if (tsExpr === null) {
                return null;
            }
            var res = {
                shimPath: this.shimPath,
                positionInShimFile: tsExpr.name.getEnd(),
            };
            this.expressionCompletionCache.set(expr, res);
            return res;
        };
        return CompletionEngine;
    }());
    exports.CompletionEngine = CompletionEngine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdHlwZWNoZWNrL3NyYy9jb21wbGV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBb0U7SUFDcEUsMkRBQXlIO0lBQ3pILCtCQUFpQztJQUdqQyxxRUFBK0c7SUFFL0csbUZBQXVFO0lBR3ZFOzs7OztPQUtHO0lBQ0g7UUFVRSwwQkFBb0IsR0FBWSxFQUFVLElBQWtCLEVBQVUsUUFBd0I7WUFBMUUsUUFBRyxHQUFILEdBQUcsQ0FBUztZQUFVLFNBQUksR0FBSixJQUFJLENBQWM7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFnQjtZQVQ5Rjs7O2VBR0c7WUFDSywwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBMEMsQ0FBQztZQUUxRSw4QkFBeUIsR0FDN0IsSUFBSSxHQUFHLEVBQXlFLENBQUM7UUFFWSxDQUFDO1FBRWxHOzs7V0FHRztRQUNILCtDQUFvQixHQUFwQixVQUFxQixPQUE2Qjs7WUFDaEQsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMzQyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLENBQUM7YUFDakQ7WUFFRCw4RkFBOEY7WUFDOUYsSUFBTSxVQUFVLEdBQUcsZ0NBQXFCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDakQsTUFBTSxFQUFFLEVBQUUsQ0FBQywwQkFBMEI7Z0JBQ3JDLHdCQUF3QixFQUFFLCtCQUFvQixDQUFDLG9CQUFvQjthQUNwRSxDQUFDLENBQUM7WUFFSCxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFNLFVBQVUsR0FB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LFVBQVUsQ0FBQztpQkFDOUI7YUFDRjtZQUVELElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtnQkFDbkIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQU0sR0FBRyxHQUFpQjtnQkFDeEIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixrQkFBa0IsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTthQUN6QyxDQUFDO1lBQ0YsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUMsT0FBTyxHQUFHLENBQUM7UUFDYixDQUFDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBN0dELElBNkdDO0lBN0dZLDRDQUFnQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RtcGxBc3RSZWZlcmVuY2UsIFRtcGxBc3RUZW1wbGF0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtNZXRob2RDYWxsLCBQcm9wZXJ0eVJlYWQsIFByb3BlcnR5V3JpdGUsIFNhZmVNZXRob2RDYWxsLCBTYWZlUHJvcGVydHlSZWFkfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7QWJzb2x1dGVGc1BhdGh9IGZyb20gJy4uLy4uL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7Q29tcGxldGlvbktpbmQsIEdsb2JhbENvbXBsZXRpb24sIFJlZmVyZW5jZUNvbXBsZXRpb24sIFNoaW1Mb2NhdGlvbiwgVmFyaWFibGVDb21wbGV0aW9ufSBmcm9tICcuLi9hcGknO1xuXG5pbXBvcnQge0V4cHJlc3Npb25JZGVudGlmaWVyLCBmaW5kRmlyc3RNYXRjaGluZ05vZGV9IGZyb20gJy4vY29tbWVudHMnO1xuaW1wb3J0IHtUZW1wbGF0ZURhdGF9IGZyb20gJy4vY29udGV4dCc7XG5cbi8qKlxuICogUG93ZXJzIGF1dG9jb21wbGV0aW9uIGZvciBhIHNwZWNpZmljIGNvbXBvbmVudC5cbiAqXG4gKiBJbnRlcm5hbGx5IGNhY2hlcyBhdXRvY29tcGxldGlvbiByZXN1bHRzLCBhbmQgbXVzdCBiZSBkaXNjYXJkZWQgaWYgdGhlIGNvbXBvbmVudCB0ZW1wbGF0ZSBvclxuICogc3Vycm91bmRpbmcgVFMgcHJvZ3JhbSBoYXZlIGNoYW5nZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wbGV0aW9uRW5naW5lIHtcbiAgLyoqXG4gICAqIENhY2hlIG9mIGBHbG9iYWxDb21wbGV0aW9uYHMgZm9yIHZhcmlvdXMgbGV2ZWxzIG9mIHRoZSB0ZW1wbGF0ZSwgaW5jbHVkaW5nIHRoZSByb290IHRlbXBsYXRlXG4gICAqIChgbnVsbGApLlxuICAgKi9cbiAgcHJpdmF0ZSBnbG9iYWxDb21wbGV0aW9uQ2FjaGUgPSBuZXcgTWFwPFRtcGxBc3RUZW1wbGF0ZXxudWxsLCBHbG9iYWxDb21wbGV0aW9uPigpO1xuXG4gIHByaXZhdGUgZXhwcmVzc2lvbkNvbXBsZXRpb25DYWNoZSA9XG4gICAgICBuZXcgTWFwPFByb3BlcnR5UmVhZHxTYWZlUHJvcGVydHlSZWFkfE1ldGhvZENhbGx8U2FmZU1ldGhvZENhbGwsIFNoaW1Mb2NhdGlvbj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRjYjogdHMuTm9kZSwgcHJpdmF0ZSBkYXRhOiBUZW1wbGF0ZURhdGEsIHByaXZhdGUgc2hpbVBhdGg6IEFic29sdXRlRnNQYXRoKSB7fVxuXG4gIC8qKlxuICAgKiBHZXQgZ2xvYmFsIGNvbXBsZXRpb25zIHdpdGhpbiB0aGUgZ2l2ZW4gdGVtcGxhdGUgY29udGV4dCAtIGVpdGhlciBhIGBUbXBsQXN0VGVtcGxhdGVgIGVtYmVkZGVkXG4gICAqIHZpZXcsIG9yIGBudWxsYCBmb3IgdGhlIHJvb3QgdGVtcGxhdGUgY29udGV4dC5cbiAgICovXG4gIGdldEdsb2JhbENvbXBsZXRpb25zKGNvbnRleHQ6IFRtcGxBc3RUZW1wbGF0ZXxudWxsKTogR2xvYmFsQ29tcGxldGlvbnxudWxsIHtcbiAgICBpZiAodGhpcy5nbG9iYWxDb21wbGV0aW9uQ2FjaGUuaGFzKGNvbnRleHQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5nbG9iYWxDb21wbGV0aW9uQ2FjaGUuZ2V0KGNvbnRleHQpITtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBjb21wb25lbnQgY29tcGxldGlvbiBleHByZXNzaW9uIHdpdGhpbiB0aGUgVENCLiBUaGlzIGxvb2tzIGxpa2U6IGBjdHguIC8qIC4uLiAqLztgXG4gICAgY29uc3QgZ2xvYmFsUmVhZCA9IGZpbmRGaXJzdE1hdGNoaW5nTm9kZSh0aGlzLnRjYiwge1xuICAgICAgZmlsdGVyOiB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbixcbiAgICAgIHdpdGhFeHByZXNzaW9uSWRlbnRpZmllcjogRXhwcmVzc2lvbklkZW50aWZpZXIuQ09NUE9ORU5UX0NPTVBMRVRJT05cbiAgICB9KTtcblxuICAgIGlmIChnbG9iYWxSZWFkID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0aW9uOiBHbG9iYWxDb21wbGV0aW9uID0ge1xuICAgICAgY29tcG9uZW50Q29udGV4dDoge1xuICAgICAgICBzaGltUGF0aDogdGhpcy5zaGltUGF0aCxcbiAgICAgICAgLy8gYGdsb2JhbFJlYWQubmFtZWAgaXMgYW4gZW1wdHkgYHRzLklkZW50aWZpZXJgLCBzbyBpdHMgc3RhcnQgcG9zaXRpb24gaW1tZWRpYXRlbHkgZm9sbG93c1xuICAgICAgICAvLyB0aGUgYC5gIGluIGBjdHguYC4gVFMgYXV0b2NvbXBsZXRpb24gQVBJcyBjYW4gdGhlbiBiZSB1c2VkIHRvIGFjY2VzcyBjb21wbGV0aW9uIHJlc3VsdHNcbiAgICAgICAgLy8gZm9yIHRoZSBjb21wb25lbnQgY29udGV4dC5cbiAgICAgICAgcG9zaXRpb25JblNoaW1GaWxlOiBnbG9iYWxSZWFkLm5hbWUuZ2V0U3RhcnQoKSxcbiAgICAgIH0sXG4gICAgICB0ZW1wbGF0ZUNvbnRleHQ6IG5ldyBNYXA8c3RyaW5nLCBSZWZlcmVuY2VDb21wbGV0aW9ufFZhcmlhYmxlQ29tcGxldGlvbj4oKSxcbiAgICB9O1xuXG4gICAgLy8gVGhlIGJvdW5kIHRlbXBsYXRlIGFscmVhZHkgaGFzIGRldGFpbHMgYWJvdXQgdGhlIHJlZmVyZW5jZXMgYW5kIHZhcmlhYmxlcyBpbiBzY29wZSBpbiB0aGVcbiAgICAvLyBgY29udGV4dGAgdGVtcGxhdGUgLSB0aGV5IGp1c3QgbmVlZCB0byBiZSBjb252ZXJ0ZWQgdG8gYENvbXBsZXRpb25gcy5cbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgdGhpcy5kYXRhLmJvdW5kVGFyZ2V0LmdldEVudGl0aWVzSW5UZW1wbGF0ZVNjb3BlKGNvbnRleHQpKSB7XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFRtcGxBc3RSZWZlcmVuY2UpIHtcbiAgICAgICAgY29tcGxldGlvbi50ZW1wbGF0ZUNvbnRleHQuc2V0KG5vZGUubmFtZSwge1xuICAgICAgICAgIGtpbmQ6IENvbXBsZXRpb25LaW5kLlJlZmVyZW5jZSxcbiAgICAgICAgICBub2RlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBsZXRpb24udGVtcGxhdGVDb250ZXh0LnNldChub2RlLm5hbWUsIHtcbiAgICAgICAgICBraW5kOiBDb21wbGV0aW9uS2luZC5WYXJpYWJsZSxcbiAgICAgICAgICBub2RlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmdsb2JhbENvbXBsZXRpb25DYWNoZS5zZXQoY29udGV4dCwgY29tcGxldGlvbik7XG4gICAgcmV0dXJuIGNvbXBsZXRpb247XG4gIH1cblxuICBnZXRFeHByZXNzaW9uQ29tcGxldGlvbkxvY2F0aW9uKGV4cHI6IFByb3BlcnR5UmVhZHxQcm9wZXJ0eVdyaXRlfE1ldGhvZENhbGx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2FmZU1ldGhvZENhbGwpOiBTaGltTG9jYXRpb258bnVsbCB7XG4gICAgaWYgKHRoaXMuZXhwcmVzc2lvbkNvbXBsZXRpb25DYWNoZS5oYXMoZXhwcikpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cHJlc3Npb25Db21wbGV0aW9uQ2FjaGUuZ2V0KGV4cHIpITtcbiAgICB9XG5cbiAgICAvLyBDb21wbGV0aW9uIHdvcmtzIGluc2lkZSBwcm9wZXJ0eSByZWFkcyBhbmQgbWV0aG9kIGNhbGxzLlxuICAgIGxldCB0c0V4cHI6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbnxudWxsID0gbnVsbDtcbiAgICBpZiAoZXhwciBpbnN0YW5jZW9mIFByb3BlcnR5UmVhZCB8fCBleHByIGluc3RhbmNlb2YgTWV0aG9kQ2FsbCB8fFxuICAgICAgICBleHByIGluc3RhbmNlb2YgUHJvcGVydHlXcml0ZSkge1xuICAgICAgLy8gTm9uLXNhZmUgbmF2aWdhdGlvbiBvcGVyYXRpb25zIGFyZSB0cml2aWFsOiBgZm9vLmJhcmAgb3IgYGZvby5iYXIoKWBcbiAgICAgIHRzRXhwciA9IGZpbmRGaXJzdE1hdGNoaW5nTm9kZSh0aGlzLnRjYiwge1xuICAgICAgICBmaWx0ZXI6IHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLFxuICAgICAgICB3aXRoU3BhbjogZXhwci5uYW1lU3BhbixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZXhwciBpbnN0YW5jZW9mIFNhZmVQcm9wZXJ0eVJlYWQgfHwgZXhwciBpbnN0YW5jZW9mIFNhZmVNZXRob2RDYWxsKSB7XG4gICAgICAvLyBTYWZlIG5hdmlnYXRpb24gb3BlcmF0aW9ucyBhcmUgYSBsaXR0bGUgbW9yZSBjb21wbGV4LCBhbmQgaW52b2x2ZSBhIHRlcm5hcnkuIENvbXBsZXRpb25cbiAgICAgIC8vIGhhcHBlbnMgaW4gdGhlIFwidHJ1ZVwiIGNhc2Ugb2YgdGhlIHRlcm5hcnkuXG4gICAgICBjb25zdCB0ZXJuYXJ5RXhwciA9IGZpbmRGaXJzdE1hdGNoaW5nTm9kZSh0aGlzLnRjYiwge1xuICAgICAgICBmaWx0ZXI6IHRzLmlzUGFyZW50aGVzaXplZEV4cHJlc3Npb24sXG4gICAgICAgIHdpdGhTcGFuOiBleHByLnNvdXJjZVNwYW4sXG4gICAgICB9KTtcbiAgICAgIGlmICh0ZXJuYXJ5RXhwciA9PT0gbnVsbCB8fCAhdHMuaXNDb25kaXRpb25hbEV4cHJlc3Npb24odGVybmFyeUV4cHIuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjb25zdCB3aGVuVHJ1ZSA9IHRlcm5hcnlFeHByLmV4cHJlc3Npb24ud2hlblRydWU7XG5cbiAgICAgIGlmIChleHByIGluc3RhbmNlb2YgU2FmZVByb3BlcnR5UmVhZCAmJiB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbih3aGVuVHJ1ZSkpIHtcbiAgICAgICAgdHNFeHByID0gd2hlblRydWU7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGV4cHIgaW5zdGFuY2VvZiBTYWZlTWV0aG9kQ2FsbCAmJiB0cy5pc0NhbGxFeHByZXNzaW9uKHdoZW5UcnVlKSAmJlxuICAgICAgICAgIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKHdoZW5UcnVlLmV4cHJlc3Npb24pKSB7XG4gICAgICAgIHRzRXhwciA9IHdoZW5UcnVlLmV4cHJlc3Npb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRzRXhwciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzOiBTaGltTG9jYXRpb24gPSB7XG4gICAgICBzaGltUGF0aDogdGhpcy5zaGltUGF0aCxcbiAgICAgIHBvc2l0aW9uSW5TaGltRmlsZTogdHNFeHByLm5hbWUuZ2V0RW5kKCksXG4gICAgfTtcbiAgICB0aGlzLmV4cHJlc3Npb25Db21wbGV0aW9uQ2FjaGUuc2V0KGV4cHIsIHJlcyk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxufVxuIl19
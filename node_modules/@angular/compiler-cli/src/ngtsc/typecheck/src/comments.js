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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/comments", ["require", "exports", "tslib", "@angular/compiler", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasExpressionIdentifier = exports.findAllMatchingNodes = exports.findFirstMatchingNode = exports.hasIgnoreForDiagnosticsMarker = exports.markIgnoreDiagnostics = exports.addExpressionIdentifier = exports.ExpressionIdentifier = exports.CommentTriviaType = exports.readSpanComment = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var parseSpanComment = /^(\d+),(\d+)$/;
    /**
     * Reads the trailing comments and finds the first match which is a span comment (i.e. 4,10) on a
     * node and returns it as an `AbsoluteSourceSpan`.
     *
     * Will return `null` if no trailing comments on the node match the expected form of a source span.
     */
    function readSpanComment(node, sourceFile) {
        if (sourceFile === void 0) { sourceFile = node.getSourceFile(); }
        return ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), function (pos, end, kind) {
            if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
                return null;
            }
            var commentText = sourceFile.text.substring(pos + 2, end - 2);
            var match = commentText.match(parseSpanComment);
            if (match === null) {
                return null;
            }
            return new compiler_1.AbsoluteSourceSpan(+match[1], +match[2]);
        }) || null;
    }
    exports.readSpanComment = readSpanComment;
    /** Used to identify what type the comment is. */
    var CommentTriviaType;
    (function (CommentTriviaType) {
        CommentTriviaType["DIAGNOSTIC"] = "D";
        CommentTriviaType["EXPRESSION_TYPE_IDENTIFIER"] = "T";
    })(CommentTriviaType = exports.CommentTriviaType || (exports.CommentTriviaType = {}));
    /** Identifies what the TCB expression is for (for example, a directive declaration). */
    var ExpressionIdentifier;
    (function (ExpressionIdentifier) {
        ExpressionIdentifier["DIRECTIVE"] = "DIR";
        ExpressionIdentifier["COMPONENT_COMPLETION"] = "COMPCOMP";
        ExpressionIdentifier["EVENT_PARAMETER"] = "EP";
    })(ExpressionIdentifier = exports.ExpressionIdentifier || (exports.ExpressionIdentifier = {}));
    /** Tags the node with the given expression identifier. */
    function addExpressionIdentifier(node, identifier) {
        ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, CommentTriviaType.EXPRESSION_TYPE_IDENTIFIER + ":" + identifier, 
        /* hasTrailingNewLine */ false);
    }
    exports.addExpressionIdentifier = addExpressionIdentifier;
    var IGNORE_FOR_DIAGNOSTICS_MARKER = CommentTriviaType.DIAGNOSTIC + ":ignore";
    /**
     * Tag the `ts.Node` with an indication that any errors arising from the evaluation of the node
     * should be ignored.
     */
    function markIgnoreDiagnostics(node) {
        ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, IGNORE_FOR_DIAGNOSTICS_MARKER, 
        /* hasTrailingNewLine */ false);
    }
    exports.markIgnoreDiagnostics = markIgnoreDiagnostics;
    /** Returns true if the node has a marker that indicates diagnostics errors should be ignored.  */
    function hasIgnoreForDiagnosticsMarker(node, sourceFile) {
        return ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), function (pos, end, kind) {
            if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
                return null;
            }
            var commentText = sourceFile.text.substring(pos + 2, end - 2);
            return commentText === IGNORE_FOR_DIAGNOSTICS_MARKER;
        }) === true;
    }
    exports.hasIgnoreForDiagnosticsMarker = hasIgnoreForDiagnosticsMarker;
    function makeRecursiveVisitor(visitor) {
        function recursiveVisitor(node) {
            var res = visitor(node);
            return res !== null ? res : node.forEachChild(recursiveVisitor);
        }
        return recursiveVisitor;
    }
    function getSpanFromOptions(opts) {
        var withSpan = null;
        if (opts.withSpan !== undefined) {
            if (opts.withSpan instanceof compiler_1.AbsoluteSourceSpan) {
                withSpan = opts.withSpan;
            }
            else {
                withSpan = { start: opts.withSpan.start.offset, end: opts.withSpan.end.offset };
            }
        }
        return withSpan;
    }
    /**
     * Given a `ts.Node` with finds the first node whose matching the criteria specified
     * by the `FindOptions`.
     *
     * Returns `null` when no `ts.Node` matches the given conditions.
     */
    function findFirstMatchingNode(tcb, opts) {
        var _a;
        var withSpan = getSpanFromOptions(opts);
        var withExpressionIdentifier = opts.withExpressionIdentifier;
        var sf = tcb.getSourceFile();
        var visitor = makeRecursiveVisitor(function (node) {
            if (!opts.filter(node)) {
                return null;
            }
            if (withSpan !== null) {
                var comment = readSpanComment(node, sf);
                if (comment === null || withSpan.start !== comment.start || withSpan.end !== comment.end) {
                    return null;
                }
            }
            if (withExpressionIdentifier !== undefined &&
                !hasExpressionIdentifier(sf, node, withExpressionIdentifier)) {
                return null;
            }
            return node;
        });
        return (_a = tcb.forEachChild(visitor)) !== null && _a !== void 0 ? _a : null;
    }
    exports.findFirstMatchingNode = findFirstMatchingNode;
    /**
     * Given a `ts.Node` with source span comments, finds the first node whose source span comment
     * matches the given `sourceSpan`. Additionally, the `filter` function allows matching only
     * `ts.Nodes` of a given type, which provides the ability to select only matches of a given type
     * when there may be more than one.
     *
     * Returns `null` when no `ts.Node` matches the given conditions.
     */
    function findAllMatchingNodes(tcb, opts) {
        var withSpan = getSpanFromOptions(opts);
        var withExpressionIdentifier = opts.withExpressionIdentifier;
        var results = [];
        var stack = [tcb];
        var sf = tcb.getSourceFile();
        while (stack.length > 0) {
            var node = stack.pop();
            if (!opts.filter(node)) {
                stack.push.apply(stack, tslib_1.__spread(node.getChildren()));
                continue;
            }
            if (withSpan !== null) {
                var comment = readSpanComment(node, sf);
                if (comment === null || withSpan.start !== comment.start || withSpan.end !== comment.end) {
                    stack.push.apply(stack, tslib_1.__spread(node.getChildren()));
                    continue;
                }
            }
            if (withExpressionIdentifier !== undefined &&
                !hasExpressionIdentifier(sf, node, withExpressionIdentifier)) {
                continue;
            }
            results.push(node);
        }
        return results;
    }
    exports.findAllMatchingNodes = findAllMatchingNodes;
    function hasExpressionIdentifier(sourceFile, node, identifier) {
        return ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), function (pos, end, kind) {
            if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
                return false;
            }
            var commentText = sourceFile.text.substring(pos + 2, end - 2);
            return commentText === CommentTriviaType.EXPRESSION_TYPE_IDENTIFIER + ":" + identifier;
        }) || false;
    }
    exports.hasExpressionIdentifier = hasExpressionIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3R5cGVjaGVjay9zcmMvY29tbWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUFzRTtJQUN0RSwrQkFBaUM7SUFFakMsSUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7SUFFekM7Ozs7O09BS0c7SUFDSCxTQUFnQixlQUFlLENBQzNCLElBQWEsRUFBRSxVQUFnRDtRQUFoRCwyQkFBQSxFQUFBLGFBQTRCLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFDakUsT0FBTyxFQUFFLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7WUFDbkYsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsRUFBRTtnQkFDakQsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxPQUFPLElBQUksNkJBQWtCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDYixDQUFDO0lBZEQsMENBY0M7SUFF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SSxDQUFDLE1BQU0sRUFBRSxFQUFFLFVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJO1lBQ25GLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLEVBQUU7Z0JBQ2pELE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxJQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoRSxPQUFPLFdBQVcsS0FBUSxpQkFBaUIsQ0FBQywwQkFBMEIsU0FBSSxVQUFZLENBQUM7UUFDekYsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQVRELDBEQVNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QWJzb2x1dGVTb3VyY2VTcGFuLCBQYXJzZVNvdXJjZVNwYW59IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5jb25zdCBwYXJzZVNwYW5Db21tZW50ID0gL14oXFxkKyksKFxcZCspJC87XG5cbi8qKlxuICogUmVhZHMgdGhlIHRyYWlsaW5nIGNvbW1lbnRzIGFuZCBmaW5kcyB0aGUgZmlyc3QgbWF0Y2ggd2hpY2ggaXMgYSBzcGFuIGNvbW1lbnQgKGkuZS4gNCwxMCkgb24gYVxuICogbm9kZSBhbmQgcmV0dXJucyBpdCBhcyBhbiBgQWJzb2x1dGVTb3VyY2VTcGFuYC5cbiAqXG4gKiBXaWxsIHJldHVybiBgbnVsbGAgaWYgbm8gdHJhaWxpbmcgY29tbWVudHMgb24gdGhlIG5vZGUgbWF0Y2ggdGhlIGV4cGVjdGVkIGZvcm0gb2YgYSBzb3VyY2Ugc3Bhbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRTcGFuQ29tbWVudChcbiAgICBub2RlOiB0cy5Ob2RlLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCkpOiBBYnNvbHV0ZVNvdXJjZVNwYW58bnVsbCB7XG4gIHJldHVybiB0cy5mb3JFYWNoVHJhaWxpbmdDb21tZW50UmFuZ2Uoc291cmNlRmlsZS50ZXh0LCBub2RlLmdldEVuZCgpLCAocG9zLCBlbmQsIGtpbmQpID0+IHtcbiAgICBpZiAoa2luZCAhPT0gdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY29tbWVudFRleHQgPSBzb3VyY2VGaWxlLnRleHQuc3Vic3RyaW5nKHBvcyArIDIsIGVuZCAtIDIpO1xuICAgIGNvbnN0IG1hdGNoID0gY29tbWVudFRleHQubWF0Y2gocGFyc2VTcGFuQ29tbWVudCk7XG4gICAgaWYgKG1hdGNoID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEFic29sdXRlU291cmNlU3BhbigrbWF0Y2hbMV0sICttYXRjaFsyXSk7XG4gIH0pIHx8IG51bGw7XG59XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IHdoYXQgdHlwZSB0aGUgY29tbWVudCBpcy4gKi9cbmV4cG9ydCBlbnVtIENvbW1lbnRUcml2aWFUeXBlIHtcbiAgRElBR05PU1RJQyA9ICdEJyxcbiAgRVhQUkVTU0lPTl9UWVBFX0lERU5USUZJRVIgPSAnVCcsXG59XG5cbi8qKiBJZGVudGlmaWVzIHdoYXQgdGhlIFRDQiBleHByZXNzaW9uIGlzIGZvciAoZm9yIGV4YW1wbGUsIGEgZGlyZWN0aXZlIGRlY2xhcmF0aW9uKS4gKi9cbmV4cG9ydCBlbnVtIEV4cHJlc3Npb25JZGVudGlmaWVyIHtcbiAgRElSRUNUSVZFID0gJ0RJUicsXG4gIENPTVBPTkVOVF9DT01QTEVUSU9OID0gJ0NPTVBDT01QJyxcbiAgRVZFTlRfUEFSQU1FVEVSID0gJ0VQJyxcbn1cblxuLyoqIFRhZ3MgdGhlIG5vZGUgd2l0aCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBpZGVudGlmaWVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEV4cHJlc3Npb25JZGVudGlmaWVyKG5vZGU6IHRzLk5vZGUsIGlkZW50aWZpZXI6IEV4cHJlc3Npb25JZGVudGlmaWVyKSB7XG4gIHRzLmFkZFN5bnRoZXRpY1RyYWlsaW5nQ29tbWVudChcbiAgICAgIG5vZGUsIHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSxcbiAgICAgIGAke0NvbW1lbnRUcml2aWFUeXBlLkVYUFJFU1NJT05fVFlQRV9JREVOVElGSUVSfToke2lkZW50aWZpZXJ9YCxcbiAgICAgIC8qIGhhc1RyYWlsaW5nTmV3TGluZSAqLyBmYWxzZSk7XG59XG5cbmNvbnN0IElHTk9SRV9GT1JfRElBR05PU1RJQ1NfTUFSS0VSID0gYCR7Q29tbWVudFRyaXZpYVR5cGUuRElBR05PU1RJQ306aWdub3JlYDtcblxuLyoqXG4gKiBUYWcgdGhlIGB0cy5Ob2RlYCB3aXRoIGFuIGluZGljYXRpb24gdGhhdCBhbnkgZXJyb3JzIGFyaXNpbmcgZnJvbSB0aGUgZXZhbHVhdGlvbiBvZiB0aGUgbm9kZVxuICogc2hvdWxkIGJlIGlnbm9yZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrSWdub3JlRGlhZ25vc3RpY3Mobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICB0cy5hZGRTeW50aGV0aWNUcmFpbGluZ0NvbW1lbnQoXG4gICAgICBub2RlLCB0cy5TeW50YXhLaW5kLk11bHRpTGluZUNvbW1lbnRUcml2aWEsIElHTk9SRV9GT1JfRElBR05PU1RJQ1NfTUFSS0VSLFxuICAgICAgLyogaGFzVHJhaWxpbmdOZXdMaW5lICovIGZhbHNlKTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgbm9kZSBoYXMgYSBtYXJrZXIgdGhhdCBpbmRpY2F0ZXMgZGlhZ25vc3RpY3MgZXJyb3JzIHNob3VsZCBiZSBpZ25vcmVkLiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNJZ25vcmVGb3JEaWFnbm9zdGljc01hcmtlcihub2RlOiB0cy5Ob2RlLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogYm9vbGVhbiB7XG4gIHJldHVybiB0cy5mb3JFYWNoVHJhaWxpbmdDb21tZW50UmFuZ2Uoc291cmNlRmlsZS50ZXh0LCBub2RlLmdldEVuZCgpLCAocG9zLCBlbmQsIGtpbmQpID0+IHtcbiAgICBpZiAoa2luZCAhPT0gdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY29tbWVudFRleHQgPSBzb3VyY2VGaWxlLnRleHQuc3Vic3RyaW5nKHBvcyArIDIsIGVuZCAtIDIpO1xuICAgIHJldHVybiBjb21tZW50VGV4dCA9PT0gSUdOT1JFX0ZPUl9ESUFHTk9TVElDU19NQVJLRVI7XG4gIH0pID09PSB0cnVlO1xufVxuXG5mdW5jdGlvbiBtYWtlUmVjdXJzaXZlVmlzaXRvcjxUIGV4dGVuZHMgdHMuTm9kZT4odmlzaXRvcjogKG5vZGU6IHRzLk5vZGUpID0+IFQgfCBudWxsKTpcbiAgICAobm9kZTogdHMuTm9kZSkgPT4gVCB8IHVuZGVmaW5lZCB7XG4gIGZ1bmN0aW9uIHJlY3Vyc2l2ZVZpc2l0b3Iobm9kZTogdHMuTm9kZSk6IFR8dW5kZWZpbmVkIHtcbiAgICBjb25zdCByZXMgPSB2aXNpdG9yKG5vZGUpO1xuICAgIHJldHVybiByZXMgIT09IG51bGwgPyByZXMgOiBub2RlLmZvckVhY2hDaGlsZChyZWN1cnNpdmVWaXNpdG9yKTtcbiAgfVxuICByZXR1cm4gcmVjdXJzaXZlVmlzaXRvcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGaW5kT3B0aW9uczxUIGV4dGVuZHMgdHMuTm9kZT4ge1xuICBmaWx0ZXI6IChub2RlOiB0cy5Ob2RlKSA9PiBub2RlIGlzIFQ7XG4gIHdpdGhFeHByZXNzaW9uSWRlbnRpZmllcj86IEV4cHJlc3Npb25JZGVudGlmaWVyO1xuICB3aXRoU3Bhbj86IEFic29sdXRlU291cmNlU3BhbnxQYXJzZVNvdXJjZVNwYW47XG59XG5cbmZ1bmN0aW9uIGdldFNwYW5Gcm9tT3B0aW9ucyhvcHRzOiBGaW5kT3B0aW9uczx0cy5Ob2RlPikge1xuICBsZXQgd2l0aFNwYW46IHtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcn18bnVsbCA9IG51bGw7XG4gIGlmIChvcHRzLndpdGhTcGFuICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAob3B0cy53aXRoU3BhbiBpbnN0YW5jZW9mIEFic29sdXRlU291cmNlU3Bhbikge1xuICAgICAgd2l0aFNwYW4gPSBvcHRzLndpdGhTcGFuO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aXRoU3BhbiA9IHtzdGFydDogb3B0cy53aXRoU3Bhbi5zdGFydC5vZmZzZXQsIGVuZDogb3B0cy53aXRoU3Bhbi5lbmQub2Zmc2V0fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdpdGhTcGFuO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgYHRzLk5vZGVgIHdpdGggZmluZHMgdGhlIGZpcnN0IG5vZGUgd2hvc2UgbWF0Y2hpbmcgdGhlIGNyaXRlcmlhIHNwZWNpZmllZFxuICogYnkgdGhlIGBGaW5kT3B0aW9uc2AuXG4gKlxuICogUmV0dXJucyBgbnVsbGAgd2hlbiBubyBgdHMuTm9kZWAgbWF0Y2hlcyB0aGUgZ2l2ZW4gY29uZGl0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRGaXJzdE1hdGNoaW5nTm9kZTxUIGV4dGVuZHMgdHMuTm9kZT4odGNiOiB0cy5Ob2RlLCBvcHRzOiBGaW5kT3B0aW9uczxUPik6IFR8XG4gICAgbnVsbCB7XG4gIGNvbnN0IHdpdGhTcGFuID0gZ2V0U3BhbkZyb21PcHRpb25zKG9wdHMpO1xuICBjb25zdCB3aXRoRXhwcmVzc2lvbklkZW50aWZpZXIgPSBvcHRzLndpdGhFeHByZXNzaW9uSWRlbnRpZmllcjtcbiAgY29uc3Qgc2YgPSB0Y2IuZ2V0U291cmNlRmlsZSgpO1xuICBjb25zdCB2aXNpdG9yID0gbWFrZVJlY3Vyc2l2ZVZpc2l0b3I8VD4obm9kZSA9PiB7XG4gICAgaWYgKCFvcHRzLmZpbHRlcihub2RlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh3aXRoU3BhbiAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgY29tbWVudCA9IHJlYWRTcGFuQ29tbWVudChub2RlLCBzZik7XG4gICAgICBpZiAoY29tbWVudCA9PT0gbnVsbCB8fCB3aXRoU3Bhbi5zdGFydCAhPT0gY29tbWVudC5zdGFydCB8fCB3aXRoU3Bhbi5lbmQgIT09IGNvbW1lbnQuZW5kKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAod2l0aEV4cHJlc3Npb25JZGVudGlmaWVyICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgIWhhc0V4cHJlc3Npb25JZGVudGlmaWVyKHNmLCBub2RlLCB3aXRoRXhwcmVzc2lvbklkZW50aWZpZXIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH0pO1xuICByZXR1cm4gdGNiLmZvckVhY2hDaGlsZCh2aXNpdG9yKSA/PyBudWxsO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgYHRzLk5vZGVgIHdpdGggc291cmNlIHNwYW4gY29tbWVudHMsIGZpbmRzIHRoZSBmaXJzdCBub2RlIHdob3NlIHNvdXJjZSBzcGFuIGNvbW1lbnRcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIGBzb3VyY2VTcGFuYC4gQWRkaXRpb25hbGx5LCB0aGUgYGZpbHRlcmAgZnVuY3Rpb24gYWxsb3dzIG1hdGNoaW5nIG9ubHlcbiAqIGB0cy5Ob2Rlc2Agb2YgYSBnaXZlbiB0eXBlLCB3aGljaCBwcm92aWRlcyB0aGUgYWJpbGl0eSB0byBzZWxlY3Qgb25seSBtYXRjaGVzIG9mIGEgZ2l2ZW4gdHlwZVxuICogd2hlbiB0aGVyZSBtYXkgYmUgbW9yZSB0aGFuIG9uZS5cbiAqXG4gKiBSZXR1cm5zIGBudWxsYCB3aGVuIG5vIGB0cy5Ob2RlYCBtYXRjaGVzIHRoZSBnaXZlbiBjb25kaXRpb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZEFsbE1hdGNoaW5nTm9kZXM8VCBleHRlbmRzIHRzLk5vZGU+KHRjYjogdHMuTm9kZSwgb3B0czogRmluZE9wdGlvbnM8VD4pOiBUW10ge1xuICBjb25zdCB3aXRoU3BhbiA9IGdldFNwYW5Gcm9tT3B0aW9ucyhvcHRzKTtcbiAgY29uc3Qgd2l0aEV4cHJlc3Npb25JZGVudGlmaWVyID0gb3B0cy53aXRoRXhwcmVzc2lvbklkZW50aWZpZXI7XG4gIGNvbnN0IHJlc3VsdHM6IFRbXSA9IFtdO1xuICBjb25zdCBzdGFjazogdHMuTm9kZVtdID0gW3RjYl07XG4gIGNvbnN0IHNmID0gdGNiLmdldFNvdXJjZUZpbGUoKTtcblxuICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG5vZGUgPSBzdGFjay5wb3AoKSE7XG5cbiAgICBpZiAoIW9wdHMuZmlsdGVyKG5vZGUpKSB7XG4gICAgICBzdGFjay5wdXNoKC4uLm5vZGUuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHdpdGhTcGFuICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBjb21tZW50ID0gcmVhZFNwYW5Db21tZW50KG5vZGUsIHNmKTtcbiAgICAgIGlmIChjb21tZW50ID09PSBudWxsIHx8IHdpdGhTcGFuLnN0YXJ0ICE9PSBjb21tZW50LnN0YXJ0IHx8IHdpdGhTcGFuLmVuZCAhPT0gY29tbWVudC5lbmQpIHtcbiAgICAgICAgc3RhY2sucHVzaCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdpdGhFeHByZXNzaW9uSWRlbnRpZmllciAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICFoYXNFeHByZXNzaW9uSWRlbnRpZmllcihzZiwgbm9kZSwgd2l0aEV4cHJlc3Npb25JZGVudGlmaWVyKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzdWx0cy5wdXNoKG5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHByZXNzaW9uSWRlbnRpZmllcihcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBub2RlOiB0cy5Ob2RlLCBpZGVudGlmaWVyOiBFeHByZXNzaW9uSWRlbnRpZmllcik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHMuZm9yRWFjaFRyYWlsaW5nQ29tbWVudFJhbmdlKHNvdXJjZUZpbGUudGV4dCwgbm9kZS5nZXRFbmQoKSwgKHBvcywgZW5kLCBraW5kKSA9PiB7XG4gICAgaWYgKGtpbmQgIT09IHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBjb21tZW50VGV4dCA9IHNvdXJjZUZpbGUudGV4dC5zdWJzdHJpbmcocG9zICsgMiwgZW5kIC0gMik7XG4gICAgcmV0dXJuIGNvbW1lbnRUZXh0ID09PSBgJHtDb21tZW50VHJpdmlhVHlwZS5FWFBSRVNTSU9OX1RZUEVfSURFTlRJRklFUn06JHtpZGVudGlmaWVyfWA7XG4gIH0pIHx8IGZhbHNlO1xufVxuIl19
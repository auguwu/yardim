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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/tcb_util", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/util/src/typescript", "@angular/compiler-cli/src/ngtsc/typecheck/src/comments", "@angular/compiler-cli/src/ngtsc/typecheck/src/ts_util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findSourceLocation = exports.findTypeCheckBlock = exports.getTemplateMapping = exports.requiresInlineTypeCheckBlock = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    var comments_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/comments");
    var ts_util_1 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/ts_util");
    function requiresInlineTypeCheckBlock(node, usedPipes) {
        // In order to qualify for a declared TCB (not inline) two conditions must be met:
        // 1) the class must be exported
        // 2) it must not have constrained generic types
        if (!ts_util_1.checkIfClassIsExported(node)) {
            // Condition 1 is false, the class is not exported.
            return true;
        }
        else if (!ts_util_1.checkIfGenericTypesAreUnbound(node)) {
            // Condition 2 is false, the class has constrained generic types
            return true;
        }
        else if (Array.from(usedPipes.values())
            .some(function (pipeRef) { return !ts_util_1.checkIfClassIsExported(pipeRef.node); })) {
            // If one of the pipes used by the component is not exported, a non-inline TCB will not be able
            // to import it, so this requires an inline TCB.
            return true;
        }
        else {
            return false;
        }
    }
    exports.requiresInlineTypeCheckBlock = requiresInlineTypeCheckBlock;
    /** Maps a shim position back to a template location. */
    function getTemplateMapping(shimSf, position, resolver, isDiagnosticRequest) {
        var node = typescript_1.getTokenAtPosition(shimSf, position);
        var sourceLocation = findSourceLocation(node, shimSf, isDiagnosticRequest);
        if (sourceLocation === null) {
            return null;
        }
        var mapping = resolver.getSourceMapping(sourceLocation.id);
        var span = resolver.toParseSourceSpan(sourceLocation.id, sourceLocation.span);
        if (span === null) {
            return null;
        }
        // TODO(atscott): Consider adding a context span by walking up from `node` until we get a
        // different span.
        return { sourceLocation: sourceLocation, templateSourceMapping: mapping, span: span };
    }
    exports.getTemplateMapping = getTemplateMapping;
    function findTypeCheckBlock(file, id, isDiagnosticRequest) {
        var e_1, _a;
        try {
            for (var _b = tslib_1.__values(file.statements), _c = _b.next(); !_c.done; _c = _b.next()) {
                var stmt = _c.value;
                if (ts.isFunctionDeclaration(stmt) && getTemplateId(stmt, file, isDiagnosticRequest) === id) {
                    return stmt;
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
        return null;
    }
    exports.findTypeCheckBlock = findTypeCheckBlock;
    /**
     * Traverses up the AST starting from the given node to extract the source location from comments
     * that have been emitted into the TCB. If the node does not exist within a TCB, or if an ignore
     * marker comment is found up the tree (and this is part of a diagnostic request), this function
     * returns null.
     */
    function findSourceLocation(node, sourceFile, isDiagnosticsRequest) {
        // Search for comments until the TCB's function declaration is encountered.
        while (node !== undefined && !ts.isFunctionDeclaration(node)) {
            if (comments_1.hasIgnoreForDiagnosticsMarker(node, sourceFile) && isDiagnosticsRequest) {
                // There's an ignore marker on this node, so the diagnostic should not be reported.
                return null;
            }
            var span = comments_1.readSpanComment(node, sourceFile);
            if (span !== null) {
                // Once the positional information has been extracted, search further up the TCB to extract
                // the unique id that is attached with the TCB's function declaration.
                var id = getTemplateId(node, sourceFile, isDiagnosticsRequest);
                if (id === null) {
                    return null;
                }
                return { id: id, span: span };
            }
            node = node.parent;
        }
        return null;
    }
    exports.findSourceLocation = findSourceLocation;
    function getTemplateId(node, sourceFile, isDiagnosticRequest) {
        // Walk up to the function declaration of the TCB, the file information is attached there.
        while (!ts.isFunctionDeclaration(node)) {
            if (comments_1.hasIgnoreForDiagnosticsMarker(node, sourceFile) && isDiagnosticRequest) {
                // There's an ignore marker on this node, so the diagnostic should not be reported.
                return null;
            }
            node = node.parent;
            // Bail once we have reached the root.
            if (node === undefined) {
                return null;
            }
        }
        var start = node.getFullStart();
        return ts.forEachLeadingCommentRange(sourceFile.text, start, function (pos, end, kind) {
            if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
                return null;
            }
            var commentText = sourceFile.text.substring(pos + 2, end - 2);
            return commentText;
        }) || null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGNiX3V0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3R5cGVjaGVjay9zcmMvdGNiX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUlILCtCQUFpQztJQUdqQyxrRkFBNkQ7SUFHN0QsbUZBQTBFO0lBQzFFLGlGQUFnRjtJQXVCaEYsU0FBZ0IsNEJBQTRCLENBQ3hDLElBQTJDLEVBQzNDLFNBQXdFO1FBQzFFLGtGQUFrRjtRQUNsRixnQ0FBZ0M7UUFDaEMsZ0RBQWdEO1FBQ2hELElBQUksQ0FBQyxnQ0FBc0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQyxtREFBbUQ7WUFDbkQsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksQ0FBQyx1Q0FBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQyxnRUFBZ0U7WUFDaEUsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDekIsSUFBSSxDQUFDLFVBQUEsT0FBTyxJQUFJLE9BQUEsQ0FBQyxnQ0FBc0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQXJDLENBQXFDLENBQUMsRUFBRTtZQUN0RSwrRkFBK0Y7WUFDL0YsZ0RBQWdEO1lBQ2hELE9BQU8sSUFBSSxDQUFDO1NBQ2I7YUFBTTtZQUNMLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0lBcEJELG9FQW9CQztJQUVELHdEQUF3RDtJQUN4RCxTQUFnQixrQkFBa0IsQ0FDOUIsTUFBcUIsRUFBRSxRQUFnQixFQUFFLFFBQWdDLEVBQ3pFLG1CQUE0QjtRQUM5QixJQUFNLElBQUksR0FBRywrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEQsSUFBTSxj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QUMsMEJBQTBCLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7WUFDMUUsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsRUFBRTtnQkFDakQsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sV0FBVyxDQUFDO1FBQ3JCLENBQUMsQ0FBZSxJQUFJLElBQUksQ0FBQztJQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QWJzb2x1dGVTb3VyY2VTcGFuLCBQYXJzZVNvdXJjZVNwYW59IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Q2xhc3NEZWNsYXJhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9yZWZsZWN0aW9uJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge2dldFRva2VuQXRQb3NpdGlvbn0gZnJvbSAnLi4vLi4vdXRpbC9zcmMvdHlwZXNjcmlwdCc7XG5pbXBvcnQge0Z1bGxUZW1wbGF0ZU1hcHBpbmcsIFNvdXJjZUxvY2F0aW9uLCBUZW1wbGF0ZUlkLCBUZW1wbGF0ZVNvdXJjZU1hcHBpbmd9IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCB7aGFzSWdub3JlRm9yRGlhZ25vc3RpY3NNYXJrZXIsIHJlYWRTcGFuQ29tbWVudH0gZnJvbSAnLi9jb21tZW50cyc7XG5pbXBvcnQge2NoZWNrSWZDbGFzc0lzRXhwb3J0ZWQsIGNoZWNrSWZHZW5lcmljVHlwZXNBcmVVbmJvdW5kfSBmcm9tICcuL3RzX3V0aWwnO1xuXG4vKipcbiAqIEFkYXB0ZXIgaW50ZXJmYWNlIHdoaWNoIGFsbG93cyB0aGUgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBkaWFnbm9zdGljcyBjb2RlIHRvIGludGVycHJldCBvZmZzZXRzXG4gKiBpbiBhIFRDQiBhbmQgbWFwIHRoZW0gYmFjayB0byBvcmlnaW5hbCBsb2NhdGlvbnMgaW4gdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlU291cmNlUmVzb2x2ZXIge1xuICBnZXRUZW1wbGF0ZUlkKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUZW1wbGF0ZUlkO1xuXG4gIC8qKlxuICAgKiBGb3IgdGhlIGdpdmVuIHRlbXBsYXRlIGlkLCByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgc291cmNlIG1hcHBpbmcgd2hpY2ggZGVzY3JpYmVzIGhvdyB0aGUgb2Zmc2V0c1xuICAgKiBpbiB0aGUgdGVtcGxhdGUgc2hvdWxkIGJlIGludGVycHJldGVkLlxuICAgKi9cbiAgZ2V0U291cmNlTWFwcGluZyhpZDogVGVtcGxhdGVJZCk6IFRlbXBsYXRlU291cmNlTWFwcGluZztcblxuICAvKipcbiAgICogQ29udmVydCBhbiBhYnNvbHV0ZSBzb3VyY2Ugc3BhbiBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuIHRlbXBsYXRlIGlkIGludG8gYSBmdWxsXG4gICAqIGBQYXJzZVNvdXJjZVNwYW5gLiBUaGUgcmV0dXJuZWQgcGFyc2Ugc3BhbiBoYXMgbGluZSBhbmQgY29sdW1uIG51bWJlcnMgaW4gYWRkaXRpb24gdG8gb25seVxuICAgKiBhYnNvbHV0ZSBvZmZzZXRzIGFuZCBnaXZlcyBhY2Nlc3MgdG8gdGhlIG9yaWdpbmFsIHRlbXBsYXRlIHNvdXJjZS5cbiAgICovXG4gIHRvUGFyc2VTb3VyY2VTcGFuKGlkOiBUZW1wbGF0ZUlkLCBzcGFuOiBBYnNvbHV0ZVNvdXJjZVNwYW4pOiBQYXJzZVNvdXJjZVNwYW58bnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVzSW5saW5lVHlwZUNoZWNrQmxvY2soXG4gICAgbm9kZTogQ2xhc3NEZWNsYXJhdGlvbjx0cy5DbGFzc0RlY2xhcmF0aW9uPixcbiAgICB1c2VkUGlwZXM6IE1hcDxzdHJpbmcsIFJlZmVyZW5jZTxDbGFzc0RlY2xhcmF0aW9uPHRzLkNsYXNzRGVjbGFyYXRpb24+Pj4pOiBib29sZWFuIHtcbiAgLy8gSW4gb3JkZXIgdG8gcXVhbGlmeSBmb3IgYSBkZWNsYXJlZCBUQ0IgKG5vdCBpbmxpbmUpIHR3byBjb25kaXRpb25zIG11c3QgYmUgbWV0OlxuICAvLyAxKSB0aGUgY2xhc3MgbXVzdCBiZSBleHBvcnRlZFxuICAvLyAyKSBpdCBtdXN0IG5vdCBoYXZlIGNvbnN0cmFpbmVkIGdlbmVyaWMgdHlwZXNcbiAgaWYgKCFjaGVja0lmQ2xhc3NJc0V4cG9ydGVkKG5vZGUpKSB7XG4gICAgLy8gQ29uZGl0aW9uIDEgaXMgZmFsc2UsIHRoZSBjbGFzcyBpcyBub3QgZXhwb3J0ZWQuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoIWNoZWNrSWZHZW5lcmljVHlwZXNBcmVVbmJvdW5kKG5vZGUpKSB7XG4gICAgLy8gQ29uZGl0aW9uIDIgaXMgZmFsc2UsIHRoZSBjbGFzcyBoYXMgY29uc3RyYWluZWQgZ2VuZXJpYyB0eXBlc1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKEFycmF5LmZyb20odXNlZFBpcGVzLnZhbHVlcygpKVxuICAgICAgICAgICAgICAgICAuc29tZShwaXBlUmVmID0+ICFjaGVja0lmQ2xhc3NJc0V4cG9ydGVkKHBpcGVSZWYubm9kZSkpKSB7XG4gICAgLy8gSWYgb25lIG9mIHRoZSBwaXBlcyB1c2VkIGJ5IHRoZSBjb21wb25lbnQgaXMgbm90IGV4cG9ydGVkLCBhIG5vbi1pbmxpbmUgVENCIHdpbGwgbm90IGJlIGFibGVcbiAgICAvLyB0byBpbXBvcnQgaXQsIHNvIHRoaXMgcmVxdWlyZXMgYW4gaW5saW5lIFRDQi5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqIE1hcHMgYSBzaGltIHBvc2l0aW9uIGJhY2sgdG8gYSB0ZW1wbGF0ZSBsb2NhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZW1wbGF0ZU1hcHBpbmcoXG4gICAgc2hpbVNmOiB0cy5Tb3VyY2VGaWxlLCBwb3NpdGlvbjogbnVtYmVyLCByZXNvbHZlcjogVGVtcGxhdGVTb3VyY2VSZXNvbHZlcixcbiAgICBpc0RpYWdub3N0aWNSZXF1ZXN0OiBib29sZWFuKTogRnVsbFRlbXBsYXRlTWFwcGluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZSA9IGdldFRva2VuQXRQb3NpdGlvbihzaGltU2YsIHBvc2l0aW9uKTtcbiAgY29uc3Qgc291cmNlTG9jYXRpb24gPSBmaW5kU291cmNlTG9jYXRpb24obm9kZSwgc2hpbVNmLCBpc0RpYWdub3N0aWNSZXF1ZXN0KTtcbiAgaWYgKHNvdXJjZUxvY2F0aW9uID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBtYXBwaW5nID0gcmVzb2x2ZXIuZ2V0U291cmNlTWFwcGluZyhzb3VyY2VMb2NhdGlvbi5pZCk7XG4gIGNvbnN0IHNwYW4gPSByZXNvbHZlci50b1BhcnNlU291cmNlU3Bhbihzb3VyY2VMb2NhdGlvbi5pZCwgc291cmNlTG9jYXRpb24uc3Bhbik7XG4gIGlmIChzcGFuID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gVE9ETyhhdHNjb3R0KTogQ29uc2lkZXIgYWRkaW5nIGEgY29udGV4dCBzcGFuIGJ5IHdhbGtpbmcgdXAgZnJvbSBgbm9kZWAgdW50aWwgd2UgZ2V0IGFcbiAgLy8gZGlmZmVyZW50IHNwYW4uXG4gIHJldHVybiB7c291cmNlTG9jYXRpb24sIHRlbXBsYXRlU291cmNlTWFwcGluZzogbWFwcGluZywgc3Bhbn07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kVHlwZUNoZWNrQmxvY2soXG4gICAgZmlsZTogdHMuU291cmNlRmlsZSwgaWQ6IFRlbXBsYXRlSWQsIGlzRGlhZ25vc3RpY1JlcXVlc3Q6IGJvb2xlYW4pOiB0cy5Ob2RlfG51bGwge1xuICBmb3IgKGNvbnN0IHN0bXQgb2YgZmlsZS5zdGF0ZW1lbnRzKSB7XG4gICAgaWYgKHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihzdG10KSAmJiBnZXRUZW1wbGF0ZUlkKHN0bXQsIGZpbGUsIGlzRGlhZ25vc3RpY1JlcXVlc3QpID09PSBpZCkge1xuICAgICAgcmV0dXJuIHN0bXQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlcyB1cCB0aGUgQVNUIHN0YXJ0aW5nIGZyb20gdGhlIGdpdmVuIG5vZGUgdG8gZXh0cmFjdCB0aGUgc291cmNlIGxvY2F0aW9uIGZyb20gY29tbWVudHNcbiAqIHRoYXQgaGF2ZSBiZWVuIGVtaXR0ZWQgaW50byB0aGUgVENCLiBJZiB0aGUgbm9kZSBkb2VzIG5vdCBleGlzdCB3aXRoaW4gYSBUQ0IsIG9yIGlmIGFuIGlnbm9yZVxuICogbWFya2VyIGNvbW1lbnQgaXMgZm91bmQgdXAgdGhlIHRyZWUgKGFuZCB0aGlzIGlzIHBhcnQgb2YgYSBkaWFnbm9zdGljIHJlcXVlc3QpLCB0aGlzIGZ1bmN0aW9uXG4gKiByZXR1cm5zIG51bGwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kU291cmNlTG9jYXRpb24oXG4gICAgbm9kZTogdHMuTm9kZSwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgaXNEaWFnbm9zdGljc1JlcXVlc3Q6IGJvb2xlYW4pOiBTb3VyY2VMb2NhdGlvbnxudWxsIHtcbiAgLy8gU2VhcmNoIGZvciBjb21tZW50cyB1bnRpbCB0aGUgVENCJ3MgZnVuY3Rpb24gZGVjbGFyYXRpb24gaXMgZW5jb3VudGVyZWQuXG4gIHdoaWxlIChub2RlICE9PSB1bmRlZmluZWQgJiYgIXRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSkge1xuICAgIGlmIChoYXNJZ25vcmVGb3JEaWFnbm9zdGljc01hcmtlcihub2RlLCBzb3VyY2VGaWxlKSAmJiBpc0RpYWdub3N0aWNzUmVxdWVzdCkge1xuICAgICAgLy8gVGhlcmUncyBhbiBpZ25vcmUgbWFya2VyIG9uIHRoaXMgbm9kZSwgc28gdGhlIGRpYWdub3N0aWMgc2hvdWxkIG5vdCBiZSByZXBvcnRlZC5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHNwYW4gPSByZWFkU3BhbkNvbW1lbnQobm9kZSwgc291cmNlRmlsZSk7XG4gICAgaWYgKHNwYW4gIT09IG51bGwpIHtcbiAgICAgIC8vIE9uY2UgdGhlIHBvc2l0aW9uYWwgaW5mb3JtYXRpb24gaGFzIGJlZW4gZXh0cmFjdGVkLCBzZWFyY2ggZnVydGhlciB1cCB0aGUgVENCIHRvIGV4dHJhY3RcbiAgICAgIC8vIHRoZSB1bmlxdWUgaWQgdGhhdCBpcyBhdHRhY2hlZCB3aXRoIHRoZSBUQ0IncyBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cbiAgICAgIGNvbnN0IGlkID0gZ2V0VGVtcGxhdGVJZChub2RlLCBzb3VyY2VGaWxlLCBpc0RpYWdub3N0aWNzUmVxdWVzdCk7XG4gICAgICBpZiAoaWQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4ge2lkLCBzcGFufTtcbiAgICB9XG5cbiAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVJZChcbiAgICBub2RlOiB0cy5Ob2RlLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBpc0RpYWdub3N0aWNSZXF1ZXN0OiBib29sZWFuKTogVGVtcGxhdGVJZHxudWxsIHtcbiAgLy8gV2FsayB1cCB0byB0aGUgZnVuY3Rpb24gZGVjbGFyYXRpb24gb2YgdGhlIFRDQiwgdGhlIGZpbGUgaW5mb3JtYXRpb24gaXMgYXR0YWNoZWQgdGhlcmUuXG4gIHdoaWxlICghdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgaWYgKGhhc0lnbm9yZUZvckRpYWdub3N0aWNzTWFya2VyKG5vZGUsIHNvdXJjZUZpbGUpICYmIGlzRGlhZ25vc3RpY1JlcXVlc3QpIHtcbiAgICAgIC8vIFRoZXJlJ3MgYW4gaWdub3JlIG1hcmtlciBvbiB0aGlzIG5vZGUsIHNvIHRoZSBkaWFnbm9zdGljIHNob3VsZCBub3QgYmUgcmVwb3J0ZWQuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50O1xuXG4gICAgLy8gQmFpbCBvbmNlIHdlIGhhdmUgcmVhY2hlZCB0aGUgcm9vdC5cbiAgICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGFydCA9IG5vZGUuZ2V0RnVsbFN0YXJ0KCk7XG4gIHJldHVybiB0cy5mb3JFYWNoTGVhZGluZ0NvbW1lbnRSYW5nZShzb3VyY2VGaWxlLnRleHQsIHN0YXJ0LCAocG9zLCBlbmQsIGtpbmQpID0+IHtcbiAgICBpZiAoa2luZCAhPT0gdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY29tbWVudFRleHQgPSBzb3VyY2VGaWxlLnRleHQuc3Vic3RyaW5nKHBvcyArIDIsIGVuZCAtIDIpO1xuICAgIHJldHVybiBjb21tZW50VGV4dDtcbiAgfSkgYXMgVGVtcGxhdGVJZCB8fCBudWxsO1xufVxuIl19
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
        define("@angular/compiler-cli/src/ngtsc/transform/src/trait", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Trait = exports.TraitState = void 0;
    var TraitState;
    (function (TraitState) {
        /**
         * Pending traits are freshly created and have never been analyzed.
         */
        TraitState[TraitState["Pending"] = 0] = "Pending";
        /**
         * Analyzed traits have successfully been analyzed, but are pending resolution.
         */
        TraitState[TraitState["Analyzed"] = 1] = "Analyzed";
        /**
         * Resolved traits have successfully been analyzed and resolved and are ready for compilation.
         */
        TraitState[TraitState["Resolved"] = 2] = "Resolved";
        /**
         * Skipped traits are no longer considered for compilation.
         */
        TraitState[TraitState["Skipped"] = 3] = "Skipped";
    })(TraitState = exports.TraitState || (exports.TraitState = {}));
    /**
     * The value side of `Trait` exposes a helper to create a `Trait` in a pending state (by delegating
     * to `TraitImpl`).
     */
    exports.Trait = {
        pending: function (handler, detected) { return TraitImpl.pending(handler, detected); },
    };
    /**
     * An implementation of the `Trait` type which transitions safely between the various
     * `TraitState`s.
     */
    var TraitImpl = /** @class */ (function () {
        function TraitImpl(handler, detected) {
            this.state = TraitState.Pending;
            this.analysis = null;
            this.resolution = null;
            this.analysisDiagnostics = null;
            this.resolveDiagnostics = null;
            this.handler = handler;
            this.detected = detected;
        }
        TraitImpl.prototype.toAnalyzed = function (analysis, diagnostics) {
            // Only pending traits can be analyzed.
            this.assertTransitionLegal(TraitState.Pending, TraitState.Analyzed);
            this.analysis = analysis;
            this.analysisDiagnostics = diagnostics;
            this.state = TraitState.Analyzed;
            return this;
        };
        TraitImpl.prototype.toResolved = function (resolution, diagnostics) {
            // Only analyzed traits can be resolved.
            this.assertTransitionLegal(TraitState.Analyzed, TraitState.Resolved);
            if (this.analysis === null) {
                throw new Error("Cannot transition an Analyzed trait with a null analysis to Resolved");
            }
            this.resolution = resolution;
            this.state = TraitState.Resolved;
            this.resolveDiagnostics = diagnostics;
            return this;
        };
        TraitImpl.prototype.toSkipped = function () {
            // Only pending traits can be skipped.
            this.assertTransitionLegal(TraitState.Pending, TraitState.Skipped);
            this.state = TraitState.Skipped;
            return this;
        };
        /**
         * Verifies that the trait is currently in one of the `allowedState`s.
         *
         * If correctly used, the `Trait` type and transition methods prevent illegal transitions from
         * occurring. However, if a reference to the `TraitImpl` instance typed with the previous
         * interface is retained after calling one of its transition methods, it will allow for illegal
         * transitions to take place. Hence, this assertion provides a little extra runtime protection.
         */
        TraitImpl.prototype.assertTransitionLegal = function (allowedState, transitionTo) {
            if (!(this.state === allowedState)) {
                throw new Error("Assertion failure: cannot transition from " + TraitState[this.state] + " to " + TraitState[transitionTo] + ".");
            }
        };
        /**
         * Construct a new `TraitImpl` in the pending state.
         */
        TraitImpl.pending = function (handler, detected) {
            return new TraitImpl(handler, detected);
        };
        return TraitImpl;
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhaXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zZm9ybS9zcmMvdHJhaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBS0gsSUFBWSxVQW9CWDtJQXBCRCxXQUFZLFVBQVU7UUFDcEI7O1dBRUc7UUFDSCxpREFBTyxDQUFBO1FBRVA7O1dBRUc7UUFDSCxtREFBUSxDQUFBO1FBRVI7O1dBRUc7UUFDSCxtREFBUSxDQUFBO1FBRVI7O1dBRUc7UUFDSCxpREFBTyxDQUFBO0lBQ1QsQ0FBQyxFQXBCVyxVQUFVLEdBQVYsa0JBQVUsS0FBVixrQkFBVSxRQW9CckI7SUFrQkQ7OztPQUdHO0lBQ1UsUUFBQSxLQUFLLEdBQUc7UUFDbkIsT0FBTyxFQUFFLFVBQVUsT0FBa0MsRUFBRSxRQUF5QixJQUNuRCxPQUFBLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFwQyxDQUFvQztLQUNsRSxDQUFDO0lBc0hGOzs7T0FHRztJQUNIO1FBU0UsbUJBQVksT0FBa0MsRUFBRSxRQUF5QjtZQVJ6RSxVQUFLLEdBQWUsVUFBVSxDQUFDLE9BQU8sQ0FBQztZQUd2QyxhQUFRLEdBQXFCLElBQUksQ0FBQztZQUNsQyxlQUFVLEdBQXFCLElBQUksQ0FBQztZQUNwQyx3QkFBbUIsR0FBeUIsSUFBSSxDQUFDO1lBQ2pELHVCQUFrQixHQUF5QixJQUFJLENBQUM7WUFHOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDM0IsQ0FBQztRQUVELDhCQUFVLEdBQVYsVUFBVyxRQUFnQixFQUFFLFdBQWlDO1lBQzVELHVDQUF1QztZQUN2QyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztZQUN2QyxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDakMsT0FBTyxJQUE4QixDQUFDO1FBQ3hDLENBQUM7UUFFRCw4QkFBVSxHQUFWLFVBQVcsVUFBa0IsRUFBRSxXQUFpQztZQUM5RCx3Q0FBd0M7WUFDeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0VBQXNFLENBQUMsQ0FBQzthQUN6RjtZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztZQUNqQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxDQUFDO1lBQ3RDLE9BQU8sSUFBOEIsQ0FBQztRQUN4QyxDQUFDO1FBRUQsNkJBQVMsR0FBVDtZQUNFLHNDQUFzQztZQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ2hDLE9BQU8sSUFBNkIsQ0FBQztRQUN2QyxDQUFDO1FBRUQ7Ozs7Ozs7V0FPRztRQUNLLHlDQUFxQixHQUE3QixVQUE4QixZQUF3QixFQUFFLFlBQXdCO1lBQzlFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssWUFBWSxDQUFDLEVBQUU7Z0JBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQTZDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQy9FLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBRyxDQUFDLENBQUM7YUFDbEM7UUFDSCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxpQkFBTyxHQUFkLFVBQXdCLE9BQWtDLEVBQUUsUUFBeUI7WUFFbkYsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUEwQixDQUFDO1FBQ25FLENBQUM7UUFDSCxnQkFBQztJQUFELENBQUMsQUFoRUQsSUFnRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge0RlY29yYXRvckhhbmRsZXIsIERldGVjdFJlc3VsdH0gZnJvbSAnLi9hcGknO1xuXG5leHBvcnQgZW51bSBUcmFpdFN0YXRlIHtcbiAgLyoqXG4gICAqIFBlbmRpbmcgdHJhaXRzIGFyZSBmcmVzaGx5IGNyZWF0ZWQgYW5kIGhhdmUgbmV2ZXIgYmVlbiBhbmFseXplZC5cbiAgICovXG4gIFBlbmRpbmcsXG5cbiAgLyoqXG4gICAqIEFuYWx5emVkIHRyYWl0cyBoYXZlIHN1Y2Nlc3NmdWxseSBiZWVuIGFuYWx5emVkLCBidXQgYXJlIHBlbmRpbmcgcmVzb2x1dGlvbi5cbiAgICovXG4gIEFuYWx5emVkLFxuXG4gIC8qKlxuICAgKiBSZXNvbHZlZCB0cmFpdHMgaGF2ZSBzdWNjZXNzZnVsbHkgYmVlbiBhbmFseXplZCBhbmQgcmVzb2x2ZWQgYW5kIGFyZSByZWFkeSBmb3IgY29tcGlsYXRpb24uXG4gICAqL1xuICBSZXNvbHZlZCxcblxuICAvKipcbiAgICogU2tpcHBlZCB0cmFpdHMgYXJlIG5vIGxvbmdlciBjb25zaWRlcmVkIGZvciBjb21waWxhdGlvbi5cbiAgICovXG4gIFNraXBwZWQsXG59XG5cbi8qKlxuICogQW4gSXZ5IGFzcGVjdCBhZGRlZCB0byBhIGNsYXNzIChmb3IgZXhhbXBsZSwgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY29tcG9uZW50IGRlZmluaXRpb24pLlxuICpcbiAqIFRyYWl0cyBhcmUgY3JlYXRlZCB3aGVuIGEgYERlY29yYXRvckhhbmRsZXJgIG1hdGNoZXMgYSBjbGFzcy4gRWFjaCB0cmFpdCBiZWdpbnMgaW4gYSBwZW5kaW5nXG4gKiBzdGF0ZSBhbmQgdW5kZXJnb2VzIHRyYW5zaXRpb25zIGFzIGNvbXBpbGF0aW9uIHByb2NlZWRzIHRocm91Z2ggdGhlIHZhcmlvdXMgc3RlcHMuXG4gKlxuICogSW4gcHJhY3RpY2UsIHRyYWl0cyBhcmUgaW5zdGFuY2VzIG9mIHRoZSBwcml2YXRlIGNsYXNzIGBUcmFpdEltcGxgIGRlY2xhcmVkIGJlbG93LiBUaHJvdWdoIHRoZVxuICogdmFyaW91cyBpbnRlcmZhY2VzIGluY2x1ZGVkIGluIHRoaXMgdW5pb24gdHlwZSwgdGhlIGxlZ2FsIEFQSSBvZiBhIHRyYWl0IGluIGFueSBnaXZlbiBzdGF0ZSBpc1xuICogcmVwcmVzZW50ZWQgaW4gdGhlIHR5cGUgc3lzdGVtLiBUaGlzIGluY2x1ZGVzIGFueSBwb3NzaWJsZSB0cmFuc2l0aW9ucyBmcm9tIG9uZSB0eXBlIHRvIHRoZSBuZXh0LlxuICpcbiAqIFRoaXMgbm90IG9ubHkgc2ltcGxpZmllcyB0aGUgaW1wbGVtZW50YXRpb24sIGJ1dCBlbnN1cmVzIHRyYWl0cyBhcmUgbW9ub21vcnBoaWMgb2JqZWN0cyBhc1xuICogdGhleSdyZSBhbGwganVzdCBcInZpZXdzXCIgaW4gdGhlIHR5cGUgc3lzdGVtIG9mIHRoZSBzYW1lIG9iamVjdCAod2hpY2ggbmV2ZXIgY2hhbmdlcyBzaGFwZSkuXG4gKi9cbmV4cG9ydCB0eXBlIFRyYWl0PEQsIEEsIFI+ID1cbiAgICBQZW5kaW5nVHJhaXQ8RCwgQSwgUj58U2tpcHBlZFRyYWl0PEQsIEEsIFI+fEFuYWx5emVkVHJhaXQ8RCwgQSwgUj58UmVzb2x2ZWRUcmFpdDxELCBBLCBSPjtcblxuLyoqXG4gKiBUaGUgdmFsdWUgc2lkZSBvZiBgVHJhaXRgIGV4cG9zZXMgYSBoZWxwZXIgdG8gY3JlYXRlIGEgYFRyYWl0YCBpbiBhIHBlbmRpbmcgc3RhdGUgKGJ5IGRlbGVnYXRpbmdcbiAqIHRvIGBUcmFpdEltcGxgKS5cbiAqL1xuZXhwb3J0IGNvbnN0IFRyYWl0ID0ge1xuICBwZW5kaW5nOiA8RCwgQSwgUj4oaGFuZGxlcjogRGVjb3JhdG9ySGFuZGxlcjxELCBBLCBSPiwgZGV0ZWN0ZWQ6IERldGVjdFJlc3VsdDxEPik6XG4gICAgICBQZW5kaW5nVHJhaXQ8RCwgQSwgUj4gPT4gVHJhaXRJbXBsLnBlbmRpbmcoaGFuZGxlciwgZGV0ZWN0ZWQpLFxufTtcblxuLyoqXG4gKiBUaGUgcGFydCBvZiB0aGUgYFRyYWl0YCBpbnRlcmZhY2UgdGhhdCdzIGNvbW1vbiB0byBhbGwgdHJhaXQgc3RhdGVzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRyYWl0QmFzZTxELCBBLCBSPiB7XG4gIC8qKlxuICAgKiBDdXJyZW50IHN0YXRlIG9mIHRoZSB0cmFpdC5cbiAgICpcbiAgICogVGhpcyB3aWxsIGJlIG5hcnJvd2VkIGluIHRoZSBpbnRlcmZhY2VzIGZvciBlYWNoIHNwZWNpZmljIHN0YXRlLlxuICAgKi9cbiAgc3RhdGU6IFRyYWl0U3RhdGU7XG5cbiAgLyoqXG4gICAqIFRoZSBgRGVjb3JhdG9ySGFuZGxlcmAgd2hpY2ggbWF0Y2hlZCBvbiB0aGUgY2xhc3MgdG8gY3JlYXRlIHRoaXMgdHJhaXQuXG4gICAqL1xuICBoYW5kbGVyOiBEZWNvcmF0b3JIYW5kbGVyPEQsIEEsIFI+O1xuXG4gIC8qKlxuICAgKiBUaGUgZGV0ZWN0aW9uIHJlc3VsdCAob2YgYGhhbmRsZXIuZGV0ZWN0YCkgd2hpY2ggaW5kaWNhdGVkIHRoYXQgdGhpcyB0cmFpdCBhcHBsaWVkIHRvIHRoZVxuICAgKiBjbGFzcy5cbiAgICpcbiAgICogVGhpcyBpcyBtYWlubHkgdXNlZCB0byBjYWNoZSB0aGUgZGV0ZWN0aW9uIGJldHdlZW4gcHJlLWFuYWx5c2lzIGFuZCBhbmFseXNpcy5cbiAgICovXG4gIGRldGVjdGVkOiBEZXRlY3RSZXN1bHQ8RD47XG59XG5cbi8qKlxuICogQSB0cmFpdCBpbiB0aGUgcGVuZGluZyBzdGF0ZS5cbiAqXG4gKiBQZW5kaW5nIHRyYWl0cyBoYXZlIHlldCB0byBiZSBhbmFseXplZCBpbiBhbnkgd2F5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBlbmRpbmdUcmFpdDxELCBBLCBSPiBleHRlbmRzIFRyYWl0QmFzZTxELCBBLCBSPiB7XG4gIHN0YXRlOiBUcmFpdFN0YXRlLlBlbmRpbmc7XG5cbiAgLyoqXG4gICAqIFRoaXMgcGVuZGluZyB0cmFpdCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgYW5hbHl6ZWQsIGFuZCBzaG91bGQgdHJhbnNpdGlvbiB0byB0aGUgXCJhbmFseXplZFwiXG4gICAqIHN0YXRlLlxuICAgKi9cbiAgdG9BbmFseXplZChhbmFseXNpczogQXxudWxsLCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGwpOiBBbmFseXplZFRyYWl0PEQsIEEsIFI+O1xuXG4gIC8qKlxuICAgKiBEdXJpbmcgYW5hbHlzaXMgaXQgd2FzIGRldGVybWluZWQgdGhhdCB0aGlzIHRyYWl0IGlzIG5vdCBlbGlnaWJsZSBmb3IgY29tcGlsYXRpb24gYWZ0ZXIgYWxsLFxuICAgKiBhbmQgc2hvdWxkIGJlIHRyYW5zaXRpb25lZCB0byB0aGUgXCJza2lwcGVkXCIgc3RhdGUuXG4gICAqL1xuICB0b1NraXBwZWQoKTogU2tpcHBlZFRyYWl0PEQsIEEsIFI+O1xufVxuXG4vKipcbiAqIEEgdHJhaXQgaW4gdGhlIFwic2tpcHBlZFwiIHN0YXRlLlxuICpcbiAqIFNraXBwZWQgdHJhaXRzIGFyZW4ndCBjb25zaWRlcmVkIGZvciBjb21waWxhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGEgdGVybWluYWwgc3RhdGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2tpcHBlZFRyYWl0PEQsIEEsIFI+IGV4dGVuZHMgVHJhaXRCYXNlPEQsIEEsIFI+IHtcbiAgc3RhdGU6IFRyYWl0U3RhdGUuU2tpcHBlZDtcbn1cblxuLyoqXG4gKiBBIHRyYWl0IGluIHRoZSBcImFuYWx5emVkXCIgc3RhdGUuXG4gKlxuICogQW5hbHl6ZWQgdHJhaXRzIGhhdmUgYW5hbHlzaXMgcmVzdWx0cyBhdmFpbGFibGUsIGFuZCBhcmUgZWxpZ2libGUgZm9yIHJlc29sdXRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHl6ZWRUcmFpdDxELCBBLCBSPiBleHRlbmRzIFRyYWl0QmFzZTxELCBBLCBSPiB7XG4gIHN0YXRlOiBUcmFpdFN0YXRlLkFuYWx5emVkO1xuXG4gIC8qKlxuICAgKiBBbmFseXNpcyByZXN1bHRzIG9mIHRoZSBnaXZlbiB0cmFpdCAoaWYgYWJsZSB0byBiZSBwcm9kdWNlZCksIG9yIGBudWxsYCBpZiBhbmFseXNpcyBmYWlsZWRcbiAgICogY29tcGxldGVseS5cbiAgICovXG4gIGFuYWx5c2lzOiBSZWFkb25seTxBPnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbnkgZGlhZ25vc3RpY3MgdGhhdCByZXN1bHRlZCBmcm9tIGFuYWx5c2lzLCBvciBgbnVsbGAgaWYgbm9uZS5cbiAgICovXG4gIGFuYWx5c2lzRGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGlzIGFuYWx5emVkIHRyYWl0IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSByZXNvbHZlZCwgYW5kIHNob3VsZCBiZSB0cmFuc2l0aW9uZWQgdG8gdGhlXG4gICAqIFwicmVzb2x2ZWRcIiBzdGF0ZS5cbiAgICovXG4gIHRvUmVzb2x2ZWQocmVzb2x1dGlvbjogUnxudWxsLCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGwpOiBSZXNvbHZlZFRyYWl0PEQsIEEsIFI+O1xufVxuXG4vKipcbiAqIEEgdHJhaXQgaW4gdGhlIFwicmVzb2x2ZWRcIiBzdGF0ZS5cbiAqXG4gKiBSZXNvbHZlZCB0cmFpdHMgaGF2ZSBiZWVuIHN1Y2Nlc3NmdWxseSBhbmFseXplZCBhbmQgcmVzb2x2ZWQsIGNvbnRhaW4gbm8gZXJyb3JzLCBhbmQgYXJlIHJlYWR5XG4gKiBmb3IgdGhlIGNvbXBpbGF0aW9uIHBoYXNlLlxuICpcbiAqIFRoaXMgaXMgYSB0ZXJtaW5hbCBzdGF0ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFRyYWl0PEQsIEEsIFI+IGV4dGVuZHMgVHJhaXRCYXNlPEQsIEEsIFI+IHtcbiAgc3RhdGU6IFRyYWl0U3RhdGUuUmVzb2x2ZWQ7XG5cbiAgLyoqXG4gICAqIFJlc29sdmVkIHRyYWl0cyBtdXN0IGhhdmUgcHJvZHVjZWQgdmFsaWQgYW5hbHlzaXMgcmVzdWx0cy5cbiAgICovXG4gIGFuYWx5c2lzOiBSZWFkb25seTxBPjtcblxuICAvKipcbiAgICogQW5hbHlzaXMgbWF5IGhhdmUgc3RpbGwgcmVzdWx0ZWQgaW4gZGlhZ25vc3RpY3MuXG4gICAqL1xuICBhbmFseXNpc0RpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW118bnVsbDtcblxuICAvKipcbiAgICogRGlhZ25vc3RpY3MgcmVzdWx0aW5nIGZyb20gcmVzb2x1dGlvbiBhcmUgdHJhY2tlZCBzZXBhcmF0ZWx5IGZyb21cbiAgICovXG4gIHJlc29sdmVEaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSByZXN1bHRzIHJldHVybmVkIGJ5IGEgc3VjY2Vzc2Z1bCByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBjbGFzcy9gRGVjb3JhdG9ySGFuZGxlcmBcbiAgICogY29tYmluYXRpb24uXG4gICAqL1xuICByZXNvbHV0aW9uOiBSZWFkb25seTxSPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgVHJhaXRgIHR5cGUgd2hpY2ggdHJhbnNpdGlvbnMgc2FmZWx5IGJldHdlZW4gdGhlIHZhcmlvdXNcbiAqIGBUcmFpdFN0YXRlYHMuXG4gKi9cbmNsYXNzIFRyYWl0SW1wbDxELCBBLCBSPiB7XG4gIHN0YXRlOiBUcmFpdFN0YXRlID0gVHJhaXRTdGF0ZS5QZW5kaW5nO1xuICBoYW5kbGVyOiBEZWNvcmF0b3JIYW5kbGVyPEQsIEEsIFI+O1xuICBkZXRlY3RlZDogRGV0ZWN0UmVzdWx0PEQ+O1xuICBhbmFseXNpczogUmVhZG9ubHk8QT58bnVsbCA9IG51bGw7XG4gIHJlc29sdXRpb246IFJlYWRvbmx5PFI+fG51bGwgPSBudWxsO1xuICBhbmFseXNpc0RpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW118bnVsbCA9IG51bGw7XG4gIHJlc29sdmVEaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGhhbmRsZXI6IERlY29yYXRvckhhbmRsZXI8RCwgQSwgUj4sIGRldGVjdGVkOiBEZXRlY3RSZXN1bHQ8RD4pIHtcbiAgICB0aGlzLmhhbmRsZXIgPSBoYW5kbGVyO1xuICAgIHRoaXMuZGV0ZWN0ZWQgPSBkZXRlY3RlZDtcbiAgfVxuXG4gIHRvQW5hbHl6ZWQoYW5hbHlzaXM6IEF8bnVsbCwgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXXxudWxsKTogQW5hbHl6ZWRUcmFpdDxELCBBLCBSPiB7XG4gICAgLy8gT25seSBwZW5kaW5nIHRyYWl0cyBjYW4gYmUgYW5hbHl6ZWQuXG4gICAgdGhpcy5hc3NlcnRUcmFuc2l0aW9uTGVnYWwoVHJhaXRTdGF0ZS5QZW5kaW5nLCBUcmFpdFN0YXRlLkFuYWx5emVkKTtcbiAgICB0aGlzLmFuYWx5c2lzID0gYW5hbHlzaXM7XG4gICAgdGhpcy5hbmFseXNpc0RpYWdub3N0aWNzID0gZGlhZ25vc3RpY3M7XG4gICAgdGhpcy5zdGF0ZSA9IFRyYWl0U3RhdGUuQW5hbHl6ZWQ7XG4gICAgcmV0dXJuIHRoaXMgYXMgQW5hbHl6ZWRUcmFpdDxELCBBLCBSPjtcbiAgfVxuXG4gIHRvUmVzb2x2ZWQocmVzb2x1dGlvbjogUnxudWxsLCBkaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdfG51bGwpOiBSZXNvbHZlZFRyYWl0PEQsIEEsIFI+IHtcbiAgICAvLyBPbmx5IGFuYWx5emVkIHRyYWl0cyBjYW4gYmUgcmVzb2x2ZWQuXG4gICAgdGhpcy5hc3NlcnRUcmFuc2l0aW9uTGVnYWwoVHJhaXRTdGF0ZS5BbmFseXplZCwgVHJhaXRTdGF0ZS5SZXNvbHZlZCk7XG4gICAgaWYgKHRoaXMuYW5hbHlzaXMgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHRyYW5zaXRpb24gYW4gQW5hbHl6ZWQgdHJhaXQgd2l0aCBhIG51bGwgYW5hbHlzaXMgdG8gUmVzb2x2ZWRgKTtcbiAgICB9XG4gICAgdGhpcy5yZXNvbHV0aW9uID0gcmVzb2x1dGlvbjtcbiAgICB0aGlzLnN0YXRlID0gVHJhaXRTdGF0ZS5SZXNvbHZlZDtcbiAgICB0aGlzLnJlc29sdmVEaWFnbm9zdGljcyA9IGRpYWdub3N0aWNzO1xuICAgIHJldHVybiB0aGlzIGFzIFJlc29sdmVkVHJhaXQ8RCwgQSwgUj47XG4gIH1cblxuICB0b1NraXBwZWQoKTogU2tpcHBlZFRyYWl0PEQsIEEsIFI+IHtcbiAgICAvLyBPbmx5IHBlbmRpbmcgdHJhaXRzIGNhbiBiZSBza2lwcGVkLlxuICAgIHRoaXMuYXNzZXJ0VHJhbnNpdGlvbkxlZ2FsKFRyYWl0U3RhdGUuUGVuZGluZywgVHJhaXRTdGF0ZS5Ta2lwcGVkKTtcbiAgICB0aGlzLnN0YXRlID0gVHJhaXRTdGF0ZS5Ta2lwcGVkO1xuICAgIHJldHVybiB0aGlzIGFzIFNraXBwZWRUcmFpdDxELCBBLCBSPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyB0aGF0IHRoZSB0cmFpdCBpcyBjdXJyZW50bHkgaW4gb25lIG9mIHRoZSBgYWxsb3dlZFN0YXRlYHMuXG4gICAqXG4gICAqIElmIGNvcnJlY3RseSB1c2VkLCB0aGUgYFRyYWl0YCB0eXBlIGFuZCB0cmFuc2l0aW9uIG1ldGhvZHMgcHJldmVudCBpbGxlZ2FsIHRyYW5zaXRpb25zIGZyb21cbiAgICogb2NjdXJyaW5nLiBIb3dldmVyLCBpZiBhIHJlZmVyZW5jZSB0byB0aGUgYFRyYWl0SW1wbGAgaW5zdGFuY2UgdHlwZWQgd2l0aCB0aGUgcHJldmlvdXNcbiAgICogaW50ZXJmYWNlIGlzIHJldGFpbmVkIGFmdGVyIGNhbGxpbmcgb25lIG9mIGl0cyB0cmFuc2l0aW9uIG1ldGhvZHMsIGl0IHdpbGwgYWxsb3cgZm9yIGlsbGVnYWxcbiAgICogdHJhbnNpdGlvbnMgdG8gdGFrZSBwbGFjZS4gSGVuY2UsIHRoaXMgYXNzZXJ0aW9uIHByb3ZpZGVzIGEgbGl0dGxlIGV4dHJhIHJ1bnRpbWUgcHJvdGVjdGlvbi5cbiAgICovXG4gIHByaXZhdGUgYXNzZXJ0VHJhbnNpdGlvbkxlZ2FsKGFsbG93ZWRTdGF0ZTogVHJhaXRTdGF0ZSwgdHJhbnNpdGlvblRvOiBUcmFpdFN0YXRlKTogdm9pZCB7XG4gICAgaWYgKCEodGhpcy5zdGF0ZSA9PT0gYWxsb3dlZFN0YXRlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb24gZmFpbHVyZTogY2Fubm90IHRyYW5zaXRpb24gZnJvbSAke1RyYWl0U3RhdGVbdGhpcy5zdGF0ZV19IHRvICR7XG4gICAgICAgICAgVHJhaXRTdGF0ZVt0cmFuc2l0aW9uVG9dfS5gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgbmV3IGBUcmFpdEltcGxgIGluIHRoZSBwZW5kaW5nIHN0YXRlLlxuICAgKi9cbiAgc3RhdGljIHBlbmRpbmc8RCwgQSwgUj4oaGFuZGxlcjogRGVjb3JhdG9ySGFuZGxlcjxELCBBLCBSPiwgZGV0ZWN0ZWQ6IERldGVjdFJlc3VsdDxEPik6XG4gICAgICBQZW5kaW5nVHJhaXQ8RCwgQSwgUj4ge1xuICAgIHJldHVybiBuZXcgVHJhaXRJbXBsKGhhbmRsZXIsIGRldGVjdGVkKSBhcyBQZW5kaW5nVHJhaXQ8RCwgQSwgUj47XG4gIH1cbn1cbiJdfQ==
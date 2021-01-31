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
        define("@angular/compiler-cli/src/ngtsc/entry_point/src/reference_graph", ["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferenceGraph = void 0;
    var tslib_1 = require("tslib");
    var ReferenceGraph = /** @class */ (function () {
        function ReferenceGraph() {
            this.references = new Map();
        }
        ReferenceGraph.prototype.add = function (from, to) {
            if (!this.references.has(from)) {
                this.references.set(from, new Set());
            }
            this.references.get(from).add(to);
        };
        ReferenceGraph.prototype.transitiveReferencesOf = function (target) {
            var set = new Set();
            this.collectTransitiveReferences(set, target);
            return set;
        };
        ReferenceGraph.prototype.pathFrom = function (source, target) {
            return this.collectPathFrom(source, target, new Set());
        };
        ReferenceGraph.prototype.collectPathFrom = function (source, target, seen) {
            var _this = this;
            if (source === target) {
                // Looking for a path from the target to itself - that path is just the target. This is the
                // "base case" of the search.
                return [target];
            }
            else if (seen.has(source)) {
                // The search has already looked through this source before.
                return null;
            }
            // Consider outgoing edges from `source`.
            seen.add(source);
            if (!this.references.has(source)) {
                // There are no outgoing edges from `source`.
                return null;
            }
            else {
                // Look through the outgoing edges of `source`.
                // TODO(alxhub): use proper iteration when the legacy build is removed. (#27762)
                var candidatePath_1 = null;
                this.references.get(source).forEach(function (edge) {
                    // Early exit if a path has already been found.
                    if (candidatePath_1 !== null) {
                        return;
                    }
                    // Look for a path from this outgoing edge to `target`.
                    var partialPath = _this.collectPathFrom(edge, target, seen);
                    if (partialPath !== null) {
                        // A path exists from `edge` to `target`. Insert `source` at the beginning.
                        candidatePath_1 = tslib_1.__spread([source], partialPath);
                    }
                });
                return candidatePath_1;
            }
        };
        ReferenceGraph.prototype.collectTransitiveReferences = function (set, decl) {
            var _this = this;
            if (this.references.has(decl)) {
                // TODO(alxhub): use proper iteration when the legacy build is removed. (#27762)
                this.references.get(decl).forEach(function (ref) {
                    if (!set.has(ref)) {
                        set.add(ref);
                        _this.collectTransitiveReferences(set, ref);
                    }
                });
            }
        };
        return ReferenceGraph;
    }());
    exports.ReferenceGraph = ReferenceGraph;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlX2dyYXBoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9lbnRyeV9wb2ludC9zcmMvcmVmZXJlbmNlX2dyYXBoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7SUFJSDtRQUFBO1lBQ1UsZUFBVSxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7UUFrRTVDLENBQUM7UUFoRUMsNEJBQUcsR0FBSCxVQUFJLElBQU8sRUFBRSxFQUFLO1lBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQzthQUN0QztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsK0NBQXNCLEdBQXRCLFVBQXVCLE1BQVM7WUFDOUIsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQztRQUVELGlDQUFRLEdBQVIsVUFBUyxNQUFTLEVBQUUsTUFBUztZQUMzQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVPLHdDQUFlLEdBQXZCLFVBQXdCLE1BQVMsRUFBRSxNQUFTLEVBQUUsSUFBWTtZQUExRCxpQkFrQ0M7WUFqQ0MsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO2dCQUNyQiwyRkFBMkY7Z0JBQzNGLDZCQUE2QjtnQkFDN0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2pCO2lCQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDM0IsNERBQTREO2dCQUM1RCxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNoQyw2Q0FBNkM7Z0JBQzdDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsK0NBQStDO2dCQUMvQyxnRkFBZ0Y7Z0JBQ2hGLElBQUksZUFBYSxHQUFhLElBQUksQ0FBQztnQkFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtvQkFDdkMsK0NBQStDO29CQUMvQyxJQUFJLGVBQWEsS0FBSyxJQUFJLEVBQUU7d0JBQzFCLE9BQU87cUJBQ1I7b0JBQ0QsdURBQXVEO29CQUN2RCxJQUFNLFdBQVcsR0FBRyxLQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzdELElBQUksV0FBVyxLQUFLLElBQUksRUFBRTt3QkFDeEIsMkVBQTJFO3dCQUMzRSxlQUFhLHFCQUFJLE1BQU0sR0FBSyxXQUFXLENBQUMsQ0FBQztxQkFDMUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsT0FBTyxlQUFhLENBQUM7YUFDdEI7UUFDSCxDQUFDO1FBRU8sb0RBQTJCLEdBQW5DLFVBQW9DLEdBQVcsRUFBRSxJQUFPO1lBQXhELGlCQVVDO1lBVEMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDN0IsZ0ZBQWdGO2dCQUNoRixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHO29CQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDakIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDYixLQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3FCQUM1QztnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQztRQUNILHFCQUFDO0lBQUQsQ0FBQyxBQW5FRCxJQW1FQztJQW5FWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlY2xhcmF0aW9uTm9kZX0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBSZWZlcmVuY2VHcmFwaDxUID0gRGVjbGFyYXRpb25Ob2RlPiB7XG4gIHByaXZhdGUgcmVmZXJlbmNlcyA9IG5ldyBNYXA8VCwgU2V0PFQ+PigpO1xuXG4gIGFkZChmcm9tOiBULCB0bzogVCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5yZWZlcmVuY2VzLmhhcyhmcm9tKSkge1xuICAgICAgdGhpcy5yZWZlcmVuY2VzLnNldChmcm9tLCBuZXcgU2V0KCkpO1xuICAgIH1cbiAgICB0aGlzLnJlZmVyZW5jZXMuZ2V0KGZyb20pIS5hZGQodG8pO1xuICB9XG5cbiAgdHJhbnNpdGl2ZVJlZmVyZW5jZXNPZih0YXJnZXQ6IFQpOiBTZXQ8VD4ge1xuICAgIGNvbnN0IHNldCA9IG5ldyBTZXQ8VD4oKTtcbiAgICB0aGlzLmNvbGxlY3RUcmFuc2l0aXZlUmVmZXJlbmNlcyhzZXQsIHRhcmdldCk7XG4gICAgcmV0dXJuIHNldDtcbiAgfVxuXG4gIHBhdGhGcm9tKHNvdXJjZTogVCwgdGFyZ2V0OiBUKTogVFtdfG51bGwge1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3RQYXRoRnJvbShzb3VyY2UsIHRhcmdldCwgbmV3IFNldCgpKTtcbiAgfVxuXG4gIHByaXZhdGUgY29sbGVjdFBhdGhGcm9tKHNvdXJjZTogVCwgdGFyZ2V0OiBULCBzZWVuOiBTZXQ8VD4pOiBUW118bnVsbCB7XG4gICAgaWYgKHNvdXJjZSA9PT0gdGFyZ2V0KSB7XG4gICAgICAvLyBMb29raW5nIGZvciBhIHBhdGggZnJvbSB0aGUgdGFyZ2V0IHRvIGl0c2VsZiAtIHRoYXQgcGF0aCBpcyBqdXN0IHRoZSB0YXJnZXQuIFRoaXMgaXMgdGhlXG4gICAgICAvLyBcImJhc2UgY2FzZVwiIG9mIHRoZSBzZWFyY2guXG4gICAgICByZXR1cm4gW3RhcmdldF07XG4gICAgfSBlbHNlIGlmIChzZWVuLmhhcyhzb3VyY2UpKSB7XG4gICAgICAvLyBUaGUgc2VhcmNoIGhhcyBhbHJlYWR5IGxvb2tlZCB0aHJvdWdoIHRoaXMgc291cmNlIGJlZm9yZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvLyBDb25zaWRlciBvdXRnb2luZyBlZGdlcyBmcm9tIGBzb3VyY2VgLlxuICAgIHNlZW4uYWRkKHNvdXJjZSk7XG5cbiAgICBpZiAoIXRoaXMucmVmZXJlbmNlcy5oYXMoc291cmNlKSkge1xuICAgICAgLy8gVGhlcmUgYXJlIG5vIG91dGdvaW5nIGVkZ2VzIGZyb20gYHNvdXJjZWAuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTG9vayB0aHJvdWdoIHRoZSBvdXRnb2luZyBlZGdlcyBvZiBgc291cmNlYC5cbiAgICAgIC8vIFRPRE8oYWx4aHViKTogdXNlIHByb3BlciBpdGVyYXRpb24gd2hlbiB0aGUgbGVnYWN5IGJ1aWxkIGlzIHJlbW92ZWQuICgjMjc3NjIpXG4gICAgICBsZXQgY2FuZGlkYXRlUGF0aDogVFtdfG51bGwgPSBudWxsO1xuICAgICAgdGhpcy5yZWZlcmVuY2VzLmdldChzb3VyY2UpIS5mb3JFYWNoKGVkZ2UgPT4ge1xuICAgICAgICAvLyBFYXJseSBleGl0IGlmIGEgcGF0aCBoYXMgYWxyZWFkeSBiZWVuIGZvdW5kLlxuICAgICAgICBpZiAoY2FuZGlkYXRlUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBMb29rIGZvciBhIHBhdGggZnJvbSB0aGlzIG91dGdvaW5nIGVkZ2UgdG8gYHRhcmdldGAuXG4gICAgICAgIGNvbnN0IHBhcnRpYWxQYXRoID0gdGhpcy5jb2xsZWN0UGF0aEZyb20oZWRnZSwgdGFyZ2V0LCBzZWVuKTtcbiAgICAgICAgaWYgKHBhcnRpYWxQYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gQSBwYXRoIGV4aXN0cyBmcm9tIGBlZGdlYCB0byBgdGFyZ2V0YC4gSW5zZXJ0IGBzb3VyY2VgIGF0IHRoZSBiZWdpbm5pbmcuXG4gICAgICAgICAgY2FuZGlkYXRlUGF0aCA9IFtzb3VyY2UsIC4uLnBhcnRpYWxQYXRoXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjYW5kaWRhdGVQYXRoO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY29sbGVjdFRyYW5zaXRpdmVSZWZlcmVuY2VzKHNldDogU2V0PFQ+LCBkZWNsOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucmVmZXJlbmNlcy5oYXMoZGVjbCkpIHtcbiAgICAgIC8vIFRPRE8oYWx4aHViKTogdXNlIHByb3BlciBpdGVyYXRpb24gd2hlbiB0aGUgbGVnYWN5IGJ1aWxkIGlzIHJlbW92ZWQuICgjMjc3NjIpXG4gICAgICB0aGlzLnJlZmVyZW5jZXMuZ2V0KGRlY2wpIS5mb3JFYWNoKHJlZiA9PiB7XG4gICAgICAgIGlmICghc2V0LmhhcyhyZWYpKSB7XG4gICAgICAgICAgc2V0LmFkZChyZWYpO1xuICAgICAgICAgIHRoaXMuY29sbGVjdFRyYW5zaXRpdmVSZWZlcmVuY2VzKHNldCwgcmVmKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=
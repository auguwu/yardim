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
        define("@angular/compiler-cli/src/ngtsc/incremental/src/dependency_tracking", ["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDependencyGraph = void 0;
    var tslib_1 = require("tslib");
    /**
     * An implementation of the `DependencyTracker` dependency graph API.
     *
     * The `FileDependencyGraph`'s primary job is to determine whether a given file has "logically"
     * changed, given the set of physical changes (direct changes to files on disk).
     *
     * A file is logically changed if at least one of three conditions is met:
     *
     * 1. The file itself has physically changed.
     * 2. One of its dependencies has physically changed.
     * 3. One of its resource dependencies has physically changed.
     */
    var FileDependencyGraph = /** @class */ (function () {
        function FileDependencyGraph() {
            this.nodes = new Map();
        }
        FileDependencyGraph.prototype.addDependency = function (from, on) {
            this.nodeFor(from).dependsOn.add(on.fileName);
        };
        FileDependencyGraph.prototype.addResourceDependency = function (from, resource) {
            this.nodeFor(from).usesResources.add(resource);
        };
        FileDependencyGraph.prototype.addTransitiveDependency = function (from, on) {
            var e_1, _a;
            var nodeFrom = this.nodeFor(from);
            nodeFrom.dependsOn.add(on.fileName);
            var nodeOn = this.nodeFor(on);
            try {
                for (var _b = tslib_1.__values(nodeOn.dependsOn), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var dep = _c.value;
                    nodeFrom.dependsOn.add(dep);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        FileDependencyGraph.prototype.addTransitiveResources = function (from, resourcesOf) {
            var e_2, _a;
            var nodeFrom = this.nodeFor(from);
            var nodeOn = this.nodeFor(resourcesOf);
            try {
                for (var _b = tslib_1.__values(nodeOn.usesResources), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var dep = _c.value;
                    nodeFrom.usesResources.add(dep);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        FileDependencyGraph.prototype.recordDependencyAnalysisFailure = function (file) {
            this.nodeFor(file).failedAnalysis = true;
        };
        FileDependencyGraph.prototype.getResourceDependencies = function (from) {
            var node = this.nodes.get(from);
            return node ? tslib_1.__spread(node.usesResources) : [];
        };
        FileDependencyGraph.prototype.isStale = function (sf, changedTsPaths, changedResources) {
            return isLogicallyChanged(sf, this.nodeFor(sf), changedTsPaths, EMPTY_SET, changedResources);
        };
        /**
         * Update the current dependency graph from a previous one, incorporating a set of physical
         * changes.
         *
         * This method performs two tasks:
         *
         * 1. For files which have not logically changed, their dependencies from `previous` are added to
         *    `this` graph.
         * 2. For files which have logically changed, they're added to a set of logically changed files
         *    which is eventually returned.
         *
         * In essence, for build `n`, this method performs:
         *
         * G(n) + L(n) = G(n - 1) + P(n)
         *
         * where:
         *
         * G(n) = the dependency graph of build `n`
         * L(n) = the logically changed files from build n - 1 to build n.
         * P(n) = the physically changed files from build n - 1 to build n.
         */
        FileDependencyGraph.prototype.updateWithPhysicalChanges = function (previous, changedTsPaths, deletedTsPaths, changedResources) {
            var e_3, _a;
            var logicallyChanged = new Set();
            try {
                for (var _b = tslib_1.__values(previous.nodes.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var sf = _c.value;
                    var node = previous.nodeFor(sf);
                    if (isLogicallyChanged(sf, node, changedTsPaths, deletedTsPaths, changedResources)) {
                        logicallyChanged.add(sf.fileName);
                    }
                    else if (!deletedTsPaths.has(sf.fileName)) {
                        this.nodes.set(sf, {
                            dependsOn: new Set(node.dependsOn),
                            usesResources: new Set(node.usesResources),
                            failedAnalysis: false,
                        });
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return logicallyChanged;
        };
        FileDependencyGraph.prototype.nodeFor = function (sf) {
            if (!this.nodes.has(sf)) {
                this.nodes.set(sf, {
                    dependsOn: new Set(),
                    usesResources: new Set(),
                    failedAnalysis: false,
                });
            }
            return this.nodes.get(sf);
        };
        return FileDependencyGraph;
    }());
    exports.FileDependencyGraph = FileDependencyGraph;
    /**
     * Determine whether `sf` has logically changed, given its dependencies and the set of physically
     * changed files and resources.
     */
    function isLogicallyChanged(sf, node, changedTsPaths, deletedTsPaths, changedResources) {
        var e_4, _a, e_5, _b;
        // A file is assumed to have logically changed if its dependencies could not be determined
        // accurately.
        if (node.failedAnalysis) {
            return true;
        }
        // A file is logically changed if it has physically changed itself (including being deleted).
        if (changedTsPaths.has(sf.fileName) || deletedTsPaths.has(sf.fileName)) {
            return true;
        }
        try {
            // A file is logically changed if one of its dependencies has physically changed.
            for (var _c = tslib_1.__values(node.dependsOn), _d = _c.next(); !_d.done; _d = _c.next()) {
                var dep = _d.value;
                if (changedTsPaths.has(dep) || deletedTsPaths.has(dep)) {
                    return true;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_4) throw e_4.error; }
        }
        try {
            // A file is logically changed if one of its resources has physically changed.
            for (var _e = tslib_1.__values(node.usesResources), _f = _e.next(); !_f.done; _f = _e.next()) {
                var dep = _f.value;
                if (changedResources.has(dep)) {
                    return true;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return false;
    }
    var EMPTY_SET = new Set();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jeV90cmFja2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvaW5jcmVtZW50YWwvc3JjL2RlcGVuZGVuY3lfdHJhY2tpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQU9IOzs7Ozs7Ozs7OztPQVdHO0lBQ0g7UUFBQTtZQUVVLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1FBOEZ6QyxDQUFDO1FBNUZDLDJDQUFhLEdBQWIsVUFBYyxJQUFPLEVBQUUsRUFBSztZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxtREFBcUIsR0FBckIsVUFBc0IsSUFBTyxFQUFFLFFBQXdCO1lBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQscURBQXVCLEdBQXZCLFVBQXdCLElBQU8sRUFBRSxFQUFLOztZQUNwQyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVwQyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztnQkFDaEMsS0FBa0IsSUFBQSxLQUFBLGlCQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUEsZ0JBQUEsNEJBQUU7b0JBQS9CLElBQU0sR0FBRyxXQUFBO29CQUNaLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcs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ZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0Fic29sdXRlRnNQYXRofSBmcm9tICcuLi8uLi9maWxlX3N5c3RlbSc7XG5pbXBvcnQge0RlcGVuZGVuY3lUcmFja2VyfSBmcm9tICcuLi9hcGknO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgRGVwZW5kZW5jeVRyYWNrZXJgIGRlcGVuZGVuY3kgZ3JhcGggQVBJLlxuICpcbiAqIFRoZSBgRmlsZURlcGVuZGVuY3lHcmFwaGAncyBwcmltYXJ5IGpvYiBpcyB0byBkZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGZpbGUgaGFzIFwibG9naWNhbGx5XCJcbiAqIGNoYW5nZWQsIGdpdmVuIHRoZSBzZXQgb2YgcGh5c2ljYWwgY2hhbmdlcyAoZGlyZWN0IGNoYW5nZXMgdG8gZmlsZXMgb24gZGlzaykuXG4gKlxuICogQSBmaWxlIGlzIGxvZ2ljYWxseSBjaGFuZ2VkIGlmIGF0IGxlYXN0IG9uZSBvZiB0aHJlZSBjb25kaXRpb25zIGlzIG1ldDpcbiAqXG4gKiAxLiBUaGUgZmlsZSBpdHNlbGYgaGFzIHBoeXNpY2FsbHkgY2hhbmdlZC5cbiAqIDIuIE9uZSBvZiBpdHMgZGVwZW5kZW5jaWVzIGhhcyBwaHlzaWNhbGx5IGNoYW5nZWQuXG4gKiAzLiBPbmUgb2YgaXRzIHJlc291cmNlIGRlcGVuZGVuY2llcyBoYXMgcGh5c2ljYWxseSBjaGFuZ2VkLlxuICovXG5leHBvcnQgY2xhc3MgRmlsZURlcGVuZGVuY3lHcmFwaDxUIGV4dGVuZHMge2ZpbGVOYW1lOiBzdHJpbmd9ID0gdHMuU291cmNlRmlsZT4gaW1wbGVtZW50c1xuICAgIERlcGVuZGVuY3lUcmFja2VyPFQ+IHtcbiAgcHJpdmF0ZSBub2RlcyA9IG5ldyBNYXA8VCwgRmlsZU5vZGU+KCk7XG5cbiAgYWRkRGVwZW5kZW5jeShmcm9tOiBULCBvbjogVCk6IHZvaWQge1xuICAgIHRoaXMubm9kZUZvcihmcm9tKS5kZXBlbmRzT24uYWRkKG9uLmZpbGVOYW1lKTtcbiAgfVxuXG4gIGFkZFJlc291cmNlRGVwZW5kZW5jeShmcm9tOiBULCByZXNvdXJjZTogQWJzb2x1dGVGc1BhdGgpOiB2b2lkIHtcbiAgICB0aGlzLm5vZGVGb3IoZnJvbSkudXNlc1Jlc291cmNlcy5hZGQocmVzb3VyY2UpO1xuICB9XG5cbiAgYWRkVHJhbnNpdGl2ZURlcGVuZGVuY3koZnJvbTogVCwgb246IFQpOiB2b2lkIHtcbiAgICBjb25zdCBub2RlRnJvbSA9IHRoaXMubm9kZUZvcihmcm9tKTtcbiAgICBub2RlRnJvbS5kZXBlbmRzT24uYWRkKG9uLmZpbGVOYW1lKTtcblxuICAgIGNvbnN0IG5vZGVPbiA9IHRoaXMubm9kZUZvcihvbik7XG4gICAgZm9yIChjb25zdCBkZXAgb2Ygbm9kZU9uLmRlcGVuZHNPbikge1xuICAgICAgbm9kZUZyb20uZGVwZW5kc09uLmFkZChkZXApO1xuICAgIH1cbiAgfVxuXG4gIGFkZFRyYW5zaXRpdmVSZXNvdXJjZXMoZnJvbTogVCwgcmVzb3VyY2VzT2Y6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBub2RlRnJvbSA9IHRoaXMubm9kZUZvcihmcm9tKTtcbiAgICBjb25zdCBub2RlT24gPSB0aGlzLm5vZGVGb3IocmVzb3VyY2VzT2YpO1xuICAgIGZvciAoY29uc3QgZGVwIG9mIG5vZGVPbi51c2VzUmVzb3VyY2VzKSB7XG4gICAgICBub2RlRnJvbS51c2VzUmVzb3VyY2VzLmFkZChkZXApO1xuICAgIH1cbiAgfVxuXG4gIHJlY29yZERlcGVuZGVuY3lBbmFseXNpc0ZhaWx1cmUoZmlsZTogVCk6IHZvaWQge1xuICAgIHRoaXMubm9kZUZvcihmaWxlKS5mYWlsZWRBbmFseXNpcyA9IHRydWU7XG4gIH1cblxuICBnZXRSZXNvdXJjZURlcGVuZGVuY2llcyhmcm9tOiBUKTogQWJzb2x1dGVGc1BhdGhbXSB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZXMuZ2V0KGZyb20pO1xuXG4gICAgcmV0dXJuIG5vZGUgPyBbLi4ubm9kZS51c2VzUmVzb3VyY2VzXSA6IFtdO1xuICB9XG5cbiAgaXNTdGFsZShzZjogVCwgY2hhbmdlZFRzUGF0aHM6IFNldDxzdHJpbmc+LCBjaGFuZ2VkUmVzb3VyY2VzOiBTZXQ8QWJzb2x1dGVGc1BhdGg+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTG9naWNhbGx5Q2hhbmdlZChzZiwgdGhpcy5ub2RlRm9yKHNmKSwgY2hhbmdlZFRzUGF0aHMsIEVNUFRZX1NFVCwgY2hhbmdlZFJlc291cmNlcyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBjdXJyZW50IGRlcGVuZGVuY3kgZ3JhcGggZnJvbSBhIHByZXZpb3VzIG9uZSwgaW5jb3Jwb3JhdGluZyBhIHNldCBvZiBwaHlzaWNhbFxuICAgKiBjaGFuZ2VzLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyB0d28gdGFza3M6XG4gICAqXG4gICAqIDEuIEZvciBmaWxlcyB3aGljaCBoYXZlIG5vdCBsb2dpY2FsbHkgY2hhbmdlZCwgdGhlaXIgZGVwZW5kZW5jaWVzIGZyb20gYHByZXZpb3VzYCBhcmUgYWRkZWQgdG9cbiAgICogICAgYHRoaXNgIGdyYXBoLlxuICAgKiAyLiBGb3IgZmlsZXMgd2hpY2ggaGF2ZSBsb2dpY2FsbHkgY2hhbmdlZCwgdGhleSdyZSBhZGRlZCB0byBhIHNldCBvZiBsb2dpY2FsbHkgY2hhbmdlZCBmaWxlc1xuICAgKiAgICB3aGljaCBpcyBldmVudHVhbGx5IHJldHVybmVkLlxuICAgKlxuICAgKiBJbiBlc3NlbmNlLCBmb3IgYnVpbGQgYG5gLCB0aGlzIG1ldGhvZCBwZXJmb3JtczpcbiAgICpcbiAgICogRyhuKSArIEwobikgPSBHKG4gLSAxKSArIFAobilcbiAgICpcbiAgICogd2hlcmU6XG4gICAqXG4gICAqIEcobikgPSB0aGUgZGVwZW5kZW5jeSBncmFwaCBvZiBidWlsZCBgbmBcbiAgICogTChuKSA9IHRoZSBsb2dpY2FsbHkgY2hhbmdlZCBmaWxlcyBmcm9tIGJ1aWxkIG4gLSAxIHRvIGJ1aWxkIG4uXG4gICAqIFAobikgPSB0aGUgcGh5c2ljYWxseSBjaGFuZ2VkIGZpbGVzIGZyb20gYnVpbGQgbiAtIDEgdG8gYnVpbGQgbi5cbiAgICovXG4gIHVwZGF0ZVdpdGhQaHlzaWNhbENoYW5nZXMoXG4gICAgICBwcmV2aW91czogRmlsZURlcGVuZGVuY3lHcmFwaDxUPiwgY2hhbmdlZFRzUGF0aHM6IFNldDxzdHJpbmc+LCBkZWxldGVkVHNQYXRoczogU2V0PHN0cmluZz4sXG4gICAgICBjaGFuZ2VkUmVzb3VyY2VzOiBTZXQ8QWJzb2x1dGVGc1BhdGg+KTogU2V0PHN0cmluZz4ge1xuICAgIGNvbnN0IGxvZ2ljYWxseUNoYW5nZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3Qgc2Ygb2YgcHJldmlvdXMubm9kZXMua2V5cygpKSB7XG4gICAgICBjb25zdCBub2RlID0gcHJldmlvdXMubm9kZUZvcihzZik7XG4gICAgICBpZiAoaXNMb2dpY2FsbHlDaGFuZ2VkKHNmLCBub2RlLCBjaGFuZ2VkVHNQYXRocywgZGVsZXRlZFRzUGF0aHMsIGNoYW5nZWRSZXNvdXJjZXMpKSB7XG4gICAgICAgIGxvZ2ljYWxseUNoYW5nZWQuYWRkKHNmLmZpbGVOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoIWRlbGV0ZWRUc1BhdGhzLmhhcyhzZi5maWxlTmFtZSkpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5zZXQoc2YsIHtcbiAgICAgICAgICBkZXBlbmRzT246IG5ldyBTZXQobm9kZS5kZXBlbmRzT24pLFxuICAgICAgICAgIHVzZXNSZXNvdXJjZXM6IG5ldyBTZXQobm9kZS51c2VzUmVzb3VyY2VzKSxcbiAgICAgICAgICBmYWlsZWRBbmFseXNpczogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBsb2dpY2FsbHlDaGFuZ2VkO1xuICB9XG5cbiAgcHJpdmF0ZSBub2RlRm9yKHNmOiBUKTogRmlsZU5vZGUge1xuICAgIGlmICghdGhpcy5ub2Rlcy5oYXMoc2YpKSB7XG4gICAgICB0aGlzLm5vZGVzLnNldChzZiwge1xuICAgICAgICBkZXBlbmRzT246IG5ldyBTZXQ8c3RyaW5nPigpLFxuICAgICAgICB1c2VzUmVzb3VyY2VzOiBuZXcgU2V0PEFic29sdXRlRnNQYXRoPigpLFxuICAgICAgICBmYWlsZWRBbmFseXNpczogZmFsc2UsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXMuZ2V0KHNmKSE7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgd2hldGhlciBgc2ZgIGhhcyBsb2dpY2FsbHkgY2hhbmdlZCwgZ2l2ZW4gaXRzIGRlcGVuZGVuY2llcyBhbmQgdGhlIHNldCBvZiBwaHlzaWNhbGx5XG4gKiBjaGFuZ2VkIGZpbGVzIGFuZCByZXNvdXJjZXMuXG4gKi9cbmZ1bmN0aW9uIGlzTG9naWNhbGx5Q2hhbmdlZDxUIGV4dGVuZHMge2ZpbGVOYW1lOiBzdHJpbmd9PihcbiAgICBzZjogVCwgbm9kZTogRmlsZU5vZGUsIGNoYW5nZWRUc1BhdGhzOiBSZWFkb25seVNldDxzdHJpbmc+LCBkZWxldGVkVHNQYXRoczogUmVhZG9ubHlTZXQ8c3RyaW5nPixcbiAgICBjaGFuZ2VkUmVzb3VyY2VzOiBSZWFkb25seVNldDxBYnNvbHV0ZUZzUGF0aD4pOiBib29sZWFuIHtcbiAgLy8gQSBmaWxlIGlzIGFzc3VtZWQgdG8gaGF2ZSBsb2dpY2FsbHkgY2hhbmdlZCBpZiBpdHMgZGVwZW5kZW5jaWVzIGNvdWxkIG5vdCBiZSBkZXRlcm1pbmVkXG4gIC8vIGFjY3VyYXRlbHkuXG4gIGlmIChub2RlLmZhaWxlZEFuYWx5c2lzKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBBIGZpbGUgaXMgbG9naWNhbGx5IGNoYW5nZWQgaWYgaXQgaGFzIHBoeXNpY2FsbHkgY2hhbmdlZCBpdHNlbGYgKGluY2x1ZGluZyBiZWluZyBkZWxldGVkKS5cbiAgaWYgKGNoYW5nZWRUc1BhdGhzLmhhcyhzZi5maWxlTmFtZSkgfHwgZGVsZXRlZFRzUGF0aHMuaGFzKHNmLmZpbGVOYW1lKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gQSBmaWxlIGlzIGxvZ2ljYWxseSBjaGFuZ2VkIGlmIG9uZSBvZiBpdHMgZGVwZW5kZW5jaWVzIGhhcyBwaHlzaWNhbGx5IGNoYW5nZWQuXG4gIGZvciAoY29uc3QgZGVwIG9mIG5vZGUuZGVwZW5kc09uKSB7XG4gICAgaWYgKGNoYW5nZWRUc1BhdGhzLmhhcyhkZXApIHx8IGRlbGV0ZWRUc1BhdGhzLmhhcyhkZXApKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBBIGZpbGUgaXMgbG9naWNhbGx5IGNoYW5nZWQgaWYgb25lIG9mIGl0cyByZXNvdXJjZXMgaGFzIHBoeXNpY2FsbHkgY2hhbmdlZC5cbiAgZm9yIChjb25zdCBkZXAgb2Ygbm9kZS51c2VzUmVzb3VyY2VzKSB7XG4gICAgaWYgKGNoYW5nZWRSZXNvdXJjZXMuaGFzKGRlcCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmludGVyZmFjZSBGaWxlTm9kZSB7XG4gIGRlcGVuZHNPbjogU2V0PHN0cmluZz47XG4gIHVzZXNSZXNvdXJjZXM6IFNldDxBYnNvbHV0ZUZzUGF0aD47XG4gIGZhaWxlZEFuYWx5c2lzOiBib29sZWFuO1xufVxuXG5jb25zdCBFTVBUWV9TRVQ6IFJlYWRvbmx5U2V0PGFueT4gPSBuZXcgU2V0PGFueT4oKTtcbiJdfQ==
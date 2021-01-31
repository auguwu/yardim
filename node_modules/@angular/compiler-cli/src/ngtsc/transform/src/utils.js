(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/transform/src/utils", ["require", "exports", "tslib", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addImports = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    /**
     * Adds extra imports in the import manage for this source file, after the existing imports
     * and before the module body.
     * Can optionally add extra statements (e.g. new constants) before the body as well.
     */
    function addImports(importManager, sf, extraStatements) {
        if (extraStatements === void 0) { extraStatements = []; }
        // Generate the import statements to prepend.
        var addedImports = importManager.getAllImports(sf.fileName).map(function (i) {
            var qualifier = ts.createIdentifier(i.qualifier);
            var importClause = ts.createImportClause(
            /* name */ undefined, 
            /* namedBindings */ ts.createNamespaceImport(qualifier));
            return ts.createImportDeclaration(
            /* decorators */ undefined, 
            /* modifiers */ undefined, 
            /* importClause */ importClause, 
            /* moduleSpecifier */ ts.createLiteral(i.specifier));
        });
        // Filter out the existing imports and the source file body. All new statements
        // will be inserted between them.
        var existingImports = sf.statements.filter(function (stmt) { return isImportStatement(stmt); });
        var body = sf.statements.filter(function (stmt) { return !isImportStatement(stmt); });
        // Prepend imports if needed.
        if (addedImports.length > 0) {
            // If we prepend imports, we also prepend NotEmittedStatement to use it as an anchor
            // for @fileoverview Closure annotation. If there is no @fileoverview annotations, this
            // statement would be a noop.
            var fileoverviewAnchorStmt = ts.createNotEmittedStatement(sf);
            return ts.updateSourceFileNode(sf, ts.createNodeArray(tslib_1.__spread([
                fileoverviewAnchorStmt
            ], existingImports, addedImports, extraStatements, body)));
        }
        return sf;
    }
    exports.addImports = addImports;
    function isImportStatement(stmt) {
        return ts.isImportDeclaration(stmt) || ts.isImportEqualsDeclaration(stmt) ||
            ts.isNamespaceImport(stmt);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zZm9ybS9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILCtCQUFpQztJQUlqQzs7OztPQUlHO0lBQ0gsU0FBZ0IsVUFBVSxDQUN0QixhQUE0QixFQUFFLEVBQWlCLEVBQy9DLGVBQW9DO1FBQXBDLGdDQUFBLEVBQUEsb0JBQW9DO1FBQ3RDLDZDQUE2QztRQUM3QyxJQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDO1lBQ2pFLElBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLGtCQUFrQjtZQUN0QyxVQUFVLENBQUMsU0FBUztZQUNwQixtQkFBbUIsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM3RCxPQUFPLEVBQUUsQ0FBQyx1QkFBdUI7WUFDN0IsZ0JBQWdCLENBQUMsU0FBUztZQUMxQixlQUFlLENBQUMsU0FBUztZQUN6QixrQkFBa0IsQ0FBQyxZQUFZO1lBQy9CLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCwrRUFBK0U7UUFDL0UsaUNBQWlDO1FBQ2pDLElBQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsSUFBSSxJQUFJLE9BQUEsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQXZCLENBQXVCLENBQUMsQ0FBQztRQUM5RSxJQUFNLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQXhCLENBQXdCLENBQUMsQ0FBQztRQUNwRSw2QkFBNkI7UUFDN0IsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUMzQixvRkFBb0Y7WUFDcEYsdUZBQXVGO1lBQ3ZGLDZCQUE2QjtZQUM3QixJQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLGVBQWU7Z0JBQ25ELHNCQUFzQjtlQUFLLGVBQWUsRUFBSyxZQUFZLEVBQUssZUFBZSxFQUFLLElBQUksRUFDeEYsQ0FBQyxDQUFDO1NBQ0w7UUFFRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFoQ0QsZ0NBZ0NDO0lBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFrQjtRQUMzQyxPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDO1lBQ3JFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyfSBmcm9tICcuLi8uLi90cmFuc2xhdG9yJztcblxuLyoqXG4gKiBBZGRzIGV4dHJhIGltcG9ydHMgaW4gdGhlIGltcG9ydCBtYW5hZ2UgZm9yIHRoaXMgc291cmNlIGZpbGUsIGFmdGVyIHRoZSBleGlzdGluZyBpbXBvcnRzXG4gKiBhbmQgYmVmb3JlIHRoZSBtb2R1bGUgYm9keS5cbiAqIENhbiBvcHRpb25hbGx5IGFkZCBleHRyYSBzdGF0ZW1lbnRzIChlLmcuIG5ldyBjb25zdGFudHMpIGJlZm9yZSB0aGUgYm9keSBhcyB3ZWxsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSW1wb3J0cyhcbiAgICBpbXBvcnRNYW5hZ2VyOiBJbXBvcnRNYW5hZ2VyLCBzZjogdHMuU291cmNlRmlsZSxcbiAgICBleHRyYVN0YXRlbWVudHM6IHRzLlN0YXRlbWVudFtdID0gW10pOiB0cy5Tb3VyY2VGaWxlIHtcbiAgLy8gR2VuZXJhdGUgdGhlIGltcG9ydCBzdGF0ZW1lbnRzIHRvIHByZXBlbmQuXG4gIGNvbnN0IGFkZGVkSW1wb3J0cyA9IGltcG9ydE1hbmFnZXIuZ2V0QWxsSW1wb3J0cyhzZi5maWxlTmFtZSkubWFwKGkgPT4ge1xuICAgIGNvbnN0IHF1YWxpZmllciA9IHRzLmNyZWF0ZUlkZW50aWZpZXIoaS5xdWFsaWZpZXIpO1xuICAgIGNvbnN0IGltcG9ydENsYXVzZSA9IHRzLmNyZWF0ZUltcG9ydENsYXVzZShcbiAgICAgICAgLyogbmFtZSAqLyB1bmRlZmluZWQsXG4gICAgICAgIC8qIG5hbWVkQmluZGluZ3MgKi8gdHMuY3JlYXRlTmFtZXNwYWNlSW1wb3J0KHF1YWxpZmllcikpO1xuICAgIHJldHVybiB0cy5jcmVhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICAgICAgLyogZGVjb3JhdG9ycyAqLyB1bmRlZmluZWQsXG4gICAgICAgIC8qIG1vZGlmaWVycyAqLyB1bmRlZmluZWQsXG4gICAgICAgIC8qIGltcG9ydENsYXVzZSAqLyBpbXBvcnRDbGF1c2UsXG4gICAgICAgIC8qIG1vZHVsZVNwZWNpZmllciAqLyB0cy5jcmVhdGVMaXRlcmFsKGkuc3BlY2lmaWVyKSk7XG4gIH0pO1xuXG4gIC8vIEZpbHRlciBvdXQgdGhlIGV4aXN0aW5nIGltcG9ydHMgYW5kIHRoZSBzb3VyY2UgZmlsZSBib2R5LiBBbGwgbmV3IHN0YXRlbWVudHNcbiAgLy8gd2lsbCBiZSBpbnNlcnRlZCBiZXR3ZWVuIHRoZW0uXG4gIGNvbnN0IGV4aXN0aW5nSW1wb3J0cyA9IHNmLnN0YXRlbWVudHMuZmlsdGVyKHN0bXQgPT4gaXNJbXBvcnRTdGF0ZW1lbnQoc3RtdCkpO1xuICBjb25zdCBib2R5ID0gc2Yuc3RhdGVtZW50cy5maWx0ZXIoc3RtdCA9PiAhaXNJbXBvcnRTdGF0ZW1lbnQoc3RtdCkpO1xuICAvLyBQcmVwZW5kIGltcG9ydHMgaWYgbmVlZGVkLlxuICBpZiAoYWRkZWRJbXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICAvLyBJZiB3ZSBwcmVwZW5kIGltcG9ydHMsIHdlIGFsc28gcHJlcGVuZCBOb3RFbWl0dGVkU3RhdGVtZW50IHRvIHVzZSBpdCBhcyBhbiBhbmNob3JcbiAgICAvLyBmb3IgQGZpbGVvdmVydmlldyBDbG9zdXJlIGFubm90YXRpb24uIElmIHRoZXJlIGlzIG5vIEBmaWxlb3ZlcnZpZXcgYW5ub3RhdGlvbnMsIHRoaXNcbiAgICAvLyBzdGF0ZW1lbnQgd291bGQgYmUgYSBub29wLlxuICAgIGNvbnN0IGZpbGVvdmVydmlld0FuY2hvclN0bXQgPSB0cy5jcmVhdGVOb3RFbWl0dGVkU3RhdGVtZW50KHNmKTtcbiAgICByZXR1cm4gdHMudXBkYXRlU291cmNlRmlsZU5vZGUoc2YsIHRzLmNyZWF0ZU5vZGVBcnJheShbXG4gICAgICBmaWxlb3ZlcnZpZXdBbmNob3JTdG10LCAuLi5leGlzdGluZ0ltcG9ydHMsIC4uLmFkZGVkSW1wb3J0cywgLi4uZXh0cmFTdGF0ZW1lbnRzLCAuLi5ib2R5XG4gICAgXSkpO1xuICB9XG5cbiAgcmV0dXJuIHNmO1xufVxuXG5mdW5jdGlvbiBpc0ltcG9ydFN0YXRlbWVudChzdG10OiB0cy5TdGF0ZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIHRzLmlzSW1wb3J0RGVjbGFyYXRpb24oc3RtdCkgfHwgdHMuaXNJbXBvcnRFcXVhbHNEZWNsYXJhdGlvbihzdG10KSB8fFxuICAgICAgdHMuaXNOYW1lc3BhY2VJbXBvcnQoc3RtdCk7XG59XG4iXX0=
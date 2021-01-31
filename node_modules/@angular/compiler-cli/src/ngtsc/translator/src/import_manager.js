(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/translator/src/import_manager", ["require", "exports", "typescript", "@angular/compiler-cli/src/ngtsc/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImportManager = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    var imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    var ImportManager = /** @class */ (function () {
        function ImportManager(rewriter, prefix) {
            if (rewriter === void 0) { rewriter = new imports_1.NoopImportRewriter(); }
            if (prefix === void 0) { prefix = 'i'; }
            this.rewriter = rewriter;
            this.prefix = prefix;
            this.specifierToIdentifier = new Map();
            this.nextIndex = 0;
        }
        ImportManager.prototype.generateNamespaceImport = function (moduleName) {
            if (!this.specifierToIdentifier.has(moduleName)) {
                this.specifierToIdentifier.set(moduleName, ts.createIdentifier("" + this.prefix + this.nextIndex++));
            }
            return this.specifierToIdentifier.get(moduleName);
        };
        ImportManager.prototype.generateNamedImport = function (moduleName, originalSymbol) {
            // First, rewrite the symbol name.
            var symbol = this.rewriter.rewriteSymbol(originalSymbol, moduleName);
            // Ask the rewriter if this symbol should be imported at all. If not, it can be referenced
            // directly (moduleImport: null).
            if (!this.rewriter.shouldImportSymbol(symbol, moduleName)) {
                // The symbol should be referenced directly.
                return { moduleImport: null, symbol: symbol };
            }
            // If not, this symbol will be imported using a generated namespace import.
            var moduleImport = this.generateNamespaceImport(moduleName);
            return { moduleImport: moduleImport, symbol: symbol };
        };
        ImportManager.prototype.getAllImports = function (contextPath) {
            var _this = this;
            var imports = [];
            this.specifierToIdentifier.forEach(function (qualifier, specifier) {
                specifier = _this.rewriter.rewriteSpecifier(specifier, contextPath);
                imports.push({ specifier: specifier, qualifier: qualifier.text });
            });
            return imports;
        };
        return ImportManager;
    }());
    exports.ImportManager = ImportManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0X21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zbGF0b3Ivc3JjL2ltcG9ydF9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILCtCQUFpQztJQUNqQyxtRUFBaUU7SUFHakU7UUFJRSx1QkFBc0IsUUFBbUQsRUFBVSxNQUFZO1lBQXpFLHlCQUFBLEVBQUEsZUFBK0IsNEJBQWtCLEVBQUU7WUFBVSx1QkFBQSxFQUFBLFlBQVk7WUFBekUsYUFBUSxHQUFSLFFBQVEsQ0FBMkM7WUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFNO1lBSHZGLDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1lBQ3pELGNBQVMsR0FBRyxDQUFDLENBQUM7UUFHdEIsQ0FBQztRQUVELCtDQUF1QixHQUF2QixVQUF3QixVQUFrQjtZQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FDMUIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBSSxDQUFDLENBQUMsQ0FBQzthQUMzRTtZQUNELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUUsQ0FBQztRQUNyRCxDQUFDO1FBRUQsMkNBQW1CLEdBQW5CLFVBQW9CLFVBQWtCLEVBQUUsY0FBc0I7WUFDNUQsa0NBQWtDO1lBQ2xDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV2RSwwRkFBMEY7WUFDMUYsaUNBQWlDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBRTtnQkFDekQsNENBQTRDO2dCQUM1QyxPQUFPLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxNQUFNLFFBQUEsRUFBQyxDQUFDO2FBQ3JDO1lBRUQsMkVBQTJFO1lBQzNFLElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU5RCxPQUFPLEVBQUMsWUFBWSxjQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQscUNBQWEsR0FBYixVQUFjLFdBQW1CO1lBQWpDLGlCQU9DO1lBTkMsSUFBTSxPQUFPLEdBQTZDLEVBQUUsQ0FBQztZQUM3RCxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQUMsU0FBUyxFQUFFLFNBQVM7Z0JBQ3RELFNBQVMsR0FBRyxLQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFDLFNBQVMsV0FBQSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7UUFDSCxvQkFBQztJQUFELENBQUMsQUF4Q0QsSUF3Q0M7SUF4Q1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtJbXBvcnRSZXdyaXRlciwgTm9vcEltcG9ydFJld3JpdGVyfSBmcm9tICcuLi8uLi9pbXBvcnRzJztcbmltcG9ydCB7SW1wb3J0LCBJbXBvcnRHZW5lcmF0b3IsIE5hbWVkSW1wb3J0fSBmcm9tICcuL2FwaS9pbXBvcnRfZ2VuZXJhdG9yJztcblxuZXhwb3J0IGNsYXNzIEltcG9ydE1hbmFnZXIgaW1wbGVtZW50cyBJbXBvcnRHZW5lcmF0b3I8dHMuSWRlbnRpZmllcj4ge1xuICBwcml2YXRlIHNwZWNpZmllclRvSWRlbnRpZmllciA9IG5ldyBNYXA8c3RyaW5nLCB0cy5JZGVudGlmaWVyPigpO1xuICBwcml2YXRlIG5leHRJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIHJld3JpdGVyOiBJbXBvcnRSZXdyaXRlciA9IG5ldyBOb29wSW1wb3J0UmV3cml0ZXIoKSwgcHJpdmF0ZSBwcmVmaXggPSAnaScpIHtcbiAgfVxuXG4gIGdlbmVyYXRlTmFtZXNwYWNlSW1wb3J0KG1vZHVsZU5hbWU6IHN0cmluZyk6IHRzLklkZW50aWZpZXIge1xuICAgIGlmICghdGhpcy5zcGVjaWZpZXJUb0lkZW50aWZpZXIuaGFzKG1vZHVsZU5hbWUpKSB7XG4gICAgICB0aGlzLnNwZWNpZmllclRvSWRlbnRpZmllci5zZXQoXG4gICAgICAgICAgbW9kdWxlTmFtZSwgdHMuY3JlYXRlSWRlbnRpZmllcihgJHt0aGlzLnByZWZpeH0ke3RoaXMubmV4dEluZGV4Kyt9YCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zcGVjaWZpZXJUb0lkZW50aWZpZXIuZ2V0KG1vZHVsZU5hbWUpITtcbiAgfVxuXG4gIGdlbmVyYXRlTmFtZWRJbXBvcnQobW9kdWxlTmFtZTogc3RyaW5nLCBvcmlnaW5hbFN5bWJvbDogc3RyaW5nKTogTmFtZWRJbXBvcnQ8dHMuSWRlbnRpZmllcj4ge1xuICAgIC8vIEZpcnN0LCByZXdyaXRlIHRoZSBzeW1ib2wgbmFtZS5cbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnJld3JpdGVyLnJld3JpdGVTeW1ib2wob3JpZ2luYWxTeW1ib2wsIG1vZHVsZU5hbWUpO1xuXG4gICAgLy8gQXNrIHRoZSByZXdyaXRlciBpZiB0aGlzIHN5bWJvbCBzaG91bGQgYmUgaW1wb3J0ZWQgYXQgYWxsLiBJZiBub3QsIGl0IGNhbiBiZSByZWZlcmVuY2VkXG4gICAgLy8gZGlyZWN0bHkgKG1vZHVsZUltcG9ydDogbnVsbCkuXG4gICAgaWYgKCF0aGlzLnJld3JpdGVyLnNob3VsZEltcG9ydFN5bWJvbChzeW1ib2wsIG1vZHVsZU5hbWUpKSB7XG4gICAgICAvLyBUaGUgc3ltYm9sIHNob3VsZCBiZSByZWZlcmVuY2VkIGRpcmVjdGx5LlxuICAgICAgcmV0dXJuIHttb2R1bGVJbXBvcnQ6IG51bGwsIHN5bWJvbH07XG4gICAgfVxuXG4gICAgLy8gSWYgbm90LCB0aGlzIHN5bWJvbCB3aWxsIGJlIGltcG9ydGVkIHVzaW5nIGEgZ2VuZXJhdGVkIG5hbWVzcGFjZSBpbXBvcnQuXG4gICAgY29uc3QgbW9kdWxlSW1wb3J0ID0gdGhpcy5nZW5lcmF0ZU5hbWVzcGFjZUltcG9ydChtb2R1bGVOYW1lKTtcblxuICAgIHJldHVybiB7bW9kdWxlSW1wb3J0LCBzeW1ib2x9O1xuICB9XG5cbiAgZ2V0QWxsSW1wb3J0cyhjb250ZXh0UGF0aDogc3RyaW5nKTogSW1wb3J0W10ge1xuICAgIGNvbnN0IGltcG9ydHM6IHtzcGVjaWZpZXI6IHN0cmluZywgcXVhbGlmaWVyOiBzdHJpbmd9W10gPSBbXTtcbiAgICB0aGlzLnNwZWNpZmllclRvSWRlbnRpZmllci5mb3JFYWNoKChxdWFsaWZpZXIsIHNwZWNpZmllcikgPT4ge1xuICAgICAgc3BlY2lmaWVyID0gdGhpcy5yZXdyaXRlci5yZXdyaXRlU3BlY2lmaWVyKHNwZWNpZmllciwgY29udGV4dFBhdGgpO1xuICAgICAgaW1wb3J0cy5wdXNoKHtzcGVjaWZpZXIsIHF1YWxpZmllcjogcXVhbGlmaWVyLnRleHR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gaW1wb3J0cztcbiAgfVxufVxuIl19
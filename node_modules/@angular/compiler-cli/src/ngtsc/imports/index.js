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
        define("@angular/compiler-cli/src/ngtsc/imports", ["require", "exports", "@angular/compiler-cli/src/ngtsc/imports/src/alias", "@angular/compiler-cli/src/ngtsc/imports/src/core", "@angular/compiler-cli/src/ngtsc/imports/src/default", "@angular/compiler-cli/src/ngtsc/imports/src/emitter", "@angular/compiler-cli/src/ngtsc/imports/src/references", "@angular/compiler-cli/src/ngtsc/imports/src/resolver"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModuleResolver = exports.Reference = exports.UnifiedModulesStrategy = exports.RelativePathStrategy = exports.ReferenceEmitter = exports.LogicalProjectStrategy = exports.LocalIdentifierStrategy = exports.ImportFlags = exports.AbsoluteModuleStrategy = exports.NOOP_DEFAULT_IMPORT_RECORDER = exports.DefaultImportTracker = exports.validateAndRewriteCoreSymbol = exports.R3SymbolsImportRewriter = exports.NoopImportRewriter = exports.UnifiedModulesAliasingHost = exports.PrivateExportAliasingHost = exports.AliasStrategy = void 0;
    var alias_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/alias");
    Object.defineProperty(exports, "AliasStrategy", { enumerable: true, get: function () { return alias_1.AliasStrategy; } });
    Object.defineProperty(exports, "PrivateExportAliasingHost", { enumerable: true, get: function () { return alias_1.PrivateExportAliasingHost; } });
    Object.defineProperty(exports, "UnifiedModulesAliasingHost", { enumerable: true, get: function () { return alias_1.UnifiedModulesAliasingHost; } });
    var core_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/core");
    Object.defineProperty(exports, "NoopImportRewriter", { enumerable: true, get: function () { return core_1.NoopImportRewriter; } });
    Object.defineProperty(exports, "R3SymbolsImportRewriter", { enumerable: true, get: function () { return core_1.R3SymbolsImportRewriter; } });
    Object.defineProperty(exports, "validateAndRewriteCoreSymbol", { enumerable: true, get: function () { return core_1.validateAndRewriteCoreSymbol; } });
    var default_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/default");
    Object.defineProperty(exports, "DefaultImportTracker", { enumerable: true, get: function () { return default_1.DefaultImportTracker; } });
    Object.defineProperty(exports, "NOOP_DEFAULT_IMPORT_RECORDER", { enumerable: true, get: function () { return default_1.NOOP_DEFAULT_IMPORT_RECORDER; } });
    var emitter_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/emitter");
    Object.defineProperty(exports, "AbsoluteModuleStrategy", { enumerable: true, get: function () { return emitter_1.AbsoluteModuleStrategy; } });
    Object.defineProperty(exports, "ImportFlags", { enumerable: true, get: function () { return emitter_1.ImportFlags; } });
    Object.defineProperty(exports, "LocalIdentifierStrategy", { enumerable: true, get: function () { return emitter_1.LocalIdentifierStrategy; } });
    Object.defineProperty(exports, "LogicalProjectStrategy", { enumerable: true, get: function () { return emitter_1.LogicalProjectStrategy; } });
    Object.defineProperty(exports, "ReferenceEmitter", { enumerable: true, get: function () { return emitter_1.ReferenceEmitter; } });
    Object.defineProperty(exports, "RelativePathStrategy", { enumerable: true, get: function () { return emitter_1.RelativePathStrategy; } });
    Object.defineProperty(exports, "UnifiedModulesStrategy", { enumerable: true, get: function () { return emitter_1.UnifiedModulesStrategy; } });
    var references_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/references");
    Object.defineProperty(exports, "Reference", { enumerable: true, get: function () { return references_1.Reference; } });
    var resolver_1 = require("@angular/compiler-cli/src/ngtsc/imports/src/resolver");
    Object.defineProperty(exports, "ModuleResolver", { enumerable: true, get: function () { return resolver_1.ModuleResolver; } });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2ltcG9ydHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsMkVBQStHO0lBQXpGLHNHQUFBLGFBQWEsT0FBQTtJQUFFLGtIQUFBLHlCQUF5QixPQUFBO0lBQUUsbUhBQUEsMEJBQTBCLE9BQUE7SUFDMUYseUVBQXFIO0lBQTdGLDBHQUFBLGtCQUFrQixPQUFBO0lBQUUsK0dBQUEsdUJBQXVCLE9BQUE7SUFBRSxvSEFBQSw0QkFBNEIsT0FBQTtJQUNqRywrRUFBd0c7SUFBekUsK0dBQUEsb0JBQW9CLE9BQUE7SUFBRSx1SEFBQSw0QkFBNEIsT0FBQTtJQUNqRiwrRUFBME07SUFBbE0saUhBQUEsc0JBQXNCLE9BQUE7SUFBRSxzR0FBQSxXQUFXLE9BQUE7SUFBRSxrSEFBQSx1QkFBdUIsT0FBQTtJQUFFLGlIQUFBLHNCQUFzQixPQUFBO0lBQXlCLDJHQUFBLGdCQUFnQixPQUFBO0lBQUUsK0dBQUEsb0JBQW9CLE9BQUE7SUFBRSxpSEFBQSxzQkFBc0IsT0FBQTtJQUVuTCxxRkFBeUQ7SUFBbkMsdUdBQUEsU0FBUyxPQUFBO0lBQy9CLGlGQUE4QztJQUF0QywwR0FBQSxjQUFjLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IHtBbGlhc2luZ0hvc3QsIEFsaWFzU3RyYXRlZ3ksIFByaXZhdGVFeHBvcnRBbGlhc2luZ0hvc3QsIFVuaWZpZWRNb2R1bGVzQWxpYXNpbmdIb3N0fSBmcm9tICcuL3NyYy9hbGlhcyc7XG5leHBvcnQge0ltcG9ydFJld3JpdGVyLCBOb29wSW1wb3J0UmV3cml0ZXIsIFIzU3ltYm9sc0ltcG9ydFJld3JpdGVyLCB2YWxpZGF0ZUFuZFJld3JpdGVDb3JlU3ltYm9sfSBmcm9tICcuL3NyYy9jb3JlJztcbmV4cG9ydCB7RGVmYXVsdEltcG9ydFJlY29yZGVyLCBEZWZhdWx0SW1wb3J0VHJhY2tlciwgTk9PUF9ERUZBVUxUX0lNUE9SVF9SRUNPUkRFUn0gZnJvbSAnLi9zcmMvZGVmYXVsdCc7XG5leHBvcnQge0Fic29sdXRlTW9kdWxlU3RyYXRlZ3ksIEltcG9ydEZsYWdzLCBMb2NhbElkZW50aWZpZXJTdHJhdGVneSwgTG9naWNhbFByb2plY3RTdHJhdGVneSwgUmVmZXJlbmNlRW1pdFN0cmF0ZWd5LCBSZWZlcmVuY2VFbWl0dGVyLCBSZWxhdGl2ZVBhdGhTdHJhdGVneSwgVW5pZmllZE1vZHVsZXNTdHJhdGVneX0gZnJvbSAnLi9zcmMvZW1pdHRlcic7XG5leHBvcnQge1JlZXhwb3J0fSBmcm9tICcuL3NyYy9yZWV4cG9ydCc7XG5leHBvcnQge093bmluZ01vZHVsZSwgUmVmZXJlbmNlfSBmcm9tICcuL3NyYy9yZWZlcmVuY2VzJztcbmV4cG9ydCB7TW9kdWxlUmVzb2x2ZXJ9IGZyb20gJy4vc3JjL3Jlc29sdmVyJztcbiJdfQ==
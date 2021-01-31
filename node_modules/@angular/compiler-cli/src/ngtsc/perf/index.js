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
        define("@angular/compiler-cli/src/ngtsc/perf", ["require", "exports", "@angular/compiler-cli/src/ngtsc/perf/src/noop", "@angular/compiler-cli/src/ngtsc/perf/src/tracking"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PerfTracker = exports.NOOP_PERF_RECORDER = void 0;
    var noop_1 = require("@angular/compiler-cli/src/ngtsc/perf/src/noop");
    Object.defineProperty(exports, "NOOP_PERF_RECORDER", { enumerable: true, get: function () { return noop_1.NOOP_PERF_RECORDER; } });
    var tracking_1 = require("@angular/compiler-cli/src/ngtsc/perf/src/tracking");
    Object.defineProperty(exports, "PerfTracker", { enumerable: true, get: function () { return tracking_1.PerfTracker; } });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3BlcmYvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBR0gsc0VBQThDO0lBQXRDLDBHQUFBLGtCQUFrQixPQUFBO0lBQzFCLDhFQUEyQztJQUFuQyx1R0FBQSxXQUFXLE9BQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IHtQZXJmUmVjb3JkZXJ9IGZyb20gJy4vc3JjL2FwaSc7XG5leHBvcnQge05PT1BfUEVSRl9SRUNPUkRFUn0gZnJvbSAnLi9zcmMvbm9vcCc7XG5leHBvcnQge1BlcmZUcmFja2VyfSBmcm9tICcuL3NyYy90cmFja2luZyc7XG4iXX0=
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
        define("@angular/compiler-cli/src/ngtsc/incremental/src/strategy", ["require", "exports", "@angular/compiler-cli/src/ngtsc/incremental/src/state"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PatchedProgramIncrementalBuildStrategy = exports.TrackedIncrementalBuildStrategy = exports.NoopIncrementalBuildStrategy = void 0;
    var state_1 = require("@angular/compiler-cli/src/ngtsc/incremental/src/state");
    /**
     * A noop implementation of `IncrementalBuildStrategy` which neither returns nor tracks any
     * incremental data.
     */
    var NoopIncrementalBuildStrategy = /** @class */ (function () {
        function NoopIncrementalBuildStrategy() {
        }
        NoopIncrementalBuildStrategy.prototype.getIncrementalDriver = function () {
            return null;
        };
        NoopIncrementalBuildStrategy.prototype.setIncrementalDriver = function () { };
        NoopIncrementalBuildStrategy.prototype.toNextBuildStrategy = function () {
            return this;
        };
        return NoopIncrementalBuildStrategy;
    }());
    exports.NoopIncrementalBuildStrategy = NoopIncrementalBuildStrategy;
    /**
     * Tracks an `IncrementalDriver` within the strategy itself.
     */
    var TrackedIncrementalBuildStrategy = /** @class */ (function () {
        function TrackedIncrementalBuildStrategy() {
            this.driver = null;
            this.isSet = false;
        }
        TrackedIncrementalBuildStrategy.prototype.getIncrementalDriver = function () {
            return this.driver;
        };
        TrackedIncrementalBuildStrategy.prototype.setIncrementalDriver = function (driver) {
            this.driver = driver;
            this.isSet = true;
        };
        TrackedIncrementalBuildStrategy.prototype.toNextBuildStrategy = function () {
            var strategy = new TrackedIncrementalBuildStrategy();
            // Only reuse a driver that was explicitly set via `setIncrementalDriver`.
            strategy.driver = this.isSet ? this.driver : null;
            return strategy;
        };
        return TrackedIncrementalBuildStrategy;
    }());
    exports.TrackedIncrementalBuildStrategy = TrackedIncrementalBuildStrategy;
    /**
     * Manages the `IncrementalDriver` associated with a `ts.Program` by monkey-patching it onto the
     * program under `SYM_INCREMENTAL_DRIVER`.
     */
    var PatchedProgramIncrementalBuildStrategy = /** @class */ (function () {
        function PatchedProgramIncrementalBuildStrategy() {
        }
        PatchedProgramIncrementalBuildStrategy.prototype.getIncrementalDriver = function (program) {
            var driver = program[SYM_INCREMENTAL_DRIVER];
            if (driver === undefined || !(driver instanceof state_1.IncrementalDriver)) {
                return null;
            }
            return driver;
        };
        PatchedProgramIncrementalBuildStrategy.prototype.setIncrementalDriver = function (driver, program) {
            program[SYM_INCREMENTAL_DRIVER] = driver;
        };
        PatchedProgramIncrementalBuildStrategy.prototype.toNextBuildStrategy = function () {
            return this;
        };
        return PatchedProgramIncrementalBuildStrategy;
    }());
    exports.PatchedProgramIncrementalBuildStrategy = PatchedProgramIncrementalBuildStrategy;
    /**
     * Symbol under which the `IncrementalDriver` is stored on a `ts.Program`.
     *
     * The TS model of incremental compilation is based around reuse of a previous `ts.Program` in the
     * construction of a new one. The `NgCompiler` follows this abstraction - passing in a previous
     * `ts.Program` is sufficient to trigger incremental compilation. This previous `ts.Program` need
     * not be from an Angular compilation (that is, it need not have been created from `NgCompiler`).
     *
     * If it is, though, Angular can benefit from reusing previous analysis work. This reuse is managed
     * by the `IncrementalDriver`, which is inherited from the old program to the new program. To
     * support this behind the API of passing an old `ts.Program`, the `IncrementalDriver` is stored on
     * the `ts.Program` under this symbol.
     */
    var SYM_INCREMENTAL_DRIVER = Symbol('NgIncrementalDriver');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2luY3JlbWVudGFsL3NyYy9zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCwrRUFBMEM7SUF5QjFDOzs7T0FHRztJQUNIO1FBQUE7UUFVQSxDQUFDO1FBVEMsMkRBQW9CLEdBQXBCO1lBQ0UsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsMkRBQW9CLEdBQXBCLGNBQThCLENBQUM7UUFFL0IsMERBQW1CLEdBQW5CO1lBQ0UsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0gsbUNBQUM7SUFBRCxDQUFDLEFBVkQsSUFVQztJQVZZLG9FQUE0QjtJQVl6Qzs7T0FFRztJQUNIO1FBQUE7WUFDVSxXQUFNLEdBQTJCLElBQUksQ0FBQztZQUN0QyxVQUFLLEdBQVksS0FBSyxDQUFDO1FBaUJqQyxDQUFDO1FBZkMsOERBQW9CLEdBQXBCO1lBQ0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3JCLENBQUM7UUFFRCw4REFBb0IsR0FBcEIsVUFBcUIsTUFBeUI7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDcEIsQ0FBQztRQUVELDZEQUFtQixHQUFuQjtZQUNFLElBQU0sUUFBUSxHQUFHLElBQUksK0JBQStCLEVBQUUsQ0FBQztZQUN2RCwwRUFBMEU7WUFDMUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEQsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztRQUNILHNDQUFDO0lBQUQsQ0FBQyxBQW5CRCxJQW1CQztJQW5CWSwwRUFBK0I7SUFxQjVDOzs7T0FHRztJQUNIO1FBQUE7UUFnQkEsQ0FBQztRQWZDLHFFQUFvQixHQUFwQixVQUFxQixPQUFtQjtZQUN0QyxJQUFNLE1BQU0sR0FBSSxPQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN4RCxJQUFJLE1BQU0sS0FBSyxTQUFTLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSx5QkFBaUIsQ0FBQyxFQUFFO2dCQUNsRSxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUVELHFFQUFvQixHQUFwQixVQUFxQixNQUF5QixFQUFFLE9BQW1CO1lBQ2hFLE9BQWUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUNwRCxDQUFDO1FBRUQsb0VBQW1CLEdBQW5CO1lBQ0UsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQ0gsNkNBQUM7SUFBRCxDQUFDLEFBaEJELElBZ0JDO0lBaEJZLHdGQUFzQztJQW1CbkQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsSUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7SW5jcmVtZW50YWxEcml2ZXJ9IGZyb20gJy4vc3RhdGUnO1xuXG4vKipcbiAqIFN0cmF0ZWd5IHVzZWQgdG8gbWFuYWdlIHRoZSBhc3NvY2lhdGlvbiBiZXR3ZWVuIGEgYHRzLlByb2dyYW1gIGFuZCB0aGUgYEluY3JlbWVudGFsRHJpdmVyYCB3aGljaFxuICogcmVwcmVzZW50cyB0aGUgcmV1c2FibGUgQW5ndWxhciBwYXJ0IG9mIGl0cyBjb21waWxhdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbmNyZW1lbnRhbEJ1aWxkU3RyYXRlZ3kge1xuICAvKipcbiAgICogRGV0ZXJtaW5lIHRoZSBBbmd1bGFyIGBJbmNyZW1lbnRhbERyaXZlcmAgZm9yIHRoZSBnaXZlbiBgdHMuUHJvZ3JhbWAsIGlmIG9uZSBpcyBhdmFpbGFibGUuXG4gICAqL1xuICBnZXRJbmNyZW1lbnRhbERyaXZlcihwcm9ncmFtOiB0cy5Qcm9ncmFtKTogSW5jcmVtZW50YWxEcml2ZXJ8bnVsbDtcblxuICAvKipcbiAgICogQXNzb2NpYXRlIHRoZSBnaXZlbiBgSW5jcmVtZW50YWxEcml2ZXJgIHdpdGggdGhlIGdpdmVuIGB0cy5Qcm9ncmFtYCBhbmQgbWFrZSBpdCBhdmFpbGFibGUgdG9cbiAgICogZnV0dXJlIGNvbXBpbGF0aW9ucy5cbiAgICovXG4gIHNldEluY3JlbWVudGFsRHJpdmVyKGRyaXZlcjogSW5jcmVtZW50YWxEcml2ZXIsIHByb2dyYW06IHRzLlByb2dyYW0pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoaXMgYEluY3JlbWVudGFsQnVpbGRTdHJhdGVneWAgaW50byBhIHBvc3NpYmx5IG5ldyBpbnN0YW5jZSB0byBiZSB1c2VkIGluIHRoZSBuZXh0XG4gICAqIGluY3JlbWVudGFsIGNvbXBpbGF0aW9uIChtYXkgYmUgYSBuby1vcCBpZiB0aGUgc3RyYXRlZ3kgaXMgbm90IHN0YXRlZnVsKS5cbiAgICovXG4gIHRvTmV4dEJ1aWxkU3RyYXRlZ3koKTogSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5O1xufVxuXG4vKipcbiAqIEEgbm9vcCBpbXBsZW1lbnRhdGlvbiBvZiBgSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5YCB3aGljaCBuZWl0aGVyIHJldHVybnMgbm9yIHRyYWNrcyBhbnlcbiAqIGluY3JlbWVudGFsIGRhdGEuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb29wSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IGltcGxlbWVudHMgSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IHtcbiAgZ2V0SW5jcmVtZW50YWxEcml2ZXIoKTogbnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBzZXRJbmNyZW1lbnRhbERyaXZlcigpOiB2b2lkIHt9XG5cbiAgdG9OZXh0QnVpbGRTdHJhdGVneSgpOiBJbmNyZW1lbnRhbEJ1aWxkU3RyYXRlZ3kge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKlxuICogVHJhY2tzIGFuIGBJbmNyZW1lbnRhbERyaXZlcmAgd2l0aGluIHRoZSBzdHJhdGVneSBpdHNlbGYuXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFja2VkSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IGltcGxlbWVudHMgSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBkcml2ZXI6IEluY3JlbWVudGFsRHJpdmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGlzU2V0OiBib29sZWFuID0gZmFsc2U7XG5cbiAgZ2V0SW5jcmVtZW50YWxEcml2ZXIoKTogSW5jcmVtZW50YWxEcml2ZXJ8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuZHJpdmVyO1xuICB9XG5cbiAgc2V0SW5jcmVtZW50YWxEcml2ZXIoZHJpdmVyOiBJbmNyZW1lbnRhbERyaXZlcik6IHZvaWQge1xuICAgIHRoaXMuZHJpdmVyID0gZHJpdmVyO1xuICAgIHRoaXMuaXNTZXQgPSB0cnVlO1xuICB9XG5cbiAgdG9OZXh0QnVpbGRTdHJhdGVneSgpOiBUcmFja2VkSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IHtcbiAgICBjb25zdCBzdHJhdGVneSA9IG5ldyBUcmFja2VkSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5KCk7XG4gICAgLy8gT25seSByZXVzZSBhIGRyaXZlciB0aGF0IHdhcyBleHBsaWNpdGx5IHNldCB2aWEgYHNldEluY3JlbWVudGFsRHJpdmVyYC5cbiAgICBzdHJhdGVneS5kcml2ZXIgPSB0aGlzLmlzU2V0ID8gdGhpcy5kcml2ZXIgOiBudWxsO1xuICAgIHJldHVybiBzdHJhdGVneTtcbiAgfVxufVxuXG4vKipcbiAqIE1hbmFnZXMgdGhlIGBJbmNyZW1lbnRhbERyaXZlcmAgYXNzb2NpYXRlZCB3aXRoIGEgYHRzLlByb2dyYW1gIGJ5IG1vbmtleS1wYXRjaGluZyBpdCBvbnRvIHRoZVxuICogcHJvZ3JhbSB1bmRlciBgU1lNX0lOQ1JFTUVOVEFMX0RSSVZFUmAuXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXRjaGVkUHJvZ3JhbUluY3JlbWVudGFsQnVpbGRTdHJhdGVneSBpbXBsZW1lbnRzIEluY3JlbWVudGFsQnVpbGRTdHJhdGVneSB7XG4gIGdldEluY3JlbWVudGFsRHJpdmVyKHByb2dyYW06IHRzLlByb2dyYW0pOiBJbmNyZW1lbnRhbERyaXZlcnxudWxsIHtcbiAgICBjb25zdCBkcml2ZXIgPSAocHJvZ3JhbSBhcyBhbnkpW1NZTV9JTkNSRU1FTlRBTF9EUklWRVJdO1xuICAgIGlmIChkcml2ZXIgPT09IHVuZGVmaW5lZCB8fCAhKGRyaXZlciBpbnN0YW5jZW9mIEluY3JlbWVudGFsRHJpdmVyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBkcml2ZXI7XG4gIH1cblxuICBzZXRJbmNyZW1lbnRhbERyaXZlcihkcml2ZXI6IEluY3JlbWVudGFsRHJpdmVyLCBwcm9ncmFtOiB0cy5Qcm9ncmFtKTogdm9pZCB7XG4gICAgKHByb2dyYW0gYXMgYW55KVtTWU1fSU5DUkVNRU5UQUxfRFJJVkVSXSA9IGRyaXZlcjtcbiAgfVxuXG4gIHRvTmV4dEJ1aWxkU3RyYXRlZ3koKTogSW5jcmVtZW50YWxCdWlsZFN0cmF0ZWd5IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5cbi8qKlxuICogU3ltYm9sIHVuZGVyIHdoaWNoIHRoZSBgSW5jcmVtZW50YWxEcml2ZXJgIGlzIHN0b3JlZCBvbiBhIGB0cy5Qcm9ncmFtYC5cbiAqXG4gKiBUaGUgVFMgbW9kZWwgb2YgaW5jcmVtZW50YWwgY29tcGlsYXRpb24gaXMgYmFzZWQgYXJvdW5kIHJldXNlIG9mIGEgcHJldmlvdXMgYHRzLlByb2dyYW1gIGluIHRoZVxuICogY29uc3RydWN0aW9uIG9mIGEgbmV3IG9uZS4gVGhlIGBOZ0NvbXBpbGVyYCBmb2xsb3dzIHRoaXMgYWJzdHJhY3Rpb24gLSBwYXNzaW5nIGluIGEgcHJldmlvdXNcbiAqIGB0cy5Qcm9ncmFtYCBpcyBzdWZmaWNpZW50IHRvIHRyaWdnZXIgaW5jcmVtZW50YWwgY29tcGlsYXRpb24uIFRoaXMgcHJldmlvdXMgYHRzLlByb2dyYW1gIG5lZWRcbiAqIG5vdCBiZSBmcm9tIGFuIEFuZ3VsYXIgY29tcGlsYXRpb24gKHRoYXQgaXMsIGl0IG5lZWQgbm90IGhhdmUgYmVlbiBjcmVhdGVkIGZyb20gYE5nQ29tcGlsZXJgKS5cbiAqXG4gKiBJZiBpdCBpcywgdGhvdWdoLCBBbmd1bGFyIGNhbiBiZW5lZml0IGZyb20gcmV1c2luZyBwcmV2aW91cyBhbmFseXNpcyB3b3JrLiBUaGlzIHJldXNlIGlzIG1hbmFnZWRcbiAqIGJ5IHRoZSBgSW5jcmVtZW50YWxEcml2ZXJgLCB3aGljaCBpcyBpbmhlcml0ZWQgZnJvbSB0aGUgb2xkIHByb2dyYW0gdG8gdGhlIG5ldyBwcm9ncmFtLiBUb1xuICogc3VwcG9ydCB0aGlzIGJlaGluZCB0aGUgQVBJIG9mIHBhc3NpbmcgYW4gb2xkIGB0cy5Qcm9ncmFtYCwgdGhlIGBJbmNyZW1lbnRhbERyaXZlcmAgaXMgc3RvcmVkIG9uXG4gKiB0aGUgYHRzLlByb2dyYW1gIHVuZGVyIHRoaXMgc3ltYm9sLlxuICovXG5jb25zdCBTWU1fSU5DUkVNRU5UQUxfRFJJVkVSID0gU3ltYm9sKCdOZ0luY3JlbWVudGFsRHJpdmVyJyk7XG4iXX0=
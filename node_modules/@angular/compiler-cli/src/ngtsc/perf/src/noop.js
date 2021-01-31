(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/perf/src/noop", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOOP_PERF_RECORDER = void 0;
    exports.NOOP_PERF_RECORDER = {
        enabled: false,
        mark: function (name, node, category, detail) { },
        start: function (name, node, category, detail) {
            return 0;
        },
        stop: function (span) { },
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9vcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGVyZi9zcmMvbm9vcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFXYSxRQUFBLGtCQUFrQixHQUFpQjtRQUM5QyxPQUFPLEVBQUUsS0FBSztRQUNkLElBQUksRUFBRSxVQUFDLElBQVksRUFBRSxJQUFxQixFQUFFLFFBQWlCLEVBQUUsTUFBZSxJQUFZLENBQUM7UUFDM0YsS0FBSyxFQUFFLFVBQUMsSUFBWSxFQUFFLElBQXFCLEVBQUUsUUFBaUIsRUFBRSxNQUFlO1lBQzdFLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUNELElBQUksRUFBRSxVQUFDLElBQWtCLElBQVksQ0FBQztLQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0RlY2xhcmF0aW9uTm9kZX0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5cbmltcG9ydCB7UGVyZlJlY29yZGVyfSBmcm9tICcuL2FwaSc7XG5cbmV4cG9ydCBjb25zdCBOT09QX1BFUkZfUkVDT1JERVI6IFBlcmZSZWNvcmRlciA9IHtcbiAgZW5hYmxlZDogZmFsc2UsXG4gIG1hcms6IChuYW1lOiBzdHJpbmcsIG5vZGU6IERlY2xhcmF0aW9uTm9kZSwgY2F0ZWdvcnk/OiBzdHJpbmcsIGRldGFpbD86IHN0cmluZyk6IHZvaWQgPT4ge30sXG4gIHN0YXJ0OiAobmFtZTogc3RyaW5nLCBub2RlOiBEZWNsYXJhdGlvbk5vZGUsIGNhdGVnb3J5Pzogc3RyaW5nLCBkZXRhaWw/OiBzdHJpbmcpOiBudW1iZXIgPT4ge1xuICAgIHJldHVybiAwO1xuICB9LFxuICBzdG9wOiAoc3BhbjogbnVtYmVyfGZhbHNlKTogdm9pZCA9PiB7fSxcbn07XG4iXX0=
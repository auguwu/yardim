"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var WebpackStatsIterator = /** @class */ (function () {
    function WebpackStatsIterator() {
    }
    WebpackStatsIterator.prototype.collectModules = function (stats, chunkName) {
        var chunkModules = [];
        try {
            for (var _a = __values(stats.chunks), _b = _a.next(); !_b.done; _b = _a.next()) {
                var chunk = _b.value;
                if (chunk.names[0] === chunkName) {
                    this.traverseModules(chunk.modules, chunkModules);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return chunkModules;
        var e_1, _c;
    };
    WebpackStatsIterator.prototype.traverseModules = function (modules, chunkModules) {
        if (!modules) {
            return;
        }
        try {
            for (var modules_1 = __values(modules), modules_1_1 = modules_1.next(); !modules_1_1.done; modules_1_1 = modules_1.next()) {
                var webpackModule = modules_1_1.value;
                chunkModules.push({ resource: webpackModule.identifier });
                this.traverseModules(webpackModule.modules, chunkModules);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (modules_1_1 && !modules_1_1.done && (_a = modules_1.return)) _a.call(modules_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _a;
    };
    return WebpackStatsIterator;
}());
exports.WebpackStatsIterator = WebpackStatsIterator;

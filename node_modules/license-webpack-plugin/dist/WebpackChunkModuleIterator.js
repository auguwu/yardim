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
var WebpackStatsIterator_1 = require("./WebpackStatsIterator");
var WebpackChunkModuleIterator = /** @class */ (function () {
    function WebpackChunkModuleIterator() {
        this.statsIterator = new WebpackStatsIterator_1.WebpackStatsIterator();
    }
    WebpackChunkModuleIterator.prototype.iterateModules = function (compilation, chunk, stats, callback) {
        if (typeof compilation.chunkGraph !== 'undefined' &&
            typeof stats !== 'undefined') {
            try {
                // webpack v5
                for (var _a = __values(compilation.chunkGraph.getChunkModulesIterable(chunk)), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var module_1 = _b.value;
                    callback(module_1);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var statsModules = this.statsIterator.collectModules(stats, chunk.name);
            try {
                for (var statsModules_1 = __values(statsModules), statsModules_1_1 = statsModules_1.next(); !statsModules_1_1.done; statsModules_1_1 = statsModules_1.next()) {
                    var module_2 = statsModules_1_1.value;
                    callback(module_2);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (statsModules_1_1 && !statsModules_1_1.done && (_d = statsModules_1.return)) _d.call(statsModules_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        else if (typeof chunk.modulesIterable !== 'undefined') {
            try {
                for (var _e = __values(chunk.modulesIterable), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var module_3 = _f.value;
                    callback(module_3);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_g = _e.return)) _g.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        else if (typeof chunk.forEachModule === 'function') {
            chunk.forEachModule(callback);
        }
        else if (Array.isArray(chunk.modules)) {
            chunk.modules.forEach(callback);
        }
        if (typeof compilation.chunkGraph !== 'undefined') {
            try {
                for (var _h = __values(compilation.chunkGraph.getChunkEntryModulesIterable(chunk)), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var module_4 = _j.value;
                    callback(module_4);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_k = _h.return)) _k.call(_h);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        else if (chunk.entryModule) {
            callback(chunk.entryModule);
        }
        var e_1, _c, e_2, _d, e_3, _g, e_4, _k;
    };
    return WebpackChunkModuleIterator;
}());
exports.WebpackChunkModuleIterator = WebpackChunkModuleIterator;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebpackModuleFileIterator = /** @class */ (function () {
    function WebpackModuleFileIterator() {
    }
    WebpackModuleFileIterator.prototype.iterateFiles = function (chunkModule, callback) {
        var internalCallback = this.internalCallback.bind(this, callback);
        internalCallback(chunkModule.resource ||
            (chunkModule.rootModule && chunkModule.rootModule.resource));
        if (Array.isArray(chunkModule.fileDependencies)) {
            var fileDependencies = chunkModule.fileDependencies;
            fileDependencies.forEach(internalCallback);
        }
        if (Array.isArray(chunkModule.dependencies)) {
            chunkModule.dependencies.forEach(function (module) {
                return internalCallback(module.originModule && module.originModule.resource);
            });
        }
    };
    WebpackModuleFileIterator.prototype.internalCallback = function (callback, filename) {
        if (!filename || filename.indexOf('external ') === 0) {
            return;
        }
        if (filename.indexOf('webpack/runtime') === 0) {
            callback(require.resolve('webpack'));
        }
        else {
            callback(filename);
        }
    };
    return WebpackModuleFileIterator;
}());
exports.WebpackModuleFileIterator = WebpackModuleFileIterator;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addError = exports.addWarning = void 0;
const webpack_version_1 = require("./webpack-version");
const WebpackError = require('webpack/lib/WebpackError');
function addWarning(compilation, message) {
    if (webpack_version_1.isWebpackFiveOrHigher()) {
        compilation.warnings.push(new WebpackError(message));
    }
    else {
        // Allows building with either Webpack 4 or 5+ types
        // tslint:disable-next-line: no-any
        compilation.warnings.push(message);
    }
}
exports.addWarning = addWarning;
function addError(compilation, message) {
    if (webpack_version_1.isWebpackFiveOrHigher()) {
        compilation.errors.push(new WebpackError(message));
    }
    else {
        // Allows building with either Webpack 4 or 5+ types
        // tslint:disable-next-line: no-any
        compilation.errors.push(new Error(message));
    }
}
exports.addError = addError;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWebpackFourOrFive = exports.isWebpackFiveOrHigher = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const webpack = require("webpack");
let cachedIsWebpackFiveOrHigher;
function isWebpackFiveOrHigher() {
    if (cachedIsWebpackFiveOrHigher === undefined) {
        cachedIsWebpackFiveOrHigher = false;
        if (typeof webpack.version === 'string') {
            const versionParts = webpack.version.split('.');
            if (versionParts[0] && Number(versionParts[0]) >= 5) {
                cachedIsWebpackFiveOrHigher = true;
            }
        }
    }
    return cachedIsWebpackFiveOrHigher;
}
exports.isWebpackFiveOrHigher = isWebpackFiveOrHigher;
// tslint:disable-next-line: no-any
function withWebpackFourOrFive(webpackFourValue, webpackFiveValue) {
    return isWebpackFiveOrHigher() ? webpackFiveValue : webpackFourValue;
}
exports.withWebpackFourOrFive = withWebpackFourOrFive;

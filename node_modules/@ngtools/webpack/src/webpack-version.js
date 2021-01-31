"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeResolverMainFields = exports.isWebpackFiveOrHigher = void 0;
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
function mergeResolverMainFields(options, originalMainFields, extraMainFields) {
    var _a;
    const cleverMerge = (_a = webpack.util) === null || _a === void 0 ? void 0 : _a.cleverMerge;
    if (cleverMerge) {
        // Webpack 5
        // https://github.com/webpack/webpack/issues/11635#issuecomment-707016779
        return cleverMerge(options, { mainFields: [...extraMainFields, '...'] });
    }
    else {
        // Webpack 4
        return {
            ...options,
            mainFields: [...extraMainFields, ...originalMainFields],
        };
    }
}
exports.mergeResolverMainFields = mergeResolverMainFields;

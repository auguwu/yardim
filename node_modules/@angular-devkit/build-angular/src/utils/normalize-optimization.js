"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptimization = void 0;
function normalizeOptimization(optimization = false) {
    if (typeof optimization === 'object') {
        return {
            scripts: !!optimization.scripts,
            styles: typeof optimization.styles === 'object' ? optimization.styles : {
                minify: !!optimization.styles,
                // inlineCritical is always false unless explictly set.
                inlineCritical: false,
            },
            fonts: typeof optimization.fonts === 'object' ? optimization.fonts : {
                inline: !!optimization.fonts,
            },
        };
    }
    return {
        scripts: optimization,
        styles: {
            minify: optimization,
            // inlineCritical is always false unless explictly set.
            inlineCritical: false,
        },
        fonts: {
            inline: optimization,
        },
    };
}
exports.normalizeOptimization = normalizeOptimization;

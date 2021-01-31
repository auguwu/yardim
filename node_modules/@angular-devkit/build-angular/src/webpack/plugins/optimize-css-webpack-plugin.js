"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizeCssWebpackPlugin = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const cssNano = require("cssnano");
const webpack_sources_1 = require("webpack-sources");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const webpack_version_1 = require("../../utils/webpack-version");
const PLUGIN_NAME = 'optimize-css-webpack-plugin';
function hook(compiler, action) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        if (webpack_version_1.isWebpackFiveOrHigher()) {
            // webpack 5 migration "guide"
            // https://github.com/webpack/webpack/blob/07fc554bef5930f8577f91c91a8b81791fc29746/lib/Compilation.js#L527-L532
            // TODO_WEBPACK_5 const stage = Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE;
            const stage = 100;
            // tslint:disable-next-line: no-any
            compilation.hooks
                .processAssets.tapPromise({ name: PLUGIN_NAME, stage }, (assets) => {
                return action(compilation, Object.keys(assets));
            });
        }
        else {
            compilation.hooks.optimizeChunkAssets
                .tapPromise(PLUGIN_NAME, (chunks) => {
                const files = [];
                for (const chunk of chunks) {
                    if (!chunk.files) {
                        continue;
                    }
                    for (const file of chunk.files) {
                        files.push(file);
                    }
                }
                return action(compilation, files);
            });
        }
    });
}
class OptimizeCssWebpackPlugin {
    constructor(options) {
        this._options = {
            sourceMap: false,
            test: file => file.endsWith('.css'),
            ...options,
        };
    }
    apply(compiler) {
        hook(compiler, (compilation, assetsURI) => {
            const files = [...compilation.additionalChunkAssets, ...assetsURI];
            const actions = files
                .filter(file => this._options.test(file))
                .map(async (file) => {
                const asset = compilation.assets[file];
                if (!asset) {
                    return;
                }
                let content;
                // tslint:disable-next-line: no-any
                let map;
                if (this._options.sourceMap && asset.sourceAndMap) {
                    const sourceAndMap = asset.sourceAndMap({});
                    content = sourceAndMap.source;
                    map = sourceAndMap.map;
                }
                else {
                    content = asset.source();
                }
                if (typeof content !== 'string') {
                    content = content.toString();
                }
                if (content.length === 0) {
                    return;
                }
                const cssNanoOptions = {
                    preset: ['default', {
                            // Disable SVG optimizations, as this can cause optimizations which are not compatible in all browsers.
                            svgo: false,
                            // Disable `calc` optimizations, due to several issues. #16910, #16875, #17890
                            calc: false,
                        }],
                };
                const postCssOptions = {
                    from: file,
                    map: map && { annotation: false, prev: map },
                };
                const output = await new Promise((resolve, reject) => {
                    // the last parameter is not in the typings
                    // tslint:disable-next-line: no-any
                    cssNano.process(content, postCssOptions, cssNanoOptions)
                        .then(resolve)
                        .catch((err) => reject(new Error(`${file} ${err.message}`)));
                });
                for (const { text } of output.warnings()) {
                    webpack_diagnostics_1.addWarning(compilation, text);
                }
                let newSource;
                if (output.map) {
                    newSource = new webpack_sources_1.SourceMapSource(output.css, file, 
                    // tslint:disable-next-line: no-any
                    output.map.toString(), content, map);
                }
                else {
                    newSource = new webpack_sources_1.RawSource(output.css);
                }
                compilation.assets[file] = newSource;
            });
            return Promise.all(actions).then(() => { });
        });
    }
}
exports.OptimizeCssWebpackPlugin = OptimizeCssWebpackPlugin;

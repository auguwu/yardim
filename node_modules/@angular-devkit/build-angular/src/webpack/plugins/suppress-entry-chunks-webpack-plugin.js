"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppressExtractedTextChunksWebpackPlugin = void 0;
/**
 * Remove .js files from entry points consisting entirely of stylesheets.
 * To be used together with mini-css-extract-plugin.
 */
class SuppressExtractedTextChunksWebpackPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('SuppressExtractedTextChunks', (compilation) => {
            compilation.hooks.chunkAsset.tap('SuppressExtractedTextChunks', (chunk, filename) => {
                var _a;
                // Remove only JavaScript assets
                if (!filename.endsWith('.js')) {
                    return;
                }
                // Only chunks with a css asset should have JavaScript assets removed
                let hasCssFile = false;
                // chunk.files is an Array in Webpack 4 and a Set in Webpack 5
                for (const file of chunk.files) {
                    if (file.endsWith('.css')) {
                        hasCssFile = true;
                        break;
                    }
                }
                if (!hasCssFile) {
                    return;
                }
                // Only chunks with all CSS entry dependencies should have JavaScript assets removed
                let cssOnly = false;
                // The any cast is used for default Webpack 4 type compatibility
                // tslint:disable-next-line: no-any
                const entryModules = (_a = compilation.chunkGraph) === null || _a === void 0 ? void 0 : _a.getChunkEntryModulesIterable(chunk);
                if (entryModules) {
                    // Webpack 5
                    for (const module of entryModules) {
                        cssOnly = module.dependencies.every((dependency) => dependency.constructor.name === 'CssDependency');
                        if (!cssOnly) {
                            break;
                        }
                    }
                }
                else {
                    // Webpack 4
                    for (const module of chunk.modulesIterable) {
                        cssOnly = module.dependencies.every((dependency) => {
                            const name = dependency.constructor.name;
                            return (name === 'CssDependency' ||
                                name === 'SingleEntryDependency' ||
                                name === 'MultiEntryDependency' ||
                                name === 'HarmonyCompatibilityDependency' ||
                                name === 'HarmonyExportHeaderDependency' ||
                                name === 'HarmonyInitDependency');
                        });
                        if (!cssOnly) {
                            break;
                        }
                    }
                }
                if (cssOnly) {
                    if (Array.isArray(chunk.files)) {
                        // Webpack 4
                        chunk.files = chunk.files.filter((file) => file !== filename);
                        delete compilation.assets[filename];
                    }
                    else {
                        // Webpack 5
                        // Casting is used for default Webpack 4 type compatibility
                        chunk.files.delete(filename);
                        compilation.deleteAsset(filename);
                    }
                }
            });
        });
    }
}
exports.SuppressExtractedTextChunksWebpackPlugin = SuppressExtractedTextChunksWebpackPlugin;

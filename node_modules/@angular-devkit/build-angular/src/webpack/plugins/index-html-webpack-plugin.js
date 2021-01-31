"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexHtmlWebpackPlugin = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const path_1 = require("path");
const webpack_sources_1 = require("webpack-sources");
const index_html_generator_1 = require("../../utils/index-file/index-html-generator");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const webpack_version_1 = require("../../utils/webpack-version");
const PLUGIN_NAME = 'index-html-webpack-plugin';
class IndexHtmlWebpackPlugin extends index_html_generator_1.IndexHtmlGenerator {
    constructor(options) {
        super(options);
        this.options = options;
    }
    get compilation() {
        if (this._compilation) {
            return this._compilation;
        }
        throw new Error('compilation is undefined.');
    }
    apply(compiler) {
        if (webpack_version_1.isWebpackFiveOrHigher()) {
            compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
                this._compilation = compilation;
                // webpack 5 migration "guide"
                // https://github.com/webpack/webpack/blob/07fc554bef5930f8577f91c91a8b81791fc29746/lib/Compilation.js#L535-L539
                // TODO_WEBPACK_5 const stage = Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1;
                // tslint:disable-next-line: no-any
                compilation.hooks.processAssets.tapPromise({ name: PLUGIN_NAME, stage: 101 }, callback);
            });
        }
        else {
            compiler.hooks.emit.tapPromise(PLUGIN_NAME, async (compilation) => {
                this._compilation = compilation;
                await callback(compilation.assets);
            });
        }
        const callback = async (assets) => {
            var _a;
            // Get all files for selected entrypoints
            const files = [];
            const noModuleFiles = [];
            const moduleFiles = [];
            for (const [entryName, entrypoint] of this.compilation.entrypoints) {
                const entryFiles = (_a = entrypoint === null || entrypoint === void 0 ? void 0 : entrypoint.getFiles()) === null || _a === void 0 ? void 0 : _a.map((f) => ({
                    name: entryName,
                    file: f,
                    extension: path_1.extname(f),
                }));
                if (!entryFiles) {
                    continue;
                }
                if (this.options.noModuleEntrypoints.includes(entryName)) {
                    noModuleFiles.push(...entryFiles);
                }
                else if (this.options.moduleEntrypoints.includes(entryName)) {
                    moduleFiles.push(...entryFiles);
                }
                else {
                    files.push(...entryFiles);
                }
            }
            const { content, warnings, errors } = await this.process({
                files,
                noModuleFiles,
                moduleFiles,
                outputPath: path_1.dirname(this.options.outputPath),
                baseHref: this.options.baseHref,
                lang: this.options.lang,
            });
            assets[this.options.outputPath] = new webpack_sources_1.RawSource(content);
            warnings.forEach(msg => webpack_diagnostics_1.addWarning(this.compilation, msg));
            errors.forEach(msg => webpack_diagnostics_1.addError(this.compilation, msg));
        };
    }
    async readAsset(path) {
        const data = this.compilation.assets[path_1.basename(path)].source();
        return typeof data === 'string' ? data : data.toString();
    }
    async readIndex(path) {
        return new Promise((resolve, reject) => {
            this.compilation.inputFileSystem.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.compilation.fileDependencies.add(path);
                resolve(data.toString());
            });
        });
    }
}
exports.IndexHtmlWebpackPlugin = IndexHtmlWebpackPlugin;

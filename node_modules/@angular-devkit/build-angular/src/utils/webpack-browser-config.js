"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexInputFile = exports.getIndexOutputFile = exports.generateBrowserWebpackConfigFromContext = exports.generateI18nBrowserWebpackConfigFromContext = exports.generateWebpackConfig = void 0;
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const path = require("path");
const webpack_merge_1 = require("webpack-merge");
const utils_1 = require("../utils");
const read_tsconfig_1 = require("../utils/read-tsconfig");
const builder_watch_plugin_1 = require("../webpack/plugins/builder-watch-plugin");
const helpers_1 = require("../webpack/utils/helpers");
const environment_options_1 = require("./environment-options");
const i18n_options_1 = require("./i18n-options");
async function generateWebpackConfig(workspaceRoot, projectRoot, sourceRoot, options, webpackPartialGenerator, logger, extraBuildOptions) {
    // Ensure Build Optimizer is only used with AOT.
    if (options.buildOptimizer && !options.aot) {
        throw new Error(`The 'buildOptimizer' option cannot be used without 'aot'.`);
    }
    // Ensure Rollup Concatenation is only used with compatible options.
    if (options.experimentalRollupPass) {
        if (!options.aot) {
            throw new Error(`The 'experimentalRollupPass' option cannot be used without 'aot'.`);
        }
        if (options.vendorChunk || options.commonChunk || options.namedChunks) {
            throw new Error(`The 'experimentalRollupPass' option cannot be used with the`
                + `'vendorChunk', 'commonChunk', 'namedChunks' options set to true.`);
        }
    }
    const tsConfigPath = path.resolve(workspaceRoot, options.tsConfig);
    const tsConfig = read_tsconfig_1.readTsconfig(tsConfigPath);
    // tslint:disable-next-line:no-implicit-dependencies
    const ts = await Promise.resolve().then(() => require('typescript'));
    const scriptTarget = tsConfig.options.target || ts.ScriptTarget.ES5;
    const supportES2015 = scriptTarget !== ts.ScriptTarget.JSON && scriptTarget > ts.ScriptTarget.ES5;
    const buildOptions = { ...options, ...extraBuildOptions };
    const wco = {
        root: workspaceRoot,
        logger: logger.createChild('webpackConfigOptions'),
        projectRoot,
        sourceRoot,
        buildOptions,
        tsConfig,
        tsConfigPath,
        scriptTarget,
    };
    wco.buildOptions.progress = utils_1.defaultProgress(wco.buildOptions.progress);
    const webpackConfig = webpack_merge_1.merge(webpackPartialGenerator(wco));
    if (supportES2015) {
        if (!webpackConfig.resolve) {
            webpackConfig.resolve = {};
        }
        if (Array.isArray(webpackConfig.resolve.alias)) {
            webpackConfig.resolve.alias.push({
                alias: 'zone.js/dist/zone',
                name: 'zone.js/dist/zone-evergreen',
            });
        }
        else {
            if (!webpackConfig.resolve.alias) {
                webpackConfig.resolve.alias = {};
            }
            webpackConfig.resolve.alias['zone.js/dist/zone'] = 'zone.js/dist/zone-evergreen';
        }
    }
    if (environment_options_1.profilingEnabled) {
        const esVersionInFileName = helpers_1.getEsVersionForFileName(tsConfig.options.target, buildOptions.differentialLoadingNeeded);
        const SpeedMeasurePlugin = await Promise.resolve().then(() => require('speed-measure-webpack-plugin'));
        const smp = new SpeedMeasurePlugin({
            outputFormat: 'json',
            outputTarget: path.resolve(workspaceRoot, `speed-measure-plugin${esVersionInFileName}.json`),
        });
        return smp.wrap(webpackConfig);
    }
    return webpackConfig;
}
exports.generateWebpackConfig = generateWebpackConfig;
async function generateI18nBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, host = new node_1.NodeJsSyncHost(), extraBuildOptions = {}) {
    const { buildOptions, i18n } = await i18n_options_1.configureI18nBuild(context, options);
    const result = await generateBrowserWebpackConfigFromContext(buildOptions, context, webpackPartialGenerator, host, extraBuildOptions);
    const config = result.config;
    if (i18n.shouldInline) {
        // Remove localize "polyfill" if in AOT mode
        if (buildOptions.aot) {
            if (!config.resolve) {
                config.resolve = {};
            }
            if (Array.isArray(config.resolve.alias)) {
                config.resolve.alias.push({
                    alias: '@angular/localize/init',
                    name: require.resolve('./empty.js'),
                });
            }
            else {
                if (!config.resolve.alias) {
                    config.resolve.alias = {};
                }
                config.resolve.alias['@angular/localize/init'] = require.resolve('./empty.js');
            }
        }
        // Update file hashes to include translation file content
        const i18nHash = Object.values(i18n.locales).reduce((data, locale) => data + locale.files.map((file) => file.integrity || '').join('|'), '');
        if (!config.plugins) {
            config.plugins = [];
        }
        config.plugins.push({
            apply(compiler) {
                compiler.hooks.compilation.tap('build-angular', compilation => {
                    // Webpack typings do not contain template hashForChunk hook
                    // tslint:disable-next-line: no-any
                    compilation.mainTemplate.hooks.hashForChunk.tap('build-angular', (hash) => {
                        hash.update('$localize' + i18nHash);
                    });
                    // Webpack typings do not contain hooks property
                    // tslint:disable-next-line: no-any
                    compilation.chunkTemplate.hooks.hashForChunk.tap('build-angular', (hash) => {
                        hash.update('$localize' + i18nHash);
                    });
                });
            },
        });
    }
    return { ...result, i18n };
}
exports.generateI18nBrowserWebpackConfigFromContext = generateI18nBrowserWebpackConfigFromContext;
async function generateBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, host = new node_1.NodeJsSyncHost(), extraBuildOptions = {}) {
    const projectName = context.target && context.target.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const workspaceRoot = core_1.normalize(context.workspaceRoot);
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = core_1.resolve(workspaceRoot, core_1.normalize(projectMetadata.root || ''));
    const projectSourceRoot = projectMetadata.sourceRoot;
    const sourceRoot = projectSourceRoot
        ? core_1.resolve(workspaceRoot, core_1.normalize(projectSourceRoot))
        : undefined;
    const normalizedOptions = utils_1.normalizeBrowserSchema(host, workspaceRoot, projectRoot, sourceRoot, options);
    const config = await generateWebpackConfig(core_1.getSystemPath(workspaceRoot), core_1.getSystemPath(projectRoot), sourceRoot && core_1.getSystemPath(sourceRoot), normalizedOptions, webpackPartialGenerator, context.logger, extraBuildOptions);
    // If builder watch support is present in the context, add watch plugin
    // This is internal only and currently only used for testing
    const watcherFactory = context.watcherFactory;
    if (watcherFactory) {
        if (!config.plugins) {
            config.plugins = [];
        }
        config.plugins.push(new builder_watch_plugin_1.BuilderWatchPlugin(watcherFactory));
    }
    return {
        config,
        projectRoot: core_1.getSystemPath(projectRoot),
        projectSourceRoot: sourceRoot && core_1.getSystemPath(sourceRoot),
    };
}
exports.generateBrowserWebpackConfigFromContext = generateBrowserWebpackConfigFromContext;
function getIndexOutputFile(index) {
    if (typeof index === 'string') {
        return path.basename(index);
    }
    else {
        return index.output || 'index.html';
    }
}
exports.getIndexOutputFile = getIndexOutputFile;
function getIndexInputFile(index) {
    if (typeof index === 'string') {
        return index;
    }
    else {
        return index.input;
    }
}
exports.getIndexInputFile = getIndexInputFile;

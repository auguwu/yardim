"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonConfig = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const build_optimizer_1 = require("@angular-devkit/build-optimizer");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs_1 = require("fs");
const path = require("path");
const typescript_1 = require("typescript");
const webpack_1 = require("webpack");
const webpack_sources_1 = require("webpack-sources");
const utils_1 = require("../../utils");
const cache_path_1 = require("../../utils/cache-path");
const environment_options_1 = require("../../utils/environment-options");
const find_up_1 = require("../../utils/find-up");
const spinner_1 = require("../../utils/spinner");
const webpack_version_1 = require("../../utils/webpack-version");
const plugins_1 = require("../plugins");
const helpers_1 = require("../utils/helpers");
const stats_1 = require("../utils/stats");
const TerserPlugin = require('terser-webpack-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
// tslint:disable-next-line:no-big-function
function getCommonConfig(wco) {
    const { root, projectRoot, buildOptions, tsConfig } = wco;
    const { platform = 'browser', sourceMap: { styles: stylesSourceMap, scripts: scriptsSourceMap, vendor: vendorSourceMap, }, optimization: { styles: stylesOptimization, scripts: scriptsOptimization, }, } = buildOptions;
    const extraPlugins = [];
    const extraRules = [];
    const entryPoints = {};
    // determine hashing format
    const hashFormat = helpers_1.getOutputHashFormat(buildOptions.outputHashing || 'none');
    const targetInFileName = helpers_1.getEsVersionForFileName(tsConfig.options.target, buildOptions.differentialLoadingNeeded);
    if (buildOptions.main) {
        const mainPath = path.resolve(root, buildOptions.main);
        entryPoints['main'] = [mainPath];
        if (buildOptions.experimentalRollupPass) {
            // NOTE: the following are known problems with experimentalRollupPass
            // - vendorChunk, commonChunk, namedChunks: these won't work, because by the time webpack
            // sees the chunks, the context of where they came from is lost.
            // - webWorkerTsConfig: workers must be imported via a root relative path (e.g.
            // `app/search/search.worker`) instead of a relative path (`/search.worker`) because
            // of the same reason as above.
            // - loadChildren string syntax: doesn't work because rollup cannot follow the imports.
            // Rollup options, except entry module, which is automatically inferred.
            const rollupOptions = {};
            // Add rollup plugins/rules.
            extraRules.push({
                test: mainPath,
                // Ensure rollup loader executes after other loaders.
                enforce: 'post',
                use: [{
                        loader: plugins_1.WebpackRollupLoader,
                        options: rollupOptions,
                    }],
            });
            // Rollup bundles will include the dynamic System.import that was inside Angular and webpack
            // will emit warnings because it can't resolve it. We just ignore it.
            // TODO: maybe use https://webpack.js.org/configuration/stats/#statswarningsfilter instead.
            // Ignore all "Critical dependency: the request of a dependency is an expression" warnings.
            extraPlugins.push(new webpack_1.ContextReplacementPlugin(/./));
            // Ignore "System.import() is deprecated" warnings for the main file and js files.
            // Might still get them if @angular/core gets split into a lazy module.
            extraRules.push({
                test: mainPath,
                enforce: 'post',
                parser: { system: true },
            });
            extraRules.push({
                test: /\.js$/,
                enforce: 'post',
                parser: { system: true },
            });
        }
    }
    const differentialLoadingMode = buildOptions.differentialLoadingNeeded && !buildOptions.watch;
    if (platform !== 'server') {
        if (differentialLoadingMode || tsConfig.options.target === typescript_1.ScriptTarget.ES5) {
            const buildBrowserFeatures = new utils_1.BuildBrowserFeatures(projectRoot);
            if (buildBrowserFeatures.isEs5SupportNeeded()) {
                const polyfillsChunkName = 'polyfills-es5';
                entryPoints[polyfillsChunkName] = [path.join(__dirname, '..', 'es5-polyfills.js')];
                if (differentialLoadingMode) {
                    // Add zone.js legacy support to the es5 polyfills
                    // This is a noop execution-wise if zone-evergreen is not used.
                    entryPoints[polyfillsChunkName].push('zone.js/dist/zone-legacy');
                    // Since the chunkFileName option schema does not allow the function overload, add a plugin
                    // that changes the name of the ES5 polyfills chunk to not include ES2015.
                    extraPlugins.push({
                        apply(compiler) {
                            compiler.hooks.compilation.tap('build-angular', compilation => {
                                const assetPath = (filename, data) => {
                                    var _a;
                                    const assetName = typeof filename === 'function' ? filename(data) : filename;
                                    const isMap = assetName === null || assetName === void 0 ? void 0 : assetName.endsWith('.map');
                                    return ((_a = data.chunk) === null || _a === void 0 ? void 0 : _a.name) === 'polyfills-es5'
                                        ? `polyfills-es5${hashFormat.chunk}.js${isMap ? '.map' : ''}`
                                        : assetName;
                                };
                                if (webpack_version_1.isWebpackFiveOrHigher()) {
                                    compilation.hooks.assetPath.tap('remove-hash-plugin', assetPath);
                                }
                                else {
                                    const mainTemplate = compilation.mainTemplate;
                                    mainTemplate.hooks.assetPath.tap('build-angular', assetPath);
                                }
                            });
                        },
                    });
                }
                if (!buildOptions.aot) {
                    if (differentialLoadingMode) {
                        entryPoints[polyfillsChunkName].push(path.join(__dirname, '..', 'jit-polyfills.js'));
                    }
                    entryPoints[polyfillsChunkName].push(path.join(__dirname, '..', 'es5-jit-polyfills.js'));
                }
                // If not performing a full differential build the polyfills need to be added to ES5 bundle
                if (buildOptions.polyfills) {
                    entryPoints[polyfillsChunkName].push(path.resolve(root, buildOptions.polyfills));
                }
            }
        }
        if (buildOptions.polyfills) {
            const projectPolyfills = path.resolve(root, buildOptions.polyfills);
            if (entryPoints['polyfills']) {
                entryPoints['polyfills'].push(projectPolyfills);
            }
            else {
                entryPoints['polyfills'] = [projectPolyfills];
            }
        }
        if (!buildOptions.aot) {
            const jitPolyfills = path.join(__dirname, '..', 'jit-polyfills.js');
            if (entryPoints['polyfills']) {
                entryPoints['polyfills'].push(jitPolyfills);
            }
            else {
                entryPoints['polyfills'] = [jitPolyfills];
            }
        }
    }
    if (environment_options_1.profilingEnabled) {
        extraPlugins.push(new webpack_1.debug.ProfilingPlugin({
            outputPath: path.resolve(root, 'chrome-profiler-events.json'),
        }));
    }
    // process global scripts
    const globalScriptsByBundleName = helpers_1.normalizeExtraEntryPoints(buildOptions.scripts, 'scripts').reduce((prev, curr) => {
        const { bundleName, inject, input } = curr;
        let resolvedPath = path.resolve(root, input);
        if (!fs_1.existsSync(resolvedPath)) {
            try {
                resolvedPath = require.resolve(input, { paths: [root] });
            }
            catch (_a) {
                throw new Error(`Script file ${input} does not exist.`);
            }
        }
        const existingEntry = prev.find(el => el.bundleName === bundleName);
        if (existingEntry) {
            if (existingEntry.inject && !inject) {
                // All entries have to be lazy for the bundle to be lazy.
                throw new Error(`The ${bundleName} bundle is mixing injected and non-injected scripts.`);
            }
            existingEntry.paths.push(resolvedPath);
        }
        else {
            prev.push({
                bundleName,
                inject,
                paths: [resolvedPath],
            });
        }
        return prev;
    }, []);
    // Add a new asset for each entry.
    for (const script of globalScriptsByBundleName) {
        // Lazy scripts don't get a hash, otherwise they can't be loaded by name.
        const hash = script.inject ? hashFormat.script : '';
        const bundleName = script.bundleName;
        extraPlugins.push(new plugins_1.ScriptsWebpackPlugin({
            name: bundleName,
            sourceMap: scriptsSourceMap,
            filename: `${path.basename(bundleName)}${hash}.js`,
            scripts: script.paths,
            basePath: projectRoot,
        }));
    }
    // process asset entries
    if (buildOptions.assets.length) {
        const copyWebpackPluginPatterns = buildOptions.assets.map((asset) => {
            // Resolve input paths relative to workspace root and add slash at the end.
            // tslint:disable-next-line: prefer-const
            let { input, output, ignore = [], glob } = asset;
            input = path.resolve(root, input).replace(/\\/g, '/');
            input = input.endsWith('/') ? input : input + '/';
            output = output.endsWith('/') ? output : output + '/';
            if (output.startsWith('..')) {
                throw new Error('An asset cannot be written to a location outside of the output path.');
            }
            return {
                context: input,
                // Now we remove starting slash to make Webpack place it from the output root.
                to: output.replace(/^\//, ''),
                from: glob,
                noErrorOnMissing: true,
                force: true,
                globOptions: {
                    dot: true,
                    followSymbolicLinks: !!asset.followSymlinks,
                    ignore: [
                        '.gitkeep',
                        '**/.DS_Store',
                        '**/Thumbs.db',
                        // Negate patterns needs to be absolute because copy-webpack-plugin uses absolute globs which
                        // causes negate patterns not to match.
                        // See: https://github.com/webpack-contrib/copy-webpack-plugin/issues/498#issuecomment-639327909
                        ...ignore,
                    ].map(i => path.posix.join(input, i)),
                },
            };
        });
        extraPlugins.push(new CopyWebpackPlugin({
            patterns: copyWebpackPluginPatterns,
        }));
    }
    if (buildOptions.progress) {
        const ProgressPlugin = require('webpack/lib/ProgressPlugin');
        const spinner = new spinner_1.Spinner();
        extraPlugins.push(new ProgressPlugin({
            handler: (percentage, message) => {
                switch (percentage) {
                    case 0:
                        spinner.start(`Generating ${platform} application bundles...`);
                        break;
                    case 1:
                        spinner.succeed(`${platform.replace(/^\w/, s => s.toUpperCase())} application bundle generation complete.`);
                        break;
                    default:
                        spinner.text = `Generating ${platform} application bundles (phase: ${message})...`;
                        break;
                }
            },
        }));
    }
    if (buildOptions.showCircularDependencies) {
        const CircularDependencyPlugin = require('circular-dependency-plugin');
        extraPlugins.push(new CircularDependencyPlugin({
            exclude: /([\\\/]node_modules[\\\/])|(ngfactory\.js$)/,
        }));
    }
    if (buildOptions.statsJson) {
        extraPlugins.push(new (class {
            apply(compiler) {
                compiler.hooks.emit.tap('angular-cli-stats', compilation => {
                    const data = JSON.stringify(compilation.getStats().toJson('verbose'), undefined, 2);
                    compilation.assets['stats.json'] = new webpack_sources_1.RawSource(data);
                });
            }
        })());
    }
    if (buildOptions.namedChunks && !webpack_version_1.isWebpackFiveOrHigher()) {
        extraPlugins.push(new plugins_1.NamedLazyChunksPlugin());
        // Provide full names for lazy routes that use the deprecated string format
        extraPlugins.push(new webpack_1.ContextReplacementPlugin(/\@angular[\\\/]core[\\\/]/, (data) => (data.chunkName = '[request]')));
    }
    if (!differentialLoadingMode) {
        // Budgets are computed after differential builds, not via a plugin.
        // https://github.com/angular/angular-cli/blob/master/packages/angular_devkit/build_angular/src/browser/index.ts
        extraPlugins.push(new plugins_1.BundleBudgetPlugin({ budgets: buildOptions.budgets }));
    }
    if ((scriptsSourceMap || stylesSourceMap)) {
        extraRules.push({
            test: /\.m?js$/,
            exclude: vendorSourceMap
                ? /(ngfactory|ngstyle)\.js$/
                : [/[\\\/]node_modules[\\\/]/, /(ngfactory|ngstyle)\.js$/],
            enforce: 'pre',
            loader: require.resolve('source-map-loader'),
        });
    }
    let buildOptimizerUseRule = [];
    if (buildOptions.buildOptimizer) {
        extraPlugins.push(new build_optimizer_1.BuildOptimizerWebpackPlugin());
        buildOptimizerUseRule = [
            {
                loader: build_optimizer_1.buildOptimizerLoaderPath,
                options: { sourceMap: scriptsSourceMap },
            },
        ];
    }
    const extraMinimizers = [];
    if (stylesOptimization.minify) {
        extraMinimizers.push(new plugins_1.OptimizeCssWebpackPlugin({
            sourceMap: stylesSourceMap,
            // component styles retain their original file name
            test: file => /\.(?:css|scss|sass|less|styl)$/.test(file),
        }));
    }
    if (scriptsOptimization) {
        const { GLOBAL_DEFS_FOR_TERSER, GLOBAL_DEFS_FOR_TERSER_WITH_AOT } = require('@angular/compiler-cli');
        const angularGlobalDefinitions = buildOptions.aot
            ? GLOBAL_DEFS_FOR_TERSER_WITH_AOT
            : GLOBAL_DEFS_FOR_TERSER;
        // TODO: Investigate why this fails for some packages: wco.supportES2015 ? 6 : 5;
        const terserEcma = 5;
        const terserOptions = {
            warnings: !!buildOptions.verbose,
            safari10: true,
            output: {
                ecma: terserEcma,
                // For differential loading, this is handled in the bundle processing.
                // This should also work with just true but the experimental rollup support breaks without this check.
                ascii_only: !differentialLoadingMode,
                // default behavior (undefined value) is to keep only important comments (licenses, etc.)
                comments: !buildOptions.extractLicenses && undefined,
                webkit: true,
                beautify: environment_options_1.shouldBeautify,
                wrap_func_args: false,
            },
            // On server, we don't want to compress anything. We still set the ngDevMode = false for it
            // to remove dev code, and ngI18nClosureMode to remove Closure compiler i18n code
            compress: environment_options_1.allowMinify &&
                (platform === 'server'
                    ? {
                        ecma: terserEcma,
                        global_defs: angularGlobalDefinitions,
                        keep_fnames: true,
                    }
                    : {
                        ecma: terserEcma,
                        pure_getters: buildOptions.buildOptimizer,
                        // PURE comments work best with 3 passes.
                        // See https://github.com/webpack/webpack/issues/2899#issuecomment-317425926.
                        passes: buildOptions.buildOptimizer ? 3 : 1,
                        global_defs: angularGlobalDefinitions,
                        pure_funcs: ['forwardRef'],
                    }),
            // We also want to avoid mangling on server.
            // Name mangling is handled within the browser builder
            mangle: environment_options_1.allowMangle && platform !== 'server' && !differentialLoadingMode,
        };
        const globalScriptsNames = globalScriptsByBundleName.map(s => s.bundleName);
        extraMinimizers.push(new TerserPlugin({
            sourceMap: scriptsSourceMap,
            parallel: utils_1.maxWorkers,
            cache: !environment_options_1.cachingDisabled && cache_path_1.findCachePath('terser-webpack'),
            extractComments: false,
            exclude: globalScriptsNames,
            terserOptions,
        }), 
        // Script bundles are fully optimized here in one step since they are never downleveled.
        // They are shared between ES2015 & ES5 outputs so must support ES5.
        new TerserPlugin({
            sourceMap: scriptsSourceMap,
            parallel: utils_1.maxWorkers,
            cache: !environment_options_1.cachingDisabled && cache_path_1.findCachePath('terser-webpack'),
            extractComments: false,
            include: globalScriptsNames,
            terserOptions: {
                ...terserOptions,
                compress: environment_options_1.allowMinify && {
                    ...terserOptions.compress,
                    ecma: 5,
                },
                output: {
                    ...terserOptions.output,
                    ecma: 5,
                },
                mangle: environment_options_1.allowMangle && platform !== 'server',
            },
        }));
    }
    return {
        mode: scriptsOptimization || stylesOptimization.minify ? 'production' : 'development',
        devtool: false,
        profile: buildOptions.statsJson,
        resolve: {
            roots: [projectRoot],
            extensions: ['.ts', '.tsx', '.mjs', '.js'],
            symlinks: !buildOptions.preserveSymlinks,
            modules: [wco.tsConfig.options.baseUrl || projectRoot, 'node_modules'],
            plugins: webpack_version_1.isWebpackFiveOrHigher() ? [] : [PnpWebpackPlugin],
        },
        resolveLoader: {
            symlinks: !buildOptions.preserveSymlinks,
            modules: [
                // Allow loaders to be in a node_modules nested inside the devkit/build-angular package.
                // This is important in case loaders do not get hoisted.
                // If this file moves to another location, alter potentialNodeModules as well.
                'node_modules',
                ...find_up_1.findAllNodeModules(__dirname, projectRoot),
            ],
            plugins: webpack_version_1.isWebpackFiveOrHigher() ? [] : [PnpWebpackPlugin.moduleLoader(module)],
        },
        context: root,
        entry: entryPoints,
        output: {
            ...webpack_version_1.withWebpackFourOrFive({ futureEmitAssets: true }, {}),
            path: path.resolve(root, buildOptions.outputPath),
            publicPath: buildOptions.deployUrl,
            filename: `[name]${targetInFileName}${hashFormat.chunk}.js`,
        },
        watch: buildOptions.watch,
        watchOptions: helpers_1.getWatchOptions(buildOptions.poll),
        performance: {
            hints: false,
        },
        ...webpack_version_1.withWebpackFourOrFive({}, { ignoreWarnings: stats_1.IGNORE_WARNINGS }),
        module: {
            // Show an error for missing exports instead of a warning.
            strictExportPresence: true,
            rules: [
                {
                    test: /\.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani|avif)$/,
                    loader: require.resolve('file-loader'),
                    options: {
                        name: `[name]${hashFormat.file}.[ext]`,
                        // Re-use emitted files from browser builder on the server.
                        emitFile: platform !== 'server',
                    },
                },
                {
                    // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
                    // Removing this will cause deprecation warnings to appear.
                    test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
                    parser: { system: true },
                },
                {
                    // Mark files inside `rxjs/add` as containing side effects.
                    // If this is fixed upstream and the fixed version becomes the minimum
                    // supported version, this can be removed.
                    test: /[\/\\]rxjs[\/\\]add[\/\\].+\.js$/,
                    sideEffects: true,
                },
                {
                    test: /\.[cm]?js$/,
                    exclude: [/[\/\\](?:core-js|\@babel|tslib|web-animations-js)[\/\\]/, /(ngfactory|ngstyle)\.js$/],
                    use: [
                        {
                            loader: require.resolve('../../babel/webpack-loader'),
                            options: {
                                cacheDirectory: cache_path_1.findCachePath('babel-webpack'),
                                cacheIdentifier: JSON.stringify({
                                    buildAngular: require('../../../package.json').version,
                                }),
                                scriptTarget: wco.scriptTarget,
                            },
                        },
                        ...buildOptimizerUseRule,
                    ],
                },
                ...extraRules,
            ],
        },
        optimization: {
            minimizer: extraMinimizers,
            moduleIds: webpack_version_1.withWebpackFourOrFive('hashed', 'deterministic'),
            ...webpack_version_1.withWebpackFourOrFive({}, buildOptions.namedChunks ? { chunkIds: 'named' } : {}),
            ...webpack_version_1.withWebpackFourOrFive({ noEmitOnErrors: true }, { emitOnErrors: false }),
        },
        plugins: [
            // Always replace the context for the System.import in angular/core to prevent warnings.
            // https://github.com/angular/angular/issues/11580
            // With VE the correct context is added in @ngtools/webpack, but Ivy doesn't need it at all.
            new webpack_1.ContextReplacementPlugin(/\@angular(\\|\/)core(\\|\/)/),
            new plugins_1.DedupeModuleResolvePlugin({ verbose: buildOptions.verbose }),
            ...extraPlugins,
        ],
    };
}
exports.getCommonConfig = getCommonConfig;

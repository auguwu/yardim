"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const i18n_options_1 = require("../utils/i18n-options");
const version_1 = require("../utils/version");
const webpack_browser_config_1 = require("../utils/webpack-browser-config");
const configs_1 = require("../webpack/configs");
const stats_1 = require("../webpack/utils/stats");
const schema_1 = require("./schema");
function getI18nOutfile(format) {
    switch (format) {
        case 'xmb':
            return 'messages.xmb';
        case 'xlf':
        case 'xlif':
        case 'xliff':
        case 'xlf2':
        case 'xliff2':
            return 'messages.xlf';
        case 'json':
            return 'messages.json';
        case 'arb':
            return 'messages.arb';
        default:
            throw new Error(`Unsupported format "${format}"`);
    }
}
async function getSerializer(format, sourceLocale, basePath, useLegacyIds) {
    switch (format) {
        case schema_1.Format.Xmb:
            const { XmbTranslationSerializer } = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/extract/translation_files/xmb_translation_serializer'));
            // tslint:disable-next-line: no-any
            return new XmbTranslationSerializer(basePath, useLegacyIds);
        case schema_1.Format.Xlf:
        case schema_1.Format.Xlif:
        case schema_1.Format.Xliff:
            const { Xliff1TranslationSerializer } = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/extract/translation_files/xliff1_translation_serializer'));
            // tslint:disable-next-line: no-any
            return new Xliff1TranslationSerializer(sourceLocale, basePath, useLegacyIds, {});
        case schema_1.Format.Xlf2:
        case schema_1.Format.Xliff2:
            const { Xliff2TranslationSerializer } = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/extract/translation_files/xliff2_translation_serializer'));
            // tslint:disable-next-line: no-any
            return new Xliff2TranslationSerializer(sourceLocale, basePath, useLegacyIds, {});
        case schema_1.Format.Json:
            const { SimpleJsonTranslationSerializer } = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/extract/translation_files/json_translation_serializer'));
            // tslint:disable-next-line: no-any
            return new SimpleJsonTranslationSerializer(sourceLocale);
        case schema_1.Format.Arb:
            const { ArbTranslationSerializer } = await Promise.resolve().then(() => require('@angular/localize/src/tools/src/extract/translation_files/arb_translation_serializer'));
            const fileSystem = {
                relative(from, to) {
                    return path.relative(from, to);
                },
            };
            // tslint:disable-next-line: no-any
            return new ArbTranslationSerializer(sourceLocale, basePath, fileSystem);
    }
}
function normalizeFormatOption(options) {
    let format;
    if (options.i18nFormat !== schema_1.Format.Xlf) {
        format = options.i18nFormat;
    }
    else {
        format = options.format;
    }
    switch (format) {
        case schema_1.Format.Xlf:
        case schema_1.Format.Xlif:
        case schema_1.Format.Xliff:
            format = schema_1.Format.Xlf;
            break;
        case schema_1.Format.Xlf2:
        case schema_1.Format.Xliff2:
            format = schema_1.Format.Xlf2;
            break;
        case schema_1.Format.Json:
            format = schema_1.Format.Json;
            break;
        case schema_1.Format.Arb:
            format = schema_1.Format.Arb;
            break;
        case undefined:
            format = schema_1.Format.Xlf;
            break;
    }
    return format;
}
class NoEmitPlugin {
    apply(compiler) {
        compiler.hooks.shouldEmit.tap('angular-no-emit', () => false);
    }
}
async function execute(options, context, transforms) {
    var _a;
    // Check Angular version.
    version_1.assertCompatibleAngularVersion(context.workspaceRoot, context.logger);
    const browserTarget = architect_1.targetFromTargetString(options.browserTarget);
    const browserOptions = await context.validateOptions(await context.getTargetOptions(browserTarget), await context.getBuilderNameForTarget(browserTarget));
    const format = normalizeFormatOption(options);
    // We need to determine the outFile name so that AngularCompiler can retrieve it.
    let outFile = options.outFile || getI18nOutfile(format);
    if (options.outputPath) {
        // AngularCompilerPlugin doesn't support genDir so we have to adjust outFile instead.
        outFile = path.join(options.outputPath, outFile);
    }
    outFile = path.resolve(context.workspaceRoot, outFile);
    if (!context.target || !context.target.project) {
        throw new Error('The builder requires a target.');
    }
    const metadata = await context.getProjectMetadata(context.target);
    const i18n = i18n_options_1.createI18nOptions(metadata);
    let usingIvy = false;
    let useLegacyIds = true;
    const ivyMessages = [];
    const { config, projectRoot } = await webpack_browser_config_1.generateBrowserWebpackConfigFromContext({
        ...browserOptions,
        optimization: false,
        sourceMap: {
            scripts: true,
            styles: false,
            vendor: true,
        },
        buildOptimizer: false,
        i18nLocale: options.i18nLocale || i18n.sourceLocale,
        i18nFormat: format,
        i18nFile: outFile,
        aot: true,
        progress: options.progress,
        assets: [],
        scripts: [],
        styles: [],
        deleteOutputPath: false,
    }, context, (wco) => {
        var _a;
        const isIvyApplication = wco.tsConfig.options.enableIvy !== false;
        // Default value for legacy message ids is currently true
        useLegacyIds = (_a = wco.tsConfig.options.enableI18nLegacyMessageIdFormat) !== null && _a !== void 0 ? _a : true;
        // Ivy extraction is the default for Ivy applications.
        usingIvy = (isIvyApplication && options.ivy === undefined) || !!options.ivy;
        if (usingIvy) {
            if (!isIvyApplication) {
                context.logger.warn('Ivy extraction enabled but application is not Ivy enabled. Extraction may fail.');
            }
        }
        else if (isIvyApplication) {
            context.logger.warn('Ivy extraction not enabled but application is Ivy enabled. ' +
                'If the extraction fails, the `--ivy` flag will enable Ivy extraction.');
        }
        const partials = [
            { plugins: [new NoEmitPlugin()] },
            configs_1.getCommonConfig(wco),
            // Only use VE extraction if not using Ivy
            configs_1.getAotConfig(wco, !usingIvy),
            configs_1.getStatsConfig(wco),
        ];
        // Add Ivy application file extractor support
        if (usingIvy) {
            partials.unshift({
                module: {
                    rules: [
                        {
                            test: /\.[t|j]s$/,
                            loader: require.resolve('./ivy-extract-loader'),
                            options: {
                                messageHandler: (messages) => ivyMessages.push(...messages),
                            },
                        },
                    ],
                },
            });
        }
        // Replace all stylesheets with an empty default export
        partials.push({
            plugins: [
                new webpack.NormalModuleReplacementPlugin(/\.(css|scss|sass|styl|less)$/, path.join(__dirname, 'empty-export-default.js')),
            ],
        });
        return partials;
    });
    if (usingIvy) {
        try {
            require.resolve('@angular/localize');
        }
        catch (_b) {
            return {
                success: false,
                error: `Ivy extraction requires the '@angular/localize' package.`,
            };
        }
    }
    const webpackResult = await build_webpack_1.runWebpack((await ((_a = transforms === null || transforms === void 0 ? void 0 : transforms.webpackConfiguration) === null || _a === void 0 ? void 0 : _a.call(transforms, config))) || config, context, {
        logging: stats_1.createWebpackLoggingCallback(false, context.logger),
        webpackFactory: webpack,
    }).toPromise();
    // Complete if using VE
    if (!usingIvy) {
        return webpackResult;
    }
    // Nothing to process if the Webpack build failed
    if (!webpackResult.success) {
        return webpackResult;
    }
    const basePath = config.context || projectRoot;
    const { checkDuplicateMessages } = await Promise.resolve().then(() => require(
    // tslint:disable-next-line: trailing-comma
    '@angular/localize/src/tools/src/extract/duplicates'));
    // The filesystem is used to create a relative path for each file
    // from the basePath.  This relative path is then used in the error message.
    const checkFileSystem = {
        relative(from, to) {
            return path.relative(from, to);
        },
    };
    const diagnostics = checkDuplicateMessages(
    // tslint:disable-next-line: no-any
    checkFileSystem, ivyMessages, 'warning', 
    // tslint:disable-next-line: no-any
    basePath);
    if (diagnostics.messages.length > 0) {
        context.logger.warn(diagnostics.formatDiagnostics(''));
    }
    // Serialize all extracted messages
    const serializer = await getSerializer(format, i18n.sourceLocale, basePath, useLegacyIds);
    const content = serializer.serialize(ivyMessages);
    // Ensure directory exists
    const outputPath = path.dirname(outFile);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    // Write translation file
    fs.writeFileSync(outFile, content);
    return webpackResult;
}
exports.execute = execute;
exports.default = architect_1.createBuilder(execute);

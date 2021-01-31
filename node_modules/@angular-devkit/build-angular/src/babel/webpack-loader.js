"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const babel_loader_1 = require("babel-loader");
const typescript_1 = require("typescript");
/**
 * Cached linker check utility function
 *
 * If undefined, not yet been imported
 * If null, attempted import failed and no linker support
 * If function, import succeeded and linker supported
 */
let needsLinking;
async function checkLinking(path, source) {
    // @angular/core and @angular/compiler will cause false positives
    if (/[\\\/]@angular[\\\/](?:compiler|core)/.test(path)) {
        return { requiresLinking: false };
    }
    if (needsLinking !== null) {
        try {
            if (needsLinking === undefined) {
                needsLinking = (await Promise.resolve().then(() => require('@angular/compiler-cli/linker'))).needsLinking;
            }
            // If the linker entry point is present then there is linker support
            return { hasLinkerSupport: true, requiresLinking: needsLinking(path, source) };
        }
        catch (_a) {
            needsLinking = null;
        }
    }
    // Fallback for Angular versions less than 11.1.0 with no linker support.
    // This information is used to issue errors if a partially compiled library is used when unsupported.
    return {
        hasLinkerSupport: false,
        requiresLinking: source.includes('ɵɵngDeclareDirective') || source.includes('ɵɵngDeclareComponent'),
    };
}
exports.default = babel_loader_1.custom(() => {
    const baseOptions = Object.freeze({
        babelrc: false,
        configFile: false,
        compact: false,
        cacheCompression: false,
        sourceType: 'unambiguous',
    });
    return {
        async customOptions({ scriptTarget, ...loaderOptions }, { source }) {
            // Must process file if plugins are added
            let shouldProcess = Array.isArray(loaderOptions.plugins) && loaderOptions.plugins.length > 0;
            // Analyze file for linking
            let shouldLink = false;
            const { hasLinkerSupport, requiresLinking } = await checkLinking(this.resourcePath, source);
            if (requiresLinking && !hasLinkerSupport) {
                // Cannot link if there is no linker support
                this.emitError('File requires the Angular linker. "@angular/compiler-cli" version 11.1.0 or greater is needed.');
            }
            else {
                shouldLink = requiresLinking;
            }
            shouldProcess || (shouldProcess = shouldLink);
            // Analyze for ES target processing
            let forceES5 = false;
            const esTarget = scriptTarget;
            if (esTarget < typescript_1.ScriptTarget.ES2015) {
                forceES5 = true;
            }
            shouldProcess || (shouldProcess = forceES5);
            // Add provided loader options to default base options
            const options = {
                ...baseOptions,
                ...loaderOptions,
            };
            // Skip babel processing if no actions are needed
            if (!shouldProcess) {
                // Force the current file to be ignored
                options.ignore = [() => true];
            }
            return { custom: { forceES5, shouldLink }, loader: options };
        },
        config(configuration, { customOptions }) {
            return {
                ...configuration.options,
                presets: [
                    ...(configuration.options.presets || []),
                    [
                        require('./presets/application').default,
                        {
                            angularLinker: customOptions.shouldLink,
                            forceES5: customOptions.forceES5,
                            diagnosticReporter: (type, message) => {
                                switch (type) {
                                    case 'error':
                                        this.emitError(message);
                                        break;
                                    case 'info':
                                    // Webpack does not currently have an informational diagnostic
                                    case 'warning':
                                        this.emitWarning(message);
                                        break;
                                }
                            },
                        },
                    ],
                ],
            };
        },
    };
});

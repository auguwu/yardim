"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DedupeModuleResolvePlugin = void 0;
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
// tslint:disable-next-line: no-any
function getResourceData(resolveData) {
    var _a, _b;
    if (resolveData.createData) {
        // Webpack 5+
        const { descriptionFileData, relativePath, resource, } = resolveData.createData.resourceResolveData;
        return {
            packageName: descriptionFileData === null || descriptionFileData === void 0 ? void 0 : descriptionFileData.name,
            packageVersion: descriptionFileData === null || descriptionFileData === void 0 ? void 0 : descriptionFileData.version,
            relativePath,
            resource,
        };
    }
    else {
        // Webpack 4
        const { resource, resourceResolveData } = resolveData;
        return {
            packageName: (_a = resourceResolveData.descriptionFileData) === null || _a === void 0 ? void 0 : _a.name,
            packageVersion: (_b = resourceResolveData.descriptionFileData) === null || _b === void 0 ? void 0 : _b.version,
            relativePath: resourceResolveData.relativePath,
            resource: resource,
        };
    }
}
/**
 * DedupeModuleResolvePlugin is a webpack plugin which dedupes modules with the same name and versions
 * that are laid out in different parts of the node_modules tree.
 *
 * This is needed because Webpack relies on package managers to hoist modules and doesn't have any deduping logic.
 *
 * This is similar to how Webpack's 'NormalModuleReplacementPlugin' works
 * @see https://github.com/webpack/webpack/blob/4a1f068828c2ab47537d8be30d542cd3a1076db4/lib/NormalModuleReplacementPlugin.js#L9
 */
class DedupeModuleResolvePlugin {
    constructor(options) {
        this.options = options;
        this.modules = new Map();
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('DedupeModuleResolvePlugin', (compilation, { normalModuleFactory }) => {
            normalModuleFactory.hooks.afterResolve.tap('DedupeModuleResolvePlugin', (result) => {
                var _a;
                if (!result) {
                    return;
                }
                const { packageName, packageVersion, relativePath, resource } = getResourceData(result);
                // Empty name or versions are no valid primary  entrypoints of a library
                if (!packageName || !packageVersion) {
                    return;
                }
                const moduleId = packageName + '@' + packageVersion + ':' + relativePath;
                const prevResolvedModule = this.modules.get(moduleId);
                if (!prevResolvedModule) {
                    // This is the first time we visit this module.
                    this.modules.set(moduleId, {
                        resource,
                        request: result.request,
                    });
                    return;
                }
                const { resource: prevResource, request: prevRequest } = prevResolvedModule;
                if (resource === prevResource) {
                    // No deduping needed.
                    // Current path and previously resolved path are the same.
                    return;
                }
                if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.verbose) {
                    webpack_diagnostics_1.addWarning(compilation, `[DedupeModuleResolvePlugin]: ${resource} -> ${prevResource}`);
                }
                // Alter current request with previously resolved module.
                result.request = prevRequest;
            });
        });
    }
}
exports.DedupeModuleResolvePlugin = DedupeModuleResolvePlugin;

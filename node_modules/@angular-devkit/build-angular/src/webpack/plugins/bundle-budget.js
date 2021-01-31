"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleBudgetPlugin = void 0;
const bundle_calculator_1 = require("../../utils/bundle-calculator");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
class BundleBudgetPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { budgets } = this.options;
        if (!budgets || budgets.length === 0) {
            return;
        }
        compiler.hooks.afterEmit.tap('BundleBudgetPlugin', (compilation) => {
            // No process bundle results because this plugin is only used when differential
            // builds are disabled.
            const processResults = [];
            const stats = compilation.getStats().toJson();
            for (const { severity, message } of bundle_calculator_1.checkBudgets(budgets, stats, processResults)) {
                switch (severity) {
                    case bundle_calculator_1.ThresholdSeverity.Warning:
                        webpack_diagnostics_1.addWarning(compilation, `budgets: ${message}`);
                        break;
                    case bundle_calculator_1.ThresholdSeverity.Error:
                        webpack_diagnostics_1.addError(compilation, `budgets: ${message}`);
                        break;
                }
            }
        });
    }
}
exports.BundleBudgetPlugin = BundleBudgetPlugin;

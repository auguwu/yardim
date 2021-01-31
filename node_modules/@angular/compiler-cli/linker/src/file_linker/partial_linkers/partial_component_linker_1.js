(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_component_linker_1", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler/src/core", "@angular/compiler-cli/linker/src/fatal_linker_error", "@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_directive_linker_1"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartialComponentLinkerVersion1 = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var compiler_1 = require("@angular/compiler");
    var core_1 = require("@angular/compiler/src/core");
    var fatal_linker_error_1 = require("@angular/compiler-cli/linker/src/fatal_linker_error");
    var partial_directive_linker_1_1 = require("@angular/compiler-cli/linker/src/file_linker/partial_linkers/partial_directive_linker_1");
    /**
     * A `PartialLinker` that is designed to process `ɵɵngDeclareComponent()` call expressions.
     */
    var PartialComponentLinkerVersion1 = /** @class */ (function () {
        function PartialComponentLinkerVersion1(environment, getSourceFile, sourceUrl, code) {
            this.environment = environment;
            this.getSourceFile = getSourceFile;
            this.sourceUrl = sourceUrl;
            this.code = code;
            this.i18nNormalizeLineEndingsInICUs = this.environment.options.i18nNormalizeLineEndingsInICUs;
            this.enableI18nLegacyMessageIdFormat = this.environment.options.enableI18nLegacyMessageIdFormat;
            this.i18nUseExternalIds = this.environment.options.i18nUseExternalIds;
        }
        PartialComponentLinkerVersion1.prototype.linkPartialDeclaration = function (constantPool, metaObj) {
            var meta = this.toR3ComponentMeta(metaObj);
            var def = compiler_1.compileComponentFromMetadata(meta, constantPool, compiler_1.makeBindingParser());
            return def.expression;
        };
        /**
         * This function derives the `R3ComponentMetadata` from the provided AST object.
         */
        PartialComponentLinkerVersion1.prototype.toR3ComponentMeta = function (metaObj) {
            var interpolation = parseInterpolationConfig(metaObj);
            var templateSource = metaObj.getValue('template');
            var isInline = metaObj.has('isInline') ? metaObj.getBoolean('isInline') : false;
            var templateInfo = this.getTemplateInfo(templateSource, isInline);
            // We always normalize line endings if the template is inline.
            var i18nNormalizeLineEndingsInICUs = isInline || this.i18nNormalizeLineEndingsInICUs;
            var template = compiler_1.parseTemplate(templateInfo.code, templateInfo.sourceUrl, {
                escapedString: templateInfo.isEscaped,
                interpolationConfig: interpolation,
                range: templateInfo.range,
                enableI18nLegacyMessageIdFormat: this.enableI18nLegacyMessageIdFormat,
                preserveWhitespaces: metaObj.has('preserveWhitespaces') ? metaObj.getBoolean('preserveWhitespaces') : false,
                i18nNormalizeLineEndingsInICUs: i18nNormalizeLineEndingsInICUs,
                isInline: isInline,
            });
            if (template.errors !== null) {
                var errors = template.errors.map(function (err) { return err.toString(); }).join('\n');
                throw new fatal_linker_error_1.FatalLinkerError(templateSource.expression, "Errors found in the template:\n" + errors);
            }
            var declarationListEmitMode = 0 /* Direct */;
            var directives = [];
            if (metaObj.has('directives')) {
                directives = metaObj.getArray('directives').map(function (directive) {
                    var directiveExpr = directive.getObject();
                    var type = directiveExpr.getValue('type');
                    var selector = directiveExpr.getString('selector');
                    var typeExpr = type.getOpaque();
                    var forwardRefType = extractForwardRef(type);
                    if (forwardRefType !== null) {
                        typeExpr = forwardRefType;
                        declarationListEmitMode = 1 /* Closure */;
                    }
                    return {
                        type: typeExpr,
                        selector: selector,
                        inputs: directiveExpr.has('inputs') ?
                            directiveExpr.getArray('inputs').map(function (input) { return input.getString(); }) :
                            [],
                        outputs: directiveExpr.has('outputs') ?
                            directiveExpr.getArray('outputs').map(function (input) { return input.getString(); }) :
                            [],
                        exportAs: directiveExpr.has('exportAs') ?
                            directiveExpr.getArray('exportAs').map(function (exportAs) { return exportAs.getString(); }) :
                            null,
                    };
                });
            }
            var pipes = new Map();
            if (metaObj.has('pipes')) {
                pipes = metaObj.getObject('pipes').toMap(function (pipe) {
                    var forwardRefType = extractForwardRef(pipe);
                    if (forwardRefType !== null) {
                        declarationListEmitMode = 1 /* Closure */;
                        return forwardRefType;
                    }
                    else {
                        return pipe.getOpaque();
                    }
                });
            }
            return tslib_1.__assign(tslib_1.__assign({}, partial_directive_linker_1_1.toR3DirectiveMeta(metaObj, this.code, this.sourceUrl)), { viewProviders: metaObj.has('viewProviders') ? metaObj.getOpaque('viewProviders') : null, template: {
                    nodes: template.nodes,
                    ngContentSelectors: template.ngContentSelectors,
                }, declarationListEmitMode: declarationListEmitMode, styles: metaObj.has('styles') ? metaObj.getArray('styles').map(function (entry) { return entry.getString(); }) :
                    [], encapsulation: metaObj.has('encapsulation') ?
                    parseEncapsulation(metaObj.getValue('encapsulation')) :
                    core_1.ViewEncapsulation.Emulated, interpolation: interpolation, changeDetection: metaObj.has('changeDetection') ?
                    parseChangeDetectionStrategy(metaObj.getValue('changeDetection')) :
                    core_1.ChangeDetectionStrategy.Default, animations: metaObj.has('animations') ? metaObj.getOpaque('animations') : null, relativeContextFilePath: this.sourceUrl, i18nUseExternalIds: this.i18nUseExternalIds, pipes: pipes,
                directives: directives });
        };
        /**
         * Update the range to remove the start and end chars, which should be quotes around the template.
         */
        PartialComponentLinkerVersion1.prototype.getTemplateInfo = function (templateNode, isInline) {
            var range = templateNode.getRange();
            if (!isInline) {
                // If not marked as inline, then we try to get the template info from the original external
                // template file, via source-mapping.
                var externalTemplate = this.tryExternalTemplate(range);
                if (externalTemplate !== null) {
                    return externalTemplate;
                }
            }
            // Either the template is marked inline or we failed to find the original external template.
            // So just use the literal string from the partially compiled component declaration.
            return this.templateFromPartialCode(templateNode, range);
        };
        PartialComponentLinkerVersion1.prototype.tryExternalTemplate = function (range) {
            var sourceFile = this.getSourceFile();
            if (sourceFile === null) {
                return null;
            }
            var pos = sourceFile.getOriginalLocation(range.startLine, range.startCol);
            // Only interested if the original location is in an "external" template file:
            // * the file is different to the current file
            // * the file does not end in `.js` or `.ts` (we expect it to be something like `.html`).
            // * the range starts at the beginning of the file
            if (pos === null || pos.file === this.sourceUrl || /\.[jt]s$/.test(pos.file) ||
                pos.line !== 0 || pos.column !== 0) {
                return null;
            }
            var templateContents = sourceFile.sources.find(function (src) { return (src === null || src === void 0 ? void 0 : src.sourcePath) === pos.file; }).contents;
            return {
                code: templateContents,
                sourceUrl: pos.file,
                range: { startPos: 0, startLine: 0, startCol: 0, endPos: templateContents.length },
                isEscaped: false,
            };
        };
        PartialComponentLinkerVersion1.prototype.templateFromPartialCode = function (templateNode, _a) {
            var startPos = _a.startPos, endPos = _a.endPos, startLine = _a.startLine, startCol = _a.startCol;
            if (!/["'`]/.test(this.code[startPos]) || this.code[startPos] !== this.code[endPos - 1]) {
                throw new fatal_linker_error_1.FatalLinkerError(templateNode.expression, "Expected the template string to be wrapped in quotes but got: " + this.code.substring(startPos, endPos));
            }
            return {
                code: this.code,
                sourceUrl: this.sourceUrl,
                range: { startPos: startPos + 1, endPos: endPos - 1, startLine: startLine, startCol: startCol + 1 },
                isEscaped: true,
            };
        };
        return PartialComponentLinkerVersion1;
    }());
    exports.PartialComponentLinkerVersion1 = PartialComponentLinkerVersion1;
    /**
     * Extract an `InterpolationConfig` from the component declaration.
     */
    function parseInterpolationConfig(metaObj) {
        if (!metaObj.has('interpolation')) {
            return compiler_1.DEFAULT_INTERPOLATION_CONFIG;
        }
        var interpolationExpr = metaObj.getValue('interpolation');
        var values = interpolationExpr.getArray().map(function (entry) { return entry.getString(); });
        if (values.length !== 2) {
            throw new fatal_linker_error_1.FatalLinkerError(interpolationExpr.expression, 'Unsupported interpolation config, expected an array containing exactly two strings');
        }
        return compiler_1.InterpolationConfig.fromArray(values);
    }
    /**
     * Determines the `ViewEncapsulation` mode from the AST value's symbol name.
     */
    function parseEncapsulation(encapsulation) {
        var symbolName = encapsulation.getSymbolName();
        if (symbolName === null) {
            throw new fatal_linker_error_1.FatalLinkerError(encapsulation.expression, 'Expected encapsulation to have a symbol name');
        }
        var enumValue = core_1.ViewEncapsulation[symbolName];
        if (enumValue === undefined) {
            throw new fatal_linker_error_1.FatalLinkerError(encapsulation.expression, 'Unsupported encapsulation');
        }
        return enumValue;
    }
    /**
     * Determines the `ChangeDetectionStrategy` from the AST value's symbol name.
     */
    function parseChangeDetectionStrategy(changeDetectionStrategy) {
        var symbolName = changeDetectionStrategy.getSymbolName();
        if (symbolName === null) {
            throw new fatal_linker_error_1.FatalLinkerError(changeDetectionStrategy.expression, 'Expected change detection strategy to have a symbol name');
        }
        var enumValue = core_1.ChangeDetectionStrategy[symbolName];
        if (enumValue === undefined) {
            throw new fatal_linker_error_1.FatalLinkerError(changeDetectionStrategy.expression, 'Unsupported change detection strategy');
        }
        return enumValue;
    }
    /**
     * Extract the type reference expression from a `forwardRef` function call. For example, the
     * expression `forwardRef(function() { return FooDir; })` returns `FooDir`. Note that this
     * expression is required to be wrapped in a closure, as otherwise the forward reference would be
     * resolved before initialization.
     */
    function extractForwardRef(expr) {
        if (!expr.isCallExpression()) {
            return null;
        }
        var callee = expr.getCallee();
        if (callee.getSymbolName() !== 'forwardRef') {
            throw new fatal_linker_error_1.FatalLinkerError(callee.expression, 'Unsupported directive type, expected forwardRef or a type reference');
        }
        var args = expr.getArguments();
        if (args.length !== 1) {
            throw new fatal_linker_error_1.FatalLinkerError(expr, 'Unsupported forwardRef call, expected a single argument');
        }
        var wrapperFn = args[0];
        if (!wrapperFn.isFunction()) {
            throw new fatal_linker_error_1.FatalLinkerError(wrapperFn, 'Unsupported forwardRef call, expected a function argument');
        }
        return wrapperFn.getFunctionReturnValue().getOpaque();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbF9jb21wb25lbnRfbGlua2VyXzEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbGlua2VyL3NyYy9maWxlX2xpbmtlci9wYXJ0aWFsX2xpbmtlcnMvcGFydGlhbF9jb21wb25lbnRfbGlua2VyXzEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILDhDQUEyUjtJQUMzUixtREFBc0Y7SUFNdEYsMEZBQTBEO0lBSTFELHNJQUErRDtJQUcvRDs7T0FFRztJQUNIO1FBUUUsd0NBQ3FCLFdBQXVELEVBQ3ZELGFBQThCLEVBQVUsU0FBeUIsRUFDMUUsSUFBWTtZQUZILGdCQUFXLEdBQVgsV0FBVyxDQUE0QztZQUN2RCxrQkFBYSxHQUFiLGFBQWEsQ0FBaUI7WUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFnQjtZQUMxRSxTQUFJLEdBQUosSUFBSSxDQUFRO1lBVFAsbUNBQThCLEdBQzNDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDO1lBQzNDLG9DQUErQixHQUM1QyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztZQUM1Qyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztRQUt2RCxDQUFDO1FBRTVCLCtEQUFzQixHQUF0QixVQUNJLFlBQTBCLEVBQzFCLE9BQXFEO1lBQ3ZELElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxJQUFNLEdBQUcsR0FBRyx1Q0FBNEIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLDRCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNsRixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVEOztXQUVHO1FB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QUUsRUFBRTtZQUMzQixNQUFNLElBQUkscUNBQWdCLENBQ3RCLFNBQVMsRUFBRSwyREFBMkQsQ0FBQyxDQUFDO1NBQzdFO1FBRUQsT0FBTyxTQUFTLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN4RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2NvbXBpbGVDb21wb25lbnRGcm9tTWV0YWRhdGEsIENvbnN0YW50UG9vbCwgRGVjbGFyYXRpb25MaXN0RW1pdE1vZGUsIERFRkFVTFRfSU5URVJQT0xBVElPTl9DT05GSUcsIEludGVycG9sYXRpb25Db25maWcsIG1ha2VCaW5kaW5nUGFyc2VyLCBwYXJzZVRlbXBsYXRlLCBSM0NvbXBvbmVudE1ldGFkYXRhLCBSM0RlY2xhcmVDb21wb25lbnRNZXRhZGF0YSwgUjNQYXJ0aWFsRGVjbGFyYXRpb24sIFIzVXNlZERpcmVjdGl2ZU1ldGFkYXRhfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL2NvcmUnO1xuaW1wb3J0ICogYXMgbyBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvb3V0cHV0L291dHB1dF9hc3QnO1xuXG5pbXBvcnQge0Fic29sdXRlRnNQYXRofSBmcm9tICcuLi8uLi8uLi8uLi9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0nO1xuaW1wb3J0IHtSYW5nZX0gZnJvbSAnLi4vLi4vYXN0L2FzdF9ob3N0JztcbmltcG9ydCB7QXN0T2JqZWN0LCBBc3RWYWx1ZX0gZnJvbSAnLi4vLi4vYXN0L2FzdF92YWx1ZSc7XG5pbXBvcnQge0ZhdGFsTGlua2VyRXJyb3J9IGZyb20gJy4uLy4uL2ZhdGFsX2xpbmtlcl9lcnJvcic7XG5pbXBvcnQge0dldFNvdXJjZUZpbGVGbn0gZnJvbSAnLi4vZ2V0X3NvdXJjZV9maWxlJztcbmltcG9ydCB7TGlua2VyRW52aXJvbm1lbnR9IGZyb20gJy4uL2xpbmtlcl9lbnZpcm9ubWVudCc7XG5cbmltcG9ydCB7dG9SM0RpcmVjdGl2ZU1ldGF9IGZyb20gJy4vcGFydGlhbF9kaXJlY3RpdmVfbGlua2VyXzEnO1xuaW1wb3J0IHtQYXJ0aWFsTGlua2VyfSBmcm9tICcuL3BhcnRpYWxfbGlua2VyJztcblxuLyoqXG4gKiBBIGBQYXJ0aWFsTGlua2VyYCB0aGF0IGlzIGRlc2lnbmVkIHRvIHByb2Nlc3MgYMm1ybVuZ0RlY2xhcmVDb21wb25lbnQoKWAgY2FsbCBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBhcnRpYWxDb21wb25lbnRMaW5rZXJWZXJzaW9uMTxUU3RhdGVtZW50LCBURXhwcmVzc2lvbj4gaW1wbGVtZW50c1xuICAgIFBhcnRpYWxMaW5rZXI8VEV4cHJlc3Npb24+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBpMThuTm9ybWFsaXplTGluZUVuZGluZ3NJbklDVXMgPVxuICAgICAgdGhpcy5lbnZpcm9ubWVudC5vcHRpb25zLmkxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVcztcbiAgcHJpdmF0ZSByZWFkb25seSBlbmFibGVJMThuTGVnYWN5TWVzc2FnZUlkRm9ybWF0ID1cbiAgICAgIHRoaXMuZW52aXJvbm1lbnQub3B0aW9ucy5lbmFibGVJMThuTGVnYWN5TWVzc2FnZUlkRm9ybWF0O1xuICBwcml2YXRlIHJlYWRvbmx5IGkxOG5Vc2VFeHRlcm5hbElkcyA9IHRoaXMuZW52aXJvbm1lbnQub3B0aW9ucy5pMThuVXNlRXh0ZXJuYWxJZHM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IGVudmlyb25tZW50OiBMaW5rZXJFbnZpcm9ubWVudDxUU3RhdGVtZW50LCBURXhwcmVzc2lvbj4sXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IGdldFNvdXJjZUZpbGU6IEdldFNvdXJjZUZpbGVGbiwgcHJpdmF0ZSBzb3VyY2VVcmw6IEFic29sdXRlRnNQYXRoLFxuICAgICAgcHJpdmF0ZSBjb2RlOiBzdHJpbmcpIHt9XG5cbiAgbGlua1BhcnRpYWxEZWNsYXJhdGlvbihcbiAgICAgIGNvbnN0YW50UG9vbDogQ29uc3RhbnRQb29sLFxuICAgICAgbWV0YU9iajogQXN0T2JqZWN0PFIzUGFydGlhbERlY2xhcmF0aW9uLCBURXhwcmVzc2lvbj4pOiBvLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRvUjNDb21wb25lbnRNZXRhKG1ldGFPYmopO1xuICAgIGNvbnN0IGRlZiA9IGNvbXBpbGVDb21wb25lbnRGcm9tTWV0YWRhdGEobWV0YSwgY29uc3RhbnRQb29sLCBtYWtlQmluZGluZ1BhcnNlcigpKTtcbiAgICByZXR1cm4gZGVmLmV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiBkZXJpdmVzIHRoZSBgUjNDb21wb25lbnRNZXRhZGF0YWAgZnJvbSB0aGUgcHJvdmlkZWQgQVNUIG9iamVjdC5cbiAgICovXG4gIHByaXZhdGUgdG9SM0NvbXBvbmVudE1ldGEobWV0YU9iajogQXN0T2JqZWN0PFIzRGVjbGFyZUNvbXBvbmVudE1ldGFkYXRhLCBURXhwcmVzc2lvbj4pOlxuICAgICAgUjNDb21wb25lbnRNZXRhZGF0YSB7XG4gICAgY29uc3QgaW50ZXJwb2xhdGlvbiA9IHBhcnNlSW50ZXJwb2xhdGlvbkNvbmZpZyhtZXRhT2JqKTtcbiAgICBjb25zdCB0ZW1wbGF0ZVNvdXJjZSA9IG1ldGFPYmouZ2V0VmFsdWUoJ3RlbXBsYXRlJyk7XG4gICAgY29uc3QgaXNJbmxpbmUgPSBtZXRhT2JqLmhhcygnaXNJbmxpbmUnKSA/IG1ldGFPYmouZ2V0Qm9vbGVhbignaXNJbmxpbmUnKSA6IGZhbHNlO1xuICAgIGNvbnN0IHRlbXBsYXRlSW5mbyA9IHRoaXMuZ2V0VGVtcGxhdGVJbmZvKHRlbXBsYXRlU291cmNlLCBpc0lubGluZSk7XG5cbiAgICAvLyBXZSBhbHdheXMgbm9ybWFsaXplIGxpbmUgZW5kaW5ncyBpZiB0aGUgdGVtcGxhdGUgaXMgaW5saW5lLlxuICAgIGNvbnN0IGkxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVcyA9IGlzSW5saW5lIHx8IHRoaXMuaTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzO1xuXG4gICAgY29uc3QgdGVtcGxhdGUgPSBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlSW5mby5jb2RlLCB0ZW1wbGF0ZUluZm8uc291cmNlVXJsLCB7XG4gICAgICBlc2NhcGVkU3RyaW5nOiB0ZW1wbGF0ZUluZm8uaXNFc2NhcGVkLFxuICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZzogaW50ZXJwb2xhdGlvbixcbiAgICAgIHJhbmdlOiB0ZW1wbGF0ZUluZm8ucmFuZ2UsXG4gICAgICBlbmFibGVJMThuTGVnYWN5TWVzc2FnZUlkRm9ybWF0OiB0aGlzLmVuYWJsZUkxOG5MZWdhY3lNZXNzYWdlSWRGb3JtYXQsXG4gICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOlxuICAgICAgICAgIG1ldGFPYmouaGFzKCdwcmVzZXJ2ZVdoaXRlc3BhY2VzJykgPyBtZXRhT2JqLmdldEJvb2xlYW4oJ3ByZXNlcnZlV2hpdGVzcGFjZXMnKSA6IGZhbHNlLFxuICAgICAgaTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzLFxuICAgICAgaXNJbmxpbmUsXG4gICAgfSk7XG4gICAgaWYgKHRlbXBsYXRlLmVycm9ycyAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgZXJyb3JzID0gdGVtcGxhdGUuZXJyb3JzLm1hcChlcnIgPT4gZXJyLnRvU3RyaW5nKCkpLmpvaW4oJ1xcbicpO1xuICAgICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgICAgdGVtcGxhdGVTb3VyY2UuZXhwcmVzc2lvbiwgYEVycm9ycyBmb3VuZCBpbiB0aGUgdGVtcGxhdGU6XFxuJHtlcnJvcnN9YCk7XG4gICAgfVxuXG4gICAgbGV0IGRlY2xhcmF0aW9uTGlzdEVtaXRNb2RlID0gRGVjbGFyYXRpb25MaXN0RW1pdE1vZGUuRGlyZWN0O1xuXG4gICAgbGV0IGRpcmVjdGl2ZXM6IFIzVXNlZERpcmVjdGl2ZU1ldGFkYXRhW10gPSBbXTtcbiAgICBpZiAobWV0YU9iai5oYXMoJ2RpcmVjdGl2ZXMnKSkge1xuICAgICAgZGlyZWN0aXZlcyA9IG1ldGFPYmouZ2V0QXJyYXkoJ2RpcmVjdGl2ZXMnKS5tYXAoZGlyZWN0aXZlID0+IHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRXhwciA9IGRpcmVjdGl2ZS5nZXRPYmplY3QoKTtcbiAgICAgICAgY29uc3QgdHlwZSA9IGRpcmVjdGl2ZUV4cHIuZ2V0VmFsdWUoJ3R5cGUnKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBkaXJlY3RpdmVFeHByLmdldFN0cmluZygnc2VsZWN0b3InKTtcblxuICAgICAgICBsZXQgdHlwZUV4cHIgPSB0eXBlLmdldE9wYXF1ZSgpO1xuICAgICAgICBjb25zdCBmb3J3YXJkUmVmVHlwZSA9IGV4dHJhY3RGb3J3YXJkUmVmKHR5cGUpO1xuICAgICAgICBpZiAoZm9yd2FyZFJlZlR5cGUgIT09IG51bGwpIHtcbiAgICAgICAgICB0eXBlRXhwciA9IGZvcndhcmRSZWZUeXBlO1xuICAgICAgICAgIGRlY2xhcmF0aW9uTGlzdEVtaXRNb2RlID0gRGVjbGFyYXRpb25MaXN0RW1pdE1vZGUuQ2xvc3VyZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogdHlwZUV4cHIsXG4gICAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgICAgICAgIGlucHV0czogZGlyZWN0aXZlRXhwci5oYXMoJ2lucHV0cycpID9cbiAgICAgICAgICAgICAgZGlyZWN0aXZlRXhwci5nZXRBcnJheSgnaW5wdXRzJykubWFwKGlucHV0ID0+IGlucHV0LmdldFN0cmluZygpKSA6XG4gICAgICAgICAgICAgIFtdLFxuICAgICAgICAgIG91dHB1dHM6IGRpcmVjdGl2ZUV4cHIuaGFzKCdvdXRwdXRzJykgP1xuICAgICAgICAgICAgICBkaXJlY3RpdmVFeHByLmdldEFycmF5KCdvdXRwdXRzJykubWFwKGlucHV0ID0+IGlucHV0LmdldFN0cmluZygpKSA6XG4gICAgICAgICAgICAgIFtdLFxuICAgICAgICAgIGV4cG9ydEFzOiBkaXJlY3RpdmVFeHByLmhhcygnZXhwb3J0QXMnKSA/XG4gICAgICAgICAgICAgIGRpcmVjdGl2ZUV4cHIuZ2V0QXJyYXkoJ2V4cG9ydEFzJykubWFwKGV4cG9ydEFzID0+IGV4cG9ydEFzLmdldFN0cmluZygpKSA6XG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgcGlwZXMgPSBuZXcgTWFwPHN0cmluZywgby5FeHByZXNzaW9uPigpO1xuICAgIGlmIChtZXRhT2JqLmhhcygncGlwZXMnKSkge1xuICAgICAgcGlwZXMgPSBtZXRhT2JqLmdldE9iamVjdCgncGlwZXMnKS50b01hcChwaXBlID0+IHtcbiAgICAgICAgY29uc3QgZm9yd2FyZFJlZlR5cGUgPSBleHRyYWN0Rm9yd2FyZFJlZihwaXBlKTtcbiAgICAgICAgaWYgKGZvcndhcmRSZWZUeXBlICE9PSBudWxsKSB7XG4gICAgICAgICAgZGVjbGFyYXRpb25MaXN0RW1pdE1vZGUgPSBEZWNsYXJhdGlvbkxpc3RFbWl0TW9kZS5DbG9zdXJlO1xuICAgICAgICAgIHJldHVybiBmb3J3YXJkUmVmVHlwZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcGlwZS5nZXRPcGFxdWUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRvUjNEaXJlY3RpdmVNZXRhKG1ldGFPYmosIHRoaXMuY29kZSwgdGhpcy5zb3VyY2VVcmwpLFxuICAgICAgdmlld1Byb3ZpZGVyczogbWV0YU9iai5oYXMoJ3ZpZXdQcm92aWRlcnMnKSA/IG1ldGFPYmouZ2V0T3BhcXVlKCd2aWV3UHJvdmlkZXJzJykgOiBudWxsLFxuICAgICAgdGVtcGxhdGU6IHtcbiAgICAgICAgbm9kZXM6IHRlbXBsYXRlLm5vZGVzLFxuICAgICAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHRlbXBsYXRlLm5nQ29udGVudFNlbGVjdG9ycyxcbiAgICAgIH0sXG4gICAgICBkZWNsYXJhdGlvbkxpc3RFbWl0TW9kZSxcbiAgICAgIHN0eWxlczogbWV0YU9iai5oYXMoJ3N0eWxlcycpID8gbWV0YU9iai5nZXRBcnJheSgnc3R5bGVzJykubWFwKGVudHJ5ID0+IGVudHJ5LmdldFN0cmluZygpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtdLFxuICAgICAgZW5jYXBzdWxhdGlvbjogbWV0YU9iai5oYXMoJ2VuY2Fwc3VsYXRpb24nKSA/XG4gICAgICAgICAgcGFyc2VFbmNhcHN1bGF0aW9uKG1ldGFPYmouZ2V0VmFsdWUoJ2VuY2Fwc3VsYXRpb24nKSkgOlxuICAgICAgICAgIFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkLFxuICAgICAgaW50ZXJwb2xhdGlvbixcbiAgICAgIGNoYW5nZURldGVjdGlvbjogbWV0YU9iai5oYXMoJ2NoYW5nZURldGVjdGlvbicpID9cbiAgICAgICAgICBwYXJzZUNoYW5nZURldGVjdGlvblN0cmF0ZWd5KG1ldGFPYmouZ2V0VmFsdWUoJ2NoYW5nZURldGVjdGlvbicpKSA6XG4gICAgICAgICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgICAgIGFuaW1hdGlvbnM6IG1ldGFPYmouaGFzKCdhbmltYXRpb25zJykgPyBtZXRhT2JqLmdldE9wYXF1ZSgnYW5pbWF0aW9ucycpIDogbnVsbCxcbiAgICAgIHJlbGF0aXZlQ29udGV4dEZpbGVQYXRoOiB0aGlzLnNvdXJjZVVybCxcbiAgICAgIGkxOG5Vc2VFeHRlcm5hbElkczogdGhpcy5pMThuVXNlRXh0ZXJuYWxJZHMsXG4gICAgICBwaXBlcyxcbiAgICAgIGRpcmVjdGl2ZXMsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHJhbmdlIHRvIHJlbW92ZSB0aGUgc3RhcnQgYW5kIGVuZCBjaGFycywgd2hpY2ggc2hvdWxkIGJlIHF1b3RlcyBhcm91bmQgdGhlIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRUZW1wbGF0ZUluZm8odGVtcGxhdGVOb2RlOiBBc3RWYWx1ZTx1bmtub3duLCBURXhwcmVzc2lvbj4sIGlzSW5saW5lOiBib29sZWFuKTpcbiAgICAgIFRlbXBsYXRlSW5mbyB7XG4gICAgY29uc3QgcmFuZ2UgPSB0ZW1wbGF0ZU5vZGUuZ2V0UmFuZ2UoKTtcblxuICAgIGlmICghaXNJbmxpbmUpIHtcbiAgICAgIC8vIElmIG5vdCBtYXJrZWQgYXMgaW5saW5lLCB0aGVuIHdlIHRyeSB0byBnZXQgdGhlIHRlbXBsYXRlIGluZm8gZnJvbSB0aGUgb3JpZ2luYWwgZXh0ZXJuYWxcbiAgICAgIC8vIHRlbXBsYXRlIGZpbGUsIHZpYSBzb3VyY2UtbWFwcGluZy5cbiAgICAgIGNvbnN0IGV4dGVybmFsVGVtcGxhdGUgPSB0aGlzLnRyeUV4dGVybmFsVGVtcGxhdGUocmFuZ2UpO1xuICAgICAgaWYgKGV4dGVybmFsVGVtcGxhdGUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGV4dGVybmFsVGVtcGxhdGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRWl0aGVyIHRoZSB0ZW1wbGF0ZSBpcyBtYXJrZWQgaW5saW5lIG9yIHdlIGZhaWxlZCB0byBmaW5kIHRoZSBvcmlnaW5hbCBleHRlcm5hbCB0ZW1wbGF0ZS5cbiAgICAvLyBTbyBqdXN0IHVzZSB0aGUgbGl0ZXJhbCBzdHJpbmcgZnJvbSB0aGUgcGFydGlhbGx5IGNvbXBpbGVkIGNvbXBvbmVudCBkZWNsYXJhdGlvbi5cbiAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZUZyb21QYXJ0aWFsQ29kZSh0ZW1wbGF0ZU5vZGUsIHJhbmdlKTtcbiAgfVxuXG4gIHByaXZhdGUgdHJ5RXh0ZXJuYWxUZW1wbGF0ZShyYW5nZTogUmFuZ2UpOiBUZW1wbGF0ZUluZm98bnVsbCB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHRoaXMuZ2V0U291cmNlRmlsZSgpO1xuICAgIGlmIChzb3VyY2VGaWxlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBwb3MgPSBzb3VyY2VGaWxlLmdldE9yaWdpbmFsTG9jYXRpb24ocmFuZ2Uuc3RhcnRMaW5lLCByYW5nZS5zdGFydENvbCk7XG4gICAgLy8gT25seSBpbnRlcmVzdGVkIGlmIHRoZSBvcmlnaW5hbCBsb2NhdGlvbiBpcyBpbiBhbiBcImV4dGVybmFsXCIgdGVtcGxhdGUgZmlsZTpcbiAgICAvLyAqIHRoZSBmaWxlIGlzIGRpZmZlcmVudCB0byB0aGUgY3VycmVudCBmaWxlXG4gICAgLy8gKiB0aGUgZmlsZSBkb2VzIG5vdCBlbmQgaW4gYC5qc2Agb3IgYC50c2AgKHdlIGV4cGVjdCBpdCB0byBiZSBzb21ldGhpbmcgbGlrZSBgLmh0bWxgKS5cbiAgICAvLyAqIHRoZSByYW5nZSBzdGFydHMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgZmlsZVxuICAgIGlmIChwb3MgPT09IG51bGwgfHwgcG9zLmZpbGUgPT09IHRoaXMuc291cmNlVXJsIHx8IC9cXC5banRdcyQvLnRlc3QocG9zLmZpbGUpIHx8XG4gICAgICAgIHBvcy5saW5lICE9PSAwIHx8IHBvcy5jb2x1bW4gIT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRlbXBsYXRlQ29udGVudHMgPSBzb3VyY2VGaWxlLnNvdXJjZXMuZmluZChzcmMgPT4gc3JjPy5zb3VyY2VQYXRoID09PSBwb3MuZmlsZSkhLmNvbnRlbnRzO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IHRlbXBsYXRlQ29udGVudHMsXG4gICAgICBzb3VyY2VVcmw6IHBvcy5maWxlLFxuICAgICAgcmFuZ2U6IHtzdGFydFBvczogMCwgc3RhcnRMaW5lOiAwLCBzdGFydENvbDogMCwgZW5kUG9zOiB0ZW1wbGF0ZUNvbnRlbnRzLmxlbmd0aH0sXG4gICAgICBpc0VzY2FwZWQ6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHRlbXBsYXRlRnJvbVBhcnRpYWxDb2RlKFxuICAgICAgdGVtcGxhdGVOb2RlOiBBc3RWYWx1ZTx1bmtub3duLCBURXhwcmVzc2lvbj4sXG4gICAgICB7c3RhcnRQb3MsIGVuZFBvcywgc3RhcnRMaW5lLCBzdGFydENvbH06IFJhbmdlKTogVGVtcGxhdGVJbmZvIHtcbiAgICBpZiAoIS9bXCInYF0vLnRlc3QodGhpcy5jb2RlW3N0YXJ0UG9zXSkgfHwgdGhpcy5jb2RlW3N0YXJ0UG9zXSAhPT0gdGhpcy5jb2RlW2VuZFBvcyAtIDFdKSB7XG4gICAgICB0aHJvdyBuZXcgRmF0YWxMaW5rZXJFcnJvcihcbiAgICAgICAgICB0ZW1wbGF0ZU5vZGUuZXhwcmVzc2lvbixcbiAgICAgICAgICBgRXhwZWN0ZWQgdGhlIHRlbXBsYXRlIHN0cmluZyB0byBiZSB3cmFwcGVkIGluIHF1b3RlcyBidXQgZ290OiAke1xuICAgICAgICAgICAgICB0aGlzLmNvZGUuc3Vic3RyaW5nKHN0YXJ0UG9zLCBlbmRQb3MpfWApO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgc291cmNlVXJsOiB0aGlzLnNvdXJjZVVybCxcbiAgICAgIHJhbmdlOiB7c3RhcnRQb3M6IHN0YXJ0UG9zICsgMSwgZW5kUG9zOiBlbmRQb3MgLSAxLCBzdGFydExpbmUsIHN0YXJ0Q29sOiBzdGFydENvbCArIDF9LFxuICAgICAgaXNFc2NhcGVkOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuaW50ZXJmYWNlIFRlbXBsYXRlSW5mbyB7XG4gIGNvZGU6IHN0cmluZztcbiAgc291cmNlVXJsOiBzdHJpbmc7XG4gIHJhbmdlOiBSYW5nZTtcbiAgaXNFc2NhcGVkOiBib29sZWFuO1xufVxuXG4vKipcbiAqIEV4dHJhY3QgYW4gYEludGVycG9sYXRpb25Db25maWdgIGZyb20gdGhlIGNvbXBvbmVudCBkZWNsYXJhdGlvbi5cbiAqL1xuZnVuY3Rpb24gcGFyc2VJbnRlcnBvbGF0aW9uQ29uZmlnPFRFeHByZXNzaW9uPihcbiAgICBtZXRhT2JqOiBBc3RPYmplY3Q8UjNEZWNsYXJlQ29tcG9uZW50TWV0YWRhdGEsIFRFeHByZXNzaW9uPik6IEludGVycG9sYXRpb25Db25maWcge1xuICBpZiAoIW1ldGFPYmouaGFzKCdpbnRlcnBvbGF0aW9uJykpIHtcbiAgICByZXR1cm4gREVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRztcbiAgfVxuXG4gIGNvbnN0IGludGVycG9sYXRpb25FeHByID0gbWV0YU9iai5nZXRWYWx1ZSgnaW50ZXJwb2xhdGlvbicpO1xuICBjb25zdCB2YWx1ZXMgPSBpbnRlcnBvbGF0aW9uRXhwci5nZXRBcnJheSgpLm1hcChlbnRyeSA9PiBlbnRyeS5nZXRTdHJpbmcoKSk7XG4gIGlmICh2YWx1ZXMubGVuZ3RoICE9PSAyKSB7XG4gICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgIGludGVycG9sYXRpb25FeHByLmV4cHJlc3Npb24sXG4gICAgICAgICdVbnN1cHBvcnRlZCBpbnRlcnBvbGF0aW9uIGNvbmZpZywgZXhwZWN0ZWQgYW4gYXJyYXkgY29udGFpbmluZyBleGFjdGx5IHR3byBzdHJpbmdzJyk7XG4gIH1cbiAgcmV0dXJuIEludGVycG9sYXRpb25Db25maWcuZnJvbUFycmF5KHZhbHVlcyBhcyBbc3RyaW5nLCBzdHJpbmddKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBgVmlld0VuY2Fwc3VsYXRpb25gIG1vZGUgZnJvbSB0aGUgQVNUIHZhbHVlJ3Mgc3ltYm9sIG5hbWUuXG4gKi9cbmZ1bmN0aW9uIHBhcnNlRW5jYXBzdWxhdGlvbjxURXhwcmVzc2lvbj4oZW5jYXBzdWxhdGlvbjogQXN0VmFsdWU8Vmlld0VuY2Fwc3VsYXRpb24sIFRFeHByZXNzaW9uPik6XG4gICAgVmlld0VuY2Fwc3VsYXRpb24ge1xuICBjb25zdCBzeW1ib2xOYW1lID0gZW5jYXBzdWxhdGlvbi5nZXRTeW1ib2xOYW1lKCk7XG4gIGlmIChzeW1ib2xOYW1lID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgIGVuY2Fwc3VsYXRpb24uZXhwcmVzc2lvbiwgJ0V4cGVjdGVkIGVuY2Fwc3VsYXRpb24gdG8gaGF2ZSBhIHN5bWJvbCBuYW1lJyk7XG4gIH1cbiAgY29uc3QgZW51bVZhbHVlID0gVmlld0VuY2Fwc3VsYXRpb25bc3ltYm9sTmFtZSBhcyBrZXlvZiB0eXBlb2YgVmlld0VuY2Fwc3VsYXRpb25dO1xuICBpZiAoZW51bVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRmF0YWxMaW5rZXJFcnJvcihlbmNhcHN1bGF0aW9uLmV4cHJlc3Npb24sICdVbnN1cHBvcnRlZCBlbmNhcHN1bGF0aW9uJyk7XG4gIH1cbiAgcmV0dXJuIGVudW1WYWx1ZTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHRoZSBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGZyb20gdGhlIEFTVCB2YWx1ZSdzIHN5bWJvbCBuYW1lLlxuICovXG5mdW5jdGlvbiBwYXJzZUNoYW5nZURldGVjdGlvblN0cmF0ZWd5PFRFeHByZXNzaW9uPihcbiAgICBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneTogQXN0VmFsdWU8Q2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIFRFeHByZXNzaW9uPik6XG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kge1xuICBjb25zdCBzeW1ib2xOYW1lID0gY2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuZ2V0U3ltYm9sTmFtZSgpO1xuICBpZiAoc3ltYm9sTmFtZSA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBGYXRhbExpbmtlckVycm9yKFxuICAgICAgICBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5leHByZXNzaW9uLFxuICAgICAgICAnRXhwZWN0ZWQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneSB0byBoYXZlIGEgc3ltYm9sIG5hbWUnKTtcbiAgfVxuICBjb25zdCBlbnVtVmFsdWUgPSBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneVtzeW1ib2xOYW1lIGFzIGtleW9mIHR5cGVvZiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneV07XG4gIGlmIChlbnVtVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBGYXRhbExpbmtlckVycm9yKFxuICAgICAgICBjaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5leHByZXNzaW9uLCAnVW5zdXBwb3J0ZWQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneScpO1xuICB9XG4gIHJldHVybiBlbnVtVmFsdWU7XG59XG5cbi8qKlxuICogRXh0cmFjdCB0aGUgdHlwZSByZWZlcmVuY2UgZXhwcmVzc2lvbiBmcm9tIGEgYGZvcndhcmRSZWZgIGZ1bmN0aW9uIGNhbGwuIEZvciBleGFtcGxlLCB0aGVcbiAqIGV4cHJlc3Npb24gYGZvcndhcmRSZWYoZnVuY3Rpb24oKSB7IHJldHVybiBGb29EaXI7IH0pYCByZXR1cm5zIGBGb29EaXJgLiBOb3RlIHRoYXQgdGhpc1xuICogZXhwcmVzc2lvbiBpcyByZXF1aXJlZCB0byBiZSB3cmFwcGVkIGluIGEgY2xvc3VyZSwgYXMgb3RoZXJ3aXNlIHRoZSBmb3J3YXJkIHJlZmVyZW5jZSB3b3VsZCBiZVxuICogcmVzb2x2ZWQgYmVmb3JlIGluaXRpYWxpemF0aW9uLlxuICovXG5mdW5jdGlvbiBleHRyYWN0Rm9yd2FyZFJlZjxURXhwcmVzc2lvbj4oZXhwcjogQXN0VmFsdWU8dW5rbm93biwgVEV4cHJlc3Npb24+KTpcbiAgICBvLldyYXBwZWROb2RlRXhwcjxURXhwcmVzc2lvbj58bnVsbCB7XG4gIGlmICghZXhwci5pc0NhbGxFeHByZXNzaW9uKCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNhbGxlZSA9IGV4cHIuZ2V0Q2FsbGVlKCk7XG4gIGlmIChjYWxsZWUuZ2V0U3ltYm9sTmFtZSgpICE9PSAnZm9yd2FyZFJlZicpIHtcbiAgICB0aHJvdyBuZXcgRmF0YWxMaW5rZXJFcnJvcihcbiAgICAgICAgY2FsbGVlLmV4cHJlc3Npb24sICdVbnN1cHBvcnRlZCBkaXJlY3RpdmUgdHlwZSwgZXhwZWN0ZWQgZm9yd2FyZFJlZiBvciBhIHR5cGUgcmVmZXJlbmNlJyk7XG4gIH1cblxuICBjb25zdCBhcmdzID0gZXhwci5nZXRBcmd1bWVudHMoKTtcbiAgaWYgKGFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoZXhwciwgJ1Vuc3VwcG9ydGVkIGZvcndhcmRSZWYgY2FsbCwgZXhwZWN0ZWQgYSBzaW5nbGUgYXJndW1lbnQnKTtcbiAgfVxuXG4gIGNvbnN0IHdyYXBwZXJGbiA9IGFyZ3NbMF0gYXMgQXN0VmFsdWU8RnVuY3Rpb24sIFRFeHByZXNzaW9uPjtcbiAgaWYgKCF3cmFwcGVyRm4uaXNGdW5jdGlvbigpKSB7XG4gICAgdGhyb3cgbmV3IEZhdGFsTGlua2VyRXJyb3IoXG4gICAgICAgIHdyYXBwZXJGbiwgJ1Vuc3VwcG9ydGVkIGZvcndhcmRSZWYgY2FsbCwgZXhwZWN0ZWQgYSBmdW5jdGlvbiBhcmd1bWVudCcpO1xuICB9XG5cbiAgcmV0dXJuIHdyYXBwZXJGbi5nZXRGdW5jdGlvblJldHVyblZhbHVlKCkuZ2V0T3BhcXVlKCk7XG59XG4iXX0=
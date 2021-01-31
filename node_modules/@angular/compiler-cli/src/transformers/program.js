/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/transformers/program", ["require", "exports", "tslib", "@angular/compiler", "fs", "path", "typescript", "@angular/compiler-cli/src/diagnostics/translate_diagnostics", "@angular/compiler-cli/src/metadata/index", "@angular/compiler-cli/src/ngtsc/core/src/compiler", "@angular/compiler-cli/src/ngtsc/program", "@angular/compiler-cli/src/ngtsc/reflection", "@angular/compiler-cli/src/typescript_support", "@angular/compiler-cli/src/transformers/api", "@angular/compiler-cli/src/transformers/compiler_host", "@angular/compiler-cli/src/transformers/downlevel_decorators_transform", "@angular/compiler-cli/src/transformers/inline_resources", "@angular/compiler-cli/src/transformers/lower_expressions", "@angular/compiler-cli/src/transformers/metadata_cache", "@angular/compiler-cli/src/transformers/node_emitter_transform", "@angular/compiler-cli/src/transformers/r3_metadata_transform", "@angular/compiler-cli/src/transformers/r3_transform", "@angular/compiler-cli/src/transformers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.i18nGetExtension = exports.i18nSerialize = exports.i18nExtract = exports.createSrcToOutPathMapper = exports.createProgram = exports.resetTempProgramHandlerForTest = exports.setTempProgramHandlerForTest = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var fs = require("fs");
    var path = require("path");
    var ts = require("typescript");
    var translate_diagnostics_1 = require("@angular/compiler-cli/src/diagnostics/translate_diagnostics");
    var metadata_1 = require("@angular/compiler-cli/src/metadata/index");
    var compiler_2 = require("@angular/compiler-cli/src/ngtsc/core/src/compiler");
    var program_1 = require("@angular/compiler-cli/src/ngtsc/program");
    var reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    var typescript_support_1 = require("@angular/compiler-cli/src/typescript_support");
    var api_1 = require("@angular/compiler-cli/src/transformers/api");
    var compiler_host_1 = require("@angular/compiler-cli/src/transformers/compiler_host");
    var downlevel_decorators_transform_1 = require("@angular/compiler-cli/src/transformers/downlevel_decorators_transform");
    var inline_resources_1 = require("@angular/compiler-cli/src/transformers/inline_resources");
    var lower_expressions_1 = require("@angular/compiler-cli/src/transformers/lower_expressions");
    var metadata_cache_1 = require("@angular/compiler-cli/src/transformers/metadata_cache");
    var node_emitter_transform_1 = require("@angular/compiler-cli/src/transformers/node_emitter_transform");
    var r3_metadata_transform_1 = require("@angular/compiler-cli/src/transformers/r3_metadata_transform");
    var r3_transform_1 = require("@angular/compiler-cli/src/transformers/r3_transform");
    var util_1 = require("@angular/compiler-cli/src/transformers/util");
    /**
     * Maximum number of files that are emitable via calling ts.Program.emit
     * passing individual targetSourceFiles.
     */
    var MAX_FILE_COUNT_FOR_SINGLE_FILE_EMIT = 20;
    /**
     * Fields to lower within metadata in render2 mode.
     */
    var LOWER_FIELDS = ['useValue', 'useFactory', 'data', 'id', 'loadChildren'];
    /**
     * Fields to lower within metadata in render3 mode.
     */
    var R3_LOWER_FIELDS = tslib_1.__spread(LOWER_FIELDS, ['providers', 'imports', 'exports']);
    /**
     * Installs a handler for testing purposes to allow inspection of the temporary program.
     */
    var tempProgramHandlerForTest = null;
    function setTempProgramHandlerForTest(handler) {
        tempProgramHandlerForTest = handler;
    }
    exports.setTempProgramHandlerForTest = setTempProgramHandlerForTest;
    function resetTempProgramHandlerForTest() {
        tempProgramHandlerForTest = null;
    }
    exports.resetTempProgramHandlerForTest = resetTempProgramHandlerForTest;
    var emptyModules = {
        ngModules: [],
        ngModuleByPipeOrDirective: new Map(),
        files: []
    };
    var defaultEmitCallback = function (_a) {
        var program = _a.program, targetSourceFile = _a.targetSourceFile, writeFile = _a.writeFile, cancellationToken = _a.cancellationToken, emitOnlyDtsFiles = _a.emitOnlyDtsFiles, customTransformers = _a.customTransformers;
        return program.emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);
    };
    var AngularCompilerProgram = /** @class */ (function () {
        function AngularCompilerProgram(rootNames, options, host, oldProgram) {
            var _a;
            var _this = this;
            this.options = options;
            this.host = host;
            this._optionsDiagnostics = [];
            this._transformTsDiagnostics = [];
            this._isCompilingAngularCore = null;
            this.rootNames = tslib_1.__spread(rootNames);
            if (!options.disableTypeScriptVersionCheck) {
                typescript_support_1.verifySupportedTypeScriptVersion();
            }
            this.oldTsProgram = oldProgram ? oldProgram.getTsProgram() : undefined;
            if (oldProgram) {
                this.oldProgramLibrarySummaries = oldProgram.getLibrarySummaries();
                this.oldProgramEmittedGeneratedFiles = oldProgram.getEmittedGeneratedFiles();
                this.oldProgramEmittedSourceFiles = oldProgram.getEmittedSourceFiles();
            }
            if (options.flatModuleOutFile) {
                var _b = metadata_1.createBundleIndexHost(options, this.rootNames, host, function () { return _this.flatModuleMetadataCache; }), bundleHost = _b.host, indexName = _b.indexName, errors = _b.errors;
                if (errors) {
                    (_a = this._optionsDiagnostics).push.apply(_a, tslib_1.__spread(errors.map(function (e) { return ({
                        category: e.category,
                        messageText: e.messageText,
                        source: api_1.SOURCE,
                        code: api_1.DEFAULT_ERROR_CODE
                    }); })));
                }
                else {
                    this.rootNames.push(indexName);
                    this.host = bundleHost;
                }
            }
            this.loweringMetadataTransform =
                new lower_expressions_1.LowerMetadataTransform(options.enableIvy !== false ? R3_LOWER_FIELDS : LOWER_FIELDS);
            this.metadataCache = this.createMetadataCache([this.loweringMetadataTransform]);
        }
        AngularCompilerProgram.prototype.createMetadataCache = function (transformers) {
            return new metadata_cache_1.MetadataCache(new metadata_1.MetadataCollector({ quotedNames: true }), !!this.options.strictMetadataEmit, transformers);
        };
        AngularCompilerProgram.prototype.getLibrarySummaries = function () {
            var result = new Map();
            if (this.oldProgramLibrarySummaries) {
                this.oldProgramLibrarySummaries.forEach(function (summary, fileName) { return result.set(fileName, summary); });
            }
            if (this.emittedLibrarySummaries) {
                this.emittedLibrarySummaries.forEach(function (summary, fileName) { return result.set(summary.fileName, summary); });
            }
            return result;
        };
        AngularCompilerProgram.prototype.getEmittedGeneratedFiles = function () {
            var result = new Map();
            if (this.oldProgramEmittedGeneratedFiles) {
                this.oldProgramEmittedGeneratedFiles.forEach(function (genFile, fileName) { return result.set(fileName, genFile); });
            }
            if (this.emittedGeneratedFiles) {
                this.emittedGeneratedFiles.forEach(function (genFile) { return result.set(genFile.genFileUrl, genFile); });
            }
            return result;
        };
        AngularCompilerProgram.prototype.getEmittedSourceFiles = function () {
            var result = new Map();
            if (this.oldProgramEmittedSourceFiles) {
                this.oldProgramEmittedSourceFiles.forEach(function (sf, fileName) { return result.set(fileName, sf); });
            }
            if (this.emittedSourceFiles) {
                this.emittedSourceFiles.forEach(function (sf) { return result.set(sf.fileName, sf); });
            }
            return result;
        };
        AngularCompilerProgram.prototype.getTsProgram = function () {
            return this.tsProgram;
        };
        AngularCompilerProgram.prototype.getTsOptionDiagnostics = function (cancellationToken) {
            return this.tsProgram.getOptionsDiagnostics(cancellationToken);
        };
        AngularCompilerProgram.prototype.getNgOptionDiagnostics = function (cancellationToken) {
            return tslib_1.__spread(this._optionsDiagnostics, getNgOptionDiagnostics(this.options));
        };
        AngularCompilerProgram.prototype.getTsSyntacticDiagnostics = function (sourceFile, cancellationToken) {
            return this.tsProgram.getSyntacticDiagnostics(sourceFile, cancellationToken);
        };
        AngularCompilerProgram.prototype.getNgStructuralDiagnostics = function (cancellationToken) {
            return this.structuralDiagnostics;
        };
        AngularCompilerProgram.prototype.getTsSemanticDiagnostics = function (sourceFile, cancellationToken) {
            var _this = this;
            var sourceFiles = sourceFile ? [sourceFile] : this.tsProgram.getSourceFiles();
            var diags = [];
            sourceFiles.forEach(function (sf) {
                if (!util_1.GENERATED_FILES.test(sf.fileName)) {
                    diags.push.apply(diags, tslib_1.__spread(_this.tsProgram.getSemanticDiagnostics(sf, cancellationToken)));
                }
            });
            return diags;
        };
        AngularCompilerProgram.prototype.getNgSemanticDiagnostics = function (fileName, cancellationToken) {
            var _this = this;
            var diags = [];
            this.tsProgram.getSourceFiles().forEach(function (sf) {
                if (util_1.GENERATED_FILES.test(sf.fileName) && !sf.isDeclarationFile) {
                    diags.push.apply(diags, tslib_1.__spread(_this.tsProgram.getSemanticDiagnostics(sf, cancellationToken)));
                }
            });
            var ng = translate_diagnostics_1.translateDiagnostics(this.hostAdapter, diags).ng;
            return ng;
        };
        AngularCompilerProgram.prototype.loadNgStructureAsync = function () {
            var _this = this;
            if (this._analyzedModules) {
                throw new Error('Angular structure already loaded');
            }
            return Promise.resolve()
                .then(function () {
                var _a = _this._createProgramWithBasicStubs(), tmpProgram = _a.tmpProgram, sourceFiles = _a.sourceFiles, tsFiles = _a.tsFiles, rootNames = _a.rootNames;
                return _this.compiler.loadFilesAsync(sourceFiles, tsFiles)
                    .then(function (_a) {
                    var analyzedModules = _a.analyzedModules, analyzedInjectables = _a.analyzedInjectables;
                    if (_this._analyzedModules) {
                        throw new Error('Angular structure loaded both synchronously and asynchronously');
                    }
                    _this._updateProgramWithTypeCheckStubs(tmpProgram, analyzedModules, analyzedInjectables, rootNames);
                });
            })
                .catch(function (e) { return _this._createProgramOnError(e); });
        };
        AngularCompilerProgram.prototype.listLazyRoutes = function (route) {
            // Note: Don't analyzedModules if a route is given
            // to be fast enough.
            return this.compiler.listLazyRoutes(route, route ? undefined : this.analyzedModules);
        };
        AngularCompilerProgram.prototype.emit = function (parameters) {
            if (parameters === void 0) { parameters = {}; }
            if (this.options.enableIvy !== false) {
                throw new Error('Cannot run legacy compiler in ngtsc mode');
            }
            return this._emitRender2(parameters);
        };
        AngularCompilerProgram.prototype._emitRender2 = function (_a) {
            var e_1, _b, e_2, _c;
            var _this = this;
            var _d = _a === void 0 ? {} : _a, _e = _d.emitFlags, emitFlags = _e === void 0 ? api_1.EmitFlags.Default : _e, cancellationToken = _d.cancellationToken, customTransformers = _d.customTransformers, _f = _d.emitCallback, emitCallback = _f === void 0 ? defaultEmitCallback : _f, _g = _d.mergeEmitResultsCallback, mergeEmitResultsCallback = _g === void 0 ? mergeEmitResults : _g;
            var emitStart = Date.now();
            if (emitFlags & api_1.EmitFlags.I18nBundle) {
                var locale = this.options.i18nOutLocale || null;
                var file = this.options.i18nOutFile || null;
                var format = this.options.i18nOutFormat || null;
                var bundle = this.compiler.emitMessageBundle(this.analyzedModules, locale);
                i18nExtract(format, file, this.host, this.options, bundle);
            }
            if ((emitFlags & (api_1.EmitFlags.JS | api_1.EmitFlags.DTS | api_1.EmitFlags.Metadata | api_1.EmitFlags.Codegen)) ===
                0) {
                return { emitSkipped: true, diagnostics: [], emittedFiles: [] };
            }
            var _h = this.generateFilesForEmit(emitFlags), genFiles = _h.genFiles, genDiags = _h.genDiags;
            if (genDiags.length) {
                return {
                    diagnostics: genDiags,
                    emitSkipped: true,
                    emittedFiles: [],
                };
            }
            this.emittedGeneratedFiles = genFiles;
            var outSrcMapping = [];
            var genFileByFileName = new Map();
            genFiles.forEach(function (genFile) { return genFileByFileName.set(genFile.genFileUrl, genFile); });
            this.emittedLibrarySummaries = [];
            this._transformTsDiagnostics = [];
            var emittedSourceFiles = [];
            var writeTsFile = function (outFileName, outData, writeByteOrderMark, onError, sourceFiles) {
                var sourceFile = sourceFiles && sourceFiles.length == 1 ? sourceFiles[0] : null;
                var genFile;
                if (sourceFile) {
                    outSrcMapping.push({ outFileName: outFileName, sourceFile: sourceFile });
                    genFile = genFileByFileName.get(sourceFile.fileName);
                    if (!sourceFile.isDeclarationFile && !util_1.GENERATED_FILES.test(sourceFile.fileName)) {
                        // Note: sourceFile is the transformed sourcefile, not the original one!
                        var originalFile = _this.tsProgram.getSourceFile(sourceFile.fileName);
                        if (originalFile) {
                            emittedSourceFiles.push(originalFile);
                        }
                    }
                }
                _this.writeFile(outFileName, outData, writeByteOrderMark, onError, genFile, sourceFiles);
            };
            var modules = this._analyzedInjectables &&
                this.compiler.emitAllPartialModules2(this._analyzedInjectables);
            var tsCustomTransformers = this.calculateTransforms(genFileByFileName, modules, customTransformers);
            var emitOnlyDtsFiles = (emitFlags & (api_1.EmitFlags.DTS | api_1.EmitFlags.JS)) == api_1.EmitFlags.DTS;
            // Restore the original references before we emit so TypeScript doesn't emit
            // a reference to the .d.ts file.
            var augmentedReferences = new Map();
            try {
                for (var _j = tslib_1.__values(this.tsProgram.getSourceFiles()), _k = _j.next(); !_k.done; _k = _j.next()) {
                    var sourceFile = _k.value;
                    var originalReferences = compiler_host_1.getOriginalReferences(sourceFile);
                    if (originalReferences) {
                        augmentedReferences.set(sourceFile, sourceFile.referencedFiles);
                        sourceFile.referencedFiles = originalReferences;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_k && !_k.done && (_b = _j.return)) _b.call(_j);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var genTsFiles = [];
            var genJsonFiles = [];
            genFiles.forEach(function (gf) {
                if (gf.stmts) {
                    genTsFiles.push(gf);
                }
                if (gf.source) {
                    genJsonFiles.push(gf);
                }
            });
            var emitResult;
            var emittedUserTsCount;
            try {
                var sourceFilesToEmit = this.getSourceFilesForEmit();
                if (sourceFilesToEmit &&
                    (sourceFilesToEmit.length + genTsFiles.length) < MAX_FILE_COUNT_FOR_SINGLE_FILE_EMIT) {
                    var fileNamesToEmit = tslib_1.__spread(sourceFilesToEmit.map(function (sf) { return sf.fileName; }), genTsFiles.map(function (gf) { return gf.genFileUrl; }));
                    emitResult = mergeEmitResultsCallback(fileNamesToEmit.map(function (fileName) { return emitResult = emitCallback({
                        program: _this.tsProgram,
                        host: _this.host,
                        options: _this.options,
                        writeFile: writeTsFile,
                        emitOnlyDtsFiles: emitOnlyDtsFiles,
                        customTransformers: tsCustomTransformers,
                        targetSourceFile: _this.tsProgram.getSourceFile(fileName),
                    }); }));
                    emittedUserTsCount = sourceFilesToEmit.length;
                }
                else {
                    emitResult = emitCallback({
                        program: this.tsProgram,
                        host: this.host,
                        options: this.options,
                        writeFile: writeTsFile,
                        emitOnlyDtsFiles: emitOnlyDtsFiles,
                        customTransformers: tsCustomTransformers
                    });
                    emittedUserTsCount = this.tsProgram.getSourceFiles().length - genTsFiles.length;
                }
            }
            finally {
                try {
                    // Restore the references back to the augmented value to ensure that the
                    // checks that TypeScript makes for project structure reuse will succeed.
                    for (var _l = tslib_1.__values(Array.from(augmentedReferences)), _m = _l.next(); !_m.done; _m = _l.next()) {
                        var _o = tslib_1.__read(_m.value, 2), sourceFile = _o[0], references = _o[1];
                        // TODO(chuckj): Remove any cast after updating build to 2.6
                        sourceFile.referencedFiles = references;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_m && !_m.done && (_c = _l.return)) _c.call(_l);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            this.emittedSourceFiles = emittedSourceFiles;
            // Match behavior of tsc: only produce emit diagnostics if it would block
            // emit. If noEmitOnError is false, the emit will happen in spite of any
            // errors, so we should not report them.
            if (emitResult && this.options.noEmitOnError === true) {
                // translate the diagnostics in the emitResult as well.
                var translatedEmitDiags = translate_diagnostics_1.translateDiagnostics(this.hostAdapter, emitResult.diagnostics);
                emitResult.diagnostics = translatedEmitDiags.ts.concat(this.structuralDiagnostics.concat(translatedEmitDiags.ng).map(util_1.ngToTsDiagnostic));
            }
            if (emitResult && !outSrcMapping.length) {
                // if no files were emitted by TypeScript, also don't emit .json files
                emitResult.diagnostics =
                    emitResult.diagnostics.concat([util_1.createMessageDiagnostic("Emitted no files.")]);
                return emitResult;
            }
            var sampleSrcFileName;
            var sampleOutFileName;
            if (outSrcMapping.length) {
                sampleSrcFileName = outSrcMapping[0].sourceFile.fileName;
                sampleOutFileName = outSrcMapping[0].outFileName;
            }
            var srcToOutPath = createSrcToOutPathMapper(this.options.outDir, sampleSrcFileName, sampleOutFileName);
            if (emitFlags & api_1.EmitFlags.Codegen) {
                genJsonFiles.forEach(function (gf) {
                    var outFileName = srcToOutPath(gf.genFileUrl);
                    _this.writeFile(outFileName, gf.source, false, undefined, gf);
                });
            }
            var metadataJsonCount = 0;
            if (emitFlags & api_1.EmitFlags.Metadata) {
                this.tsProgram.getSourceFiles().forEach(function (sf) {
                    if (!sf.isDeclarationFile && !util_1.GENERATED_FILES.test(sf.fileName)) {
                        metadataJsonCount++;
                        var metadata = _this.metadataCache.getMetadata(sf);
                        if (metadata) {
                            var metadataText = JSON.stringify([metadata]);
                            var outFileName = srcToOutPath(sf.fileName.replace(/\.tsx?$/, '.metadata.json'));
                            _this.writeFile(outFileName, metadataText, false, undefined, undefined, [sf]);
                        }
                    }
                });
            }
            var emitEnd = Date.now();
            if (emitResult && this.options.diagnostics) {
                emitResult.diagnostics = emitResult.diagnostics.concat([util_1.createMessageDiagnostic([
                        "Emitted in " + (emitEnd - emitStart) + "ms",
                        "- " + emittedUserTsCount + " user ts files",
                        "- " + genTsFiles.length + " generated ts files",
                        "- " + (genJsonFiles.length + metadataJsonCount) + " generated json files",
                    ].join('\n'))]);
            }
            return emitResult;
        };
        Object.defineProperty(AngularCompilerProgram.prototype, "compiler", {
            // Private members
            get: function () {
                if (!this._compiler) {
                    this._createCompiler();
                }
                return this._compiler;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AngularCompilerProgram.prototype, "hostAdapter", {
            get: function () {
                if (!this._hostAdapter) {
                    this._createCompiler();
                }
                return this._hostAdapter;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AngularCompilerProgram.prototype, "analyzedModules", {
            get: function () {
                if (!this._analyzedModules) {
                    this.initSync();
                }
                return this._analyzedModules;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AngularCompilerProgram.prototype, "structuralDiagnostics", {
            get: function () {
                var diagnostics = this._structuralDiagnostics;
                if (!diagnostics) {
                    this.initSync();
                    diagnostics = (this._structuralDiagnostics = this._structuralDiagnostics || []);
                }
                return diagnostics;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AngularCompilerProgram.prototype, "tsProgram", {
            get: function () {
                if (!this._tsProgram) {
                    this.initSync();
                }
                return this._tsProgram;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AngularCompilerProgram.prototype, "isCompilingAngularCore", {
            /** Whether the program is compiling the Angular core package. */
            get: function () {
                if (this._isCompilingAngularCore !== null) {
                    return this._isCompilingAngularCore;
                }
                return this._isCompilingAngularCore = compiler_2.isAngularCorePackage(this.tsProgram);
            },
            enumerable: false,
            configurable: true
        });
        AngularCompilerProgram.prototype.calculateTransforms = function (genFiles, partialModules, customTransformers) {
            var beforeTs = [];
            var metadataTransforms = [];
            var flatModuleMetadataTransforms = [];
            var annotateForClosureCompiler = this.options.annotateForClosureCompiler || false;
            if (this.options.enableResourceInlining) {
                beforeTs.push(inline_resources_1.getInlineResourcesTransformFactory(this.tsProgram, this.hostAdapter));
                var transformer = new inline_resources_1.InlineResourcesMetadataTransformer(this.hostAdapter);
                metadataTransforms.push(transformer);
                flatModuleMetadataTransforms.push(transformer);
            }
            if (!this.options.disableExpressionLowering) {
                beforeTs.push(lower_expressions_1.getExpressionLoweringTransformFactory(this.loweringMetadataTransform, this.tsProgram));
                metadataTransforms.push(this.loweringMetadataTransform);
            }
            if (genFiles) {
                beforeTs.push(node_emitter_transform_1.getAngularEmitterTransformFactory(genFiles, this.getTsProgram(), annotateForClosureCompiler));
            }
            if (partialModules) {
                beforeTs.push(r3_transform_1.getAngularClassTransformerFactory(partialModules, annotateForClosureCompiler));
                // If we have partial modules, the cached metadata might be incorrect as it doesn't reflect
                // the partial module transforms.
                var transformer = new r3_metadata_transform_1.PartialModuleMetadataTransformer(partialModules);
                metadataTransforms.push(transformer);
                flatModuleMetadataTransforms.push(transformer);
            }
            if (customTransformers && customTransformers.beforeTs) {
                beforeTs.push.apply(beforeTs, tslib_1.__spread(customTransformers.beforeTs));
            }
            // If decorators should be converted to static fields (enabled by default), we set up
            // the decorator downlevel transform. Note that we set it up as last transform as that
            // allows custom transformers to strip Angular decorators without having to deal with
            // identifying static properties. e.g. it's more difficult handling `<..>.decorators`
            // or `<..>.ctorParameters` compared to the `ts.Decorator` AST nodes.
            if (this.options.annotationsAs !== 'decorators') {
                var typeChecker = this.getTsProgram().getTypeChecker();
                var reflectionHost = new reflection_1.TypeScriptReflectionHost(typeChecker);
                // Similarly to how we handled tsickle decorator downleveling in the past, we just
                // ignore diagnostics that have been collected by the transformer. These are
                // non-significant failures that shouldn't prevent apps from compiling.
                beforeTs.push(downlevel_decorators_transform_1.getDownlevelDecoratorsTransform(typeChecker, reflectionHost, [], this.isCompilingAngularCore, annotateForClosureCompiler, 
                /* skipClassDecorators */ false));
            }
            if (metadataTransforms.length > 0) {
                this.metadataCache = this.createMetadataCache(metadataTransforms);
            }
            if (flatModuleMetadataTransforms.length > 0) {
                this.flatModuleMetadataCache = this.createMetadataCache(flatModuleMetadataTransforms);
            }
            var afterTs = customTransformers ? customTransformers.afterTs : undefined;
            return { before: beforeTs, after: afterTs };
        };
        AngularCompilerProgram.prototype.initSync = function () {
            if (this._analyzedModules) {
                return;
            }
            try {
                var _a = this._createProgramWithBasicStubs(), tmpProgram = _a.tmpProgram, sourceFiles = _a.sourceFiles, tsFiles = _a.tsFiles, rootNames = _a.rootNames;
                var _b = this.compiler.loadFilesSync(sourceFiles, tsFiles), analyzedModules = _b.analyzedModules, analyzedInjectables = _b.analyzedInjectables;
                this._updateProgramWithTypeCheckStubs(tmpProgram, analyzedModules, analyzedInjectables, rootNames);
            }
            catch (e) {
                this._createProgramOnError(e);
            }
        };
        AngularCompilerProgram.prototype._createCompiler = function () {
            var _this = this;
            var codegen = {
                generateFile: function (genFileName, baseFileName) {
                    return _this._compiler.emitBasicStub(genFileName, baseFileName);
                },
                findGeneratedFileNames: function (fileName) { return _this._compiler.findGeneratedFileNames(fileName); },
            };
            this._hostAdapter = new compiler_host_1.TsCompilerAotCompilerTypeCheckHostAdapter(this.rootNames, this.options, this.host, this.metadataCache, codegen, this.oldProgramLibrarySummaries);
            var aotOptions = getAotCompilerOptions(this.options);
            var errorCollector = (this.options.collectAllErrors || this.options.fullTemplateTypeCheck) ?
                function (err) { return _this._addStructuralDiagnostics(err); } :
                undefined;
            this._compiler = compiler_1.createAotCompiler(this._hostAdapter, aotOptions, errorCollector).compiler;
        };
        AngularCompilerProgram.prototype._createProgramWithBasicStubs = function () {
            var _this = this;
            if (this._analyzedModules) {
                throw new Error("Internal Error: already initialized!");
            }
            // Note: This is important to not produce a memory leak!
            var oldTsProgram = this.oldTsProgram;
            this.oldTsProgram = undefined;
            var codegen = {
                generateFile: function (genFileName, baseFileName) {
                    return _this.compiler.emitBasicStub(genFileName, baseFileName);
                },
                findGeneratedFileNames: function (fileName) { return _this.compiler.findGeneratedFileNames(fileName); },
            };
            var rootNames = tslib_1.__spread(this.rootNames);
            if (this.options.generateCodeForLibraries !== false) {
                // if we should generateCodeForLibraries, never include
                // generated files in the program as otherwise we will
                // overwrite them and typescript will report the error
                // TS5055: Cannot write file ... because it would overwrite input file.
                rootNames = rootNames.filter(function (fn) { return !util_1.GENERATED_FILES.test(fn); });
            }
            if (this.options.noResolve) {
                this.rootNames.forEach(function (rootName) {
                    if (_this.hostAdapter.shouldGenerateFilesFor(rootName)) {
                        rootNames.push.apply(rootNames, tslib_1.__spread(_this.compiler.findGeneratedFileNames(rootName)));
                    }
                });
            }
            var tmpProgram = ts.createProgram(rootNames, this.options, this.hostAdapter, oldTsProgram);
            if (tempProgramHandlerForTest !== null) {
                tempProgramHandlerForTest(tmpProgram);
            }
            var sourceFiles = [];
            var tsFiles = [];
            tmpProgram.getSourceFiles().forEach(function (sf) {
                if (_this.hostAdapter.isSourceFile(sf.fileName)) {
                    sourceFiles.push(sf.fileName);
                }
                if (util_1.TS.test(sf.fileName) && !util_1.DTS.test(sf.fileName)) {
                    tsFiles.push(sf.fileName);
                }
            });
            return { tmpProgram: tmpProgram, sourceFiles: sourceFiles, tsFiles: tsFiles, rootNames: rootNames };
        };
        AngularCompilerProgram.prototype._updateProgramWithTypeCheckStubs = function (tmpProgram, analyzedModules, analyzedInjectables, rootNames) {
            var _this = this;
            this._analyzedModules = analyzedModules;
            this._analyzedInjectables = analyzedInjectables;
            tmpProgram.getSourceFiles().forEach(function (sf) {
                if (sf.fileName.endsWith('.ngfactory.ts')) {
                    var _a = _this.hostAdapter.shouldGenerateFile(sf.fileName), generate = _a.generate, baseFileName = _a.baseFileName;
                    if (generate) {
                        // Note: ! is ok as hostAdapter.shouldGenerateFile will always return a baseFileName
                        // for .ngfactory.ts files.
                        var genFile = _this.compiler.emitTypeCheckStub(sf.fileName, baseFileName);
                        if (genFile) {
                            _this.hostAdapter.updateGeneratedFile(genFile);
                        }
                    }
                }
            });
            this._tsProgram = ts.createProgram(rootNames, this.options, this.hostAdapter, tmpProgram);
            // Note: the new ts program should be completely reusable by TypeScript as:
            // - we cache all the files in the hostAdapter
            // - new new stubs use the exactly same imports/exports as the old once (we assert that in
            // hostAdapter.updateGeneratedFile).
            // TS 4.1+ stores the reuse state in the new program
            var checkReuseProgram = ts.versionMajorMinor === '4.0' ? tmpProgram : this._tsProgram;
            if (util_1.tsStructureIsReused(checkReuseProgram) !== 2 /* Completely */) {
                throw new Error("Internal Error: The structure of the program changed during codegen.");
            }
        };
        AngularCompilerProgram.prototype._createProgramOnError = function (e) {
            // Still fill the analyzedModules and the tsProgram
            // so that we don't cause other errors for users who e.g. want to emit the ngProgram.
            this._analyzedModules = emptyModules;
            this.oldTsProgram = undefined;
            this._hostAdapter.isSourceFile = function () { return false; };
            this._tsProgram = ts.createProgram(this.rootNames, this.options, this.hostAdapter);
            if (compiler_1.isSyntaxError(e)) {
                this._addStructuralDiagnostics(e);
                return;
            }
            throw e;
        };
        AngularCompilerProgram.prototype._addStructuralDiagnostics = function (error) {
            var diagnostics = this._structuralDiagnostics || (this._structuralDiagnostics = []);
            if (compiler_1.isSyntaxError(error)) {
                diagnostics.push.apply(diagnostics, tslib_1.__spread(syntaxErrorToDiagnostics(error)));
            }
            else {
                diagnostics.push({
                    messageText: error.toString(),
                    category: ts.DiagnosticCategory.Error,
                    source: api_1.SOURCE,
                    code: api_1.DEFAULT_ERROR_CODE
                });
            }
        };
        // Note: this returns a ts.Diagnostic so that we
        // can return errors in a ts.EmitResult
        AngularCompilerProgram.prototype.generateFilesForEmit = function (emitFlags) {
            var _this = this;
            try {
                if (!(emitFlags & api_1.EmitFlags.Codegen)) {
                    return { genFiles: [], genDiags: [] };
                }
                // TODO(tbosch): allow generating files that are not in the rootDir
                // See https://github.com/angular/angular/issues/19337
                var genFiles = this.compiler.emitAllImpls(this.analyzedModules)
                    .filter(function (genFile) { return util_1.isInRootDir(genFile.genFileUrl, _this.options); });
                if (this.oldProgramEmittedGeneratedFiles) {
                    var oldProgramEmittedGeneratedFiles_1 = this.oldProgramEmittedGeneratedFiles;
                    genFiles = genFiles.filter(function (genFile) {
                        var oldGenFile = oldProgramEmittedGeneratedFiles_1.get(genFile.genFileUrl);
                        return !oldGenFile || !genFile.isEquivalent(oldGenFile);
                    });
                }
                return { genFiles: genFiles, genDiags: [] };
            }
            catch (e) {
                // TODO(tbosch): check whether we can actually have syntax errors here,
                // as we already parsed the metadata and templates before to create the type check block.
                if (compiler_1.isSyntaxError(e)) {
                    var genDiags = [{
                            file: undefined,
                            start: undefined,
                            length: undefined,
                            messageText: e.message,
                            category: ts.DiagnosticCategory.Error,
                            source: api_1.SOURCE,
                            code: api_1.DEFAULT_ERROR_CODE
                        }];
                    return { genFiles: [], genDiags: genDiags };
                }
                throw e;
            }
        };
        /**
         * Returns undefined if all files should be emitted.
         */
        AngularCompilerProgram.prototype.getSourceFilesForEmit = function () {
            var _this = this;
            // TODO(tbosch): if one of the files contains a `const enum`
            // always emit all files -> return undefined!
            var sourceFilesToEmit = this.tsProgram.getSourceFiles().filter(function (sf) {
                return !sf.isDeclarationFile && !util_1.GENERATED_FILES.test(sf.fileName);
            });
            if (this.oldProgramEmittedSourceFiles) {
                sourceFilesToEmit = sourceFilesToEmit.filter(function (sf) {
                    var oldFile = _this.oldProgramEmittedSourceFiles.get(sf.fileName);
                    return sf !== oldFile;
                });
            }
            return sourceFilesToEmit;
        };
        AngularCompilerProgram.prototype.writeFile = function (outFileName, outData, writeByteOrderMark, onError, genFile, sourceFiles) {
            // collect emittedLibrarySummaries
            var baseFile;
            if (genFile) {
                baseFile = this.tsProgram.getSourceFile(genFile.srcFileUrl);
                if (baseFile) {
                    if (!this.emittedLibrarySummaries) {
                        this.emittedLibrarySummaries = [];
                    }
                    if (genFile.genFileUrl.endsWith('.ngsummary.json') && baseFile.fileName.endsWith('.d.ts')) {
                        this.emittedLibrarySummaries.push({
                            fileName: baseFile.fileName,
                            text: baseFile.text,
                            sourceFile: baseFile,
                        });
                        this.emittedLibrarySummaries.push({ fileName: genFile.genFileUrl, text: outData });
                        if (!this.options.declaration) {
                            // If we don't emit declarations, still record an empty .ngfactory.d.ts file,
                            // as we might need it later on for resolving module names from summaries.
                            var ngFactoryDts = genFile.genFileUrl.substring(0, genFile.genFileUrl.length - 15) + '.ngfactory.d.ts';
                            this.emittedLibrarySummaries.push({ fileName: ngFactoryDts, text: '' });
                        }
                    }
                    else if (outFileName.endsWith('.d.ts') && baseFile.fileName.endsWith('.d.ts')) {
                        var dtsSourceFilePath = genFile.genFileUrl.replace(/\.ts$/, '.d.ts');
                        // Note: Don't use sourceFiles here as the created .d.ts has a path in the outDir,
                        // but we need one that is next to the .ts file
                        this.emittedLibrarySummaries.push({ fileName: dtsSourceFilePath, text: outData });
                    }
                }
            }
            // Filter out generated files for which we didn't generate code.
            // This can happen as the stub calculation is not completely exact.
            // Note: sourceFile refers to the .ngfactory.ts / .ngsummary.ts file
            // node_emitter_transform already set the file contents to be empty,
            //  so this code only needs to skip the file if !allowEmptyCodegenFiles.
            var isGenerated = util_1.GENERATED_FILES.test(outFileName);
            if (isGenerated && !this.options.allowEmptyCodegenFiles &&
                (!genFile || !genFile.stmts || genFile.stmts.length === 0)) {
                return;
            }
            if (baseFile) {
                sourceFiles = sourceFiles ? tslib_1.__spread(sourceFiles, [baseFile]) : [baseFile];
            }
            // TODO: remove any when TS 2.4 support is removed.
            this.host.writeFile(outFileName, outData, writeByteOrderMark, onError, sourceFiles);
        };
        return AngularCompilerProgram;
    }());
    function createProgram(_a) {
        var rootNames = _a.rootNames, options = _a.options, host = _a.host, oldProgram = _a.oldProgram;
        if (options.enableIvy !== false) {
            return new program_1.NgtscProgram(rootNames, options, host, oldProgram);
        }
        else {
            return new AngularCompilerProgram(rootNames, options, host, oldProgram);
        }
    }
    exports.createProgram = createProgram;
    // Compute the AotCompiler options
    function getAotCompilerOptions(options) {
        var missingTranslation = compiler_1.core.MissingTranslationStrategy.Warning;
        switch (options.i18nInMissingTranslations) {
            case 'ignore':
                missingTranslation = compiler_1.core.MissingTranslationStrategy.Ignore;
                break;
            case 'error':
                missingTranslation = compiler_1.core.MissingTranslationStrategy.Error;
                break;
        }
        var translations = '';
        if (options.i18nInFile) {
            if (!options.i18nInLocale) {
                throw new Error("The translation file (" + options.i18nInFile + ") locale must be provided.");
            }
            translations = fs.readFileSync(options.i18nInFile, 'utf8');
        }
        else {
            // No translations are provided, ignore any errors
            // We still go through i18n to remove i18n attributes
            missingTranslation = compiler_1.core.MissingTranslationStrategy.Ignore;
        }
        return {
            locale: options.i18nInLocale,
            i18nFormat: options.i18nInFormat || options.i18nOutFormat,
            i18nUseExternalIds: options.i18nUseExternalIds,
            translations: translations,
            missingTranslation: missingTranslation,
            enableSummariesForJit: options.enableSummariesForJit,
            preserveWhitespaces: options.preserveWhitespaces,
            fullTemplateTypeCheck: options.fullTemplateTypeCheck,
            allowEmptyCodegenFiles: options.allowEmptyCodegenFiles,
            enableIvy: options.enableIvy,
            createExternalSymbolFactoryReexports: options.createExternalSymbolFactoryReexports,
        };
    }
    function getNgOptionDiagnostics(options) {
        if (options.annotationsAs) {
            switch (options.annotationsAs) {
                case 'decorators':
                case 'static fields':
                    break;
                default:
                    return [{
                            messageText: 'Angular compiler options "annotationsAs" only supports "static fields" and "decorators"',
                            category: ts.DiagnosticCategory.Error,
                            source: api_1.SOURCE,
                            code: api_1.DEFAULT_ERROR_CODE
                        }];
            }
        }
        return [];
    }
    function normalizeSeparators(path) {
        return path.replace(/\\/g, '/');
    }
    /**
     * Returns a function that can adjust a path from source path to out path,
     * based on an existing mapping from source to out path.
     *
     * TODO(tbosch): talk to the TypeScript team to expose their logic for calculating the `rootDir`
     * if none was specified.
     *
     * Note: This function works on normalized paths from typescript but should always return
     * POSIX normalized paths for output paths.
     */
    function createSrcToOutPathMapper(outDir, sampleSrcFileName, sampleOutFileName, host) {
        if (host === void 0) { host = path; }
        if (outDir) {
            var path_1 = {}; // Ensure we error if we use `path` instead of `host`.
            if (sampleSrcFileName == null || sampleOutFileName == null) {
                throw new Error("Can't calculate the rootDir without a sample srcFileName / outFileName. ");
            }
            var srcFileDir = normalizeSeparators(host.dirname(sampleSrcFileName));
            var outFileDir = normalizeSeparators(host.dirname(sampleOutFileName));
            if (srcFileDir === outFileDir) {
                return function (srcFileName) { return srcFileName; };
            }
            // calculate the common suffix, stopping
            // at `outDir`.
            var srcDirParts = srcFileDir.split('/');
            var outDirParts = normalizeSeparators(host.relative(outDir, outFileDir)).split('/');
            var i = 0;
            while (i < Math.min(srcDirParts.length, outDirParts.length) &&
                srcDirParts[srcDirParts.length - 1 - i] === outDirParts[outDirParts.length - 1 - i])
                i++;
            var rootDir_1 = srcDirParts.slice(0, srcDirParts.length - i).join('/');
            return function (srcFileName) {
                // Note: Before we return the mapped output path, we need to normalize the path delimiters
                // because the output path is usually passed to TypeScript which sometimes only expects
                // posix normalized paths (e.g. if a custom compiler host is used)
                return normalizeSeparators(host.resolve(outDir, host.relative(rootDir_1, srcFileName)));
            };
        }
        else {
            // Note: Before we return the output path, we need to normalize the path delimiters because
            // the output path is usually passed to TypeScript which only passes around posix
            // normalized paths (e.g. if a custom compiler host is used)
            return function (srcFileName) { return normalizeSeparators(srcFileName); };
        }
    }
    exports.createSrcToOutPathMapper = createSrcToOutPathMapper;
    function i18nExtract(formatName, outFile, host, options, bundle) {
        formatName = formatName || 'xlf';
        // Checks the format and returns the extension
        var ext = i18nGetExtension(formatName);
        var content = i18nSerialize(bundle, formatName, options);
        var dstFile = outFile || "messages." + ext;
        var dstPath = path.resolve(options.outDir || options.basePath, dstFile);
        host.writeFile(dstPath, content, false, undefined, []);
        return [dstPath];
    }
    exports.i18nExtract = i18nExtract;
    function i18nSerialize(bundle, formatName, options) {
        var format = formatName.toLowerCase();
        var serializer;
        switch (format) {
            case 'xmb':
                serializer = new compiler_1.Xmb();
                break;
            case 'xliff2':
            case 'xlf2':
                serializer = new compiler_1.Xliff2();
                break;
            case 'xlf':
            case 'xliff':
            default:
                serializer = new compiler_1.Xliff();
        }
        return bundle.write(serializer, getPathNormalizer(options.basePath));
    }
    exports.i18nSerialize = i18nSerialize;
    function getPathNormalizer(basePath) {
        // normalize source paths by removing the base path and always using "/" as a separator
        return function (sourcePath) {
            sourcePath = basePath ? path.relative(basePath, sourcePath) : sourcePath;
            return sourcePath.split(path.sep).join('/');
        };
    }
    function i18nGetExtension(formatName) {
        var format = formatName.toLowerCase();
        switch (format) {
            case 'xmb':
                return 'xmb';
            case 'xlf':
            case 'xlif':
            case 'xliff':
            case 'xlf2':
            case 'xliff2':
                return 'xlf';
        }
        throw new Error("Unsupported format \"" + formatName + "\"");
    }
    exports.i18nGetExtension = i18nGetExtension;
    function mergeEmitResults(emitResults) {
        var e_3, _a;
        var diagnostics = [];
        var emitSkipped = false;
        var emittedFiles = [];
        try {
            for (var emitResults_1 = tslib_1.__values(emitResults), emitResults_1_1 = emitResults_1.next(); !emitResults_1_1.done; emitResults_1_1 = emitResults_1.next()) {
                var er = emitResults_1_1.value;
                diagnostics.push.apply(diagnostics, tslib_1.__spread(er.diagnostics));
                emitSkipped = emitSkipped || er.emitSkipped;
                emittedFiles.push.apply(emittedFiles, tslib_1.__spread((er.emittedFiles || [])));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (emitResults_1_1 && !emitResults_1_1.done && (_a = emitResults_1.return)) _a.call(emitResults_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return { diagnostics: diagnostics, emitSkipped: emitSkipped, emittedFiles: emittedFiles };
    }
    function diagnosticSourceOfSpan(span) {
        // For diagnostics, TypeScript only uses the fileName and text properties.
        // The redundant '()' are here is to avoid having clang-format breaking the line incorrectly.
        return { fileName: span.start.file.url, text: span.start.file.content };
    }
    function diagnosticSourceOfFileName(fileName, program) {
        var sourceFile = program.getSourceFile(fileName);
        if (sourceFile)
            return sourceFile;
        // If we are reporting diagnostics for a source file that is not in the project then we need
        // to fake a source file so the diagnostic formatting routines can emit the file name.
        // The redundant '()' are here is to avoid having clang-format breaking the line incorrectly.
        return { fileName: fileName, text: '' };
    }
    function diagnosticChainFromFormattedDiagnosticChain(chain) {
        return {
            messageText: chain.message,
            next: chain.next && chain.next.map(diagnosticChainFromFormattedDiagnosticChain),
            position: chain.position
        };
    }
    function syntaxErrorToDiagnostics(error) {
        var parserErrors = compiler_1.getParseErrors(error);
        if (parserErrors && parserErrors.length) {
            return parserErrors.map(function (e) { return ({
                messageText: e.contextualMessage(),
                file: diagnosticSourceOfSpan(e.span),
                start: e.span.start.offset,
                length: e.span.end.offset - e.span.start.offset,
                category: ts.DiagnosticCategory.Error,
                source: api_1.SOURCE,
                code: api_1.DEFAULT_ERROR_CODE
            }); });
        }
        else if (compiler_1.isFormattedError(error)) {
            return [{
                    messageText: error.message,
                    chain: error.chain && diagnosticChainFromFormattedDiagnosticChain(error.chain),
                    category: ts.DiagnosticCategory.Error,
                    source: api_1.SOURCE,
                    code: api_1.DEFAULT_ERROR_CODE,
                    position: error.position
                }];
        }
        // Produce a Diagnostic anyway since we know for sure `error` is a SyntaxError
        return [{
                messageText: error.message,
                category: ts.DiagnosticCategory.Error,
                code: api_1.DEFAULT_ERROR_CODE,
                source: api_1.SOURCE,
            }];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3JhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvdHJhbnNmb3JtZXJzL3Byb2dyYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUVILDhDQUFtVDtJQUNuVCx1QkFBeUI7SUFDekIsMkJBQTZCO0lBQzdCLCtCQUFpQztJQUVqQyxxR0FBMEU7SUFDMUUscUVBQXFFO0lBQ3JFLDhFQUFnRTtJQUNoRSxtRUFBOEM7SUFDOUMseUVBQTZEO0lBQzdELG1GQUF1RTtJQUV2RSxrRUFBbU87SUFDbk8sc0ZBQWdIO0lBQ2hILHdIQUFpRjtJQUNqRiw0RkFBMEc7SUFDMUcsOEZBQWtHO0lBQ2xHLHdGQUFvRTtJQUNwRSx3R0FBMkU7SUFDM0Usc0dBQXlFO0lBQ3pFLG9GQUFpRTtJQUNqRSxvRUFBZ0o7SUFHaEo7OztPQUdHO0lBQ0gsSUFBTSxtQ0FBbUMsR0FBRyxFQUFFLENBQUM7SUFHL0M7O09BRUc7SUFDSCxJQUFNLFlBQVksR0FBRyxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUU5RTs7T0FFRztJQUNILElBQU0sZUFBZSxvQkFBTyxZQUFZLEdBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsQ0FBQztJQUU3RTs7T0FFRztJQUNILElBQUkseUJBQXlCLEdBQXlDLElBQUksQ0FBQztJQUMzRSxTQUFnQiw0QkFBNEIsQ0FBQyxPQUFzQztRQUNqRix5QkFBeUIsR0FBRyxPQUFPLENBQUM7SUFDdEMsQ0FBQztJQUZELG9FQUVDO0lBQ0QsU0FBZ0IsOEJBQThCO1FBQzVDLHlCQUF5QixHQUFHLElBQUksQ0FBQztJQUNuQyxDQUFDO0lBRkQsd0VBRUM7SUFFRCxJQUFNLFlBQVksR0FBc0I7UUFDdEMsU0FBUyxFQUFFLEVBQUU7UUFDYix5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Q0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNwQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtnQkFDMUIsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO2dCQUMvQyxRQUFRLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUs7Z0JBQ3JDLE1BQU0sRUFBRSxZQUFNO2dCQUNkLElBQUksRUFBRSx3QkFBa0I7YUFDekIsQ0FBQyxFQVJHLENBUUgsQ0FBQyxDQUFDO1NBQ3pDO2FBQU0sSUFBSSwyQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQyxPQUFPLENBQUM7b0JBQ04sV0FBVyxFQUFFLEtBQUssQ0FBQyxPQUFPO29CQUMxQixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssSUFBSSwyQ0FBMkMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO29CQUM5RSxRQUFRLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUs7b0JBQ3JDLE1BQU0sRUFBRSxZQUFNO29CQUNkLElBQUksRUFBRSx3QkFBa0I7b0JBQ3hCLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTtpQkFDekIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCw4RUFBOEU7UUFDOUUsT0FBTyxDQUFDO2dCQUNOLFdBQVcsRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDMUIsUUFBUSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO2dCQUNyQyxJQUFJLEVBQUUsd0JBQWtCO2dCQUN4QixNQUFNLEVBQUUsWUFBTTthQUNmLENBQUMsQ0FBQztJQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdENvbXBpbGVyLCBBb3RDb21waWxlck9wdGlvbnMsIGNvcmUsIGNyZWF0ZUFvdENvbXBpbGVyLCBGb3JtYXR0ZWRNZXNzYWdlQ2hhaW4sIEdlbmVyYXRlZEZpbGUsIGdldFBhcnNlRXJyb3JzLCBpc0Zvcm1hdHRlZEVycm9yLCBpc1N5bnRheEVycm9yLCBNZXNzYWdlQnVuZGxlLCBOZ0FuYWx5emVkRmlsZVdpdGhJbmplY3RhYmxlcywgTmdBbmFseXplZE1vZHVsZXMsIFBhcnNlU291cmNlU3BhbiwgUGFydGlhbE1vZHVsZSwgU2VyaWFsaXplciwgWGxpZmYsIFhsaWZmMiwgWG1ifSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7dHJhbnNsYXRlRGlhZ25vc3RpY3N9IGZyb20gJy4uL2RpYWdub3N0aWNzL3RyYW5zbGF0ZV9kaWFnbm9zdGljcyc7XG5pbXBvcnQge2NyZWF0ZUJ1bmRsZUluZGV4SG9zdCwgTWV0YWRhdGFDb2xsZWN0b3J9IGZyb20gJy4uL21ldGFkYXRhJztcbmltcG9ydCB7aXNBbmd1bGFyQ29yZVBhY2thZ2V9IGZyb20gJy4uL25ndHNjL2NvcmUvc3JjL2NvbXBpbGVyJztcbmltcG9ydCB7Tmd0c2NQcm9ncmFtfSBmcm9tICcuLi9uZ3RzYy9wcm9ncmFtJztcbmltcG9ydCB7VHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0fSBmcm9tICcuLi9uZ3RzYy9yZWZsZWN0aW9uJztcbmltcG9ydCB7dmVyaWZ5U3VwcG9ydGVkVHlwZVNjcmlwdFZlcnNpb259IGZyb20gJy4uL3R5cGVzY3JpcHRfc3VwcG9ydCc7XG5cbmltcG9ydCB7Q29tcGlsZXJIb3N0LCBDb21waWxlck9wdGlvbnMsIEN1c3RvbVRyYW5zZm9ybWVycywgREVGQVVMVF9FUlJPUl9DT0RFLCBEaWFnbm9zdGljLCBEaWFnbm9zdGljTWVzc2FnZUNoYWluLCBFbWl0RmxhZ3MsIExhenlSb3V0ZSwgTGlicmFyeVN1bW1hcnksIFByb2dyYW0sIFNPVVJDRSwgVHNFbWl0Q2FsbGJhY2ssIFRzTWVyZ2VFbWl0UmVzdWx0c0NhbGxiYWNrfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQge0NvZGVHZW5lcmF0b3IsIGdldE9yaWdpbmFsUmVmZXJlbmNlcywgVHNDb21waWxlckFvdENvbXBpbGVyVHlwZUNoZWNrSG9zdEFkYXB0ZXJ9IGZyb20gJy4vY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2dldERvd25sZXZlbERlY29yYXRvcnNUcmFuc2Zvcm19IGZyb20gJy4vZG93bmxldmVsX2RlY29yYXRvcnNfdHJhbnNmb3JtJztcbmltcG9ydCB7Z2V0SW5saW5lUmVzb3VyY2VzVHJhbnNmb3JtRmFjdG9yeSwgSW5saW5lUmVzb3VyY2VzTWV0YWRhdGFUcmFuc2Zvcm1lcn0gZnJvbSAnLi9pbmxpbmVfcmVzb3VyY2VzJztcbmltcG9ydCB7Z2V0RXhwcmVzc2lvbkxvd2VyaW5nVHJhbnNmb3JtRmFjdG9yeSwgTG93ZXJNZXRhZGF0YVRyYW5zZm9ybX0gZnJvbSAnLi9sb3dlcl9leHByZXNzaW9ucyc7XG5pbXBvcnQge01ldGFkYXRhQ2FjaGUsIE1ldGFkYXRhVHJhbnNmb3JtZXJ9IGZyb20gJy4vbWV0YWRhdGFfY2FjaGUnO1xuaW1wb3J0IHtnZXRBbmd1bGFyRW1pdHRlclRyYW5zZm9ybUZhY3Rvcnl9IGZyb20gJy4vbm9kZV9lbWl0dGVyX3RyYW5zZm9ybSc7XG5pbXBvcnQge1BhcnRpYWxNb2R1bGVNZXRhZGF0YVRyYW5zZm9ybWVyfSBmcm9tICcuL3IzX21ldGFkYXRhX3RyYW5zZm9ybSc7XG5pbXBvcnQge2dldEFuZ3VsYXJDbGFzc1RyYW5zZm9ybWVyRmFjdG9yeX0gZnJvbSAnLi9yM190cmFuc2Zvcm0nO1xuaW1wb3J0IHtjcmVhdGVNZXNzYWdlRGlhZ25vc3RpYywgRFRTLCBHRU5FUkFURURfRklMRVMsIGlzSW5Sb290RGlyLCBuZ1RvVHNEaWFnbm9zdGljLCBTdHJ1Y3R1cmVJc1JldXNlZCwgVFMsIHRzU3RydWN0dXJlSXNSZXVzZWR9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBNYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0aGF0IGFyZSBlbWl0YWJsZSB2aWEgY2FsbGluZyB0cy5Qcm9ncmFtLmVtaXRcbiAqIHBhc3NpbmcgaW5kaXZpZHVhbCB0YXJnZXRTb3VyY2VGaWxlcy5cbiAqL1xuY29uc3QgTUFYX0ZJTEVfQ09VTlRfRk9SX1NJTkdMRV9GSUxFX0VNSVQgPSAyMDtcblxuXG4vKipcbiAqIEZpZWxkcyB0byBsb3dlciB3aXRoaW4gbWV0YWRhdGEgaW4gcmVuZGVyMiBtb2RlLlxuICovXG5jb25zdCBMT1dFUl9GSUVMRFMgPSBbJ3VzZVZhbHVlJywgJ3VzZUZhY3RvcnknLCAnZGF0YScsICdpZCcsICdsb2FkQ2hpbGRyZW4nXTtcblxuLyoqXG4gKiBGaWVsZHMgdG8gbG93ZXIgd2l0aGluIG1ldGFkYXRhIGluIHJlbmRlcjMgbW9kZS5cbiAqL1xuY29uc3QgUjNfTE9XRVJfRklFTERTID0gWy4uLkxPV0VSX0ZJRUxEUywgJ3Byb3ZpZGVycycsICdpbXBvcnRzJywgJ2V4cG9ydHMnXTtcblxuLyoqXG4gKiBJbnN0YWxscyBhIGhhbmRsZXIgZm9yIHRlc3RpbmcgcHVycG9zZXMgdG8gYWxsb3cgaW5zcGVjdGlvbiBvZiB0aGUgdGVtcG9yYXJ5IHByb2dyYW0uXG4gKi9cbmxldCB0ZW1wUHJvZ3JhbUhhbmRsZXJGb3JUZXN0OiAoKHByb2dyYW06IHRzLlByb2dyYW0pID0+IHZvaWQpfG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHNldFRlbXBQcm9ncmFtSGFuZGxlckZvclRlc3QoaGFuZGxlcjogKHByb2dyYW06IHRzLlByb2dyYW0pID0+IHZvaWQpOiB2b2lkIHtcbiAgdGVtcFByb2dyYW1IYW5kbGVyRm9yVGVzdCA9IGhhbmRsZXI7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVzZXRUZW1wUHJvZ3JhbUhhbmRsZXJGb3JUZXN0KCk6IHZvaWQge1xuICB0ZW1wUHJvZ3JhbUhhbmRsZXJGb3JUZXN0ID0gbnVsbDtcbn1cblxuY29uc3QgZW1wdHlNb2R1bGVzOiBOZ0FuYWx5emVkTW9kdWxlcyA9IHtcbiAgbmdNb2R1bGVzOiBbXSxcbiAgbmdNb2R1bGVCeVBpcGVPckRpcmVjdGl2ZTogbmV3IE1hcCgpLFxuICBmaWxlczogW11cbn07XG5cbmNvbnN0IGRlZmF1bHRFbWl0Q2FsbGJhY2s6IFRzRW1pdENhbGxiYWNrID0gKHtcbiAgcHJvZ3JhbSxcbiAgdGFyZ2V0U291cmNlRmlsZSxcbiAgd3JpdGVGaWxlLFxuICBjYW5jZWxsYXRpb25Ub2tlbixcbiAgZW1pdE9ubHlEdHNGaWxlcyxcbiAgY3VzdG9tVHJhbnNmb3JtZXJzXG59KSA9PlxuICAgIHByb2dyYW0uZW1pdChcbiAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgd3JpdGVGaWxlLCBjYW5jZWxsYXRpb25Ub2tlbiwgZW1pdE9ubHlEdHNGaWxlcywgY3VzdG9tVHJhbnNmb3JtZXJzKTtcblxuY2xhc3MgQW5ndWxhckNvbXBpbGVyUHJvZ3JhbSBpbXBsZW1lbnRzIFByb2dyYW0ge1xuICBwcml2YXRlIHJvb3ROYW1lczogc3RyaW5nW107XG4gIHByaXZhdGUgbWV0YWRhdGFDYWNoZTogTWV0YWRhdGFDYWNoZTtcbiAgLy8gTWV0YWRhdGEgY2FjaGUgdXNlZCBleGNsdXNpdmVseSBmb3IgdGhlIGZsYXQgbW9kdWxlIGluZGV4XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGZsYXRNb2R1bGVNZXRhZGF0YUNhY2hlITogTWV0YWRhdGFDYWNoZTtcbiAgcHJpdmF0ZSBsb3dlcmluZ01ldGFkYXRhVHJhbnNmb3JtOiBMb3dlck1ldGFkYXRhVHJhbnNmb3JtO1xuICBwcml2YXRlIG9sZFByb2dyYW1MaWJyYXJ5U3VtbWFyaWVzOiBNYXA8c3RyaW5nLCBMaWJyYXJ5U3VtbWFyeT58dW5kZWZpbmVkO1xuICBwcml2YXRlIG9sZFByb2dyYW1FbWl0dGVkR2VuZXJhdGVkRmlsZXM6IE1hcDxzdHJpbmcsIEdlbmVyYXRlZEZpbGU+fHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBvbGRQcm9ncmFtRW1pdHRlZFNvdXJjZUZpbGVzOiBNYXA8c3RyaW5nLCB0cy5Tb3VyY2VGaWxlPnx1bmRlZmluZWQ7XG4gIC8vIE5vdGU6IFRoaXMgd2lsbCBiZSBjbGVhcmVkIG91dCBhcyBzb29uIGFzIHdlIGNyZWF0ZSB0aGUgX3RzUHJvZ3JhbVxuICBwcml2YXRlIG9sZFRzUHJvZ3JhbTogdHMuUHJvZ3JhbXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgZW1pdHRlZExpYnJhcnlTdW1tYXJpZXM6IExpYnJhcnlTdW1tYXJ5W118dW5kZWZpbmVkO1xuICBwcml2YXRlIGVtaXR0ZWRHZW5lcmF0ZWRGaWxlczogR2VuZXJhdGVkRmlsZVtdfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBlbWl0dGVkU291cmNlRmlsZXM6IHRzLlNvdXJjZUZpbGVbXXx1bmRlZmluZWQ7XG5cbiAgLy8gTGF6aWx5IGluaXRpYWxpemVkIGZpZWxkc1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfY29tcGlsZXIhOiBBb3RDb21waWxlcjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX2hvc3RBZGFwdGVyITogVHNDb21waWxlckFvdENvbXBpbGVyVHlwZUNoZWNrSG9zdEFkYXB0ZXI7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIF90c1Byb2dyYW0hOiB0cy5Qcm9ncmFtO1xuICBwcml2YXRlIF9hbmFseXplZE1vZHVsZXM6IE5nQW5hbHl6ZWRNb2R1bGVzfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfYW5hbHl6ZWRJbmplY3RhYmxlczogTmdBbmFseXplZEZpbGVXaXRoSW5qZWN0YWJsZXNbXXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX3N0cnVjdHVyYWxEaWFnbm9zdGljczogRGlhZ25vc3RpY1tdfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfcHJvZ3JhbVdpdGhTdHViczogdHMuUHJvZ3JhbXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX29wdGlvbnNEaWFnbm9zdGljczogRGlhZ25vc3RpY1tdID0gW107XG4gIHByaXZhdGUgX3RyYW5zZm9ybVRzRGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcm9vdE5hbWVzOiBSZWFkb25seUFycmF5PHN0cmluZz4sIHByaXZhdGUgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgICAgcHJpdmF0ZSBob3N0OiBDb21waWxlckhvc3QsIG9sZFByb2dyYW0/OiBQcm9ncmFtKSB7XG4gICAgdGhpcy5yb290TmFtZXMgPSBbLi4ucm9vdE5hbWVzXTtcblxuICAgIGlmICghb3B0aW9ucy5kaXNhYmxlVHlwZVNjcmlwdFZlcnNpb25DaGVjaykge1xuICAgICAgdmVyaWZ5U3VwcG9ydGVkVHlwZVNjcmlwdFZlcnNpb24oKTtcbiAgICB9XG5cbiAgICB0aGlzLm9sZFRzUHJvZ3JhbSA9IG9sZFByb2dyYW0gPyBvbGRQcm9ncmFtLmdldFRzUHJvZ3JhbSgpIDogdW5kZWZpbmVkO1xuICAgIGlmIChvbGRQcm9ncmFtKSB7XG4gICAgICB0aGlzLm9sZFByb2dyYW1MaWJyYXJ5U3VtbWFyaWVzID0gb2xkUHJvZ3JhbS5nZXRMaWJyYXJ5U3VtbWFyaWVzKCk7XG4gICAgICB0aGlzLm9sZFByb2dyYW1FbWl0dGVkR2VuZXJhdGVkRmlsZXMgPSBvbGRQcm9ncmFtLmdldEVtaXR0ZWRHZW5lcmF0ZWRGaWxlcygpO1xuICAgICAgdGhpcy5vbGRQcm9ncmFtRW1pdHRlZFNvdXJjZUZpbGVzID0gb2xkUHJvZ3JhbS5nZXRFbWl0dGVkU291cmNlRmlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5mbGF0TW9kdWxlT3V0RmlsZSkge1xuICAgICAgY29uc3Qge2hvc3Q6IGJ1bmRsZUhvc3QsIGluZGV4TmFtZSwgZXJyb3JzfSA9XG4gICAgICAgICAgY3JlYXRlQnVuZGxlSW5kZXhIb3N0KG9wdGlvbnMsIHRoaXMucm9vdE5hbWVzLCBob3N0LCAoKSA9PiB0aGlzLmZsYXRNb2R1bGVNZXRhZGF0YUNhY2hlKTtcbiAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgdGhpcy5fb3B0aW9uc0RpYWdub3N0aWNzLnB1c2goLi4uZXJyb3JzLm1hcChlID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogZS5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUZXh0OiBlLm1lc3NhZ2VUZXh0IGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogU09VUkNFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogREVGQVVMVF9FUlJPUl9DT0RFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdE5hbWVzLnB1c2goaW5kZXhOYW1lISk7XG4gICAgICAgIHRoaXMuaG9zdCA9IGJ1bmRsZUhvc3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5sb3dlcmluZ01ldGFkYXRhVHJhbnNmb3JtID1cbiAgICAgICAgbmV3IExvd2VyTWV0YWRhdGFUcmFuc2Zvcm0ob3B0aW9ucy5lbmFibGVJdnkgIT09IGZhbHNlID8gUjNfTE9XRVJfRklFTERTIDogTE9XRVJfRklFTERTKTtcbiAgICB0aGlzLm1ldGFkYXRhQ2FjaGUgPSB0aGlzLmNyZWF0ZU1ldGFkYXRhQ2FjaGUoW3RoaXMubG93ZXJpbmdNZXRhZGF0YVRyYW5zZm9ybV0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVNZXRhZGF0YUNhY2hlKHRyYW5zZm9ybWVyczogTWV0YWRhdGFUcmFuc2Zvcm1lcltdKSB7XG4gICAgcmV0dXJuIG5ldyBNZXRhZGF0YUNhY2hlKFxuICAgICAgICBuZXcgTWV0YWRhdGFDb2xsZWN0b3Ioe3F1b3RlZE5hbWVzOiB0cnVlfSksICEhdGhpcy5vcHRpb25zLnN0cmljdE1ldGFkYXRhRW1pdCxcbiAgICAgICAgdHJhbnNmb3JtZXJzKTtcbiAgfVxuXG4gIGdldExpYnJhcnlTdW1tYXJpZXMoKTogTWFwPHN0cmluZywgTGlicmFyeVN1bW1hcnk+IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgTGlicmFyeVN1bW1hcnk+KCk7XG4gICAgaWYgKHRoaXMub2xkUHJvZ3JhbUxpYnJhcnlTdW1tYXJpZXMpIHtcbiAgICAgIHRoaXMub2xkUHJvZ3JhbUxpYnJhcnlTdW1tYXJpZXMuZm9yRWFjaCgoc3VtbWFyeSwgZmlsZU5hbWUpID0+IHJlc3VsdC5zZXQoZmlsZU5hbWUsIHN1bW1hcnkpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZW1pdHRlZExpYnJhcnlTdW1tYXJpZXMpIHtcbiAgICAgIHRoaXMuZW1pdHRlZExpYnJhcnlTdW1tYXJpZXMuZm9yRWFjaChcbiAgICAgICAgICAoc3VtbWFyeSwgZmlsZU5hbWUpID0+IHJlc3VsdC5zZXQoc3VtbWFyeS5maWxlTmFtZSwgc3VtbWFyeSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0RW1pdHRlZEdlbmVyYXRlZEZpbGVzKCk6IE1hcDxzdHJpbmcsIEdlbmVyYXRlZEZpbGU+IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgR2VuZXJhdGVkRmlsZT4oKTtcbiAgICBpZiAodGhpcy5vbGRQcm9ncmFtRW1pdHRlZEdlbmVyYXRlZEZpbGVzKSB7XG4gICAgICB0aGlzLm9sZFByb2dyYW1FbWl0dGVkR2VuZXJhdGVkRmlsZXMuZm9yRWFjaChcbiAgICAgICAgICAoZ2VuRmlsZSwgZmlsZU5hbWUpID0+IHJlc3VsdC5zZXQoZmlsZU5hbWUsIGdlbkZpbGUpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZW1pdHRlZEdlbmVyYXRlZEZpbGVzKSB7XG4gICAgICB0aGlzLmVtaXR0ZWRHZW5lcmF0ZWRGaWxlcy5mb3JFYWNoKChnZW5GaWxlKSA9PiByZXN1bHQuc2V0KGdlbkZpbGUuZ2VuRmlsZVVybCwgZ2VuRmlsZSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0RW1pdHRlZFNvdXJjZUZpbGVzKCk6IE1hcDxzdHJpbmcsIHRzLlNvdXJjZUZpbGU+IHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgdHMuU291cmNlRmlsZT4oKTtcbiAgICBpZiAodGhpcy5vbGRQcm9ncmFtRW1pdHRlZFNvdXJjZUZpbGVzKSB7XG4gICAgICB0aGlzLm9sZFByb2dyYW1FbWl0dGVkU291cmNlRmlsZXMuZm9yRWFjaCgoc2YsIGZpbGVOYW1lKSA9PiByZXN1bHQuc2V0KGZpbGVOYW1lLCBzZikpO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbWl0dGVkU291cmNlRmlsZXMpIHtcbiAgICAgIHRoaXMuZW1pdHRlZFNvdXJjZUZpbGVzLmZvckVhY2goKHNmKSA9PiByZXN1bHQuc2V0KHNmLmZpbGVOYW1lLCBzZikpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0VHNQcm9ncmFtKCk6IHRzLlByb2dyYW0ge1xuICAgIHJldHVybiB0aGlzLnRzUHJvZ3JhbTtcbiAgfVxuXG4gIGdldFRzT3B0aW9uRGlhZ25vc3RpY3MoY2FuY2VsbGF0aW9uVG9rZW4/OiB0cy5DYW5jZWxsYXRpb25Ub2tlbikge1xuICAgIHJldHVybiB0aGlzLnRzUHJvZ3JhbS5nZXRPcHRpb25zRGlhZ25vc3RpY3MoY2FuY2VsbGF0aW9uVG9rZW4pO1xuICB9XG5cbiAgZ2V0TmdPcHRpb25EaWFnbm9zdGljcyhjYW5jZWxsYXRpb25Ub2tlbj86IHRzLkNhbmNlbGxhdGlvblRva2VuKTogUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPiB7XG4gICAgcmV0dXJuIFsuLi50aGlzLl9vcHRpb25zRGlhZ25vc3RpY3MsIC4uLmdldE5nT3B0aW9uRGlhZ25vc3RpY3ModGhpcy5vcHRpb25zKV07XG4gIH1cblxuICBnZXRUc1N5bnRhY3RpY0RpYWdub3N0aWNzKHNvdXJjZUZpbGU/OiB0cy5Tb3VyY2VGaWxlLCBjYW5jZWxsYXRpb25Ub2tlbj86IHRzLkNhbmNlbGxhdGlvblRva2VuKTpcbiAgICAgIFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz4ge1xuICAgIHJldHVybiB0aGlzLnRzUHJvZ3JhbS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcyhzb3VyY2VGaWxlLCBjYW5jZWxsYXRpb25Ub2tlbik7XG4gIH1cblxuICBnZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcyhjYW5jZWxsYXRpb25Ub2tlbj86IHRzLkNhbmNlbGxhdGlvblRva2VuKTogUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPiB7XG4gICAgcmV0dXJuIHRoaXMuc3RydWN0dXJhbERpYWdub3N0aWNzO1xuICB9XG5cbiAgZ2V0VHNTZW1hbnRpY0RpYWdub3N0aWNzKHNvdXJjZUZpbGU/OiB0cy5Tb3VyY2VGaWxlLCBjYW5jZWxsYXRpb25Ub2tlbj86IHRzLkNhbmNlbGxhdGlvblRva2VuKTpcbiAgICAgIFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz4ge1xuICAgIGNvbnN0IHNvdXJjZUZpbGVzID0gc291cmNlRmlsZSA/IFtzb3VyY2VGaWxlXSA6IHRoaXMudHNQcm9ncmFtLmdldFNvdXJjZUZpbGVzKCk7XG4gICAgbGV0IGRpYWdzOiB0cy5EaWFnbm9zdGljW10gPSBbXTtcbiAgICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNmID0+IHtcbiAgICAgIGlmICghR0VORVJBVEVEX0ZJTEVTLnRlc3Qoc2YuZmlsZU5hbWUpKSB7XG4gICAgICAgIGRpYWdzLnB1c2goLi4udGhpcy50c1Byb2dyYW0uZ2V0U2VtYW50aWNEaWFnbm9zdGljcyhzZiwgY2FuY2VsbGF0aW9uVG9rZW4pKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGlhZ3M7XG4gIH1cblxuICBnZXROZ1NlbWFudGljRGlhZ25vc3RpY3MoZmlsZU5hbWU/OiBzdHJpbmcsIGNhbmNlbGxhdGlvblRva2VuPzogdHMuQ2FuY2VsbGF0aW9uVG9rZW4pOlxuICAgICAgUmVhZG9ubHlBcnJheTxEaWFnbm9zdGljPiB7XG4gICAgbGV0IGRpYWdzOiB0cy5EaWFnbm9zdGljW10gPSBbXTtcbiAgICB0aGlzLnRzUHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZvckVhY2goc2YgPT4ge1xuICAgICAgaWYgKEdFTkVSQVRFRF9GSUxFUy50ZXN0KHNmLmZpbGVOYW1lKSAmJiAhc2YuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgICAgZGlhZ3MucHVzaCguLi50aGlzLnRzUHJvZ3JhbS5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKHNmLCBjYW5jZWxsYXRpb25Ub2tlbikpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IHtuZ30gPSB0cmFuc2xhdGVEaWFnbm9zdGljcyh0aGlzLmhvc3RBZGFwdGVyLCBkaWFncyk7XG4gICAgcmV0dXJuIG5nO1xuICB9XG5cbiAgbG9hZE5nU3RydWN0dXJlQXN5bmMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2FuYWx5emVkTW9kdWxlcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbmd1bGFyIHN0cnVjdHVyZSBhbHJlYWR5IGxvYWRlZCcpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHt0bXBQcm9ncmFtLCBzb3VyY2VGaWxlcywgdHNGaWxlcywgcm9vdE5hbWVzfSA9IHRoaXMuX2NyZWF0ZVByb2dyYW1XaXRoQmFzaWNTdHVicygpO1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyLmxvYWRGaWxlc0FzeW5jKHNvdXJjZUZpbGVzLCB0c0ZpbGVzKVxuICAgICAgICAgICAgICAudGhlbigoe2FuYWx5emVkTW9kdWxlcywgYW5hbHl6ZWRJbmplY3RhYmxlc30pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5hbHl6ZWRNb2R1bGVzKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXIgc3RydWN0dXJlIGxvYWRlZCBib3RoIHN5bmNocm9ub3VzbHkgYW5kIGFzeW5jaHJvbm91c2x5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVByb2dyYW1XaXRoVHlwZUNoZWNrU3R1YnMoXG4gICAgICAgICAgICAgICAgICAgIHRtcFByb2dyYW0sIGFuYWx5emVkTW9kdWxlcywgYW5hbHl6ZWRJbmplY3RhYmxlcywgcm9vdE5hbWVzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlID0+IHRoaXMuX2NyZWF0ZVByb2dyYW1PbkVycm9yKGUpKTtcbiAgfVxuXG4gIGxpc3RMYXp5Um91dGVzKHJvdXRlPzogc3RyaW5nKTogTGF6eVJvdXRlW10ge1xuICAgIC8vIE5vdGU6IERvbid0IGFuYWx5emVkTW9kdWxlcyBpZiBhIHJvdXRlIGlzIGdpdmVuXG4gICAgLy8gdG8gYmUgZmFzdCBlbm91Z2guXG4gICAgcmV0dXJuIHRoaXMuY29tcGlsZXIubGlzdExhenlSb3V0ZXMocm91dGUsIHJvdXRlID8gdW5kZWZpbmVkIDogdGhpcy5hbmFseXplZE1vZHVsZXMpO1xuICB9XG5cbiAgZW1pdChwYXJhbWV0ZXJzOiB7XG4gICAgZW1pdEZsYWdzPzogRW1pdEZsYWdzLFxuICAgIGNhbmNlbGxhdGlvblRva2VuPzogdHMuQ2FuY2VsbGF0aW9uVG9rZW4sXG4gICAgY3VzdG9tVHJhbnNmb3JtZXJzPzogQ3VzdG9tVHJhbnNmb3JtZXJzLFxuICAgIGVtaXRDYWxsYmFjaz86IFRzRW1pdENhbGxiYWNrLFxuICAgIG1lcmdlRW1pdFJlc3VsdHNDYWxsYmFjaz86IFRzTWVyZ2VFbWl0UmVzdWx0c0NhbGxiYWNrLFxuICB9ID0ge30pOiB0cy5FbWl0UmVzdWx0IHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmVuYWJsZUl2eSAhPT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJ1biBsZWdhY3kgY29tcGlsZXIgaW4gbmd0c2MgbW9kZScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZW1pdFJlbmRlcjIocGFyYW1ldGVycyk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0UmVuZGVyMih7XG4gICAgZW1pdEZsYWdzID0gRW1pdEZsYWdzLkRlZmF1bHQsXG4gICAgY2FuY2VsbGF0aW9uVG9rZW4sXG4gICAgY3VzdG9tVHJhbnNmb3JtZXJzLFxuICAgIGVtaXRDYWxsYmFjayA9IGRlZmF1bHRFbWl0Q2FsbGJhY2ssXG4gICAgbWVyZ2VFbWl0UmVzdWx0c0NhbGxiYWNrID0gbWVyZ2VFbWl0UmVzdWx0cyxcbiAgfToge1xuICAgIGVtaXRGbGFncz86IEVtaXRGbGFncyxcbiAgICBjYW5jZWxsYXRpb25Ub2tlbj86IHRzLkNhbmNlbGxhdGlvblRva2VuLFxuICAgIGN1c3RvbVRyYW5zZm9ybWVycz86IEN1c3RvbVRyYW5zZm9ybWVycyxcbiAgICBlbWl0Q2FsbGJhY2s/OiBUc0VtaXRDYWxsYmFjayxcbiAgICBtZXJnZUVtaXRSZXN1bHRzQ2FsbGJhY2s/OiBUc01lcmdlRW1pdFJlc3VsdHNDYWxsYmFjayxcbiAgfSA9IHt9KTogdHMuRW1pdFJlc3VsdCB7XG4gICAgY29uc3QgZW1pdFN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoZW1pdEZsYWdzICYgRW1pdEZsYWdzLkkxOG5CdW5kbGUpIHtcbiAgICAgIGNvbnN0IGxvY2FsZSA9IHRoaXMub3B0aW9ucy5pMThuT3V0TG9jYWxlIHx8IG51bGw7XG4gICAgICBjb25zdCBmaWxlID0gdGhpcy5vcHRpb25zLmkxOG5PdXRGaWxlIHx8IG51bGw7XG4gICAgICBjb25zdCBmb3JtYXQgPSB0aGlzLm9wdGlvbnMuaTE4bk91dEZvcm1hdCB8fCBudWxsO1xuICAgICAgY29uc3QgYnVuZGxlID0gdGhpcy5jb21waWxlci5lbWl0TWVzc2FnZUJ1bmRsZSh0aGlzLmFuYWx5emVkTW9kdWxlcywgbG9jYWxlKTtcbiAgICAgIGkxOG5FeHRyYWN0KGZvcm1hdCwgZmlsZSwgdGhpcy5ob3N0LCB0aGlzLm9wdGlvbnMsIGJ1bmRsZSk7XG4gICAgfVxuICAgIGlmICgoZW1pdEZsYWdzICYgKEVtaXRGbGFncy5KUyB8IEVtaXRGbGFncy5EVFMgfCBFbWl0RmxhZ3MuTWV0YWRhdGEgfCBFbWl0RmxhZ3MuQ29kZWdlbikpID09PVxuICAgICAgICAwKSB7XG4gICAgICByZXR1cm4ge2VtaXRTa2lwcGVkOiB0cnVlLCBkaWFnbm9zdGljczogW10sIGVtaXR0ZWRGaWxlczogW119O1xuICAgIH1cbiAgICBsZXQge2dlbkZpbGVzLCBnZW5EaWFnc30gPSB0aGlzLmdlbmVyYXRlRmlsZXNGb3JFbWl0KGVtaXRGbGFncyk7XG4gICAgaWYgKGdlbkRpYWdzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGlhZ25vc3RpY3M6IGdlbkRpYWdzLFxuICAgICAgICBlbWl0U2tpcHBlZDogdHJ1ZSxcbiAgICAgICAgZW1pdHRlZEZpbGVzOiBbXSxcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMuZW1pdHRlZEdlbmVyYXRlZEZpbGVzID0gZ2VuRmlsZXM7XG4gICAgY29uc3Qgb3V0U3JjTWFwcGluZzogQXJyYXk8e3NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIG91dEZpbGVOYW1lOiBzdHJpbmd9PiA9IFtdO1xuICAgIGNvbnN0IGdlbkZpbGVCeUZpbGVOYW1lID0gbmV3IE1hcDxzdHJpbmcsIEdlbmVyYXRlZEZpbGU+KCk7XG4gICAgZ2VuRmlsZXMuZm9yRWFjaChnZW5GaWxlID0+IGdlbkZpbGVCeUZpbGVOYW1lLnNldChnZW5GaWxlLmdlbkZpbGVVcmwsIGdlbkZpbGUpKTtcbiAgICB0aGlzLmVtaXR0ZWRMaWJyYXJ5U3VtbWFyaWVzID0gW107XG4gICAgdGhpcy5fdHJhbnNmb3JtVHNEaWFnbm9zdGljcyA9IFtdO1xuICAgIGNvbnN0IGVtaXR0ZWRTb3VyY2VGaWxlcyA9IFtdIGFzIHRzLlNvdXJjZUZpbGVbXTtcbiAgICBjb25zdCB3cml0ZVRzRmlsZTogdHMuV3JpdGVGaWxlQ2FsbGJhY2sgPVxuICAgICAgICAob3V0RmlsZU5hbWUsIG91dERhdGEsIHdyaXRlQnl0ZU9yZGVyTWFyaywgb25FcnJvcj8sIHNvdXJjZUZpbGVzPykgPT4ge1xuICAgICAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBzb3VyY2VGaWxlcyAmJiBzb3VyY2VGaWxlcy5sZW5ndGggPT0gMSA/IHNvdXJjZUZpbGVzWzBdIDogbnVsbDtcbiAgICAgICAgICBsZXQgZ2VuRmlsZTogR2VuZXJhdGVkRmlsZXx1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHNvdXJjZUZpbGUpIHtcbiAgICAgICAgICAgIG91dFNyY01hcHBpbmcucHVzaCh7b3V0RmlsZU5hbWU6IG91dEZpbGVOYW1lLCBzb3VyY2VGaWxlfSk7XG4gICAgICAgICAgICBnZW5GaWxlID0gZ2VuRmlsZUJ5RmlsZU5hbWUuZ2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgICAgICAgaWYgKCFzb3VyY2VGaWxlLmlzRGVjbGFyYXRpb25GaWxlICYmICFHRU5FUkFURURfRklMRVMudGVzdChzb3VyY2VGaWxlLmZpbGVOYW1lKSkge1xuICAgICAgICAgICAgICAvLyBOb3RlOiBzb3VyY2VGaWxlIGlzIHRoZSB0cmFuc2Zvcm1lZCBzb3VyY2VmaWxlLCBub3QgdGhlIG9yaWdpbmFsIG9uZSFcbiAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxGaWxlID0gdGhpcy50c1Byb2dyYW0uZ2V0U291cmNlRmlsZShzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsRmlsZSkge1xuICAgICAgICAgICAgICAgIGVtaXR0ZWRTb3VyY2VGaWxlcy5wdXNoKG9yaWdpbmFsRmlsZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy53cml0ZUZpbGUob3V0RmlsZU5hbWUsIG91dERhdGEsIHdyaXRlQnl0ZU9yZGVyTWFyaywgb25FcnJvciwgZ2VuRmlsZSwgc291cmNlRmlsZXMpO1xuICAgICAgICB9O1xuXG4gICAgY29uc3QgbW9kdWxlcyA9IHRoaXMuX2FuYWx5emVkSW5qZWN0YWJsZXMgJiZcbiAgICAgICAgdGhpcy5jb21waWxlci5lbWl0QWxsUGFydGlhbE1vZHVsZXMyKHRoaXMuX2FuYWx5emVkSW5qZWN0YWJsZXMpO1xuXG4gICAgY29uc3QgdHNDdXN0b21UcmFuc2Zvcm1lcnMgPVxuICAgICAgICB0aGlzLmNhbGN1bGF0ZVRyYW5zZm9ybXMoZ2VuRmlsZUJ5RmlsZU5hbWUsIG1vZHVsZXMsIGN1c3RvbVRyYW5zZm9ybWVycyk7XG4gICAgY29uc3QgZW1pdE9ubHlEdHNGaWxlcyA9IChlbWl0RmxhZ3MgJiAoRW1pdEZsYWdzLkRUUyB8IEVtaXRGbGFncy5KUykpID09IEVtaXRGbGFncy5EVFM7XG4gICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcmVmZXJlbmNlcyBiZWZvcmUgd2UgZW1pdCBzbyBUeXBlU2NyaXB0IGRvZXNuJ3QgZW1pdFxuICAgIC8vIGEgcmVmZXJlbmNlIHRvIHRoZSAuZC50cyBmaWxlLlxuICAgIGNvbnN0IGF1Z21lbnRlZFJlZmVyZW5jZXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFJlYWRvbmx5QXJyYXk8dHMuRmlsZVJlZmVyZW5jZT4+KCk7XG4gICAgZm9yIChjb25zdCBzb3VyY2VGaWxlIG9mIHRoaXMudHNQcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkpIHtcbiAgICAgIGNvbnN0IG9yaWdpbmFsUmVmZXJlbmNlcyA9IGdldE9yaWdpbmFsUmVmZXJlbmNlcyhzb3VyY2VGaWxlKTtcbiAgICAgIGlmIChvcmlnaW5hbFJlZmVyZW5jZXMpIHtcbiAgICAgICAgYXVnbWVudGVkUmVmZXJlbmNlcy5zZXQoc291cmNlRmlsZSwgc291cmNlRmlsZS5yZWZlcmVuY2VkRmlsZXMpO1xuICAgICAgICBzb3VyY2VGaWxlLnJlZmVyZW5jZWRGaWxlcyA9IG9yaWdpbmFsUmVmZXJlbmNlcztcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZ2VuVHNGaWxlczogR2VuZXJhdGVkRmlsZVtdID0gW107XG4gICAgY29uc3QgZ2VuSnNvbkZpbGVzOiBHZW5lcmF0ZWRGaWxlW10gPSBbXTtcbiAgICBnZW5GaWxlcy5mb3JFYWNoKGdmID0+IHtcbiAgICAgIGlmIChnZi5zdG10cykge1xuICAgICAgICBnZW5Uc0ZpbGVzLnB1c2goZ2YpO1xuICAgICAgfVxuICAgICAgaWYgKGdmLnNvdXJjZSkge1xuICAgICAgICBnZW5Kc29uRmlsZXMucHVzaChnZik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbGV0IGVtaXRSZXN1bHQ6IHRzLkVtaXRSZXN1bHQ7XG4gICAgbGV0IGVtaXR0ZWRVc2VyVHNDb3VudDogbnVtYmVyO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlc1RvRW1pdCA9IHRoaXMuZ2V0U291cmNlRmlsZXNGb3JFbWl0KCk7XG4gICAgICBpZiAoc291cmNlRmlsZXNUb0VtaXQgJiZcbiAgICAgICAgICAoc291cmNlRmlsZXNUb0VtaXQubGVuZ3RoICsgZ2VuVHNGaWxlcy5sZW5ndGgpIDwgTUFYX0ZJTEVfQ09VTlRfRk9SX1NJTkdMRV9GSUxFX0VNSVQpIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWVzVG9FbWl0ID1cbiAgICAgICAgICAgIFsuLi5zb3VyY2VGaWxlc1RvRW1pdC5tYXAoc2YgPT4gc2YuZmlsZU5hbWUpLCAuLi5nZW5Uc0ZpbGVzLm1hcChnZiA9PiBnZi5nZW5GaWxlVXJsKV07XG4gICAgICAgIGVtaXRSZXN1bHQgPSBtZXJnZUVtaXRSZXN1bHRzQ2FsbGJhY2soXG4gICAgICAgICAgICBmaWxlTmFtZXNUb0VtaXQubWFwKChmaWxlTmFtZSkgPT4gZW1pdFJlc3VsdCA9IGVtaXRDYWxsYmFjayh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdGhpcy50c1Byb2dyYW0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdDogdGhpcy5ob3N0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cml0ZUZpbGU6IHdyaXRlVHNGaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXRPbmx5RHRzRmlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tVHJhbnNmb3JtZXJzOiB0c0N1c3RvbVRyYW5zZm9ybWVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlOiB0aGlzLnRzUHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgZW1pdHRlZFVzZXJUc0NvdW50ID0gc291cmNlRmlsZXNUb0VtaXQubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW1pdFJlc3VsdCA9IGVtaXRDYWxsYmFjayh7XG4gICAgICAgICAgcHJvZ3JhbTogdGhpcy50c1Byb2dyYW0sXG4gICAgICAgICAgaG9zdDogdGhpcy5ob3N0LFxuICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgICAgICB3cml0ZUZpbGU6IHdyaXRlVHNGaWxlLFxuICAgICAgICAgIGVtaXRPbmx5RHRzRmlsZXMsXG4gICAgICAgICAgY3VzdG9tVHJhbnNmb3JtZXJzOiB0c0N1c3RvbVRyYW5zZm9ybWVyc1xuICAgICAgICB9KTtcbiAgICAgICAgZW1pdHRlZFVzZXJUc0NvdW50ID0gdGhpcy50c1Byb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5sZW5ndGggLSBnZW5Uc0ZpbGVzLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gUmVzdG9yZSB0aGUgcmVmZXJlbmNlcyBiYWNrIHRvIHRoZSBhdWdtZW50ZWQgdmFsdWUgdG8gZW5zdXJlIHRoYXQgdGhlXG4gICAgICAvLyBjaGVja3MgdGhhdCBUeXBlU2NyaXB0IG1ha2VzIGZvciBwcm9qZWN0IHN0cnVjdHVyZSByZXVzZSB3aWxsIHN1Y2NlZWQuXG4gICAgICBmb3IgKGNvbnN0IFtzb3VyY2VGaWxlLCByZWZlcmVuY2VzXSBvZiBBcnJheS5mcm9tKGF1Z21lbnRlZFJlZmVyZW5jZXMpKSB7XG4gICAgICAgIC8vIFRPRE8oY2h1Y2tqKTogUmVtb3ZlIGFueSBjYXN0IGFmdGVyIHVwZGF0aW5nIGJ1aWxkIHRvIDIuNlxuICAgICAgICAoc291cmNlRmlsZSBhcyBhbnkpLnJlZmVyZW5jZWRGaWxlcyA9IHJlZmVyZW5jZXM7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZW1pdHRlZFNvdXJjZUZpbGVzID0gZW1pdHRlZFNvdXJjZUZpbGVzO1xuXG4gICAgLy8gTWF0Y2ggYmVoYXZpb3Igb2YgdHNjOiBvbmx5IHByb2R1Y2UgZW1pdCBkaWFnbm9zdGljcyBpZiBpdCB3b3VsZCBibG9ja1xuICAgIC8vIGVtaXQuIElmIG5vRW1pdE9uRXJyb3IgaXMgZmFsc2UsIHRoZSBlbWl0IHdpbGwgaGFwcGVuIGluIHNwaXRlIG9mIGFueVxuICAgIC8vIGVycm9ycywgc28gd2Ugc2hvdWxkIG5vdCByZXBvcnQgdGhlbS5cbiAgICBpZiAoZW1pdFJlc3VsdCAmJiB0aGlzLm9wdGlvbnMubm9FbWl0T25FcnJvciA9PT0gdHJ1ZSkge1xuICAgICAgLy8gdHJhbnNsYXRlIHRoZSBkaWFnbm9zdGljcyBpbiB0aGUgZW1pdFJlc3VsdCBhcyB3ZWxsLlxuICAgICAgY29uc3QgdHJhbnNsYXRlZEVtaXREaWFncyA9IHRyYW5zbGF0ZURpYWdub3N0aWNzKHRoaXMuaG9zdEFkYXB0ZXIsIGVtaXRSZXN1bHQuZGlhZ25vc3RpY3MpO1xuICAgICAgZW1pdFJlc3VsdC5kaWFnbm9zdGljcyA9IHRyYW5zbGF0ZWRFbWl0RGlhZ3MudHMuY29uY2F0KFxuICAgICAgICAgIHRoaXMuc3RydWN0dXJhbERpYWdub3N0aWNzLmNvbmNhdCh0cmFuc2xhdGVkRW1pdERpYWdzLm5nKS5tYXAobmdUb1RzRGlhZ25vc3RpYykpO1xuICAgIH1cblxuICAgIGlmIChlbWl0UmVzdWx0ICYmICFvdXRTcmNNYXBwaW5nLmxlbmd0aCkge1xuICAgICAgLy8gaWYgbm8gZmlsZXMgd2VyZSBlbWl0dGVkIGJ5IFR5cGVTY3JpcHQsIGFsc28gZG9uJ3QgZW1pdCAuanNvbiBmaWxlc1xuICAgICAgZW1pdFJlc3VsdC5kaWFnbm9zdGljcyA9XG4gICAgICAgICAgZW1pdFJlc3VsdC5kaWFnbm9zdGljcy5jb25jYXQoW2NyZWF0ZU1lc3NhZ2VEaWFnbm9zdGljKGBFbWl0dGVkIG5vIGZpbGVzLmApXSk7XG4gICAgICByZXR1cm4gZW1pdFJlc3VsdDtcbiAgICB9XG5cbiAgICBsZXQgc2FtcGxlU3JjRmlsZU5hbWU6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgbGV0IHNhbXBsZU91dEZpbGVOYW1lOiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGlmIChvdXRTcmNNYXBwaW5nLmxlbmd0aCkge1xuICAgICAgc2FtcGxlU3JjRmlsZU5hbWUgPSBvdXRTcmNNYXBwaW5nWzBdLnNvdXJjZUZpbGUuZmlsZU5hbWU7XG4gICAgICBzYW1wbGVPdXRGaWxlTmFtZSA9IG91dFNyY01hcHBpbmdbMF0ub3V0RmlsZU5hbWU7XG4gICAgfVxuICAgIGNvbnN0IHNyY1RvT3V0UGF0aCA9XG4gICAgICAgIGNyZWF0ZVNyY1RvT3V0UGF0aE1hcHBlcih0aGlzLm9wdGlvbnMub3V0RGlyLCBzYW1wbGVTcmNGaWxlTmFtZSwgc2FtcGxlT3V0RmlsZU5hbWUpO1xuICAgIGlmIChlbWl0RmxhZ3MgJiBFbWl0RmxhZ3MuQ29kZWdlbikge1xuICAgICAgZ2VuSnNvbkZpbGVzLmZvckVhY2goZ2YgPT4ge1xuICAgICAgICBjb25zdCBvdXRGaWxlTmFtZSA9IHNyY1RvT3V0UGF0aChnZi5nZW5GaWxlVXJsKTtcbiAgICAgICAgdGhpcy53cml0ZUZpbGUob3V0RmlsZU5hbWUsIGdmLnNvdXJjZSEsIGZhbHNlLCB1bmRlZmluZWQsIGdmKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBsZXQgbWV0YWRhdGFKc29uQ291bnQgPSAwO1xuICAgIGlmIChlbWl0RmxhZ3MgJiBFbWl0RmxhZ3MuTWV0YWRhdGEpIHtcbiAgICAgIHRoaXMudHNQcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZm9yRWFjaChzZiA9PiB7XG4gICAgICAgIGlmICghc2YuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIUdFTkVSQVRFRF9GSUxFUy50ZXN0KHNmLmZpbGVOYW1lKSkge1xuICAgICAgICAgIG1ldGFkYXRhSnNvbkNvdW50Kys7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLm1ldGFkYXRhQ2FjaGUuZ2V0TWV0YWRhdGEoc2YpO1xuICAgICAgICAgIGlmIChtZXRhZGF0YSkge1xuICAgICAgICAgICAgY29uc3QgbWV0YWRhdGFUZXh0ID0gSlNPTi5zdHJpbmdpZnkoW21ldGFkYXRhXSk7XG4gICAgICAgICAgICBjb25zdCBvdXRGaWxlTmFtZSA9IHNyY1RvT3V0UGF0aChzZi5maWxlTmFtZS5yZXBsYWNlKC9cXC50c3g/JC8sICcubWV0YWRhdGEuanNvbicpKTtcbiAgICAgICAgICAgIHRoaXMud3JpdGVGaWxlKG91dEZpbGVOYW1lLCBtZXRhZGF0YVRleHQsIGZhbHNlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgW3NmXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgZW1pdEVuZCA9IERhdGUubm93KCk7XG4gICAgaWYgKGVtaXRSZXN1bHQgJiYgdGhpcy5vcHRpb25zLmRpYWdub3N0aWNzKSB7XG4gICAgICBlbWl0UmVzdWx0LmRpYWdub3N0aWNzID0gZW1pdFJlc3VsdC5kaWFnbm9zdGljcy5jb25jYXQoW2NyZWF0ZU1lc3NhZ2VEaWFnbm9zdGljKFtcbiAgICAgICAgYEVtaXR0ZWQgaW4gJHtlbWl0RW5kIC0gZW1pdFN0YXJ0fW1zYCxcbiAgICAgICAgYC0gJHtlbWl0dGVkVXNlclRzQ291bnR9IHVzZXIgdHMgZmlsZXNgLFxuICAgICAgICBgLSAke2dlblRzRmlsZXMubGVuZ3RofSBnZW5lcmF0ZWQgdHMgZmlsZXNgLFxuICAgICAgICBgLSAke2dlbkpzb25GaWxlcy5sZW5ndGggKyBtZXRhZGF0YUpzb25Db3VudH0gZ2VuZXJhdGVkIGpzb24gZmlsZXNgLFxuICAgICAgXS5qb2luKCdcXG4nKSldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW1pdFJlc3VsdDtcbiAgfVxuXG4gIC8vIFByaXZhdGUgbWVtYmVyc1xuICBwcml2YXRlIGdldCBjb21waWxlcigpOiBBb3RDb21waWxlciB7XG4gICAgaWYgKCF0aGlzLl9jb21waWxlcikge1xuICAgICAgdGhpcy5fY3JlYXRlQ29tcGlsZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVyITtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGhvc3RBZGFwdGVyKCk6IFRzQ29tcGlsZXJBb3RDb21waWxlclR5cGVDaGVja0hvc3RBZGFwdGVyIHtcbiAgICBpZiAoIXRoaXMuX2hvc3RBZGFwdGVyKSB7XG4gICAgICB0aGlzLl9jcmVhdGVDb21waWxlcigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faG9zdEFkYXB0ZXIhO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgYW5hbHl6ZWRNb2R1bGVzKCk6IE5nQW5hbHl6ZWRNb2R1bGVzIHtcbiAgICBpZiAoIXRoaXMuX2FuYWx5emVkTW9kdWxlcykge1xuICAgICAgdGhpcy5pbml0U3luYygpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYW5hbHl6ZWRNb2R1bGVzITtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHN0cnVjdHVyYWxEaWFnbm9zdGljcygpOiBSZWFkb25seUFycmF5PERpYWdub3N0aWM+IHtcbiAgICBsZXQgZGlhZ25vc3RpY3MgPSB0aGlzLl9zdHJ1Y3R1cmFsRGlhZ25vc3RpY3M7XG4gICAgaWYgKCFkaWFnbm9zdGljcykge1xuICAgICAgdGhpcy5pbml0U3luYygpO1xuICAgICAgZGlhZ25vc3RpY3MgPSAodGhpcy5fc3RydWN0dXJhbERpYWdub3N0aWNzID0gdGhpcy5fc3RydWN0dXJhbERpYWdub3N0aWNzIHx8IFtdKTtcbiAgICB9XG4gICAgcmV0dXJuIGRpYWdub3N0aWNzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgdHNQcm9ncmFtKCk6IHRzLlByb2dyYW0ge1xuICAgIGlmICghdGhpcy5fdHNQcm9ncmFtKSB7XG4gICAgICB0aGlzLmluaXRTeW5jKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90c1Byb2dyYW0hO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHByb2dyYW0gaXMgY29tcGlsaW5nIHRoZSBBbmd1bGFyIGNvcmUgcGFja2FnZS4gKi9cbiAgcHJpdmF0ZSBnZXQgaXNDb21waWxpbmdBbmd1bGFyQ29yZSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5faXNDb21waWxpbmdBbmd1bGFyQ29yZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzQ29tcGlsaW5nQW5ndWxhckNvcmU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pc0NvbXBpbGluZ0FuZ3VsYXJDb3JlID0gaXNBbmd1bGFyQ29yZVBhY2thZ2UodGhpcy50c1Byb2dyYW0pO1xuICB9XG4gIHByaXZhdGUgX2lzQ29tcGlsaW5nQW5ndWxhckNvcmU6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVUcmFuc2Zvcm1zKFxuICAgICAgZ2VuRmlsZXM6IE1hcDxzdHJpbmcsIEdlbmVyYXRlZEZpbGU+fHVuZGVmaW5lZCwgcGFydGlhbE1vZHVsZXM6IFBhcnRpYWxNb2R1bGVbXXx1bmRlZmluZWQsXG4gICAgICBjdXN0b21UcmFuc2Zvcm1lcnM/OiBDdXN0b21UcmFuc2Zvcm1lcnMpOiB0cy5DdXN0b21UcmFuc2Zvcm1lcnMge1xuICAgIGNvbnN0IGJlZm9yZVRzOiBBcnJheTx0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4+ID0gW107XG4gICAgY29uc3QgbWV0YWRhdGFUcmFuc2Zvcm1zOiBNZXRhZGF0YVRyYW5zZm9ybWVyW10gPSBbXTtcbiAgICBjb25zdCBmbGF0TW9kdWxlTWV0YWRhdGFUcmFuc2Zvcm1zOiBNZXRhZGF0YVRyYW5zZm9ybWVyW10gPSBbXTtcbiAgICBjb25zdCBhbm5vdGF0ZUZvckNsb3N1cmVDb21waWxlciA9IHRoaXMub3B0aW9ucy5hbm5vdGF0ZUZvckNsb3N1cmVDb21waWxlciB8fCBmYWxzZTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlUmVzb3VyY2VJbmxpbmluZykge1xuICAgICAgYmVmb3JlVHMucHVzaChnZXRJbmxpbmVSZXNvdXJjZXNUcmFuc2Zvcm1GYWN0b3J5KHRoaXMudHNQcm9ncmFtLCB0aGlzLmhvc3RBZGFwdGVyKSk7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBJbmxpbmVSZXNvdXJjZXNNZXRhZGF0YVRyYW5zZm9ybWVyKHRoaXMuaG9zdEFkYXB0ZXIpO1xuICAgICAgbWV0YWRhdGFUcmFuc2Zvcm1zLnB1c2godHJhbnNmb3JtZXIpO1xuICAgICAgZmxhdE1vZHVsZU1ldGFkYXRhVHJhbnNmb3Jtcy5wdXNoKHRyYW5zZm9ybWVyKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlRXhwcmVzc2lvbkxvd2VyaW5nKSB7XG4gICAgICBiZWZvcmVUcy5wdXNoKFxuICAgICAgICAgIGdldEV4cHJlc3Npb25Mb3dlcmluZ1RyYW5zZm9ybUZhY3RvcnkodGhpcy5sb3dlcmluZ01ldGFkYXRhVHJhbnNmb3JtLCB0aGlzLnRzUHJvZ3JhbSkpO1xuICAgICAgbWV0YWRhdGFUcmFuc2Zvcm1zLnB1c2godGhpcy5sb3dlcmluZ01ldGFkYXRhVHJhbnNmb3JtKTtcbiAgICB9XG4gICAgaWYgKGdlbkZpbGVzKSB7XG4gICAgICBiZWZvcmVUcy5wdXNoKGdldEFuZ3VsYXJFbWl0dGVyVHJhbnNmb3JtRmFjdG9yeShcbiAgICAgICAgICBnZW5GaWxlcywgdGhpcy5nZXRUc1Byb2dyYW0oKSwgYW5ub3RhdGVGb3JDbG9zdXJlQ29tcGlsZXIpKTtcbiAgICB9XG4gICAgaWYgKHBhcnRpYWxNb2R1bGVzKSB7XG4gICAgICBiZWZvcmVUcy5wdXNoKGdldEFuZ3VsYXJDbGFzc1RyYW5zZm9ybWVyRmFjdG9yeShwYXJ0aWFsTW9kdWxlcywgYW5ub3RhdGVGb3JDbG9zdXJlQ29tcGlsZXIpKTtcblxuICAgICAgLy8gSWYgd2UgaGF2ZSBwYXJ0aWFsIG1vZHVsZXMsIHRoZSBjYWNoZWQgbWV0YWRhdGEgbWlnaHQgYmUgaW5jb3JyZWN0IGFzIGl0IGRvZXNuJ3QgcmVmbGVjdFxuICAgICAgLy8gdGhlIHBhcnRpYWwgbW9kdWxlIHRyYW5zZm9ybXMuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBQYXJ0aWFsTW9kdWxlTWV0YWRhdGFUcmFuc2Zvcm1lcihwYXJ0aWFsTW9kdWxlcyk7XG4gICAgICBtZXRhZGF0YVRyYW5zZm9ybXMucHVzaCh0cmFuc2Zvcm1lcik7XG4gICAgICBmbGF0TW9kdWxlTWV0YWRhdGFUcmFuc2Zvcm1zLnB1c2godHJhbnNmb3JtZXIpO1xuICAgIH1cblxuICAgIGlmIChjdXN0b21UcmFuc2Zvcm1lcnMgJiYgY3VzdG9tVHJhbnNmb3JtZXJzLmJlZm9yZVRzKSB7XG4gICAgICBiZWZvcmVUcy5wdXNoKC4uLmN1c3RvbVRyYW5zZm9ybWVycy5iZWZvcmVUcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgZGVjb3JhdG9ycyBzaG91bGQgYmUgY29udmVydGVkIHRvIHN0YXRpYyBmaWVsZHMgKGVuYWJsZWQgYnkgZGVmYXVsdCksIHdlIHNldCB1cFxuICAgIC8vIHRoZSBkZWNvcmF0b3IgZG93bmxldmVsIHRyYW5zZm9ybS4gTm90ZSB0aGF0IHdlIHNldCBpdCB1cCBhcyBsYXN0IHRyYW5zZm9ybSBhcyB0aGF0XG4gICAgLy8gYWxsb3dzIGN1c3RvbSB0cmFuc2Zvcm1lcnMgdG8gc3RyaXAgQW5ndWxhciBkZWNvcmF0b3JzIHdpdGhvdXQgaGF2aW5nIHRvIGRlYWwgd2l0aFxuICAgIC8vIGlkZW50aWZ5aW5nIHN0YXRpYyBwcm9wZXJ0aWVzLiBlLmcuIGl0J3MgbW9yZSBkaWZmaWN1bHQgaGFuZGxpbmcgYDwuLj4uZGVjb3JhdG9yc2BcbiAgICAvLyBvciBgPC4uPi5jdG9yUGFyYW1ldGVyc2AgY29tcGFyZWQgdG8gdGhlIGB0cy5EZWNvcmF0b3JgIEFTVCBub2Rlcy5cbiAgICBpZiAodGhpcy5vcHRpb25zLmFubm90YXRpb25zQXMgIT09ICdkZWNvcmF0b3JzJykge1xuICAgICAgY29uc3QgdHlwZUNoZWNrZXIgPSB0aGlzLmdldFRzUHJvZ3JhbSgpLmdldFR5cGVDaGVja2VyKCk7XG4gICAgICBjb25zdCByZWZsZWN0aW9uSG9zdCA9IG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpO1xuICAgICAgLy8gU2ltaWxhcmx5IHRvIGhvdyB3ZSBoYW5kbGVkIHRzaWNrbGUgZGVjb3JhdG9yIGRvd25sZXZlbGluZyBpbiB0aGUgcGFzdCwgd2UganVzdFxuICAgICAgLy8gaWdub3JlIGRpYWdub3N0aWNzIHRoYXQgaGF2ZSBiZWVuIGNvbGxlY3RlZCBieSB0aGUgdHJhbnNmb3JtZXIuIFRoZXNlIGFyZVxuICAgICAgLy8gbm9uLXNpZ25pZmljYW50IGZhaWx1cmVzIHRoYXQgc2hvdWxkbid0IHByZXZlbnQgYXBwcyBmcm9tIGNvbXBpbGluZy5cbiAgICAgIGJlZm9yZVRzLnB1c2goZ2V0RG93bmxldmVsRGVjb3JhdG9yc1RyYW5zZm9ybShcbiAgICAgICAgICB0eXBlQ2hlY2tlciwgcmVmbGVjdGlvbkhvc3QsIFtdLCB0aGlzLmlzQ29tcGlsaW5nQW5ndWxhckNvcmUsIGFubm90YXRlRm9yQ2xvc3VyZUNvbXBpbGVyLFxuICAgICAgICAgIC8qIHNraXBDbGFzc0RlY29yYXRvcnMgKi8gZmFsc2UpKTtcbiAgICB9XG5cbiAgICBpZiAobWV0YWRhdGFUcmFuc2Zvcm1zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMubWV0YWRhdGFDYWNoZSA9IHRoaXMuY3JlYXRlTWV0YWRhdGFDYWNoZShtZXRhZGF0YVRyYW5zZm9ybXMpO1xuICAgIH1cbiAgICBpZiAoZmxhdE1vZHVsZU1ldGFkYXRhVHJhbnNmb3Jtcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmZsYXRNb2R1bGVNZXRhZGF0YUNhY2hlID0gdGhpcy5jcmVhdGVNZXRhZGF0YUNhY2hlKGZsYXRNb2R1bGVNZXRhZGF0YVRyYW5zZm9ybXMpO1xuICAgIH1cbiAgICBjb25zdCBhZnRlclRzID0gY3VzdG9tVHJhbnNmb3JtZXJzID8gY3VzdG9tVHJhbnNmb3JtZXJzLmFmdGVyVHMgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHtiZWZvcmU6IGJlZm9yZVRzLCBhZnRlcjogYWZ0ZXJUc307XG4gIH1cblxuICBwcml2YXRlIGluaXRTeW5jKCkge1xuICAgIGlmICh0aGlzLl9hbmFseXplZE1vZHVsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHt0bXBQcm9ncmFtLCBzb3VyY2VGaWxlcywgdHNGaWxlcywgcm9vdE5hbWVzfSA9IHRoaXMuX2NyZWF0ZVByb2dyYW1XaXRoQmFzaWNTdHVicygpO1xuICAgICAgY29uc3Qge2FuYWx5emVkTW9kdWxlcywgYW5hbHl6ZWRJbmplY3RhYmxlc30gPVxuICAgICAgICAgIHRoaXMuY29tcGlsZXIubG9hZEZpbGVzU3luYyhzb3VyY2VGaWxlcywgdHNGaWxlcyk7XG4gICAgICB0aGlzLl91cGRhdGVQcm9ncmFtV2l0aFR5cGVDaGVja1N0dWJzKFxuICAgICAgICAgIHRtcFByb2dyYW0sIGFuYWx5emVkTW9kdWxlcywgYW5hbHl6ZWRJbmplY3RhYmxlcywgcm9vdE5hbWVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLl9jcmVhdGVQcm9ncmFtT25FcnJvcihlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb21waWxlcigpIHtcbiAgICBjb25zdCBjb2RlZ2VuOiBDb2RlR2VuZXJhdG9yID0ge1xuICAgICAgZ2VuZXJhdGVGaWxlOiAoZ2VuRmlsZU5hbWUsIGJhc2VGaWxlTmFtZSkgPT5cbiAgICAgICAgICB0aGlzLl9jb21waWxlci5lbWl0QmFzaWNTdHViKGdlbkZpbGVOYW1lLCBiYXNlRmlsZU5hbWUpLFxuICAgICAgZmluZEdlbmVyYXRlZEZpbGVOYW1lczogKGZpbGVOYW1lKSA9PiB0aGlzLl9jb21waWxlci5maW5kR2VuZXJhdGVkRmlsZU5hbWVzKGZpbGVOYW1lKSxcbiAgICB9O1xuXG4gICAgdGhpcy5faG9zdEFkYXB0ZXIgPSBuZXcgVHNDb21waWxlckFvdENvbXBpbGVyVHlwZUNoZWNrSG9zdEFkYXB0ZXIoXG4gICAgICAgIHRoaXMucm9vdE5hbWVzLCB0aGlzLm9wdGlvbnMsIHRoaXMuaG9zdCwgdGhpcy5tZXRhZGF0YUNhY2hlLCBjb2RlZ2VuLFxuICAgICAgICB0aGlzLm9sZFByb2dyYW1MaWJyYXJ5U3VtbWFyaWVzKTtcbiAgICBjb25zdCBhb3RPcHRpb25zID0gZ2V0QW90Q29tcGlsZXJPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgY29uc3QgZXJyb3JDb2xsZWN0b3IgPSAodGhpcy5vcHRpb25zLmNvbGxlY3RBbGxFcnJvcnMgfHwgdGhpcy5vcHRpb25zLmZ1bGxUZW1wbGF0ZVR5cGVDaGVjaykgP1xuICAgICAgICAoZXJyOiBhbnkpID0+IHRoaXMuX2FkZFN0cnVjdHVyYWxEaWFnbm9zdGljcyhlcnIpIDpcbiAgICAgICAgdW5kZWZpbmVkO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gY3JlYXRlQW90Q29tcGlsZXIodGhpcy5faG9zdEFkYXB0ZXIsIGFvdE9wdGlvbnMsIGVycm9yQ29sbGVjdG9yKS5jb21waWxlcjtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVByb2dyYW1XaXRoQmFzaWNTdHVicygpOiB7XG4gICAgdG1wUHJvZ3JhbTogdHMuUHJvZ3JhbSxcbiAgICByb290TmFtZXM6IHN0cmluZ1tdLFxuICAgIHNvdXJjZUZpbGVzOiBzdHJpbmdbXSxcbiAgICB0c0ZpbGVzOiBzdHJpbmdbXSxcbiAgfSB7XG4gICAgaWYgKHRoaXMuX2FuYWx5emVkTW9kdWxlcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnRlcm5hbCBFcnJvcjogYWxyZWFkeSBpbml0aWFsaXplZCFgKTtcbiAgICB9XG4gICAgLy8gTm90ZTogVGhpcyBpcyBpbXBvcnRhbnQgdG8gbm90IHByb2R1Y2UgYSBtZW1vcnkgbGVhayFcbiAgICBjb25zdCBvbGRUc1Byb2dyYW0gPSB0aGlzLm9sZFRzUHJvZ3JhbTtcbiAgICB0aGlzLm9sZFRzUHJvZ3JhbSA9IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGNvZGVnZW46IENvZGVHZW5lcmF0b3IgPSB7XG4gICAgICBnZW5lcmF0ZUZpbGU6IChnZW5GaWxlTmFtZSwgYmFzZUZpbGVOYW1lKSA9PlxuICAgICAgICAgIHRoaXMuY29tcGlsZXIuZW1pdEJhc2ljU3R1YihnZW5GaWxlTmFtZSwgYmFzZUZpbGVOYW1lKSxcbiAgICAgIGZpbmRHZW5lcmF0ZWRGaWxlTmFtZXM6IChmaWxlTmFtZSkgPT4gdGhpcy5jb21waWxlci5maW5kR2VuZXJhdGVkRmlsZU5hbWVzKGZpbGVOYW1lKSxcbiAgICB9O1xuXG5cbiAgICBsZXQgcm9vdE5hbWVzID0gWy4uLnRoaXMucm9vdE5hbWVzXTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmdlbmVyYXRlQ29kZUZvckxpYnJhcmllcyAhPT0gZmFsc2UpIHtcbiAgICAgIC8vIGlmIHdlIHNob3VsZCBnZW5lcmF0ZUNvZGVGb3JMaWJyYXJpZXMsIG5ldmVyIGluY2x1ZGVcbiAgICAgIC8vIGdlbmVyYXRlZCBmaWxlcyBpbiB0aGUgcHJvZ3JhbSBhcyBvdGhlcndpc2Ugd2Ugd2lsbFxuICAgICAgLy8gb3ZlcndyaXRlIHRoZW0gYW5kIHR5cGVzY3JpcHQgd2lsbCByZXBvcnQgdGhlIGVycm9yXG4gICAgICAvLyBUUzUwNTU6IENhbm5vdCB3cml0ZSBmaWxlIC4uLiBiZWNhdXNlIGl0IHdvdWxkIG92ZXJ3cml0ZSBpbnB1dCBmaWxlLlxuICAgICAgcm9vdE5hbWVzID0gcm9vdE5hbWVzLmZpbHRlcihmbiA9PiAhR0VORVJBVEVEX0ZJTEVTLnRlc3QoZm4pKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5ub1Jlc29sdmUpIHtcbiAgICAgIHRoaXMucm9vdE5hbWVzLmZvckVhY2gocm9vdE5hbWUgPT4ge1xuICAgICAgICBpZiAodGhpcy5ob3N0QWRhcHRlci5zaG91bGRHZW5lcmF0ZUZpbGVzRm9yKHJvb3ROYW1lKSkge1xuICAgICAgICAgIHJvb3ROYW1lcy5wdXNoKC4uLnRoaXMuY29tcGlsZXIuZmluZEdlbmVyYXRlZEZpbGVOYW1lcyhyb290TmFtZSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0bXBQcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShyb290TmFtZXMsIHRoaXMub3B0aW9ucywgdGhpcy5ob3N0QWRhcHRlciwgb2xkVHNQcm9ncmFtKTtcbiAgICBpZiAodGVtcFByb2dyYW1IYW5kbGVyRm9yVGVzdCAhPT0gbnVsbCkge1xuICAgICAgdGVtcFByb2dyYW1IYW5kbGVyRm9yVGVzdCh0bXBQcm9ncmFtKTtcbiAgICB9XG4gICAgY29uc3Qgc291cmNlRmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdHNGaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICB0bXBQcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZm9yRWFjaChzZiA9PiB7XG4gICAgICBpZiAodGhpcy5ob3N0QWRhcHRlci5pc1NvdXJjZUZpbGUoc2YuZmlsZU5hbWUpKSB7XG4gICAgICAgIHNvdXJjZUZpbGVzLnB1c2goc2YuZmlsZU5hbWUpO1xuICAgICAgfVxuICAgICAgaWYgKFRTLnRlc3Qoc2YuZmlsZU5hbWUpICYmICFEVFMudGVzdChzZi5maWxlTmFtZSkpIHtcbiAgICAgICAgdHNGaWxlcy5wdXNoKHNmLmZpbGVOYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge3RtcFByb2dyYW0sIHNvdXJjZUZpbGVzLCB0c0ZpbGVzLCByb290TmFtZXN9O1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlUHJvZ3JhbVdpdGhUeXBlQ2hlY2tTdHVicyhcbiAgICAgIHRtcFByb2dyYW06IHRzLlByb2dyYW0sIGFuYWx5emVkTW9kdWxlczogTmdBbmFseXplZE1vZHVsZXMsXG4gICAgICBhbmFseXplZEluamVjdGFibGVzOiBOZ0FuYWx5emVkRmlsZVdpdGhJbmplY3RhYmxlc1tdLCByb290TmFtZXM6IHN0cmluZ1tdKSB7XG4gICAgdGhpcy5fYW5hbHl6ZWRNb2R1bGVzID0gYW5hbHl6ZWRNb2R1bGVzO1xuICAgIHRoaXMuX2FuYWx5emVkSW5qZWN0YWJsZXMgPSBhbmFseXplZEluamVjdGFibGVzO1xuICAgIHRtcFByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5mb3JFYWNoKHNmID0+IHtcbiAgICAgIGlmIChzZi5maWxlTmFtZS5lbmRzV2l0aCgnLm5nZmFjdG9yeS50cycpKSB7XG4gICAgICAgIGNvbnN0IHtnZW5lcmF0ZSwgYmFzZUZpbGVOYW1lfSA9IHRoaXMuaG9zdEFkYXB0ZXIuc2hvdWxkR2VuZXJhdGVGaWxlKHNmLmZpbGVOYW1lKTtcbiAgICAgICAgaWYgKGdlbmVyYXRlKSB7XG4gICAgICAgICAgLy8gTm90ZTogISBpcyBvayBhcyBob3N0QWRhcHRlci5zaG91bGRHZW5lcmF0ZUZpbGUgd2lsbCBhbHdheXMgcmV0dXJuIGEgYmFzZUZpbGVOYW1lXG4gICAgICAgICAgLy8gZm9yIC5uZ2ZhY3RvcnkudHMgZmlsZXMuXG4gICAgICAgICAgY29uc3QgZ2VuRmlsZSA9IHRoaXMuY29tcGlsZXIuZW1pdFR5cGVDaGVja1N0dWIoc2YuZmlsZU5hbWUsIGJhc2VGaWxlTmFtZSEpO1xuICAgICAgICAgIGlmIChnZW5GaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmhvc3RBZGFwdGVyLnVwZGF0ZUdlbmVyYXRlZEZpbGUoZ2VuRmlsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fdHNQcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShyb290TmFtZXMsIHRoaXMub3B0aW9ucywgdGhpcy5ob3N0QWRhcHRlciwgdG1wUHJvZ3JhbSk7XG4gICAgLy8gTm90ZTogdGhlIG5ldyB0cyBwcm9ncmFtIHNob3VsZCBiZSBjb21wbGV0ZWx5IHJldXNhYmxlIGJ5IFR5cGVTY3JpcHQgYXM6XG4gICAgLy8gLSB3ZSBjYWNoZSBhbGwgdGhlIGZpbGVzIGluIHRoZSBob3N0QWRhcHRlclxuICAgIC8vIC0gbmV3IG5ldyBzdHVicyB1c2UgdGhlIGV4YWN0bHkgc2FtZSBpbXBvcnRzL2V4cG9ydHMgYXMgdGhlIG9sZCBvbmNlICh3ZSBhc3NlcnQgdGhhdCBpblxuICAgIC8vIGhvc3RBZGFwdGVyLnVwZGF0ZUdlbmVyYXRlZEZpbGUpLlxuICAgIC8vIFRTIDQuMSsgc3RvcmVzIHRoZSByZXVzZSBzdGF0ZSBpbiB0aGUgbmV3IHByb2dyYW1cbiAgICBjb25zdCBjaGVja1JldXNlUHJvZ3JhbSA9XG4gICAgICAgICh0cy52ZXJzaW9uTWFqb3JNaW5vciBhcyBzdHJpbmcpID09PSAnNC4wJyA/IHRtcFByb2dyYW0gOiB0aGlzLl90c1Byb2dyYW07XG4gICAgaWYgKHRzU3RydWN0dXJlSXNSZXVzZWQoY2hlY2tSZXVzZVByb2dyYW0pICE9PSBTdHJ1Y3R1cmVJc1JldXNlZC5Db21wbGV0ZWx5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludGVybmFsIEVycm9yOiBUaGUgc3RydWN0dXJlIG9mIHRoZSBwcm9ncmFtIGNoYW5nZWQgZHVyaW5nIGNvZGVnZW4uYCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlUHJvZ3JhbU9uRXJyb3IoZTogYW55KSB7XG4gICAgLy8gU3RpbGwgZmlsbCB0aGUgYW5hbHl6ZWRNb2R1bGVzIGFuZCB0aGUgdHNQcm9ncmFtXG4gICAgLy8gc28gdGhhdCB3ZSBkb24ndCBjYXVzZSBvdGhlciBlcnJvcnMgZm9yIHVzZXJzIHdobyBlLmcuIHdhbnQgdG8gZW1pdCB0aGUgbmdQcm9ncmFtLlxuICAgIHRoaXMuX2FuYWx5emVkTW9kdWxlcyA9IGVtcHR5TW9kdWxlcztcbiAgICB0aGlzLm9sZFRzUHJvZ3JhbSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9ob3N0QWRhcHRlci5pc1NvdXJjZUZpbGUgPSAoKSA9PiBmYWxzZTtcbiAgICB0aGlzLl90c1Byb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHRoaXMucm9vdE5hbWVzLCB0aGlzLm9wdGlvbnMsIHRoaXMuaG9zdEFkYXB0ZXIpO1xuICAgIGlmIChpc1N5bnRheEVycm9yKGUpKSB7XG4gICAgICB0aGlzLl9hZGRTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MoZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IGU7XG4gIH1cblxuICBwcml2YXRlIF9hZGRTdHJ1Y3R1cmFsRGlhZ25vc3RpY3MoZXJyb3I6IEVycm9yKSB7XG4gICAgY29uc3QgZGlhZ25vc3RpY3MgPSB0aGlzLl9zdHJ1Y3R1cmFsRGlhZ25vc3RpY3MgfHwgKHRoaXMuX3N0cnVjdHVyYWxEaWFnbm9zdGljcyA9IFtdKTtcbiAgICBpZiAoaXNTeW50YXhFcnJvcihlcnJvcikpIHtcbiAgICAgIGRpYWdub3N0aWNzLnB1c2goLi4uc3ludGF4RXJyb3JUb0RpYWdub3N0aWNzKGVycm9yKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpYWdub3N0aWNzLnB1c2goe1xuICAgICAgICBtZXNzYWdlVGV4dDogZXJyb3IudG9TdHJpbmcoKSxcbiAgICAgICAgY2F0ZWdvcnk6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgc291cmNlOiBTT1VSQ0UsXG4gICAgICAgIGNvZGU6IERFRkFVTFRfRVJST1JfQ09ERVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gTm90ZTogdGhpcyByZXR1cm5zIGEgdHMuRGlhZ25vc3RpYyBzbyB0aGF0IHdlXG4gIC8vIGNhbiByZXR1cm4gZXJyb3JzIGluIGEgdHMuRW1pdFJlc3VsdFxuICBwcml2YXRlIGdlbmVyYXRlRmlsZXNGb3JFbWl0KGVtaXRGbGFnczogRW1pdEZsYWdzKTpcbiAgICAgIHtnZW5GaWxlczogR2VuZXJhdGVkRmlsZVtdLCBnZW5EaWFnczogdHMuRGlhZ25vc3RpY1tdfSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghKGVtaXRGbGFncyAmIEVtaXRGbGFncy5Db2RlZ2VuKSkge1xuICAgICAgICByZXR1cm4ge2dlbkZpbGVzOiBbXSwgZ2VuRGlhZ3M6IFtdfTtcbiAgICAgIH1cbiAgICAgIC8vIFRPRE8odGJvc2NoKTogYWxsb3cgZ2VuZXJhdGluZyBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHJvb3REaXJcbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8xOTMzN1xuICAgICAgbGV0IGdlbkZpbGVzID0gdGhpcy5jb21waWxlci5lbWl0QWxsSW1wbHModGhpcy5hbmFseXplZE1vZHVsZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihnZW5GaWxlID0+IGlzSW5Sb290RGlyKGdlbkZpbGUuZ2VuRmlsZVVybCwgdGhpcy5vcHRpb25zKSk7XG4gICAgICBpZiAodGhpcy5vbGRQcm9ncmFtRW1pdHRlZEdlbmVyYXRlZEZpbGVzKSB7XG4gICAgICAgIGNvbnN0IG9sZFByb2dyYW1FbWl0dGVkR2VuZXJhdGVkRmlsZXMgPSB0aGlzLm9sZFByb2dyYW1FbWl0dGVkR2VuZXJhdGVkRmlsZXM7XG4gICAgICAgIGdlbkZpbGVzID0gZ2VuRmlsZXMuZmlsdGVyKGdlbkZpbGUgPT4ge1xuICAgICAgICAgIGNvbnN0IG9sZEdlbkZpbGUgPSBvbGRQcm9ncmFtRW1pdHRlZEdlbmVyYXRlZEZpbGVzLmdldChnZW5GaWxlLmdlbkZpbGVVcmwpO1xuICAgICAgICAgIHJldHVybiAhb2xkR2VuRmlsZSB8fCAhZ2VuRmlsZS5pc0VxdWl2YWxlbnQob2xkR2VuRmlsZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtnZW5GaWxlcywgZ2VuRGlhZ3M6IFtdfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBUT0RPKHRib3NjaCk6IGNoZWNrIHdoZXRoZXIgd2UgY2FuIGFjdHVhbGx5IGhhdmUgc3ludGF4IGVycm9ycyBoZXJlLFxuICAgICAgLy8gYXMgd2UgYWxyZWFkeSBwYXJzZWQgdGhlIG1ldGFkYXRhIGFuZCB0ZW1wbGF0ZXMgYmVmb3JlIHRvIGNyZWF0ZSB0aGUgdHlwZSBjaGVjayBibG9jay5cbiAgICAgIGlmIChpc1N5bnRheEVycm9yKGUpKSB7XG4gICAgICAgIGNvbnN0IGdlbkRpYWdzOiB0cy5EaWFnbm9zdGljW10gPSBbe1xuICAgICAgICAgIGZpbGU6IHVuZGVmaW5lZCxcbiAgICAgICAgICBzdGFydDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxlbmd0aDogdW5kZWZpbmVkLFxuICAgICAgICAgIG1lc3NhZ2VUZXh0OiBlLm1lc3NhZ2UsXG4gICAgICAgICAgY2F0ZWdvcnk6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgICBzb3VyY2U6IFNPVVJDRSxcbiAgICAgICAgICBjb2RlOiBERUZBVUxUX0VSUk9SX0NPREVcbiAgICAgICAgfV07XG4gICAgICAgIHJldHVybiB7Z2VuRmlsZXM6IFtdLCBnZW5EaWFnc307XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHVuZGVmaW5lZCBpZiBhbGwgZmlsZXMgc2hvdWxkIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBwcml2YXRlIGdldFNvdXJjZUZpbGVzRm9yRW1pdCgpOiB0cy5Tb3VyY2VGaWxlW118dW5kZWZpbmVkIHtcbiAgICAvLyBUT0RPKHRib3NjaCk6IGlmIG9uZSBvZiB0aGUgZmlsZXMgY29udGFpbnMgYSBgY29uc3QgZW51bWBcbiAgICAvLyBhbHdheXMgZW1pdCBhbGwgZmlsZXMgLT4gcmV0dXJuIHVuZGVmaW5lZCFcbiAgICBsZXQgc291cmNlRmlsZXNUb0VtaXQgPSB0aGlzLnRzUHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzZiA9PiB7XG4gICAgICByZXR1cm4gIXNmLmlzRGVjbGFyYXRpb25GaWxlICYmICFHRU5FUkFURURfRklMRVMudGVzdChzZi5maWxlTmFtZSk7XG4gICAgfSk7XG4gICAgaWYgKHRoaXMub2xkUHJvZ3JhbUVtaXR0ZWRTb3VyY2VGaWxlcykge1xuICAgICAgc291cmNlRmlsZXNUb0VtaXQgPSBzb3VyY2VGaWxlc1RvRW1pdC5maWx0ZXIoc2YgPT4ge1xuICAgICAgICBjb25zdCBvbGRGaWxlID0gdGhpcy5vbGRQcm9ncmFtRW1pdHRlZFNvdXJjZUZpbGVzIS5nZXQoc2YuZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gc2YgIT09IG9sZEZpbGU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZUZpbGVzVG9FbWl0O1xuICB9XG5cbiAgcHJpdmF0ZSB3cml0ZUZpbGUoXG4gICAgICBvdXRGaWxlTmFtZTogc3RyaW5nLCBvdXREYXRhOiBzdHJpbmcsIHdyaXRlQnl0ZU9yZGVyTWFyazogYm9vbGVhbixcbiAgICAgIG9uRXJyb3I/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkLCBnZW5GaWxlPzogR2VuZXJhdGVkRmlsZSxcbiAgICAgIHNvdXJjZUZpbGVzPzogUmVhZG9ubHlBcnJheTx0cy5Tb3VyY2VGaWxlPikge1xuICAgIC8vIGNvbGxlY3QgZW1pdHRlZExpYnJhcnlTdW1tYXJpZXNcbiAgICBsZXQgYmFzZUZpbGU6IHRzLlNvdXJjZUZpbGV8dW5kZWZpbmVkO1xuICAgIGlmIChnZW5GaWxlKSB7XG4gICAgICBiYXNlRmlsZSA9IHRoaXMudHNQcm9ncmFtLmdldFNvdXJjZUZpbGUoZ2VuRmlsZS5zcmNGaWxlVXJsKTtcbiAgICAgIGlmIChiYXNlRmlsZSkge1xuICAgICAgICBpZiAoIXRoaXMuZW1pdHRlZExpYnJhcnlTdW1tYXJpZXMpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZWRMaWJyYXJ5U3VtbWFyaWVzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdlbkZpbGUuZ2VuRmlsZVVybC5lbmRzV2l0aCgnLm5nc3VtbWFyeS5qc29uJykgJiYgYmFzZUZpbGUuZmlsZU5hbWUuZW5kc1dpdGgoJy5kLnRzJykpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZWRMaWJyYXJ5U3VtbWFyaWVzLnB1c2goe1xuICAgICAgICAgICAgZmlsZU5hbWU6IGJhc2VGaWxlLmZpbGVOYW1lLFxuICAgICAgICAgICAgdGV4dDogYmFzZUZpbGUudGV4dCxcbiAgICAgICAgICAgIHNvdXJjZUZpbGU6IGJhc2VGaWxlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuZW1pdHRlZExpYnJhcnlTdW1tYXJpZXMucHVzaCh7ZmlsZU5hbWU6IGdlbkZpbGUuZ2VuRmlsZVVybCwgdGV4dDogb3V0RGF0YX0pO1xuICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBlbWl0IGRlY2xhcmF0aW9ucywgc3RpbGwgcmVjb3JkIGFuIGVtcHR5IC5uZ2ZhY3RvcnkuZC50cyBmaWxlLFxuICAgICAgICAgICAgLy8gYXMgd2UgbWlnaHQgbmVlZCBpdCBsYXRlciBvbiBmb3IgcmVzb2x2aW5nIG1vZHVsZSBuYW1lcyBmcm9tIHN1bW1hcmllcy5cbiAgICAgICAgICAgIGNvbnN0IG5nRmFjdG9yeUR0cyA9XG4gICAgICAgICAgICAgICAgZ2VuRmlsZS5nZW5GaWxlVXJsLnN1YnN0cmluZygwLCBnZW5GaWxlLmdlbkZpbGVVcmwubGVuZ3RoIC0gMTUpICsgJy5uZ2ZhY3RvcnkuZC50cyc7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZWRMaWJyYXJ5U3VtbWFyaWVzLnB1c2goe2ZpbGVOYW1lOiBuZ0ZhY3RvcnlEdHMsIHRleHQ6ICcnfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG91dEZpbGVOYW1lLmVuZHNXaXRoKCcuZC50cycpICYmIGJhc2VGaWxlLmZpbGVOYW1lLmVuZHNXaXRoKCcuZC50cycpKSB7XG4gICAgICAgICAgY29uc3QgZHRzU291cmNlRmlsZVBhdGggPSBnZW5GaWxlLmdlbkZpbGVVcmwucmVwbGFjZSgvXFwudHMkLywgJy5kLnRzJyk7XG4gICAgICAgICAgLy8gTm90ZTogRG9uJ3QgdXNlIHNvdXJjZUZpbGVzIGhlcmUgYXMgdGhlIGNyZWF0ZWQgLmQudHMgaGFzIGEgcGF0aCBpbiB0aGUgb3V0RGlyLFxuICAgICAgICAgIC8vIGJ1dCB3ZSBuZWVkIG9uZSB0aGF0IGlzIG5leHQgdG8gdGhlIC50cyBmaWxlXG4gICAgICAgICAgdGhpcy5lbWl0dGVkTGlicmFyeVN1bW1hcmllcy5wdXNoKHtmaWxlTmFtZTogZHRzU291cmNlRmlsZVBhdGgsIHRleHQ6IG91dERhdGF9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBGaWx0ZXIgb3V0IGdlbmVyYXRlZCBmaWxlcyBmb3Igd2hpY2ggd2UgZGlkbid0IGdlbmVyYXRlIGNvZGUuXG4gICAgLy8gVGhpcyBjYW4gaGFwcGVuIGFzIHRoZSBzdHViIGNhbGN1bGF0aW9uIGlzIG5vdCBjb21wbGV0ZWx5IGV4YWN0LlxuICAgIC8vIE5vdGU6IHNvdXJjZUZpbGUgcmVmZXJzIHRvIHRoZSAubmdmYWN0b3J5LnRzIC8gLm5nc3VtbWFyeS50cyBmaWxlXG4gICAgLy8gbm9kZV9lbWl0dGVyX3RyYW5zZm9ybSBhbHJlYWR5IHNldCB0aGUgZmlsZSBjb250ZW50cyB0byBiZSBlbXB0eSxcbiAgICAvLyAgc28gdGhpcyBjb2RlIG9ubHkgbmVlZHMgdG8gc2tpcCB0aGUgZmlsZSBpZiAhYWxsb3dFbXB0eUNvZGVnZW5GaWxlcy5cbiAgICBjb25zdCBpc0dlbmVyYXRlZCA9IEdFTkVSQVRFRF9GSUxFUy50ZXN0KG91dEZpbGVOYW1lKTtcbiAgICBpZiAoaXNHZW5lcmF0ZWQgJiYgIXRoaXMub3B0aW9ucy5hbGxvd0VtcHR5Q29kZWdlbkZpbGVzICYmXG4gICAgICAgICghZ2VuRmlsZSB8fCAhZ2VuRmlsZS5zdG10cyB8fCBnZW5GaWxlLnN0bXRzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGJhc2VGaWxlKSB7XG4gICAgICBzb3VyY2VGaWxlcyA9IHNvdXJjZUZpbGVzID8gWy4uLnNvdXJjZUZpbGVzLCBiYXNlRmlsZV0gOiBbYmFzZUZpbGVdO1xuICAgIH1cbiAgICAvLyBUT0RPOiByZW1vdmUgYW55IHdoZW4gVFMgMi40IHN1cHBvcnQgaXMgcmVtb3ZlZC5cbiAgICB0aGlzLmhvc3Qud3JpdGVGaWxlKG91dEZpbGVOYW1lLCBvdXREYXRhLCB3cml0ZUJ5dGVPcmRlck1hcmssIG9uRXJyb3IsIHNvdXJjZUZpbGVzIGFzIGFueSk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbSh7cm9vdE5hbWVzLCBvcHRpb25zLCBob3N0LCBvbGRQcm9ncmFtfToge1xuICByb290TmFtZXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICBob3N0OiBDb21waWxlckhvc3QsXG4gIG9sZFByb2dyYW0/OiBQcm9ncmFtXG59KTogUHJvZ3JhbSB7XG4gIGlmIChvcHRpb25zLmVuYWJsZUl2eSAhPT0gZmFsc2UpIHtcbiAgICByZXR1cm4gbmV3IE5ndHNjUHJvZ3JhbShyb290TmFtZXMsIG9wdGlvbnMsIGhvc3QsIG9sZFByb2dyYW0gYXMgTmd0c2NQcm9ncmFtIHwgdW5kZWZpbmVkKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IEFuZ3VsYXJDb21waWxlclByb2dyYW0ocm9vdE5hbWVzLCBvcHRpb25zLCBob3N0LCBvbGRQcm9ncmFtKTtcbiAgfVxufVxuXG4vLyBDb21wdXRlIHRoZSBBb3RDb21waWxlciBvcHRpb25zXG5mdW5jdGlvbiBnZXRBb3RDb21waWxlck9wdGlvbnMob3B0aW9uczogQ29tcGlsZXJPcHRpb25zKTogQW90Q29tcGlsZXJPcHRpb25zIHtcbiAgbGV0IG1pc3NpbmdUcmFuc2xhdGlvbiA9IGNvcmUuTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuV2FybmluZztcblxuICBzd2l0Y2ggKG9wdGlvbnMuaTE4bkluTWlzc2luZ1RyYW5zbGF0aW9ucykge1xuICAgIGNhc2UgJ2lnbm9yZSc6XG4gICAgICBtaXNzaW5nVHJhbnNsYXRpb24gPSBjb3JlLk1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lklnbm9yZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvbiA9IGNvcmUuTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuRXJyb3I7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIGxldCB0cmFuc2xhdGlvbnM6IHN0cmluZyA9ICcnO1xuXG4gIGlmIChvcHRpb25zLmkxOG5JbkZpbGUpIHtcbiAgICBpZiAoIW9wdGlvbnMuaTE4bkluTG9jYWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSB0cmFuc2xhdGlvbiBmaWxlICgke29wdGlvbnMuaTE4bkluRmlsZX0pIGxvY2FsZSBtdXN0IGJlIHByb3ZpZGVkLmApO1xuICAgIH1cbiAgICB0cmFuc2xhdGlvbnMgPSBmcy5yZWFkRmlsZVN5bmMob3B0aW9ucy5pMThuSW5GaWxlLCAndXRmOCcpO1xuICB9IGVsc2Uge1xuICAgIC8vIE5vIHRyYW5zbGF0aW9ucyBhcmUgcHJvdmlkZWQsIGlnbm9yZSBhbnkgZXJyb3JzXG4gICAgLy8gV2Ugc3RpbGwgZ28gdGhyb3VnaCBpMThuIHRvIHJlbW92ZSBpMThuIGF0dHJpYnV0ZXNcbiAgICBtaXNzaW5nVHJhbnNsYXRpb24gPSBjb3JlLk1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lklnbm9yZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbG9jYWxlOiBvcHRpb25zLmkxOG5JbkxvY2FsZSxcbiAgICBpMThuRm9ybWF0OiBvcHRpb25zLmkxOG5JbkZvcm1hdCB8fCBvcHRpb25zLmkxOG5PdXRGb3JtYXQsXG4gICAgaTE4blVzZUV4dGVybmFsSWRzOiBvcHRpb25zLmkxOG5Vc2VFeHRlcm5hbElkcyxcbiAgICB0cmFuc2xhdGlvbnMsXG4gICAgbWlzc2luZ1RyYW5zbGF0aW9uLFxuICAgIGVuYWJsZVN1bW1hcmllc0ZvckppdDogb3B0aW9ucy5lbmFibGVTdW1tYXJpZXNGb3JKaXQsXG4gICAgcHJlc2VydmVXaGl0ZXNwYWNlczogb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2VzLFxuICAgIGZ1bGxUZW1wbGF0ZVR5cGVDaGVjazogb3B0aW9ucy5mdWxsVGVtcGxhdGVUeXBlQ2hlY2ssXG4gICAgYWxsb3dFbXB0eUNvZGVnZW5GaWxlczogb3B0aW9ucy5hbGxvd0VtcHR5Q29kZWdlbkZpbGVzLFxuICAgIGVuYWJsZUl2eTogb3B0aW9ucy5lbmFibGVJdnksXG4gICAgY3JlYXRlRXh0ZXJuYWxTeW1ib2xGYWN0b3J5UmVleHBvcnRzOiBvcHRpb25zLmNyZWF0ZUV4dGVybmFsU3ltYm9sRmFjdG9yeVJlZXhwb3J0cyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0TmdPcHRpb25EaWFnbm9zdGljcyhvcHRpb25zOiBDb21waWxlck9wdGlvbnMpOiBSZWFkb25seUFycmF5PERpYWdub3N0aWM+IHtcbiAgaWYgKG9wdGlvbnMuYW5ub3RhdGlvbnNBcykge1xuICAgIHN3aXRjaCAob3B0aW9ucy5hbm5vdGF0aW9uc0FzKSB7XG4gICAgICBjYXNlICdkZWNvcmF0b3JzJzpcbiAgICAgIGNhc2UgJ3N0YXRpYyBmaWVsZHMnOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG1lc3NhZ2VUZXh0OlxuICAgICAgICAgICAgICAnQW5ndWxhciBjb21waWxlciBvcHRpb25zIFwiYW5ub3RhdGlvbnNBc1wiIG9ubHkgc3VwcG9ydHMgXCJzdGF0aWMgZmllbGRzXCIgYW5kIFwiZGVjb3JhdG9yc1wiJyxcbiAgICAgICAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgICAgIHNvdXJjZTogU09VUkNFLFxuICAgICAgICAgIGNvZGU6IERFRkFVTFRfRVJST1JfQ09ERVxuICAgICAgICB9XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTZXBhcmF0b3JzKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBjYW4gYWRqdXN0IGEgcGF0aCBmcm9tIHNvdXJjZSBwYXRoIHRvIG91dCBwYXRoLFxuICogYmFzZWQgb24gYW4gZXhpc3RpbmcgbWFwcGluZyBmcm9tIHNvdXJjZSB0byBvdXQgcGF0aC5cbiAqXG4gKiBUT0RPKHRib3NjaCk6IHRhbGsgdG8gdGhlIFR5cGVTY3JpcHQgdGVhbSB0byBleHBvc2UgdGhlaXIgbG9naWMgZm9yIGNhbGN1bGF0aW5nIHRoZSBgcm9vdERpcmBcbiAqIGlmIG5vbmUgd2FzIHNwZWNpZmllZC5cbiAqXG4gKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIHdvcmtzIG9uIG5vcm1hbGl6ZWQgcGF0aHMgZnJvbSB0eXBlc2NyaXB0IGJ1dCBzaG91bGQgYWx3YXlzIHJldHVyblxuICogUE9TSVggbm9ybWFsaXplZCBwYXRocyBmb3Igb3V0cHV0IHBhdGhzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3JjVG9PdXRQYXRoTWFwcGVyKFxuICAgIG91dERpcjogc3RyaW5nfHVuZGVmaW5lZCwgc2FtcGxlU3JjRmlsZU5hbWU6IHN0cmluZ3x1bmRlZmluZWQsXG4gICAgc2FtcGxlT3V0RmlsZU5hbWU6IHN0cmluZ3x1bmRlZmluZWQsIGhvc3Q6IHtcbiAgICAgIGRpcm5hbWU6IHR5cGVvZiBwYXRoLmRpcm5hbWUsXG4gICAgICByZXNvbHZlOiB0eXBlb2YgcGF0aC5yZXNvbHZlLFxuICAgICAgcmVsYXRpdmU6IHR5cGVvZiBwYXRoLnJlbGF0aXZlXG4gICAgfSA9IHBhdGgpOiAoc3JjRmlsZU5hbWU6IHN0cmluZykgPT4gc3RyaW5nIHtcbiAgaWYgKG91dERpcikge1xuICAgIGxldCBwYXRoOiB7fSA9IHt9OyAgLy8gRW5zdXJlIHdlIGVycm9yIGlmIHdlIHVzZSBgcGF0aGAgaW5zdGVhZCBvZiBgaG9zdGAuXG4gICAgaWYgKHNhbXBsZVNyY0ZpbGVOYW1lID09IG51bGwgfHwgc2FtcGxlT3V0RmlsZU5hbWUgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjYWxjdWxhdGUgdGhlIHJvb3REaXIgd2l0aG91dCBhIHNhbXBsZSBzcmNGaWxlTmFtZSAvIG91dEZpbGVOYW1lLiBgKTtcbiAgICB9XG4gICAgY29uc3Qgc3JjRmlsZURpciA9IG5vcm1hbGl6ZVNlcGFyYXRvcnMoaG9zdC5kaXJuYW1lKHNhbXBsZVNyY0ZpbGVOYW1lKSk7XG4gICAgY29uc3Qgb3V0RmlsZURpciA9IG5vcm1hbGl6ZVNlcGFyYXRvcnMoaG9zdC5kaXJuYW1lKHNhbXBsZU91dEZpbGVOYW1lKSk7XG4gICAgaWYgKHNyY0ZpbGVEaXIgPT09IG91dEZpbGVEaXIpIHtcbiAgICAgIHJldHVybiAoc3JjRmlsZU5hbWUpID0+IHNyY0ZpbGVOYW1lO1xuICAgIH1cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNvbW1vbiBzdWZmaXgsIHN0b3BwaW5nXG4gICAgLy8gYXQgYG91dERpcmAuXG4gICAgY29uc3Qgc3JjRGlyUGFydHMgPSBzcmNGaWxlRGlyLnNwbGl0KCcvJyk7XG4gICAgY29uc3Qgb3V0RGlyUGFydHMgPSBub3JtYWxpemVTZXBhcmF0b3JzKGhvc3QucmVsYXRpdmUob3V0RGlyLCBvdXRGaWxlRGlyKSkuc3BsaXQoJy8nKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBNYXRoLm1pbihzcmNEaXJQYXJ0cy5sZW5ndGgsIG91dERpclBhcnRzLmxlbmd0aCkgJiZcbiAgICAgICAgICAgc3JjRGlyUGFydHNbc3JjRGlyUGFydHMubGVuZ3RoIC0gMSAtIGldID09PSBvdXREaXJQYXJ0c1tvdXREaXJQYXJ0cy5sZW5ndGggLSAxIC0gaV0pXG4gICAgICBpKys7XG4gICAgY29uc3Qgcm9vdERpciA9IHNyY0RpclBhcnRzLnNsaWNlKDAsIHNyY0RpclBhcnRzLmxlbmd0aCAtIGkpLmpvaW4oJy8nKTtcbiAgICByZXR1cm4gKHNyY0ZpbGVOYW1lKSA9PiB7XG4gICAgICAvLyBOb3RlOiBCZWZvcmUgd2UgcmV0dXJuIHRoZSBtYXBwZWQgb3V0cHV0IHBhdGgsIHdlIG5lZWQgdG8gbm9ybWFsaXplIHRoZSBwYXRoIGRlbGltaXRlcnNcbiAgICAgIC8vIGJlY2F1c2UgdGhlIG91dHB1dCBwYXRoIGlzIHVzdWFsbHkgcGFzc2VkIHRvIFR5cGVTY3JpcHQgd2hpY2ggc29tZXRpbWVzIG9ubHkgZXhwZWN0c1xuICAgICAgLy8gcG9zaXggbm9ybWFsaXplZCBwYXRocyAoZS5nLiBpZiBhIGN1c3RvbSBjb21waWxlciBob3N0IGlzIHVzZWQpXG4gICAgICByZXR1cm4gbm9ybWFsaXplU2VwYXJhdG9ycyhob3N0LnJlc29sdmUob3V0RGlyLCBob3N0LnJlbGF0aXZlKHJvb3REaXIsIHNyY0ZpbGVOYW1lKSkpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgLy8gTm90ZTogQmVmb3JlIHdlIHJldHVybiB0aGUgb3V0cHV0IHBhdGgsIHdlIG5lZWQgdG8gbm9ybWFsaXplIHRoZSBwYXRoIGRlbGltaXRlcnMgYmVjYXVzZVxuICAgIC8vIHRoZSBvdXRwdXQgcGF0aCBpcyB1c3VhbGx5IHBhc3NlZCB0byBUeXBlU2NyaXB0IHdoaWNoIG9ubHkgcGFzc2VzIGFyb3VuZCBwb3NpeFxuICAgIC8vIG5vcm1hbGl6ZWQgcGF0aHMgKGUuZy4gaWYgYSBjdXN0b20gY29tcGlsZXIgaG9zdCBpcyB1c2VkKVxuICAgIHJldHVybiAoc3JjRmlsZU5hbWUpID0+IG5vcm1hbGl6ZVNlcGFyYXRvcnMoc3JjRmlsZU5hbWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpMThuRXh0cmFjdChcbiAgICBmb3JtYXROYW1lOiBzdHJpbmd8bnVsbCwgb3V0RmlsZTogc3RyaW5nfG51bGwsIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgIGJ1bmRsZTogTWVzc2FnZUJ1bmRsZSk6IHN0cmluZ1tdIHtcbiAgZm9ybWF0TmFtZSA9IGZvcm1hdE5hbWUgfHwgJ3hsZic7XG4gIC8vIENoZWNrcyB0aGUgZm9ybWF0IGFuZCByZXR1cm5zIHRoZSBleHRlbnNpb25cbiAgY29uc3QgZXh0ID0gaTE4bkdldEV4dGVuc2lvbihmb3JtYXROYW1lKTtcbiAgY29uc3QgY29udGVudCA9IGkxOG5TZXJpYWxpemUoYnVuZGxlLCBmb3JtYXROYW1lLCBvcHRpb25zKTtcbiAgY29uc3QgZHN0RmlsZSA9IG91dEZpbGUgfHwgYG1lc3NhZ2VzLiR7ZXh0fWA7XG4gIGNvbnN0IGRzdFBhdGggPSBwYXRoLnJlc29sdmUob3B0aW9ucy5vdXREaXIgfHwgb3B0aW9ucy5iYXNlUGF0aCEsIGRzdEZpbGUpO1xuICBob3N0LndyaXRlRmlsZShkc3RQYXRoLCBjb250ZW50LCBmYWxzZSwgdW5kZWZpbmVkLCBbXSk7XG4gIHJldHVybiBbZHN0UGF0aF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpMThuU2VyaWFsaXplKFxuICAgIGJ1bmRsZTogTWVzc2FnZUJ1bmRsZSwgZm9ybWF0TmFtZTogc3RyaW5nLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMpOiBzdHJpbmcge1xuICBjb25zdCBmb3JtYXQgPSBmb3JtYXROYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBzZXJpYWxpemVyOiBTZXJpYWxpemVyO1xuXG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgY2FzZSAneG1iJzpcbiAgICAgIHNlcmlhbGl6ZXIgPSBuZXcgWG1iKCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd4bGlmZjInOlxuICAgIGNhc2UgJ3hsZjInOlxuICAgICAgc2VyaWFsaXplciA9IG5ldyBYbGlmZjIoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3hsZic6XG4gICAgY2FzZSAneGxpZmYnOlxuICAgIGRlZmF1bHQ6XG4gICAgICBzZXJpYWxpemVyID0gbmV3IFhsaWZmKCk7XG4gIH1cblxuICByZXR1cm4gYnVuZGxlLndyaXRlKHNlcmlhbGl6ZXIsIGdldFBhdGhOb3JtYWxpemVyKG9wdGlvbnMuYmFzZVBhdGgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGF0aE5vcm1hbGl6ZXIoYmFzZVBhdGg/OiBzdHJpbmcpIHtcbiAgLy8gbm9ybWFsaXplIHNvdXJjZSBwYXRocyBieSByZW1vdmluZyB0aGUgYmFzZSBwYXRoIGFuZCBhbHdheXMgdXNpbmcgXCIvXCIgYXMgYSBzZXBhcmF0b3JcbiAgcmV0dXJuIChzb3VyY2VQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBzb3VyY2VQYXRoID0gYmFzZVBhdGggPyBwYXRoLnJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VQYXRoKSA6IHNvdXJjZVBhdGg7XG4gICAgcmV0dXJuIHNvdXJjZVBhdGguc3BsaXQocGF0aC5zZXApLmpvaW4oJy8nKTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGkxOG5HZXRFeHRlbnNpb24oZm9ybWF0TmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZm9ybWF0ID0gZm9ybWF0TmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgY2FzZSAneG1iJzpcbiAgICAgIHJldHVybiAneG1iJztcbiAgICBjYXNlICd4bGYnOlxuICAgIGNhc2UgJ3hsaWYnOlxuICAgIGNhc2UgJ3hsaWZmJzpcbiAgICBjYXNlICd4bGYyJzpcbiAgICBjYXNlICd4bGlmZjInOlxuICAgICAgcmV0dXJuICd4bGYnO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBmb3JtYXQgXCIke2Zvcm1hdE5hbWV9XCJgKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VFbWl0UmVzdWx0cyhlbWl0UmVzdWx0czogdHMuRW1pdFJlc3VsdFtdKTogdHMuRW1pdFJlc3VsdCB7XG4gIGNvbnN0IGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW10gPSBbXTtcbiAgbGV0IGVtaXRTa2lwcGVkID0gZmFsc2U7XG4gIGNvbnN0IGVtaXR0ZWRGaWxlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBlciBvZiBlbWl0UmVzdWx0cykge1xuICAgIGRpYWdub3N0aWNzLnB1c2goLi4uZXIuZGlhZ25vc3RpY3MpO1xuICAgIGVtaXRTa2lwcGVkID0gZW1pdFNraXBwZWQgfHwgZXIuZW1pdFNraXBwZWQ7XG4gICAgZW1pdHRlZEZpbGVzLnB1c2goLi4uKGVyLmVtaXR0ZWRGaWxlcyB8fCBbXSkpO1xuICB9XG4gIHJldHVybiB7ZGlhZ25vc3RpY3MsIGVtaXRTa2lwcGVkLCBlbWl0dGVkRmlsZXN9O1xufVxuXG5mdW5jdGlvbiBkaWFnbm9zdGljU291cmNlT2ZTcGFuKHNwYW46IFBhcnNlU291cmNlU3Bhbik6IHRzLlNvdXJjZUZpbGUge1xuICAvLyBGb3IgZGlhZ25vc3RpY3MsIFR5cGVTY3JpcHQgb25seSB1c2VzIHRoZSBmaWxlTmFtZSBhbmQgdGV4dCBwcm9wZXJ0aWVzLlxuICAvLyBUaGUgcmVkdW5kYW50ICcoKScgYXJlIGhlcmUgaXMgdG8gYXZvaWQgaGF2aW5nIGNsYW5nLWZvcm1hdCBicmVha2luZyB0aGUgbGluZSBpbmNvcnJlY3RseS5cbiAgcmV0dXJuICh7ZmlsZU5hbWU6IHNwYW4uc3RhcnQuZmlsZS51cmwsIHRleHQ6IHNwYW4uc3RhcnQuZmlsZS5jb250ZW50fSBhcyBhbnkpO1xufVxuXG5mdW5jdGlvbiBkaWFnbm9zdGljU291cmNlT2ZGaWxlTmFtZShmaWxlTmFtZTogc3RyaW5nLCBwcm9ncmFtOiB0cy5Qcm9ncmFtKTogdHMuU291cmNlRmlsZSB7XG4gIGNvbnN0IHNvdXJjZUZpbGUgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpO1xuICBpZiAoc291cmNlRmlsZSkgcmV0dXJuIHNvdXJjZUZpbGU7XG5cbiAgLy8gSWYgd2UgYXJlIHJlcG9ydGluZyBkaWFnbm9zdGljcyBmb3IgYSBzb3VyY2UgZmlsZSB0aGF0IGlzIG5vdCBpbiB0aGUgcHJvamVjdCB0aGVuIHdlIG5lZWRcbiAgLy8gdG8gZmFrZSBhIHNvdXJjZSBmaWxlIHNvIHRoZSBkaWFnbm9zdGljIGZvcm1hdHRpbmcgcm91dGluZXMgY2FuIGVtaXQgdGhlIGZpbGUgbmFtZS5cbiAgLy8gVGhlIHJlZHVuZGFudCAnKCknIGFyZSBoZXJlIGlzIHRvIGF2b2lkIGhhdmluZyBjbGFuZy1mb3JtYXQgYnJlYWtpbmcgdGhlIGxpbmUgaW5jb3JyZWN0bHkuXG4gIHJldHVybiAoe2ZpbGVOYW1lLCB0ZXh0OiAnJ30gYXMgYW55KTtcbn1cblxuXG5mdW5jdGlvbiBkaWFnbm9zdGljQ2hhaW5Gcm9tRm9ybWF0dGVkRGlhZ25vc3RpY0NoYWluKGNoYWluOiBGb3JtYXR0ZWRNZXNzYWdlQ2hhaW4pOlxuICAgIERpYWdub3N0aWNNZXNzYWdlQ2hhaW4ge1xuICByZXR1cm4ge1xuICAgIG1lc3NhZ2VUZXh0OiBjaGFpbi5tZXNzYWdlLFxuICAgIG5leHQ6IGNoYWluLm5leHQgJiYgY2hhaW4ubmV4dC5tYXAoZGlhZ25vc3RpY0NoYWluRnJvbUZvcm1hdHRlZERpYWdub3N0aWNDaGFpbiksXG4gICAgcG9zaXRpb246IGNoYWluLnBvc2l0aW9uXG4gIH07XG59XG5cbmZ1bmN0aW9uIHN5bnRheEVycm9yVG9EaWFnbm9zdGljcyhlcnJvcjogRXJyb3IpOiBEaWFnbm9zdGljW10ge1xuICBjb25zdCBwYXJzZXJFcnJvcnMgPSBnZXRQYXJzZUVycm9ycyhlcnJvcik7XG4gIGlmIChwYXJzZXJFcnJvcnMgJiYgcGFyc2VyRXJyb3JzLmxlbmd0aCkge1xuICAgIHJldHVybiBwYXJzZXJFcnJvcnMubWFwPERpYWdub3N0aWM+KGUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VUZXh0OiBlLmNvbnRleHR1YWxNZXNzYWdlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlOiBkaWFnbm9zdGljU291cmNlT2ZTcGFuKGUuc3BhbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogZS5zcGFuLnN0YXJ0Lm9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogZS5zcGFuLmVuZC5vZmZzZXQgLSBlLnNwYW4uc3RhcnQub2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogU09VUkNFLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogREVGQVVMVF9FUlJPUl9DT0RFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICB9IGVsc2UgaWYgKGlzRm9ybWF0dGVkRXJyb3IoZXJyb3IpKSB7XG4gICAgcmV0dXJuIFt7XG4gICAgICBtZXNzYWdlVGV4dDogZXJyb3IubWVzc2FnZSxcbiAgICAgIGNoYWluOiBlcnJvci5jaGFpbiAmJiBkaWFnbm9zdGljQ2hhaW5Gcm9tRm9ybWF0dGVkRGlhZ25vc3RpY0NoYWluKGVycm9yLmNoYWluKSxcbiAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICBzb3VyY2U6IFNPVVJDRSxcbiAgICAgIGNvZGU6IERFRkFVTFRfRVJST1JfQ09ERSxcbiAgICAgIHBvc2l0aW9uOiBlcnJvci5wb3NpdGlvblxuICAgIH1dO1xuICB9XG4gIC8vIFByb2R1Y2UgYSBEaWFnbm9zdGljIGFueXdheSBzaW5jZSB3ZSBrbm93IGZvciBzdXJlIGBlcnJvcmAgaXMgYSBTeW50YXhFcnJvclxuICByZXR1cm4gW3tcbiAgICBtZXNzYWdlVGV4dDogZXJyb3IubWVzc2FnZSxcbiAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgIGNvZGU6IERFRkFVTFRfRVJST1JfQ09ERSxcbiAgICBzb3VyY2U6IFNPVVJDRSxcbiAgfV07XG59XG4iXX0=
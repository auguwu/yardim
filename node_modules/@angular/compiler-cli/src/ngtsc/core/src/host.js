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
        define("@angular/compiler-cli/src/ngtsc/core/src/host", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/entry_point", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/shims", "@angular/compiler-cli/src/ngtsc/typecheck", "@angular/compiler-cli/src/ngtsc/util/src/path", "@angular/compiler-cli/src/ngtsc/util/src/typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NgCompilerHost = exports.DelegatingCompilerHost = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var entry_point_1 = require("@angular/compiler-cli/src/ngtsc/entry_point");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var shims_1 = require("@angular/compiler-cli/src/ngtsc/shims");
    var typecheck_1 = require("@angular/compiler-cli/src/ngtsc/typecheck");
    var path_1 = require("@angular/compiler-cli/src/ngtsc/util/src/path");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    // A persistent source of bugs in CompilerHost delegation has been the addition by TS of new,
    // optional methods on ts.CompilerHost. Since these methods are optional, it's not a type error that
    // the delegating host doesn't implement or delegate them. This causes subtle runtime failures. No
    // more. This infrastructure ensures that failing to delegate a method is a compile-time error.
    /**
     * Delegates all methods of `ExtendedTsCompilerHost` to a delegate, with the exception of
     * `getSourceFile` and `fileExists` which are implemented in `NgCompilerHost`.
     *
     * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
     * generated for this class.
     */
    var DelegatingCompilerHost = /** @class */ (function () {
        function DelegatingCompilerHost(delegate) {
            this.delegate = delegate;
            // Excluded are 'getSourceFile' and 'fileExists', which are actually implemented by NgCompilerHost
            // below.
            this.createHash = this.delegateMethod('createHash');
            this.directoryExists = this.delegateMethod('directoryExists');
            this.fileNameToModuleName = this.delegateMethod('fileNameToModuleName');
            this.getCancellationToken = this.delegateMethod('getCancellationToken');
            this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
            this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
            this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
            this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
            this.getDirectories = this.delegateMethod('getDirectories');
            this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
            this.getModifiedResourceFiles = this.delegateMethod('getModifiedResourceFiles');
            this.getNewLine = this.delegateMethod('getNewLine');
            this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
            this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
            this.readDirectory = this.delegateMethod('readDirectory');
            this.readFile = this.delegateMethod('readFile');
            this.readResource = this.delegateMethod('readResource');
            this.realpath = this.delegateMethod('realpath');
            this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
            this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
            this.resourceNameToFileName = this.delegateMethod('resourceNameToFileName');
            this.trace = this.delegateMethod('trace');
            this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
            this.writeFile = this.delegateMethod('writeFile');
        }
        DelegatingCompilerHost.prototype.delegateMethod = function (name) {
            return this.delegate[name] !== undefined ? this.delegate[name].bind(this.delegate) :
                undefined;
        };
        return DelegatingCompilerHost;
    }());
    exports.DelegatingCompilerHost = DelegatingCompilerHost;
    /**
     * A wrapper around `ts.CompilerHost` (plus any extension methods from `ExtendedTsCompilerHost`).
     *
     * In order for a consumer to include Angular compilation in their TypeScript compiler, the
     * `ts.Program` must be created with a host that adds Angular-specific files (e.g. factories,
     * summaries, the template type-checking file, etc) to the compilation. `NgCompilerHost` is the
     * host implementation which supports this.
     *
     * The interface implementations here ensure that `NgCompilerHost` fully delegates to
     * `ExtendedTsCompilerHost` methods whenever present.
     */
    var NgCompilerHost = /** @class */ (function (_super) {
        tslib_1.__extends(NgCompilerHost, _super);
        function NgCompilerHost(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, factoryTracker, diagnostics) {
            var _this = _super.call(this, delegate) || this;
            _this.shimAdapter = shimAdapter;
            _this.shimTagger = shimTagger;
            _this.factoryTracker = null;
            _this.entryPoint = null;
            _this.factoryTracker = factoryTracker;
            _this.entryPoint = entryPoint;
            _this.constructionDiagnostics = diagnostics;
            _this.inputFiles = tslib_1.__spread(inputFiles, shimAdapter.extraInputFiles);
            _this.rootDirs = rootDirs;
            return _this;
        }
        Object.defineProperty(NgCompilerHost.prototype, "ignoreForEmit", {
            /**
             * Retrieves a set of `ts.SourceFile`s which should not be emitted as JS files.
             *
             * Available after this host is used to create a `ts.Program` (which causes all the files in the
             * program to be enumerated).
             */
            get: function () {
                return this.shimAdapter.ignoreForEmit;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(NgCompilerHost.prototype, "shimExtensionPrefixes", {
            /**
             * Retrieve the array of shim extension prefixes for which shims were created for each original
             * file.
             */
            get: function () {
                return this.shimAdapter.extensionPrefixes;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Performs cleanup that needs to happen after a `ts.Program` has been created using this host.
         */
        NgCompilerHost.prototype.postProgramCreationCleanup = function () {
            this.shimTagger.finalize();
        };
        /**
         * Create an `NgCompilerHost` from a delegate host, an array of input filenames, and the full set
         * of TypeScript and Angular compiler options.
         */
        NgCompilerHost.wrap = function (delegate, inputFiles, options, oldProgram) {
            var e_1, _a;
            // TODO(alxhub): remove the fallback to allowEmptyCodegenFiles after verifying that the rest of
            // our build tooling is no longer relying on it.
            var allowEmptyCodegenFiles = options.allowEmptyCodegenFiles || false;
            var shouldGenerateFactoryShims = options.generateNgFactoryShims !== undefined ?
                options.generateNgFactoryShims :
                allowEmptyCodegenFiles;
            var shouldGenerateSummaryShims = options.generateNgSummaryShims !== undefined ?
                options.generateNgSummaryShims :
                allowEmptyCodegenFiles;
            var topLevelShimGenerators = [];
            var perFileShimGenerators = [];
            if (shouldGenerateSummaryShims) {
                // Summary generation.
                perFileShimGenerators.push(new shims_1.SummaryGenerator());
            }
            var factoryTracker = null;
            if (shouldGenerateFactoryShims) {
                var factoryGenerator = new shims_1.FactoryGenerator();
                perFileShimGenerators.push(factoryGenerator);
                factoryTracker = factoryGenerator;
            }
            var rootDirs = typescript_1.getRootDirs(delegate, options);
            perFileShimGenerators.push(new typecheck_1.TypeCheckShimGenerator());
            var diagnostics = [];
            var normalizedTsInputFiles = [];
            try {
                for (var inputFiles_1 = tslib_1.__values(inputFiles), inputFiles_1_1 = inputFiles_1.next(); !inputFiles_1_1.done; inputFiles_1_1 = inputFiles_1.next()) {
                    var inputFile = inputFiles_1_1.value;
                    if (!typescript_1.isNonDeclarationTsPath(inputFile)) {
                        continue;
                    }
                    normalizedTsInputFiles.push(file_system_1.resolve(inputFile));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (inputFiles_1_1 && !inputFiles_1_1.done && (_a = inputFiles_1.return)) _a.call(inputFiles_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var entryPoint = null;
            if (options.flatModuleOutFile != null && options.flatModuleOutFile !== '') {
                entryPoint = entry_point_1.findFlatIndexEntryPoint(normalizedTsInputFiles);
                if (entryPoint === null) {
                    // This error message talks specifically about having a single .ts file in "files". However
                    // the actual logic is a bit more permissive. If a single file exists, that will be taken,
                    // otherwise the highest level (shortest path) "index.ts" file will be used as the flat
                    // module entry point instead. If neither of these conditions apply, the error below is
                    // given.
                    //
                    // The user is not informed about the "index.ts" option as this behavior is deprecated -
                    // an explicit entrypoint should always be specified.
                    diagnostics.push({
                        category: ts.DiagnosticCategory.Error,
                        code: diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.CONFIG_FLAT_MODULE_NO_INDEX),
                        file: undefined,
                        start: undefined,
                        length: undefined,
                        messageText: 'Angular compiler option "flatModuleOutFile" requires one and only one .ts file in the "files" field.',
                    });
                }
                else {
                    var flatModuleId = options.flatModuleId || null;
                    var flatModuleOutFile = path_1.normalizeSeparators(options.flatModuleOutFile);
                    var flatIndexGenerator = new entry_point_1.FlatIndexGenerator(entryPoint, flatModuleOutFile, flatModuleId);
                    topLevelShimGenerators.push(flatIndexGenerator);
                }
            }
            var shimAdapter = new shims_1.ShimAdapter(delegate, normalizedTsInputFiles, topLevelShimGenerators, perFileShimGenerators, oldProgram);
            var shimTagger = new shims_1.ShimReferenceTagger(perFileShimGenerators.map(function (gen) { return gen.extensionPrefix; }));
            return new NgCompilerHost(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, factoryTracker, diagnostics);
        };
        /**
         * Check whether the given `ts.SourceFile` is a shim file.
         *
         * If this returns false, the file is user-provided.
         */
        NgCompilerHost.prototype.isShim = function (sf) {
            return shims_1.isShim(sf);
        };
        NgCompilerHost.prototype.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
            // Is this a previously known shim?
            var shimSf = this.shimAdapter.maybeGenerate(file_system_1.resolve(fileName));
            if (shimSf !== null) {
                // Yes, so return it.
                return shimSf;
            }
            // No, so it's a file which might need shims (or a file which doesn't exist).
            var sf = this.delegate.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
            if (sf === undefined) {
                return undefined;
            }
            this.shimTagger.tag(sf);
            return sf;
        };
        NgCompilerHost.prototype.fileExists = function (fileName) {
            // Consider the file as existing whenever
            //  1) it really does exist in the delegate host, or
            //  2) at least one of the shim generators recognizes it
            // Note that we can pass the file name as branded absolute fs path because TypeScript
            // internally only passes POSIX-like paths.
            //
            // Also note that the `maybeGenerate` check below checks for both `null` and `undefined`.
            return this.delegate.fileExists(fileName) ||
                this.shimAdapter.maybeGenerate(file_system_1.resolve(fileName)) != null;
        };
        Object.defineProperty(NgCompilerHost.prototype, "unifiedModulesHost", {
            get: function () {
                return this.fileNameToModuleName !== undefined ? this : null;
            },
            enumerable: false,
            configurable: true
        });
        return NgCompilerHost;
    }(DelegatingCompilerHost));
    exports.NgCompilerHost = NgCompilerHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvY29yZS9zcmMvaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQWlDO0lBRWpDLDJFQUF5RDtJQUN6RCwyRUFBOEU7SUFDOUUsMkVBQTBEO0lBQzFELCtEQUF5RztJQUV6Ryx1RUFBdUQ7SUFDdkQsc0VBQXdEO0lBQ3hELGtGQUFtRztJQUduRyw2RkFBNkY7SUFDN0Ysb0dBQW9HO0lBQ3BHLGtHQUFrRztJQUNsRywrRkFBK0Y7SUFFL0Y7Ozs7OztPQU1HO0lBQ0g7UUFFRSxnQ0FBc0IsUUFBZ0M7WUFBaEMsYUFBUSxHQUFSLFFBQVEsQ0FBd0I7WUFRdEQsa0dBQWtHO1lBQ2xHLFNBQVM7WUFDVCxlQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQyxvQkFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN6RCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbkUseUJBQW9CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25FLHlCQUFvQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNuRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDakUsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3JFLDBCQUFxQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNyRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENB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QUFFLHlCQUF5QixDQUFDLENBQUM7WUFDL0YsSUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO2dCQUNwQixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVELG1DQUFVLEdBQVYsVUFBVyxRQUFnQjtZQUN6Qix5Q0FBeUM7WUFDekMsb0RBQW9EO1lBQ3BELHdEQUF3RDtZQUN4RCxxRkFBcUY7WUFDckYsMkNBQTJDO1lBQzNDLEVBQUU7WUFDRix5RkFBeUY7WUFDekYsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHFCQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDaEUsQ0FBQztRQUVELHNCQUFJLDhDQUFrQjtpQkFBdEI7Z0JBQ0UsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUEwQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDckYsQ0FBQzs7O1dBQUE7UUFDSCxxQkFBQztJQUFELENBQUMsQUF4TEQsQ0FBb0Msc0JBQXNCLEdBd0x6RDtJQXhMWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtFcnJvckNvZGUsIG5nRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9kaWFnbm9zdGljcyc7XG5pbXBvcnQge2ZpbmRGbGF0SW5kZXhFbnRyeVBvaW50LCBGbGF0SW5kZXhHZW5lcmF0b3J9IGZyb20gJy4uLy4uL2VudHJ5X3BvaW50JztcbmltcG9ydCB7QWJzb2x1dGVGc1BhdGgsIHJlc29sdmV9IGZyb20gJy4uLy4uL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7RmFjdG9yeUdlbmVyYXRvciwgaXNTaGltLCBTaGltQWRhcHRlciwgU2hpbVJlZmVyZW5jZVRhZ2dlciwgU3VtbWFyeUdlbmVyYXRvcn0gZnJvbSAnLi4vLi4vc2hpbXMnO1xuaW1wb3J0IHtGYWN0b3J5VHJhY2tlciwgUGVyRmlsZVNoaW1HZW5lcmF0b3IsIFRvcExldmVsU2hpbUdlbmVyYXRvcn0gZnJvbSAnLi4vLi4vc2hpbXMvYXBpJztcbmltcG9ydCB7VHlwZUNoZWNrU2hpbUdlbmVyYXRvcn0gZnJvbSAnLi4vLi4vdHlwZWNoZWNrJztcbmltcG9ydCB7bm9ybWFsaXplU2VwYXJhdG9yc30gZnJvbSAnLi4vLi4vdXRpbC9zcmMvcGF0aCc7XG5pbXBvcnQge2dldFJvb3REaXJzLCBpc05vbkRlY2xhcmF0aW9uVHNQYXRoLCBSZXF1aXJlZERlbGVnYXRpb25zfSBmcm9tICcuLi8uLi91dGlsL3NyYy90eXBlc2NyaXB0JztcbmltcG9ydCB7RXh0ZW5kZWRUc0NvbXBpbGVySG9zdCwgTmdDb21waWxlckFkYXB0ZXIsIE5nQ29tcGlsZXJPcHRpb25zLCBVbmlmaWVkTW9kdWxlc0hvc3R9IGZyb20gJy4uL2FwaSc7XG5cbi8vIEEgcGVyc2lzdGVudCBzb3VyY2Ugb2YgYnVncyBpbiBDb21waWxlckhvc3QgZGVsZWdhdGlvbiBoYXMgYmVlbiB0aGUgYWRkaXRpb24gYnkgVFMgb2YgbmV3LFxuLy8gb3B0aW9uYWwgbWV0aG9kcyBvbiB0cy5Db21waWxlckhvc3QuIFNpbmNlIHRoZXNlIG1ldGhvZHMgYXJlIG9wdGlvbmFsLCBpdCdzIG5vdCBhIHR5cGUgZXJyb3IgdGhhdFxuLy8gdGhlIGRlbGVnYXRpbmcgaG9zdCBkb2Vzbid0IGltcGxlbWVudCBvciBkZWxlZ2F0ZSB0aGVtLiBUaGlzIGNhdXNlcyBzdWJ0bGUgcnVudGltZSBmYWlsdXJlcy4gTm9cbi8vIG1vcmUuIFRoaXMgaW5mcmFzdHJ1Y3R1cmUgZW5zdXJlcyB0aGF0IGZhaWxpbmcgdG8gZGVsZWdhdGUgYSBtZXRob2QgaXMgYSBjb21waWxlLXRpbWUgZXJyb3IuXG5cbi8qKlxuICogRGVsZWdhdGVzIGFsbCBtZXRob2RzIG9mIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCB0byBhIGRlbGVnYXRlLCB3aXRoIHRoZSBleGNlcHRpb24gb2ZcbiAqIGBnZXRTb3VyY2VGaWxlYCBhbmQgYGZpbGVFeGlzdHNgIHdoaWNoIGFyZSBpbXBsZW1lbnRlZCBpbiBgTmdDb21waWxlckhvc3RgLlxuICpcbiAqIElmIGEgbmV3IG1ldGhvZCBpcyBhZGRlZCB0byBgdHMuQ29tcGlsZXJIb3N0YCB3aGljaCBpcyBub3QgZGVsZWdhdGVkLCBhIHR5cGUgZXJyb3Igd2lsbCBiZVxuICogZ2VuZXJhdGVkIGZvciB0aGlzIGNsYXNzLlxuICovXG5leHBvcnQgY2xhc3MgRGVsZWdhdGluZ0NvbXBpbGVySG9zdCBpbXBsZW1lbnRzXG4gICAgT21pdDxSZXF1aXJlZERlbGVnYXRpb25zPEV4dGVuZGVkVHNDb21waWxlckhvc3Q+LCAnZ2V0U291cmNlRmlsZSd8J2ZpbGVFeGlzdHMnPiB7XG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBkZWxlZ2F0ZTogRXh0ZW5kZWRUc0NvbXBpbGVySG9zdCkge31cblxuICBwcml2YXRlIGRlbGVnYXRlTWV0aG9kPE0gZXh0ZW5kcyBrZXlvZiBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0PihuYW1lOiBNKTpcbiAgICAgIEV4dGVuZGVkVHNDb21waWxlckhvc3RbTV0ge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlW25hbWVdICE9PSB1bmRlZmluZWQgPyAodGhpcy5kZWxlZ2F0ZVtuYW1lXSBhcyBhbnkpLmJpbmQodGhpcy5kZWxlZ2F0ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBFeGNsdWRlZCBhcmUgJ2dldFNvdXJjZUZpbGUnIGFuZCAnZmlsZUV4aXN0cycsIHdoaWNoIGFyZSBhY3R1YWxseSBpbXBsZW1lbnRlZCBieSBOZ0NvbXBpbGVySG9zdFxuICAvLyBiZWxvdy5cbiAgY3JlYXRlSGFzaCA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2NyZWF0ZUhhc2gnKTtcbiAgZGlyZWN0b3J5RXhpc3RzID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZGlyZWN0b3J5RXhpc3RzJyk7XG4gIGZpbGVOYW1lVG9Nb2R1bGVOYW1lID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZmlsZU5hbWVUb01vZHVsZU5hbWUnKTtcbiAgZ2V0Q2FuY2VsbGF0aW9uVG9rZW4gPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRDYW5jZWxsYXRpb25Ub2tlbicpO1xuICBnZXRDYW5vbmljYWxGaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldENhbm9uaWNhbEZpbGVOYW1lJyk7XG4gIGdldEN1cnJlbnREaXJlY3RvcnkgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRDdXJyZW50RGlyZWN0b3J5Jyk7XG4gIGdldERlZmF1bHRMaWJGaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldERlZmF1bHRMaWJGaWxlTmFtZScpO1xuICBnZXREZWZhdWx0TGliTG9jYXRpb24gPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXREZWZhdWx0TGliTG9jYXRpb24nKTtcbiAgZ2V0RGlyZWN0b3JpZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXREaXJlY3RvcmllcycpO1xuICBnZXRFbnZpcm9ubWVudFZhcmlhYmxlID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZ2V0RW52aXJvbm1lbnRWYXJpYWJsZScpO1xuICBnZXRNb2RpZmllZFJlc291cmNlRmlsZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRNb2RpZmllZFJlc291cmNlRmlsZXMnKTtcbiAgZ2V0TmV3TGluZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldE5ld0xpbmUnKTtcbiAgZ2V0UGFyc2VkQ29tbWFuZExpbmUgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRQYXJzZWRDb21tYW5kTGluZScpO1xuICBnZXRTb3VyY2VGaWxlQnlQYXRoID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZ2V0U291cmNlRmlsZUJ5UGF0aCcpO1xuICByZWFkRGlyZWN0b3J5ID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgncmVhZERpcmVjdG9yeScpO1xuICByZWFkRmlsZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWRGaWxlJyk7XG4gIHJlYWRSZXNvdXJjZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWRSZXNvdXJjZScpO1xuICByZWFscGF0aCA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWxwYXRoJyk7XG4gIHJlc29sdmVNb2R1bGVOYW1lcyA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3Jlc29sdmVNb2R1bGVOYW1lcycpO1xuICByZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdyZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXMnKTtcbiAgcmVzb3VyY2VOYW1lVG9GaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3Jlc291cmNlTmFtZVRvRmlsZU5hbWUnKTtcbiAgdHJhY2UgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCd0cmFjZScpO1xuICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgndXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcycpO1xuICB3cml0ZUZpbGUgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCd3cml0ZUZpbGUnKTtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGB0cy5Db21waWxlckhvc3RgIChwbHVzIGFueSBleHRlbnNpb24gbWV0aG9kcyBmcm9tIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCkuXG4gKlxuICogSW4gb3JkZXIgZm9yIGEgY29uc3VtZXIgdG8gaW5jbHVkZSBBbmd1bGFyIGNvbXBpbGF0aW9uIGluIHRoZWlyIFR5cGVTY3JpcHQgY29tcGlsZXIsIHRoZVxuICogYHRzLlByb2dyYW1gIG11c3QgYmUgY3JlYXRlZCB3aXRoIGEgaG9zdCB0aGF0IGFkZHMgQW5ndWxhci1zcGVjaWZpYyBmaWxlcyAoZS5nLiBmYWN0b3JpZXMsXG4gKiBzdW1tYXJpZXMsIHRoZSB0ZW1wbGF0ZSB0eXBlLWNoZWNraW5nIGZpbGUsIGV0YykgdG8gdGhlIGNvbXBpbGF0aW9uLiBgTmdDb21waWxlckhvc3RgIGlzIHRoZVxuICogaG9zdCBpbXBsZW1lbnRhdGlvbiB3aGljaCBzdXBwb3J0cyB0aGlzLlxuICpcbiAqIFRoZSBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb25zIGhlcmUgZW5zdXJlIHRoYXQgYE5nQ29tcGlsZXJIb3N0YCBmdWxseSBkZWxlZ2F0ZXMgdG9cbiAqIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCBtZXRob2RzIHdoZW5ldmVyIHByZXNlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ0NvbXBpbGVySG9zdCBleHRlbmRzIERlbGVnYXRpbmdDb21waWxlckhvc3QgaW1wbGVtZW50c1xuICAgIFJlcXVpcmVkRGVsZWdhdGlvbnM8RXh0ZW5kZWRUc0NvbXBpbGVySG9zdD4sIEV4dGVuZGVkVHNDb21waWxlckhvc3QsIE5nQ29tcGlsZXJBZGFwdGVyIHtcbiAgcmVhZG9ubHkgZmFjdG9yeVRyYWNrZXI6IEZhY3RvcnlUcmFja2VyfG51bGwgPSBudWxsO1xuICByZWFkb25seSBlbnRyeVBvaW50OiBBYnNvbHV0ZUZzUGF0aHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgY29uc3RydWN0aW9uRGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXTtcblxuICByZWFkb25seSBpbnB1dEZpbGVzOiBSZWFkb25seUFycmF5PHN0cmluZz47XG4gIHJlYWRvbmx5IHJvb3REaXJzOiBSZWFkb25seUFycmF5PEFic29sdXRlRnNQYXRoPjtcblxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZGVsZWdhdGU6IEV4dGVuZGVkVHNDb21waWxlckhvc3QsIGlucHV0RmlsZXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgICAgIHJvb3REaXJzOiBSZWFkb25seUFycmF5PEFic29sdXRlRnNQYXRoPiwgcHJpdmF0ZSBzaGltQWRhcHRlcjogU2hpbUFkYXB0ZXIsXG4gICAgICBwcml2YXRlIHNoaW1UYWdnZXI6IFNoaW1SZWZlcmVuY2VUYWdnZXIsIGVudHJ5UG9pbnQ6IEFic29sdXRlRnNQYXRofG51bGwsXG4gICAgICBmYWN0b3J5VHJhY2tlcjogRmFjdG9yeVRyYWNrZXJ8bnVsbCwgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSkge1xuICAgIHN1cGVyKGRlbGVnYXRlKTtcblxuICAgIHRoaXMuZmFjdG9yeVRyYWNrZXIgPSBmYWN0b3J5VHJhY2tlcjtcbiAgICB0aGlzLmVudHJ5UG9pbnQgPSBlbnRyeVBvaW50O1xuICAgIHRoaXMuY29uc3RydWN0aW9uRGlhZ25vc3RpY3MgPSBkaWFnbm9zdGljcztcbiAgICB0aGlzLmlucHV0RmlsZXMgPSBbLi4uaW5wdXRGaWxlcywgLi4uc2hpbUFkYXB0ZXIuZXh0cmFJbnB1dEZpbGVzXTtcbiAgICB0aGlzLnJvb3REaXJzID0gcm9vdERpcnM7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgc2V0IG9mIGB0cy5Tb3VyY2VGaWxlYHMgd2hpY2ggc2hvdWxkIG5vdCBiZSBlbWl0dGVkIGFzIEpTIGZpbGVzLlxuICAgKlxuICAgKiBBdmFpbGFibGUgYWZ0ZXIgdGhpcyBob3N0IGlzIHVzZWQgdG8gY3JlYXRlIGEgYHRzLlByb2dyYW1gICh3aGljaCBjYXVzZXMgYWxsIHRoZSBmaWxlcyBpbiB0aGVcbiAgICogcHJvZ3JhbSB0byBiZSBlbnVtZXJhdGVkKS5cbiAgICovXG4gIGdldCBpZ25vcmVGb3JFbWl0KCk6IFNldDx0cy5Tb3VyY2VGaWxlPiB7XG4gICAgcmV0dXJuIHRoaXMuc2hpbUFkYXB0ZXIuaWdub3JlRm9yRW1pdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgYXJyYXkgb2Ygc2hpbSBleHRlbnNpb24gcHJlZml4ZXMgZm9yIHdoaWNoIHNoaW1zIHdlcmUgY3JlYXRlZCBmb3IgZWFjaCBvcmlnaW5hbFxuICAgKiBmaWxlLlxuICAgKi9cbiAgZ2V0IHNoaW1FeHRlbnNpb25QcmVmaXhlcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2hpbUFkYXB0ZXIuZXh0ZW5zaW9uUHJlZml4ZXM7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgY2xlYW51cCB0aGF0IG5lZWRzIHRvIGhhcHBlbiBhZnRlciBhIGB0cy5Qcm9ncmFtYCBoYXMgYmVlbiBjcmVhdGVkIHVzaW5nIHRoaXMgaG9zdC5cbiAgICovXG4gIHBvc3RQcm9ncmFtQ3JlYXRpb25DbGVhbnVwKCk6IHZvaWQge1xuICAgIHRoaXMuc2hpbVRhZ2dlci5maW5hbGl6ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBgTmdDb21waWxlckhvc3RgIGZyb20gYSBkZWxlZ2F0ZSBob3N0LCBhbiBhcnJheSBvZiBpbnB1dCBmaWxlbmFtZXMsIGFuZCB0aGUgZnVsbCBzZXRcbiAgICogb2YgVHlwZVNjcmlwdCBhbmQgQW5ndWxhciBjb21waWxlciBvcHRpb25zLlxuICAgKi9cbiAgc3RhdGljIHdyYXAoXG4gICAgICBkZWxlZ2F0ZTogdHMuQ29tcGlsZXJIb3N0LCBpbnB1dEZpbGVzOiBSZWFkb25seUFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE5nQ29tcGlsZXJPcHRpb25zLFxuICAgICAgb2xkUHJvZ3JhbTogdHMuUHJvZ3JhbXxudWxsKTogTmdDb21waWxlckhvc3Qge1xuICAgIC8vIFRPRE8oYWx4aHViKTogcmVtb3ZlIHRoZSBmYWxsYmFjayB0byBhbGxvd0VtcHR5Q29kZWdlbkZpbGVzIGFmdGVyIHZlcmlmeWluZyB0aGF0IHRoZSByZXN0IG9mXG4gICAgLy8gb3VyIGJ1aWxkIHRvb2xpbmcgaXMgbm8gbG9uZ2VyIHJlbHlpbmcgb24gaXQuXG4gICAgY29uc3QgYWxsb3dFbXB0eUNvZGVnZW5GaWxlcyA9IG9wdGlvbnMuYWxsb3dFbXB0eUNvZGVnZW5GaWxlcyB8fCBmYWxzZTtcbiAgICBjb25zdCBzaG91bGRHZW5lcmF0ZUZhY3RvcnlTaGltcyA9IG9wdGlvbnMuZ2VuZXJhdGVOZ0ZhY3RvcnlTaGltcyAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgb3B0aW9ucy5nZW5lcmF0ZU5nRmFjdG9yeVNoaW1zIDpcbiAgICAgICAgYWxsb3dFbXB0eUNvZGVnZW5GaWxlcztcblxuICAgIGNvbnN0IHNob3VsZEdlbmVyYXRlU3VtbWFyeVNoaW1zID0gb3B0aW9ucy5nZW5lcmF0ZU5nU3VtbWFyeVNoaW1zICE9PSB1bmRlZmluZWQgP1xuICAgICAgICBvcHRpb25zLmdlbmVyYXRlTmdTdW1tYXJ5U2hpbXMgOlxuICAgICAgICBhbGxvd0VtcHR5Q29kZWdlbkZpbGVzO1xuXG5cbiAgICBjb25zdCB0b3BMZXZlbFNoaW1HZW5lcmF0b3JzOiBUb3BMZXZlbFNoaW1HZW5lcmF0b3JbXSA9IFtdO1xuICAgIGNvbnN0IHBlckZpbGVTaGltR2VuZXJhdG9yczogUGVyRmlsZVNoaW1HZW5lcmF0b3JbXSA9IFtdO1xuXG4gICAgaWYgKHNob3VsZEdlbmVyYXRlU3VtbWFyeVNoaW1zKSB7XG4gICAgICAvLyBTdW1tYXJ5IGdlbmVyYXRpb24uXG4gICAgICBwZXJGaWxlU2hpbUdlbmVyYXRvcnMucHVzaChuZXcgU3VtbWFyeUdlbmVyYXRvcigpKTtcbiAgICB9XG5cbiAgICBsZXQgZmFjdG9yeVRyYWNrZXI6IEZhY3RvcnlUcmFja2VyfG51bGwgPSBudWxsO1xuICAgIGlmIChzaG91bGRHZW5lcmF0ZUZhY3RvcnlTaGltcykge1xuICAgICAgY29uc3QgZmFjdG9yeUdlbmVyYXRvciA9IG5ldyBGYWN0b3J5R2VuZXJhdG9yKCk7XG4gICAgICBwZXJGaWxlU2hpbUdlbmVyYXRvcnMucHVzaChmYWN0b3J5R2VuZXJhdG9yKTtcblxuICAgICAgZmFjdG9yeVRyYWNrZXIgPSBmYWN0b3J5R2VuZXJhdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3REaXJzID0gZ2V0Um9vdERpcnMoZGVsZWdhdGUsIG9wdGlvbnMgYXMgdHMuQ29tcGlsZXJPcHRpb25zKTtcblxuICAgIHBlckZpbGVTaGltR2VuZXJhdG9ycy5wdXNoKG5ldyBUeXBlQ2hlY2tTaGltR2VuZXJhdG9yKCkpO1xuXG4gICAgbGV0IGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW10gPSBbXTtcblxuICAgIGNvbnN0IG5vcm1hbGl6ZWRUc0lucHV0RmlsZXM6IEFic29sdXRlRnNQYXRoW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGlucHV0RmlsZSBvZiBpbnB1dEZpbGVzKSB7XG4gICAgICBpZiAoIWlzTm9uRGVjbGFyYXRpb25Uc1BhdGgoaW5wdXRGaWxlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG5vcm1hbGl6ZWRUc0lucHV0RmlsZXMucHVzaChyZXNvbHZlKGlucHV0RmlsZSkpO1xuICAgIH1cblxuICAgIGxldCBlbnRyeVBvaW50OiBBYnNvbHV0ZUZzUGF0aHxudWxsID0gbnVsbDtcbiAgICBpZiAob3B0aW9ucy5mbGF0TW9kdWxlT3V0RmlsZSAhPSBudWxsICYmIG9wdGlvbnMuZmxhdE1vZHVsZU91dEZpbGUgIT09ICcnKSB7XG4gICAgICBlbnRyeVBvaW50ID0gZmluZEZsYXRJbmRleEVudHJ5UG9pbnQobm9ybWFsaXplZFRzSW5wdXRGaWxlcyk7XG4gICAgICBpZiAoZW50cnlQb2ludCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBUaGlzIGVycm9yIG1lc3NhZ2UgdGFsa3Mgc3BlY2lmaWNhbGx5IGFib3V0IGhhdmluZyBhIHNpbmdsZSAudHMgZmlsZSBpbiBcImZpbGVzXCIuIEhvd2V2ZXJcbiAgICAgICAgLy8gdGhlIGFjdHVhbCBsb2dpYyBpcyBhIGJpdCBtb3JlIHBlcm1pc3NpdmUuIElmIGEgc2luZ2xlIGZpbGUgZXhpc3RzLCB0aGF0IHdpbGwgYmUgdGFrZW4sXG4gICAgICAgIC8vIG90aGVyd2lzZSB0aGUgaGlnaGVzdCBsZXZlbCAoc2hvcnRlc3QgcGF0aCkgXCJpbmRleC50c1wiIGZpbGUgd2lsbCBiZSB1c2VkIGFzIHRoZSBmbGF0XG4gICAgICAgIC8vIG1vZHVsZSBlbnRyeSBwb2ludCBpbnN0ZWFkLiBJZiBuZWl0aGVyIG9mIHRoZXNlIGNvbmRpdGlvbnMgYXBwbHksIHRoZSBlcnJvciBiZWxvdyBpc1xuICAgICAgICAvLyBnaXZlbi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIHVzZXIgaXMgbm90IGluZm9ybWVkIGFib3V0IHRoZSBcImluZGV4LnRzXCIgb3B0aW9uIGFzIHRoaXMgYmVoYXZpb3IgaXMgZGVwcmVjYXRlZCAtXG4gICAgICAgIC8vIGFuIGV4cGxpY2l0IGVudHJ5cG9pbnQgc2hvdWxkIGFsd2F5cyBiZSBzcGVjaWZpZWQuXG4gICAgICAgIGRpYWdub3N0aWNzLnB1c2goe1xuICAgICAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgICAgY29kZTogbmdFcnJvckNvZGUoRXJyb3JDb2RlLkNPTkZJR19GTEFUX01PRFVMRV9OT19JTkRFWCksXG4gICAgICAgICAgZmlsZTogdW5kZWZpbmVkLFxuICAgICAgICAgIHN0YXJ0OiB1bmRlZmluZWQsXG4gICAgICAgICAgbGVuZ3RoOiB1bmRlZmluZWQsXG4gICAgICAgICAgbWVzc2FnZVRleHQ6XG4gICAgICAgICAgICAgICdBbmd1bGFyIGNvbXBpbGVyIG9wdGlvbiBcImZsYXRNb2R1bGVPdXRGaWxlXCIgcmVxdWlyZXMgb25lIGFuZCBvbmx5IG9uZSAudHMgZmlsZSBpbiB0aGUgXCJmaWxlc1wiIGZpZWxkLicsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZmxhdE1vZHVsZUlkID0gb3B0aW9ucy5mbGF0TW9kdWxlSWQgfHwgbnVsbDtcbiAgICAgICAgY29uc3QgZmxhdE1vZHVsZU91dEZpbGUgPSBub3JtYWxpemVTZXBhcmF0b3JzKG9wdGlvbnMuZmxhdE1vZHVsZU91dEZpbGUpO1xuICAgICAgICBjb25zdCBmbGF0SW5kZXhHZW5lcmF0b3IgPVxuICAgICAgICAgICAgbmV3IEZsYXRJbmRleEdlbmVyYXRvcihlbnRyeVBvaW50LCBmbGF0TW9kdWxlT3V0RmlsZSwgZmxhdE1vZHVsZUlkKTtcbiAgICAgICAgdG9wTGV2ZWxTaGltR2VuZXJhdG9ycy5wdXNoKGZsYXRJbmRleEdlbmVyYXRvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2hpbUFkYXB0ZXIgPSBuZXcgU2hpbUFkYXB0ZXIoXG4gICAgICAgIGRlbGVnYXRlLCBub3JtYWxpemVkVHNJbnB1dEZpbGVzLCB0b3BMZXZlbFNoaW1HZW5lcmF0b3JzLCBwZXJGaWxlU2hpbUdlbmVyYXRvcnMsXG4gICAgICAgIG9sZFByb2dyYW0pO1xuICAgIGNvbnN0IHNoaW1UYWdnZXIgPVxuICAgICAgICBuZXcgU2hpbVJlZmVyZW5jZVRhZ2dlcihwZXJGaWxlU2hpbUdlbmVyYXRvcnMubWFwKGdlbiA9PiBnZW4uZXh0ZW5zaW9uUHJlZml4KSk7XG4gICAgcmV0dXJuIG5ldyBOZ0NvbXBpbGVySG9zdChcbiAgICAgICAgZGVsZWdhdGUsIGlucHV0RmlsZXMsIHJvb3REaXJzLCBzaGltQWRhcHRlciwgc2hpbVRhZ2dlciwgZW50cnlQb2ludCwgZmFjdG9yeVRyYWNrZXIsXG4gICAgICAgIGRpYWdub3N0aWNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiBgdHMuU291cmNlRmlsZWAgaXMgYSBzaGltIGZpbGUuXG4gICAqXG4gICAqIElmIHRoaXMgcmV0dXJucyBmYWxzZSwgdGhlIGZpbGUgaXMgdXNlci1wcm92aWRlZC5cbiAgICovXG4gIGlzU2hpbShzZjogdHMuU291cmNlRmlsZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc1NoaW0oc2YpO1xuICB9XG5cbiAgZ2V0U291cmNlRmlsZShcbiAgICAgIGZpbGVOYW1lOiBzdHJpbmcsIGxhbmd1YWdlVmVyc2lvbjogdHMuU2NyaXB0VGFyZ2V0LFxuICAgICAgb25FcnJvcj86ICgobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkKXx1bmRlZmluZWQsXG4gICAgICBzaG91bGRDcmVhdGVOZXdTb3VyY2VGaWxlPzogYm9vbGVhbnx1bmRlZmluZWQpOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZCB7XG4gICAgLy8gSXMgdGhpcyBhIHByZXZpb3VzbHkga25vd24gc2hpbT9cbiAgICBjb25zdCBzaGltU2YgPSB0aGlzLnNoaW1BZGFwdGVyLm1heWJlR2VuZXJhdGUocmVzb2x2ZShmaWxlTmFtZSkpO1xuICAgIGlmIChzaGltU2YgIT09IG51bGwpIHtcbiAgICAgIC8vIFllcywgc28gcmV0dXJuIGl0LlxuICAgICAgcmV0dXJuIHNoaW1TZjtcbiAgICB9XG5cbiAgICAvLyBObywgc28gaXQncyBhIGZpbGUgd2hpY2ggbWlnaHQgbmVlZCBzaGltcyAob3IgYSBmaWxlIHdoaWNoIGRvZXNuJ3QgZXhpc3QpLlxuICAgIGNvbnN0IHNmID1cbiAgICAgICAgdGhpcy5kZWxlZ2F0ZS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lLCBsYW5ndWFnZVZlcnNpb24sIG9uRXJyb3IsIHNob3VsZENyZWF0ZU5ld1NvdXJjZUZpbGUpO1xuICAgIGlmIChzZiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMuc2hpbVRhZ2dlci50YWcoc2YpO1xuICAgIHJldHVybiBzZjtcbiAgfVxuXG4gIGZpbGVFeGlzdHMoZmlsZU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIENvbnNpZGVyIHRoZSBmaWxlIGFzIGV4aXN0aW5nIHdoZW5ldmVyXG4gICAgLy8gIDEpIGl0IHJlYWxseSBkb2VzIGV4aXN0IGluIHRoZSBkZWxlZ2F0ZSBob3N0LCBvclxuICAgIC8vICAyKSBhdCBsZWFzdCBvbmUgb2YgdGhlIHNoaW0gZ2VuZXJhdG9ycyByZWNvZ25pemVzIGl0XG4gICAgLy8gTm90ZSB0aGF0IHdlIGNhbiBwYXNzIHRoZSBmaWxlIG5hbWUgYXMgYnJhbmRlZCBhYnNvbHV0ZSBmcyBwYXRoIGJlY2F1c2UgVHlwZVNjcmlwdFxuICAgIC8vIGludGVybmFsbHkgb25seSBwYXNzZXMgUE9TSVgtbGlrZSBwYXRocy5cbiAgICAvL1xuICAgIC8vIEFsc28gbm90ZSB0aGF0IHRoZSBgbWF5YmVHZW5lcmF0ZWAgY2hlY2sgYmVsb3cgY2hlY2tzIGZvciBib3RoIGBudWxsYCBhbmQgYHVuZGVmaW5lZGAuXG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZmlsZUV4aXN0cyhmaWxlTmFtZSkgfHxcbiAgICAgICAgdGhpcy5zaGltQWRhcHRlci5tYXliZUdlbmVyYXRlKHJlc29sdmUoZmlsZU5hbWUpKSAhPSBudWxsO1xuICB9XG5cbiAgZ2V0IHVuaWZpZWRNb2R1bGVzSG9zdCgpOiBVbmlmaWVkTW9kdWxlc0hvc3R8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuZmlsZU5hbWVUb01vZHVsZU5hbWUgIT09IHVuZGVmaW5lZCA/IHRoaXMgYXMgVW5pZmllZE1vZHVsZXNIb3N0IDogbnVsbDtcbiAgfVxufVxuIl19
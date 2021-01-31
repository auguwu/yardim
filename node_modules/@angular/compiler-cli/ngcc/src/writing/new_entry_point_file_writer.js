(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/writing/new_entry_point_file_writer", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/util/src/typescript", "@angular/compiler-cli/ngcc/src/writing/in_place_file_writer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewEntryPointFileWriter = exports.NGCC_PROPERTY_EXTENSION = exports.NGCC_DIRECTORY = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    var in_place_file_writer_1 = require("@angular/compiler-cli/ngcc/src/writing/in_place_file_writer");
    exports.NGCC_DIRECTORY = '__ivy_ngcc__';
    exports.NGCC_PROPERTY_EXTENSION = '_ivy_ngcc';
    /**
     * This FileWriter creates a copy of the original entry-point, then writes the transformed
     * files onto the files in this copy, and finally updates the package.json with a new
     * entry-point format property that points to this new entry-point.
     *
     * If there are transformed typings files in this bundle, they are updated in-place (see the
     * `InPlaceFileWriter`).
     */
    var NewEntryPointFileWriter = /** @class */ (function (_super) {
        tslib_1.__extends(NewEntryPointFileWriter, _super);
        function NewEntryPointFileWriter(fs, logger, errorOnFailedEntryPoint, pkgJsonUpdater) {
            var _this = _super.call(this, fs, logger, errorOnFailedEntryPoint) || this;
            _this.pkgJsonUpdater = pkgJsonUpdater;
            return _this;
        }
        NewEntryPointFileWriter.prototype.writeBundle = function (bundle, transformedFiles, formatProperties) {
            var _this = this;
            // The new folder is at the root of the overall package
            var entryPoint = bundle.entryPoint;
            var ngccFolder = this.fs.join(entryPoint.packagePath, exports.NGCC_DIRECTORY);
            this.copyBundle(bundle, entryPoint.packagePath, ngccFolder, transformedFiles);
            transformedFiles.forEach(function (file) { return _this.writeFile(file, entryPoint.packagePath, ngccFolder); });
            this.updatePackageJson(entryPoint, formatProperties, ngccFolder);
        };
        NewEntryPointFileWriter.prototype.revertBundle = function (entryPoint, transformedFilePaths, formatProperties) {
            // IMPLEMENTATION NOTE:
            //
            // The changes made by `copyBundle()` are not reverted here. The non-transformed copied files
            // are identical to the original ones and they will be overwritten when re-processing the
            // entry-point anyway.
            //
            // This way, we avoid the overhead of having to inform the master process about all source files
            // being copied in `copyBundle()`.
            var e_1, _a;
            try {
                // Revert the transformed files.
                for (var transformedFilePaths_1 = tslib_1.__values(transformedFilePaths), transformedFilePaths_1_1 = transformedFilePaths_1.next(); !transformedFilePaths_1_1.done; transformedFilePaths_1_1 = transformedFilePaths_1.next()) {
                    var filePath = transformedFilePaths_1_1.value;
                    this.revertFile(filePath, entryPoint.packagePath);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (transformedFilePaths_1_1 && !transformedFilePaths_1_1.done && (_a = transformedFilePaths_1.return)) _a.call(transformedFilePaths_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Revert any changes to `package.json`.
            this.revertPackageJson(entryPoint, formatProperties);
        };
        NewEntryPointFileWriter.prototype.copyBundle = function (bundle, packagePath, ngccFolder, transformedFiles) {
            var _this = this;
            var doNotCopy = new Set(transformedFiles.map(function (f) { return f.path; }));
            bundle.src.program.getSourceFiles().forEach(function (sourceFile) {
                var originalPath = file_system_1.absoluteFromSourceFile(sourceFile);
                if (doNotCopy.has(originalPath)) {
                    return;
                }
                var relativePath = _this.fs.relative(packagePath, originalPath);
                var isInsidePackage = file_system_1.isLocalRelativePath(relativePath);
                if (!sourceFile.isDeclarationFile && isInsidePackage) {
                    var newPath = _this.fs.resolve(ngccFolder, relativePath);
                    _this.fs.ensureDir(_this.fs.dirname(newPath));
                    _this.fs.copyFile(originalPath, newPath);
                    _this.copyAndUpdateSourceMap(originalPath, newPath);
                }
            });
        };
        /**
         * If a source file has an associated source-map, then copy this, while updating its sourceRoot
         * accordingly.
         *
         * For now don't try to parse the source for inline source-maps or external source-map links,
         * since that is more complex and will slow ngcc down.
         * Instead just check for a source-map file residing next to the source file, which is by far
         * the most common case.
         *
         * @param originalSrcPath absolute path to the original source file being copied.
         * @param newSrcPath absolute path to where the source will be written.
         */
        NewEntryPointFileWriter.prototype.copyAndUpdateSourceMap = function (originalSrcPath, newSrcPath) {
            var _a;
            var sourceMapPath = (originalSrcPath + '.map');
            if (this.fs.exists(sourceMapPath)) {
                try {
                    var sourceMap = JSON.parse(this.fs.readFile(sourceMapPath));
                    var newSourceMapPath = (newSrcPath + '.map');
                    var relativePath = this.fs.relative(this.fs.dirname(newSourceMapPath), this.fs.dirname(sourceMapPath));
                    sourceMap['sourceRoot'] = this.fs.join(relativePath, sourceMap['sourceRoot'] || '.');
                    this.fs.ensureDir(this.fs.dirname(newSourceMapPath));
                    this.fs.writeFile(newSourceMapPath, JSON.stringify(sourceMap));
                }
                catch (e) {
                    this.logger.warn("Failed to process source-map at " + sourceMapPath);
                    this.logger.warn((_a = e.message) !== null && _a !== void 0 ? _a : e);
                }
            }
        };
        NewEntryPointFileWriter.prototype.writeFile = function (file, packagePath, ngccFolder) {
            if (typescript_1.isDtsPath(file.path.replace(/\.map$/, ''))) {
                // This is either `.d.ts` or `.d.ts.map` file
                _super.prototype.writeFileAndBackup.call(this, file);
            }
            else {
                var relativePath = this.fs.relative(packagePath, file.path);
                var newFilePath = this.fs.resolve(ngccFolder, relativePath);
                this.fs.ensureDir(this.fs.dirname(newFilePath));
                this.fs.writeFile(newFilePath, file.contents);
            }
        };
        NewEntryPointFileWriter.prototype.revertFile = function (filePath, packagePath) {
            if (typescript_1.isDtsPath(filePath.replace(/\.map$/, ''))) {
                // This is either `.d.ts` or `.d.ts.map` file
                _super.prototype.revertFileAndBackup.call(this, filePath);
            }
            else if (this.fs.exists(filePath)) {
                var relativePath = this.fs.relative(packagePath, filePath);
                var newFilePath = this.fs.resolve(packagePath, exports.NGCC_DIRECTORY, relativePath);
                this.fs.removeFile(newFilePath);
            }
        };
        NewEntryPointFileWriter.prototype.updatePackageJson = function (entryPoint, formatProperties, ngccFolder) {
            var e_2, _a;
            if (formatProperties.length === 0) {
                // No format properties need updating.
                return;
            }
            var packageJson = entryPoint.packageJson;
            var packageJsonPath = this.fs.join(entryPoint.path, 'package.json');
            // All format properties point to the same format-path.
            var oldFormatProp = formatProperties[0];
            var oldFormatPath = packageJson[oldFormatProp];
            var oldAbsFormatPath = this.fs.resolve(entryPoint.path, oldFormatPath);
            var newAbsFormatPath = this.fs.resolve(ngccFolder, this.fs.relative(entryPoint.packagePath, oldAbsFormatPath));
            var newFormatPath = this.fs.relative(entryPoint.path, newAbsFormatPath);
            // Update all properties in `package.json` (both in memory and on disk).
            var update = this.pkgJsonUpdater.createUpdate();
            try {
                for (var formatProperties_1 = tslib_1.__values(formatProperties), formatProperties_1_1 = formatProperties_1.next(); !formatProperties_1_1.done; formatProperties_1_1 = formatProperties_1.next()) {
                    var formatProperty = formatProperties_1_1.value;
                    if (packageJson[formatProperty] !== oldFormatPath) {
                        throw new Error("Unable to update '" + packageJsonPath + "': Format properties " +
                            ("(" + formatProperties.join(', ') + ") map to more than one format-path."));
                    }
                    update.addChange(["" + formatProperty + exports.NGCC_PROPERTY_EXTENSION], newFormatPath, { before: formatProperty });
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (formatProperties_1_1 && !formatProperties_1_1.done && (_a = formatProperties_1.return)) _a.call(formatProperties_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            update.writeChanges(packageJsonPath, packageJson);
        };
        NewEntryPointFileWriter.prototype.revertPackageJson = function (entryPoint, formatProperties) {
            var e_3, _a;
            if (formatProperties.length === 0) {
                // No format properties need reverting.
                return;
            }
            var packageJson = entryPoint.packageJson;
            var packageJsonPath = this.fs.join(entryPoint.path, 'package.json');
            // Revert all properties in `package.json` (both in memory and on disk).
            // Since `updatePackageJson()` only adds properties, it is safe to just remove them (if they
            // exist).
            var update = this.pkgJsonUpdater.createUpdate();
            try {
                for (var formatProperties_2 = tslib_1.__values(formatProperties), formatProperties_2_1 = formatProperties_2.next(); !formatProperties_2_1.done; formatProperties_2_1 = formatProperties_2.next()) {
                    var formatProperty = formatProperties_2_1.value;
                    update.addChange(["" + formatProperty + exports.NGCC_PROPERTY_EXTENSION], undefined);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (formatProperties_2_1 && !formatProperties_2_1.done && (_a = formatProperties_2.return)) _a.call(formatProperties_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            update.writeChanges(packageJsonPath, packageJson);
        };
        return NewEntryPointFileWriter;
    }(in_place_file_writer_1.InPlaceFileWriter));
    exports.NewEntryPointFileWriter = NewEntryPointFileWriter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3X2VudHJ5X3BvaW50X2ZpbGVfd3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL25nY2Mvc3JjL3dyaXRpbmcvbmV3X2VudHJ5X3BvaW50X2ZpbGVfd3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFDQTs7Ozs7O09BTUc7SUFDSCwyRUFBdUg7SUFFdkgsa0ZBQWlFO0lBS2pFLG9HQUF5RDtJQUc1QyxRQUFBLGNBQWMsR0FBRyxjQUFjLENBQUM7SUFDaEMsUUFBQSx1QkFBdUIsR0FBRyxXQUFXLENBQUM7SUFFbkQ7Ozs7Ozs7T0FPRztJQUNIO1FBQTZDLG1EQUFpQjtRQUM1RCxpQ0FDSSxFQUFjLEVBQUUsTUFBYyxFQUFFLHVCQUFnQyxFQUN4RCxjQUFrQztZQUY5QyxZQUdFLGtCQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsdUJBQXVCLENBQUMsU0FDM0M7WUFGVyxvQkFBYyxHQUFkLGNBQWMsQ0FBb0I7O1FBRTlDLENBQUM7UUFFRCw2Q0FBVyxHQUFYLFVBQ0ksTUFBd0IsRUFBRSxnQkFBK0IsRUFDekQsZ0JBQTBDO1lBRjlDLGlCQVNDO1lBTkMsdURBQXVEO1lBQ3ZELElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7WUFDckMsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxzQkFBYyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM5RSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFLFVBQVUs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QTNCLFVBQTRCLFVBQXNCLEVBQUUsZ0JBQTBDOztZQUM1RixJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ2pDLHVDQUF1QztnQkFDdkMsT0FBTzthQUNSO1lBRUQsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUMzQyxJQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLHdFQUF3RTtZQUN4RSw0RkFBNEY7WUFDNUYsVUFBVTtZQUNWLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUM7O2dCQUVsRCxLQUE2QixJQUFBLHFCQUFBLGlCQUFBLGdCQUFnQixDQUFBLGtEQUFBLGdGQUFFO29CQUExQyxJQUFNLGNBQWMsNkJBQUE7b0JBQ3ZCLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFHLGNBQWMsR0FBRywrQkFBeUIsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2lCQUM5RTs7Ozs7Ozs7O1lBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNILDhCQUFDO0lBQUQsQ0FBQyxBQTFLRCxDQUE2Qyx3Q0FBaUIsR0EwSzdEO0lBMUtZLDBEQUF1QiIsInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fic29sdXRlRnJvbVNvdXJjZUZpbGUsIEFic29sdXRlRnNQYXRoLCBGaWxlU3lzdGVtLCBpc0xvY2FsUmVsYXRpdmVQYXRofSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0nO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9sb2dnaW5nJztcbmltcG9ydCB7aXNEdHNQYXRofSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2MvdXRpbC9zcmMvdHlwZXNjcmlwdCc7XG5pbXBvcnQge0VudHJ5UG9pbnQsIEVudHJ5UG9pbnRKc29uUHJvcGVydHl9IGZyb20gJy4uL3BhY2thZ2VzL2VudHJ5X3BvaW50JztcbmltcG9ydCB7RW50cnlQb2ludEJ1bmRsZX0gZnJvbSAnLi4vcGFja2FnZXMvZW50cnlfcG9pbnRfYnVuZGxlJztcbmltcG9ydCB7RmlsZVRvV3JpdGV9IGZyb20gJy4uL3JlbmRlcmluZy91dGlscyc7XG5cbmltcG9ydCB7SW5QbGFjZUZpbGVXcml0ZXJ9IGZyb20gJy4vaW5fcGxhY2VfZmlsZV93cml0ZXInO1xuaW1wb3J0IHtQYWNrYWdlSnNvblVwZGF0ZXJ9IGZyb20gJy4vcGFja2FnZV9qc29uX3VwZGF0ZXInO1xuXG5leHBvcnQgY29uc3QgTkdDQ19ESVJFQ1RPUlkgPSAnX19pdnlfbmdjY19fJztcbmV4cG9ydCBjb25zdCBOR0NDX1BST1BFUlRZX0VYVEVOU0lPTiA9ICdfaXZ5X25nY2MnO1xuXG4vKipcbiAqIFRoaXMgRmlsZVdyaXRlciBjcmVhdGVzIGEgY29weSBvZiB0aGUgb3JpZ2luYWwgZW50cnktcG9pbnQsIHRoZW4gd3JpdGVzIHRoZSB0cmFuc2Zvcm1lZFxuICogZmlsZXMgb250byB0aGUgZmlsZXMgaW4gdGhpcyBjb3B5LCBhbmQgZmluYWxseSB1cGRhdGVzIHRoZSBwYWNrYWdlLmpzb24gd2l0aCBhIG5ld1xuICogZW50cnktcG9pbnQgZm9ybWF0IHByb3BlcnR5IHRoYXQgcG9pbnRzIHRvIHRoaXMgbmV3IGVudHJ5LXBvaW50LlxuICpcbiAqIElmIHRoZXJlIGFyZSB0cmFuc2Zvcm1lZCB0eXBpbmdzIGZpbGVzIGluIHRoaXMgYnVuZGxlLCB0aGV5IGFyZSB1cGRhdGVkIGluLXBsYWNlIChzZWUgdGhlXG4gKiBgSW5QbGFjZUZpbGVXcml0ZXJgKS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5ld0VudHJ5UG9pbnRGaWxlV3JpdGVyIGV4dGVuZHMgSW5QbGFjZUZpbGVXcml0ZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIGZzOiBGaWxlU3lzdGVtLCBsb2dnZXI6IExvZ2dlciwgZXJyb3JPbkZhaWxlZEVudHJ5UG9pbnQ6IGJvb2xlYW4sXG4gICAgICBwcml2YXRlIHBrZ0pzb25VcGRhdGVyOiBQYWNrYWdlSnNvblVwZGF0ZXIpIHtcbiAgICBzdXBlcihmcywgbG9nZ2VyLCBlcnJvck9uRmFpbGVkRW50cnlQb2ludCk7XG4gIH1cblxuICB3cml0ZUJ1bmRsZShcbiAgICAgIGJ1bmRsZTogRW50cnlQb2ludEJ1bmRsZSwgdHJhbnNmb3JtZWRGaWxlczogRmlsZVRvV3JpdGVbXSxcbiAgICAgIGZvcm1hdFByb3BlcnRpZXM6IEVudHJ5UG9pbnRKc29uUHJvcGVydHlbXSkge1xuICAgIC8vIFRoZSBuZXcgZm9sZGVyIGlzIGF0IHRoZSByb290IG9mIHRoZSBvdmVyYWxsIHBhY2thZ2VcbiAgICBjb25zdCBlbnRyeVBvaW50ID0gYnVuZGxlLmVudHJ5UG9pbnQ7XG4gICAgY29uc3QgbmdjY0ZvbGRlciA9IHRoaXMuZnMuam9pbihlbnRyeVBvaW50LnBhY2thZ2VQYXRoLCBOR0NDX0RJUkVDVE9SWSk7XG4gICAgdGhpcy5jb3B5QnVuZGxlKGJ1bmRsZSwgZW50cnlQb2ludC5wYWNrYWdlUGF0aCwgbmdjY0ZvbGRlciwgdHJhbnNmb3JtZWRGaWxlcyk7XG4gICAgdHJhbnNmb3JtZWRGaWxlcy5mb3JFYWNoKGZpbGUgPT4gdGhpcy53cml0ZUZpbGUoZmlsZSwgZW50cnlQb2ludC5wYWNrYWdlUGF0aCwgbmdjY0ZvbGRlcikpO1xuICAgIHRoaXMudXBkYXRlUGFja2FnZUpzb24oZW50cnlQb2ludCwgZm9ybWF0UHJvcGVydGllcywgbmdjY0ZvbGRlcik7XG4gIH1cblxuICByZXZlcnRCdW5kbGUoXG4gICAgICBlbnRyeVBvaW50OiBFbnRyeVBvaW50LCB0cmFuc2Zvcm1lZEZpbGVQYXRoczogQWJzb2x1dGVGc1BhdGhbXSxcbiAgICAgIGZvcm1hdFByb3BlcnRpZXM6IEVudHJ5UG9pbnRKc29uUHJvcGVydHlbXSk6IHZvaWQge1xuICAgIC8vIElNUExFTUVOVEFUSU9OIE5PVEU6XG4gICAgLy9cbiAgICAvLyBUaGUgY2hhbmdlcyBtYWRlIGJ5IGBjb3B5QnVuZGxlKClgIGFyZSBub3QgcmV2ZXJ0ZWQgaGVyZS4gVGhlIG5vbi10cmFuc2Zvcm1lZCBjb3BpZWQgZmlsZXNcbiAgICAvLyBhcmUgaWRlbnRpY2FsIHRvIHRoZSBvcmlnaW5hbCBvbmVzIGFuZCB0aGV5IHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2hlbiByZS1wcm9jZXNzaW5nIHRoZVxuICAgIC8vIGVudHJ5LXBvaW50IGFueXdheS5cbiAgICAvL1xuICAgIC8vIFRoaXMgd2F5LCB3ZSBhdm9pZCB0aGUgb3ZlcmhlYWQgb2YgaGF2aW5nIHRvIGluZm9ybSB0aGUgbWFzdGVyIHByb2Nlc3MgYWJvdXQgYWxsIHNvdXJjZSBmaWxlc1xuICAgIC8vIGJlaW5nIGNvcGllZCBpbiBgY29weUJ1bmRsZSgpYC5cblxuICAgIC8vIFJldmVydCB0aGUgdHJhbnNmb3JtZWQgZmlsZXMuXG4gICAgZm9yIChjb25zdCBmaWxlUGF0aCBvZiB0cmFuc2Zvcm1lZEZpbGVQYXRocykge1xuICAgICAgdGhpcy5yZXZlcnRGaWxlKGZpbGVQYXRoLCBlbnRyeVBvaW50LnBhY2thZ2VQYXRoKTtcbiAgICB9XG5cbiAgICAvLyBSZXZlcnQgYW55IGNoYW5nZXMgdG8gYHBhY2thZ2UuanNvbmAuXG4gICAgdGhpcy5yZXZlcnRQYWNrYWdlSnNvbihlbnRyeVBvaW50LCBmb3JtYXRQcm9wZXJ0aWVzKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjb3B5QnVuZGxlKFxuICAgICAgYnVuZGxlOiBFbnRyeVBvaW50QnVuZGxlLCBwYWNrYWdlUGF0aDogQWJzb2x1dGVGc1BhdGgsIG5nY2NGb2xkZXI6IEFic29sdXRlRnNQYXRoLFxuICAgICAgdHJhbnNmb3JtZWRGaWxlczogRmlsZVRvV3JpdGVbXSkge1xuICAgIGNvbnN0IGRvTm90Q29weSA9IG5ldyBTZXQodHJhbnNmb3JtZWRGaWxlcy5tYXAoZiA9PiBmLnBhdGgpKTtcbiAgICBidW5kbGUuc3JjLnByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxQYXRoID0gYWJzb2x1dGVGcm9tU291cmNlRmlsZShzb3VyY2VGaWxlKTtcbiAgICAgIGlmIChkb05vdENvcHkuaGFzKG9yaWdpbmFsUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gdGhpcy5mcy5yZWxhdGl2ZShwYWNrYWdlUGF0aCwgb3JpZ2luYWxQYXRoKTtcbiAgICAgIGNvbnN0IGlzSW5zaWRlUGFja2FnZSA9IGlzTG9jYWxSZWxhdGl2ZVBhdGgocmVsYXRpdmVQYXRoKTtcbiAgICAgIGlmICghc291cmNlRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSAmJiBpc0luc2lkZVBhY2thZ2UpIHtcbiAgICAgICAgY29uc3QgbmV3UGF0aCA9IHRoaXMuZnMucmVzb2x2ZShuZ2NjRm9sZGVyLCByZWxhdGl2ZVBhdGgpO1xuICAgICAgICB0aGlzLmZzLmVuc3VyZURpcih0aGlzLmZzLmRpcm5hbWUobmV3UGF0aCkpO1xuICAgICAgICB0aGlzLmZzLmNvcHlGaWxlKG9yaWdpbmFsUGF0aCwgbmV3UGF0aCk7XG4gICAgICAgIHRoaXMuY29weUFuZFVwZGF0ZVNvdXJjZU1hcChvcmlnaW5hbFBhdGgsIG5ld1BhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIGEgc291cmNlIGZpbGUgaGFzIGFuIGFzc29jaWF0ZWQgc291cmNlLW1hcCwgdGhlbiBjb3B5IHRoaXMsIHdoaWxlIHVwZGF0aW5nIGl0cyBzb3VyY2VSb290XG4gICAqIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBGb3Igbm93IGRvbid0IHRyeSB0byBwYXJzZSB0aGUgc291cmNlIGZvciBpbmxpbmUgc291cmNlLW1hcHMgb3IgZXh0ZXJuYWwgc291cmNlLW1hcCBsaW5rcyxcbiAgICogc2luY2UgdGhhdCBpcyBtb3JlIGNvbXBsZXggYW5kIHdpbGwgc2xvdyBuZ2NjIGRvd24uXG4gICAqIEluc3RlYWQganVzdCBjaGVjayBmb3IgYSBzb3VyY2UtbWFwIGZpbGUgcmVzaWRpbmcgbmV4dCB0byB0aGUgc291cmNlIGZpbGUsIHdoaWNoIGlzIGJ5IGZhclxuICAgKiB0aGUgbW9zdCBjb21tb24gY2FzZS5cbiAgICpcbiAgICogQHBhcmFtIG9yaWdpbmFsU3JjUGF0aCBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBvcmlnaW5hbCBzb3VyY2UgZmlsZSBiZWluZyBjb3BpZWQuXG4gICAqIEBwYXJhbSBuZXdTcmNQYXRoIGFic29sdXRlIHBhdGggdG8gd2hlcmUgdGhlIHNvdXJjZSB3aWxsIGJlIHdyaXR0ZW4uXG4gICAqL1xuICBwcm90ZWN0ZWQgY29weUFuZFVwZGF0ZVNvdXJjZU1hcChvcmlnaW5hbFNyY1BhdGg6IEFic29sdXRlRnNQYXRoLCBuZXdTcmNQYXRoOiBBYnNvbHV0ZUZzUGF0aCk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBzb3VyY2VNYXBQYXRoID0gKG9yaWdpbmFsU3JjUGF0aCArICcubWFwJykgYXMgQWJzb2x1dGVGc1BhdGg7XG4gICAgaWYgKHRoaXMuZnMuZXhpc3RzKHNvdXJjZU1hcFBhdGgpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzb3VyY2VNYXAgPSBKU09OLnBhcnNlKHRoaXMuZnMucmVhZEZpbGUoc291cmNlTWFwUGF0aCkpO1xuICAgICAgICBjb25zdCBuZXdTb3VyY2VNYXBQYXRoID0gKG5ld1NyY1BhdGggKyAnLm1hcCcpIGFzIEFic29sdXRlRnNQYXRoO1xuICAgICAgICBjb25zdCByZWxhdGl2ZVBhdGggPVxuICAgICAgICAgICAgdGhpcy5mcy5yZWxhdGl2ZSh0aGlzLmZzLmRpcm5hbWUobmV3U291cmNlTWFwUGF0aCksIHRoaXMuZnMuZGlybmFtZShzb3VyY2VNYXBQYXRoKSk7XG4gICAgICAgIHNvdXJjZU1hcFsnc291cmNlUm9vdCddID0gdGhpcy5mcy5qb2luKHJlbGF0aXZlUGF0aCwgc291cmNlTWFwWydzb3VyY2VSb290J10gfHwgJy4nKTtcbiAgICAgICAgdGhpcy5mcy5lbnN1cmVEaXIodGhpcy5mcy5kaXJuYW1lKG5ld1NvdXJjZU1hcFBhdGgpKTtcbiAgICAgICAgdGhpcy5mcy53cml0ZUZpbGUobmV3U291cmNlTWFwUGF0aCwgSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oYEZhaWxlZCB0byBwcm9jZXNzIHNvdXJjZS1tYXAgYXQgJHtzb3VyY2VNYXBQYXRofWApO1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKGUubWVzc2FnZSA/PyBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgd3JpdGVGaWxlKGZpbGU6IEZpbGVUb1dyaXRlLCBwYWNrYWdlUGF0aDogQWJzb2x1dGVGc1BhdGgsIG5nY2NGb2xkZXI6IEFic29sdXRlRnNQYXRoKTpcbiAgICAgIHZvaWQge1xuICAgIGlmIChpc0R0c1BhdGgoZmlsZS5wYXRoLnJlcGxhY2UoL1xcLm1hcCQvLCAnJykpKSB7XG4gICAgICAvLyBUaGlzIGlzIGVpdGhlciBgLmQudHNgIG9yIGAuZC50cy5tYXBgIGZpbGVcbiAgICAgIHN1cGVyLndyaXRlRmlsZUFuZEJhY2t1cChmaWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gdGhpcy5mcy5yZWxhdGl2ZShwYWNrYWdlUGF0aCwgZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IG5ld0ZpbGVQYXRoID0gdGhpcy5mcy5yZXNvbHZlKG5nY2NGb2xkZXIsIHJlbGF0aXZlUGF0aCk7XG4gICAgICB0aGlzLmZzLmVuc3VyZURpcih0aGlzLmZzLmRpcm5hbWUobmV3RmlsZVBhdGgpKTtcbiAgICAgIHRoaXMuZnMud3JpdGVGaWxlKG5ld0ZpbGVQYXRoLCBmaWxlLmNvbnRlbnRzKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgcmV2ZXJ0RmlsZShmaWxlUGF0aDogQWJzb2x1dGVGc1BhdGgsIHBhY2thZ2VQYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIGlmIChpc0R0c1BhdGgoZmlsZVBhdGgucmVwbGFjZSgvXFwubWFwJC8sICcnKSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgZWl0aGVyIGAuZC50c2Agb3IgYC5kLnRzLm1hcGAgZmlsZVxuICAgICAgc3VwZXIucmV2ZXJ0RmlsZUFuZEJhY2t1cChmaWxlUGF0aCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmZzLmV4aXN0cyhmaWxlUGF0aCkpIHtcbiAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHRoaXMuZnMucmVsYXRpdmUocGFja2FnZVBhdGgsIGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IG5ld0ZpbGVQYXRoID0gdGhpcy5mcy5yZXNvbHZlKHBhY2thZ2VQYXRoLCBOR0NDX0RJUkVDVE9SWSwgcmVsYXRpdmVQYXRoKTtcbiAgICAgIHRoaXMuZnMucmVtb3ZlRmlsZShuZXdGaWxlUGF0aCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIHVwZGF0ZVBhY2thZ2VKc29uKFxuICAgICAgZW50cnlQb2ludDogRW50cnlQb2ludCwgZm9ybWF0UHJvcGVydGllczogRW50cnlQb2ludEpzb25Qcm9wZXJ0eVtdLFxuICAgICAgbmdjY0ZvbGRlcjogQWJzb2x1dGVGc1BhdGgpIHtcbiAgICBpZiAoZm9ybWF0UHJvcGVydGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIE5vIGZvcm1hdCBwcm9wZXJ0aWVzIG5lZWQgdXBkYXRpbmcuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGFja2FnZUpzb24gPSBlbnRyeVBvaW50LnBhY2thZ2VKc29uO1xuICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHRoaXMuZnMuam9pbihlbnRyeVBvaW50LnBhdGgsICdwYWNrYWdlLmpzb24nKTtcblxuICAgIC8vIEFsbCBmb3JtYXQgcHJvcGVydGllcyBwb2ludCB0byB0aGUgc2FtZSBmb3JtYXQtcGF0aC5cbiAgICBjb25zdCBvbGRGb3JtYXRQcm9wID0gZm9ybWF0UHJvcGVydGllc1swXSE7XG4gICAgY29uc3Qgb2xkRm9ybWF0UGF0aCA9IHBhY2thZ2VKc29uW29sZEZvcm1hdFByb3BdITtcbiAgICBjb25zdCBvbGRBYnNGb3JtYXRQYXRoID0gdGhpcy5mcy5yZXNvbHZlKGVudHJ5UG9pbnQucGF0aCwgb2xkRm9ybWF0UGF0aCk7XG4gICAgY29uc3QgbmV3QWJzRm9ybWF0UGF0aCA9XG4gICAgICAgIHRoaXMuZnMucmVzb2x2ZShuZ2NjRm9sZGVyLCB0aGlzLmZzLnJlbGF0aXZlKGVudHJ5UG9pbnQucGFja2FnZVBhdGgsIG9sZEFic0Zvcm1hdFBhdGgpKTtcbiAgICBjb25zdCBuZXdGb3JtYXRQYXRoID0gdGhpcy5mcy5yZWxhdGl2ZShlbnRyeVBvaW50LnBhdGgsIG5ld0Fic0Zvcm1hdFBhdGgpO1xuXG4gICAgLy8gVXBkYXRlIGFsbCBwcm9wZXJ0aWVzIGluIGBwYWNrYWdlLmpzb25gIChib3RoIGluIG1lbW9yeSBhbmQgb24gZGlzaykuXG4gICAgY29uc3QgdXBkYXRlID0gdGhpcy5wa2dKc29uVXBkYXRlci5jcmVhdGVVcGRhdGUoKTtcblxuICAgIGZvciAoY29uc3QgZm9ybWF0UHJvcGVydHkgb2YgZm9ybWF0UHJvcGVydGllcykge1xuICAgICAgaWYgKHBhY2thZ2VKc29uW2Zvcm1hdFByb3BlcnR5XSAhPT0gb2xkRm9ybWF0UGF0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgVW5hYmxlIHRvIHVwZGF0ZSAnJHtwYWNrYWdlSnNvblBhdGh9JzogRm9ybWF0IHByb3BlcnRpZXMgYCArXG4gICAgICAgICAgICBgKCR7Zm9ybWF0UHJvcGVydGllcy5qb2luKCcsICcpfSkgbWFwIHRvIG1vcmUgdGhhbiBvbmUgZm9ybWF0LXBhdGguYCk7XG4gICAgICB9XG5cbiAgICAgIHVwZGF0ZS5hZGRDaGFuZ2UoXG4gICAgICAgICAgW2Ake2Zvcm1hdFByb3BlcnR5fSR7TkdDQ19QUk9QRVJUWV9FWFRFTlNJT059YF0sIG5ld0Zvcm1hdFBhdGgsIHtiZWZvcmU6IGZvcm1hdFByb3BlcnR5fSk7XG4gICAgfVxuXG4gICAgdXBkYXRlLndyaXRlQ2hhbmdlcyhwYWNrYWdlSnNvblBhdGgsIHBhY2thZ2VKc29uKTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZXZlcnRQYWNrYWdlSnNvbihlbnRyeVBvaW50OiBFbnRyeVBvaW50LCBmb3JtYXRQcm9wZXJ0aWVzOiBFbnRyeVBvaW50SnNvblByb3BlcnR5W10pIHtcbiAgICBpZiAoZm9ybWF0UHJvcGVydGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIE5vIGZvcm1hdCBwcm9wZXJ0aWVzIG5lZWQgcmV2ZXJ0aW5nLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBhY2thZ2VKc29uID0gZW50cnlQb2ludC5wYWNrYWdlSnNvbjtcbiAgICBjb25zdCBwYWNrYWdlSnNvblBhdGggPSB0aGlzLmZzLmpvaW4oZW50cnlQb2ludC5wYXRoLCAncGFja2FnZS5qc29uJyk7XG5cbiAgICAvLyBSZXZlcnQgYWxsIHByb3BlcnRpZXMgaW4gYHBhY2thZ2UuanNvbmAgKGJvdGggaW4gbWVtb3J5IGFuZCBvbiBkaXNrKS5cbiAgICAvLyBTaW5jZSBgdXBkYXRlUGFja2FnZUpzb24oKWAgb25seSBhZGRzIHByb3BlcnRpZXMsIGl0IGlzIHNhZmUgdG8ganVzdCByZW1vdmUgdGhlbSAoaWYgdGhleVxuICAgIC8vIGV4aXN0KS5cbiAgICBjb25zdCB1cGRhdGUgPSB0aGlzLnBrZ0pzb25VcGRhdGVyLmNyZWF0ZVVwZGF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCBmb3JtYXRQcm9wZXJ0eSBvZiBmb3JtYXRQcm9wZXJ0aWVzKSB7XG4gICAgICB1cGRhdGUuYWRkQ2hhbmdlKFtgJHtmb3JtYXRQcm9wZXJ0eX0ke05HQ0NfUFJPUEVSVFlfRVhURU5TSU9OfWBdLCB1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHVwZGF0ZS53cml0ZUNoYW5nZXMocGFja2FnZUpzb25QYXRoLCBwYWNrYWdlSnNvbik7XG4gIH1cbn1cbiJdfQ==
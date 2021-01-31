(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/packages/bundle_program", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/ngcc/src/packages/patch_ts_expando_initializer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findR3SymbolsPath = exports.makeBundleProgram = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    var patch_ts_expando_initializer_1 = require("@angular/compiler-cli/ngcc/src/packages/patch_ts_expando_initializer");
    /**
     * Create a bundle program.
     */
    function makeBundleProgram(fs, isCore, pkg, path, r3FileName, options, host, additionalFiles) {
        if (additionalFiles === void 0) { additionalFiles = []; }
        var r3SymbolsPath = isCore ? findR3SymbolsPath(fs, fs.dirname(path), r3FileName) : null;
        var rootPaths = r3SymbolsPath ? tslib_1.__spread([path, r3SymbolsPath], additionalFiles) : tslib_1.__spread([path], additionalFiles);
        var originalGetExpandoInitializer = patch_ts_expando_initializer_1.patchTsGetExpandoInitializer();
        var program = ts.createProgram(rootPaths, options, host);
        // Ask for the typeChecker to trigger the binding phase of the compilation.
        // This will then exercise the patched function.
        program.getTypeChecker();
        patch_ts_expando_initializer_1.restoreGetExpandoInitializer(originalGetExpandoInitializer);
        var file = program.getSourceFile(path);
        var r3SymbolsFile = r3SymbolsPath && program.getSourceFile(r3SymbolsPath) || null;
        return { program: program, options: options, host: host, package: pkg, path: path, file: file, r3SymbolsPath: r3SymbolsPath, r3SymbolsFile: r3SymbolsFile };
    }
    exports.makeBundleProgram = makeBundleProgram;
    /**
     * Search the given directory hierarchy to find the path to the `r3_symbols` file.
     */
    function findR3SymbolsPath(fs, directory, filename) {
        var e_1, _a;
        var r3SymbolsFilePath = fs.resolve(directory, filename);
        if (fs.exists(r3SymbolsFilePath)) {
            return r3SymbolsFilePath;
        }
        var subDirectories = fs.readdir(directory)
            // Not interested in hidden files
            .filter(function (p) { return !p.startsWith('.'); })
            // Ignore node_modules
            .filter(function (p) { return p !== 'node_modules'; })
            // Only interested in directories (and only those that are not symlinks)
            .filter(function (p) {
            var stat = fs.lstat(fs.resolve(directory, p));
            return stat.isDirectory() && !stat.isSymbolicLink();
        });
        try {
            for (var subDirectories_1 = tslib_1.__values(subDirectories), subDirectories_1_1 = subDirectories_1.next(); !subDirectories_1_1.done; subDirectories_1_1 = subDirectories_1.next()) {
                var subDirectory = subDirectories_1_1.value;
                var r3SymbolsFilePath_1 = findR3SymbolsPath(fs, fs.resolve(directory, subDirectory), filename);
                if (r3SymbolsFilePath_1) {
                    return r3SymbolsFilePath_1;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (subDirectories_1_1 && !subDirectories_1_1.done && (_a = subDirectories_1.return)) _a.call(subDirectories_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return null;
    }
    exports.findR3SymbolsPath = findR3SymbolsPath;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlX3Byb2dyYW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbmdjYy9zcmMvcGFja2FnZXMvYnVuZGxlX3Byb2dyYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILCtCQUFpQztJQUlqQyxxSEFBMEc7SUFxQjFHOztPQUVHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQzdCLEVBQXNCLEVBQUUsTUFBZSxFQUFFLEdBQW1CLEVBQUUsSUFBb0IsRUFDbEYsVUFBa0IsRUFBRSxPQUEyQixFQUFFLElBQXFCLEVBQ3RFLGVBQXNDO1FBQXRDLGdDQUFBLEVBQUEsb0JBQXNDO1FBQ3hDLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMxRixJQUFJLFNBQVMsR0FDVCxhQUFhLENBQUMsQ0FBQyxtQkFBRSxJQUFJLEVBQUUsYUFBYSxHQUFLLGVBQWUsRUFBRSxDQUFDLG1CQUFFLElBQUksR0FBSyxlQUFlLENBQUMsQ0FBQztRQUUzRixJQUFNLDZCQUE2QixHQUFHLDJEQUE0QixFQUFFLENBQUM7UUFDckUsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNELDJFQUEyRTtRQUMzRSxnREFBZ0Q7UUFDaEQsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3pCLDJEQUE0QixDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFFNUQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUUsQ0FBQztRQUMxQyxJQUFNLGFBQWEsR0FBRyxhQUFhLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFcEYsT0FBTyxFQUFDLE9BQU8sU0FBQSxFQUFFLE9BQU8sU0FBQSxFQUFFLElBQUksTUFBQSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsYUFBYSxlQUFBLEVBQUUsYUFBYSxlQUFBLEVBQUMsQ0FBQztJQUMxRixDQUFDO0lBbkJELDhDQW1CQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQzdCLEVBQXNCLEVBQUUsU0FBeUIsRUFBRSxRQUFnQjs7UUFDckUsSUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUNoQyxPQUFPLGlCQUFpQixDQUFDO1NBQzFCO1FBRUQsSUFBTSxjQUFjLEdBQ2hCLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ2pCLGlDQUFpQzthQUNoQyxNQUFNLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQWxCLENBQWtCLENBQUM7WUFDaEMsc0JBQXNCO2FBQ3JCLE1BQU0sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsS0FBSyxjQUFjLEVBQXBCLENBQW9CLENBQUM7WUFDbEMsd0VBQXdFO2FBQ3ZFLE1BQU0sQ0FBQyxVQUFBLENBQUM7WUFDUCxJQUFNLElBQUksR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7O1lBRVgsS0FBMkIsSUFBQSxtQkFBQSxpQkFBQSxjQUFjLENBQUEsOENBQUEsMEVBQUU7Z0JBQXRDLElBQU0sWUFBWSwyQkFBQTtnQkFDckIsSUFBTSxtQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQy9GLElBQUksbUJBQWlCLEVBQUU7b0JBQ3JCLE9BQU8sbUJBQWlCLENBQUM7aUJBQzFCO2FBQ0Y7Ozs7Ozs7OztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQTNCRCw4Q0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0Fic29sdXRlRnNQYXRoLCBSZWFkb25seUZpbGVTeXN0ZW19IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9maWxlX3N5c3RlbSc7XG5cbmltcG9ydCB7cGF0Y2hUc0dldEV4cGFuZG9Jbml0aWFsaXplciwgcmVzdG9yZUdldEV4cGFuZG9Jbml0aWFsaXplcn0gZnJvbSAnLi9wYXRjaF90c19leHBhbmRvX2luaXRpYWxpemVyJztcblxuLyoqXG4gKiBBbiBlbnRyeSBwb2ludCBidW5kbGUgY29udGFpbnMgb25lIG9yIHR3byBwcm9ncmFtcywgZS5nLiBgc3JjYCBhbmQgYGR0c2AsXG4gKiB0aGF0IGFyZSBjb21waWxlZCB2aWEgVHlwZVNjcmlwdC5cbiAqXG4gKiBUbyBhaWQgd2l0aCBwcm9jZXNzaW5nIHRoZSBwcm9ncmFtLCB0aGlzIGludGVyZmFjZSBleHBvc2VzIHRoZSBwcm9ncmFtIGl0c2VsZixcbiAqIGFzIHdlbGwgYXMgcGF0aCBhbmQgVFMgZmlsZSBvZiB0aGUgZW50cnktcG9pbnQgdG8gdGhlIHByb2dyYW0gYW5kIHRoZSByM1N5bWJvbHNcbiAqIGZpbGUsIGlmIGFwcHJvcHJpYXRlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJ1bmRsZVByb2dyYW0ge1xuICBwcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICBvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnM7XG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdDtcbiAgcGF0aDogQWJzb2x1dGVGc1BhdGg7XG4gIGZpbGU6IHRzLlNvdXJjZUZpbGU7XG4gIHBhY2thZ2U6IEFic29sdXRlRnNQYXRoO1xuICByM1N5bWJvbHNQYXRoOiBBYnNvbHV0ZUZzUGF0aHxudWxsO1xuICByM1N5bWJvbHNGaWxlOiB0cy5Tb3VyY2VGaWxlfG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYnVuZGxlIHByb2dyYW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlQnVuZGxlUHJvZ3JhbShcbiAgICBmczogUmVhZG9ubHlGaWxlU3lzdGVtLCBpc0NvcmU6IGJvb2xlYW4sIHBrZzogQWJzb2x1dGVGc1BhdGgsIHBhdGg6IEFic29sdXRlRnNQYXRoLFxuICAgIHIzRmlsZU5hbWU6IHN0cmluZywgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLCBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gICAgYWRkaXRpb25hbEZpbGVzOiBBYnNvbHV0ZUZzUGF0aFtdID0gW10pOiBCdW5kbGVQcm9ncmFtIHtcbiAgY29uc3QgcjNTeW1ib2xzUGF0aCA9IGlzQ29yZSA/IGZpbmRSM1N5bWJvbHNQYXRoKGZzLCBmcy5kaXJuYW1lKHBhdGgpLCByM0ZpbGVOYW1lKSA6IG51bGw7XG4gIGxldCByb290UGF0aHMgPVxuICAgICAgcjNTeW1ib2xzUGF0aCA/IFtwYXRoLCByM1N5bWJvbHNQYXRoLCAuLi5hZGRpdGlvbmFsRmlsZXNdIDogW3BhdGgsIC4uLmFkZGl0aW9uYWxGaWxlc107XG5cbiAgY29uc3Qgb3JpZ2luYWxHZXRFeHBhbmRvSW5pdGlhbGl6ZXIgPSBwYXRjaFRzR2V0RXhwYW5kb0luaXRpYWxpemVyKCk7XG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHJvb3RQYXRocywgb3B0aW9ucywgaG9zdCk7XG4gIC8vIEFzayBmb3IgdGhlIHR5cGVDaGVja2VyIHRvIHRyaWdnZXIgdGhlIGJpbmRpbmcgcGhhc2Ugb2YgdGhlIGNvbXBpbGF0aW9uLlxuICAvLyBUaGlzIHdpbGwgdGhlbiBleGVyY2lzZSB0aGUgcGF0Y2hlZCBmdW5jdGlvbi5cbiAgcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICByZXN0b3JlR2V0RXhwYW5kb0luaXRpYWxpemVyKG9yaWdpbmFsR2V0RXhwYW5kb0luaXRpYWxpemVyKTtcblxuICBjb25zdCBmaWxlID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKHBhdGgpITtcbiAgY29uc3QgcjNTeW1ib2xzRmlsZSA9IHIzU3ltYm9sc1BhdGggJiYgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKHIzU3ltYm9sc1BhdGgpIHx8IG51bGw7XG5cbiAgcmV0dXJuIHtwcm9ncmFtLCBvcHRpb25zLCBob3N0LCBwYWNrYWdlOiBwa2csIHBhdGgsIGZpbGUsIHIzU3ltYm9sc1BhdGgsIHIzU3ltYm9sc0ZpbGV9O1xufVxuXG4vKipcbiAqIFNlYXJjaCB0aGUgZ2l2ZW4gZGlyZWN0b3J5IGhpZXJhcmNoeSB0byBmaW5kIHRoZSBwYXRoIHRvIHRoZSBgcjNfc3ltYm9sc2AgZmlsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRSM1N5bWJvbHNQYXRoKFxuICAgIGZzOiBSZWFkb25seUZpbGVTeXN0ZW0sIGRpcmVjdG9yeTogQWJzb2x1dGVGc1BhdGgsIGZpbGVuYW1lOiBzdHJpbmcpOiBBYnNvbHV0ZUZzUGF0aHxudWxsIHtcbiAgY29uc3QgcjNTeW1ib2xzRmlsZVBhdGggPSBmcy5yZXNvbHZlKGRpcmVjdG9yeSwgZmlsZW5hbWUpO1xuICBpZiAoZnMuZXhpc3RzKHIzU3ltYm9sc0ZpbGVQYXRoKSkge1xuICAgIHJldHVybiByM1N5bWJvbHNGaWxlUGF0aDtcbiAgfVxuXG4gIGNvbnN0IHN1YkRpcmVjdG9yaWVzID1cbiAgICAgIGZzLnJlYWRkaXIoZGlyZWN0b3J5KVxuICAgICAgICAgIC8vIE5vdCBpbnRlcmVzdGVkIGluIGhpZGRlbiBmaWxlc1xuICAgICAgICAgIC5maWx0ZXIocCA9PiAhcC5zdGFydHNXaXRoKCcuJykpXG4gICAgICAgICAgLy8gSWdub3JlIG5vZGVfbW9kdWxlc1xuICAgICAgICAgIC5maWx0ZXIocCA9PiBwICE9PSAnbm9kZV9tb2R1bGVzJylcbiAgICAgICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gZGlyZWN0b3JpZXMgKGFuZCBvbmx5IHRob3NlIHRoYXQgYXJlIG5vdCBzeW1saW5rcylcbiAgICAgICAgICAuZmlsdGVyKHAgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGZzLmxzdGF0KGZzLnJlc29sdmUoZGlyZWN0b3J5LCBwKSk7XG4gICAgICAgICAgICByZXR1cm4gc3RhdC5pc0RpcmVjdG9yeSgpICYmICFzdGF0LmlzU3ltYm9saWNMaW5rKCk7XG4gICAgICAgICAgfSk7XG5cbiAgZm9yIChjb25zdCBzdWJEaXJlY3Rvcnkgb2Ygc3ViRGlyZWN0b3JpZXMpIHtcbiAgICBjb25zdCByM1N5bWJvbHNGaWxlUGF0aCA9IGZpbmRSM1N5bWJvbHNQYXRoKGZzLCBmcy5yZXNvbHZlKGRpcmVjdG9yeSwgc3ViRGlyZWN0b3J5KSwgZmlsZW5hbWUpO1xuICAgIGlmIChyM1N5bWJvbHNGaWxlUGF0aCkge1xuICAgICAgcmV0dXJuIHIzU3ltYm9sc0ZpbGVQYXRoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuIl19
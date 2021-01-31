(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/sourcemaps/src/source_file_loader", ["require", "exports", "tslib", "convert-source-map", "@angular/compiler-cli/src/ngtsc/sourcemaps/src/content_origin", "@angular/compiler-cli/src/ngtsc/sourcemaps/src/source_file"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SourceFileLoader = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var convert_source_map_1 = require("convert-source-map");
    var content_origin_1 = require("@angular/compiler-cli/src/ngtsc/sourcemaps/src/content_origin");
    var source_file_1 = require("@angular/compiler-cli/src/ngtsc/sourcemaps/src/source_file");
    var SCHEME_MATCHER = /^([a-z][a-z0-9.-]*):\/\//i;
    /**
     * This class can be used to load a source file, its associated source map and any upstream sources.
     *
     * Since a source file might reference (or include) a source map, this class can load those too.
     * Since a source map might reference other source files, these are also loaded as needed.
     *
     * This is done recursively. The result is a "tree" of `SourceFile` objects, each containing
     * mappings to other `SourceFile` objects as necessary.
     */
    var SourceFileLoader = /** @class */ (function () {
        function SourceFileLoader(fs, logger, 
        /** A map of URL schemes to base paths. The scheme name should be lowercase. */
        schemeMap) {
            this.fs = fs;
            this.logger = logger;
            this.schemeMap = schemeMap;
            this.currentPaths = [];
        }
        SourceFileLoader.prototype.loadSourceFile = function (sourcePath, contents, mapAndPath) {
            if (contents === void 0) { contents = null; }
            if (mapAndPath === void 0) { mapAndPath = null; }
            var contentsOrigin = contents !== null ? content_origin_1.ContentOrigin.Provided : content_origin_1.ContentOrigin.FileSystem;
            var sourceMapInfo = mapAndPath && tslib_1.__assign({ origin: content_origin_1.ContentOrigin.Provided }, mapAndPath);
            return this.loadSourceFileInternal(sourcePath, contents, contentsOrigin, sourceMapInfo);
        };
        /**
         * The overload used internally to load source files referenced in a source-map.
         *
         * In this case there is no guarantee that it will return a non-null SourceMap.
         *
         * @param sourcePath The path to the source file to load.
         * @param contents The contents of the source file to load, if provided inline. If `null`,
         *     the contents will be read from the file at the `sourcePath`.
         * @param sourceOrigin Describes where the source content came from.
         * @param sourceMapInfo The raw contents and path of the source-map file. If `null` the
         *     source-map will be computed from the contents of the source file, either inline or loaded
         *     from the file-system.
         *
         * @returns a SourceFile if the content for one was provided or was able to be loaded from disk,
         * `null` otherwise.
         */
        SourceFileLoader.prototype.loadSourceFileInternal = function (sourcePath, contents, sourceOrigin, sourceMapInfo) {
            var previousPaths = this.currentPaths.slice();
            try {
                if (contents === null) {
                    if (!this.fs.exists(sourcePath)) {
                        return null;
                    }
                    contents = this.readSourceFile(sourcePath);
                }
                // If not provided try to load the source map based on the source itself
                if (sourceMapInfo === null) {
                    sourceMapInfo = this.loadSourceMap(sourcePath, contents, sourceOrigin);
                }
                var sources = [];
                if (sourceMapInfo !== null) {
                    var basePath = sourceMapInfo.mapPath || sourcePath;
                    sources = this.processSources(basePath, sourceMapInfo);
                }
                return new source_file_1.SourceFile(sourcePath, contents, sourceMapInfo, sources, this.fs);
            }
            catch (e) {
                this.logger.warn("Unable to fully load " + sourcePath + " for source-map flattening: " + e.message);
                return null;
            }
            finally {
                // We are finished with this recursion so revert the paths being tracked
                this.currentPaths = previousPaths;
            }
        };
        /**
         * Find the source map associated with the source file whose `sourcePath` and `contents` are
         * provided.
         *
         * Source maps can be inline, as part of a base64 encoded comment, or external as a separate file
         * whose path is indicated in a comment or implied from the name of the source file itself.
         *
         * @param sourcePath the path to the source file.
         * @param sourceContents the contents of the source file.
         * @param sourceOrigin where the content of the source file came from.
         * @returns the parsed contents and path of the source-map, if loading was successful, null
         *     otherwise.
         */
        SourceFileLoader.prototype.loadSourceMap = function (sourcePath, sourceContents, sourceOrigin) {
            // Only consider a source-map comment from the last non-empty line of the file, in case there
            // are embedded source-map comments elsewhere in the file (as can be the case with bundlers like
            // webpack).
            var lastLine = this.getLastNonEmptyLine(sourceContents);
            var inline = convert_source_map_1.commentRegex.exec(lastLine);
            if (inline !== null) {
                return {
                    map: convert_source_map_1.fromComment(inline.pop()).sourcemap,
                    mapPath: null,
                    origin: content_origin_1.ContentOrigin.Inline,
                };
            }
            if (sourceOrigin === content_origin_1.ContentOrigin.Inline) {
                // The source file was provided inline and its contents did not include an inline source-map.
                // So we don't try to load an external source-map from the file-system, since this can lead to
                // invalid circular dependencies.
                return null;
            }
            var external = convert_source_map_1.mapFileCommentRegex.exec(lastLine);
            if (external) {
                try {
                    var fileName = external[1] || external[2];
                    var externalMapPath = this.fs.resolve(this.fs.dirname(sourcePath), fileName);
                    return {
                        map: this.readRawSourceMap(externalMapPath),
                        mapPath: externalMapPath,
                        origin: content_origin_1.ContentOrigin.FileSystem,
                    };
                }
                catch (e) {
                    this.logger.warn("Unable to fully load " + sourcePath + " for source-map flattening: " + e.message);
                    return null;
                }
            }
            var impliedMapPath = this.fs.resolve(sourcePath + '.map');
            if (this.fs.exists(impliedMapPath)) {
                return {
                    map: this.readRawSourceMap(impliedMapPath),
                    mapPath: impliedMapPath,
                    origin: content_origin_1.ContentOrigin.FileSystem,
                };
            }
            return null;
        };
        /**
         * Iterate over each of the "sources" for this source file's source map, recursively loading each
         * source file and its associated source map.
         */
        SourceFileLoader.prototype.processSources = function (basePath, _a) {
            var _this = this;
            var map = _a.map, sourceMapOrigin = _a.origin;
            var sourceRoot = this.fs.resolve(this.fs.dirname(basePath), this.replaceSchemeWithPath(map.sourceRoot || ''));
            return map.sources.map(function (source, index) {
                var path = _this.fs.resolve(sourceRoot, _this.replaceSchemeWithPath(source));
                var content = map.sourcesContent && map.sourcesContent[index] || null;
                // The origin of this source file is "inline" if we extracted it from the source-map's
                // `sourcesContent`, except when the source-map itself was "provided" in-memory.
                // An inline source file is treated as if it were from the file-system if the source-map that
                // contains it was provided in-memory. The first call to `loadSourceFile()` is special in that
                // if you "provide" the contents of the source-map in-memory then we don't want to block
                // loading sources from the file-system just because this source-map had an inline source.
                var sourceOrigin = content !== null && sourceMapOrigin !== content_origin_1.ContentOrigin.Provided ?
                    content_origin_1.ContentOrigin.Inline :
                    content_origin_1.ContentOrigin.FileSystem;
                return _this.loadSourceFileInternal(path, content, sourceOrigin, null);
            });
        };
        /**
         * Load the contents of the source file from disk.
         *
         * @param sourcePath The path to the source file.
         */
        SourceFileLoader.prototype.readSourceFile = function (sourcePath) {
            this.trackPath(sourcePath);
            return this.fs.readFile(sourcePath);
        };
        /**
         * Load the source map from the file at `mapPath`, parsing its JSON contents into a `RawSourceMap`
         * object.
         *
         * @param mapPath The path to the source-map file.
         */
        SourceFileLoader.prototype.readRawSourceMap = function (mapPath) {
            this.trackPath(mapPath);
            return JSON.parse(this.fs.readFile(mapPath));
        };
        /**
         * Track source file paths if we have loaded them from disk so that we don't get into an infinite
         * recursion.
         */
        SourceFileLoader.prototype.trackPath = function (path) {
            if (this.currentPaths.includes(path)) {
                throw new Error("Circular source file mapping dependency: " + this.currentPaths.join(' -> ') + " -> " + path);
            }
            this.currentPaths.push(path);
        };
        SourceFileLoader.prototype.getLastNonEmptyLine = function (contents) {
            var trailingWhitespaceIndex = contents.length - 1;
            while (trailingWhitespaceIndex > 0 &&
                (contents[trailingWhitespaceIndex] === '\n' ||
                    contents[trailingWhitespaceIndex] === '\r')) {
                trailingWhitespaceIndex--;
            }
            var lastRealLineIndex = contents.lastIndexOf('\n', trailingWhitespaceIndex - 1);
            if (lastRealLineIndex === -1) {
                lastRealLineIndex = 0;
            }
            return contents.substr(lastRealLineIndex + 1);
        };
        /**
         * Replace any matched URL schemes with their corresponding path held in the schemeMap.
         *
         * Some build tools replace real file paths with scheme prefixed paths - e.g. `webpack://`.
         * We use the `schemeMap` passed to this class to convert such paths to "real" file paths.
         * In some cases, this is not possible, since the file was actually synthesized by the build tool.
         * But the end result is better than prefixing the sourceRoot in front of the scheme.
         */
        SourceFileLoader.prototype.replaceSchemeWithPath = function (path) {
            var _this = this;
            return path.replace(SCHEME_MATCHER, function (_, scheme) { return _this.schemeMap[scheme.toLowerCase()] || ''; });
        };
        return SourceFileLoader;
    }());
    exports.SourceFileLoader = SourceFileLoader;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9zb3VyY2VtYXBzL3NyYy9zb3VyY2VfZmlsZV9sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILHlEQUFrRjtJQUtsRixnR0FBK0M7SUFFL0MsMEZBQXlDO0lBRXpDLElBQU0sY0FBYyxHQUFHLDJCQUEyQixDQUFDO0lBRW5EOzs7Ozs7OztPQVFHO0lBQ0g7UUFHRSwwQkFDWSxFQUFzQixFQUFVLE1BQWM7UUFDdEQsK0VBQStFO1FBQ3ZFLFNBQXlDO1lBRnpDLE9BQUUsR0FBRixFQUFFLENBQW9CO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUU5QyxjQUFTLEdBQVQsU0FBUyxDQUFnQztZQUw3QyxpQkFBWSxHQUFxQixFQUFFLENBQUM7UUFLWSxDQUFDO1FBNkJ6RCx5Q0FBYyxHQUFkLFVBQ0ksVUFBMEIsRUFBRSxRQUE0QixFQUN4RCxVQUFrQztZQUROLHlCQUFBLEVBQUEsZUFBNEI7WUFDeEQsMkJBQUEsRUFBQSxpQkFBa0M7WUFDcEMsSUFBTSxjQUFjLEdBQUcsUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsOEJBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLDhCQUFhLENBQUMsVUFBVSxDQUFDO1lBQzdGLElBQU0sYUFBYSxHQUNmLFVBQVUsdUJBQUssTUFBTSxFQUFFLDhCQUFhLENBQUMsUUFBUSxJQUFLLFVBQVUsQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRDs7Ozs7Ozs7Ozs7Ozs7O1dBZUc7UUFDSyxpREFBc0IsR0FBOUIsVUFDSSxV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Q0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVPLDhDQUFtQixHQUEzQixVQUE0QixRQUFnQjtZQUMxQyxJQUFJLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sdUJBQXVCLEdBQUcsQ0FBQztnQkFDM0IsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsS0FBSyxJQUFJO29CQUMxQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsS0FBSyxJQUFJLENBQUMsRUFBRTtnQkFDbkQsdUJBQXVCLEVBQUUsQ0FBQzthQUMzQjtZQUNELElBQUksaUJBQWlCLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEYsSUFBSSxpQkFBaUIsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDNUIsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZCO1lBQ0QsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRDs7Ozs7OztXQU9HO1FBQ0ssZ0RBQXFCLEdBQTdCLFVBQThCLElBQVk7WUFBMUMsaUJBR0M7WUFGQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQ2YsY0FBYyxFQUFFLFVBQUMsQ0FBUyxFQUFFLE1BQWMsSUFBSyxPQUFBLEtBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUExQyxDQUEwQyxDQUFDLENBQUM7UUFDakcsQ0FBQztRQUNILHVCQUFDO0lBQUQsQ0FBQyxBQWxQRCxJQWtQQztJQWxQWSw0Q0FBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Y29tbWVudFJlZ2V4LCBmcm9tQ29tbWVudCwgbWFwRmlsZUNvbW1lbnRSZWdleH0gZnJvbSAnY29udmVydC1zb3VyY2UtbWFwJztcblxuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aCwgUmVhZG9ubHlGaWxlU3lzdGVtfSBmcm9tICcuLi8uLi9maWxlX3N5c3RlbSc7XG5pbXBvcnQge0xvZ2dlcn0gZnJvbSAnLi4vLi4vbG9nZ2luZyc7XG5cbmltcG9ydCB7Q29udGVudE9yaWdpbn0gZnJvbSAnLi9jb250ZW50X29yaWdpbic7XG5pbXBvcnQge01hcEFuZFBhdGgsIFJhd1NvdXJjZU1hcCwgU291cmNlTWFwSW5mb30gZnJvbSAnLi9yYXdfc291cmNlX21hcCc7XG5pbXBvcnQge1NvdXJjZUZpbGV9IGZyb20gJy4vc291cmNlX2ZpbGUnO1xuXG5jb25zdCBTQ0hFTUVfTUFUQ0hFUiA9IC9eKFthLXpdW2EtejAtOS4tXSopOlxcL1xcLy9pO1xuXG4vKipcbiAqIFRoaXMgY2xhc3MgY2FuIGJlIHVzZWQgdG8gbG9hZCBhIHNvdXJjZSBmaWxlLCBpdHMgYXNzb2NpYXRlZCBzb3VyY2UgbWFwIGFuZCBhbnkgdXBzdHJlYW0gc291cmNlcy5cbiAqXG4gKiBTaW5jZSBhIHNvdXJjZSBmaWxlIG1pZ2h0IHJlZmVyZW5jZSAob3IgaW5jbHVkZSkgYSBzb3VyY2UgbWFwLCB0aGlzIGNsYXNzIGNhbiBsb2FkIHRob3NlIHRvby5cbiAqIFNpbmNlIGEgc291cmNlIG1hcCBtaWdodCByZWZlcmVuY2Ugb3RoZXIgc291cmNlIGZpbGVzLCB0aGVzZSBhcmUgYWxzbyBsb2FkZWQgYXMgbmVlZGVkLlxuICpcbiAqIFRoaXMgaXMgZG9uZSByZWN1cnNpdmVseS4gVGhlIHJlc3VsdCBpcyBhIFwidHJlZVwiIG9mIGBTb3VyY2VGaWxlYCBvYmplY3RzLCBlYWNoIGNvbnRhaW5pbmdcbiAqIG1hcHBpbmdzIHRvIG90aGVyIGBTb3VyY2VGaWxlYCBvYmplY3RzIGFzIG5lY2Vzc2FyeS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNvdXJjZUZpbGVMb2FkZXIge1xuICBwcml2YXRlIGN1cnJlbnRQYXRoczogQWJzb2x1dGVGc1BhdGhbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBmczogUmVhZG9ubHlGaWxlU3lzdGVtLCBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyLFxuICAgICAgLyoqIEEgbWFwIG9mIFVSTCBzY2hlbWVzIHRvIGJhc2UgcGF0aHMuIFRoZSBzY2hlbWUgbmFtZSBzaG91bGQgYmUgbG93ZXJjYXNlLiAqL1xuICAgICAgcHJpdmF0ZSBzY2hlbWVNYXA6IFJlY29yZDxzdHJpbmcsIEFic29sdXRlRnNQYXRoPikge31cblxuICAvKipcbiAgICogTG9hZCBhIHNvdXJjZSBmaWxlIGZyb20gdGhlIHByb3ZpZGVkIGNvbnRlbnQgYW5kIHNvdXJjZSBtYXAsIGFuZCByZWN1cnNpdmVseSBsb2FkIGFueVxuICAgKiByZWZlcmVuY2VkIHNvdXJjZSBmaWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHNvdXJjZVBhdGggVGhlIHBhdGggdG8gdGhlIHNvdXJjZSBmaWxlIHRvIGxvYWQuXG4gICAqIEBwYXJhbSBjb250ZW50cyBUaGUgY29udGVudHMgb2YgdGhlIHNvdXJjZSBmaWxlIHRvIGxvYWQuXG4gICAqIEBwYXJhbSBtYXBBbmRQYXRoIFRoZSByYXcgc291cmNlLW1hcCBhbmQgdGhlIHBhdGggdG8gdGhlIHNvdXJjZS1tYXAgZmlsZS5cbiAgICogQHJldHVybnMgYSBTb3VyY2VGaWxlIG9iamVjdCBjcmVhdGVkIGZyb20gdGhlIGBjb250ZW50c2AgYW5kIHByb3ZpZGVkIHNvdXJjZS1tYXAgaW5mby5cbiAgICovXG4gIGxvYWRTb3VyY2VGaWxlKHNvdXJjZVBhdGg6IEFic29sdXRlRnNQYXRoLCBjb250ZW50czogc3RyaW5nLCBtYXBBbmRQYXRoOiBNYXBBbmRQYXRoKTogU291cmNlRmlsZTtcbiAgLyoqXG4gICAqIExvYWQgYSBzb3VyY2UgZmlsZSBmcm9tIHRoZSBwcm92aWRlZCBjb250ZW50LCBjb21wdXRlIGl0cyBzb3VyY2UgbWFwLCBhbmQgcmVjdXJzaXZlbHkgbG9hZCBhbnlcbiAgICogcmVmZXJlbmNlZCBzb3VyY2UgZmlsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzb3VyY2VQYXRoIFRoZSBwYXRoIHRvIHRoZSBzb3VyY2UgZmlsZSB0byBsb2FkLlxuICAgKiBAcGFyYW0gY29udGVudHMgVGhlIGNvbnRlbnRzIG9mIHRoZSBzb3VyY2UgZmlsZSB0byBsb2FkLlxuICAgKiBAcmV0dXJucyBhIFNvdXJjZUZpbGUgb2JqZWN0IGNyZWF0ZWQgZnJvbSB0aGUgYGNvbnRlbnRzYCBhbmQgY29tcHV0ZWQgc291cmNlLW1hcCBpbmZvLlxuICAgKi9cbiAgbG9hZFNvdXJjZUZpbGUoc291cmNlUGF0aDogQWJzb2x1dGVGc1BhdGgsIGNvbnRlbnRzOiBzdHJpbmcpOiBTb3VyY2VGaWxlO1xuICAvKipcbiAgICogTG9hZCBhIHNvdXJjZSBmaWxlIGZyb20gdGhlIGZpbGUtc3lzdGVtLCBjb21wdXRlIGl0cyBzb3VyY2UgbWFwLCBhbmQgcmVjdXJzaXZlbHkgbG9hZCBhbnlcbiAgICogcmVmZXJlbmNlZCBzb3VyY2UgZmlsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzb3VyY2VQYXRoIFRoZSBwYXRoIHRvIHRoZSBzb3VyY2UgZmlsZSB0byBsb2FkLlxuICAgKiBAcmV0dXJucyBhIFNvdXJjZUZpbGUgb2JqZWN0IGlmIGl0cyBjb250ZW50cyBjb3VsZCBiZSBsb2FkZWQgZnJvbSBkaXNrLCBvciBudWxsIG90aGVyd2lzZS5cbiAgICovXG4gIGxvYWRTb3VyY2VGaWxlKHNvdXJjZVBhdGg6IEFic29sdXRlRnNQYXRoKTogU291cmNlRmlsZXxudWxsO1xuICBsb2FkU291cmNlRmlsZShcbiAgICAgIHNvdXJjZVBhdGg6IEFic29sdXRlRnNQYXRoLCBjb250ZW50czogc3RyaW5nfG51bGwgPSBudWxsLFxuICAgICAgbWFwQW5kUGF0aDogTWFwQW5kUGF0aHxudWxsID0gbnVsbCk6IFNvdXJjZUZpbGV8bnVsbCB7XG4gICAgY29uc3QgY29udGVudHNPcmlnaW4gPSBjb250ZW50cyAhPT0gbnVsbCA/IENvbnRlbnRPcmlnaW4uUHJvdmlkZWQgOiBDb250ZW50T3JpZ2luLkZpbGVTeXN0ZW07XG4gICAgY29uc3Qgc291cmNlTWFwSW5mbzogU291cmNlTWFwSW5mb3xudWxsID1cbiAgICAgICAgbWFwQW5kUGF0aCAmJiB7b3JpZ2luOiBDb250ZW50T3JpZ2luLlByb3ZpZGVkLCAuLi5tYXBBbmRQYXRofTtcbiAgICByZXR1cm4gdGhpcy5sb2FkU291cmNlRmlsZUludGVybmFsKHNvdXJjZVBhdGgsIGNvbnRlbnRzLCBjb250ZW50c09yaWdpbiwgc291cmNlTWFwSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG92ZXJsb2FkIHVzZWQgaW50ZXJuYWxseSB0byBsb2FkIHNvdXJjZSBmaWxlcyByZWZlcmVuY2VkIGluIGEgc291cmNlLW1hcC5cbiAgICpcbiAgICogSW4gdGhpcyBjYXNlIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSB0aGF0IGl0IHdpbGwgcmV0dXJuIGEgbm9uLW51bGwgU291cmNlTWFwLlxuICAgKlxuICAgKiBAcGFyYW0gc291cmNlUGF0aCBUaGUgcGF0aCB0byB0aGUgc291cmNlIGZpbGUgdG8gbG9hZC5cbiAgICogQHBhcmFtIGNvbnRlbnRzIFRoZSBjb250ZW50cyBvZiB0aGUgc291cmNlIGZpbGUgdG8gbG9hZCwgaWYgcHJvdmlkZWQgaW5saW5lLiBJZiBgbnVsbGAsXG4gICAqICAgICB0aGUgY29udGVudHMgd2lsbCBiZSByZWFkIGZyb20gdGhlIGZpbGUgYXQgdGhlIGBzb3VyY2VQYXRoYC5cbiAgICogQHBhcmFtIHNvdXJjZU9yaWdpbiBEZXNjcmliZXMgd2hlcmUgdGhlIHNvdXJjZSBjb250ZW50IGNhbWUgZnJvbS5cbiAgICogQHBhcmFtIHNvdXJjZU1hcEluZm8gVGhlIHJhdyBjb250ZW50cyBhbmQgcGF0aCBvZiB0aGUgc291cmNlLW1hcCBmaWxlLiBJZiBgbnVsbGAgdGhlXG4gICAqICAgICBzb3VyY2UtbWFwIHdpbGwgYmUgY29tcHV0ZWQgZnJvbSB0aGUgY29udGVudHMgb2YgdGhlIHNvdXJjZSBmaWxlLCBlaXRoZXIgaW5saW5lIG9yIGxvYWRlZFxuICAgKiAgICAgZnJvbSB0aGUgZmlsZS1zeXN0ZW0uXG4gICAqXG4gICAqIEByZXR1cm5zIGEgU291cmNlRmlsZSBpZiB0aGUgY29udGVudCBmb3Igb25lIHdhcyBwcm92aWRlZCBvciB3YXMgYWJsZSB0byBiZSBsb2FkZWQgZnJvbSBkaXNrLFxuICAgKiBgbnVsbGAgb3RoZXJ3aXNlLlxuICAgKi9cbiAgcHJpdmF0ZSBsb2FkU291cmNlRmlsZUludGVybmFsKFxuICAgICAgc291cmNlUGF0aDogQWJzb2x1dGVGc1BhdGgsIGNvbnRlbnRzOiBzdHJpbmd8bnVsbCwgc291cmNlT3JpZ2luOiBDb250ZW50T3JpZ2luLFxuICAgICAgc291cmNlTWFwSW5mbzogU291cmNlTWFwSW5mb3xudWxsKTogU291cmNlRmlsZXxudWxsIHtcbiAgICBjb25zdCBwcmV2aW91c1BhdGhzID0gdGhpcy5jdXJyZW50UGF0aHMuc2xpY2UoKTtcbiAgICB0cnkge1xuICAgICAgaWYgKGNvbnRlbnRzID09PSBudWxsKSB7XG4gICAgICAgIGlmICghdGhpcy5mcy5leGlzdHMoc291cmNlUGF0aCkpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb250ZW50cyA9IHRoaXMucmVhZFNvdXJjZUZpbGUoc291cmNlUGF0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vdCBwcm92aWRlZCB0cnkgdG8gbG9hZCB0aGUgc291cmNlIG1hcCBiYXNlZCBvbiB0aGUgc291cmNlIGl0c2VsZlxuICAgICAgaWYgKHNvdXJjZU1hcEluZm8gPT09IG51bGwpIHtcbiAgICAgICAgc291cmNlTWFwSW5mbyA9IHRoaXMubG9hZFNvdXJjZU1hcChzb3VyY2VQYXRoLCBjb250ZW50cywgc291cmNlT3JpZ2luKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHNvdXJjZXM6IChTb3VyY2VGaWxlfG51bGwpW10gPSBbXTtcbiAgICAgIGlmIChzb3VyY2VNYXBJbmZvICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGJhc2VQYXRoID0gc291cmNlTWFwSW5mby5tYXBQYXRoIHx8IHNvdXJjZVBhdGg7XG4gICAgICAgIHNvdXJjZXMgPSB0aGlzLnByb2Nlc3NTb3VyY2VzKGJhc2VQYXRoLCBzb3VyY2VNYXBJbmZvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTb3VyY2VGaWxlKHNvdXJjZVBhdGgsIGNvbnRlbnRzLCBzb3VyY2VNYXBJbmZvLCBzb3VyY2VzLCB0aGlzLmZzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICAgIGBVbmFibGUgdG8gZnVsbHkgbG9hZCAke3NvdXJjZVBhdGh9IGZvciBzb3VyY2UtbWFwIGZsYXR0ZW5pbmc6ICR7ZS5tZXNzYWdlfWApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFdlIGFyZSBmaW5pc2hlZCB3aXRoIHRoaXMgcmVjdXJzaW9uIHNvIHJldmVydCB0aGUgcGF0aHMgYmVpbmcgdHJhY2tlZFxuICAgICAgdGhpcy5jdXJyZW50UGF0aHMgPSBwcmV2aW91c1BhdGhzO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBzb3VyY2UgbWFwIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlIGZpbGUgd2hvc2UgYHNvdXJjZVBhdGhgIGFuZCBgY29udGVudHNgIGFyZVxuICAgKiBwcm92aWRlZC5cbiAgICpcbiAgICogU291cmNlIG1hcHMgY2FuIGJlIGlubGluZSwgYXMgcGFydCBvZiBhIGJhc2U2NCBlbmNvZGVkIGNvbW1lbnQsIG9yIGV4dGVybmFsIGFzIGEgc2VwYXJhdGUgZmlsZVxuICAgKiB3aG9zZSBwYXRoIGlzIGluZGljYXRlZCBpbiBhIGNvbW1lbnQgb3IgaW1wbGllZCBmcm9tIHRoZSBuYW1lIG9mIHRoZSBzb3VyY2UgZmlsZSBpdHNlbGYuXG4gICAqXG4gICAqIEBwYXJhbSBzb3VyY2VQYXRoIHRoZSBwYXRoIHRvIHRoZSBzb3VyY2UgZmlsZS5cbiAgICogQHBhcmFtIHNvdXJjZUNvbnRlbnRzIHRoZSBjb250ZW50cyBvZiB0aGUgc291cmNlIGZpbGUuXG4gICAqIEBwYXJhbSBzb3VyY2VPcmlnaW4gd2hlcmUgdGhlIGNvbnRlbnQgb2YgdGhlIHNvdXJjZSBmaWxlIGNhbWUgZnJvbS5cbiAgICogQHJldHVybnMgdGhlIHBhcnNlZCBjb250ZW50cyBhbmQgcGF0aCBvZiB0aGUgc291cmNlLW1hcCwgaWYgbG9hZGluZyB3YXMgc3VjY2Vzc2Z1bCwgbnVsbFxuICAgKiAgICAgb3RoZXJ3aXNlLlxuICAgKi9cbiAgcHJpdmF0ZSBsb2FkU291cmNlTWFwKFxuICAgICAgc291cmNlUGF0aDogQWJzb2x1dGVGc1BhdGgsIHNvdXJjZUNvbnRlbnRzOiBzdHJpbmcsXG4gICAgICBzb3VyY2VPcmlnaW46IENvbnRlbnRPcmlnaW4pOiBTb3VyY2VNYXBJbmZvfG51bGwge1xuICAgIC8vIE9ubHkgY29uc2lkZXIgYSBzb3VyY2UtbWFwIGNvbW1lbnQgZnJvbSB0aGUgbGFzdCBub24tZW1wdHkgbGluZSBvZiB0aGUgZmlsZSwgaW4gY2FzZSB0aGVyZVxuICAgIC8vIGFyZSBlbWJlZGRlZCBzb3VyY2UtbWFwIGNvbW1lbnRzIGVsc2V3aGVyZSBpbiB0aGUgZmlsZSAoYXMgY2FuIGJlIHRoZSBjYXNlIHdpdGggYnVuZGxlcnMgbGlrZVxuICAgIC8vIHdlYnBhY2spLlxuICAgIGNvbnN0IGxhc3RMaW5lID0gdGhpcy5nZXRMYXN0Tm9uRW1wdHlMaW5lKHNvdXJjZUNvbnRlbnRzKTtcbiAgICBjb25zdCBpbmxpbmUgPSBjb21tZW50UmVnZXguZXhlYyhsYXN0TGluZSk7XG4gICAgaWYgKGlubGluZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWFwOiBmcm9tQ29tbWVudChpbmxpbmUucG9wKCkhKS5zb3VyY2VtYXAsXG4gICAgICAgIG1hcFBhdGg6IG51bGwsXG4gICAgICAgIG9yaWdpbjogQ29udGVudE9yaWdpbi5JbmxpbmUsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChzb3VyY2VPcmlnaW4gPT09IENvbnRlbnRPcmlnaW4uSW5saW5lKSB7XG4gICAgICAvLyBUaGUgc291cmNlIGZpbGUgd2FzIHByb3ZpZGVkIGlubGluZSBhbmQgaXRzIGNvbnRlbnRzIGRpZCBub3QgaW5jbHVkZSBhbiBpbmxpbmUgc291cmNlLW1hcC5cbiAgICAgIC8vIFNvIHdlIGRvbid0IHRyeSB0byBsb2FkIGFuIGV4dGVybmFsIHNvdXJjZS1tYXAgZnJvbSB0aGUgZmlsZS1zeXN0ZW0sIHNpbmNlIHRoaXMgY2FuIGxlYWQgdG9cbiAgICAgIC8vIGludmFsaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZXh0ZXJuYWwgPSBtYXBGaWxlQ29tbWVudFJlZ2V4LmV4ZWMobGFzdExpbmUpO1xuICAgIGlmIChleHRlcm5hbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBleHRlcm5hbFsxXSB8fCBleHRlcm5hbFsyXTtcbiAgICAgICAgY29uc3QgZXh0ZXJuYWxNYXBQYXRoID0gdGhpcy5mcy5yZXNvbHZlKHRoaXMuZnMuZGlybmFtZShzb3VyY2VQYXRoKSwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1hcDogdGhpcy5yZWFkUmF3U291cmNlTWFwKGV4dGVybmFsTWFwUGF0aCksXG4gICAgICAgICAgbWFwUGF0aDogZXh0ZXJuYWxNYXBQYXRoLFxuICAgICAgICAgIG9yaWdpbjogQ29udGVudE9yaWdpbi5GaWxlU3lzdGVtLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICAgICAgYFVuYWJsZSB0byBmdWxseSBsb2FkICR7c291cmNlUGF0aH0gZm9yIHNvdXJjZS1tYXAgZmxhdHRlbmluZzogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGltcGxpZWRNYXBQYXRoID0gdGhpcy5mcy5yZXNvbHZlKHNvdXJjZVBhdGggKyAnLm1hcCcpO1xuICAgIGlmICh0aGlzLmZzLmV4aXN0cyhpbXBsaWVkTWFwUGF0aCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1hcDogdGhpcy5yZWFkUmF3U291cmNlTWFwKGltcGxpZWRNYXBQYXRoKSxcbiAgICAgICAgbWFwUGF0aDogaW1wbGllZE1hcFBhdGgsXG4gICAgICAgIG9yaWdpbjogQ29udGVudE9yaWdpbi5GaWxlU3lzdGVtLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgZWFjaCBvZiB0aGUgXCJzb3VyY2VzXCIgZm9yIHRoaXMgc291cmNlIGZpbGUncyBzb3VyY2UgbWFwLCByZWN1cnNpdmVseSBsb2FkaW5nIGVhY2hcbiAgICogc291cmNlIGZpbGUgYW5kIGl0cyBhc3NvY2lhdGVkIHNvdXJjZSBtYXAuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NTb3VyY2VzKGJhc2VQYXRoOiBBYnNvbHV0ZUZzUGF0aCwge21hcCwgb3JpZ2luOiBzb3VyY2VNYXBPcmlnaW59OiBTb3VyY2VNYXBJbmZvKTpcbiAgICAgIChTb3VyY2VGaWxlfG51bGwpW10ge1xuICAgIGNvbnN0IHNvdXJjZVJvb3QgPSB0aGlzLmZzLnJlc29sdmUoXG4gICAgICAgIHRoaXMuZnMuZGlybmFtZShiYXNlUGF0aCksIHRoaXMucmVwbGFjZVNjaGVtZVdpdGhQYXRoKG1hcC5zb3VyY2VSb290IHx8ICcnKSk7XG4gICAgcmV0dXJuIG1hcC5zb3VyY2VzLm1hcCgoc291cmNlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcGF0aCA9IHRoaXMuZnMucmVzb2x2ZShzb3VyY2VSb290LCB0aGlzLnJlcGxhY2VTY2hlbWVXaXRoUGF0aChzb3VyY2UpKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBtYXAuc291cmNlc0NvbnRlbnQgJiYgbWFwLnNvdXJjZXNDb250ZW50W2luZGV4XSB8fCBudWxsO1xuICAgICAgLy8gVGhlIG9yaWdpbiBvZiB0aGlzIHNvdXJjZSBmaWxlIGlzIFwiaW5saW5lXCIgaWYgd2UgZXh0cmFjdGVkIGl0IGZyb20gdGhlIHNvdXJjZS1tYXAnc1xuICAgICAgLy8gYHNvdXJjZXNDb250ZW50YCwgZXhjZXB0IHdoZW4gdGhlIHNvdXJjZS1tYXAgaXRzZWxmIHdhcyBcInByb3ZpZGVkXCIgaW4tbWVtb3J5LlxuICAgICAgLy8gQW4gaW5saW5lIHNvdXJjZSBmaWxlIGlzIHRyZWF0ZWQgYXMgaWYgaXQgd2VyZSBmcm9tIHRoZSBmaWxlLXN5c3RlbSBpZiB0aGUgc291cmNlLW1hcCB0aGF0XG4gICAgICAvLyBjb250YWlucyBpdCB3YXMgcHJvdmlkZWQgaW4tbWVtb3J5LiBUaGUgZmlyc3QgY2FsbCB0byBgbG9hZFNvdXJjZUZpbGUoKWAgaXMgc3BlY2lhbCBpbiB0aGF0XG4gICAgICAvLyBpZiB5b3UgXCJwcm92aWRlXCIgdGhlIGNvbnRlbnRzIG9mIHRoZSBzb3VyY2UtbWFwIGluLW1lbW9yeSB0aGVuIHdlIGRvbid0IHdhbnQgdG8gYmxvY2tcbiAgICAgIC8vIGxvYWRpbmcgc291cmNlcyBmcm9tIHRoZSBmaWxlLXN5c3RlbSBqdXN0IGJlY2F1c2UgdGhpcyBzb3VyY2UtbWFwIGhhZCBhbiBpbmxpbmUgc291cmNlLlxuICAgICAgY29uc3Qgc291cmNlT3JpZ2luID0gY29udGVudCAhPT0gbnVsbCAmJiBzb3VyY2VNYXBPcmlnaW4gIT09IENvbnRlbnRPcmlnaW4uUHJvdmlkZWQgP1xuICAgICAgICAgIENvbnRlbnRPcmlnaW4uSW5saW5lIDpcbiAgICAgICAgICBDb250ZW50T3JpZ2luLkZpbGVTeXN0ZW07XG4gICAgICByZXR1cm4gdGhpcy5sb2FkU291cmNlRmlsZUludGVybmFsKHBhdGgsIGNvbnRlbnQsIHNvdXJjZU9yaWdpbiwgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCB0aGUgY29udGVudHMgb2YgdGhlIHNvdXJjZSBmaWxlIGZyb20gZGlzay5cbiAgICpcbiAgICogQHBhcmFtIHNvdXJjZVBhdGggVGhlIHBhdGggdG8gdGhlIHNvdXJjZSBmaWxlLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkU291cmNlRmlsZShzb3VyY2VQYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHN0cmluZyB7XG4gICAgdGhpcy50cmFja1BhdGgoc291cmNlUGF0aCk7XG4gICAgcmV0dXJuIHRoaXMuZnMucmVhZEZpbGUoc291cmNlUGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCB0aGUgc291cmNlIG1hcCBmcm9tIHRoZSBmaWxlIGF0IGBtYXBQYXRoYCwgcGFyc2luZyBpdHMgSlNPTiBjb250ZW50cyBpbnRvIGEgYFJhd1NvdXJjZU1hcGBcbiAgICogb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0gbWFwUGF0aCBUaGUgcGF0aCB0byB0aGUgc291cmNlLW1hcCBmaWxlLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkUmF3U291cmNlTWFwKG1hcFBhdGg6IEFic29sdXRlRnNQYXRoKTogUmF3U291cmNlTWFwIHtcbiAgICB0aGlzLnRyYWNrUGF0aChtYXBQYXRoKTtcbiAgICByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLmZzLnJlYWRGaWxlKG1hcFBhdGgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFjayBzb3VyY2UgZmlsZSBwYXRocyBpZiB3ZSBoYXZlIGxvYWRlZCB0aGVtIGZyb20gZGlzayBzbyB0aGF0IHdlIGRvbid0IGdldCBpbnRvIGFuIGluZmluaXRlXG4gICAqIHJlY3Vyc2lvbi5cbiAgICovXG4gIHByaXZhdGUgdHJhY2tQYXRoKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY3VycmVudFBhdGhzLmluY2x1ZGVzKHBhdGgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENpcmN1bGFyIHNvdXJjZSBmaWxlIG1hcHBpbmcgZGVwZW5kZW5jeTogJHt0aGlzLmN1cnJlbnRQYXRocy5qb2luKCcgLT4gJyl9IC0+ICR7cGF0aH1gKTtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50UGF0aHMucHVzaChwYXRoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TGFzdE5vbkVtcHR5TGluZShjb250ZW50czogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgdHJhaWxpbmdXaGl0ZXNwYWNlSW5kZXggPSBjb250ZW50cy5sZW5ndGggLSAxO1xuICAgIHdoaWxlICh0cmFpbGluZ1doaXRlc3BhY2VJbmRleCA+IDAgJiZcbiAgICAgICAgICAgKGNvbnRlbnRzW3RyYWlsaW5nV2hpdGVzcGFjZUluZGV4XSA9PT0gJ1xcbicgfHxcbiAgICAgICAgICAgIGNvbnRlbnRzW3RyYWlsaW5nV2hpdGVzcGFjZUluZGV4XSA9PT0gJ1xccicpKSB7XG4gICAgICB0cmFpbGluZ1doaXRlc3BhY2VJbmRleC0tO1xuICAgIH1cbiAgICBsZXQgbGFzdFJlYWxMaW5lSW5kZXggPSBjb250ZW50cy5sYXN0SW5kZXhPZignXFxuJywgdHJhaWxpbmdXaGl0ZXNwYWNlSW5kZXggLSAxKTtcbiAgICBpZiAobGFzdFJlYWxMaW5lSW5kZXggPT09IC0xKSB7XG4gICAgICBsYXN0UmVhbExpbmVJbmRleCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50cy5zdWJzdHIobGFzdFJlYWxMaW5lSW5kZXggKyAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGFueSBtYXRjaGVkIFVSTCBzY2hlbWVzIHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBwYXRoIGhlbGQgaW4gdGhlIHNjaGVtZU1hcC5cbiAgICpcbiAgICogU29tZSBidWlsZCB0b29scyByZXBsYWNlIHJlYWwgZmlsZSBwYXRocyB3aXRoIHNjaGVtZSBwcmVmaXhlZCBwYXRocyAtIGUuZy4gYHdlYnBhY2s6Ly9gLlxuICAgKiBXZSB1c2UgdGhlIGBzY2hlbWVNYXBgIHBhc3NlZCB0byB0aGlzIGNsYXNzIHRvIGNvbnZlcnQgc3VjaCBwYXRocyB0byBcInJlYWxcIiBmaWxlIHBhdGhzLlxuICAgKiBJbiBzb21lIGNhc2VzLCB0aGlzIGlzIG5vdCBwb3NzaWJsZSwgc2luY2UgdGhlIGZpbGUgd2FzIGFjdHVhbGx5IHN5bnRoZXNpemVkIGJ5IHRoZSBidWlsZCB0b29sLlxuICAgKiBCdXQgdGhlIGVuZCByZXN1bHQgaXMgYmV0dGVyIHRoYW4gcHJlZml4aW5nIHRoZSBzb3VyY2VSb290IGluIGZyb250IG9mIHRoZSBzY2hlbWUuXG4gICAqL1xuICBwcml2YXRlIHJlcGxhY2VTY2hlbWVXaXRoUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLnJlcGxhY2UoXG4gICAgICAgIFNDSEVNRV9NQVRDSEVSLCAoXzogc3RyaW5nLCBzY2hlbWU6IHN0cmluZykgPT4gdGhpcy5zY2hlbWVNYXBbc2NoZW1lLnRvTG93ZXJDYXNlKCldIHx8ICcnKTtcbiAgfVxufVxuIl19
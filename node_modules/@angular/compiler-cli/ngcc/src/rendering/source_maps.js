(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/rendering/source_maps", ["require", "exports", "convert-source-map", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/sourcemaps"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderSourceAndMap = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var convert_source_map_1 = require("convert-source-map");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var sourcemaps_1 = require("@angular/compiler-cli/src/ngtsc/sourcemaps");
    /**
     * Merge the input and output source-maps, replacing the source-map comment in the output file
     * with an appropriate source-map comment pointing to the merged source-map.
     */
    function renderSourceAndMap(logger, fs, sourceFile, generatedMagicString) {
        var _a;
        var sourceFilePath = file_system_1.absoluteFromSourceFile(sourceFile);
        var sourceMapPath = file_system_1.absoluteFrom(sourceFilePath + ".map");
        var generatedContent = generatedMagicString.toString();
        var generatedMap = generatedMagicString.generateMap({ file: sourceFilePath, source: sourceFilePath, includeContent: true });
        try {
            var loader = new sourcemaps_1.SourceFileLoader(fs, logger, {});
            var generatedFile = loader.loadSourceFile(sourceFilePath, generatedContent, { map: generatedMap, mapPath: sourceMapPath });
            var rawMergedMap = generatedFile.renderFlattenedSourceMap();
            var mergedMap = convert_source_map_1.fromObject(rawMergedMap);
            var originalFile = loader.loadSourceFile(sourceFilePath, generatedMagicString.original);
            if (originalFile.rawMap === null && !sourceFile.isDeclarationFile ||
                ((_a = originalFile.rawMap) === null || _a === void 0 ? void 0 : _a.origin) === sourcemaps_1.ContentOrigin.Inline) {
                // We render an inline source map if one of:
                // * there was no input source map and this is not a typings file;
                // * the input source map exists and was inline.
                //
                // We do not generate inline source maps for typings files unless there explicitly was one in
                // the input file because these inline source maps can be very large and it impacts on the
                // performance of IDEs that need to read them to provide intellisense etc.
                return [
                    { path: sourceFilePath, contents: generatedFile.contents + "\n" + mergedMap.toComment() }
                ];
            }
            var sourceMapComment = convert_source_map_1.generateMapFileComment(fs.basename(sourceFilePath) + ".map");
            return [
                { path: sourceFilePath, contents: generatedFile.contents + "\n" + sourceMapComment },
                { path: sourceMapPath, contents: mergedMap.toJSON() }
            ];
        }
        catch (e) {
            logger.error("Error when flattening the source-map \"" + sourceMapPath + "\" for \"" + sourceFilePath + "\": " + e.toString());
            return [
                { path: sourceFilePath, contents: generatedContent },
                { path: sourceMapPath, contents: convert_source_map_1.fromObject(generatedMap).toJSON() },
            ];
        }
    }
    exports.renderSourceAndMap = renderSourceAndMap;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX21hcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbmdjYy9zcmMvcmVuZGVyaW5nL3NvdXJjZV9tYXBzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILHlEQUEwRjtJQUkxRiwyRUFBd0c7SUFFeEcseUVBQTRGO0lBVTVGOzs7T0FHRztJQUNILFNBQWdCLGtCQUFrQixDQUM5QixNQUFjLEVBQUUsRUFBc0IsRUFBRSxVQUF5QixFQUNqRSxvQkFBaUM7O1FBQ25DLElBQU0sY0FBYyxHQUFHLG9DQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFELElBQU0sYUFBYSxHQUFHLDBCQUFZLENBQUksY0FBYyxTQUFNLENBQUMsQ0FBQztRQUM1RCxJQUFNLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pELElBQU0sWUFBWSxHQUFpQixvQkFBb0IsQ0FBQyxXQUFXLENBQy9ELEVBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBRTFFLElBQUk7WUFDRixJQUFNLE1BQU0sR0FBRyxJQUFJLDZCQUFnQixDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEQsSUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FDdkMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLEVBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFDLENBQUMsQ0FBQztZQUVuRixJQUFNLFlBQVksR0FBaUIsYUFBYSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDNUUsSUFBTSxTQUFTLEdBQUcsK0JBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzQyxJQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxRixJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGlCQUFpQjtnQkFDN0QsT0FBQSxZQUFZLENBQUMsTUFBTSwwQ0FBRSxNQUFNLE1BQUssMEJBQWEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hELDRDQUE0QztnQkFDNUMsa0VBQWtFO2dCQUNsRSxnREFBZ0Q7Z0JBQ2hELEVBQUU7Z0JBQ0YsNkZBQTZGO2dCQUM3RiwwRkFBMEY7Z0JBQzFGLDBFQUEwRTtnQkFDMUUsT0FBTztvQkFDTCxFQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFLLGFBQWEsQ0FBQyxRQUFRLFVBQUssU0FBUyxDQUFDLFNBQVMsRUFBSSxFQUFDO2lCQUN4RixDQUFDO2FBQ0g7WUFFRCxJQUFNLGdCQUFnQixHQUFHLDJDQUFzQixDQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQU0sQ0FBQyxDQUFDO1lBQ3RGLE9BQU87Z0JBQ0wsRUFBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBSyxhQUFhLENBQUMsUUFBUSxVQUFLLGdCQUFrQixFQUFDO2dCQUNsRixFQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBQzthQUNwRCxDQUFDO1NBQ0g7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUMsNENBQXlDLGFBQWEsaUJBQy9ELGNBQWMsWUFBTSxDQUFDLENBQUMsUUFBUSxFQUFJLENBQUMsQ0FBQztZQUN4QyxPQUFPO2dCQUNMLEVBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUM7Z0JBQ2xELEVBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsK0JBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQzthQUNuRSxDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBNUNELGdEQTRDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtmcm9tT2JqZWN0LCBnZW5lcmF0ZU1hcEZpbGVDb21tZW50LCBTb3VyY2VNYXBDb252ZXJ0ZXJ9IGZyb20gJ2NvbnZlcnQtc291cmNlLW1hcCc7XG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSAnbWFnaWMtc3RyaW5nJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2Fic29sdXRlRnJvbSwgYWJzb2x1dGVGcm9tU291cmNlRmlsZSwgUmVhZG9ubHlGaWxlU3lzdGVtfSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0nO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4uLy4uLy4uL3NyYy9uZ3RzYy9sb2dnaW5nJztcbmltcG9ydCB7Q29udGVudE9yaWdpbiwgUmF3U291cmNlTWFwLCBTb3VyY2VGaWxlTG9hZGVyfSBmcm9tICcuLi8uLi8uLi9zcmMvbmd0c2Mvc291cmNlbWFwcyc7XG5cbmltcG9ydCB7RmlsZVRvV3JpdGV9IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZU1hcEluZm8ge1xuICBzb3VyY2U6IHN0cmluZztcbiAgbWFwOiBTb3VyY2VNYXBDb252ZXJ0ZXJ8bnVsbDtcbiAgaXNJbmxpbmU6IGJvb2xlYW47XG59XG5cbi8qKlxuICogTWVyZ2UgdGhlIGlucHV0IGFuZCBvdXRwdXQgc291cmNlLW1hcHMsIHJlcGxhY2luZyB0aGUgc291cmNlLW1hcCBjb21tZW50IGluIHRoZSBvdXRwdXQgZmlsZVxuICogd2l0aCBhbiBhcHByb3ByaWF0ZSBzb3VyY2UtbWFwIGNvbW1lbnQgcG9pbnRpbmcgdG8gdGhlIG1lcmdlZCBzb3VyY2UtbWFwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU291cmNlQW5kTWFwKFxuICAgIGxvZ2dlcjogTG9nZ2VyLCBmczogUmVhZG9ubHlGaWxlU3lzdGVtLCBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLFxuICAgIGdlbmVyYXRlZE1hZ2ljU3RyaW5nOiBNYWdpY1N0cmluZyk6IEZpbGVUb1dyaXRlW10ge1xuICBjb25zdCBzb3VyY2VGaWxlUGF0aCA9IGFic29sdXRlRnJvbVNvdXJjZUZpbGUoc291cmNlRmlsZSk7XG4gIGNvbnN0IHNvdXJjZU1hcFBhdGggPSBhYnNvbHV0ZUZyb20oYCR7c291cmNlRmlsZVBhdGh9Lm1hcGApO1xuICBjb25zdCBnZW5lcmF0ZWRDb250ZW50ID0gZ2VuZXJhdGVkTWFnaWNTdHJpbmcudG9TdHJpbmcoKTtcbiAgY29uc3QgZ2VuZXJhdGVkTWFwOiBSYXdTb3VyY2VNYXAgPSBnZW5lcmF0ZWRNYWdpY1N0cmluZy5nZW5lcmF0ZU1hcChcbiAgICAgIHtmaWxlOiBzb3VyY2VGaWxlUGF0aCwgc291cmNlOiBzb3VyY2VGaWxlUGF0aCwgaW5jbHVkZUNvbnRlbnQ6IHRydWV9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IGxvYWRlciA9IG5ldyBTb3VyY2VGaWxlTG9hZGVyKGZzLCBsb2dnZXIsIHt9KTtcbiAgICBjb25zdCBnZW5lcmF0ZWRGaWxlID0gbG9hZGVyLmxvYWRTb3VyY2VGaWxlKFxuICAgICAgICBzb3VyY2VGaWxlUGF0aCwgZ2VuZXJhdGVkQ29udGVudCwge21hcDogZ2VuZXJhdGVkTWFwLCBtYXBQYXRoOiBzb3VyY2VNYXBQYXRofSk7XG5cbiAgICBjb25zdCByYXdNZXJnZWRNYXA6IFJhd1NvdXJjZU1hcCA9IGdlbmVyYXRlZEZpbGUucmVuZGVyRmxhdHRlbmVkU291cmNlTWFwKCk7XG4gICAgY29uc3QgbWVyZ2VkTWFwID0gZnJvbU9iamVjdChyYXdNZXJnZWRNYXApO1xuICAgIGNvbnN0IG9yaWdpbmFsRmlsZSA9IGxvYWRlci5sb2FkU291cmNlRmlsZShzb3VyY2VGaWxlUGF0aCwgZ2VuZXJhdGVkTWFnaWNTdHJpbmcub3JpZ2luYWwpO1xuICAgIGlmIChvcmlnaW5hbEZpbGUucmF3TWFwID09PSBudWxsICYmICFzb3VyY2VGaWxlLmlzRGVjbGFyYXRpb25GaWxlIHx8XG4gICAgICAgIG9yaWdpbmFsRmlsZS5yYXdNYXA/Lm9yaWdpbiA9PT0gQ29udGVudE9yaWdpbi5JbmxpbmUpIHtcbiAgICAgIC8vIFdlIHJlbmRlciBhbiBpbmxpbmUgc291cmNlIG1hcCBpZiBvbmUgb2Y6XG4gICAgICAvLyAqIHRoZXJlIHdhcyBubyBpbnB1dCBzb3VyY2UgbWFwIGFuZCB0aGlzIGlzIG5vdCBhIHR5cGluZ3MgZmlsZTtcbiAgICAgIC8vICogdGhlIGlucHV0IHNvdXJjZSBtYXAgZXhpc3RzIGFuZCB3YXMgaW5saW5lLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIGRvIG5vdCBnZW5lcmF0ZSBpbmxpbmUgc291cmNlIG1hcHMgZm9yIHR5cGluZ3MgZmlsZXMgdW5sZXNzIHRoZXJlIGV4cGxpY2l0bHkgd2FzIG9uZSBpblxuICAgICAgLy8gdGhlIGlucHV0IGZpbGUgYmVjYXVzZSB0aGVzZSBpbmxpbmUgc291cmNlIG1hcHMgY2FuIGJlIHZlcnkgbGFyZ2UgYW5kIGl0IGltcGFjdHMgb24gdGhlXG4gICAgICAvLyBwZXJmb3JtYW5jZSBvZiBJREVzIHRoYXQgbmVlZCB0byByZWFkIHRoZW0gdG8gcHJvdmlkZSBpbnRlbGxpc2Vuc2UgZXRjLlxuICAgICAgcmV0dXJuIFtcbiAgICAgICAge3BhdGg6IHNvdXJjZUZpbGVQYXRoLCBjb250ZW50czogYCR7Z2VuZXJhdGVkRmlsZS5jb250ZW50c31cXG4ke21lcmdlZE1hcC50b0NvbW1lbnQoKX1gfVxuICAgICAgXTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VNYXBDb21tZW50ID0gZ2VuZXJhdGVNYXBGaWxlQ29tbWVudChgJHtmcy5iYXNlbmFtZShzb3VyY2VGaWxlUGF0aCl9Lm1hcGApO1xuICAgIHJldHVybiBbXG4gICAgICB7cGF0aDogc291cmNlRmlsZVBhdGgsIGNvbnRlbnRzOiBgJHtnZW5lcmF0ZWRGaWxlLmNvbnRlbnRzfVxcbiR7c291cmNlTWFwQ29tbWVudH1gfSxcbiAgICAgIHtwYXRoOiBzb3VyY2VNYXBQYXRoLCBjb250ZW50czogbWVyZ2VkTWFwLnRvSlNPTigpfVxuICAgIF07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHdoZW4gZmxhdHRlbmluZyB0aGUgc291cmNlLW1hcCBcIiR7c291cmNlTWFwUGF0aH1cIiBmb3IgXCIke1xuICAgICAgICBzb3VyY2VGaWxlUGF0aH1cIjogJHtlLnRvU3RyaW5nKCl9YCk7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtwYXRoOiBzb3VyY2VGaWxlUGF0aCwgY29udGVudHM6IGdlbmVyYXRlZENvbnRlbnR9LFxuICAgICAge3BhdGg6IHNvdXJjZU1hcFBhdGgsIGNvbnRlbnRzOiBmcm9tT2JqZWN0KGdlbmVyYXRlZE1hcCkudG9KU09OKCl9LFxuICAgIF07XG4gIH1cbn1cbiJdfQ==
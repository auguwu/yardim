(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system_native", ["require", "exports", "tslib", "os", "@angular/compiler-cli/src/ngtsc/file_system/src/node_js_file_system", "@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockFileSystemNative = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /// <reference types="node" />
    var os = require("os");
    var node_js_file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system/src/node_js_file_system");
    var mock_file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system");
    var isWindows = os.platform() === 'win32';
    var MockFileSystemNative = /** @class */ (function (_super) {
        tslib_1.__extends(MockFileSystemNative, _super);
        function MockFileSystemNative(cwd) {
            if (cwd === void 0) { cwd = '/'; }
            return _super.call(this, undefined, cwd) || this;
        }
        // Delegate to the real NodeJSFileSystem for these path related methods
        MockFileSystemNative.prototype.resolve = function () {
            var _a;
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            return (_a = node_js_file_system_1.NodeJSFileSystem.prototype.resolve).call.apply(_a, tslib_1.__spread([this, this.pwd()], paths));
        };
        MockFileSystemNative.prototype.dirname = function (file) {
            return node_js_file_system_1.NodeJSFileSystem.prototype.dirname.call(this, file);
        };
        MockFileSystemNative.prototype.join = function (basePath) {
            var _a;
            var paths = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                paths[_i - 1] = arguments[_i];
            }
            return (_a = node_js_file_system_1.NodeJSFileSystem.prototype.join).call.apply(_a, tslib_1.__spread([this, basePath], paths));
        };
        MockFileSystemNative.prototype.relative = function (from, to) {
            return node_js_file_system_1.NodeJSFileSystem.prototype.relative.call(this, from, to);
        };
        MockFileSystemNative.prototype.basename = function (filePath, extension) {
            return node_js_file_system_1.NodeJSFileSystem.prototype.basename.call(this, filePath, extension);
        };
        MockFileSystemNative.prototype.isCaseSensitive = function () {
            return node_js_file_system_1.NodeJSFileSystem.prototype.isCaseSensitive.call(this);
        };
        MockFileSystemNative.prototype.isRooted = function (path) {
            return node_js_file_system_1.NodeJSFileSystem.prototype.isRooted.call(this, path);
        };
        MockFileSystemNative.prototype.isRoot = function (path) {
            return node_js_file_system_1.NodeJSFileSystem.prototype.isRoot.call(this, path);
        };
        MockFileSystemNative.prototype.normalize = function (path) {
            // When running in Windows, absolute paths are normalized to always include a drive letter. This
            // ensures that rooted posix paths used in tests will be normalized to real Windows paths, i.e.
            // including a drive letter. Note that the same normalization is done in emulated Windows mode
            // (see `MockFileSystemWindows`) so that the behavior is identical between native Windows and
            // emulated Windows mode.
            if (isWindows) {
                path = path.replace(/^[\/\\]/i, 'C:/');
            }
            return node_js_file_system_1.NodeJSFileSystem.prototype.normalize.call(this, path);
        };
        MockFileSystemNative.prototype.splitPath = function (path) {
            return path.split(/[\\\/]/);
        };
        return MockFileSystemNative;
    }(mock_file_system_1.MockFileSystem));
    exports.MockFileSystemNative = MockFileSystemNative;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19maWxlX3N5c3RlbV9uYXRpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL2ZpbGVfc3lzdGVtL3Rlc3Rpbmcvc3JjL21vY2tfZmlsZV9zeXN0ZW1fbmF0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw4QkFBOEI7SUFDOUIsdUJBQXlCO0lBQ3pCLDJHQUErRDtJQUcvRCw2R0FBa0Q7SUFFbEQsSUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLE9BQU8sQ0FBQztJQUU1QztRQUEwQyxnREFBYztRQUN0RCw4QkFBWSxHQUEyQztZQUEzQyxvQkFBQSxFQUFBLE1BQXNCLEdBQXFCO21CQUNyRCxrQkFBTSxTQUFTLEVBQUUsR0FBRyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCx1RUFBdUU7UUFFdkUsc0NBQU8sR0FBUDs7WUFBUSxlQUFrQjtpQkFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO2dCQUFsQiwwQkFBa0I7O1lBQ3hCLE9BQU8sQ0FBQSxLQUFBLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUEsQ0FBQyxJQUFJLDZCQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUssS0FBSyxHQUFFO1FBQzdFLENBQUM7UUFDRCxzQ0FBTyxHQUFQLFVBQTBCLElBQU87WUFDL0IsT0FBTyxzQ0FBZ0IsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFNLENBQUM7UUFDbEUsQ0FBQztRQUNELG1DQUFJLEdBQUosVUFBdUIsUUFBVzs7WUFBRSxlQUFrQjtpQkFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO2dCQUFsQiw4QkFBa0I7O1lBQ3BELE9BQU8sQ0FBQSxLQUFBLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUEsQ0FBQyxJQUFJLDZCQUFDLElBQUksRUFBRSxRQUFRLEdBQUssS0FBSyxFQUFNLENBQUM7UUFDN0UsQ0FBQztRQUNELHVDQUFRLEdBQVIsVUFBK0IsSUFBTyxFQUFFLEVBQUs7WUFDM0MsT0FBTyxzQ0FBZ0IsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCx1Q0FBUSxHQUFSLFVBQVMsUUFBZ0IsRUFBRSxTQUFrQjtZQUMzQyxPQUFPLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELDhDQUFlLEdBQWY7WUFDRSxPQUFPLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCx1Q0FBUSxHQUFSLFVBQVMsSUFBWTtZQUNuQixPQUFPLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQscUNBQU0sR0FBTixVQUFPLElBQW9CO1lBQ3pCLE9BQU8sc0NBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCx3Q0FBUyxHQUFULFVBQWdDLElBQU87WUFDckMsZ0dBQWdHO1lBQ2hHLCtGQUErRjtZQUMvRiw4RkFBOEY7WUFDOUYsNkZBQTZGO1lBQzdGLHlCQUF5QjtZQUN6QixJQUFJLFNBQVMsRUFBRTtnQkFDYixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFNLENBQUM7YUFDN0M7WUFFRCxPQUFPLHNDQUFnQixDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQU0sQ0FBQztRQUNwRSxDQUFDO1FBRVMsd0NBQVMsR0FBbkIsVUFBdUIsSUFBWTtZQUNqQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNILDJCQUFDO0lBQUQsQ0FBQyxBQXBERCxDQUEwQyxpQ0FBYyxHQW9EdkQ7SUFwRFksb0RBQW9CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHtOb2RlSlNGaWxlU3lzdGVtfSBmcm9tICcuLi8uLi9zcmMvbm9kZV9qc19maWxlX3N5c3RlbSc7XG5pbXBvcnQge0Fic29sdXRlRnNQYXRoLCBQYXRoU2VnbWVudCwgUGF0aFN0cmluZ30gZnJvbSAnLi4vLi4vc3JjL3R5cGVzJztcblxuaW1wb3J0IHtNb2NrRmlsZVN5c3RlbX0gZnJvbSAnLi9tb2NrX2ZpbGVfc3lzdGVtJztcblxuY29uc3QgaXNXaW5kb3dzID0gb3MucGxhdGZvcm0oKSA9PT0gJ3dpbjMyJztcblxuZXhwb3J0IGNsYXNzIE1vY2tGaWxlU3lzdGVtTmF0aXZlIGV4dGVuZHMgTW9ja0ZpbGVTeXN0ZW0ge1xuICBjb25zdHJ1Y3Rvcihjd2Q6IEFic29sdXRlRnNQYXRoID0gJy8nIGFzIEFic29sdXRlRnNQYXRoKSB7XG4gICAgc3VwZXIodW5kZWZpbmVkLCBjd2QpO1xuICB9XG5cbiAgLy8gRGVsZWdhdGUgdG8gdGhlIHJlYWwgTm9kZUpTRmlsZVN5c3RlbSBmb3IgdGhlc2UgcGF0aCByZWxhdGVkIG1ldGhvZHNcblxuICByZXNvbHZlKC4uLnBhdGhzOiBzdHJpbmdbXSk6IEFic29sdXRlRnNQYXRoIHtcbiAgICByZXR1cm4gTm9kZUpTRmlsZVN5c3RlbS5wcm90b3R5cGUucmVzb2x2ZS5jYWxsKHRoaXMsIHRoaXMucHdkKCksIC4uLnBhdGhzKTtcbiAgfVxuICBkaXJuYW1lPFQgZXh0ZW5kcyBzdHJpbmc+KGZpbGU6IFQpOiBUIHtcbiAgICByZXR1cm4gTm9kZUpTRmlsZVN5c3RlbS5wcm90b3R5cGUuZGlybmFtZS5jYWxsKHRoaXMsIGZpbGUpIGFzIFQ7XG4gIH1cbiAgam9pbjxUIGV4dGVuZHMgc3RyaW5nPihiYXNlUGF0aDogVCwgLi4ucGF0aHM6IHN0cmluZ1tdKTogVCB7XG4gICAgcmV0dXJuIE5vZGVKU0ZpbGVTeXN0ZW0ucHJvdG90eXBlLmpvaW4uY2FsbCh0aGlzLCBiYXNlUGF0aCwgLi4ucGF0aHMpIGFzIFQ7XG4gIH1cbiAgcmVsYXRpdmU8VCBleHRlbmRzIFBhdGhTdHJpbmc+KGZyb206IFQsIHRvOiBUKTogUGF0aFNlZ21lbnR8QWJzb2x1dGVGc1BhdGgge1xuICAgIHJldHVybiBOb2RlSlNGaWxlU3lzdGVtLnByb3RvdHlwZS5yZWxhdGl2ZS5jYWxsKHRoaXMsIGZyb20sIHRvKTtcbiAgfVxuXG4gIGJhc2VuYW1lKGZpbGVQYXRoOiBzdHJpbmcsIGV4dGVuc2lvbj86IHN0cmluZyk6IFBhdGhTZWdtZW50IHtcbiAgICByZXR1cm4gTm9kZUpTRmlsZVN5c3RlbS5wcm90b3R5cGUuYmFzZW5hbWUuY2FsbCh0aGlzLCBmaWxlUGF0aCwgZXh0ZW5zaW9uKTtcbiAgfVxuXG4gIGlzQ2FzZVNlbnNpdGl2ZSgpIHtcbiAgICByZXR1cm4gTm9kZUpTRmlsZVN5c3RlbS5wcm90b3R5cGUuaXNDYXNlU2Vuc2l0aXZlLmNhbGwodGhpcyk7XG4gIH1cblxuICBpc1Jvb3RlZChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gTm9kZUpTRmlsZVN5c3RlbS5wcm90b3R5cGUuaXNSb290ZWQuY2FsbCh0aGlzLCBwYXRoKTtcbiAgfVxuXG4gIGlzUm9vdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBOb2RlSlNGaWxlU3lzdGVtLnByb3RvdHlwZS5pc1Jvb3QuY2FsbCh0aGlzLCBwYXRoKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4ocGF0aDogVCk6IFQge1xuICAgIC8vIFdoZW4gcnVubmluZyBpbiBXaW5kb3dzLCBhYnNvbHV0ZSBwYXRocyBhcmUgbm9ybWFsaXplZCB0byBhbHdheXMgaW5jbHVkZSBhIGRyaXZlIGxldHRlci4gVGhpc1xuICAgIC8vIGVuc3VyZXMgdGhhdCByb290ZWQgcG9zaXggcGF0aHMgdXNlZCBpbiB0ZXN0cyB3aWxsIGJlIG5vcm1hbGl6ZWQgdG8gcmVhbCBXaW5kb3dzIHBhdGhzLCBpLmUuXG4gICAgLy8gaW5jbHVkaW5nIGEgZHJpdmUgbGV0dGVyLiBOb3RlIHRoYXQgdGhlIHNhbWUgbm9ybWFsaXphdGlvbiBpcyBkb25lIGluIGVtdWxhdGVkIFdpbmRvd3MgbW9kZVxuICAgIC8vIChzZWUgYE1vY2tGaWxlU3lzdGVtV2luZG93c2ApIHNvIHRoYXQgdGhlIGJlaGF2aW9yIGlzIGlkZW50aWNhbCBiZXR3ZWVuIG5hdGl2ZSBXaW5kb3dzIGFuZFxuICAgIC8vIGVtdWxhdGVkIFdpbmRvd3MgbW9kZS5cbiAgICBpZiAoaXNXaW5kb3dzKSB7XG4gICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eW1xcL1xcXFxdL2ksICdDOi8nKSBhcyBUO1xuICAgIH1cblxuICAgIHJldHVybiBOb2RlSlNGaWxlU3lzdGVtLnByb3RvdHlwZS5ub3JtYWxpemUuY2FsbCh0aGlzLCBwYXRoKSBhcyBUO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNwbGl0UGF0aDxUPihwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHBhdGguc3BsaXQoL1tcXFxcXFwvXS8pO1xuICB9XG59XG4iXX0=
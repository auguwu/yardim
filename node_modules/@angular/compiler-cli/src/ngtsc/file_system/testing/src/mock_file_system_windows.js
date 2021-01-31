(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system_windows", ["require", "exports", "tslib", "path", "@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockFileSystemWindows = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /// <reference types="node" />
    var p = require("path");
    var mock_file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system");
    var MockFileSystemWindows = /** @class */ (function (_super) {
        tslib_1.__extends(MockFileSystemWindows, _super);
        function MockFileSystemWindows() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MockFileSystemWindows.prototype.resolve = function () {
            var _a;
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            var resolved = (_a = p.win32).resolve.apply(_a, tslib_1.__spread([this.pwd()], paths));
            return this.normalize(resolved);
        };
        MockFileSystemWindows.prototype.dirname = function (path) {
            return this.normalize(p.win32.dirname(path));
        };
        MockFileSystemWindows.prototype.join = function (basePath) {
            var _a;
            var paths = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                paths[_i - 1] = arguments[_i];
            }
            return this.normalize((_a = p.win32).join.apply(_a, tslib_1.__spread([basePath], paths)));
        };
        MockFileSystemWindows.prototype.relative = function (from, to) {
            return this.normalize(p.win32.relative(from, to));
        };
        MockFileSystemWindows.prototype.basename = function (filePath, extension) {
            return p.win32.basename(filePath, extension);
        };
        MockFileSystemWindows.prototype.isRooted = function (path) {
            return /^([A-Z]:)?([\\\/]|$)/i.test(path);
        };
        MockFileSystemWindows.prototype.splitPath = function (path) {
            return path.split(/[\\\/]/);
        };
        MockFileSystemWindows.prototype.normalize = function (path) {
            return path.replace(/^[\/\\]/i, 'C:/').replace(/\\/g, '/');
        };
        return MockFileSystemWindows;
    }(mock_file_system_1.MockFileSystem));
    exports.MockFileSystemWindows = MockFileSystemWindows;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19maWxlX3N5c3RlbV93aW5kb3dzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9maWxlX3N5c3RlbS90ZXN0aW5nL3NyYy9tb2NrX2ZpbGVfc3lzdGVtX3dpbmRvd3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILDhCQUE4QjtJQUM5Qix3QkFBMEI7SUFHMUIsNkdBQWtEO0lBRWxEO1FBQTJDLGlEQUFjO1FBQXpEOztRQWlDQSxDQUFDO1FBaENDLHVDQUFPLEdBQVA7O1lBQVEsZUFBa0I7aUJBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtnQkFBbEIsMEJBQWtCOztZQUN4QixJQUFNLFFBQVEsR0FBRyxDQUFBLEtBQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQSxDQUFDLE9BQU8sNkJBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFLLEtBQUssRUFBQyxDQUFDO1lBQ3ZELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUEwQixDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELHVDQUFPLEdBQVAsVUFBMEIsSUFBTztZQUMvQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFNLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsb0NBQUksR0FBSixVQUF1QixRQUFXOztZQUFFLGVBQWtCO2lCQUFsQixVQUFrQixFQUFsQixxQkFBa0IsRUFBbEIsSUFBa0I7Z0JBQWxCLDhCQUFrQjs7WUFDcEQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUEsS0FBQSxDQUFDLENBQUMsS0FBSyxDQUFBLENBQUMsSUFBSSw2QkFBQyxRQUFRLEdBQUssS0FBSyxHQUFPLENBQUM7UUFDL0QsQ0FBQztRQUVELHdDQUFRLEdBQVIsVUFBK0IsSUFBTyxFQUFFLEVBQUs7WUFDM0MsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBaUMsQ0FBQztRQUNwRixDQUFDO1FBRUQsd0NBQVEsR0FBUixVQUFTLFFBQWdCLEVBQUUsU0FBa0I7WUFDM0MsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFnQixDQUFDO1FBQzlELENBQUM7UUFFRCx3Q0FBUSxHQUFSLFVBQVMsSUFBWTtZQUNuQixPQUFPLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRVMseUNBQVMsR0FBbkIsVUFBMEMsSUFBTztZQUMvQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELHlDQUFTLEdBQVQsVUFBZ0MsSUFBTztZQUNyQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFNLENBQUM7UUFDbEUsQ0FBQztRQUNILDRCQUFDO0lBQUQsQ0FBQyxBQWpDRCxDQUEyQyxpQ0FBYyxHQWlDeEQ7SUFqQ1ksc0RBQXFCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuaW1wb3J0ICogYXMgcCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aCwgUGF0aFNlZ21lbnQsIFBhdGhTdHJpbmd9IGZyb20gJy4uLy4uL3NyYy90eXBlcyc7XG5pbXBvcnQge01vY2tGaWxlU3lzdGVtfSBmcm9tICcuL21vY2tfZmlsZV9zeXN0ZW0nO1xuXG5leHBvcnQgY2xhc3MgTW9ja0ZpbGVTeXN0ZW1XaW5kb3dzIGV4dGVuZHMgTW9ja0ZpbGVTeXN0ZW0ge1xuICByZXNvbHZlKC4uLnBhdGhzOiBzdHJpbmdbXSk6IEFic29sdXRlRnNQYXRoIHtcbiAgICBjb25zdCByZXNvbHZlZCA9IHAud2luMzIucmVzb2x2ZSh0aGlzLnB3ZCgpLCAuLi5wYXRocyk7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHJlc29sdmVkIGFzIEFic29sdXRlRnNQYXRoKTtcbiAgfVxuXG4gIGRpcm5hbWU8VCBleHRlbmRzIHN0cmluZz4ocGF0aDogVCk6IFQge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwLndpbjMyLmRpcm5hbWUocGF0aCkgYXMgVCk7XG4gIH1cblxuICBqb2luPFQgZXh0ZW5kcyBzdHJpbmc+KGJhc2VQYXRoOiBULCAuLi5wYXRoczogc3RyaW5nW10pOiBUIHtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUocC53aW4zMi5qb2luKGJhc2VQYXRoLCAuLi5wYXRocykpIGFzIFQ7XG4gIH1cblxuICByZWxhdGl2ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4oZnJvbTogVCwgdG86IFQpOiBQYXRoU2VnbWVudHxBYnNvbHV0ZUZzUGF0aCB7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHAud2luMzIucmVsYXRpdmUoZnJvbSwgdG8pKSBhcyBQYXRoU2VnbWVudCB8IEFic29sdXRlRnNQYXRoO1xuICB9XG5cbiAgYmFzZW5hbWUoZmlsZVBhdGg6IHN0cmluZywgZXh0ZW5zaW9uPzogc3RyaW5nKTogUGF0aFNlZ21lbnQge1xuICAgIHJldHVybiBwLndpbjMyLmJhc2VuYW1lKGZpbGVQYXRoLCBleHRlbnNpb24pIGFzIFBhdGhTZWdtZW50O1xuICB9XG5cbiAgaXNSb290ZWQocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIC9eKFtBLVpdOik/KFtcXFxcXFwvXXwkKS9pLnRlc3QocGF0aCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3BsaXRQYXRoPFQgZXh0ZW5kcyBQYXRoU3RyaW5nPihwYXRoOiBUKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBwYXRoLnNwbGl0KC9bXFxcXFxcL10vKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4ocGF0aDogVCk6IFQge1xuICAgIHJldHVybiBwYXRoLnJlcGxhY2UoL15bXFwvXFxcXF0vaSwgJ0M6LycpLnJlcGxhY2UoL1xcXFwvZywgJy8nKSBhcyBUO1xuICB9XG59XG4iXX0=
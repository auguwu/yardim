(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system_posix", ["require", "exports", "tslib", "path", "@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockFileSystemPosix = void 0;
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
    var MockFileSystemPosix = /** @class */ (function (_super) {
        tslib_1.__extends(MockFileSystemPosix, _super);
        function MockFileSystemPosix() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MockFileSystemPosix.prototype.resolve = function () {
            var _a;
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            var resolved = (_a = p.posix).resolve.apply(_a, tslib_1.__spread([this.pwd()], paths));
            return this.normalize(resolved);
        };
        MockFileSystemPosix.prototype.dirname = function (file) {
            return this.normalize(p.posix.dirname(file));
        };
        MockFileSystemPosix.prototype.join = function (basePath) {
            var _a;
            var paths = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                paths[_i - 1] = arguments[_i];
            }
            return this.normalize((_a = p.posix).join.apply(_a, tslib_1.__spread([basePath], paths)));
        };
        MockFileSystemPosix.prototype.relative = function (from, to) {
            return this.normalize(p.posix.relative(from, to));
        };
        MockFileSystemPosix.prototype.basename = function (filePath, extension) {
            return p.posix.basename(filePath, extension);
        };
        MockFileSystemPosix.prototype.isRooted = function (path) {
            return path.startsWith('/');
        };
        MockFileSystemPosix.prototype.splitPath = function (path) {
            return path.split('/');
        };
        MockFileSystemPosix.prototype.normalize = function (path) {
            return path.replace(/^[a-z]:\//i, '/').replace(/\\/g, '/');
        };
        return MockFileSystemPosix;
    }(mock_file_system_1.MockFileSystem));
    exports.MockFileSystemPosix = MockFileSystemPosix;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19maWxlX3N5c3RlbV9wb3NpeC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0vdGVzdGluZy9zcmMvbW9ja19maWxlX3N5c3RlbV9wb3NpeC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsOEJBQThCO0lBQzlCLHdCQUEwQjtJQUcxQiw2R0FBa0Q7SUFFbEQ7UUFBeUMsK0NBQWM7UUFBdkQ7O1FBaUNBLENBQUM7UUFoQ0MscUNBQU8sR0FBUDs7WUFBUSxlQUFrQjtpQkFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO2dCQUFsQiwwQkFBa0I7O1lBQ3hCLElBQU0sUUFBUSxHQUFHLENBQUEsS0FBQSxDQUFDLENBQUMsS0FBSyxDQUFBLENBQUMsT0FBTyw2QkFBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUssS0FBSyxFQUFDLENBQUM7WUFDdkQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBbUIsQ0FBQztRQUNwRCxDQUFDO1FBRUQscUNBQU8sR0FBUCxVQUEwQixJQUFPO1lBQy9CLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBTSxDQUFDO1FBQ3BELENBQUM7UUFFRCxrQ0FBSSxHQUFKLFVBQXVCLFFBQVc7O1lBQUUsZUFBa0I7aUJBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtnQkFBbEIsOEJBQWtCOztZQUNwRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQSxLQUFBLENBQUMsQ0FBQyxLQUFLLENBQUEsQ0FBQyxJQUFJLDZCQUFDLFFBQVEsR0FBSyxLQUFLLEdBQU8sQ0FBQztRQUMvRCxDQUFDO1FBRUQsc0NBQVEsR0FBUixVQUErQixJQUFPLEVBQUUsRUFBSztZQUMzQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFpQyxDQUFDO1FBQ3BGLENBQUM7UUFFRCxzQ0FBUSxHQUFSLFVBQVMsUUFBZ0IsRUFBRSxTQUFrQjtZQUMzQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQWdCLENBQUM7UUFDOUQsQ0FBQztRQUVELHNDQUFRLEdBQVIsVUFBUyxJQUFZO1lBQ25CLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRVMsdUNBQVMsR0FBbkIsVUFBMEMsSUFBTztZQUMvQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVELHVDQUFTLEdBQVQsVUFBZ0MsSUFBTztZQUNyQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFNLENBQUM7UUFDbEUsQ0FBQztRQUNILDBCQUFDO0lBQUQsQ0FBQyxBQWpDRCxDQUF5QyxpQ0FBYyxHQWlDdEQ7SUFqQ1ksa0RBQW1CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuaW1wb3J0ICogYXMgcCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aCwgUGF0aFNlZ21lbnQsIFBhdGhTdHJpbmd9IGZyb20gJy4uLy4uL3NyYy90eXBlcyc7XG5pbXBvcnQge01vY2tGaWxlU3lzdGVtfSBmcm9tICcuL21vY2tfZmlsZV9zeXN0ZW0nO1xuXG5leHBvcnQgY2xhc3MgTW9ja0ZpbGVTeXN0ZW1Qb3NpeCBleHRlbmRzIE1vY2tGaWxlU3lzdGVtIHtcbiAgcmVzb2x2ZSguLi5wYXRoczogc3RyaW5nW10pOiBBYnNvbHV0ZUZzUGF0aCB7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBwLnBvc2l4LnJlc29sdmUodGhpcy5wd2QoKSwgLi4ucGF0aHMpO1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShyZXNvbHZlZCkgYXMgQWJzb2x1dGVGc1BhdGg7XG4gIH1cblxuICBkaXJuYW1lPFQgZXh0ZW5kcyBzdHJpbmc+KGZpbGU6IFQpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUocC5wb3NpeC5kaXJuYW1lKGZpbGUpKSBhcyBUO1xuICB9XG5cbiAgam9pbjxUIGV4dGVuZHMgc3RyaW5nPihiYXNlUGF0aDogVCwgLi4ucGF0aHM6IHN0cmluZ1tdKTogVCB7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHAucG9zaXguam9pbihiYXNlUGF0aCwgLi4ucGF0aHMpKSBhcyBUO1xuICB9XG5cbiAgcmVsYXRpdmU8VCBleHRlbmRzIFBhdGhTdHJpbmc+KGZyb206IFQsIHRvOiBUKTogUGF0aFNlZ21lbnR8QWJzb2x1dGVGc1BhdGgge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwLnBvc2l4LnJlbGF0aXZlKGZyb20sIHRvKSkgYXMgUGF0aFNlZ21lbnQgfCBBYnNvbHV0ZUZzUGF0aDtcbiAgfVxuXG4gIGJhc2VuYW1lKGZpbGVQYXRoOiBzdHJpbmcsIGV4dGVuc2lvbj86IHN0cmluZyk6IFBhdGhTZWdtZW50IHtcbiAgICByZXR1cm4gcC5wb3NpeC5iYXNlbmFtZShmaWxlUGF0aCwgZXh0ZW5zaW9uKSBhcyBQYXRoU2VnbWVudDtcbiAgfVxuXG4gIGlzUm9vdGVkKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwYXRoLnN0YXJ0c1dpdGgoJy8nKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzcGxpdFBhdGg8VCBleHRlbmRzIFBhdGhTdHJpbmc+KHBhdGg6IFQpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHBhdGguc3BsaXQoJy8nKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4ocGF0aDogVCk6IFQge1xuICAgIHJldHVybiBwYXRoLnJlcGxhY2UoL15bYS16XTpcXC8vaSwgJy8nKS5yZXBsYWNlKC9cXFxcL2csICcvJykgYXMgVDtcbiAgfVxufVxuIl19
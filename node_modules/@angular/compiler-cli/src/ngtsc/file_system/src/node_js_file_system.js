(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/file_system/src/node_js_file_system", ["require", "exports", "tslib", "fs", "fs-extra", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSFileSystem = exports.NodeJSReadonlyFileSystem = exports.NodeJSPathManipulation = void 0;
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /// <reference types="node" />
    var fs = require("fs");
    var fsExtra = require("fs-extra");
    var p = require("path");
    /**
     * A wrapper around the Node.js file-system that supports path manipulation.
     */
    var NodeJSPathManipulation = /** @class */ (function () {
        function NodeJSPathManipulation() {
        }
        NodeJSPathManipulation.prototype.pwd = function () {
            return this.normalize(process.cwd());
        };
        NodeJSPathManipulation.prototype.chdir = function (dir) {
            process.chdir(dir);
        };
        NodeJSPathManipulation.prototype.resolve = function () {
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            return this.normalize(p.resolve.apply(p, tslib_1.__spread(paths)));
        };
        NodeJSPathManipulation.prototype.dirname = function (file) {
            return this.normalize(p.dirname(file));
        };
        NodeJSPathManipulation.prototype.join = function (basePath) {
            var paths = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                paths[_i - 1] = arguments[_i];
            }
            return this.normalize(p.join.apply(p, tslib_1.__spread([basePath], paths)));
        };
        NodeJSPathManipulation.prototype.isRoot = function (path) {
            return this.dirname(path) === this.normalize(path);
        };
        NodeJSPathManipulation.prototype.isRooted = function (path) {
            return p.isAbsolute(path);
        };
        NodeJSPathManipulation.prototype.relative = function (from, to) {
            return this.normalize(p.relative(from, to));
        };
        NodeJSPathManipulation.prototype.basename = function (filePath, extension) {
            return p.basename(filePath, extension);
        };
        NodeJSPathManipulation.prototype.extname = function (path) {
            return p.extname(path);
        };
        NodeJSPathManipulation.prototype.normalize = function (path) {
            // Convert backslashes to forward slashes
            return path.replace(/\\/g, '/');
        };
        return NodeJSPathManipulation;
    }());
    exports.NodeJSPathManipulation = NodeJSPathManipulation;
    /**
     * A wrapper around the Node.js file-system that supports readonly operations and path manipulation.
     */
    var NodeJSReadonlyFileSystem = /** @class */ (function (_super) {
        tslib_1.__extends(NodeJSReadonlyFileSystem, _super);
        function NodeJSReadonlyFileSystem() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._caseSensitive = undefined;
            return _this;
        }
        NodeJSReadonlyFileSystem.prototype.isCaseSensitive = function () {
            if (this._caseSensitive === undefined) {
                // Note the use of the real file-system is intentional:
                // `this.exists()` relies upon `isCaseSensitive()` so that would cause an infinite recursion.
                this._caseSensitive = !fs.existsSync(this.normalize(toggleCase(__filename)));
            }
            return this._caseSensitive;
        };
        NodeJSReadonlyFileSystem.prototype.exists = function (path) {
            return fs.existsSync(path);
        };
        NodeJSReadonlyFileSystem.prototype.readFile = function (path) {
            return fs.readFileSync(path, 'utf8');
        };
        NodeJSReadonlyFileSystem.prototype.readFileBuffer = function (path) {
            return fs.readFileSync(path);
        };
        NodeJSReadonlyFileSystem.prototype.readdir = function (path) {
            return fs.readdirSync(path);
        };
        NodeJSReadonlyFileSystem.prototype.lstat = function (path) {
            return fs.lstatSync(path);
        };
        NodeJSReadonlyFileSystem.prototype.stat = function (path) {
            return fs.statSync(path);
        };
        NodeJSReadonlyFileSystem.prototype.realpath = function (path) {
            return this.resolve(fs.realpathSync(path));
        };
        NodeJSReadonlyFileSystem.prototype.getDefaultLibLocation = function () {
            return this.resolve(require.resolve('typescript'), '..');
        };
        return NodeJSReadonlyFileSystem;
    }(NodeJSPathManipulation));
    exports.NodeJSReadonlyFileSystem = NodeJSReadonlyFileSystem;
    /**
     * A wrapper around the Node.js file-system (i.e. the `fs` package).
     */
    var NodeJSFileSystem = /** @class */ (function (_super) {
        tslib_1.__extends(NodeJSFileSystem, _super);
        function NodeJSFileSystem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NodeJSFileSystem.prototype.writeFile = function (path, data, exclusive) {
            if (exclusive === void 0) { exclusive = false; }
            fs.writeFileSync(path, data, exclusive ? { flag: 'wx' } : undefined);
        };
        NodeJSFileSystem.prototype.removeFile = function (path) {
            fs.unlinkSync(path);
        };
        NodeJSFileSystem.prototype.symlink = function (target, path) {
            fs.symlinkSync(target, path);
        };
        NodeJSFileSystem.prototype.copyFile = function (from, to) {
            fs.copyFileSync(from, to);
        };
        NodeJSFileSystem.prototype.moveFile = function (from, to) {
            fs.renameSync(from, to);
        };
        NodeJSFileSystem.prototype.ensureDir = function (path) {
            var parents = [];
            while (!this.isRoot(path) && !this.exists(path)) {
                parents.push(path);
                path = this.dirname(path);
            }
            while (parents.length) {
                this.safeMkdir(parents.pop());
            }
        };
        NodeJSFileSystem.prototype.removeDeep = function (path) {
            fsExtra.removeSync(path);
        };
        NodeJSFileSystem.prototype.safeMkdir = function (path) {
            try {
                fs.mkdirSync(path);
            }
            catch (err) {
                // Ignore the error, if the path already exists and points to a directory.
                // Re-throw otherwise.
                if (!this.exists(path) || !this.stat(path).isDirectory()) {
                    throw err;
                }
            }
        };
        return NodeJSFileSystem;
    }(NodeJSReadonlyFileSystem));
    exports.NodeJSFileSystem = NodeJSFileSystem;
    /**
     * Toggle the case of each character in a string.
     */
    function toggleCase(str) {
        return str.replace(/\w/g, function (ch) { return ch.toUpperCase() === ch ? ch.toLowerCase() : ch.toUpperCase(); });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9qc19maWxlX3N5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0vc3JjL25vZGVfanNfZmlsZV9zeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBOzs7Ozs7T0FNRztJQUNILDhCQUE4QjtJQUM5Qix1QkFBeUI7SUFDekIsa0NBQW9DO0lBQ3BDLHdCQUEwQjtJQUcxQjs7T0FFRztJQUNIO1FBQUE7UUFvQ0EsQ0FBQztRQW5DQyxvQ0FBRyxHQUFIO1lBQ0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBbUIsQ0FBQztRQUN6RCxDQUFDO1FBQ0Qsc0NBQUssR0FBTCxVQUFNLEdBQW1CO1lBQ3ZCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUNELHdDQUFPLEdBQVA7WUFBUSxlQUFrQjtpQkFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO2dCQUFsQiwwQkFBa0I7O1lBQ3hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxPQUFULENBQUMsbUJBQVksS0FBSyxHQUFvQixDQUFDO1FBQy9ELENBQUM7UUFFRCx3Q0FBTyxHQUFQLFVBQTBCLElBQU87WUFDL0IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQU0sQ0FBQztRQUM5QyxDQUFDO1FBQ0QscUNBQUksR0FBSixVQUF1QixRQUFXO1lBQUUsZUFBa0I7aUJBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtnQkFBbEIsOEJBQWtCOztZQUNwRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTixDQUFD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QUMsSUFBSSxDQUFDLENBQUM7YUFDM0I7WUFDRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRyxDQUFDLENBQUM7YUFDaEM7UUFDSCxDQUFDO1FBQ0QscUNBQVUsR0FBVixVQUFXLElBQW9CO1lBQzdCLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVPLG9DQUFTLEdBQWpCLFVBQWtCLElBQW9CO1lBQ3BDLElBQUk7Z0JBQ0YsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLDBFQUEwRTtnQkFDMUUsc0JBQXNCO2dCQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7b0JBQ3hELE1BQU0sR0FBRyxDQUFDO2lCQUNYO2FBQ0Y7UUFDSCxDQUFDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBekNELENBQXNDLHdCQUF3QixHQXlDN0Q7SUF6Q1ksNENBQWdCO0lBMkM3Qjs7T0FFRztJQUNILFNBQVMsVUFBVSxDQUFDLEdBQVc7UUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxVQUFBLEVBQUUsSUFBSSxPQUFBLEVBQUUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUE3RCxDQUE2RCxDQUFDLENBQUM7SUFDakcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJub2RlXCIgLz5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIGZzRXh0cmEgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcCBmcm9tICdwYXRoJztcbmltcG9ydCB7QWJzb2x1dGVGc1BhdGgsIEZpbGVTdGF0cywgRmlsZVN5c3RlbSwgUGF0aE1hbmlwdWxhdGlvbiwgUGF0aFNlZ21lbnQsIFBhdGhTdHJpbmcsIFJlYWRvbmx5RmlsZVN5c3RlbX0gZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCB0aGUgTm9kZS5qcyBmaWxlLXN5c3RlbSB0aGF0IHN1cHBvcnRzIHBhdGggbWFuaXB1bGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZUpTUGF0aE1hbmlwdWxhdGlvbiBpbXBsZW1lbnRzIFBhdGhNYW5pcHVsYXRpb24ge1xuICBwd2QoKTogQWJzb2x1dGVGc1BhdGgge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwcm9jZXNzLmN3ZCgpKSBhcyBBYnNvbHV0ZUZzUGF0aDtcbiAgfVxuICBjaGRpcihkaXI6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgcHJvY2Vzcy5jaGRpcihkaXIpO1xuICB9XG4gIHJlc29sdmUoLi4ucGF0aHM6IHN0cmluZ1tdKTogQWJzb2x1dGVGc1BhdGgge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwLnJlc29sdmUoLi4ucGF0aHMpKSBhcyBBYnNvbHV0ZUZzUGF0aDtcbiAgfVxuXG4gIGRpcm5hbWU8VCBleHRlbmRzIHN0cmluZz4oZmlsZTogVCk6IFQge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwLmRpcm5hbWUoZmlsZSkpIGFzIFQ7XG4gIH1cbiAgam9pbjxUIGV4dGVuZHMgc3RyaW5nPihiYXNlUGF0aDogVCwgLi4ucGF0aHM6IHN0cmluZ1tdKTogVCB7XG4gICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKHAuam9pbihiYXNlUGF0aCwgLi4ucGF0aHMpKSBhcyBUO1xuICB9XG4gIGlzUm9vdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRpcm5hbWUocGF0aCkgPT09IHRoaXMubm9ybWFsaXplKHBhdGgpO1xuICB9XG4gIGlzUm9vdGVkKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwLmlzQWJzb2x1dGUocGF0aCk7XG4gIH1cbiAgcmVsYXRpdmU8VCBleHRlbmRzIFBhdGhTdHJpbmc+KGZyb206IFQsIHRvOiBUKTogUGF0aFNlZ21lbnR8QWJzb2x1dGVGc1BhdGgge1xuICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZShwLnJlbGF0aXZlKGZyb20sIHRvKSkgYXMgUGF0aFNlZ21lbnQgfCBBYnNvbHV0ZUZzUGF0aDtcbiAgfVxuICBiYXNlbmFtZShmaWxlUGF0aDogc3RyaW5nLCBleHRlbnNpb24/OiBzdHJpbmcpOiBQYXRoU2VnbWVudCB7XG4gICAgcmV0dXJuIHAuYmFzZW5hbWUoZmlsZVBhdGgsIGV4dGVuc2lvbikgYXMgUGF0aFNlZ21lbnQ7XG4gIH1cbiAgZXh0bmFtZShwYXRoOiBBYnNvbHV0ZUZzUGF0aHxQYXRoU2VnbWVudCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHAuZXh0bmFtZShwYXRoKTtcbiAgfVxuICBub3JtYWxpemU8VCBleHRlbmRzIHN0cmluZz4ocGF0aDogVCk6IFQge1xuICAgIC8vIENvbnZlcnQgYmFja3NsYXNoZXMgdG8gZm9yd2FyZCBzbGFzaGVzXG4gICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpIGFzIFQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIHRoZSBOb2RlLmpzIGZpbGUtc3lzdGVtIHRoYXQgc3VwcG9ydHMgcmVhZG9ubHkgb3BlcmF0aW9ucyBhbmQgcGF0aCBtYW5pcHVsYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlSlNSZWFkb25seUZpbGVTeXN0ZW0gZXh0ZW5kcyBOb2RlSlNQYXRoTWFuaXB1bGF0aW9uIGltcGxlbWVudHMgUmVhZG9ubHlGaWxlU3lzdGVtIHtcbiAgcHJpdmF0ZSBfY2FzZVNlbnNpdGl2ZTogYm9vbGVhbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGlzQ2FzZVNlbnNpdGl2ZSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fY2FzZVNlbnNpdGl2ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBOb3RlIHRoZSB1c2Ugb2YgdGhlIHJlYWwgZmlsZS1zeXN0ZW0gaXMgaW50ZW50aW9uYWw6XG4gICAgICAvLyBgdGhpcy5leGlzdHMoKWAgcmVsaWVzIHVwb24gYGlzQ2FzZVNlbnNpdGl2ZSgpYCBzbyB0aGF0IHdvdWxkIGNhdXNlIGFuIGluZmluaXRlIHJlY3Vyc2lvbi5cbiAgICAgIHRoaXMuX2Nhc2VTZW5zaXRpdmUgPSAhZnMuZXhpc3RzU3luYyh0aGlzLm5vcm1hbGl6ZSh0b2dnbGVDYXNlKF9fZmlsZW5hbWUpKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jYXNlU2Vuc2l0aXZlO1xuICB9XG4gIGV4aXN0cyhwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmcy5leGlzdHNTeW5jKHBhdGgpO1xuICB9XG4gIHJlYWRGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHBhdGgsICd1dGY4Jyk7XG4gIH1cbiAgcmVhZEZpbGVCdWZmZXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHBhdGgpO1xuICB9XG4gIHJlYWRkaXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBQYXRoU2VnbWVudFtdIHtcbiAgICByZXR1cm4gZnMucmVhZGRpclN5bmMocGF0aCkgYXMgUGF0aFNlZ21lbnRbXTtcbiAgfVxuICBsc3RhdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IEZpbGVTdGF0cyB7XG4gICAgcmV0dXJuIGZzLmxzdGF0U3luYyhwYXRoKTtcbiAgfVxuICBzdGF0KHBhdGg6IEFic29sdXRlRnNQYXRoKTogRmlsZVN0YXRzIHtcbiAgICByZXR1cm4gZnMuc3RhdFN5bmMocGF0aCk7XG4gIH1cbiAgcmVhbHBhdGgocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBBYnNvbHV0ZUZzUGF0aCB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZShmcy5yZWFscGF0aFN5bmMocGF0aCkpO1xuICB9XG4gIGdldERlZmF1bHRMaWJMb2NhdGlvbigpOiBBYnNvbHV0ZUZzUGF0aCB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZShyZXF1aXJlLnJlc29sdmUoJ3R5cGVzY3JpcHQnKSwgJy4uJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIHRoZSBOb2RlLmpzIGZpbGUtc3lzdGVtIChpLmUuIHRoZSBgZnNgIHBhY2thZ2UpLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZUpTRmlsZVN5c3RlbSBleHRlbmRzIE5vZGVKU1JlYWRvbmx5RmlsZVN5c3RlbSBpbXBsZW1lbnRzIEZpbGVTeXN0ZW0ge1xuICB3cml0ZUZpbGUocGF0aDogQWJzb2x1dGVGc1BhdGgsIGRhdGE6IHN0cmluZ3xVaW50OEFycmF5LCBleGNsdXNpdmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xuICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aCwgZGF0YSwgZXhjbHVzaXZlID8ge2ZsYWc6ICd3eCd9IDogdW5kZWZpbmVkKTtcbiAgfVxuICByZW1vdmVGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgZnMudW5saW5rU3luYyhwYXRoKTtcbiAgfVxuICBzeW1saW5rKHRhcmdldDogQWJzb2x1dGVGc1BhdGgsIHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgZnMuc3ltbGlua1N5bmModGFyZ2V0LCBwYXRoKTtcbiAgfVxuICBjb3B5RmlsZShmcm9tOiBBYnNvbHV0ZUZzUGF0aCwgdG86IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgZnMuY29weUZpbGVTeW5jKGZyb20sIHRvKTtcbiAgfVxuICBtb3ZlRmlsZShmcm9tOiBBYnNvbHV0ZUZzUGF0aCwgdG86IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgZnMucmVuYW1lU3luYyhmcm9tLCB0byk7XG4gIH1cbiAgZW5zdXJlRGlyKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgY29uc3QgcGFyZW50czogQWJzb2x1dGVGc1BhdGhbXSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5pc1Jvb3QocGF0aCkgJiYgIXRoaXMuZXhpc3RzKHBhdGgpKSB7XG4gICAgICBwYXJlbnRzLnB1c2gocGF0aCk7XG4gICAgICBwYXRoID0gdGhpcy5kaXJuYW1lKHBhdGgpO1xuICAgIH1cbiAgICB3aGlsZSAocGFyZW50cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuc2FmZU1rZGlyKHBhcmVudHMucG9wKCkhKTtcbiAgICB9XG4gIH1cbiAgcmVtb3ZlRGVlcChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIGZzRXh0cmEucmVtb3ZlU3luYyhwYXRoKTtcbiAgfVxuXG4gIHByaXZhdGUgc2FmZU1rZGlyKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGZzLm1rZGlyU3luYyhwYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIElnbm9yZSB0aGUgZXJyb3IsIGlmIHRoZSBwYXRoIGFscmVhZHkgZXhpc3RzIGFuZCBwb2ludHMgdG8gYSBkaXJlY3RvcnkuXG4gICAgICAvLyBSZS10aHJvdyBvdGhlcndpc2UuXG4gICAgICBpZiAoIXRoaXMuZXhpc3RzKHBhdGgpIHx8ICF0aGlzLnN0YXQocGF0aCkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBjYXNlIG9mIGVhY2ggY2hhcmFjdGVyIGluIGEgc3RyaW5nLlxuICovXG5mdW5jdGlvbiB0b2dnbGVDYXNlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHcvZywgY2ggPT4gY2gudG9VcHBlckNhc2UoKSA9PT0gY2ggPyBjaC50b0xvd2VyQ2FzZSgpIDogY2gudG9VcHBlckNhc2UoKSk7XG59XG4iXX0=
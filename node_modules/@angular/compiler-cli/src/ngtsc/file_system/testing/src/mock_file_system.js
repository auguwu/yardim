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
        define("@angular/compiler-cli/src/ngtsc/file_system/testing/src/mock_file_system", ["require", "exports", "tslib", "@angular/compiler-cli/src/ngtsc/file_system/src/helpers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFolder = exports.isSymLink = exports.isFile = exports.SymLink = exports.MockFileSystem = void 0;
    var tslib_1 = require("tslib");
    var helpers_1 = require("@angular/compiler-cli/src/ngtsc/file_system/src/helpers");
    /**
     * An in-memory file system that can be used in unit tests.
     */
    var MockFileSystem = /** @class */ (function () {
        function MockFileSystem(_isCaseSensitive, cwd) {
            if (_isCaseSensitive === void 0) { _isCaseSensitive = false; }
            if (cwd === void 0) { cwd = '/'; }
            this._isCaseSensitive = _isCaseSensitive;
            this._fileTree = {};
            this._cwd = this.normalize(cwd);
        }
        MockFileSystem.prototype.isCaseSensitive = function () {
            return this._isCaseSensitive;
        };
        MockFileSystem.prototype.exists = function (path) {
            return this.findFromPath(path).entity !== null;
        };
        MockFileSystem.prototype.readFile = function (path) {
            var entity = this.findFromPath(path).entity;
            if (isFile(entity)) {
                return entity.toString();
            }
            else {
                throw new MockFileSystemError('ENOENT', path, "File \"" + path + "\" does not exist.");
            }
        };
        MockFileSystem.prototype.readFileBuffer = function (path) {
            var entity = this.findFromPath(path).entity;
            if (isFile(entity)) {
                return entity instanceof Uint8Array ? entity : new Buffer(entity);
            }
            else {
                throw new MockFileSystemError('ENOENT', path, "File \"" + path + "\" does not exist.");
            }
        };
        MockFileSystem.prototype.writeFile = function (path, data, exclusive) {
            if (exclusive === void 0) { exclusive = false; }
            var _a = tslib_1.__read(this.splitIntoFolderAndFile(path), 2), folderPath = _a[0], basename = _a[1];
            var entity = this.findFromPath(folderPath).entity;
            if (entity === null || !isFolder(entity)) {
                throw new MockFileSystemError('ENOENT', path, "Unable to write file \"" + path + "\". The containing folder does not exist.");
            }
            if (exclusive && entity[basename] !== undefined) {
                throw new MockFileSystemError('EEXIST', path, "Unable to exclusively write file \"" + path + "\". The file already exists.");
            }
            entity[basename] = data;
        };
        MockFileSystem.prototype.removeFile = function (path) {
            var _a = tslib_1.__read(this.splitIntoFolderAndFile(path), 2), folderPath = _a[0], basename = _a[1];
            var entity = this.findFromPath(folderPath).entity;
            if (entity === null || !isFolder(entity)) {
                throw new MockFileSystemError('ENOENT', path, "Unable to remove file \"" + path + "\". The containing folder does not exist.");
            }
            if (isFolder(entity[basename])) {
                throw new MockFileSystemError('EISDIR', path, "Unable to remove file \"" + path + "\". The path to remove is a folder.");
            }
            delete entity[basename];
        };
        MockFileSystem.prototype.symlink = function (target, path) {
            var _a = tslib_1.__read(this.splitIntoFolderAndFile(path), 2), folderPath = _a[0], basename = _a[1];
            var entity = this.findFromPath(folderPath).entity;
            if (entity === null || !isFolder(entity)) {
                throw new MockFileSystemError('ENOENT', path, "Unable to create symlink at \"" + path + "\". The containing folder does not exist.");
            }
            entity[basename] = new SymLink(target);
        };
        MockFileSystem.prototype.readdir = function (path) {
            var entity = this.findFromPath(path).entity;
            if (entity === null) {
                throw new MockFileSystemError('ENOENT', path, "Unable to read directory \"" + path + "\". It does not exist.");
            }
            if (isFile(entity)) {
                throw new MockFileSystemError('ENOTDIR', path, "Unable to read directory \"" + path + "\". It is a file.");
            }
            return Object.keys(entity);
        };
        MockFileSystem.prototype.lstat = function (path) {
            var entity = this.findFromPath(path).entity;
            if (entity === null) {
                throw new MockFileSystemError('ENOENT', path, "File \"" + path + "\" does not exist.");
            }
            return new MockFileStats(entity);
        };
        MockFileSystem.prototype.stat = function (path) {
            var entity = this.findFromPath(path, { followSymLinks: true }).entity;
            if (entity === null) {
                throw new MockFileSystemError('ENOENT', path, "File \"" + path + "\" does not exist.");
            }
            return new MockFileStats(entity);
        };
        MockFileSystem.prototype.copyFile = function (from, to) {
            this.writeFile(to, this.readFile(from));
        };
        MockFileSystem.prototype.moveFile = function (from, to) {
            this.writeFile(to, this.readFile(from));
            var result = this.findFromPath(helpers_1.dirname(from));
            var folder = result.entity;
            var name = helpers_1.basename(from);
            delete folder[name];
        };
        MockFileSystem.prototype.ensureDir = function (path) {
            var e_1, _a;
            var _this = this;
            var segments = this.splitPath(path).map(function (segment) { return _this.getCanonicalPath(segment); });
            // Convert the root folder to a canonical empty string `''` (on Windows it would be `'C:'`).
            segments[0] = '';
            if (segments.length > 1 && segments[segments.length - 1] === '') {
                // Remove a trailing slash (unless the path was only `/`)
                segments.pop();
            }
            var current = this._fileTree;
            try {
                for (var segments_1 = tslib_1.__values(segments), segments_1_1 = segments_1.next(); !segments_1_1.done; segments_1_1 = segments_1.next()) {
                    var segment = segments_1_1.value;
                    if (isFile(current[segment])) {
                        throw new Error("Folder already exists as a file.");
                    }
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    current = current[segment];
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (segments_1_1 && !segments_1_1.done && (_a = segments_1.return)) _a.call(segments_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return current;
        };
        MockFileSystem.prototype.removeDeep = function (path) {
            var _a = tslib_1.__read(this.splitIntoFolderAndFile(path), 2), folderPath = _a[0], basename = _a[1];
            var entity = this.findFromPath(folderPath).entity;
            if (entity === null || !isFolder(entity)) {
                throw new MockFileSystemError('ENOENT', path, "Unable to remove folder \"" + path + "\". The containing folder does not exist.");
            }
            delete entity[basename];
        };
        MockFileSystem.prototype.isRoot = function (path) {
            return this.dirname(path) === path;
        };
        MockFileSystem.prototype.extname = function (path) {
            var match = /.+(\.[^.]*)$/.exec(path);
            return match !== null ? match[1] : '';
        };
        MockFileSystem.prototype.realpath = function (filePath) {
            var result = this.findFromPath(filePath, { followSymLinks: true });
            if (result.entity === null) {
                throw new MockFileSystemError('ENOENT', filePath, "Unable to find the real path of \"" + filePath + "\". It does not exist.");
            }
            else {
                return result.path;
            }
        };
        MockFileSystem.prototype.pwd = function () {
            return this._cwd;
        };
        MockFileSystem.prototype.chdir = function (path) {
            this._cwd = this.normalize(path);
        };
        MockFileSystem.prototype.getDefaultLibLocation = function () {
            // Mimic the node module resolution algorithm and start in the current directory, then look
            // progressively further up the tree until reaching the FS root.
            // E.g. if the current directory is /foo/bar, look in /foo/bar/node_modules, then
            // /foo/node_modules, then /node_modules.
            var path = 'node_modules/typescript/lib';
            var resolvedPath = this.resolve(path);
            // Construct a path for the top-level node_modules to identify the stopping point.
            var topLevelNodeModules = this.resolve('/' + path);
            while (resolvedPath !== topLevelNodeModules) {
                if (this.exists(resolvedPath)) {
                    return resolvedPath;
                }
                // Not here, look one level higher.
                path = '../' + path;
                resolvedPath = this.resolve(path);
            }
            // The loop exits before checking the existence of /node_modules/typescript at the top level.
            // This is intentional - if no /node_modules/typescript exists anywhere in the tree, there's
            // nothing this function can do about it, and TS may error later if it looks for a lib.d.ts file
            // within this directory. It might be okay, though, if TS never checks for one.
            return topLevelNodeModules;
        };
        MockFileSystem.prototype.dump = function () {
            var entity = this.findFromPath(this.resolve('/')).entity;
            if (entity === null || !isFolder(entity)) {
                return {};
            }
            return this.cloneFolder(entity);
        };
        MockFileSystem.prototype.init = function (folder) {
            this.mount(this.resolve('/'), folder);
        };
        MockFileSystem.prototype.mount = function (path, folder) {
            if (this.exists(path)) {
                throw new Error("Unable to mount in '" + path + "' as it already exists.");
            }
            var mountFolder = this.ensureDir(path);
            this.copyInto(folder, mountFolder);
        };
        MockFileSystem.prototype.cloneFolder = function (folder) {
            var clone = {};
            this.copyInto(folder, clone);
            return clone;
        };
        MockFileSystem.prototype.copyInto = function (from, to) {
            for (var path in from) {
                var item = from[path];
                var canonicalPath = this.getCanonicalPath(path);
                if (isSymLink(item)) {
                    to[canonicalPath] = new SymLink(this.getCanonicalPath(item.path));
                }
                else if (isFolder(item)) {
                    to[canonicalPath] = this.cloneFolder(item);
                }
                else {
                    to[canonicalPath] = from[path];
                }
            }
        };
        MockFileSystem.prototype.findFromPath = function (path, options) {
            var followSymLinks = !!options && options.followSymLinks;
            var segments = this.splitPath(path);
            if (segments.length > 1 && segments[segments.length - 1] === '') {
                // Remove a trailing slash (unless the path was only `/`)
                segments.pop();
            }
            // Convert the root folder to a canonical empty string `""` (on Windows it would be `C:`).
            segments[0] = '';
            var current = this._fileTree;
            while (segments.length) {
                current = current[this.getCanonicalPath(segments.shift())];
                if (current === undefined) {
                    return { path: path, entity: null };
                }
                if (segments.length > 0 && (!isFolder(current))) {
                    current = null;
                    break;
                }
                if (isFile(current)) {
                    break;
                }
                if (isSymLink(current)) {
                    if (followSymLinks) {
                        return this.findFromPath(helpers_1.resolve.apply(void 0, tslib_1.__spread([current.path], segments)), { followSymLinks: followSymLinks });
                    }
                    else {
                        break;
                    }
                }
            }
            return { path: path, entity: current };
        };
        MockFileSystem.prototype.splitIntoFolderAndFile = function (path) {
            var segments = this.splitPath(this.getCanonicalPath(path));
            var file = segments.pop();
            return [path.substring(0, path.length - file.length - 1), file];
        };
        MockFileSystem.prototype.getCanonicalPath = function (p) {
            return this.isCaseSensitive() ? p : p.toLowerCase();
        };
        return MockFileSystem;
    }());
    exports.MockFileSystem = MockFileSystem;
    var SymLink = /** @class */ (function () {
        function SymLink(path) {
            this.path = path;
        }
        return SymLink;
    }());
    exports.SymLink = SymLink;
    var MockFileStats = /** @class */ (function () {
        function MockFileStats(entity) {
            this.entity = entity;
        }
        MockFileStats.prototype.isFile = function () {
            return isFile(this.entity);
        };
        MockFileStats.prototype.isDirectory = function () {
            return isFolder(this.entity);
        };
        MockFileStats.prototype.isSymbolicLink = function () {
            return isSymLink(this.entity);
        };
        return MockFileStats;
    }());
    var MockFileSystemError = /** @class */ (function (_super) {
        tslib_1.__extends(MockFileSystemError, _super);
        function MockFileSystemError(code, path, message) {
            var _this = _super.call(this, message) || this;
            _this.code = code;
            _this.path = path;
            return _this;
        }
        return MockFileSystemError;
    }(Error));
    function isFile(item) {
        return Buffer.isBuffer(item) || typeof item === 'string';
    }
    exports.isFile = isFile;
    function isSymLink(item) {
        return item instanceof SymLink;
    }
    exports.isSymLink = isSymLink;
    function isFolder(item) {
        return item !== null && !isFile(item) && !isSymLink(item);
    }
    exports.isFolder = isFolder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19maWxlX3N5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvZmlsZV9zeXN0ZW0vdGVzdGluZy9zcmMvbW9ja19maWxlX3N5c3RlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsbUZBQTZEO0lBRzdEOztPQUVHO0lBQ0g7UUFLRSx3QkFBb0IsZ0JBQXdCLEVBQUUsR0FBMkM7WUFBckUsaUNBQUEsRUFBQSx3QkFBd0I7WUFBRSxvQkFBQSxFQUFBLE1BQXNCLEdBQXFCO1lBQXJFLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUTtZQUpwQyxjQUFTLEdBQVcsRUFBRSxDQUFDO1lBSzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsd0NBQWUsR0FBZjtZQUNFLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQy9CLENBQUM7UUFFRCwrQkFBTSxHQUFOLFVBQU8sSUFBb0I7WUFDekIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUM7UUFDakQsQ0FBQztRQUVELGlDQUFRLEdBQVIsVUFBUyxJQUFvQjtZQUNwQixJQUFBLE1BQU0sR0FBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUEzQixDQUE0QjtZQUN6QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbEIsT0FBTyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDMUI7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBUyxJQUFJLHVCQUFtQixDQUFDLENBQUM7YUFDakY7UUFDSCxDQUFDO1FB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QUssR0FJdEM7SUFFRCxTQUFnQixNQUFNLENBQUMsSUFBaUI7UUFDdEMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQztJQUMzRCxDQUFDO0lBRkQsd0JBRUM7SUFFRCxTQUFnQixTQUFTLENBQUMsSUFBaUI7UUFDekMsT0FBTyxJQUFJLFlBQVksT0FBTyxDQUFDO0lBQ2pDLENBQUM7SUFGRCw4QkFFQztJQUVELFNBQWdCLFFBQVEsQ0FBQyxJQUFpQjtRQUN4QyxPQUFPLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUZELDRCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YmFzZW5hbWUsIGRpcm5hbWUsIHJlc29sdmV9IGZyb20gJy4uLy4uL3NyYy9oZWxwZXJzJztcbmltcG9ydCB7QWJzb2x1dGVGc1BhdGgsIEZpbGVTdGF0cywgRmlsZVN5c3RlbSwgUGF0aFNlZ21lbnQsIFBhdGhTdHJpbmd9IGZyb20gJy4uLy4uL3NyYy90eXBlcyc7XG5cbi8qKlxuICogQW4gaW4tbWVtb3J5IGZpbGUgc3lzdGVtIHRoYXQgY2FuIGJlIHVzZWQgaW4gdW5pdCB0ZXN0cy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE1vY2tGaWxlU3lzdGVtIGltcGxlbWVudHMgRmlsZVN5c3RlbSB7XG4gIHByaXZhdGUgX2ZpbGVUcmVlOiBGb2xkZXIgPSB7fTtcbiAgcHJpdmF0ZSBfY3dkOiBBYnNvbHV0ZUZzUGF0aDtcblxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2lzQ2FzZVNlbnNpdGl2ZSA9IGZhbHNlLCBjd2Q6IEFic29sdXRlRnNQYXRoID0gJy8nIGFzIEFic29sdXRlRnNQYXRoKSB7XG4gICAgdGhpcy5fY3dkID0gdGhpcy5ub3JtYWxpemUoY3dkKTtcbiAgfVxuXG4gIGlzQ2FzZVNlbnNpdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNDYXNlU2Vuc2l0aXZlO1xuICB9XG5cbiAgZXhpc3RzKHBhdGg6IEFic29sdXRlRnNQYXRoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZmluZEZyb21QYXRoKHBhdGgpLmVudGl0eSAhPT0gbnVsbDtcbiAgfVxuXG4gIHJlYWRGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoKTogc3RyaW5nIHtcbiAgICBjb25zdCB7ZW50aXR5fSA9IHRoaXMuZmluZEZyb21QYXRoKHBhdGgpO1xuICAgIGlmIChpc0ZpbGUoZW50aXR5KSkge1xuICAgICAgcmV0dXJuIGVudGl0eS50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcignRU5PRU5UJywgcGF0aCwgYEZpbGUgXCIke3BhdGh9XCIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICB9XG5cbiAgcmVhZEZpbGVCdWZmZXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCB7ZW50aXR5fSA9IHRoaXMuZmluZEZyb21QYXRoKHBhdGgpO1xuICAgIGlmIChpc0ZpbGUoZW50aXR5KSkge1xuICAgICAgcmV0dXJuIGVudGl0eSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgPyBlbnRpdHkgOiBuZXcgQnVmZmVyKGVudGl0eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb2NrRmlsZVN5c3RlbUVycm9yKCdFTk9FTlQnLCBwYXRoLCBgRmlsZSBcIiR7cGF0aH1cIiBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9XG4gIH1cblxuICB3cml0ZUZpbGUocGF0aDogQWJzb2x1dGVGc1BhdGgsIGRhdGE6IHN0cmluZ3xVaW50OEFycmF5LCBleGNsdXNpdmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xuICAgIGNvbnN0IFtmb2xkZXJQYXRoLCBiYXNlbmFtZV0gPSB0aGlzLnNwbGl0SW50b0ZvbGRlckFuZEZpbGUocGF0aCk7XG4gICAgY29uc3Qge2VudGl0eX0gPSB0aGlzLmZpbmRGcm9tUGF0aChmb2xkZXJQYXRoKTtcbiAgICBpZiAoZW50aXR5ID09PSBudWxsIHx8ICFpc0ZvbGRlcihlbnRpdHkpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcihcbiAgICAgICAgICAnRU5PRU5UJywgcGF0aCwgYFVuYWJsZSB0byB3cml0ZSBmaWxlIFwiJHtwYXRofVwiLiBUaGUgY29udGFpbmluZyBmb2xkZXIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIGlmIChleGNsdXNpdmUgJiYgZW50aXR5W2Jhc2VuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcihcbiAgICAgICAgICAnRUVYSVNUJywgcGF0aCwgYFVuYWJsZSB0byBleGNsdXNpdmVseSB3cml0ZSBmaWxlIFwiJHtwYXRofVwiLiBUaGUgZmlsZSBhbHJlYWR5IGV4aXN0cy5gKTtcbiAgICB9XG4gICAgZW50aXR5W2Jhc2VuYW1lXSA9IGRhdGE7XG4gIH1cblxuICByZW1vdmVGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgY29uc3QgW2ZvbGRlclBhdGgsIGJhc2VuYW1lXSA9IHRoaXMuc3BsaXRJbnRvRm9sZGVyQW5kRmlsZShwYXRoKTtcbiAgICBjb25zdCB7ZW50aXR5fSA9IHRoaXMuZmluZEZyb21QYXRoKGZvbGRlclBhdGgpO1xuICAgIGlmIChlbnRpdHkgPT09IG51bGwgfHwgIWlzRm9sZGVyKGVudGl0eSkpIHtcbiAgICAgIHRocm93IG5ldyBNb2NrRmlsZVN5c3RlbUVycm9yKFxuICAgICAgICAgICdFTk9FTlQnLCBwYXRoLCBgVW5hYmxlIHRvIHJlbW92ZSBmaWxlIFwiJHtwYXRofVwiLiBUaGUgY29udGFpbmluZyBmb2xkZXIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIGlmIChpc0ZvbGRlcihlbnRpdHlbYmFzZW5hbWVdKSkge1xuICAgICAgdGhyb3cgbmV3IE1vY2tGaWxlU3lzdGVtRXJyb3IoXG4gICAgICAgICAgJ0VJU0RJUicsIHBhdGgsIGBVbmFibGUgdG8gcmVtb3ZlIGZpbGUgXCIke3BhdGh9XCIuIFRoZSBwYXRoIHRvIHJlbW92ZSBpcyBhIGZvbGRlci5gKTtcbiAgICB9XG4gICAgZGVsZXRlIGVudGl0eVtiYXNlbmFtZV07XG4gIH1cblxuICBzeW1saW5rKHRhcmdldDogQWJzb2x1dGVGc1BhdGgsIHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgY29uc3QgW2ZvbGRlclBhdGgsIGJhc2VuYW1lXSA9IHRoaXMuc3BsaXRJbnRvRm9sZGVyQW5kRmlsZShwYXRoKTtcbiAgICBjb25zdCB7ZW50aXR5fSA9IHRoaXMuZmluZEZyb21QYXRoKGZvbGRlclBhdGgpO1xuICAgIGlmIChlbnRpdHkgPT09IG51bGwgfHwgIWlzRm9sZGVyKGVudGl0eSkpIHtcbiAgICAgIHRocm93IG5ldyBNb2NrRmlsZVN5c3RlbUVycm9yKFxuICAgICAgICAgICdFTk9FTlQnLCBwYXRoLFxuICAgICAgICAgIGBVbmFibGUgdG8gY3JlYXRlIHN5bWxpbmsgYXQgXCIke3BhdGh9XCIuIFRoZSBjb250YWluaW5nIGZvbGRlciBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9XG4gICAgZW50aXR5W2Jhc2VuYW1lXSA9IG5ldyBTeW1MaW5rKHRhcmdldCk7XG4gIH1cblxuICByZWFkZGlyKHBhdGg6IEFic29sdXRlRnNQYXRoKTogUGF0aFNlZ21lbnRbXSB7XG4gICAgY29uc3Qge2VudGl0eX0gPSB0aGlzLmZpbmRGcm9tUGF0aChwYXRoKTtcbiAgICBpZiAoZW50aXR5ID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcihcbiAgICAgICAgICAnRU5PRU5UJywgcGF0aCwgYFVuYWJsZSB0byByZWFkIGRpcmVjdG9yeSBcIiR7cGF0aH1cIi4gSXQgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIGlmIChpc0ZpbGUoZW50aXR5KSkge1xuICAgICAgdGhyb3cgbmV3IE1vY2tGaWxlU3lzdGVtRXJyb3IoXG4gICAgICAgICAgJ0VOT1RESVInLCBwYXRoLCBgVW5hYmxlIHRvIHJlYWQgZGlyZWN0b3J5IFwiJHtwYXRofVwiLiBJdCBpcyBhIGZpbGUuYCk7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhlbnRpdHkpIGFzIFBhdGhTZWdtZW50W107XG4gIH1cblxuICBsc3RhdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IEZpbGVTdGF0cyB7XG4gICAgY29uc3Qge2VudGl0eX0gPSB0aGlzLmZpbmRGcm9tUGF0aChwYXRoKTtcbiAgICBpZiAoZW50aXR5ID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcignRU5PRU5UJywgcGF0aCwgYEZpbGUgXCIke3BhdGh9XCIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTW9ja0ZpbGVTdGF0cyhlbnRpdHkpO1xuICB9XG5cbiAgc3RhdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IEZpbGVTdGF0cyB7XG4gICAgY29uc3Qge2VudGl0eX0gPSB0aGlzLmZpbmRGcm9tUGF0aChwYXRoLCB7Zm9sbG93U3ltTGlua3M6IHRydWV9KTtcbiAgICBpZiAoZW50aXR5ID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgTW9ja0ZpbGVTeXN0ZW1FcnJvcignRU5PRU5UJywgcGF0aCwgYEZpbGUgXCIke3BhdGh9XCIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTW9ja0ZpbGVTdGF0cyhlbnRpdHkpO1xuICB9XG5cbiAgY29weUZpbGUoZnJvbTogQWJzb2x1dGVGc1BhdGgsIHRvOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIHRoaXMud3JpdGVGaWxlKHRvLCB0aGlzLnJlYWRGaWxlKGZyb20pKTtcbiAgfVxuXG4gIG1vdmVGaWxlKGZyb206IEFic29sdXRlRnNQYXRoLCB0bzogQWJzb2x1dGVGc1BhdGgpOiB2b2lkIHtcbiAgICB0aGlzLndyaXRlRmlsZSh0bywgdGhpcy5yZWFkRmlsZShmcm9tKSk7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5maW5kRnJvbVBhdGgoZGlybmFtZShmcm9tKSk7XG4gICAgY29uc3QgZm9sZGVyID0gcmVzdWx0LmVudGl0eSBhcyBGb2xkZXI7XG4gICAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGZyb20pO1xuICAgIGRlbGV0ZSBmb2xkZXJbbmFtZV07XG4gIH1cblxuICBlbnN1cmVEaXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBGb2xkZXIge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gdGhpcy5zcGxpdFBhdGgocGF0aCkubWFwKHNlZ21lbnQgPT4gdGhpcy5nZXRDYW5vbmljYWxQYXRoKHNlZ21lbnQpKTtcblxuICAgIC8vIENvbnZlcnQgdGhlIHJvb3QgZm9sZGVyIHRvIGEgY2Fub25pY2FsIGVtcHR5IHN0cmluZyBgJydgIChvbiBXaW5kb3dzIGl0IHdvdWxkIGJlIGAnQzonYCkuXG4gICAgc2VnbWVudHNbMF0gPSAnJztcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID4gMSAmJiBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gJycpIHtcbiAgICAgIC8vIFJlbW92ZSBhIHRyYWlsaW5nIHNsYXNoICh1bmxlc3MgdGhlIHBhdGggd2FzIG9ubHkgYC9gKVxuICAgICAgc2VnbWVudHMucG9wKCk7XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnQ6IEZvbGRlciA9IHRoaXMuX2ZpbGVUcmVlO1xuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgICAgaWYgKGlzRmlsZShjdXJyZW50W3NlZ21lbnRdKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZvbGRlciBhbHJlYWR5IGV4aXN0cyBhcyBhIGZpbGUuYCk7XG4gICAgICB9XG4gICAgICBpZiAoIWN1cnJlbnRbc2VnbWVudF0pIHtcbiAgICAgICAgY3VycmVudFtzZWdtZW50XSA9IHt9O1xuICAgICAgfVxuICAgICAgY3VycmVudCA9IGN1cnJlbnRbc2VnbWVudF0gYXMgRm9sZGVyO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbiAgfVxuXG4gIHJlbW92ZURlZXAocGF0aDogQWJzb2x1dGVGc1BhdGgpOiB2b2lkIHtcbiAgICBjb25zdCBbZm9sZGVyUGF0aCwgYmFzZW5hbWVdID0gdGhpcy5zcGxpdEludG9Gb2xkZXJBbmRGaWxlKHBhdGgpO1xuICAgIGNvbnN0IHtlbnRpdHl9ID0gdGhpcy5maW5kRnJvbVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgaWYgKGVudGl0eSA9PT0gbnVsbCB8fCAhaXNGb2xkZXIoZW50aXR5KSkge1xuICAgICAgdGhyb3cgbmV3IE1vY2tGaWxlU3lzdGVtRXJyb3IoXG4gICAgICAgICAgJ0VOT0VOVCcsIHBhdGgsXG4gICAgICAgICAgYFVuYWJsZSB0byByZW1vdmUgZm9sZGVyIFwiJHtwYXRofVwiLiBUaGUgY29udGFpbmluZyBmb2xkZXIgZG9lcyBub3QgZXhpc3QuYCk7XG4gICAgfVxuICAgIGRlbGV0ZSBlbnRpdHlbYmFzZW5hbWVdO1xuICB9XG5cbiAgaXNSb290KHBhdGg6IEFic29sdXRlRnNQYXRoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZGlybmFtZShwYXRoKSA9PT0gcGF0aDtcbiAgfVxuXG4gIGV4dG5hbWUocGF0aDogQWJzb2x1dGVGc1BhdGh8UGF0aFNlZ21lbnQpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1hdGNoID0gLy4rKFxcLlteLl0qKSQvLmV4ZWMocGF0aCk7XG4gICAgcmV0dXJuIG1hdGNoICE9PSBudWxsID8gbWF0Y2hbMV0gOiAnJztcbiAgfVxuXG4gIHJlYWxwYXRoKGZpbGVQYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IEFic29sdXRlRnNQYXRoIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmZpbmRGcm9tUGF0aChmaWxlUGF0aCwge2ZvbGxvd1N5bUxpbmtzOiB0cnVlfSk7XG4gICAgaWYgKHJlc3VsdC5lbnRpdHkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBNb2NrRmlsZVN5c3RlbUVycm9yKFxuICAgICAgICAgICdFTk9FTlQnLCBmaWxlUGF0aCwgYFVuYWJsZSB0byBmaW5kIHRoZSByZWFsIHBhdGggb2YgXCIke2ZpbGVQYXRofVwiLiBJdCBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3VsdC5wYXRoO1xuICAgIH1cbiAgfVxuXG4gIHB3ZCgpOiBBYnNvbHV0ZUZzUGF0aCB7XG4gICAgcmV0dXJuIHRoaXMuX2N3ZDtcbiAgfVxuXG4gIGNoZGlyKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgdGhpcy5fY3dkID0gdGhpcy5ub3JtYWxpemUocGF0aCk7XG4gIH1cblxuICBnZXREZWZhdWx0TGliTG9jYXRpb24oKTogQWJzb2x1dGVGc1BhdGgge1xuICAgIC8vIE1pbWljIHRoZSBub2RlIG1vZHVsZSByZXNvbHV0aW9uIGFsZ29yaXRobSBhbmQgc3RhcnQgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5LCB0aGVuIGxvb2tcbiAgICAvLyBwcm9ncmVzc2l2ZWx5IGZ1cnRoZXIgdXAgdGhlIHRyZWUgdW50aWwgcmVhY2hpbmcgdGhlIEZTIHJvb3QuXG4gICAgLy8gRS5nLiBpZiB0aGUgY3VycmVudCBkaXJlY3RvcnkgaXMgL2Zvby9iYXIsIGxvb2sgaW4gL2Zvby9iYXIvbm9kZV9tb2R1bGVzLCB0aGVuXG4gICAgLy8gL2Zvby9ub2RlX21vZHVsZXMsIHRoZW4gL25vZGVfbW9kdWxlcy5cblxuICAgIGxldCBwYXRoID0gJ25vZGVfbW9kdWxlcy90eXBlc2NyaXB0L2xpYic7XG4gICAgbGV0IHJlc29sdmVkUGF0aCA9IHRoaXMucmVzb2x2ZShwYXRoKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIHBhdGggZm9yIHRoZSB0b3AtbGV2ZWwgbm9kZV9tb2R1bGVzIHRvIGlkZW50aWZ5IHRoZSBzdG9wcGluZyBwb2ludC5cbiAgICBjb25zdCB0b3BMZXZlbE5vZGVNb2R1bGVzID0gdGhpcy5yZXNvbHZlKCcvJyArIHBhdGgpO1xuXG4gICAgd2hpbGUgKHJlc29sdmVkUGF0aCAhPT0gdG9wTGV2ZWxOb2RlTW9kdWxlcykge1xuICAgICAgaWYgKHRoaXMuZXhpc3RzKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgICAgIH1cblxuICAgICAgLy8gTm90IGhlcmUsIGxvb2sgb25lIGxldmVsIGhpZ2hlci5cbiAgICAgIHBhdGggPSAnLi4vJyArIHBhdGg7XG4gICAgICByZXNvbHZlZFBhdGggPSB0aGlzLnJlc29sdmUocGF0aCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGxvb3AgZXhpdHMgYmVmb3JlIGNoZWNraW5nIHRoZSBleGlzdGVuY2Ugb2YgL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0IGF0IHRoZSB0b3AgbGV2ZWwuXG4gICAgLy8gVGhpcyBpcyBpbnRlbnRpb25hbCAtIGlmIG5vIC9ub2RlX21vZHVsZXMvdHlwZXNjcmlwdCBleGlzdHMgYW55d2hlcmUgaW4gdGhlIHRyZWUsIHRoZXJlJ3NcbiAgICAvLyBub3RoaW5nIHRoaXMgZnVuY3Rpb24gY2FuIGRvIGFib3V0IGl0LCBhbmQgVFMgbWF5IGVycm9yIGxhdGVyIGlmIGl0IGxvb2tzIGZvciBhIGxpYi5kLnRzIGZpbGVcbiAgICAvLyB3aXRoaW4gdGhpcyBkaXJlY3RvcnkuIEl0IG1pZ2h0IGJlIG9rYXksIHRob3VnaCwgaWYgVFMgbmV2ZXIgY2hlY2tzIGZvciBvbmUuXG4gICAgcmV0dXJuIHRvcExldmVsTm9kZU1vZHVsZXM7XG4gIH1cblxuICBhYnN0cmFjdCByZXNvbHZlKC4uLnBhdGhzOiBzdHJpbmdbXSk6IEFic29sdXRlRnNQYXRoO1xuICBhYnN0cmFjdCBkaXJuYW1lPFQgZXh0ZW5kcyBzdHJpbmc+KGZpbGU6IFQpOiBUO1xuICBhYnN0cmFjdCBqb2luPFQgZXh0ZW5kcyBzdHJpbmc+KGJhc2VQYXRoOiBULCAuLi5wYXRoczogc3RyaW5nW10pOiBUO1xuICBhYnN0cmFjdCByZWxhdGl2ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4oZnJvbTogVCwgdG86IFQpOiBQYXRoU2VnbWVudHxBYnNvbHV0ZUZzUGF0aDtcbiAgYWJzdHJhY3QgYmFzZW5hbWUoZmlsZVBhdGg6IHN0cmluZywgZXh0ZW5zaW9uPzogc3RyaW5nKTogUGF0aFNlZ21lbnQ7XG4gIGFic3RyYWN0IGlzUm9vdGVkKHBhdGg6IHN0cmluZyk6IGJvb2xlYW47XG4gIGFic3RyYWN0IG5vcm1hbGl6ZTxUIGV4dGVuZHMgUGF0aFN0cmluZz4ocGF0aDogVCk6IFQ7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBzcGxpdFBhdGg8VCBleHRlbmRzIFBhdGhTdHJpbmc+KHBhdGg6IFQpOiBzdHJpbmdbXTtcblxuICBkdW1wKCk6IEZvbGRlciB7XG4gICAgY29uc3Qge2VudGl0eX0gPSB0aGlzLmZpbmRGcm9tUGF0aCh0aGlzLnJlc29sdmUoJy8nKSk7XG4gICAgaWYgKGVudGl0eSA9PT0gbnVsbCB8fCAhaXNGb2xkZXIoZW50aXR5KSkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNsb25lRm9sZGVyKGVudGl0eSk7XG4gIH1cblxuICBpbml0KGZvbGRlcjogRm9sZGVyKTogdm9pZCB7XG4gICAgdGhpcy5tb3VudCh0aGlzLnJlc29sdmUoJy8nKSwgZm9sZGVyKTtcbiAgfVxuXG4gIG1vdW50KHBhdGg6IEFic29sdXRlRnNQYXRoLCBmb2xkZXI6IEZvbGRlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLmV4aXN0cyhwYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gbW91bnQgaW4gJyR7cGF0aH0nIGFzIGl0IGFscmVhZHkgZXhpc3RzLmApO1xuICAgIH1cbiAgICBjb25zdCBtb3VudEZvbGRlciA9IHRoaXMuZW5zdXJlRGlyKHBhdGgpO1xuXG4gICAgdGhpcy5jb3B5SW50byhmb2xkZXIsIG1vdW50Rm9sZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xvbmVGb2xkZXIoZm9sZGVyOiBGb2xkZXIpOiBGb2xkZXIge1xuICAgIGNvbnN0IGNsb25lOiBGb2xkZXIgPSB7fTtcbiAgICB0aGlzLmNvcHlJbnRvKGZvbGRlciwgY2xvbmUpO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIHByaXZhdGUgY29weUludG8oZnJvbTogRm9sZGVyLCB0bzogRm9sZGVyKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBwYXRoIGluIGZyb20pIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBmcm9tW3BhdGhdO1xuICAgICAgY29uc3QgY2Fub25pY2FsUGF0aCA9IHRoaXMuZ2V0Q2Fub25pY2FsUGF0aChwYXRoKTtcbiAgICAgIGlmIChpc1N5bUxpbmsoaXRlbSkpIHtcbiAgICAgICAgdG9bY2Fub25pY2FsUGF0aF0gPSBuZXcgU3ltTGluayh0aGlzLmdldENhbm9uaWNhbFBhdGgoaXRlbS5wYXRoKSk7XG4gICAgICB9IGVsc2UgaWYgKGlzRm9sZGVyKGl0ZW0pKSB7XG4gICAgICAgIHRvW2Nhbm9uaWNhbFBhdGhdID0gdGhpcy5jbG9uZUZvbGRlcihpdGVtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvW2Nhbm9uaWNhbFBhdGhdID0gZnJvbVtwYXRoXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIHByb3RlY3RlZCBmaW5kRnJvbVBhdGgocGF0aDogQWJzb2x1dGVGc1BhdGgsIG9wdGlvbnM/OiB7Zm9sbG93U3ltTGlua3M6IGJvb2xlYW59KTogRmluZFJlc3VsdCB7XG4gICAgY29uc3QgZm9sbG93U3ltTGlua3MgPSAhIW9wdGlvbnMgJiYgb3B0aW9ucy5mb2xsb3dTeW1MaW5rcztcbiAgICBjb25zdCBzZWdtZW50cyA9IHRoaXMuc3BsaXRQYXRoKHBhdGgpO1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPiAxICYmIHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID09PSAnJykge1xuICAgICAgLy8gUmVtb3ZlIGEgdHJhaWxpbmcgc2xhc2ggKHVubGVzcyB0aGUgcGF0aCB3YXMgb25seSBgL2ApXG4gICAgICBzZWdtZW50cy5wb3AoKTtcbiAgICB9XG4gICAgLy8gQ29udmVydCB0aGUgcm9vdCBmb2xkZXIgdG8gYSBjYW5vbmljYWwgZW1wdHkgc3RyaW5nIGBcIlwiYCAob24gV2luZG93cyBpdCB3b3VsZCBiZSBgQzpgKS5cbiAgICBzZWdtZW50c1swXSA9ICcnO1xuICAgIGxldCBjdXJyZW50OiBFbnRpdHl8bnVsbCA9IHRoaXMuX2ZpbGVUcmVlO1xuICAgIHdoaWxlIChzZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3RoaXMuZ2V0Q2Fub25pY2FsUGF0aChzZWdtZW50cy5zaGlmdCgpISldO1xuICAgICAgaWYgKGN1cnJlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4ge3BhdGgsIGVudGl0eTogbnVsbH07XG4gICAgICB9XG4gICAgICBpZiAoc2VnbWVudHMubGVuZ3RoID4gMCAmJiAoIWlzRm9sZGVyKGN1cnJlbnQpKSkge1xuICAgICAgICBjdXJyZW50ID0gbnVsbDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoaXNGaWxlKGN1cnJlbnQpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGlzU3ltTGluayhjdXJyZW50KSkge1xuICAgICAgICBpZiAoZm9sbG93U3ltTGlua3MpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5maW5kRnJvbVBhdGgocmVzb2x2ZShjdXJyZW50LnBhdGgsIC4uLnNlZ21lbnRzKSwge2ZvbGxvd1N5bUxpbmtzfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtwYXRoLCBlbnRpdHk6IGN1cnJlbnR9O1xuICB9XG5cbiAgcHJvdGVjdGVkIHNwbGl0SW50b0ZvbGRlckFuZEZpbGUocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBbQWJzb2x1dGVGc1BhdGgsIHN0cmluZ10ge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gdGhpcy5zcGxpdFBhdGgodGhpcy5nZXRDYW5vbmljYWxQYXRoKHBhdGgpKTtcbiAgICBjb25zdCBmaWxlID0gc2VnbWVudHMucG9wKCkhO1xuICAgIHJldHVybiBbcGF0aC5zdWJzdHJpbmcoMCwgcGF0aC5sZW5ndGggLSBmaWxlLmxlbmd0aCAtIDEpIGFzIEFic29sdXRlRnNQYXRoLCBmaWxlXTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRDYW5vbmljYWxQYXRoPFQgZXh0ZW5kcyBzdHJpbmc+KHA6IFQpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5pc0Nhc2VTZW5zaXRpdmUoKSA/IHAgOiBwLnRvTG93ZXJDYXNlKCkgYXMgVDtcbiAgfVxufVxuZXhwb3J0IGludGVyZmFjZSBGaW5kUmVzdWx0IHtcbiAgcGF0aDogQWJzb2x1dGVGc1BhdGg7XG4gIGVudGl0eTogRW50aXR5fG51bGw7XG59XG5leHBvcnQgdHlwZSBFbnRpdHkgPSBGb2xkZXJ8RmlsZXxTeW1MaW5rO1xuZXhwb3J0IGludGVyZmFjZSBGb2xkZXIge1xuICBbcGF0aFNlZ21lbnRzOiBzdHJpbmddOiBFbnRpdHk7XG59XG5leHBvcnQgdHlwZSBGaWxlID0gc3RyaW5nfFVpbnQ4QXJyYXk7XG5leHBvcnQgY2xhc3MgU3ltTGluayB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXRoOiBBYnNvbHV0ZUZzUGF0aCkge31cbn1cblxuY2xhc3MgTW9ja0ZpbGVTdGF0cyBpbXBsZW1lbnRzIEZpbGVTdGF0cyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZW50aXR5OiBFbnRpdHkpIHt9XG4gIGlzRmlsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNGaWxlKHRoaXMuZW50aXR5KTtcbiAgfVxuICBpc0RpcmVjdG9yeSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaXNGb2xkZXIodGhpcy5lbnRpdHkpO1xuICB9XG4gIGlzU3ltYm9saWNMaW5rKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc1N5bUxpbmsodGhpcy5lbnRpdHkpO1xuICB9XG59XG5cbmNsYXNzIE1vY2tGaWxlU3lzdGVtRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb2RlOiBzdHJpbmcsIHB1YmxpYyBwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZpbGUoaXRlbTogRW50aXR5fG51bGwpOiBpdGVtIGlzIEZpbGUge1xuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGl0ZW0pIHx8IHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3ltTGluayhpdGVtOiBFbnRpdHl8bnVsbCk6IGl0ZW0gaXMgU3ltTGluayB7XG4gIHJldHVybiBpdGVtIGluc3RhbmNlb2YgU3ltTGluaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRm9sZGVyKGl0ZW06IEVudGl0eXxudWxsKTogaXRlbSBpcyBGb2xkZXIge1xuICByZXR1cm4gaXRlbSAhPT0gbnVsbCAmJiAhaXNGaWxlKGl0ZW0pICYmICFpc1N5bUxpbmsoaXRlbSk7XG59XG4iXX0=
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/linker", ["require", "exports", "@angular/compiler-cli/linker/src/ast/utils", "@angular/compiler-cli/linker/src/fatal_linker_error", "@angular/compiler-cli/linker/src/file_linker/file_linker", "@angular/compiler-cli/linker/src/file_linker/linker_environment", "@angular/compiler-cli/linker/src/file_linker/needs_linking"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.needsLinking = exports.LinkerEnvironment = exports.FileLinker = exports.isFatalLinkerError = exports.FatalLinkerError = exports.assert = void 0;
    var utils_1 = require("@angular/compiler-cli/linker/src/ast/utils");
    Object.defineProperty(exports, "assert", { enumerable: true, get: function () { return utils_1.assert; } });
    var fatal_linker_error_1 = require("@angular/compiler-cli/linker/src/fatal_linker_error");
    Object.defineProperty(exports, "FatalLinkerError", { enumerable: true, get: function () { return fatal_linker_error_1.FatalLinkerError; } });
    Object.defineProperty(exports, "isFatalLinkerError", { enumerable: true, get: function () { return fatal_linker_error_1.isFatalLinkerError; } });
    var file_linker_1 = require("@angular/compiler-cli/linker/src/file_linker/file_linker");
    Object.defineProperty(exports, "FileLinker", { enumerable: true, get: function () { return file_linker_1.FileLinker; } });
    var linker_environment_1 = require("@angular/compiler-cli/linker/src/file_linker/linker_environment");
    Object.defineProperty(exports, "LinkerEnvironment", { enumerable: true, get: function () { return linker_environment_1.LinkerEnvironment; } });
    var needs_linking_1 = require("@angular/compiler-cli/linker/src/file_linker/needs_linking");
    Object.defineProperty(exports, "needsLinking", { enumerable: true, get: function () { return needs_linking_1.needsLinking; } });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbGlua2VyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQVFBLG9FQUF1QztJQUEvQiwrRkFBQSxNQUFNLE9BQUE7SUFDZCwwRkFBOEU7SUFBdEUsc0hBQUEsZ0JBQWdCLE9BQUE7SUFBRSx3SEFBQSxrQkFBa0IsT0FBQTtJQUU1Qyx3RkFBeUQ7SUFBakQseUdBQUEsVUFBVSxPQUFBO0lBQ2xCLHNHQUF1RTtJQUEvRCx1SEFBQSxpQkFBaUIsT0FBQTtJQUV6Qiw0RkFBNkQ7SUFBckQsNkdBQUEsWUFBWSxPQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5leHBvcnQge0FzdEhvc3QsIFJhbmdlfSBmcm9tICcuL3NyYy9hc3QvYXN0X2hvc3QnO1xuZXhwb3J0IHthc3NlcnR9IGZyb20gJy4vc3JjL2FzdC91dGlscyc7XG5leHBvcnQge0ZhdGFsTGlua2VyRXJyb3IsIGlzRmF0YWxMaW5rZXJFcnJvcn0gZnJvbSAnLi9zcmMvZmF0YWxfbGlua2VyX2Vycm9yJztcbmV4cG9ydCB7RGVjbGFyYXRpb25TY29wZX0gZnJvbSAnLi9zcmMvZmlsZV9saW5rZXIvZGVjbGFyYXRpb25fc2NvcGUnO1xuZXhwb3J0IHtGaWxlTGlua2VyfSBmcm9tICcuL3NyYy9maWxlX2xpbmtlci9maWxlX2xpbmtlcic7XG5leHBvcnQge0xpbmtlckVudmlyb25tZW50fSBmcm9tICcuL3NyYy9maWxlX2xpbmtlci9saW5rZXJfZW52aXJvbm1lbnQnO1xuZXhwb3J0IHtMaW5rZXJPcHRpb25zfSBmcm9tICcuL3NyYy9maWxlX2xpbmtlci9saW5rZXJfb3B0aW9ucyc7XG5leHBvcnQge25lZWRzTGlua2luZ30gZnJvbSAnLi9zcmMvZmlsZV9saW5rZXIvbmVlZHNfbGlua2luZyc7XG4iXX0=
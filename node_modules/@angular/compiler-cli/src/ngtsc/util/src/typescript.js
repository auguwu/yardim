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
        define("@angular/compiler-cli/src/ngtsc/util/src/typescript", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/file_system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAssignment = exports.resolveModuleName = exports.nodeDebugInfo = exports.getRootDirs = exports.isExported = exports.isTypeDeclaration = exports.isValueDeclaration = exports.isDeclaration = exports.identifierOfNode = exports.getTokenAtPosition = exports.getSourceFileOrNull = exports.getSourceFile = exports.nodeNameForError = exports.isFromDtsFile = exports.isNonDeclarationTsPath = exports.isDtsPath = void 0;
    var tslib_1 = require("tslib");
    var TS = /\.tsx?$/i;
    var D_TS = /\.d\.ts$/i;
    var ts = require("typescript");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    function isDtsPath(filePath) {
        return D_TS.test(filePath);
    }
    exports.isDtsPath = isDtsPath;
    function isNonDeclarationTsPath(filePath) {
        return TS.test(filePath) && !D_TS.test(filePath);
    }
    exports.isNonDeclarationTsPath = isNonDeclarationTsPath;
    function isFromDtsFile(node) {
        var sf = node.getSourceFile();
        if (sf === undefined) {
            sf = ts.getOriginalNode(node).getSourceFile();
        }
        return sf !== undefined && sf.isDeclarationFile;
    }
    exports.isFromDtsFile = isFromDtsFile;
    function nodeNameForError(node) {
        if (node.name !== undefined && ts.isIdentifier(node.name)) {
            return node.name.text;
        }
        else {
            var kind = ts.SyntaxKind[node.kind];
            var _a = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart()), line = _a.line, character = _a.character;
            return kind + "@" + line + ":" + character;
        }
    }
    exports.nodeNameForError = nodeNameForError;
    function getSourceFile(node) {
        // In certain transformation contexts, `ts.Node.getSourceFile()` can actually return `undefined`,
        // despite the type signature not allowing it. In that event, get the `ts.SourceFile` via the
        // original node instead (which works).
        var directSf = node.getSourceFile();
        return directSf !== undefined ? directSf : ts.getOriginalNode(node).getSourceFile();
    }
    exports.getSourceFile = getSourceFile;
    function getSourceFileOrNull(program, fileName) {
        return program.getSourceFile(fileName) || null;
    }
    exports.getSourceFileOrNull = getSourceFileOrNull;
    function getTokenAtPosition(sf, pos) {
        // getTokenAtPosition is part of TypeScript's private API.
        return ts.getTokenAtPosition(sf, pos);
    }
    exports.getTokenAtPosition = getTokenAtPosition;
    function identifierOfNode(decl) {
        if (decl.name !== undefined && ts.isIdentifier(decl.name)) {
            return decl.name;
        }
        else {
            return null;
        }
    }
    exports.identifierOfNode = identifierOfNode;
    function isDeclaration(node) {
        return isValueDeclaration(node) || isTypeDeclaration(node);
    }
    exports.isDeclaration = isDeclaration;
    function isValueDeclaration(node) {
        return ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) ||
            ts.isVariableDeclaration(node);
    }
    exports.isValueDeclaration = isValueDeclaration;
    function isTypeDeclaration(node) {
        return ts.isEnumDeclaration(node) || ts.isTypeAliasDeclaration(node) ||
            ts.isInterfaceDeclaration(node);
    }
    exports.isTypeDeclaration = isTypeDeclaration;
    function isExported(node) {
        var topLevel = node;
        if (ts.isVariableDeclaration(node) && ts.isVariableDeclarationList(node.parent)) {
            topLevel = node.parent.parent;
        }
        return topLevel.modifiers !== undefined &&
            topLevel.modifiers.some(function (modifier) { return modifier.kind === ts.SyntaxKind.ExportKeyword; });
    }
    exports.isExported = isExported;
    function getRootDirs(host, options) {
        var rootDirs = [];
        if (options.rootDirs !== undefined) {
            rootDirs.push.apply(rootDirs, tslib_1.__spread(options.rootDirs));
        }
        else if (options.rootDir !== undefined) {
            rootDirs.push(options.rootDir);
        }
        else {
            rootDirs.push(host.getCurrentDirectory());
        }
        // In Windows the above might not always return posix separated paths
        // See:
        // https://github.com/Microsoft/TypeScript/blob/3f7357d37f66c842d70d835bc925ec2a873ecfec/src/compiler/sys.ts#L650
        // Also compiler options might be set via an API which doesn't normalize paths
        return rootDirs.map(function (rootDir) { return file_system_1.absoluteFrom(host.getCanonicalFileName(rootDir)); });
    }
    exports.getRootDirs = getRootDirs;
    function nodeDebugInfo(node) {
        var sf = getSourceFile(node);
        var _a = ts.getLineAndCharacterOfPosition(sf, node.pos), line = _a.line, character = _a.character;
        return "[" + sf.fileName + ": " + ts.SyntaxKind[node.kind] + " @ " + line + ":" + character + "]";
    }
    exports.nodeDebugInfo = nodeDebugInfo;
    /**
     * Resolve the specified `moduleName` using the given `compilerOptions` and `compilerHost`.
     *
     * This helper will attempt to use the `CompilerHost.resolveModuleNames()` method if available.
     * Otherwise it will fallback on the `ts.ResolveModuleName()` function.
     */
    function resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache) {
        if (compilerHost.resolveModuleNames) {
            return compilerHost.resolveModuleNames([moduleName], containingFile, undefined, // reusedNames
            undefined, // redirectedReference
            compilerOptions)[0];
        }
        else {
            return ts
                .resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache !== null ? moduleResolutionCache : undefined)
                .resolvedModule;
        }
    }
    exports.resolveModuleName = resolveModuleName;
    /** Returns true if the node is an assignment expression. */
    function isAssignment(node) {
        return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }
    exports.isAssignment = isAssignment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvdXRpbC9zcmMvdHlwZXNjcmlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsSUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDO0lBQ3RCLElBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQztJQUV6QiwrQkFBaUM7SUFDakMsMkVBQStEO0lBRy9ELFNBQWdCLFNBQVMsQ0FBQyxRQUFnQjtRQUN4QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUZELDhCQUVDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQUMsUUFBZ0I7UUFDckQsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRkQsd0RBRUM7SUFFRCxTQUFnQixhQUFhLENBQUMsSUFBYTtRQUN6QyxJQUFJLEVBQUUsR0FBNEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3ZELElBQUksRUFBRSxLQUFLLFNBQVMsRUFBRTtZQUNwQixFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUMvQztRQUNELE9BQU8sRUFBRSxLQUFLLFNBQVMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUM7SUFDbEQsQ0FBQztJQU5ELHNDQU1DO0lBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBOEI7UUFDN0QsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN6RCxPQUFPLElBQUks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aUJBQWlCLENBQzdCLFVBQWtCLEVBQUUsY0FBc0IsRUFBRSxlQUFtQyxFQUMvRSxZQUFpRixFQUNqRixxQkFBb0Q7UUFDdEQsSUFBSSxZQUFZLENBQUMsa0JBQWtCLEVBQUU7WUFDbkMsT0FBTyxZQUFZLENBQUMsa0JBQWtCLENBQ2xDLENBQUMsVUFBVSxDQUFDLEVBQUUsY0FBYyxFQUM1QixTQUFTLEVBQUcsY0FBYztZQUMxQixTQUFTLEVBQUcsc0JBQXNCO1lBQ2xDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO2FBQU07WUFDTCxPQUFPLEVBQUU7aUJBQ0osaUJBQWlCLENBQ2QsVUFBVSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUN6RCxxQkFBcUIsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7aUJBQ3RFLGNBQWMsQ0FBQztTQUNyQjtJQUNILENBQUM7SUFqQkQsOENBaUJDO0lBRUQsNERBQTREO0lBQzVELFNBQWdCLFlBQVksQ0FBQyxJQUFhO1FBQ3hDLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO0lBQzlGLENBQUM7SUFGRCxvQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5jb25zdCBUUyA9IC9cXC50c3g/JC9pO1xuY29uc3QgRF9UUyA9IC9cXC5kXFwudHMkL2k7XG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aCwgYWJzb2x1dGVGcm9tfSBmcm9tICcuLi8uLi9maWxlX3N5c3RlbSc7XG5pbXBvcnQge0RlY2xhcmF0aW9uTm9kZX0gZnJvbSAnLi4vLi4vcmVmbGVjdGlvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0R0c1BhdGgoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gRF9UUy50ZXN0KGZpbGVQYXRoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9uRGVjbGFyYXRpb25Uc1BhdGgoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gVFMudGVzdChmaWxlUGF0aCkgJiYgIURfVFMudGVzdChmaWxlUGF0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Zyb21EdHNGaWxlKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgbGV0IHNmOiB0cy5Tb3VyY2VGaWxlfHVuZGVmaW5lZCA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICBpZiAoc2YgPT09IHVuZGVmaW5lZCkge1xuICAgIHNmID0gdHMuZ2V0T3JpZ2luYWxOb2RlKG5vZGUpLmdldFNvdXJjZUZpbGUoKTtcbiAgfVxuICByZXR1cm4gc2YgIT09IHVuZGVmaW5lZCAmJiBzZi5pc0RlY2xhcmF0aW9uRmlsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVOYW1lRm9yRXJyb3Iobm9kZTogdHMuTm9kZSZ7bmFtZT86IHRzLk5vZGV9KTogc3RyaW5nIHtcbiAgaWYgKG5vZGUubmFtZSAhPT0gdW5kZWZpbmVkICYmIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpKSB7XG4gICAgcmV0dXJuIG5vZGUubmFtZS50ZXh0O1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGtpbmQgPSB0cy5TeW50YXhLaW5kW25vZGUua2luZF07XG4gICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihub2RlLmdldFNvdXJjZUZpbGUoKSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICByZXR1cm4gYCR7a2luZH1AJHtsaW5lfToke2NoYXJhY3Rlcn1gO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VGaWxlKG5vZGU6IHRzLk5vZGUpOiB0cy5Tb3VyY2VGaWxlIHtcbiAgLy8gSW4gY2VydGFpbiB0cmFuc2Zvcm1hdGlvbiBjb250ZXh0cywgYHRzLk5vZGUuZ2V0U291cmNlRmlsZSgpYCBjYW4gYWN0dWFsbHkgcmV0dXJuIGB1bmRlZmluZWRgLFxuICAvLyBkZXNwaXRlIHRoZSB0eXBlIHNpZ25hdHVyZSBub3QgYWxsb3dpbmcgaXQuIEluIHRoYXQgZXZlbnQsIGdldCB0aGUgYHRzLlNvdXJjZUZpbGVgIHZpYSB0aGVcbiAgLy8gb3JpZ2luYWwgbm9kZSBpbnN0ZWFkICh3aGljaCB3b3JrcykuXG4gIGNvbnN0IGRpcmVjdFNmID0gbm9kZS5nZXRTb3VyY2VGaWxlKCkgYXMgdHMuU291cmNlRmlsZSB8IHVuZGVmaW5lZDtcbiAgcmV0dXJuIGRpcmVjdFNmICE9PSB1bmRlZmluZWQgPyBkaXJlY3RTZiA6IHRzLmdldE9yaWdpbmFsTm9kZShub2RlKS5nZXRTb3VyY2VGaWxlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTb3VyY2VGaWxlT3JOdWxsKHByb2dyYW06IHRzLlByb2dyYW0sIGZpbGVOYW1lOiBBYnNvbHV0ZUZzUGF0aCk6IHRzLlNvdXJjZUZpbGV8XG4gICAgbnVsbCB7XG4gIHJldHVybiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpIHx8IG51bGw7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRva2VuQXRQb3NpdGlvbihzZjogdHMuU291cmNlRmlsZSwgcG9zOiBudW1iZXIpOiB0cy5Ob2RlIHtcbiAgLy8gZ2V0VG9rZW5BdFBvc2l0aW9uIGlzIHBhcnQgb2YgVHlwZVNjcmlwdCdzIHByaXZhdGUgQVBJLlxuICByZXR1cm4gKHRzIGFzIGFueSkuZ2V0VG9rZW5BdFBvc2l0aW9uKHNmLCBwb3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpZmllck9mTm9kZShkZWNsOiB0cy5Ob2RlJntuYW1lPzogdHMuTm9kZX0pOiB0cy5JZGVudGlmaWVyfG51bGwge1xuICBpZiAoZGVjbC5uYW1lICE9PSB1bmRlZmluZWQgJiYgdHMuaXNJZGVudGlmaWVyKGRlY2wubmFtZSkpIHtcbiAgICByZXR1cm4gZGVjbC5uYW1lO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlY2xhcmF0aW9uKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLkRlY2xhcmF0aW9uIHtcbiAgcmV0dXJuIGlzVmFsdWVEZWNsYXJhdGlvbihub2RlKSB8fCBpc1R5cGVEZWNsYXJhdGlvbihub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsdWVEZWNsYXJhdGlvbihub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5DbGFzc0RlY2xhcmF0aW9ufFxuICAgIHRzLkZ1bmN0aW9uRGVjbGFyYXRpb258dHMuVmFyaWFibGVEZWNsYXJhdGlvbiB7XG4gIHJldHVybiB0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkgfHwgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHx8XG4gICAgICB0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVEZWNsYXJhdGlvbihub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyB0cy5FbnVtRGVjbGFyYXRpb258XG4gICAgdHMuVHlwZUFsaWFzRGVjbGFyYXRpb258dHMuSW50ZXJmYWNlRGVjbGFyYXRpb24ge1xuICByZXR1cm4gdHMuaXNFbnVtRGVjbGFyYXRpb24obm9kZSkgfHwgdHMuaXNUeXBlQWxpYXNEZWNsYXJhdGlvbihub2RlKSB8fFxuICAgICAgdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhwb3J0ZWQobm9kZTogRGVjbGFyYXRpb25Ob2RlKTogYm9vbGVhbiB7XG4gIGxldCB0b3BMZXZlbDogdHMuTm9kZSA9IG5vZGU7XG4gIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkgJiYgdHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uTGlzdChub2RlLnBhcmVudCkpIHtcbiAgICB0b3BMZXZlbCA9IG5vZGUucGFyZW50LnBhcmVudDtcbiAgfVxuICByZXR1cm4gdG9wTGV2ZWwubW9kaWZpZXJzICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIHRvcExldmVsLm1vZGlmaWVycy5zb21lKG1vZGlmaWVyID0+IG1vZGlmaWVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXhwb3J0S2V5d29yZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290RGlycyhcbiAgICBob3N0OiBQaWNrPHRzLkNvbXBpbGVySG9zdCwgJ2dldEN1cnJlbnREaXJlY3RvcnknfCdnZXRDYW5vbmljYWxGaWxlTmFtZSc+LFxuICAgIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyk6IEFic29sdXRlRnNQYXRoW10ge1xuICBjb25zdCByb290RGlyczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKG9wdGlvbnMucm9vdERpcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIHJvb3REaXJzLnB1c2goLi4ub3B0aW9ucy5yb290RGlycyk7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy5yb290RGlyICE9PSB1bmRlZmluZWQpIHtcbiAgICByb290RGlycy5wdXNoKG9wdGlvbnMucm9vdERpcik7XG4gIH0gZWxzZSB7XG4gICAgcm9vdERpcnMucHVzaChob3N0LmdldEN1cnJlbnREaXJlY3RvcnkoKSk7XG4gIH1cblxuICAvLyBJbiBXaW5kb3dzIHRoZSBhYm92ZSBtaWdodCBub3QgYWx3YXlzIHJldHVybiBwb3NpeCBzZXBhcmF0ZWQgcGF0aHNcbiAgLy8gU2VlOlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvYmxvYi8zZjczNTdkMzdmNjZjODQyZDcwZDgzNWJjOTI1ZWMyYTg3M2VjZmVjL3NyYy9jb21waWxlci9zeXMudHMjTDY1MFxuICAvLyBBbHNvIGNvbXBpbGVyIG9wdGlvbnMgbWlnaHQgYmUgc2V0IHZpYSBhbiBBUEkgd2hpY2ggZG9lc24ndCBub3JtYWxpemUgcGF0aHNcbiAgcmV0dXJuIHJvb3REaXJzLm1hcChyb290RGlyID0+IGFic29sdXRlRnJvbShob3N0LmdldENhbm9uaWNhbEZpbGVOYW1lKHJvb3REaXIpKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlRGVidWdJbmZvKG5vZGU6IHRzLk5vZGUpOiBzdHJpbmcge1xuICBjb25zdCBzZiA9IGdldFNvdXJjZUZpbGUobm9kZSk7XG4gIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID0gdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc2YsIG5vZGUucG9zKTtcbiAgcmV0dXJuIGBbJHtzZi5maWxlTmFtZX06ICR7dHMuU3ludGF4S2luZFtub2RlLmtpbmRdfSBAICR7bGluZX06JHtjaGFyYWN0ZXJ9XWA7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgc3BlY2lmaWVkIGBtb2R1bGVOYW1lYCB1c2luZyB0aGUgZ2l2ZW4gYGNvbXBpbGVyT3B0aW9uc2AgYW5kIGBjb21waWxlckhvc3RgLlxuICpcbiAqIFRoaXMgaGVscGVyIHdpbGwgYXR0ZW1wdCB0byB1c2UgdGhlIGBDb21waWxlckhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzKClgIG1ldGhvZCBpZiBhdmFpbGFibGUuXG4gKiBPdGhlcndpc2UgaXQgd2lsbCBmYWxsYmFjayBvbiB0aGUgYHRzLlJlc29sdmVNb2R1bGVOYW1lKClgIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZU1vZHVsZU5hbWUoXG4gICAgbW9kdWxlTmFtZTogc3RyaW5nLCBjb250YWluaW5nRmlsZTogc3RyaW5nLCBjb21waWxlck9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyxcbiAgICBjb21waWxlckhvc3Q6IHRzLk1vZHVsZVJlc29sdXRpb25Ib3N0JlBpY2s8dHMuQ29tcGlsZXJIb3N0LCAncmVzb2x2ZU1vZHVsZU5hbWVzJz4sXG4gICAgbW9kdWxlUmVzb2x1dGlvbkNhY2hlOiB0cy5Nb2R1bGVSZXNvbHV0aW9uQ2FjaGV8bnVsbCk6IHRzLlJlc29sdmVkTW9kdWxlfHVuZGVmaW5lZCB7XG4gIGlmIChjb21waWxlckhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzKSB7XG4gICAgcmV0dXJuIGNvbXBpbGVySG9zdC5yZXNvbHZlTW9kdWxlTmFtZXMoXG4gICAgICAgIFttb2R1bGVOYW1lXSwgY29udGFpbmluZ0ZpbGUsXG4gICAgICAgIHVuZGVmaW5lZCwgIC8vIHJldXNlZE5hbWVzXG4gICAgICAgIHVuZGVmaW5lZCwgIC8vIHJlZGlyZWN0ZWRSZWZlcmVuY2VcbiAgICAgICAgY29tcGlsZXJPcHRpb25zKVswXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdHNcbiAgICAgICAgLnJlc29sdmVNb2R1bGVOYW1lKFxuICAgICAgICAgICAgbW9kdWxlTmFtZSwgY29udGFpbmluZ0ZpbGUsIGNvbXBpbGVyT3B0aW9ucywgY29tcGlsZXJIb3N0LFxuICAgICAgICAgICAgbW9kdWxlUmVzb2x1dGlvbkNhY2hlICE9PSBudWxsID8gbW9kdWxlUmVzb2x1dGlvbkNhY2hlIDogdW5kZWZpbmVkKVxuICAgICAgICAucmVzb2x2ZWRNb2R1bGU7XG4gIH1cbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgbm9kZSBpcyBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24uICovXG5leHBvcnQgZnVuY3Rpb24gaXNBc3NpZ25tZW50KG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIHRzLkJpbmFyeUV4cHJlc3Npb24ge1xuICByZXR1cm4gdHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpICYmIG5vZGUub3BlcmF0b3JUb2tlbi5raW5kID09PSB0cy5TeW50YXhLaW5kLkVxdWFsc1Rva2VuO1xufVxuXG4vKipcbiAqIEFzc2VydHMgdGhhdCB0aGUga2V5cyBgS2AgZm9ybSBhIHN1YnNldCBvZiB0aGUga2V5cyBvZiBgVGAuXG4gKi9cbmV4cG9ydCB0eXBlIFN1YnNldE9mS2V5czxULCBLIGV4dGVuZHMga2V5b2YgVD4gPSBLO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIHR5cGUgYFRgLCB3aXRoIGEgdHJhbnNmb3JtYXRpb24gYXBwbGllZCB0aGF0IHR1cm5zIGFsbCBtZXRob2RzIChldmVuIG9wdGlvbmFsXG4gKiBvbmVzKSBpbnRvIHJlcXVpcmVkIGZpZWxkcyAod2hpY2ggbWF5IGJlIGB1bmRlZmluZWRgLCBpZiB0aGUgbWV0aG9kIHdhcyBvcHRpb25hbCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVkRGVsZWdhdGlvbnM8VD4gPSB7XG4gIFtNIGluIGtleW9mIFJlcXVpcmVkPFQ+XTogVFtNXTtcbn07XG4iXX0=
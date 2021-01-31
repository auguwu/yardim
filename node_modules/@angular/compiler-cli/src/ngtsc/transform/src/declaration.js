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
        define("@angular/compiler-cli/src/ngtsc/transform/src/declaration", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/translator", "@angular/compiler-cli/src/ngtsc/transform/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReturnTypeTransform = exports.IvyDeclarationDtsTransform = exports.declarationTransformFactory = exports.DtsTransformRegistry = void 0;
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var translator_1 = require("@angular/compiler-cli/src/ngtsc/translator");
    var utils_1 = require("@angular/compiler-cli/src/ngtsc/transform/src/utils");
    /**
     * Keeps track of `DtsTransform`s per source file, so that it is known which source files need to
     * have their declaration file transformed.
     */
    var DtsTransformRegistry = /** @class */ (function () {
        function DtsTransformRegistry() {
            this.ivyDeclarationTransforms = new Map();
            this.returnTypeTransforms = new Map();
        }
        DtsTransformRegistry.prototype.getIvyDeclarationTransform = function (sf) {
            if (!this.ivyDeclarationTransforms.has(sf)) {
                this.ivyDeclarationTransforms.set(sf, new IvyDeclarationDtsTransform());
            }
            return this.ivyDeclarationTransforms.get(sf);
        };
        DtsTransformRegistry.prototype.getReturnTypeTransform = function (sf) {
            if (!this.returnTypeTransforms.has(sf)) {
                this.returnTypeTransforms.set(sf, new ReturnTypeTransform());
            }
            return this.returnTypeTransforms.get(sf);
        };
        /**
         * Gets the dts transforms to be applied for the given source file, or `null` if no transform is
         * necessary.
         */
        DtsTransformRegistry.prototype.getAllTransforms = function (sf) {
            // No need to transform if it's not a declarations file, or if no changes have been requested
            // to the input file. Due to the way TypeScript afterDeclarations transformers work, the
            // `ts.SourceFile` path is the same as the original .ts. The only way we know it's actually a
            // declaration file is via the `isDeclarationFile` property.
            if (!sf.isDeclarationFile) {
                return null;
            }
            var originalSf = ts.getOriginalNode(sf);
            var transforms = null;
            if (this.ivyDeclarationTransforms.has(originalSf)) {
                transforms = [];
                transforms.push(this.ivyDeclarationTransforms.get(originalSf));
            }
            if (this.returnTypeTransforms.has(originalSf)) {
                transforms = transforms || [];
                transforms.push(this.returnTypeTransforms.get(originalSf));
            }
            return transforms;
        };
        return DtsTransformRegistry;
    }());
    exports.DtsTransformRegistry = DtsTransformRegistry;
    function declarationTransformFactory(transformRegistry, importRewriter, importPrefix) {
        return function (context) {
            var transformer = new DtsTransformer(context, importRewriter, importPrefix);
            return function (fileOrBundle) {
                if (ts.isBundle(fileOrBundle)) {
                    // Only attempt to transform source files.
                    return fileOrBundle;
                }
                var transforms = transformRegistry.getAllTransforms(fileOrBundle);
                if (transforms === null) {
                    return fileOrBundle;
                }
                return transformer.transform(fileOrBundle, transforms);
            };
        };
    }
    exports.declarationTransformFactory = declarationTransformFactory;
    /**
     * Processes .d.ts file text and adds static field declarations, with types.
     */
    var DtsTransformer = /** @class */ (function () {
        function DtsTransformer(ctx, importRewriter, importPrefix) {
            this.ctx = ctx;
            this.importRewriter = importRewriter;
            this.importPrefix = importPrefix;
        }
        /**
         * Transform the declaration file and add any declarations which were recorded.
         */
        DtsTransformer.prototype.transform = function (sf, transforms) {
            var _this = this;
            var imports = new translator_1.ImportManager(this.importRewriter, this.importPrefix);
            var visitor = function (node) {
                if (ts.isClassDeclaration(node)) {
                    return _this.transformClassDeclaration(node, transforms, imports);
                }
                else if (ts.isFunctionDeclaration(node)) {
                    return _this.transformFunctionDeclaration(node, transforms, imports);
                }
                else {
                    // Otherwise return node as is.
                    return ts.visitEachChild(node, visitor, _this.ctx);
                }
            };
            // Recursively scan through the AST and process all nodes as desired.
            sf = ts.visitNode(sf, visitor);
            // Add new imports for this file.
            return utils_1.addImports(imports, sf);
        };
        DtsTransformer.prototype.transformClassDeclaration = function (clazz, transforms, imports) {
            var e_1, _a, e_2, _b;
            var elements = clazz.members;
            var elementsChanged = false;
            try {
                for (var transforms_1 = tslib_1.__values(transforms), transforms_1_1 = transforms_1.next(); !transforms_1_1.done; transforms_1_1 = transforms_1.next()) {
                    var transform = transforms_1_1.value;
                    if (transform.transformClassElement !== undefined) {
                        for (var i = 0; i < elements.length; i++) {
                            var res = transform.transformClassElement(elements[i], imports);
                            if (res !== elements[i]) {
                                if (!elementsChanged) {
                                    elements = tslib_1.__spread(elements);
                                    elementsChanged = true;
                                }
                                elements[i] = res;
                            }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (transforms_1_1 && !transforms_1_1.done && (_a = transforms_1.return)) _a.call(transforms_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var newClazz = clazz;
            try {
                for (var transforms_2 = tslib_1.__values(transforms), transforms_2_1 = transforms_2.next(); !transforms_2_1.done; transforms_2_1 = transforms_2.next()) {
                    var transform = transforms_2_1.value;
                    if (transform.transformClass !== undefined) {
                        // If no DtsTransform has changed the class yet, then the (possibly mutated) elements have
                        // not yet been incorporated. Otherwise, `newClazz.members` holds the latest class members.
                        var inputMembers = (clazz === newClazz ? elements : newClazz.members);
                        newClazz = transform.transformClass(newClazz, inputMembers, imports);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (transforms_2_1 && !transforms_2_1.done && (_b = transforms_2.return)) _b.call(transforms_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // If some elements have been transformed but the class itself has not been transformed, create
            // an updated class declaration with the updated elements.
            if (elementsChanged && clazz === newClazz) {
                newClazz = ts.updateClassDeclaration(
                /* node */ clazz, 
                /* decorators */ clazz.decorators, 
                /* modifiers */ clazz.modifiers, 
                /* name */ clazz.name, 
                /* typeParameters */ clazz.typeParameters, 
                /* heritageClauses */ clazz.heritageClauses, 
                /* members */ elements);
            }
            return newClazz;
        };
        DtsTransformer.prototype.transformFunctionDeclaration = function (declaration, transforms, imports) {
            var e_3, _a;
            var newDecl = declaration;
            try {
                for (var transforms_3 = tslib_1.__values(transforms), transforms_3_1 = transforms_3.next(); !transforms_3_1.done; transforms_3_1 = transforms_3.next()) {
                    var transform = transforms_3_1.value;
                    if (transform.transformFunctionDeclaration !== undefined) {
                        newDecl = transform.transformFunctionDeclaration(newDecl, imports);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (transforms_3_1 && !transforms_3_1.done && (_a = transforms_3.return)) _a.call(transforms_3);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return newDecl;
        };
        return DtsTransformer;
    }());
    var IvyDeclarationDtsTransform = /** @class */ (function () {
        function IvyDeclarationDtsTransform() {
            this.declarationFields = new Map();
        }
        IvyDeclarationDtsTransform.prototype.addFields = function (decl, fields) {
            this.declarationFields.set(decl, fields);
        };
        IvyDeclarationDtsTransform.prototype.transformClass = function (clazz, members, imports) {
            var original = ts.getOriginalNode(clazz);
            if (!this.declarationFields.has(original)) {
                return clazz;
            }
            var fields = this.declarationFields.get(original);
            var newMembers = fields.map(function (decl) {
                var modifiers = [ts.createModifier(ts.SyntaxKind.StaticKeyword)];
                var typeRef = translator_1.translateType(decl.type, imports);
                markForEmitAsSingleLine(typeRef);
                return ts.createProperty(
                /* decorators */ undefined, 
                /* modifiers */ modifiers, 
                /* name */ decl.name, 
                /* questionOrExclamationToken */ undefined, 
                /* type */ typeRef, 
                /* initializer */ undefined);
            });
            return ts.updateClassDeclaration(
            /* node */ clazz, 
            /* decorators */ clazz.decorators, 
            /* modifiers */ clazz.modifiers, 
            /* name */ clazz.name, 
            /* typeParameters */ clazz.typeParameters, 
            /* heritageClauses */ clazz.heritageClauses, tslib_1.__spread(members, newMembers));
        };
        return IvyDeclarationDtsTransform;
    }());
    exports.IvyDeclarationDtsTransform = IvyDeclarationDtsTransform;
    function markForEmitAsSingleLine(node) {
        ts.setEmitFlags(node, ts.EmitFlags.SingleLine);
        ts.forEachChild(node, markForEmitAsSingleLine);
    }
    var ReturnTypeTransform = /** @class */ (function () {
        function ReturnTypeTransform() {
            this.typeReplacements = new Map();
        }
        ReturnTypeTransform.prototype.addTypeReplacement = function (declaration, type) {
            this.typeReplacements.set(declaration, type);
        };
        ReturnTypeTransform.prototype.transformClassElement = function (element, imports) {
            if (ts.isMethodDeclaration(element)) {
                var original = ts.getOriginalNode(element, ts.isMethodDeclaration);
                if (!this.typeReplacements.has(original)) {
                    return element;
                }
                var returnType = this.typeReplacements.get(original);
                var tsReturnType = translator_1.translateType(returnType, imports);
                return ts.updateMethod(element, element.decorators, element.modifiers, element.asteriskToken, element.name, element.questionToken, element.typeParameters, element.parameters, tsReturnType, element.body);
            }
            return element;
        };
        ReturnTypeTransform.prototype.transformFunctionDeclaration = function (element, imports) {
            var original = ts.getOriginalNode(element);
            if (!this.typeReplacements.has(original)) {
                return element;
            }
            var returnType = this.typeReplacements.get(original);
            var tsReturnType = translator_1.translateType(returnType, imports);
            return ts.updateFunctionDeclaration(
            /* node */ element, 
            /* decorators */ element.decorators, 
            /* modifiers */ element.modifiers, 
            /* asteriskToken */ element.asteriskToken, 
            /* name */ element.name, 
            /* typeParameters */ element.typeParameters, 
            /* parameters */ element.parameters, 
            /* type */ tsReturnType, 
            /* body */ element.body);
        };
        return ReturnTypeTransform;
    }());
    exports.ReturnTypeTransform = ReturnTypeTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3RyYW5zZm9ybS9zcmMvZGVjbGFyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7OztJQUdILCtCQUFpQztJQUlqQyx5RUFBOEQ7SUFHOUQsNkVBQW1DO0lBRW5DOzs7T0FHRztJQUNIO1FBQUE7WUFDVSw2QkFBd0IsR0FBRyxJQUFJLEdBQUcsRUFBNkMsQ0FBQztZQUNoRix5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBc0MsQ0FBQztRQXlDL0UsQ0FBQztRQXZDQyx5REFBMEIsR0FBMUIsVUFBMkIsRUFBaUI7WUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksMEJBQTBCLEVBQUUsQ0FBQyxDQUFDO2FBQ3pFO1lBQ0QsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQ2hELENBQUM7UUFFRCxxREFBc0IsR0FBdEIsVUFBdUIsRUFBaUI7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO2FBQzlEO1lBQ0QsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDO1FBQzVDLENBQUM7UUFFRDs7O1dBR0c7UUFDSCwrQ0FBZ0IsR0FBaEIsVUFBaUIsRUFBaUI7WUFDaEMsNkZBQTZGO1lB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STtZQUN2QixvQkFBb0IsQ0FBQyxPQUFPLENBQUMsY0FBYztZQUMzQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNuQyxVQUFVLENBQUMsWUFBWTtZQUN2QixVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDSCwwQkFBQztJQUFELENBQUMsQUE3Q0QsSUE2Q0M7SUE3Q1ksa0RBQW1CIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0UmV3cml0ZXJ9IGZyb20gJy4uLy4uL2ltcG9ydHMnO1xuaW1wb3J0IHtDbGFzc0RlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uJztcbmltcG9ydCB7SW1wb3J0TWFuYWdlciwgdHJhbnNsYXRlVHlwZX0gZnJvbSAnLi4vLi4vdHJhbnNsYXRvcic7XG5cbmltcG9ydCB7RHRzVHJhbnNmb3JtfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQge2FkZEltcG9ydHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGBEdHNUcmFuc2Zvcm1gcyBwZXIgc291cmNlIGZpbGUsIHNvIHRoYXQgaXQgaXMga25vd24gd2hpY2ggc291cmNlIGZpbGVzIG5lZWQgdG9cbiAqIGhhdmUgdGhlaXIgZGVjbGFyYXRpb24gZmlsZSB0cmFuc2Zvcm1lZC5cbiAqL1xuZXhwb3J0IGNsYXNzIER0c1RyYW5zZm9ybVJlZ2lzdHJ5IHtcbiAgcHJpdmF0ZSBpdnlEZWNsYXJhdGlvblRyYW5zZm9ybXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIEl2eURlY2xhcmF0aW9uRHRzVHJhbnNmb3JtPigpO1xuICBwcml2YXRlIHJldHVyblR5cGVUcmFuc2Zvcm1zID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBSZXR1cm5UeXBlVHJhbnNmb3JtPigpO1xuXG4gIGdldEl2eURlY2xhcmF0aW9uVHJhbnNmb3JtKHNmOiB0cy5Tb3VyY2VGaWxlKTogSXZ5RGVjbGFyYXRpb25EdHNUcmFuc2Zvcm0ge1xuICAgIGlmICghdGhpcy5pdnlEZWNsYXJhdGlvblRyYW5zZm9ybXMuaGFzKHNmKSkge1xuICAgICAgdGhpcy5pdnlEZWNsYXJhdGlvblRyYW5zZm9ybXMuc2V0KHNmLCBuZXcgSXZ5RGVjbGFyYXRpb25EdHNUcmFuc2Zvcm0oKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLml2eURlY2xhcmF0aW9uVHJhbnNmb3Jtcy5nZXQoc2YpITtcbiAgfVxuXG4gIGdldFJldHVyblR5cGVUcmFuc2Zvcm0oc2Y6IHRzLlNvdXJjZUZpbGUpOiBSZXR1cm5UeXBlVHJhbnNmb3JtIHtcbiAgICBpZiAoIXRoaXMucmV0dXJuVHlwZVRyYW5zZm9ybXMuaGFzKHNmKSkge1xuICAgICAgdGhpcy5yZXR1cm5UeXBlVHJhbnNmb3Jtcy5zZXQoc2YsIG5ldyBSZXR1cm5UeXBlVHJhbnNmb3JtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZXR1cm5UeXBlVHJhbnNmb3Jtcy5nZXQoc2YpITtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkdHMgdHJhbnNmb3JtcyB0byBiZSBhcHBsaWVkIGZvciB0aGUgZ2l2ZW4gc291cmNlIGZpbGUsIG9yIGBudWxsYCBpZiBubyB0cmFuc2Zvcm0gaXNcbiAgICogbmVjZXNzYXJ5LlxuICAgKi9cbiAgZ2V0QWxsVHJhbnNmb3JtcyhzZjogdHMuU291cmNlRmlsZSk6IER0c1RyYW5zZm9ybVtdfG51bGwge1xuICAgIC8vIE5vIG5lZWQgdG8gdHJhbnNmb3JtIGlmIGl0J3Mgbm90IGEgZGVjbGFyYXRpb25zIGZpbGUsIG9yIGlmIG5vIGNoYW5nZXMgaGF2ZSBiZWVuIHJlcXVlc3RlZFxuICAgIC8vIHRvIHRoZSBpbnB1dCBmaWxlLiBEdWUgdG8gdGhlIHdheSBUeXBlU2NyaXB0IGFmdGVyRGVjbGFyYXRpb25zIHRyYW5zZm9ybWVycyB3b3JrLCB0aGVcbiAgICAvLyBgdHMuU291cmNlRmlsZWAgcGF0aCBpcyB0aGUgc2FtZSBhcyB0aGUgb3JpZ2luYWwgLnRzLiBUaGUgb25seSB3YXkgd2Uga25vdyBpdCdzIGFjdHVhbGx5IGFcbiAgICAvLyBkZWNsYXJhdGlvbiBmaWxlIGlzIHZpYSB0aGUgYGlzRGVjbGFyYXRpb25GaWxlYCBwcm9wZXJ0eS5cbiAgICBpZiAoIXNmLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgb3JpZ2luYWxTZiA9IHRzLmdldE9yaWdpbmFsTm9kZShzZikgYXMgdHMuU291cmNlRmlsZTtcblxuICAgIGxldCB0cmFuc2Zvcm1zOiBEdHNUcmFuc2Zvcm1bXXxudWxsID0gbnVsbDtcbiAgICBpZiAodGhpcy5pdnlEZWNsYXJhdGlvblRyYW5zZm9ybXMuaGFzKG9yaWdpbmFsU2YpKSB7XG4gICAgICB0cmFuc2Zvcm1zID0gW107XG4gICAgICB0cmFuc2Zvcm1zLnB1c2godGhpcy5pdnlEZWNsYXJhdGlvblRyYW5zZm9ybXMuZ2V0KG9yaWdpbmFsU2YpISk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJldHVyblR5cGVUcmFuc2Zvcm1zLmhhcyhvcmlnaW5hbFNmKSkge1xuICAgICAgdHJhbnNmb3JtcyA9IHRyYW5zZm9ybXMgfHwgW107XG4gICAgICB0cmFuc2Zvcm1zLnB1c2godGhpcy5yZXR1cm5UeXBlVHJhbnNmb3Jtcy5nZXQob3JpZ2luYWxTZikhKTtcbiAgICB9XG4gICAgcmV0dXJuIHRyYW5zZm9ybXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY2xhcmF0aW9uVHJhbnNmb3JtRmFjdG9yeShcbiAgICB0cmFuc2Zvcm1SZWdpc3RyeTogRHRzVHJhbnNmb3JtUmVnaXN0cnksIGltcG9ydFJld3JpdGVyOiBJbXBvcnRSZXdyaXRlcixcbiAgICBpbXBvcnRQcmVmaXg/OiBzdHJpbmcpOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4ge1xuICByZXR1cm4gKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHRyYW5zZm9ybWVyID0gbmV3IER0c1RyYW5zZm9ybWVyKGNvbnRleHQsIGltcG9ydFJld3JpdGVyLCBpbXBvcnRQcmVmaXgpO1xuICAgIHJldHVybiAoZmlsZU9yQnVuZGxlKSA9PiB7XG4gICAgICBpZiAodHMuaXNCdW5kbGUoZmlsZU9yQnVuZGxlKSkge1xuICAgICAgICAvLyBPbmx5IGF0dGVtcHQgdG8gdHJhbnNmb3JtIHNvdXJjZSBmaWxlcy5cbiAgICAgICAgcmV0dXJuIGZpbGVPckJ1bmRsZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRyYW5zZm9ybXMgPSB0cmFuc2Zvcm1SZWdpc3RyeS5nZXRBbGxUcmFuc2Zvcm1zKGZpbGVPckJ1bmRsZSk7XG4gICAgICBpZiAodHJhbnNmb3JtcyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmlsZU9yQnVuZGxlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRyYW5zZm9ybWVyLnRyYW5zZm9ybShmaWxlT3JCdW5kbGUsIHRyYW5zZm9ybXMpO1xuICAgIH07XG4gIH07XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIC5kLnRzIGZpbGUgdGV4dCBhbmQgYWRkcyBzdGF0aWMgZmllbGQgZGVjbGFyYXRpb25zLCB3aXRoIHR5cGVzLlxuICovXG5jbGFzcyBEdHNUcmFuc2Zvcm1lciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBjdHg6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCwgcHJpdmF0ZSBpbXBvcnRSZXdyaXRlcjogSW1wb3J0UmV3cml0ZXIsXG4gICAgICBwcml2YXRlIGltcG9ydFByZWZpeD86IHN0cmluZykge31cblxuICAvKipcbiAgICogVHJhbnNmb3JtIHRoZSBkZWNsYXJhdGlvbiBmaWxlIGFuZCBhZGQgYW55IGRlY2xhcmF0aW9ucyB3aGljaCB3ZXJlIHJlY29yZGVkLlxuICAgKi9cbiAgdHJhbnNmb3JtKHNmOiB0cy5Tb3VyY2VGaWxlLCB0cmFuc2Zvcm1zOiBEdHNUcmFuc2Zvcm1bXSk6IHRzLlNvdXJjZUZpbGUge1xuICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgSW1wb3J0TWFuYWdlcih0aGlzLmltcG9ydFJld3JpdGVyLCB0aGlzLmltcG9ydFByZWZpeCk7XG5cbiAgICBjb25zdCB2aXNpdG9yOiB0cy5WaXNpdG9yID0gKG5vZGU6IHRzLk5vZGUpOiB0cy5WaXNpdFJlc3VsdDx0cy5Ob2RlPiA9PiB7XG4gICAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUNsYXNzRGVjbGFyYXRpb24obm9kZSwgdHJhbnNmb3JtcywgaW1wb3J0cyk7XG4gICAgICB9IGVsc2UgaWYgKHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1GdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUsIHRyYW5zZm9ybXMsIGltcG9ydHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlIHJldHVybiBub2RlIGFzIGlzLlxuICAgICAgICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXRvciwgdGhpcy5jdHgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBSZWN1cnNpdmVseSBzY2FuIHRocm91Z2ggdGhlIEFTVCBhbmQgcHJvY2VzcyBhbGwgbm9kZXMgYXMgZGVzaXJlZC5cbiAgICBzZiA9IHRzLnZpc2l0Tm9kZShzZiwgdmlzaXRvcik7XG5cbiAgICAvLyBBZGQgbmV3IGltcG9ydHMgZm9yIHRoaXMgZmlsZS5cbiAgICByZXR1cm4gYWRkSW1wb3J0cyhpbXBvcnRzLCBzZik7XG4gIH1cblxuICBwcml2YXRlIHRyYW5zZm9ybUNsYXNzRGVjbGFyYXRpb24oXG4gICAgICBjbGF6ejogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHJhbnNmb3JtczogRHRzVHJhbnNmb3JtW10sXG4gICAgICBpbXBvcnRzOiBJbXBvcnRNYW5hZ2VyKTogdHMuQ2xhc3NEZWNsYXJhdGlvbiB7XG4gICAgbGV0IGVsZW1lbnRzOiB0cy5DbGFzc0VsZW1lbnRbXXxSZWFkb25seUFycmF5PHRzLkNsYXNzRWxlbWVudD4gPSBjbGF6ei5tZW1iZXJzO1xuICAgIGxldCBlbGVtZW50c0NoYW5nZWQgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgdHJhbnNmb3JtIG9mIHRyYW5zZm9ybXMpIHtcbiAgICAgIGlmICh0cmFuc2Zvcm0udHJhbnNmb3JtQ2xhc3NFbGVtZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJlcyA9IHRyYW5zZm9ybS50cmFuc2Zvcm1DbGFzc0VsZW1lbnQoZWxlbWVudHNbaV0sIGltcG9ydHMpO1xuICAgICAgICAgIGlmIChyZXMgIT09IGVsZW1lbnRzW2ldKSB7XG4gICAgICAgICAgICBpZiAoIWVsZW1lbnRzQ2hhbmdlZCkge1xuICAgICAgICAgICAgICBlbGVtZW50cyA9IFsuLi5lbGVtZW50c107XG4gICAgICAgICAgICAgIGVsZW1lbnRzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAoZWxlbWVudHMgYXMgdHMuQ2xhc3NFbGVtZW50W10pW2ldID0gcmVzO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBuZXdDbGF6ejogdHMuQ2xhc3NEZWNsYXJhdGlvbiA9IGNsYXp6O1xuXG4gICAgZm9yIChjb25zdCB0cmFuc2Zvcm0gb2YgdHJhbnNmb3Jtcykge1xuICAgICAgaWYgKHRyYW5zZm9ybS50cmFuc2Zvcm1DbGFzcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIElmIG5vIER0c1RyYW5zZm9ybSBoYXMgY2hhbmdlZCB0aGUgY2xhc3MgeWV0LCB0aGVuIHRoZSAocG9zc2libHkgbXV0YXRlZCkgZWxlbWVudHMgaGF2ZVxuICAgICAgICAvLyBub3QgeWV0IGJlZW4gaW5jb3Jwb3JhdGVkLiBPdGhlcndpc2UsIGBuZXdDbGF6ei5tZW1iZXJzYCBob2xkcyB0aGUgbGF0ZXN0IGNsYXNzIG1lbWJlcnMuXG4gICAgICAgIGNvbnN0IGlucHV0TWVtYmVycyA9IChjbGF6eiA9PT0gbmV3Q2xhenogPyBlbGVtZW50cyA6IG5ld0NsYXp6Lm1lbWJlcnMpO1xuXG4gICAgICAgIG5ld0NsYXp6ID0gdHJhbnNmb3JtLnRyYW5zZm9ybUNsYXNzKG5ld0NsYXp6LCBpbnB1dE1lbWJlcnMsIGltcG9ydHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHNvbWUgZWxlbWVudHMgaGF2ZSBiZWVuIHRyYW5zZm9ybWVkIGJ1dCB0aGUgY2xhc3MgaXRzZWxmIGhhcyBub3QgYmVlbiB0cmFuc2Zvcm1lZCwgY3JlYXRlXG4gICAgLy8gYW4gdXBkYXRlZCBjbGFzcyBkZWNsYXJhdGlvbiB3aXRoIHRoZSB1cGRhdGVkIGVsZW1lbnRzLlxuICAgIGlmIChlbGVtZW50c0NoYW5nZWQgJiYgY2xhenogPT09IG5ld0NsYXp6KSB7XG4gICAgICBuZXdDbGF6eiA9IHRzLnVwZGF0ZUNsYXNzRGVjbGFyYXRpb24oXG4gICAgICAgICAgLyogbm9kZSAqLyBjbGF6eixcbiAgICAgICAgICAvKiBkZWNvcmF0b3JzICovIGNsYXp6LmRlY29yYXRvcnMsXG4gICAgICAgICAgLyogbW9kaWZpZXJzICovIGNsYXp6Lm1vZGlmaWVycyxcbiAgICAgICAgICAvKiBuYW1lICovIGNsYXp6Lm5hbWUsXG4gICAgICAgICAgLyogdHlwZVBhcmFtZXRlcnMgKi8gY2xhenoudHlwZVBhcmFtZXRlcnMsXG4gICAgICAgICAgLyogaGVyaXRhZ2VDbGF1c2VzICovIGNsYXp6Lmhlcml0YWdlQ2xhdXNlcyxcbiAgICAgICAgICAvKiBtZW1iZXJzICovIGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3Q2xheno7XG4gIH1cblxuICBwcml2YXRlIHRyYW5zZm9ybUZ1bmN0aW9uRGVjbGFyYXRpb24oXG4gICAgICBkZWNsYXJhdGlvbjogdHMuRnVuY3Rpb25EZWNsYXJhdGlvbiwgdHJhbnNmb3JtczogRHRzVHJhbnNmb3JtW10sXG4gICAgICBpbXBvcnRzOiBJbXBvcnRNYW5hZ2VyKTogdHMuRnVuY3Rpb25EZWNsYXJhdGlvbiB7XG4gICAgbGV0IG5ld0RlY2wgPSBkZWNsYXJhdGlvbjtcblxuICAgIGZvciAoY29uc3QgdHJhbnNmb3JtIG9mIHRyYW5zZm9ybXMpIHtcbiAgICAgIGlmICh0cmFuc2Zvcm0udHJhbnNmb3JtRnVuY3Rpb25EZWNsYXJhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5ld0RlY2wgPSB0cmFuc2Zvcm0udHJhbnNmb3JtRnVuY3Rpb25EZWNsYXJhdGlvbihuZXdEZWNsLCBpbXBvcnRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3RGVjbDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEl2eURlY2xhcmF0aW9uRmllbGQge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6IFR5cGU7XG59XG5cbmV4cG9ydCBjbGFzcyBJdnlEZWNsYXJhdGlvbkR0c1RyYW5zZm9ybSBpbXBsZW1lbnRzIER0c1RyYW5zZm9ybSB7XG4gIHByaXZhdGUgZGVjbGFyYXRpb25GaWVsZHMgPSBuZXcgTWFwPENsYXNzRGVjbGFyYXRpb24sIEl2eURlY2xhcmF0aW9uRmllbGRbXT4oKTtcblxuICBhZGRGaWVsZHMoZGVjbDogQ2xhc3NEZWNsYXJhdGlvbiwgZmllbGRzOiBJdnlEZWNsYXJhdGlvbkZpZWxkW10pOiB2b2lkIHtcbiAgICB0aGlzLmRlY2xhcmF0aW9uRmllbGRzLnNldChkZWNsLCBmaWVsZHMpO1xuICB9XG5cbiAgdHJhbnNmb3JtQ2xhc3MoXG4gICAgICBjbGF6ejogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgbWVtYmVyczogUmVhZG9ubHlBcnJheTx0cy5DbGFzc0VsZW1lbnQ+LFxuICAgICAgaW1wb3J0czogSW1wb3J0TWFuYWdlcik6IHRzLkNsYXNzRGVjbGFyYXRpb24ge1xuICAgIGNvbnN0IG9yaWdpbmFsID0gdHMuZ2V0T3JpZ2luYWxOb2RlKGNsYXp6KSBhcyBDbGFzc0RlY2xhcmF0aW9uO1xuXG4gICAgaWYgKCF0aGlzLmRlY2xhcmF0aW9uRmllbGRzLmhhcyhvcmlnaW5hbCkpIHtcbiAgICAgIHJldHVybiBjbGF6ejtcbiAgICB9XG4gICAgY29uc3QgZmllbGRzID0gdGhpcy5kZWNsYXJhdGlvbkZpZWxkcy5nZXQob3JpZ2luYWwpITtcblxuICAgIGNvbnN0IG5ld01lbWJlcnMgPSBmaWVsZHMubWFwKGRlY2wgPT4ge1xuICAgICAgY29uc3QgbW9kaWZpZXJzID0gW3RzLmNyZWF0ZU1vZGlmaWVyKHRzLlN5bnRheEtpbmQuU3RhdGljS2V5d29yZCldO1xuICAgICAgY29uc3QgdHlwZVJlZiA9IHRyYW5zbGF0ZVR5cGUoZGVjbC50eXBlLCBpbXBvcnRzKTtcbiAgICAgIG1hcmtGb3JFbWl0QXNTaW5nbGVMaW5lKHR5cGVSZWYpO1xuICAgICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5KFxuICAgICAgICAgIC8qIGRlY29yYXRvcnMgKi8gdW5kZWZpbmVkLFxuICAgICAgICAgIC8qIG1vZGlmaWVycyAqLyBtb2RpZmllcnMsXG4gICAgICAgICAgLyogbmFtZSAqLyBkZWNsLm5hbWUsXG4gICAgICAgICAgLyogcXVlc3Rpb25PckV4Y2xhbWF0aW9uVG9rZW4gKi8gdW5kZWZpbmVkLFxuICAgICAgICAgIC8qIHR5cGUgKi8gdHlwZVJlZixcbiAgICAgICAgICAvKiBpbml0aWFsaXplciAqLyB1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRzLnVwZGF0ZUNsYXNzRGVjbGFyYXRpb24oXG4gICAgICAgIC8qIG5vZGUgKi8gY2xhenosXG4gICAgICAgIC8qIGRlY29yYXRvcnMgKi8gY2xhenouZGVjb3JhdG9ycyxcbiAgICAgICAgLyogbW9kaWZpZXJzICovIGNsYXp6Lm1vZGlmaWVycyxcbiAgICAgICAgLyogbmFtZSAqLyBjbGF6ei5uYW1lLFxuICAgICAgICAvKiB0eXBlUGFyYW1ldGVycyAqLyBjbGF6ei50eXBlUGFyYW1ldGVycyxcbiAgICAgICAgLyogaGVyaXRhZ2VDbGF1c2VzICovIGNsYXp6Lmhlcml0YWdlQ2xhdXNlcyxcbiAgICAgICAgLyogbWVtYmVycyAqL1suLi5tZW1iZXJzLCAuLi5uZXdNZW1iZXJzXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFya0ZvckVtaXRBc1NpbmdsZUxpbmUobm9kZTogdHMuTm9kZSkge1xuICB0cy5zZXRFbWl0RmxhZ3Mobm9kZSwgdHMuRW1pdEZsYWdzLlNpbmdsZUxpbmUpO1xuICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbWFya0ZvckVtaXRBc1NpbmdsZUxpbmUpO1xufVxuXG5leHBvcnQgY2xhc3MgUmV0dXJuVHlwZVRyYW5zZm9ybSBpbXBsZW1lbnRzIER0c1RyYW5zZm9ybSB7XG4gIHByaXZhdGUgdHlwZVJlcGxhY2VtZW50cyA9IG5ldyBNYXA8dHMuRGVjbGFyYXRpb24sIFR5cGU+KCk7XG5cbiAgYWRkVHlwZVJlcGxhY2VtZW50KGRlY2xhcmF0aW9uOiB0cy5EZWNsYXJhdGlvbiwgdHlwZTogVHlwZSk6IHZvaWQge1xuICAgIHRoaXMudHlwZVJlcGxhY2VtZW50cy5zZXQoZGVjbGFyYXRpb24sIHR5cGUpO1xuICB9XG5cbiAgdHJhbnNmb3JtQ2xhc3NFbGVtZW50KGVsZW1lbnQ6IHRzLkNsYXNzRWxlbWVudCwgaW1wb3J0czogSW1wb3J0TWFuYWdlcik6IHRzLkNsYXNzRWxlbWVudCB7XG4gICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24oZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IG9yaWdpbmFsID0gdHMuZ2V0T3JpZ2luYWxOb2RlKGVsZW1lbnQsIHRzLmlzTWV0aG9kRGVjbGFyYXRpb24pO1xuICAgICAgaWYgKCF0aGlzLnR5cGVSZXBsYWNlbWVudHMuaGFzKG9yaWdpbmFsKSkge1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJldHVyblR5cGUgPSB0aGlzLnR5cGVSZXBsYWNlbWVudHMuZ2V0KG9yaWdpbmFsKSE7XG4gICAgICBjb25zdCB0c1JldHVyblR5cGUgPSB0cmFuc2xhdGVUeXBlKHJldHVyblR5cGUsIGltcG9ydHMpO1xuXG4gICAgICByZXR1cm4gdHMudXBkYXRlTWV0aG9kKFxuICAgICAgICAgIGVsZW1lbnQsIGVsZW1lbnQuZGVjb3JhdG9ycywgZWxlbWVudC5tb2RpZmllcnMsIGVsZW1lbnQuYXN0ZXJpc2tUb2tlbiwgZWxlbWVudC5uYW1lLFxuICAgICAgICAgIGVsZW1lbnQucXVlc3Rpb25Ub2tlbiwgZWxlbWVudC50eXBlUGFyYW1ldGVycywgZWxlbWVudC5wYXJhbWV0ZXJzLCB0c1JldHVyblR5cGUsXG4gICAgICAgICAgZWxlbWVudC5ib2R5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHRyYW5zZm9ybUZ1bmN0aW9uRGVjbGFyYXRpb24oZWxlbWVudDogdHMuRnVuY3Rpb25EZWNsYXJhdGlvbiwgaW1wb3J0czogSW1wb3J0TWFuYWdlcik6XG4gICAgICB0cy5GdW5jdGlvbkRlY2xhcmF0aW9uIHtcbiAgICBjb25zdCBvcmlnaW5hbCA9IHRzLmdldE9yaWdpbmFsTm9kZShlbGVtZW50KSBhcyB0cy5GdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgIGlmICghdGhpcy50eXBlUmVwbGFjZW1lbnRzLmhhcyhvcmlnaW5hbCkpIHtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICBjb25zdCByZXR1cm5UeXBlID0gdGhpcy50eXBlUmVwbGFjZW1lbnRzLmdldChvcmlnaW5hbCkhO1xuICAgIGNvbnN0IHRzUmV0dXJuVHlwZSA9IHRyYW5zbGF0ZVR5cGUocmV0dXJuVHlwZSwgaW1wb3J0cyk7XG5cbiAgICByZXR1cm4gdHMudXBkYXRlRnVuY3Rpb25EZWNsYXJhdGlvbihcbiAgICAgICAgLyogbm9kZSAqLyBlbGVtZW50LFxuICAgICAgICAvKiBkZWNvcmF0b3JzICovIGVsZW1lbnQuZGVjb3JhdG9ycyxcbiAgICAgICAgLyogbW9kaWZpZXJzICovIGVsZW1lbnQubW9kaWZpZXJzLFxuICAgICAgICAvKiBhc3Rlcmlza1Rva2VuICovIGVsZW1lbnQuYXN0ZXJpc2tUb2tlbixcbiAgICAgICAgLyogbmFtZSAqLyBlbGVtZW50Lm5hbWUsXG4gICAgICAgIC8qIHR5cGVQYXJhbWV0ZXJzICovIGVsZW1lbnQudHlwZVBhcmFtZXRlcnMsXG4gICAgICAgIC8qIHBhcmFtZXRlcnMgKi8gZWxlbWVudC5wYXJhbWV0ZXJzLFxuICAgICAgICAvKiB0eXBlICovIHRzUmV0dXJuVHlwZSxcbiAgICAgICAgLyogYm9keSAqLyBlbGVtZW50LmJvZHkpO1xuICB9XG59XG4iXX0=
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
        define("@angular/compiler-cli/src/transformers/lower_expressions", ["require", "exports", "tslib", "@angular/compiler", "typescript", "@angular/compiler-cli/src/metadata/index"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LowerMetadataTransform = exports.getExpressionLoweringTransformFactory = void 0;
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    var index_1 = require("@angular/compiler-cli/src/metadata/index");
    function toMap(items, select) {
        return new Map(items.map(function (i) { return [select(i), i]; }));
    }
    // We will never lower expressions in a nested lexical scope so avoid entering them.
    // This also avoids a bug in TypeScript 2.3 where the lexical scopes get out of sync
    // when using visitEachChild.
    function isLexicalScope(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ArrowFunction:
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.ClassExpression:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.TypeLiteral:
            case ts.SyntaxKind.ArrayType:
                return true;
        }
        return false;
    }
    function transformSourceFile(sourceFile, requests, context) {
        var inserts = [];
        // Calculate the range of interesting locations. The transform will only visit nodes in this
        // range to improve the performance on large files.
        var locations = Array.from(requests.keys());
        var min = Math.min.apply(Math, tslib_1.__spread(locations));
        var max = Math.max.apply(Math, tslib_1.__spread(locations));
        // Visit nodes matching the request and synthetic nodes added by tsickle
        function shouldVisit(pos, end) {
            return (pos <= max && end >= min) || pos == -1;
        }
        function visitSourceFile(sourceFile) {
            function topLevelStatement(node) {
                var declarations = [];
                function visitNode(node) {
                    // Get the original node before tsickle
                    var _a = ts.getOriginalNode(node), pos = _a.pos, end = _a.end, kind = _a.kind, originalParent = _a.parent;
                    var nodeRequest = requests.get(pos);
                    if (nodeRequest && nodeRequest.kind == kind && nodeRequest.end == end) {
                        // This node is requested to be rewritten as a reference to the exported name.
                        if (originalParent && originalParent.kind === ts.SyntaxKind.VariableDeclaration) {
                            // As the value represents the whole initializer of a variable declaration,
                            // just refer to that variable. This e.g. helps to preserve closure comments
                            // at the right place.
                            var varParent = originalParent;
                            if (varParent.name.kind === ts.SyntaxKind.Identifier) {
                                var varName = varParent.name.text;
                                var exportName_1 = nodeRequest.name;
                                declarations.push({
                                    name: exportName_1,
                                    node: ts.createIdentifier(varName),
                                    order: 1 /* AfterStmt */
                                });
                                return node;
                            }
                        }
                        // Record that the node needs to be moved to an exported variable with the given name
                        var exportName = nodeRequest.name;
                        declarations.push({ name: exportName, node: node, order: 0 /* BeforeStmt */ });
                        return ts.createIdentifier(exportName);
                    }
                    var result = node;
                    if (shouldVisit(pos, end) && !isLexicalScope(node)) {
                        result = ts.visitEachChild(node, visitNode, context);
                    }
                    return result;
                }
                // Get the original node before tsickle
                var _a = ts.getOriginalNode(node), pos = _a.pos, end = _a.end;
                var resultStmt;
                if (shouldVisit(pos, end)) {
                    resultStmt = ts.visitEachChild(node, visitNode, context);
                }
                else {
                    resultStmt = node;
                }
                if (declarations.length) {
                    inserts.push({ relativeTo: resultStmt, declarations: declarations });
                }
                return resultStmt;
            }
            var newStatements = sourceFile.statements.map(topLevelStatement);
            if (inserts.length) {
                // Insert the declarations relative to the rewritten statement that references them.
                var insertMap_1 = toMap(inserts, function (i) { return i.relativeTo; });
                var tmpStatements_1 = [];
                newStatements.forEach(function (statement) {
                    var insert = insertMap_1.get(statement);
                    if (insert) {
                        var before = insert.declarations.filter(function (d) { return d.order === 0 /* BeforeStmt */; });
                        if (before.length) {
                            tmpStatements_1.push(createVariableStatementForDeclarations(before));
                        }
                        tmpStatements_1.push(statement);
                        var after = insert.declarations.filter(function (d) { return d.order === 1 /* AfterStmt */; });
                        if (after.length) {
                            tmpStatements_1.push(createVariableStatementForDeclarations(after));
                        }
                    }
                    else {
                        tmpStatements_1.push(statement);
                    }
                });
                // Insert an exports clause to export the declarations
                tmpStatements_1.push(ts.createExportDeclaration(
                /* decorators */ undefined, 
                /* modifiers */ undefined, ts.createNamedExports(inserts
                    .reduce(function (accumulator, insert) { return tslib_1.__spread(accumulator, insert.declarations); }, [])
                    .map(function (declaration) { return ts.createExportSpecifier(
                /* propertyName */ undefined, declaration.name); }))));
                newStatements = tmpStatements_1;
            }
            var newSf = ts.updateSourceFileNode(sourceFile, ts.setTextRange(ts.createNodeArray(newStatements), sourceFile.statements));
            if (!(sourceFile.flags & ts.NodeFlags.Synthesized)) {
                newSf.flags &= ~ts.NodeFlags.Synthesized;
            }
            return newSf;
        }
        return visitSourceFile(sourceFile);
    }
    function createVariableStatementForDeclarations(declarations) {
        var varDecls = declarations.map(function (i) { return ts.createVariableDeclaration(i.name, /* type */ undefined, i.node); });
        return ts.createVariableStatement(
        /* modifiers */ undefined, ts.createVariableDeclarationList(varDecls, ts.NodeFlags.Const));
    }
    function getExpressionLoweringTransformFactory(requestsMap, program) {
        // Return the factory
        return function (context) { return function (sourceFile) {
            // We need to use the original SourceFile for reading metadata, and not the transformed one.
            var originalFile = program.getSourceFile(sourceFile.fileName);
            if (originalFile) {
                var requests = requestsMap.getRequests(originalFile);
                if (requests && requests.size) {
                    return transformSourceFile(sourceFile, requests, context);
                }
            }
            return sourceFile;
        }; };
    }
    exports.getExpressionLoweringTransformFactory = getExpressionLoweringTransformFactory;
    function isEligibleForLowering(node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.SourceFile:
                case ts.SyntaxKind.Decorator:
                    // Lower expressions that are local to the module scope or
                    // in a decorator.
                    return true;
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.FunctionDeclaration:
                    // Don't lower expressions in a declaration.
                    return false;
                case ts.SyntaxKind.VariableDeclaration:
                    var isExported = (ts.getCombinedModifierFlags(node) &
                        ts.ModifierFlags.Export) == 0;
                    // This might be unnecessary, as the variable might be exported and only used as a reference
                    // in another expression. However, the variable also might be involved in provider
                    // definitions. If that's the case, there is a specific token (`ROUTES`) which the compiler
                    // attempts to understand deeply. Sub-expressions within that token (`loadChildren` for
                    // example) might also require lowering even if the top-level declaration is already
                    // properly exported.
                    var varNode = node;
                    return isExported ||
                        (varNode.initializer !== undefined &&
                            (ts.isObjectLiteralExpression(varNode.initializer) ||
                                ts.isArrayLiteralExpression(varNode.initializer) ||
                                ts.isCallExpression(varNode.initializer)));
            }
            return isEligibleForLowering(node.parent);
        }
        return true;
    }
    function isPrimitive(value) {
        return Object(value) !== value;
    }
    function isRewritten(value) {
        return index_1.isMetadataGlobalReferenceExpression(value) && compiler_1.isLoweredSymbol(value.name);
    }
    function isLiteralFieldNamed(node, names) {
        if (node.parent && node.parent.kind == ts.SyntaxKind.PropertyAssignment) {
            var property = node.parent;
            if (property.parent && property.parent.kind == ts.SyntaxKind.ObjectLiteralExpression &&
                property.name && property.name.kind == ts.SyntaxKind.Identifier) {
                var propertyName = property.name;
                return names.has(propertyName.text);
            }
        }
        return false;
    }
    var LowerMetadataTransform = /** @class */ (function () {
        function LowerMetadataTransform(lowerableFieldNames) {
            this.requests = new Map();
            this.lowerableFieldNames = new Set(lowerableFieldNames);
        }
        // RequestMap
        LowerMetadataTransform.prototype.getRequests = function (sourceFile) {
            var result = this.requests.get(sourceFile.fileName);
            if (!result) {
                // Force the metadata for this source file to be collected which
                // will recursively call start() populating the request map;
                this.cache.getMetadata(sourceFile);
                // If we still don't have the requested metadata, the file is not a module
                // or is a declaration file so return an empty map.
                result = this.requests.get(sourceFile.fileName) || new Map();
            }
            return result;
        };
        // MetadataTransformer
        LowerMetadataTransform.prototype.connect = function (cache) {
            this.cache = cache;
        };
        LowerMetadataTransform.prototype.start = function (sourceFile) {
            var _this = this;
            var identNumber = 0;
            var freshIdent = function () { return compiler_1.createLoweredSymbol(identNumber++); };
            var requests = new Map();
            this.requests.set(sourceFile.fileName, requests);
            var replaceNode = function (node) {
                var name = freshIdent();
                requests.set(node.pos, { name: name, kind: node.kind, location: node.pos, end: node.end });
                return { __symbolic: 'reference', name: name };
            };
            var isExportedSymbol = (function () {
                var exportTable;
                return function (node) {
                    if (node.kind == ts.SyntaxKind.Identifier) {
                        var ident = node;
                        if (!exportTable) {
                            exportTable = createExportTableFor(sourceFile);
                        }
                        return exportTable.has(ident.text);
                    }
                    return false;
                };
            })();
            var isExportedPropertyAccess = function (node) {
                if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
                    var pae = node;
                    if (isExportedSymbol(pae.expression)) {
                        return true;
                    }
                }
                return false;
            };
            var hasLowerableParentCache = new Map();
            var shouldBeLowered = function (node) {
                if (node === undefined) {
                    return false;
                }
                var lowerable = false;
                if ((node.kind === ts.SyntaxKind.ArrowFunction ||
                    node.kind === ts.SyntaxKind.FunctionExpression) &&
                    isEligibleForLowering(node)) {
                    lowerable = true;
                }
                else if (isLiteralFieldNamed(node, _this.lowerableFieldNames) && isEligibleForLowering(node) &&
                    !isExportedSymbol(node) && !isExportedPropertyAccess(node)) {
                    lowerable = true;
                }
                return lowerable;
            };
            var hasLowerableParent = function (node) {
                if (node === undefined) {
                    return false;
                }
                if (!hasLowerableParentCache.has(node)) {
                    hasLowerableParentCache.set(node, shouldBeLowered(node.parent) || hasLowerableParent(node.parent));
                }
                return hasLowerableParentCache.get(node);
            };
            var isLowerable = function (node) {
                if (node === undefined) {
                    return false;
                }
                return shouldBeLowered(node) && !hasLowerableParent(node);
            };
            return function (value, node) {
                if (!isPrimitive(value) && !isRewritten(value) && isLowerable(node)) {
                    return replaceNode(node);
                }
                return value;
            };
        };
        return LowerMetadataTransform;
    }());
    exports.LowerMetadataTransform = LowerMetadataTransform;
    function createExportTableFor(sourceFile) {
        var exportTable = new Set();
        // Lazily collect all the exports from the source file
        ts.forEachChild(sourceFile, function scan(node) {
            var e_1, _a;
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                    if ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) != 0) {
                        var classDeclaration = node;
                        var name = classDeclaration.name;
                        if (name)
                            exportTable.add(name.text);
                    }
                    break;
                case ts.SyntaxKind.VariableStatement:
                    var variableStatement = node;
                    try {
                        for (var _b = tslib_1.__values(variableStatement.declarationList.declarations), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var declaration = _c.value;
                            scan(declaration);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    break;
                case ts.SyntaxKind.VariableDeclaration:
                    var variableDeclaration = node;
                    if ((ts.getCombinedModifierFlags(variableDeclaration) & ts.ModifierFlags.Export) != 0 &&
                        variableDeclaration.name.kind == ts.SyntaxKind.Identifier) {
                        var name = variableDeclaration.name;
                        exportTable.add(name.text);
                    }
                    break;
                case ts.SyntaxKind.ExportDeclaration:
                    var exportDeclaration = node;
                    var moduleSpecifier = exportDeclaration.moduleSpecifier, exportClause = exportDeclaration.exportClause;
                    if (!moduleSpecifier && exportClause && ts.isNamedExports(exportClause)) {
                        exportClause.elements.forEach(function (spec) {
                            exportTable.add(spec.name.text);
                        });
                    }
            }
        });
        return exportTable;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG93ZXJfZXhwcmVzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL3RyYW5zZm9ybWVycy9sb3dlcl9leHByZXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXVFO0lBQ3ZFLCtCQUFpQztJQUVqQyxrRUFBMEk7SUE2QjFJLFNBQVMsS0FBSyxDQUFPLEtBQVUsRUFBRSxNQUFzQjtRQUNyRCxPQUFPLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQVMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBZCxDQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxvRkFBb0Y7SUFDcEYsb0ZBQW9GO0lBQ3BGLDZCQUE2QjtJQUM3QixTQUFTLGNBQWMsQ0FBQyxJQUFhO1FBQ25DLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNqQixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1lBQ2pDLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQztZQUN0QyxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUM7WUFDdkMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQztZQUNuQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7WUFDcEMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUNoQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQy9CLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTO2dCQUMxQixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixD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QyxFQUFFO3dCQUN2RSxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7NEJBQ2hDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDbEMsQ0FBQyxDQUFDLENBQUM7cUJBQ0o7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NyZWF0ZUxvd2VyZWRTeW1ib2wsIGlzTG93ZXJlZFN5bWJvbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Q29sbGVjdG9yT3B0aW9ucywgaXNNZXRhZGF0YUdsb2JhbFJlZmVyZW5jZUV4cHJlc3Npb24sIE1ldGFkYXRhQ29sbGVjdG9yLCBNZXRhZGF0YVZhbHVlLCBNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi4vbWV0YWRhdGEvaW5kZXgnO1xuXG5pbXBvcnQge01ldGFkYXRhQ2FjaGUsIE1ldGFkYXRhVHJhbnNmb3JtZXIsIFZhbHVlVHJhbnNmb3JtfSBmcm9tICcuL21ldGFkYXRhX2NhY2hlJztcblxuZXhwb3J0IGludGVyZmFjZSBMb3dlcmluZ1JlcXVlc3Qge1xuICBraW5kOiB0cy5TeW50YXhLaW5kO1xuICBsb2NhdGlvbjogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBSZXF1ZXN0TG9jYXRpb25NYXAgPSBNYXA8bnVtYmVyLCBMb3dlcmluZ1JlcXVlc3Q+O1xuXG5jb25zdCBlbnVtIERlY2xhcmF0aW9uT3JkZXIge1xuICBCZWZvcmVTdG10LFxuICBBZnRlclN0bXRcbn1cblxuaW50ZXJmYWNlIERlY2xhcmF0aW9uIHtcbiAgbmFtZTogc3RyaW5nO1xuICBub2RlOiB0cy5Ob2RlO1xuICBvcmRlcjogRGVjbGFyYXRpb25PcmRlcjtcbn1cblxuaW50ZXJmYWNlIERlY2xhcmF0aW9uSW5zZXJ0IHtcbiAgZGVjbGFyYXRpb25zOiBEZWNsYXJhdGlvbltdO1xuICByZWxhdGl2ZVRvOiB0cy5Ob2RlO1xufVxuXG5mdW5jdGlvbiB0b01hcDxULCBLPihpdGVtczogVFtdLCBzZWxlY3Q6IChpdGVtOiBUKSA9PiBLKTogTWFwPEssIFQ+IHtcbiAgcmV0dXJuIG5ldyBNYXAoaXRlbXMubWFwPFtLLCBUXT4oaSA9PiBbc2VsZWN0KGkpLCBpXSkpO1xufVxuXG4vLyBXZSB3aWxsIG5ldmVyIGxvd2VyIGV4cHJlc3Npb25zIGluIGEgbmVzdGVkIGxleGljYWwgc2NvcGUgc28gYXZvaWQgZW50ZXJpbmcgdGhlbS5cbi8vIFRoaXMgYWxzbyBhdm9pZHMgYSBidWcgaW4gVHlwZVNjcmlwdCAyLjMgd2hlcmUgdGhlIGxleGljYWwgc2NvcGVzIGdldCBvdXQgb2Ygc3luY1xuLy8gd2hlbiB1c2luZyB2aXNpdEVhY2hDaGlsZC5cbmZ1bmN0aW9uIGlzTGV4aWNhbFNjb3BlKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuQXJyb3dGdW5jdGlvbjpcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuRnVuY3Rpb25FeHByZXNzaW9uOlxuICAgIGNhc2UgdHMuU3ludGF4S2luZC5GdW5jdGlvbkRlY2xhcmF0aW9uOlxuICAgIGNhc2UgdHMuU3ludGF4S2luZC5DbGFzc0V4cHJlc3Npb246XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb246XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uVHlwZTpcbiAgICBjYXNlIHRzLlN5bnRheEtpbmQuVHlwZUxpdGVyYWw6XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLkFycmF5VHlwZTpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtU291cmNlRmlsZShcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCByZXF1ZXN0czogUmVxdWVzdExvY2F0aW9uTWFwLFxuICAgIGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCk6IHRzLlNvdXJjZUZpbGUge1xuICBjb25zdCBpbnNlcnRzOiBEZWNsYXJhdGlvbkluc2VydFtdID0gW107XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSByYW5nZSBvZiBpbnRlcmVzdGluZyBsb2NhdGlvbnMuIFRoZSB0cmFuc2Zvcm0gd2lsbCBvbmx5IHZpc2l0IG5vZGVzIGluIHRoaXNcbiAgLy8gcmFuZ2UgdG8gaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2Ugb24gbGFyZ2UgZmlsZXMuXG4gIGNvbnN0IGxvY2F0aW9ucyA9IEFycmF5LmZyb20ocmVxdWVzdHMua2V5cygpKTtcbiAgY29uc3QgbWluID0gTWF0aC5taW4oLi4ubG9jYXRpb25zKTtcbiAgY29uc3QgbWF4ID0gTWF0aC5tYXgoLi4ubG9jYXRpb25zKTtcblxuICAvLyBWaXNpdCBub2RlcyBtYXRjaGluZyB0aGUgcmVxdWVzdCBhbmQgc3ludGhldGljIG5vZGVzIGFkZGVkIGJ5IHRzaWNrbGVcbiAgZnVuY3Rpb24gc2hvdWxkVmlzaXQocG9zOiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChwb3MgPD0gbWF4ICYmIGVuZCA+PSBtaW4pIHx8IHBvcyA9PSAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZpc2l0U291cmNlRmlsZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuU291cmNlRmlsZSB7XG4gICAgZnVuY3Rpb24gdG9wTGV2ZWxTdGF0ZW1lbnQobm9kZTogdHMuU3RhdGVtZW50KTogdHMuU3RhdGVtZW50IHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uczogRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gICAgICBmdW5jdGlvbiB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHRzLk5vZGUge1xuICAgICAgICAvLyBHZXQgdGhlIG9yaWdpbmFsIG5vZGUgYmVmb3JlIHRzaWNrbGVcbiAgICAgICAgY29uc3Qge3BvcywgZW5kLCBraW5kLCBwYXJlbnQ6IG9yaWdpbmFsUGFyZW50fSA9IHRzLmdldE9yaWdpbmFsTm9kZShub2RlKTtcbiAgICAgICAgY29uc3Qgbm9kZVJlcXVlc3QgPSByZXF1ZXN0cy5nZXQocG9zKTtcbiAgICAgICAgaWYgKG5vZGVSZXF1ZXN0ICYmIG5vZGVSZXF1ZXN0LmtpbmQgPT0ga2luZCAmJiBub2RlUmVxdWVzdC5lbmQgPT0gZW5kKSB7XG4gICAgICAgICAgLy8gVGhpcyBub2RlIGlzIHJlcXVlc3RlZCB0byBiZSByZXdyaXR0ZW4gYXMgYSByZWZlcmVuY2UgdG8gdGhlIGV4cG9ydGVkIG5hbWUuXG4gICAgICAgICAgaWYgKG9yaWdpbmFsUGFyZW50ICYmIG9yaWdpbmFsUGFyZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVmFyaWFibGVEZWNsYXJhdGlvbikge1xuICAgICAgICAgICAgLy8gQXMgdGhlIHZhbHVlIHJlcHJlc2VudHMgdGhlIHdob2xlIGluaXRpYWxpemVyIG9mIGEgdmFyaWFibGUgZGVjbGFyYXRpb24sXG4gICAgICAgICAgICAvLyBqdXN0IHJlZmVyIHRvIHRoYXQgdmFyaWFibGUuIFRoaXMgZS5nLiBoZWxwcyB0byBwcmVzZXJ2ZSBjbG9zdXJlIGNvbW1lbnRzXG4gICAgICAgICAgICAvLyBhdCB0aGUgcmlnaHQgcGxhY2UuXG4gICAgICAgICAgICBjb25zdCB2YXJQYXJlbnQgPSBvcmlnaW5hbFBhcmVudCBhcyB0cy5WYXJpYWJsZURlY2xhcmF0aW9uO1xuICAgICAgICAgICAgaWYgKHZhclBhcmVudC5uYW1lLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICBjb25zdCB2YXJOYW1lID0gdmFyUGFyZW50Lm5hbWUudGV4dDtcbiAgICAgICAgICAgICAgY29uc3QgZXhwb3J0TmFtZSA9IG5vZGVSZXF1ZXN0Lm5hbWU7XG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBleHBvcnROYW1lLFxuICAgICAgICAgICAgICAgIG5vZGU6IHRzLmNyZWF0ZUlkZW50aWZpZXIodmFyTmFtZSksXG4gICAgICAgICAgICAgICAgb3JkZXI6IERlY2xhcmF0aW9uT3JkZXIuQWZ0ZXJTdG10XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVjb3JkIHRoYXQgdGhlIG5vZGUgbmVlZHMgdG8gYmUgbW92ZWQgdG8gYW4gZXhwb3J0ZWQgdmFyaWFibGUgd2l0aCB0aGUgZ2l2ZW4gbmFtZVxuICAgICAgICAgIGNvbnN0IGV4cG9ydE5hbWUgPSBub2RlUmVxdWVzdC5uYW1lO1xuICAgICAgICAgIGRlY2xhcmF0aW9ucy5wdXNoKHtuYW1lOiBleHBvcnROYW1lLCBub2RlLCBvcmRlcjogRGVjbGFyYXRpb25PcmRlci5CZWZvcmVTdG10fSk7XG4gICAgICAgICAgcmV0dXJuIHRzLmNyZWF0ZUlkZW50aWZpZXIoZXhwb3J0TmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdCA9IG5vZGU7XG4gICAgICAgIGlmIChzaG91bGRWaXNpdChwb3MsIGVuZCkgJiYgIWlzTGV4aWNhbFNjb3BlKG5vZGUpKSB7XG4gICAgICAgICAgcmVzdWx0ID0gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICAvLyBHZXQgdGhlIG9yaWdpbmFsIG5vZGUgYmVmb3JlIHRzaWNrbGVcbiAgICAgIGNvbnN0IHtwb3MsIGVuZH0gPSB0cy5nZXRPcmlnaW5hbE5vZGUobm9kZSk7XG4gICAgICBsZXQgcmVzdWx0U3RtdDogdHMuU3RhdGVtZW50O1xuICAgICAgaWYgKHNob3VsZFZpc2l0KHBvcywgZW5kKSkge1xuICAgICAgICByZXN1bHRTdG10ID0gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlLCBjb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFN0bXQgPSBub2RlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgICAgICBpbnNlcnRzLnB1c2goe3JlbGF0aXZlVG86IHJlc3VsdFN0bXQsIGRlY2xhcmF0aW9uc30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdFN0bXQ7XG4gICAgfVxuXG4gICAgbGV0IG5ld1N0YXRlbWVudHMgPSBzb3VyY2VGaWxlLnN0YXRlbWVudHMubWFwKHRvcExldmVsU3RhdGVtZW50KTtcblxuICAgIGlmIChpbnNlcnRzLmxlbmd0aCkge1xuICAgICAgLy8gSW5zZXJ0IHRoZSBkZWNsYXJhdGlvbnMgcmVsYXRpdmUgdG8gdGhlIHJld3JpdHRlbiBzdGF0ZW1lbnQgdGhhdCByZWZlcmVuY2VzIHRoZW0uXG4gICAgICBjb25zdCBpbnNlcnRNYXAgPSB0b01hcChpbnNlcnRzLCBpID0+IGkucmVsYXRpdmVUbyk7XG4gICAgICBjb25zdCB0bXBTdGF0ZW1lbnRzOiB0cy5TdGF0ZW1lbnRbXSA9IFtdO1xuICAgICAgbmV3U3RhdGVtZW50cy5mb3JFYWNoKHN0YXRlbWVudCA9PiB7XG4gICAgICAgIGNvbnN0IGluc2VydCA9IGluc2VydE1hcC5nZXQoc3RhdGVtZW50KTtcbiAgICAgICAgaWYgKGluc2VydCkge1xuICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IGluc2VydC5kZWNsYXJhdGlvbnMuZmlsdGVyKGQgPT4gZC5vcmRlciA9PT0gRGVjbGFyYXRpb25PcmRlci5CZWZvcmVTdG10KTtcbiAgICAgICAgICBpZiAoYmVmb3JlLmxlbmd0aCkge1xuICAgICAgICAgICAgdG1wU3RhdGVtZW50cy5wdXNoKGNyZWF0ZVZhcmlhYmxlU3RhdGVtZW50Rm9yRGVjbGFyYXRpb25zKGJlZm9yZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0bXBTdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcbiAgICAgICAgICBjb25zdCBhZnRlciA9IGluc2VydC5kZWNsYXJhdGlvbnMuZmlsdGVyKGQgPT4gZC5vcmRlciA9PT0gRGVjbGFyYXRpb25PcmRlci5BZnRlclN0bXQpO1xuICAgICAgICAgIGlmIChhZnRlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRtcFN0YXRlbWVudHMucHVzaChjcmVhdGVWYXJpYWJsZVN0YXRlbWVudEZvckRlY2xhcmF0aW9ucyhhZnRlcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0bXBTdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEluc2VydCBhbiBleHBvcnRzIGNsYXVzZSB0byBleHBvcnQgdGhlIGRlY2xhcmF0aW9uc1xuICAgICAgdG1wU3RhdGVtZW50cy5wdXNoKHRzLmNyZWF0ZUV4cG9ydERlY2xhcmF0aW9uKFxuICAgICAgICAgIC8qIGRlY29yYXRvcnMgKi8gdW5kZWZpbmVkLFxuICAgICAgICAgIC8qIG1vZGlmaWVycyAqLyB1bmRlZmluZWQsXG4gICAgICAgICAgdHMuY3JlYXRlTmFtZWRFeHBvcnRzKFxuICAgICAgICAgICAgICBpbnNlcnRzXG4gICAgICAgICAgICAgICAgICAucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgIChhY2N1bXVsYXRvciwgaW5zZXJ0KSA9PiBbLi4uYWNjdW11bGF0b3IsIC4uLmluc2VydC5kZWNsYXJhdGlvbnNdLFxuICAgICAgICAgICAgICAgICAgICAgIFtdIGFzIERlY2xhcmF0aW9uW10pXG4gICAgICAgICAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uID0+IHRzLmNyZWF0ZUV4cG9ydFNwZWNpZmllcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcHJvcGVydHlOYW1lICovIHVuZGVmaW5lZCwgZGVjbGFyYXRpb24ubmFtZSkpKSkpO1xuXG4gICAgICBuZXdTdGF0ZW1lbnRzID0gdG1wU3RhdGVtZW50cztcbiAgICB9XG5cbiAgICBjb25zdCBuZXdTZiA9IHRzLnVwZGF0ZVNvdXJjZUZpbGVOb2RlKFxuICAgICAgICBzb3VyY2VGaWxlLCB0cy5zZXRUZXh0UmFuZ2UodHMuY3JlYXRlTm9kZUFycmF5KG5ld1N0YXRlbWVudHMpLCBzb3VyY2VGaWxlLnN0YXRlbWVudHMpKTtcbiAgICBpZiAoIShzb3VyY2VGaWxlLmZsYWdzICYgdHMuTm9kZUZsYWdzLlN5bnRoZXNpemVkKSkge1xuICAgICAgKG5ld1NmLmZsYWdzIGFzIHRzLk5vZGVGbGFncykgJj0gfnRzLk5vZGVGbGFncy5TeW50aGVzaXplZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3U2Y7XG4gIH1cblxuICByZXR1cm4gdmlzaXRTb3VyY2VGaWxlKHNvdXJjZUZpbGUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWYXJpYWJsZVN0YXRlbWVudEZvckRlY2xhcmF0aW9ucyhkZWNsYXJhdGlvbnM6IERlY2xhcmF0aW9uW10pOiB0cy5WYXJpYWJsZVN0YXRlbWVudCB7XG4gIGNvbnN0IHZhckRlY2xzID0gZGVjbGFyYXRpb25zLm1hcChcbiAgICAgIGkgPT4gdHMuY3JlYXRlVmFyaWFibGVEZWNsYXJhdGlvbihpLm5hbWUsIC8qIHR5cGUgKi8gdW5kZWZpbmVkLCBpLm5vZGUgYXMgdHMuRXhwcmVzc2lvbikpO1xuICByZXR1cm4gdHMuY3JlYXRlVmFyaWFibGVTdGF0ZW1lbnQoXG4gICAgICAvKiBtb2RpZmllcnMgKi8gdW5kZWZpbmVkLCB0cy5jcmVhdGVWYXJpYWJsZURlY2xhcmF0aW9uTGlzdCh2YXJEZWNscywgdHMuTm9kZUZsYWdzLkNvbnN0KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHByZXNzaW9uTG93ZXJpbmdUcmFuc2Zvcm1GYWN0b3J5KFxuICAgIHJlcXVlc3RzTWFwOiBSZXF1ZXN0c01hcCwgcHJvZ3JhbTogdHMuUHJvZ3JhbSk6IChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpID0+XG4gICAgKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpID0+IHRzLlNvdXJjZUZpbGUge1xuICAvLyBSZXR1cm4gdGhlIGZhY3RvcnlcbiAgcmV0dXJuIChjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpID0+IChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuU291cmNlRmlsZSA9PiB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgdGhlIG9yaWdpbmFsIFNvdXJjZUZpbGUgZm9yIHJlYWRpbmcgbWV0YWRhdGEsIGFuZCBub3QgdGhlIHRyYW5zZm9ybWVkIG9uZS5cbiAgICBjb25zdCBvcmlnaW5hbEZpbGUgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgaWYgKG9yaWdpbmFsRmlsZSkge1xuICAgICAgY29uc3QgcmVxdWVzdHMgPSByZXF1ZXN0c01hcC5nZXRSZXF1ZXN0cyhvcmlnaW5hbEZpbGUpO1xuICAgICAgaWYgKHJlcXVlc3RzICYmIHJlcXVlc3RzLnNpemUpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVNvdXJjZUZpbGUoc291cmNlRmlsZSwgcmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlRmlsZTtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0c01hcCB7XG4gIGdldFJlcXVlc3RzKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBSZXF1ZXN0TG9jYXRpb25NYXA7XG59XG5cbmZ1bmN0aW9uIGlzRWxpZ2libGVGb3JMb3dlcmluZyhub2RlOiB0cy5Ob2RlfHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICBpZiAobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuU291cmNlRmlsZTpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5EZWNvcmF0b3I6XG4gICAgICAgIC8vIExvd2VyIGV4cHJlc3Npb25zIHRoYXQgYXJlIGxvY2FsIHRvIHRoZSBtb2R1bGUgc2NvcGUgb3JcbiAgICAgICAgLy8gaW4gYSBkZWNvcmF0b3IuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb246XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuSW50ZXJmYWNlRGVjbGFyYXRpb246XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuRW51bURlY2xhcmF0aW9uOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uRGVjbGFyYXRpb246XG4gICAgICAgIC8vIERvbid0IGxvd2VyIGV4cHJlc3Npb25zIGluIGEgZGVjbGFyYXRpb24uXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5WYXJpYWJsZURlY2xhcmF0aW9uOlxuICAgICAgICBjb25zdCBpc0V4cG9ydGVkID0gKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlIGFzIHRzLlZhcmlhYmxlRGVjbGFyYXRpb24pICZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cy5Nb2RpZmllckZsYWdzLkV4cG9ydCkgPT0gMDtcbiAgICAgICAgLy8gVGhpcyBtaWdodCBiZSB1bm5lY2Vzc2FyeSwgYXMgdGhlIHZhcmlhYmxlIG1pZ2h0IGJlIGV4cG9ydGVkIGFuZCBvbmx5IHVzZWQgYXMgYSByZWZlcmVuY2VcbiAgICAgICAgLy8gaW4gYW5vdGhlciBleHByZXNzaW9uLiBIb3dldmVyLCB0aGUgdmFyaWFibGUgYWxzbyBtaWdodCBiZSBpbnZvbHZlZCBpbiBwcm92aWRlclxuICAgICAgICAvLyBkZWZpbml0aW9ucy4gSWYgdGhhdCdzIHRoZSBjYXNlLCB0aGVyZSBpcyBhIHNwZWNpZmljIHRva2VuIChgUk9VVEVTYCkgd2hpY2ggdGhlIGNvbXBpbGVyXG4gICAgICAgIC8vIGF0dGVtcHRzIHRvIHVuZGVyc3RhbmQgZGVlcGx5LiBTdWItZXhwcmVzc2lvbnMgd2l0aGluIHRoYXQgdG9rZW4gKGBsb2FkQ2hpbGRyZW5gIGZvclxuICAgICAgICAvLyBleGFtcGxlKSBtaWdodCBhbHNvIHJlcXVpcmUgbG93ZXJpbmcgZXZlbiBpZiB0aGUgdG9wLWxldmVsIGRlY2xhcmF0aW9uIGlzIGFscmVhZHlcbiAgICAgICAgLy8gcHJvcGVybHkgZXhwb3J0ZWQuXG4gICAgICAgIGNvbnN0IHZhck5vZGUgPSBub2RlIGFzIHRzLlZhcmlhYmxlRGVjbGFyYXRpb247XG4gICAgICAgIHJldHVybiBpc0V4cG9ydGVkIHx8XG4gICAgICAgICAgICAodmFyTm9kZS5pbml0aWFsaXplciAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24odmFyTm9kZS5pbml0aWFsaXplcikgfHxcbiAgICAgICAgICAgICAgdHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKHZhck5vZGUuaW5pdGlhbGl6ZXIpIHx8XG4gICAgICAgICAgICAgIHRzLmlzQ2FsbEV4cHJlc3Npb24odmFyTm9kZS5pbml0aWFsaXplcikpKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRWxpZ2libGVGb3JMb3dlcmluZyhub2RlLnBhcmVudCk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIE9iamVjdCh2YWx1ZSkgIT09IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc1Jld3JpdHRlbih2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc01ldGFkYXRhR2xvYmFsUmVmZXJlbmNlRXhwcmVzc2lvbih2YWx1ZSkgJiYgaXNMb3dlcmVkU3ltYm9sKHZhbHVlLm5hbWUpO1xufVxuXG5mdW5jdGlvbiBpc0xpdGVyYWxGaWVsZE5hbWVkKG5vZGU6IHRzLk5vZGUsIG5hbWVzOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICBpZiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQua2luZCA9PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QXNzaWdubWVudCkge1xuICAgIGNvbnN0IHByb3BlcnR5ID0gbm9kZS5wYXJlbnQgYXMgdHMuUHJvcGVydHlBc3NpZ25tZW50O1xuICAgIGlmIChwcm9wZXJ0eS5wYXJlbnQgJiYgcHJvcGVydHkucGFyZW50LmtpbmQgPT0gdHMuU3ludGF4S2luZC5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiAmJlxuICAgICAgICBwcm9wZXJ0eS5uYW1lICYmIHByb3BlcnR5Lm5hbWUua2luZCA9PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BlcnR5Lm5hbWUgYXMgdHMuSWRlbnRpZmllcjtcbiAgICAgIHJldHVybiBuYW1lcy5oYXMocHJvcGVydHlOYW1lLnRleHQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBjbGFzcyBMb3dlck1ldGFkYXRhVHJhbnNmb3JtIGltcGxlbWVudHMgUmVxdWVzdHNNYXAsIE1ldGFkYXRhVHJhbnNmb3JtZXIge1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBjYWNoZSE6IE1ldGFkYXRhQ2FjaGU7XG4gIHByaXZhdGUgcmVxdWVzdHMgPSBuZXcgTWFwPHN0cmluZywgUmVxdWVzdExvY2F0aW9uTWFwPigpO1xuICBwcml2YXRlIGxvd2VyYWJsZUZpZWxkTmFtZXM6IFNldDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKGxvd2VyYWJsZUZpZWxkTmFtZXM6IHN0cmluZ1tdKSB7XG4gICAgdGhpcy5sb3dlcmFibGVGaWVsZE5hbWVzID0gbmV3IFNldDxzdHJpbmc+KGxvd2VyYWJsZUZpZWxkTmFtZXMpO1xuICB9XG5cbiAgLy8gUmVxdWVzdE1hcFxuICBnZXRSZXF1ZXN0cyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogUmVxdWVzdExvY2F0aW9uTWFwIHtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5yZXF1ZXN0cy5nZXQoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIC8vIEZvcmNlIHRoZSBtZXRhZGF0YSBmb3IgdGhpcyBzb3VyY2UgZmlsZSB0byBiZSBjb2xsZWN0ZWQgd2hpY2hcbiAgICAgIC8vIHdpbGwgcmVjdXJzaXZlbHkgY2FsbCBzdGFydCgpIHBvcHVsYXRpbmcgdGhlIHJlcXVlc3QgbWFwO1xuICAgICAgdGhpcy5jYWNoZS5nZXRNZXRhZGF0YShzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gSWYgd2Ugc3RpbGwgZG9uJ3QgaGF2ZSB0aGUgcmVxdWVzdGVkIG1ldGFkYXRhLCB0aGUgZmlsZSBpcyBub3QgYSBtb2R1bGVcbiAgICAgIC8vIG9yIGlzIGEgZGVjbGFyYXRpb24gZmlsZSBzbyByZXR1cm4gYW4gZW1wdHkgbWFwLlxuICAgICAgcmVzdWx0ID0gdGhpcy5yZXF1ZXN0cy5nZXQoc291cmNlRmlsZS5maWxlTmFtZSkgfHwgbmV3IE1hcDxudW1iZXIsIExvd2VyaW5nUmVxdWVzdD4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIE1ldGFkYXRhVHJhbnNmb3JtZXJcbiAgY29ubmVjdChjYWNoZTogTWV0YWRhdGFDYWNoZSk6IHZvaWQge1xuICAgIHRoaXMuY2FjaGUgPSBjYWNoZTtcbiAgfVxuXG4gIHN0YXJ0KHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBWYWx1ZVRyYW5zZm9ybXx1bmRlZmluZWQge1xuICAgIGxldCBpZGVudE51bWJlciA9IDA7XG4gICAgY29uc3QgZnJlc2hJZGVudCA9ICgpID0+IGNyZWF0ZUxvd2VyZWRTeW1ib2woaWRlbnROdW1iZXIrKyk7XG4gICAgY29uc3QgcmVxdWVzdHMgPSBuZXcgTWFwPG51bWJlciwgTG93ZXJpbmdSZXF1ZXN0PigpO1xuICAgIHRoaXMucmVxdWVzdHMuc2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUsIHJlcXVlc3RzKTtcblxuICAgIGNvbnN0IHJlcGxhY2VOb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBmcmVzaElkZW50KCk7XG4gICAgICByZXF1ZXN0cy5zZXQobm9kZS5wb3MsIHtuYW1lLCBraW5kOiBub2RlLmtpbmQsIGxvY2F0aW9uOiBub2RlLnBvcywgZW5kOiBub2RlLmVuZH0pO1xuICAgICAgcmV0dXJuIHtfX3N5bWJvbGljOiAncmVmZXJlbmNlJywgbmFtZX07XG4gICAgfTtcblxuICAgIGNvbnN0IGlzRXhwb3J0ZWRTeW1ib2wgPSAoKCkgPT4ge1xuICAgICAgbGV0IGV4cG9ydFRhYmxlOiBTZXQ8c3RyaW5nPjtcbiAgICAgIHJldHVybiAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgICBpZiAobm9kZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICAgIGNvbnN0IGlkZW50ID0gbm9kZSBhcyB0cy5JZGVudGlmaWVyO1xuXG4gICAgICAgICAgaWYgKCFleHBvcnRUYWJsZSkge1xuICAgICAgICAgICAgZXhwb3J0VGFibGUgPSBjcmVhdGVFeHBvcnRUYWJsZUZvcihzb3VyY2VGaWxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGV4cG9ydFRhYmxlLmhhcyhpZGVudC50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbiAgICBjb25zdCBpc0V4cG9ydGVkUHJvcGVydHlBY2Nlc3MgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pIHtcbiAgICAgICAgY29uc3QgcGFlID0gbm9kZSBhcyB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb247XG4gICAgICAgIGlmIChpc0V4cG9ydGVkU3ltYm9sKHBhZS5leHByZXNzaW9uKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhc0xvd2VyYWJsZVBhcmVudENhY2hlID0gbmV3IE1hcDx0cy5Ob2RlLCBib29sZWFuPigpO1xuXG4gICAgY29uc3Qgc2hvdWxkQmVMb3dlcmVkID0gKG5vZGU6IHRzLk5vZGV8dW5kZWZpbmVkKTogYm9vbGVhbiA9PiB7XG4gICAgICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxldCBsb3dlcmFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgIGlmICgobm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkFycm93RnVuY3Rpb24gfHxcbiAgICAgICAgICAgbm9kZS5raW5kID09PSB0cy5TeW50YXhLaW5kLkZ1bmN0aW9uRXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc0VsaWdpYmxlRm9yTG93ZXJpbmcobm9kZSkpIHtcbiAgICAgICAgbG93ZXJhYmxlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgaXNMaXRlcmFsRmllbGROYW1lZChub2RlLCB0aGlzLmxvd2VyYWJsZUZpZWxkTmFtZXMpICYmIGlzRWxpZ2libGVGb3JMb3dlcmluZyhub2RlKSAmJlxuICAgICAgICAgICFpc0V4cG9ydGVkU3ltYm9sKG5vZGUpICYmICFpc0V4cG9ydGVkUHJvcGVydHlBY2Nlc3Mobm9kZSkpIHtcbiAgICAgICAgbG93ZXJhYmxlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsb3dlcmFibGU7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhc0xvd2VyYWJsZVBhcmVudCA9IChub2RlOiB0cy5Ob2RlfHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoIWhhc0xvd2VyYWJsZVBhcmVudENhY2hlLmhhcyhub2RlKSkge1xuICAgICAgICBoYXNMb3dlcmFibGVQYXJlbnRDYWNoZS5zZXQoXG4gICAgICAgICAgICBub2RlLCBzaG91bGRCZUxvd2VyZWQobm9kZS5wYXJlbnQpIHx8IGhhc0xvd2VyYWJsZVBhcmVudChub2RlLnBhcmVudCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc0xvd2VyYWJsZVBhcmVudENhY2hlLmdldChub2RlKSE7XG4gICAgfTtcblxuICAgIGNvbnN0IGlzTG93ZXJhYmxlID0gKG5vZGU6IHRzLk5vZGV8dW5kZWZpbmVkKTogYm9vbGVhbiA9PiB7XG4gICAgICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzaG91bGRCZUxvd2VyZWQobm9kZSkgJiYgIWhhc0xvd2VyYWJsZVBhcmVudChub2RlKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuICh2YWx1ZTogTWV0YWRhdGFWYWx1ZSwgbm9kZTogdHMuTm9kZSk6IE1ldGFkYXRhVmFsdWUgPT4ge1xuICAgICAgaWYgKCFpc1ByaW1pdGl2ZSh2YWx1ZSkgJiYgIWlzUmV3cml0dGVuKHZhbHVlKSAmJiBpc0xvd2VyYWJsZShub2RlKSkge1xuICAgICAgICByZXR1cm4gcmVwbGFjZU5vZGUobm9kZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFeHBvcnRUYWJsZUZvcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogU2V0PHN0cmluZz4ge1xuICBjb25zdCBleHBvcnRUYWJsZSA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAvLyBMYXppbHkgY29sbGVjdCBhbGwgdGhlIGV4cG9ydHMgZnJvbSB0aGUgc291cmNlIGZpbGVcbiAgdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIGZ1bmN0aW9uIHNjYW4obm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbjpcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5GdW5jdGlvbkRlY2xhcmF0aW9uOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkludGVyZmFjZURlY2xhcmF0aW9uOlxuICAgICAgICBpZiAoKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlIGFzIHRzLkRlY2xhcmF0aW9uKSAmIHRzLk1vZGlmaWVyRmxhZ3MuRXhwb3J0KSAhPSAwKSB7XG4gICAgICAgICAgY29uc3QgY2xhc3NEZWNsYXJhdGlvbiA9XG4gICAgICAgICAgICAgIG5vZGUgYXMgKHRzLkNsYXNzRGVjbGFyYXRpb24gfCB0cy5GdW5jdGlvbkRlY2xhcmF0aW9uIHwgdHMuSW50ZXJmYWNlRGVjbGFyYXRpb24pO1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBjbGFzc0RlY2xhcmF0aW9uLm5hbWU7XG4gICAgICAgICAgaWYgKG5hbWUpIGV4cG9ydFRhYmxlLmFkZChuYW1lLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlZhcmlhYmxlU3RhdGVtZW50OlxuICAgICAgICBjb25zdCB2YXJpYWJsZVN0YXRlbWVudCA9IG5vZGUgYXMgdHMuVmFyaWFibGVTdGF0ZW1lbnQ7XG4gICAgICAgIGZvciAoY29uc3QgZGVjbGFyYXRpb24gb2YgdmFyaWFibGVTdGF0ZW1lbnQuZGVjbGFyYXRpb25MaXN0LmRlY2xhcmF0aW9ucykge1xuICAgICAgICAgIHNjYW4oZGVjbGFyYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlZhcmlhYmxlRGVjbGFyYXRpb246XG4gICAgICAgIGNvbnN0IHZhcmlhYmxlRGVjbGFyYXRpb24gPSBub2RlIGFzIHRzLlZhcmlhYmxlRGVjbGFyYXRpb247XG4gICAgICAgIGlmICgodHMuZ2V0Q29tYmluZWRNb2RpZmllckZsYWdzKHZhcmlhYmxlRGVjbGFyYXRpb24pICYgdHMuTW9kaWZpZXJGbGFncy5FeHBvcnQpICE9IDAgJiZcbiAgICAgICAgICAgIHZhcmlhYmxlRGVjbGFyYXRpb24ubmFtZS5raW5kID09IHRzLlN5bnRheEtpbmQuSWRlbnRpZmllcikge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSB2YXJpYWJsZURlY2xhcmF0aW9uLm5hbWUgYXMgdHMuSWRlbnRpZmllcjtcbiAgICAgICAgICBleHBvcnRUYWJsZS5hZGQobmFtZS50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5FeHBvcnREZWNsYXJhdGlvbjpcbiAgICAgICAgY29uc3QgZXhwb3J0RGVjbGFyYXRpb24gPSBub2RlIGFzIHRzLkV4cG9ydERlY2xhcmF0aW9uO1xuICAgICAgICBjb25zdCB7bW9kdWxlU3BlY2lmaWVyLCBleHBvcnRDbGF1c2V9ID0gZXhwb3J0RGVjbGFyYXRpb247XG4gICAgICAgIGlmICghbW9kdWxlU3BlY2lmaWVyICYmIGV4cG9ydENsYXVzZSAmJiB0cy5pc05hbWVkRXhwb3J0cyhleHBvcnRDbGF1c2UpKSB7XG4gICAgICAgICAgZXhwb3J0Q2xhdXNlLmVsZW1lbnRzLmZvckVhY2goc3BlYyA9PiB7XG4gICAgICAgICAgICBleHBvcnRUYWJsZS5hZGQoc3BlYy5uYW1lLnRleHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGV4cG9ydFRhYmxlO1xufVxuIl19
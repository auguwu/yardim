"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceUrl = exports.replaceResources = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const ts = require("typescript");
function replaceResources(shouldTransform, getTypeChecker, directTemplateLoading = false) {
    return (context) => {
        const typeChecker = getTypeChecker();
        const resourceImportDeclarations = [];
        const moduleKind = context.getCompilerOptions().module;
        const visitNode = (node) => {
            if (ts.isClassDeclaration(node)) {
                const decorators = ts.visitNodes(node.decorators, node => ts.isDecorator(node)
                    ? visitDecorator(node, typeChecker, directTemplateLoading, resourceImportDeclarations, moduleKind)
                    : node);
                return ts.updateClassDeclaration(node, decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, node.members);
            }
            return ts.visitEachChild(node, visitNode, context);
        };
        return (sourceFile) => {
            if (!shouldTransform(sourceFile.fileName)) {
                return sourceFile;
            }
            const updatedSourceFile = ts.visitNode(sourceFile, visitNode);
            if (resourceImportDeclarations.length) {
                // Add resource imports
                return ts.updateSourceFileNode(updatedSourceFile, ts.setTextRange(ts.createNodeArray([
                    ...resourceImportDeclarations,
                    ...updatedSourceFile.statements,
                ]), updatedSourceFile.statements));
            }
            return updatedSourceFile;
        };
    };
}
exports.replaceResources = replaceResources;
function visitDecorator(node, typeChecker, directTemplateLoading, resourceImportDeclarations, moduleKind) {
    if (!isComponentDecorator(node, typeChecker)) {
        return node;
    }
    if (!ts.isCallExpression(node.expression)) {
        return node;
    }
    const decoratorFactory = node.expression;
    const args = decoratorFactory.arguments;
    if (args.length !== 1 || !ts.isObjectLiteralExpression(args[0])) {
        // Unsupported component metadata
        return node;
    }
    const objectExpression = args[0];
    const styleReplacements = [];
    // visit all properties
    let properties = ts.visitNodes(objectExpression.properties, node => ts.isObjectLiteralElementLike(node)
        ? visitComponentMetadata(node, styleReplacements, directTemplateLoading, resourceImportDeclarations, moduleKind)
        : node);
    // replace properties with updated properties
    if (styleReplacements.length > 0) {
        const styleProperty = ts.createPropertyAssignment(ts.createIdentifier('styles'), ts.createArrayLiteral(styleReplacements));
        properties = ts.createNodeArray([...properties, styleProperty]);
    }
    return ts.updateDecorator(node, ts.updateCall(decoratorFactory, decoratorFactory.expression, decoratorFactory.typeArguments, [
        ts.updateObjectLiteral(objectExpression, properties),
    ]));
}
function visitComponentMetadata(node, styleReplacements, directTemplateLoading, resourceImportDeclarations, moduleKind) {
    if (!ts.isPropertyAssignment(node) || ts.isComputedPropertyName(node.name)) {
        return node;
    }
    const name = node.name.text;
    switch (name) {
        case 'moduleId':
            return undefined;
        case 'templateUrl':
            const importName = createResourceImport(node.initializer, directTemplateLoading ? '!raw-loader!' : '', resourceImportDeclarations, moduleKind);
            if (!importName) {
                return node;
            }
            return ts.updatePropertyAssignment(node, ts.createIdentifier('template'), importName);
        case 'styles':
        case 'styleUrls':
            if (!ts.isArrayLiteralExpression(node.initializer)) {
                return node;
            }
            const isInlineStyles = name === 'styles';
            const styles = ts.visitNodes(node.initializer.elements, node => {
                if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
                    return node;
                }
                if (isInlineStyles) {
                    return ts.createLiteral(node.text);
                }
                return createResourceImport(node, undefined, resourceImportDeclarations, moduleKind) || node;
            });
            // Styles should be placed first
            if (isInlineStyles) {
                styleReplacements.unshift(...styles);
            }
            else {
                styleReplacements.push(...styles);
            }
            return undefined;
        default:
            return node;
    }
}
function getResourceUrl(node, loader = '') {
    // only analyze strings
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
        return null;
    }
    return `${loader}${/^\.?\.\//.test(node.text) ? '' : './'}${node.text}`;
}
exports.getResourceUrl = getResourceUrl;
function isComponentDecorator(node, typeChecker) {
    if (!ts.isDecorator(node)) {
        return false;
    }
    const origin = getDecoratorOrigin(node, typeChecker);
    if (origin && origin.module === '@angular/core' && origin.name === 'Component') {
        return true;
    }
    return false;
}
function createResourceImport(node, loader, resourceImportDeclarations, moduleKind = ts.ModuleKind.ES2015) {
    const url = getResourceUrl(node, loader);
    if (!url) {
        return null;
    }
    const urlLiteral = ts.createLiteral(url);
    if (moduleKind < ts.ModuleKind.ES2015) {
        return ts.createPropertyAccess(ts.createCall(ts.createIdentifier('require'), [], [urlLiteral]), 'default');
    }
    else {
        const importName = ts.createIdentifier(`__NG_CLI_RESOURCE__${resourceImportDeclarations.length}`);
        resourceImportDeclarations.push(ts.createImportDeclaration(undefined, undefined, ts.createImportClause(importName, undefined), urlLiteral));
        return importName;
    }
}
function getDecoratorOrigin(decorator, typeChecker) {
    if (!ts.isCallExpression(decorator.expression)) {
        return null;
    }
    let identifier;
    let name = '';
    if (ts.isPropertyAccessExpression(decorator.expression.expression)) {
        identifier = decorator.expression.expression.expression;
        name = decorator.expression.expression.name.text;
    }
    else if (ts.isIdentifier(decorator.expression.expression)) {
        identifier = decorator.expression.expression;
    }
    else {
        return null;
    }
    // NOTE: resolver.getReferencedImportDeclaration would work as well but is internal
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
        const declaration = symbol.declarations[0];
        let module;
        if (ts.isImportSpecifier(declaration)) {
            name = (declaration.propertyName || declaration.name).text;
            module = declaration.parent.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isNamespaceImport(declaration)) {
            // Use the name from the decorator namespace property access
            module = declaration.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isImportClause(declaration)) {
            name = declaration.name.text;
            module = declaration.parent.moduleSpecifier.text;
        }
        else {
            return null;
        }
        return { name, module };
    }
    return null;
}

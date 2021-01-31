/// <amd-module name="@angular/compiler-cli/src/ngtsc/translator/src/import_manager" />
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
import { ImportRewriter } from '../../imports';
import { Import, ImportGenerator, NamedImport } from './api/import_generator';
export declare class ImportManager implements ImportGenerator<ts.Identifier> {
    protected rewriter: ImportRewriter;
    private prefix;
    private specifierToIdentifier;
    private nextIndex;
    constructor(rewriter?: ImportRewriter, prefix?: string);
    generateNamespaceImport(moduleName: string): ts.Identifier;
    generateNamedImport(moduleName: string, originalSymbol: string): NamedImport<ts.Identifier>;
    getAllImports(contextPath: string): Import[];
}

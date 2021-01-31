/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/typecheck/src/host" />
import * as ts from 'typescript';
import { RequiredDelegations } from '../../util/src/typescript';
/**
 * Delegates all methods of `ts.CompilerHost` to a delegate, with the exception of
 * `getSourceFile`, `fileExists` and `writeFile` which are implemented in `TypeCheckProgramHost`.
 *
 * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
 * generated for this class.
 */
export declare class DelegatingCompilerHost implements Omit<RequiredDelegations<ts.CompilerHost>, 'getSourceFile' | 'fileExists' | 'writeFile'> {
    protected delegate: ts.CompilerHost;
    constructor(delegate: ts.CompilerHost);
    private delegateMethod;
    createHash: ((data: string) => string) | undefined;
    directoryExists: ((directoryName: string) => boolean) | undefined;
    getCancellationToken: (() => ts.CancellationToken) | undefined;
    getCanonicalFileName: (fileName: string) => string;
    getCurrentDirectory: () => string;
    getDefaultLibFileName: (options: ts.CompilerOptions) => string;
    getDefaultLibLocation: (() => string) | undefined;
    getDirectories: ((path: string) => string[]) | undefined;
    getEnvironmentVariable: ((name: string) => string | undefined) | undefined;
    getNewLine: () => string;
    getParsedCommandLine: ((fileName: string) => ts.ParsedCommandLine | undefined) | undefined;
    getSourceFileByPath: ((fileName: string, path: ts.Path, languageVersion: ts.ScriptTarget, onError?: ((message: string) => void) | undefined, shouldCreateNewSourceFile?: boolean | undefined) => ts.SourceFile | undefined) | undefined;
    readDirectory: ((rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth?: number | undefined) => string[]) | undefined;
    readFile: (fileName: string) => string | undefined;
    realpath: ((path: string) => string) | undefined;
    resolveModuleNames: ((moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions) => (ts.ResolvedModule | undefined)[]) | undefined;
    resolveTypeReferenceDirectives: ((typeReferenceDirectiveNames: string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions) => (ts.ResolvedTypeReferenceDirective | undefined)[]) | undefined;
    trace: ((s: string) => void) | undefined;
    useCaseSensitiveFileNames: () => boolean;
}
/**
 * A `ts.CompilerHost` which augments source files with type checking code from a
 * `TypeCheckContext`.
 */
export declare class TypeCheckProgramHost extends DelegatingCompilerHost {
    private originalProgram;
    private shimExtensionPrefixes;
    /**
     * Map of source file names to `ts.SourceFile` instances.
     */
    private sfMap;
    /**
     * The `ShimReferenceTagger` responsible for tagging `ts.SourceFile`s loaded via this host.
     *
     * The `TypeCheckProgramHost` is used in the creation of a new `ts.Program`. Even though this new
     * program is based on a prior one, TypeScript will still start from the root files and enumerate
     * all source files to include in the new program.  This means that just like during the original
     * program's creation, these source files must be tagged with references to per-file shims in
     * order for those shims to be loaded, and then cleaned up afterwards. Thus the
     * `TypeCheckProgramHost` has its own `ShimReferenceTagger` to perform this function.
     */
    private shimTagger;
    constructor(sfMap: Map<string, ts.SourceFile>, originalProgram: ts.Program, delegate: ts.CompilerHost, shimExtensionPrefixes: string[]);
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: ((message: string) => void) | undefined, shouldCreateNewSourceFile?: boolean | undefined): ts.SourceFile | undefined;
    postProgramCreationCleanup(): void;
    writeFile(): never;
    fileExists(fileName: string): boolean;
}

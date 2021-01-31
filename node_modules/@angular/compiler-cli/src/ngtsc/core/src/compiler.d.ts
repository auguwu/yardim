/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/core/src/compiler" />
import * as ts from 'typescript';
import { IncrementalBuildStrategy, IncrementalDriver } from '../../incremental';
import { IndexedComponent } from '../../indexer';
import { ComponentResources } from '../../metadata';
import { PerfRecorder } from '../../perf';
import { DeclarationNode } from '../../reflection';
import { OptimizeFor, TemplateTypeChecker, TypeCheckingProgramStrategy } from '../../typecheck/api';
import { LazyRoute, NgCompilerAdapter, NgCompilerOptions } from '../api';
/**
 * Discriminant type for a `CompilationTicket`.
 */
export declare enum CompilationTicketKind {
    Fresh = 0,
    IncrementalTypeScript = 1,
    IncrementalResource = 2
}
/**
 * Begin an Angular compilation operation from scratch.
 */
export interface FreshCompilationTicket {
    kind: CompilationTicketKind.Fresh;
    options: NgCompilerOptions;
    incrementalBuildStrategy: IncrementalBuildStrategy;
    typeCheckingProgramStrategy: TypeCheckingProgramStrategy;
    enableTemplateTypeChecker: boolean;
    usePoisonedData: boolean;
    tsProgram: ts.Program;
}
/**
 * Begin an Angular compilation operation that incorporates changes to TypeScript code.
 */
export interface IncrementalTypeScriptCompilationTicket {
    kind: CompilationTicketKind.IncrementalTypeScript;
    options: NgCompilerOptions;
    oldProgram: ts.Program;
    newProgram: ts.Program;
    incrementalBuildStrategy: IncrementalBuildStrategy;
    typeCheckingProgramStrategy: TypeCheckingProgramStrategy;
    newDriver: IncrementalDriver;
    enableTemplateTypeChecker: boolean;
    usePoisonedData: boolean;
}
export interface IncrementalResourceCompilationTicket {
    kind: CompilationTicketKind.IncrementalResource;
    compiler: NgCompiler;
    modifiedResourceFiles: Set<string>;
}
/**
 * A request to begin Angular compilation, either starting from scratch or from a known prior state.
 *
 * `CompilationTicket`s are used to initialize (or update) an `NgCompiler` instance, the core of the
 * Angular compiler. They abstract the starting state of compilation and allow `NgCompiler` to be
 * managed independently of any incremental compilation lifecycle.
 */
export declare type CompilationTicket = FreshCompilationTicket | IncrementalTypeScriptCompilationTicket | IncrementalResourceCompilationTicket;
/**
 * Create a `CompilationTicket` for a brand new compilation, using no prior state.
 */
export declare function freshCompilationTicket(tsProgram: ts.Program, options: NgCompilerOptions, incrementalBuildStrategy: IncrementalBuildStrategy, typeCheckingProgramStrategy: TypeCheckingProgramStrategy, enableTemplateTypeChecker: boolean, usePoisonedData: boolean): CompilationTicket;
/**
 * Create a `CompilationTicket` as efficiently as possible, based on a previous `NgCompiler`
 * instance and a new `ts.Program`.
 */
export declare function incrementalFromCompilerTicket(oldCompiler: NgCompiler, newProgram: ts.Program, incrementalBuildStrategy: IncrementalBuildStrategy, typeCheckingProgramStrategy: TypeCheckingProgramStrategy, modifiedResourceFiles: Set<string>): CompilationTicket;
/**
 * Create a `CompilationTicket` directly from an old `ts.Program` and associated Angular compilation
 * state, along with a new `ts.Program`.
 */
export declare function incrementalFromDriverTicket(oldProgram: ts.Program, oldDriver: IncrementalDriver, newProgram: ts.Program, options: NgCompilerOptions, incrementalBuildStrategy: IncrementalBuildStrategy, typeCheckingProgramStrategy: TypeCheckingProgramStrategy, modifiedResourceFiles: Set<string>, enableTemplateTypeChecker: boolean, usePoisonedData: boolean): CompilationTicket;
export declare function resourceChangeTicket(compiler: NgCompiler, modifiedResourceFiles: Set<string>): IncrementalResourceCompilationTicket;
/**
 * The heart of the Angular Ivy compiler.
 *
 * The `NgCompiler` provides an API for performing Angular compilation within a custom TypeScript
 * compiler. Each instance of `NgCompiler` supports a single compilation, which might be
 * incremental.
 *
 * `NgCompiler` is lazy, and does not perform any of the work of the compilation until one of its
 * output methods (e.g. `getDiagnostics`) is called.
 *
 * See the README.md for more information.
 */
export declare class NgCompiler {
    private adapter;
    readonly options: NgCompilerOptions;
    private tsProgram;
    readonly typeCheckingProgramStrategy: TypeCheckingProgramStrategy;
    readonly incrementalStrategy: IncrementalBuildStrategy;
    readonly incrementalDriver: IncrementalDriver;
    readonly enableTemplateTypeChecker: boolean;
    readonly usePoisonedData: boolean;
    private perfRecorder;
    /**
     * Lazily evaluated state of the compilation.
     *
     * This is created on demand by calling `ensureAnalyzed`.
     */
    private compilation;
    /**
     * Any diagnostics related to the construction of the compilation.
     *
     * These are diagnostics which arose during setup of the host and/or program.
     */
    private constructionDiagnostics;
    /**
     * Non-template diagnostics related to the program itself. Does not include template
     * diagnostics because the template type checker memoizes them itself.
     *
     * This is set by (and memoizes) `getNonTemplateDiagnostics`.
     */
    private nonTemplateDiagnostics;
    private closureCompilerEnabled;
    private nextProgram;
    private entryPoint;
    private moduleResolver;
    private resourceManager;
    private cycleAnalyzer;
    readonly ignoreForDiagnostics: Set<ts.SourceFile>;
    readonly ignoreForEmit: Set<ts.SourceFile>;
    /**
     * Convert a `CompilationTicket` into an `NgCompiler` instance for the requested compilation.
     *
     * Depending on the nature of the compilation request, the `NgCompiler` instance may be reused
     * from a previous compilation and updated with any changes, it may be a new instance which
     * incrementally reuses state from a previous compilation, or it may represent a fresh compilation
     * entirely.
     */
    static fromTicket(ticket: CompilationTicket, adapter: NgCompilerAdapter, perfRecorder?: PerfRecorder): NgCompiler;
    private constructor();
    private updateWithChangedResources;
    /**
     * Get the resource dependencies of a file.
     *
     * If the file is not part of the compilation, an empty array will be returned.
     */
    getResourceDependencies(file: ts.SourceFile): string[];
    /**
     * Get all Angular-related diagnostics for this compilation.
     */
    getDiagnostics(): ts.Diagnostic[];
    /**
     * Get all Angular-related diagnostics for this compilation.
     *
     * If a `ts.SourceFile` is passed, only diagnostics related to that file are returned.
     */
    getDiagnosticsForFile(file: ts.SourceFile, optimizeFor: OptimizeFor): ts.Diagnostic[];
    /**
     * Add Angular.io error guide links to diagnostics for this compilation.
     */
    private addMessageTextDetails;
    /**
     * Get all setup-related diagnostics for this compilation.
     */
    getOptionDiagnostics(): ts.Diagnostic[];
    /**
     * Get the `ts.Program` to use as a starting point when spawning a subsequent incremental
     * compilation.
     *
     * The `NgCompiler` spawns an internal incremental TypeScript compilation (inheriting the
     * consumer's `ts.Program` into a new one for the purposes of template type-checking). After this
     * operation, the consumer's `ts.Program` is no longer usable for starting a new incremental
     * compilation. `getNextProgram` retrieves the `ts.Program` which can be used instead.
     */
    getNextProgram(): ts.Program;
    getTemplateTypeChecker(): TemplateTypeChecker;
    /**
     * Retrieves the `ts.Declaration`s for any component(s) which use the given template file.
     */
    getComponentsWithTemplateFile(templateFilePath: string): ReadonlySet<DeclarationNode>;
    /**
     * Retrieves the `ts.Declaration`s for any component(s) which use the given template file.
     */
    getComponentsWithStyleFile(styleFilePath: string): ReadonlySet<DeclarationNode>;
    /**
     * Retrieves external resources for the given component.
     */
    getComponentResources(classDecl: DeclarationNode): ComponentResources | null;
    /**
     * Perform Angular's analysis step (as a precursor to `getDiagnostics` or `prepareEmit`)
     * asynchronously.
     *
     * Normally, this operation happens lazily whenever `getDiagnostics` or `prepareEmit` are called.
     * However, certain consumers may wish to allow for an asynchronous phase of analysis, where
     * resources such as `styleUrls` are resolved asynchonously. In these cases `analyzeAsync` must be
     * called first, and its `Promise` awaited prior to calling any other APIs of `NgCompiler`.
     */
    analyzeAsync(): Promise<void>;
    /**
     * List lazy routes detected during analysis.
     *
     * This can be called for one specific route, or to retrieve all top-level routes.
     */
    listLazyRoutes(entryRoute?: string): LazyRoute[];
    /**
     * Fetch transformers and other information which is necessary for a consumer to `emit` the
     * program with Angular-added definitions.
     */
    prepareEmit(): {
        transformers: ts.CustomTransformers;
    };
    /**
     * Run the indexing process and return a `Map` of all indexed components.
     *
     * See the `indexing` package for more details.
     */
    getIndexedComponents(): Map<DeclarationNode, IndexedComponent>;
    private ensureAnalyzed;
    private analyzeSync;
    private resolveCompilation;
    private get fullTemplateTypeCheck();
    private getTypeCheckingConfig;
    private getTemplateDiagnostics;
    private getTemplateDiagnosticsForFile;
    private getNonTemplateDiagnostics;
    /**
     * Reifies the inter-dependencies of NgModules and the components within their compilation scopes
     * into the `IncrementalDriver`'s dependency graph.
     */
    private recordNgModuleScopeDependencies;
    private scanForMwp;
    private makeCompilation;
}
/**
 * Determine if the given `Program` is @angular/core.
 */
export declare function isAngularCorePackage(program: ts.Program): boolean;

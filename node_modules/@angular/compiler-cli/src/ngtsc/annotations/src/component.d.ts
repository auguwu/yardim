/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/compiler-cli/src/ngtsc/annotations/src/component" />
import { ConstantPool, InterpolationConfig, ParsedTemplate, ParseSourceFile, R3ComponentMetadata, Statement, TmplAstNode } from '@angular/compiler';
import * as ts from 'typescript';
import { CycleAnalyzer } from '../../cycles';
import { DefaultImportRecorder, ModuleResolver, Reference, ReferenceEmitter } from '../../imports';
import { DependencyTracker } from '../../incremental/api';
import { IndexingContext } from '../../indexer';
import { ClassPropertyMapping, ComponentResources, DirectiveTypeCheckMeta, InjectableClassRegistry, MetadataReader, MetadataRegistry, ResourceRegistry } from '../../metadata';
import { PartialEvaluator } from '../../partial_evaluator';
import { ClassDeclaration, Decorator, ReflectionHost } from '../../reflection';
import { ComponentScopeReader, LocalModuleScopeRegistry, TypeCheckScopeRegistry } from '../../scope';
import { AnalysisOutput, CompileResult, DecoratorHandler, DetectResult, HandlerFlags, HandlerPrecedence, ResolveResult } from '../../transform';
import { TemplateSourceMapping, TypeCheckContext } from '../../typecheck/api';
import { SubsetOfKeys } from '../../util/src/typescript';
import { ResourceLoader } from './api';
/**
 * These fields of `R3ComponentMetadata` are updated in the `resolve` phase.
 *
 * The `keyof R3ComponentMetadata &` condition ensures that only fields of `R3ComponentMetadata` can
 * be included here.
 */
export declare type ComponentMetadataResolvedFields = SubsetOfKeys<R3ComponentMetadata, 'directives' | 'pipes' | 'declarationListEmitMode'>;
export interface ComponentAnalysisData {
    /**
     * `meta` includes those fields of `R3ComponentMetadata` which are calculated at `analyze` time
     * (not during resolve).
     */
    meta: Omit<R3ComponentMetadata, ComponentMetadataResolvedFields>;
    baseClass: Reference<ClassDeclaration> | 'dynamic' | null;
    typeCheckMeta: DirectiveTypeCheckMeta;
    template: ParsedTemplateWithSource;
    metadataStmt: Statement | null;
    inputs: ClassPropertyMapping;
    outputs: ClassPropertyMapping;
    /**
     * Providers extracted from the `providers` field of the component annotation which will require
     * an Angular factory definition at runtime.
     */
    providersRequiringFactory: Set<Reference<ClassDeclaration>> | null;
    /**
     * Providers extracted from the `viewProviders` field of the component annotation which will
     * require an Angular factory definition at runtime.
     */
    viewProvidersRequiringFactory: Set<Reference<ClassDeclaration>> | null;
    resources: ComponentResources;
    /**
     * The literal `styleUrls` extracted from the decorator, if present.
     */
    styleUrls: string[] | null;
    /**
     * Inline stylesheets extracted from the decorator, if present.
     */
    inlineStyles: string[] | null;
    isPoisoned: boolean;
}
export declare type ComponentResolutionData = Pick<R3ComponentMetadata, ComponentMetadataResolvedFields>;
/**
 * `DecoratorHandler` which handles the `@Component` annotation.
 */
export declare class ComponentDecoratorHandler implements DecoratorHandler<Decorator, ComponentAnalysisData, ComponentResolutionData> {
    private reflector;
    private evaluator;
    private metaRegistry;
    private metaReader;
    private scopeReader;
    private scopeRegistry;
    private typeCheckScopeRegistry;
    private resourceRegistry;
    private isCore;
    private resourceLoader;
    private rootDirs;
    private defaultPreserveWhitespaces;
    private i18nUseExternalIds;
    private enableI18nLegacyMessageIdFormat;
    private usePoisonedData;
    private i18nNormalizeLineEndingsInICUs;
    private moduleResolver;
    private cycleAnalyzer;
    private refEmitter;
    private defaultImportRecorder;
    private depTracker;
    private injectableRegistry;
    private annotateForClosureCompiler;
    constructor(reflector: ReflectionHost, evaluator: PartialEvaluator, metaRegistry: MetadataRegistry, metaReader: MetadataReader, scopeReader: ComponentScopeReader, scopeRegistry: LocalModuleScopeRegistry, typeCheckScopeRegistry: TypeCheckScopeRegistry, resourceRegistry: ResourceRegistry, isCore: boolean, resourceLoader: ResourceLoader, rootDirs: ReadonlyArray<string>, defaultPreserveWhitespaces: boolean, i18nUseExternalIds: boolean, enableI18nLegacyMessageIdFormat: boolean, usePoisonedData: boolean, i18nNormalizeLineEndingsInICUs: boolean | undefined, moduleResolver: ModuleResolver, cycleAnalyzer: CycleAnalyzer, refEmitter: ReferenceEmitter, defaultImportRecorder: DefaultImportRecorder, depTracker: DependencyTracker | null, injectableRegistry: InjectableClassRegistry, annotateForClosureCompiler: boolean);
    private literalCache;
    private elementSchemaRegistry;
    /**
     * During the asynchronous preanalyze phase, it's necessary to parse the template to extract
     * any potential <link> tags which might need to be loaded. This cache ensures that work is not
     * thrown away, and the parsed template is reused during the analyze phase.
     */
    private preanalyzeTemplateCache;
    readonly precedence = HandlerPrecedence.PRIMARY;
    readonly name: string;
    detect(node: ClassDeclaration, decorators: Decorator[] | null): DetectResult<Decorator> | undefined;
    preanalyze(node: ClassDeclaration, decorator: Readonly<Decorator>): Promise<void> | undefined;
    analyze(node: ClassDeclaration, decorator: Readonly<Decorator>, flags?: HandlerFlags): AnalysisOutput<ComponentAnalysisData>;
    register(node: ClassDeclaration, analysis: ComponentAnalysisData): void;
    index(context: IndexingContext, node: ClassDeclaration, analysis: Readonly<ComponentAnalysisData>): null | undefined;
    typeCheck(ctx: TypeCheckContext, node: ClassDeclaration, meta: Readonly<ComponentAnalysisData>): void;
    resolve(node: ClassDeclaration, analysis: Readonly<ComponentAnalysisData>): ResolveResult<ComponentResolutionData>;
    updateResources(node: ClassDeclaration, analysis: ComponentAnalysisData): void;
    compileFull(node: ClassDeclaration, analysis: Readonly<ComponentAnalysisData>, resolution: Readonly<ComponentResolutionData>, pool: ConstantPool): CompileResult[];
    compilePartial(node: ClassDeclaration, analysis: Readonly<ComponentAnalysisData>, resolution: Readonly<ComponentResolutionData>): CompileResult[];
    private compileComponent;
    private _resolveLiteral;
    private _resolveEnumValue;
    private _extractStyleUrls;
    private _extractStyleResources;
    private _preloadAndParseTemplate;
    private extractTemplate;
    private _parseTemplate;
    private parseTemplateDeclaration;
    private _expressionToImportedFile;
    private _isCyclicImport;
    private _recordSyntheticImport;
}
/**
 * Information about the template which was extracted during parsing.
 *
 * This contains the actual parsed template as well as any metadata collected during its parsing,
 * some of which might be useful for re-parsing the template with different options.
 */
export interface ParsedComponentTemplate extends ParsedTemplate {
    /**
     * True if the original template was stored inline;
     * False if the template was in an external file.
     */
    isInline: boolean;
    /**
     * The template AST, parsed in a manner which preserves source map information for diagnostics.
     *
     * Not useful for emit.
     */
    diagNodes: TmplAstNode[];
    /**
     * The `ParseSourceFile` for the template.
     */
    file: ParseSourceFile;
}
export interface ParsedTemplateWithSource extends ParsedComponentTemplate {
    sourceMapping: TemplateSourceMapping;
    declaration: TemplateDeclaration;
}
/**
 * Common fields extracted from the declaration of a template.
 */
interface CommonTemplateDeclaration {
    preserveWhitespaces: boolean;
    interpolationConfig: InterpolationConfig;
    templateUrl: string;
    resolvedTemplateUrl: string;
    sourceMapUrl: string;
}
/**
 * Information extracted from the declaration of an inline template.
 */
interface InlineTemplateDeclaration extends CommonTemplateDeclaration {
    isInline: true;
    expression: ts.Expression;
}
/**
 * Information extracted from the declaration of an external template.
 */
interface ExternalTemplateDeclaration extends CommonTemplateDeclaration {
    isInline: false;
    templateUrlExpression: ts.Expression;
}
/**
 * The declaration of a template extracted from a component decorator.
 *
 * This data is extracted and stored separately to faciliate re-interpreting the template
 * declaration whenever the compiler is notified of a change to a template file. With this
 * information, `ComponentDecoratorHandler` is able to re-read the template and update the component
 * record without needing to parse the original decorator again.
 */
declare type TemplateDeclaration = InlineTemplateDeclaration | ExternalTemplateDeclaration;
export {};

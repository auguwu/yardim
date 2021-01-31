import * as ts from 'typescript';
import { NgccProcessor } from '../ngcc_processor';
import { WebpackResourceLoader } from '../resource_loader';
export declare function augmentHostWithResources(host: ts.CompilerHost, resourceLoader: WebpackResourceLoader, options?: {
    directTemplateLoading?: boolean;
}): void;
export declare function augmentHostWithNgcc(host: ts.CompilerHost, ngcc: NgccProcessor, moduleResolutionCache?: ts.ModuleResolutionCache): void;
export declare function augmentHostWithReplacements(host: ts.CompilerHost, replacements: Record<string, string>, moduleResolutionCache?: ts.ModuleResolutionCache): void;
export declare function augmentHostWithSubstitutions(host: ts.CompilerHost, substitutions: Record<string, string>): void;
export declare function augmentHostWithVersioning(host: ts.CompilerHost): void;
export declare function augmentProgramWithVersioning(program: ts.Program): void;
export declare function augmentHostWithCaching(host: ts.CompilerHost, cache: Map<string, ts.SourceFile>): void;

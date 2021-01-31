import { Compiler, compilation } from 'webpack';
import { IndexHtmlGenerator, IndexHtmlGeneratorOptions, IndexHtmlGeneratorProcessOptions } from '../../utils/index-file/index-html-generator';
export interface IndexHtmlWebpackPluginOptions extends IndexHtmlGeneratorOptions, Omit<IndexHtmlGeneratorProcessOptions, 'files' | 'noModuleFiles' | 'moduleFiles'> {
    noModuleEntrypoints: string[];
    moduleEntrypoints: string[];
}
export declare class IndexHtmlWebpackPlugin extends IndexHtmlGenerator {
    readonly options: IndexHtmlWebpackPluginOptions;
    private _compilation;
    get compilation(): compilation.Compilation;
    constructor(options: IndexHtmlWebpackPluginOptions);
    apply(compiler: Compiler): void;
    readAsset(path: string): Promise<string>;
    protected readIndex(path: string): Promise<string>;
}

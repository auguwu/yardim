import { CompilerOptions } from 'typescript';
export interface TypeScriptPathsPluginOptions extends Pick<CompilerOptions, 'paths' | 'baseUrl'> {
}
export declare class TypeScriptPathsPlugin {
    private options?;
    constructor(options?: TypeScriptPathsPluginOptions | undefined);
    update(options: TypeScriptPathsPluginOptions): void;
    apply(resolver: any): void;
}

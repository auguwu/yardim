export declare class WebpackResourceLoader {
    private _parentCompilation;
    private _context;
    private _fileDependencies;
    private _reverseDependencies;
    private _cachedSources;
    private _cachedEvaluatedSources;
    changedFiles?: Iterable<string>;
    update(parentCompilation: import('webpack').compilation.Compilation, changedFiles?: Iterable<string>): void;
    getModifiedResourceFiles(): Set<string>;
    getResourceDependencies(filePath: string): never[] | Set<string>;
    getAffectedResources(file: string): never[] | Set<string>;
    setAffectedResources(file: string, resources: Iterable<string>): void;
    private _compile;
    private _evaluate;
    get(filePath: string): Promise<string>;
}

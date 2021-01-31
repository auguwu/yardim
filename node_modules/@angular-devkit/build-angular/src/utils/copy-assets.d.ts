export declare function copyAssets(entries: {
    glob: string;
    ignore?: string[];
    input: string;
    output: string;
    flatten?: boolean;
    followSymlinks?: boolean;
}[], basePaths: Iterable<string>, root: string, changed?: Set<string>): Promise<void>;

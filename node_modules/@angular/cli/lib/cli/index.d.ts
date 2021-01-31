export declare class Version {
    readonly full: string;
    readonly major: string;
    readonly minor: string;
    readonly patch: string;
    constructor(full: string);
}
export declare const VERSION: Version;
export default function (options: {
    testing?: boolean;
    cliArgs: string[];
}): Promise<number>;

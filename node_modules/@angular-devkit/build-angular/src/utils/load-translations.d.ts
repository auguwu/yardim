export declare type TranslationLoader = (path: string) => {
    translations: Record<string, import('@angular/localize').ɵParsedTranslation>;
    format: string;
    locale?: string;
    diagnostics: import('@angular/localize/src/tools/src/diagnostics').Diagnostics;
    integrity: string;
};
export declare function createTranslationLoader(): Promise<TranslationLoader>;

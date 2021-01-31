/**
 * Extract i18n target options for Build Facade.
 */
export interface Schema {
    /**
     * A browser builder target to extract i18n messages in the format of
     * `project:target[:configuration]`. You can also pass in more than one configuration name
     * as a comma-separated list. Example: `project:target:production,staging`.
     */
    browserTarget: string;
    /**
     * Output format for the generated file.
     */
    format?: Format;
    /**
     * Output format for the generated file.
     * @deprecated Use 'format' option instead.
     */
    i18nFormat?: Format;
    /**
     * Specifies the source language of the application.
     * @deprecated Use 'i18n' project level sub-option 'sourceLocale' instead.
     */
    i18nLocale?: string;
    /**
     * Use Ivy compiler to extract translations. The default for Ivy applications.
     */
    ivy?: boolean;
    /**
     * Name of the file to output.
     */
    outFile?: string;
    /**
     * Path where output will be placed.
     */
    outputPath?: string;
    /**
     * Log progress to the console.
     */
    progress?: boolean;
}
/**
 * Output format for the generated file.
 *
 * Output format for the generated file.
 * @deprecated Use 'format' option instead.
 */
export declare enum Format {
    Arb = "arb",
    Json = "json",
    Xlf = "xlf",
    Xlf2 = "xlf2",
    Xlif = "xlif",
    Xliff = "xliff",
    Xliff2 = "xliff2",
    Xmb = "xmb"
}

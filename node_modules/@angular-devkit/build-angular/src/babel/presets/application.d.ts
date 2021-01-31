export declare type DiagnosticReporter = (type: 'error' | 'warning' | 'info', message: string) => void;
export interface ApplicationPresetOptions {
    i18n?: {
        locale: string;
        missingTranslationBehavior?: 'error' | 'warning' | 'ignore';
        translation?: unknown;
    };
    angularLinker?: boolean;
    forceES5?: boolean;
    forceAsyncTransformation?: boolean;
    diagnosticReporter?: DiagnosticReporter;
}
export default function (api: unknown, options: ApplicationPresetOptions): {
    presets: any[][];
    plugins: any[];
};

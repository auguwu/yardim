import { AngularCompilerPlugin, ivy } from '@ngtools/webpack';
import { RuleSetLoader } from 'webpack';
import { WebpackConfigOptions } from '../../utils/build-options';
export declare function getNonAotConfig(wco: WebpackConfigOptions): {
    module: {
        rules: {
            test: RegExp;
            loader: string;
        }[];
    };
    plugins: (AngularCompilerPlugin | ivy.AngularWebpackPlugin)[];
};
export declare function getAotConfig(wco: WebpackConfigOptions, i18nExtract?: boolean): {
    module: {
        rules: {
            test: RegExp;
            use: (string | RuleSetLoader)[];
        }[];
    };
    plugins: (AngularCompilerPlugin | ivy.AngularWebpackPlugin)[];
};
export declare function getTypescriptWorkerPlugin(wco: WebpackConfigOptions, workerTsConfigPath: string): AngularCompilerPlugin | ivy.AngularWebpackPlugin;

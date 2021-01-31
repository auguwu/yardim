/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { logging, virtualFs } from '@angular-devkit/core';
import * as fs from 'fs';
import * as webpack from 'webpack';
import { Schema as BrowserBuilderSchema } from '../browser/schema';
import { NormalizedBrowserBuilderSchema } from '../utils';
import { WebpackConfigOptions } from '../utils/build-options';
import { I18nOptions } from './i18n-options';
export declare type BrowserWebpackConfigOptions = WebpackConfigOptions<NormalizedBrowserBuilderSchema>;
export declare function generateWebpackConfig(workspaceRoot: string, projectRoot: string, sourceRoot: string | undefined, options: NormalizedBrowserBuilderSchema, webpackPartialGenerator: (wco: BrowserWebpackConfigOptions) => webpack.Configuration[], logger: logging.LoggerApi, extraBuildOptions: Partial<NormalizedBrowserBuilderSchema>): Promise<webpack.Configuration>;
export declare function generateI18nBrowserWebpackConfigFromContext(options: BrowserBuilderSchema, context: BuilderContext, webpackPartialGenerator: (wco: BrowserWebpackConfigOptions) => webpack.Configuration[], host?: virtualFs.Host<fs.Stats>, extraBuildOptions?: Partial<NormalizedBrowserBuilderSchema>): Promise<{
    config: webpack.Configuration;
    projectRoot: string;
    projectSourceRoot?: string;
    i18n: I18nOptions;
}>;
export declare function generateBrowserWebpackConfigFromContext(options: BrowserBuilderSchema, context: BuilderContext, webpackPartialGenerator: (wco: BrowserWebpackConfigOptions) => webpack.Configuration[], host?: virtualFs.Host<fs.Stats>, extraBuildOptions?: Partial<NormalizedBrowserBuilderSchema>): Promise<{
    config: webpack.Configuration;
    projectRoot: string;
    projectSourceRoot?: string;
}>;
export declare function getIndexOutputFile(index: BrowserBuilderSchema['index']): string;
export declare function getIndexInputFile(index: BrowserBuilderSchema['index']): string;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { logging } from '@angular-devkit/core';
import { Configuration } from 'webpack';
import { Schema as BrowserBuilderSchema } from '../builders/browser/schema';
import { NormalizedBrowserBuilderSchema } from '../utils';
import { WebpackConfigOptions } from '../utils/build-options';
import { I18nOptions } from './i18n-options';
export type BrowserWebpackConfigOptions = WebpackConfigOptions<NormalizedBrowserBuilderSchema>;
export type WebpackPartialGenerator = (configurationOptions: BrowserWebpackConfigOptions) => (Promise<Configuration> | Configuration)[];
export declare function generateWebpackConfig(workspaceRoot: string, projectRoot: string, sourceRoot: string | undefined, projectName: string, options: NormalizedBrowserBuilderSchema, webpackPartialGenerator: WebpackPartialGenerator, logger: logging.LoggerApi, extraBuildOptions: Partial<NormalizedBrowserBuilderSchema>): Promise<Configuration>;
export declare function generateI18nBrowserWebpackConfigFromContext(options: BrowserBuilderSchema, context: BuilderContext, webpackPartialGenerator: WebpackPartialGenerator, extraBuildOptions?: Partial<NormalizedBrowserBuilderSchema>): Promise<{
    config: Configuration;
    projectRoot: string;
    projectSourceRoot?: string;
    i18n: I18nOptions;
}>;
export declare function generateBrowserWebpackConfigFromContext(options: BrowserBuilderSchema, context: BuilderContext, webpackPartialGenerator: WebpackPartialGenerator, extraBuildOptions?: Partial<NormalizedBrowserBuilderSchema>): Promise<{
    config: Configuration;
    projectRoot: string;
    projectSourceRoot?: string;
}>;
export declare function getIndexOutputFile(index: BrowserBuilderSchema['index']): string;
export declare function getIndexInputFile(index: BrowserBuilderSchema['index']): string;

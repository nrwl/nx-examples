/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { WebpackLoggingCallback } from '@angular-devkit/build-webpack';
import { Observable } from 'rxjs';
import webpack from 'webpack';
import { ExecutionTransformer } from '../../transforms';
import { IndexHtmlTransform } from '../../utils/index-file/index-html-generator';
import { BuildEventStats } from '../../webpack/utils/stats';
import { Schema as BrowserBuilderSchema } from './schema';
/**
 * @experimental Direct usage of this type is considered experimental.
 */
export type BrowserBuilderOutput = BuilderOutput & {
    stats: BuildEventStats;
    baseOutputPath: string;
    outputs: {
        locale?: string;
        path: string;
        baseHref?: string;
    }[];
};
/**
 * Maximum time in milliseconds for single build/rebuild
 * This accounts for CI variability.
 */
export declare const BUILD_TIMEOUT = 30000;
/**
 * @experimental Direct usage of this function is considered experimental.
 */
export declare function buildWebpackBrowser(options: BrowserBuilderSchema, context: BuilderContext, transforms?: {
    webpackConfiguration?: ExecutionTransformer<webpack.Configuration>;
    logging?: WebpackLoggingCallback;
    indexHtml?: IndexHtmlTransform;
}): Observable<BrowserBuilderOutput>;
declare const _default: import("../../../../architect/src/internal").Builder<BrowserBuilderSchema & import("../../../../core/src").JsonObject>;
export default _default;

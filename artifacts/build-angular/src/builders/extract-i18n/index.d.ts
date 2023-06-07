/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { BuildResult } from '@angular-devkit/build-webpack';
import { JsonObject } from '@angular-devkit/core';
import webpack from 'webpack';
import { ExecutionTransformer } from '../../transforms';
import { Schema } from './schema';
export type ExtractI18nBuilderOptions = Schema;
/**
 * @experimental Direct usage of this function is considered experimental.
 */
export declare function execute(options: ExtractI18nBuilderOptions, context: BuilderContext, transforms?: {
    webpackConfiguration?: ExecutionTransformer<webpack.Configuration>;
}): Promise<BuildResult>;
declare const _default: import("../../../../architect/src/internal").Builder<Schema & JsonObject>;
export default _default;

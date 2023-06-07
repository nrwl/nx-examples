/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import webpack from 'webpack';
import { ExecutionTransformer } from '../../transforms';
import { Schema as ServerBuilderOptions } from './schema';
/**
 * @experimental Direct usage of this type is considered experimental.
 */
export type ServerBuilderOutput = BuilderOutput & {
    baseOutputPath: string;
    outputPath: string;
    outputs: {
        locale?: string;
        path: string;
    }[];
};
export { ServerBuilderOptions };
/**
 * @experimental Direct usage of this function is considered experimental.
 */
export declare function execute(options: ServerBuilderOptions, context: BuilderContext, transforms?: {
    webpackConfiguration?: ExecutionTransformer<webpack.Configuration>;
}): Observable<ServerBuilderOutput>;
declare const _default: import("../../../../architect/src/internal").Builder<ServerBuilderOptions & import("../../../../core/src").JsonObject>;
export default _default;

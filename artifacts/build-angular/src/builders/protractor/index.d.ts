/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { json } from '@angular-devkit/core';
import { Schema as ProtractorBuilderOptions } from './schema';
export { ProtractorBuilderOptions };
/**
 * @experimental Direct usage of this function is considered experimental.
 */
export declare function execute(options: ProtractorBuilderOptions, context: BuilderContext): Promise<BuilderOutput>;
declare const _default: import("../../../../architect/src/internal").Builder<ProtractorBuilderOptions & json.JsonObject>;
export default _default;

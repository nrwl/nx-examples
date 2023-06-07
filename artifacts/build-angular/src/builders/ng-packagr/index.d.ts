/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import { Schema as NgPackagrBuilderOptions } from './schema';
/**
 * @experimental Direct usage of this function is considered experimental.
 */
export declare function execute(options: NgPackagrBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
export { NgPackagrBuilderOptions };
declare const _default: import("../../../../architect/src/internal").Builder<Record<string, string> & NgPackagrBuilderOptions & import("../../../../core/src").JsonObject>;
export default _default;

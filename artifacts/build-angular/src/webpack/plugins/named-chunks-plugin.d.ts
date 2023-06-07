/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
/**
 * Webpack will not populate the chunk `name` property unless `webpackChunkName` magic comment is used.
 * This however will also effect the filename which is not desired when using `deterministic` chunkIds.
 * This plugin will populate the chunk `name` which is mainly used so that users can set bundle budgets on lazy chunks.
 */
export declare class NamedChunksPlugin {
    apply(compiler: Compiler): void;
    private generateName;
}

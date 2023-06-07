/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export interface DedupeModuleResolvePluginOptions {
    verbose?: boolean;
}
/**
 * DedupeModuleResolvePlugin is a webpack plugin which dedupes modules with the same name and versions
 * that are laid out in different parts of the node_modules tree.
 *
 * This is needed because Webpack relies on package managers to hoist modules and doesn't have any deduping logic.
 *
 * This is similar to how Webpack's 'NormalModuleReplacementPlugin' works
 * @see https://github.com/webpack/webpack/blob/4a1f068828c2ab47537d8be30d542cd3a1076db4/lib/NormalModuleReplacementPlugin.js#L9
 */
export declare class DedupeModuleResolvePlugin {
    private options?;
    modules: Map<string, {
        request: string;
        resource: string;
    }>;
    constructor(options?: DedupeModuleResolvePluginOptions | undefined);
    apply(compiler: Compiler): void;
}

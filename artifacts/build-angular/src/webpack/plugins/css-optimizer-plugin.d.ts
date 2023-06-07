/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Compiler } from 'webpack';
export interface CssOptimizerPluginOptions {
    supportedBrowsers?: string[];
}
/**
 * A Webpack plugin that provides CSS optimization capabilities.
 *
 * The plugin uses both `esbuild` to provide both fast and highly-optimized
 * code output.
 */
export declare class CssOptimizerPlugin {
    private targets;
    private esbuild;
    constructor(options?: CssOptimizerPluginOptions);
    apply(compiler: Compiler): void;
    /**
     * Optimizes a CSS asset using esbuild.
     *
     * @param input The CSS asset source content to optimize.
     * @param name The name of the CSS asset. Used to generate source maps.
     * @param inputMap Optionally specifies the CSS asset's original source map that will
     * be merged with the intermediate optimized source map.
     * @param target Optionally specifies the target browsers for the output code.
     * @returns A promise resolving to the optimized CSS, source map, and any warnings.
     */
    private optimize;
    private addWarnings;
}

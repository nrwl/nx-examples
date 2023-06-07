/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Plugin } from 'esbuild';
/**
 * An object containing the plugin options to use when processing CSS stylesheets.
 */
export interface CssPluginOptions {
    /**
     * Controls the use and creation of sourcemaps when processing the stylesheets.
     * If true, sourcemap processing is enabled; if false, disabled.
     */
    sourcemap: boolean;
    /**
     * Optional component data for any inline styles from Component decorator `styles` fields.
     * The key is an internal angular resource URI and the value is the stylesheet content.
     */
    inlineComponentData?: Record<string, string>;
    /**
     * The browsers to support in browserslist format when processing stylesheets.
     * Some postcss plugins such as autoprefixer require the raw browserslist information instead
     * of the esbuild formatted target.
     */
    browsers: string[];
    tailwindConfiguration?: {
        file: string;
        package: string;
    };
}
/**
 * Creates an esbuild plugin to process CSS stylesheets.
 * @param options An object containing the plugin options.
 * @returns An esbuild Plugin instance.
 */
export declare function createCssPlugin(options: CssPluginOptions): Plugin;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { BuildOptions, OutputFile } from 'esbuild';
import { LoadResultCache } from '../load-result-cache';
export interface BundleStylesheetOptions {
    workspaceRoot: string;
    optimization: boolean;
    preserveSymlinks?: boolean;
    sourcemap: boolean | 'external' | 'inline';
    outputNames?: {
        bundles?: string;
        media?: string;
    };
    includePaths?: string[];
    externalDependencies?: string[];
    target: string[];
    browsers: string[];
    tailwindConfiguration?: {
        file: string;
        package: string;
    };
}
export declare function createStylesheetBundleOptions(options: BundleStylesheetOptions, cache?: LoadResultCache, inlineComponentData?: Record<string, string>): BuildOptions & {
    plugins: NonNullable<BuildOptions['plugins']>;
};
/**
 * Bundles a component stylesheet. The stylesheet can be either an inline stylesheet that
 * is contained within the Component's metadata definition or an external file referenced
 * from the Component's metadata definition.
 *
 * @param identifier A unique string identifier for the component stylesheet.
 * @param language The language of the stylesheet such as `css` or `scss`.
 * @param data The string content of the stylesheet.
 * @param filename The filename representing the source of the stylesheet content.
 * @param inline If true, the stylesheet source is within the component metadata;
 * if false, the source is a stylesheet file.
 * @param options An object containing the stylesheet bundling options.
 * @returns An object containing the output of the bundling operation.
 */
export declare function bundleComponentStylesheet(language: string, data: string, filename: string, inline: boolean, options: BundleStylesheetOptions, cache?: LoadResultCache): Promise<{
    errors: import("esbuild").Message[] | undefined;
    warnings: import("esbuild").Message[];
    contents: string;
    map: string | undefined;
    path: string | undefined;
    resourceFiles: OutputFile[];
    metafile: import("esbuild").Metafile | undefined;
}>;

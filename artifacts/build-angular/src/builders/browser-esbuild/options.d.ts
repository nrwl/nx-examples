/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { Schema as BrowserBuilderOptions } from './schema';
export type NormalizedBrowserOptions = Awaited<ReturnType<typeof normalizeOptions>>;
/** Internal options hidden from builder schema but available when invoked programmatically. */
interface InternalOptions {
    /**
     * Entry points to use for the compilation. Incompatible with `main`, which must not be provided. May be relative or absolute paths.
     * If given a relative path, it is resolved relative to the current workspace and will generate an output at the same relative location
     * in the output directory. If given an absolute path, the output will be generated in the root of the output directory with the same base
     * name.
     */
    entryPoints?: Set<string>;
    /** File extension to use for the generated output files. */
    outExtension?: 'js' | 'mjs';
}
/** Full set of options for `browser-esbuild` builder. */
export type BrowserEsbuildOptions = Omit<BrowserBuilderOptions & InternalOptions, 'main'> & {
    main?: string;
};
/**
 * Normalize the user provided options by creating full paths for all path based options
 * and converting multi-form options into a single form that can be directly used
 * by the build process.
 *
 * @param context The context for current builder execution.
 * @param projectName The name of the project for the current execution.
 * @param options An object containing the options to use for the build.
 * @returns An object containing normalized options required to perform the build.
 */
export declare function normalizeOptions(context: BuilderContext, projectName: string, options: BrowserEsbuildOptions): Promise<{
    advancedOptimizations: boolean | undefined;
    allowedCommonJsDependencies: string[] | undefined;
    baseHref: string | undefined;
    cacheOptions: import("../../utils/normalize-cache").NormalizedCachedOptions;
    crossOrigin: import("./schema").CrossOrigin | undefined;
    externalDependencies: string[] | undefined;
    extractLicenses: boolean | undefined;
    inlineStyleLanguage: string;
    jit: boolean;
    stats: boolean;
    polyfills: string[] | undefined;
    poll: number | undefined;
    progress: boolean;
    preserveSymlinks: boolean;
    stylePreprocessorOptions: import("./schema").StylePreprocessorOptions | undefined;
    subresourceIntegrity: boolean | undefined;
    verbose: boolean | undefined;
    watch: boolean | undefined;
    workspaceRoot: string;
    entryPoints: Record<string, string>;
    optimizationOptions: import("../../utils").NormalizedOptimizationOptions;
    outputPath: string;
    outExtension: "js" | "mjs" | undefined;
    sourcemapOptions: import("../..").SourceMapObject;
    tsconfig: string;
    projectRoot: string;
    assets: import("../..").AssetPatternObject[] | undefined;
    outputNames: {
        bundles: string;
        media: string;
    };
    fileReplacements: Record<string, string> | undefined;
    globalStyles: {
        name: string;
        files: string[];
        initial: boolean;
    }[];
    globalScripts: {
        name: string;
        files: string[];
        initial: boolean;
    }[];
    serviceWorkerOptions: string | undefined;
    indexHtmlOptions: {
        input: string;
        output: string;
        insertionOrder: import("../../utils/package-chunk-sort").EntryPointsType[];
    } | undefined;
    tailwindConfiguration: {
        file: string;
        package: string;
    } | undefined;
}>;
export {};

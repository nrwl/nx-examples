/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { ObjectPattern } from 'copy-webpack-plugin';
import type { Configuration, WebpackOptionsNormalized } from 'webpack';
import { AssetPatternClass, OutputHashing, ScriptElement, StyleElement } from '../../builders/browser/schema';
import { WebpackConfigOptions } from '../../utils/build-options';
export interface HashFormat {
    chunk: string;
    extract: string;
    file: string;
    script: string;
}
export type WebpackStatsOptions = Exclude<Configuration['stats'], string | boolean | undefined>;
export declare function getOutputHashFormat(outputHashing?: OutputHashing, length?: number): HashFormat;
export type NormalizedEntryPoint = Required<Exclude<ScriptElement | StyleElement, string>>;
export declare function normalizeExtraEntryPoints(extraEntryPoints: (ScriptElement | StyleElement)[], defaultBundleName: string): NormalizedEntryPoint[];
export declare function assetNameTemplateFactory(hashFormat: HashFormat): (resourcePath: string) => string;
export declare function getInstrumentationExcludedPaths(root: string, excludedPaths: string[]): Set<string>;
export declare function normalizeGlobalStyles(styleEntrypoints: StyleElement[]): {
    entryPoints: Record<string, string[]>;
    noInjectNames: string[];
};
export declare function getCacheSettings(wco: WebpackConfigOptions, angularVersion: string): WebpackOptionsNormalized['cache'];
export declare function globalScriptsByBundleName(scripts: ScriptElement[]): {
    bundleName: string;
    inject: boolean;
    paths: string[];
}[];
export declare function assetPatterns(root: string, assets: AssetPatternClass[]): ObjectPattern[];
export declare function getStatsOptions(verbose?: boolean): WebpackStatsOptions;
/**
 * @param root the workspace root
 * @returns `true` when `@angular/platform-server` is installed.
 */
export declare function isPlatformServerInstalled(root: string): boolean;

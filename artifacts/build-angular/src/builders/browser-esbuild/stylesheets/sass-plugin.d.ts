/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Plugin } from 'esbuild';
import type { LoadResultCache } from '../load-result-cache';
export interface SassPluginOptions {
    sourcemap: boolean;
    loadPaths?: string[];
    inlineComponentData?: Record<string, string>;
}
export declare function shutdownSassWorkerPool(): void;
export declare function createSassPlugin(options: SassPluginOptions, cache?: LoadResultCache): Plugin;

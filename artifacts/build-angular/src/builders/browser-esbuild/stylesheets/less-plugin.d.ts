/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Plugin } from 'esbuild';
export interface LessPluginOptions {
    sourcemap: boolean;
    includePaths?: string[];
    inlineComponentData?: Record<string, string>;
}
export declare function createLessPlugin(options: LessPluginOptions): Plugin;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { BuildOptions } from 'esbuild';
import { NormalizedBrowserOptions } from './options';
/**
 * Create an esbuild 'build' options object for all global scripts defined in the user provied
 * build options.
 * @param options The builder's user-provider normalized options.
 * @returns An esbuild BuildOptions object.
 */
export declare function createGlobalScriptsBundleOptions(options: NormalizedBrowserOptions, initial: boolean): BuildOptions | undefined;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Compiler } from 'webpack';
export interface StylesWebpackPluginOptions {
    preserveSymlinks?: boolean;
    root: string;
    entryPoints: Record<string, string[]>;
}
export declare class StylesWebpackPlugin {
    private readonly options;
    private compilation;
    constructor(options: StylesWebpackPluginOptions);
    apply(compiler: Compiler): void;
}

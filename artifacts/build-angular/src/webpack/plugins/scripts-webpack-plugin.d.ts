/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compilation, Compiler } from 'webpack';
export interface ScriptsWebpackPluginOptions {
    name: string;
    sourceMap?: boolean;
    scripts: string[];
    filename: string;
    basePath: string;
}
export declare class ScriptsWebpackPlugin {
    private options;
    private _lastBuildTime?;
    private _cachedOutput?;
    constructor(options: ScriptsWebpackPluginOptions);
    shouldSkip(compilation: Compilation, scripts: string[]): Promise<boolean>;
    private _insertOutput;
    apply(compiler: Compiler): void;
}

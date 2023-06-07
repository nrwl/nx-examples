/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export interface OccurrencesPluginOptions {
    aot?: boolean;
    scriptsOptimization?: boolean;
}
export declare class OccurrencesPlugin {
    private options;
    constructor(options: OccurrencesPluginOptions);
    apply(compiler: Compiler): void;
    private countOccurrences;
}

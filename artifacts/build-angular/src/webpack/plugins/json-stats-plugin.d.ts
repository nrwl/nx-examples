/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export declare class JsonStatsPlugin {
    private readonly statsOutputPath;
    constructor(statsOutputPath: string);
    apply(compiler: Compiler): void;
}

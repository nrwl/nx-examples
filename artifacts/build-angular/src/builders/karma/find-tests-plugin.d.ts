/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Compiler } from 'webpack';
export interface FindTestsPluginOptions {
    include?: string[];
    exclude?: string[];
    workspaceRoot: string;
    projectSourceRoot: string;
}
export declare class FindTestsPlugin {
    private options;
    private compilation;
    constructor(options: FindTestsPluginOptions);
    apply(compiler: Compiler): void;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export interface CommonJsUsageWarnPluginOptions {
    /** A list of CommonJS packages that are allowed to be used without a warning. */
    allowedDependencies?: string[];
}
export declare class CommonJsUsageWarnPlugin {
    private options;
    private shownWarnings;
    private allowedDependencies;
    constructor(options?: CommonJsUsageWarnPluginOptions);
    apply(compiler: Compiler): void;
    private hasCommonJsDependencies;
    private rawRequestToPackageName;
}

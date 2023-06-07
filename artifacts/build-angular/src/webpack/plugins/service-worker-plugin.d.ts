/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Compiler } from 'webpack';
export interface ServiceWorkerPluginOptions {
    projectRoot: string;
    root: string;
    baseHref?: string;
    ngswConfigPath?: string;
}
export declare class ServiceWorkerPlugin {
    private readonly options;
    constructor(options: ServiceWorkerPluginOptions);
    apply(compiler: Compiler): void;
}

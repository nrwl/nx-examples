/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InlineOptions } from './bundle-inline-options';
import { I18nOptions } from './i18n-options';
export declare class BundleActionExecutor {
    private workerOptions;
    private workerPool?;
    constructor(workerOptions: {
        i18n: I18nOptions;
    });
    private ensureWorkerPool;
    inline(action: InlineOptions): Promise<{
        file: string;
        diagnostics: {
            type: string;
            message: string;
        }[];
        count: number;
    }>;
    inlineAll(actions: Iterable<InlineOptions>): AsyncIterable<{
        file: string;
        diagnostics: {
            type: string;
            message: string;
        }[];
        count: number;
    }>;
    private static executeAll;
    stop(): void;
}

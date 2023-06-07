/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { OnLoadResult } from 'esbuild';
export interface LoadResultCache {
    get(path: string): OnLoadResult | undefined;
    put(path: string, result: OnLoadResult): Promise<void>;
}
export declare class MemoryLoadResultCache implements LoadResultCache {
    #private;
    get(path: string): OnLoadResult | undefined;
    put(path: string, result: OnLoadResult): Promise<void>;
    invalidate(path: string): boolean;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare class ChangedFiles {
    readonly added: Set<string>;
    readonly modified: Set<string>;
    readonly removed: Set<string>;
    toDebugString(): string;
}
export interface BuildWatcher extends AsyncIterableIterator<ChangedFiles> {
    add(paths: string | string[]): void;
    remove(paths: string | string[]): void;
    close(): Promise<void>;
}
export declare function createWatcher(options?: {
    polling?: boolean;
    interval?: number;
    ignored?: string[];
}): BuildWatcher;

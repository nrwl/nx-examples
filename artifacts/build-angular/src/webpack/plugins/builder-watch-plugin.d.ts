/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export type BuilderWatcherCallback = (events: Array<{
    path: string;
    type: 'created' | 'modified' | 'deleted';
    time?: number;
}>) => void;
export interface BuilderWatcherFactory {
    watch(files: Iterable<string>, directories: Iterable<string>, callback: BuilderWatcherCallback): {
        close(): void;
    };
}
export declare class BuilderWatchPlugin {
    private readonly watcherFactory;
    constructor(watcherFactory: BuilderWatcherFactory);
    apply(compiler: Compiler): void;
}

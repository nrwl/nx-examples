/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="node" />
import type { BuilderContext } from '@angular-devkit/architect';
import { InlineConfig } from 'vite';
import type { NormalizedDevServerOptions } from './options';
import type { DevServerBuilderOutput } from './webpack-server';
interface OutputFileRecord {
    contents: Uint8Array;
    size: number;
    hash?: Buffer;
    updated: boolean;
}
export declare function serveWithVite(serverOptions: NormalizedDevServerOptions, builderName: string, context: BuilderContext): AsyncIterableIterator<DevServerBuilderOutput>;
export declare function setupServer(serverOptions: NormalizedDevServerOptions, outputFiles: Map<string, OutputFileRecord>, assets: Map<string, string>): Promise<InlineConfig>;
export {};

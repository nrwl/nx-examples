/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Config, Filesystem } from '@angular/service-worker/config';
import type { OutputFile } from 'esbuild';
import { promises as fsPromises } from 'node:fs';
export declare function augmentAppWithServiceWorker(appRoot: string, workspaceRoot: string, outputPath: string, baseHref: string, ngswConfigPath?: string, inputputFileSystem?: typeof fsPromises, outputFileSystem?: typeof fsPromises): Promise<void>;
export declare function augmentAppWithServiceWorkerEsbuild(workspaceRoot: string, configPath: string, baseHref: string, outputFiles: OutputFile[], assetFiles: {
    source: string;
    destination: string;
}[]): Promise<{
    manifest: string;
    assetFiles: {
        source: string;
        destination: string;
    }[];
}>;
export declare function augmentAppWithServiceWorkerCore(config: Config, serviceWorkerFilesystem: Filesystem, baseHref: string): Promise<{
    manifest: string;
    assetFiles: {
        source: string;
        destination: string;
    }[];
}>;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompileResult, FileImporter, StringOptionsWithImporter, StringOptionsWithoutImporter } from 'sass';
type FileImporterOptions = Parameters<FileImporter['findFileUrl']>[1];
export interface FileImporterWithRequestContextOptions extends FileImporterOptions {
    /**
     * This is a custom option and is required as SASS does not provide context from which the file is being resolved.
     * This breaks Yarn PNP as transitive deps cannot be resolved from the workspace root.
     *
     * Workaround until https://github.com/sass/sass/issues/3247 is addressed.
     */
    previousResolvedModules?: Set<string>;
}
/**
 * A Sass renderer implementation that provides an interface that can be used by Webpack's
 * `sass-loader`. The implementation uses a Worker thread to perform the Sass rendering
 * with the `dart-sass` package.  The `dart-sass` synchronous render function is used within
 * the worker which can be up to two times faster than the asynchronous variant.
 */
export declare class SassWorkerImplementation {
    private rebase;
    private readonly workers;
    private readonly availableWorkers;
    private readonly requests;
    private readonly workerPath;
    private idCounter;
    private nextWorkerIndex;
    constructor(rebase?: boolean);
    /**
     * Provides information about the Sass implementation.
     * This mimics enough of the `dart-sass` value to be used with the `sass-loader`.
     */
    get info(): string;
    /**
     * The synchronous render function is not used by the `sass-loader`.
     */
    compileString(): never;
    /**
     * Asynchronously request a Sass stylesheet to be renderered.
     *
     * @param source The contents to compile.
     * @param options The `dart-sass` options to use when rendering the stylesheet.
     */
    compileStringAsync(source: string, options: StringOptionsWithImporter<'async'> | StringOptionsWithoutImporter<'async'>): Promise<CompileResult>;
    /**
     * Shutdown the Sass render worker.
     * Executing this method will stop any pending render requests.
     */
    close(): void;
    private createWorker;
    private processImporters;
    private createRequest;
    private isImporter;
}
export {};

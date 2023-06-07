/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Transformation options that should apply to all transformed files and data.
 */
export interface JavaScriptTransformerOptions {
    sourcemap: boolean;
    thirdPartySourcemaps?: boolean;
    advancedOptimizations?: boolean;
    jit?: boolean;
}
/**
 * A class that performs transformation of JavaScript files and raw data.
 * A worker pool is used to distribute the transformation actions and allow
 * parallel processing. Transformation behavior is based on the filename and
 * data. Transformations may include: async downleveling, Angular linking,
 * and advanced optimizations.
 */
export declare class JavaScriptTransformer {
    #private;
    constructor(options: JavaScriptTransformerOptions, maxThreads?: number);
    /**
     * Performs JavaScript transformations on a file from the filesystem.
     * If no transformations are required, the data for the original file will be returned.
     * @param filename The full path to the file.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    transformFile(filename: string, skipLinker?: boolean): Promise<Uint8Array>;
    /**
     * Performs JavaScript transformations on the provided data of a file. The file does not need
     * to exist on the filesystem.
     * @param filename The full path of the file represented by the data.
     * @param data The data of the file that should be transformed.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    transformData(filename: string, data: string, skipLinker: boolean): Promise<Uint8Array>;
    /**
     * Stops all active transformation tasks and shuts down all workers.
     * @returns A void promise that resolves when closing is complete.
     */
    close(): Promise<void>;
}

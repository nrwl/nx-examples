/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { FormatMessagesOptions, PartialMessage, TransformOptions, TransformResult } from 'esbuild';
/**
 * Provides the ability to execute esbuild regardless of the current platform's support
 * for using the native variant of esbuild. The native variant will be preferred (assuming
 * the `alwaysUseWasm` constructor option is `false) due to its inherent performance advantages.
 * At first use of esbuild, a supportability test will be automatically performed and the
 * WASM-variant will be used if needed by the platform.
 */
export declare class EsbuildExecutor implements Pick<typeof import('esbuild'), 'transform' | 'formatMessages'> {
    private alwaysUseWasm;
    private esbuildTransform;
    private esbuildFormatMessages;
    private initialized;
    /**
     * Constructs an instance of the `EsbuildExecutor` class.
     *
     * @param alwaysUseWasm If true, the WASM-variant will be preferred and no support test will be
     * performed; if false (default), the native variant will be preferred.
     */
    constructor(alwaysUseWasm?: boolean);
    /**
     * Determines whether the native variant of esbuild can be used on the current platform.
     *
     * @returns A promise which resolves to `true`, if the native variant of esbuild is support or `false`, if the WASM variant is required.
     */
    static hasNativeSupport(): Promise<boolean>;
    /**
     * Initializes the esbuild transform and format messages functions.
     *
     * @returns A promise that fulfills when esbuild has been loaded and available for use.
     */
    private ensureEsbuild;
    /**
     * Transitions an executor instance to use the WASM-variant of esbuild.
     */
    private useWasm;
    transform(input: string | Uint8Array, options?: TransformOptions): Promise<TransformResult>;
    formatMessages(messages: PartialMessage[], options: FormatMessagesOptions): Promise<string[]>;
}

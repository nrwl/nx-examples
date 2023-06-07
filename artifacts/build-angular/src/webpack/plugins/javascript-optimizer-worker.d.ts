/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * The options to use when optimizing.
 */
export interface OptimizeRequestOptions {
    /**
     * Controls advanced optimizations.
     * Currently these are only terser related:
     * * terser compress passes are set to 2
     * * terser pure_getters option is enabled
     */
    advanced?: boolean;
    /**
     * Specifies the string tokens that should be replaced with a defined value.
     */
    define?: Record<string, string>;
    /**
     * Controls whether class, function, and variable names should be left intact
     * throughout the output code.
     */
    keepIdentifierNames: boolean;
    /**
     * Controls whether to retain the original name of classes and functions.
     */
    keepNames: boolean;
    /**
     * Controls whether license text is removed from the output code.
     * Within the CLI, this option is linked to the license extraction functionality.
     */
    removeLicenses?: boolean;
    /**
     * Controls whether source maps should be generated.
     */
    sourcemap?: boolean;
    /**
     * Specifies the list of supported esbuild targets.
     * @see: https://esbuild.github.io/api/#target
     */
    target?: string[];
    /**
     * Controls whether esbuild should only use the WASM-variant instead of trying to
     * use the native variant. Some platforms may not support the native-variant and
     * this option allows one support test to be conducted prior to all the workers starting.
     */
    alwaysUseWasm: boolean;
}
/**
 * A request to optimize JavaScript using the supplied options.
 */
interface OptimizeRequest {
    /**
     * The options to use when optimizing.
     */
    options: OptimizeRequestOptions;
    /**
     * The JavaScript asset to optimize.
     */
    asset: {
        /**
         * The name of the JavaScript asset (typically the filename).
         */
        name: string;
        /**
         * The source content of the JavaScript asset.
         */
        code: string;
        /**
         * The source map of the JavaScript asset, if available.
         * This map is merged with all intermediate source maps during optimization.
         */
        map: object;
    };
}
/**
 * Handles optimization requests sent from the main thread via the `JavaScriptOptimizerPlugin`.
 */
export default function ({ asset, options }: OptimizeRequest): Promise<{
    name: string;
    errors: string[];
    code?: undefined;
    map?: undefined;
} | {
    name: string;
    code: string;
    map: import("@ampproject/remapping/dist/types/source-map").default | undefined;
    errors?: undefined;
}>;
export {};

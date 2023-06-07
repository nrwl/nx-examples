/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Remove .js files from entry points consisting entirely of stylesheets.
 * To be used together with mini-css-extract-plugin.
 */
export declare class SuppressExtractedTextChunksWebpackPlugin {
    apply(compiler: import('webpack').Compiler): void;
}

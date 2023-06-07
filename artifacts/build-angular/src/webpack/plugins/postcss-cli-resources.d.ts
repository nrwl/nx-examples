/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Plugin } from 'postcss';
export interface PostcssCliResourcesOptions {
    baseHref?: string;
    deployUrl?: string;
    resourcesOutputPath?: string;
    rebaseRootRelative?: boolean;
    /** CSS is extracted to a `.css` or is embedded in a `.js` file. */
    extracted?: boolean;
    filename: (resourcePath: string) => string;
    loader: import('webpack').LoaderContext<unknown>;
    emitFile: boolean;
}
export declare const postcss = true;
export default function (options?: PostcssCliResourcesOptions): Plugin;

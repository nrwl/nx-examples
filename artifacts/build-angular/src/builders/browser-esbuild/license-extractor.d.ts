/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Metafile } from 'esbuild';
/**
 * Extracts license information for each node module package included in the output
 * files of the built code. This includes JavaScript and CSS output files. The esbuild
 * metafile generated during the bundling steps is used as the source of information
 * regarding what input files where included and where they are located. A path segment
 * of `node_modules` is used to indicate that a file belongs to a package and its license
 * should be include in the output licenses file.
 *
 * The package name and license field are extracted from the `package.json` file for the
 * package. If a license file (e.g., `LICENSE`) is present in the root of the package, it
 * will also be included in the output licenses file.
 *
 * @param metafile An esbuild metafile object.
 * @param rootDirectory The root directory of the workspace.
 * @returns A string containing the content of the output licenses file.
 */
export declare function extractLicenses(metafile: Metafile, rootDirectory: string): Promise<string>;

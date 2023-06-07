/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { json, logging } from '@angular-devkit/core';
import { AssetPatternClass, Schema as BrowserBuilderSchema, SourceMapClass } from '../builders/browser/schema';
import { BuildOptions } from './build-options';
import { NormalizedFileReplacement } from './normalize-file-replacements';
import { NormalizedOptimizationOptions } from './normalize-optimization';
/**
 * A normalized browser builder schema.
 */
export type NormalizedBrowserBuilderSchema = BrowserBuilderSchema & BuildOptions & {
    sourceMap: SourceMapClass;
    assets: AssetPatternClass[];
    fileReplacements: NormalizedFileReplacement[];
    optimization: NormalizedOptimizationOptions;
    polyfills: string[];
};
export declare function normalizeBrowserSchema(workspaceRoot: string, projectRoot: string, projectSourceRoot: string | undefined, options: BrowserBuilderSchema, metadata: json.JsonObject, logger: logging.LoggerApi): NormalizedBrowserBuilderSchema;

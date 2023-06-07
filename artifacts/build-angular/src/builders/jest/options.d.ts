/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Schema as JestBuilderSchema } from './schema';
/**
 * Options supported for the Jest builder. The schema is an approximate
 * representation of the options type, but this is a more precise version.
 */
export type JestBuilderOptions = JestBuilderSchema & {
    include: string[];
    exclude: string[];
};
/**
 * Normalizes input options validated by the schema to a more precise and useful
 * options type in {@link JestBuilderOptions}.
 */
export declare function normalizeOptions(schema: JestBuilderSchema): JestBuilderOptions;

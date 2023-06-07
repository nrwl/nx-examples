/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { JestBuilderOptions } from './options';
declare const globAsync: typeof import("glob").__promisify__;
/**
 * Finds all test files in the project.
 *
 * @param options The builder options describing where to find tests.
 * @param workspaceRoot The path to the root directory of the workspace.
 * @param glob A promisified implementation of the `glob` module. Only intended for
 *     testing purposes.
 * @returns A set of all test files in the project.
 */
export declare function findTestFiles(options: JestBuilderOptions, workspaceRoot: string, glob?: typeof globAsync): Promise<Set<string>>;
export {};

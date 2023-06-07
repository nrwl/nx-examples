/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseException } from '@angular-devkit/core';
import { FileReplacement } from '../builders/browser/schema';
export declare class MissingFileReplacementException extends BaseException {
    constructor(path: String);
}
export interface NormalizedFileReplacement {
    replace: string;
    with: string;
}
export declare function normalizeFileReplacements(fileReplacements: FileReplacement[], workspaceRoot: string): NormalizedFileReplacement[];

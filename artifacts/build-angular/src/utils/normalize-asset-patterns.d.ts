/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseException } from '@angular-devkit/core';
import { AssetPattern, AssetPatternClass } from '../builders/browser/schema';
export declare class MissingAssetSourceRootException extends BaseException {
    constructor(path: String);
}
export declare function normalizeAssetPatterns(assetPatterns: AssetPattern[], workspaceRoot: string, projectRoot: string, projectSourceRoot: string | undefined): AssetPatternClass[];

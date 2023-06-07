/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ScriptElement, StyleElement } from '../builders/browser/schema';
export type EntryPointsType = [name: string, isModule: boolean];
export declare function generateEntryPoints(options: {
    styles: StyleElement[];
    scripts: ScriptElement[];
    isHMREnabled?: boolean;
}): EntryPointsType[];

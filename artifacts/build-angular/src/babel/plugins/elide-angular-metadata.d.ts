/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PluginObj } from '@babel/core';
/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
export declare function getKeywords(): Iterable<string>;
/**
 * A babel plugin factory function for eliding the Angular class metadata function (`ɵsetClassMetadata`).
 *
 * @returns A babel plugin object instance.
 */
export default function (): PluginObj;

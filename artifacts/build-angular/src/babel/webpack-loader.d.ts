/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationPresetOptions } from './presets/application';
interface AngularCustomOptions extends Omit<ApplicationPresetOptions, 'instrumentCode'> {
    instrumentCode?: {
        /** node_modules and test files are always excluded. */
        excludedPaths: Set<String>;
        includedBasePath: string;
    };
}
export type AngularBabelLoaderOptions = AngularCustomOptions & Record<string, unknown>;
export declare function requiresLinking(path: string, source: string): Promise<boolean>;
declare const _default: any;
export default _default;

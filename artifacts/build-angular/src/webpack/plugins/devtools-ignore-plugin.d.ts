/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
/**
 * This plugin adds a field to source maps that identifies which sources are
 * vendored or runtime-injected (aka third-party) sources. These are consumed by
 * Chrome DevTools to automatically ignore-list sources.
 */
export declare class DevToolsIgnorePlugin {
    apply(compiler: Compiler): void;
}

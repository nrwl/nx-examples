/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ProgressPlugin as WebpackProgressPlugin } from 'webpack';
export declare class ProgressPlugin extends WebpackProgressPlugin {
    platform: 'server' | 'browser';
    constructor(platform: 'server' | 'browser');
}

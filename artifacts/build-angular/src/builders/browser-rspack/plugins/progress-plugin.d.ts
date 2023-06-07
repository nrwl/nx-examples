/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ProgressPlugin as WebpackProgressPlugin } from './webpack/webpack-progress-plugin';
export declare class ProgressPlugin extends WebpackProgressPlugin {
    constructor(platform: 'server' | 'browser');
}

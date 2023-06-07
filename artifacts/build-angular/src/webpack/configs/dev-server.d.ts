/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { Configuration } from 'webpack';
import { WebpackConfigOptions, WebpackDevServerOptions } from '../../utils/build-options';
export declare function getDevServerConfig(wco: WebpackConfigOptions<WebpackDevServerOptions>): Promise<Configuration>;
/**
 * Resolve and build a URL _path_ that will be the root of the server. This resolved base href and
 * deploy URL from the browser options and returns a path from the root.
 */
export declare function buildServePath(options: WebpackDevServerOptions, logger: logging.LoggerApi): string;

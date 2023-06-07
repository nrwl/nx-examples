/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { Schema as DevServerOptions } from './schema';
export type NormalizedDevServerOptions = Awaited<ReturnType<typeof normalizeOptions>>;
/**
 * Normalize the user provided options by creating full paths for all path based options
 * and converting multi-form options into a single form that can be directly used
 * by the build process.
 *
 * @param context The context for current builder execution.
 * @param projectName The name of the project for the current execution.
 * @param options An object containing the options to use for the build.
 * @returns An object containing normalized options required to perform the build.
 */
export declare function normalizeOptions(context: BuilderContext, projectName: string, options: DevServerOptions): Promise<{
    browserTarget: import("@angular-devkit/architect").Target;
    host: string;
    port: number;
    poll: number | undefined;
    open: boolean | undefined;
    verbose: boolean | undefined;
    watch: boolean | undefined;
    liveReload: boolean | undefined;
    hmr: boolean | undefined;
    headers: {
        [key: string]: string;
    } | undefined;
    workspaceRoot: string;
    projectRoot: string;
    cacheOptions: import("../../utils/normalize-cache").NormalizedCachedOptions;
    allowedHosts: string[] | undefined;
    disableHostCheck: boolean | undefined;
    proxyConfig: string | undefined;
    servePath: string | undefined;
    publicHost: string | undefined;
    ssl: boolean | undefined;
    sslCert: string | undefined;
    sslKey: string | undefined;
}>;

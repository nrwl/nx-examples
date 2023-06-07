/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NormalizedCachedOptions } from '../normalize-cache';
export interface InlineFontsOptions {
    minify?: boolean;
    cache?: NormalizedCachedOptions;
}
export declare class InlineFontsProcessor {
    private options;
    private readonly cachePath;
    constructor(options: InlineFontsOptions);
    process(content: string): Promise<string>;
    private getResponse;
    private processHref;
    private getFontProviderDetails;
    private createNormalizedUrl;
}

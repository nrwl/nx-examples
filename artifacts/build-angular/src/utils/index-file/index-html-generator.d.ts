/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NormalizedCachedOptions } from '../normalize-cache';
import { NormalizedOptimizationOptions } from '../normalize-optimization';
import { CrossOriginValue, Entrypoint, FileInfo } from './augment-index-html';
export interface IndexHtmlGeneratorProcessOptions {
    lang: string | undefined;
    baseHref: string | undefined;
    outputPath: string;
    files: FileInfo[];
}
export interface IndexHtmlGeneratorOptions {
    indexPath: string;
    deployUrl?: string;
    sri?: boolean;
    entrypoints: Entrypoint[];
    postTransform?: IndexHtmlTransform;
    crossOrigin?: CrossOriginValue;
    optimization?: NormalizedOptimizationOptions;
    cache?: NormalizedCachedOptions;
}
export type IndexHtmlTransform = (content: string) => Promise<string>;
export interface IndexHtmlTransformResult {
    content: string;
    warnings: string[];
    errors: string[];
}
export declare class IndexHtmlGenerator {
    readonly options: IndexHtmlGeneratorOptions;
    private readonly plugins;
    constructor(options: IndexHtmlGeneratorOptions);
    process(options: IndexHtmlGeneratorProcessOptions): Promise<IndexHtmlTransformResult>;
    readAsset(path: string): Promise<string>;
    protected readIndex(path: string): Promise<string>;
}

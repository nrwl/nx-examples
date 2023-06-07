/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WebpackLoggingCallback } from '@angular-devkit/build-webpack';
import { logging } from '@angular-devkit/core';
import { Configuration, StatsCompilation } from 'webpack';
import { Schema as BrowserBuilderOptions } from '../../builders/browser/schema';
import { BudgetCalculatorResult } from '../../utils/bundle-calculator';
import { WebpackStatsOptions } from './helpers';
export declare function formatSize(size: number): string;
export type BundleStatsData = [
    files: string,
    names: string,
    rawSize: number | string,
    estimatedTransferSize: number | string
];
export interface BundleStats {
    initial: boolean;
    stats: BundleStatsData;
}
export declare function generateBuildStatsTable(data: BundleStats[], colors: boolean, showTotalSize: boolean, showEstimatedTransferSize: boolean, budgetFailures?: BudgetCalculatorResult[]): string;
export declare function statsWarningsToString(json: StatsCompilation, statsConfig: WebpackStatsOptions): string;
export declare function statsErrorsToString(json: StatsCompilation, statsConfig: WebpackStatsOptions): string;
export declare function statsHasErrors(json: StatsCompilation): boolean;
export declare function statsHasWarnings(json: StatsCompilation): boolean;
export declare function createWebpackLoggingCallback(options: BrowserBuilderOptions, logger: logging.LoggerApi): WebpackLoggingCallback;
export interface BuildEventStats {
    aot: boolean;
    optimization: boolean;
    allChunksCount: number;
    lazyChunksCount: number;
    initialChunksCount: number;
    changedChunksCount?: number;
    durationInMs: number;
    cssSizeInBytes: number;
    jsSizeInBytes: number;
    ngComponentCount: number;
}
export declare function generateBuildEventStats(webpackStats: StatsCompilation, browserBuilderOptions: BrowserBuilderOptions): BuildEventStats;
export declare function webpackStatsLogger(logger: logging.LoggerApi, json: StatsCompilation, config: Configuration, budgetFailures?: BudgetCalculatorResult[]): void;

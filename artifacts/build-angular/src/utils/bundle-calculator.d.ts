/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StatsCompilation } from 'webpack';
import { Budget } from '../builders/browser/schema';
interface Threshold {
    limit: number;
    type: ThresholdType;
    severity: ThresholdSeverity;
}
declare enum ThresholdType {
    Max = "maximum",
    Min = "minimum"
}
export declare enum ThresholdSeverity {
    Warning = "warning",
    Error = "error"
}
export interface BudgetCalculatorResult {
    severity: ThresholdSeverity;
    message: string;
    label?: string;
}
export declare function calculateThresholds(budget: Budget): IterableIterator<Threshold>;
export declare function checkBudgets(budgets: Budget[], webpackStats: StatsCompilation): IterableIterator<BudgetCalculatorResult>;
export declare function checkThresholds(thresholds: IterableIterator<Threshold>, size: number, label?: string): IterableIterator<BudgetCalculatorResult>;
export {};

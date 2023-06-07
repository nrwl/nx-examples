/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
import { Budget } from '../../builders/browser/schema';
/**
 * Check budget sizes for component styles by emitting a warning or error if a
 * budget is exceeded by a particular component's styles.
 */
export declare class AnyComponentStyleBudgetChecker {
    private readonly budgets;
    constructor(budgets: Budget[]);
    apply(compiler: Compiler): void;
}

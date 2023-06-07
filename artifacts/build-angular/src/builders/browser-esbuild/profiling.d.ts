/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function resetCumulativeDurations(): void;
export declare function logCumulativeDurations(): void;
export declare function profileAsync<T>(name: string, action: () => Promise<T>, cumulative?: boolean): Promise<T>;
export declare function profileSync<T>(name: string, action: () => T, cumulative?: boolean): T;

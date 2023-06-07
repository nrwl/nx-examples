/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare class Spinner {
    #private;
    private readonly spinner;
    /** When false, only fail messages will be displayed. */
    enabled: boolean;
    constructor(text?: string);
    set text(text: string);
    get isSpinning(): boolean;
    succeed(text?: string): void;
    fail(text?: string): void;
    stop(): void;
    start(text?: string): void;
}

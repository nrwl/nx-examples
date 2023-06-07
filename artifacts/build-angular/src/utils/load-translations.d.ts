/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Diagnostics } from '@angular/localize/tools';
export type TranslationLoader = (path: string) => {
    translations: Record<string, import('@angular/localize').ɵParsedTranslation>;
    format: string;
    locale?: string;
    diagnostics: Diagnostics;
    integrity: string;
};
export declare function createTranslationLoader(): Promise<TranslationLoader>;

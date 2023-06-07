/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { json } from '@angular-devkit/core';
import { Schema as BrowserBuilderSchema, I18NTranslation } from '../builders/browser/schema';
import { Schema as ServerBuilderSchema } from '../builders/server/schema';
import { TranslationLoader } from './load-translations';
export interface LocaleDescription {
    files: {
        path: string;
        integrity?: string;
        format?: string;
    }[];
    translation?: Record<string, unknown>;
    dataPath?: string;
    baseHref?: string;
}
export interface I18nOptions {
    inlineLocales: Set<string>;
    sourceLocale: string;
    locales: Record<string, LocaleDescription>;
    flatOutput?: boolean;
    readonly shouldInline: boolean;
    hasDefinedSourceLocale?: boolean;
}
export declare function createI18nOptions(metadata: json.JsonObject, inline?: boolean | string[]): I18nOptions;
export declare function configureI18nBuild<T extends BrowserBuilderSchema | ServerBuilderSchema>(context: BuilderContext, options: T): Promise<{
    buildOptions: T;
    i18n: I18nOptions;
}>;
export declare function loadTranslations(locale: string, desc: LocaleDescription, workspaceRoot: string, loader: TranslationLoader, logger: {
    warn: (message: string) => void;
    error: (message: string) => void;
}, usedFormats?: Set<string>, duplicateTranslation?: I18NTranslation): void;

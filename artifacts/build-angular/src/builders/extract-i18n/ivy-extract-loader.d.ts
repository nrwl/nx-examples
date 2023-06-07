/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
type LoaderSourceMap = Parameters<import('webpack').LoaderDefinitionFunction>[1];
interface LocalizeExtractLoaderOptions {
    messageHandler: (messages: import('@angular/localize').ɵParsedMessage[]) => void;
}
export default function localizeExtractLoader(this: import('webpack').LoaderContext<LocalizeExtractLoaderOptions>, content: string, map: LoaderSourceMap): void;
export {};

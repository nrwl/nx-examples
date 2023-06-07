/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function htmlRewritingStream(content: string): Promise<{
    rewriter: import('parse5-html-rewriting-stream').RewritingStream;
    transformedContent: () => Promise<string>;
}>;

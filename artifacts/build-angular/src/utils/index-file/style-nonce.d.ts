/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Finds the `ngCspNonce` value and copies it to all inline `<style>` tags.
 * @param html Markup that should be processed.
 */
export declare function addStyleNonce(html: string): Promise<string>;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
interface JavaScriptTransformRequest {
    filename: string;
    data: string;
    sourcemap: boolean;
    thirdPartySourcemaps: boolean;
    advancedOptimizations: boolean;
    forceAsyncTransformation?: boolean;
    skipLinker: boolean;
    jit: boolean;
}
export default function transformJavaScript(request: JavaScriptTransformRequest): Promise<Uint8Array>;
export {};

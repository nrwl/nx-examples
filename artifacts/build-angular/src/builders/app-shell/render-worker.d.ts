/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * A request to render a Server bundle generate by the universal server builder.
 */
interface RenderRequest {
    /**
     * The path to the server bundle that should be loaded and rendered.
     */
    serverBundlePath: string;
    /**
     * The existing HTML document as a string that will be augmented with the rendered application.
     */
    document: string;
    /**
     * An optional URL path that represents the Angular route that should be rendered.
     */
    url: string | undefined;
}
/**
 * Renders an application based on a provided server bundle path, initial document, and optional URL route.
 * @param param0 A request to render a server bundle.
 * @returns A promise that resolves to the render HTML document for the application.
 */
declare function render({ serverBundlePath, document, url }: RenderRequest): Promise<string>;
/**
 * The default export will be the promise returned by the initialize function.
 * This is awaited by piscina prior to using the Worker.
 */
declare const _default: Promise<typeof render>;
export default _default;

"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_worker_threads_1 = require("node:worker_threads");
/**
 * The fully resolved path to the zone.js package that will be loaded during worker initialization.
 * This is passed as workerData when setting up the worker via the `piscina` package.
 */
const { zonePackage } = node_worker_threads_1.workerData;
/**
 * Renders an application based on a provided server bundle path, initial document, and optional URL route.
 * @param param0 A request to render a server bundle.
 * @returns A promise that resolves to the render HTML document for the application.
 */
async function render({ serverBundlePath, document, url }) {
    const { ɵSERVER_CONTEXT, AppServerModule, renderModule, renderApplication, default: bootstrapAppFn, } = (await Promise.resolve(`${serverBundlePath}`).then(s => __importStar(require(s))));
    (0, node_assert_1.default)(ɵSERVER_CONTEXT, `ɵSERVER_CONTEXT was not exported from: ${serverBundlePath}.`);
    const platformProviders = [
        {
            provide: ɵSERVER_CONTEXT,
            useValue: 'app-shell',
        },
    ];
    // Render platform server module
    if (bootstrapAppFn) {
        (0, node_assert_1.default)(renderApplication, `renderApplication was not exported from: ${serverBundlePath}.`);
        return renderApplication(bootstrapAppFn, {
            document,
            url,
            platformProviders,
        });
    }
    (0, node_assert_1.default)(AppServerModule, `Neither an AppServerModule nor a bootstrapping function was exported from: ${serverBundlePath}.`);
    (0, node_assert_1.default)(renderModule, `renderModule was not exported from: ${serverBundlePath}.`);
    return renderModule(AppServerModule, {
        document,
        url,
        extraProviders: platformProviders,
    });
}
/**
 * Initializes the worker when it is first created by loading the Zone.js package
 * into the worker instance.
 *
 * @returns A promise resolving to the render function of the worker.
 */
async function initialize() {
    // Setup Zone.js
    await Promise.resolve(`${zonePackage}`).then(s => __importStar(require(s)));
    // Return the render function for use
    return render;
}
/**
 * The default export will be the promise returned by the initialize function.
 * This is awaited by piscina prior to using the Worker.
 */
exports.default = initialize();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLXdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2FwcC1zaGVsbC9yZW5kZXItd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCw4REFBaUM7QUFDakMsNkRBQWlEO0FBRWpEOzs7R0FHRztBQUNILE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxnQ0FFdkIsQ0FBQztBQXFDRjs7OztHQUlHO0FBQ0gsS0FBSyxVQUFVLE1BQU0sQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQWlCO0lBQ3RFLE1BQU0sRUFDSixlQUFlLEVBQ2YsZUFBZSxFQUNmLFlBQVksRUFDWixpQkFBaUIsRUFDakIsT0FBTyxFQUFFLGNBQWMsR0FDeEIsR0FBRyxDQUFDLHlCQUFhLGdCQUFnQix1Q0FBQyxDQUF3QixDQUFDO0lBRTVELElBQUEscUJBQU0sRUFBQyxlQUFlLEVBQUUsMENBQTBDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUV2RixNQUFNLGlCQUFpQixHQUFxQjtRQUMxQztZQUNFLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLFFBQVEsRUFBRSxXQUFXO1NBQ3RCO0tBQ0YsQ0FBQztJQUVGLGdDQUFnQztJQUNoQyxJQUFJLGNBQWMsRUFBRTtRQUNsQixJQUFBLHFCQUFNLEVBQUMsaUJBQWlCLEVBQUUsNENBQTRDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUUzRixPQUFPLGlCQUFpQixDQUFDLGNBQWMsRUFBRTtZQUN2QyxRQUFRO1lBQ1IsR0FBRztZQUNILGlCQUFpQjtTQUNsQixDQUFDLENBQUM7S0FDSjtJQUVELElBQUEscUJBQU0sRUFDSixlQUFlLEVBQ2YsOEVBQThFLGdCQUFnQixHQUFHLENBQ2xHLENBQUM7SUFDRixJQUFBLHFCQUFNLEVBQUMsWUFBWSxFQUFFLHVDQUF1QyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7SUFFakYsT0FBTyxZQUFZLENBQUMsZUFBZSxFQUFFO1FBQ25DLFFBQVE7UUFDUixHQUFHO1FBQ0gsY0FBYyxFQUFFLGlCQUFpQjtLQUNsQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxLQUFLLFVBQVUsVUFBVTtJQUN2QixnQkFBZ0I7SUFDaEIseUJBQWEsV0FBVyx1Q0FBQyxDQUFDO0lBRTFCLHFDQUFxQztJQUNyQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsa0JBQWUsVUFBVSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBBcHBsaWNhdGlvblJlZiwgU3RhdGljUHJvdmlkZXIsIFR5cGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB0eXBlIHsgcmVuZGVyQXBwbGljYXRpb24sIHJlbmRlck1vZHVsZSwgybVTRVJWRVJfQ09OVEVYVCB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLXNlcnZlcic7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB7IHdvcmtlckRhdGEgfSBmcm9tICdub2RlOndvcmtlcl90aHJlYWRzJztcblxuLyoqXG4gKiBUaGUgZnVsbHkgcmVzb2x2ZWQgcGF0aCB0byB0aGUgem9uZS5qcyBwYWNrYWdlIHRoYXQgd2lsbCBiZSBsb2FkZWQgZHVyaW5nIHdvcmtlciBpbml0aWFsaXphdGlvbi5cbiAqIFRoaXMgaXMgcGFzc2VkIGFzIHdvcmtlckRhdGEgd2hlbiBzZXR0aW5nIHVwIHRoZSB3b3JrZXIgdmlhIHRoZSBgcGlzY2luYWAgcGFja2FnZS5cbiAqL1xuY29uc3QgeyB6b25lUGFja2FnZSB9ID0gd29ya2VyRGF0YSBhcyB7XG4gIHpvbmVQYWNrYWdlOiBzdHJpbmc7XG59O1xuXG5pbnRlcmZhY2UgU2VydmVyQnVuZGxlRXhwb3J0cyB7XG4gIC8qKiBBbiBpbnRlcm5hbCB0b2tlbiB0aGF0IGFsbG93cyBwcm92aWRpbmcgZXh0cmEgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNlcnZlciBjb250ZXh0LiAqL1xuICDJtVNFUlZFUl9DT05URVhUPzogdHlwZW9mIMm1U0VSVkVSX0NPTlRFWFQ7XG5cbiAgLyoqIFJlbmRlciBhbiBOZ01vZHVsZSBhcHBsaWNhdGlvbi4gKi9cbiAgcmVuZGVyTW9kdWxlPzogdHlwZW9mIHJlbmRlck1vZHVsZTtcblxuICAvKiogTmdNb2R1bGUgdG8gcmVuZGVyLiAqL1xuICBBcHBTZXJ2ZXJNb2R1bGU/OiBUeXBlPHVua25vd24+O1xuXG4gIC8qKiBNZXRob2QgdG8gcmVuZGVyIGEgc3RhbmRhbG9uZSBhcHBsaWNhdGlvbi4gKi9cbiAgcmVuZGVyQXBwbGljYXRpb24/OiB0eXBlb2YgcmVuZGVyQXBwbGljYXRpb247XG5cbiAgLyoqIFN0YW5kYWxvbmUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGluZyBmdW5jdGlvbi4gKi9cbiAgZGVmYXVsdD86ICgpID0+IFByb21pc2U8QXBwbGljYXRpb25SZWY+O1xufVxuXG4vKipcbiAqIEEgcmVxdWVzdCB0byByZW5kZXIgYSBTZXJ2ZXIgYnVuZGxlIGdlbmVyYXRlIGJ5IHRoZSB1bml2ZXJzYWwgc2VydmVyIGJ1aWxkZXIuXG4gKi9cbmludGVyZmFjZSBSZW5kZXJSZXF1ZXN0IHtcbiAgLyoqXG4gICAqIFRoZSBwYXRoIHRvIHRoZSBzZXJ2ZXIgYnVuZGxlIHRoYXQgc2hvdWxkIGJlIGxvYWRlZCBhbmQgcmVuZGVyZWQuXG4gICAqL1xuICBzZXJ2ZXJCdW5kbGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgZXhpc3RpbmcgSFRNTCBkb2N1bWVudCBhcyBhIHN0cmluZyB0aGF0IHdpbGwgYmUgYXVnbWVudGVkIHdpdGggdGhlIHJlbmRlcmVkIGFwcGxpY2F0aW9uLlxuICAgKi9cbiAgZG9jdW1lbnQ6IHN0cmluZztcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIFVSTCBwYXRoIHRoYXQgcmVwcmVzZW50cyB0aGUgQW5ndWxhciByb3V0ZSB0aGF0IHNob3VsZCBiZSByZW5kZXJlZC5cbiAgICovXG4gIHVybDogc3RyaW5nIHwgdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJlbmRlcnMgYW4gYXBwbGljYXRpb24gYmFzZWQgb24gYSBwcm92aWRlZCBzZXJ2ZXIgYnVuZGxlIHBhdGgsIGluaXRpYWwgZG9jdW1lbnQsIGFuZCBvcHRpb25hbCBVUkwgcm91dGUuXG4gKiBAcGFyYW0gcGFyYW0wIEEgcmVxdWVzdCB0byByZW5kZXIgYSBzZXJ2ZXIgYnVuZGxlLlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHJlbmRlciBIVE1MIGRvY3VtZW50IGZvciB0aGUgYXBwbGljYXRpb24uXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlcih7IHNlcnZlckJ1bmRsZVBhdGgsIGRvY3VtZW50LCB1cmwgfTogUmVuZGVyUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHtcbiAgICDJtVNFUlZFUl9DT05URVhULFxuICAgIEFwcFNlcnZlck1vZHVsZSxcbiAgICByZW5kZXJNb2R1bGUsXG4gICAgcmVuZGVyQXBwbGljYXRpb24sXG4gICAgZGVmYXVsdDogYm9vdHN0cmFwQXBwRm4sXG4gIH0gPSAoYXdhaXQgaW1wb3J0KHNlcnZlckJ1bmRsZVBhdGgpKSBhcyBTZXJ2ZXJCdW5kbGVFeHBvcnRzO1xuXG4gIGFzc2VydCjJtVNFUlZFUl9DT05URVhULCBgybVTRVJWRVJfQ09OVEVYVCB3YXMgbm90IGV4cG9ydGVkIGZyb206ICR7c2VydmVyQnVuZGxlUGF0aH0uYCk7XG5cbiAgY29uc3QgcGxhdGZvcm1Qcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXG4gICAge1xuICAgICAgcHJvdmlkZTogybVTRVJWRVJfQ09OVEVYVCxcbiAgICAgIHVzZVZhbHVlOiAnYXBwLXNoZWxsJyxcbiAgICB9LFxuICBdO1xuXG4gIC8vIFJlbmRlciBwbGF0Zm9ybSBzZXJ2ZXIgbW9kdWxlXG4gIGlmIChib290c3RyYXBBcHBGbikge1xuICAgIGFzc2VydChyZW5kZXJBcHBsaWNhdGlvbiwgYHJlbmRlckFwcGxpY2F0aW9uIHdhcyBub3QgZXhwb3J0ZWQgZnJvbTogJHtzZXJ2ZXJCdW5kbGVQYXRofS5gKTtcblxuICAgIHJldHVybiByZW5kZXJBcHBsaWNhdGlvbihib290c3RyYXBBcHBGbiwge1xuICAgICAgZG9jdW1lbnQsXG4gICAgICB1cmwsXG4gICAgICBwbGF0Zm9ybVByb3ZpZGVycyxcbiAgICB9KTtcbiAgfVxuXG4gIGFzc2VydChcbiAgICBBcHBTZXJ2ZXJNb2R1bGUsXG4gICAgYE5laXRoZXIgYW4gQXBwU2VydmVyTW9kdWxlIG5vciBhIGJvb3RzdHJhcHBpbmcgZnVuY3Rpb24gd2FzIGV4cG9ydGVkIGZyb206ICR7c2VydmVyQnVuZGxlUGF0aH0uYCxcbiAgKTtcbiAgYXNzZXJ0KHJlbmRlck1vZHVsZSwgYHJlbmRlck1vZHVsZSB3YXMgbm90IGV4cG9ydGVkIGZyb206ICR7c2VydmVyQnVuZGxlUGF0aH0uYCk7XG5cbiAgcmV0dXJuIHJlbmRlck1vZHVsZShBcHBTZXJ2ZXJNb2R1bGUsIHtcbiAgICBkb2N1bWVudCxcbiAgICB1cmwsXG4gICAgZXh0cmFQcm92aWRlcnM6IHBsYXRmb3JtUHJvdmlkZXJzLFxuICB9KTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgd29ya2VyIHdoZW4gaXQgaXMgZmlyc3QgY3JlYXRlZCBieSBsb2FkaW5nIHRoZSBab25lLmpzIHBhY2thZ2VcbiAqIGludG8gdGhlIHdvcmtlciBpbnN0YW5jZS5cbiAqXG4gKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSByZW5kZXIgZnVuY3Rpb24gb2YgdGhlIHdvcmtlci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcbiAgLy8gU2V0dXAgWm9uZS5qc1xuICBhd2FpdCBpbXBvcnQoem9uZVBhY2thZ2UpO1xuXG4gIC8vIFJldHVybiB0aGUgcmVuZGVyIGZ1bmN0aW9uIGZvciB1c2VcbiAgcmV0dXJuIHJlbmRlcjtcbn1cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBleHBvcnQgd2lsbCBiZSB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgaW5pdGlhbGl6ZSBmdW5jdGlvbi5cbiAqIFRoaXMgaXMgYXdhaXRlZCBieSBwaXNjaW5hIHByaW9yIHRvIHVzaW5nIHRoZSBXb3JrZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGluaXRpYWxpemUoKTtcbiJdfQ==
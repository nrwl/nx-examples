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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./default-progress"), exports);
__exportStar(require("./delete-output-dir"), exports);
__exportStar(require("./run-module-as-observable-fork"), exports);
__exportStar(require("./normalize-file-replacements"), exports);
__exportStar(require("./normalize-asset-patterns"), exports);
__exportStar(require("./normalize-source-maps"), exports);
__exportStar(require("./normalize-optimization"), exports);
__exportStar(require("./normalize-builder-schema"), exports);
__exportStar(require("./url"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUgscURBQW1DO0FBQ25DLHNEQUFvQztBQUNwQyxrRUFBZ0Q7QUFDaEQsZ0VBQThDO0FBQzlDLDZEQUEyQztBQUMzQywwREFBd0M7QUFDeEMsMkRBQXlDO0FBQ3pDLDZEQUEyQztBQUMzQyx3Q0FBc0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi9kZWZhdWx0LXByb2dyZXNzJztcbmV4cG9ydCAqIGZyb20gJy4vZGVsZXRlLW91dHB1dC1kaXInO1xuZXhwb3J0ICogZnJvbSAnLi9ydW4tbW9kdWxlLWFzLW9ic2VydmFibGUtZm9yayc7XG5leHBvcnQgKiBmcm9tICcuL25vcm1hbGl6ZS1maWxlLXJlcGxhY2VtZW50cyc7XG5leHBvcnQgKiBmcm9tICcuL25vcm1hbGl6ZS1hc3NldC1wYXR0ZXJucyc7XG5leHBvcnQgKiBmcm9tICcuL25vcm1hbGl6ZS1zb3VyY2UtbWFwcyc7XG5leHBvcnQgKiBmcm9tICcuL25vcm1hbGl6ZS1vcHRpbWl6YXRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9ub3JtYWxpemUtYnVpbGRlci1zY2hlbWEnO1xuZXhwb3J0ICogZnJvbSAnLi91cmwnO1xuIl19
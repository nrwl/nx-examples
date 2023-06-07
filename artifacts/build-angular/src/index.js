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
exports.executeNgPackagrBuilder = exports.executeServerBuilder = exports.executeProtractorBuilder = exports.executeKarmaBuilder = exports.executeExtractI18nBuilder = exports.executeDevServerBuilder = exports.executeBrowserBuilder = exports.Type = exports.OutputHashing = exports.CrossOrigin = void 0;
__exportStar(require("./transforms"), exports);
var schema_1 = require("./builders/browser/schema");
Object.defineProperty(exports, "CrossOrigin", { enumerable: true, get: function () { return schema_1.CrossOrigin; } });
Object.defineProperty(exports, "OutputHashing", { enumerable: true, get: function () { return schema_1.OutputHashing; } });
Object.defineProperty(exports, "Type", { enumerable: true, get: function () { return schema_1.Type; } });
var browser_1 = require("./builders/browser");
Object.defineProperty(exports, "executeBrowserBuilder", { enumerable: true, get: function () { return browser_1.buildWebpackBrowser; } });
var dev_server_1 = require("./builders/dev-server");
Object.defineProperty(exports, "executeDevServerBuilder", { enumerable: true, get: function () { return dev_server_1.executeDevServerBuilder; } });
var extract_i18n_1 = require("./builders/extract-i18n");
Object.defineProperty(exports, "executeExtractI18nBuilder", { enumerable: true, get: function () { return extract_i18n_1.execute; } });
var karma_1 = require("./builders/karma");
Object.defineProperty(exports, "executeKarmaBuilder", { enumerable: true, get: function () { return karma_1.execute; } });
var protractor_1 = require("./builders/protractor");
Object.defineProperty(exports, "executeProtractorBuilder", { enumerable: true, get: function () { return protractor_1.execute; } });
var server_1 = require("./builders/server");
Object.defineProperty(exports, "executeServerBuilder", { enumerable: true, get: function () { return server_1.execute; } });
var ng_packagr_1 = require("./builders/ng-packagr");
Object.defineProperty(exports, "executeNgPackagrBuilder", { enumerable: true, get: function () { return ng_packagr_1.execute; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUE2QjtBQUU3QixvREFjbUM7QUFWakMscUdBQUEsV0FBVyxPQUFBO0FBSVgsdUdBQUEsYUFBYSxPQUFBO0FBS2IsOEZBQUEsSUFBSSxPQUFBO0FBR04sOENBRzRCO0FBRjFCLGdIQUFBLG1CQUFtQixPQUF5QjtBQUk5QyxvREFJK0I7QUFIN0IscUhBQUEsdUJBQXVCLE9BQUE7QUFLekIsd0RBR2lDO0FBRi9CLHlIQUFBLE9BQU8sT0FBNkI7QUFJdEMsMENBSTBCO0FBSHhCLDRHQUFBLE9BQU8sT0FBdUI7QUFLaEMsb0RBRytCO0FBRjdCLHNIQUFBLE9BQU8sT0FBNEI7QUFJckMsNENBSTJCO0FBSHpCLDhHQUFBLE9BQU8sT0FBd0I7QUFLakMsb0RBQW9HO0FBQTNGLHFIQUFBLE9BQU8sT0FBMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0ICogZnJvbSAnLi90cmFuc2Zvcm1zJztcblxuZXhwb3J0IHtcbiAgQXNzZXRQYXR0ZXJuLFxuICBBc3NldFBhdHRlcm5DbGFzcyBhcyBBc3NldFBhdHRlcm5PYmplY3QsXG4gIEJ1ZGdldCxcbiAgQ3Jvc3NPcmlnaW4sXG4gIEZpbGVSZXBsYWNlbWVudCxcbiAgT3B0aW1pemF0aW9uQ2xhc3MgYXMgT3B0aW1pemF0aW9uT2JqZWN0LFxuICBPcHRpbWl6YXRpb25VbmlvbixcbiAgT3V0cHV0SGFzaGluZyxcbiAgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyT3B0aW9ucyxcbiAgU291cmNlTWFwQ2xhc3MgYXMgU291cmNlTWFwT2JqZWN0LFxuICBTb3VyY2VNYXBVbmlvbixcbiAgU3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zLFxuICBUeXBlLFxufSBmcm9tICcuL2J1aWxkZXJzL2Jyb3dzZXIvc2NoZW1hJztcblxuZXhwb3J0IHtcbiAgYnVpbGRXZWJwYWNrQnJvd3NlciBhcyBleGVjdXRlQnJvd3NlckJ1aWxkZXIsXG4gIEJyb3dzZXJCdWlsZGVyT3V0cHV0LFxufSBmcm9tICcuL2J1aWxkZXJzL2Jyb3dzZXInO1xuXG5leHBvcnQge1xuICBleGVjdXRlRGV2U2VydmVyQnVpbGRlcixcbiAgRGV2U2VydmVyQnVpbGRlck9wdGlvbnMsXG4gIERldlNlcnZlckJ1aWxkZXJPdXRwdXQsXG59IGZyb20gJy4vYnVpbGRlcnMvZGV2LXNlcnZlcic7XG5cbmV4cG9ydCB7XG4gIGV4ZWN1dGUgYXMgZXhlY3V0ZUV4dHJhY3RJMThuQnVpbGRlcixcbiAgRXh0cmFjdEkxOG5CdWlsZGVyT3B0aW9ucyxcbn0gZnJvbSAnLi9idWlsZGVycy9leHRyYWN0LWkxOG4nO1xuXG5leHBvcnQge1xuICBleGVjdXRlIGFzIGV4ZWN1dGVLYXJtYUJ1aWxkZXIsXG4gIEthcm1hQnVpbGRlck9wdGlvbnMsXG4gIEthcm1hQ29uZmlnT3B0aW9ucyxcbn0gZnJvbSAnLi9idWlsZGVycy9rYXJtYSc7XG5cbmV4cG9ydCB7XG4gIGV4ZWN1dGUgYXMgZXhlY3V0ZVByb3RyYWN0b3JCdWlsZGVyLFxuICBQcm90cmFjdG9yQnVpbGRlck9wdGlvbnMsXG59IGZyb20gJy4vYnVpbGRlcnMvcHJvdHJhY3Rvcic7XG5cbmV4cG9ydCB7XG4gIGV4ZWN1dGUgYXMgZXhlY3V0ZVNlcnZlckJ1aWxkZXIsXG4gIFNlcnZlckJ1aWxkZXJPcHRpb25zLFxuICBTZXJ2ZXJCdWlsZGVyT3V0cHV0LFxufSBmcm9tICcuL2J1aWxkZXJzL3NlcnZlcic7XG5cbmV4cG9ydCB7IGV4ZWN1dGUgYXMgZXhlY3V0ZU5nUGFja2FnckJ1aWxkZXIsIE5nUGFja2FnckJ1aWxkZXJPcHRpb25zIH0gZnJvbSAnLi9idWlsZGVycy9uZy1wYWNrYWdyJztcbiJdfQ==
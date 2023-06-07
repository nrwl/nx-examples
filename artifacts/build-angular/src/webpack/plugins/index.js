"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostcssCliResources = exports.JavaScriptOptimizerPlugin = exports.JsonStatsPlugin = exports.CommonJsUsageWarnPlugin = exports.DedupeModuleResolvePlugin = exports.RemoveHashPlugin = exports.SuppressExtractedTextChunksWebpackPlugin = exports.ScriptsWebpackPlugin = exports.AnyComponentStyleBudgetChecker = void 0;
// Exports the webpack plugins we use internally.
var any_component_style_budget_checker_1 = require("./any-component-style-budget-checker");
Object.defineProperty(exports, "AnyComponentStyleBudgetChecker", { enumerable: true, get: function () { return any_component_style_budget_checker_1.AnyComponentStyleBudgetChecker; } });
var scripts_webpack_plugin_1 = require("./scripts-webpack-plugin");
Object.defineProperty(exports, "ScriptsWebpackPlugin", { enumerable: true, get: function () { return scripts_webpack_plugin_1.ScriptsWebpackPlugin; } });
var suppress_entry_chunks_webpack_plugin_1 = require("./suppress-entry-chunks-webpack-plugin");
Object.defineProperty(exports, "SuppressExtractedTextChunksWebpackPlugin", { enumerable: true, get: function () { return suppress_entry_chunks_webpack_plugin_1.SuppressExtractedTextChunksWebpackPlugin; } });
var remove_hash_plugin_1 = require("./remove-hash-plugin");
Object.defineProperty(exports, "RemoveHashPlugin", { enumerable: true, get: function () { return remove_hash_plugin_1.RemoveHashPlugin; } });
var dedupe_module_resolve_plugin_1 = require("./dedupe-module-resolve-plugin");
Object.defineProperty(exports, "DedupeModuleResolvePlugin", { enumerable: true, get: function () { return dedupe_module_resolve_plugin_1.DedupeModuleResolvePlugin; } });
var common_js_usage_warn_plugin_1 = require("./common-js-usage-warn-plugin");
Object.defineProperty(exports, "CommonJsUsageWarnPlugin", { enumerable: true, get: function () { return common_js_usage_warn_plugin_1.CommonJsUsageWarnPlugin; } });
var json_stats_plugin_1 = require("./json-stats-plugin");
Object.defineProperty(exports, "JsonStatsPlugin", { enumerable: true, get: function () { return json_stats_plugin_1.JsonStatsPlugin; } });
var javascript_optimizer_plugin_1 = require("./javascript-optimizer-plugin");
Object.defineProperty(exports, "JavaScriptOptimizerPlugin", { enumerable: true, get: function () { return javascript_optimizer_plugin_1.JavaScriptOptimizerPlugin; } });
var postcss_cli_resources_1 = require("./postcss-cli-resources");
Object.defineProperty(exports, "PostcssCliResources", { enumerable: true, get: function () { return __importDefault(postcss_cli_resources_1).default; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBRUgsaURBQWlEO0FBQ2pELDJGQUFzRjtBQUE3RSxvSkFBQSw4QkFBOEIsT0FBQTtBQUN2QyxtRUFBNkY7QUFBcEYsOEhBQUEsb0JBQW9CLE9BQUE7QUFDN0IsK0ZBQWtHO0FBQXpGLGdLQUFBLHdDQUF3QyxPQUFBO0FBQ2pELDJEQUFpRjtBQUF4RSxzSEFBQSxnQkFBZ0IsT0FBQTtBQUN6QiwrRUFBMkU7QUFBbEUseUlBQUEseUJBQXlCLE9BQUE7QUFDbEMsNkVBQXdFO0FBQS9ELHNJQUFBLHVCQUF1QixPQUFBO0FBQ2hDLHlEQUFzRDtBQUE3QyxvSEFBQSxlQUFlLE9BQUE7QUFDeEIsNkVBQTBFO0FBQWpFLHdJQUFBLHlCQUF5QixPQUFBO0FBQ2xDLGlFQUdpQztBQUYvQiw2SUFBQSxPQUFPLE9BQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIEV4cG9ydHMgdGhlIHdlYnBhY2sgcGx1Z2lucyB3ZSB1c2UgaW50ZXJuYWxseS5cbmV4cG9ydCB7IEFueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlciB9IGZyb20gJy4vYW55LWNvbXBvbmVudC1zdHlsZS1idWRnZXQtY2hlY2tlcic7XG5leHBvcnQgeyBTY3JpcHRzV2VicGFja1BsdWdpbiwgU2NyaXB0c1dlYnBhY2tQbHVnaW5PcHRpb25zIH0gZnJvbSAnLi9zY3JpcHRzLXdlYnBhY2stcGx1Z2luJztcbmV4cG9ydCB7IFN1cHByZXNzRXh0cmFjdGVkVGV4dENodW5rc1dlYnBhY2tQbHVnaW4gfSBmcm9tICcuL3N1cHByZXNzLWVudHJ5LWNodW5rcy13ZWJwYWNrLXBsdWdpbic7XG5leHBvcnQgeyBSZW1vdmVIYXNoUGx1Z2luLCBSZW1vdmVIYXNoUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vcmVtb3ZlLWhhc2gtcGx1Z2luJztcbmV4cG9ydCB7IERlZHVwZU1vZHVsZVJlc29sdmVQbHVnaW4gfSBmcm9tICcuL2RlZHVwZS1tb2R1bGUtcmVzb2x2ZS1wbHVnaW4nO1xuZXhwb3J0IHsgQ29tbW9uSnNVc2FnZVdhcm5QbHVnaW4gfSBmcm9tICcuL2NvbW1vbi1qcy11c2FnZS13YXJuLXBsdWdpbic7XG5leHBvcnQgeyBKc29uU3RhdHNQbHVnaW4gfSBmcm9tICcuL2pzb24tc3RhdHMtcGx1Z2luJztcbmV4cG9ydCB7IEphdmFTY3JpcHRPcHRpbWl6ZXJQbHVnaW4gfSBmcm9tICcuL2phdmFzY3JpcHQtb3B0aW1pemVyLXBsdWdpbic7XG5leHBvcnQge1xuICBkZWZhdWx0IGFzIFBvc3Rjc3NDbGlSZXNvdXJjZXMsXG4gIFBvc3Rjc3NDbGlSZXNvdXJjZXNPcHRpb25zLFxufSBmcm9tICcuL3Bvc3Rjc3MtY2xpLXJlc291cmNlcyc7XG4iXX0=
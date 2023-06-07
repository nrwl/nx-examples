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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonStatsPlugin = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const error_1 = require("../../utils/error");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
class JsonStatsPlugin {
    constructor(statsOutputPath) {
        this.statsOutputPath = statsOutputPath;
    }
    apply(compiler) {
        compiler.hooks.done.tapPromise('angular-json-stats', async (stats) => {
            const { stringifyStream } = await Promise.resolve().then(() => __importStar(require('@discoveryjs/json-ext')));
            const data = stats.toJson('verbose');
            try {
                await fs_1.promises.mkdir((0, path_1.dirname)(this.statsOutputPath), { recursive: true });
                await new Promise((resolve, reject) => stringifyStream(data)
                    .pipe((0, fs_1.createWriteStream)(this.statsOutputPath))
                    .on('close', resolve)
                    .on('error', reject));
            }
            catch (error) {
                (0, error_1.assertIsError)(error);
                (0, webpack_diagnostics_1.addError)(stats.compilation, `Unable to write stats file: ${error.message || 'unknown error'}`);
            }
        });
    }
}
exports.JsonStatsPlugin = JsonStatsPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zdGF0cy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMvanNvbi1zdGF0cy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQkFBK0Q7QUFDL0QsK0JBQStCO0FBRS9CLDZDQUFrRDtBQUVsRCx5RUFBMkQ7QUFFM0QsTUFBYSxlQUFlO0lBQzFCLFlBQTZCLGVBQXVCO1FBQXZCLG9CQUFlLEdBQWYsZUFBZSxDQUFRO0lBQUcsQ0FBQztJQUV4RCxLQUFLLENBQUMsUUFBa0I7UUFDdEIsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsd0RBQWEsdUJBQXVCLEdBQUMsQ0FBQztZQUNsRSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJDLElBQUk7Z0JBQ0YsTUFBTSxhQUFVLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQzFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7cUJBQ2xCLElBQUksQ0FBQyxJQUFBLHNCQUFpQixFQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDN0MsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7cUJBQ3BCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQ3ZCLENBQUM7YUFDSDtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLElBQUEscUJBQWEsRUFBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsSUFBQSw4QkFBUSxFQUNOLEtBQUssQ0FBQyxXQUFXLEVBQ2pCLCtCQUErQixLQUFLLENBQUMsT0FBTyxJQUFJLGVBQWUsRUFBRSxDQUNsRSxDQUFDO2FBQ0g7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpCRCwwQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlV3JpdGVTdHJlYW0sIHByb21pc2VzIGFzIGZzUHJvbWlzZXMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcblxuaW1wb3J0IHsgYWRkRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWRpYWdub3N0aWNzJztcblxuZXhwb3J0IGNsYXNzIEpzb25TdGF0c1BsdWdpbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc3RhdHNPdXRwdXRQYXRoOiBzdHJpbmcpIHt9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29tcGlsZXIuaG9va3MuZG9uZS50YXBQcm9taXNlKCdhbmd1bGFyLWpzb24tc3RhdHMnLCBhc3luYyAoc3RhdHMpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RyaW5naWZ5U3RyZWFtIH0gPSBhd2FpdCBpbXBvcnQoJ0BkaXNjb3Zlcnlqcy9qc29uLWV4dCcpO1xuICAgICAgY29uc3QgZGF0YSA9IHN0YXRzLnRvSnNvbigndmVyYm9zZScpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmc1Byb21pc2VzLm1rZGlyKGRpcm5hbWUodGhpcy5zdGF0c091dHB1dFBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICAgICAgICBzdHJpbmdpZnlTdHJlYW0oZGF0YSlcbiAgICAgICAgICAgIC5waXBlKGNyZWF0ZVdyaXRlU3RyZWFtKHRoaXMuc3RhdHNPdXRwdXRQYXRoKSlcbiAgICAgICAgICAgIC5vbignY2xvc2UnLCByZXNvbHZlKVxuICAgICAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdCksXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICAgICAgYWRkRXJyb3IoXG4gICAgICAgICAgc3RhdHMuY29tcGlsYXRpb24sXG4gICAgICAgICAgYFVuYWJsZSB0byB3cml0ZSBzdGF0cyBmaWxlOiAke2Vycm9yLm1lc3NhZ2UgfHwgJ3Vua25vd24gZXJyb3InfWAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
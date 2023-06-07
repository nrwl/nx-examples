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
exports.colors = exports.removeColor = void 0;
const ansiColors = __importStar(require("ansi-colors"));
const tty_1 = require("tty");
function supportColor() {
    if (process.env.FORCE_COLOR !== undefined) {
        // 2 colors: FORCE_COLOR = 0 (Disables colors), depth 1
        // 16 colors: FORCE_COLOR = 1, depth 4
        // 256 colors: FORCE_COLOR = 2, depth 8
        // 16,777,216 colors: FORCE_COLOR = 3, depth 16
        // See: https://nodejs.org/dist/latest-v12.x/docs/api/tty.html#tty_writestream_getcolordepth_env
        // and https://github.com/nodejs/node/blob/b9f36062d7b5c5039498e98d2f2c180dca2a7065/lib/internal/tty.js#L106;
        switch (process.env.FORCE_COLOR) {
            case '':
            case 'true':
            case '1':
            case '2':
            case '3':
                return true;
            default:
                return false;
        }
    }
    if (process.stdout instanceof tty_1.WriteStream) {
        return process.stdout.getColorDepth() > 1;
    }
    return false;
}
function removeColor(text) {
    // This has been created because when colors.enabled is false unstyle doesn't work
    // see: https://github.com/doowb/ansi-colors/blob/a4794363369d7b4d1872d248fc43a12761640d8e/index.js#L38
    return text.replace(ansiColors.ansiRegex, '');
}
exports.removeColor = removeColor;
// Create a separate instance to prevent unintended global changes to the color configuration
const colors = ansiColors.create();
exports.colors = colors;
colors.enabled = supportColor();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9jb2xvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHdEQUEwQztBQUMxQyw2QkFBa0M7QUFFbEMsU0FBUyxZQUFZO0lBQ25CLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFO1FBQ3pDLHVEQUF1RDtRQUN2RCxzQ0FBc0M7UUFDdEMsdUNBQXVDO1FBQ3ZDLCtDQUErQztRQUMvQyxnR0FBZ0c7UUFDaEcsNkdBQTZHO1FBQzdHLFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUU7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixLQUFLLE1BQU0sQ0FBQztZQUNaLEtBQUssR0FBRyxDQUFDO1lBQ1QsS0FBSyxHQUFHLENBQUM7WUFDVCxLQUFLLEdBQUc7Z0JBQ04sT0FBTyxJQUFJLENBQUM7WUFDZDtnQkFDRSxPQUFPLEtBQUssQ0FBQztTQUNoQjtLQUNGO0lBRUQsSUFBSSxPQUFPLENBQUMsTUFBTSxZQUFZLGlCQUFXLEVBQUU7UUFDekMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUMzQztJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxJQUFZO0lBQ3RDLGtGQUFrRjtJQUNsRix1R0FBdUc7SUFDdkcsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQUpELGtDQUlDO0FBRUQsNkZBQTZGO0FBQzdGLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUcxQix3QkFBTTtBQUZmLE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgYW5zaUNvbG9ycyBmcm9tICdhbnNpLWNvbG9ycyc7XG5pbXBvcnQgeyBXcml0ZVN0cmVhbSB9IGZyb20gJ3R0eSc7XG5cbmZ1bmN0aW9uIHN1cHBvcnRDb2xvcigpOiBib29sZWFuIHtcbiAgaWYgKHByb2Nlc3MuZW52LkZPUkNFX0NPTE9SICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyAyIGNvbG9yczogRk9SQ0VfQ09MT1IgPSAwIChEaXNhYmxlcyBjb2xvcnMpLCBkZXB0aCAxXG4gICAgLy8gMTYgY29sb3JzOiBGT1JDRV9DT0xPUiA9IDEsIGRlcHRoIDRcbiAgICAvLyAyNTYgY29sb3JzOiBGT1JDRV9DT0xPUiA9IDIsIGRlcHRoIDhcbiAgICAvLyAxNiw3NzcsMjE2IGNvbG9yczogRk9SQ0VfQ09MT1IgPSAzLCBkZXB0aCAxNlxuICAgIC8vIFNlZTogaHR0cHM6Ly9ub2RlanMub3JnL2Rpc3QvbGF0ZXN0LXYxMi54L2RvY3MvYXBpL3R0eS5odG1sI3R0eV93cml0ZXN0cmVhbV9nZXRjb2xvcmRlcHRoX2VudlxuICAgIC8vIGFuZCBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9iOWYzNjA2MmQ3YjVjNTAzOTQ5OGU5OGQyZjJjMTgwZGNhMmE3MDY1L2xpYi9pbnRlcm5hbC90dHkuanMjTDEwNjtcbiAgICBzd2l0Y2ggKHByb2Nlc3MuZW52LkZPUkNFX0NPTE9SKSB7XG4gICAgICBjYXNlICcnOlxuICAgICAgY2FzZSAndHJ1ZSc6XG4gICAgICBjYXNlICcxJzpcbiAgICAgIGNhc2UgJzInOlxuICAgICAgY2FzZSAnMyc6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChwcm9jZXNzLnN0ZG91dCBpbnN0YW5jZW9mIFdyaXRlU3RyZWFtKSB7XG4gICAgcmV0dXJuIHByb2Nlc3Muc3Rkb3V0LmdldENvbG9yRGVwdGgoKSA+IDE7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDb2xvcih0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBUaGlzIGhhcyBiZWVuIGNyZWF0ZWQgYmVjYXVzZSB3aGVuIGNvbG9ycy5lbmFibGVkIGlzIGZhbHNlIHVuc3R5bGUgZG9lc24ndCB3b3JrXG4gIC8vIHNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Rvb3diL2Fuc2ktY29sb3JzL2Jsb2IvYTQ3OTQzNjMzNjlkN2I0ZDE4NzJkMjQ4ZmM0M2ExMjc2MTY0MGQ4ZS9pbmRleC5qcyNMMzhcbiAgcmV0dXJuIHRleHQucmVwbGFjZShhbnNpQ29sb3JzLmFuc2lSZWdleCwgJycpO1xufVxuXG4vLyBDcmVhdGUgYSBzZXBhcmF0ZSBpbnN0YW5jZSB0byBwcmV2ZW50IHVuaW50ZW5kZWQgZ2xvYmFsIGNoYW5nZXMgdG8gdGhlIGNvbG9yIGNvbmZpZ3VyYXRpb25cbmNvbnN0IGNvbG9ycyA9IGFuc2lDb2xvcnMuY3JlYXRlKCk7XG5jb2xvcnMuZW5hYmxlZCA9IHN1cHBvcnRDb2xvcigpO1xuXG5leHBvcnQgeyBjb2xvcnMgfTtcbiJdfQ==
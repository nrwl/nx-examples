"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Spinner_isTTY;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = void 0;
const ora_1 = __importDefault(require("ora"));
const color_1 = require("./color");
const tty_1 = require("./tty");
class Spinner {
    constructor(text) {
        /** When false, only fail messages will be displayed. */
        this.enabled = true;
        _Spinner_isTTY.set(this, (0, tty_1.isTTY)());
        this.spinner = (0, ora_1.default)({
            text,
            // The below 2 options are needed because otherwise CTRL+C will be delayed
            // when the underlying process is sync.
            hideCursor: false,
            discardStdin: false,
            isEnabled: __classPrivateFieldGet(this, _Spinner_isTTY, "f"),
        });
    }
    set text(text) {
        this.spinner.text = text;
    }
    get isSpinning() {
        return this.spinner.isSpinning || !__classPrivateFieldGet(this, _Spinner_isTTY, "f");
    }
    succeed(text) {
        if (this.enabled) {
            this.spinner.succeed(text);
        }
    }
    fail(text) {
        this.spinner.fail(text && color_1.colors.redBright(text));
    }
    stop() {
        this.spinner.stop();
    }
    start(text) {
        if (this.enabled) {
            this.spinner.start(text);
        }
    }
}
exports.Spinner = Spinner;
_Spinner_isTTY = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Bpbm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3NwaW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBRUgsOENBQXNCO0FBQ3RCLG1DQUFpQztBQUNqQywrQkFBOEI7QUFFOUIsTUFBYSxPQUFPO0lBT2xCLFlBQVksSUFBYTtRQUp6Qix3REFBd0Q7UUFDeEQsWUFBTyxHQUFHLElBQUksQ0FBQztRQUNOLHlCQUFTLElBQUEsV0FBSyxHQUFFLEVBQUM7UUFHeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGFBQUcsRUFBQztZQUNqQixJQUFJO1lBQ0osMEVBQTBFO1lBQzFFLHVDQUF1QztZQUN2QyxVQUFVLEVBQUUsS0FBSztZQUNqQixZQUFZLEVBQUUsS0FBSztZQUNuQixTQUFTLEVBQUUsdUJBQUEsSUFBSSxzQkFBTztTQUN2QixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxJQUFJLENBQUMsSUFBWTtRQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyx1QkFBQSxJQUFJLHNCQUFPLENBQUM7SUFDakQsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFhO1FBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7SUFFRCxJQUFJLENBQUMsSUFBYTtRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksY0FBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQWE7UUFDakIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztDQUNGO0FBN0NELDBCQTZDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgb3JhIGZyb20gJ29yYSc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL2NvbG9yJztcbmltcG9ydCB7IGlzVFRZIH0gZnJvbSAnLi90dHknO1xuXG5leHBvcnQgY2xhc3MgU3Bpbm5lciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Bpbm5lcjogb3JhLk9yYTtcblxuICAvKiogV2hlbiBmYWxzZSwgb25seSBmYWlsIG1lc3NhZ2VzIHdpbGwgYmUgZGlzcGxheWVkLiAqL1xuICBlbmFibGVkID0gdHJ1ZTtcbiAgcmVhZG9ubHkgI2lzVFRZID0gaXNUVFkoKTtcblxuICBjb25zdHJ1Y3Rvcih0ZXh0Pzogc3RyaW5nKSB7XG4gICAgdGhpcy5zcGlubmVyID0gb3JhKHtcbiAgICAgIHRleHQsXG4gICAgICAvLyBUaGUgYmVsb3cgMiBvcHRpb25zIGFyZSBuZWVkZWQgYmVjYXVzZSBvdGhlcndpc2UgQ1RSTCtDIHdpbGwgYmUgZGVsYXllZFxuICAgICAgLy8gd2hlbiB0aGUgdW5kZXJseWluZyBwcm9jZXNzIGlzIHN5bmMuXG4gICAgICBoaWRlQ3Vyc29yOiBmYWxzZSxcbiAgICAgIGRpc2NhcmRTdGRpbjogZmFsc2UsXG4gICAgICBpc0VuYWJsZWQ6IHRoaXMuI2lzVFRZLFxuICAgIH0pO1xuICB9XG5cbiAgc2V0IHRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy5zcGlubmVyLnRleHQgPSB0ZXh0O1xuICB9XG5cbiAgZ2V0IGlzU3Bpbm5pbmcoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3Bpbm5lci5pc1NwaW5uaW5nIHx8ICF0aGlzLiNpc1RUWTtcbiAgfVxuXG4gIHN1Y2NlZWQodGV4dD86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuc3Bpbm5lci5zdWNjZWVkKHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGZhaWwodGV4dD86IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc3Bpbm5lci5mYWlsKHRleHQgJiYgY29sb3JzLnJlZEJyaWdodCh0ZXh0KSk7XG4gIH1cblxuICBzdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuc3Bpbm5lci5zdG9wKCk7XG4gIH1cblxuICBzdGFydCh0ZXh0Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5zcGlubmVyLnN0YXJ0KHRleHQpO1xuICAgIH1cbiAgfVxufVxuIl19
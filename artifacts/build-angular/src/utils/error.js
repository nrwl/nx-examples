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
exports.assertIsError = void 0;
const assert_1 = __importDefault(require("assert"));
function assertIsError(value) {
    const isError = value instanceof Error ||
        // The following is needing to identify errors coming from RxJs.
        (typeof value === 'object' && value && 'name' in value && 'message' in value);
    (0, assert_1.default)(isError, 'catch clause variable is not an Error instance');
}
exports.assertIsError = assertIsError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCxvREFBNEI7QUFFNUIsU0FBZ0IsYUFBYSxDQUFDLEtBQWM7SUFDMUMsTUFBTSxPQUFPLEdBQ1gsS0FBSyxZQUFZLEtBQUs7UUFDdEIsZ0VBQWdFO1FBQ2hFLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxNQUFNLElBQUksS0FBSyxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUMsQ0FBQztJQUNoRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxFQUFFLGdEQUFnRCxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQU5ELHNDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydElzRXJyb3IodmFsdWU6IHVua25vd24pOiBhc3NlcnRzIHZhbHVlIGlzIEVycm9yICYgeyBjb2RlPzogc3RyaW5nIH0ge1xuICBjb25zdCBpc0Vycm9yID1cbiAgICB2YWx1ZSBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgLy8gVGhlIGZvbGxvd2luZyBpcyBuZWVkaW5nIHRvIGlkZW50aWZ5IGVycm9ycyBjb21pbmcgZnJvbSBSeEpzLlxuICAgICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmICduYW1lJyBpbiB2YWx1ZSAmJiAnbWVzc2FnZScgaW4gdmFsdWUpO1xuICBhc3NlcnQoaXNFcnJvciwgJ2NhdGNoIGNsYXVzZSB2YXJpYWJsZSBpcyBub3QgYW4gRXJyb3IgaW5zdGFuY2UnKTtcbn1cbiJdfQ==
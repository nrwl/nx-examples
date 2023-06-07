"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressPlugin = void 0;
const webpack_1 = require("webpack");
const spinner_1 = require("../../utils/spinner");
class ProgressPlugin extends webpack_1.ProgressPlugin {
    constructor(platform) {
        const platformCapitalFirst = platform.replace(/^\w/, (s) => s.toUpperCase());
        const spinner = new spinner_1.Spinner();
        // fixme: hacks
        // spinner.start(`Generating ${platform} application bundles (phase: setup)...`);
        super({
            handler: (percentage, message) => {
                const phase = message ? ` (phase: ${message})` : '';
                spinner.text = `Generating ${platform} application bundles${phase}...`;
                switch (percentage) {
                    case 1:
                        if (spinner.isSpinning) {
                            spinner.succeed(`${platformCapitalFirst} application bundle generation complete.`);
                        }
                        break;
                    case 0:
                        if (!spinner.isSpinning) {
                            spinner.start();
                        }
                        break;
                }
            },
        });
        this.platform = platform;
    }
}
exports.ProgressPlugin = ProgressPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3Byb2dyZXNzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxQ0FBa0U7QUFDbEUsaURBQThDO0FBRTlDLE1BQWEsY0FBZSxTQUFRLHdCQUFxQjtJQUd2RCxZQUFZLFFBQThCO1FBQ3hDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQzlCLGVBQWU7UUFDZixpRkFBaUY7UUFFakYsS0FBSyxDQUFDO1lBQ0osT0FBTyxFQUFFLENBQUMsVUFBa0IsRUFBRSxPQUFlLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxJQUFJLEdBQUcsY0FBYyxRQUFRLHVCQUF1QixLQUFLLEtBQUssQ0FBQztnQkFFdkUsUUFBUSxVQUFVLEVBQUU7b0JBQ2xCLEtBQUssQ0FBQzt3QkFDSixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7NEJBQ3RCLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxvQkFBb0IsMENBQTBDLENBQUMsQ0FBQzt5QkFDcEY7d0JBQ0QsTUFBTTtvQkFDUixLQUFLLENBQUM7d0JBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7NEJBQ3ZCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt5QkFDakI7d0JBQ0QsTUFBTTtpQkFDVDtZQUNILENBQUM7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUMzQixDQUFDO0NBQ0Y7QUEvQkQsd0NBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFByb2dyZXNzUGx1Z2luIGFzIFdlYnBhY2tQcm9ncmVzc1BsdWdpbiB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uLy4uL3V0aWxzL3NwaW5uZXInO1xuXG5leHBvcnQgY2xhc3MgUHJvZ3Jlc3NQbHVnaW4gZXh0ZW5kcyBXZWJwYWNrUHJvZ3Jlc3NQbHVnaW4ge1xuICBwbGF0Zm9ybSE6ICdzZXJ2ZXInIHwgJ2Jyb3dzZXInO1xuXG4gIGNvbnN0cnVjdG9yKHBsYXRmb3JtOiAnc2VydmVyJyB8ICdicm93c2VyJykge1xuICAgIGNvbnN0IHBsYXRmb3JtQ2FwaXRhbEZpcnN0ID0gcGxhdGZvcm0ucmVwbGFjZSgvXlxcdy8sIChzKSA9PiBzLnRvVXBwZXJDYXNlKCkpO1xuICAgIGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcigpO1xuICAgIC8vIGZpeG1lOiBoYWNrc1xuICAgIC8vIHNwaW5uZXIuc3RhcnQoYEdlbmVyYXRpbmcgJHtwbGF0Zm9ybX0gYXBwbGljYXRpb24gYnVuZGxlcyAocGhhc2U6IHNldHVwKS4uLmApO1xuXG4gICAgc3VwZXIoe1xuICAgICAgaGFuZGxlcjogKHBlcmNlbnRhZ2U6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHBoYXNlID0gbWVzc2FnZSA/IGAgKHBoYXNlOiAke21lc3NhZ2V9KWAgOiAnJztcbiAgICAgICAgc3Bpbm5lci50ZXh0ID0gYEdlbmVyYXRpbmcgJHtwbGF0Zm9ybX0gYXBwbGljYXRpb24gYnVuZGxlcyR7cGhhc2V9Li4uYDtcblxuICAgICAgICBzd2l0Y2ggKHBlcmNlbnRhZ2UpIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBpZiAoc3Bpbm5lci5pc1NwaW5uaW5nKSB7XG4gICAgICAgICAgICAgIHNwaW5uZXIuc3VjY2VlZChgJHtwbGF0Zm9ybUNhcGl0YWxGaXJzdH0gYXBwbGljYXRpb24gYnVuZGxlIGdlbmVyYXRpb24gY29tcGxldGUuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBpZiAoIXNwaW5uZXIuaXNTcGlubmluZykge1xuICAgICAgICAgICAgICBzcGlubmVyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgfVxufVxuIl19
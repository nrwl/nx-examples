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
const webpack_progress_plugin_1 = require("./webpack/webpack-progress-plugin");
const spinner_1 = require("../../../utils/spinner");
class ProgressPlugin extends webpack_progress_plugin_1.ProgressPlugin {
    constructor(platform) {
        const platformCapitalFirst = platform.replace(/^\w/, (s) => s.toUpperCase());
        const spinner = new spinner_1.Spinner();
        spinner.start(`Generating ${platform} application bundles (phase: setup)...`);
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
    }
}
exports.ProgressPlugin = ProgressPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvYnJvd3Nlci1yc3BhY2svcGx1Z2lucy9wcm9ncmVzcy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0VBQTRGO0FBQzVGLG9EQUFpRDtBQUVqRCxNQUFhLGNBQWUsU0FBUSx3Q0FBcUI7SUFDdkQsWUFBWSxRQUE4QjtRQUN4QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLEVBQUUsQ0FBQztRQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsUUFBUSx3Q0FBd0MsQ0FBQyxDQUFDO1FBRTlFLEtBQUssQ0FBQztZQUNKLE9BQU8sRUFBRSxDQUFDLFVBQWtCLEVBQUUsT0FBZSxFQUFFLEVBQUU7Z0JBQy9DLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxPQUFPLENBQUMsSUFBSSxHQUFHLGNBQWMsUUFBUSx1QkFBdUIsS0FBSyxLQUFLLENBQUM7Z0JBRXZFLFFBQVEsVUFBVSxFQUFFO29CQUNsQixLQUFLLENBQUM7d0JBQ0osSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFOzRCQUN0QixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsb0JBQW9CLDBDQUEwQyxDQUFDLENBQUM7eUJBQ3BGO3dCQUNELE1BQU07b0JBQ1IsS0FBSyxDQUFDO3dCQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFOzRCQUN2QixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7eUJBQ2pCO3dCQUNELE1BQU07aUJBQ1Q7WUFDSCxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUJELHdDQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQcm9ncmVzc1BsdWdpbiBhcyBXZWJwYWNrUHJvZ3Jlc3NQbHVnaW4gfSBmcm9tICcuL3dlYnBhY2svd2VicGFjay1wcm9ncmVzcy1wbHVnaW4nO1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3NwaW5uZXInO1xuXG5leHBvcnQgY2xhc3MgUHJvZ3Jlc3NQbHVnaW4gZXh0ZW5kcyBXZWJwYWNrUHJvZ3Jlc3NQbHVnaW4ge1xuICBjb25zdHJ1Y3RvcihwbGF0Zm9ybTogJ3NlcnZlcicgfCAnYnJvd3NlcicpIHtcbiAgICBjb25zdCBwbGF0Zm9ybUNhcGl0YWxGaXJzdCA9IHBsYXRmb3JtLnJlcGxhY2UoL15cXHcvLCAocykgPT4gcy50b1VwcGVyQ2FzZSgpKTtcbiAgICBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcbiAgICBzcGlubmVyLnN0YXJ0KGBHZW5lcmF0aW5nICR7cGxhdGZvcm19IGFwcGxpY2F0aW9uIGJ1bmRsZXMgKHBoYXNlOiBzZXR1cCkuLi5gKTtcblxuICAgIHN1cGVyKHtcbiAgICAgIGhhbmRsZXI6IChwZXJjZW50YWdlOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBwaGFzZSA9IG1lc3NhZ2UgPyBgIChwaGFzZTogJHttZXNzYWdlfSlgIDogJyc7XG4gICAgICAgIHNwaW5uZXIudGV4dCA9IGBHZW5lcmF0aW5nICR7cGxhdGZvcm19IGFwcGxpY2F0aW9uIGJ1bmRsZXMke3BoYXNlfS4uLmA7XG5cbiAgICAgICAgc3dpdGNoIChwZXJjZW50YWdlKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgaWYgKHNwaW5uZXIuaXNTcGlubmluZykge1xuICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoYCR7cGxhdGZvcm1DYXBpdGFsRmlyc3R9IGFwcGxpY2F0aW9uIGJ1bmRsZSBnZW5lcmF0aW9uIGNvbXBsZXRlLmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgaWYgKCFzcGlubmVyLmlzU3Bpbm5pbmcpIHtcbiAgICAgICAgICAgICAgc3Bpbm5lci5zdGFydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
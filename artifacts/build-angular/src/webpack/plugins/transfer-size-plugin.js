"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferSizePlugin = void 0;
const util_1 = require("util");
const zlib_1 = require("zlib");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const brotliCompressAsync = (0, util_1.promisify)(zlib_1.brotliCompress);
const PLUGIN_NAME = 'angular-transfer-size-estimator';
class TransferSizePlugin {
    constructor() { }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
            }, async (compilationAssets) => {
                const actions = [];
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!assetName.endsWith('.js') && !assetName.endsWith('.css')) {
                        continue;
                    }
                    const scriptAsset = compilation.getAsset(assetName);
                    if (!scriptAsset || scriptAsset.source.size() <= 0) {
                        continue;
                    }
                    actions.push(brotliCompressAsync(scriptAsset.source.source())
                        .then((result) => {
                        compilation.updateAsset(assetName, (s) => s, (assetInfo) => ({
                            ...assetInfo,
                            estimatedTransferSize: result.length,
                        }));
                    })
                        .catch((error) => {
                        (0, webpack_diagnostics_1.addWarning)(compilation, `Unable to calculate estimated transfer size for '${assetName}'. Reason: ${error.message}`);
                    }));
                }
                await Promise.all(actions);
            });
        });
    }
}
exports.TransferSizePlugin = TransferSizePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmZXItc2l6ZS1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMvdHJhbnNmZXItc2l6ZS1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQWlDO0FBRWpDLCtCQUFzQztBQUN0Qyx5RUFBNkQ7QUFFN0QsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLGdCQUFTLEVBQUMscUJBQWMsQ0FBQyxDQUFDO0FBRXRELE1BQU0sV0FBVyxHQUFHLGlDQUFpQyxDQUFDO0FBRXRELE1BQWEsa0JBQWtCO0lBQzdCLGdCQUFlLENBQUM7SUFFaEIsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUM5RCxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQ3hDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsNEJBQTRCO2FBQ2pFLEVBQ0QsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUU7Z0JBQzFCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsS0FBSyxNQUFNLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7b0JBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDN0QsU0FBUztxQkFDVjtvQkFFRCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNwRCxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO3dCQUNsRCxTQUFTO3FCQUNWO29CQUVELE9BQU8sQ0FBQyxJQUFJLENBQ1YsbUJBQW1CLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQzt5QkFDN0MsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7d0JBQ2YsV0FBVyxDQUFDLFdBQVcsQ0FDckIsU0FBUyxFQUNULENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQ1IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ2QsR0FBRyxTQUFTOzRCQUNaLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxNQUFNO3lCQUNyQyxDQUFDLENBQ0gsQ0FBQztvQkFDSixDQUFDLENBQUM7eUJBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7d0JBQ2YsSUFBQSxnQ0FBVSxFQUNSLFdBQVcsRUFDWCxvREFBb0QsU0FBUyxjQUFjLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FDM0YsQ0FBQztvQkFDSixDQUFDLENBQUMsQ0FDTCxDQUFDO2lCQUNIO2dCQUVELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaERELGdEQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7IENvbXBpbGVyIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBicm90bGlDb21wcmVzcyB9IGZyb20gJ3psaWInO1xuaW1wb3J0IHsgYWRkV2FybmluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuXG5jb25zdCBicm90bGlDb21wcmVzc0FzeW5jID0gcHJvbWlzaWZ5KGJyb3RsaUNvbXByZXNzKTtcblxuY29uc3QgUExVR0lOX05BTUUgPSAnYW5ndWxhci10cmFuc2Zlci1zaXplLWVzdGltYXRvcic7XG5cbmV4cG9ydCBjbGFzcyBUcmFuc2ZlclNpemVQbHVnaW4ge1xuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29tcGlsZXIuaG9va3MudGhpc0NvbXBpbGF0aW9uLnRhcChQTFVHSU5fTkFNRSwgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5wcm9jZXNzQXNzZXRzLnRhcFByb21pc2UoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBQTFVHSU5fTkFNRSxcbiAgICAgICAgICBzdGFnZTogY29tcGlsZXIud2VicGFjay5Db21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9BTkFMWVNFLFxuICAgICAgICB9LFxuICAgICAgICBhc3luYyAoY29tcGlsYXRpb25Bc3NldHMpID0+IHtcbiAgICAgICAgICBjb25zdCBhY3Rpb25zID0gW107XG4gICAgICAgICAgZm9yIChjb25zdCBhc3NldE5hbWUgb2YgT2JqZWN0LmtleXMoY29tcGlsYXRpb25Bc3NldHMpKSB7XG4gICAgICAgICAgICBpZiAoIWFzc2V0TmFtZS5lbmRzV2l0aCgnLmpzJykgJiYgIWFzc2V0TmFtZS5lbmRzV2l0aCgnLmNzcycpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzY3JpcHRBc3NldCA9IGNvbXBpbGF0aW9uLmdldEFzc2V0KGFzc2V0TmFtZSk7XG4gICAgICAgICAgICBpZiAoIXNjcmlwdEFzc2V0IHx8IHNjcmlwdEFzc2V0LnNvdXJjZS5zaXplKCkgPD0gMCkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFxuICAgICAgICAgICAgICBicm90bGlDb21wcmVzc0FzeW5jKHNjcmlwdEFzc2V0LnNvdXJjZS5zb3VyY2UoKSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb21waWxhdGlvbi51cGRhdGVBc3NldChcbiAgICAgICAgICAgICAgICAgICAgYXNzZXROYW1lLFxuICAgICAgICAgICAgICAgICAgICAocykgPT4gcyxcbiAgICAgICAgICAgICAgICAgICAgKGFzc2V0SW5mbykgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAuLi5hc3NldEluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgZXN0aW1hdGVkVHJhbnNmZXJTaXplOiByZXN1bHQubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICBhZGRXYXJuaW5nKFxuICAgICAgICAgICAgICAgICAgICBjb21waWxhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgYFVuYWJsZSB0byBjYWxjdWxhdGUgZXN0aW1hdGVkIHRyYW5zZmVyIHNpemUgZm9yICcke2Fzc2V0TmFtZX0nLiBSZWFzb246ICR7ZXJyb3IubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoYWN0aW9ucyk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
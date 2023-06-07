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
exports.StylesWebpackPlugin = void 0;
const assert_1 = __importDefault(require("assert"));
const error_1 = require("../../utils/error");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'styles-webpack-plugin';
class StylesWebpackPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { entryPoints, preserveSymlinks, root } = this.options;
        const resolver = compiler.resolverFactory.get('global-styles', {
            conditionNames: ['sass', 'less', 'style'],
            mainFields: ['sass', 'less', 'style', 'main', '...'],
            extensions: ['.scss', '.sass', '.less', '.css'],
            restrictions: [/\.((le|sa|sc|c)ss)$/i],
            preferRelative: true,
            useSyncFileSystemCalls: true,
            symlinks: !preserveSymlinks,
            fileSystem: compiler.inputFileSystem,
        });
        const webpackOptions = compiler.options;
        compiler.hooks.environment.tap(PLUGIN_NAME, () => {
            const entry = typeof webpackOptions.entry === 'function' ? webpackOptions.entry() : webpackOptions.entry;
            webpackOptions.entry = async () => {
                var _a;
                const entrypoints = await entry;
                for (const [bundleName, paths] of Object.entries(entryPoints)) {
                    entrypoints[bundleName] ?? (entrypoints[bundleName] = {});
                    const entryImport = ((_a = entrypoints[bundleName]).import ?? (_a.import = []));
                    for (const path of paths) {
                        try {
                            const resolvedPath = resolver.resolveSync({}, root, path);
                            if (resolvedPath) {
                                entryImport.push(`${resolvedPath}?ngGlobalStyle`);
                            }
                            else {
                                (0, assert_1.default)(this.compilation, 'Compilation cannot be undefined.');
                                (0, webpack_diagnostics_1.addError)(this.compilation, `Cannot resolve '${path}'.`);
                            }
                        }
                        catch (error) {
                            (0, assert_1.default)(this.compilation, 'Compilation cannot be undefined.');
                            (0, error_1.assertIsError)(error);
                            (0, webpack_diagnostics_1.addError)(this.compilation, error.message);
                        }
                    }
                }
                return entrypoints;
            };
        });
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            this.compilation = compilation;
        });
    }
}
exports.StylesWebpackPlugin = StylesWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVzLXdlYnBhY2stcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3N0eWxlcy13ZWJwYWNrLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCxvREFBNEI7QUFFNUIsNkNBQWtEO0FBQ2xELHlFQUEyRDtBQVEzRDs7R0FFRztBQUNILE1BQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDO0FBRTVDLE1BQWEsbUJBQW1CO0lBRzlCLFlBQTZCLE9BQW1DO1FBQW5DLFlBQU8sR0FBUCxPQUFPLENBQTRCO0lBQUcsQ0FBQztJQUVwRSxLQUFLLENBQUMsUUFBa0I7UUFDdEIsTUFBTSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzdELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRTtZQUM3RCxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQztZQUN6QyxVQUFVLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO1lBQ3BELFVBQVUsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztZQUMvQyxZQUFZLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztZQUN0QyxjQUFjLEVBQUUsSUFBSTtZQUNwQixzQkFBc0IsRUFBRSxJQUFJO1lBQzVCLFFBQVEsRUFBRSxDQUFDLGdCQUFnQjtZQUMzQixVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWU7U0FDckMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUN4QyxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLEtBQUssR0FDVCxPQUFPLGNBQWMsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFFN0YsY0FBYyxDQUFDLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTs7Z0JBQ2hDLE1BQU0sV0FBVyxHQUFHLE1BQU0sS0FBSyxDQUFDO2dCQUVoQyxLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRTtvQkFDN0QsV0FBVyxDQUFDLFVBQVUsTUFBdEIsV0FBVyxDQUFDLFVBQVUsSUFBTSxFQUFFLEVBQUM7b0JBQy9CLE1BQU0sV0FBVyxHQUFHLE9BQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFDLE1BQU0sUUFBTixNQUFNLEdBQUssRUFBRSxFQUFDLENBQUM7b0JBRTVELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO3dCQUN4QixJQUFJOzRCQUNGLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDMUQsSUFBSSxZQUFZLEVBQUU7Z0NBQ2hCLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLGdCQUFnQixDQUFDLENBQUM7NkJBQ25EO2lDQUFNO2dDQUNMLElBQUEsZ0JBQU0sRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7Z0NBQzdELElBQUEsOEJBQVEsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLG1CQUFtQixJQUFJLElBQUksQ0FBQyxDQUFDOzZCQUN6RDt5QkFDRjt3QkFBQyxPQUFPLEtBQUssRUFBRTs0QkFDZCxJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDOzRCQUM3RCxJQUFBLHFCQUFhLEVBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ3JCLElBQUEsOEJBQVEsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFDM0M7cUJBQ0Y7aUJBQ0Y7Z0JBRUQsT0FBTyxXQUFXLENBQUM7WUFDckIsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDOUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2REQsa0RBdURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB0eXBlIHsgQ29tcGlsYXRpb24sIENvbXBpbGVyIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvZXJyb3InO1xuaW1wb3J0IHsgYWRkRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWRpYWdub3N0aWNzJztcblxuZXhwb3J0IGludGVyZmFjZSBTdHlsZXNXZWJwYWNrUGx1Z2luT3B0aW9ucyB7XG4gIHByZXNlcnZlU3ltbGlua3M/OiBib29sZWFuO1xuICByb290OiBzdHJpbmc7XG4gIGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XG59XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIHBsdWdpbiBwcm92aWRlZCB0byBXZWJwYWNrIHdoZW4gdGFwcGluZyBXZWJwYWNrIGNvbXBpbGVyIGhvb2tzLlxuICovXG5jb25zdCBQTFVHSU5fTkFNRSA9ICdzdHlsZXMtd2VicGFjay1wbHVnaW4nO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVzV2VicGFja1BsdWdpbiB7XG4gIHByaXZhdGUgY29tcGlsYXRpb246IENvbXBpbGF0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogU3R5bGVzV2VicGFja1BsdWdpbk9wdGlvbnMpIHt9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKTogdm9pZCB7XG4gICAgY29uc3QgeyBlbnRyeVBvaW50cywgcHJlc2VydmVTeW1saW5rcywgcm9vdCB9ID0gdGhpcy5vcHRpb25zO1xuICAgIGNvbnN0IHJlc29sdmVyID0gY29tcGlsZXIucmVzb2x2ZXJGYWN0b3J5LmdldCgnZ2xvYmFsLXN0eWxlcycsIHtcbiAgICAgIGNvbmRpdGlvbk5hbWVzOiBbJ3Nhc3MnLCAnbGVzcycsICdzdHlsZSddLFxuICAgICAgbWFpbkZpZWxkczogWydzYXNzJywgJ2xlc3MnLCAnc3R5bGUnLCAnbWFpbicsICcuLi4nXSxcbiAgICAgIGV4dGVuc2lvbnM6IFsnLnNjc3MnLCAnLnNhc3MnLCAnLmxlc3MnLCAnLmNzcyddLFxuICAgICAgcmVzdHJpY3Rpb25zOiBbL1xcLigobGV8c2F8c2N8YylzcykkL2ldLFxuICAgICAgcHJlZmVyUmVsYXRpdmU6IHRydWUsXG4gICAgICB1c2VTeW5jRmlsZVN5c3RlbUNhbGxzOiB0cnVlLFxuICAgICAgc3ltbGlua3M6ICFwcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgZmlsZVN5c3RlbTogY29tcGlsZXIuaW5wdXRGaWxlU3lzdGVtLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgd2VicGFja09wdGlvbnMgPSBjb21waWxlci5vcHRpb25zO1xuICAgIGNvbXBpbGVyLmhvb2tzLmVudmlyb25tZW50LnRhcChQTFVHSU5fTkFNRSwgKCkgPT4ge1xuICAgICAgY29uc3QgZW50cnkgPVxuICAgICAgICB0eXBlb2Ygd2VicGFja09wdGlvbnMuZW50cnkgPT09ICdmdW5jdGlvbicgPyB3ZWJwYWNrT3B0aW9ucy5lbnRyeSgpIDogd2VicGFja09wdGlvbnMuZW50cnk7XG5cbiAgICAgIHdlYnBhY2tPcHRpb25zLmVudHJ5ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBlbnRyeXBvaW50cyA9IGF3YWl0IGVudHJ5O1xuXG4gICAgICAgIGZvciAoY29uc3QgW2J1bmRsZU5hbWUsIHBhdGhzXSBvZiBPYmplY3QuZW50cmllcyhlbnRyeVBvaW50cykpIHtcbiAgICAgICAgICBlbnRyeXBvaW50c1tidW5kbGVOYW1lXSA/Pz0ge307XG4gICAgICAgICAgY29uc3QgZW50cnlJbXBvcnQgPSAoZW50cnlwb2ludHNbYnVuZGxlTmFtZV0uaW1wb3J0ID8/PSBbXSk7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmVyLnJlc29sdmVTeW5jKHt9LCByb290LCBwYXRoKTtcbiAgICAgICAgICAgICAgaWYgKHJlc29sdmVkUGF0aCkge1xuICAgICAgICAgICAgICAgIGVudHJ5SW1wb3J0LnB1c2goYCR7cmVzb2x2ZWRQYXRofT9uZ0dsb2JhbFN0eWxlYCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0KHRoaXMuY29tcGlsYXRpb24sICdDb21waWxhdGlvbiBjYW5ub3QgYmUgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgICAgIGFkZEVycm9yKHRoaXMuY29tcGlsYXRpb24sIGBDYW5ub3QgcmVzb2x2ZSAnJHtwYXRofScuYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGFzc2VydCh0aGlzLmNvbXBpbGF0aW9uLCAnQ29tcGlsYXRpb24gY2Fubm90IGJlIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgICAgICAgYXNzZXJ0SXNFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIGFkZEVycm9yKHRoaXMuY29tcGlsYXRpb24sIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbnRyeXBvaW50cztcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIHRoaXMuY29tcGlsYXRpb24gPSBjb21waWxhdGlvbjtcbiAgICB9KTtcbiAgfVxufVxuIl19
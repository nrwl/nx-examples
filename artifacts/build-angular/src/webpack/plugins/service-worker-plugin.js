"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceWorkerPlugin = void 0;
const service_worker_1 = require("../../utils/service-worker");
class ServiceWorkerPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.done.tapPromise('angular-service-worker', async (stats) => {
            if (stats.hasErrors()) {
                // Don't generate a service worker if the compilation has errors.
                // When there are errors some files will not be emitted which would cause other errors down the line such as readdir failures.
                return;
            }
            const { projectRoot, root, baseHref = '', ngswConfigPath } = this.options;
            const { compilation } = stats;
            // We use the output path from the compilation instead of build options since during
            // localization the output path is modified to a temp directory.
            // See: https://github.com/angular/angular-cli/blob/7e64b1537d54fadb650559214fbb12707324cd75/packages/angular_devkit/build_angular/src/utils/i18n-options.ts#L251-L252
            const outputPath = compilation.outputOptions.path;
            if (!outputPath) {
                throw new Error('Compilation output path cannot be empty.');
            }
            try {
                await (0, service_worker_1.augmentAppWithServiceWorker)(projectRoot, root, outputPath, baseHref, ngswConfigPath, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                compiler.inputFileSystem.promises, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                compiler.outputFileSystem.promises);
            }
            catch (error) {
                compilation.errors.push(new compilation.compiler.webpack.WebpackError(`Failed to generate service worker - ${error instanceof Error ? error.message : error}`));
            }
        });
    }
}
exports.ServiceWorkerPlugin = ServiceWorkerPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS13b3JrZXItcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3NlcnZpY2Utd29ya2VyLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCwrREFBeUU7QUFTekUsTUFBYSxtQkFBbUI7SUFDOUIsWUFBNkIsT0FBbUM7UUFBbkMsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7SUFBRyxDQUFDO0lBRXBFLEtBQUssQ0FBQyxRQUFrQjtRQUN0QixRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ3ZFLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUNyQixpRUFBaUU7Z0JBQ2pFLDhIQUE4SDtnQkFDOUgsT0FBTzthQUNSO1lBRUQsTUFBTSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxHQUFHLEVBQUUsRUFBRSxjQUFjLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDOUIsb0ZBQW9GO1lBQ3BGLGdFQUFnRTtZQUNoRSxzS0FBc0s7WUFDdEssTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFFbEQsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7YUFDN0Q7WUFFRCxJQUFJO2dCQUNGLE1BQU0sSUFBQSw0Q0FBMkIsRUFDL0IsV0FBVyxFQUNYLElBQUksRUFDSixVQUFVLEVBQ1YsUUFBUSxFQUNSLGNBQWM7Z0JBQ2QsOERBQThEO2dCQUM3RCxRQUFRLENBQUMsZUFBdUIsQ0FBQyxRQUFRO2dCQUMxQyw4REFBOEQ7Z0JBQzdELFFBQVEsQ0FBQyxnQkFBd0IsQ0FBQyxRQUFRLENBQzVDLENBQUM7YUFDSDtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNyQixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FDM0MsdUNBQXVDLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUN4RixDQUNGLENBQUM7YUFDSDtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0NELGtEQTJDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IENvbXBpbGVyIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXIgfSBmcm9tICcuLi8uLi91dGlscy9zZXJ2aWNlLXdvcmtlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmljZVdvcmtlclBsdWdpbk9wdGlvbnMge1xuICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuICByb290OiBzdHJpbmc7XG4gIGJhc2VIcmVmPzogc3RyaW5nO1xuICBuZ3N3Q29uZmlnUGF0aD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFNlcnZpY2VXb3JrZXJQbHVnaW4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFNlcnZpY2VXb3JrZXJQbHVnaW5PcHRpb25zKSB7fVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbXBpbGVyLmhvb2tzLmRvbmUudGFwUHJvbWlzZSgnYW5ndWxhci1zZXJ2aWNlLXdvcmtlcicsIGFzeW5jIChzdGF0cykgPT4ge1xuICAgICAgaWYgKHN0YXRzLmhhc0Vycm9ycygpKSB7XG4gICAgICAgIC8vIERvbid0IGdlbmVyYXRlIGEgc2VydmljZSB3b3JrZXIgaWYgdGhlIGNvbXBpbGF0aW9uIGhhcyBlcnJvcnMuXG4gICAgICAgIC8vIFdoZW4gdGhlcmUgYXJlIGVycm9ycyBzb21lIGZpbGVzIHdpbGwgbm90IGJlIGVtaXR0ZWQgd2hpY2ggd291bGQgY2F1c2Ugb3RoZXIgZXJyb3JzIGRvd24gdGhlIGxpbmUgc3VjaCBhcyByZWFkZGlyIGZhaWx1cmVzLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgcHJvamVjdFJvb3QsIHJvb3QsIGJhc2VIcmVmID0gJycsIG5nc3dDb25maWdQYXRoIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgICBjb25zdCB7IGNvbXBpbGF0aW9uIH0gPSBzdGF0cztcbiAgICAgIC8vIFdlIHVzZSB0aGUgb3V0cHV0IHBhdGggZnJvbSB0aGUgY29tcGlsYXRpb24gaW5zdGVhZCBvZiBidWlsZCBvcHRpb25zIHNpbmNlIGR1cmluZ1xuICAgICAgLy8gbG9jYWxpemF0aW9uIHRoZSBvdXRwdXQgcGF0aCBpcyBtb2RpZmllZCB0byBhIHRlbXAgZGlyZWN0b3J5LlxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9ibG9iLzdlNjRiMTUzN2Q1NGZhZGI2NTA1NTkyMTRmYmIxMjcwNzMyNGNkNzUvcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaTE4bi1vcHRpb25zLnRzI0wyNTEtTDI1MlxuICAgICAgY29uc3Qgb3V0cHV0UGF0aCA9IGNvbXBpbGF0aW9uLm91dHB1dE9wdGlvbnMucGF0aDtcblxuICAgICAgaWYgKCFvdXRwdXRQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcGlsYXRpb24gb3V0cHV0IHBhdGggY2Fubm90IGJlIGVtcHR5LicpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXIoXG4gICAgICAgICAgcHJvamVjdFJvb3QsXG4gICAgICAgICAgcm9vdCxcbiAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgIGJhc2VIcmVmLFxuICAgICAgICAgIG5nc3dDb25maWdQYXRoLFxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgKGNvbXBpbGVyLmlucHV0RmlsZVN5c3RlbSBhcyBhbnkpLnByb21pc2VzLFxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgKGNvbXBpbGVyLm91dHB1dEZpbGVTeXN0ZW0gYXMgYW55KS5wcm9taXNlcyxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbXBpbGF0aW9uLmVycm9ycy5wdXNoKFxuICAgICAgICAgIG5ldyBjb21waWxhdGlvbi5jb21waWxlci53ZWJwYWNrLldlYnBhY2tFcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gZ2VuZXJhdGUgc2VydmljZSB3b3JrZXIgLSAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YCxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=
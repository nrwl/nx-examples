"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonJsUsageWarnPlugin = void 0;
const path_1 = require("path");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
// Webpack doesn't export these so the deep imports can potentially break.
const AMDDefineDependency = require('webpack/lib/dependencies/AMDDefineDependency');
const CommonJsExportsDependency = require('webpack/lib/dependencies/CommonJsExportsDependency');
const CommonJsRequireDependency = require('webpack/lib/dependencies/CommonJsRequireDependency');
const CommonJsSelfReferenceDependency = require('webpack/lib/dependencies/CommonJsSelfReferenceDependency');
class CommonJsUsageWarnPlugin {
    constructor(options = {}) {
        this.options = options;
        this.shownWarnings = new Set();
        this.allowedDependencies = new Set(this.options.allowedDependencies);
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('CommonJsUsageWarnPlugin', (compilation) => {
            compilation.hooks.finishModules.tap('CommonJsUsageWarnPlugin', (modules) => {
                const mainEntry = compilation.entries.get('main');
                if (!mainEntry) {
                    return;
                }
                const mainModules = new Set(mainEntry.dependencies.map((dep) => compilation.moduleGraph.getModule(dep)));
                for (const module of modules) {
                    const { dependencies, rawRequest } = module;
                    if (!rawRequest ||
                        rawRequest.startsWith('.') ||
                        (0, path_1.isAbsolute)(rawRequest) ||
                        this.allowedDependencies.has(rawRequest) ||
                        this.allowedDependencies.has(this.rawRequestToPackageName(rawRequest)) ||
                        rawRequest.startsWith('@angular/common/locales/')) {
                        /**
                         * Skip when:
                         * - module is absolute or relative.
                         * - module is allowed even if it's a CommonJS.
                         * - module is a locale imported from '@angular/common'.
                         */
                        continue;
                    }
                    if (this.hasCommonJsDependencies(compilation, dependencies)) {
                        // Dependency is CommonsJS or AMD.
                        const issuer = getIssuer(compilation, module);
                        // Check if it's parent issuer is also a CommonJS dependency.
                        // In case it is skip as an warning will be show for the parent CommonJS dependency.
                        const parentDependencies = getIssuer(compilation, issuer)?.dependencies;
                        if (parentDependencies &&
                            this.hasCommonJsDependencies(compilation, parentDependencies, true)) {
                            continue;
                        }
                        // Find the main issuer (entry-point).
                        let mainIssuer = issuer;
                        let nextIssuer = getIssuer(compilation, mainIssuer);
                        while (nextIssuer) {
                            mainIssuer = nextIssuer;
                            nextIssuer = getIssuer(compilation, mainIssuer);
                        }
                        // Only show warnings for modules from main entrypoint.
                        // And if the issuer request is not from 'webpack-dev-server', as 'webpack-dev-server'
                        // will require CommonJS libraries for live reloading such as 'sockjs-node'.
                        if (mainIssuer && mainModules.has(mainIssuer)) {
                            const warning = `${issuer?.userRequest} depends on '${rawRequest}'. ` +
                                'CommonJS or AMD dependencies can cause optimization bailouts.\n' +
                                'For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies';
                            // Avoid showing the same warning multiple times when in 'watch' mode.
                            if (!this.shownWarnings.has(warning)) {
                                (0, webpack_diagnostics_1.addWarning)(compilation, warning);
                                this.shownWarnings.add(warning);
                            }
                        }
                    }
                }
            });
        });
    }
    hasCommonJsDependencies(compilation, dependencies, checkParentModules = false) {
        for (const dep of dependencies) {
            if (dep instanceof CommonJsRequireDependency ||
                dep instanceof CommonJsExportsDependency ||
                dep instanceof CommonJsSelfReferenceDependency ||
                dep instanceof AMDDefineDependency) {
                return true;
            }
            if (checkParentModules) {
                const module = getWebpackModule(compilation, dep);
                if (module && this.hasCommonJsDependencies(compilation, module.dependencies)) {
                    return true;
                }
            }
        }
        return false;
    }
    rawRequestToPackageName(rawRequest) {
        return rawRequest.startsWith('@')
            ? // Scoped request ex: @angular/common/locale/en -> @angular/common
                rawRequest.split('/', 2).join('/')
            : // Non-scoped request ex: lodash/isEmpty -> lodash
                rawRequest.split('/', 1)[0];
    }
}
exports.CommonJsUsageWarnPlugin = CommonJsUsageWarnPlugin;
function getIssuer(compilation, module) {
    if (!module) {
        return null;
    }
    return compilation.moduleGraph.getIssuer(module);
}
function getWebpackModule(compilation, dependency) {
    if (!dependency) {
        return null;
    }
    return compilation.moduleGraph.getModule(dependency);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLWpzLXVzYWdlLXdhcm4tcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL2NvbW1vbi1qcy11c2FnZS13YXJuLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBa0M7QUFFbEMseUVBQTZEO0FBRTdELDBFQUEwRTtBQUMxRSxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0FBQ3BGLE1BQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7QUFDaEcsTUFBTSx5QkFBeUIsR0FBRyxPQUFPLENBQUMsb0RBQW9ELENBQUMsQ0FBQztBQUNoRyxNQUFNLCtCQUErQixHQUFHLE9BQU8sQ0FBQywwREFBMEQsQ0FBQyxDQUFDO0FBTzVHLE1BQWEsdUJBQXVCO0lBSWxDLFlBQW9CLFVBQTBDLEVBQUU7UUFBNUMsWUFBTyxHQUFQLE9BQU8sQ0FBcUM7UUFIeEQsa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBSXhDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFrQjtRQUN0QixRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUN4RSxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDekUsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENB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O1lBRUQsSUFBSSxrQkFBa0IsRUFBRTtnQkFDdEIsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDNUUsT0FBTyxJQUFJLENBQUM7aUJBQ2I7YUFDRjtTQUNGO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU8sdUJBQXVCLENBQUMsVUFBa0I7UUFDaEQsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUMvQixDQUFDLENBQUMsa0VBQWtFO2dCQUNsRSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxrREFBa0Q7Z0JBQ2xELFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0FDRjtBQWpIRCwwREFpSEM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxXQUF3QixFQUFFLE1BQXFCO0lBQ2hFLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxXQUF3QixFQUFFLFVBQTZCO0lBQy9FLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN2RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGlzQWJzb2x1dGUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbXBpbGF0aW9uLCBDb21waWxlciwgRGVwZW5kZW5jeSwgTW9kdWxlLCBOb3JtYWxNb2R1bGUgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IGFkZFdhcm5pbmcgfSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWRpYWdub3N0aWNzJztcblxuLy8gV2VicGFjayBkb2Vzbid0IGV4cG9ydCB0aGVzZSBzbyB0aGUgZGVlcCBpbXBvcnRzIGNhbiBwb3RlbnRpYWxseSBicmVhay5cbmNvbnN0IEFNRERlZmluZURlcGVuZGVuY3kgPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9kZXBlbmRlbmNpZXMvQU1ERGVmaW5lRGVwZW5kZW5jeScpO1xuY29uc3QgQ29tbW9uSnNFeHBvcnRzRGVwZW5kZW5jeSA9IHJlcXVpcmUoJ3dlYnBhY2svbGliL2RlcGVuZGVuY2llcy9Db21tb25Kc0V4cG9ydHNEZXBlbmRlbmN5Jyk7XG5jb25zdCBDb21tb25Kc1JlcXVpcmVEZXBlbmRlbmN5ID0gcmVxdWlyZSgnd2VicGFjay9saWIvZGVwZW5kZW5jaWVzL0NvbW1vbkpzUmVxdWlyZURlcGVuZGVuY3knKTtcbmNvbnN0IENvbW1vbkpzU2VsZlJlZmVyZW5jZURlcGVuZGVuY3kgPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9kZXBlbmRlbmNpZXMvQ29tbW9uSnNTZWxmUmVmZXJlbmNlRGVwZW5kZW5jeScpO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbW1vbkpzVXNhZ2VXYXJuUGx1Z2luT3B0aW9ucyB7XG4gIC8qKiBBIGxpc3Qgb2YgQ29tbW9uSlMgcGFja2FnZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBiZSB1c2VkIHdpdGhvdXQgYSB3YXJuaW5nLiAqL1xuICBhbGxvd2VkRGVwZW5kZW5jaWVzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBDb21tb25Kc1VzYWdlV2FyblBsdWdpbiB7XG4gIHByaXZhdGUgc2hvd25XYXJuaW5ncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBwcml2YXRlIGFsbG93ZWREZXBlbmRlbmNpZXM6IFNldDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgb3B0aW9uczogQ29tbW9uSnNVc2FnZVdhcm5QbHVnaW5PcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmFsbG93ZWREZXBlbmRlbmNpZXMgPSBuZXcgU2V0KHRoaXMub3B0aW9ucy5hbGxvd2VkRGVwZW5kZW5jaWVzKTtcbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnQ29tbW9uSnNVc2FnZVdhcm5QbHVnaW4nLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmZpbmlzaE1vZHVsZXMudGFwKCdDb21tb25Kc1VzYWdlV2FyblBsdWdpbicsIChtb2R1bGVzKSA9PiB7XG4gICAgICAgIGNvbnN0IG1haW5FbnRyeSA9IGNvbXBpbGF0aW9uLmVudHJpZXMuZ2V0KCdtYWluJyk7XG4gICAgICAgIGlmICghbWFpbkVudHJ5KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1haW5Nb2R1bGVzID0gbmV3IFNldChcbiAgICAgICAgICBtYWluRW50cnkuZGVwZW5kZW5jaWVzLm1hcCgoZGVwKSA9PiBjb21waWxhdGlvbi5tb2R1bGVHcmFwaC5nZXRNb2R1bGUoZGVwKSksXG4gICAgICAgICk7XG5cbiAgICAgICAgZm9yIChjb25zdCBtb2R1bGUgb2YgbW9kdWxlcykge1xuICAgICAgICAgIGNvbnN0IHsgZGVwZW5kZW5jaWVzLCByYXdSZXF1ZXN0IH0gPSBtb2R1bGUgYXMgTm9ybWFsTW9kdWxlO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFyYXdSZXF1ZXN0IHx8XG4gICAgICAgICAgICByYXdSZXF1ZXN0LnN0YXJ0c1dpdGgoJy4nKSB8fFxuICAgICAgICAgICAgaXNBYnNvbHV0ZShyYXdSZXF1ZXN0KSB8fFxuICAgICAgICAgICAgdGhpcy5hbGxvd2VkRGVwZW5kZW5jaWVzLmhhcyhyYXdSZXF1ZXN0KSB8fFxuICAgICAgICAgICAgdGhpcy5hbGxvd2VkRGVwZW5kZW5jaWVzLmhhcyh0aGlzLnJhd1JlcXVlc3RUb1BhY2thZ2VOYW1lKHJhd1JlcXVlc3QpKSB8fFxuICAgICAgICAgICAgcmF3UmVxdWVzdC5zdGFydHNXaXRoKCdAYW5ndWxhci9jb21tb24vbG9jYWxlcy8nKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTa2lwIHdoZW46XG4gICAgICAgICAgICAgKiAtIG1vZHVsZSBpcyBhYnNvbHV0ZSBvciByZWxhdGl2ZS5cbiAgICAgICAgICAgICAqIC0gbW9kdWxlIGlzIGFsbG93ZWQgZXZlbiBpZiBpdCdzIGEgQ29tbW9uSlMuXG4gICAgICAgICAgICAgKiAtIG1vZHVsZSBpcyBhIGxvY2FsZSBpbXBvcnRlZCBmcm9tICdAYW5ndWxhci9jb21tb24nLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5oYXNDb21tb25Kc0RlcGVuZGVuY2llcyhjb21waWxhdGlvbiwgZGVwZW5kZW5jaWVzKSkge1xuICAgICAgICAgICAgLy8gRGVwZW5kZW5jeSBpcyBDb21tb25zSlMgb3IgQU1ELlxuICAgICAgICAgICAgY29uc3QgaXNzdWVyID0gZ2V0SXNzdWVyKGNvbXBpbGF0aW9uLCBtb2R1bGUpO1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXQncyBwYXJlbnQgaXNzdWVyIGlzIGFsc28gYSBDb21tb25KUyBkZXBlbmRlbmN5LlxuICAgICAgICAgICAgLy8gSW4gY2FzZSBpdCBpcyBza2lwIGFzIGFuIHdhcm5pbmcgd2lsbCBiZSBzaG93IGZvciB0aGUgcGFyZW50IENvbW1vbkpTIGRlcGVuZGVuY3kuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnREZXBlbmRlbmNpZXMgPSBnZXRJc3N1ZXIoY29tcGlsYXRpb24sIGlzc3Vlcik/LmRlcGVuZGVuY2llcztcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgcGFyZW50RGVwZW5kZW5jaWVzICYmXG4gICAgICAgICAgICAgIHRoaXMuaGFzQ29tbW9uSnNEZXBlbmRlbmNpZXMoY29tcGlsYXRpb24sIHBhcmVudERlcGVuZGVuY2llcywgdHJ1ZSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluZCB0aGUgbWFpbiBpc3N1ZXIgKGVudHJ5LXBvaW50KS5cbiAgICAgICAgICAgIGxldCBtYWluSXNzdWVyID0gaXNzdWVyO1xuICAgICAgICAgICAgbGV0IG5leHRJc3N1ZXIgPSBnZXRJc3N1ZXIoY29tcGlsYXRpb24sIG1haW5Jc3N1ZXIpO1xuICAgICAgICAgICAgd2hpbGUgKG5leHRJc3N1ZXIpIHtcbiAgICAgICAgICAgICAgbWFpbklzc3VlciA9IG5leHRJc3N1ZXI7XG4gICAgICAgICAgICAgIG5leHRJc3N1ZXIgPSBnZXRJc3N1ZXIoY29tcGlsYXRpb24sIG1haW5Jc3N1ZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBPbmx5IHNob3cgd2FybmluZ3MgZm9yIG1vZHVsZXMgZnJvbSBtYWluIGVudHJ5cG9pbnQuXG4gICAgICAgICAgICAvLyBBbmQgaWYgdGhlIGlzc3VlciByZXF1ZXN0IGlzIG5vdCBmcm9tICd3ZWJwYWNrLWRldi1zZXJ2ZXInLCBhcyAnd2VicGFjay1kZXYtc2VydmVyJ1xuICAgICAgICAgICAgLy8gd2lsbCByZXF1aXJlIENvbW1vbkpTIGxpYnJhcmllcyBmb3IgbGl2ZSByZWxvYWRpbmcgc3VjaCBhcyAnc29ja2pzLW5vZGUnLlxuICAgICAgICAgICAgaWYgKG1haW5Jc3N1ZXIgJiYgbWFpbk1vZHVsZXMuaGFzKG1haW5Jc3N1ZXIpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHdhcm5pbmcgPVxuICAgICAgICAgICAgICAgIGAkeyhpc3N1ZXIgYXMgTm9ybWFsTW9kdWxlIHwgbnVsbCk/LnVzZXJSZXF1ZXN0fSBkZXBlbmRzIG9uICcke3Jhd1JlcXVlc3R9Jy4gYCArXG4gICAgICAgICAgICAgICAgJ0NvbW1vbkpTIG9yIEFNRCBkZXBlbmRlbmNpZXMgY2FuIGNhdXNlIG9wdGltaXphdGlvbiBiYWlsb3V0cy5cXG4nICtcbiAgICAgICAgICAgICAgICAnRm9yIG1vcmUgaW5mbyBzZWU6IGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9idWlsZCNjb25maWd1cmluZy1jb21tb25qcy1kZXBlbmRlbmNpZXMnO1xuXG4gICAgICAgICAgICAgIC8vIEF2b2lkIHNob3dpbmcgdGhlIHNhbWUgd2FybmluZyBtdWx0aXBsZSB0aW1lcyB3aGVuIGluICd3YXRjaCcgbW9kZS5cbiAgICAgICAgICAgICAgaWYgKCF0aGlzLnNob3duV2FybmluZ3MuaGFzKHdhcm5pbmcpKSB7XG4gICAgICAgICAgICAgICAgYWRkV2FybmluZyhjb21waWxhdGlvbiwgd2FybmluZyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93bldhcm5pbmdzLmFkZCh3YXJuaW5nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGhhc0NvbW1vbkpzRGVwZW5kZW5jaWVzKFxuICAgIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbixcbiAgICBkZXBlbmRlbmNpZXM6IERlcGVuZGVuY3lbXSxcbiAgICBjaGVja1BhcmVudE1vZHVsZXMgPSBmYWxzZSxcbiAgKTogYm9vbGVhbiB7XG4gICAgZm9yIChjb25zdCBkZXAgb2YgZGVwZW5kZW5jaWVzKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGRlcCBpbnN0YW5jZW9mIENvbW1vbkpzUmVxdWlyZURlcGVuZGVuY3kgfHxcbiAgICAgICAgZGVwIGluc3RhbmNlb2YgQ29tbW9uSnNFeHBvcnRzRGVwZW5kZW5jeSB8fFxuICAgICAgICBkZXAgaW5zdGFuY2VvZiBDb21tb25Kc1NlbGZSZWZlcmVuY2VEZXBlbmRlbmN5IHx8XG4gICAgICAgIGRlcCBpbnN0YW5jZW9mIEFNRERlZmluZURlcGVuZGVuY3lcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoZWNrUGFyZW50TW9kdWxlcykge1xuICAgICAgICBjb25zdCBtb2R1bGUgPSBnZXRXZWJwYWNrTW9kdWxlKGNvbXBpbGF0aW9uLCBkZXApO1xuICAgICAgICBpZiAobW9kdWxlICYmIHRoaXMuaGFzQ29tbW9uSnNEZXBlbmRlbmNpZXMoY29tcGlsYXRpb24sIG1vZHVsZS5kZXBlbmRlbmNpZXMpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHJhd1JlcXVlc3RUb1BhY2thZ2VOYW1lKHJhd1JlcXVlc3Q6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJhd1JlcXVlc3Quc3RhcnRzV2l0aCgnQCcpXG4gICAgICA/IC8vIFNjb3BlZCByZXF1ZXN0IGV4OiBAYW5ndWxhci9jb21tb24vbG9jYWxlL2VuIC0+IEBhbmd1bGFyL2NvbW1vblxuICAgICAgICByYXdSZXF1ZXN0LnNwbGl0KCcvJywgMikuam9pbignLycpXG4gICAgICA6IC8vIE5vbi1zY29wZWQgcmVxdWVzdCBleDogbG9kYXNoL2lzRW1wdHkgLT4gbG9kYXNoXG4gICAgICAgIHJhd1JlcXVlc3Quc3BsaXQoJy8nLCAxKVswXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRJc3N1ZXIoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBtb2R1bGU6IE1vZHVsZSB8IG51bGwpOiBNb2R1bGUgfCBudWxsIHtcbiAgaWYgKCFtb2R1bGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBjb21waWxhdGlvbi5tb2R1bGVHcmFwaC5nZXRJc3N1ZXIobW9kdWxlKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2VicGFja01vZHVsZShjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGRlcGVuZGVuY3k6IERlcGVuZGVuY3kgfCBudWxsKTogTW9kdWxlIHwgbnVsbCB7XG4gIGlmICghZGVwZW5kZW5jeSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBpbGF0aW9uLm1vZHVsZUdyYXBoLmdldE1vZHVsZShkZXBlbmRlbmN5KTtcbn1cbiJdfQ==
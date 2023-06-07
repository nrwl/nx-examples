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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const piscina_1 = __importDefault(require("piscina"));
const utils_1 = require("../../utils");
const error_1 = require("../../utils/error");
const inline_critical_css_1 = require("../../utils/index-file/inline-critical-css");
const service_worker_1 = require("../../utils/service-worker");
const spinner_1 = require("../../utils/spinner");
async function _renderUniversal(options, context, browserResult, serverResult, spinner) {
    // Get browser target options.
    const browserTarget = (0, architect_1.targetFromTargetString)(options.browserTarget);
    const rawBrowserOptions = (await context.getTargetOptions(browserTarget));
    const browserBuilderName = await context.getBuilderNameForTarget(browserTarget);
    const browserOptions = await context.validateOptions(rawBrowserOptions, browserBuilderName);
    // Locate zone.js to load in the render worker
    const root = context.workspaceRoot;
    const zonePackage = require.resolve('zone.js', { paths: [root] });
    const projectName = context.target && context.target.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = path.join(root, projectMetadata.root ?? '');
    const { styles } = (0, utils_1.normalizeOptimization)(browserOptions.optimization);
    const inlineCriticalCssProcessor = styles.inlineCritical
        ? new inline_critical_css_1.InlineCriticalCssProcessor({
            minify: styles.minify,
            deployUrl: browserOptions.deployUrl,
        })
        : undefined;
    const renderWorker = new piscina_1.default({
        filename: require.resolve('./render-worker'),
        maxThreads: 1,
        workerData: { zonePackage },
    });
    try {
        for (const { path: outputPath, baseHref } of browserResult.outputs) {
            const localeDirectory = path.relative(browserResult.baseOutputPath, outputPath);
            const browserIndexOutputPath = path.join(outputPath, 'index.html');
            const indexHtml = await fs.promises.readFile(browserIndexOutputPath, 'utf8');
            const serverBundlePath = await _getServerModuleBundlePath(options, context, serverResult, localeDirectory);
            let html = await renderWorker.run({
                serverBundlePath,
                document: indexHtml,
                url: options.route,
            });
            // Overwrite the client index file.
            const outputIndexPath = options.outputIndexPath
                ? path.join(root, options.outputIndexPath)
                : browserIndexOutputPath;
            if (inlineCriticalCssProcessor) {
                const { content, warnings, errors } = await inlineCriticalCssProcessor.process(html, {
                    outputPath,
                });
                html = content;
                if (warnings.length || errors.length) {
                    spinner.stop();
                    warnings.forEach((m) => context.logger.warn(m));
                    errors.forEach((m) => context.logger.error(m));
                    spinner.start();
                }
            }
            await fs.promises.writeFile(outputIndexPath, html);
            if (browserOptions.serviceWorker) {
                await (0, service_worker_1.augmentAppWithServiceWorker)(projectRoot, root, outputPath, baseHref ?? '/', browserOptions.ngswConfigPath);
            }
        }
    }
    finally {
        await renderWorker.destroy();
    }
    return browserResult;
}
async function _getServerModuleBundlePath(options, context, serverResult, browserLocaleDirectory) {
    if (options.appModuleBundle) {
        return path.join(context.workspaceRoot, options.appModuleBundle);
    }
    const { baseOutputPath = '' } = serverResult;
    const outputPath = path.join(baseOutputPath, browserLocaleDirectory);
    if (!fs.existsSync(outputPath)) {
        throw new Error(`Could not find server output directory: ${outputPath}.`);
    }
    const re = /^main\.(?:[a-zA-Z0-9]{16}\.)?js$/;
    const maybeMain = fs.readdirSync(outputPath).find((x) => re.test(x));
    if (!maybeMain) {
        throw new Error('Could not find the main bundle.');
    }
    return path.join(outputPath, maybeMain);
}
async function _appShellBuilder(options, context) {
    const browserTarget = (0, architect_1.targetFromTargetString)(options.browserTarget);
    const serverTarget = (0, architect_1.targetFromTargetString)(options.serverTarget);
    // Never run the browser target in watch mode.
    // If service worker is needed, it will be added in _renderUniversal();
    const browserOptions = (await context.getTargetOptions(browserTarget));
    const optimization = (0, utils_1.normalizeOptimization)(browserOptions.optimization);
    optimization.styles.inlineCritical = false;
    const browserTargetRun = await context.scheduleTarget(browserTarget, {
        watch: false,
        serviceWorker: false,
        optimization: optimization,
    });
    const serverTargetRun = await context.scheduleTarget(serverTarget, {
        watch: false,
    });
    let spinner;
    try {
        const [browserResult, serverResult] = await Promise.all([
            browserTargetRun.result,
            serverTargetRun.result,
        ]);
        if (browserResult.success === false || browserResult.baseOutputPath === undefined) {
            return browserResult;
        }
        else if (serverResult.success === false) {
            return serverResult;
        }
        spinner = new spinner_1.Spinner();
        spinner.start('Generating application shell...');
        const result = await _renderUniversal(options, context, browserResult, serverResult, spinner);
        spinner.succeed('Application shell generation complete.');
        return result;
    }
    catch (err) {
        spinner?.fail('Application shell generation failed.');
        (0, error_1.assertIsError)(err);
        return { success: false, error: err.message };
    }
    finally {
        await Promise.all([browserTargetRun.stop(), serverTargetRun.stop()]);
    }
}
exports.default = (0, architect_1.createBuilder)(_appShellBuilder);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9hcHAtc2hlbGwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHlEQUttQztBQUVuQyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLHNEQUE4QjtBQUM5Qix1Q0FBb0Q7QUFDcEQsNkNBQWtEO0FBQ2xELG9GQUF3RjtBQUN4RiwrREFBeUU7QUFDekUsaURBQThDO0FBTTlDLEtBQUssVUFBVSxnQkFBZ0IsQ0FDN0IsT0FBbUMsRUFDbkMsT0FBdUIsRUFDdkIsYUFBbUMsRUFDbkMsWUFBaUMsRUFDakMsT0FBZ0I7SUFFaEIsOEJBQThCO0lBQzlCLE1BQU0sYUFBYSxHQUFHLElBQUEsa0NBQXNCLEVBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3BFLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FDbEQsQ0FBQztJQUN2QixNQUFNLGtCQUFrQixHQUFHLE1BQU0sT0FBTyxDQUFDLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2hGLE1BQU0sY0FBYyxHQUFHLE1BQU0sT0FBTyxDQUFDLGVBQWUsQ0FDbEQsaUJBQWlCLEVBQ2pCLGtCQUFrQixDQUNuQixDQUFDO0lBRUYsOENBQThDO0lBQzlDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDbkMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFbEUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1B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UUFFSCxJQUFJLGFBQWEsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLGFBQWEsQ0FBQyxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2pGLE9BQU8sYUFBYSxDQUFDO1NBQ3RCO2FBQU0sSUFBSSxZQUFZLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRTtZQUN6QyxPQUFPLFlBQVksQ0FBQztTQUNyQjtRQUVELE9BQU8sR0FBRyxJQUFJLGlCQUFPLEVBQUUsQ0FBQztRQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUYsT0FBTyxDQUFDLE9BQU8sQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBRTFELE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sRUFBRSxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztRQUN0RCxJQUFBLHFCQUFhLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkIsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUMvQztZQUFTO1FBQ1IsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN0RTtBQUNILENBQUM7QUFFRCxrQkFBZSxJQUFBLHlCQUFhLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBCdWlsZGVyQ29udGV4dCxcbiAgQnVpbGRlck91dHB1dCxcbiAgY3JlYXRlQnVpbGRlcixcbiAgdGFyZ2V0RnJvbVRhcmdldFN0cmluZyxcbn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBKc29uT2JqZWN0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBQaXNjaW5hIGZyb20gJ3Bpc2NpbmEnO1xuaW1wb3J0IHsgbm9ybWFsaXplT3B0aW1pemF0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IElubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc29yIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW5kZXgtZmlsZS9pbmxpbmUtY3JpdGljYWwtY3NzJztcbmltcG9ydCB7IGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlciB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcnZpY2Utd29ya2VyJztcbmltcG9ydCB7IFNwaW5uZXIgfSBmcm9tICcuLi8uLi91dGlscy9zcGlubmVyJztcbmltcG9ydCB7IEJyb3dzZXJCdWlsZGVyT3V0cHV0IH0gZnJvbSAnLi4vYnJvd3Nlcic7XG5pbXBvcnQgeyBTY2hlbWEgYXMgQnJvd3NlckJ1aWxkZXJTY2hlbWEgfSBmcm9tICcuLi9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBTZXJ2ZXJCdWlsZGVyT3V0cHV0IH0gZnJvbSAnLi4vc2VydmVyJztcbmltcG9ydCB7IFNjaGVtYSBhcyBCdWlsZFdlYnBhY2tBcHBTaGVsbFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxuYXN5bmMgZnVuY3Rpb24gX3JlbmRlclVuaXZlcnNhbChcbiAgb3B0aW9uczogQnVpbGRXZWJwYWNrQXBwU2hlbGxTY2hlbWEsXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuICBicm93c2VyUmVzdWx0OiBCcm93c2VyQnVpbGRlck91dHB1dCxcbiAgc2VydmVyUmVzdWx0OiBTZXJ2ZXJCdWlsZGVyT3V0cHV0LFxuICBzcGlubmVyOiBTcGlubmVyLFxuKTogUHJvbWlzZTxCcm93c2VyQnVpbGRlck91dHB1dD4ge1xuICAvLyBHZXQgYnJvd3NlciB0YXJnZXQgb3B0aW9ucy5cbiAgY29uc3QgYnJvd3NlclRhcmdldCA9IHRhcmdldEZyb21UYXJnZXRTdHJpbmcob3B0aW9ucy5icm93c2VyVGFyZ2V0KTtcbiAgY29uc3QgcmF3QnJvd3Nlck9wdGlvbnMgPSAoYXdhaXQgY29udGV4dC5nZXRUYXJnZXRPcHRpb25zKGJyb3dzZXJUYXJnZXQpKSBhcyBKc29uT2JqZWN0ICZcbiAgICBCcm93c2VyQnVpbGRlclNjaGVtYTtcbiAgY29uc3QgYnJvd3NlckJ1aWxkZXJOYW1lID0gYXdhaXQgY29udGV4dC5nZXRCdWlsZGVyTmFtZUZvclRhcmdldChicm93c2VyVGFyZ2V0KTtcbiAgY29uc3QgYnJvd3Nlck9wdGlvbnMgPSBhd2FpdCBjb250ZXh0LnZhbGlkYXRlT3B0aW9uczxKc29uT2JqZWN0ICYgQnJvd3NlckJ1aWxkZXJTY2hlbWE+KFxuICAgIHJhd0Jyb3dzZXJPcHRpb25zLFxuICAgIGJyb3dzZXJCdWlsZGVyTmFtZSxcbiAgKTtcblxuICAvLyBMb2NhdGUgem9uZS5qcyB0byBsb2FkIGluIHRoZSByZW5kZXIgd29ya2VyXG4gIGNvbnN0IHJvb3QgPSBjb250ZXh0LndvcmtzcGFjZVJvb3Q7XG4gIGNvbnN0IHpvbmVQYWNrYWdlID0gcmVxdWlyZS5yZXNvbHZlKCd6b25lLmpzJywgeyBwYXRoczogW3Jvb3RdIH0pO1xuXG4gIGNvbnN0IHByb2plY3ROYW1lID0gY29udGV4dC50YXJnZXQgJiYgY29udGV4dC50YXJnZXQucHJvamVjdDtcbiAgaWYgKCFwcm9qZWN0TmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGJ1aWxkZXIgcmVxdWlyZXMgYSB0YXJnZXQuJyk7XG4gIH1cblxuICBjb25zdCBwcm9qZWN0TWV0YWRhdGEgPSBhd2FpdCBjb250ZXh0LmdldFByb2plY3RNZXRhZGF0YShwcm9qZWN0TmFtZSk7XG4gIGNvbnN0IHByb2plY3RSb290ID0gcGF0aC5qb2luKHJvb3QsIChwcm9qZWN0TWV0YWRhdGEucm9vdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKTtcblxuICBjb25zdCB7IHN0eWxlcyB9ID0gbm9ybWFsaXplT3B0aW1pemF0aW9uKGJyb3dzZXJPcHRpb25zLm9wdGltaXphdGlvbik7XG4gIGNvbnN0IGlubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc29yID0gc3R5bGVzLmlubGluZUNyaXRpY2FsXG4gICAgPyBuZXcgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3Ioe1xuICAgICAgICBtaW5pZnk6IHN0eWxlcy5taW5pZnksXG4gICAgICAgIGRlcGxveVVybDogYnJvd3Nlck9wdGlvbnMuZGVwbG95VXJsLFxuICAgICAgfSlcbiAgICA6IHVuZGVmaW5lZDtcblxuICBjb25zdCByZW5kZXJXb3JrZXIgPSBuZXcgUGlzY2luYSh7XG4gICAgZmlsZW5hbWU6IHJlcXVpcmUucmVzb2x2ZSgnLi9yZW5kZXItd29ya2VyJyksXG4gICAgbWF4VGhyZWFkczogMSxcbiAgICB3b3JrZXJEYXRhOiB7IHpvbmVQYWNrYWdlIH0sXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgZm9yIChjb25zdCB7IHBhdGg6IG91dHB1dFBhdGgsIGJhc2VIcmVmIH0gb2YgYnJvd3NlclJlc3VsdC5vdXRwdXRzKSB7XG4gICAgICBjb25zdCBsb2NhbGVEaXJlY3RvcnkgPSBwYXRoLnJlbGF0aXZlKGJyb3dzZXJSZXN1bHQuYmFzZU91dHB1dFBhdGgsIG91dHB1dFBhdGgpO1xuICAgICAgY29uc3QgYnJvd3NlckluZGV4T3V0cHV0UGF0aCA9IHBhdGguam9pbihvdXRwdXRQYXRoLCAnaW5kZXguaHRtbCcpO1xuICAgICAgY29uc3QgaW5kZXhIdG1sID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoYnJvd3NlckluZGV4T3V0cHV0UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IHNlcnZlckJ1bmRsZVBhdGggPSBhd2FpdCBfZ2V0U2VydmVyTW9kdWxlQnVuZGxlUGF0aChcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgc2VydmVyUmVzdWx0LFxuICAgICAgICBsb2NhbGVEaXJlY3RvcnksXG4gICAgICApO1xuXG4gICAgICBsZXQgaHRtbDogc3RyaW5nID0gYXdhaXQgcmVuZGVyV29ya2VyLnJ1bih7XG4gICAgICAgIHNlcnZlckJ1bmRsZVBhdGgsXG4gICAgICAgIGRvY3VtZW50OiBpbmRleEh0bWwsXG4gICAgICAgIHVybDogb3B0aW9ucy5yb3V0ZSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBPdmVyd3JpdGUgdGhlIGNsaWVudCBpbmRleCBmaWxlLlxuICAgICAgY29uc3Qgb3V0cHV0SW5kZXhQYXRoID0gb3B0aW9ucy5vdXRwdXRJbmRleFBhdGhcbiAgICAgICAgPyBwYXRoLmpvaW4ocm9vdCwgb3B0aW9ucy5vdXRwdXRJbmRleFBhdGgpXG4gICAgICAgIDogYnJvd3NlckluZGV4T3V0cHV0UGF0aDtcblxuICAgICAgaWYgKGlubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc29yKSB7XG4gICAgICAgIGNvbnN0IHsgY29udGVudCwgd2FybmluZ3MsIGVycm9ycyB9ID0gYXdhaXQgaW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3IucHJvY2VzcyhodG1sLCB7XG4gICAgICAgICAgb3V0cHV0UGF0aCxcbiAgICAgICAgfSk7XG4gICAgICAgIGh0bWwgPSBjb250ZW50O1xuXG4gICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggfHwgZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIHNwaW5uZXIuc3RvcCgpO1xuICAgICAgICAgIHdhcm5pbmdzLmZvckVhY2goKG0pID0+IGNvbnRleHQubG9nZ2VyLndhcm4obSkpO1xuICAgICAgICAgIGVycm9ycy5mb3JFYWNoKChtKSA9PiBjb250ZXh0LmxvZ2dlci5lcnJvcihtKSk7XG4gICAgICAgICAgc3Bpbm5lci5zdGFydCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShvdXRwdXRJbmRleFBhdGgsIGh0bWwpO1xuXG4gICAgICBpZiAoYnJvd3Nlck9wdGlvbnMuc2VydmljZVdvcmtlcikge1xuICAgICAgICBhd2FpdCBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXIoXG4gICAgICAgICAgcHJvamVjdFJvb3QsXG4gICAgICAgICAgcm9vdCxcbiAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgIGJhc2VIcmVmID8/ICcvJyxcbiAgICAgICAgICBicm93c2VyT3B0aW9ucy5uZ3N3Q29uZmlnUGF0aCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgcmVuZGVyV29ya2VyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIHJldHVybiBicm93c2VyUmVzdWx0O1xufVxuXG5hc3luYyBmdW5jdGlvbiBfZ2V0U2VydmVyTW9kdWxlQnVuZGxlUGF0aChcbiAgb3B0aW9uczogQnVpbGRXZWJwYWNrQXBwU2hlbGxTY2hlbWEsXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuICBzZXJ2ZXJSZXN1bHQ6IFNlcnZlckJ1aWxkZXJPdXRwdXQsXG4gIGJyb3dzZXJMb2NhbGVEaXJlY3Rvcnk6IHN0cmluZyxcbikge1xuICBpZiAob3B0aW9ucy5hcHBNb2R1bGVCdW5kbGUpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGNvbnRleHQud29ya3NwYWNlUm9vdCwgb3B0aW9ucy5hcHBNb2R1bGVCdW5kbGUpO1xuICB9XG5cbiAgY29uc3QgeyBiYXNlT3V0cHV0UGF0aCA9ICcnIH0gPSBzZXJ2ZXJSZXN1bHQ7XG4gIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oYmFzZU91dHB1dFBhdGgsIGJyb3dzZXJMb2NhbGVEaXJlY3RvcnkpO1xuXG4gIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXRQYXRoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbmQgc2VydmVyIG91dHB1dCBkaXJlY3Rvcnk6ICR7b3V0cHV0UGF0aH0uYCk7XG4gIH1cblxuICBjb25zdCByZSA9IC9ebWFpblxcLig/OlthLXpBLVowLTldezE2fVxcLik/anMkLztcbiAgY29uc3QgbWF5YmVNYWluID0gZnMucmVhZGRpclN5bmMob3V0cHV0UGF0aCkuZmluZCgoeCkgPT4gcmUudGVzdCh4KSk7XG5cbiAgaWYgKCFtYXliZU1haW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHRoZSBtYWluIGJ1bmRsZS4nKTtcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4ob3V0cHV0UGF0aCwgbWF5YmVNYWluKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX2FwcFNoZWxsQnVpbGRlcihcbiAgb3B0aW9uczogQnVpbGRXZWJwYWNrQXBwU2hlbGxTY2hlbWEsXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuKTogUHJvbWlzZTxCdWlsZGVyT3V0cHV0PiB7XG4gIGNvbnN0IGJyb3dzZXJUYXJnZXQgPSB0YXJnZXRGcm9tVGFyZ2V0U3RyaW5nKG9wdGlvbnMuYnJvd3NlclRhcmdldCk7XG4gIGNvbnN0IHNlcnZlclRhcmdldCA9IHRhcmdldEZyb21UYXJnZXRTdHJpbmcob3B0aW9ucy5zZXJ2ZXJUYXJnZXQpO1xuXG4gIC8vIE5ldmVyIHJ1biB0aGUgYnJvd3NlciB0YXJnZXQgaW4gd2F0Y2ggbW9kZS5cbiAgLy8gSWYgc2VydmljZSB3b3JrZXIgaXMgbmVlZGVkLCBpdCB3aWxsIGJlIGFkZGVkIGluIF9yZW5kZXJVbml2ZXJzYWwoKTtcbiAgY29uc3QgYnJvd3Nlck9wdGlvbnMgPSAoYXdhaXQgY29udGV4dC5nZXRUYXJnZXRPcHRpb25zKGJyb3dzZXJUYXJnZXQpKSBhcyBKc29uT2JqZWN0ICZcbiAgICBCcm93c2VyQnVpbGRlclNjaGVtYTtcblxuICBjb25zdCBvcHRpbWl6YXRpb24gPSBub3JtYWxpemVPcHRpbWl6YXRpb24oYnJvd3Nlck9wdGlvbnMub3B0aW1pemF0aW9uKTtcbiAgb3B0aW1pemF0aW9uLnN0eWxlcy5pbmxpbmVDcml0aWNhbCA9IGZhbHNlO1xuXG4gIGNvbnN0IGJyb3dzZXJUYXJnZXRSdW4gPSBhd2FpdCBjb250ZXh0LnNjaGVkdWxlVGFyZ2V0KGJyb3dzZXJUYXJnZXQsIHtcbiAgICB3YXRjaDogZmFsc2UsXG4gICAgc2VydmljZVdvcmtlcjogZmFsc2UsXG4gICAgb3B0aW1pemF0aW9uOiBvcHRpbWl6YXRpb24gYXMgdW5rbm93biBhcyBKc29uT2JqZWN0LFxuICB9KTtcbiAgY29uc3Qgc2VydmVyVGFyZ2V0UnVuID0gYXdhaXQgY29udGV4dC5zY2hlZHVsZVRhcmdldChzZXJ2ZXJUYXJnZXQsIHtcbiAgICB3YXRjaDogZmFsc2UsXG4gIH0pO1xuXG4gIGxldCBzcGlubmVyOiBTcGlubmVyIHwgdW5kZWZpbmVkO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgW2Jyb3dzZXJSZXN1bHQsIHNlcnZlclJlc3VsdF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBicm93c2VyVGFyZ2V0UnVuLnJlc3VsdCBhcyBQcm9taXNlPEJyb3dzZXJCdWlsZGVyT3V0cHV0PixcbiAgICAgIHNlcnZlclRhcmdldFJ1bi5yZXN1bHQgYXMgUHJvbWlzZTxTZXJ2ZXJCdWlsZGVyT3V0cHV0PixcbiAgICBdKTtcblxuICAgIGlmIChicm93c2VyUmVzdWx0LnN1Y2Nlc3MgPT09IGZhbHNlIHx8IGJyb3dzZXJSZXN1bHQuYmFzZU91dHB1dFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGJyb3dzZXJSZXN1bHQ7XG4gICAgfSBlbHNlIGlmIChzZXJ2ZXJSZXN1bHQuc3VjY2VzcyA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBzZXJ2ZXJSZXN1bHQ7XG4gICAgfVxuXG4gICAgc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG4gICAgc3Bpbm5lci5zdGFydCgnR2VuZXJhdGluZyBhcHBsaWNhdGlvbiBzaGVsbC4uLicpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IF9yZW5kZXJVbml2ZXJzYWwob3B0aW9ucywgY29udGV4dCwgYnJvd3NlclJlc3VsdCwgc2VydmVyUmVzdWx0LCBzcGlubmVyKTtcbiAgICBzcGlubmVyLnN1Y2NlZWQoJ0FwcGxpY2F0aW9uIHNoZWxsIGdlbmVyYXRpb24gY29tcGxldGUuJyk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBzcGlubmVyPy5mYWlsKCdBcHBsaWNhdGlvbiBzaGVsbCBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgICBhc3NlcnRJc0Vycm9yKGVycik7XG5cbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH07XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW2Jyb3dzZXJUYXJnZXRSdW4uc3RvcCgpLCBzZXJ2ZXJUYXJnZXRSdW4uc3RvcCgpXSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQnVpbGRlcihfYXBwU2hlbGxCdWlsZGVyKTtcbiJdfQ==
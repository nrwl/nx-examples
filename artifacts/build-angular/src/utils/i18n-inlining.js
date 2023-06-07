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
exports.i18nInlineEmittedFiles = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const action_executor_1 = require("./action-executor");
const copy_assets_1 = require("./copy-assets");
const error_1 = require("./error");
const spinner_1 = require("./spinner");
function emittedFilesToInlineOptions(emittedFiles, scriptsEntryPointName, emittedPath, outputPath, missingTranslation, context) {
    const options = [];
    const originalFiles = [];
    for (const emittedFile of emittedFiles) {
        if (emittedFile.asset ||
            emittedFile.extension !== '.js' ||
            (emittedFile.name && scriptsEntryPointName.includes(emittedFile.name))) {
            continue;
        }
        const originalPath = path.join(emittedPath, emittedFile.file);
        const action = {
            filename: emittedFile.file,
            code: fs.readFileSync(originalPath, 'utf8'),
            outputPath,
            missingTranslation,
            setLocale: emittedFile.name === 'main',
        };
        originalFiles.push(originalPath);
        try {
            const originalMapPath = originalPath + '.map';
            action.map = fs.readFileSync(originalMapPath, 'utf8');
            originalFiles.push(originalMapPath);
        }
        catch (err) {
            (0, error_1.assertIsError)(err);
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
        context.logger.debug(`i18n file queued for processing: ${action.filename}`);
        options.push(action);
    }
    return { options, originalFiles };
}
async function i18nInlineEmittedFiles(context, emittedFiles, i18n, baseOutputPath, outputPaths, scriptsEntryPointName, emittedPath, missingTranslation) {
    const executor = new action_executor_1.BundleActionExecutor({ i18n });
    let hasErrors = false;
    const spinner = new spinner_1.Spinner();
    spinner.start('Generating localized bundles...');
    try {
        const { options, originalFiles: processedFiles } = emittedFilesToInlineOptions(emittedFiles, scriptsEntryPointName, emittedPath, baseOutputPath, missingTranslation, context);
        for await (const result of executor.inlineAll(options)) {
            context.logger.debug(`i18n file processed: ${result.file}`);
            for (const diagnostic of result.diagnostics) {
                spinner.stop();
                if (diagnostic.type === 'error') {
                    hasErrors = true;
                    context.logger.error(diagnostic.message);
                }
                else {
                    context.logger.warn(diagnostic.message);
                }
                spinner.start();
            }
        }
        // Copy any non-processed files into the output locations
        await (0, copy_assets_1.copyAssets)([
            {
                glob: '**/*',
                input: emittedPath,
                output: '',
                ignore: [...processedFiles].map((f) => path.relative(emittedPath, f)),
            },
        ], outputPaths, '');
    }
    catch (err) {
        (0, error_1.assertIsError)(err);
        spinner.fail('Localized bundle generation failed: ' + err.message);
        return false;
    }
    finally {
        executor.stop();
    }
    if (hasErrors) {
        spinner.fail('Localized bundle generation failed.');
    }
    else {
        spinner.succeed('Localized bundle generation complete.');
    }
    return !hasErrors;
}
exports.i18nInlineEmittedFiles = i18nInlineEmittedFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi1pbmxpbmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL2kxOG4taW5saW5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLHVEQUF5RDtBQUV6RCwrQ0FBMkM7QUFDM0MsbUNBQXdDO0FBRXhDLHVDQUFvQztBQUVwQyxTQUFTLDJCQUEyQixDQUNsQyxZQUE0QixFQUM1QixxQkFBK0IsRUFDL0IsV0FBbUIsRUFDbkIsVUFBa0IsRUFDbEIsa0JBQThELEVBQzlELE9BQXVCO0lBRXZCLE1BQU0sT0FBTyxHQUFvQixFQUFFLENBQUM7SUFDcEMsTUFBTSxhQUFhLEdBQWEsRUFBRSxDQUFDO0lBQ25DLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFO1FBQ3RDLElBQ0UsV0FBVyxDQUFDLEtBQUs7WUFDakIsV0FBVyxDQUFDLFNBQVMsS0FBSyxLQUFLO1lBQy9CLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ3RFO1lBQ0EsU0FBUztTQUNWO1FBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlELE1BQU0sTUFBTSxHQUFrQjtZQUM1QixRQUFRLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDMUIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQztZQUMzQyxVQUFVO1lBQ1Ysa0JBQWtCO1lBQ2xCLFNBQVMsRUFBRSxXQUFXLENBQUMsSUFBSSxLQUFLLE1BQU07U0FDdkMs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R0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRW5FLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7WUFBUztRQUNSLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNqQjtJQUVELElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0tBQ3JEO1NBQU07UUFDTCxPQUFPLENBQUMsT0FBTyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ3BCLENBQUM7QUFyRUQsd0RBcUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBFbWl0dGVkRmlsZXMgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYnVpbGQtd2VicGFjayc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQnVuZGxlQWN0aW9uRXhlY3V0b3IgfSBmcm9tICcuL2FjdGlvbi1leGVjdXRvcic7XG5pbXBvcnQgeyBJbmxpbmVPcHRpb25zIH0gZnJvbSAnLi9idW5kbGUtaW5saW5lLW9wdGlvbnMnO1xuaW1wb3J0IHsgY29weUFzc2V0cyB9IGZyb20gJy4vY29weS1hc3NldHMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgSTE4bk9wdGlvbnMgfSBmcm9tICcuL2kxOG4tb3B0aW9ucyc7XG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi9zcGlubmVyJztcblxuZnVuY3Rpb24gZW1pdHRlZEZpbGVzVG9JbmxpbmVPcHRpb25zKFxuICBlbWl0dGVkRmlsZXM6IEVtaXR0ZWRGaWxlc1tdLFxuICBzY3JpcHRzRW50cnlQb2ludE5hbWU6IHN0cmluZ1tdLFxuICBlbWl0dGVkUGF0aDogc3RyaW5nLFxuICBvdXRwdXRQYXRoOiBzdHJpbmcsXG4gIG1pc3NpbmdUcmFuc2xhdGlvbjogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdpZ25vcmUnIHwgdW5kZWZpbmVkLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbik6IHsgb3B0aW9uczogSW5saW5lT3B0aW9uc1tdOyBvcmlnaW5hbEZpbGVzOiBzdHJpbmdbXSB9IHtcbiAgY29uc3Qgb3B0aW9uczogSW5saW5lT3B0aW9uc1tdID0gW107XG4gIGNvbnN0IG9yaWdpbmFsRmlsZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgZW1pdHRlZEZpbGUgb2YgZW1pdHRlZEZpbGVzKSB7XG4gICAgaWYgKFxuICAgICAgZW1pdHRlZEZpbGUuYXNzZXQgfHxcbiAgICAgIGVtaXR0ZWRGaWxlLmV4dGVuc2lvbiAhPT0gJy5qcycgfHxcbiAgICAgIChlbWl0dGVkRmlsZS5uYW1lICYmIHNjcmlwdHNFbnRyeVBvaW50TmFtZS5pbmNsdWRlcyhlbWl0dGVkRmlsZS5uYW1lKSlcbiAgICApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IG9yaWdpbmFsUGF0aCA9IHBhdGguam9pbihlbWl0dGVkUGF0aCwgZW1pdHRlZEZpbGUuZmlsZSk7XG4gICAgY29uc3QgYWN0aW9uOiBJbmxpbmVPcHRpb25zID0ge1xuICAgICAgZmlsZW5hbWU6IGVtaXR0ZWRGaWxlLmZpbGUsXG4gICAgICBjb2RlOiBmcy5yZWFkRmlsZVN5bmMob3JpZ2luYWxQYXRoLCAndXRmOCcpLFxuICAgICAgb3V0cHV0UGF0aCxcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvbixcbiAgICAgIHNldExvY2FsZTogZW1pdHRlZEZpbGUubmFtZSA9PT0gJ21haW4nLFxuICAgIH07XG4gICAgb3JpZ2luYWxGaWxlcy5wdXNoKG9yaWdpbmFsUGF0aCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3JpZ2luYWxNYXBQYXRoID0gb3JpZ2luYWxQYXRoICsgJy5tYXAnO1xuICAgICAgYWN0aW9uLm1hcCA9IGZzLnJlYWRGaWxlU3luYyhvcmlnaW5hbE1hcFBhdGgsICd1dGY4Jyk7XG4gICAgICBvcmlnaW5hbEZpbGVzLnB1c2gob3JpZ2luYWxNYXBQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGFzc2VydElzRXJyb3IoZXJyKTtcbiAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnRleHQubG9nZ2VyLmRlYnVnKGBpMThuIGZpbGUgcXVldWVkIGZvciBwcm9jZXNzaW5nOiAke2FjdGlvbi5maWxlbmFtZX1gKTtcblxuICAgIG9wdGlvbnMucHVzaChhY3Rpb24pO1xuICB9XG5cbiAgcmV0dXJuIHsgb3B0aW9ucywgb3JpZ2luYWxGaWxlcyB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaTE4bklubGluZUVtaXR0ZWRGaWxlcyhcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIGVtaXR0ZWRGaWxlczogRW1pdHRlZEZpbGVzW10sXG4gIGkxOG46IEkxOG5PcHRpb25zLFxuICBiYXNlT3V0cHV0UGF0aDogc3RyaW5nLFxuICBvdXRwdXRQYXRoczogc3RyaW5nW10sXG4gIHNjcmlwdHNFbnRyeVBvaW50TmFtZTogc3RyaW5nW10sXG4gIGVtaXR0ZWRQYXRoOiBzdHJpbmcsXG4gIG1pc3NpbmdUcmFuc2xhdGlvbjogJ2Vycm9yJyB8ICd3YXJuaW5nJyB8ICdpZ25vcmUnIHwgdW5kZWZpbmVkLFxuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IGV4ZWN1dG9yID0gbmV3IEJ1bmRsZUFjdGlvbkV4ZWN1dG9yKHsgaTE4biB9KTtcbiAgbGV0IGhhc0Vycm9ycyA9IGZhbHNlO1xuICBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcbiAgc3Bpbm5lci5zdGFydCgnR2VuZXJhdGluZyBsb2NhbGl6ZWQgYnVuZGxlcy4uLicpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgeyBvcHRpb25zLCBvcmlnaW5hbEZpbGVzOiBwcm9jZXNzZWRGaWxlcyB9ID0gZW1pdHRlZEZpbGVzVG9JbmxpbmVPcHRpb25zKFxuICAgICAgZW1pdHRlZEZpbGVzLFxuICAgICAgc2NyaXB0c0VudHJ5UG9pbnROYW1lLFxuICAgICAgZW1pdHRlZFBhdGgsXG4gICAgICBiYXNlT3V0cHV0UGF0aCxcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvbixcbiAgICAgIGNvbnRleHQsXG4gICAgKTtcblxuICAgIGZvciBhd2FpdCAoY29uc3QgcmVzdWx0IG9mIGV4ZWN1dG9yLmlubGluZUFsbChvcHRpb25zKSkge1xuICAgICAgY29udGV4dC5sb2dnZXIuZGVidWcoYGkxOG4gZmlsZSBwcm9jZXNzZWQ6ICR7cmVzdWx0LmZpbGV9YCk7XG5cbiAgICAgIGZvciAoY29uc3QgZGlhZ25vc3RpYyBvZiByZXN1bHQuZGlhZ25vc3RpY3MpIHtcbiAgICAgICAgc3Bpbm5lci5zdG9wKCk7XG4gICAgICAgIGlmIChkaWFnbm9zdGljLnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICBoYXNFcnJvcnMgPSB0cnVlO1xuICAgICAgICAgIGNvbnRleHQubG9nZ2VyLmVycm9yKGRpYWdub3N0aWMubWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29udGV4dC5sb2dnZXIud2FybihkaWFnbm9zdGljLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHNwaW5uZXIuc3RhcnQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb3B5IGFueSBub24tcHJvY2Vzc2VkIGZpbGVzIGludG8gdGhlIG91dHB1dCBsb2NhdGlvbnNcbiAgICBhd2FpdCBjb3B5QXNzZXRzKFxuICAgICAgW1xuICAgICAgICB7XG4gICAgICAgICAgZ2xvYjogJyoqLyonLFxuICAgICAgICAgIGlucHV0OiBlbWl0dGVkUGF0aCxcbiAgICAgICAgICBvdXRwdXQ6ICcnLFxuICAgICAgICAgIGlnbm9yZTogWy4uLnByb2Nlc3NlZEZpbGVzXS5tYXAoKGYpID0+IHBhdGgucmVsYXRpdmUoZW1pdHRlZFBhdGgsIGYpKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBvdXRwdXRQYXRocyxcbiAgICAgICcnLFxuICAgICk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFzc2VydElzRXJyb3IoZXJyKTtcbiAgICBzcGlubmVyLmZhaWwoJ0xvY2FsaXplZCBidW5kbGUgZ2VuZXJhdGlvbiBmYWlsZWQ6ICcgKyBlcnIubWVzc2FnZSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZmluYWxseSB7XG4gICAgZXhlY3V0b3Iuc3RvcCgpO1xuICB9XG5cbiAgaWYgKGhhc0Vycm9ycykge1xuICAgIHNwaW5uZXIuZmFpbCgnTG9jYWxpemVkIGJ1bmRsZSBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgfSBlbHNlIHtcbiAgICBzcGlubmVyLnN1Y2NlZWQoJ0xvY2FsaXplZCBidW5kbGUgZ2VuZXJhdGlvbiBjb21wbGV0ZS4nKTtcbiAgfVxuXG4gIHJldHVybiAhaGFzRXJyb3JzO1xufVxuIl19
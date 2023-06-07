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
exports.execute = void 0;
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const webpack_1 = __importDefault(require("webpack"));
const i18n_options_1 = require("../../utils/i18n-options");
const load_esm_1 = require("../../utils/load-esm");
const purge_cache_1 = require("../../utils/purge-cache");
const version_1 = require("../../utils/version");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const configs_1 = require("../../webpack/configs");
const stats_1 = require("../../webpack/utils/stats");
const schema_1 = require("../browser/schema");
const schema_2 = require("./schema");
function getI18nOutfile(format) {
    switch (format) {
        case 'xmb':
            return 'messages.xmb';
        case 'xlf':
        case 'xlif':
        case 'xliff':
        case 'xlf2':
        case 'xliff2':
            return 'messages.xlf';
        case 'json':
        case 'legacy-migrate':
            return 'messages.json';
        case 'arb':
            return 'messages.arb';
        default:
            throw new Error(`Unsupported format "${format}"`);
    }
}
async function getSerializer(localizeToolsModule, format, sourceLocale, basePath, useLegacyIds, diagnostics) {
    const { XmbTranslationSerializer, LegacyMessageIdMigrationSerializer, ArbTranslationSerializer, Xliff1TranslationSerializer, Xliff2TranslationSerializer, SimpleJsonTranslationSerializer, } = localizeToolsModule;
    switch (format) {
        case schema_2.Format.Xmb:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new XmbTranslationSerializer(basePath, useLegacyIds);
        case schema_2.Format.Xlf:
        case schema_2.Format.Xlif:
        case schema_2.Format.Xliff:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Xliff1TranslationSerializer(sourceLocale, basePath, useLegacyIds, {});
        case schema_2.Format.Xlf2:
        case schema_2.Format.Xliff2:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Xliff2TranslationSerializer(sourceLocale, basePath, useLegacyIds, {});
        case schema_2.Format.Json:
            return new SimpleJsonTranslationSerializer(sourceLocale);
        case schema_2.Format.LegacyMigrate:
            return new LegacyMessageIdMigrationSerializer(diagnostics);
        case schema_2.Format.Arb:
            const fileSystem = {
                relative(from, to) {
                    return path.relative(from, to);
                },
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new ArbTranslationSerializer(sourceLocale, basePath, fileSystem);
    }
}
function normalizeFormatOption(options) {
    let format = options.format;
    switch (format) {
        case schema_2.Format.Xlf:
        case schema_2.Format.Xlif:
        case schema_2.Format.Xliff:
            format = schema_2.Format.Xlf;
            break;
        case schema_2.Format.Xlf2:
        case schema_2.Format.Xliff2:
            format = schema_2.Format.Xlf2;
            break;
    }
    // Default format is xliff1
    return format ?? schema_2.Format.Xlf;
}
class NoEmitPlugin {
    apply(compiler) {
        compiler.hooks.shouldEmit.tap('angular-no-emit', () => false);
    }
}
/**
 * @experimental Direct usage of this function is considered experimental.
 */
async function execute(options, context, transforms) {
    // Check Angular version.
    (0, version_1.assertCompatibleAngularVersion)(context.workspaceRoot);
    // Purge old build disk cache.
    await (0, purge_cache_1.purgeStaleBuildCache)(context);
    const browserTarget = (0, architect_1.targetFromTargetString)(options.browserTarget);
    const browserOptions = await context.validateOptions(await context.getTargetOptions(browserTarget), await context.getBuilderNameForTarget(browserTarget));
    const format = normalizeFormatOption(options);
    // We need to determine the outFile name so that AngularCompiler can retrieve it.
    let outFile = options.outFile || getI18nOutfile(format);
    if (options.outputPath) {
        // AngularCompilerPlugin doesn't support genDir so we have to adjust outFile instead.
        outFile = path.join(options.outputPath, outFile);
    }
    outFile = path.resolve(context.workspaceRoot, outFile);
    if (!context.target || !context.target.project) {
        throw new Error('The builder requires a target.');
    }
    try {
        require.resolve('@angular/localize');
    }
    catch {
        return {
            success: false,
            error: `i18n extraction requires the '@angular/localize' package.`,
            outputPath: outFile,
        };
    }
    const metadata = await context.getProjectMetadata(context.target);
    const i18n = (0, i18n_options_1.createI18nOptions)(metadata);
    let useLegacyIds = true;
    const ivyMessages = [];
    const builderOptions = {
        ...browserOptions,
        optimization: false,
        sourceMap: {
            scripts: true,
            styles: false,
            vendor: true,
        },
        buildOptimizer: false,
        aot: true,
        progress: options.progress,
        budgets: [],
        assets: [],
        scripts: [],
        styles: [],
        deleteOutputPath: false,
        extractLicenses: false,
        subresourceIntegrity: false,
        outputHashing: schema_1.OutputHashing.None,
        namedChunks: true,
        allowedCommonJsDependencies: undefined,
    };
    const { config, projectRoot } = await (0, webpack_browser_config_1.generateBrowserWebpackConfigFromContext)(builderOptions, context, (wco) => {
        // Default value for legacy message ids is currently true
        useLegacyIds = wco.tsConfig.options.enableI18nLegacyMessageIdFormat ?? true;
        const partials = [
            { plugins: [new NoEmitPlugin()] },
            (0, configs_1.getCommonConfig)(wco),
        ];
        // Add Ivy application file extractor support
        partials.unshift({
            module: {
                rules: [
                    {
                        test: /\.[cm]?[tj]sx?$/,
                        loader: require.resolve('./ivy-extract-loader'),
                        options: {
                            messageHandler: (messages) => ivyMessages.push(...messages),
                        },
                    },
                ],
            },
        });
        // Replace all stylesheets with empty content
        partials.push({
            module: {
                rules: [
                    {
                        test: /\.(css|scss|sass|less)$/,
                        loader: require.resolve('./empty-loader'),
                    },
                ],
            },
        });
        return partials;
    }, 
    // During extraction we don't need specific browser support.
    { supportedBrowsers: undefined });
    // All the localize usages are setup to first try the ESM entry point then fallback to the deep imports.
    // This provides interim compatibility while the framework is transitioned to bundled ESM packages.
    const localizeToolsModule = await (0, load_esm_1.loadEsmModule)('@angular/localize/tools');
    const webpackResult = await (0, rxjs_1.lastValueFrom)((0, build_webpack_1.runWebpack)((await transforms?.webpackConfiguration?.(config)) || config, context, {
        logging: (0, stats_1.createWebpackLoggingCallback)(builderOptions, context.logger),
        webpackFactory: webpack_1.default,
    }));
    // Set the outputPath to the extraction output location for downstream consumers
    webpackResult.outputPath = outFile;
    // Complete if Webpack build failed
    if (!webpackResult.success) {
        return webpackResult;
    }
    const basePath = config.context || projectRoot;
    const { checkDuplicateMessages } = localizeToolsModule;
    // The filesystem is used to create a relative path for each file
    // from the basePath.  This relative path is then used in the error message.
    const checkFileSystem = {
        relative(from, to) {
            return path.relative(from, to);
        },
    };
    const diagnostics = checkDuplicateMessages(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkFileSystem, ivyMessages, 'warning', 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    basePath);
    if (diagnostics.messages.length > 0) {
        context.logger.warn(diagnostics.formatDiagnostics(''));
    }
    // Serialize all extracted messages
    const serializer = await getSerializer(localizeToolsModule, format, i18n.sourceLocale, basePath, useLegacyIds, diagnostics);
    const content = serializer.serialize(ivyMessages);
    // Ensure directory exists
    const outputPath = path.dirname(outFile);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    // Write translation file
    fs.writeFileSync(outFile, content);
    return webpackResult;
}
exports.execute = execute;
exports.default = (0, architect_1.createBuilder)(execute);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9leHRyYWN0LWkxOG4vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCx5REFBa0c7QUFDbEcsaUVBQXdFO0FBRXhFLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsK0JBQXFDO0FBQ3JDLHNEQUFpRDtBQUVqRCwyREFBNkQ7QUFDN0QsbURBQXFEO0FBQ3JELHlEQUErRDtBQUMvRCxpREFBcUU7QUFDckUsK0VBQTZGO0FBQzdGLG1EQUF3RDtBQUN4RCxxREFBeUU7QUFDekUsOENBQW1GO0FBQ25GLHFDQUEwQztBQUkxQyxTQUFTLGNBQWMsQ0FBQyxNQUEwQjtJQUNoRCxRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssS0FBSztZQUNSLE9BQU8sY0FBYyxDQUFDO1FBQ3hCLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLE9BQU8sQ0FBQztRQUNiLEtBQUssTUFBTSxDQUFDO1FBQ1osS0FBSyxRQUFRO1lBQ1gsT0FBTyxjQUFjLENBQUM7UUFDeEIsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLGdCQUFnQjtZQUNuQixPQUFPLGVBQWUsQ0FBQztRQUN6QixLQUFLLEtBQUs7WUFDUixPQUFPLGNBQWMsQ0FBQztRQUN4QjtZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLE1BQU0sR0FBRyxDQUFDLENBQUM7S0FDckQ7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWEsQ0FDMUIsbUJBQTZELEVBQzdELE1BQWMsRUFDZCxZQUFvQixFQUNwQixRQUFnQixFQUNoQixZQUFxQixFQUNyQixXQUF3QjtJQUV4QixNQUFNLEVBQ0osd0JBQXdCLEVBQ3hCLGtDQUFrQyxFQUNsQyx3QkFBd0IsRUFDeEIsMkJBQTJCLEVBQzNCLDJCQUEyQixFQUMzQiwrQkFBK0IsR0FDaEMsR0FBRyxtQkFBbUIsQ0FBQztJQUV4QixRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssZUFBTSxDQUFDLEdBQUc7WUFDYiw4REFBOEQ7WUFDOUQsT0FBTyxJQUFJLHdCQUF3QixDQUFDLFFBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNyRSxLQUFLLGVBQU0sQ0FBQyxHQUFHLENBQUM7UUFDaEIsS0FBSyxlQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2pCLEtBQUssZUFBTSxDQUFDLEtBQUs7WUFDZiw4REFBOEQ7WUFDOUQsT0FBTyxJQUFJLDJCQUEyQixDQUFDLFlBQVksRUFBRSxRQUFlLEVBQUUsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFGLEtBQUssZUFBTSxDQUFDLElBQUksQ0FBQztRQUNqQixLQUFLLGVBQU0sQ0FBQyxNQUFNO1lBQ2hCLDhEQUE4RDtZQUM5RCxPQUFPLElBQUksMkJBQTJCLENBQUMsWUFBWSxFQUFFLFFBQWUsRUFBRSxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUYsS0FBSyxlQUFNLENBQUMsSUFBSTtZQUNkLE9BQU8sSUFBSSwrQkFBK0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRCxLQUFLLGVBQU0sQ0FBQyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxrQ0FBa0MsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3RCxLQUFLLGVBQU0sQ0FBQyxHQUFHO1lBQ2IsTUFBTSxVQUFVLEdBQUc7Z0JBQ2pCLFFBQVEsQ0FBQyxJQUFZLEVBQUUsRUFBVTtvQkFDL0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsQ0FBQzthQUNGLENBQUM7WUFFRiw4REFBOEQ7WUFDOUQsT0FBTyxJQUFJLHdCQUF3QixDQUFDLFlBQVksRUFBRSxRQUFlLEVBQUUsVUFBaUIsQ0FBQyxDQUFDO0tBQ3pGO0FBQ0gsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsT0FBa0M7SUFDL0QsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUU1QixRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssZUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNoQixLQUFLLGVBQU0sQ0FBQyxJQUFJLENBQUM7UUFDakIsS0FBSyxlQUFNLENBQUMsS0FBSztZQUNmLE1BQU0sR0FBRyxlQUFNLENBQUMsR0FBRyxDQUFDO1lBQ3BCLE1BQU07UUFDUixLQUFLLGVBQU0sQ0FBQyxJQUFJLENBQUM7UUFDakIsS0FBSyxlQUFNLENBQUMsTUFBTTtZQUNoQixNQUFNLEdBQUcsZUFBTSxDQUFDLElBQUksQ0FBQztZQUNyQixNQUFNO0tBQ1Q7SUFFRCwyQkFBMkI7SUFDM0IsT0FBTyxNQUFNLElBQUksZUFBTSxDQUFDLEdBQUcsQ0FBQztBQUM5QixDQUFDO0FBRUQsTUFBTSxZQUFZO0lBQ2hCLEtBQUssQ0FBQyxRQUEwQjtRQUM5QixRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEUsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUMzQixPQUFrQyxFQUNsQyxPQUF1QixFQUN2QixVQUVDO0lBRUQseUJBQXlCO0lBQ3pCLElBQUEsd0NBQThCLEVBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXRELDhCQUE4QjtJQUM5QixNQUFNLElBQUEsa0NBQW9CLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFFcEMsTUFBTSxhQUFhLEdBQUcsSUFBQSxrQ0FBc0IsRUFBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDcEUsTUFBTSxjQUFjLEdBQUcsTUFBTSxPQUFPLENBQUMsZUFBZSxDQUNsRCxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsRUFDN0MsTUFBTSxPQUFPLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQ3JELENBQUM7SUFFRixNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU5QyxpRkFBaUY7SUFDakYsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEQsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO1FBQ3RCLHFGQUFxRjtRQUNyRixPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQzlDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztLQUNuRDtJQUVELElBQUk7UUFDRixPQUFPLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7S0FDdEM7SUFBQyxNQUFNO1FBQ04sT0FBTztZQUNMLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLDJEQUEyRDtZQUNsRSxVQUFVLEVBQUUsT0FBTztTQUNwQixDQUFDO0tBQ0g7SUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEUsTUFBTSxJQUFJLEdBQUcsSUFBQSxnQ0FBaUIsRUFBQyxRQUFRLENBQUMsQ0FBQztJQUV6QyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7SUFFeEIsTUFBTSxXQUFXLEdBQXNCLEVBQUUsQ0FBQztJQUMxQyxNQUFNLGNBQWMsR0FBRztRQUNyQixHQUFHLGNBQWM7UUFDakIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsU0FBUyxFQUFFO1lBQ1QsT0FBTyxFQUFFLElBQUk7WUFDYixNQUFNLEVBQUUsS0FBSztZQUNiLE1BQU0sRUFBRSxJQUFJO1NBQ2I7UUFDRCxjQUFjLEVBQUUsS0FBSztRQUNyQixHQUFHLEVBQUUsSUFBSTtRQUNULFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtRQUMxQixPQUFPLEVBQUUsRUFBRTtRQUNYLE1BQU0sRUFBRSxFQUFFO1FBQ1YsT0FBTyxFQUFFLEVBQUU7UUFDWCxNQUFNLEVBQUUsRUFBRTtRQUNWLGdCQUFnQixFQUFFLEtBQUs7UUFDdkIsZUFBZSxFQUFFLEtBQUs7UUFDdEIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixhQUFhLEVBQUUsc0JBQWEsQ0FBQyxJQUFJO1FBQ2pDLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLDJCQUEyQixFQUFFLFNBQVM7S0FDdkMsQ0FBQztJQUNGLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsTUFBTSxJQUFBLGdFQUF1QyxFQUMzRSxjQUFjLEVBQ2QsT0FBTyxFQUNQLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDTix5REFBeUQ7UUFDekQsWUFBWSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLCtCQUErQixJQUFJLElBQUksQ0FBQztRQUU1RSxNQUFNLFFBQVEsR0FBK0M7WUFDM0QsRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLFlBQVksRUFBRSxDQUFDLEVBQUU7WUFDakMsSUFBQSx5QkFBZSxFQUFDLEdBQUcsQ0FBQztTQUNyQixDQUFDO1FBRUYsNkNBQTZDO1FBQzdDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDZixNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFO29CQUNMO3dCQUNFLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO3dCQUMvQyxPQUFPLEVBQUU7NEJBQ1AsY0FBYyxFQUFFLENBQUMsUUFBMkIsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQzt5QkFDL0U7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ1osTUFBTSxFQUFFO2dCQUNOLEtBQUssRUFBRTtvQkFDTDt3QkFDRSxJQUFJLEVBQUUseUJBQXlCO3dCQUMvQixNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztxQkFDMUM7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFDRCw0REFBNEQ7SUFDNUQsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsQ0FDakMsQ0FBQztJQUVGLHdHQUF3RztJQUN4RyxtR0FBbUc7SUFDbkcsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLElBQUEsd0JBQWEsRUFDN0MseUJBQXlCLENBQzFCLENBQUM7SUFDRixNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsb0JBQWEsRUFDdkMsSUFBQSwwQkFBVSxFQUFDLENBQUMsTUFBTSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLE1BQU0sRUFBRSxPQUFPLEVBQUU7UUFDaEYsT0FBTyxFQUFFLElBQUEsb0NBQTRCLEVBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDckUsY0FBYyxFQUFFLGlCQUFPO0tBQ3hCLENBQUMsQ0FDSCxDQUFDO0lBRUYsZ0ZBQWdGO0lBQ2hGLGFBQWEsQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO0lBRW5DLG1DQUFtQztJQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRTtRQUMxQixPQUFPLGFBQWEsQ0FBQztLQUN0QjtJQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLElBQUksV0FBVyxDQUFDO0lBRS9DLE1BQU0sRUFBRSxzQkFBc0IsRUFBRSxHQUFHLG1CQUFtQixDQUFDO0lBRXZELGlFQUFpRTtJQUNqRSw0RUFBNEU7SUFDNUUsTUFBTSxlQUFlLEdBQUc7UUFDdEIsUUFBUSxDQUFDLElBQVksRUFBRSxFQUFVO1lBQy9CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDakMsQ0FBQztLQUNGLENBQUM7SUFDRixNQUFNLFdBQVcsR0FBRyxzQkFBc0I7SUFDeEMsOERBQThEO0lBQzlELGVBQXNCLEVBQ3RCLFdBQVcsRUFDWCxTQUFTO0lBQ1QsOERBQThEO0lBQzlELFFBQWUsQ0FDaEIsQ0FBQztJQUNGLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3hEO0lBRUQsbUNBQW1DO0lBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sYUFBYSxDQUNwQyxtQkFBbUIsRUFDbkIsTUFBTSxFQUNOLElBQUksQ0FBQyxZQUFZLEVBQ2pCLFFBQVEsRUFDUixZQUFZLEVBQ1osV0FBVyxDQUNaLENBQUM7SUFDRixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRWxELDBCQUEwQjtJQUMxQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDL0M7SUFFRCx5QkFBeUI7SUFDekIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFbkMsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQXBMRCwwQkFvTEM7QUFFRCxrQkFBZSxJQUFBLHlCQUFhLEVBQTRCLE9BQU8sQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgybVQYXJzZWRNZXNzYWdlIGFzIExvY2FsaXplTWVzc2FnZSB9IGZyb20gJ0Bhbmd1bGFyL2xvY2FsaXplJztcbmltcG9ydCB0eXBlIHsgRGlhZ25vc3RpY3MgfSBmcm9tICdAYW5ndWxhci9sb2NhbGl6ZS90b29scyc7XG5pbXBvcnQgeyBCdWlsZGVyQ29udGV4dCwgY3JlYXRlQnVpbGRlciwgdGFyZ2V0RnJvbVRhcmdldFN0cmluZyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgQnVpbGRSZXN1bHQsIHJ1bldlYnBhY2sgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYnVpbGQtd2VicGFjayc7XG5pbXBvcnQgeyBKc29uT2JqZWN0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGxhc3RWYWx1ZUZyb20gfSBmcm9tICdyeGpzJztcbmltcG9ydCB3ZWJwYWNrLCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEV4ZWN1dGlvblRyYW5zZm9ybWVyIH0gZnJvbSAnLi4vLi4vdHJhbnNmb3Jtcyc7XG5pbXBvcnQgeyBjcmVhdGVJMThuT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL2kxOG4tb3B0aW9ucyc7XG5pbXBvcnQgeyBsb2FkRXNtTW9kdWxlIH0gZnJvbSAnLi4vLi4vdXRpbHMvbG9hZC1lc20nO1xuaW1wb3J0IHsgcHVyZ2VTdGFsZUJ1aWxkQ2FjaGUgfSBmcm9tICcuLi8uLi91dGlscy9wdXJnZS1jYWNoZSc7XG5pbXBvcnQgeyBhc3NlcnRDb21wYXRpYmxlQW5ndWxhclZlcnNpb24gfSBmcm9tICcuLi8uLi91dGlscy92ZXJzaW9uJztcbmltcG9ydCB7IGdlbmVyYXRlQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dCB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stYnJvd3Nlci1jb25maWcnO1xuaW1wb3J0IHsgZ2V0Q29tbW9uQ29uZmlnIH0gZnJvbSAnLi4vLi4vd2VicGFjay9jb25maWdzJztcbmltcG9ydCB7IGNyZWF0ZVdlYnBhY2tMb2dnaW5nQ2FsbGJhY2sgfSBmcm9tICcuLi8uLi93ZWJwYWNrL3V0aWxzL3N0YXRzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBCcm93c2VyQnVpbGRlck9wdGlvbnMsIE91dHB1dEhhc2hpbmcgfSBmcm9tICcuLi9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBGb3JtYXQsIFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IHR5cGUgRXh0cmFjdEkxOG5CdWlsZGVyT3B0aW9ucyA9IFNjaGVtYTtcblxuZnVuY3Rpb24gZ2V0STE4bk91dGZpbGUoZm9ybWF0OiBzdHJpbmcgfCB1bmRlZmluZWQpIHtcbiAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICBjYXNlICd4bWInOlxuICAgICAgcmV0dXJuICdtZXNzYWdlcy54bWInO1xuICAgIGNhc2UgJ3hsZic6XG4gICAgY2FzZSAneGxpZic6XG4gICAgY2FzZSAneGxpZmYnOlxuICAgIGNhc2UgJ3hsZjInOlxuICAgIGNhc2UgJ3hsaWZmMic6XG4gICAgICByZXR1cm4gJ21lc3NhZ2VzLnhsZic7XG4gICAgY2FzZSAnanNvbic6XG4gICAgY2FzZSAnbGVnYWN5LW1pZ3JhdGUnOlxuICAgICAgcmV0dXJuICdtZXNzYWdlcy5qc29uJztcbiAgICBjYXNlICdhcmInOlxuICAgICAgcmV0dXJuICdtZXNzYWdlcy5hcmInO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGZvcm1hdCBcIiR7Zm9ybWF0fVwiYCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0U2VyaWFsaXplcihcbiAgbG9jYWxpemVUb29sc01vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHMnKSxcbiAgZm9ybWF0OiBGb3JtYXQsXG4gIHNvdXJjZUxvY2FsZTogc3RyaW5nLFxuICBiYXNlUGF0aDogc3RyaW5nLFxuICB1c2VMZWdhY3lJZHM6IGJvb2xlYW4sXG4gIGRpYWdub3N0aWNzOiBEaWFnbm9zdGljcyxcbikge1xuICBjb25zdCB7XG4gICAgWG1iVHJhbnNsYXRpb25TZXJpYWxpemVyLFxuICAgIExlZ2FjeU1lc3NhZ2VJZE1pZ3JhdGlvblNlcmlhbGl6ZXIsXG4gICAgQXJiVHJhbnNsYXRpb25TZXJpYWxpemVyLFxuICAgIFhsaWZmMVRyYW5zbGF0aW9uU2VyaWFsaXplcixcbiAgICBYbGlmZjJUcmFuc2xhdGlvblNlcmlhbGl6ZXIsXG4gICAgU2ltcGxlSnNvblRyYW5zbGF0aW9uU2VyaWFsaXplcixcbiAgfSA9IGxvY2FsaXplVG9vbHNNb2R1bGU7XG5cbiAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICBjYXNlIEZvcm1hdC5YbWI6XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgcmV0dXJuIG5ldyBYbWJUcmFuc2xhdGlvblNlcmlhbGl6ZXIoYmFzZVBhdGggYXMgYW55LCB1c2VMZWdhY3lJZHMpO1xuICAgIGNhc2UgRm9ybWF0LlhsZjpcbiAgICBjYXNlIEZvcm1hdC5YbGlmOlxuICAgIGNhc2UgRm9ybWF0LlhsaWZmOlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHJldHVybiBuZXcgWGxpZmYxVHJhbnNsYXRpb25TZXJpYWxpemVyKHNvdXJjZUxvY2FsZSwgYmFzZVBhdGggYXMgYW55LCB1c2VMZWdhY3lJZHMsIHt9KTtcbiAgICBjYXNlIEZvcm1hdC5YbGYyOlxuICAgIGNhc2UgRm9ybWF0LlhsaWZmMjpcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICByZXR1cm4gbmV3IFhsaWZmMlRyYW5zbGF0aW9uU2VyaWFsaXplcihzb3VyY2VMb2NhbGUsIGJhc2VQYXRoIGFzIGFueSwgdXNlTGVnYWN5SWRzLCB7fSk7XG4gICAgY2FzZSBGb3JtYXQuSnNvbjpcbiAgICAgIHJldHVybiBuZXcgU2ltcGxlSnNvblRyYW5zbGF0aW9uU2VyaWFsaXplcihzb3VyY2VMb2NhbGUpO1xuICAgIGNhc2UgRm9ybWF0LkxlZ2FjeU1pZ3JhdGU6XG4gICAgICByZXR1cm4gbmV3IExlZ2FjeU1lc3NhZ2VJZE1pZ3JhdGlvblNlcmlhbGl6ZXIoZGlhZ25vc3RpY3MpO1xuICAgIGNhc2UgRm9ybWF0LkFyYjpcbiAgICAgIGNvbnN0IGZpbGVTeXN0ZW0gPSB7XG4gICAgICAgIHJlbGF0aXZlKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgcmV0dXJuIHBhdGgucmVsYXRpdmUoZnJvbSwgdG8pO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHJldHVybiBuZXcgQXJiVHJhbnNsYXRpb25TZXJpYWxpemVyKHNvdXJjZUxvY2FsZSwgYmFzZVBhdGggYXMgYW55LCBmaWxlU3lzdGVtIGFzIGFueSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRm9ybWF0T3B0aW9uKG9wdGlvbnM6IEV4dHJhY3RJMThuQnVpbGRlck9wdGlvbnMpOiBGb3JtYXQge1xuICBsZXQgZm9ybWF0ID0gb3B0aW9ucy5mb3JtYXQ7XG5cbiAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICBjYXNlIEZvcm1hdC5YbGY6XG4gICAgY2FzZSBGb3JtYXQuWGxpZjpcbiAgICBjYXNlIEZvcm1hdC5YbGlmZjpcbiAgICAgIGZvcm1hdCA9IEZvcm1hdC5YbGY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIEZvcm1hdC5YbGYyOlxuICAgIGNhc2UgRm9ybWF0LlhsaWZmMjpcbiAgICAgIGZvcm1hdCA9IEZvcm1hdC5YbGYyO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICAvLyBEZWZhdWx0IGZvcm1hdCBpcyB4bGlmZjFcbiAgcmV0dXJuIGZvcm1hdCA/PyBGb3JtYXQuWGxmO1xufVxuXG5jbGFzcyBOb0VtaXRQbHVnaW4ge1xuICBhcHBseShjb21waWxlcjogd2VicGFjay5Db21waWxlcik6IHZvaWQge1xuICAgIGNvbXBpbGVyLmhvb2tzLnNob3VsZEVtaXQudGFwKCdhbmd1bGFyLW5vLWVtaXQnLCAoKSA9PiBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsIERpcmVjdCB1c2FnZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZShcbiAgb3B0aW9uczogRXh0cmFjdEkxOG5CdWlsZGVyT3B0aW9ucyxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHRyYW5zZm9ybXM/OiB7XG4gICAgd2VicGFja0NvbmZpZ3VyYXRpb24/OiBFeGVjdXRpb25UcmFuc2Zvcm1lcjx3ZWJwYWNrLkNvbmZpZ3VyYXRpb24+O1xuICB9LFxuKTogUHJvbWlzZTxCdWlsZFJlc3VsdD4ge1xuICAvLyBDaGVjayBBbmd1bGFyIHZlcnNpb24uXG4gIGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbihjb250ZXh0LndvcmtzcGFjZVJvb3QpO1xuXG4gIC8vIFB1cmdlIG9sZCBidWlsZCBkaXNrIGNhY2hlLlxuICBhd2FpdCBwdXJnZVN0YWxlQnVpbGRDYWNoZShjb250ZXh0KTtcblxuICBjb25zdCBicm93c2VyVGFyZ2V0ID0gdGFyZ2V0RnJvbVRhcmdldFN0cmluZyhvcHRpb25zLmJyb3dzZXJUYXJnZXQpO1xuICBjb25zdCBicm93c2VyT3B0aW9ucyA9IGF3YWl0IGNvbnRleHQudmFsaWRhdGVPcHRpb25zPEpzb25PYmplY3QgJiBCcm93c2VyQnVpbGRlck9wdGlvbnM+KFxuICAgIGF3YWl0IGNvbnRleHQuZ2V0VGFyZ2V0T3B0aW9ucyhicm93c2VyVGFyZ2V0KSxcbiAgICBhd2FpdCBjb250ZXh0LmdldEJ1aWxkZXJOYW1lRm9yVGFyZ2V0KGJyb3dzZXJUYXJnZXQpLFxuICApO1xuXG4gIGNvbnN0IGZvcm1hdCA9IG5vcm1hbGl6ZUZvcm1hdE9wdGlvbihvcHRpb25zKTtcblxuICAvLyBXZSBuZWVkIHRvIGRldGVybWluZSB0aGUgb3V0RmlsZSBuYW1lIHNvIHRoYXQgQW5ndWxhckNvbXBpbGVyIGNhbiByZXRyaWV2ZSBpdC5cbiAgbGV0IG91dEZpbGUgPSBvcHRpb25zLm91dEZpbGUgfHwgZ2V0STE4bk91dGZpbGUoZm9ybWF0KTtcbiAgaWYgKG9wdGlvbnMub3V0cHV0UGF0aCkge1xuICAgIC8vIEFuZ3VsYXJDb21waWxlclBsdWdpbiBkb2Vzbid0IHN1cHBvcnQgZ2VuRGlyIHNvIHdlIGhhdmUgdG8gYWRqdXN0IG91dEZpbGUgaW5zdGVhZC5cbiAgICBvdXRGaWxlID0gcGF0aC5qb2luKG9wdGlvbnMub3V0cHV0UGF0aCwgb3V0RmlsZSk7XG4gIH1cbiAgb3V0RmlsZSA9IHBhdGgucmVzb2x2ZShjb250ZXh0LndvcmtzcGFjZVJvb3QsIG91dEZpbGUpO1xuXG4gIGlmICghY29udGV4dC50YXJnZXQgfHwgIWNvbnRleHQudGFyZ2V0LnByb2plY3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBidWlsZGVyIHJlcXVpcmVzIGEgdGFyZ2V0LicpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXF1aXJlLnJlc29sdmUoJ0Bhbmd1bGFyL2xvY2FsaXplJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBgaTE4biBleHRyYWN0aW9uIHJlcXVpcmVzIHRoZSAnQGFuZ3VsYXIvbG9jYWxpemUnIHBhY2thZ2UuYCxcbiAgICAgIG91dHB1dFBhdGg6IG91dEZpbGUsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgY29udGV4dC5nZXRQcm9qZWN0TWV0YWRhdGEoY29udGV4dC50YXJnZXQpO1xuICBjb25zdCBpMThuID0gY3JlYXRlSTE4bk9wdGlvbnMobWV0YWRhdGEpO1xuXG4gIGxldCB1c2VMZWdhY3lJZHMgPSB0cnVlO1xuXG4gIGNvbnN0IGl2eU1lc3NhZ2VzOiBMb2NhbGl6ZU1lc3NhZ2VbXSA9IFtdO1xuICBjb25zdCBidWlsZGVyT3B0aW9ucyA9IHtcbiAgICAuLi5icm93c2VyT3B0aW9ucyxcbiAgICBvcHRpbWl6YXRpb246IGZhbHNlLFxuICAgIHNvdXJjZU1hcDoge1xuICAgICAgc2NyaXB0czogdHJ1ZSxcbiAgICAgIHN0eWxlczogZmFsc2UsXG4gICAgICB2ZW5kb3I6IHRydWUsXG4gICAgfSxcbiAgICBidWlsZE9wdGltaXplcjogZmFsc2UsXG4gICAgYW90OiB0cnVlLFxuICAgIHByb2dyZXNzOiBvcHRpb25zLnByb2dyZXNzLFxuICAgIGJ1ZGdldHM6IFtdLFxuICAgIGFzc2V0czogW10sXG4gICAgc2NyaXB0czogW10sXG4gICAgc3R5bGVzOiBbXSxcbiAgICBkZWxldGVPdXRwdXRQYXRoOiBmYWxzZSxcbiAgICBleHRyYWN0TGljZW5zZXM6IGZhbHNlLFxuICAgIHN1YnJlc291cmNlSW50ZWdyaXR5OiBmYWxzZSxcbiAgICBvdXRwdXRIYXNoaW5nOiBPdXRwdXRIYXNoaW5nLk5vbmUsXG4gICAgbmFtZWRDaHVua3M6IHRydWUsXG4gICAgYWxsb3dlZENvbW1vbkpzRGVwZW5kZW5jaWVzOiB1bmRlZmluZWQsXG4gIH07XG4gIGNvbnN0IHsgY29uZmlnLCBwcm9qZWN0Um9vdCB9ID0gYXdhaXQgZ2VuZXJhdGVCcm93c2VyV2VicGFja0NvbmZpZ0Zyb21Db250ZXh0KFxuICAgIGJ1aWxkZXJPcHRpb25zLFxuICAgIGNvbnRleHQsXG4gICAgKHdjbykgPT4ge1xuICAgICAgLy8gRGVmYXVsdCB2YWx1ZSBmb3IgbGVnYWN5IG1lc3NhZ2UgaWRzIGlzIGN1cnJlbnRseSB0cnVlXG4gICAgICB1c2VMZWdhY3lJZHMgPSB3Y28udHNDb25maWcub3B0aW9ucy5lbmFibGVJMThuTGVnYWN5TWVzc2FnZUlkRm9ybWF0ID8/IHRydWU7XG5cbiAgICAgIGNvbnN0IHBhcnRpYWxzOiAoUHJvbWlzZTxDb25maWd1cmF0aW9uPiB8IENvbmZpZ3VyYXRpb24pW10gPSBbXG4gICAgICAgIHsgcGx1Z2luczogW25ldyBOb0VtaXRQbHVnaW4oKV0gfSxcbiAgICAgICAgZ2V0Q29tbW9uQ29uZmlnKHdjbyksXG4gICAgICBdO1xuXG4gICAgICAvLyBBZGQgSXZ5IGFwcGxpY2F0aW9uIGZpbGUgZXh0cmFjdG9yIHN1cHBvcnRcbiAgICAgIHBhcnRpYWxzLnVuc2hpZnQoe1xuICAgICAgICBtb2R1bGU6IHtcbiAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0ZXN0OiAvXFwuW2NtXT9bdGpdc3g/JC8sXG4gICAgICAgICAgICAgIGxvYWRlcjogcmVxdWlyZS5yZXNvbHZlKCcuL2l2eS1leHRyYWN0LWxvYWRlcicpLFxuICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXI6IChtZXNzYWdlczogTG9jYWxpemVNZXNzYWdlW10pID0+IGl2eU1lc3NhZ2VzLnB1c2goLi4ubWVzc2FnZXMpLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlcGxhY2UgYWxsIHN0eWxlc2hlZXRzIHdpdGggZW1wdHkgY29udGVudFxuICAgICAgcGFydGlhbHMucHVzaCh7XG4gICAgICAgIG1vZHVsZToge1xuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRlc3Q6IC9cXC4oY3NzfHNjc3N8c2Fzc3xsZXNzKSQvLFxuICAgICAgICAgICAgICBsb2FkZXI6IHJlcXVpcmUucmVzb2x2ZSgnLi9lbXB0eS1sb2FkZXInKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcGFydGlhbHM7XG4gICAgfSxcbiAgICAvLyBEdXJpbmcgZXh0cmFjdGlvbiB3ZSBkb24ndCBuZWVkIHNwZWNpZmljIGJyb3dzZXIgc3VwcG9ydC5cbiAgICB7IHN1cHBvcnRlZEJyb3dzZXJzOiB1bmRlZmluZWQgfSxcbiAgKTtcblxuICAvLyBBbGwgdGhlIGxvY2FsaXplIHVzYWdlcyBhcmUgc2V0dXAgdG8gZmlyc3QgdHJ5IHRoZSBFU00gZW50cnkgcG9pbnQgdGhlbiBmYWxsYmFjayB0byB0aGUgZGVlcCBpbXBvcnRzLlxuICAvLyBUaGlzIHByb3ZpZGVzIGludGVyaW0gY29tcGF0aWJpbGl0eSB3aGlsZSB0aGUgZnJhbWV3b3JrIGlzIHRyYW5zaXRpb25lZCB0byBidW5kbGVkIEVTTSBwYWNrYWdlcy5cbiAgY29uc3QgbG9jYWxpemVUb29sc01vZHVsZSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHMnKT4oXG4gICAgJ0Bhbmd1bGFyL2xvY2FsaXplL3Rvb2xzJyxcbiAgKTtcbiAgY29uc3Qgd2VicGFja1Jlc3VsdCA9IGF3YWl0IGxhc3RWYWx1ZUZyb20oXG4gICAgcnVuV2VicGFjaygoYXdhaXQgdHJhbnNmb3Jtcz8ud2VicGFja0NvbmZpZ3VyYXRpb24/Lihjb25maWcpKSB8fCBjb25maWcsIGNvbnRleHQsIHtcbiAgICAgIGxvZ2dpbmc6IGNyZWF0ZVdlYnBhY2tMb2dnaW5nQ2FsbGJhY2soYnVpbGRlck9wdGlvbnMsIGNvbnRleHQubG9nZ2VyKSxcbiAgICAgIHdlYnBhY2tGYWN0b3J5OiB3ZWJwYWNrLFxuICAgIH0pLFxuICApO1xuXG4gIC8vIFNldCB0aGUgb3V0cHV0UGF0aCB0byB0aGUgZXh0cmFjdGlvbiBvdXRwdXQgbG9jYXRpb24gZm9yIGRvd25zdHJlYW0gY29uc3VtZXJzXG4gIHdlYnBhY2tSZXN1bHQub3V0cHV0UGF0aCA9IG91dEZpbGU7XG5cbiAgLy8gQ29tcGxldGUgaWYgV2VicGFjayBidWlsZCBmYWlsZWRcbiAgaWYgKCF3ZWJwYWNrUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gd2VicGFja1Jlc3VsdDtcbiAgfVxuXG4gIGNvbnN0IGJhc2VQYXRoID0gY29uZmlnLmNvbnRleHQgfHwgcHJvamVjdFJvb3Q7XG5cbiAgY29uc3QgeyBjaGVja0R1cGxpY2F0ZU1lc3NhZ2VzIH0gPSBsb2NhbGl6ZVRvb2xzTW9kdWxlO1xuXG4gIC8vIFRoZSBmaWxlc3lzdGVtIGlzIHVzZWQgdG8gY3JlYXRlIGEgcmVsYXRpdmUgcGF0aCBmb3IgZWFjaCBmaWxlXG4gIC8vIGZyb20gdGhlIGJhc2VQYXRoLiAgVGhpcyByZWxhdGl2ZSBwYXRoIGlzIHRoZW4gdXNlZCBpbiB0aGUgZXJyb3IgbWVzc2FnZS5cbiAgY29uc3QgY2hlY2tGaWxlU3lzdGVtID0ge1xuICAgIHJlbGF0aXZlKGZyb206IHN0cmluZywgdG86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZShmcm9tLCB0byk7XG4gICAgfSxcbiAgfTtcbiAgY29uc3QgZGlhZ25vc3RpY3MgPSBjaGVja0R1cGxpY2F0ZU1lc3NhZ2VzKFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY2hlY2tGaWxlU3lzdGVtIGFzIGFueSxcbiAgICBpdnlNZXNzYWdlcyxcbiAgICAnd2FybmluZycsXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICBiYXNlUGF0aCBhcyBhbnksXG4gICk7XG4gIGlmIChkaWFnbm9zdGljcy5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgY29udGV4dC5sb2dnZXIud2FybihkaWFnbm9zdGljcy5mb3JtYXREaWFnbm9zdGljcygnJykpO1xuICB9XG5cbiAgLy8gU2VyaWFsaXplIGFsbCBleHRyYWN0ZWQgbWVzc2FnZXNcbiAgY29uc3Qgc2VyaWFsaXplciA9IGF3YWl0IGdldFNlcmlhbGl6ZXIoXG4gICAgbG9jYWxpemVUb29sc01vZHVsZSxcbiAgICBmb3JtYXQsXG4gICAgaTE4bi5zb3VyY2VMb2NhbGUsXG4gICAgYmFzZVBhdGgsXG4gICAgdXNlTGVnYWN5SWRzLFxuICAgIGRpYWdub3N0aWNzLFxuICApO1xuICBjb25zdCBjb250ZW50ID0gc2VyaWFsaXplci5zZXJpYWxpemUoaXZ5TWVzc2FnZXMpO1xuXG4gIC8vIEVuc3VyZSBkaXJlY3RvcnkgZXhpc3RzXG4gIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmRpcm5hbWUob3V0RmlsZSk7XG4gIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXRQYXRoKSkge1xuICAgIGZzLm1rZGlyU3luYyhvdXRwdXRQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8vIFdyaXRlIHRyYW5zbGF0aW9uIGZpbGVcbiAgZnMud3JpdGVGaWxlU3luYyhvdXRGaWxlLCBjb250ZW50KTtcblxuICByZXR1cm4gd2VicGFja1Jlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQnVpbGRlcjxFeHRyYWN0STE4bkJ1aWxkZXJPcHRpb25zPihleGVjdXRlKTtcbiJdfQ==
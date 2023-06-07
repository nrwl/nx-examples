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
exports.inlineLocales = void 0;
const remapping_1 = __importDefault(require("@ampproject/remapping"));
const core_1 = require("@babel/core");
const template_1 = __importDefault(require("@babel/template"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const worker_threads_1 = require("worker_threads");
const environment_options_1 = require("./environment-options");
const error_1 = require("./error");
const load_esm_1 = require("./load-esm");
// Lazy loaded webpack-sources object
// Webpack is only imported if needed during the processing
let webpackSources;
const { i18n } = (worker_threads_1.workerData || {});
/**
 * Internal flag to enable the direct usage of the `@angular/localize` translation plugins.
 * Their usage is currently several times slower than the string manipulation method.
 * Future work to optimize the plugins should enable plugin usage as the default.
 */
const USE_LOCALIZE_PLUGINS = false;
/**
 * Cached instance of the `@angular/localize/tools` module.
 * This is used to remove the need to repeatedly import the module per file translation.
 */
let localizeToolsModule;
/**
 * Attempts to load the `@angular/localize/tools` module containing the functionality to
 * perform the file translations.
 * This module must be dynamically loaded as it is an ESM module and this file is CommonJS.
 */
async function loadLocalizeTools() {
    if (localizeToolsModule !== undefined) {
        return localizeToolsModule;
    }
    // Load ESM `@angular/localize/tools` using the TypeScript dynamic import workaround.
    // Once TypeScript provides support for keeping the dynamic import this workaround can be
    // changed to a direct dynamic import.
    return (0, load_esm_1.loadEsmModule)('@angular/localize/tools');
}
async function createI18nPlugins(locale, translation, missingTranslation, shouldInline, localeDataContent) {
    const { Diagnostics, makeEs2015TranslatePlugin, makeLocalePlugin } = await loadLocalizeTools();
    const plugins = [];
    const diagnostics = new Diagnostics();
    if (shouldInline) {
        plugins.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeEs2015TranslatePlugin(diagnostics, (translation || {}), {
            missingTranslation: translation === undefined ? 'ignore' : missingTranslation,
        }));
    }
    plugins.push(makeLocalePlugin(locale));
    if (localeDataContent) {
        plugins.push({
            visitor: {
                Program(path) {
                    path.unshiftContainer('body', template_1.default.ast(localeDataContent));
                },
            },
        });
    }
    return { diagnostics, plugins };
}
const localizeName = '$localize';
async function inlineLocales(options) {
    if (!i18n || i18n.inlineLocales.size === 0) {
        return { file: options.filename, diagnostics: [], count: 0 };
    }
    if (i18n.flatOutput && i18n.inlineLocales.size > 1) {
        throw new Error('Flat output is only supported when inlining one locale.');
    }
    const hasLocalizeName = options.code.includes(localizeName);
    if (!hasLocalizeName && !options.setLocale) {
        return inlineCopyOnly(options);
    }
    await loadLocalizeTools();
    let ast;
    try {
        ast = (0, core_1.parseSync)(options.code, {
            babelrc: false,
            configFile: false,
            sourceType: 'unambiguous',
            filename: options.filename,
        });
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        // Make the error more readable.
        // Same errors will contain the full content of the file as the error message
        // Which makes it hard to find the actual error message.
        const index = error.message.indexOf(')\n');
        const msg = index !== -1 ? error.message.slice(0, index + 1) : error.message;
        throw new Error(`${msg}\nAn error occurred inlining file "${options.filename}"`);
    }
    if (!ast) {
        throw new Error(`Unknown error occurred inlining file "${options.filename}"`);
    }
    if (!USE_LOCALIZE_PLUGINS) {
        return inlineLocalesDirect(ast, options);
    }
    const diagnostics = [];
    for (const locale of i18n.inlineLocales) {
        const isSourceLocale = locale === i18n.sourceLocale;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translations = isSourceLocale ? {} : i18n.locales[locale].translation || {};
        let localeDataContent;
        if (options.setLocale) {
            // If locale data is provided, load it and prepend to file
            const localeDataPath = i18n.locales[locale]?.dataPath;
            if (localeDataPath) {
                localeDataContent = await loadLocaleData(localeDataPath, true);
            }
        }
        const { diagnostics: localeDiagnostics, plugins } = await createI18nPlugins(locale, translations, isSourceLocale ? 'ignore' : options.missingTranslation || 'warning', true, localeDataContent);
        const transformResult = await (0, core_1.transformFromAstSync)(ast, options.code, {
            filename: options.filename,
            // using false ensures that babel will NOT search and process sourcemap comments (large memory usage)
            // The types do not include the false option even though it is valid
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputSourceMap: false,
            babelrc: false,
            configFile: false,
            plugins,
            compact: !environment_options_1.shouldBeautify,
            sourceMaps: !!options.map,
        });
        diagnostics.push(...localeDiagnostics.messages);
        if (!transformResult || !transformResult.code) {
            throw new Error(`Unknown error occurred processing bundle for "${options.filename}".`);
        }
        const outputPath = path.join(options.outputPath, i18n.flatOutput ? '' : locale, options.filename);
        await fs.writeFile(outputPath, transformResult.code);
        if (options.map && transformResult.map) {
            const outputMap = (0, remapping_1.default)([transformResult.map, options.map], () => null);
            await fs.writeFile(outputPath + '.map', JSON.stringify(outputMap));
        }
    }
    return { file: options.filename, diagnostics };
}
exports.inlineLocales = inlineLocales;
async function inlineLocalesDirect(ast, options) {
    if (!i18n || i18n.inlineLocales.size === 0) {
        return { file: options.filename, diagnostics: [], count: 0 };
    }
    const { default: generate } = await Promise.resolve().then(() => __importStar(require('@babel/generator')));
    const localizeDiag = await loadLocalizeTools();
    const diagnostics = new localizeDiag.Diagnostics();
    const positions = findLocalizePositions(ast, options, localizeDiag);
    if (positions.length === 0 && !options.setLocale) {
        return inlineCopyOnly(options);
    }
    const inputMap = !!options.map && JSON.parse(options.map);
    // Cleanup source root otherwise it will be added to each source entry
    const mapSourceRoot = inputMap && inputMap.sourceRoot;
    if (inputMap) {
        delete inputMap.sourceRoot;
    }
    // Load Webpack only when needed
    if (webpackSources === undefined) {
        webpackSources = (await Promise.resolve().then(() => __importStar(require('webpack')))).sources;
    }
    const { ConcatSource, OriginalSource, ReplaceSource, SourceMapSource } = webpackSources;
    for (const locale of i18n.inlineLocales) {
        const content = new ReplaceSource(inputMap
            ? new SourceMapSource(options.code, options.filename, inputMap)
            : new OriginalSource(options.code, options.filename));
        const isSourceLocale = locale === i18n.sourceLocale;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translations = isSourceLocale ? {} : i18n.locales[locale].translation || {};
        for (const position of positions) {
            const translated = localizeDiag.translate(diagnostics, translations, position.messageParts, position.expressions, isSourceLocale ? 'ignore' : options.missingTranslation || 'warning');
            const expression = localizeDiag.buildLocalizeReplacement(translated[0], translated[1]);
            const { code } = generate(expression);
            content.replace(position.start, position.end - 1, code);
        }
        let outputSource = content;
        if (options.setLocale) {
            const setLocaleText = `globalThis.$localize=Object.assign(globalThis.$localize || {},{locale:"${locale}"});\n`;
            // If locale data is provided, load it and prepend to file
            let localeDataSource;
            const localeDataPath = i18n.locales[locale] && i18n.locales[locale].dataPath;
            if (localeDataPath) {
                const localeDataContent = await loadLocaleData(localeDataPath, true);
                localeDataSource = new OriginalSource(localeDataContent, path.basename(localeDataPath));
            }
            outputSource = localeDataSource
                ? // The semicolon ensures that there is no syntax error between statements
                    new ConcatSource(setLocaleText, localeDataSource, ';\n', content)
                : new ConcatSource(setLocaleText, content);
        }
        const { source: outputCode, map: outputMap } = outputSource.sourceAndMap();
        const outputPath = path.join(options.outputPath, i18n.flatOutput ? '' : locale, options.filename);
        await fs.writeFile(outputPath, outputCode);
        if (inputMap && outputMap) {
            outputMap.file = options.filename;
            if (mapSourceRoot) {
                outputMap.sourceRoot = mapSourceRoot;
            }
            await fs.writeFile(outputPath + '.map', JSON.stringify(outputMap));
        }
    }
    return { file: options.filename, diagnostics: diagnostics.messages, count: positions.length };
}
async function inlineCopyOnly(options) {
    if (!i18n) {
        throw new Error('i18n options are missing');
    }
    for (const locale of i18n.inlineLocales) {
        const outputPath = path.join(options.outputPath, i18n.flatOutput ? '' : locale, options.filename);
        await fs.writeFile(outputPath, options.code);
        if (options.map) {
            await fs.writeFile(outputPath + '.map', options.map);
        }
    }
    return { file: options.filename, diagnostics: [], count: 0 };
}
function findLocalizePositions(ast, options, utils) {
    const positions = [];
    // Workaround to ensure a path hub is present for traversal
    const { File } = require('@babel/core');
    const file = new File({}, { code: options.code, ast });
    (0, core_1.traverse)(file.ast, {
        TaggedTemplateExpression(path) {
            if (core_1.types.isIdentifier(path.node.tag) && path.node.tag.name === localizeName) {
                const [messageParts, expressions] = unwrapTemplateLiteral(path, utils);
                positions.push({
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    start: path.node.start,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    end: path.node.end,
                    messageParts,
                    expressions,
                });
            }
        },
    });
    return positions;
}
function unwrapTemplateLiteral(path, utils) {
    const [messageParts] = utils.unwrapMessagePartsFromTemplateLiteral(path.get('quasi').get('quasis'));
    const [expressions] = utils.unwrapExpressionsFromTemplateLiteral(path.get('quasi'));
    return [messageParts, expressions];
}
function unwrapLocalizeCall(path, utils) {
    const [messageParts] = utils.unwrapMessagePartsFromLocalizeCall(path);
    const [expressions] = utils.unwrapSubstitutionsFromLocalizeCall(path);
    return [messageParts, expressions];
}
async function loadLocaleData(path, optimize) {
    // The path is validated during option processing before the build starts
    const content = await fs.readFile(path, 'utf8');
    // Downlevel and optimize the data
    const transformResult = await (0, core_1.transformAsync)(content, {
        filename: path,
        // The types do not include the false option even though it is valid
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputSourceMap: false,
        babelrc: false,
        configFile: false,
        presets: [
            [
                require.resolve('@babel/preset-env'),
                {
                    bugfixes: true,
                    targets: { esmodules: true },
                },
            ],
        ],
        minified: environment_options_1.allowMinify && optimize,
        compact: !environment_options_1.shouldBeautify && optimize,
        comments: !optimize,
    });
    if (!transformResult || !transformResult.code) {
        throw new Error(`Unknown error occurred processing bundle for "${path}".`);
    }
    return transformResult.code;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy1idW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9wcm9jZXNzLWJ1bmRsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHNFQUE4QztBQUM5QyxzQ0FRcUI7QUFDckIsK0RBQThDO0FBQzlDLGdEQUFrQztBQUNsQywyQ0FBNkI7QUFDN0IsbURBQTRDO0FBRTVDLCtEQUFvRTtBQUNwRSxtQ0FBd0M7QUFFeEMseUNBQTJDO0FBSzNDLHFDQUFxQztBQUNyQywyREFBMkQ7QUFDM0QsSUFBSSxjQUE0RCxDQUFDO0FBRWpFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLDJCQUFVLElBQUksRUFBRSxDQUEyQixDQUFDO0FBRTlEOzs7O0dBSUc7QUFDSCxNQUFNLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUluQzs7O0dBR0c7QUFDSCxJQUFJLG1CQUFzRCxDQUFDO0FBRTNEOzs7O0dBSUc7QUFDSCxLQUFLLFVBQVUsaUJBQWlCO0lBQzlCLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sbUJBQW1CLENBQUM7S0FDNUI7SUFFRCxxRkFBcUY7SUFDckYseUZBQXlGO0lBQ3pGLHNDQUFzQztJQUN0QyxPQUFPLElBQUEsd0JBQWEsRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQzlCLE1BQWMsRUFDZCxXQUFnQyxFQUNoQyxrQkFBa0QsRUFDbEQsWUFBcUIsRUFDckIsaUJBQTBCO0lBRTFCLE1BQU0sRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxNQUFNLGlCQUFpQixFQUFFLENBQUM7SUFFL0YsTUFBTSxPQUFP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QUksUUFBUTtRQUNqQyxPQUFPLEVBQUUsQ0FBQyxvQ0FBYyxJQUFJLFFBQVE7UUFDcEMsUUFBUSxFQUFFLENBQUMsUUFBUTtLQUNwQixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRTtRQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxJQUFJLElBQUksQ0FBQyxDQUFDO0tBQzVFO0lBRUQsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDO0FBQzlCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHJlbWFwcGluZyBmcm9tICdAYW1wcHJvamVjdC9yZW1hcHBpbmcnO1xuaW1wb3J0IHtcbiAgTm9kZVBhdGgsXG4gIFBhcnNlUmVzdWx0LFxuICBwYXJzZVN5bmMsXG4gIHRyYW5zZm9ybUFzeW5jLFxuICB0cmFuc2Zvcm1Gcm9tQXN0U3luYyxcbiAgdHJhdmVyc2UsXG4gIHR5cGVzLFxufSBmcm9tICdAYmFiZWwvY29yZSc7XG5pbXBvcnQgdGVtcGxhdGVCdWlsZGVyIGZyb20gJ0BiYWJlbC90ZW1wbGF0ZSc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgd29ya2VyRGF0YSB9IGZyb20gJ3dvcmtlcl90aHJlYWRzJztcbmltcG9ydCB7IElubGluZU9wdGlvbnMgfSBmcm9tICcuL2J1bmRsZS1pbmxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBhbGxvd01pbmlmeSwgc2hvdWxkQmVhdXRpZnkgfSBmcm9tICcuL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgSTE4bk9wdGlvbnMgfSBmcm9tICcuL2kxOG4tb3B0aW9ucyc7XG5pbXBvcnQgeyBsb2FkRXNtTW9kdWxlIH0gZnJvbSAnLi9sb2FkLWVzbSc7XG5cbi8vIEV4dHJhY3QgU291cmNlbWFwIGlucHV0IHR5cGUgZnJvbSB0aGUgcmVtYXBwaW5nIGZ1bmN0aW9uIHNpbmNlIGl0IGlzIG5vdCBjdXJyZW50bHkgZXhwb3J0ZWRcbnR5cGUgU291cmNlTWFwSW5wdXQgPSBFeGNsdWRlPFBhcmFtZXRlcnM8dHlwZW9mIHJlbWFwcGluZz5bMF0sIHVua25vd25bXT47XG5cbi8vIExhenkgbG9hZGVkIHdlYnBhY2stc291cmNlcyBvYmplY3Rcbi8vIFdlYnBhY2sgaXMgb25seSBpbXBvcnRlZCBpZiBuZWVkZWQgZHVyaW5nIHRoZSBwcm9jZXNzaW5nXG5sZXQgd2VicGFja1NvdXJjZXM6IHR5cGVvZiBpbXBvcnQoJ3dlYnBhY2snKS5zb3VyY2VzIHwgdW5kZWZpbmVkO1xuXG5jb25zdCB7IGkxOG4gfSA9ICh3b3JrZXJEYXRhIHx8IHt9KSBhcyB7IGkxOG4/OiBJMThuT3B0aW9ucyB9O1xuXG4vKipcbiAqIEludGVybmFsIGZsYWcgdG8gZW5hYmxlIHRoZSBkaXJlY3QgdXNhZ2Ugb2YgdGhlIGBAYW5ndWxhci9sb2NhbGl6ZWAgdHJhbnNsYXRpb24gcGx1Z2lucy5cbiAqIFRoZWlyIHVzYWdlIGlzIGN1cnJlbnRseSBzZXZlcmFsIHRpbWVzIHNsb3dlciB0aGFuIHRoZSBzdHJpbmcgbWFuaXB1bGF0aW9uIG1ldGhvZC5cbiAqIEZ1dHVyZSB3b3JrIHRvIG9wdGltaXplIHRoZSBwbHVnaW5zIHNob3VsZCBlbmFibGUgcGx1Z2luIHVzYWdlIGFzIHRoZSBkZWZhdWx0LlxuICovXG5jb25zdCBVU0VfTE9DQUxJWkVfUExVR0lOUyA9IGZhbHNlO1xuXG50eXBlIExvY2FsaXplVXRpbGl0eU1vZHVsZSA9IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2xvY2FsaXplL3Rvb2xzJyk7XG5cbi8qKlxuICogQ2FjaGVkIGluc3RhbmNlIG9mIHRoZSBgQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHNgIG1vZHVsZS5cbiAqIFRoaXMgaXMgdXNlZCB0byByZW1vdmUgdGhlIG5lZWQgdG8gcmVwZWF0ZWRseSBpbXBvcnQgdGhlIG1vZHVsZSBwZXIgZmlsZSB0cmFuc2xhdGlvbi5cbiAqL1xubGV0IGxvY2FsaXplVG9vbHNNb2R1bGU6IExvY2FsaXplVXRpbGl0eU1vZHVsZSB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBdHRlbXB0cyB0byBsb2FkIHRoZSBgQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHNgIG1vZHVsZSBjb250YWluaW5nIHRoZSBmdW5jdGlvbmFsaXR5IHRvXG4gKiBwZXJmb3JtIHRoZSBmaWxlIHRyYW5zbGF0aW9ucy5cbiAqIFRoaXMgbW9kdWxlIG11c3QgYmUgZHluYW1pY2FsbHkgbG9hZGVkIGFzIGl0IGlzIGFuIEVTTSBtb2R1bGUgYW5kIHRoaXMgZmlsZSBpcyBDb21tb25KUy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZExvY2FsaXplVG9vbHMoKTogUHJvbWlzZTxMb2NhbGl6ZVV0aWxpdHlNb2R1bGU+IHtcbiAgaWYgKGxvY2FsaXplVG9vbHNNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBsb2NhbGl6ZVRvb2xzTW9kdWxlO1xuICB9XG5cbiAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2xvY2FsaXplL3Rvb2xzYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICByZXR1cm4gbG9hZEVzbU1vZHVsZSgnQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHMnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlSTE4blBsdWdpbnMoXG4gIGxvY2FsZTogc3RyaW5nLFxuICB0cmFuc2xhdGlvbjogdW5rbm93biB8IHVuZGVmaW5lZCxcbiAgbWlzc2luZ1RyYW5zbGF0aW9uOiAnZXJyb3InIHwgJ3dhcm5pbmcnIHwgJ2lnbm9yZScsXG4gIHNob3VsZElubGluZTogYm9vbGVhbixcbiAgbG9jYWxlRGF0YUNvbnRlbnQ/OiBzdHJpbmcsXG4pIHtcbiAgY29uc3QgeyBEaWFnbm9zdGljcywgbWFrZUVzMjAxNVRyYW5zbGF0ZVBsdWdpbiwgbWFrZUxvY2FsZVBsdWdpbiB9ID0gYXdhaXQgbG9hZExvY2FsaXplVG9vbHMoKTtcblxuICBjb25zdCBwbHVnaW5zID0gW107XG4gIGNvbnN0IGRpYWdub3N0aWNzID0gbmV3IERpYWdub3N0aWNzKCk7XG5cbiAgaWYgKHNob3VsZElubGluZSkge1xuICAgIHBsdWdpbnMucHVzaChcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBtYWtlRXMyMDE1VHJhbnNsYXRlUGx1Z2luKGRpYWdub3N0aWNzLCAodHJhbnNsYXRpb24gfHwge30pIGFzIGFueSwge1xuICAgICAgICBtaXNzaW5nVHJhbnNsYXRpb246IHRyYW5zbGF0aW9uID09PSB1bmRlZmluZWQgPyAnaWdub3JlJyA6IG1pc3NpbmdUcmFuc2xhdGlvbixcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBwbHVnaW5zLnB1c2gobWFrZUxvY2FsZVBsdWdpbihsb2NhbGUpKTtcblxuICBpZiAobG9jYWxlRGF0YUNvbnRlbnQpIHtcbiAgICBwbHVnaW5zLnB1c2goe1xuICAgICAgdmlzaXRvcjoge1xuICAgICAgICBQcm9ncmFtKHBhdGg6IE5vZGVQYXRoPHR5cGVzLlByb2dyYW0+KSB7XG4gICAgICAgICAgcGF0aC51bnNoaWZ0Q29udGFpbmVyKCdib2R5JywgdGVtcGxhdGVCdWlsZGVyLmFzdChsb2NhbGVEYXRhQ29udGVudCkpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7IGRpYWdub3N0aWNzLCBwbHVnaW5zIH07XG59XG5cbmludGVyZmFjZSBMb2NhbGl6ZVBvc2l0aW9uIHtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZW5kOiBudW1iZXI7XG4gIG1lc3NhZ2VQYXJ0czogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XG4gIGV4cHJlc3Npb25zOiB0eXBlcy5FeHByZXNzaW9uW107XG59XG5cbmNvbnN0IGxvY2FsaXplTmFtZSA9ICckbG9jYWxpemUnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5saW5lTG9jYWxlcyhvcHRpb25zOiBJbmxpbmVPcHRpb25zKSB7XG4gIGlmICghaTE4biB8fCBpMThuLmlubGluZUxvY2FsZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiB7IGZpbGU6IG9wdGlvbnMuZmlsZW5hbWUsIGRpYWdub3N0aWNzOiBbXSwgY291bnQ6IDAgfTtcbiAgfVxuICBpZiAoaTE4bi5mbGF0T3V0cHV0ICYmIGkxOG4uaW5saW5lTG9jYWxlcy5zaXplID4gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignRmxhdCBvdXRwdXQgaXMgb25seSBzdXBwb3J0ZWQgd2hlbiBpbmxpbmluZyBvbmUgbG9jYWxlLicpO1xuICB9XG5cbiAgY29uc3QgaGFzTG9jYWxpemVOYW1lID0gb3B0aW9ucy5jb2RlLmluY2x1ZGVzKGxvY2FsaXplTmFtZSk7XG4gIGlmICghaGFzTG9jYWxpemVOYW1lICYmICFvcHRpb25zLnNldExvY2FsZSkge1xuICAgIHJldHVybiBpbmxpbmVDb3B5T25seShvcHRpb25zKTtcbiAgfVxuXG4gIGF3YWl0IGxvYWRMb2NhbGl6ZVRvb2xzKCk7XG5cbiAgbGV0IGFzdDogUGFyc2VSZXN1bHQgfCB1bmRlZmluZWQgfCBudWxsO1xuICB0cnkge1xuICAgIGFzdCA9IHBhcnNlU3luYyhvcHRpb25zLmNvZGUsIHtcbiAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgY29uZmlnRmlsZTogZmFsc2UsXG4gICAgICBzb3VyY2VUeXBlOiAndW5hbWJpZ3VvdXMnLFxuICAgICAgZmlsZW5hbWU6IG9wdGlvbnMuZmlsZW5hbWUsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlcnJvcik7XG5cbiAgICAvLyBNYWtlIHRoZSBlcnJvciBtb3JlIHJlYWRhYmxlLlxuICAgIC8vIFNhbWUgZXJyb3JzIHdpbGwgY29udGFpbiB0aGUgZnVsbCBjb250ZW50IG9mIHRoZSBmaWxlIGFzIHRoZSBlcnJvciBtZXNzYWdlXG4gICAgLy8gV2hpY2ggbWFrZXMgaXQgaGFyZCB0byBmaW5kIHRoZSBhY3R1YWwgZXJyb3IgbWVzc2FnZS5cbiAgICBjb25zdCBpbmRleCA9IGVycm9yLm1lc3NhZ2UuaW5kZXhPZignKVxcbicpO1xuICAgIGNvbnN0IG1zZyA9IGluZGV4ICE9PSAtMSA/IGVycm9yLm1lc3NhZ2Uuc2xpY2UoMCwgaW5kZXggKyAxKSA6IGVycm9yLm1lc3NhZ2U7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21zZ31cXG5BbiBlcnJvciBvY2N1cnJlZCBpbmxpbmluZyBmaWxlIFwiJHtvcHRpb25zLmZpbGVuYW1lfVwiYCk7XG4gIH1cblxuICBpZiAoIWFzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlcnJvciBvY2N1cnJlZCBpbmxpbmluZyBmaWxlIFwiJHtvcHRpb25zLmZpbGVuYW1lfVwiYCk7XG4gIH1cblxuICBpZiAoIVVTRV9MT0NBTElaRV9QTFVHSU5TKSB7XG4gICAgcmV0dXJuIGlubGluZUxvY2FsZXNEaXJlY3QoYXN0LCBvcHRpb25zKTtcbiAgfVxuXG4gIGNvbnN0IGRpYWdub3N0aWNzID0gW107XG4gIGZvciAoY29uc3QgbG9jYWxlIG9mIGkxOG4uaW5saW5lTG9jYWxlcykge1xuICAgIGNvbnN0IGlzU291cmNlTG9jYWxlID0gbG9jYWxlID09PSBpMThuLnNvdXJjZUxvY2FsZTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IHRyYW5zbGF0aW9uczogYW55ID0gaXNTb3VyY2VMb2NhbGUgPyB7fSA6IGkxOG4ubG9jYWxlc1tsb2NhbGVdLnRyYW5zbGF0aW9uIHx8IHt9O1xuICAgIGxldCBsb2NhbGVEYXRhQ29udGVudDtcbiAgICBpZiAob3B0aW9ucy5zZXRMb2NhbGUpIHtcbiAgICAgIC8vIElmIGxvY2FsZSBkYXRhIGlzIHByb3ZpZGVkLCBsb2FkIGl0IGFuZCBwcmVwZW5kIHRvIGZpbGVcbiAgICAgIGNvbnN0IGxvY2FsZURhdGFQYXRoID0gaTE4bi5sb2NhbGVzW2xvY2FsZV0/LmRhdGFQYXRoO1xuICAgICAgaWYgKGxvY2FsZURhdGFQYXRoKSB7XG4gICAgICAgIGxvY2FsZURhdGFDb250ZW50ID0gYXdhaXQgbG9hZExvY2FsZURhdGEobG9jYWxlRGF0YVBhdGgsIHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHsgZGlhZ25vc3RpY3M6IGxvY2FsZURpYWdub3N0aWNzLCBwbHVnaW5zIH0gPSBhd2FpdCBjcmVhdGVJMThuUGx1Z2lucyhcbiAgICAgIGxvY2FsZSxcbiAgICAgIHRyYW5zbGF0aW9ucyxcbiAgICAgIGlzU291cmNlTG9jYWxlID8gJ2lnbm9yZScgOiBvcHRpb25zLm1pc3NpbmdUcmFuc2xhdGlvbiB8fCAnd2FybmluZycsXG4gICAgICB0cnVlLFxuICAgICAgbG9jYWxlRGF0YUNvbnRlbnQsXG4gICAgKTtcbiAgICBjb25zdCB0cmFuc2Zvcm1SZXN1bHQgPSBhd2FpdCB0cmFuc2Zvcm1Gcm9tQXN0U3luYyhhc3QsIG9wdGlvbnMuY29kZSwge1xuICAgICAgZmlsZW5hbWU6IG9wdGlvbnMuZmlsZW5hbWUsXG4gICAgICAvLyB1c2luZyBmYWxzZSBlbnN1cmVzIHRoYXQgYmFiZWwgd2lsbCBOT1Qgc2VhcmNoIGFuZCBwcm9jZXNzIHNvdXJjZW1hcCBjb21tZW50cyAobGFyZ2UgbWVtb3J5IHVzYWdlKVxuICAgICAgLy8gVGhlIHR5cGVzIGRvIG5vdCBpbmNsdWRlIHRoZSBmYWxzZSBvcHRpb24gZXZlbiB0aG91Z2ggaXQgaXMgdmFsaWRcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBpbnB1dFNvdXJjZU1hcDogZmFsc2UgYXMgYW55LFxuICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICBjb25maWdGaWxlOiBmYWxzZSxcbiAgICAgIHBsdWdpbnMsXG4gICAgICBjb21wYWN0OiAhc2hvdWxkQmVhdXRpZnksXG4gICAgICBzb3VyY2VNYXBzOiAhIW9wdGlvbnMubWFwLFxuICAgIH0pO1xuXG4gICAgZGlhZ25vc3RpY3MucHVzaCguLi5sb2NhbGVEaWFnbm9zdGljcy5tZXNzYWdlcyk7XG5cbiAgICBpZiAoIXRyYW5zZm9ybVJlc3VsdCB8fCAhdHJhbnNmb3JtUmVzdWx0LmNvZGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBlcnJvciBvY2N1cnJlZCBwcm9jZXNzaW5nIGJ1bmRsZSBmb3IgXCIke29wdGlvbnMuZmlsZW5hbWV9XCIuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihcbiAgICAgIG9wdGlvbnMub3V0cHV0UGF0aCxcbiAgICAgIGkxOG4uZmxhdE91dHB1dCA/ICcnIDogbG9jYWxlLFxuICAgICAgb3B0aW9ucy5maWxlbmFtZSxcbiAgICApO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRwdXRQYXRoLCB0cmFuc2Zvcm1SZXN1bHQuY29kZSk7XG5cbiAgICBpZiAob3B0aW9ucy5tYXAgJiYgdHJhbnNmb3JtUmVzdWx0Lm1hcCkge1xuICAgICAgY29uc3Qgb3V0cHV0TWFwID0gcmVtYXBwaW5nKFt0cmFuc2Zvcm1SZXN1bHQubWFwIGFzIFNvdXJjZU1hcElucHV0LCBvcHRpb25zLm1hcF0sICgpID0+IG51bGwpO1xuXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUob3V0cHV0UGF0aCArICcubWFwJywgSlNPTi5zdHJpbmdpZnkob3V0cHV0TWFwKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgZmlsZTogb3B0aW9ucy5maWxlbmFtZSwgZGlhZ25vc3RpY3MgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5saW5lTG9jYWxlc0RpcmVjdChhc3Q6IFBhcnNlUmVzdWx0LCBvcHRpb25zOiBJbmxpbmVPcHRpb25zKSB7XG4gIGlmICghaTE4biB8fCBpMThuLmlubGluZUxvY2FsZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiB7IGZpbGU6IG9wdGlvbnMuZmlsZW5hbWUsIGRpYWdub3N0aWNzOiBbXSwgY291bnQ6IDAgfTtcbiAgfVxuXG4gIGNvbnN0IHsgZGVmYXVsdDogZ2VuZXJhdGUgfSA9IGF3YWl0IGltcG9ydCgnQGJhYmVsL2dlbmVyYXRvcicpO1xuICBjb25zdCBsb2NhbGl6ZURpYWcgPSBhd2FpdCBsb2FkTG9jYWxpemVUb29scygpO1xuICBjb25zdCBkaWFnbm9zdGljcyA9IG5ldyBsb2NhbGl6ZURpYWcuRGlhZ25vc3RpY3MoKTtcblxuICBjb25zdCBwb3NpdGlvbnMgPSBmaW5kTG9jYWxpemVQb3NpdGlvbnMoYXN0LCBvcHRpb25zLCBsb2NhbGl6ZURpYWcpO1xuICBpZiAocG9zaXRpb25zLmxlbmd0aCA9PT0gMCAmJiAhb3B0aW9ucy5zZXRMb2NhbGUpIHtcbiAgICByZXR1cm4gaW5saW5lQ29weU9ubHkob3B0aW9ucyk7XG4gIH1cblxuICBjb25zdCBpbnB1dE1hcCA9ICEhb3B0aW9ucy5tYXAgJiYgKEpTT04ucGFyc2Uob3B0aW9ucy5tYXApIGFzIHsgc291cmNlUm9vdD86IHN0cmluZyB9KTtcbiAgLy8gQ2xlYW51cCBzb3VyY2Ugcm9vdCBvdGhlcndpc2UgaXQgd2lsbCBiZSBhZGRlZCB0byBlYWNoIHNvdXJjZSBlbnRyeVxuICBjb25zdCBtYXBTb3VyY2VSb290ID0gaW5wdXRNYXAgJiYgaW5wdXRNYXAuc291cmNlUm9vdDtcbiAgaWYgKGlucHV0TWFwKSB7XG4gICAgZGVsZXRlIGlucHV0TWFwLnNvdXJjZVJvb3Q7XG4gIH1cblxuICAvLyBMb2FkIFdlYnBhY2sgb25seSB3aGVuIG5lZWRlZFxuICBpZiAod2VicGFja1NvdXJjZXMgPT09IHVuZGVmaW5lZCkge1xuICAgIHdlYnBhY2tTb3VyY2VzID0gKGF3YWl0IGltcG9ydCgnd2VicGFjaycpKS5zb3VyY2VzO1xuICB9XG4gIGNvbnN0IHsgQ29uY2F0U291cmNlLCBPcmlnaW5hbFNvdXJjZSwgUmVwbGFjZVNvdXJjZSwgU291cmNlTWFwU291cmNlIH0gPSB3ZWJwYWNrU291cmNlcztcblxuICBmb3IgKGNvbnN0IGxvY2FsZSBvZiBpMThuLmlubGluZUxvY2FsZXMpIHtcbiAgICBjb25zdCBjb250ZW50ID0gbmV3IFJlcGxhY2VTb3VyY2UoXG4gICAgICBpbnB1dE1hcFxuICAgICAgICA/IG5ldyBTb3VyY2VNYXBTb3VyY2Uob3B0aW9ucy5jb2RlLCBvcHRpb25zLmZpbGVuYW1lLCBpbnB1dE1hcClcbiAgICAgICAgOiBuZXcgT3JpZ2luYWxTb3VyY2Uob3B0aW9ucy5jb2RlLCBvcHRpb25zLmZpbGVuYW1lKSxcbiAgICApO1xuXG4gICAgY29uc3QgaXNTb3VyY2VMb2NhbGUgPSBsb2NhbGUgPT09IGkxOG4uc291cmNlTG9jYWxlO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgdHJhbnNsYXRpb25zOiBhbnkgPSBpc1NvdXJjZUxvY2FsZSA/IHt9IDogaTE4bi5sb2NhbGVzW2xvY2FsZV0udHJhbnNsYXRpb24gfHwge307XG4gICAgZm9yIChjb25zdCBwb3NpdGlvbiBvZiBwb3NpdGlvbnMpIHtcbiAgICAgIGNvbnN0IHRyYW5zbGF0ZWQgPSBsb2NhbGl6ZURpYWcudHJhbnNsYXRlKFxuICAgICAgICBkaWFnbm9zdGljcyxcbiAgICAgICAgdHJhbnNsYXRpb25zLFxuICAgICAgICBwb3NpdGlvbi5tZXNzYWdlUGFydHMsXG4gICAgICAgIHBvc2l0aW9uLmV4cHJlc3Npb25zLFxuICAgICAgICBpc1NvdXJjZUxvY2FsZSA/ICdpZ25vcmUnIDogb3B0aW9ucy5taXNzaW5nVHJhbnNsYXRpb24gfHwgJ3dhcm5pbmcnLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IGxvY2FsaXplRGlhZy5idWlsZExvY2FsaXplUmVwbGFjZW1lbnQodHJhbnNsYXRlZFswXSwgdHJhbnNsYXRlZFsxXSk7XG4gICAgICBjb25zdCB7IGNvZGUgfSA9IGdlbmVyYXRlKGV4cHJlc3Npb24pO1xuXG4gICAgICBjb250ZW50LnJlcGxhY2UocG9zaXRpb24uc3RhcnQsIHBvc2l0aW9uLmVuZCAtIDEsIGNvZGUpO1xuICAgIH1cblxuICAgIGxldCBvdXRwdXRTb3VyY2U6IGltcG9ydCgnd2VicGFjaycpLnNvdXJjZXMuU291cmNlID0gY29udGVudDtcbiAgICBpZiAob3B0aW9ucy5zZXRMb2NhbGUpIHtcbiAgICAgIGNvbnN0IHNldExvY2FsZVRleHQgPSBgZ2xvYmFsVGhpcy4kbG9jYWxpemU9T2JqZWN0LmFzc2lnbihnbG9iYWxUaGlzLiRsb2NhbGl6ZSB8fCB7fSx7bG9jYWxlOlwiJHtsb2NhbGV9XCJ9KTtcXG5gO1xuXG4gICAgICAvLyBJZiBsb2NhbGUgZGF0YSBpcyBwcm92aWRlZCwgbG9hZCBpdCBhbmQgcHJlcGVuZCB0byBmaWxlXG4gICAgICBsZXQgbG9jYWxlRGF0YVNvdXJjZTtcbiAgICAgIGNvbnN0IGxvY2FsZURhdGFQYXRoID0gaTE4bi5sb2NhbGVzW2xvY2FsZV0gJiYgaTE4bi5sb2NhbGVzW2xvY2FsZV0uZGF0YVBhdGg7XG4gICAgICBpZiAobG9jYWxlRGF0YVBhdGgpIHtcbiAgICAgICAgY29uc3QgbG9jYWxlRGF0YUNvbnRlbnQgPSBhd2FpdCBsb2FkTG9jYWxlRGF0YShsb2NhbGVEYXRhUGF0aCwgdHJ1ZSk7XG4gICAgICAgIGxvY2FsZURhdGFTb3VyY2UgPSBuZXcgT3JpZ2luYWxTb3VyY2UobG9jYWxlRGF0YUNvbnRlbnQsIHBhdGguYmFzZW5hbWUobG9jYWxlRGF0YVBhdGgpKTtcbiAgICAgIH1cblxuICAgICAgb3V0cHV0U291cmNlID0gbG9jYWxlRGF0YVNvdXJjZVxuICAgICAgICA/IC8vIFRoZSBzZW1pY29sb24gZW5zdXJlcyB0aGF0IHRoZXJlIGlzIG5vIHN5bnRheCBlcnJvciBiZXR3ZWVuIHN0YXRlbWVudHNcbiAgICAgICAgICBuZXcgQ29uY2F0U291cmNlKHNldExvY2FsZVRleHQsIGxvY2FsZURhdGFTb3VyY2UsICc7XFxuJywgY29udGVudClcbiAgICAgICAgOiBuZXcgQ29uY2F0U291cmNlKHNldExvY2FsZVRleHQsIGNvbnRlbnQpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgc291cmNlOiBvdXRwdXRDb2RlLCBtYXA6IG91dHB1dE1hcCB9ID0gb3V0cHV0U291cmNlLnNvdXJjZUFuZE1hcCgpIGFzIHtcbiAgICAgIHNvdXJjZTogc3RyaW5nO1xuICAgICAgbWFwOiB7IGZpbGU6IHN0cmluZzsgc291cmNlUm9vdD86IHN0cmluZyB9O1xuICAgIH07XG4gICAgY29uc3Qgb3V0cHV0UGF0aCA9IHBhdGguam9pbihcbiAgICAgIG9wdGlvbnMub3V0cHV0UGF0aCxcbiAgICAgIGkxOG4uZmxhdE91dHB1dCA/ICcnIDogbG9jYWxlLFxuICAgICAgb3B0aW9ucy5maWxlbmFtZSxcbiAgICApO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRwdXRQYXRoLCBvdXRwdXRDb2RlKTtcblxuICAgIGlmIChpbnB1dE1hcCAmJiBvdXRwdXRNYXApIHtcbiAgICAgIG91dHB1dE1hcC5maWxlID0gb3B0aW9ucy5maWxlbmFtZTtcbiAgICAgIGlmIChtYXBTb3VyY2VSb290KSB7XG4gICAgICAgIG91dHB1dE1hcC5zb3VyY2VSb290ID0gbWFwU291cmNlUm9vdDtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRwdXRQYXRoICsgJy5tYXAnLCBKU09OLnN0cmluZ2lmeShvdXRwdXRNYXApKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBmaWxlOiBvcHRpb25zLmZpbGVuYW1lLCBkaWFnbm9zdGljczogZGlhZ25vc3RpY3MubWVzc2FnZXMsIGNvdW50OiBwb3NpdGlvbnMubGVuZ3RoIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlubGluZUNvcHlPbmx5KG9wdGlvbnM6IElubGluZU9wdGlvbnMpIHtcbiAgaWYgKCFpMThuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpMThuIG9wdGlvbnMgYXJlIG1pc3NpbmcnKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgbG9jYWxlIG9mIGkxOG4uaW5saW5lTG9jYWxlcykge1xuICAgIGNvbnN0IG91dHB1dFBhdGggPSBwYXRoLmpvaW4oXG4gICAgICBvcHRpb25zLm91dHB1dFBhdGgsXG4gICAgICBpMThuLmZsYXRPdXRwdXQgPyAnJyA6IGxvY2FsZSxcbiAgICAgIG9wdGlvbnMuZmlsZW5hbWUsXG4gICAgKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUob3V0cHV0UGF0aCwgb3B0aW9ucy5jb2RlKTtcbiAgICBpZiAob3B0aW9ucy5tYXApIHtcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShvdXRwdXRQYXRoICsgJy5tYXAnLCBvcHRpb25zLm1hcCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgZmlsZTogb3B0aW9ucy5maWxlbmFtZSwgZGlhZ25vc3RpY3M6IFtdLCBjb3VudDogMCB9O1xufVxuXG5mdW5jdGlvbiBmaW5kTG9jYWxpemVQb3NpdGlvbnMoXG4gIGFzdDogUGFyc2VSZXN1bHQsXG4gIG9wdGlvbnM6IElubGluZU9wdGlvbnMsXG4gIHV0aWxzOiBMb2NhbGl6ZVV0aWxpdHlNb2R1bGUsXG4pOiBMb2NhbGl6ZVBvc2l0aW9uW10ge1xuICBjb25zdCBwb3NpdGlvbnM6IExvY2FsaXplUG9zaXRpb25bXSA9IFtdO1xuXG4gIC8vIFdvcmthcm91bmQgdG8gZW5zdXJlIGEgcGF0aCBodWIgaXMgcHJlc2VudCBmb3IgdHJhdmVyc2FsXG4gIGNvbnN0IHsgRmlsZSB9ID0gcmVxdWlyZSgnQGJhYmVsL2NvcmUnKTtcbiAgY29uc3QgZmlsZSA9IG5ldyBGaWxlKHt9LCB7IGNvZGU6IG9wdGlvbnMuY29kZSwgYXN0IH0pO1xuXG4gIHRyYXZlcnNlKGZpbGUuYXN0LCB7XG4gICAgVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uKHBhdGgpIHtcbiAgICAgIGlmICh0eXBlcy5pc0lkZW50aWZpZXIocGF0aC5ub2RlLnRhZykgJiYgcGF0aC5ub2RlLnRhZy5uYW1lID09PSBsb2NhbGl6ZU5hbWUpIHtcbiAgICAgICAgY29uc3QgW21lc3NhZ2VQYXJ0cywgZXhwcmVzc2lvbnNdID0gdW53cmFwVGVtcGxhdGVMaXRlcmFsKHBhdGgsIHV0aWxzKTtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goe1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICAgICAgc3RhcnQ6IHBhdGgubm9kZS5zdGFydCEsXG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICBlbmQ6IHBhdGgubm9kZS5lbmQhLFxuICAgICAgICAgIG1lc3NhZ2VQYXJ0cyxcbiAgICAgICAgICBleHByZXNzaW9ucyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIHBvc2l0aW9ucztcbn1cblxuZnVuY3Rpb24gdW53cmFwVGVtcGxhdGVMaXRlcmFsKFxuICBwYXRoOiBOb2RlUGF0aDx0eXBlcy5UYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb24+LFxuICB1dGlsczogTG9jYWxpemVVdGlsaXR5TW9kdWxlLFxuKTogW1RlbXBsYXRlU3RyaW5nc0FycmF5LCB0eXBlcy5FeHByZXNzaW9uW11dIHtcbiAgY29uc3QgW21lc3NhZ2VQYXJ0c10gPSB1dGlscy51bndyYXBNZXNzYWdlUGFydHNGcm9tVGVtcGxhdGVMaXRlcmFsKFxuICAgIHBhdGguZ2V0KCdxdWFzaScpLmdldCgncXVhc2lzJyksXG4gICk7XG4gIGNvbnN0IFtleHByZXNzaW9uc10gPSB1dGlscy51bndyYXBFeHByZXNzaW9uc0Zyb21UZW1wbGF0ZUxpdGVyYWwocGF0aC5nZXQoJ3F1YXNpJykpO1xuXG4gIHJldHVybiBbbWVzc2FnZVBhcnRzLCBleHByZXNzaW9uc107XG59XG5cbmZ1bmN0aW9uIHVud3JhcExvY2FsaXplQ2FsbChcbiAgcGF0aDogTm9kZVBhdGg8dHlwZXMuQ2FsbEV4cHJlc3Npb24+LFxuICB1dGlsczogTG9jYWxpemVVdGlsaXR5TW9kdWxlLFxuKTogW1RlbXBsYXRlU3RyaW5nc0FycmF5LCB0eXBlcy5FeHByZXNzaW9uW11dIHtcbiAgY29uc3QgW21lc3NhZ2VQYXJ0c10gPSB1dGlscy51bndyYXBNZXNzYWdlUGFydHNGcm9tTG9jYWxpemVDYWxsKHBhdGgpO1xuICBjb25zdCBbZXhwcmVzc2lvbnNdID0gdXRpbHMudW53cmFwU3Vic3RpdHV0aW9uc0Zyb21Mb2NhbGl6ZUNhbGwocGF0aCk7XG5cbiAgcmV0dXJuIFttZXNzYWdlUGFydHMsIGV4cHJlc3Npb25zXTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZExvY2FsZURhdGEocGF0aDogc3RyaW5nLCBvcHRpbWl6ZTogYm9vbGVhbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIFRoZSBwYXRoIGlzIHZhbGlkYXRlZCBkdXJpbmcgb3B0aW9uIHByb2Nlc3NpbmcgYmVmb3JlIHRoZSBidWlsZCBzdGFydHNcbiAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKHBhdGgsICd1dGY4Jyk7XG5cbiAgLy8gRG93bmxldmVsIGFuZCBvcHRpbWl6ZSB0aGUgZGF0YVxuICBjb25zdCB0cmFuc2Zvcm1SZXN1bHQgPSBhd2FpdCB0cmFuc2Zvcm1Bc3luYyhjb250ZW50LCB7XG4gICAgZmlsZW5hbWU6IHBhdGgsXG4gICAgLy8gVGhlIHR5cGVzIGRvIG5vdCBpbmNsdWRlIHRoZSBmYWxzZSBvcHRpb24gZXZlbiB0aG91Z2ggaXQgaXMgdmFsaWRcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIGlucHV0U291cmNlTWFwOiBmYWxzZSBhcyBhbnksXG4gICAgYmFiZWxyYzogZmFsc2UsXG4gICAgY29uZmlnRmlsZTogZmFsc2UsXG4gICAgcHJlc2V0czogW1xuICAgICAgW1xuICAgICAgICByZXF1aXJlLnJlc29sdmUoJ0BiYWJlbC9wcmVzZXQtZW52JyksXG4gICAgICAgIHtcbiAgICAgICAgICBidWdmaXhlczogdHJ1ZSxcbiAgICAgICAgICB0YXJnZXRzOiB7IGVzbW9kdWxlczogdHJ1ZSB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICBdLFxuICAgIG1pbmlmaWVkOiBhbGxvd01pbmlmeSAmJiBvcHRpbWl6ZSxcbiAgICBjb21wYWN0OiAhc2hvdWxkQmVhdXRpZnkgJiYgb3B0aW1pemUsXG4gICAgY29tbWVudHM6ICFvcHRpbWl6ZSxcbiAgfSk7XG5cbiAgaWYgKCF0cmFuc2Zvcm1SZXN1bHQgfHwgIXRyYW5zZm9ybVJlc3VsdC5jb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGVycm9yIG9jY3VycmVkIHByb2Nlc3NpbmcgYnVuZGxlIGZvciBcIiR7cGF0aH1cIi5gKTtcbiAgfVxuXG4gIHJldHVybiB0cmFuc2Zvcm1SZXN1bHQuY29kZTtcbn1cbiJdfQ==
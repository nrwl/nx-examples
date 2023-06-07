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
exports.IndexHtmlGenerator = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
const strip_bom_1 = require("../strip-bom");
const augment_index_html_1 = require("./augment-index-html");
const inline_critical_css_1 = require("./inline-critical-css");
const inline_fonts_1 = require("./inline-fonts");
const style_nonce_1 = require("./style-nonce");
class IndexHtmlGenerator {
    constructor(options) {
        this.options = options;
        const extraPlugins = [];
        if (this.options.optimization?.fonts.inline) {
            extraPlugins.push(inlineFontsPlugin(this));
        }
        if (this.options.optimization?.styles.inlineCritical) {
            extraPlugins.push(inlineCriticalCssPlugin(this));
        }
        this.plugins = [
            augmentIndexHtmlPlugin(this),
            ...extraPlugins,
            // Runs after the `extraPlugins` to capture any nonce or
            // `style` tags that might've been added by them.
            addStyleNoncePlugin(),
            postTransformPlugin(this),
        ];
    }
    async process(options) {
        let content = (0, strip_bom_1.stripBom)(await this.readIndex(this.options.indexPath));
        const warnings = [];
        const errors = [];
        for (const plugin of this.plugins) {
            const result = await plugin(content, options);
            if (typeof result === 'string') {
                content = result;
            }
            else {
                content = result.content;
                if (result.warnings.length) {
                    warnings.push(...result.warnings);
                }
                if (result.errors.length) {
                    errors.push(...result.errors);
                }
            }
        }
        return {
            content,
            warnings,
            errors,
        };
    }
    async readAsset(path) {
        return fs.promises.readFile(path, 'utf-8');
    }
    async readIndex(path) {
        return fs.promises.readFile(path, 'utf-8');
    }
}
exports.IndexHtmlGenerator = IndexHtmlGenerator;
function augmentIndexHtmlPlugin(generator) {
    const { deployUrl, crossOrigin, sri = false, entrypoints } = generator.options;
    return async (html, options) => {
        const { lang, baseHref, outputPath = '', files } = options;
        return (0, augment_index_html_1.augmentIndexHtml)({
            html,
            baseHref,
            deployUrl,
            crossOrigin,
            sri,
            lang,
            entrypoints,
            loadOutputFile: (filePath) => generator.readAsset((0, path_1.join)(outputPath, filePath)),
            files,
        });
    };
}
function inlineFontsPlugin({ options }) {
    const inlineFontsProcessor = new inline_fonts_1.InlineFontsProcessor({
        minify: options.optimization?.styles.minify,
    });
    return async (html) => inlineFontsProcessor.process(html);
}
function inlineCriticalCssPlugin(generator) {
    const inlineCriticalCssProcessor = new inline_critical_css_1.InlineCriticalCssProcessor({
        minify: generator.options.optimization?.styles.minify,
        deployUrl: generator.options.deployUrl,
        readAsset: (filePath) => generator.readAsset(filePath),
    });
    return async (html, options) => inlineCriticalCssProcessor.process(html, { outputPath: options.outputPath });
}
function addStyleNoncePlugin() {
    return (html) => (0, style_nonce_1.addStyleNonce)(html);
}
function postTransformPlugin({ options }) {
    return async (html) => (options.postTransform ? options.postTransform(html) : html);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtaHRtbC1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9pbmRleC1maWxlL2luZGV4LWh0bWwtZ2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXlCO0FBQ3pCLCtCQUE0QjtBQUc1Qiw0Q0FBd0M7QUFDeEMsNkRBQWdHO0FBQ2hHLCtEQUFtRTtBQUNuRSxpREFBc0Q7QUFDdEQsK0NBQThDO0FBaUM5QyxNQUFhLGtCQUFrQjtJQUc3QixZQUFxQixPQUFrQztRQUFsQyxZQUFPLEdBQVAsT0FBTyxDQUEyQjtRQUNyRCxNQUFNLFlBQVksR0FBK0IsRUFBRSxDQUFDO1FBQ3BELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUMzQyxZQUFZLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxjQUFjLEVBQUU7WUFDcEQsWUFBWSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNiLHNCQUFzQixDQUFDLElBQUksQ0FBQztZQUM1QixHQUFHLFlBQVk7WUFDZix3REFBd0Q7WUFDeEQsaURBQWlEO1lBQ2pELG1CQUFtQixFQUFFO1lBQ3JCLG1CQUFtQixDQUFDLElBQUksQ0FBQztTQUMxQixDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBeUM7UUFDckQsSUFBSSxPQUFPLEdBQUcsSUFB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LEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztLQUN2RCxDQUFDLENBQUM7SUFFSCxPQUFPLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FDN0IsMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztBQUNqRixDQUFDO0FBRUQsU0FBUyxtQkFBbUI7SUFDMUIsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBQSwyQkFBYSxFQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLEVBQUUsT0FBTyxFQUFzQjtJQUMxRCxPQUFPLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucyB9IGZyb20gJy4uL25vcm1hbGl6ZS1jYWNoZSc7XG5pbXBvcnQgeyBOb3JtYWxpemVkT3B0aW1pemF0aW9uT3B0aW9ucyB9IGZyb20gJy4uL25vcm1hbGl6ZS1vcHRpbWl6YXRpb24nO1xuaW1wb3J0IHsgc3RyaXBCb20gfSBmcm9tICcuLi9zdHJpcC1ib20nO1xuaW1wb3J0IHsgQ3Jvc3NPcmlnaW5WYWx1ZSwgRW50cnlwb2ludCwgRmlsZUluZm8sIGF1Z21lbnRJbmRleEh0bWwgfSBmcm9tICcuL2F1Z21lbnQtaW5kZXgtaHRtbCc7XG5pbXBvcnQgeyBJbmxpbmVDcml0aWNhbENzc1Byb2Nlc3NvciB9IGZyb20gJy4vaW5saW5lLWNyaXRpY2FsLWNzcyc7XG5pbXBvcnQgeyBJbmxpbmVGb250c1Byb2Nlc3NvciB9IGZyb20gJy4vaW5saW5lLWZvbnRzJztcbmltcG9ydCB7IGFkZFN0eWxlTm9uY2UgfSBmcm9tICcuL3N0eWxlLW5vbmNlJztcblxudHlwZSBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW4gPSAoXG4gIGh0bWw6IHN0cmluZyxcbiAgb3B0aW9uczogSW5kZXhIdG1sR2VuZXJhdG9yUHJvY2Vzc09wdGlvbnMsXG4pID0+IFByb21pc2U8c3RyaW5nIHwgSW5kZXhIdG1sVHJhbnNmb3JtUmVzdWx0PjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleEh0bWxHZW5lcmF0b3JQcm9jZXNzT3B0aW9ucyB7XG4gIGxhbmc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgYmFzZUhyZWY6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgb3V0cHV0UGF0aDogc3RyaW5nO1xuICBmaWxlczogRmlsZUluZm9bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmRleEh0bWxHZW5lcmF0b3JPcHRpb25zIHtcbiAgaW5kZXhQYXRoOiBzdHJpbmc7XG4gIGRlcGxveVVybD86IHN0cmluZztcbiAgc3JpPzogYm9vbGVhbjtcbiAgZW50cnlwb2ludHM6IEVudHJ5cG9pbnRbXTtcbiAgcG9zdFRyYW5zZm9ybT86IEluZGV4SHRtbFRyYW5zZm9ybTtcbiAgY3Jvc3NPcmlnaW4/OiBDcm9zc09yaWdpblZhbHVlO1xuICBvcHRpbWl6YXRpb24/OiBOb3JtYWxpemVkT3B0aW1pemF0aW9uT3B0aW9ucztcbiAgY2FjaGU/OiBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucztcbn1cblxuZXhwb3J0IHR5cGUgSW5kZXhIdG1sVHJhbnNmb3JtID0gKGNvbnRlbnQ6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4SHRtbFRyYW5zZm9ybVJlc3VsdCB7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgSW5kZXhIdG1sR2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwbHVnaW5zOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW5bXTtcblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBvcHRpb25zOiBJbmRleEh0bWxHZW5lcmF0b3JPcHRpb25zKSB7XG4gICAgY29uc3QgZXh0cmFQbHVnaW5zOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW5bXSA9IFtdO1xuICAgIGlmICh0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9uPy5mb250cy5pbmxpbmUpIHtcbiAgICAgIGV4dHJhUGx1Z2lucy5wdXNoKGlubGluZUZvbnRzUGx1Z2luKHRoaXMpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLm9wdGltaXphdGlvbj8uc3R5bGVzLmlubGluZUNyaXRpY2FsKSB7XG4gICAgICBleHRyYVBsdWdpbnMucHVzaChpbmxpbmVDcml0aWNhbENzc1BsdWdpbih0aGlzKSk7XG4gICAgfVxuXG4gICAgdGhpcy5wbHVnaW5zID0gW1xuICAgICAgYXVnbWVudEluZGV4SHRtbFBsdWdpbih0aGlzKSxcbiAgICAgIC4uLmV4dHJhUGx1Z2lucyxcbiAgICAgIC8vIFJ1bnMgYWZ0ZXIgdGhlIGBleHRyYVBsdWdpbnNgIHRvIGNhcHR1cmUgYW55IG5vbmNlIG9yXG4gICAgICAvLyBgc3R5bGVgIHRhZ3MgdGhhdCBtaWdodCd2ZSBiZWVuIGFkZGVkIGJ5IHRoZW0uXG4gICAgICBhZGRTdHlsZU5vbmNlUGx1Z2luKCksXG4gICAgICBwb3N0VHJhbnNmb3JtUGx1Z2luKHRoaXMpLFxuICAgIF07XG4gIH1cblxuICBhc3luYyBwcm9jZXNzKG9wdGlvbnM6IEluZGV4SHRtbEdlbmVyYXRvclByb2Nlc3NPcHRpb25zKTogUHJvbWlzZTxJbmRleEh0bWxUcmFuc2Zvcm1SZXN1bHQ+IHtcbiAgICBsZXQgY29udGVudCA9IHN0cmlwQm9tKGF3YWl0IHRoaXMucmVhZEluZGV4KHRoaXMub3B0aW9ucy5pbmRleFBhdGgpKTtcbiAgICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHBsdWdpbiBvZiB0aGlzLnBsdWdpbnMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBsdWdpbihjb250ZW50LCBvcHRpb25zKTtcbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb250ZW50ID0gcmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGVudCA9IHJlc3VsdC5jb250ZW50O1xuXG4gICAgICAgIGlmIChyZXN1bHQud2FybmluZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgd2FybmluZ3MucHVzaCguLi5yZXN1bHQud2FybmluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goLi4ucmVzdWx0LmVycm9ycyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudCxcbiAgICAgIHdhcm5pbmdzLFxuICAgICAgZXJyb3JzLFxuICAgIH07XG4gIH1cblxuICBhc3luYyByZWFkQXNzZXQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZnMucHJvbWlzZXMucmVhZEZpbGUocGF0aCwgJ3V0Zi04Jyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcmVhZEluZGV4KHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGZzLnByb21pc2VzLnJlYWRGaWxlKHBhdGgsICd1dGYtOCcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGF1Z21lbnRJbmRleEh0bWxQbHVnaW4oZ2VuZXJhdG9yOiBJbmRleEh0bWxHZW5lcmF0b3IpOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW4ge1xuICBjb25zdCB7IGRlcGxveVVybCwgY3Jvc3NPcmlnaW4sIHNyaSA9IGZhbHNlLCBlbnRyeXBvaW50cyB9ID0gZ2VuZXJhdG9yLm9wdGlvbnM7XG5cbiAgcmV0dXJuIGFzeW5jIChodG1sLCBvcHRpb25zKSA9PiB7XG4gICAgY29uc3QgeyBsYW5nLCBiYXNlSHJlZiwgb3V0cHV0UGF0aCA9ICcnLCBmaWxlcyB9ID0gb3B0aW9ucztcblxuICAgIHJldHVybiBhdWdtZW50SW5kZXhIdG1sKHtcbiAgICAgIGh0bWwsXG4gICAgICBiYXNlSHJlZixcbiAgICAgIGRlcGxveVVybCxcbiAgICAgIGNyb3NzT3JpZ2luLFxuICAgICAgc3JpLFxuICAgICAgbGFuZyxcbiAgICAgIGVudHJ5cG9pbnRzLFxuICAgICAgbG9hZE91dHB1dEZpbGU6IChmaWxlUGF0aCkgPT4gZ2VuZXJhdG9yLnJlYWRBc3NldChqb2luKG91dHB1dFBhdGgsIGZpbGVQYXRoKSksXG4gICAgICBmaWxlcyxcbiAgICB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaW5saW5lRm9udHNQbHVnaW4oeyBvcHRpb25zIH06IEluZGV4SHRtbEdlbmVyYXRvcik6IEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbiB7XG4gIGNvbnN0IGlubGluZUZvbnRzUHJvY2Vzc29yID0gbmV3IElubGluZUZvbnRzUHJvY2Vzc29yKHtcbiAgICBtaW5pZnk6IG9wdGlvbnMub3B0aW1pemF0aW9uPy5zdHlsZXMubWluaWZ5LFxuICB9KTtcblxuICByZXR1cm4gYXN5bmMgKGh0bWwpID0+IGlubGluZUZvbnRzUHJvY2Vzc29yLnByb2Nlc3MoaHRtbCk7XG59XG5cbmZ1bmN0aW9uIGlubGluZUNyaXRpY2FsQ3NzUGx1Z2luKGdlbmVyYXRvcjogSW5kZXhIdG1sR2VuZXJhdG9yKTogSW5kZXhIdG1sR2VuZXJhdG9yUGx1Z2luIHtcbiAgY29uc3QgaW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3IgPSBuZXcgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3Ioe1xuICAgIG1pbmlmeTogZ2VuZXJhdG9yLm9wdGlvbnMub3B0aW1pemF0aW9uPy5zdHlsZXMubWluaWZ5LFxuICAgIGRlcGxveVVybDogZ2VuZXJhdG9yLm9wdGlvbnMuZGVwbG95VXJsLFxuICAgIHJlYWRBc3NldDogKGZpbGVQYXRoKSA9PiBnZW5lcmF0b3IucmVhZEFzc2V0KGZpbGVQYXRoKSxcbiAgfSk7XG5cbiAgcmV0dXJuIGFzeW5jIChodG1sLCBvcHRpb25zKSA9PlxuICAgIGlubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc29yLnByb2Nlc3MoaHRtbCwgeyBvdXRwdXRQYXRoOiBvcHRpb25zLm91dHB1dFBhdGggfSk7XG59XG5cbmZ1bmN0aW9uIGFkZFN0eWxlTm9uY2VQbHVnaW4oKTogSW5kZXhIdG1sR2VuZXJhdG9yUGx1Z2luIHtcbiAgcmV0dXJuIChodG1sKSA9PiBhZGRTdHlsZU5vbmNlKGh0bWwpO1xufVxuXG5mdW5jdGlvbiBwb3N0VHJhbnNmb3JtUGx1Z2luKHsgb3B0aW9ucyB9OiBJbmRleEh0bWxHZW5lcmF0b3IpOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW4ge1xuICByZXR1cm4gYXN5bmMgKGh0bWwpID0+IChvcHRpb25zLnBvc3RUcmFuc2Zvcm0gPyBvcHRpb25zLnBvc3RUcmFuc2Zvcm0oaHRtbCkgOiBodG1sKTtcbn1cbiJdfQ==
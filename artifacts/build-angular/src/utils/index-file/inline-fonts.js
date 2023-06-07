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
exports.InlineFontsProcessor = void 0;
const cacache = __importStar(require("cacache"));
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const path_1 = require("path");
const url_1 = require("url");
const package_version_1 = require("../package-version");
const html_rewriting_stream_1 = require("./html-rewriting-stream");
const SUPPORTED_PROVIDERS = {
    'fonts.googleapis.com': {
        preconnectUrl: 'https://fonts.gstatic.com',
    },
    'use.typekit.net': {
        preconnectUrl: 'https://use.typekit.net',
    },
};
class InlineFontsProcessor {
    constructor(options) {
        this.options = options;
        const { path: cacheDirectory, enabled } = this.options.cache || {};
        if (cacheDirectory && enabled) {
            this.cachePath = (0, path_1.join)(cacheDirectory, 'angular-build-fonts');
        }
    }
    async process(content) {
        const hrefList = [];
        const existingPreconnect = new Set();
        // Collector link tags with href
        const { rewriter: collectorStream, transformedContent: initCollectorStream } = await (0, html_rewriting_stream_1.htmlRewritingStream)(content);
        collectorStream.on('startTag', (tag) => {
            const { tagName, attrs } = tag;
            if (tagName !== 'link') {
                return;
            }
            let hrefValue;
            let relValue;
            for (const { name, value } of attrs) {
                switch (name) {
                    case 'rel':
                        relValue = value;
                        break;
                    case 'href':
                        hrefValue = value;
                        break;
                }
                if (hrefValue && relValue) {
                    switch (relValue) {
                        case 'stylesheet':
                            // <link rel="stylesheet" href="https://example.com/main.css">
                            hrefList.push(hrefValue);
                            break;
                        case 'preconnect':
                            // <link rel="preconnect" href="https://example.com">
                            existingPreconnect.add(hrefValue.replace(/\/$/, ''));
                            break;
                    }
                    return;
                }
            }
        });
        initCollectorStream().catch(() => {
            // We don't really care about any errors here because it just initializes
            // the rewriting stream, as we are waiting for `finish` below.
        });
        await new Promise((resolve) => collectorStream.on('finish', resolve));
        // Download stylesheets
        const hrefsContent = new Map();
        const newPreconnectUrls = new Set();
        for (const hrefItem of hrefList) {
            const url = this.createNormalizedUrl(hrefItem);
            if (!url) {
                continue;
            }
            const content = await this.processHref(url);
            if (content === undefined) {
                continue;
            }
            hrefsContent.set(hrefItem, content);
            // Add preconnect
            const preconnectUrl = this.getFontProviderDetails(url)?.preconnectUrl;
            if (preconnectUrl && !existingPreconnect.has(preconnectUrl)) {
                newPreconnectUrls.add(preconnectUrl);
            }
        }
        if (hrefsContent.size === 0) {
            return content;
        }
        // Replace link with style tag.
        const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(content);
        rewriter.on('startTag', (tag) => {
            const { tagName, attrs } = tag;
            switch (tagName) {
                case 'head':
                    rewriter.emitStartTag(tag);
                    for (const url of newPreconnectUrls) {
                        rewriter.emitRaw(`<link rel="preconnect" href="${url}" crossorigin>`);
                    }
                    break;
                case 'link':
                    const hrefAttr = attrs.some(({ name, value }) => name === 'rel' && value === 'stylesheet') &&
                        attrs.find(({ name, value }) => name === 'href' && hrefsContent.has(value));
                    if (hrefAttr) {
                        const href = hrefAttr.value;
                        const cssContent = hrefsContent.get(href);
                        rewriter.emitRaw(`<style type="text/css">${cssContent}</style>`);
                    }
                    else {
                        rewriter.emitStartTag(tag);
                    }
                    break;
                default:
                    rewriter.emitStartTag(tag);
                    break;
            }
        });
        return transformedContent();
    }
    async getResponse(url) {
        const key = `${package_version_1.VERSION}|${url}`;
        if (this.cachePath) {
            const entry = await cacache.get.info(this.cachePath, key);
            if (entry) {
                return fs.promises.readFile(entry.path, 'utf8');
            }
        }
        let agent;
        const httpsProxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
        if (httpsProxy) {
            agent = (0, https_proxy_agent_1.default)(httpsProxy);
        }
        const data = await new Promise((resolve, reject) => {
            let rawResponse = '';
            https
                .get(url, {
                agent,
                rejectUnauthorized: false,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                },
            }, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Inlining of fonts failed. ${url} returned status code: ${res.statusCode}.`));
                    return;
                }
                res.on('data', (chunk) => (rawResponse += chunk)).on('end', () => resolve(rawResponse));
            })
                .on('error', (e) => reject(new Error(`Inlining of fonts failed. An error has occurred while retrieving ${url} over the internet.\n` +
                e.message)));
        });
        if (this.cachePath) {
            await cacache.put(this.cachePath, key, data);
        }
        return data;
    }
    async processHref(url) {
        const provider = this.getFontProviderDetails(url);
        if (!provider) {
            return undefined;
        }
        let cssContent = await this.getResponse(url);
        if (this.options.minify) {
            cssContent = cssContent
                // Comments.
                .replace(/\/\*([\s\S]*?)\*\//g, '')
                // New lines.
                .replace(/\n/g, '')
                // Safe spaces.
                .replace(/\s?[{:;]\s+/g, (s) => s.trim());
        }
        return cssContent;
    }
    getFontProviderDetails(url) {
        return SUPPORTED_PROVIDERS[url.hostname];
    }
    createNormalizedUrl(value) {
        // Need to convert '//' to 'https://' because the URL parser will fail with '//'.
        const normalizedHref = value.startsWith('//') ? `https:${value}` : value;
        if (!normalizedHref.startsWith('http')) {
            // Non valid URL.
            // Example: relative path styles.css.
            return undefined;
        }
        const url = new url_1.URL(normalizedHref);
        // Force HTTPS protocol
        url.protocol = 'https:';
        return url;
    }
}
exports.InlineFontsProcessor = InlineFontsProcessor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLWZvbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaW5kZXgtZmlsZS9pbmxpbmUtZm9udHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFDbkMsdUNBQXlCO0FBQ3pCLDZDQUErQjtBQUMvQiwwRUFBMkM7QUFDM0MsK0JBQTRCO0FBQzVCLDZCQUEwQjtBQUUxQix3REFBNkM7QUFDN0MsbUVBQThEO0FBVzlELE1BQU0sbUJBQW1CLEdBQXdDO0lBQy9ELHNCQUFzQixFQUFFO1FBQ3RCLGFBQWEsRUFBRSwyQkFBMkI7S0FDM0M7SUFDRCxpQkFBaUIsRUFBRTtRQUNqQixhQUFhLEVBQUUseUJBQXlCO0tBQ3pDO0NBQ0YsQ0FBQztBQUVGLE1BQWEsb0JBQW9CO0lBRS9CLFlBQW9CLE9BQTJCO1FBQTNCLFlBQU8sR0FBUCxPQUFPLENBQW9CO1FBQzdDLE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNuRSxJQUFJLGNBQWMsSUFBSSxPQUFPLEVBQUU7WUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztTQUM5RDtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQWU7UUFDM0IsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUU3QyxnQ0FBZ0M7UUFDaEMsTUFBTSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQUUs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QUNyQyxPQUFPLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRU8sbUJBQW1CLENBQUMsS0FBYTtRQUN2QyxpRkFBaUY7UUFDakYsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RDLGlCQUFpQjtZQUNqQixxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwQyx1QkFBdUI7UUFDdkIsR0FBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFFeEIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUFuT0Qsb0RBbU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGNhY2FjaGUgZnJvbSAnY2FjYWNoZSc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgcHJveHlBZ2VudCBmcm9tICdodHRwcy1wcm94eS1hZ2VudCc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgTm9ybWFsaXplZENhY2hlZE9wdGlvbnMgfSBmcm9tICcuLi9ub3JtYWxpemUtY2FjaGUnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uL3BhY2thZ2UtdmVyc2lvbic7XG5pbXBvcnQgeyBodG1sUmV3cml0aW5nU3RyZWFtIH0gZnJvbSAnLi9odG1sLXJld3JpdGluZy1zdHJlYW0nO1xuXG5pbnRlcmZhY2UgRm9udFByb3ZpZGVyRGV0YWlscyB7XG4gIHByZWNvbm5lY3RVcmw6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmxpbmVGb250c09wdGlvbnMge1xuICBtaW5pZnk/OiBib29sZWFuO1xuICBjYWNoZT86IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zO1xufVxuXG5jb25zdCBTVVBQT1JURURfUFJPVklERVJTOiBSZWNvcmQ8c3RyaW5nLCBGb250UHJvdmlkZXJEZXRhaWxzPiA9IHtcbiAgJ2ZvbnRzLmdvb2dsZWFwaXMuY29tJzoge1xuICAgIHByZWNvbm5lY3RVcmw6ICdodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tJyxcbiAgfSxcbiAgJ3VzZS50eXBla2l0Lm5ldCc6IHtcbiAgICBwcmVjb25uZWN0VXJsOiAnaHR0cHM6Ly91c2UudHlwZWtpdC5uZXQnLFxuICB9LFxufTtcblxuZXhwb3J0IGNsYXNzIElubGluZUZvbnRzUHJvY2Vzc29yIHtcbiAgcHJpdmF0ZSByZWFkb25seSBjYWNoZVBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBJbmxpbmVGb250c09wdGlvbnMpIHtcbiAgICBjb25zdCB7IHBhdGg6IGNhY2hlRGlyZWN0b3J5LCBlbmFibGVkIH0gPSB0aGlzLm9wdGlvbnMuY2FjaGUgfHwge307XG4gICAgaWYgKGNhY2hlRGlyZWN0b3J5ICYmIGVuYWJsZWQpIHtcbiAgICAgIHRoaXMuY2FjaGVQYXRoID0gam9pbihjYWNoZURpcmVjdG9yeSwgJ2FuZ3VsYXItYnVpbGQtZm9udHMnKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBwcm9jZXNzKGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgaHJlZkxpc3Q6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgZXhpc3RpbmdQcmVjb25uZWN0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAvLyBDb2xsZWN0b3IgbGluayB0YWdzIHdpdGggaHJlZlxuICAgIGNvbnN0IHsgcmV3cml0ZXI6IGNvbGxlY3RvclN0cmVhbSwgdHJhbnNmb3JtZWRDb250ZW50OiBpbml0Q29sbGVjdG9yU3RyZWFtIH0gPVxuICAgICAgYXdhaXQgaHRtbFJld3JpdGluZ1N0cmVhbShjb250ZW50KTtcblxuICAgIGNvbGxlY3RvclN0cmVhbS5vbignc3RhcnRUYWcnLCAodGFnKSA9PiB7XG4gICAgICBjb25zdCB7IHRhZ05hbWUsIGF0dHJzIH0gPSB0YWc7XG5cbiAgICAgIGlmICh0YWdOYW1lICE9PSAnbGluaycpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgaHJlZlZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBsZXQgcmVsVmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGZvciAoY29uc3QgeyBuYW1lLCB2YWx1ZSB9IG9mIGF0dHJzKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgIGNhc2UgJ3JlbCc6XG4gICAgICAgICAgICByZWxWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdocmVmJzpcbiAgICAgICAgICAgIGhyZWZWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaHJlZlZhbHVlICYmIHJlbFZhbHVlKSB7XG4gICAgICAgICAgc3dpdGNoIChyZWxWYWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnc3R5bGVzaGVldCc6XG4gICAgICAgICAgICAgIC8vIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiBocmVmPVwiaHR0cHM6Ly9leGFtcGxlLmNvbS9tYWluLmNzc1wiPlxuICAgICAgICAgICAgICBocmVmTGlzdC5wdXNoKGhyZWZWYWx1ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdwcmVjb25uZWN0JzpcbiAgICAgICAgICAgICAgLy8gPGxpbmsgcmVsPVwicHJlY29ubmVjdFwiIGhyZWY9XCJodHRwczovL2V4YW1wbGUuY29tXCI+XG4gICAgICAgICAgICAgIGV4aXN0aW5nUHJlY29ubmVjdC5hZGQoaHJlZlZhbHVlLnJlcGxhY2UoL1xcLyQvLCAnJykpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGluaXRDb2xsZWN0b3JTdHJlYW0oKS5jYXRjaCgoKSA9PiB7XG4gICAgICAvLyBXZSBkb24ndCByZWFsbHkgY2FyZSBhYm91dCBhbnkgZXJyb3JzIGhlcmUgYmVjYXVzZSBpdCBqdXN0IGluaXRpYWxpemVzXG4gICAgICAvLyB0aGUgcmV3cml0aW5nIHN0cmVhbSwgYXMgd2UgYXJlIHdhaXRpbmcgZm9yIGBmaW5pc2hgIGJlbG93LlxuICAgIH0pO1xuXG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IGNvbGxlY3RvclN0cmVhbS5vbignZmluaXNoJywgcmVzb2x2ZSkpO1xuXG4gICAgLy8gRG93bmxvYWQgc3R5bGVzaGVldHNcbiAgICBjb25zdCBocmVmc0NvbnRlbnQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgIGNvbnN0IG5ld1ByZWNvbm5lY3RVcmxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBmb3IgKGNvbnN0IGhyZWZJdGVtIG9mIGhyZWZMaXN0KSB7XG4gICAgICBjb25zdCB1cmwgPSB0aGlzLmNyZWF0ZU5vcm1hbGl6ZWRVcmwoaHJlZkl0ZW0pO1xuICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnByb2Nlc3NIcmVmKHVybCk7XG4gICAgICBpZiAoY29udGVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBocmVmc0NvbnRlbnQuc2V0KGhyZWZJdGVtLCBjb250ZW50KTtcblxuICAgICAgLy8gQWRkIHByZWNvbm5lY3RcbiAgICAgIGNvbnN0IHByZWNvbm5lY3RVcmwgPSB0aGlzLmdldEZvbnRQcm92aWRlckRldGFpbHModXJsKT8ucHJlY29ubmVjdFVybDtcbiAgICAgIGlmIChwcmVjb25uZWN0VXJsICYmICFleGlzdGluZ1ByZWNvbm5lY3QuaGFzKHByZWNvbm5lY3RVcmwpKSB7XG4gICAgICAgIG5ld1ByZWNvbm5lY3RVcmxzLmFkZChwcmVjb25uZWN0VXJsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaHJlZnNDb250ZW50LnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cblxuICAgIC8vIFJlcGxhY2UgbGluayB3aXRoIHN0eWxlIHRhZy5cbiAgICBjb25zdCB7IHJld3JpdGVyLCB0cmFuc2Zvcm1lZENvbnRlbnQgfSA9IGF3YWl0IGh0bWxSZXdyaXRpbmdTdHJlYW0oY29udGVudCk7XG4gICAgcmV3cml0ZXIub24oJ3N0YXJ0VGFnJywgKHRhZykgPT4ge1xuICAgICAgY29uc3QgeyB0YWdOYW1lLCBhdHRycyB9ID0gdGFnO1xuXG4gICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgY2FzZSAnaGVhZCc6XG4gICAgICAgICAgcmV3cml0ZXIuZW1pdFN0YXJ0VGFnKHRhZyk7XG4gICAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgbmV3UHJlY29ubmVjdFVybHMpIHtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRSYXcoYDxsaW5rIHJlbD1cInByZWNvbm5lY3RcIiBocmVmPVwiJHt1cmx9XCIgY3Jvc3NvcmlnaW4+YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2xpbmsnOlxuICAgICAgICAgIGNvbnN0IGhyZWZBdHRyID1cbiAgICAgICAgICAgIGF0dHJzLnNvbWUoKHsgbmFtZSwgdmFsdWUgfSkgPT4gbmFtZSA9PT0gJ3JlbCcgJiYgdmFsdWUgPT09ICdzdHlsZXNoZWV0JykgJiZcbiAgICAgICAgICAgIGF0dHJzLmZpbmQoKHsgbmFtZSwgdmFsdWUgfSkgPT4gbmFtZSA9PT0gJ2hyZWYnICYmIGhyZWZzQ29udGVudC5oYXModmFsdWUpKTtcbiAgICAgICAgICBpZiAoaHJlZkF0dHIpIHtcbiAgICAgICAgICAgIGNvbnN0IGhyZWYgPSBocmVmQXR0ci52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGNzc0NvbnRlbnQgPSBocmVmc0NvbnRlbnQuZ2V0KGhyZWYpO1xuICAgICAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhgPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPiR7Y3NzQ29udGVudH08L3N0eWxlPmApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcodGFnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcodGFnKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybWVkQ29udGVudCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRSZXNwb25zZSh1cmw6IFVSTCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYCR7VkVSU0lPTn18JHt1cmx9YDtcblxuICAgIGlmICh0aGlzLmNhY2hlUGF0aCkge1xuICAgICAgY29uc3QgZW50cnkgPSBhd2FpdCBjYWNhY2hlLmdldC5pbmZvKHRoaXMuY2FjaGVQYXRoLCBrZXkpO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIHJldHVybiBmcy5wcm9taXNlcy5yZWFkRmlsZShlbnRyeS5wYXRoLCAndXRmOCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBhZ2VudDogcHJveHlBZ2VudC5IdHRwc1Byb3h5QWdlbnQgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgaHR0cHNQcm94eSA9IHByb2Nlc3MuZW52LkhUVFBTX1BST1hZID8/IHByb2Nlc3MuZW52Lmh0dHBzX3Byb3h5O1xuXG4gICAgaWYgKGh0dHBzUHJveHkpIHtcbiAgICAgIGFnZW50ID0gcHJveHlBZ2VudChodHRwc1Byb3h5KTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgcmF3UmVzcG9uc2UgPSAnJztcbiAgICAgIGh0dHBzXG4gICAgICAgIC5nZXQoXG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFnZW50LFxuICAgICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ3VzZXItYWdlbnQnOlxuICAgICAgICAgICAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV82KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvODUuMC40MTgzLjEyMSBTYWZhcmkvNTM3LjM2JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgYElubGluaW5nIG9mIGZvbnRzIGZhaWxlZC4gJHt1cmx9IHJldHVybmVkIHN0YXR1cyBjb2RlOiAke3Jlcy5zdGF0dXNDb2RlfS5gLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMub24oJ2RhdGEnLCAoY2h1bmspID0+IChyYXdSZXNwb25zZSArPSBjaHVuaykpLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKHJhd1Jlc3BvbnNlKSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgKVxuICAgICAgICAub24oJ2Vycm9yJywgKGUpID0+XG4gICAgICAgICAgcmVqZWN0KFxuICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgSW5saW5pbmcgb2YgZm9udHMgZmFpbGVkLiBBbiBlcnJvciBoYXMgb2NjdXJyZWQgd2hpbGUgcmV0cmlldmluZyAke3VybH0gb3ZlciB0aGUgaW50ZXJuZXQuXFxuYCArXG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuY2FjaGVQYXRoKSB7XG4gICAgICBhd2FpdCBjYWNhY2hlLnB1dCh0aGlzLmNhY2hlUGF0aCwga2V5LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0hyZWYodXJsOiBVUkwpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gdGhpcy5nZXRGb250UHJvdmlkZXJEZXRhaWxzKHVybCk7XG4gICAgaWYgKCFwcm92aWRlcikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgY3NzQ29udGVudCA9IGF3YWl0IHRoaXMuZ2V0UmVzcG9uc2UodXJsKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubWluaWZ5KSB7XG4gICAgICBjc3NDb250ZW50ID0gY3NzQ29udGVudFxuICAgICAgICAvLyBDb21tZW50cy5cbiAgICAgICAgLnJlcGxhY2UoL1xcL1xcKihbXFxzXFxTXSo/KVxcKlxcLy9nLCAnJylcbiAgICAgICAgLy8gTmV3IGxpbmVzLlxuICAgICAgICAucmVwbGFjZSgvXFxuL2csICcnKVxuICAgICAgICAvLyBTYWZlIHNwYWNlcy5cbiAgICAgICAgLnJlcGxhY2UoL1xccz9bezo7XVxccysvZywgKHMpID0+IHMudHJpbSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3NzQ29udGVudDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Rm9udFByb3ZpZGVyRGV0YWlscyh1cmw6IFVSTCk6IEZvbnRQcm92aWRlckRldGFpbHMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBTVVBQT1JURURfUFJPVklERVJTW3VybC5ob3N0bmFtZV07XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU5vcm1hbGl6ZWRVcmwodmFsdWU6IHN0cmluZyk6IFVSTCB8IHVuZGVmaW5lZCB7XG4gICAgLy8gTmVlZCB0byBjb252ZXJ0ICcvLycgdG8gJ2h0dHBzOi8vJyBiZWNhdXNlIHRoZSBVUkwgcGFyc2VyIHdpbGwgZmFpbCB3aXRoICcvLycuXG4gICAgY29uc3Qgbm9ybWFsaXplZEhyZWYgPSB2YWx1ZS5zdGFydHNXaXRoKCcvLycpID8gYGh0dHBzOiR7dmFsdWV9YCA6IHZhbHVlO1xuICAgIGlmICghbm9ybWFsaXplZEhyZWYuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XG4gICAgICAvLyBOb24gdmFsaWQgVVJMLlxuICAgICAgLy8gRXhhbXBsZTogcmVsYXRpdmUgcGF0aCBzdHlsZXMuY3NzLlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKG5vcm1hbGl6ZWRIcmVmKTtcbiAgICAvLyBGb3JjZSBIVFRQUyBwcm90b2NvbFxuICAgIHVybC5wcm90b2NvbCA9ICdodHRwczonO1xuXG4gICAgcmV0dXJuIHVybDtcbiAgfVxufVxuIl19
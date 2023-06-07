"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.augmentIndexHtml = void 0;
const crypto_1 = require("crypto");
const load_esm_1 = require("../load-esm");
const html_rewriting_stream_1 = require("./html-rewriting-stream");
/*
 * Helper function used by the IndexHtmlWebpackPlugin.
 * Can also be directly used by builder, e. g. in order to generate an index.html
 * after processing several configurations in order to build different sets of
 * bundles for differential serving.
 */
async function augmentIndexHtml(params) {
    const { loadOutputFile, files, entrypoints, sri, deployUrl = '', lang, baseHref, html } = params;
    const warnings = [];
    const errors = [];
    let { crossOrigin = 'none' } = params;
    if (sri && crossOrigin === 'none') {
        crossOrigin = 'anonymous';
    }
    const stylesheets = new Set();
    const scripts = new Map();
    // Sort files in the order we want to insert them by entrypoint
    for (const [entrypoint, isModule] of entrypoints) {
        for (const { extension, file, name } of files) {
            if (name !== entrypoint || scripts.has(file) || stylesheets.has(file)) {
                continue;
            }
            switch (extension) {
                case '.js':
                    // Also, non entrypoints need to be loaded as no module as they can contain problematic code.
                    scripts.set(file, isModule);
                    break;
                case '.mjs':
                    if (!isModule) {
                        // It would be very confusing to link an `*.mjs` file in a non-module script context,
                        // so we disallow it entirely.
                        throw new Error('`.mjs` files *must* set `isModule` to `true`.');
                    }
                    scripts.set(file, true /* isModule */);
                    break;
                case '.css':
                    stylesheets.add(file);
                    break;
            }
        }
    }
    let scriptTags = [];
    for (const [src, isModule] of scripts) {
        const attrs = [`src="${deployUrl}${src}"`];
        // This is also need for non entry-points as they may contain problematic code.
        if (isModule) {
            attrs.push('type="module"');
        }
        else {
            attrs.push('defer');
        }
        if (crossOrigin !== 'none') {
            attrs.push(`crossorigin="${crossOrigin}"`);
        }
        if (sri) {
            const content = await loadOutputFile(src);
            attrs.push(generateSriAttributes(content));
        }
        scriptTags.push(`<script ${attrs.join(' ')}></script>`);
    }
    let linkTags = [];
    for (const src of stylesheets) {
        const attrs = [`rel="stylesheet"`, `href="${deployUrl}${src}"`];
        if (crossOrigin !== 'none') {
            attrs.push(`crossorigin="${crossOrigin}"`);
        }
        if (sri) {
            const content = await loadOutputFile(src);
            attrs.push(generateSriAttributes(content));
        }
        linkTags.push(`<link ${attrs.join(' ')}>`);
    }
    const dir = lang ? await getLanguageDirection(lang, warnings) : undefined;
    const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(html);
    const baseTagExists = html.includes('<base');
    rewriter
        .on('startTag', (tag) => {
        switch (tag.tagName) {
            case 'html':
                // Adjust document locale if specified
                if (isString(lang)) {
                    updateAttribute(tag, 'lang', lang);
                }
                if (dir) {
                    updateAttribute(tag, 'dir', dir);
                }
                break;
            case 'head':
                // Base href should be added before any link, meta tags
                if (!baseTagExists && isString(baseHref)) {
                    rewriter.emitStartTag(tag);
                    rewriter.emitRaw(`<base href="${baseHref}">`);
                    return;
                }
                break;
            case 'base':
                // Adjust base href if specified
                if (isString(baseHref)) {
                    updateAttribute(tag, 'href', baseHref);
                }
                break;
        }
        rewriter.emitStartTag(tag);
    })
        .on('endTag', (tag) => {
        switch (tag.tagName) {
            case 'head':
                for (const linkTag of linkTags) {
                    rewriter.emitRaw(linkTag);
                }
                linkTags = [];
                break;
            case 'body':
                // Add script tags
                for (const scriptTag of scriptTags) {
                    rewriter.emitRaw(scriptTag);
                }
                scriptTags = [];
                break;
        }
        rewriter.emitEndTag(tag);
    });
    const content = await transformedContent();
    return {
        content: linkTags.length || scriptTags.length
            ? // In case no body/head tags are not present (dotnet partial templates)
                linkTags.join('') + scriptTags.join('') + content
            : content,
        warnings,
        errors,
    };
}
exports.augmentIndexHtml = augmentIndexHtml;
function generateSriAttributes(content) {
    const algo = 'sha384';
    const hash = (0, crypto_1.createHash)(algo).update(content, 'utf8').digest('base64');
    return `integrity="${algo}-${hash}"`;
}
function updateAttribute(tag, name, value) {
    const index = tag.attrs.findIndex((a) => a.name === name);
    const newValue = { name, value };
    if (index === -1) {
        tag.attrs.push(newValue);
    }
    else {
        tag.attrs[index] = newValue;
    }
}
function isString(value) {
    return typeof value === 'string';
}
async function getLanguageDirection(locale, warnings) {
    const dir = await getLanguageDirectionFromLocales(locale);
    if (!dir) {
        warnings.push(`Locale data for '${locale}' cannot be found. 'dir' attribute will not be set for this locale.`);
    }
    return dir;
}
async function getLanguageDirectionFromLocales(locale) {
    try {
        const localeData = (await (0, load_esm_1.loadEsmModule)(`@angular/common/locales/${locale}`)).default;
        const dir = localeData[localeData.length - 2];
        return isString(dir) ? dir : undefined;
    }
    catch {
        // In some cases certain locales might map to files which are named only with language id.
        // Example: `en-US` -> `en`.
        const [languageId] = locale.split('-', 1);
        if (languageId !== locale) {
            return getLanguageDirectionFromLocales(languageId);
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVnbWVudC1pbmRleC1odG1sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaW5kZXgtZmlsZS9hdWdtZW50LWluZGV4LWh0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsbUNBQW9DO0FBQ3BDLDBDQUE0QztBQUM1QyxtRUFBOEQ7QUFxQzlEOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLGdCQUFnQixDQUNwQyxNQUErQjtJQUUvQixNQUFNLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFFakcsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO0lBQzlCLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztJQUU1QixJQUFJLEVBQUUsV0FBVyxHQUFHLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUN0QyxJQUFJLEdBQUcsSUFBSSxXQUFXLEtBQUssTUFBTSxFQUFFO1FBQ2pDLFdBQVcsR0FBRyxXQUFXLENBQUM7S0FDM0I7SUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFvRCxDQUFDO0lBRTVFLCtEQUErRDtJQUMvRCxLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLElBQUksV0FBVyxFQUFFO1FBQ2hELEtBQUssTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksS0FBSyxFQUFFO1lBQzdDLElBQUksSUFBSSxLQUFLLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJ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LENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBsb2FkRXNtTW9kdWxlIH0gZnJvbSAnLi4vbG9hZC1lc20nO1xuaW1wb3J0IHsgaHRtbFJld3JpdGluZ1N0cmVhbSB9IGZyb20gJy4vaHRtbC1yZXdyaXRpbmctc3RyZWFtJztcblxuZXhwb3J0IHR5cGUgTG9hZE91dHB1dEZpbGVGdW5jdGlvblR5cGUgPSAoZmlsZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG5cbmV4cG9ydCB0eXBlIENyb3NzT3JpZ2luVmFsdWUgPSAnbm9uZScgfCAnYW5vbnltb3VzJyB8ICd1c2UtY3JlZGVudGlhbHMnO1xuXG5leHBvcnQgdHlwZSBFbnRyeXBvaW50ID0gW25hbWU6IHN0cmluZywgaXNNb2R1bGU6IGJvb2xlYW5dO1xuXG5leHBvcnQgaW50ZXJmYWNlIEF1Z21lbnRJbmRleEh0bWxPcHRpb25zIHtcbiAgLyogSW5wdXQgY29udGVudHMgKi9cbiAgaHRtbDogc3RyaW5nO1xuICBiYXNlSHJlZj86IHN0cmluZztcbiAgZGVwbG95VXJsPzogc3RyaW5nO1xuICBzcmk6IGJvb2xlYW47XG4gIC8qKiBjcm9zc29yaWdpbiBhdHRyaWJ1dGUgc2V0dGluZyBvZiBlbGVtZW50cyB0aGF0IHByb3ZpZGUgQ09SUyBzdXBwb3J0ICovXG4gIGNyb3NzT3JpZ2luPzogQ3Jvc3NPcmlnaW5WYWx1ZTtcbiAgLypcbiAgICogRmlsZXMgZW1pdHRlZCBieSB0aGUgYnVpbGQuXG4gICAqL1xuICBmaWxlczogRmlsZUluZm9bXTtcbiAgLypcbiAgICogRnVuY3Rpb24gdGhhdCBsb2FkcyBhIGZpbGUgdXNlZC5cbiAgICogVGhpcyBhbGxvd3MgdXMgdG8gdXNlIGRpZmZlcmVudCByb3V0aW5lcyB3aXRoaW4gdGhlIEluZGV4SHRtbFdlYnBhY2tQbHVnaW4gYW5kXG4gICAqIHdoZW4gdXNlZCB3aXRob3V0IHRoaXMgcGx1Z2luLlxuICAgKi9cbiAgbG9hZE91dHB1dEZpbGU6IExvYWRPdXRwdXRGaWxlRnVuY3Rpb25UeXBlO1xuICAvKiogVXNlZCB0byBzb3J0IHRoZSBpbnNlcmF0aW9uIG9mIGZpbGVzIGluIHRoZSBIVE1MIGZpbGUgKi9cbiAgZW50cnlwb2ludHM6IEVudHJ5cG9pbnRbXTtcbiAgLyoqIFVzZWQgdG8gc2V0IHRoZSBkb2N1bWVudCBkZWZhdWx0IGxvY2FsZSAqL1xuICBsYW5nPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVJbmZvIHtcbiAgZmlsZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGV4dGVuc2lvbjogc3RyaW5nO1xufVxuLypcbiAqIEhlbHBlciBmdW5jdGlvbiB1c2VkIGJ5IHRoZSBJbmRleEh0bWxXZWJwYWNrUGx1Z2luLlxuICogQ2FuIGFsc28gYmUgZGlyZWN0bHkgdXNlZCBieSBidWlsZGVyLCBlLiBnLiBpbiBvcmRlciB0byBnZW5lcmF0ZSBhbiBpbmRleC5odG1sXG4gKiBhZnRlciBwcm9jZXNzaW5nIHNldmVyYWwgY29uZmlndXJhdGlvbnMgaW4gb3JkZXIgdG8gYnVpbGQgZGlmZmVyZW50IHNldHMgb2ZcbiAqIGJ1bmRsZXMgZm9yIGRpZmZlcmVudGlhbCBzZXJ2aW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXVnbWVudEluZGV4SHRtbChcbiAgcGFyYW1zOiBBdWdtZW50SW5kZXhIdG1sT3B0aW9ucyxcbik6IFByb21pc2U8eyBjb250ZW50OiBzdHJpbmc7IHdhcm5pbmdzOiBzdHJpbmdbXTsgZXJyb3JzOiBzdHJpbmdbXSB9PiB7XG4gIGNvbnN0IHsgbG9hZE91dHB1dEZpbGUsIGZpbGVzLCBlbnRyeXBvaW50cywgc3JpLCBkZXBsb3lVcmwgPSAnJywgbGFuZywgYmFzZUhyZWYsIGh0bWwgfSA9IHBhcmFtcztcblxuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCB7IGNyb3NzT3JpZ2luID0gJ25vbmUnIH0gPSBwYXJhbXM7XG4gIGlmIChzcmkgJiYgY3Jvc3NPcmlnaW4gPT09ICdub25lJykge1xuICAgIGNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG4gIH1cblxuICBjb25zdCBzdHlsZXNoZWV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzY3JpcHRzID0gbmV3IE1hcDwvKiogZmlsZSBuYW1lICovIHN0cmluZywgLyoqIGlzTW9kdWxlICovIGJvb2xlYW4+KCk7XG5cbiAgLy8gU29ydCBmaWxlcyBpbiB0aGUgb3JkZXIgd2Ugd2FudCB0byBpbnNlcnQgdGhlbSBieSBlbnRyeXBvaW50XG4gIGZvciAoY29uc3QgW2VudHJ5cG9pbnQsIGlzTW9kdWxlXSBvZiBlbnRyeXBvaW50cykge1xuICAgIGZvciAoY29uc3QgeyBleHRlbnNpb24sIGZpbGUsIG5hbWUgfSBvZiBmaWxlcykge1xuICAgICAgaWYgKG5hbWUgIT09IGVudHJ5cG9pbnQgfHwgc2NyaXB0cy5oYXMoZmlsZSkgfHwgc3R5bGVzaGVldHMuaGFzKGZpbGUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGV4dGVuc2lvbikge1xuICAgICAgICBjYXNlICcuanMnOlxuICAgICAgICAgIC8vIEFsc28sIG5vbiBlbnRyeXBvaW50cyBuZWVkIHRvIGJlIGxvYWRlZCBhcyBubyBtb2R1bGUgYXMgdGhleSBjYW4gY29udGFpbiBwcm9ibGVtYXRpYyBjb2RlLlxuICAgICAgICAgIHNjcmlwdHMuc2V0KGZpbGUsIGlzTW9kdWxlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLm1qcyc6XG4gICAgICAgICAgaWYgKCFpc01vZHVsZSkge1xuICAgICAgICAgICAgLy8gSXQgd291bGQgYmUgdmVyeSBjb25mdXNpbmcgdG8gbGluayBhbiBgKi5tanNgIGZpbGUgaW4gYSBub24tbW9kdWxlIHNjcmlwdCBjb250ZXh0LFxuICAgICAgICAgICAgLy8gc28gd2UgZGlzYWxsb3cgaXQgZW50aXJlbHkuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2AubWpzYCBmaWxlcyAqbXVzdCogc2V0IGBpc01vZHVsZWAgdG8gYHRydWVgLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzY3JpcHRzLnNldChmaWxlLCB0cnVlIC8qIGlzTW9kdWxlICovKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLmNzcyc6XG4gICAgICAgICAgc3R5bGVzaGVldHMuYWRkKGZpbGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBzY3JpcHRUYWdzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtzcmMsIGlzTW9kdWxlXSBvZiBzY3JpcHRzKSB7XG4gICAgY29uc3QgYXR0cnMgPSBbYHNyYz1cIiR7ZGVwbG95VXJsfSR7c3JjfVwiYF07XG5cbiAgICAvLyBUaGlzIGlzIGFsc28gbmVlZCBmb3Igbm9uIGVudHJ5LXBvaW50cyBhcyB0aGV5IG1heSBjb250YWluIHByb2JsZW1hdGljIGNvZGUuXG4gICAgaWYgKGlzTW9kdWxlKSB7XG4gICAgICBhdHRycy5wdXNoKCd0eXBlPVwibW9kdWxlXCInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0cnMucHVzaCgnZGVmZXInKTtcbiAgICB9XG5cbiAgICBpZiAoY3Jvc3NPcmlnaW4gIT09ICdub25lJykge1xuICAgICAgYXR0cnMucHVzaChgY3Jvc3NvcmlnaW49XCIke2Nyb3NzT3JpZ2lufVwiYCk7XG4gICAgfVxuXG4gICAgaWYgKHNyaSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGxvYWRPdXRwdXRGaWxlKHNyYyk7XG4gICAgICBhdHRycy5wdXNoKGdlbmVyYXRlU3JpQXR0cmlidXRlcyhjb250ZW50KSk7XG4gICAgfVxuXG4gICAgc2NyaXB0VGFncy5wdXNoKGA8c2NyaXB0ICR7YXR0cnMuam9pbignICcpfT48L3NjcmlwdD5gKTtcbiAgfVxuXG4gIGxldCBsaW5rVGFnczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBzcmMgb2Ygc3R5bGVzaGVldHMpIHtcbiAgICBjb25zdCBhdHRycyA9IFtgcmVsPVwic3R5bGVzaGVldFwiYCwgYGhyZWY9XCIke2RlcGxveVVybH0ke3NyY31cImBdO1xuXG4gICAgaWYgKGNyb3NzT3JpZ2luICE9PSAnbm9uZScpIHtcbiAgICAgIGF0dHJzLnB1c2goYGNyb3Nzb3JpZ2luPVwiJHtjcm9zc09yaWdpbn1cImApO1xuICAgIH1cblxuICAgIGlmIChzcmkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBsb2FkT3V0cHV0RmlsZShzcmMpO1xuICAgICAgYXR0cnMucHVzaChnZW5lcmF0ZVNyaUF0dHJpYnV0ZXMoY29udGVudCkpO1xuICAgIH1cblxuICAgIGxpbmtUYWdzLnB1c2goYDxsaW5rICR7YXR0cnMuam9pbignICcpfT5gKTtcbiAgfVxuXG4gIGNvbnN0IGRpciA9IGxhbmcgPyBhd2FpdCBnZXRMYW5ndWFnZURpcmVjdGlvbihsYW5nLCB3YXJuaW5ncykgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IHsgcmV3cml0ZXIsIHRyYW5zZm9ybWVkQ29udGVudCB9ID0gYXdhaXQgaHRtbFJld3JpdGluZ1N0cmVhbShodG1sKTtcbiAgY29uc3QgYmFzZVRhZ0V4aXN0cyA9IGh0bWwuaW5jbHVkZXMoJzxiYXNlJyk7XG5cbiAgcmV3cml0ZXJcbiAgICAub24oJ3N0YXJ0VGFnJywgKHRhZykgPT4ge1xuICAgICAgc3dpdGNoICh0YWcudGFnTmFtZSkge1xuICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICAvLyBBZGp1c3QgZG9jdW1lbnQgbG9jYWxlIGlmIHNwZWNpZmllZFxuICAgICAgICAgIGlmIChpc1N0cmluZyhsYW5nKSkge1xuICAgICAgICAgICAgdXBkYXRlQXR0cmlidXRlKHRhZywgJ2xhbmcnLCBsYW5nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgICB1cGRhdGVBdHRyaWJ1dGUodGFnLCAnZGlyJywgZGlyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2hlYWQnOlxuICAgICAgICAgIC8vIEJhc2UgaHJlZiBzaG91bGQgYmUgYWRkZWQgYmVmb3JlIGFueSBsaW5rLCBtZXRhIHRhZ3NcbiAgICAgICAgICBpZiAoIWJhc2VUYWdFeGlzdHMgJiYgaXNTdHJpbmcoYmFzZUhyZWYpKSB7XG4gICAgICAgICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcodGFnKTtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRSYXcoYDxiYXNlIGhyZWY9XCIke2Jhc2VIcmVmfVwiPmApO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiYXNlJzpcbiAgICAgICAgICAvLyBBZGp1c3QgYmFzZSBocmVmIGlmIHNwZWNpZmllZFxuICAgICAgICAgIGlmIChpc1N0cmluZyhiYXNlSHJlZikpIHtcbiAgICAgICAgICAgIHVwZGF0ZUF0dHJpYnV0ZSh0YWcsICdocmVmJywgYmFzZUhyZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdFN0YXJ0VGFnKHRhZyk7XG4gICAgfSlcbiAgICAub24oJ2VuZFRhZycsICh0YWcpID0+IHtcbiAgICAgIHN3aXRjaCAodGFnLnRhZ05hbWUpIHtcbiAgICAgICAgY2FzZSAnaGVhZCc6XG4gICAgICAgICAgZm9yIChjb25zdCBsaW5rVGFnIG9mIGxpbmtUYWdzKSB7XG4gICAgICAgICAgICByZXdyaXRlci5lbWl0UmF3KGxpbmtUYWcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbmtUYWdzID0gW107XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JvZHknOlxuICAgICAgICAgIC8vIEFkZCBzY3JpcHQgdGFnc1xuICAgICAgICAgIGZvciAoY29uc3Qgc2NyaXB0VGFnIG9mIHNjcmlwdFRhZ3MpIHtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRSYXcoc2NyaXB0VGFnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzY3JpcHRUYWdzID0gW107XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJld3JpdGVyLmVtaXRFbmRUYWcodGFnKTtcbiAgICB9KTtcblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgdHJhbnNmb3JtZWRDb250ZW50KCk7XG5cbiAgcmV0dXJuIHtcbiAgICBjb250ZW50OlxuICAgICAgbGlua1RhZ3MubGVuZ3RoIHx8IHNjcmlwdFRhZ3MubGVuZ3RoXG4gICAgICAgID8gLy8gSW4gY2FzZSBubyBib2R5L2hlYWQgdGFncyBhcmUgbm90IHByZXNlbnQgKGRvdG5ldCBwYXJ0aWFsIHRlbXBsYXRlcylcbiAgICAgICAgICBsaW5rVGFncy5qb2luKCcnKSArIHNjcmlwdFRhZ3Muam9pbignJykgKyBjb250ZW50XG4gICAgICAgIDogY29udGVudCxcbiAgICB3YXJuaW5ncyxcbiAgICBlcnJvcnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3JpQXR0cmlidXRlcyhjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBhbGdvID0gJ3NoYTM4NCc7XG4gIGNvbnN0IGhhc2ggPSBjcmVhdGVIYXNoKGFsZ28pLnVwZGF0ZShjb250ZW50LCAndXRmOCcpLmRpZ2VzdCgnYmFzZTY0Jyk7XG5cbiAgcmV0dXJuIGBpbnRlZ3JpdHk9XCIke2FsZ299LSR7aGFzaH1cImA7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJpYnV0ZShcbiAgdGFnOiB7IGF0dHJzOiB7IG5hbWU6IHN0cmluZzsgdmFsdWU6IHN0cmluZyB9W10gfSxcbiAgbmFtZTogc3RyaW5nLFxuICB2YWx1ZTogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gdGFnLmF0dHJzLmZpbmRJbmRleCgoYSkgPT4gYS5uYW1lID09PSBuYW1lKTtcbiAgY29uc3QgbmV3VmFsdWUgPSB7IG5hbWUsIHZhbHVlIH07XG5cbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHRhZy5hdHRycy5wdXNoKG5ld1ZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICB0YWcuYXR0cnNbaW5kZXhdID0gbmV3VmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VEaXJlY3Rpb24oXG4gIGxvY2FsZTogc3RyaW5nLFxuICB3YXJuaW5nczogc3RyaW5nW10sXG4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICBjb25zdCBkaXIgPSBhd2FpdCBnZXRMYW5ndWFnZURpcmVjdGlvbkZyb21Mb2NhbGVzKGxvY2FsZSk7XG5cbiAgaWYgKCFkaXIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgYExvY2FsZSBkYXRhIGZvciAnJHtsb2NhbGV9JyBjYW5ub3QgYmUgZm91bmQuICdkaXInIGF0dHJpYnV0ZSB3aWxsIG5vdCBiZSBzZXQgZm9yIHRoaXMgbG9jYWxlLmAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBkaXI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldExhbmd1YWdlRGlyZWN0aW9uRnJvbUxvY2FsZXMobG9jYWxlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGxvY2FsZURhdGEgPSAoXG4gICAgICBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbW1vbi9sb2NhbGVzL2VuJyk+KFxuICAgICAgICBgQGFuZ3VsYXIvY29tbW9uL2xvY2FsZXMvJHtsb2NhbGV9YCxcbiAgICAgIClcbiAgICApLmRlZmF1bHQ7XG5cbiAgICBjb25zdCBkaXIgPSBsb2NhbGVEYXRhW2xvY2FsZURhdGEubGVuZ3RoIC0gMl07XG5cbiAgICByZXR1cm4gaXNTdHJpbmcoZGlyKSA/IGRpciA6IHVuZGVmaW5lZDtcbiAgfSBjYXRjaCB7XG4gICAgLy8gSW4gc29tZSBjYXNlcyBjZXJ0YWluIGxvY2FsZXMgbWlnaHQgbWFwIHRvIGZpbGVzIHdoaWNoIGFyZSBuYW1lZCBvbmx5IHdpdGggbGFuZ3VhZ2UgaWQuXG4gICAgLy8gRXhhbXBsZTogYGVuLVVTYCAtPiBgZW5gLlxuICAgIGNvbnN0IFtsYW5ndWFnZUlkXSA9IGxvY2FsZS5zcGxpdCgnLScsIDEpO1xuICAgIGlmIChsYW5ndWFnZUlkICE9PSBsb2NhbGUpIHtcbiAgICAgIHJldHVybiBnZXRMYW5ndWFnZURpcmVjdGlvbkZyb21Mb2NhbGVzKGxhbmd1YWdlSWQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=
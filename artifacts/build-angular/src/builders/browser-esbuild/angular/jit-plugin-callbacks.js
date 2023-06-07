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
exports.setupJitPluginCallbacks = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const bundle_options_1 = require("../stylesheets/bundle-options");
const uri_1 = require("./uri");
/**
 * Loads/extracts the contents from a load callback Angular JIT entry.
 * An Angular JIT entry represents either a file path for a component resource or base64
 * encoded data for an inline component resource.
 * @param entry The value that represents content to load.
 * @param root The absolute path for the root of the build (typically the workspace root).
 * @param skipRead If true, do not attempt to read the file; if false, read file content from disk.
 * This option has no effect if the entry does not originate from a file. Defaults to false.
 * @returns An object containing the absolute path of the contents and optionally the actual contents.
 * For inline entries the contents will always be provided.
 */
async function loadEntry(entry, root, skipRead) {
    if (entry.startsWith('file:')) {
        const specifier = node_path_1.default.join(root, entry.slice(5));
        return {
            path: specifier,
            contents: skipRead ? undefined : await (0, promises_1.readFile)(specifier, 'utf-8'),
        };
    }
    else if (entry.startsWith('inline:')) {
        const [importer, data] = entry.slice(7).split(';', 2);
        return {
            path: node_path_1.default.join(root, importer),
            contents: Buffer.from(data, 'base64').toString(),
        };
    }
    else {
        throw new Error('Invalid data for Angular JIT entry.');
    }
}
/**
 * Sets up esbuild resolve and load callbacks to support Angular JIT mode processing
 * for both Component stylesheets and templates. These callbacks work alongside the JIT
 * resource TypeScript transformer to convert and then bundle Component resources as
 * static imports.
 * @param build An esbuild {@link PluginBuild} instance used to add callbacks.
 * @param styleOptions The options to use when bundling stylesheets.
 * @param stylesheetResourceFiles An array where stylesheet resources will be added.
 */
function setupJitPluginCallbacks(build, styleOptions, stylesheetResourceFiles, cache) {
    const root = build.initialOptions.absWorkingDir ?? '';
    // Add a resolve callback to capture and parse any JIT URIs that were added by the
    // JIT resource TypeScript transformer.
    // Resources originating from a file are resolved as relative from the containing file (importer).
    build.onResolve({ filter: uri_1.JIT_NAMESPACE_REGEXP }, (args) => {
        const parsed = (0, uri_1.parseJitUri)(args.path);
        if (!parsed) {
            return undefined;
        }
        const { namespace, origin, specifier } = parsed;
        if (origin === 'file') {
            return {
                // Use a relative path to prevent fully resolved paths in the metafile (JSON stats file).
                // This is only necessary for custom namespaces. esbuild will handle the file namespace.
                path: 'file:' + node_path_1.default.relative(root, node_path_1.default.join(node_path_1.default.dirname(args.importer), specifier)),
                namespace,
            };
        }
        else {
            // Inline data may need the importer to resolve imports/references within the content
            const importer = node_path_1.default.relative(root, args.importer);
            return {
                path: `inline:${importer};${specifier}`,
                namespace,
            };
        }
    });
    // Add a load callback to handle Component stylesheets (both inline and external)
    build.onLoad({ filter: /./, namespace: uri_1.JIT_STYLE_NAMESPACE }, async (args) => {
        // skipRead is used here because the stylesheet bundling will read a file stylesheet
        // directly either via a preprocessor or esbuild itself.
        const entry = await loadEntry(args.path, root, true /* skipRead */);
        const { contents, resourceFiles, errors, warnings } = await (0, bundle_options_1.bundleComponentStylesheet)(styleOptions.inlineStyleLanguage, 
        // The `data` parameter is only needed for a stylesheet if it was inline
        entry.contents ?? '', entry.path, entry.contents !== undefined, styleOptions, cache);
        stylesheetResourceFiles.push(...resourceFiles);
        return {
            errors,
            warnings,
            contents,
            loader: 'text',
        };
    });
    // Add a load callback to handle Component templates
    // NOTE: While this callback supports both inline and external templates, the transformer
    // currently only supports generating URIs for external templates.
    build.onLoad({ filter: /./, namespace: uri_1.JIT_TEMPLATE_NAMESPACE }, async (args) => {
        const { contents } = await loadEntry(args.path, root);
        return {
            contents,
            loader: 'text',
        };
    });
}
exports.setupJitPluginCallbacks = setupJitPluginCallbacks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaml0LXBsdWdpbi1jYWxsYmFja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvYW5ndWxhci9qaXQtcGx1Z2luLWNhbGxiYWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFHSCwrQ0FBNEM7QUFDNUMsMERBQTZCO0FBRTdCLGtFQUFtRztBQUNuRywrQkFLZTtBQUVmOzs7Ozs7Ozs7O0dBVUc7QUFDSCxLQUFLLFVBQVUsU0FBUyxDQUN0QixLQUFhLEVBQ2IsSUFBWSxFQUNaLFFBQWtCO0lBRWxCLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM3QixNQUFNLFNBQVMsR0FBRyxtQkFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWxELE9BQU87WUFDTCxJQUFJLEVBQUUsU0FBUztZQUNmLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFBLG1CQUFRLEVBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztTQUNwRSxDQUFDO0tBQ0g7U0FBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDdEMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdEQsT0FBTztZQUNMLElBQUksRUFBRSxtQkFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO1lBQy9CLFFBQVEsRUFBRSxNQUFNLENBQUMs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QUMsQ0FBQztRQUV0RCxPQUFPO1lBQ0wsUUFBUTtZQUNSLE1BQU0sRUFBRSxNQUFNO1NBQ2YsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQTFFRCwwREEwRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBPdXRwdXRGaWxlLCBQbHVnaW5CdWlsZCB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBMb2FkUmVzdWx0Q2FjaGUgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQgeyBCdW5kbGVTdHlsZXNoZWV0T3B0aW9ucywgYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldCB9IGZyb20gJy4uL3N0eWxlc2hlZXRzL2J1bmRsZS1vcHRpb25zJztcbmltcG9ydCB7XG4gIEpJVF9OQU1FU1BBQ0VfUkVHRVhQLFxuICBKSVRfU1RZTEVfTkFNRVNQQUNFLFxuICBKSVRfVEVNUExBVEVfTkFNRVNQQUNFLFxuICBwYXJzZUppdFVyaSxcbn0gZnJvbSAnLi91cmknO1xuXG4vKipcbiAqIExvYWRzL2V4dHJhY3RzIHRoZSBjb250ZW50cyBmcm9tIGEgbG9hZCBjYWxsYmFjayBBbmd1bGFyIEpJVCBlbnRyeS5cbiAqIEFuIEFuZ3VsYXIgSklUIGVudHJ5IHJlcHJlc2VudHMgZWl0aGVyIGEgZmlsZSBwYXRoIGZvciBhIGNvbXBvbmVudCByZXNvdXJjZSBvciBiYXNlNjRcbiAqIGVuY29kZWQgZGF0YSBmb3IgYW4gaW5saW5lIGNvbXBvbmVudCByZXNvdXJjZS5cbiAqIEBwYXJhbSBlbnRyeSBUaGUgdmFsdWUgdGhhdCByZXByZXNlbnRzIGNvbnRlbnQgdG8gbG9hZC5cbiAqIEBwYXJhbSByb290IFRoZSBhYnNvbHV0ZSBwYXRoIGZvciB0aGUgcm9vdCBvZiB0aGUgYnVpbGQgKHR5cGljYWxseSB0aGUgd29ya3NwYWNlIHJvb3QpLlxuICogQHBhcmFtIHNraXBSZWFkIElmIHRydWUsIGRvIG5vdCBhdHRlbXB0IHRvIHJlYWQgdGhlIGZpbGU7IGlmIGZhbHNlLCByZWFkIGZpbGUgY29udGVudCBmcm9tIGRpc2suXG4gKiBUaGlzIG9wdGlvbiBoYXMgbm8gZWZmZWN0IGlmIHRoZSBlbnRyeSBkb2VzIG5vdCBvcmlnaW5hdGUgZnJvbSBhIGZpbGUuIERlZmF1bHRzIHRvIGZhbHNlLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGFic29sdXRlIHBhdGggb2YgdGhlIGNvbnRlbnRzIGFuZCBvcHRpb25hbGx5IHRoZSBhY3R1YWwgY29udGVudHMuXG4gKiBGb3IgaW5saW5lIGVudHJpZXMgdGhlIGNvbnRlbnRzIHdpbGwgYWx3YXlzIGJlIHByb3ZpZGVkLlxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRW50cnkoXG4gIGVudHJ5OiBzdHJpbmcsXG4gIHJvb3Q6IHN0cmluZyxcbiAgc2tpcFJlYWQ/OiBib29sZWFuLFxuKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZzsgY29udGVudHM/OiBzdHJpbmcgfT4ge1xuICBpZiAoZW50cnkuc3RhcnRzV2l0aCgnZmlsZTonKSkge1xuICAgIGNvbnN0IHNwZWNpZmllciA9IHBhdGguam9pbihyb290LCBlbnRyeS5zbGljZSg1KSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGF0aDogc3BlY2lmaWVyLFxuICAgICAgY29udGVudHM6IHNraXBSZWFkID8gdW5kZWZpbmVkIDogYXdhaXQgcmVhZEZpbGUoc3BlY2lmaWVyLCAndXRmLTgnKSxcbiAgICB9O1xuICB9IGVsc2UgaWYgKGVudHJ5LnN0YXJ0c1dpdGgoJ2lubGluZTonKSkge1xuICAgIGNvbnN0IFtpbXBvcnRlciwgZGF0YV0gPSBlbnRyeS5zbGljZSg3KS5zcGxpdCgnOycsIDIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IHBhdGguam9pbihyb290LCBpbXBvcnRlciksXG4gICAgICBjb250ZW50czogQnVmZmVyLmZyb20oZGF0YSwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCksXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGF0YSBmb3IgQW5ndWxhciBKSVQgZW50cnkuJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGVzYnVpbGQgcmVzb2x2ZSBhbmQgbG9hZCBjYWxsYmFja3MgdG8gc3VwcG9ydCBBbmd1bGFyIEpJVCBtb2RlIHByb2Nlc3NpbmdcbiAqIGZvciBib3RoIENvbXBvbmVudCBzdHlsZXNoZWV0cyBhbmQgdGVtcGxhdGVzLiBUaGVzZSBjYWxsYmFja3Mgd29yayBhbG9uZ3NpZGUgdGhlIEpJVFxuICogcmVzb3VyY2UgVHlwZVNjcmlwdCB0cmFuc2Zvcm1lciB0byBjb252ZXJ0IGFuZCB0aGVuIGJ1bmRsZSBDb21wb25lbnQgcmVzb3VyY2VzIGFzXG4gKiBzdGF0aWMgaW1wb3J0cy5cbiAqIEBwYXJhbSBidWlsZCBBbiBlc2J1aWxkIHtAbGluayBQbHVnaW5CdWlsZH0gaW5zdGFuY2UgdXNlZCB0byBhZGQgY2FsbGJhY2tzLlxuICogQHBhcmFtIHN0eWxlT3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2Ugd2hlbiBidW5kbGluZyBzdHlsZXNoZWV0cy5cbiAqIEBwYXJhbSBzdHlsZXNoZWV0UmVzb3VyY2VGaWxlcyBBbiBhcnJheSB3aGVyZSBzdHlsZXNoZWV0IHJlc291cmNlcyB3aWxsIGJlIGFkZGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBKaXRQbHVnaW5DYWxsYmFja3MoXG4gIGJ1aWxkOiBQbHVnaW5CdWlsZCxcbiAgc3R5bGVPcHRpb25zOiBCdW5kbGVTdHlsZXNoZWV0T3B0aW9ucyAmIHsgaW5saW5lU3R5bGVMYW5ndWFnZTogc3RyaW5nIH0sXG4gIHN0eWxlc2hlZXRSZXNvdXJjZUZpbGVzOiBPdXRwdXRGaWxlW10sXG4gIGNhY2hlPzogTG9hZFJlc3VsdENhY2hlLFxuKTogdm9pZCB7XG4gIGNvbnN0IHJvb3QgPSBidWlsZC5pbml0aWFsT3B0aW9ucy5hYnNXb3JraW5nRGlyID8/ICcnO1xuXG4gIC8vIEFkZCBhIHJlc29sdmUgY2FsbGJhY2sgdG8gY2FwdHVyZSBhbmQgcGFyc2UgYW55IEpJVCBVUklzIHRoYXQgd2VyZSBhZGRlZCBieSB0aGVcbiAgLy8gSklUIHJlc291cmNlIFR5cGVTY3JpcHQgdHJhbnNmb3JtZXIuXG4gIC8vIFJlc291cmNlcyBvcmlnaW5hdGluZyBmcm9tIGEgZmlsZSBhcmUgcmVzb2x2ZWQgYXMgcmVsYXRpdmUgZnJvbSB0aGUgY29udGFpbmluZyBmaWxlIChpbXBvcnRlcikuXG4gIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogSklUX05BTUVTUEFDRV9SRUdFWFAgfSwgKGFyZ3MpID0+IHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUppdFVyaShhcmdzLnBhdGgpO1xuICAgIGlmICghcGFyc2VkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHsgbmFtZXNwYWNlLCBvcmlnaW4sIHNwZWNpZmllciB9ID0gcGFyc2VkO1xuXG4gICAgaWYgKG9yaWdpbiA9PT0gJ2ZpbGUnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAvLyBVc2UgYSByZWxhdGl2ZSBwYXRoIHRvIHByZXZlbnQgZnVsbHkgcmVzb2x2ZWQgcGF0aHMgaW4gdGhlIG1ldGFmaWxlIChKU09OIHN0YXRzIGZpbGUpLlxuICAgICAgICAvLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGZvciBjdXN0b20gbmFtZXNwYWNlcy4gZXNidWlsZCB3aWxsIGhhbmRsZSB0aGUgZmlsZSBuYW1lc3BhY2UuXG4gICAgICAgIHBhdGg6ICdmaWxlOicgKyBwYXRoLnJlbGF0aXZlKHJvb3QsIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYXJncy5pbXBvcnRlciksIHNwZWNpZmllcikpLFxuICAgICAgICBuYW1lc3BhY2UsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJbmxpbmUgZGF0YSBtYXkgbmVlZCB0aGUgaW1wb3J0ZXIgdG8gcmVzb2x2ZSBpbXBvcnRzL3JlZmVyZW5jZXMgd2l0aGluIHRoZSBjb250ZW50XG4gICAgICBjb25zdCBpbXBvcnRlciA9IHBhdGgucmVsYXRpdmUocm9vdCwgYXJncy5pbXBvcnRlcik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhdGg6IGBpbmxpbmU6JHtpbXBvcnRlcn07JHtzcGVjaWZpZXJ9YCxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEFkZCBhIGxvYWQgY2FsbGJhY2sgdG8gaGFuZGxlIENvbXBvbmVudCBzdHlsZXNoZWV0cyAoYm90aCBpbmxpbmUgYW5kIGV4dGVybmFsKVxuICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC8uLywgbmFtZXNwYWNlOiBKSVRfU1RZTEVfTkFNRVNQQUNFIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgLy8gc2tpcFJlYWQgaXMgdXNlZCBoZXJlIGJlY2F1c2UgdGhlIHN0eWxlc2hlZXQgYnVuZGxpbmcgd2lsbCByZWFkIGEgZmlsZSBzdHlsZXNoZWV0XG4gICAgLy8gZGlyZWN0bHkgZWl0aGVyIHZpYSBhIHByZXByb2Nlc3NvciBvciBlc2J1aWxkIGl0c2VsZi5cbiAgICBjb25zdCBlbnRyeSA9IGF3YWl0IGxvYWRFbnRyeShhcmdzLnBhdGgsIHJvb3QsIHRydWUgLyogc2tpcFJlYWQgKi8pO1xuXG4gICAgY29uc3QgeyBjb250ZW50cywgcmVzb3VyY2VGaWxlcywgZXJyb3JzLCB3YXJuaW5ncyB9ID0gYXdhaXQgYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldChcbiAgICAgIHN0eWxlT3B0aW9ucy5pbmxpbmVTdHlsZUxhbmd1YWdlLFxuICAgICAgLy8gVGhlIGBkYXRhYCBwYXJhbWV0ZXIgaXMgb25seSBuZWVkZWQgZm9yIGEgc3R5bGVzaGVldCBpZiBpdCB3YXMgaW5saW5lXG4gICAgICBlbnRyeS5jb250ZW50cyA/PyAnJyxcbiAgICAgIGVudHJ5LnBhdGgsXG4gICAgICBlbnRyeS5jb250ZW50cyAhPT0gdW5kZWZpbmVkLFxuICAgICAgc3R5bGVPcHRpb25zLFxuICAgICAgY2FjaGUsXG4gICAgKTtcblxuICAgIHN0eWxlc2hlZXRSZXNvdXJjZUZpbGVzLnB1c2goLi4ucmVzb3VyY2VGaWxlcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3JzLFxuICAgICAgd2FybmluZ3MsXG4gICAgICBjb250ZW50cyxcbiAgICAgIGxvYWRlcjogJ3RleHQnLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhIGxvYWQgY2FsbGJhY2sgdG8gaGFuZGxlIENvbXBvbmVudCB0ZW1wbGF0ZXNcbiAgLy8gTk9URTogV2hpbGUgdGhpcyBjYWxsYmFjayBzdXBwb3J0cyBib3RoIGlubGluZSBhbmQgZXh0ZXJuYWwgdGVtcGxhdGVzLCB0aGUgdHJhbnNmb3JtZXJcbiAgLy8gY3VycmVudGx5IG9ubHkgc3VwcG9ydHMgZ2VuZXJhdGluZyBVUklzIGZvciBleHRlcm5hbCB0ZW1wbGF0ZXMuXG4gIGJ1aWxkLm9uTG9hZCh7IGZpbHRlcjogLy4vLCBuYW1lc3BhY2U6IEpJVF9URU1QTEFURV9OQU1FU1BBQ0UgfSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICBjb25zdCB7IGNvbnRlbnRzIH0gPSBhd2FpdCBsb2FkRW50cnkoYXJncy5wYXRoLCByb290KTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50cyxcbiAgICAgIGxvYWRlcjogJ3RleHQnLFxuICAgIH07XG4gIH0pO1xufVxuIl19
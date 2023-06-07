"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BundlerContext_esbuildContext, _BundlerContext_esbuildOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessages = exports.BundlerContext = exports.isEsBuildFailure = void 0;
const esbuild_1 = require("esbuild");
const node_path_1 = require("node:path");
/**
 * Determines if an unknown value is an esbuild BuildFailure error object thrown by esbuild.
 * @param value A potential esbuild BuildFailure error object.
 * @returns `true` if the object is determined to be a BuildFailure object; otherwise, `false`.
 */
function isEsBuildFailure(value) {
    return !!value && typeof value === 'object' && 'errors' in value && 'warnings' in value;
}
exports.isEsBuildFailure = isEsBuildFailure;
class BundlerContext {
    constructor(workspaceRoot, incremental, options) {
        this.workspaceRoot = workspaceRoot;
        this.incremental = incremental;
        _BundlerContext_esbuildContext.set(this, void 0);
        _BundlerContext_esbuildOptions.set(this, void 0);
        __classPrivateFieldSet(this, _BundlerContext_esbuildOptions, {
            ...options,
            metafile: true,
            write: false,
        }, "f");
    }
    static async bundleAll(contexts) {
        const individualResults = await Promise.all([...contexts].map((context) => context.bundle()));
        // Return directly if only one result
        if (individualResults.length === 1) {
            return individualResults[0];
        }
        let errors;
        const warnings = [];
        const metafile = { inputs: {}, outputs: {} };
        const initialFiles = [];
        const outputFiles = [];
        for (const result of individualResults) {
            warnings.push(...result.warnings);
            if (result.errors) {
                errors ?? (errors = []);
                errors.push(...result.errors);
                continue;
            }
            // Combine metafiles used for the stats option as well as bundle budgets and console output
            if (result.metafile) {
                metafile.inputs = { ...metafile.inputs, ...result.metafile.inputs };
                metafile.outputs = { ...metafile.outputs, ...result.metafile.outputs };
            }
            initialFiles.push(...result.initialFiles);
            outputFiles.push(...result.outputFiles);
        }
        if (errors !== undefined) {
            return { errors, warnings };
        }
        return {
            errors,
            warnings,
            metafile,
            initialFiles,
            outputFiles,
        };
    }
    /**
     * Executes the esbuild build function and normalizes the build result in the event of a
     * build failure that results in no output being generated.
     * All builds use the `write` option with a value of `false` to allow for the output files
     * build result array to be populated.
     *
     * @returns If output files are generated, the full esbuild BuildResult; if not, the
     * warnings and errors for the attempted build.
     */
    async bundle() {
        let result;
        try {
            if (__classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f")) {
                // Rebuild using the existing incremental build context
                result = await __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f").rebuild();
            }
            else if (this.incremental) {
                // Create an incremental build context and perform the first build.
                // Context creation does not perform a build.
                __classPrivateFieldSet(this, _BundlerContext_esbuildContext, await (0, esbuild_1.context)(__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f")), "f");
                result = await __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f").rebuild();
            }
            else {
                // For non-incremental builds, perform a single build
                result = await (0, esbuild_1.build)(__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f"));
            }
        }
        catch (failure) {
            // Build failures will throw an exception which contains errors/warnings
            if (isEsBuildFailure(failure)) {
                return failure;
            }
            else {
                throw failure;
            }
        }
        // Return if the build encountered any errors
        if (result.errors.length) {
            return {
                errors: result.errors,
                warnings: result.warnings,
            };
        }
        // Find all initial files
        const initialFiles = [];
        for (const outputFile of result.outputFiles) {
            // Entries in the metafile are relative to the `absWorkingDir` option which is set to the workspaceRoot
            const relativeFilePath = (0, node_path_1.relative)(this.workspaceRoot, outputFile.path);
            const entryPoint = result.metafile?.outputs[relativeFilePath]?.entryPoint;
            outputFile.path = relativeFilePath;
            if (entryPoint) {
                // The first part of the filename is the name of file (e.g., "polyfills" for "polyfills.7S5G3MDY.js")
                const name = (0, node_path_1.basename)(outputFile.path).split('.', 1)[0];
                // Only entrypoints with an entry in the options are initial files.
                // Dynamic imports also have an entryPoint value in the meta file.
                if (__classPrivateFieldGet(this, _BundlerContext_esbuildOptions, "f").entryPoints?.[name]) {
                    // An entryPoint value indicates an initial file
                    initialFiles.push({
                        file: outputFile.path,
                        name,
                        extension: (0, node_path_1.extname)(outputFile.path),
                    });
                }
            }
        }
        // Return the successful build results
        return { ...result, initialFiles, errors: undefined };
    }
    /**
     * Disposes incremental build resources present in the context.
     *
     * @returns A promise that resolves when disposal is complete.
     */
    async dispose() {
        try {
            return __classPrivateFieldGet(this, _BundlerContext_esbuildContext, "f")?.dispose();
        }
        finally {
            __classPrivateFieldSet(this, _BundlerContext_esbuildContext, undefined, "f");
        }
    }
}
exports.BundlerContext = BundlerContext;
_BundlerContext_esbuildContext = new WeakMap(), _BundlerContext_esbuildOptions = new WeakMap();
async function logMessages(context, { errors, warnings }) {
    if (warnings?.length) {
        const warningMessages = await (0, esbuild_1.formatMessages)(warnings, { kind: 'warning', color: true });
        context.logger.warn(warningMessages.join('\n'));
    }
    if (errors?.length) {
        const errorMessages = await (0, esbuild_1.formatMessages)(errors, { kind: 'error', color: true });
        context.logger.error(errorMessages.join('\n'));
    }
}
exports.logMessages = logMessages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9lc2J1aWxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7OztBQUdILHFDQVdpQjtBQUNqQix5Q0FBd0Q7QUFheEQ7Ozs7R0FJRztBQUNILFNBQWdCLGdCQUFnQixDQUFDLEtBQWM7SUFDN0MsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxRQUFRLElBQUksS0FBSyxJQUFJLFVBQVUsSUFBSSxLQUFLLENBQUM7QUFDMUYsQ0FBQztBQUZELDRDQUVDO0FBRUQsTUFBYSxjQUFjO0lBSXpCLFlBQW9CLGFBQXFCLEVBQVUsV0FBb0IsRUFBRSxPQUFxQjtRQUExRSxrQkFBYSxHQUFiLGFBQWEsQ0FBUTtRQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBSHZFLGlEQUFpRTtRQUNqRSxpREFBaUU7UUFHL0QsdUJBQUEsSUFBSSxrQ0FBbUI7WUFDckIsR0FBRyxPQUFPO1lBQ1YsUUFBUSxFQUFFLElBQUk7WUFDZCxLQUFLLEVBQUUsS0FBSztTQUNiLE1BQUEsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFrQztRQUN2RCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTlGLHFDQUFxQztRQUNyQyxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsT0FBTyxpQkFB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OztBQUVNLEtBQUssVUFBVSxXQUFXLENBQy9CLE9BQXVCLEVBQ3ZCLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBOEQ7SUFFaEYsSUFBSSxRQUFRLEVBQUUsTUFBTSxFQUFFO1FBQ3BCLE1BQU0sZUFBZSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBSSxNQUFNLEVBQUUsTUFBTSxFQUFFO1FBQ2xCLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBQSx3QkFBYyxFQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQWJELGtDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQge1xuICBCdWlsZENvbnRleHQsXG4gIEJ1aWxkRmFpbHVyZSxcbiAgQnVpbGRPcHRpb25zLFxuICBNZXNzYWdlLFxuICBNZXRhZmlsZSxcbiAgT3V0cHV0RmlsZSxcbiAgUGFydGlhbE1lc3NhZ2UsXG4gIGJ1aWxkLFxuICBjb250ZXh0LFxuICBmb3JtYXRNZXNzYWdlcyxcbn0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBiYXNlbmFtZSwgZXh0bmFtZSwgcmVsYXRpdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgRmlsZUluZm8gfSBmcm9tICcuLi8uLi91dGlscy9pbmRleC1maWxlL2F1Z21lbnQtaW5kZXgtaHRtbCc7XG5cbmV4cG9ydCB0eXBlIEJ1bmRsZUNvbnRleHRSZXN1bHQgPVxuICB8IHsgZXJyb3JzOiBNZXNzYWdlW107IHdhcm5pbmdzOiBNZXNzYWdlW10gfVxuICB8IHtcbiAgICAgIGVycm9yczogdW5kZWZpbmVkO1xuICAgICAgd2FybmluZ3M6IE1lc3NhZ2VbXTtcbiAgICAgIG1ldGFmaWxlOiBNZXRhZmlsZTtcbiAgICAgIG91dHB1dEZpbGVzOiBPdXRwdXRGaWxlW107XG4gICAgICBpbml0aWFsRmlsZXM6IEZpbGVJbmZvW107XG4gICAgfTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGFuIHVua25vd24gdmFsdWUgaXMgYW4gZXNidWlsZCBCdWlsZEZhaWx1cmUgZXJyb3Igb2JqZWN0IHRocm93biBieSBlc2J1aWxkLlxuICogQHBhcmFtIHZhbHVlIEEgcG90ZW50aWFsIGVzYnVpbGQgQnVpbGRGYWlsdXJlIGVycm9yIG9iamVjdC5cbiAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0IGlzIGRldGVybWluZWQgdG8gYmUgYSBCdWlsZEZhaWx1cmUgb2JqZWN0OyBvdGhlcndpc2UsIGBmYWxzZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0VzQnVpbGRGYWlsdXJlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgQnVpbGRGYWlsdXJlIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAnZXJyb3JzJyBpbiB2YWx1ZSAmJiAnd2FybmluZ3MnIGluIHZhbHVlO1xufVxuXG5leHBvcnQgY2xhc3MgQnVuZGxlckNvbnRleHQge1xuICAjZXNidWlsZENvbnRleHQ/OiBCdWlsZENvbnRleHQ8eyBtZXRhZmlsZTogdHJ1ZTsgd3JpdGU6IGZhbHNlIH0+O1xuICAjZXNidWlsZE9wdGlvbnM6IEJ1aWxkT3B0aW9ucyAmIHsgbWV0YWZpbGU6IHRydWU7IHdyaXRlOiBmYWxzZSB9O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd29ya3NwYWNlUm9vdDogc3RyaW5nLCBwcml2YXRlIGluY3JlbWVudGFsOiBib29sZWFuLCBvcHRpb25zOiBCdWlsZE9wdGlvbnMpIHtcbiAgICB0aGlzLiNlc2J1aWxkT3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBtZXRhZmlsZTogdHJ1ZSxcbiAgICAgIHdyaXRlOiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGJ1bmRsZUFsbChjb250ZXh0czogSXRlcmFibGU8QnVuZGxlckNvbnRleHQ+KTogUHJvbWlzZTxCdW5kbGVDb250ZXh0UmVzdWx0PiB7XG4gICAgY29uc3QgaW5kaXZpZHVhbFJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChbLi4uY29udGV4dHNdLm1hcCgoY29udGV4dCkgPT4gY29udGV4dC5idW5kbGUoKSkpO1xuXG4gICAgLy8gUmV0dXJuIGRpcmVjdGx5IGlmIG9ubHkgb25lIHJlc3VsdFxuICAgIGlmIChpbmRpdmlkdWFsUmVzdWx0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBpbmRpdmlkdWFsUmVzdWx0c1swXTtcbiAgICB9XG5cbiAgICBsZXQgZXJyb3JzOiBNZXNzYWdlW10gfCB1bmRlZmluZWQ7XG4gICAgY29uc3Qgd2FybmluZ3M6IE1lc3NhZ2VbXSA9IFtdO1xuICAgIGNvbnN0IG1ldGFmaWxlOiBNZXRhZmlsZSA9IHsgaW5wdXRzOiB7fSwgb3V0cHV0czoge30gfTtcbiAgICBjb25zdCBpbml0aWFsRmlsZXMgPSBbXTtcbiAgICBjb25zdCBvdXRwdXRGaWxlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIGluZGl2aWR1YWxSZXN1bHRzKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKC4uLnJlc3VsdC53YXJuaW5ncyk7XG4gICAgICBpZiAocmVzdWx0LmVycm9ycykge1xuICAgICAgICBlcnJvcnMgPz89IFtdO1xuICAgICAgICBlcnJvcnMucHVzaCguLi5yZXN1bHQuZXJyb3JzKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbWJpbmUgbWV0YWZpbGVzIHVzZWQgZm9yIHRoZSBzdGF0cyBvcHRpb24gYXMgd2VsbCBhcyBidW5kbGUgYnVkZ2V0cyBhbmQgY29uc29sZSBvdXRwdXRcbiAgICAgIGlmIChyZXN1bHQubWV0YWZpbGUpIHtcbiAgICAgICAgbWV0YWZpbGUuaW5wdXRzID0geyAuLi5tZXRhZmlsZS5pbnB1dHMsIC4uLnJlc3VsdC5tZXRhZmlsZS5pbnB1dHMgfTtcbiAgICAgICAgbWV0YWZpbGUub3V0cHV0cyA9IHsgLi4ubWV0YWZpbGUub3V0cHV0cywgLi4ucmVzdWx0Lm1ldGFmaWxlLm91dHB1dHMgfTtcbiAgICAgIH1cblxuICAgICAgaW5pdGlhbEZpbGVzLnB1c2goLi4ucmVzdWx0LmluaXRpYWxGaWxlcyk7XG4gICAgICBvdXRwdXRGaWxlcy5wdXNoKC4uLnJlc3VsdC5vdXRwdXRGaWxlcyk7XG4gICAgfVxuXG4gICAgaWYgKGVycm9ycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4geyBlcnJvcnMsIHdhcm5pbmdzIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzLFxuICAgICAgbWV0YWZpbGUsXG4gICAgICBpbml0aWFsRmlsZXMsXG4gICAgICBvdXRwdXRGaWxlcyxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBlc2J1aWxkIGJ1aWxkIGZ1bmN0aW9uIGFuZCBub3JtYWxpemVzIHRoZSBidWlsZCByZXN1bHQgaW4gdGhlIGV2ZW50IG9mIGFcbiAgICogYnVpbGQgZmFpbHVyZSB0aGF0IHJlc3VsdHMgaW4gbm8gb3V0cHV0IGJlaW5nIGdlbmVyYXRlZC5cbiAgICogQWxsIGJ1aWxkcyB1c2UgdGhlIGB3cml0ZWAgb3B0aW9uIHdpdGggYSB2YWx1ZSBvZiBgZmFsc2VgIHRvIGFsbG93IGZvciB0aGUgb3V0cHV0IGZpbGVzXG4gICAqIGJ1aWxkIHJlc3VsdCBhcnJheSB0byBiZSBwb3B1bGF0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIElmIG91dHB1dCBmaWxlcyBhcmUgZ2VuZXJhdGVkLCB0aGUgZnVsbCBlc2J1aWxkIEJ1aWxkUmVzdWx0OyBpZiBub3QsIHRoZVxuICAgKiB3YXJuaW5ncyBhbmQgZXJyb3JzIGZvciB0aGUgYXR0ZW1wdGVkIGJ1aWxkLlxuICAgKi9cbiAgYXN5bmMgYnVuZGxlKCk6IFByb21pc2U8QnVuZGxlQ29udGV4dFJlc3VsdD4ge1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLiNlc2J1aWxkQ29udGV4dCkge1xuICAgICAgICAvLyBSZWJ1aWxkIHVzaW5nIHRoZSBleGlzdGluZyBpbmNyZW1lbnRhbCBidWlsZCBjb250ZXh0XG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuI2VzYnVpbGRDb250ZXh0LnJlYnVpbGQoKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbmNyZW1lbnRhbCkge1xuICAgICAgICAvLyBDcmVhdGUgYW4gaW5jcmVtZW50YWwgYnVpbGQgY29udGV4dCBhbmQgcGVyZm9ybSB0aGUgZmlyc3QgYnVpbGQuXG4gICAgICAgIC8vIENvbnRleHQgY3JlYXRpb24gZG9lcyBub3QgcGVyZm9ybSBhIGJ1aWxkLlxuICAgICAgICB0aGlzLiNlc2J1aWxkQ29udGV4dCA9IGF3YWl0IGNvbnRleHQodGhpcy4jZXNidWlsZE9wdGlvbnMpO1xuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLiNlc2J1aWxkQ29udGV4dC5yZWJ1aWxkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3Igbm9uLWluY3JlbWVudGFsIGJ1aWxkcywgcGVyZm9ybSBhIHNpbmdsZSBidWlsZFxuICAgICAgICByZXN1bHQgPSBhd2FpdCBidWlsZCh0aGlzLiNlc2J1aWxkT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZmFpbHVyZSkge1xuICAgICAgLy8gQnVpbGQgZmFpbHVyZXMgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gd2hpY2ggY29udGFpbnMgZXJyb3JzL3dhcm5pbmdzXG4gICAgICBpZiAoaXNFc0J1aWxkRmFpbHVyZShmYWlsdXJlKSkge1xuICAgICAgICByZXR1cm4gZmFpbHVyZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGZhaWx1cmU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGlmIHRoZSBidWlsZCBlbmNvdW50ZXJlZCBhbnkgZXJyb3JzXG4gICAgaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlcnJvcnM6IHJlc3VsdC5lcnJvcnMsXG4gICAgICAgIHdhcm5pbmdzOiByZXN1bHQud2FybmluZ3MsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEZpbmQgYWxsIGluaXRpYWwgZmlsZXNcbiAgICBjb25zdCBpbml0aWFsRmlsZXM6IEZpbGVJbmZvW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG91dHB1dEZpbGUgb2YgcmVzdWx0Lm91dHB1dEZpbGVzKSB7XG4gICAgICAvLyBFbnRyaWVzIGluIHRoZSBtZXRhZmlsZSBhcmUgcmVsYXRpdmUgdG8gdGhlIGBhYnNXb3JraW5nRGlyYCBvcHRpb24gd2hpY2ggaXMgc2V0IHRvIHRoZSB3b3Jrc3BhY2VSb290XG4gICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcmVsYXRpdmUodGhpcy53b3Jrc3BhY2VSb290LCBvdXRwdXRGaWxlLnBhdGgpO1xuICAgICAgY29uc3QgZW50cnlQb2ludCA9IHJlc3VsdC5tZXRhZmlsZT8ub3V0cHV0c1tyZWxhdGl2ZUZpbGVQYXRoXT8uZW50cnlQb2ludDtcblxuICAgICAgb3V0cHV0RmlsZS5wYXRoID0gcmVsYXRpdmVGaWxlUGF0aDtcblxuICAgICAgaWYgKGVudHJ5UG9pbnQpIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IHBhcnQgb2YgdGhlIGZpbGVuYW1lIGlzIHRoZSBuYW1lIG9mIGZpbGUgKGUuZy4sIFwicG9seWZpbGxzXCIgZm9yIFwicG9seWZpbGxzLjdTNUczTURZLmpzXCIpXG4gICAgICAgIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShvdXRwdXRGaWxlLnBhdGgpLnNwbGl0KCcuJywgMSlbMF07XG5cbiAgICAgICAgLy8gT25seSBlbnRyeXBvaW50cyB3aXRoIGFuIGVudHJ5IGluIHRoZSBvcHRpb25zIGFyZSBpbml0aWFsIGZpbGVzLlxuICAgICAgICAvLyBEeW5hbWljIGltcG9ydHMgYWxzbyBoYXZlIGFuIGVudHJ5UG9pbnQgdmFsdWUgaW4gdGhlIG1ldGEgZmlsZS5cbiAgICAgICAgaWYgKCh0aGlzLiNlc2J1aWxkT3B0aW9ucy5lbnRyeVBvaW50cyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KT8uW25hbWVdKSB7XG4gICAgICAgICAgLy8gQW4gZW50cnlQb2ludCB2YWx1ZSBpbmRpY2F0ZXMgYW4gaW5pdGlhbCBmaWxlXG4gICAgICAgICAgaW5pdGlhbEZpbGVzLnB1c2goe1xuICAgICAgICAgICAgZmlsZTogb3V0cHV0RmlsZS5wYXRoLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGV4dGVuc2lvbjogZXh0bmFtZShvdXRwdXRGaWxlLnBhdGgpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBzdWNjZXNzZnVsIGJ1aWxkIHJlc3VsdHNcbiAgICByZXR1cm4geyAuLi5yZXN1bHQsIGluaXRpYWxGaWxlcywgZXJyb3JzOiB1bmRlZmluZWQgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwb3NlcyBpbmNyZW1lbnRhbCBidWlsZCByZXNvdXJjZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBkaXNwb3NhbCBpcyBjb21wbGV0ZS5cbiAgICovXG4gIGFzeW5jIGRpc3Bvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0aGlzLiNlc2J1aWxkQ29udGV4dD8uZGlzcG9zZSgpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLiNlc2J1aWxkQ29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ01lc3NhZ2VzKFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgeyBlcnJvcnMsIHdhcm5pbmdzIH06IHsgZXJyb3JzPzogUGFydGlhbE1lc3NhZ2VbXTsgd2FybmluZ3M/OiBQYXJ0aWFsTWVzc2FnZVtdIH0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHdhcm5pbmdzPy5sZW5ndGgpIHtcbiAgICBjb25zdCB3YXJuaW5nTWVzc2FnZXMgPSBhd2FpdCBmb3JtYXRNZXNzYWdlcyh3YXJuaW5ncywgeyBraW5kOiAnd2FybmluZycsIGNvbG9yOiB0cnVlIH0pO1xuICAgIGNvbnRleHQubG9nZ2VyLndhcm4od2FybmluZ01lc3NhZ2VzLmpvaW4oJ1xcbicpKTtcbiAgfVxuXG4gIGlmIChlcnJvcnM/Lmxlbmd0aCkge1xuICAgIGNvbnN0IGVycm9yTWVzc2FnZXMgPSBhd2FpdCBmb3JtYXRNZXNzYWdlcyhlcnJvcnMsIHsga2luZDogJ2Vycm9yJywgY29sb3I6IHRydWUgfSk7XG4gICAgY29udGV4dC5sb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlcy5qb2luKCdcXG4nKSk7XG4gIH1cbn1cbiJdfQ==
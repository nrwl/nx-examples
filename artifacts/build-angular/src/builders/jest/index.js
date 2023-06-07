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
const architect_1 = require("@angular-devkit/architect");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const util_1 = require("util");
const color_1 = require("../../utils/color");
const browser_esbuild_1 = require("../browser-esbuild");
const schema_1 = require("../browser-esbuild/schema");
const options_1 = require("./options");
const test_files_1 = require("./test-files");
const execFile = (0, util_1.promisify)(child_process_1.execFile);
/** Main execution function for the Jest builder. */
exports.default = (0, architect_1.createBuilder)(async (schema, context) => {
    context.logger.warn('NOTE: The Jest builder is currently EXPERIMENTAL and not ready for production use.');
    const options = (0, options_1.normalizeOptions)(schema);
    const testOut = 'dist/test-out'; // TODO(dgp1130): Hide in temp directory.
    // Verify Jest installation and get the path to it's binary.
    // We need to `node_modules/.bin/jest`, but there is no means to resolve that directly. Fortunately Jest's `package.json` exports the
    // same file at `bin/jest`, so we can just resolve that instead.
    const jest = resolveModule('jest/bin/jest');
    if (!jest) {
        return {
            success: false,
            // TODO(dgp1130): Display a more accurate message for non-NPM users.
            error: 'Jest is not installed, most likely you need to run `npm install jest --save-dev` in your project.',
        };
    }
    // Verify that JSDom is installed in the project.
    const environment = resolveModule('jest-environment-jsdom');
    if (!environment) {
        return {
            success: false,
            // TODO(dgp1130): Display a more accurate message for non-NPM users.
            error: '`jest-environment-jsdom` is not installed. Install it with `npm install jest-environment-jsdom --save-dev`.',
        };
    }
    // Build all the test files.
    const testFiles = await (0, test_files_1.findTestFiles)(options, context.workspaceRoot);
    const jestGlobal = path.join(__dirname, 'jest-global.mjs');
    const initTestBed = path.join(__dirname, 'init-test-bed.mjs');
    const buildResult = await build(context, {
        // Build all the test files and also the `jest-global` and `init-test-bed` scripts.
        entryPoints: new Set([...testFiles, jestGlobal, initTestBed]),
        tsConfig: options.tsConfig,
        polyfills: options.polyfills ?? ['zone.js', 'zone.js/testing'],
        outputPath: testOut,
        aot: false,
        index: null,
        outputHashing: schema_1.OutputHashing.None,
        outExtension: 'mjs',
        commonChunk: false,
        optimization: false,
        buildOptimizer: false,
        sourceMap: {
            scripts: true,
            styles: false,
            vendor: false,
        },
    });
    if (!buildResult.success) {
        return buildResult;
    }
    // Execute Jest on the built output directory.
    const jestProc = execFile(process.execPath, [
        '--experimental-vm-modules',
        jest,
        `--rootDir="${testOut}"`,
        '--testEnvironment=jsdom',
        // TODO(dgp1130): Enable cache once we have a mechanism for properly clearing / disabling it.
        '--no-cache',
        // Run basically all files in the output directory, any excluded files were already dropped by the build.
        `--testMatch="<rootDir>/**/*.mjs"`,
        // Load polyfills and initialize the environment before executing each test file.
        // IMPORTANT: Order matters here.
        // First, we execute `jest-global.mjs` to initialize the `jest` global variable.
        // Second, we execute user polyfills, including `zone.js` and `zone.js/testing`. This is dependent on the Jest global so it can patch
        // the environment for fake async to work correctly.
        // Third, we initialize `TestBed`. This is dependent on fake async being set up correctly beforehand.
        `--setupFilesAfterEnv="<rootDir>/jest-global.mjs"`,
        ...(options.polyfills ? [`--setupFilesAfterEnv="<rootDir>/polyfills.mjs"`] : []),
        `--setupFilesAfterEnv="<rootDir>/init-test-bed.mjs"`,
        // Don't run any infrastructure files as tests, they are manually loaded where needed.
        `--testPathIgnorePatterns="<rootDir>/jest-global\\.mjs"`,
        ...(options.polyfills ? [`--testPathIgnorePatterns="<rootDir>/polyfills\\.mjs"`] : []),
        `--testPathIgnorePatterns="<rootDir>/init-test-bed\\.mjs"`,
        // Skip shared chunks, as they are not entry points to tests.
        `--testPathIgnorePatterns="<rootDir>/chunk-.*\\.mjs"`,
        // Optionally enable color.
        ...(color_1.colors.enabled ? ['--colors'] : []),
    ]);
    // Stream test output to the terminal.
    jestProc.child.stdout?.on('data', (chunk) => {
        context.logger.info(chunk);
    });
    jestProc.child.stderr?.on('data', (chunk) => {
        // Write to stderr directly instead of `context.logger.error(chunk)` because the logger will overwrite Jest's coloring information.
        process.stderr.write(chunk);
    });
    try {
        await jestProc;
    }
    catch (error) {
        // No need to propagate error message, already piped to terminal output.
        // TODO(dgp1130): Handle process spawning failures.
        return { success: false };
    }
    return { success: true };
});
async function build(context, options) {
    try {
        for await (const _ of (0, browser_esbuild_1.buildEsbuildBrowserInternal)(options, context)) {
            // Nothing to do for each event, just wait for the whole build.
        }
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            error: err.message,
        };
    }
}
/** Safely resolves the given Node module string. */
function resolveModule(module) {
    try {
        return require.resolve(module);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9qZXN0L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx5REFBeUY7QUFDekYsaURBQXVEO0FBQ3ZELDJDQUE2QjtBQUM3QiwrQkFBaUM7QUFDakMsNkNBQTJDO0FBQzNDLHdEQUFpRTtBQUVqRSxzREFBMEQ7QUFDMUQsdUNBQTZDO0FBRTdDLDZDQUE2QztBQUU3QyxNQUFNLFFBQVEsR0FBRyxJQUFBLGdCQUFTLEVBQUMsd0JBQVUsQ0FBQyxDQUFDO0FBRXZDLG9EQUFvRDtBQUNwRCxrQkFBZSxJQUFBLHlCQUFhLEVBQzFCLEtBQUssRUFBRSxNQUF5QixFQUFFLE9BQXVCLEVBQTBCLEVBQUU7SUFDbkYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2pCLG9GQUFvRixDQUNyRixDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQUcsSUFBQSwwQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsQ0FBQyx5Q0FBeUM7SUFFMUUsNERBQTREO0lBQzVELHFJQUFxSTtJQUNySSxnRUFBZ0U7SUFDaEUsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzVDLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxPQUFPO1lBQ0wsT0FBTyxFQUFFLEtBQUs7WUFDZCxvRUFBb0U7WUFDcEUsS0FBSyxFQUNILG1HQUFtRztTQUN0RyxDQUFDO0tBQ0g7SUFFRCxpREFBaUQ7SUFDakQsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDNUQsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoQixP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QUMsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLE1BQU0sUUFBUSxDQUFDO0tBQ2hCO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCx3RUFBd0U7UUFDeEUsbURBQW1EO1FBQ25ELE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7S0FDM0I7SUFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO0FBQzNCLENBQUMsQ0FDRixDQUFDO0FBRUYsS0FBSyxVQUFVLEtBQUssQ0FDbEIsT0FBdUIsRUFDdkIsT0FBOEI7SUFFOUIsSUFBSTtRQUNGLElBQUksS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUEsNkNBQTJCLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ25FLCtEQUErRDtTQUNoRTtRQUVELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7S0FDMUI7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU87WUFDTCxPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRyxHQUFhLENBQUMsT0FBTztTQUM5QixDQUFDO0tBQ0g7QUFDSCxDQUFDO0FBRUQsb0RBQW9EO0FBQ3BELFNBQVMsYUFBYSxDQUFDLE1BQWM7SUFDbkMsSUFBSTtRQUNGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNoQztJQUFDLE1BQU07UUFDTixPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRlckNvbnRleHQsIEJ1aWxkZXJPdXRwdXQsIGNyZWF0ZUJ1aWxkZXIgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IGV4ZWNGaWxlIGFzIGV4ZWNGaWxlQ2IgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbG9yJztcbmltcG9ydCB7IGJ1aWxkRXNidWlsZEJyb3dzZXJJbnRlcm5hbCB9IGZyb20gJy4uL2Jyb3dzZXItZXNidWlsZCc7XG5pbXBvcnQgeyBCcm93c2VyRXNidWlsZE9wdGlvbnMgfSBmcm9tICcuLi9icm93c2VyLWVzYnVpbGQvb3B0aW9ucyc7XG5pbXBvcnQgeyBPdXRwdXRIYXNoaW5nIH0gZnJvbSAnLi4vYnJvd3Nlci1lc2J1aWxkL3NjaGVtYSc7XG5pbXBvcnQgeyBub3JtYWxpemVPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcbmltcG9ydCB7IFNjaGVtYSBhcyBKZXN0QnVpbGRlclNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IGZpbmRUZXN0RmlsZXMgfSBmcm9tICcuL3Rlc3QtZmlsZXMnO1xuXG5jb25zdCBleGVjRmlsZSA9IHByb21pc2lmeShleGVjRmlsZUNiKTtcblxuLyoqIE1haW4gZXhlY3V0aW9uIGZ1bmN0aW9uIGZvciB0aGUgSmVzdCBidWlsZGVyLiAqL1xuZXhwb3J0IGRlZmF1bHQgY3JlYXRlQnVpbGRlcihcbiAgYXN5bmMgKHNjaGVtYTogSmVzdEJ1aWxkZXJTY2hlbWEsIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KTogUHJvbWlzZTxCdWlsZGVyT3V0cHV0PiA9PiB7XG4gICAgY29udGV4dC5sb2dnZXIud2FybihcbiAgICAgICdOT1RFOiBUaGUgSmVzdCBidWlsZGVyIGlzIGN1cnJlbnRseSBFWFBFUklNRU5UQUwgYW5kIG5vdCByZWFkeSBmb3IgcHJvZHVjdGlvbiB1c2UuJyxcbiAgICApO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IG5vcm1hbGl6ZU9wdGlvbnMoc2NoZW1hKTtcbiAgICBjb25zdCB0ZXN0T3V0ID0gJ2Rpc3QvdGVzdC1vdXQnOyAvLyBUT0RPKGRncDExMzApOiBIaWRlIGluIHRlbXAgZGlyZWN0b3J5LlxuXG4gICAgLy8gVmVyaWZ5IEplc3QgaW5zdGFsbGF0aW9uIGFuZCBnZXQgdGhlIHBhdGggdG8gaXQncyBiaW5hcnkuXG4gICAgLy8gV2UgbmVlZCB0byBgbm9kZV9tb2R1bGVzLy5iaW4vamVzdGAsIGJ1dCB0aGVyZSBpcyBubyBtZWFucyB0byByZXNvbHZlIHRoYXQgZGlyZWN0bHkuIEZvcnR1bmF0ZWx5IEplc3QncyBgcGFja2FnZS5qc29uYCBleHBvcnRzIHRoZVxuICAgIC8vIHNhbWUgZmlsZSBhdCBgYmluL2plc3RgLCBzbyB3ZSBjYW4ganVzdCByZXNvbHZlIHRoYXQgaW5zdGVhZC5cbiAgICBjb25zdCBqZXN0ID0gcmVzb2x2ZU1vZHVsZSgnamVzdC9iaW4vamVzdCcpO1xuICAgIGlmICghamVzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIC8vIFRPRE8oZGdwMTEzMCk6IERpc3BsYXkgYSBtb3JlIGFjY3VyYXRlIG1lc3NhZ2UgZm9yIG5vbi1OUE0gdXNlcnMuXG4gICAgICAgIGVycm9yOlxuICAgICAgICAgICdKZXN0IGlzIG5vdCBpbnN0YWxsZWQsIG1vc3QgbGlrZWx5IHlvdSBuZWVkIHRvIHJ1biBgbnBtIGluc3RhbGwgamVzdCAtLXNhdmUtZGV2YCBpbiB5b3VyIHByb2plY3QuJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IHRoYXQgSlNEb20gaXMgaW5zdGFsbGVkIGluIHRoZSBwcm9qZWN0LlxuICAgIGNvbnN0IGVudmlyb25tZW50ID0gcmVzb2x2ZU1vZHVsZSgnamVzdC1lbnZpcm9ubWVudC1qc2RvbScpO1xuICAgIGlmICghZW52aXJvbm1lbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAvLyBUT0RPKGRncDExMzApOiBEaXNwbGF5IGEgbW9yZSBhY2N1cmF0ZSBtZXNzYWdlIGZvciBub24tTlBNIHVzZXJzLlxuICAgICAgICBlcnJvcjpcbiAgICAgICAgICAnYGplc3QtZW52aXJvbm1lbnQtanNkb21gIGlzIG5vdCBpbnN0YWxsZWQuIEluc3RhbGwgaXQgd2l0aCBgbnBtIGluc3RhbGwgamVzdC1lbnZpcm9ubWVudC1qc2RvbSAtLXNhdmUtZGV2YC4nLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBCdWlsZCBhbGwgdGhlIHRlc3QgZmlsZXMuXG4gICAgY29uc3QgdGVzdEZpbGVzID0gYXdhaXQgZmluZFRlc3RGaWxlcyhvcHRpb25zLCBjb250ZXh0LndvcmtzcGFjZVJvb3QpO1xuICAgIGNvbnN0IGplc3RHbG9iYWwgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnamVzdC1nbG9iYWwubWpzJyk7XG4gICAgY29uc3QgaW5pdFRlc3RCZWQgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnaW5pdC10ZXN0LWJlZC5tanMnKTtcbiAgICBjb25zdCBidWlsZFJlc3VsdCA9IGF3YWl0IGJ1aWxkKGNvbnRleHQsIHtcbiAgICAgIC8vIEJ1aWxkIGFsbCB0aGUgdGVzdCBmaWxlcyBhbmQgYWxzbyB0aGUgYGplc3QtZ2xvYmFsYCBhbmQgYGluaXQtdGVzdC1iZWRgIHNjcmlwdHMuXG4gICAgICBlbnRyeVBvaW50czogbmV3IFNldChbLi4udGVzdEZpbGVzLCBqZXN0R2xvYmFsLCBpbml0VGVzdEJlZF0pLFxuICAgICAgdHNDb25maWc6IG9wdGlvbnMudHNDb25maWcsXG4gICAgICBwb2x5ZmlsbHM6IG9wdGlvbnMucG9seWZpbGxzID8/IFsnem9uZS5qcycsICd6b25lLmpzL3Rlc3RpbmcnXSxcbiAgICAgIG91dHB1dFBhdGg6IHRlc3RPdXQsXG4gICAgICBhb3Q6IGZhbHNlLFxuICAgICAgaW5kZXg6IG51bGwsXG4gICAgICBvdXRwdXRIYXNoaW5nOiBPdXRwdXRIYXNoaW5nLk5vbmUsXG4gICAgICBvdXRFeHRlbnNpb246ICdtanMnLCAvLyBGb3JjZSBuYXRpdmUgRVNNLlxuICAgICAgY29tbW9uQ2h1bms6IGZhbHNlLFxuICAgICAgb3B0aW1pemF0aW9uOiBmYWxzZSxcbiAgICAgIGJ1aWxkT3B0aW1pemVyOiBmYWxzZSxcbiAgICAgIHNvdXJjZU1hcDoge1xuICAgICAgICBzY3JpcHRzOiB0cnVlLFxuICAgICAgICBzdHlsZXM6IGZhbHNlLFxuICAgICAgICB2ZW5kb3I6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBpZiAoIWJ1aWxkUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIHJldHVybiBidWlsZFJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIEplc3Qgb24gdGhlIGJ1aWx0IG91dHB1dCBkaXJlY3RvcnkuXG4gICAgY29uc3QgamVzdFByb2MgPSBleGVjRmlsZShwcm9jZXNzLmV4ZWNQYXRoLCBbXG4gICAgICAnLS1leHBlcmltZW50YWwtdm0tbW9kdWxlcycsXG4gICAgICBqZXN0LFxuXG4gICAgICBgLS1yb290RGlyPVwiJHt0ZXN0T3V0fVwiYCxcbiAgICAgICctLXRlc3RFbnZpcm9ubWVudD1qc2RvbScsXG5cbiAgICAgIC8vIFRPRE8oZGdwMTEzMCk6IEVuYWJsZSBjYWNoZSBvbmNlIHdlIGhhdmUgYSBtZWNoYW5pc20gZm9yIHByb3Blcmx5IGNsZWFyaW5nIC8gZGlzYWJsaW5nIGl0LlxuICAgICAgJy0tbm8tY2FjaGUnLFxuXG4gICAgICAvLyBSdW4gYmFzaWNhbGx5IGFsbCBmaWxlcyBpbiB0aGUgb3V0cHV0IGRpcmVjdG9yeSwgYW55IGV4Y2x1ZGVkIGZpbGVzIHdlcmUgYWxyZWFkeSBkcm9wcGVkIGJ5IHRoZSBidWlsZC5cbiAgICAgIGAtLXRlc3RNYXRjaD1cIjxyb290RGlyPi8qKi8qLm1qc1wiYCxcblxuICAgICAgLy8gTG9hZCBwb2x5ZmlsbHMgYW5kIGluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGJlZm9yZSBleGVjdXRpbmcgZWFjaCB0ZXN0IGZpbGUuXG4gICAgICAvLyBJTVBPUlRBTlQ6IE9yZGVyIG1hdHRlcnMgaGVyZS5cbiAgICAgIC8vIEZpcnN0LCB3ZSBleGVjdXRlIGBqZXN0LWdsb2JhbC5tanNgIHRvIGluaXRpYWxpemUgdGhlIGBqZXN0YCBnbG9iYWwgdmFyaWFibGUuXG4gICAgICAvLyBTZWNvbmQsIHdlIGV4ZWN1dGUgdXNlciBwb2x5ZmlsbHMsIGluY2x1ZGluZyBgem9uZS5qc2AgYW5kIGB6b25lLmpzL3Rlc3RpbmdgLiBUaGlzIGlzIGRlcGVuZGVudCBvbiB0aGUgSmVzdCBnbG9iYWwgc28gaXQgY2FuIHBhdGNoXG4gICAgICAvLyB0aGUgZW52aXJvbm1lbnQgZm9yIGZha2UgYXN5bmMgdG8gd29yayBjb3JyZWN0bHkuXG4gICAgICAvLyBUaGlyZCwgd2UgaW5pdGlhbGl6ZSBgVGVzdEJlZGAuIFRoaXMgaXMgZGVwZW5kZW50IG9uIGZha2UgYXN5bmMgYmVpbmcgc2V0IHVwIGNvcnJlY3RseSBiZWZvcmVoYW5kLlxuICAgICAgYC0tc2V0dXBGaWxlc0FmdGVyRW52PVwiPHJvb3REaXI+L2plc3QtZ2xvYmFsLm1qc1wiYCxcbiAgICAgIC4uLihvcHRpb25zLnBvbHlmaWxscyA/IFtgLS1zZXR1cEZpbGVzQWZ0ZXJFbnY9XCI8cm9vdERpcj4vcG9seWZpbGxzLm1qc1wiYF0gOiBbXSksXG4gICAgICBgLS1zZXR1cEZpbGVzQWZ0ZXJFbnY9XCI8cm9vdERpcj4vaW5pdC10ZXN0LWJlZC5tanNcImAsXG5cbiAgICAgIC8vIERvbid0IHJ1biBhbnkgaW5mcmFzdHJ1Y3R1cmUgZmlsZXMgYXMgdGVzdHMsIHRoZXkgYXJlIG1hbnVhbGx5IGxvYWRlZCB3aGVyZSBuZWVkZWQuXG4gICAgICBgLS10ZXN0UGF0aElnbm9yZVBhdHRlcm5zPVwiPHJvb3REaXI+L2plc3QtZ2xvYmFsXFxcXC5tanNcImAsXG4gICAgICAuLi4ob3B0aW9ucy5wb2x5ZmlsbHMgPyBbYC0tdGVzdFBhdGhJZ25vcmVQYXR0ZXJucz1cIjxyb290RGlyPi9wb2x5ZmlsbHNcXFxcLm1qc1wiYF0gOiBbXSksXG4gICAgICBgLS10ZXN0UGF0aElnbm9yZVBhdHRlcm5zPVwiPHJvb3REaXI+L2luaXQtdGVzdC1iZWRcXFxcLm1qc1wiYCxcblxuICAgICAgLy8gU2tpcCBzaGFyZWQgY2h1bmtzLCBhcyB0aGV5IGFyZSBub3QgZW50cnkgcG9pbnRzIHRvIHRlc3RzLlxuICAgICAgYC0tdGVzdFBhdGhJZ25vcmVQYXR0ZXJucz1cIjxyb290RGlyPi9jaHVuay0uKlxcXFwubWpzXCJgLFxuXG4gICAgICAvLyBPcHRpb25hbGx5IGVuYWJsZSBjb2xvci5cbiAgICAgIC4uLihjb2xvcnMuZW5hYmxlZCA/IFsnLS1jb2xvcnMnXSA6IFtdKSxcbiAgICBdKTtcblxuICAgIC8vIFN0cmVhbSB0ZXN0IG91dHB1dCB0byB0aGUgdGVybWluYWwuXG4gICAgamVzdFByb2MuY2hpbGQuc3Rkb3V0Py5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgICAgY29udGV4dC5sb2dnZXIuaW5mbyhjaHVuayk7XG4gICAgfSk7XG4gICAgamVzdFByb2MuY2hpbGQuc3RkZXJyPy5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgICAgLy8gV3JpdGUgdG8gc3RkZXJyIGRpcmVjdGx5IGluc3RlYWQgb2YgYGNvbnRleHQubG9nZ2VyLmVycm9yKGNodW5rKWAgYmVjYXVzZSB0aGUgbG9nZ2VyIHdpbGwgb3ZlcndyaXRlIEplc3QncyBjb2xvcmluZyBpbmZvcm1hdGlvbi5cbiAgICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKGNodW5rKTtcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBqZXN0UHJvYztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gTm8gbmVlZCB0byBwcm9wYWdhdGUgZXJyb3IgbWVzc2FnZSwgYWxyZWFkeSBwaXBlZCB0byB0ZXJtaW5hbCBvdXRwdXQuXG4gICAgICAvLyBUT0RPKGRncDExMzApOiBIYW5kbGUgcHJvY2VzcyBzcGF3bmluZyBmYWlsdXJlcy5cbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICB9LFxuKTtcblxuYXN5bmMgZnVuY3Rpb24gYnVpbGQoXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuICBvcHRpb25zOiBCcm93c2VyRXNidWlsZE9wdGlvbnMsXG4pOiBQcm9taXNlPEJ1aWxkZXJPdXRwdXQ+IHtcbiAgdHJ5IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IF8gb2YgYnVpbGRFc2J1aWxkQnJvd3NlckludGVybmFsKG9wdGlvbnMsIGNvbnRleHQpKSB7XG4gICAgICAvLyBOb3RoaW5nIHRvIGRvIGZvciBlYWNoIGV2ZW50LCBqdXN0IHdhaXQgZm9yIHRoZSB3aG9sZSBidWlsZC5cbiAgICB9XG5cbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAoZXJyIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgIH07XG4gIH1cbn1cblxuLyoqIFNhZmVseSByZXNvbHZlcyB0aGUgZ2l2ZW4gTm9kZSBtb2R1bGUgc3RyaW5nLiAqL1xuZnVuY3Rpb24gcmVzb2x2ZU1vZHVsZShtb2R1bGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShtb2R1bGUpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=
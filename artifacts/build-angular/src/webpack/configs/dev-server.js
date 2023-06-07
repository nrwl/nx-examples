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
exports.buildServePath = exports.getDevServerConfig = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
const error_1 = require("../../utils/error");
const load_esm_1 = require("../../utils/load-esm");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const hmr_loader_1 = require("../plugins/hmr/hmr-loader");
async function getDevServerConfig(wco) {
    const { buildOptions: { host, port, index, headers, watch, hmr, main, liveReload, proxyConfig }, logger, root, } = wco;
    const servePath = buildServePath(wco.buildOptions, logger);
    const extraRules = [];
    if (hmr) {
        extraRules.push({
            loader: hmr_loader_1.HmrLoader,
            include: [(0, path_1.resolve)(wco.root, main)],
        });
    }
    const extraPlugins = [];
    if (!watch) {
        // There's no option to turn off file watching in webpack-dev-server, but
        // we can override the file watcher instead.
        extraPlugins.push({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apply: (compiler) => {
                compiler.hooks.afterEnvironment.tap('angular-cli', () => {
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    compiler.watchFileSystem = { watch: () => { } };
                });
            },
        });
    }
    return {
        plugins: extraPlugins,
        module: {
            rules: extraRules,
        },
        devServer: {
            host,
            port,
            headers: {
                'Access-Control-Allow-Origin': '*',
                ...headers,
            },
            historyApiFallback: !!index && {
                index: path_1.posix.join(servePath, (0, webpack_browser_config_1.getIndexOutputFile)(index)),
                disableDotRule: true,
                htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
                rewrites: [
                    {
                        from: new RegExp(`^(?!${servePath})/.*`),
                        to: (context) => context.parsedUrl.href,
                    },
                ],
            },
            // When setupExitSignals is enabled webpack-dev-server will shutdown gracefully which would
            // require CTRL+C to be pressed multiple times to exit.
            // See: https://github.com/webpack/webpack-dev-server/blob/c76b6d11a3821436c5e20207c8a38deb6ab7e33c/lib/Server.js#L1801-L1827
            setupExitSignals: false,
            compress: false,
            static: false,
            server: getServerConfig(root, wco.buildOptions),
            allowedHosts: getAllowedHostsConfig(wco.buildOptions),
            devMiddleware: {
                publicPath: servePath,
                stats: false,
            },
            liveReload,
            hot: hmr && !liveReload ? 'only' : hmr,
            proxy: await addProxyConfig(root, proxyConfig),
            ...getWebSocketSettings(wco.buildOptions, servePath),
        },
    };
}
exports.getDevServerConfig = getDevServerConfig;
/**
 * Resolve and build a URL _path_ that will be the root of the server. This resolved base href and
 * deploy URL from the browser options and returns a path from the root.
 */
function buildServePath(options, logger) {
    let servePath = options.servePath;
    if (servePath === undefined) {
        const defaultPath = findDefaultServePath(options.baseHref, options.deployUrl);
        if (defaultPath == null) {
            logger.warn(core_1.tags.oneLine `
        Warning: --deploy-url and/or --base-href contain unsupported values for ng serve. Default
        serve path of '/' used. Use --serve-path to override.
      `);
        }
        servePath = defaultPath || '';
    }
    if (servePath.endsWith('/')) {
        servePath = servePath.slice(0, -1);
    }
    if (!servePath.startsWith('/')) {
        servePath = `/${servePath}`;
    }
    return servePath;
}
exports.buildServePath = buildServePath;
/**
 * Private method to enhance a webpack config with SSL configuration.
 * @private
 */
function getServerConfig(root, options) {
    const { ssl, sslCert, sslKey } = options;
    if (!ssl) {
        return 'http';
    }
    return {
        type: 'https',
        options: sslCert && sslKey
            ? {
                key: (0, path_1.resolve)(root, sslKey),
                cert: (0, path_1.resolve)(root, sslCert),
            }
            : undefined,
    };
}
/**
 * Private method to enhance a webpack config with Proxy configuration.
 * @private
 */
async function addProxyConfig(root, proxyConfig) {
    if (!proxyConfig) {
        return undefined;
    }
    const proxyPath = (0, path_1.resolve)(root, proxyConfig);
    if (!(0, fs_1.existsSync)(proxyPath)) {
        throw new Error(`Proxy configuration file ${proxyPath} does not exist.`);
    }
    switch ((0, path_1.extname)(proxyPath)) {
        case '.json': {
            const content = await fs_1.promises.readFile(proxyPath, 'utf-8');
            const { parse, printParseErrorCode } = await Promise.resolve().then(() => __importStar(require('jsonc-parser')));
            const parseErrors = [];
            const proxyConfiguration = parse(content, parseErrors, { allowTrailingComma: true });
            if (parseErrors.length > 0) {
                let errorMessage = `Proxy configuration file ${proxyPath} contains parse errors:`;
                for (const parseError of parseErrors) {
                    const { line, column } = getJsonErrorLineColumn(parseError.offset, content);
                    errorMessage += `\n[${line}, ${column}] ${printParseErrorCode(parseError.error)}`;
                }
                throw new Error(errorMessage);
            }
            return proxyConfiguration;
        }
        case '.mjs':
            // Load the ESM configuration file using the TypeScript dynamic import workaround.
            // Once TypeScript provides support for keeping the dynamic import this workaround can be
            // changed to a direct dynamic import.
            return (await (0, load_esm_1.loadEsmModule)((0, url_1.pathToFileURL)(proxyPath))).default;
        case '.cjs':
            return require(proxyPath);
        default:
            // The file could be either CommonJS or ESM.
            // CommonJS is tried first then ESM if loading fails.
            try {
                return require(proxyPath);
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                if (e.code === 'ERR_REQUIRE_ESM') {
                    // Load the ESM configuration file using the TypeScript dynamic import workaround.
                    // Once TypeScript provides support for keeping the dynamic import this workaround can be
                    // changed to a direct dynamic import.
                    return (await (0, load_esm_1.loadEsmModule)((0, url_1.pathToFileURL)(proxyPath))).default;
                }
                throw e;
            }
    }
}
/**
 * Calculates the line and column for an error offset in the content of a JSON file.
 * @param location The offset error location from the beginning of the content.
 * @param content The full content of the file containing the error.
 * @returns An object containing the line and column
 */
function getJsonErrorLineColumn(offset, content) {
    if (offset === 0) {
        return { line: 1, column: 1 };
    }
    let line = 0;
    let position = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        ++line;
        const nextNewline = content.indexOf('\n', position);
        if (nextNewline === -1 || nextNewline > offset) {
            break;
        }
        position = nextNewline + 1;
    }
    return { line, column: offset - position + 1 };
}
/**
 * Find the default server path. We don't want to expose baseHref and deployUrl as arguments, only
 * the browser options where needed. This method should stay private (people who want to resolve
 * baseHref and deployUrl should use the buildServePath exported function.
 * @private
 */
function findDefaultServePath(baseHref, deployUrl) {
    if (!baseHref && !deployUrl) {
        return '';
    }
    if (/^(\w+:)?\/\//.test(baseHref || '') || /^(\w+:)?\/\//.test(deployUrl || '')) {
        // If baseHref or deployUrl is absolute, unsupported by ng serve
        return null;
    }
    // normalize baseHref
    // for ng serve the starting base is always `/` so a relative
    // and root relative value are identical
    const baseHrefParts = (baseHref || '').split('/').filter((part) => part !== '');
    if (baseHref && !baseHref.endsWith('/')) {
        baseHrefParts.pop();
    }
    const normalizedBaseHref = baseHrefParts.length === 0 ? '/' : `/${baseHrefParts.join('/')}/`;
    if (deployUrl && deployUrl[0] === '/') {
        if (baseHref && baseHref[0] === '/' && normalizedBaseHref !== deployUrl) {
            // If baseHref and deployUrl are root relative and not equivalent, unsupported by ng serve
            return null;
        }
        return deployUrl;
    }
    // Join together baseHref and deployUrl
    return `${normalizedBaseHref}${deployUrl || ''}`;
}
function getAllowedHostsConfig(options) {
    if (options.disableHostCheck) {
        return 'all';
    }
    else if (options.allowedHosts?.length) {
        return options.allowedHosts;
    }
    return undefined;
}
function getWebSocketSettings(options, servePath) {
    const { hmr, liveReload } = options;
    if (!hmr && !liveReload) {
        return {
            webSocketServer: false,
            client: undefined,
        };
    }
    const webSocketPath = path_1.posix.join(servePath, 'ng-cli-ws');
    return {
        webSocketServer: {
            options: {
                path: webSocketPath,
            },
        },
        client: {
            logging: 'info',
            webSocketURL: getPublicHostOptions(options, webSocketPath),
            overlay: {
                errors: true,
                warnings: false,
                runtimeErrors: false,
            },
        },
    };
}
function getPublicHostOptions(options, webSocketPath) {
    let publicHost = options.publicHost;
    if (publicHost) {
        const hostWithProtocol = !/^\w+:\/\//.test(publicHost) ? `https://${publicHost}` : publicHost;
        publicHost = new url_1.URL(hostWithProtocol).host;
    }
    return `auto://${publicHost || '0.0.0.0:0'}${webSocketPath}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2LXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svY29uZmlncy9kZXYtc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQXFEO0FBQ3JELDJCQUF3RDtBQUN4RCwrQkFBK0M7QUFDL0MsNkJBQXlDO0FBSXpDLDZDQUFrRDtBQUNsRCxtREFBcUQ7QUFDckQsK0VBQXdFO0FBQ3hFLDBEQUFzRDtBQUUvQyxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLEdBQWtEO0lBRWxELE1BQU0sRUFDSixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxFQUN2RixNQUFNLEVBQ04sSUFBSSxHQUNMLEdBQUcsR0FBRyxDQUFDO0lBRVIsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFM0QsTUFBTSxVQUFVLEdBQWtCLEVBQUUsQ0FBQztJQUNyQyxJQUFJLEdBQUcsRUFBRTtRQUNQLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDZCxNQUFNLEVBQUUsc0JBQVM7WUFDakIsT0FBTyxFQUFFLENBQUMsSUFBQSxjQUFPLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQyxDQUFDLENBQUM7S0FDSjtJQUVELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN4QixJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1YseUVBQXlFO1FBQ3pFLDRDQUE0QztRQUM1QyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQ2hCLDhE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b250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBsb2dnaW5nLCB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcHJvbWlzZXMgYXMgZnNQcm9taXNlcyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGV4dG5hbWUsIHBvc2l4LCByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBVUkwsIHBhdGhUb0ZpbGVVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgUnVsZVNldFJ1bGUgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB0eXBlIHsgQ29uZmlndXJhdGlvbiBhcyBEZXZTZXJ2ZXJDb25maWd1cmF0aW9uIH0gZnJvbSAnd2VicGFjay1kZXYtc2VydmVyJztcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zLCBXZWJwYWNrRGV2U2VydmVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuLi8uLi91dGlscy9sb2FkLWVzbSc7XG5pbXBvcnQgeyBnZXRJbmRleE91dHB1dEZpbGUgfSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWJyb3dzZXItY29uZmlnJztcbmltcG9ydCB7IEhtckxvYWRlciB9IGZyb20gJy4uL3BsdWdpbnMvaG1yL2htci1sb2FkZXInO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGV2U2VydmVyQ29uZmlnKFxuICB3Y286IFdlYnBhY2tDb25maWdPcHRpb25zPFdlYnBhY2tEZXZTZXJ2ZXJPcHRpb25zPixcbik6IFByb21pc2U8Q29uZmlndXJhdGlvbj4ge1xuICBjb25zdCB7XG4gICAgYnVpbGRPcHRpb25zOiB7IGhvc3QsIHBvcnQsIGluZGV4LCBoZWFkZXJzLCB3YXRjaCwgaG1yLCBtYWluLCBsaXZlUmVsb2FkLCBwcm94eUNvbmZpZyB9LFxuICAgIGxvZ2dlcixcbiAgICByb290LFxuICB9ID0gd2NvO1xuXG4gIGNvbnN0IHNlcnZlUGF0aCA9IGJ1aWxkU2VydmVQYXRoKHdjby5idWlsZE9wdGlvbnMsIGxvZ2dlcik7XG5cbiAgY29uc3QgZXh0cmFSdWxlczogUnVsZVNldFJ1bGVbXSA9IFtdO1xuICBpZiAoaG1yKSB7XG4gICAgZXh0cmFSdWxlcy5wdXNoKHtcbiAgICAgIGxvYWRlcjogSG1yTG9hZGVyLFxuICAgICAgaW5jbHVkZTogW3Jlc29sdmUod2NvLnJvb3QsIG1haW4pXSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGV4dHJhUGx1Z2lucyA9IFtdO1xuICBpZiAoIXdhdGNoKSB7XG4gICAgLy8gVGhlcmUncyBubyBvcHRpb24gdG8gdHVybiBvZmYgZmlsZSB3YXRjaGluZyBpbiB3ZWJwYWNrLWRldi1zZXJ2ZXIsIGJ1dFxuICAgIC8vIHdlIGNhbiBvdmVycmlkZSB0aGUgZmlsZSB3YXRjaGVyIGluc3RlYWQuXG4gICAgZXh0cmFQbHVnaW5zLnB1c2goe1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIGFwcGx5OiAoY29tcGlsZXI6IGFueSkgPT4ge1xuICAgICAgICBjb21waWxlci5ob29rcy5hZnRlckVudmlyb25tZW50LnRhcCgnYW5ndWxhci1jbGknLCAoKSA9PiB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvblxuICAgICAgICAgIGNvbXBpbGVyLndhdGNoRmlsZVN5c3RlbSA9IHsgd2F0Y2g6ICgpID0+IHt9IH07XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogZXh0cmFQbHVnaW5zLFxuICAgIG1vZHVsZToge1xuICAgICAgcnVsZXM6IGV4dHJhUnVsZXMsXG4gICAgfSxcbiAgICBkZXZTZXJ2ZXI6IHtcbiAgICAgIGhvc3QsXG4gICAgICBwb3J0LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgfSxcbiAgICAgIGhpc3RvcnlBcGlGYWxsYmFjazogISFpbmRleCAmJiB7XG4gICAgICAgIGluZGV4OiBwb3NpeC5qb2luKHNlcnZlUGF0aCwgZ2V0SW5kZXhPdXRwdXRGaWxlKGluZGV4KSksXG4gICAgICAgIGRpc2FibGVEb3RSdWxlOiB0cnVlLFxuICAgICAgICBodG1sQWNjZXB0SGVhZGVyczogWyd0ZXh0L2h0bWwnLCAnYXBwbGljYXRpb24veGh0bWwreG1sJ10sXG4gICAgICAgIHJld3JpdGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZnJvbTogbmV3IFJlZ0V4cChgXig/ISR7c2VydmVQYXRofSkvLipgKSxcbiAgICAgICAgICAgIHRvOiAoY29udGV4dCkgPT4gY29udGV4dC5wYXJzZWRVcmwuaHJlZixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIC8vIFdoZW4gc2V0dXBFeGl0U2lnbmFscyBpcyBlbmFibGVkIHdlYnBhY2stZGV2LXNlcnZlciB3aWxsIHNodXRkb3duIGdyYWNlZnVsbHkgd2hpY2ggd291bGRcbiAgICAgIC8vIHJlcXVpcmUgQ1RSTCtDIHRvIGJlIHByZXNzZWQgbXVsdGlwbGUgdGltZXMgdG8gZXhpdC5cbiAgICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2svd2VicGFjay1kZXYtc2VydmVyL2Jsb2IvYzc2YjZkMTFhMzgyMTQzNmM1ZTIwMjA3YzhhMzhkZWI2YWI3ZTMzYy9saWIvU2VydmVyLmpzI0wxODAxLUwxODI3XG4gICAgICBzZXR1cEV4aXRTaWduYWxzOiBmYWxzZSxcbiAgICAgIGNvbXByZXNzOiBmYWxzZSxcbiAgICAgIHN0YXRpYzogZmFsc2UsXG4gICAgICBzZXJ2ZXI6IGdldFNlcnZlckNvbmZpZyhyb290LCB3Y28uYnVpbGRPcHRpb25zKSxcbiAgICAgIGFsbG93ZWRIb3N0czogZ2V0QWxsb3dlZEhvc3RzQ29uZmlnKHdjby5idWlsZE9wdGlvbnMpLFxuICAgICAgZGV2TWlkZGxld2FyZToge1xuICAgICAgICBwdWJsaWNQYXRoOiBzZXJ2ZVBhdGgsXG4gICAgICAgIHN0YXRzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBsaXZlUmVsb2FkLFxuICAgICAgaG90OiBobXIgJiYgIWxpdmVSZWxvYWQgPyAnb25seScgOiBobXIsXG4gICAgICBwcm94eTogYXdhaXQgYWRkUHJveHlDb25maWcocm9vdCwgcHJveHlDb25maWcpLFxuICAgICAgLi4uZ2V0V2ViU29ja2V0U2V0dGluZ3Mod2NvLmJ1aWxkT3B0aW9ucywgc2VydmVQYXRoKSxcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIFJlc29sdmUgYW5kIGJ1aWxkIGEgVVJMIF9wYXRoXyB0aGF0IHdpbGwgYmUgdGhlIHJvb3Qgb2YgdGhlIHNlcnZlci4gVGhpcyByZXNvbHZlZCBiYXNlIGhyZWYgYW5kXG4gKiBkZXBsb3kgVVJMIGZyb20gdGhlIGJyb3dzZXIgb3B0aW9ucyBhbmQgcmV0dXJucyBhIHBhdGggZnJvbSB0aGUgcm9vdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU2VydmVQYXRoKFxuICBvcHRpb25zOiBXZWJwYWNrRGV2U2VydmVyT3B0aW9ucyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IHN0cmluZyB7XG4gIGxldCBzZXJ2ZVBhdGggPSBvcHRpb25zLnNlcnZlUGF0aDtcbiAgaWYgKHNlcnZlUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZGVmYXVsdFBhdGggPSBmaW5kRGVmYXVsdFNlcnZlUGF0aChvcHRpb25zLmJhc2VIcmVmLCBvcHRpb25zLmRlcGxveVVybCk7XG4gICAgaWYgKGRlZmF1bHRQYXRoID09IG51bGwpIHtcbiAgICAgIGxvZ2dlci53YXJuKHRhZ3Mub25lTGluZWBcbiAgICAgICAgV2FybmluZzogLS1kZXBsb3ktdXJsIGFuZC9vciAtLWJhc2UtaHJlZiBjb250YWluIHVuc3VwcG9ydGVkIHZhbHVlcyBmb3Igbmcgc2VydmUuIERlZmF1bHRcbiAgICAgICAgc2VydmUgcGF0aCBvZiAnLycgdXNlZC4gVXNlIC0tc2VydmUtcGF0aCB0byBvdmVycmlkZS5cbiAgICAgIGApO1xuICAgIH1cbiAgICBzZXJ2ZVBhdGggPSBkZWZhdWx0UGF0aCB8fCAnJztcbiAgfVxuXG4gIGlmIChzZXJ2ZVBhdGguZW5kc1dpdGgoJy8nKSkge1xuICAgIHNlcnZlUGF0aCA9IHNlcnZlUGF0aC5zbGljZSgwLCAtMSk7XG4gIH1cblxuICBpZiAoIXNlcnZlUGF0aC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICBzZXJ2ZVBhdGggPSBgLyR7c2VydmVQYXRofWA7XG4gIH1cblxuICByZXR1cm4gc2VydmVQYXRoO1xufVxuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIHRvIGVuaGFuY2UgYSB3ZWJwYWNrIGNvbmZpZyB3aXRoIFNTTCBjb25maWd1cmF0aW9uLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2VydmVyQ29uZmlnKFxuICByb290OiBzdHJpbmcsXG4gIG9wdGlvbnM6IFdlYnBhY2tEZXZTZXJ2ZXJPcHRpb25zLFxuKTogRGV2U2VydmVyQ29uZmlndXJhdGlvblsnc2VydmVyJ10ge1xuICBjb25zdCB7IHNzbCwgc3NsQ2VydCwgc3NsS2V5IH0gPSBvcHRpb25zO1xuICBpZiAoIXNzbCkge1xuICAgIHJldHVybiAnaHR0cCc7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdodHRwcycsXG4gICAgb3B0aW9uczpcbiAgICAgIHNzbENlcnQgJiYgc3NsS2V5XG4gICAgICAgID8ge1xuICAgICAgICAgICAga2V5OiByZXNvbHZlKHJvb3QsIHNzbEtleSksXG4gICAgICAgICAgICBjZXJ0OiByZXNvbHZlKHJvb3QsIHNzbENlcnQpLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgdG8gZW5oYW5jZSBhIHdlYnBhY2sgY29uZmlnIHdpdGggUHJveHkgY29uZmlndXJhdGlvbi5cbiAqIEBwcml2YXRlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGFkZFByb3h5Q29uZmlnKHJvb3Q6IHN0cmluZywgcHJveHlDb25maWc6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICBpZiAoIXByb3h5Q29uZmlnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHByb3h5UGF0aCA9IHJlc29sdmUocm9vdCwgcHJveHlDb25maWcpO1xuXG4gIGlmICghZXhpc3RzU3luYyhwcm94eVBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBQcm94eSBjb25maWd1cmF0aW9uIGZpbGUgJHtwcm94eVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG5cbiAgc3dpdGNoIChleHRuYW1lKHByb3h5UGF0aCkpIHtcbiAgICBjYXNlICcuanNvbic6IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmc1Byb21pc2VzLnJlYWRGaWxlKHByb3h5UGF0aCwgJ3V0Zi04Jyk7XG5cbiAgICAgIGNvbnN0IHsgcGFyc2UsIHByaW50UGFyc2VFcnJvckNvZGUgfSA9IGF3YWl0IGltcG9ydCgnanNvbmMtcGFyc2VyJyk7XG4gICAgICBjb25zdCBwYXJzZUVycm9yczogaW1wb3J0KCdqc29uYy1wYXJzZXInKS5QYXJzZUVycm9yW10gPSBbXTtcbiAgICAgIGNvbnN0IHByb3h5Q29uZmlndXJhdGlvbiA9IHBhcnNlKGNvbnRlbnQsIHBhcnNlRXJyb3JzLCB7IGFsbG93VHJhaWxpbmdDb21tYTogdHJ1ZSB9KTtcblxuICAgICAgaWYgKHBhcnNlRXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IGBQcm94eSBjb25maWd1cmF0aW9uIGZpbGUgJHtwcm94eVBhdGh9IGNvbnRhaW5zIHBhcnNlIGVycm9yczpgO1xuICAgICAgICBmb3IgKGNvbnN0IHBhcnNlRXJyb3Igb2YgcGFyc2VFcnJvcnMpIHtcbiAgICAgICAgICBjb25zdCB7IGxpbmUsIGNvbHVtbiB9ID0gZ2V0SnNvbkVycm9yTGluZUNvbHVtbihwYXJzZUVycm9yLm9mZnNldCwgY29udGVudCk7XG4gICAgICAgICAgZXJyb3JNZXNzYWdlICs9IGBcXG5bJHtsaW5lfSwgJHtjb2x1bW59XSAke3ByaW50UGFyc2VFcnJvckNvZGUocGFyc2VFcnJvci5lcnJvcil9YDtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb3h5Q29uZmlndXJhdGlvbjtcbiAgICB9XG4gICAgY2FzZSAnLm1qcyc6XG4gICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIHJldHVybiAoYXdhaXQgbG9hZEVzbU1vZHVsZTx7IGRlZmF1bHQ6IHVua25vd24gfT4ocGF0aFRvRmlsZVVSTChwcm94eVBhdGgpKSkuZGVmYXVsdDtcbiAgICBjYXNlICcuY2pzJzpcbiAgICAgIHJldHVybiByZXF1aXJlKHByb3h5UGF0aCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIFRoZSBmaWxlIGNvdWxkIGJlIGVpdGhlciBDb21tb25KUyBvciBFU00uXG4gICAgICAvLyBDb21tb25KUyBpcyB0cmllZCBmaXJzdCB0aGVuIEVTTSBpZiBsb2FkaW5nIGZhaWxzLlxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUocHJveHlQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gJ0VSUl9SRVFVSVJFX0VTTScpIHtcbiAgICAgICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgICAgIHJldHVybiAoYXdhaXQgbG9hZEVzbU1vZHVsZTx7IGRlZmF1bHQ6IHVua25vd24gfT4ocGF0aFRvRmlsZVVSTChwcm94eVBhdGgpKSkuZGVmYXVsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsaW5lIGFuZCBjb2x1bW4gZm9yIGFuIGVycm9yIG9mZnNldCBpbiB0aGUgY29udGVudCBvZiBhIEpTT04gZmlsZS5cbiAqIEBwYXJhbSBsb2NhdGlvbiBUaGUgb2Zmc2V0IGVycm9yIGxvY2F0aW9uIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgY29udGVudC5cbiAqIEBwYXJhbSBjb250ZW50IFRoZSBmdWxsIGNvbnRlbnQgb2YgdGhlIGZpbGUgY29udGFpbmluZyB0aGUgZXJyb3IuXG4gKiBAcmV0dXJucyBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgbGluZSBhbmQgY29sdW1uXG4gKi9cbmZ1bmN0aW9uIGdldEpzb25FcnJvckxpbmVDb2x1bW4ob2Zmc2V0OiBudW1iZXIsIGNvbnRlbnQ6IHN0cmluZykge1xuICBpZiAob2Zmc2V0ID09PSAwKSB7XG4gICAgcmV0dXJuIHsgbGluZTogMSwgY29sdW1uOiAxIH07XG4gIH1cblxuICBsZXQgbGluZSA9IDA7XG4gIGxldCBwb3NpdGlvbiA9IDA7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgd2hpbGUgKHRydWUpIHtcbiAgICArK2xpbmU7XG5cbiAgICBjb25zdCBuZXh0TmV3bGluZSA9IGNvbnRlbnQuaW5kZXhPZignXFxuJywgcG9zaXRpb24pO1xuICAgIGlmIChuZXh0TmV3bGluZSA9PT0gLTEgfHwgbmV4dE5ld2xpbmUgPiBvZmZzZXQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHBvc2l0aW9uID0gbmV4dE5ld2xpbmUgKyAxO1xuICB9XG5cbiAgcmV0dXJuIHsgbGluZSwgY29sdW1uOiBvZmZzZXQgLSBwb3NpdGlvbiArIDEgfTtcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBkZWZhdWx0IHNlcnZlciBwYXRoLiBXZSBkb24ndCB3YW50IHRvIGV4cG9zZSBiYXNlSHJlZiBhbmQgZGVwbG95VXJsIGFzIGFyZ3VtZW50cywgb25seVxuICogdGhlIGJyb3dzZXIgb3B0aW9ucyB3aGVyZSBuZWVkZWQuIFRoaXMgbWV0aG9kIHNob3VsZCBzdGF5IHByaXZhdGUgKHBlb3BsZSB3aG8gd2FudCB0byByZXNvbHZlXG4gKiBiYXNlSHJlZiBhbmQgZGVwbG95VXJsIHNob3VsZCB1c2UgdGhlIGJ1aWxkU2VydmVQYXRoIGV4cG9ydGVkIGZ1bmN0aW9uLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZmluZERlZmF1bHRTZXJ2ZVBhdGgoYmFzZUhyZWY/OiBzdHJpbmcsIGRlcGxveVVybD86IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIWJhc2VIcmVmICYmICFkZXBsb3lVcmwpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBpZiAoL14oXFx3KzopP1xcL1xcLy8udGVzdChiYXNlSHJlZiB8fCAnJykgfHwgL14oXFx3KzopP1xcL1xcLy8udGVzdChkZXBsb3lVcmwgfHwgJycpKSB7XG4gICAgLy8gSWYgYmFzZUhyZWYgb3IgZGVwbG95VXJsIGlzIGFic29sdXRlLCB1bnN1cHBvcnRlZCBieSBuZyBzZXJ2ZVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gbm9ybWFsaXplIGJhc2VIcmVmXG4gIC8vIGZvciBuZyBzZXJ2ZSB0aGUgc3RhcnRpbmcgYmFzZSBpcyBhbHdheXMgYC9gIHNvIGEgcmVsYXRpdmVcbiAgLy8gYW5kIHJvb3QgcmVsYXRpdmUgdmFsdWUgYXJlIGlkZW50aWNhbFxuICBjb25zdCBiYXNlSHJlZlBhcnRzID0gKGJhc2VIcmVmIHx8ICcnKS5zcGxpdCgnLycpLmZpbHRlcigocGFydCkgPT4gcGFydCAhPT0gJycpO1xuICBpZiAoYmFzZUhyZWYgJiYgIWJhc2VIcmVmLmVuZHNXaXRoKCcvJykpIHtcbiAgICBiYXNlSHJlZlBhcnRzLnBvcCgpO1xuICB9XG4gIGNvbnN0IG5vcm1hbGl6ZWRCYXNlSHJlZiA9IGJhc2VIcmVmUGFydHMubGVuZ3RoID09PSAwID8gJy8nIDogYC8ke2Jhc2VIcmVmUGFydHMuam9pbignLycpfS9gO1xuXG4gIGlmIChkZXBsb3lVcmwgJiYgZGVwbG95VXJsWzBdID09PSAnLycpIHtcbiAgICBpZiAoYmFzZUhyZWYgJiYgYmFzZUhyZWZbMF0gPT09ICcvJyAmJiBub3JtYWxpemVkQmFzZUhyZWYgIT09IGRlcGxveVVybCkge1xuICAgICAgLy8gSWYgYmFzZUhyZWYgYW5kIGRlcGxveVVybCBhcmUgcm9vdCByZWxhdGl2ZSBhbmQgbm90IGVxdWl2YWxlbnQsIHVuc3VwcG9ydGVkIGJ5IG5nIHNlcnZlXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVwbG95VXJsO1xuICB9XG5cbiAgLy8gSm9pbiB0b2dldGhlciBiYXNlSHJlZiBhbmQgZGVwbG95VXJsXG4gIHJldHVybiBgJHtub3JtYWxpemVkQmFzZUhyZWZ9JHtkZXBsb3lVcmwgfHwgJyd9YDtcbn1cblxuZnVuY3Rpb24gZ2V0QWxsb3dlZEhvc3RzQ29uZmlnKFxuICBvcHRpb25zOiBXZWJwYWNrRGV2U2VydmVyT3B0aW9ucyxcbik6IERldlNlcnZlckNvbmZpZ3VyYXRpb25bJ2FsbG93ZWRIb3N0cyddIHtcbiAgaWYgKG9wdGlvbnMuZGlzYWJsZUhvc3RDaGVjaykge1xuICAgIHJldHVybiAnYWxsJztcbiAgfSBlbHNlIGlmIChvcHRpb25zLmFsbG93ZWRIb3N0cz8ubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuYWxsb3dlZEhvc3RzO1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0V2ViU29ja2V0U2V0dGluZ3MoXG4gIG9wdGlvbnM6IFdlYnBhY2tEZXZTZXJ2ZXJPcHRpb25zLFxuICBzZXJ2ZVBhdGg6IHN0cmluZyxcbik6IHtcbiAgd2ViU29ja2V0U2VydmVyPzogRGV2U2VydmVyQ29uZmlndXJhdGlvblsnd2ViU29ja2V0U2VydmVyJ107XG4gIGNsaWVudD86IERldlNlcnZlckNvbmZpZ3VyYXRpb25bJ2NsaWVudCddO1xufSB7XG4gIGNvbnN0IHsgaG1yLCBsaXZlUmVsb2FkIH0gPSBvcHRpb25zO1xuICBpZiAoIWhtciAmJiAhbGl2ZVJlbG9hZCkge1xuICAgIHJldHVybiB7XG4gICAgICB3ZWJTb2NrZXRTZXJ2ZXI6IGZhbHNlLFxuICAgICAgY2xpZW50OiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHdlYlNvY2tldFBhdGggPSBwb3NpeC5qb2luKHNlcnZlUGF0aCwgJ25nLWNsaS13cycpO1xuXG4gIHJldHVybiB7XG4gICAgd2ViU29ja2V0U2VydmVyOiB7XG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIHBhdGg6IHdlYlNvY2tldFBhdGgsXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2xpZW50OiB7XG4gICAgICBsb2dnaW5nOiAnaW5mbycsXG4gICAgICB3ZWJTb2NrZXRVUkw6IGdldFB1YmxpY0hvc3RPcHRpb25zKG9wdGlvbnMsIHdlYlNvY2tldFBhdGgpLFxuICAgICAgb3ZlcmxheToge1xuICAgICAgICBlcnJvcnM6IHRydWUsXG4gICAgICAgIHdhcm5pbmdzOiBmYWxzZSxcbiAgICAgICAgcnVudGltZUVycm9yczogZmFsc2UsXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFB1YmxpY0hvc3RPcHRpb25zKG9wdGlvbnM6IFdlYnBhY2tEZXZTZXJ2ZXJPcHRpb25zLCB3ZWJTb2NrZXRQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcHVibGljSG9zdDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG9wdGlvbnMucHVibGljSG9zdDtcbiAgaWYgKHB1YmxpY0hvc3QpIHtcbiAgICBjb25zdCBob3N0V2l0aFByb3RvY29sID0gIS9eXFx3KzpcXC9cXC8vLnRlc3QocHVibGljSG9zdCkgPyBgaHR0cHM6Ly8ke3B1YmxpY0hvc3R9YCA6IHB1YmxpY0hvc3Q7XG4gICAgcHVibGljSG9zdCA9IG5ldyBVUkwoaG9zdFdpdGhQcm90b2NvbCkuaG9zdDtcbiAgfVxuXG4gIHJldHVybiBgYXV0bzovLyR7cHVibGljSG9zdCB8fCAnMC4wLjAuMDowJ30ke3dlYlNvY2tldFBhdGh9YDtcbn1cbiJdfQ==
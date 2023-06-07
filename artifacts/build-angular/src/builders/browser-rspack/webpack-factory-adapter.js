"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackFactory = void 0;
const cli_1 = require("@rspack/cli");
const core_1 = require("@rspack/core");
const rxjs_1 = require("rxjs");
function webpackFactory(options) {
    return (0, rxjs_1.from)(createWebpackFactoryFromRspackCLI(options));
}
exports.webpackFactory = webpackFactory;
async function createWebpackFactoryFromRspackCLI(options) {
    const rspackCommand = 'build';
    process.env.RSPACK_CONFIG_VALIDATE = 'loose';
    let nodeEnv = process?.env?.NODE_ENV;
    let rspackCommandDefaultEnv = rspackCommand === 'build' ? 'production' : 'development';
    if (typeof options.nodeEnv === 'string') {
        process.env.NODE_ENV = nodeEnv || options.nodeEnv;
    }
    else {
        process.env.NODE_ENV = nodeEnv || rspackCommandDefaultEnv;
    }
    // let config = await this.loadConfig(options);
    const cli = new cli_1.RspackCLI();
    const cliOptions = {
        'watch': false,
        'devtool': false,
        'analyze': false,
        'env': {},
        'argv': {},
    };
    const config = await cli.buildConfig(webpackToRspack(options), cliOptions, rspackCommand);

    // Add tsconfig aliases
    const result = require('tsconfig-paths').loadConfig(`${process.cwd()}/tsconfig.base.json`);
    const alias = Object.keys(result.paths).reduce((acc, k) => {
      acc[k] = require('path').join(process.cwd(), result.paths[k][0]);
      return acc;
    }, {});
    config.resolve.alias = alias;

    return (0, core_1.rspack)(config);
}
function webpackToRspack(options) {
    const { mode, devtool, target, entry, profile, resolve, output, watch, experiments, optimization, module, plugins, } = options;
    const convertResolve = (resolve = {}) => {
        const { extensions } = resolve;
        return {
            extensions: extensions,
        };
    };
    const convertOutput = (output) => {
        const { uniqueName, hashFunction, clean, path, publicPath, filename, chunkFilename, crossOriginLoading, trustedTypes, scriptType, } = output;
        return {
            uniqueName,
            // hashFunction,
            clean,
            path,
            publicPath,
            filename,
            chunkFilename,
            crossOriginLoading,
            trustedTypes,
        };
    };
    const convertExperiments = (experiments) => {
        const { asyncWebAssembly } = experiments;
        return { asyncWebAssembly };
    };
    const convertOptimization = (optimization) => {
        const { minimize, runtimeChunk, splitChunks } = optimization;
        const { cacheGroups } = splitChunks;
        delete cacheGroups.common.enforce;
        return {
            // fixme: hacks
            minimize: true,
            // fixme: hacks
            runtimeChunk: false,
            splitChunks: {
                // maxAsyncRequests: splitChunks?.maxAsyncRequests,
                cacheGroups: {
                    default: cacheGroups['default'],
                    common: cacheGroups.common,
                },
            },
        };
    };
    const convertModule = (module) => {
        const { parser, rules } = module;
        const wrapLoaderInUse = (rule) => {
            if (!rule.loader)
                return rule;
            rule.use = rule.use || [];
            rule.use.push({ loader: rule.loader });
            delete rule.loader;
            return rule;
        };
        const convertRules = (rules) => {
            return rules
                .filter((rule) => !rule.test.test('skip_css_rule.css'))
                .filter((rule) => !rule.test.test('skip_css_rule.scss'))
                .filter((rule) => rule.test.toString().indexOf('sass') === -1)
                .filter((rule) => rule.test.toString().indexOf('less') === -1)
                .map((rule) => wrapLoaderInUse(rule));
        };
        // fixme: hacks
        delete parser.javascript.worker;
        let _rules = convertRules(rules);
        _rules = [
            ..._rules,
            {
                test: /\.?(scss)$/,
                resourceQuery: /\?ngResource/,
                use: [{ loader: 'raw-loader' }, { loader: 'sass-loader' }],
            },
        ];
        return {
            parser,
            rules: _rules,
        };
    };
    const convertPlugins = (plugins) => {
        // fixme: hacks
        const res = plugins
            .filter((plugin) => plugin.apply.toString().indexOf('compiler.hooks.shutdown') === -1)
            .filter((plugin) => plugin?.constructor?.name !== 'MiniCssExtractPlugin')
            .filter((plugin) => plugin?.constructor?.name !== 'LicenseWebpackPlugin')
            .filter((plugin) => plugin?.constructor?.name !== 'DedupeModuleResolvePlugin')
            .filter((plugin) => plugin?.constructor?.name !== 'AnyComponentStyleBudgetChecker')
            .filter((plugin) => plugin?.constructor?.name !== 'CommonJsUsageWarnPlugin')
            // fixme: hacks
            // .filter((plugin: any) => plugin?.constructor?.name !== 'ProgressPlugin')
            .filter((plugin) => plugin?.constructor?.name !== 'StylesWebpackPlugin');
        // .filter((plugin) => plugin?.constructor?.name !== 'SuppressExtractedTextChunksWebpackPlugin')
        return res;
    };
    // const builtins = { html: [{ template: './src/index.html' }] };
    const res = {
        mode,
        devtool: devtool,
        target: target,
        entry,
        resolve: convertResolve(resolve),
        output: convertOutput(output),
        watch,
        experiments: convertExperiments(experiments),
        optimization: convertOptimization(optimization),
        // builtins,
        module: convertModule(module),
        plugins: convertPlugins(plugins),
        // fixme: hacks
        cache: true,
    };
    return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1mYWN0b3J5LWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLXJzcGFjay93ZWJwYWNrLWZhY3RvcnktYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBd0M7QUFDeEMsdUNBQW9FO0FBQ3BFLCtCQUF3QztBQVF4QyxTQUFnQixjQUFjLENBQUMsT0FBWTtJQUN6QyxPQUFPLElBQUEsV0FBSSxFQUFDLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxDQUEwQyxDQUFDO0FBQ25HLENBQUM7QUFGRCx3Q0FFQztBQUVELEtBQUssVUFBVSxpQ0FBaUMsQ0FBQyxPQUFZO0lBQzNELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQztJQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixHQUFHLE9BQU8sQ0FBQztJQUM3QyxJQUFJLE9BQU8sR0FBRyxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQztJQUNyQyxJQUFJLHVCQUF1QixHQUFHLGFBQWEsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0lBQ3ZGLElBQUksT0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFBRTtRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUNuRDtTQUFNO1FBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLHVCQUF1QixDQUFDO0tBQzNEO0lBQ0QsK0NBQStDO0lBQy9DLE1BQU0sR0FBRyxHQUFHLElBQUksZUFBUyxFQUFFLENBQUM7SUFDNUIsTUFBTSxVQUFVLEdBQUc7UUFDakIsT0FBTyxFQUFFLEtBQUs7UUFD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aEMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDN0IsS0FBSztRQUNMLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7UUFDNUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDLFlBQVksQ0FBQztRQUMvQyxZQUFZO1FBQ1osTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDN0IsT0FBTyxFQUFFLGNBQWMsQ0FBQyxPQUFPLENBQUM7UUFFaEMsZUFBZTtRQUNmLEtBQUssRUFBRSxJQUFJO0tBQ1osQ0FBQztJQUVGLE9BQU8sR0FBVSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgUnNwYWNrQ0xJIH0gZnJvbSAnQHJzcGFjay9jbGknO1xuaW1wb3J0IHsgRGV2VG9vbCwgTW9kZSwgcnNwYWNrLCBSc3BhY2tPcHRpb25zIH0gZnJvbSAnQHJzcGFjay9jb3JlJztcbmltcG9ydCB7IGZyb20sIE9ic2VydmFibGUgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IE5hbWVkQ2h1bmtzUGx1Z2luIH0gZnJvbSAnLi4vLi4vd2VicGFjay9wbHVnaW5zL25hbWVkLWNodW5rcy1wbHVnaW4nO1xuaW1wb3J0IHsgT2NjdXJyZW5jZXNQbHVnaW4gfSBmcm9tICcuLi8uLi93ZWJwYWNrL3BsdWdpbnMvb2NjdXJyZW5jZXMtcGx1Z2luJztcbmltcG9ydCB7IEFuZ3VsYXJXZWJwYWNrUGx1Z2luIH0gZnJvbSAnQG5ndG9vbHMvd2VicGFjayc7XG5pbXBvcnQgd2VicGFjayBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IFRhcmdldCB9IGZyb20gJ0Byc3BhY2svY29yZS9kaXN0L2NvbmZpZy90eXBlcyc7XG5pbXBvcnQgeyBQcm9ncmVzc1BsdWdpbiB9IGZyb20gJy4vcGx1Z2lucy9wcm9ncmVzcy1wbHVnaW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gd2VicGFja0ZhY3Rvcnkob3B0aW9uczogYW55KSB7XG4gIHJldHVybiBmcm9tKGNyZWF0ZVdlYnBhY2tGYWN0b3J5RnJvbVJzcGFja0NMSShvcHRpb25zKSkgYXMgdW5rbm93biBhcyBPYnNlcnZhYmxlPHR5cGVvZiB3ZWJwYWNrPjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlV2VicGFja0ZhY3RvcnlGcm9tUnNwYWNrQ0xJKG9wdGlvbnM6IGFueSkge1xuICBjb25zdCByc3BhY2tDb21tYW5kID0gJ2J1aWxkJztcbiAgcHJvY2Vzcy5lbnYuUlNQQUNLX0NPTkZJR19WQUxJREFURSA9ICdsb29zZSc7XG4gIGxldCBub2RlRW52ID0gcHJvY2Vzcz8uZW52Py5OT0RFX0VOVjtcbiAgbGV0IHJzcGFja0NvbW1hbmREZWZhdWx0RW52ID0gcnNwYWNrQ29tbWFuZCA9PT0gJ2J1aWxkJyA/ICdwcm9kdWN0aW9uJyA6ICdkZXZlbG9wbWVudCc7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5ub2RlRW52ID09PSAnc3RyaW5nJykge1xuICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID0gbm9kZUVudiB8fCBvcHRpb25zLm5vZGVFbnY7XG4gIH0gZWxzZSB7XG4gICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSBub2RlRW52IHx8IHJzcGFja0NvbW1hbmREZWZhdWx0RW52O1xuICB9XG4gIC8vIGxldCBjb25maWcgPSBhd2FpdCB0aGlzLmxvYWRDb25maWcob3B0aW9ucyk7XG4gIGNvbnN0IGNsaSA9IG5ldyBSc3BhY2tDTEkoKTtcbiAgY29uc3QgY2xpT3B0aW9ucyA9IHtcbiAgICAnd2F0Y2gnOiBmYWxzZSxcbiAgICAnZGV2dG9vbCc6IGZhbHNlLFxuICAgICdhbmFseXplJzogZmFsc2UsXG4gICAgJ2Vudic6IHt9LFxuICAgICdhcmd2Jzoge30sXG4gIH07XG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGNsaS5idWlsZENvbmZpZyh3ZWJwYWNrVG9Sc3BhY2sob3B0aW9ucyksIGNsaU9wdGlvbnMsIHJzcGFja0NvbW1hbmQpO1xuXG4gIHJldHVybiByc3BhY2soY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gd2VicGFja1RvUnNwYWNrKG9wdGlvbnM6IHdlYnBhY2suQ29uZmlndXJhdGlvbik6IFJzcGFja09wdGlvbnMge1xuICBjb25zdCB7XG4gICAgbW9kZSxcbiAgICBkZXZ0b29sLFxuICAgIHRhcmdldCxcbiAgICBlbnRyeSxcbiAgICBwcm9maWxlLFxuICAgIHJlc29sdmUsXG4gICAgb3V0cHV0LFxuICAgIHdhdGNoLFxuICAgIGV4cGVyaW1lbnRzLFxuICAgIG9wdGltaXphdGlvbixcbiAgICBtb2R1bGUsXG4gICAgcGx1Z2lucyxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgY29udmVydFJlc29sdmUgPSAocmVzb2x2ZTogd2VicGFjay5SZXNvbHZlT3B0aW9ucyA9IHt9KSA9PiB7XG4gICAgY29uc3QgeyBleHRlbnNpb25zIH0gPSByZXNvbHZlO1xuICAgIHJldHVybiB7XG4gICAgICBleHRlbnNpb25zOiBleHRlbnNpb25zLFxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgY29udmVydE91dHB1dCA9IChvdXRwdXQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IHtcbiAgICAgIHVuaXF1ZU5hbWUsXG4gICAgICBoYXNoRnVuY3Rpb24sXG4gICAgICBjbGVhbixcbiAgICAgIHBhdGgsXG4gICAgICBwdWJsaWNQYXRoLFxuICAgICAgZmlsZW5hbWUsXG4gICAgICBjaHVua0ZpbGVuYW1lLFxuICAgICAgY3Jvc3NPcmlnaW5Mb2FkaW5nLFxuICAgICAgdHJ1c3RlZFR5cGVzLFxuICAgICAgc2NyaXB0VHlwZSxcbiAgICB9ID0gb3V0cHV0O1xuICAgIHJldHVybiB7XG4gICAgICB1bmlxdWVOYW1lLFxuICAgICAgLy8gaGFzaEZ1bmN0aW9uLFxuICAgICAgY2xlYW4sXG4gICAgICBwYXRoLFxuICAgICAgcHVibGljUGF0aCxcbiAgICAgIGZpbGVuYW1lLFxuICAgICAgY2h1bmtGaWxlbmFtZSxcbiAgICAgIGNyb3NzT3JpZ2luTG9hZGluZyxcbiAgICAgIHRydXN0ZWRUeXBlcyxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGNvbnZlcnRFeHBlcmltZW50cyA9IChleHBlcmltZW50czogYW55KSA9PiB7XG4gICAgY29uc3QgeyBhc3luY1dlYkFzc2VtYmx5IH0gPSBleHBlcmltZW50cztcbiAgICByZXR1cm4geyBhc3luY1dlYkFzc2VtYmx5IH07XG4gIH07XG5cbiAgY29uc3QgY29udmVydE9wdGltaXphdGlvbiA9IChvcHRpbWl6YXRpb246IGFueSkgPT4ge1xuICAgIGNvbnN0IHsgbWluaW1pemUsIHJ1bnRpbWVDaHVuaywgc3BsaXRDaHVua3MgfSA9IG9wdGltaXphdGlvbjtcblxuICAgIGNvbnN0IHsgY2FjaGVHcm91cHMgfSA9IHNwbGl0Q2h1bmtzO1xuICAgIGRlbGV0ZSBjYWNoZUdyb3Vwcy5jb21tb24uZW5mb3JjZTtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBmaXhtZTogaGFja3NcbiAgICAgIG1pbmltaXplOiB0cnVlLFxuICAgICAgLy8gZml4bWU6IGhhY2tzXG4gICAgICBydW50aW1lQ2h1bms6IGZhbHNlLFxuICAgICAgc3BsaXRDaHVua3M6IHtcbiAgICAgICAgLy8gbWF4QXN5bmNSZXF1ZXN0czogc3BsaXRDaHVua3M/Lm1heEFzeW5jUmVxdWVzdHMsXG4gICAgICAgIGNhY2hlR3JvdXBzOiB7XG4gICAgICAgICAgZGVmYXVsdDogY2FjaGVHcm91cHNbJ2RlZmF1bHQnXSxcbiAgICAgICAgICBjb21tb246IGNhY2hlR3JvdXBzLmNvbW1vbixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBjb252ZXJ0TW9kdWxlID0gKG1vZHVsZTogYW55KSA9PiB7XG4gICAgY29uc3QgeyBwYXJzZXIsIHJ1bGVzIH0gPSBtb2R1bGU7XG5cbiAgICBjb25zdCB3cmFwTG9hZGVySW5Vc2UgPSAocnVsZTogYW55KSA9PiB7XG4gICAgICBpZiAoIXJ1bGUubG9hZGVyKSByZXR1cm4gcnVsZTtcbiAgICAgIHJ1bGUudXNlID0gcnVsZS51c2UgfHwgW107XG4gICAgICBydWxlLnVzZS5wdXNoKHsgbG9hZGVyOiBydWxlLmxvYWRlciB9KTtcbiAgICAgIGRlbGV0ZSBydWxlLmxvYWRlcjtcblxuICAgICAgcmV0dXJuIHJ1bGU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbnZlcnRSdWxlcyA9IChydWxlczogYW55W10pID0+IHtcbiAgICAgIHJldHVybiBydWxlc1xuICAgICAgICAuZmlsdGVyKChydWxlKSA9PiAhcnVsZS50ZXN0LnRlc3QoJ3NraXBfY3NzX3J1bGUuY3NzJykpXG4gICAgICAgIC5maWx0ZXIoKHJ1bGUpID0+ICFydWxlLnRlc3QudGVzdCgnc2tpcF9jc3NfcnVsZS5zY3NzJykpXG4gICAgICAgIC5maWx0ZXIoKHJ1bGUpID0+IHJ1bGUudGVzdC50b1N0cmluZygpLmluZGV4T2YoJ3Nhc3MnKSA9PT0gLTEpXG4gICAgICAgIC5maWx0ZXIoKHJ1bGUpID0+IHJ1bGUudGVzdC50b1N0cmluZygpLmluZGV4T2YoJ2xlc3MnKSA9PT0gLTEpXG4gICAgICAgIC5tYXAoKHJ1bGUpID0+IHdyYXBMb2FkZXJJblVzZShydWxlKSk7XG4gICAgfTtcblxuICAgIC8vIGZpeG1lOiBoYWNrc1xuICAgIGRlbGV0ZSBwYXJzZXIuamF2YXNjcmlwdC53b3JrZXI7XG5cbiAgICBsZXQgX3J1bGVzID0gY29udmVydFJ1bGVzKHJ1bGVzKTtcbiAgICBfcnVsZXMgPSBbXG4gICAgICAuLi5fcnVsZXMsXG4gICAgICB7XG4gICAgICAgIHRlc3Q6IC9cXC4/KHNjc3MpJC8sXG4gICAgICAgIHJlc291cmNlUXVlcnk6IC9cXD9uZ1Jlc291cmNlLyxcbiAgICAgICAgdXNlOiBbeyBsb2FkZXI6ICdyYXctbG9hZGVyJyB9LCB7IGxvYWRlcjogJ3Nhc3MtbG9hZGVyJyB9XSxcbiAgICAgIH0sXG4gICAgXTtcbiAgICByZXR1cm4ge1xuICAgICAgcGFyc2VyLFxuICAgICAgcnVsZXM6IF9ydWxlcyxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IGNvbnZlcnRQbHVnaW5zID0gKHBsdWdpbnM6IGFueSkgPT4ge1xuICAgIC8vIGZpeG1lOiBoYWNrc1xuICAgIGNvbnN0IHJlcyA9IHBsdWdpbnNcbiAgICAgIC5maWx0ZXIoKHBsdWdpbjogYW55KSA9PiBwbHVnaW4uYXBwbHkudG9TdHJpbmcoKS5pbmRleE9mKCdjb21waWxlci5ob29rcy5zaHV0ZG93bicpID09PSAtMSlcbiAgICAgIC5maWx0ZXIoKHBsdWdpbjogYW55KSA9PiBwbHVnaW4/LmNvbnN0cnVjdG9yPy5uYW1lICE9PSAnTWluaUNzc0V4dHJhY3RQbHVnaW4nKVxuICAgICAgLmZpbHRlcigocGx1Z2luOiBhbnkpID0+IHBsdWdpbj8uY29uc3RydWN0b3I/Lm5hbWUgIT09ICdMaWNlbnNlV2VicGFja1BsdWdpbicpXG4gICAgICAuZmlsdGVyKChwbHVnaW46IGFueSkgPT4gcGx1Z2luPy5jb25zdHJ1Y3Rvcj8ubmFtZSAhPT0gJ0RlZHVwZU1vZHVsZVJlc29sdmVQbHVnaW4nKVxuICAgICAgLmZpbHRlcigocGx1Z2luOiBhbnkpID0+IHBsdWdpbj8uY29uc3RydWN0b3I/Lm5hbWUgIT09ICdBbnlDb21wb25lbnRTdHlsZUJ1ZGdldENoZWNrZXInKVxuICAgICAgLmZpbHRlcigocGx1Z2luOiBhbnkpID0+IHBsdWdpbj8uY29uc3RydWN0b3I/Lm5hbWUgIT09ICdDb21tb25Kc1VzYWdlV2FyblBsdWdpbicpXG4gICAgICAvLyBmaXhtZTogaGFja3NcbiAgICAgIC8vIC5maWx0ZXIoKHBsdWdpbjogYW55KSA9PiBwbHVnaW4/LmNvbnN0cnVjdG9yPy5uYW1lICE9PSAnUHJvZ3Jlc3NQbHVnaW4nKVxuICAgICAgLmZpbHRlcigocGx1Z2luOiBhbnkpID0+IHBsdWdpbj8uY29uc3RydWN0b3I/Lm5hbWUgIT09ICdTdHlsZXNXZWJwYWNrUGx1Z2luJyk7XG4gICAgLy8gLmZpbHRlcigocGx1Z2luKSA9PiBwbHVnaW4/LmNvbnN0cnVjdG9yPy5uYW1lICE9PSAnU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzV2VicGFja1BsdWdpbicpXG5cbiAgICByZXR1cm4gcmVzO1xuICB9O1xuXG4gIC8vIGNvbnN0IGJ1aWx0aW5zID0geyBodG1sOiBbeyB0ZW1wbGF0ZTogJy4vc3JjL2luZGV4Lmh0bWwnIH1dIH07XG5cbiAgY29uc3QgcmVzID0ge1xuICAgIG1vZGUsXG4gICAgZGV2dG9vbDogZGV2dG9vbCBhcyBEZXZUb29sLFxuICAgIHRhcmdldDogdGFyZ2V0IGFzIFRhcmdldCxcbiAgICBlbnRyeSxcbiAgICByZXNvbHZlOiBjb252ZXJ0UmVzb2x2ZShyZXNvbHZlKSxcbiAgICBvdXRwdXQ6IGNvbnZlcnRPdXRwdXQob3V0cHV0KSxcbiAgICB3YXRjaCxcbiAgICBleHBlcmltZW50czogY29udmVydEV4cGVyaW1lbnRzKGV4cGVyaW1lbnRzKSxcbiAgICBvcHRpbWl6YXRpb246IGNvbnZlcnRPcHRpbWl6YXRpb24ob3B0aW1pemF0aW9uKSxcbiAgICAvLyBidWlsdGlucyxcbiAgICBtb2R1bGU6IGNvbnZlcnRNb2R1bGUobW9kdWxlKSxcbiAgICBwbHVnaW5zOiBjb252ZXJ0UGx1Z2lucyhwbHVnaW5zKSxcblxuICAgIC8vIGZpeG1lOiBoYWNrc1xuICAgIGNhY2hlOiB0cnVlLFxuICB9O1xuXG4gIHJldHVybiByZXMgYXMgYW55O1xufVxuIl19

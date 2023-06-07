"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runModuleAsObservableFork = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const treeKill = require('tree-kill');
function runModuleAsObservableFork(cwd, modulePath, exportName, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
args) {
    return new rxjs_1.Observable((obs) => {
        const workerPath = (0, path_1.resolve)(__dirname, './run-module-worker.js');
        const debugArgRegex = /--inspect(?:-brk|-port)?|--debug(?:-brk|-port)/;
        const execArgv = process.execArgv.filter((arg) => {
            // Remove debug args.
            // Workaround for https://github.com/nodejs/node/issues/9435
            return !debugArgRegex.test(arg);
        });
        const forkOptions = {
            cwd,
            execArgv,
        };
        // TODO: support passing in a logger to use as stdio streams
        // if (logger) {
        //   (forkOptions as any).stdio = [
        //     'ignore',
        //     logger.info, // make it a stream
        //     logger.error, // make it a stream
        //   ];
        // }
        const forkedProcess = (0, child_process_1.fork)(workerPath, undefined, forkOptions);
        // Cleanup.
        const killForkedProcess = () => {
            if (forkedProcess && forkedProcess.pid) {
                treeKill(forkedProcess.pid, 'SIGTERM');
            }
        };
        // Handle child process exit.
        const handleChildProcessExit = (code) => {
            killForkedProcess();
            if (code && code !== 0) {
                obs.error();
            }
            obs.next({ success: true });
            obs.complete();
        };
        forkedProcess.once('exit', handleChildProcessExit);
        forkedProcess.once('SIGINT', handleChildProcessExit);
        forkedProcess.once('uncaughtException', handleChildProcessExit);
        // Handle parent process exit.
        const handleParentProcessExit = () => {
            killForkedProcess();
        };
        process.once('exit', handleParentProcessExit);
        process.once('SIGINT', handleParentProcessExit);
        process.once('uncaughtException', handleParentProcessExit);
        // Run module.
        forkedProcess.send({
            hash: '5d4b9a5c0a4e0f9977598437b0e85bcc',
            modulePath,
            exportName,
            args,
        });
        // Teardown logic. When unsubscribing, kill the forked process.
        return killForkedProcess;
    });
}
exports.runModuleAsObservableFork = runModuleAsObservableFork;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLW1vZHVsZS1hcy1vYnNlcnZhYmxlLWZvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9ydW4tbW9kdWxlLWFzLW9ic2VydmFibGUtZm9yay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCxpREFBa0Q7QUFDbEQsK0JBQStCO0FBQy9CLCtCQUFrQztBQUVsQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFdEMsU0FBZ0IseUJBQXlCLENBQ3ZDLEdBQVcsRUFDWCxVQUFrQixFQUNsQixVQUE4QjtBQUM5Qiw4REFBOEQ7QUFDOUQsSUFBVztJQUVYLE9BQU8sSUFBSSxpQkFBVSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDNUIsTUFBTSxVQUFVLEdBQVcsSUFBQSxjQUFPLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFFeEUsTUFBTSxhQUFhLEdBQUcsZ0RBQWdELENBQUM7UUFDdkUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMvQyxxQkFBcUI7WUFDckIsNERBQTREO1lBQzVELE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQWlCO1lBQ2hDLEdBQUc7WUFDSCxRQUFRO1NBQ2EsQ0FBQztRQUV4Qiw0REFBNEQ7UUFDNUQsZ0JBQWdCO1FBQ2hCLG1DQUFtQztRQUNuQyxnQkFBZ0I7UUFDaEIsdUNBQXVDO1FBQ3ZDLHdDQUF3QztRQUN4QyxPQUFPO1FBQ1AsSUFBSTtRQUVKLE1BQU0sYUFBYSxHQUFHLElBQUEsb0JBQUksRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRS9ELFdBQVc7UUFDWCxNQUFNLGlCQUFpQixHQUFHLEdBQUcsRUFBRTtZQUM3QixJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsR0FBRyxFQUFFO2dCQUN0QyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUN4QztRQUNILENBQUMsQ0FBQztRQUVGLDZCQUE2QjtRQUM3QixNQUFNLHNCQUFzQixHQUFHLENBQUMsSUFBYSxFQUFFLEVBQUU7WUFDL0MsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDYjtZQUNELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM1QixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBQ0YsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUNuRCxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3JELGFBQWEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUVoRSw4QkFBOEI7UUFDOUIsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLEVBQUU7WUFDbkMsaUJBQWlCLEVBQUUsQ0FBQztRQUN0QixDQUFDLENBQUM7UUFDRixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQzlDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBRTNELGNBQWM7UUFDZCxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ2pCLElBQUksRUFBRSxrQ0FBa0M7WUFDeEMsVUFBVTtZQUNWLFVBQVU7WUFDVixJQUFJO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsK0RBQStEO1FBQy9ELE9BQU8saUJBQWlCLENBQUM7SUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBdkVELDhEQXVFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyT3V0cHV0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBGb3JrT3B0aW9ucywgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuXG5jb25zdCB0cmVlS2lsbCA9IHJlcXVpcmUoJ3RyZWUta2lsbCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gcnVuTW9kdWxlQXNPYnNlcnZhYmxlRm9yayhcbiAgY3dkOiBzdHJpbmcsXG4gIG1vZHVsZVBhdGg6IHN0cmluZyxcbiAgZXhwb3J0TmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBhcmdzOiBhbnlbXSxcbik6IE9ic2VydmFibGU8QnVpbGRlck91dHB1dD4ge1xuICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9icykgPT4ge1xuICAgIGNvbnN0IHdvcmtlclBhdGg6IHN0cmluZyA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi9ydW4tbW9kdWxlLXdvcmtlci5qcycpO1xuXG4gICAgY29uc3QgZGVidWdBcmdSZWdleCA9IC8tLWluc3BlY3QoPzotYnJrfC1wb3J0KT98LS1kZWJ1Zyg/Oi1icmt8LXBvcnQpLztcbiAgICBjb25zdCBleGVjQXJndiA9IHByb2Nlc3MuZXhlY0FyZ3YuZmlsdGVyKChhcmcpID0+IHtcbiAgICAgIC8vIFJlbW92ZSBkZWJ1ZyBhcmdzLlxuICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlcy85NDM1XG4gICAgICByZXR1cm4gIWRlYnVnQXJnUmVnZXgudGVzdChhcmcpO1xuICAgIH0pO1xuICAgIGNvbnN0IGZvcmtPcHRpb25zOiBGb3JrT3B0aW9ucyA9ICh7XG4gICAgICBjd2QsXG4gICAgICBleGVjQXJndixcbiAgICB9IGFzIHt9KSBhcyBGb3JrT3B0aW9ucztcblxuICAgIC8vIFRPRE86IHN1cHBvcnQgcGFzc2luZyBpbiBhIGxvZ2dlciB0byB1c2UgYXMgc3RkaW8gc3RyZWFtc1xuICAgIC8vIGlmIChsb2dnZXIpIHtcbiAgICAvLyAgIChmb3JrT3B0aW9ucyBhcyBhbnkpLnN0ZGlvID0gW1xuICAgIC8vICAgICAnaWdub3JlJyxcbiAgICAvLyAgICAgbG9nZ2VyLmluZm8sIC8vIG1ha2UgaXQgYSBzdHJlYW1cbiAgICAvLyAgICAgbG9nZ2VyLmVycm9yLCAvLyBtYWtlIGl0IGEgc3RyZWFtXG4gICAgLy8gICBdO1xuICAgIC8vIH1cblxuICAgIGNvbnN0IGZvcmtlZFByb2Nlc3MgPSBmb3JrKHdvcmtlclBhdGgsIHVuZGVmaW5lZCwgZm9ya09wdGlvbnMpO1xuXG4gICAgLy8gQ2xlYW51cC5cbiAgICBjb25zdCBraWxsRm9ya2VkUHJvY2VzcyA9ICgpID0+IHtcbiAgICAgIGlmIChmb3JrZWRQcm9jZXNzICYmIGZvcmtlZFByb2Nlc3MucGlkKSB7XG4gICAgICAgIHRyZWVLaWxsKGZvcmtlZFByb2Nlc3MucGlkLCAnU0lHVEVSTScpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBIYW5kbGUgY2hpbGQgcHJvY2VzcyBleGl0LlxuICAgIGNvbnN0IGhhbmRsZUNoaWxkUHJvY2Vzc0V4aXQgPSAoY29kZT86IG51bWJlcikgPT4ge1xuICAgICAga2lsbEZvcmtlZFByb2Nlc3MoKTtcbiAgICAgIGlmIChjb2RlICYmIGNvZGUgIT09IDApIHtcbiAgICAgICAgb2JzLmVycm9yKCk7XG4gICAgICB9XG4gICAgICBvYnMubmV4dCh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICBvYnMuY29tcGxldGUoKTtcbiAgICB9O1xuICAgIGZvcmtlZFByb2Nlc3Mub25jZSgnZXhpdCcsIGhhbmRsZUNoaWxkUHJvY2Vzc0V4aXQpO1xuICAgIGZvcmtlZFByb2Nlc3Mub25jZSgnU0lHSU5UJywgaGFuZGxlQ2hpbGRQcm9jZXNzRXhpdCk7XG4gICAgZm9ya2VkUHJvY2Vzcy5vbmNlKCd1bmNhdWdodEV4Y2VwdGlvbicsIGhhbmRsZUNoaWxkUHJvY2Vzc0V4aXQpO1xuXG4gICAgLy8gSGFuZGxlIHBhcmVudCBwcm9jZXNzIGV4aXQuXG4gICAgY29uc3QgaGFuZGxlUGFyZW50UHJvY2Vzc0V4aXQgPSAoKSA9PiB7XG4gICAgICBraWxsRm9ya2VkUHJvY2VzcygpO1xuICAgIH07XG4gICAgcHJvY2Vzcy5vbmNlKCdleGl0JywgaGFuZGxlUGFyZW50UHJvY2Vzc0V4aXQpO1xuICAgIHByb2Nlc3Mub25jZSgnU0lHSU5UJywgaGFuZGxlUGFyZW50UHJvY2Vzc0V4aXQpO1xuICAgIHByb2Nlc3Mub25jZSgndW5jYXVnaHRFeGNlcHRpb24nLCBoYW5kbGVQYXJlbnRQcm9jZXNzRXhpdCk7XG5cbiAgICAvLyBSdW4gbW9kdWxlLlxuICAgIGZvcmtlZFByb2Nlc3Muc2VuZCh7XG4gICAgICBoYXNoOiAnNWQ0YjlhNWMwYTRlMGY5OTc3NTk4NDM3YjBlODViY2MnLFxuICAgICAgbW9kdWxlUGF0aCxcbiAgICAgIGV4cG9ydE5hbWUsXG4gICAgICBhcmdzLFxuICAgIH0pO1xuXG4gICAgLy8gVGVhcmRvd24gbG9naWMuIFdoZW4gdW5zdWJzY3JpYmluZywga2lsbCB0aGUgZm9ya2VkIHByb2Nlc3MuXG4gICAgcmV0dXJuIGtpbGxGb3JrZWRQcm9jZXNzO1xuICB9KTtcbn1cbiJdfQ==
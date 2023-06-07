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
exports.BundleActionExecutor = void 0;
const piscina_1 = __importDefault(require("piscina"));
const environment_options_1 = require("./environment-options");
const workerFile = require.resolve('./process-bundle');
class BundleActionExecutor {
    constructor(workerOptions) {
        this.workerOptions = workerOptions;
    }
    ensureWorkerPool() {
        if (this.workerPool) {
            return this.workerPool;
        }
        this.workerPool = new piscina_1.default({
            filename: workerFile,
            name: 'inlineLocales',
            workerData: this.workerOptions,
            maxThreads: environment_options_1.maxWorkers,
        });
        return this.workerPool;
    }
    async inline(action) {
        return this.ensureWorkerPool().run(action, { name: 'inlineLocales' });
    }
    inlineAll(actions) {
        return BundleActionExecutor.executeAll(actions, (action) => this.inline(action));
    }
    static async *executeAll(actions, executor) {
        const executions = new Map();
        for (const action of actions) {
            const execution = executor(action);
            executions.set(execution, execution.then((result) => [execution, result]));
        }
        while (executions.size > 0) {
            const [execution, result] = await Promise.race(executions.values());
            executions.delete(execution);
            yield result;
        }
    }
    stop() {
        void this.workerPool?.destroy();
    }
}
exports.BundleActionExecutor = BundleActionExecutor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLWV4ZWN1dG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvYWN0aW9uLWV4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILHNEQUE4QjtBQUU5QiwrREFBbUQ7QUFHbkQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBRXZELE1BQWEsb0JBQW9CO0lBRy9CLFlBQW9CLGFBQW9DO1FBQXBDLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtJQUFHLENBQUM7SUFFcEQsZ0JBQWdCO1FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7U0FDeEI7UUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksaUJBQU8sQ0FBQztZQUM1QixRQUFRLEVBQUUsVUFBVTtZQUNwQixJQUFJLEVBQUUsZUFBZTtZQUNyQixVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDOUIsVUFBVSxFQUFFLGdDQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FDVixNQUFxQjtRQUVyQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsU0FBUyxDQUFDLE9BQWdDO1FBQ3hDLE9BQU8sb0JBQW9CLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFFTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUM5QixPQUFvQixFQUNwQixRQUFtQztRQUVuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztRQUNuRSxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtZQUM1QixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkMsVUFBVSxDQUFDLEdBQUcsQ0FDWixTQUFTLEVBQ1QsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FDaEQsQ0FBQztTQUNIO1FBRUQsT0FBTyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtZQUMxQixNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNwRSxVQUFVLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sTUFBTSxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0lBRUQsSUFBSTtRQUNGLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUFyREQsb0RBcURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBQaXNjaW5hIGZyb20gJ3Bpc2NpbmEnO1xuaW1wb3J0IHsgSW5saW5lT3B0aW9ucyB9IGZyb20gJy4vYnVuZGxlLWlubGluZS1vcHRpb25zJztcbmltcG9ydCB7IG1heFdvcmtlcnMgfSBmcm9tICcuL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgSTE4bk9wdGlvbnMgfSBmcm9tICcuL2kxOG4tb3B0aW9ucyc7XG5cbmNvbnN0IHdvcmtlckZpbGUgPSByZXF1aXJlLnJlc29sdmUoJy4vcHJvY2Vzcy1idW5kbGUnKTtcblxuZXhwb3J0IGNsYXNzIEJ1bmRsZUFjdGlvbkV4ZWN1dG9yIHtcbiAgcHJpdmF0ZSB3b3JrZXJQb29sPzogUGlzY2luYTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHdvcmtlck9wdGlvbnM6IHsgaTE4bjogSTE4bk9wdGlvbnMgfSkge31cblxuICBwcml2YXRlIGVuc3VyZVdvcmtlclBvb2woKTogUGlzY2luYSB7XG4gICAgaWYgKHRoaXMud29ya2VyUG9vbCkge1xuICAgICAgcmV0dXJuIHRoaXMud29ya2VyUG9vbDtcbiAgICB9XG5cbiAgICB0aGlzLndvcmtlclBvb2wgPSBuZXcgUGlzY2luYSh7XG4gICAgICBmaWxlbmFtZTogd29ya2VyRmlsZSxcbiAgICAgIG5hbWU6ICdpbmxpbmVMb2NhbGVzJyxcbiAgICAgIHdvcmtlckRhdGE6IHRoaXMud29ya2VyT3B0aW9ucyxcbiAgICAgIG1heFRocmVhZHM6IG1heFdvcmtlcnMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy53b3JrZXJQb29sO1xuICB9XG5cbiAgYXN5bmMgaW5saW5lKFxuICAgIGFjdGlvbjogSW5saW5lT3B0aW9ucyxcbiAgKTogUHJvbWlzZTx7IGZpbGU6IHN0cmluZzsgZGlhZ25vc3RpY3M6IHsgdHlwZTogc3RyaW5nOyBtZXNzYWdlOiBzdHJpbmcgfVtdOyBjb3VudDogbnVtYmVyIH0+IHtcbiAgICByZXR1cm4gdGhpcy5lbnN1cmVXb3JrZXJQb29sKCkucnVuKGFjdGlvbiwgeyBuYW1lOiAnaW5saW5lTG9jYWxlcycgfSk7XG4gIH1cblxuICBpbmxpbmVBbGwoYWN0aW9uczogSXRlcmFibGU8SW5saW5lT3B0aW9ucz4pIHtcbiAgICByZXR1cm4gQnVuZGxlQWN0aW9uRXhlY3V0b3IuZXhlY3V0ZUFsbChhY3Rpb25zLCAoYWN0aW9uKSA9PiB0aGlzLmlubGluZShhY3Rpb24pKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jICpleGVjdXRlQWxsPEksIE8+KFxuICAgIGFjdGlvbnM6IEl0ZXJhYmxlPEk+LFxuICAgIGV4ZWN1dG9yOiAoYWN0aW9uOiBJKSA9PiBQcm9taXNlPE8+LFxuICApOiBBc3luY0l0ZXJhYmxlPE8+IHtcbiAgICBjb25zdCBleGVjdXRpb25zID0gbmV3IE1hcDxQcm9taXNlPE8+LCBQcm9taXNlPFtQcm9taXNlPE8+LCBPXT4+KCk7XG4gICAgZm9yIChjb25zdCBhY3Rpb24gb2YgYWN0aW9ucykge1xuICAgICAgY29uc3QgZXhlY3V0aW9uID0gZXhlY3V0b3IoYWN0aW9uKTtcbiAgICAgIGV4ZWN1dGlvbnMuc2V0KFxuICAgICAgICBleGVjdXRpb24sXG4gICAgICAgIGV4ZWN1dGlvbi50aGVuKChyZXN1bHQpID0+IFtleGVjdXRpb24sIHJlc3VsdF0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB3aGlsZSAoZXhlY3V0aW9ucy5zaXplID4gMCkge1xuICAgICAgY29uc3QgW2V4ZWN1dGlvbiwgcmVzdWx0XSA9IGF3YWl0IFByb21pc2UucmFjZShleGVjdXRpb25zLnZhbHVlcygpKTtcbiAgICAgIGV4ZWN1dGlvbnMuZGVsZXRlKGV4ZWN1dGlvbik7XG4gICAgICB5aWVsZCByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgc3RvcCgpOiB2b2lkIHtcbiAgICB2b2lkIHRoaXMud29ya2VyUG9vbD8uZGVzdHJveSgpO1xuICB9XG59XG4iXX0=
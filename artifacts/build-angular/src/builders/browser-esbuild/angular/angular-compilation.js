"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _AngularCompilation_angularCompilerCliModule;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularCompilation = void 0;
const load_esm_1 = require("../../../utils/load-esm");
const profiling_1 = require("../profiling");
class AngularCompilation {
    static async loadCompilerCli() {
        var _b;
        // This uses a wrapped dynamic import to load `@angular/compiler-cli` which is ESM.
        // Once TypeScript provides support for retaining dynamic imports this workaround can be dropped.
        __classPrivateFieldSet(_b = AngularCompilation, _a, __classPrivateFieldGet(_b, _a, "f", _AngularCompilation_angularCompilerCliModule) ?? await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli'), "f", _AngularCompilation_angularCompilerCliModule);
        return __classPrivateFieldGet(AngularCompilation, _a, "f", _AngularCompilation_angularCompilerCliModule);
    }
    async loadConfiguration(tsconfig) {
        const { readConfiguration } = await AngularCompilation.loadCompilerCli();
        return (0, profiling_1.profileSync)('NG_READ_CONFIG', () => readConfiguration(tsconfig, {
            // Angular specific configuration defaults and overrides to ensure a functioning compilation.
            suppressOutputPathCheck: true,
            outDir: undefined,
            sourceMap: false,
            declaration: false,
            declarationMap: false,
            allowEmptyCodegenFiles: false,
            annotationsAs: 'decorators',
            enableResourceInlining: false,
        }));
    }
}
exports.AngularCompilation = AngularCompilation;
_a = AngularCompilation;
_AngularCompilation_angularCompilerCliModule = { value: void 0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1jb21waWxhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9hbmd1bGFyL2FuZ3VsYXItY29tcGlsYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7O0FBSUgsc0RBQXdEO0FBQ3hELDRDQUEyQztBQVczQyxNQUFzQixrQkFBa0I7SUFHdEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlOztRQUMxQixtRkFBbUY7UUFDbkYsaUdBQWlHO1FBQ2pHLHlJQUFpRCxNQUFNLElBQUEsd0JBQWEsRUFDbEUsdUJBQXVCLENBQ3hCLG9EQUFBLENBQUM7UUFFRixPQUFPLHVCQUFBLGtCQUFrQix3REFBMEIsQ0FBQztJQUN0RCxDQUFDO0lBRVMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQWdCO1FBQ2hELE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxHQUFHLE1BQU0sa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFekUsT0FBTyxJQUFBLHVCQUFXLEVBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQ3hDLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtZQUMxQiw2RkFBNkY7WUFDN0YsdUJBQXVCLEVBQUUsSUFBSTtZQUM3QixNQUFNLEVBQUUsU0FBUztZQUNqQixTQUFTLEVBQUUsS0FBSztZQUNoQixXQUFXLEVBQUUsS0FBSztZQUNsQixjQUFjLEVBQUUsS0FBSztZQUNyQixzQkFBc0IsRUFBRSxLQUFLO1lBQzdCLGFBQWEsRUFBRSxZQUFZO1lBQzNCLHNCQUFzQixFQUFFLEtBQUs7U0FDOUIsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0NBV0Y7QUF4Q0QsZ0RBd0NDOztBQXZDUSxnRUFBeUIsQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSBuZyBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0IHR5cGUgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBsb2FkRXNtTW9kdWxlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbG9hZC1lc20nO1xuaW1wb3J0IHsgcHJvZmlsZVN5bmMgfSBmcm9tICcuLi9wcm9maWxpbmcnO1xuaW1wb3J0IHR5cGUgeyBBbmd1bGFySG9zdE9wdGlvbnMgfSBmcm9tICcuL2FuZ3VsYXItaG9zdCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1pdEZpbGVSZXN1bHQge1xuICBjb250ZW50Pzogc3RyaW5nO1xuICBtYXA/OiBzdHJpbmc7XG4gIGRlcGVuZGVuY2llczogcmVhZG9ubHkgc3RyaW5nW107XG59XG5cbmV4cG9ydCB0eXBlIEZpbGVFbWl0dGVyID0gKGZpbGU6IHN0cmluZykgPT4gUHJvbWlzZTxFbWl0RmlsZVJlc3VsdCB8IHVuZGVmaW5lZD47XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbmd1bGFyQ29tcGlsYXRpb24ge1xuICBzdGF0aWMgI2FuZ3VsYXJDb21waWxlckNsaU1vZHVsZT86IHR5cGVvZiBuZztcblxuICBzdGF0aWMgYXN5bmMgbG9hZENvbXBpbGVyQ2xpKCk6IFByb21pc2U8dHlwZW9mIG5nPiB7XG4gICAgLy8gVGhpcyB1c2VzIGEgd3JhcHBlZCBkeW5hbWljIGltcG9ydCB0byBsb2FkIGBAYW5ndWxhci9jb21waWxlci1jbGlgIHdoaWNoIGlzIEVTTS5cbiAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3IgcmV0YWluaW5nIGR5bmFtaWMgaW1wb3J0cyB0aGlzIHdvcmthcm91bmQgY2FuIGJlIGRyb3BwZWQuXG4gICAgQW5ndWxhckNvbXBpbGF0aW9uLiNhbmd1bGFyQ29tcGlsZXJDbGlNb2R1bGUgPz89IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIG5nPihcbiAgICAgICdAYW5ndWxhci9jb21waWxlci1jbGknLFxuICAgICk7XG5cbiAgICByZXR1cm4gQW5ndWxhckNvbXBpbGF0aW9uLiNhbmd1bGFyQ29tcGlsZXJDbGlNb2R1bGU7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgbG9hZENvbmZpZ3VyYXRpb24odHNjb25maWc6IHN0cmluZyk6IFByb21pc2U8bmcuQ29tcGlsZXJPcHRpb25zPiB7XG4gICAgY29uc3QgeyByZWFkQ29uZmlndXJhdGlvbiB9ID0gYXdhaXQgQW5ndWxhckNvbXBpbGF0aW9uLmxvYWRDb21waWxlckNsaSgpO1xuXG4gICAgcmV0dXJuIHByb2ZpbGVTeW5jKCdOR19SRUFEX0NPTkZJRycsICgpID0+XG4gICAgICByZWFkQ29uZmlndXJhdGlvbih0c2NvbmZpZywge1xuICAgICAgICAvLyBBbmd1bGFyIHNwZWNpZmljIGNvbmZpZ3VyYXRpb24gZGVmYXVsdHMgYW5kIG92ZXJyaWRlcyB0byBlbnN1cmUgYSBmdW5jdGlvbmluZyBjb21waWxhdGlvbi5cbiAgICAgICAgc3VwcHJlc3NPdXRwdXRQYXRoQ2hlY2s6IHRydWUsXG4gICAgICAgIG91dERpcjogdW5kZWZpbmVkLFxuICAgICAgICBzb3VyY2VNYXA6IGZhbHNlLFxuICAgICAgICBkZWNsYXJhdGlvbjogZmFsc2UsXG4gICAgICAgIGRlY2xhcmF0aW9uTWFwOiBmYWxzZSxcbiAgICAgICAgYWxsb3dFbXB0eUNvZGVnZW5GaWxlczogZmFsc2UsXG4gICAgICAgIGFubm90YXRpb25zQXM6ICdkZWNvcmF0b3JzJyxcbiAgICAgICAgZW5hYmxlUmVzb3VyY2VJbmxpbmluZzogZmFsc2UsXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgYWJzdHJhY3QgaW5pdGlhbGl6ZShcbiAgICB0c2NvbmZpZzogc3RyaW5nLFxuICAgIGhvc3RPcHRpb25zOiBBbmd1bGFySG9zdE9wdGlvbnMsXG4gICAgY29tcGlsZXJPcHRpb25zVHJhbnNmb3JtZXI/OiAoY29tcGlsZXJPcHRpb25zOiBuZy5Db21waWxlck9wdGlvbnMpID0+IG5nLkNvbXBpbGVyT3B0aW9ucyxcbiAgKTogUHJvbWlzZTx7IGFmZmVjdGVkRmlsZXM6IFJlYWRvbmx5U2V0PHRzLlNvdXJjZUZpbGU+OyBjb21waWxlck9wdGlvbnM6IG5nLkNvbXBpbGVyT3B0aW9ucyB9PjtcblxuICBhYnN0cmFjdCBjb2xsZWN0RGlhZ25vc3RpY3MoKTogSXRlcmFibGU8dHMuRGlhZ25vc3RpYz47XG5cbiAgYWJzdHJhY3QgY3JlYXRlRmlsZUVtaXR0ZXIob25BZnRlckVtaXQ/OiAoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkgPT4gdm9pZCk6IEZpbGVFbWl0dGVyO1xufVxuIl19
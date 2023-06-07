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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JitCompilation_state;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JitCompilation = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const typescript_1 = __importDefault(require("typescript"));
const profiling_1 = require("../profiling");
const angular_compilation_1 = require("./angular-compilation");
const angular_host_1 = require("./angular-host");
const jit_resource_transformer_1 = require("./jit-resource-transformer");
class JitCompilationState {
    constructor(typeScriptProgram, constructorParametersDownlevelTransform, replaceResourcesTransform) {
        this.typeScriptProgram = typeScriptProgram;
        this.constructorParametersDownlevelTransform = constructorParametersDownlevelTransform;
        this.replaceResourcesTransform = replaceResourcesTransform;
    }
}
class JitCompilation extends angular_compilation_1.AngularCompilation {
    constructor() {
        super(...arguments);
        _JitCompilation_state.set(this, void 0);
    }
    async initialize(tsconfig, hostOptions, compilerOptionsTransformer) {
        // Dynamically load the Angular compiler CLI package
        const { constructorParametersDownlevelTransform } = await angular_compilation_1.AngularCompilation.loadCompilerCli();
        // Load the compiler configuration and transform as needed
        const { options: originalCompilerOptions, rootNames, errors: configurationDiagnostics, } = await this.loadConfiguration(tsconfig);
        const compilerOptions = compilerOptionsTransformer?.(originalCompilerOptions) ?? originalCompilerOptions;
        // Create Angular compiler host
        const host = (0, angular_host_1.createAngularCompilerHost)(compilerOptions, hostOptions);
        // Create the TypeScript Program
        const typeScriptProgram = (0, profiling_1.profileSync)('TS_CREATE_PROGRAM', () => typescript_1.default.createEmitAndSemanticDiagnosticsBuilderProgram(rootNames, compilerOptions, host, __classPrivateFieldGet(this, _JitCompilation_state, "f")?.typeScriptProgram, configurationDiagnostics));
        const affectedFiles = (0, profiling_1.profileSync)('TS_FIND_AFFECTED', () => findAffectedFiles(typeScriptProgram));
        __classPrivateFieldSet(this, _JitCompilation_state, new JitCompilationState(typeScriptProgram, constructorParametersDownlevelTransform(typeScriptProgram.getProgram()), (0, jit_resource_transformer_1.createJitResourceTransformer)(() => typeScriptProgram.getProgram().getTypeChecker())), "f");
        return { affectedFiles, compilerOptions };
    }
    *collectDiagnostics() {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _JitCompilation_state, "f"), 'Compilation must be initialized prior to collecting diagnostics.');
        const { typeScriptProgram } = __classPrivateFieldGet(this, _JitCompilation_state, "f");
        // Collect program level diagnostics
        yield* typeScriptProgram.getConfigFileParsingDiagnostics();
        yield* typeScriptProgram.getOptionsDiagnostics();
        yield* typeScriptProgram.getGlobalDiagnostics();
        yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SYNTACTIC', () => typeScriptProgram.getSyntacticDiagnostics());
        yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SEMANTIC', () => typeScriptProgram.getSemanticDiagnostics());
    }
    createFileEmitter(onAfterEmit) {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _JitCompilation_state, "f"), 'Compilation must be initialized prior to emitting files.');
        const { typeScriptProgram, constructorParametersDownlevelTransform, replaceResourcesTransform, } = __classPrivateFieldGet(this, _JitCompilation_state, "f");
        const transformers = {
            before: [replaceResourcesTransform, constructorParametersDownlevelTransform],
        };
        return async (file) => {
            const sourceFile = typeScriptProgram.getSourceFile(file);
            if (!sourceFile) {
                return undefined;
            }
            let content;
            typeScriptProgram.emit(sourceFile, (filename, data) => {
                if (/\.[cm]?js$/.test(filename)) {
                    content = data;
                }
            }, undefined /* cancellationToken */, undefined /* emitOnlyDtsFiles */, transformers);
            onAfterEmit?.(sourceFile);
            return { content, dependencies: [] };
        };
    }
}
exports.JitCompilation = JitCompilation;
_JitCompilation_state = new WeakMap();
function findAffectedFiles(builder) {
    const affectedFiles = new Set();
    let result;
    while ((result = builder.getSemanticDiagnosticsOfNextAffectedFile())) {
        affectedFiles.add(result.affected);
    }
    return affectedFiles;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaml0LWNvbXBpbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvYnJvd3Nlci1lc2J1aWxkL2FuZ3VsYXIvaml0LWNvbXBpbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILDhEQUFpQztBQUNqQyw0REFBNEI7QUFDNUIsNENBQTJDO0FBQzNDLCtEQUF3RTtBQUN4RSxpREFBK0U7QUFDL0UseUVBQTBFO0FBRTFFLE1BQU0sbUJBQW1CO0lBQ3ZCLFlBQ2tCLGlCQUE4RCxFQUM5RCx1Q0FBNkUsRUFDN0UseUJBQStEO1FBRi9ELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNkM7UUFDOUQsNENBQXVDLEdBQXZDLHVDQUF1QyxDQUFzQztRQUM3RSw4QkFBeUIsR0FBekIseUJBQXlCLENBQXNDO0lBQzlFLENBQUM7Q0FDTDtBQUVELE1BQWEsY0FBZSxTQUFRLHdDQUFrQjtJQUF0RDs7UUFDRSx3Q0FBNkI7SUFnRy9CLENBQUM7SUE5RkMsS0FBSyxDQUFDLFVBQVUsQ0FDZCxRQUFnQixFQUNoQixXQUErQixFQUMvQiwwQkFBd0Y7UUFFeEYsb0RBQW9EO1FBQ3BELE1BQU0sRUFBRSx1Q0FBdUMsRUFBRSxHQUFHLE1BQU0sd0NBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFL0YsMERBQTBEO1FBQzFELE1BQU0sRUFDSixPQUFPLEVBQUUsdUJBQXVCLEVBQ2hDLFNBQVMsRUFDVCxNQUFNLEVBQUUsd0JBQXdCLEdBQ2pDLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsTUFBTSxlQUFlLEdBQ25CLDBCQUEwQixFQUFFLENBQUMsdUJBQXVCLENBQUMsSUFBSSx1QkFBdUIsQ0FBQztRQUVu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QUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWpHRCx3Q0FpR0M7O0FBRUQsU0FBUyxpQkFBaUIsQ0FDeEIsT0FBb0Q7SUFFcEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQWlCLENBQUM7SUFFL0MsSUFBSSxNQUFNLENBQUM7SUFDWCxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDLEVBQUU7UUFDcEUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBeUIsQ0FBQyxDQUFDO0tBQ3JEO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSBuZyBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0IGFzc2VydCBmcm9tICdub2RlOmFzc2VydCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBwcm9maWxlU3luYyB9IGZyb20gJy4uL3Byb2ZpbGluZyc7XG5pbXBvcnQgeyBBbmd1bGFyQ29tcGlsYXRpb24sIEZpbGVFbWl0dGVyIH0gZnJvbSAnLi9hbmd1bGFyLWNvbXBpbGF0aW9uJztcbmltcG9ydCB7IEFuZ3VsYXJIb3N0T3B0aW9ucywgY3JlYXRlQW5ndWxhckNvbXBpbGVySG9zdCB9IGZyb20gJy4vYW5ndWxhci1ob3N0JztcbmltcG9ydCB7IGNyZWF0ZUppdFJlc291cmNlVHJhbnNmb3JtZXIgfSBmcm9tICcuL2ppdC1yZXNvdXJjZS10cmFuc2Zvcm1lcic7XG5cbmNsYXNzIEppdENvbXBpbGF0aW9uU3RhdGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHlwZVNjcmlwdFByb2dyYW06IHRzLkVtaXRBbmRTZW1hbnRpY0RpYWdub3N0aWNzQnVpbGRlclByb2dyYW0sXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbnN0cnVjdG9yUGFyYW1ldGVyc0Rvd25sZXZlbFRyYW5zZm9ybTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+LFxuICAgIHB1YmxpYyByZWFkb25seSByZXBsYWNlUmVzb3VyY2VzVHJhbnNmb3JtOiB0cy5UcmFuc2Zvcm1lckZhY3Rvcnk8dHMuU291cmNlRmlsZT4sXG4gICkge31cbn1cblxuZXhwb3J0IGNsYXNzIEppdENvbXBpbGF0aW9uIGV4dGVuZHMgQW5ndWxhckNvbXBpbGF0aW9uIHtcbiAgI3N0YXRlPzogSml0Q29tcGlsYXRpb25TdGF0ZTtcblxuICBhc3luYyBpbml0aWFsaXplKFxuICAgIHRzY29uZmlnOiBzdHJpbmcsXG4gICAgaG9zdE9wdGlvbnM6IEFuZ3VsYXJIb3N0T3B0aW9ucyxcbiAgICBjb21waWxlck9wdGlvbnNUcmFuc2Zvcm1lcj86IChjb21waWxlck9wdGlvbnM6IG5nLkNvbXBpbGVyT3B0aW9ucykgPT4gbmcuQ29tcGlsZXJPcHRpb25zLFxuICApOiBQcm9taXNlPHsgYWZmZWN0ZWRGaWxlczogUmVhZG9ubHlTZXQ8dHMuU291cmNlRmlsZT47IGNvbXBpbGVyT3B0aW9uczogbmcuQ29tcGlsZXJPcHRpb25zIH0+IHtcbiAgICAvLyBEeW5hbWljYWxseSBsb2FkIHRoZSBBbmd1bGFyIGNvbXBpbGVyIENMSSBwYWNrYWdlXG4gICAgY29uc3QgeyBjb25zdHJ1Y3RvclBhcmFtZXRlcnNEb3dubGV2ZWxUcmFuc2Zvcm0gfSA9IGF3YWl0IEFuZ3VsYXJDb21waWxhdGlvbi5sb2FkQ29tcGlsZXJDbGkoKTtcblxuICAgIC8vIExvYWQgdGhlIGNvbXBpbGVyIGNvbmZpZ3VyYXRpb24gYW5kIHRyYW5zZm9ybSBhcyBuZWVkZWRcbiAgICBjb25zdCB7XG4gICAgICBvcHRpb25zOiBvcmlnaW5hbENvbXBpbGVyT3B0aW9ucyxcbiAgICAgIHJvb3ROYW1lcyxcbiAgICAgIGVycm9yczogY29uZmlndXJhdGlvbkRpYWdub3N0aWNzLFxuICAgIH0gPSBhd2FpdCB0aGlzLmxvYWRDb25maWd1cmF0aW9uKHRzY29uZmlnKTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPVxuICAgICAgY29tcGlsZXJPcHRpb25zVHJhbnNmb3JtZXI/LihvcmlnaW5hbENvbXBpbGVyT3B0aW9ucykgPz8gb3JpZ2luYWxDb21waWxlck9wdGlvbnM7XG5cbiAgICAvLyBDcmVhdGUgQW5ndWxhciBjb21waWxlciBob3N0XG4gICAgY29uc3QgaG9zdCA9IGNyZWF0ZUFuZ3VsYXJDb21waWxlckhvc3QoY29tcGlsZXJPcHRpb25zLCBob3N0T3B0aW9ucyk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIFR5cGVTY3JpcHQgUHJvZ3JhbVxuICAgIGNvbnN0IHR5cGVTY3JpcHRQcm9ncmFtID0gcHJvZmlsZVN5bmMoJ1RTX0NSRUFURV9QUk9HUkFNJywgKCkgPT5cbiAgICAgIHRzLmNyZWF0ZUVtaXRBbmRTZW1hbnRpY0RpYWdub3N0aWNzQnVpbGRlclByb2dyYW0oXG4gICAgICAgIHJvb3ROYW1lcyxcbiAgICAgICAgY29tcGlsZXJPcHRpb25zLFxuICAgICAgICBob3N0LFxuICAgICAgICB0aGlzLiNzdGF0ZT8udHlwZVNjcmlwdFByb2dyYW0sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25EaWFnbm9zdGljcyxcbiAgICAgICksXG4gICAgKTtcblxuICAgIGNvbnN0IGFmZmVjdGVkRmlsZXMgPSBwcm9maWxlU3luYygnVFNfRklORF9BRkZFQ1RFRCcsICgpID0+XG4gICAgICBmaW5kQWZmZWN0ZWRGaWxlcyh0eXBlU2NyaXB0UHJvZ3JhbSksXG4gICAgKTtcblxuICAgIHRoaXMuI3N0YXRlID0gbmV3IEppdENvbXBpbGF0aW9uU3RhdGUoXG4gICAgICB0eXBlU2NyaXB0UHJvZ3JhbSxcbiAgICAgIGNvbnN0cnVjdG9yUGFyYW1ldGVyc0Rvd25sZXZlbFRyYW5zZm9ybSh0eXBlU2NyaXB0UHJvZ3JhbS5nZXRQcm9ncmFtKCkpLFxuICAgICAgY3JlYXRlSml0UmVzb3VyY2VUcmFuc2Zvcm1lcigoKSA9PiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRQcm9ncmFtKCkuZ2V0VHlwZUNoZWNrZXIoKSksXG4gICAgKTtcblxuICAgIHJldHVybiB7IGFmZmVjdGVkRmlsZXMsIGNvbXBpbGVyT3B0aW9ucyB9O1xuICB9XG5cbiAgKmNvbGxlY3REaWFnbm9zdGljcygpOiBJdGVyYWJsZTx0cy5EaWFnbm9zdGljPiB7XG4gICAgYXNzZXJ0KHRoaXMuI3N0YXRlLCAnQ29tcGlsYXRpb24gbXVzdCBiZSBpbml0aWFsaXplZCBwcmlvciB0byBjb2xsZWN0aW5nIGRpYWdub3N0aWNzLicpO1xuICAgIGNvbnN0IHsgdHlwZVNjcmlwdFByb2dyYW0gfSA9IHRoaXMuI3N0YXRlO1xuXG4gICAgLy8gQ29sbGVjdCBwcm9ncmFtIGxldmVsIGRpYWdub3N0aWNzXG4gICAgeWllbGQqIHR5cGVTY3JpcHRQcm9ncmFtLmdldENvbmZpZ0ZpbGVQYXJzaW5nRGlhZ25vc3RpY3MoKTtcbiAgICB5aWVsZCogdHlwZVNjcmlwdFByb2dyYW0uZ2V0T3B0aW9uc0RpYWdub3N0aWNzKCk7XG4gICAgeWllbGQqIHR5cGVTY3JpcHRQcm9ncmFtLmdldEdsb2JhbERpYWdub3N0aWNzKCk7XG4gICAgeWllbGQqIHByb2ZpbGVTeW5jKCdOR19ESUFHTk9TVElDU19TWU5UQUNUSUMnLCAoKSA9PlxuICAgICAgdHlwZVNjcmlwdFByb2dyYW0uZ2V0U3ludGFjdGljRGlhZ25vc3RpY3MoKSxcbiAgICApO1xuICAgIHlpZWxkKiBwcm9maWxlU3luYygnTkdfRElBR05PU1RJQ1NfU0VNQU5USUMnLCAoKSA9PiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKCkpO1xuICB9XG5cbiAgY3JlYXRlRmlsZUVtaXR0ZXIob25BZnRlckVtaXQ/OiAoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkgPT4gdm9pZCk6IEZpbGVFbWl0dGVyIHtcbiAgICBhc3NlcnQodGhpcy4jc3RhdGUsICdDb21waWxhdGlvbiBtdXN0IGJlIGluaXRpYWxpemVkIHByaW9yIHRvIGVtaXR0aW5nIGZpbGVzLicpO1xuICAgIGNvbnN0IHtcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLFxuICAgICAgY29uc3RydWN0b3JQYXJhbWV0ZXJzRG93bmxldmVsVHJhbnNmb3JtLFxuICAgICAgcmVwbGFjZVJlc291cmNlc1RyYW5zZm9ybSxcbiAgICB9ID0gdGhpcy4jc3RhdGU7XG5cbiAgICBjb25zdCB0cmFuc2Zvcm1lcnMgPSB7XG4gICAgICBiZWZvcmU6IFtyZXBsYWNlUmVzb3VyY2VzVHJhbnNmb3JtLCBjb25zdHJ1Y3RvclBhcmFtZXRlcnNEb3dubGV2ZWxUcmFuc2Zvcm1dLFxuICAgIH07XG5cbiAgICByZXR1cm4gYXN5bmMgKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3Qgc291cmNlRmlsZSA9IHR5cGVTY3JpcHRQcm9ncmFtLmdldFNvdXJjZUZpbGUoZmlsZSk7XG4gICAgICBpZiAoIXNvdXJjZUZpbGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgbGV0IGNvbnRlbnQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLmVtaXQoXG4gICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgIChmaWxlbmFtZSwgZGF0YSkgPT4ge1xuICAgICAgICAgIGlmICgvXFwuW2NtXT9qcyQvLnRlc3QoZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVuZGVmaW5lZCAvKiBjYW5jZWxsYXRpb25Ub2tlbiAqLyxcbiAgICAgICAgdW5kZWZpbmVkIC8qIGVtaXRPbmx5RHRzRmlsZXMgKi8sXG4gICAgICAgIHRyYW5zZm9ybWVycyxcbiAgICAgICk7XG5cbiAgICAgIG9uQWZ0ZXJFbWl0Py4oc291cmNlRmlsZSk7XG5cbiAgICAgIHJldHVybiB7IGNvbnRlbnQsIGRlcGVuZGVuY2llczogW10gfTtcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRBZmZlY3RlZEZpbGVzKFxuICBidWlsZGVyOiB0cy5FbWl0QW5kU2VtYW50aWNEaWFnbm9zdGljc0J1aWxkZXJQcm9ncmFtLFxuKTogU2V0PHRzLlNvdXJjZUZpbGU+IHtcbiAgY29uc3QgYWZmZWN0ZWRGaWxlcyA9IG5ldyBTZXQ8dHMuU291cmNlRmlsZT4oKTtcblxuICBsZXQgcmVzdWx0O1xuICB3aGlsZSAoKHJlc3VsdCA9IGJ1aWxkZXIuZ2V0U2VtYW50aWNEaWFnbm9zdGljc09mTmV4dEFmZmVjdGVkRmlsZSgpKSkge1xuICAgIGFmZmVjdGVkRmlsZXMuYWRkKHJlc3VsdC5hZmZlY3RlZCBhcyB0cy5Tb3VyY2VGaWxlKTtcbiAgfVxuXG4gIHJldHVybiBhZmZlY3RlZEZpbGVzO1xufVxuIl19
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
exports.AnyComponentStyleBudgetChecker = void 0;
const path = __importStar(require("path"));
const webpack_1 = require("webpack");
const schema_1 = require("../../builders/browser/schema");
const bundle_calculator_1 = require("../../utils/bundle-calculator");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const PLUGIN_NAME = 'AnyComponentStyleBudgetChecker';
/**
 * Check budget sizes for component styles by emitting a warning or error if a
 * budget is exceeded by a particular component's styles.
 */
class AnyComponentStyleBudgetChecker {
    constructor(budgets) {
        this.budgets = budgets.filter((budget) => budget.type === schema_1.Type.AnyComponentStyle);
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: PLUGIN_NAME,
                stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
            }, () => {
                // No budgets.
                if (this.budgets.length === 0) {
                    return;
                }
                // In AOT compilations component styles get processed in child compilations.
                if (!compilation.compiler.parentCompilation) {
                    return;
                }
                const cssExtensions = ['.css', '.scss', '.less', '.sass'];
                const componentStyles = Object.keys(compilation.assets)
                    .filter((name) => cssExtensions.includes(path.extname(name)))
                    .map((name) => ({
                    size: compilation.assets[name].size(),
                    label: name,
                }));
                const thresholds = this.budgets.flatMap((budget) => [...(0, bundle_calculator_1.calculateThresholds)(budget)]);
                for (const { size, label } of componentStyles) {
                    for (const { severity, message } of (0, bundle_calculator_1.checkThresholds)(thresholds[Symbol.iterator](), size, label)) {
                        switch (severity) {
                            case bundle_calculator_1.ThresholdSeverity.Warning:
                                (0, webpack_diagnostics_1.addWarning)(compilation, message);
                                break;
                            case bundle_calculator_1.ThresholdSeverity.Error:
                                (0, webpack_diagnostics_1.addError)(compilation, message);
                                break;
                            default:
                                assertNever(severity);
                        }
                    }
                }
            });
        });
    }
}
exports.AnyComponentStyleBudgetChecker = AnyComponentStyleBudgetChecker;
function assertNever(input) {
    throw new Error(`Unexpected call to assertNever() with input: ${JSON.stringify(input, null /* replacer */, 4 /* tabSize */)}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW55LWNvbXBvbmVudC1zdHlsZS1idWRnZXQtY2hlY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9hbnktY29tcG9uZW50LXN0eWxlLWJ1ZGdldC1jaGVja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkNBQTZCO0FBQzdCLHFDQUFnRDtBQUNoRCwwREFBNkQ7QUFDN0QscUVBSXVDO0FBQ3ZDLHlFQUF1RTtBQUV2RSxNQUFNLFdBQVcsR0FBRyxnQ0FBZ0MsQ0FBQztBQUVyRDs7O0dBR0c7QUFDSCxNQUFhLDhCQUE4QjtJQUd6QyxZQUFZLE9BQWlCO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxhQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUMxRCxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ2pDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUscUJBQVcsQ0FBQyw0QkFBNEI7YUFDaEQsRUFDRCxHQUFHLEVBQUU7Z0JBQ0gsY0FBYztnQkFDZCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDN0IsT0FBTztpQkFDUjtnQkFFRCw0RUFBNEU7Z0JBQzVFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFO29CQUMzQyxPQUFPO2lCQUNSO2dCQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRTFELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztxQkFDcEQsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztxQkFDNUQsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNkLElBQUksRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRTtvQkFDckMsS0FBSyxFQUFFLElBQUk7aUJBQ1osQ0FBQyxDQUFDLENBQUM7Z0JBRU4sTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFBLHVDQUFtQixFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEYsS0FBSyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLGVBQWUsRUFBRTtvQkFDN0MsS0FBSyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLElBQUEsbUNBQWUsRUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUM3QixJQUFJLEVBQ0osS0FBSyxDQUNOLEVBQUU7d0JBQ0QsUUFBUSxRQUFRLEVBQUU7NEJBQ2hCLEtBQUsscUNBQWlCLENBQUMsT0FBTztnQ0FDNUIsSUFBQSxnQ0FBVSxFQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztnQ0FDakMsTUFBTTs0QkFDUixLQUFLLHFDQUFpQixDQUFDLEtBQUs7Z0NBQzFCLElBQUEsOEJBQVEsRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0NBQy9CLE1BQU07NEJBQ1I7Z0NBQ0UsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3lCQUN6QjtxQkFDRjtpQkFDRjtZQUNILENBQUMsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6REQsd0VBeURDO0FBRUQsU0FBUyxXQUFXLENBQUMsS0FBWTtJQUMvQixNQUFNLElBQUksS0FBSyxDQUNiLGdEQUFnRCxJQUFJLENBQUMsU0FBUyxDQUM1RCxLQUFLLEVBQ0wsSUFBSSxDQUFDLGNBQWMsRUFDbkIsQ0FBQyxDQUFDLGFBQWEsQ0FDaEIsRUFBRSxDQUNKLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb21waWxhdGlvbiwgQ29tcGlsZXIgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEJ1ZGdldCwgVHlwZSB9IGZyb20gJy4uLy4uL2J1aWxkZXJzL2Jyb3dzZXIvc2NoZW1hJztcbmltcG9ydCB7XG4gIFRocmVzaG9sZFNldmVyaXR5LFxuICBjYWxjdWxhdGVUaHJlc2hvbGRzLFxuICBjaGVja1RocmVzaG9sZHMsXG59IGZyb20gJy4uLy4uL3V0aWxzL2J1bmRsZS1jYWxjdWxhdG9yJztcbmltcG9ydCB7IGFkZEVycm9yLCBhZGRXYXJuaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvd2VicGFjay1kaWFnbm9zdGljcyc7XG5cbmNvbnN0IFBMVUdJTl9OQU1FID0gJ0FueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlcic7XG5cbi8qKlxuICogQ2hlY2sgYnVkZ2V0IHNpemVzIGZvciBjb21wb25lbnQgc3R5bGVzIGJ5IGVtaXR0aW5nIGEgd2FybmluZyBvciBlcnJvciBpZiBhXG4gKiBidWRnZXQgaXMgZXhjZWVkZWQgYnkgYSBwYXJ0aWN1bGFyIGNvbXBvbmVudCdzIHN0eWxlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYnVkZ2V0czogQnVkZ2V0W107XG5cbiAgY29uc3RydWN0b3IoYnVkZ2V0czogQnVkZ2V0W10pIHtcbiAgICB0aGlzLmJ1ZGdldHMgPSBidWRnZXRzLmZpbHRlcigoYnVkZ2V0KSA9PiBidWRnZXQudHlwZSA9PT0gVHlwZS5BbnlDb21wb25lbnRTdHlsZSk7XG4gIH1cblxuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgY29tcGlsYXRpb24uaG9va3MucHJvY2Vzc0Fzc2V0cy50YXAoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBQTFVHSU5fTkFNRSxcbiAgICAgICAgICBzdGFnZTogQ29tcGlsYXRpb24uUFJPQ0VTU19BU1NFVFNfU1RBR0VfQU5BTFlTRSxcbiAgICAgICAgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIC8vIE5vIGJ1ZGdldHMuXG4gICAgICAgICAgaWYgKHRoaXMuYnVkZ2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJbiBBT1QgY29tcGlsYXRpb25zIGNvbXBvbmVudCBzdHlsZXMgZ2V0IHByb2Nlc3NlZCBpbiBjaGlsZCBjb21waWxhdGlvbnMuXG4gICAgICAgICAgaWYgKCFjb21waWxhdGlvbi5jb21waWxlci5wYXJlbnRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNzc0V4dGVuc2lvbnMgPSBbJy5jc3MnLCAnLnNjc3MnLCAnLmxlc3MnLCAnLnNhc3MnXTtcblxuICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFN0eWxlcyA9IE9iamVjdC5rZXlzKGNvbXBpbGF0aW9uLmFzc2V0cylcbiAgICAgICAgICAgIC5maWx0ZXIoKG5hbWUpID0+IGNzc0V4dGVuc2lvbnMuaW5jbHVkZXMocGF0aC5leHRuYW1lKG5hbWUpKSlcbiAgICAgICAgICAgIC5tYXAoKG5hbWUpID0+ICh7XG4gICAgICAgICAgICAgIHNpemU6IGNvbXBpbGF0aW9uLmFzc2V0c1tuYW1lXS5zaXplKCksXG4gICAgICAgICAgICAgIGxhYmVsOiBuYW1lLFxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgY29uc3QgdGhyZXNob2xkcyA9IHRoaXMuYnVkZ2V0cy5mbGF0TWFwKChidWRnZXQpID0+IFsuLi5jYWxjdWxhdGVUaHJlc2hvbGRzKGJ1ZGdldCldKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHsgc2l6ZSwgbGFiZWwgfSBvZiBjb21wb25lbnRTdHlsZXMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyBzZXZlcml0eSwgbWVzc2FnZSB9IG9mIGNoZWNrVGhyZXNob2xkcyhcbiAgICAgICAgICAgICAgdGhyZXNob2xkc1tTeW1ib2wuaXRlcmF0b3JdKCksXG4gICAgICAgICAgICAgIHNpemUsXG4gICAgICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICBzd2l0Y2ggKHNldmVyaXR5KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBUaHJlc2hvbGRTZXZlcml0eS5XYXJuaW5nOlxuICAgICAgICAgICAgICAgICAgYWRkV2FybmluZyhjb21waWxhdGlvbiwgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFRocmVzaG9sZFNldmVyaXR5LkVycm9yOlxuICAgICAgICAgICAgICAgICAgYWRkRXJyb3IoY29tcGlsYXRpb24sIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgIGFzc2VydE5ldmVyKHNldmVyaXR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0TmV2ZXIoaW5wdXQ6IG5ldmVyKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuZXhwZWN0ZWQgY2FsbCB0byBhc3NlcnROZXZlcigpIHdpdGggaW5wdXQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICBpbnB1dCxcbiAgICAgIG51bGwgLyogcmVwbGFjZXIgKi8sXG4gICAgICA0IC8qIHRhYlNpemUgKi8sXG4gICAgKX1gLFxuICApO1xufVxuIl19
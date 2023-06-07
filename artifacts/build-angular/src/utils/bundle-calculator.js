"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkThresholds = exports.checkBudgets = exports.calculateThresholds = exports.ThresholdSeverity = void 0;
const schema_1 = require("../builders/browser/schema");
const stats_1 = require("../webpack/utils/stats");
var ThresholdType;
(function (ThresholdType) {
    ThresholdType["Max"] = "maximum";
    ThresholdType["Min"] = "minimum";
})(ThresholdType || (ThresholdType = {}));
var ThresholdSeverity;
(function (ThresholdSeverity) {
    ThresholdSeverity["Warning"] = "warning";
    ThresholdSeverity["Error"] = "error";
})(ThresholdSeverity = exports.ThresholdSeverity || (exports.ThresholdSeverity = {}));
function* calculateThresholds(budget) {
    if (budget.maximumWarning) {
        yield {
            limit: calculateBytes(budget.maximumWarning, budget.baseline, 1),
            type: ThresholdType.Max,
            severity: ThresholdSeverity.Warning,
        };
    }
    if (budget.maximumError) {
        yield {
            limit: calculateBytes(budget.maximumError, budget.baseline, 1),
            type: ThresholdType.Max,
            severity: ThresholdSeverity.Error,
        };
    }
    if (budget.minimumWarning) {
        yield {
            limit: calculateBytes(budget.minimumWarning, budget.baseline, -1),
            type: ThresholdType.Min,
            severity: ThresholdSeverity.Warning,
        };
    }
    if (budget.minimumError) {
        yield {
            limit: calculateBytes(budget.minimumError, budget.baseline, -1),
            type: ThresholdType.Min,
            severity: ThresholdSeverity.Error,
        };
    }
    if (budget.warning) {
        yield {
            limit: calculateBytes(budget.warning, budget.baseline, -1),
            type: ThresholdType.Min,
            severity: ThresholdSeverity.Warning,
        };
        yield {
            limit: calculateBytes(budget.warning, budget.baseline, 1),
            type: ThresholdType.Max,
            severity: ThresholdSeverity.Warning,
        };
    }
    if (budget.error) {
        yield {
            limit: calculateBytes(budget.error, budget.baseline, -1),
            type: ThresholdType.Min,
            severity: ThresholdSeverity.Error,
        };
        yield {
            limit: calculateBytes(budget.error, budget.baseline, 1),
            type: ThresholdType.Max,
            severity: ThresholdSeverity.Error,
        };
    }
}
exports.calculateThresholds = calculateThresholds;
/**
 * Calculates the sizes for bundles in the budget type provided.
 */
function calculateSizes(budget, stats) {
    if (budget.type === schema_1.Type.AnyComponentStyle) {
        // Component style size information is not available post-build, this must
        // be checked mid-build via the `AnyComponentStyleBudgetChecker` plugin.
        throw new Error('Can not calculate size of AnyComponentStyle. Use `AnyComponentStyleBudgetChecker` instead.');
    }
    const calculatorMap = {
        all: AllCalculator,
        allScript: AllScriptCalculator,
        any: AnyCalculator,
        anyScript: AnyScriptCalculator,
        bundle: BundleCalculator,
        initial: InitialCalculator,
    };
    const ctor = calculatorMap[budget.type];
    const { chunks, assets } = stats;
    if (!chunks) {
        throw new Error('Webpack stats output did not include chunk information.');
    }
    if (!assets) {
        throw new Error('Webpack stats output did not include asset information.');
    }
    const calculator = new ctor(budget, chunks, assets);
    return calculator.calculate();
}
class Calculator {
    constructor(budget, chunks, assets) {
        this.budget = budget;
        this.chunks = chunks;
        this.assets = assets;
    }
    /** Calculates the size of the given chunk for the provided build type. */
    calculateChunkSize(chunk) {
        // No differential builds, get the chunk size by summing its assets.
        if (!chunk.files) {
            return 0;
        }
        return chunk.files
            .filter((file) => !file.endsWith('.map'))
            .map((file) => {
            const asset = this.assets.find((asset) => asset.name === file);
            if (!asset) {
                throw new Error(`Could not find asset for file: ${file}`);
            }
            return asset.size;
        })
            .reduce((l, r) => l + r, 0);
    }
    getAssetSize(asset) {
        return asset.size;
    }
}
/**
 * A named bundle.
 */
class BundleCalculator extends Calculator {
    calculate() {
        const budgetName = this.budget.name;
        if (!budgetName) {
            return [];
        }
        const size = this.chunks
            .filter((chunk) => chunk?.names?.includes(budgetName))
            .map((chunk) => this.calculateChunkSize(chunk))
            .reduce((l, r) => l + r, 0);
        return [{ size, label: this.budget.name }];
    }
}
/**
 * The sum of all initial chunks (marked as initial).
 */
class InitialCalculator extends Calculator {
    calculate() {
        return [
            {
                label: `bundle initial`,
                size: this.chunks
                    .filter((chunk) => chunk.initial)
                    .map((chunk) => this.calculateChunkSize(chunk))
                    .reduce((l, r) => l + r, 0),
            },
        ];
    }
}
/**
 * The sum of all the scripts portions.
 */
class AllScriptCalculator extends Calculator {
    calculate() {
        const size = this.assets
            .filter((asset) => asset.name.endsWith('.js'))
            .map((asset) => this.getAssetSize(asset))
            .reduce((total, size) => total + size, 0);
        return [{ size, label: 'total scripts' }];
    }
}
/**
 * All scripts and assets added together.
 */
class AllCalculator extends Calculator {
    calculate() {
        const size = this.assets
            .filter((asset) => !asset.name.endsWith('.map'))
            .map((asset) => this.getAssetSize(asset))
            .reduce((total, size) => total + size, 0);
        return [{ size, label: 'total' }];
    }
}
/**
 * Any script, individually.
 */
class AnyScriptCalculator extends Calculator {
    calculate() {
        return this.assets
            .filter((asset) => asset.name.endsWith('.js'))
            .map((asset) => ({
            size: this.getAssetSize(asset),
            label: asset.name,
        }));
    }
}
/**
 * Any script or asset (images, css, etc).
 */
class AnyCalculator extends Calculator {
    calculate() {
        return this.assets
            .filter((asset) => !asset.name.endsWith('.map'))
            .map((asset) => ({
            size: this.getAssetSize(asset),
            label: asset.name,
        }));
    }
}
/**
 * Calculate the bytes given a string value.
 */
function calculateBytes(input, baseline, factor = 1) {
    const matches = input.match(/^\s*(\d+(?:\.\d+)?)\s*(%|(?:[mM]|[kK]|[gG])?[bB])?\s*$/);
    if (!matches) {
        return NaN;
    }
    const baselineBytes = (baseline && calculateBytes(baseline)) || 0;
    let value = Number(matches[1]);
    switch (matches[2] && matches[2].toLowerCase()) {
        case '%':
            value = (baselineBytes * value) / 100;
            break;
        case 'kb':
            value *= 1024;
            break;
        case 'mb':
            value *= 1024 * 1024;
            break;
        case 'gb':
            value *= 1024 * 1024 * 1024;
            break;
    }
    if (baselineBytes === 0) {
        return value;
    }
    return baselineBytes + value * factor;
}
function* checkBudgets(budgets, webpackStats) {
    // Ignore AnyComponentStyle budgets as these are handled in `AnyComponentStyleBudgetChecker`.
    const computableBudgets = budgets.filter((budget) => budget.type !== schema_1.Type.AnyComponentStyle);
    for (const budget of computableBudgets) {
        const sizes = calculateSizes(budget, webpackStats);
        for (const { size, label } of sizes) {
            yield* checkThresholds(calculateThresholds(budget), size, label);
        }
    }
}
exports.checkBudgets = checkBudgets;
function* checkThresholds(thresholds, size, label) {
    for (const threshold of thresholds) {
        switch (threshold.type) {
            case ThresholdType.Max: {
                if (size <= threshold.limit) {
                    continue;
                }
                const sizeDifference = (0, stats_1.formatSize)(size - threshold.limit);
                yield {
                    severity: threshold.severity,
                    label,
                    message: `${label} exceeded maximum budget. Budget ${(0, stats_1.formatSize)(threshold.limit)} was not met by ${sizeDifference} with a total of ${(0, stats_1.formatSize)(size)}.`,
                };
                break;
            }
            case ThresholdType.Min: {
                if (size >= threshold.limit) {
                    continue;
                }
                const sizeDifference = (0, stats_1.formatSize)(threshold.limit - size);
                yield {
                    severity: threshold.severity,
                    label,
                    message: `${label} failed to meet minimum budget. Budget ${(0, stats_1.formatSize)(threshold.limit)} was not met by ${sizeDifference} with a total of ${(0, stats_1.formatSize)(size)}.`,
                };
                break;
            }
            default: {
                throw new Error(`Unexpected threshold type: ${ThresholdType[threshold.type]}`);
            }
        }
    }
}
exports.checkThresholds = checkThresholds;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLWNhbGN1bGF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9idW5kbGUtY2FsY3VsYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCx1REFBMEQ7QUFDMUQsa0RBQW9EO0FBYXBELElBQUssYUFHSjtBQUhELFdBQUssYUFBYTtJQUNoQixnQ0FBZSxDQUFBO0lBQ2YsZ0NBQWUsQ0FBQTtBQUNqQixDQUFDLEVBSEksYUFBYSxLQUFiLGFBQWEsUUFHakI7QUFFRCxJQUFZLGlCQUdYO0FBSEQsV0FBWSxpQkFBaUI7SUFDM0Isd0NBQW1CLENBQUE7SUFDbkIsb0NBQWUsQ0FBQTtBQUNqQixDQUFDLEVBSFcsaUJBQWlCLEdBQWpCLHlCQUFpQixLQUFqQix5QkFBaUIsUUFHNUI7QUFRRCxRQUFlLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFjO0lBQ2pELElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRTtRQUN6QixNQUFNO1lBQ0osS0FBSyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksRUFBRSxhQUFhLENBQUMsR0FBRztZQUN2QixRQUFRLEVBQUUsaUJBQWlCLENBQUMsT0FBTztTQUNwQyxDQUFDO0tBQ0g7SUFFRCxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7UUFDdkIsTUFBTTtZQUNKLEtBQUssRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5RCxJQUFJLEVBQUUsYUFBYSxDQUFDLEdBQUc7WUFDdkIsUUFBUSxFQUFFLGlCQUFpQixDQUFDLEtBQUs7U0FDbEMsQ0FBQztLQUNIO0lBRUQsSUFBSSxNQUFN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MUNELDBDQTBDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBTdGF0c0Fzc2V0LCBTdGF0c0NodW5rLCBTdGF0c0NvbXBpbGF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBCdWRnZXQsIFR5cGUgfSBmcm9tICcuLi9idWlsZGVycy9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBmb3JtYXRTaXplIH0gZnJvbSAnLi4vd2VicGFjay91dGlscy9zdGF0cyc7XG5cbmludGVyZmFjZSBTaXplIHtcbiAgc2l6ZTogbnVtYmVyO1xuICBsYWJlbD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFRocmVzaG9sZCB7XG4gIGxpbWl0OiBudW1iZXI7XG4gIHR5cGU6IFRocmVzaG9sZFR5cGU7XG4gIHNldmVyaXR5OiBUaHJlc2hvbGRTZXZlcml0eTtcbn1cblxuZW51bSBUaHJlc2hvbGRUeXBlIHtcbiAgTWF4ID0gJ21heGltdW0nLFxuICBNaW4gPSAnbWluaW11bScsXG59XG5cbmV4cG9ydCBlbnVtIFRocmVzaG9sZFNldmVyaXR5IHtcbiAgV2FybmluZyA9ICd3YXJuaW5nJyxcbiAgRXJyb3IgPSAnZXJyb3InLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1ZGdldENhbGN1bGF0b3JSZXN1bHQge1xuICBzZXZlcml0eTogVGhyZXNob2xkU2V2ZXJpdHk7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgbGFiZWw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiogY2FsY3VsYXRlVGhyZXNob2xkcyhidWRnZXQ6IEJ1ZGdldCk6IEl0ZXJhYmxlSXRlcmF0b3I8VGhyZXNob2xkPiB7XG4gIGlmIChidWRnZXQubWF4aW11bVdhcm5pbmcpIHtcbiAgICB5aWVsZCB7XG4gICAgICBsaW1pdDogY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0Lm1heGltdW1XYXJuaW5nLCBidWRnZXQuYmFzZWxpbmUsIDEpLFxuICAgICAgdHlwZTogVGhyZXNob2xkVHlwZS5NYXgsXG4gICAgICBzZXZlcml0eTogVGhyZXNob2xkU2V2ZXJpdHkuV2FybmluZyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKGJ1ZGdldC5tYXhpbXVtRXJyb3IpIHtcbiAgICB5aWVsZCB7XG4gICAgICBsaW1pdDogY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0Lm1heGltdW1FcnJvciwgYnVkZ2V0LmJhc2VsaW5lLCAxKSxcbiAgICAgIHR5cGU6IFRocmVzaG9sZFR5cGUuTWF4LFxuICAgICAgc2V2ZXJpdHk6IFRocmVzaG9sZFNldmVyaXR5LkVycm9yLFxuICAgIH07XG4gIH1cblxuICBpZiAoYnVkZ2V0Lm1pbmltdW1XYXJuaW5nKSB7XG4gICAgeWllbGQge1xuICAgICAgbGltaXQ6IGNhbGN1bGF0ZUJ5dGVzKGJ1ZGdldC5taW5pbXVtV2FybmluZywgYnVkZ2V0LmJhc2VsaW5lLCAtMSksXG4gICAgICB0eXBlOiBUaHJlc2hvbGRUeXBlLk1pbixcbiAgICAgIHNldmVyaXR5OiBUaHJlc2hvbGRTZXZlcml0eS5XYXJuaW5nLFxuICAgIH07XG4gIH1cblxuICBpZiAoYnVkZ2V0Lm1pbmltdW1FcnJvcikge1xuICAgIHlpZWxkIHtcbiAgICAgIGxpbWl0OiBjYWxjdWxhdGVCeXRlcyhidWRnZXQubWluaW11bUVycm9yLCBidWRnZXQuYmFzZWxpbmUsIC0xKSxcbiAgICAgIHR5cGU6IFRocmVzaG9sZFR5cGUuTWluLFxuICAgICAgc2V2ZXJpdHk6IFRocmVzaG9sZFNldmVyaXR5LkVycm9yLFxuICAgIH07XG4gIH1cblxuICBpZiAoYnVkZ2V0Lndhcm5pbmcpIHtcbiAgICB5aWVsZCB7XG4gICAgICBsaW1pdDogY2FsY3VsYXRlQnl0ZXMoYnVkZ2V0Lndhcm5pbmcsIGJ1ZGdldC5iYXNlbGluZSwgLTEpLFxuICAgICAgdHlwZTogVGhyZXNob2xkVHlwZS5NaW4sXG4gICAgICBzZXZlcml0eTogVGhyZXNob2xkU2V2ZXJpdHkuV2FybmluZyxcbiAgICB9O1xuXG4gICAgeWllbGQge1xuICAgICAgbGltaXQ6IGNhbGN1bGF0ZUJ5dGVzKGJ1ZGdldC53YXJuaW5nLCBidWRnZXQuYmFzZWxpbmUsIDEpLFxuICAgICAgdHlwZTogVGhyZXNob2xkVHlwZS5NYXgsXG4gICAgICBzZXZlcml0eTogVGhyZXNob2xkU2V2ZXJpdHkuV2FybmluZyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKGJ1ZGdldC5lcnJvcikge1xuICAgIHlpZWxkIHtcbiAgICAgIGxpbWl0OiBjYWxjdWxhdGVCeXRlcyhidWRnZXQuZXJyb3IsIGJ1ZGdldC5iYXNlbGluZSwgLTEpLFxuICAgICAgdHlwZTogVGhyZXNob2xkVHlwZS5NaW4sXG4gICAgICBzZXZlcml0eTogVGhyZXNob2xkU2V2ZXJpdHkuRXJyb3IsXG4gICAgfTtcblxuICAgIHlpZWxkIHtcbiAgICAgIGxpbWl0OiBjYWxjdWxhdGVCeXRlcyhidWRnZXQuZXJyb3IsIGJ1ZGdldC5iYXNlbGluZSwgMSksXG4gICAgICB0eXBlOiBUaHJlc2hvbGRUeXBlLk1heCxcbiAgICAgIHNldmVyaXR5OiBUaHJlc2hvbGRTZXZlcml0eS5FcnJvcixcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc2l6ZXMgZm9yIGJ1bmRsZXMgaW4gdGhlIGJ1ZGdldCB0eXBlIHByb3ZpZGVkLlxuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVTaXplcyhidWRnZXQ6IEJ1ZGdldCwgc3RhdHM6IFN0YXRzQ29tcGlsYXRpb24pOiBTaXplW10ge1xuICBpZiAoYnVkZ2V0LnR5cGUgPT09IFR5cGUuQW55Q29tcG9uZW50U3R5bGUpIHtcbiAgICAvLyBDb21wb25lbnQgc3R5bGUgc2l6ZSBpbmZvcm1hdGlvbiBpcyBub3QgYXZhaWxhYmxlIHBvc3QtYnVpbGQsIHRoaXMgbXVzdFxuICAgIC8vIGJlIGNoZWNrZWQgbWlkLWJ1aWxkIHZpYSB0aGUgYEFueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlcmAgcGx1Z2luLlxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdDYW4gbm90IGNhbGN1bGF0ZSBzaXplIG9mIEFueUNvbXBvbmVudFN0eWxlLiBVc2UgYEFueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlcmAgaW5zdGVhZC4nLFxuICAgICk7XG4gIH1cblxuICB0eXBlIE5vbkNvbXBvbmVudFN0eWxlQnVkZ2V0VHlwZXMgPSBFeGNsdWRlPEJ1ZGdldFsndHlwZSddLCBUeXBlLkFueUNvbXBvbmVudFN0eWxlPjtcbiAgdHlwZSBDYWxjdWxhdG9yVHlwZXMgPSB7XG4gICAgbmV3IChidWRnZXQ6IEJ1ZGdldCwgY2h1bmtzOiBTdGF0c0NodW5rW10sIGFzc2V0czogU3RhdHNBc3NldFtdKTogQ2FsY3VsYXRvcjtcbiAgfTtcbiAgY29uc3QgY2FsY3VsYXRvck1hcDogUmVjb3JkPE5vbkNvbXBvbmVudFN0eWxlQnVkZ2V0VHlwZXMsIENhbGN1bGF0b3JUeXBlcz4gPSB7XG4gICAgYWxsOiBBbGxDYWxjdWxhdG9yLFxuICAgIGFsbFNjcmlwdDogQWxsU2NyaXB0Q2FsY3VsYXRvcixcbiAgICBhbnk6IEFueUNhbGN1bGF0b3IsXG4gICAgYW55U2NyaXB0OiBBbnlTY3JpcHRDYWxjdWxhdG9yLFxuICAgIGJ1bmRsZTogQnVuZGxlQ2FsY3VsYXRvcixcbiAgICBpbml0aWFsOiBJbml0aWFsQ2FsY3VsYXRvcixcbiAgfTtcblxuICBjb25zdCBjdG9yID0gY2FsY3VsYXRvck1hcFtidWRnZXQudHlwZV07XG4gIGNvbnN0IHsgY2h1bmtzLCBhc3NldHMgfSA9IHN0YXRzO1xuICBpZiAoIWNodW5rcykge1xuICAgIHRocm93IG5ldyBFcnJvcignV2VicGFjayBzdGF0cyBvdXRwdXQgZGlkIG5vdCBpbmNsdWRlIGNodW5rIGluZm9ybWF0aW9uLicpO1xuICB9XG4gIGlmICghYXNzZXRzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdXZWJwYWNrIHN0YXRzIG91dHB1dCBkaWQgbm90IGluY2x1ZGUgYXNzZXQgaW5mb3JtYXRpb24uJyk7XG4gIH1cblxuICBjb25zdCBjYWxjdWxhdG9yID0gbmV3IGN0b3IoYnVkZ2V0LCBjaHVua3MsIGFzc2V0cyk7XG5cbiAgcmV0dXJuIGNhbGN1bGF0b3IuY2FsY3VsYXRlKCk7XG59XG5cbmFic3RyYWN0IGNsYXNzIENhbGN1bGF0b3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgYnVkZ2V0OiBCdWRnZXQsXG4gICAgcHJvdGVjdGVkIGNodW5rczogU3RhdHNDaHVua1tdLFxuICAgIHByb3RlY3RlZCBhc3NldHM6IFN0YXRzQXNzZXRbXSxcbiAgKSB7fVxuXG4gIGFic3RyYWN0IGNhbGN1bGF0ZSgpOiBTaXplW107XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIHNpemUgb2YgdGhlIGdpdmVuIGNodW5rIGZvciB0aGUgcHJvdmlkZWQgYnVpbGQgdHlwZS4gKi9cbiAgcHJvdGVjdGVkIGNhbGN1bGF0ZUNodW5rU2l6ZShjaHVuazogU3RhdHNDaHVuayk6IG51bWJlciB7XG4gICAgLy8gTm8gZGlmZmVyZW50aWFsIGJ1aWxkcywgZ2V0IHRoZSBjaHVuayBzaXplIGJ5IHN1bW1pbmcgaXRzIGFzc2V0cy5cbiAgICBpZiAoIWNodW5rLmZpbGVzKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gY2h1bmsuZmlsZXNcbiAgICAgIC5maWx0ZXIoKGZpbGUpID0+ICFmaWxlLmVuZHNXaXRoKCcubWFwJykpXG4gICAgICAubWFwKChmaWxlKSA9PiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5hc3NldHMuZmluZCgoYXNzZXQpID0+IGFzc2V0Lm5hbWUgPT09IGZpbGUpO1xuICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBhc3NldCBmb3IgZmlsZTogJHtmaWxlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFzc2V0LnNpemU7XG4gICAgICB9KVxuICAgICAgLnJlZHVjZSgobCwgcikgPT4gbCArIHIsIDApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldEFzc2V0U2l6ZShhc3NldDogU3RhdHNBc3NldCk6IG51bWJlciB7XG4gICAgcmV0dXJuIGFzc2V0LnNpemU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIG5hbWVkIGJ1bmRsZS5cbiAqL1xuY2xhc3MgQnVuZGxlQ2FsY3VsYXRvciBleHRlbmRzIENhbGN1bGF0b3Ige1xuICBjYWxjdWxhdGUoKSB7XG4gICAgY29uc3QgYnVkZ2V0TmFtZSA9IHRoaXMuYnVkZ2V0Lm5hbWU7XG4gICAgaWYgKCFidWRnZXROYW1lKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuY2h1bmtzXG4gICAgICAuZmlsdGVyKChjaHVuaykgPT4gY2h1bms/Lm5hbWVzPy5pbmNsdWRlcyhidWRnZXROYW1lKSlcbiAgICAgIC5tYXAoKGNodW5rKSA9PiB0aGlzLmNhbGN1bGF0ZUNodW5rU2l6ZShjaHVuaykpXG4gICAgICAucmVkdWNlKChsLCByKSA9PiBsICsgciwgMCk7XG5cbiAgICByZXR1cm4gW3sgc2l6ZSwgbGFiZWw6IHRoaXMuYnVkZ2V0Lm5hbWUgfV07XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgc3VtIG9mIGFsbCBpbml0aWFsIGNodW5rcyAobWFya2VkIGFzIGluaXRpYWwpLlxuICovXG5jbGFzcyBJbml0aWFsQ2FsY3VsYXRvciBleHRlbmRzIENhbGN1bGF0b3Ige1xuICBjYWxjdWxhdGUoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6IGBidW5kbGUgaW5pdGlhbGAsXG4gICAgICAgIHNpemU6IHRoaXMuY2h1bmtzXG4gICAgICAgICAgLmZpbHRlcigoY2h1bmspID0+IGNodW5rLmluaXRpYWwpXG4gICAgICAgICAgLm1hcCgoY2h1bmspID0+IHRoaXMuY2FsY3VsYXRlQ2h1bmtTaXplKGNodW5rKSlcbiAgICAgICAgICAucmVkdWNlKChsLCByKSA9PiBsICsgciwgMCksXG4gICAgICB9LFxuICAgIF07XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgc3VtIG9mIGFsbCB0aGUgc2NyaXB0cyBwb3J0aW9ucy5cbiAqL1xuY2xhc3MgQWxsU2NyaXB0Q2FsY3VsYXRvciBleHRlbmRzIENhbGN1bGF0b3Ige1xuICBjYWxjdWxhdGUoKSB7XG4gICAgY29uc3Qgc2l6ZSA9IHRoaXMuYXNzZXRzXG4gICAgICAuZmlsdGVyKChhc3NldCkgPT4gYXNzZXQubmFtZS5lbmRzV2l0aCgnLmpzJykpXG4gICAgICAubWFwKChhc3NldCkgPT4gdGhpcy5nZXRBc3NldFNpemUoYXNzZXQpKVxuICAgICAgLnJlZHVjZSgodG90YWw6IG51bWJlciwgc2l6ZTogbnVtYmVyKSA9PiB0b3RhbCArIHNpemUsIDApO1xuXG4gICAgcmV0dXJuIFt7IHNpemUsIGxhYmVsOiAndG90YWwgc2NyaXB0cycgfV07XG4gIH1cbn1cblxuLyoqXG4gKiBBbGwgc2NyaXB0cyBhbmQgYXNzZXRzIGFkZGVkIHRvZ2V0aGVyLlxuICovXG5jbGFzcyBBbGxDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBzaXplID0gdGhpcy5hc3NldHNcbiAgICAgIC5maWx0ZXIoKGFzc2V0KSA9PiAhYXNzZXQubmFtZS5lbmRzV2l0aCgnLm1hcCcpKVxuICAgICAgLm1hcCgoYXNzZXQpID0+IHRoaXMuZ2V0QXNzZXRTaXplKGFzc2V0KSlcbiAgICAgIC5yZWR1Y2UoKHRvdGFsOiBudW1iZXIsIHNpemU6IG51bWJlcikgPT4gdG90YWwgKyBzaXplLCAwKTtcblxuICAgIHJldHVybiBbeyBzaXplLCBsYWJlbDogJ3RvdGFsJyB9XTtcbiAgfVxufVxuXG4vKipcbiAqIEFueSBzY3JpcHQsIGluZGl2aWR1YWxseS5cbiAqL1xuY2xhc3MgQW55U2NyaXB0Q2FsY3VsYXRvciBleHRlbmRzIENhbGN1bGF0b3Ige1xuICBjYWxjdWxhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXNzZXRzXG4gICAgICAuZmlsdGVyKChhc3NldCkgPT4gYXNzZXQubmFtZS5lbmRzV2l0aCgnLmpzJykpXG4gICAgICAubWFwKChhc3NldCkgPT4gKHtcbiAgICAgICAgc2l6ZTogdGhpcy5nZXRBc3NldFNpemUoYXNzZXQpLFxuICAgICAgICBsYWJlbDogYXNzZXQubmFtZSxcbiAgICAgIH0pKTtcbiAgfVxufVxuXG4vKipcbiAqIEFueSBzY3JpcHQgb3IgYXNzZXQgKGltYWdlcywgY3NzLCBldGMpLlxuICovXG5jbGFzcyBBbnlDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5hc3NldHNcbiAgICAgIC5maWx0ZXIoKGFzc2V0KSA9PiAhYXNzZXQubmFtZS5lbmRzV2l0aCgnLm1hcCcpKVxuICAgICAgLm1hcCgoYXNzZXQpID0+ICh7XG4gICAgICAgIHNpemU6IHRoaXMuZ2V0QXNzZXRTaXplKGFzc2V0KSxcbiAgICAgICAgbGFiZWw6IGFzc2V0Lm5hbWUsXG4gICAgICB9KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgdGhlIGJ5dGVzIGdpdmVuIGEgc3RyaW5nIHZhbHVlLlxuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVCeXRlcyhpbnB1dDogc3RyaW5nLCBiYXNlbGluZT86IHN0cmluZywgZmFjdG9yOiAxIHwgLTEgPSAxKTogbnVtYmVyIHtcbiAgY29uc3QgbWF0Y2hlcyA9IGlucHV0Lm1hdGNoKC9eXFxzKihcXGQrKD86XFwuXFxkKyk/KVxccyooJXwoPzpbbU1dfFtrS118W2dHXSk/W2JCXSk/XFxzKiQvKTtcbiAgaWYgKCFtYXRjaGVzKSB7XG4gICAgcmV0dXJuIE5hTjtcbiAgfVxuXG4gIGNvbnN0IGJhc2VsaW5lQnl0ZXMgPSAoYmFzZWxpbmUgJiYgY2FsY3VsYXRlQnl0ZXMoYmFzZWxpbmUpKSB8fCAwO1xuXG4gIGxldCB2YWx1ZSA9IE51bWJlcihtYXRjaGVzWzFdKTtcbiAgc3dpdGNoIChtYXRjaGVzWzJdICYmIG1hdGNoZXNbMl0udG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJyUnOlxuICAgICAgdmFsdWUgPSAoYmFzZWxpbmVCeXRlcyAqIHZhbHVlKSAvIDEwMDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2tiJzpcbiAgICAgIHZhbHVlICo9IDEwMjQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdtYic6XG4gICAgICB2YWx1ZSAqPSAxMDI0ICogMTAyNDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2diJzpcbiAgICAgIHZhbHVlICo9IDEwMjQgKiAxMDI0ICogMTAyNDtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKGJhc2VsaW5lQnl0ZXMgPT09IDApIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gYmFzZWxpbmVCeXRlcyArIHZhbHVlICogZmFjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24qIGNoZWNrQnVkZ2V0cyhcbiAgYnVkZ2V0czogQnVkZ2V0W10sXG4gIHdlYnBhY2tTdGF0czogU3RhdHNDb21waWxhdGlvbixcbik6IEl0ZXJhYmxlSXRlcmF0b3I8QnVkZ2V0Q2FsY3VsYXRvclJlc3VsdD4ge1xuICAvLyBJZ25vcmUgQW55Q29tcG9uZW50U3R5bGUgYnVkZ2V0cyBhcyB0aGVzZSBhcmUgaGFuZGxlZCBpbiBgQW55Q29tcG9uZW50U3R5bGVCdWRnZXRDaGVja2VyYC5cbiAgY29uc3QgY29tcHV0YWJsZUJ1ZGdldHMgPSBidWRnZXRzLmZpbHRlcigoYnVkZ2V0KSA9PiBidWRnZXQudHlwZSAhPT0gVHlwZS5BbnlDb21wb25lbnRTdHlsZSk7XG5cbiAgZm9yIChjb25zdCBidWRnZXQgb2YgY29tcHV0YWJsZUJ1ZGdldHMpIHtcbiAgICBjb25zdCBzaXplcyA9IGNhbGN1bGF0ZVNpemVzKGJ1ZGdldCwgd2VicGFja1N0YXRzKTtcbiAgICBmb3IgKGNvbnN0IHsgc2l6ZSwgbGFiZWwgfSBvZiBzaXplcykge1xuICAgICAgeWllbGQqIGNoZWNrVGhyZXNob2xkcyhjYWxjdWxhdGVUaHJlc2hvbGRzKGJ1ZGdldCksIHNpemUsIGxhYmVsKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uKiBjaGVja1RocmVzaG9sZHMoXG4gIHRocmVzaG9sZHM6IEl0ZXJhYmxlSXRlcmF0b3I8VGhyZXNob2xkPixcbiAgc2l6ZTogbnVtYmVyLFxuICBsYWJlbD86IHN0cmluZyxcbik6IEl0ZXJhYmxlSXRlcmF0b3I8QnVkZ2V0Q2FsY3VsYXRvclJlc3VsdD4ge1xuICBmb3IgKGNvbnN0IHRocmVzaG9sZCBvZiB0aHJlc2hvbGRzKSB7XG4gICAgc3dpdGNoICh0aHJlc2hvbGQudHlwZSkge1xuICAgICAgY2FzZSBUaHJlc2hvbGRUeXBlLk1heDoge1xuICAgICAgICBpZiAoc2l6ZSA8PSB0aHJlc2hvbGQubGltaXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpemVEaWZmZXJlbmNlID0gZm9ybWF0U2l6ZShzaXplIC0gdGhyZXNob2xkLmxpbWl0KTtcbiAgICAgICAgeWllbGQge1xuICAgICAgICAgIHNldmVyaXR5OiB0aHJlc2hvbGQuc2V2ZXJpdHksXG4gICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgbWVzc2FnZTogYCR7bGFiZWx9IGV4Y2VlZGVkIG1heGltdW0gYnVkZ2V0LiBCdWRnZXQgJHtmb3JtYXRTaXplKFxuICAgICAgICAgICAgdGhyZXNob2xkLmxpbWl0LFxuICAgICAgICAgICl9IHdhcyBub3QgbWV0IGJ5ICR7c2l6ZURpZmZlcmVuY2V9IHdpdGggYSB0b3RhbCBvZiAke2Zvcm1hdFNpemUoc2l6ZSl9LmAsXG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBUaHJlc2hvbGRUeXBlLk1pbjoge1xuICAgICAgICBpZiAoc2l6ZSA+PSB0aHJlc2hvbGQubGltaXQpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNpemVEaWZmZXJlbmNlID0gZm9ybWF0U2l6ZSh0aHJlc2hvbGQubGltaXQgLSBzaXplKTtcbiAgICAgICAgeWllbGQge1xuICAgICAgICAgIHNldmVyaXR5OiB0aHJlc2hvbGQuc2V2ZXJpdHksXG4gICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgbWVzc2FnZTogYCR7bGFiZWx9IGZhaWxlZCB0byBtZWV0IG1pbmltdW0gYnVkZ2V0LiBCdWRnZXQgJHtmb3JtYXRTaXplKFxuICAgICAgICAgICAgdGhyZXNob2xkLmxpbWl0LFxuICAgICAgICAgICl9IHdhcyBub3QgbWV0IGJ5ICR7c2l6ZURpZmZlcmVuY2V9IHdpdGggYSB0b3RhbCBvZiAke2Zvcm1hdFNpemUoc2l6ZSl9LmAsXG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdGhyZXNob2xkIHR5cGU6ICR7VGhyZXNob2xkVHlwZVt0aHJlc2hvbGQudHlwZV19YCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=
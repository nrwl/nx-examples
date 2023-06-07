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
exports.EsbuildExecutor = void 0;
/**
 * Provides the ability to execute esbuild regardless of the current platform's support
 * for using the native variant of esbuild. The native variant will be preferred (assuming
 * the `alwaysUseWasm` constructor option is `false) due to its inherent performance advantages.
 * At first use of esbuild, a supportability test will be automatically performed and the
 * WASM-variant will be used if needed by the platform.
 */
class EsbuildExecutor {
    /**
     * Constructs an instance of the `EsbuildExecutor` class.
     *
     * @param alwaysUseWasm If true, the WASM-variant will be preferred and no support test will be
     * performed; if false (default), the native variant will be preferred.
     */
    constructor(alwaysUseWasm = false) {
        this.alwaysUseWasm = alwaysUseWasm;
        this.initialized = false;
        this.esbuildTransform = this.esbuildFormatMessages = () => {
            throw new Error('esbuild implementation missing');
        };
    }
    /**
     * Determines whether the native variant of esbuild can be used on the current platform.
     *
     * @returns A promise which resolves to `true`, if the native variant of esbuild is support or `false`, if the WASM variant is required.
     */
    static async hasNativeSupport() {
        // Try to use native variant to ensure it is functional for the platform.
        try {
            const { formatMessages } = await Promise.resolve().then(() => __importStar(require('esbuild')));
            await formatMessages([], { kind: 'error' });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Initializes the esbuild transform and format messages functions.
     *
     * @returns A promise that fulfills when esbuild has been loaded and available for use.
     */
    async ensureEsbuild() {
        if (this.initialized) {
            return;
        }
        // If the WASM variant was preferred at class construction or native is not supported, use WASM
        if (this.alwaysUseWasm || !(await EsbuildExecutor.hasNativeSupport())) {
            await this.useWasm();
            this.initialized = true;
            return;
        }
        try {
            // Use the faster native variant if available.
            const { transform, formatMessages } = await Promise.resolve().then(() => __importStar(require('esbuild')));
            this.esbuildTransform = transform;
            this.esbuildFormatMessages = formatMessages;
        }
        catch {
            // If the native variant is not installed then use the WASM-based variant
            await this.useWasm();
        }
        this.initialized = true;
    }
    /**
     * Transitions an executor instance to use the WASM-variant of esbuild.
     */
    async useWasm() {
        const { transform, formatMessages } = await Promise.resolve().then(() => __importStar(require('esbuild-wasm')));
        this.esbuildTransform = transform;
        this.esbuildFormatMessages = formatMessages;
        // The ESBUILD_BINARY_PATH environment variable cannot exist when attempting to use the
        // WASM variant. If it is then the binary located at the specified path will be used instead
        // of the WASM variant.
        delete process.env.ESBUILD_BINARY_PATH;
        this.alwaysUseWasm = true;
    }
    async transform(input, options) {
        await this.ensureEsbuild();
        return this.esbuildTransform(input, options);
    }
    async formatMessages(messages, options) {
        await this.ensureEsbuild();
        return this.esbuildFormatMessages(messages, options);
    }
}
exports.EsbuildExecutor = EsbuildExecutor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC1leGVjdXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9lc2J1aWxkLWV4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBU0g7Ozs7OztHQU1HO0FBQ0gsTUFBYSxlQUFlO0lBTzFCOzs7OztPQUtHO0lBQ0gsWUFBb0IsZ0JBQWdCLEtBQUs7UUFBckIsa0JBQWEsR0FBYixhQUFhLENBQVE7UUFSakMsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFTMUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxHQUFHLEVBQUU7WUFDeEQsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0I7UUFDM0IseUVBQXlFO1FBQ3pFLElBQUk7WUFDRixNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsd0RBQWEsU0FBUyxHQUFDLENBQUM7WUFDbkQsTUFBTSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFNUMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUFDLE1BQU07WUFDTixPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxLQUFLLENBQUMsYUFBYTtRQUN6QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsT0FBTztTQUNSO1FBRUQsK0ZBQStGO1FBQy9GLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsTUFBTSxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFO1lBQ3JFLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBRXhCLE9BQU87U0FDUjtRQUVELElBQUk7WUFDRiw4Q0FBOEM7WUFDOUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsR0FBRyx3REFBYSxTQUFTLEdBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxjQUFjLENBQUM7U0FDN0M7UUFBQyxNQUFNO1lBQ04seUVBQXlFO1lBQ3pFLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3RCO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQUVEOztPQUVHO0lBQ0ssS0FBSyxDQUFDLE9BQU87UUFDbkIsTUFBTSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsR0FBRyx3REFBYSxjQUFjLEdBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxjQUFjLENBQUM7UUFFNUMsdUZBQXVGO1FBQ3ZGLDRGQUE0RjtRQUM1Rix1QkFBdUI7UUFDdkIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO1FBRXZDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxLQUFLLENBQUMsU0FBUyxDQUNiLEtBQTBCLEVBQzFCLE9BQTBCO1FBRTFCLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRTNCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsS0FBSyxDQUFDLGNBQWMsQ0FDbEIsUUFBMEIsRUFDMUIsT0FBOEI7UUFFOUIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFM0IsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDRjtBQXJHRCwwQ0FxR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBGb3JtYXRNZXNzYWdlc09wdGlvbnMsXG4gIFBhcnRpYWxNZXNzYWdlLFxuICBUcmFuc2Zvcm1PcHRpb25zLFxuICBUcmFuc2Zvcm1SZXN1bHQsXG59IGZyb20gJ2VzYnVpbGQnO1xuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSBhYmlsaXR5IHRvIGV4ZWN1dGUgZXNidWlsZCByZWdhcmRsZXNzIG9mIHRoZSBjdXJyZW50IHBsYXRmb3JtJ3Mgc3VwcG9ydFxuICogZm9yIHVzaW5nIHRoZSBuYXRpdmUgdmFyaWFudCBvZiBlc2J1aWxkLiBUaGUgbmF0aXZlIHZhcmlhbnQgd2lsbCBiZSBwcmVmZXJyZWQgKGFzc3VtaW5nXG4gKiB0aGUgYGFsd2F5c1VzZVdhc21gIGNvbnN0cnVjdG9yIG9wdGlvbiBpcyBgZmFsc2UpIGR1ZSB0byBpdHMgaW5oZXJlbnQgcGVyZm9ybWFuY2UgYWR2YW50YWdlcy5cbiAqIEF0IGZpcnN0IHVzZSBvZiBlc2J1aWxkLCBhIHN1cHBvcnRhYmlsaXR5IHRlc3Qgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHBlcmZvcm1lZCBhbmQgdGhlXG4gKiBXQVNNLXZhcmlhbnQgd2lsbCBiZSB1c2VkIGlmIG5lZWRlZCBieSB0aGUgcGxhdGZvcm0uXG4gKi9cbmV4cG9ydCBjbGFzcyBFc2J1aWxkRXhlY3V0b3JcbiAgaW1wbGVtZW50cyBQaWNrPHR5cGVvZiBpbXBvcnQoJ2VzYnVpbGQnKSwgJ3RyYW5zZm9ybScgfCAnZm9ybWF0TWVzc2FnZXMnPlxue1xuICBwcml2YXRlIGVzYnVpbGRUcmFuc2Zvcm06IHRoaXNbJ3RyYW5zZm9ybSddO1xuICBwcml2YXRlIGVzYnVpbGRGb3JtYXRNZXNzYWdlczogdGhpc1snZm9ybWF0TWVzc2FnZXMnXTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGFuIGluc3RhbmNlIG9mIHRoZSBgRXNidWlsZEV4ZWN1dG9yYCBjbGFzcy5cbiAgICpcbiAgICogQHBhcmFtIGFsd2F5c1VzZVdhc20gSWYgdHJ1ZSwgdGhlIFdBU00tdmFyaWFudCB3aWxsIGJlIHByZWZlcnJlZCBhbmQgbm8gc3VwcG9ydCB0ZXN0IHdpbGwgYmVcbiAgICogcGVyZm9ybWVkOyBpZiBmYWxzZSAoZGVmYXVsdCksIHRoZSBuYXRpdmUgdmFyaWFudCB3aWxsIGJlIHByZWZlcnJlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYWx3YXlzVXNlV2FzbSA9IGZhbHNlKSB7XG4gICAgdGhpcy5lc2J1aWxkVHJhbnNmb3JtID0gdGhpcy5lc2J1aWxkRm9ybWF0TWVzc2FnZXMgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VzYnVpbGQgaW1wbGVtZW50YXRpb24gbWlzc2luZycpO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgdmFyaWFudCBvZiBlc2J1aWxkIGNhbiBiZSB1c2VkIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgdG8gYHRydWVgLCBpZiB0aGUgbmF0aXZlIHZhcmlhbnQgb2YgZXNidWlsZCBpcyBzdXBwb3J0IG9yIGBmYWxzZWAsIGlmIHRoZSBXQVNNIHZhcmlhbnQgaXMgcmVxdWlyZWQuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaGFzTmF0aXZlU3VwcG9ydCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBUcnkgdG8gdXNlIG5hdGl2ZSB2YXJpYW50IHRvIGVuc3VyZSBpdCBpcyBmdW5jdGlvbmFsIGZvciB0aGUgcGxhdGZvcm0uXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgZm9ybWF0TWVzc2FnZXMgfSA9IGF3YWl0IGltcG9ydCgnZXNidWlsZCcpO1xuICAgICAgYXdhaXQgZm9ybWF0TWVzc2FnZXMoW10sIHsga2luZDogJ2Vycm9yJyB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBlc2J1aWxkIHRyYW5zZm9ybSBhbmQgZm9ybWF0IG1lc3NhZ2VzIGZ1bmN0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2hlbiBlc2J1aWxkIGhhcyBiZWVuIGxvYWRlZCBhbmQgYXZhaWxhYmxlIGZvciB1c2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGVuc3VyZUVzYnVpbGQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgV0FTTSB2YXJpYW50IHdhcyBwcmVmZXJyZWQgYXQgY2xhc3MgY29uc3RydWN0aW9uIG9yIG5hdGl2ZSBpcyBub3Qgc3VwcG9ydGVkLCB1c2UgV0FTTVxuICAgIGlmICh0aGlzLmFsd2F5c1VzZVdhc20gfHwgIShhd2FpdCBFc2J1aWxkRXhlY3V0b3IuaGFzTmF0aXZlU3VwcG9ydCgpKSkge1xuICAgICAgYXdhaXQgdGhpcy51c2VXYXNtKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBVc2UgdGhlIGZhc3RlciBuYXRpdmUgdmFyaWFudCBpZiBhdmFpbGFibGUuXG4gICAgICBjb25zdCB7IHRyYW5zZm9ybSwgZm9ybWF0TWVzc2FnZXMgfSA9IGF3YWl0IGltcG9ydCgnZXNidWlsZCcpO1xuXG4gICAgICB0aGlzLmVzYnVpbGRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICB0aGlzLmVzYnVpbGRGb3JtYXRNZXNzYWdlcyA9IGZvcm1hdE1lc3NhZ2VzO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSWYgdGhlIG5hdGl2ZSB2YXJpYW50IGlzIG5vdCBpbnN0YWxsZWQgdGhlbiB1c2UgdGhlIFdBU00tYmFzZWQgdmFyaWFudFxuICAgICAgYXdhaXQgdGhpcy51c2VXYXNtKCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNpdGlvbnMgYW4gZXhlY3V0b3IgaW5zdGFuY2UgdG8gdXNlIHRoZSBXQVNNLXZhcmlhbnQgb2YgZXNidWlsZC5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXNlV2FzbSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHRyYW5zZm9ybSwgZm9ybWF0TWVzc2FnZXMgfSA9IGF3YWl0IGltcG9ydCgnZXNidWlsZC13YXNtJyk7XG4gICAgdGhpcy5lc2J1aWxkVHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIHRoaXMuZXNidWlsZEZvcm1hdE1lc3NhZ2VzID0gZm9ybWF0TWVzc2FnZXM7XG5cbiAgICAvLyBUaGUgRVNCVUlMRF9CSU5BUllfUEFUSCBlbnZpcm9ubWVudCB2YXJpYWJsZSBjYW5ub3QgZXhpc3Qgd2hlbiBhdHRlbXB0aW5nIHRvIHVzZSB0aGVcbiAgICAvLyBXQVNNIHZhcmlhbnQuIElmIGl0IGlzIHRoZW4gdGhlIGJpbmFyeSBsb2NhdGVkIGF0IHRoZSBzcGVjaWZpZWQgcGF0aCB3aWxsIGJlIHVzZWQgaW5zdGVhZFxuICAgIC8vIG9mIHRoZSBXQVNNIHZhcmlhbnQuXG4gICAgZGVsZXRlIHByb2Nlc3MuZW52LkVTQlVJTERfQklOQVJZX1BBVEg7XG5cbiAgICB0aGlzLmFsd2F5c1VzZVdhc20gPSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgdHJhbnNmb3JtKFxuICAgIGlucHV0OiBzdHJpbmcgfCBVaW50OEFycmF5LFxuICAgIG9wdGlvbnM/OiBUcmFuc2Zvcm1PcHRpb25zLFxuICApOiBQcm9taXNlPFRyYW5zZm9ybVJlc3VsdD4ge1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRXNidWlsZCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXNidWlsZFRyYW5zZm9ybShpbnB1dCwgb3B0aW9ucyk7XG4gIH1cblxuICBhc3luYyBmb3JtYXRNZXNzYWdlcyhcbiAgICBtZXNzYWdlczogUGFydGlhbE1lc3NhZ2VbXSxcbiAgICBvcHRpb25zOiBGb3JtYXRNZXNzYWdlc09wdGlvbnMsXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUVzYnVpbGQoKTtcblxuICAgIHJldHVybiB0aGlzLmVzYnVpbGRGb3JtYXRNZXNzYWdlcyhtZXNzYWdlcywgb3B0aW9ucyk7XG4gIH1cbn1cbiJdfQ==
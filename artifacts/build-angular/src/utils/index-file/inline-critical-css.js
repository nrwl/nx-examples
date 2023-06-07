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
exports.InlineCriticalCssProcessor = void 0;
const fs = __importStar(require("fs"));
const Critters = require('critters');
/**
 * Pattern used to extract the media query set by Critters in an `onload` handler.
 */
const MEDIA_SET_HANDLER_PATTERN = /^this\.media=["'](.*)["'];?$/;
/**
 * Name of the attribute used to save the Critters media query so it can be re-assigned on load.
 */
const CSP_MEDIA_ATTR = 'ngCspMedia';
/**
 * Script text used to change the media value of the link tags.
 */
const LINK_LOAD_SCRIPT_CONTENT = [
    `(() => {`,
    // Save the `children` in a variable since they're a live DOM node collection.
    // We iterate over the direct descendants, instead of going through a `querySelectorAll`,
    // because we know that the tags will be directly inside the `head`.
    `  const children = document.head.children;`,
    // Declare `onLoad` outside the loop to avoid leaking memory.
    // Can't be an arrow function, because we need `this` to refer to the DOM node.
    `  function onLoad() {this.media = this.getAttribute('${CSP_MEDIA_ATTR}');}`,
    // Has to use a plain for loop, because some browsers don't support
    // `forEach` on `children` which is a `HTMLCollection`.
    `  for (let i = 0; i < children.length; i++) {`,
    `    const child = children[i];`,
    `    child.hasAttribute('${CSP_MEDIA_ATTR}') && child.addEventListener('load', onLoad);`,
    `  }`,
    `})();`,
].join('\n');
class CrittersExtended extends Critters {
    constructor(optionsExtended) {
        super({
            logger: {
                warn: (s) => this.warnings.push(s),
                error: (s) => this.errors.push(s),
                info: () => { },
            },
            logLevel: 'warn',
            path: optionsExtended.outputPath,
            publicPath: optionsExtended.deployUrl,
            compress: !!optionsExtended.minify,
            pruneSource: false,
            reduceInlineStyles: false,
            mergeStylesheets: false,
            // Note: if `preload` changes to anything other than `media`, the logic in
            // `embedLinkedStylesheetOverride` will have to be updated.
            preload: 'media',
            noscriptFallback: true,
            inlineFonts: true,
        });
        this.optionsExtended = optionsExtended;
        this.warnings = [];
        this.errors = [];
        this.addedCspScriptsDocuments = new WeakSet();
        this.documentNonces = new WeakMap();
        /**
         * Override of the Critters `embedLinkedStylesheet` method
         * that makes it work with Angular's CSP APIs.
         */
        this.embedLinkedStylesheetOverride = async (link, document) => {
            const returnValue = await this.initialEmbedLinkedStylesheet(link, document);
            const cspNonce = this.findCspNonce(document);
            if (cspNonce) {
                const crittersMedia = link.getAttribute('onload')?.match(MEDIA_SET_HANDLER_PATTERN);
                if (crittersMedia) {
                    // If there's a Critters-generated `onload` handler and the file has an Angular CSP nonce,
                    // we have to remove the handler, because it's incompatible with CSP. We save the value
                    // in a different attribute and we generate a script tag with the nonce that uses
                    // `addEventListener` to apply the media query instead.
                    link.removeAttribute('onload');
                    link.setAttribute(CSP_MEDIA_ATTR, crittersMedia[1]);
                    this.conditionallyInsertCspLoadingScript(document, cspNonce);
                }
                link.prev?.setAttribute('nonce', cspNonce);
            }
            return returnValue;
        };
        // We can't use inheritance to override `embedLinkedStylesheet`, because it's not declared in
        // the `Critters` .d.ts which means that we can't call the `super` implementation. TS doesn't
        // allow for `super` to be cast to a different type.
        this.initialEmbedLinkedStylesheet = this.embedLinkedStylesheet;
        this.embedLinkedStylesheet = this.embedLinkedStylesheetOverride;
    }
    readFile(path) {
        const readAsset = this.optionsExtended.readAsset;
        return readAsset ? readAsset(path) : fs.promises.readFile(path, 'utf-8');
    }
    /**
     * Finds the CSP nonce for a specific document.
     */
    findCspNonce(document) {
        if (this.documentNonces.has(document)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.documentNonces.get(document);
        }
        // HTML attribute are case-insensitive, but the parser used by Critters is case-sensitive.
        const nonceElement = document.querySelector('[ngCspNonce], [ngcspnonce]');
        const cspNonce = nonceElement?.getAttribute('ngCspNonce') || nonceElement?.getAttribute('ngcspnonce') || null;
        this.documentNonces.set(document, cspNonce);
        return cspNonce;
    }
    /**
     * Inserts the `script` tag that swaps the critical CSS at runtime,
     * if one hasn't been inserted into the document already.
     */
    conditionallyInsertCspLoadingScript(document, nonce) {
        if (this.addedCspScriptsDocuments.has(document)) {
            return;
        }
        const script = document.createElement('script');
        script.setAttribute('nonce', nonce);
        script.textContent = LINK_LOAD_SCRIPT_CONTENT;
        // Append the script to the head since it needs to
        // run as early as possible, after the `link` tags.
        document.head.appendChild(script);
        this.addedCspScriptsDocuments.add(document);
    }
}
class InlineCriticalCssProcessor {
    constructor(options) {
        this.options = options;
    }
    async process(html, options) {
        const critters = new CrittersExtended({ ...this.options, ...options });
        const content = await critters.process(html);
        return {
            // Clean up value from value less attributes.
            // This is caused because parse5 always requires attributes to have a string value.
            // nomodule="" defer="" -> nomodule defer.
            content: content.replace(/(\s(?:defer|nomodule))=""/g, '$1'),
            errors: critters.errors,
            warnings: critters.warnings,
        };
    }
}
exports.InlineCriticalCssProcessor = InlineCriticalCssProcessor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLWNyaXRpY2FsLWNzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL2luZGV4LWZpbGUvaW5saW5lLWNyaXRpY2FsLWNzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUV6QixNQUFNLFFBQVEsR0FBc0MsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRXhFOztHQUVHO0FBQ0gsTUFBTSx5QkFBeUIsR0FBRyw4QkFBOEIsQ0FBQztBQUVqRTs7R0FFRztBQUNILE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQztBQUVwQzs7R0FFRztBQUNILE1BQU0sd0JBQXdCLEdBQUc7SUFDL0IsVUFBVTtJQUNWLDhFQUE4RTtJQUM5RSx5RkFBeUY7SUFDekYsb0VBQW9FO0lBQ3BFLDRDQUE0QztJQUM1Qyw2REFBNkQ7SUFDN0QsK0VBQStFO0lBQy9FLHdEQUF3RCxjQUFjLE1BQU07SUFDNUUsbUVBQW1FO0lBQ25FLHVEQUF1RDtJQUN2RCwrQ0FBK0M7SUFDL0MsZ0NBQWdDO0lBQ2hDLDJCQUEyQixjQUFjLCtDQUErQztJQUN4RixLQUFLO0lBQ0wsT0FBTztDQUNSLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBdUNiLE1BQU0sZ0JBQWlCLFNBQVEsUUFBUTtJQVVyQyxZQUNtQixlQUNnQjtRQUVqQyxLQUFLLENBQUM7WUFDSixNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLEtBQUssRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENB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Qyw0QkFBNEIsRUFBRSxJQUFJLENBQUM7WUFDNUQsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNO1lBQ3ZCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtTQUM1QixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbkJELGdFQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbmNvbnN0IENyaXR0ZXJzOiB0eXBlb2YgaW1wb3J0KCdjcml0dGVycycpLmRlZmF1bHQgPSByZXF1aXJlKCdjcml0dGVycycpO1xuXG4vKipcbiAqIFBhdHRlcm4gdXNlZCB0byBleHRyYWN0IHRoZSBtZWRpYSBxdWVyeSBzZXQgYnkgQ3JpdHRlcnMgaW4gYW4gYG9ubG9hZGAgaGFuZGxlci5cbiAqL1xuY29uc3QgTUVESUFfU0VUX0hBTkRMRVJfUEFUVEVSTiA9IC9edGhpc1xcLm1lZGlhPVtcIiddKC4qKVtcIiddOz8kLztcblxuLyoqXG4gKiBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdXNlZCB0byBzYXZlIHRoZSBDcml0dGVycyBtZWRpYSBxdWVyeSBzbyBpdCBjYW4gYmUgcmUtYXNzaWduZWQgb24gbG9hZC5cbiAqL1xuY29uc3QgQ1NQX01FRElBX0FUVFIgPSAnbmdDc3BNZWRpYSc7XG5cbi8qKlxuICogU2NyaXB0IHRleHQgdXNlZCB0byBjaGFuZ2UgdGhlIG1lZGlhIHZhbHVlIG9mIHRoZSBsaW5rIHRhZ3MuXG4gKi9cbmNvbnN0IExJTktfTE9BRF9TQ1JJUFRfQ09OVEVOVCA9IFtcbiAgYCgoKSA9PiB7YCxcbiAgLy8gU2F2ZSB0aGUgYGNoaWxkcmVuYCBpbiBhIHZhcmlhYmxlIHNpbmNlIHRoZXkncmUgYSBsaXZlIERPTSBub2RlIGNvbGxlY3Rpb24uXG4gIC8vIFdlIGl0ZXJhdGUgb3ZlciB0aGUgZGlyZWN0IGRlc2NlbmRhbnRzLCBpbnN0ZWFkIG9mIGdvaW5nIHRocm91Z2ggYSBgcXVlcnlTZWxlY3RvckFsbGAsXG4gIC8vIGJlY2F1c2Ugd2Uga25vdyB0aGF0IHRoZSB0YWdzIHdpbGwgYmUgZGlyZWN0bHkgaW5zaWRlIHRoZSBgaGVhZGAuXG4gIGAgIGNvbnN0IGNoaWxkcmVuID0gZG9jdW1lbnQuaGVhZC5jaGlsZHJlbjtgLFxuICAvLyBEZWNsYXJlIGBvbkxvYWRgIG91dHNpZGUgdGhlIGxvb3AgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gIC8vIENhbid0IGJlIGFuIGFycm93IGZ1bmN0aW9uLCBiZWNhdXNlIHdlIG5lZWQgYHRoaXNgIHRvIHJlZmVyIHRvIHRoZSBET00gbm9kZS5cbiAgYCAgZnVuY3Rpb24gb25Mb2FkKCkge3RoaXMubWVkaWEgPSB0aGlzLmdldEF0dHJpYnV0ZSgnJHtDU1BfTUVESUFfQVRUUn0nKTt9YCxcbiAgLy8gSGFzIHRvIHVzZSBhIHBsYWluIGZvciBsb29wLCBiZWNhdXNlIHNvbWUgYnJvd3NlcnMgZG9uJ3Qgc3VwcG9ydFxuICAvLyBgZm9yRWFjaGAgb24gYGNoaWxkcmVuYCB3aGljaCBpcyBhIGBIVE1MQ29sbGVjdGlvbmAuXG4gIGAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtgLFxuICBgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07YCxcbiAgYCAgICBjaGlsZC5oYXNBdHRyaWJ1dGUoJyR7Q1NQX01FRElBX0FUVFJ9JykgJiYgY2hpbGQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7YCxcbiAgYCAgfWAsXG4gIGB9KSgpO2AsXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnQgaW50ZXJmYWNlIElubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc09wdGlvbnMge1xuICBvdXRwdXRQYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3JPcHRpb25zIHtcbiAgbWluaWZ5PzogYm9vbGVhbjtcbiAgZGVwbG95VXJsPzogc3RyaW5nO1xuICByZWFkQXNzZXQ/OiAocGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG59XG5cbi8qKiBQYXJ0aWFsIHJlcHJlc2VudGF0aW9uIG9mIGFuIGBIVE1MRWxlbWVudGAuICovXG5pbnRlcmZhY2UgUGFydGlhbEhUTUxFbGVtZW50IHtcbiAgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGw7XG4gIHNldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBoYXNBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogYm9vbGVhbjtcbiAgcmVtb3ZlQXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIGFwcGVuZENoaWxkKGNoaWxkOiBQYXJ0aWFsSFRNTEVsZW1lbnQpOiB2b2lkO1xuICB0ZXh0Q29udGVudDogc3RyaW5nO1xuICB0YWdOYW1lOiBzdHJpbmcgfCBudWxsO1xuICBjaGlsZHJlbjogUGFydGlhbEhUTUxFbGVtZW50W107XG4gIG5leHQ6IFBhcnRpYWxIVE1MRWxlbWVudCB8IG51bGw7XG4gIHByZXY6IFBhcnRpYWxIVE1MRWxlbWVudCB8IG51bGw7XG59XG5cbi8qKiBQYXJ0aWFsIHJlcHJlc2VudGF0aW9uIG9mIGFuIEhUTUwgYERvY3VtZW50YC4gKi9cbmludGVyZmFjZSBQYXJ0aWFsRG9jdW1lbnQge1xuICBoZWFkOiBQYXJ0aWFsSFRNTEVsZW1lbnQ7XG4gIGNyZWF0ZUVsZW1lbnQodGFnTmFtZTogc3RyaW5nKTogUGFydGlhbEhUTUxFbGVtZW50O1xuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQYXJ0aWFsSFRNTEVsZW1lbnQgfCBudWxsO1xufVxuXG4vKiogU2lnbmF0dXJlIG9mIHRoZSBgQ3JpdHRlcnMuZW1iZWRMaW5rZWRTdHlsZXNoZWV0YCBtZXRob2QuICovXG50eXBlIEVtYmVkTGlua2VkU3R5bGVzaGVldEZuID0gKFxuICBsaW5rOiBQYXJ0aWFsSFRNTEVsZW1lbnQsXG4gIGRvY3VtZW50OiBQYXJ0aWFsRG9jdW1lbnQsXG4pID0+IFByb21pc2U8dW5rbm93bj47XG5cbmNsYXNzIENyaXR0ZXJzRXh0ZW5kZWQgZXh0ZW5kcyBDcml0dGVycyB7XG4gIHJlYWRvbmx5IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICByZWFkb25seSBlcnJvcnM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgaW5pdGlhbEVtYmVkTGlua2VkU3R5bGVzaGVldDogRW1iZWRMaW5rZWRTdHlsZXNoZWV0Rm47XG4gIHByaXZhdGUgYWRkZWRDc3BTY3JpcHRzRG9jdW1lbnRzID0gbmV3IFdlYWtTZXQ8UGFydGlhbERvY3VtZW50PigpO1xuICBwcml2YXRlIGRvY3VtZW50Tm9uY2VzID0gbmV3IFdlYWtNYXA8UGFydGlhbERvY3VtZW50LCBzdHJpbmcgfCBudWxsPigpO1xuXG4gIC8vIEluaGVyaXRlZCBmcm9tIGBDcml0dGVyc2AsIGJ1dCBub3QgZXhwb3NlZCBpbiB0aGUgdHlwaW5ncy5cbiAgcHJvdGVjdGVkIGVtYmVkTGlua2VkU3R5bGVzaGVldCE6IEVtYmVkTGlua2VkU3R5bGVzaGVldEZuO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uc0V4dGVuZGVkOiBJbmxpbmVDcml0aWNhbENzc1Byb2Nlc3Nvck9wdGlvbnMgJlxuICAgICAgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoe1xuICAgICAgbG9nZ2VyOiB7XG4gICAgICAgIHdhcm46IChzOiBzdHJpbmcpID0+IHRoaXMud2FybmluZ3MucHVzaChzKSxcbiAgICAgICAgZXJyb3I6IChzOiBzdHJpbmcpID0+IHRoaXMuZXJyb3JzLnB1c2gocyksXG4gICAgICAgIGluZm86ICgpID0+IHt9LFxuICAgICAgfSxcbiAgICAgIGxvZ0xldmVsOiAnd2FybicsXG4gICAgICBwYXRoOiBvcHRpb25zRXh0ZW5kZWQub3V0cHV0UGF0aCxcbiAgICAgIHB1YmxpY1BhdGg6IG9wdGlvbnNFeHRlbmRlZC5kZXBsb3lVcmwsXG4gICAgICBjb21wcmVzczogISFvcHRpb25zRXh0ZW5kZWQubWluaWZ5LFxuICAgICAgcHJ1bmVTb3VyY2U6IGZhbHNlLFxuICAgICAgcmVkdWNlSW5saW5lU3R5bGVzOiBmYWxzZSxcbiAgICAgIG1lcmdlU3R5bGVzaGVldHM6IGZhbHNlLFxuICAgICAgLy8gTm90ZTogaWYgYHByZWxvYWRgIGNoYW5nZXMgdG8gYW55dGhpbmcgb3RoZXIgdGhhbiBgbWVkaWFgLCB0aGUgbG9naWMgaW5cbiAgICAgIC8vIGBlbWJlZExpbmtlZFN0eWxlc2hlZXRPdmVycmlkZWAgd2lsbCBoYXZlIHRvIGJlIHVwZGF0ZWQuXG4gICAgICBwcmVsb2FkOiAnbWVkaWEnLFxuICAgICAgbm9zY3JpcHRGYWxsYmFjazogdHJ1ZSxcbiAgICAgIGlubGluZUZvbnRzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gV2UgY2FuJ3QgdXNlIGluaGVyaXRhbmNlIHRvIG92ZXJyaWRlIGBlbWJlZExpbmtlZFN0eWxlc2hlZXRgLCBiZWNhdXNlIGl0J3Mgbm90IGRlY2xhcmVkIGluXG4gICAgLy8gdGhlIGBDcml0dGVyc2AgLmQudHMgd2hpY2ggbWVhbnMgdGhhdCB3ZSBjYW4ndCBjYWxsIHRoZSBgc3VwZXJgIGltcGxlbWVudGF0aW9uLiBUUyBkb2Vzbid0XG4gICAgLy8gYWxsb3cgZm9yIGBzdXBlcmAgdG8gYmUgY2FzdCB0byBhIGRpZmZlcmVudCB0eXBlLlxuICAgIHRoaXMuaW5pdGlhbEVtYmVkTGlua2VkU3R5bGVzaGVldCA9IHRoaXMuZW1iZWRMaW5rZWRTdHlsZXNoZWV0O1xuICAgIHRoaXMuZW1iZWRMaW5rZWRTdHlsZXNoZWV0ID0gdGhpcy5lbWJlZExpbmtlZFN0eWxlc2hlZXRPdmVycmlkZTtcbiAgfVxuXG4gIHB1YmxpYyBvdmVycmlkZSByZWFkRmlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlYWRBc3NldCA9IHRoaXMub3B0aW9uc0V4dGVuZGVkLnJlYWRBc3NldDtcblxuICAgIHJldHVybiByZWFkQXNzZXQgPyByZWFkQXNzZXQocGF0aCkgOiBmcy5wcm9taXNlcy5yZWFkRmlsZShwYXRoLCAndXRmLTgnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZSBvZiB0aGUgQ3JpdHRlcnMgYGVtYmVkTGlua2VkU3R5bGVzaGVldGAgbWV0aG9kXG4gICAqIHRoYXQgbWFrZXMgaXQgd29yayB3aXRoIEFuZ3VsYXIncyBDU1AgQVBJcy5cbiAgICovXG4gIHByaXZhdGUgZW1iZWRMaW5rZWRTdHlsZXNoZWV0T3ZlcnJpZGU6IEVtYmVkTGlua2VkU3R5bGVzaGVldEZuID0gYXN5bmMgKGxpbmssIGRvY3VtZW50KSA9PiB7XG4gICAgY29uc3QgcmV0dXJuVmFsdWUgPSBhd2FpdCB0aGlzLmluaXRpYWxFbWJlZExpbmtlZFN0eWxlc2hlZXQobGluaywgZG9jdW1lbnQpO1xuICAgIGNvbnN0IGNzcE5vbmNlID0gdGhpcy5maW5kQ3NwTm9uY2UoZG9jdW1lbnQpO1xuXG4gICAgaWYgKGNzcE5vbmNlKSB7XG4gICAgICBjb25zdCBjcml0dGVyc01lZGlhID0gbGluay5nZXRBdHRyaWJ1dGUoJ29ubG9hZCcpPy5tYXRjaChNRURJQV9TRVRfSEFORExFUl9QQVRURVJOKTtcblxuICAgICAgaWYgKGNyaXR0ZXJzTWVkaWEpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUncyBhIENyaXR0ZXJzLWdlbmVyYXRlZCBgb25sb2FkYCBoYW5kbGVyIGFuZCB0aGUgZmlsZSBoYXMgYW4gQW5ndWxhciBDU1Agbm9uY2UsXG4gICAgICAgIC8vIHdlIGhhdmUgdG8gcmVtb3ZlIHRoZSBoYW5kbGVyLCBiZWNhdXNlIGl0J3MgaW5jb21wYXRpYmxlIHdpdGggQ1NQLiBXZSBzYXZlIHRoZSB2YWx1ZVxuICAgICAgICAvLyBpbiBhIGRpZmZlcmVudCBhdHRyaWJ1dGUgYW5kIHdlIGdlbmVyYXRlIGEgc2NyaXB0IHRhZyB3aXRoIHRoZSBub25jZSB0aGF0IHVzZXNcbiAgICAgICAgLy8gYGFkZEV2ZW50TGlzdGVuZXJgIHRvIGFwcGx5IHRoZSBtZWRpYSBxdWVyeSBpbnN0ZWFkLlxuICAgICAgICBsaW5rLnJlbW92ZUF0dHJpYnV0ZSgnb25sb2FkJyk7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKENTUF9NRURJQV9BVFRSLCBjcml0dGVyc01lZGlhWzFdKTtcbiAgICAgICAgdGhpcy5jb25kaXRpb25hbGx5SW5zZXJ0Q3NwTG9hZGluZ1NjcmlwdChkb2N1bWVudCwgY3NwTm9uY2UpO1xuICAgICAgfVxuXG4gICAgICBsaW5rLnByZXY/LnNldEF0dHJpYnV0ZSgnbm9uY2UnLCBjc3BOb25jZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgQ1NQIG5vbmNlIGZvciBhIHNwZWNpZmljIGRvY3VtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBmaW5kQ3NwTm9uY2UoZG9jdW1lbnQ6IFBhcnRpYWxEb2N1bWVudCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICh0aGlzLmRvY3VtZW50Tm9uY2VzLmhhcyhkb2N1bWVudCkpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgICByZXR1cm4gdGhpcy5kb2N1bWVudE5vbmNlcy5nZXQoZG9jdW1lbnQpITtcbiAgICB9XG5cbiAgICAvLyBIVE1MIGF0dHJpYnV0ZSBhcmUgY2FzZS1pbnNlbnNpdGl2ZSwgYnV0IHRoZSBwYXJzZXIgdXNlZCBieSBDcml0dGVycyBpcyBjYXNlLXNlbnNpdGl2ZS5cbiAgICBjb25zdCBub25jZUVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmdDc3BOb25jZV0sIFtuZ2NzcG5vbmNlXScpO1xuICAgIGNvbnN0IGNzcE5vbmNlID1cbiAgICAgIG5vbmNlRWxlbWVudD8uZ2V0QXR0cmlidXRlKCduZ0NzcE5vbmNlJykgfHwgbm9uY2VFbGVtZW50Py5nZXRBdHRyaWJ1dGUoJ25nY3Nwbm9uY2UnKSB8fCBudWxsO1xuXG4gICAgdGhpcy5kb2N1bWVudE5vbmNlcy5zZXQoZG9jdW1lbnQsIGNzcE5vbmNlKTtcblxuICAgIHJldHVybiBjc3BOb25jZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnRzIHRoZSBgc2NyaXB0YCB0YWcgdGhhdCBzd2FwcyB0aGUgY3JpdGljYWwgQ1NTIGF0IHJ1bnRpbWUsXG4gICAqIGlmIG9uZSBoYXNuJ3QgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudCBhbHJlYWR5LlxuICAgKi9cbiAgcHJpdmF0ZSBjb25kaXRpb25hbGx5SW5zZXJ0Q3NwTG9hZGluZ1NjcmlwdChkb2N1bWVudDogUGFydGlhbERvY3VtZW50LCBub25jZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYWRkZWRDc3BTY3JpcHRzRG9jdW1lbnRzLmhhcyhkb2N1bWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuc2V0QXR0cmlidXRlKCdub25jZScsIG5vbmNlKTtcbiAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBMSU5LX0xPQURfU0NSSVBUX0NPTlRFTlQ7XG4gICAgLy8gQXBwZW5kIHRoZSBzY3JpcHQgdG8gdGhlIGhlYWQgc2luY2UgaXQgbmVlZHMgdG9cbiAgICAvLyBydW4gYXMgZWFybHkgYXMgcG9zc2libGUsIGFmdGVyIHRoZSBgbGlua2AgdGFncy5cbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgdGhpcy5hZGRlZENzcFNjcmlwdHNEb2N1bWVudHMuYWRkKGRvY3VtZW50KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmVhZG9ubHkgb3B0aW9uczogSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3JPcHRpb25zKSB7fVxuXG4gIGFzeW5jIHByb2Nlc3MoXG4gICAgaHRtbDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IElubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc09wdGlvbnMsXG4gICk6IFByb21pc2U8eyBjb250ZW50OiBzdHJpbmc7IHdhcm5pbmdzOiBzdHJpbmdbXTsgZXJyb3JzOiBzdHJpbmdbXSB9PiB7XG4gICAgY29uc3QgY3JpdHRlcnMgPSBuZXcgQ3JpdHRlcnNFeHRlbmRlZCh7IC4uLnRoaXMub3B0aW9ucywgLi4ub3B0aW9ucyB9KTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgY3JpdHRlcnMucHJvY2VzcyhodG1sKTtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBDbGVhbiB1cCB2YWx1ZSBmcm9tIHZhbHVlIGxlc3MgYXR0cmlidXRlcy5cbiAgICAgIC8vIFRoaXMgaXMgY2F1c2VkIGJlY2F1c2UgcGFyc2U1IGFsd2F5cyByZXF1aXJlcyBhdHRyaWJ1dGVzIHRvIGhhdmUgYSBzdHJpbmcgdmFsdWUuXG4gICAgICAvLyBub21vZHVsZT1cIlwiIGRlZmVyPVwiXCIgLT4gbm9tb2R1bGUgZGVmZXIuXG4gICAgICBjb250ZW50OiBjb250ZW50LnJlcGxhY2UoLyhcXHMoPzpkZWZlcnxub21vZHVsZSkpPVwiXCIvZywgJyQxJyksXG4gICAgICBlcnJvcnM6IGNyaXR0ZXJzLmVycm9ycyxcbiAgICAgIHdhcm5pbmdzOiBjcml0dGVycy53YXJuaW5ncyxcbiAgICB9O1xuICB9XG59XG4iXX0=
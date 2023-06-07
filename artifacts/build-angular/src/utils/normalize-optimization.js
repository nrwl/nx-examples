"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptimization = void 0;
function normalizeOptimization(optimization = true) {
    if (typeof optimization === 'object') {
        return {
            scripts: !!optimization.scripts,
            styles: typeof optimization.styles === 'object'
                ? optimization.styles
                : {
                    minify: !!optimization.styles,
                    inlineCritical: !!optimization.styles,
                },
            fonts: typeof optimization.fonts === 'object'
                ? optimization.fonts
                : {
                    inline: !!optimization.fonts,
                },
        };
    }
    return {
        scripts: optimization,
        styles: {
            minify: optimization,
            inlineCritical: optimization,
        },
        fonts: {
            inline: optimization,
        },
    };
}
exports.normalizeOptimization = normalizeOptimization;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLW9wdGltaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL25vcm1hbGl6ZS1vcHRpbWl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBZ0JILFNBQWdCLHFCQUFxQixDQUNuQyxlQUFrQyxJQUFJO0lBRXRDLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1FBQ3BDLE9BQU87WUFDTCxPQUFPLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPO1lBQy9CLE1BQU0sRUFDSixPQUFPLFlBQVksQ0FBQyxNQUFNLEtBQUssUUFBUTtnQkFDckMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNO2dCQUNyQixDQUFDLENBQUM7b0JBQ0UsTUFBTSxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTTtvQkFDN0IsY0FBYyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTTtpQkFDdEM7WUFDUCxLQUFLLEVBQ0gsT0FBTyxZQUFZLENBQUMsS0FBSyxLQUFLLFFBQVE7Z0JBQ3BDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSztnQkFDcEIsQ0FBQyxDQUFDO29CQUNFLE1BQU0sRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUs7aUJBQzdCO1NBQ1IsQ0FBQztLQUNIO0lBRUQsT0FBTztRQUNMLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLE1BQU0sRUFBRTtZQUNOLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLGNBQWMsRUFBRSxZQUFZO1NBQzdCO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsTUFBTSxFQUFFLFlBQVk7U0FDckI7S0FDRixDQUFDO0FBQ0osQ0FBQztBQWhDRCxzREFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRm9udHNDbGFzcyxcbiAgT3B0aW1pemF0aW9uQ2xhc3MsXG4gIE9wdGltaXphdGlvblVuaW9uLFxuICBTdHlsZXNDbGFzcyxcbn0gZnJvbSAnLi4vYnVpbGRlcnMvYnJvd3Nlci9zY2hlbWEnO1xuXG5leHBvcnQgdHlwZSBOb3JtYWxpemVkT3B0aW1pemF0aW9uT3B0aW9ucyA9IFJlcXVpcmVkPFxuICBPbWl0PE9wdGltaXphdGlvbkNsYXNzLCAnZm9udHMnIHwgJ3N0eWxlcyc+XG4+ICYge1xuICBmb250czogRm9udHNDbGFzcztcbiAgc3R5bGVzOiBTdHlsZXNDbGFzcztcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVPcHRpbWl6YXRpb24oXG4gIG9wdGltaXphdGlvbjogT3B0aW1pemF0aW9uVW5pb24gPSB0cnVlLFxuKTogTm9ybWFsaXplZE9wdGltaXphdGlvbk9wdGlvbnMge1xuICBpZiAodHlwZW9mIG9wdGltaXphdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2NyaXB0czogISFvcHRpbWl6YXRpb24uc2NyaXB0cyxcbiAgICAgIHN0eWxlczpcbiAgICAgICAgdHlwZW9mIG9wdGltaXphdGlvbi5zdHlsZXMgPT09ICdvYmplY3QnXG4gICAgICAgICAgPyBvcHRpbWl6YXRpb24uc3R5bGVzXG4gICAgICAgICAgOiB7XG4gICAgICAgICAgICAgIG1pbmlmeTogISFvcHRpbWl6YXRpb24uc3R5bGVzLFxuICAgICAgICAgICAgICBpbmxpbmVDcml0aWNhbDogISFvcHRpbWl6YXRpb24uc3R5bGVzLFxuICAgICAgICAgICAgfSxcbiAgICAgIGZvbnRzOlxuICAgICAgICB0eXBlb2Ygb3B0aW1pemF0aW9uLmZvbnRzID09PSAnb2JqZWN0J1xuICAgICAgICAgID8gb3B0aW1pemF0aW9uLmZvbnRzXG4gICAgICAgICAgOiB7XG4gICAgICAgICAgICAgIGlubGluZTogISFvcHRpbWl6YXRpb24uZm9udHMsXG4gICAgICAgICAgICB9LFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNjcmlwdHM6IG9wdGltaXphdGlvbixcbiAgICBzdHlsZXM6IHtcbiAgICAgIG1pbmlmeTogb3B0aW1pemF0aW9uLFxuICAgICAgaW5saW5lQ3JpdGljYWw6IG9wdGltaXphdGlvbixcbiAgICB9LFxuICAgIGZvbnRzOiB7XG4gICAgICBpbmxpbmU6IG9wdGltaXphdGlvbixcbiAgICB9LFxuICB9O1xufVxuIl19
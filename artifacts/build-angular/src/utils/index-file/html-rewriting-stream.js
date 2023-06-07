"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlRewritingStream = void 0;
const stream_1 = require("stream");
const load_esm_1 = require("../load-esm");
async function htmlRewritingStream(content) {
    const { RewritingStream } = await (0, load_esm_1.loadEsmModule)('parse5-html-rewriting-stream');
    const chunks = [];
    const rewriter = new RewritingStream();
    return {
        rewriter,
        transformedContent: () => {
            return new Promise((resolve) => {
                new stream_1.Readable({
                    encoding: 'utf8',
                    read() {
                        this.push(Buffer.from(content));
                        this.push(null);
                    },
                })
                    .pipe(rewriter)
                    .pipe(new stream_1.Writable({
                    write(chunk, encoding, callback) {
                        chunks.push(typeof chunk === 'string'
                            ? Buffer.from(chunk, encoding)
                            : chunk);
                        callback();
                    },
                    final(callback) {
                        callback();
                        resolve(Buffer.concat(chunks).toString());
                    },
                }));
            });
        },
    };
}
exports.htmlRewritingStream = htmlRewritingStream;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC1yZXdyaXRpbmctc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaW5kZXgtZmlsZS9odG1sLXJld3JpdGluZy1zdHJlYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsbUNBQTRDO0FBQzVDLDBDQUE0QztBQUVyQyxLQUFLLFVBQVUsbUJBQW1CLENBQUMsT0FBZTtJQUl2RCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxJQUFBLHdCQUFhLEVBQzdDLDhCQUE4QixDQUMvQixDQUFDO0lBQ0YsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO0lBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7SUFFdkMsT0FBTztRQUNMLFFBQVE7UUFDUixrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDdkIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUM3QixJQUFJLGlCQUFRLENBQUM7b0JBQ1gsUUFBUSxFQUFFLE1BQU07b0JBQ2hCLElBQUk7d0JBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2xCLENBQUM7aUJBQ0YsQ0FBQztxQkFDQyxJQUFJLENBQUMsUUFBUSxDQUFDO3FCQUNkLElBQUksQ0FDSCxJQUFJLGlCQUFRLENBQUM7b0JBQ1gsS0FBSyxDQUNILEtBQXNCLEVBQ3RCLFFBQTRCLEVBQzVCLFFBQWtCO3dCQUVsQixNQUFNLENBQUMsSUFBSSxDQUNULE9BQU8sS0FBSyxLQUFLLFFBQVE7NEJBQ3ZCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUEwQixDQUFDOzRCQUNoRCxDQUFDLENBQUMsS0FBSyxDQUNWLENBQUM7d0JBQ0YsUUFBUSxFQUFFLENBQUM7b0JBQ2IsQ0FBQztvQkFDRCxLQUFLLENBQUMsUUFBaUM7d0JBQ3JDLFFBQVEsRUFBRSxDQUFDO3dCQUNYLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQzVDLENBQUM7aUJBQ0YsQ0FBQyxDQUNILENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQTdDRCxrREE2Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgUmVhZGFibGUsIFdyaXRhYmxlIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuLi9sb2FkLWVzbSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBodG1sUmV3cml0aW5nU3RyZWFtKGNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8e1xuICByZXdyaXRlcjogaW1wb3J0KCdwYXJzZTUtaHRtbC1yZXdyaXRpbmctc3RyZWFtJykuUmV3cml0aW5nU3RyZWFtO1xuICB0cmFuc2Zvcm1lZENvbnRlbnQ6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbn0+IHtcbiAgY29uc3QgeyBSZXdyaXRpbmdTdHJlYW0gfSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgncGFyc2U1LWh0bWwtcmV3cml0aW5nLXN0cmVhbScpPihcbiAgICAncGFyc2U1LWh0bWwtcmV3cml0aW5nLXN0cmVhbScsXG4gICk7XG4gIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgY29uc3QgcmV3cml0ZXIgPSBuZXcgUmV3cml0aW5nU3RyZWFtKCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZXdyaXRlcixcbiAgICB0cmFuc2Zvcm1lZENvbnRlbnQ6ICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBuZXcgUmVhZGFibGUoe1xuICAgICAgICAgIGVuY29kaW5nOiAndXRmOCcsXG4gICAgICAgICAgcmVhZCgpOiB2b2lkIHtcbiAgICAgICAgICAgIHRoaXMucHVzaChCdWZmZXIuZnJvbShjb250ZW50KSk7XG4gICAgICAgICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICAgICAucGlwZShyZXdyaXRlcilcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIG5ldyBXcml0YWJsZSh7XG4gICAgICAgICAgICAgIHdyaXRlKFxuICAgICAgICAgICAgICAgIGNodW5rOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogRnVuY3Rpb24sXG4gICAgICAgICAgICAgICk6IHZvaWQge1xuICAgICAgICAgICAgICAgIGNodW5rcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgdHlwZW9mIGNodW5rID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IEJ1ZmZlci5mcm9tKGNodW5rLCBlbmNvZGluZyBhcyBCdWZmZXJFbmNvZGluZylcbiAgICAgICAgICAgICAgICAgICAgOiBjaHVuayxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZpbmFsKGNhbGxiYWNrOiAoZXJyb3I/OiBFcnJvcikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==
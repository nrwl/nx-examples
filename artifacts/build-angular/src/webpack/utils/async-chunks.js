"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsyncChunksNonInitial = void 0;
/**
 * Webpack stats may incorrectly mark extra entry points `initial` chunks, when
 * they are actually loaded asynchronously and thus not in the main bundle. This
 * function finds extra entry points in Webpack stats and corrects this value
 * whereever necessary. Does not modify {@param webpackStats}.
 */
function markAsyncChunksNonInitial(webpackStats, extraEntryPoints) {
    const { chunks = [], entrypoints: entryPoints = {} } = webpackStats;
    // Find all Webpack chunk IDs not injected into the main bundle. We don't have
    // to worry about transitive dependencies because extra entry points cannot be
    // depended upon in Webpack, thus any extra entry point with `inject: false`,
    // **cannot** be loaded in main bundle.
    const asyncChunkIds = extraEntryPoints
        .filter((entryPoint) => !entryPoint.inject && entryPoints[entryPoint.bundleName])
        .flatMap((entryPoint) => entryPoints[entryPoint.bundleName].chunks?.filter((n) => n !== 'runtime'));
    // Find chunks for each ID.
    const asyncChunks = asyncChunkIds.map((chunkId) => {
        const chunk = chunks.find((chunk) => chunk.id === chunkId);
        if (!chunk) {
            throw new Error(`Failed to find chunk (${chunkId}) in set:\n${JSON.stringify(chunks)}`);
        }
        return chunk;
    });
    // A chunk is considered `initial` only if Webpack already belives it to be initial
    // and the application developer did not mark it async via an extra entry point.
    return chunks.map((chunk) => {
        return asyncChunks.find((asyncChunk) => asyncChunk === chunk)
            ? {
                ...chunk,
                initial: false,
            }
            : chunk;
    });
}
exports.markAsyncChunksNonInitial = markAsyncChunksNonInitial;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMtY2h1bmtzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay91dGlscy9hc3luYy1jaHVua3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBS0g7Ozs7O0dBS0c7QUFDSCxTQUFnQix5QkFBeUIsQ0FDdkMsWUFBOEIsRUFDOUIsZ0JBQXdDO0lBRXhDLE1BQU0sRUFBRSxNQUFNLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxXQUFXLEdBQUcsRUFBRSxFQUFFLEdBQUcsWUFBWSxDQUFDO0lBRXBFLDhFQUE4RTtJQUM5RSw4RUFBOEU7SUFDOUUsNkVBQTZFO0lBQzdFLHVDQUF1QztJQUN2QyxNQUFNLGFBQWEsR0FBRyxnQkFBZ0I7U0FDbkMsTUFBTSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoRixPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUN0QixXQUFXLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FDMUUsQ0FBQztJQUVKLDJCQUEyQjtJQUMzQixNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDaEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsT0FBTyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3pGO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLENBQUMsQ0FBQztJQUVILG1GQUFtRjtJQUNuRixnRkFBZ0Y7SUFDaEYsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDMUIsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDO1lBQzNELENBQUMsQ0FBQztnQkFDRSxHQUFHLEtBQUs7Z0JBQ1IsT0FBTyxFQUFFLEtBQUs7YUFDZjtZQUNILENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDWixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFwQ0QsOERBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFN0YXRzQ2h1bmssIFN0YXRzQ29tcGlsYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IE5vcm1hbGl6ZWRFbnRyeVBvaW50IH0gZnJvbSAnLi9oZWxwZXJzJztcblxuLyoqXG4gKiBXZWJwYWNrIHN0YXRzIG1heSBpbmNvcnJlY3RseSBtYXJrIGV4dHJhIGVudHJ5IHBvaW50cyBgaW5pdGlhbGAgY2h1bmtzLCB3aGVuXG4gKiB0aGV5IGFyZSBhY3R1YWxseSBsb2FkZWQgYXN5bmNocm9ub3VzbHkgYW5kIHRodXMgbm90IGluIHRoZSBtYWluIGJ1bmRsZS4gVGhpc1xuICogZnVuY3Rpb24gZmluZHMgZXh0cmEgZW50cnkgcG9pbnRzIGluIFdlYnBhY2sgc3RhdHMgYW5kIGNvcnJlY3RzIHRoaXMgdmFsdWVcbiAqIHdoZXJlZXZlciBuZWNlc3NhcnkuIERvZXMgbm90IG1vZGlmeSB7QHBhcmFtIHdlYnBhY2tTdGF0c30uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXN5bmNDaHVua3NOb25Jbml0aWFsKFxuICB3ZWJwYWNrU3RhdHM6IFN0YXRzQ29tcGlsYXRpb24sXG4gIGV4dHJhRW50cnlQb2ludHM6IE5vcm1hbGl6ZWRFbnRyeVBvaW50W10sXG4pOiBTdGF0c0NodW5rW10ge1xuICBjb25zdCB7IGNodW5rcyA9IFtdLCBlbnRyeXBvaW50czogZW50cnlQb2ludHMgPSB7fSB9ID0gd2VicGFja1N0YXRzO1xuXG4gIC8vIEZpbmQgYWxsIFdlYnBhY2sgY2h1bmsgSURzIG5vdCBpbmplY3RlZCBpbnRvIHRoZSBtYWluIGJ1bmRsZS4gV2UgZG9uJ3QgaGF2ZVxuICAvLyB0byB3b3JyeSBhYm91dCB0cmFuc2l0aXZlIGRlcGVuZGVuY2llcyBiZWNhdXNlIGV4dHJhIGVudHJ5IHBvaW50cyBjYW5ub3QgYmVcbiAgLy8gZGVwZW5kZWQgdXBvbiBpbiBXZWJwYWNrLCB0aHVzIGFueSBleHRyYSBlbnRyeSBwb2ludCB3aXRoIGBpbmplY3Q6IGZhbHNlYCxcbiAgLy8gKipjYW5ub3QqKiBiZSBsb2FkZWQgaW4gbWFpbiBidW5kbGUuXG4gIGNvbnN0IGFzeW5jQ2h1bmtJZHMgPSBleHRyYUVudHJ5UG9pbnRzXG4gICAgLmZpbHRlcigoZW50cnlQb2ludCkgPT4gIWVudHJ5UG9pbnQuaW5qZWN0ICYmIGVudHJ5UG9pbnRzW2VudHJ5UG9pbnQuYnVuZGxlTmFtZV0pXG4gICAgLmZsYXRNYXAoKGVudHJ5UG9pbnQpID0+XG4gICAgICBlbnRyeVBvaW50c1tlbnRyeVBvaW50LmJ1bmRsZU5hbWVdLmNodW5rcz8uZmlsdGVyKChuKSA9PiBuICE9PSAncnVudGltZScpLFxuICAgICk7XG5cbiAgLy8gRmluZCBjaHVua3MgZm9yIGVhY2ggSUQuXG4gIGNvbnN0IGFzeW5jQ2h1bmtzID0gYXN5bmNDaHVua0lkcy5tYXAoKGNodW5rSWQpID0+IHtcbiAgICBjb25zdCBjaHVuayA9IGNodW5rcy5maW5kKChjaHVuaykgPT4gY2h1bmsuaWQgPT09IGNodW5rSWQpO1xuICAgIGlmICghY2h1bmspIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZpbmQgY2h1bmsgKCR7Y2h1bmtJZH0pIGluIHNldDpcXG4ke0pTT04uc3RyaW5naWZ5KGNodW5rcyl9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNodW5rO1xuICB9KTtcblxuICAvLyBBIGNodW5rIGlzIGNvbnNpZGVyZWQgYGluaXRpYWxgIG9ubHkgaWYgV2VicGFjayBhbHJlYWR5IGJlbGl2ZXMgaXQgdG8gYmUgaW5pdGlhbFxuICAvLyBhbmQgdGhlIGFwcGxpY2F0aW9uIGRldmVsb3BlciBkaWQgbm90IG1hcmsgaXQgYXN5bmMgdmlhIGFuIGV4dHJhIGVudHJ5IHBvaW50LlxuICByZXR1cm4gY2h1bmtzLm1hcCgoY2h1bmspID0+IHtcbiAgICByZXR1cm4gYXN5bmNDaHVua3MuZmluZCgoYXN5bmNDaHVuaykgPT4gYXN5bmNDaHVuayA9PT0gY2h1bmspXG4gICAgICA/IHtcbiAgICAgICAgICAuLi5jaHVuayxcbiAgICAgICAgICBpbml0aWFsOiBmYWxzZSxcbiAgICAgICAgfVxuICAgICAgOiBjaHVuaztcbiAgfSk7XG59XG4iXX0=
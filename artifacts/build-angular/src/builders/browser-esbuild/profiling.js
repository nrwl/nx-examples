"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSync = exports.profileAsync = exports.logCumulativeDurations = exports.resetCumulativeDurations = void 0;
const environment_options_1 = require("../../utils/environment-options");
let cumulativeDurations;
function resetCumulativeDurations() {
    cumulativeDurations?.clear();
}
exports.resetCumulativeDurations = resetCumulativeDurations;
function logCumulativeDurations() {
    if (!environment_options_1.debugPerformance || !cumulativeDurations) {
        return;
    }
    for (const [name, durations] of cumulativeDurations) {
        let total = 0;
        let min;
        let max;
        for (const duration of durations) {
            total += duration;
            if (min === undefined || duration < min) {
                min = duration;
            }
            if (max === undefined || duration > max) {
                max = duration;
            }
        }
        const average = total / durations.length;
        // eslint-disable-next-line no-console
        console.log(`DURATION[${name}]: ${total.toFixed(9)}s [count: ${durations.length}; avg: ${average.toFixed(9)}s; min: ${min?.toFixed(9)}s; max: ${max?.toFixed(9)}s]`);
    }
}
exports.logCumulativeDurations = logCumulativeDurations;
function recordDuration(name, startTime, cumulative) {
    const duration = Number(process.hrtime.bigint() - startTime) / 10 ** 9;
    if (cumulative) {
        cumulativeDurations ?? (cumulativeDurations = new Map());
        const durations = cumulativeDurations.get(name) ?? [];
        durations.push(duration);
        cumulativeDurations.set(name, durations);
    }
    else {
        // eslint-disable-next-line no-console
        console.log(`DURATION[${name}]: ${duration.toFixed(9)}s`);
    }
}
async function profileAsync(name, action, cumulative) {
    if (!environment_options_1.debugPerformance) {
        return action();
    }
    const startTime = process.hrtime.bigint();
    try {
        return await action();
    }
    finally {
        recordDuration(name, startTime, cumulative);
    }
}
exports.profileAsync = profileAsync;
function profileSync(name, action, cumulative) {
    if (!environment_options_1.debugPerformance) {
        return action();
    }
    const startTime = process.hrtime.bigint();
    try {
        return action();
    }
    finally {
        recordDuration(name, startTime, cumulative);
    }
}
exports.profileSync = profileSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvYnJvd3Nlci1lc2J1aWxkL3Byb2ZpbGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCx5RUFBbUU7QUFFbkUsSUFBSSxtQkFBc0QsQ0FBQztBQUUzRCxTQUFnQix3QkFBd0I7SUFDdEMsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQUZELDREQUVDO0FBRUQsU0FBZ0Isc0JBQXNCO0lBQ3BDLElBQUksQ0FBQyxzQ0FBZ0IsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1FBQzdDLE9BQU87S0FDUjtJQUVELEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxtQkFBbUIsRUFBRTtRQUNuRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLEdBQUcsQ0FBQztRQUNSLElBQUksR0FBRyxDQUFDO1FBQ1IsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7WUFDaEMsS0FBSyxJQUFJLFFBQVEsQ0FBQztZQUNsQixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksUUFBUSxHQUFHLEdBQUcsRUFBRTtnQkFDdkMsR0FBRyxHQUFHLFFBQVEsQ0FBQzthQUNoQjtZQUNELElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxRQUFRLEdBQUcsR0FBRyxFQUFFO2dCQUN2QyxHQUFHLEdBQUcsUUFBUSxDQUFDO2FBQ2hCO1NBQ0Y7UUFDRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUN6QyxzQ0FBc0M7UUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FDVCxZQUFZLElBQUksTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxhQUFhLFNBQVMsQ0FBQyxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQU8sQ0FDMUYsQ0FBQyxDQUNGLFdBQVcsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQzFELENBQUM7S0FDSDtBQUNILENBQUM7QUExQkQsd0RBMEJDO0FBRUQsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsVUFBb0I7SUFDM0UsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2RSxJQUFJLFVBQVUsRUFBRTtRQUNkLG1CQUFtQixLQUFuQixtQkFBbUIsR0FBSyxJQUFJLEdBQUcsRUFBb0IsRUFBQztRQUNwRCxNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RELFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztLQUMxQztTQUFNO1FBQ0wsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLE1BQU0sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDM0Q7QUFDSCxDQUFDO0FBRU0sS0FBSyxVQUFVLFlBQVksQ0FDaEMsSUFBWSxFQUNaLE1BQXdCLEVBQ3hCLFVBQW9CO0lBRXBCLElBQUksQ0FBQyxzQ0FBZ0IsRUFBRTtRQUNyQixPQUFPLE1BQU0sRUFBRSxDQUFDO0tBQ2pCO0lBRUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQyxJQUFJO1FBQ0YsT0FBTyxNQUFNLE1BQU0sRUFBRSxDQUFDO0tBQ3ZCO1lBQVM7UUFDUixjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM3QztBQUNILENBQUM7QUFmRCxvQ0FlQztBQUVELFNBQWdCLFdBQVcsQ0FBSSxJQUFZLEVBQUUsTUFBZSxFQUFFLFVBQW9CO0lBQ2hGLElBQUksQ0FBQyxzQ0FBZ0IsRUFBRTtRQUNyQixPQUFPLE1BQU0sRUFBRSxDQUFDO0tBQ2pCO0lBRUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQyxJQUFJO1FBQ0YsT0FBTyxNQUFNLEVBQUUsQ0FBQztLQUNqQjtZQUFTO1FBQ1IsY0FBYyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBWEQsa0NBV0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgZGVidWdQZXJmb3JtYW5jZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuXG5sZXQgY3VtdWxhdGl2ZUR1cmF0aW9uczogTWFwPHN0cmluZywgbnVtYmVyW10+IHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDdW11bGF0aXZlRHVyYXRpb25zKCk6IHZvaWQge1xuICBjdW11bGF0aXZlRHVyYXRpb25zPy5jbGVhcigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9nQ3VtdWxhdGl2ZUR1cmF0aW9ucygpOiB2b2lkIHtcbiAgaWYgKCFkZWJ1Z1BlcmZvcm1hbmNlIHx8ICFjdW11bGF0aXZlRHVyYXRpb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChjb25zdCBbbmFtZSwgZHVyYXRpb25zXSBvZiBjdW11bGF0aXZlRHVyYXRpb25zKSB7XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICBsZXQgbWluO1xuICAgIGxldCBtYXg7XG4gICAgZm9yIChjb25zdCBkdXJhdGlvbiBvZiBkdXJhdGlvbnMpIHtcbiAgICAgIHRvdGFsICs9IGR1cmF0aW9uO1xuICAgICAgaWYgKG1pbiA9PT0gdW5kZWZpbmVkIHx8IGR1cmF0aW9uIDwgbWluKSB7XG4gICAgICAgIG1pbiA9IGR1cmF0aW9uO1xuICAgICAgfVxuICAgICAgaWYgKG1heCA9PT0gdW5kZWZpbmVkIHx8IGR1cmF0aW9uID4gbWF4KSB7XG4gICAgICAgIG1heCA9IGR1cmF0aW9uO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBhdmVyYWdlID0gdG90YWwgLyBkdXJhdGlvbnMubGVuZ3RoO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgRFVSQVRJT05bJHtuYW1lfV06ICR7dG90YWwudG9GaXhlZCg5KX1zIFtjb3VudDogJHtkdXJhdGlvbnMubGVuZ3RofTsgYXZnOiAke2F2ZXJhZ2UudG9GaXhlZChcbiAgICAgICAgOSxcbiAgICAgICl9czsgbWluOiAke21pbj8udG9GaXhlZCg5KX1zOyBtYXg6ICR7bWF4Py50b0ZpeGVkKDkpfXNdYCxcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlY29yZER1cmF0aW9uKG5hbWU6IHN0cmluZywgc3RhcnRUaW1lOiBiaWdpbnQsIGN1bXVsYXRpdmU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGR1cmF0aW9uID0gTnVtYmVyKHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpIC0gc3RhcnRUaW1lKSAvIDEwICoqIDk7XG4gIGlmIChjdW11bGF0aXZlKSB7XG4gICAgY3VtdWxhdGl2ZUR1cmF0aW9ucyA/Pz0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcltdPigpO1xuICAgIGNvbnN0IGR1cmF0aW9ucyA9IGN1bXVsYXRpdmVEdXJhdGlvbnMuZ2V0KG5hbWUpID8/IFtdO1xuICAgIGR1cmF0aW9ucy5wdXNoKGR1cmF0aW9uKTtcbiAgICBjdW11bGF0aXZlRHVyYXRpb25zLnNldChuYW1lLCBkdXJhdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coYERVUkFUSU9OWyR7bmFtZX1dOiAke2R1cmF0aW9uLnRvRml4ZWQoOSl9c2ApO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9maWxlQXN5bmM8VD4oXG4gIG5hbWU6IHN0cmluZyxcbiAgYWN0aW9uOiAoKSA9PiBQcm9taXNlPFQ+LFxuICBjdW11bGF0aXZlPzogYm9vbGVhbixcbik6IFByb21pc2U8VD4ge1xuICBpZiAoIWRlYnVnUGVyZm9ybWFuY2UpIHtcbiAgICByZXR1cm4gYWN0aW9uKCk7XG4gIH1cblxuICBjb25zdCBzdGFydFRpbWUgPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgYWN0aW9uKCk7XG4gIH0gZmluYWxseSB7XG4gICAgcmVjb3JkRHVyYXRpb24obmFtZSwgc3RhcnRUaW1lLCBjdW11bGF0aXZlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvZmlsZVN5bmM8VD4obmFtZTogc3RyaW5nLCBhY3Rpb246ICgpID0+IFQsIGN1bXVsYXRpdmU/OiBib29sZWFuKTogVCB7XG4gIGlmICghZGVidWdQZXJmb3JtYW5jZSkge1xuICAgIHJldHVybiBhY3Rpb24oKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXJ0VGltZSA9IHByb2Nlc3MuaHJ0aW1lLmJpZ2ludCgpO1xuICB0cnkge1xuICAgIHJldHVybiBhY3Rpb24oKTtcbiAgfSBmaW5hbGx5IHtcbiAgICByZWNvcmREdXJhdGlvbihuYW1lLCBzdGFydFRpbWUsIGN1bXVsYXRpdmUpO1xuICB9XG59XG4iXX0=
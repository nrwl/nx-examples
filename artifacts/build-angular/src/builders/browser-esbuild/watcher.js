"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWatcher = exports.ChangedFiles = void 0;
const chokidar_1 = require("chokidar");
class ChangedFiles {
    constructor() {
        this.added = new Set();
        this.modified = new Set();
        this.removed = new Set();
    }
    toDebugString() {
        const content = {
            added: Array.from(this.added),
            modified: Array.from(this.modified),
            removed: Array.from(this.removed),
        };
        return JSON.stringify(content, null, 2);
    }
}
exports.ChangedFiles = ChangedFiles;
function createWatcher(options) {
    const watcher = new chokidar_1.FSWatcher({
        ...options,
        disableGlobbing: true,
        ignoreInitial: true,
    });
    const nextQueue = [];
    let currentChanges;
    let nextWaitTimeout;
    watcher.on('all', (event, path) => {
        switch (event) {
            case 'add':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.added.add(path);
                break;
            case 'change':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.modified.add(path);
                break;
            case 'unlink':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.removed.add(path);
                break;
            default:
                return;
        }
        // Wait 250ms from next change to better capture groups of file save operations.
        if (!nextWaitTimeout) {
            nextWaitTimeout = setTimeout(() => {
                nextWaitTimeout = undefined;
                const next = nextQueue.shift();
                if (next) {
                    const value = currentChanges;
                    currentChanges = undefined;
                    next(value);
                }
            }, 250);
            nextWaitTimeout?.unref();
        }
    });
    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        async next() {
            if (currentChanges && nextQueue.length === 0) {
                const result = { value: currentChanges };
                currentChanges = undefined;
                return result;
            }
            return new Promise((resolve) => {
                nextQueue.push((value) => resolve(value ? { value } : { done: true, value }));
            });
        },
        add(paths) {
            watcher.add(paths);
        },
        remove(paths) {
            watcher.unwatch(paths);
        },
        async close() {
            try {
                await watcher.close();
                if (nextWaitTimeout) {
                    clearTimeout(nextWaitTimeout);
                }
            }
            finally {
                let next;
                while ((next = nextQueue.shift()) !== undefined) {
                    next();
                }
            }
        },
    };
}
exports.createWatcher = createWatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC93YXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHVDQUFxQztBQUVyQyxNQUFhLFlBQVk7SUFBekI7UUFDVyxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUMxQixhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM3QixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQVd2QyxDQUFDO0lBVEMsYUFBYTtRQUNYLE1BQU0sT0FBTyxHQUFHO1lBQ2QsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM3QixRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ25DLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDbEMsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQWRELG9DQWNDO0FBUUQsU0FBZ0IsYUFBYSxDQUFDLE9BSTdCO0lBQ0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxvQkFBUyxDQUFDO1FBQzVCLEdBQUcsT0FBTztRQUNWLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGFBQWEsRUFBRSxJQUFJO0tBQ3BCLENBQUMsQ0FBQztJQUVILE1BQU0sU0FBUyxHQUF1QyxFQUFFLENBQUM7SUFDekQsSUFBSSxjQUF3QyxDQUFDO0lBQzdDLElBQUksZUFBMkMsQ0FBQztJQUVoRCxPQUFPLENBQUMsRUFBRSxDQUFDLEtB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IFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEZTV2F0Y2hlciB9IGZyb20gJ2Nob2tpZGFyJztcblxuZXhwb3J0IGNsYXNzIENoYW5nZWRGaWxlcyB7XG4gIHJlYWRvbmx5IGFkZGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJlYWRvbmx5IG1vZGlmaWVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJlYWRvbmx5IHJlbW92ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICB0b0RlYnVnU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgY29uc3QgY29udGVudCA9IHtcbiAgICAgIGFkZGVkOiBBcnJheS5mcm9tKHRoaXMuYWRkZWQpLFxuICAgICAgbW9kaWZpZWQ6IEFycmF5LmZyb20odGhpcy5tb2RpZmllZCksXG4gICAgICByZW1vdmVkOiBBcnJheS5mcm9tKHRoaXMucmVtb3ZlZCksXG4gICAgfTtcblxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShjb250ZW50LCBudWxsLCAyKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkV2F0Y2hlciBleHRlbmRzIEFzeW5jSXRlcmFibGVJdGVyYXRvcjxDaGFuZ2VkRmlsZXM+IHtcbiAgYWRkKHBhdGhzOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQ7XG4gIHJlbW92ZShwYXRoczogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkO1xuICBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV2F0Y2hlcihvcHRpb25zPzoge1xuICBwb2xsaW5nPzogYm9vbGVhbjtcbiAgaW50ZXJ2YWw/OiBudW1iZXI7XG4gIGlnbm9yZWQ/OiBzdHJpbmdbXTtcbn0pOiBCdWlsZFdhdGNoZXIge1xuICBjb25zdCB3YXRjaGVyID0gbmV3IEZTV2F0Y2hlcih7XG4gICAgLi4ub3B0aW9ucyxcbiAgICBkaXNhYmxlR2xvYmJpbmc6IHRydWUsXG4gICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgfSk7XG5cbiAgY29uc3QgbmV4dFF1ZXVlOiAoKHZhbHVlPzogQ2hhbmdlZEZpbGVzKSA9PiB2b2lkKVtdID0gW107XG4gIGxldCBjdXJyZW50Q2hhbmdlczogQ2hhbmdlZEZpbGVzIHwgdW5kZWZpbmVkO1xuICBsZXQgbmV4dFdhaXRUaW1lb3V0OiBOb2RlSlMuVGltZW91dCB8IHVuZGVmaW5lZDtcblxuICB3YXRjaGVyLm9uKCdhbGwnLCAoZXZlbnQsIHBhdGgpID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50KSB7XG4gICAgICBjYXNlICdhZGQnOlxuICAgICAgICBjdXJyZW50Q2hhbmdlcyA/Pz0gbmV3IENoYW5nZWRGaWxlcygpO1xuICAgICAgICBjdXJyZW50Q2hhbmdlcy5hZGRlZC5hZGQocGF0aCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY2hhbmdlJzpcbiAgICAgICAgY3VycmVudENoYW5nZXMgPz89IG5ldyBDaGFuZ2VkRmlsZXMoKTtcbiAgICAgICAgY3VycmVudENoYW5nZXMubW9kaWZpZWQuYWRkKHBhdGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VubGluayc6XG4gICAgICAgIGN1cnJlbnRDaGFuZ2VzID8/PSBuZXcgQ2hhbmdlZEZpbGVzKCk7XG4gICAgICAgIGN1cnJlbnRDaGFuZ2VzLnJlbW92ZWQuYWRkKHBhdGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXYWl0IDI1MG1zIGZyb20gbmV4dCBjaGFuZ2UgdG8gYmV0dGVyIGNhcHR1cmUgZ3JvdXBzIG9mIGZpbGUgc2F2ZSBvcGVyYXRpb25zLlxuICAgIGlmICghbmV4dFdhaXRUaW1lb3V0KSB7XG4gICAgICBuZXh0V2FpdFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgbmV4dFdhaXRUaW1lb3V0ID0gdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBuZXh0ID0gbmV4dFF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Q2hhbmdlcztcbiAgICAgICAgICBjdXJyZW50Q2hhbmdlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBuZXh0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSwgMjUwKTtcbiAgICAgIG5leHRXYWl0VGltZW91dD8udW5yZWYoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBhc3luYyBuZXh0KCkge1xuICAgICAgaWYgKGN1cnJlbnRDaGFuZ2VzICYmIG5leHRRdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyB2YWx1ZTogY3VycmVudENoYW5nZXMgfTtcbiAgICAgICAgY3VycmVudENoYW5nZXMgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIG5leHRRdWV1ZS5wdXNoKCh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSA/IHsgdmFsdWUgfSA6IHsgZG9uZTogdHJ1ZSwgdmFsdWUgfSkpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFkZChwYXRocykge1xuICAgICAgd2F0Y2hlci5hZGQocGF0aHMpO1xuICAgIH0sXG5cbiAgICByZW1vdmUocGF0aHMpIHtcbiAgICAgIHdhdGNoZXIudW53YXRjaChwYXRocyk7XG4gICAgfSxcblxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgd2F0Y2hlci5jbG9zZSgpO1xuICAgICAgICBpZiAobmV4dFdhaXRUaW1lb3V0KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KG5leHRXYWl0VGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGxldCBuZXh0O1xuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0UXVldWUuc2hpZnQoKSkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gIH07XG59XG4iXX0=
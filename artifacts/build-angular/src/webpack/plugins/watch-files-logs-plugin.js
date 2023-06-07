"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchFilesLogsPlugin = void 0;
const PLUGIN_NAME = 'angular.watch-files-logs-plugin';
class WatchFilesLogsPlugin {
    apply(compiler) {
        compiler.hooks.watchRun.tap(PLUGIN_NAME, ({ modifiedFiles, removedFiles }) => {
            compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
                const logger = compilation.getLogger(PLUGIN_NAME);
                if (modifiedFiles?.size) {
                    logger.log(`Modified files:\n${[...modifiedFiles].join('\n')}\n`);
                }
                if (removedFiles?.size) {
                    logger.log(`Removed files:\n${[...removedFiles].join('\n')}\n`);
                }
            });
        });
    }
}
exports.WatchFilesLogsPlugin = WatchFilesLogsPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2gtZmlsZXMtbG9ncy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMvd2F0Y2gtZmlsZXMtbG9ncy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUgsTUFBTSxXQUFXLEdBQUcsaUNBQWlDLENBQUM7QUFFdEQsTUFBYSxvQkFBb0I7SUFDL0IsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFO1lBQzNFLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDMUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxhQUFhLEVBQUUsSUFBSSxFQUFFO29CQUN2QixNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDbkU7Z0JBRUQsSUFBSSxZQUFZLEVBQUUsSUFBSSxFQUFFO29CQUN0QixNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakU7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBZkQsb0RBZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuXG5jb25zdCBQTFVHSU5fTkFNRSA9ICdhbmd1bGFyLndhdGNoLWZpbGVzLWxvZ3MtcGx1Z2luJztcblxuZXhwb3J0IGNsYXNzIFdhdGNoRmlsZXNMb2dzUGx1Z2luIHtcbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29tcGlsZXIuaG9va3Mud2F0Y2hSdW4udGFwKFBMVUdJTl9OQU1FLCAoeyBtb2RpZmllZEZpbGVzLCByZW1vdmVkRmlsZXMgfSkgPT4ge1xuICAgICAgY29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgICAgY29uc3QgbG9nZ2VyID0gY29tcGlsYXRpb24uZ2V0TG9nZ2VyKFBMVUdJTl9OQU1FKTtcbiAgICAgICAgaWYgKG1vZGlmaWVkRmlsZXM/LnNpemUpIHtcbiAgICAgICAgICBsb2dnZXIubG9nKGBNb2RpZmllZCBmaWxlczpcXG4ke1suLi5tb2RpZmllZEZpbGVzXS5qb2luKCdcXG4nKX1cXG5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZW1vdmVkRmlsZXM/LnNpemUpIHtcbiAgICAgICAgICBsb2dnZXIubG9nKGBSZW1vdmVkIGZpbGVzOlxcbiR7Wy4uLnJlbW92ZWRGaWxlc10uam9pbignXFxuJyl9XFxuYCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
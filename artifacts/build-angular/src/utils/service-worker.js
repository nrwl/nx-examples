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
exports.augmentAppWithServiceWorkerCore = exports.augmentAppWithServiceWorkerEsbuild = exports.augmentAppWithServiceWorker = void 0;
const crypto = __importStar(require("crypto"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("path"));
const error_1 = require("./error");
const load_esm_1 = require("./load-esm");
class CliFilesystem {
    constructor(fs, base) {
        this.fs = fs;
        this.base = base;
    }
    list(dir) {
        return this._recursiveList(this._resolve(dir), []);
    }
    read(file) {
        return this.fs.readFile(this._resolve(file), 'utf-8');
    }
    async hash(file) {
        return crypto
            .createHash('sha1')
            .update(await this.fs.readFile(this._resolve(file)))
            .digest('hex');
    }
    write(_file, _content) {
        throw new Error('This should never happen.');
    }
    _resolve(file) {
        return path.join(this.base, file);
    }
    async _recursiveList(dir, items) {
        const subdirectories = [];
        for (const entry of await this.fs.readdir(dir)) {
            const entryPath = path.join(dir, entry);
            const stats = await this.fs.stat(entryPath);
            if (stats.isFile()) {
                // Uses posix paths since the service worker expects URLs
                items.push('/' + path.relative(this.base, entryPath).replace(/\\/g, '/'));
            }
            else if (stats.isDirectory()) {
                subdirectories.push(entryPath);
            }
        }
        for (const subdirectory of subdirectories) {
            await this._recursiveList(subdirectory, items);
        }
        return items;
    }
}
class ResultFilesystem {
    constructor(outputFiles, assetFiles) {
        this.fileReaders = new Map();
        for (const file of outputFiles) {
            this.fileReaders.set('/' + file.path.replace(/\\/g, '/'), async () => file.text);
        }
        for (const file of assetFiles) {
            this.fileReaders.set('/' + file.destination.replace(/\\/g, '/'), () => node_fs_1.promises.readFile(file.source, 'utf-8'));
        }
    }
    async list(dir) {
        if (dir !== '/') {
            throw new Error('Serviceworker manifest generator should only list files from root.');
        }
        return [...this.fileReaders.keys()];
    }
    read(file) {
        const reader = this.fileReaders.get(file);
        if (reader === undefined) {
            throw new Error('File does not exist.');
        }
        return reader();
    }
    async hash(file) {
        return crypto
            .createHash('sha1')
            .update(await this.read(file))
            .digest('hex');
    }
    write() {
        throw new Error('Serviceworker manifest generator should not attempted to write.');
    }
}
async function augmentAppWithServiceWorker(appRoot, workspaceRoot, outputPath, baseHref, ngswConfigPath, inputputFileSystem = node_fs_1.promises, outputFileSystem = node_fs_1.promises) {
    // Determine the configuration file path
    const configPath = ngswConfigPath
        ? path.join(workspaceRoot, ngswConfigPath)
        : path.join(appRoot, 'ngsw-config.json');
    // Read the configuration file
    let config;
    try {
        const configurationData = await inputputFileSystem.readFile(configPath, 'utf-8');
        config = JSON.parse(configurationData);
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        if (error.code === 'ENOENT') {
            throw new Error('Error: Expected to find an ngsw-config.json configuration file' +
                ` in the ${appRoot} folder. Either provide one or` +
                ' disable Service Worker in the angular.json configuration file.');
        }
        else {
            throw error;
        }
    }
    const result = await augmentAppWithServiceWorkerCore(config, new CliFilesystem(outputFileSystem, outputPath), baseHref);
    const copy = async (src, dest) => {
        const resolvedDest = path.join(outputPath, dest);
        return inputputFileSystem === outputFileSystem
            ? // Native FS (Builder).
                inputputFileSystem.copyFile(src, resolvedDest, node_fs_1.constants.COPYFILE_FICLONE)
            : // memfs (Webpack): Read the file from the input FS (disk) and write it to the output FS (memory).
                outputFileSystem.writeFile(resolvedDest, await inputputFileSystem.readFile(src));
    };
    await outputFileSystem.writeFile(path.join(outputPath, 'ngsw.json'), result.manifest);
    for (const { source, destination } of result.assetFiles) {
        await copy(source, destination);
    }
}
exports.augmentAppWithServiceWorker = augmentAppWithServiceWorker;
// This is currently used by the esbuild-based builder
async function augmentAppWithServiceWorkerEsbuild(workspaceRoot, configPath, baseHref, outputFiles, assetFiles) {
    // Read the configuration file
    let config;
    try {
        const configurationData = await node_fs_1.promises.readFile(configPath, 'utf-8');
        config = JSON.parse(configurationData);
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        if (error.code === 'ENOENT') {
            // TODO: Generate an error object that can be consumed by the esbuild-based builder
            const message = `Service worker configuration file "${path.relative(workspaceRoot, configPath)}" could not be found.`;
            throw new Error(message);
        }
        else {
            throw error;
        }
    }
    return augmentAppWithServiceWorkerCore(config, new ResultFilesystem(outputFiles, assetFiles), baseHref);
}
exports.augmentAppWithServiceWorkerEsbuild = augmentAppWithServiceWorkerEsbuild;
async function augmentAppWithServiceWorkerCore(config, serviceWorkerFilesystem, baseHref) {
    // Load ESM `@angular/service-worker/config` using the TypeScript dynamic import workaround.
    // Once TypeScript provides support for keeping the dynamic import this workaround can be
    // changed to a direct dynamic import.
    const GeneratorConstructor = (await (0, load_esm_1.loadEsmModule)('@angular/service-worker/config')).Generator;
    // Generate the manifest
    const generator = new GeneratorConstructor(serviceWorkerFilesystem, baseHref);
    const output = await generator.process(config);
    // Write the manifest
    const manifest = JSON.stringify(output, null, 2);
    // Find the service worker package
    const workerPath = require.resolve('@angular/service-worker/ngsw-worker.js');
    const result = {
        manifest,
        // Main worker code
        assetFiles: [{ source: workerPath, destination: 'ngsw-worker.js' }],
    };
    // If present, write the safety worker code
    const safetyPath = path.join(path.dirname(workerPath), 'safety-worker.js');
    if ((0, node_fs_1.existsSync)(safetyPath)) {
        result.assetFiles.push({ source: safetyPath, destination: 'worker-basic.min.js' });
        result.assetFiles.push({ source: safetyPath, destination: 'safety-worker.js' });
    }
    return result;
}
exports.augmentAppWithServiceWorkerCore = augmentAppWithServiceWorkerCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9zZXJ2aWNlLXdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILCtDQUFpQztBQUVqQyxxQ0FBdUY7QUFDdkYsMkNBQTZCO0FBQzdCLG1DQUF3QztBQUN4Qyx5Q0FBMkM7QUFFM0MsTUFBTSxhQUFhO0lBQ2pCLFlBQW9CLEVBQXFCLEVBQVUsSUFBWTtRQUEzQyxPQUFFLEdBQUYsRUFBRSxDQUFtQjtRQUFVLFNBQUksR0FBSixJQUFJLENBQVE7SUFBRyxDQUFDO0lBRW5FLElBQUksQ0FBQyxHQUFXO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVk7UUFDckIsT0FBTyxNQUFNO2FBQ1YsVUFBVSxDQUFDLE1BQU0sQ0FBQzthQUNsQixNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBYSxFQUFFLFFBQWdCO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMs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Q1IsbUJBQW1CO1FBQ25CLFVBQVUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztLQUNwRSxDQUFDO0lBRUYsMkNBQTJDO0lBQzNDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNFLElBQUksSUFBQSxvQkFBVSxFQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQXRDRCwwRUFzQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBDb25maWcsIEZpbGVzeXN0ZW0gfSBmcm9tICdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9jb25maWcnO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgdHlwZSB7IE91dHB1dEZpbGUgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIGNvbnN0YW50cyBhcyBmc0NvbnN0YW50cywgcHJvbWlzZXMgYXMgZnNQcm9taXNlcyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuL2xvYWQtZXNtJztcblxuY2xhc3MgQ2xpRmlsZXN5c3RlbSBpbXBsZW1lbnRzIEZpbGVzeXN0ZW0ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZzOiB0eXBlb2YgZnNQcm9taXNlcywgcHJpdmF0ZSBiYXNlOiBzdHJpbmcpIHt9XG5cbiAgbGlzdChkaXI6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gdGhpcy5fcmVjdXJzaXZlTGlzdCh0aGlzLl9yZXNvbHZlKGRpciksIFtdKTtcbiAgfVxuXG4gIHJlYWQoZmlsZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5mcy5yZWFkRmlsZSh0aGlzLl9yZXNvbHZlKGZpbGUpLCAndXRmLTgnKTtcbiAgfVxuXG4gIGFzeW5jIGhhc2goZmlsZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gY3J5cHRvXG4gICAgICAuY3JlYXRlSGFzaCgnc2hhMScpXG4gICAgICAudXBkYXRlKGF3YWl0IHRoaXMuZnMucmVhZEZpbGUodGhpcy5fcmVzb2x2ZShmaWxlKSkpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcbiAgfVxuXG4gIHdyaXRlKF9maWxlOiBzdHJpbmcsIF9jb250ZW50OiBzdHJpbmcpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uJyk7XG4gIH1cblxuICBwcml2YXRlIF9yZXNvbHZlKGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguam9pbih0aGlzLmJhc2UsIGZpbGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfcmVjdXJzaXZlTGlzdChkaXI6IHN0cmluZywgaXRlbXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHN1YmRpcmVjdG9yaWVzID0gW107XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBhd2FpdCB0aGlzLmZzLnJlYWRkaXIoZGlyKSkge1xuICAgICAgY29uc3QgZW50cnlQYXRoID0gcGF0aC5qb2luKGRpciwgZW50cnkpO1xuICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCB0aGlzLmZzLnN0YXQoZW50cnlQYXRoKTtcblxuICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgIC8vIFVzZXMgcG9zaXggcGF0aHMgc2luY2UgdGhlIHNlcnZpY2Ugd29ya2VyIGV4cGVjdHMgVVJMc1xuICAgICAgICBpdGVtcy5wdXNoKCcvJyArIHBhdGgucmVsYXRpdmUodGhpcy5iYXNlLCBlbnRyeVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKSk7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgc3ViZGlyZWN0b3JpZXMucHVzaChlbnRyeVBhdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc3ViZGlyZWN0b3J5IG9mIHN1YmRpcmVjdG9yaWVzKSB7XG4gICAgICBhd2FpdCB0aGlzLl9yZWN1cnNpdmVMaXN0KHN1YmRpcmVjdG9yeSwgaXRlbXMpO1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtcztcbiAgfVxufVxuXG5jbGFzcyBSZXN1bHRGaWxlc3lzdGVtIGltcGxlbWVudHMgRmlsZXN5c3RlbSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZmlsZVJlYWRlcnMgPSBuZXcgTWFwPHN0cmluZywgKCkgPT4gUHJvbWlzZTxzdHJpbmc+PigpO1xuXG4gIGNvbnN0cnVjdG9yKG91dHB1dEZpbGVzOiBPdXRwdXRGaWxlW10sIGFzc2V0RmlsZXM6IHsgc291cmNlOiBzdHJpbmc7IGRlc3RpbmF0aW9uOiBzdHJpbmcgfVtdKSB7XG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG91dHB1dEZpbGVzKSB7XG4gICAgICB0aGlzLmZpbGVSZWFkZXJzLnNldCgnLycgKyBmaWxlLnBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpLCBhc3luYyAoKSA9PiBmaWxlLnRleHQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgYXNzZXRGaWxlcykge1xuICAgICAgdGhpcy5maWxlUmVhZGVycy5zZXQoJy8nICsgZmlsZS5kZXN0aW5hdGlvbi5yZXBsYWNlKC9cXFxcL2csICcvJyksICgpID0+XG4gICAgICAgIGZzUHJvbWlzZXMucmVhZEZpbGUoZmlsZS5zb3VyY2UsICd1dGYtOCcpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsaXN0KGRpcjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmIChkaXIgIT09ICcvJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXJ2aWNld29ya2VyIG1hbmlmZXN0IGdlbmVyYXRvciBzaG91bGQgb25seSBsaXN0IGZpbGVzIGZyb20gcm9vdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnRoaXMuZmlsZVJlYWRlcnMua2V5cygpXTtcbiAgfVxuXG4gIHJlYWQoZmlsZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZWFkZXIgPSB0aGlzLmZpbGVSZWFkZXJzLmdldChmaWxlKTtcbiAgICBpZiAocmVhZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmlsZSBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhZGVyKCk7XG4gIH1cblxuICBhc3luYyBoYXNoKGZpbGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGNyeXB0b1xuICAgICAgLmNyZWF0ZUhhc2goJ3NoYTEnKVxuICAgICAgLnVwZGF0ZShhd2FpdCB0aGlzLnJlYWQoZmlsZSkpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcbiAgfVxuXG4gIHdyaXRlKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcnZpY2V3b3JrZXIgbWFuaWZlc3QgZ2VuZXJhdG9yIHNob3VsZCBub3QgYXR0ZW1wdGVkIHRvIHdyaXRlLicpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXIoXG4gIGFwcFJvb3Q6IHN0cmluZyxcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICBvdXRwdXRQYXRoOiBzdHJpbmcsXG4gIGJhc2VIcmVmOiBzdHJpbmcsXG4gIG5nc3dDb25maWdQYXRoPzogc3RyaW5nLFxuICBpbnB1dHB1dEZpbGVTeXN0ZW0gPSBmc1Byb21pc2VzLFxuICBvdXRwdXRGaWxlU3lzdGVtID0gZnNQcm9taXNlcyxcbik6IFByb21pc2U8dm9pZD4ge1xuICAvLyBEZXRlcm1pbmUgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZSBwYXRoXG4gIGNvbnN0IGNvbmZpZ1BhdGggPSBuZ3N3Q29uZmlnUGF0aFxuICAgID8gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIG5nc3dDb25maWdQYXRoKVxuICAgIDogcGF0aC5qb2luKGFwcFJvb3QsICduZ3N3LWNvbmZpZy5qc29uJyk7XG5cbiAgLy8gUmVhZCB0aGUgY29uZmlndXJhdGlvbiBmaWxlXG4gIGxldCBjb25maWc6IENvbmZpZyB8IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWd1cmF0aW9uRGF0YSA9IGF3YWl0IGlucHV0cHV0RmlsZVN5c3RlbS5yZWFkRmlsZShjb25maWdQYXRoLCAndXRmLTgnKTtcbiAgICBjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ3VyYXRpb25EYXRhKSBhcyBDb25maWc7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlcnJvcik7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdFcnJvcjogRXhwZWN0ZWQgdG8gZmluZCBhbiBuZ3N3LWNvbmZpZy5qc29uIGNvbmZpZ3VyYXRpb24gZmlsZScgK1xuICAgICAgICAgIGAgaW4gdGhlICR7YXBwUm9vdH0gZm9sZGVyLiBFaXRoZXIgcHJvdmlkZSBvbmUgb3JgICtcbiAgICAgICAgICAnIGRpc2FibGUgU2VydmljZSBXb3JrZXIgaW4gdGhlIGFuZ3VsYXIuanNvbiBjb25maWd1cmF0aW9uIGZpbGUuJyxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlckNvcmUoXG4gICAgY29uZmlnLFxuICAgIG5ldyBDbGlGaWxlc3lzdGVtKG91dHB1dEZpbGVTeXN0ZW0sIG91dHB1dFBhdGgpLFxuICAgIGJhc2VIcmVmLFxuICApO1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkRGVzdCA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBkZXN0KTtcblxuICAgIHJldHVybiBpbnB1dHB1dEZpbGVTeXN0ZW0gPT09IG91dHB1dEZpbGVTeXN0ZW1cbiAgICAgID8gLy8gTmF0aXZlIEZTIChCdWlsZGVyKS5cbiAgICAgICAgaW5wdXRwdXRGaWxlU3lzdGVtLmNvcHlGaWxlKHNyYywgcmVzb2x2ZWREZXN0LCBmc0NvbnN0YW50cy5DT1BZRklMRV9GSUNMT05FKVxuICAgICAgOiAvLyBtZW1mcyAoV2VicGFjayk6IFJlYWQgdGhlIGZpbGUgZnJvbSB0aGUgaW5wdXQgRlMgKGRpc2spIGFuZCB3cml0ZSBpdCB0byB0aGUgb3V0cHV0IEZTIChtZW1vcnkpLlxuICAgICAgICBvdXRwdXRGaWxlU3lzdGVtLndyaXRlRmlsZShyZXNvbHZlZERlc3QsIGF3YWl0IGlucHV0cHV0RmlsZVN5c3RlbS5yZWFkRmlsZShzcmMpKTtcbiAgfTtcblxuICBhd2FpdCBvdXRwdXRGaWxlU3lzdGVtLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0UGF0aCwgJ25nc3cuanNvbicpLCByZXN1bHQubWFuaWZlc3QpO1xuXG4gIGZvciAoY29uc3QgeyBzb3VyY2UsIGRlc3RpbmF0aW9uIH0gb2YgcmVzdWx0LmFzc2V0RmlsZXMpIHtcbiAgICBhd2FpdCBjb3B5KHNvdXJjZSwgZGVzdGluYXRpb24pO1xuICB9XG59XG5cbi8vIFRoaXMgaXMgY3VycmVudGx5IHVzZWQgYnkgdGhlIGVzYnVpbGQtYmFzZWQgYnVpbGRlclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlckVzYnVpbGQoXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgY29uZmlnUGF0aDogc3RyaW5nLFxuICBiYXNlSHJlZjogc3RyaW5nLFxuICBvdXRwdXRGaWxlczogT3V0cHV0RmlsZVtdLFxuICBhc3NldEZpbGVzOiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXSxcbik6IFByb21pc2U8eyBtYW5pZmVzdDogc3RyaW5nOyBhc3NldEZpbGVzOiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXSB9PiB7XG4gIC8vIFJlYWQgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZVxuICBsZXQgY29uZmlnOiBDb25maWcgfCB1bmRlZmluZWQ7XG4gIHRyeSB7XG4gICAgY29uc3QgY29uZmlndXJhdGlvbkRhdGEgPSBhd2FpdCBmc1Byb21pc2VzLnJlYWRGaWxlKGNvbmZpZ1BhdGgsICd1dGYtOCcpO1xuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlndXJhdGlvbkRhdGEpIGFzIENvbmZpZztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIC8vIFRPRE86IEdlbmVyYXRlIGFuIGVycm9yIG9iamVjdCB0aGF0IGNhbiBiZSBjb25zdW1lZCBieSB0aGUgZXNidWlsZC1iYXNlZCBidWlsZGVyXG4gICAgICBjb25zdCBtZXNzYWdlID0gYFNlcnZpY2Ugd29ya2VyIGNvbmZpZ3VyYXRpb24gZmlsZSBcIiR7cGF0aC5yZWxhdGl2ZShcbiAgICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgICAgY29uZmlnUGF0aCxcbiAgICAgICl9XCIgY291bGQgbm90IGJlIGZvdW5kLmA7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXJDb3JlKFxuICAgIGNvbmZpZyxcbiAgICBuZXcgUmVzdWx0RmlsZXN5c3RlbShvdXRwdXRGaWxlcywgYXNzZXRGaWxlcyksXG4gICAgYmFzZUhyZWYsXG4gICk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXJDb3JlKFxuICBjb25maWc6IENvbmZpZyxcbiAgc2VydmljZVdvcmtlckZpbGVzeXN0ZW06IEZpbGVzeXN0ZW0sXG4gIGJhc2VIcmVmOiBzdHJpbmcsXG4pOiBQcm9taXNlPHsgbWFuaWZlc3Q6IHN0cmluZzsgYXNzZXRGaWxlczogeyBzb3VyY2U6IHN0cmluZzsgZGVzdGluYXRpb246IHN0cmluZyB9W10gfT4ge1xuICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvc2VydmljZS13b3JrZXIvY29uZmlnYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICBjb25zdCBHZW5lcmF0b3JDb25zdHJ1Y3RvciA9IChcbiAgICBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL3NlcnZpY2Utd29ya2VyL2NvbmZpZycpPihcbiAgICAgICdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9jb25maWcnLFxuICAgIClcbiAgKS5HZW5lcmF0b3I7XG5cbiAgLy8gR2VuZXJhdGUgdGhlIG1hbmlmZXN0XG4gIGNvbnN0IGdlbmVyYXRvciA9IG5ldyBHZW5lcmF0b3JDb25zdHJ1Y3RvcihzZXJ2aWNlV29ya2VyRmlsZXN5c3RlbSwgYmFzZUhyZWYpO1xuICBjb25zdCBvdXRwdXQgPSBhd2FpdCBnZW5lcmF0b3IucHJvY2Vzcyhjb25maWcpO1xuXG4gIC8vIFdyaXRlIHRoZSBtYW5pZmVzdFxuICBjb25zdCBtYW5pZmVzdCA9IEpTT04uc3RyaW5naWZ5KG91dHB1dCwgbnVsbCwgMik7XG5cbiAgLy8gRmluZCB0aGUgc2VydmljZSB3b3JrZXIgcGFja2FnZVxuICBjb25zdCB3b3JrZXJQYXRoID0gcmVxdWlyZS5yZXNvbHZlKCdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9uZ3N3LXdvcmtlci5qcycpO1xuXG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBtYW5pZmVzdCxcbiAgICAvLyBNYWluIHdvcmtlciBjb2RlXG4gICAgYXNzZXRGaWxlczogW3sgc291cmNlOiB3b3JrZXJQYXRoLCBkZXN0aW5hdGlvbjogJ25nc3ctd29ya2VyLmpzJyB9XSxcbiAgfTtcblxuICAvLyBJZiBwcmVzZW50LCB3cml0ZSB0aGUgc2FmZXR5IHdvcmtlciBjb2RlXG4gIGNvbnN0IHNhZmV0eVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHdvcmtlclBhdGgpLCAnc2FmZXR5LXdvcmtlci5qcycpO1xuICBpZiAoZXhpc3RzU3luYyhzYWZldHlQYXRoKSkge1xuICAgIHJlc3VsdC5hc3NldEZpbGVzLnB1c2goeyBzb3VyY2U6IHNhZmV0eVBhdGgsIGRlc3RpbmF0aW9uOiAnd29ya2VyLWJhc2ljLm1pbi5qcycgfSk7XG4gICAgcmVzdWx0LmFzc2V0RmlsZXMucHVzaCh7IHNvdXJjZTogc2FmZXR5UGF0aCwgZGVzdGluYXRpb246ICdzYWZldHktd29ya2VyLmpzJyB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=
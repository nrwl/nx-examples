/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RawSourceMap } from '@ampproject/remapping';
import type { FileImporter, Importer, ImporterResult } from 'sass';
/**
 * A preprocessed cache entry for the files and directories within a previously searched
 * directory when performing Sass import resolution.
 */
export interface DirectoryEntry {
    files: Set<string>;
    directories: Set<string>;
}
/**
 * A Sass Importer base class that provides the load logic to rebase all `url()` functions
 * within a stylesheet. The rebasing will ensure that the URLs in the output of the Sass compiler
 * reflect the final filesystem location of the output CSS file.
 *
 * This class provides the core of the rebasing functionality. To ensure that each file is processed
 * by this importer's load implementation, the Sass compiler requires the importer's canonicalize
 * function to return a non-null value with the resolved location of the requested stylesheet.
 * Concrete implementations of this class must provide this canonicalize functionality for rebasing
 * to be effective.
 */
declare abstract class UrlRebasingImporter implements Importer<'sync'> {
    private entryDirectory;
    private rebaseSourceMaps?;
    /**
     * @param entryDirectory The directory of the entry stylesheet that was passed to the Sass compiler.
     * @param rebaseSourceMaps When provided, rebased files will have an intermediate sourcemap added to the Map
     * which can be used to generate a final sourcemap that contains original sources.
     */
    constructor(entryDirectory: string, rebaseSourceMaps?: Map<string, RawSourceMap> | undefined);
    abstract canonicalize(url: string, options: {
        fromImport: boolean;
    }): URL | null;
    load(canonicalUrl: URL): ImporterResult | null;
}
/**
 * Provides the Sass importer logic to resolve relative stylesheet imports via both import and use rules
 * and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
export declare class RelativeUrlRebasingImporter extends UrlRebasingImporter {
    private directoryCache;
    constructor(entryDirectory: string, directoryCache?: Map<string, DirectoryEntry>, rebaseSourceMaps?: Map<string, RawSourceMap>);
    canonicalize(url: string, options: {
        fromImport: boolean;
    }): URL | null;
    /**
     * Attempts to resolve a provided URL to a stylesheet file using the Sass compiler's resolution algorithm.
     * Based on https://github.com/sass/dart-sass/blob/44d6bb6ac72fe6b93f5bfec371a1fffb18e6b76d/lib/src/importer/utils.dart
     * @param url The file protocol URL to resolve.
     * @param fromImport If true, URL was from an import rule; otherwise from a use rule.
     * @param checkDirectory If true, try checking for a directory with the base name containing an index file.
     * @returns A full resolved URL of the stylesheet file or `null` if not found.
     */
    private resolveImport;
    /**
     * Checks an array of potential stylesheet files to determine if there is a valid
     * stylesheet file. More than one discovered file may indicate an error.
     * @param found An array of discovered stylesheet files.
     * @returns A fully resolved path for a stylesheet file or `null` if not found.
     * @throws If there are ambiguous files discovered.
     */
    private checkFound;
}
/**
 * Provides the Sass importer logic to resolve module (npm package) stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
export declare class ModuleUrlRebasingImporter extends RelativeUrlRebasingImporter {
    private finder;
    constructor(entryDirectory: string, directoryCache: Map<string, DirectoryEntry>, rebaseSourceMaps: Map<string, RawSourceMap> | undefined, finder: FileImporter<'sync'>['findFileUrl']);
    canonicalize(url: string, options: {
        fromImport: boolean;
    }): URL | null;
}
/**
 * Provides the Sass importer logic to resolve load paths located stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
export declare class LoadPathsUrlRebasingImporter extends RelativeUrlRebasingImporter {
    private loadPaths;
    constructor(entryDirectory: string, directoryCache: Map<string, DirectoryEntry>, rebaseSourceMaps: Map<string, RawSourceMap> | undefined, loadPaths: Iterable<string>);
    canonicalize(url: string, options: {
        fromImport: boolean;
    }): URL | null;
}
/**
 * Workaround for Sass not calling instance methods with `this`.
 * The `canonicalize` and `load` methods will be bound to the class instance.
 * @param importer A Sass importer to bind.
 * @returns The bound Sass importer.
 */
export declare function sassBindWorkaround<T extends Importer>(importer: T): T;
export {};

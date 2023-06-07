/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext } from '@angular-devkit/architect';
import { BuildFailure, BuildOptions, Message, Metafile, OutputFile, PartialMessage } from 'esbuild';
import { FileInfo } from '../../utils/index-file/augment-index-html';
export type BundleContextResult = {
    errors: Message[];
    warnings: Message[];
} | {
    errors: undefined;
    warnings: Message[];
    metafile: Metafile;
    outputFiles: OutputFile[];
    initialFiles: FileInfo[];
};
/**
 * Determines if an unknown value is an esbuild BuildFailure error object thrown by esbuild.
 * @param value A potential esbuild BuildFailure error object.
 * @returns `true` if the object is determined to be a BuildFailure object; otherwise, `false`.
 */
export declare function isEsBuildFailure(value: unknown): value is BuildFailure;
export declare class BundlerContext {
    #private;
    private workspaceRoot;
    private incremental;
    constructor(workspaceRoot: string, incremental: boolean, options: BuildOptions);
    static bundleAll(contexts: Iterable<BundlerContext>): Promise<BundleContextResult>;
    /**
     * Executes the esbuild build function and normalizes the build result in the event of a
     * build failure that results in no output being generated.
     * All builds use the `write` option with a value of `false` to allow for the output files
     * build result array to be populated.
     *
     * @returns If output files are generated, the full esbuild BuildResult; if not, the
     * warnings and errors for the attempted build.
     */
    bundle(): Promise<BundleContextResult>;
    /**
     * Disposes incremental build resources present in the context.
     *
     * @returns A promise that resolves when disposal is complete.
     */
    dispose(): Promise<void>;
}
export declare function logMessages(context: BuilderContext, { errors, warnings }: {
    errors?: PartialMessage[];
    warnings?: PartialMessage[];
}): Promise<void>;

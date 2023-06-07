/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type ng from '@angular/compiler-cli';
import type ts from 'typescript';
import type { AngularHostOptions } from './angular-host';
export interface EmitFileResult {
    content?: string;
    map?: string;
    dependencies: readonly string[];
}
export type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;
export declare abstract class AngularCompilation {
    #private;
    static loadCompilerCli(): Promise<typeof ng>;
    protected loadConfiguration(tsconfig: string): Promise<ng.CompilerOptions>;
    abstract initialize(tsconfig: string, hostOptions: AngularHostOptions, compilerOptionsTransformer?: (compilerOptions: ng.CompilerOptions) => ng.CompilerOptions): Promise<{
        affectedFiles: ReadonlySet<ts.SourceFile>;
        compilerOptions: ng.CompilerOptions;
    }>;
    abstract collectDiagnostics(): Iterable<ts.Diagnostic>;
    abstract createFileEmitter(onAfterEmit?: (sourceFile: ts.SourceFile) => void): FileEmitter;
}

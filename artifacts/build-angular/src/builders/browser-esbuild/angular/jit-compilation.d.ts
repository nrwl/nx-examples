/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type ng from '@angular/compiler-cli';
import ts from 'typescript';
import { AngularCompilation, FileEmitter } from './angular-compilation';
import { AngularHostOptions } from './angular-host';
export declare class JitCompilation extends AngularCompilation {
    #private;
    initialize(tsconfig: string, hostOptions: AngularHostOptions, compilerOptionsTransformer?: (compilerOptions: ng.CompilerOptions) => ng.CompilerOptions): Promise<{
        affectedFiles: ReadonlySet<ts.SourceFile>;
        compilerOptions: ng.CompilerOptions;
    }>;
    collectDiagnostics(): Iterable<ts.Diagnostic>;
    createFileEmitter(onAfterEmit?: (sourceFile: ts.SourceFile) => void): FileEmitter;
}

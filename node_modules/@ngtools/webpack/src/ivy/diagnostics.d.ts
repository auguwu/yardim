/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Diagnostics } from '@angular/compiler-cli';
export declare type DiagnosticsReporter = (diagnostics: Diagnostics) => void;
export declare function createDiagnosticsReporter(compilation: import('webpack').compilation.Compilation): DiagnosticsReporter;

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare const AngularPluginSymbol: unique symbol;
export interface EmitFileResult {
    content?: string;
    map?: string;
    dependencies: readonly string[];
}
export declare type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

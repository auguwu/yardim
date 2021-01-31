/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';
export declare class SourceFileCache extends Map<string, ts.SourceFile> {
    invalidate(fileTimestamps: Map<string, number | {
        timestamp: number;
    } | null>, buildTimestamp: number): Set<string>;
}

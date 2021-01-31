/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Compiler } from 'webpack';
export declare type BuilderWatcherCallback = (events: Array<{
    path: string;
    type: 'created' | 'modified' | 'deleted';
    time?: number;
}>) => void;
export interface BuilderWatcherFactory {
    watch(files: Iterable<string>, directories: Iterable<string>, callback: BuilderWatcherCallback): {
        close(): void;
    };
}
export interface WebpackWatcher {
    close(): void;
    pause(): void;
    getFileTimestamps(): Map<string, number>;
    getContextTimestamps(): Map<string, number>;
    getFileTimeInfoEntries(): Map<string, {
        safeTime: number;
        timestamp: number;
    }>;
    getContextTimeInfoEntries(): Map<string, {
        safeTime: number;
        timestamp: number;
    }>;
}
declare type WatchCallback4 = (error: Error | undefined, fileChanges: Set<string>, directoryChanges: Set<string>, missingChanges: Set<string>, files: Map<string, number>, contexts: Map<string, number>, removals: Set<string>) => void;
declare type WatchCallback5 = (error: Error | undefined, files: Map<string, {
    safeTime: number;
    timestamp: number;
}>, contexts: Map<string, {
    safeTime: number;
    timestamp: number;
}>, changes: Set<string>, removals: Set<string>) => void;
export interface WebpackWatchFileSystem {
    watch(files: Iterable<string>, directories: Iterable<string>, missing: Iterable<string>, startTime: number, options: {}, callback: WatchCallback4 | WatchCallback5, callbackUndelayed: (file: string, time: number) => void): WebpackWatcher;
}
export declare class BuilderWatchPlugin {
    private readonly watcherFactory;
    constructor(watcherFactory: BuilderWatcherFactory);
    apply(compiler: Compiler & {
        watchFileSystem: WebpackWatchFileSystem;
    }): void;
}
export {};

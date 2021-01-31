/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Path } from '@angular-devkit/core';
import { Stats } from 'fs';
import { InputFileSystem } from 'webpack';
import { WebpackCompilerHost } from './compiler_host';
import { NodeWatchFileSystemInterface } from './webpack';
export declare const NodeWatchFileSystem: NodeWatchFileSystemInterface;
export declare class VirtualFileSystemDecorator implements InputFileSystem {
    private _inputFileSystem;
    private _webpackCompilerHost;
    constructor(_inputFileSystem: InputFileSystem, _webpackCompilerHost: WebpackCompilerHost);
    getWebpackCompilerHost(): WebpackCompilerHost;
    getVirtualFilesPaths(): string[];
    stat(path: string, callback: (err: Error, result: Stats) => void): void;
    readdir(path: string, callback: (err: Error, result: string[]) => void): void;
    readFile(path: string, callback: (err: Error, contents: Buffer) => void): void;
    readJson(path: string, callback: (err: Error, result: unknown) => void): void;
    readlink(path: string, callback: (err: Error | null | undefined, linkString: string) => void): void;
    statSync(path: string): Stats;
    readdirSync(path: string): string[];
    readFileSync(path: string): Buffer;
    readJsonSync(path: string): string;
    readlinkSync(path: string): string;
    purge(changes?: string[] | string): void;
}
export declare class VirtualWatchFileSystemDecorator extends NodeWatchFileSystem {
    private _virtualInputFileSystem;
    private _replacements?;
    constructor(_virtualInputFileSystem: VirtualFileSystemDecorator, _replacements?: Map<Path, Path> | ((path: Path) => Path) | undefined);
    mapReplacements(original: Iterable<string>, reverseReplacements: Map<string, string>): Iterable<string>;
    reverseTimestamps<T>(map: Map<string, T>, reverseReplacements: Map<string, string>): Map<string, T>;
    createWebpack4Watch(): (files: Iterable<string>, dirs: Iterable<string>, missing: Iterable<string>, startTime: number, options: {}, callback: Parameters<NodeWatchFileSystemInterface['watch']>[5], callbackUndelayed: (filename: string, timestamp: number) => void) => ReturnType<NodeWatchFileSystemInterface['watch']>;
    createWebpack5Watch(): (files: Iterable<string>, dirs: Iterable<string>, missing: Iterable<string>, startTime: number, options: {}, callback: Parameters<NodeWatchFileSystemInterface['watch']>[5], callbackUndelayed: (filename: string, timestamp: number) => void) => ReturnType<NodeWatchFileSystemInterface['watch']>;
    watch: any;
}

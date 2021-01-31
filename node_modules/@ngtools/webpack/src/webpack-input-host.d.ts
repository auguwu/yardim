/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { virtualFs } from '@angular-devkit/core';
import { Stats } from 'fs';
import { InputFileSystem } from 'webpack';
export declare function createWebpackInputHost(inputFileSystem: InputFileSystem): virtualFs.Host<Stats>;

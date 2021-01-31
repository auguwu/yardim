"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebpackInputHost = void 0;
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
// Host is used instead of ReadonlyHost due to most decorators only supporting Hosts
function createWebpackInputHost(inputFileSystem) {
    return core_1.virtualFs.createSyncHost({
        write() {
            throw new Error('Not supported.');
        },
        delete() {
            throw new Error('Not supported.');
        },
        rename() {
            throw new Error('Not supported.');
        },
        read(path) {
            const data = inputFileSystem.readFileSync(core_1.getSystemPath(path));
            return new Uint8Array(data).buffer;
        },
        list(path) {
            // readdirSync exists but is not in the Webpack typings
            const names = inputFileSystem.readdirSync(core_1.getSystemPath(path));
            return names.map((name) => core_1.fragment(name));
        },
        exists(path) {
            return !!this.stat(path);
        },
        isDirectory(path) {
            var _a, _b;
            return (_b = (_a = this.stat(path)) === null || _a === void 0 ? void 0 : _a.isDirectory()) !== null && _b !== void 0 ? _b : false;
        },
        isFile(path) {
            var _a, _b;
            return (_b = (_a = this.stat(path)) === null || _a === void 0 ? void 0 : _a.isFile()) !== null && _b !== void 0 ? _b : false;
        },
        stat(path) {
            try {
                return inputFileSystem.statSync(core_1.getSystemPath(path));
            }
            catch (e) {
                if (e.code === 'ENOENT') {
                    return null;
                }
                throw e;
            }
        },
    });
}
exports.createWebpackInputHost = createWebpackInputHost;

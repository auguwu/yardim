"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceFileCache = void 0;
const paths_1 = require("./paths");
class SourceFileCache extends Map {
    invalidate(fileTimestamps, buildTimestamp) {
        const changedFiles = new Set();
        for (const [file, timeOrEntry] of fileTimestamps) {
            const time = timeOrEntry && (typeof timeOrEntry === 'number' ? timeOrEntry : timeOrEntry.timestamp);
            if (time === null || buildTimestamp < time) {
                // Cache stores paths using the POSIX directory separator
                const normalizedFile = paths_1.normalizePath(file);
                this.delete(normalizedFile);
                changedFiles.add(normalizedFile);
            }
        }
        return changedFiles;
    }
}
exports.SourceFileCache = SourceFileCache;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
// This import lacks of type definitions.
const resolveBinSync = require('resolve-bin').sync;
/** Finds the path to the TSLint CLI binary. */
function findTslintBinaryPath() {
    const defaultPath = path_1.resolve(__dirname, '..', 'node_modules', 'tslint', 'bin', 'tslint');
    if (fs_1.existsSync(defaultPath)) {
        return defaultPath;
    }
    else {
        return resolveBinSync('tslint', 'tslint');
    }
}
exports.findTslintBinaryPath = findTslintBinaryPath;
//# sourceMappingURL=find-tslint-binary.js.map
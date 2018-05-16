"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
/**
 * Creates a fake TypeScript source file that can contain content of templates or stylesheets.
 * The fake TypeScript source file then can be passed to TSLint in combination with a rule failure.
 */
function createComponentFile(filePath, content) {
    const sourceFile = ts.createSourceFile(filePath, `\`${content}\``, ts.ScriptTarget.ES5);
    const _getFullText = sourceFile.getFullText;
    sourceFile.getFullText = function () {
        const text = _getFullText.apply(sourceFile);
        return text.substring(1, text.length - 1);
    }.bind(sourceFile);
    return sourceFile;
}
exports.createComponentFile = createComponentFile;
//# sourceMappingURL=component-file.js.map
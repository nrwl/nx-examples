"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Returns the text of a string literal without the quotes. */
function getLiteralTextWithoutQuotes(literal) {
    return literal.getText().substring(1, literal.getText().length - 1);
}
exports.getLiteralTextWithoutQuotes = getLiteralTextWithoutQuotes;
/** Method that can be used to replace all search occurrences in a string. */
function findAll(str, search) {
    const result = [];
    let i = -1;
    while ((i = str.indexOf(search, i + 1)) !== -1) {
        result.push(i);
    }
    return result;
}
exports.findAll = findAll;
function findAllInputsInElWithTag(html, name, tagNames) {
    return findAllIoInElWithTag(html, name, tagNames, String.raw `\[?`, String.raw `\]?`);
}
exports.findAllInputsInElWithTag = findAllInputsInElWithTag;
function findAllOutputsInElWithTag(html, name, tagNames) {
    return findAllIoInElWithTag(html, name, tagNames, String.raw `\(`, String.raw `\)`);
}
exports.findAllOutputsInElWithTag = findAllOutputsInElWithTag;
/**
 * Method that can be used to rename all occurrences of an `@Input()` in a HTML string that occur
 * inside an element with any of the given attributes. This is useful for replacing an `@Input()` on
 * a `@Directive()` with an attribute selector.
 */
function findAllInputsInElWithAttr(html, name, attrs) {
    return findAllIoInElWithAttr(html, name, attrs, String.raw `\[?`, String.raw `\]?`);
}
exports.findAllInputsInElWithAttr = findAllInputsInElWithAttr;
/**
 * Method that can be used to rename all occurrences of an `@Output()` in a HTML string that occur
 * inside an element with any of the given attributes. This is useful for replacing an `@Output()`
 * on a `@Directive()` with an attribute selector.
 */
function findAllOutputsInElWithAttr(html, name, attrs) {
    return findAllIoInElWithAttr(html, name, attrs, String.raw `\(`, String.raw `\)`);
}
exports.findAllOutputsInElWithAttr = findAllOutputsInElWithAttr;
function findAllIoInElWithTag(html, name, tagNames, startIoPattern, endIoPattern) {
    const skipPattern = String.raw `[^>]*\s`;
    const openTagPattern = String.raw `<\s*`;
    const tagNamesPattern = String.raw `(?:${tagNames.join('|')})`;
    const replaceIoPattern = String.raw `
      (${openTagPattern}${tagNamesPattern}\s(?:${skipPattern})?${startIoPattern})
      ${name}
      ${endIoPattern}[=\s>]`;
    const replaceIoRegex = new RegExp(replaceIoPattern.replace(/\s/g, ''), 'g');
    const result = [];
    let match;
    while (match = replaceIoRegex.exec(html)) {
        result.push(match.index + match[1].length);
    }
    return result;
}
function findAllIoInElWithAttr(html, name, attrs, startIoPattern, endIoPattern) {
    const skipPattern = String.raw `[^>]*\s`;
    const openTagPattern = String.raw `<\s*\S`;
    const attrsPattern = String.raw `(?:${attrs.join('|')})`;
    const inputAfterAttrPattern = String.raw `
    (${openTagPattern}${skipPattern}${attrsPattern}[=\s](?:${skipPattern})?${startIoPattern})
    ${name}
    ${endIoPattern}[=\s>]`;
    const inputBeforeAttrPattern = String.raw `
    (${openTagPattern}${skipPattern}${startIoPattern})
    ${name}
    ${endIoPattern}[=\s](?:${skipPattern})?${attrsPattern}[=\s>]`;
    const replaceIoPattern = String.raw `${inputAfterAttrPattern}|${inputBeforeAttrPattern}`;
    const replaceIoRegex = new RegExp(replaceIoPattern.replace(/\s/g, ''), 'g');
    const result = [];
    let match;
    while (match = replaceIoRegex.exec(html)) {
        result.push(match.index + (match[1] || match[2]).length);
    }
    return result;
}
//# sourceMappingURL=literal.js.map
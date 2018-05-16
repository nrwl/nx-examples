"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getChanges(allChanges) {
    return allChanges.reduce((result, changes) => result.concat(changes.changes), []);
}
/** Export the class name data as part of a module. This means that the data is cached. */
exports.classNames = getChanges(require('./data/class-names.json'));
/** Export the input names data as part of a module. This means that the data is cached. */
exports.inputNames = getChanges(require('./data/input-names.json'));
/** Export the output names data as part of a module. This means that the data is cached. */
exports.outputNames = getChanges(require('./data/output-names.json'));
/** Export the element selectors data as part of a module. This means that the data is cached. */
exports.elementSelectors = getChanges(require('./data/element-selectors.json'));
/** Export the attribute selectors data as part of a module. This means that the data is cached. */
exports.exportAsNames = getChanges(require('./data/export-as-names.json'));
/** Export the attribute selectors data as part of a module. This means that the data is cached. */
exports.attributeSelectors = getChanges(require('./data/attribute-selectors.json'));
/** Export the property names as part of a module. This means that the data is cached. */
exports.propertyNames = getChanges(require('./data/property-names.json'));
exports.methodCallChecks = getChanges(require('./data/method-call-checks.json'));
exports.cssNames = getChanges(require('./data/css-names.json'));
//# sourceMappingURL=component-data.js.map
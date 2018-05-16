"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const component_data_1 = require("../material/component-data");
/**
 * Rule that walks through every property access expression and updates properties that have
 * been changed in favor of the new name.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new CheckInheritanceWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class CheckInheritanceWalker extends tslint_1.ProgramAwareRuleWalker {
    visitClassDeclaration(declaration) {
        // Check if user is extending an Angular Material class whose properties have changed.
        const type = this.getTypeChecker().getTypeAtLocation(declaration.name);
        const baseTypes = this.getTypeChecker().getBaseTypes(type);
        baseTypes.forEach(t => {
            const propertyData = component_data_1.propertyNames.find(data => data.whitelist && new Set(data.whitelist.classes).has(t.symbol.name));
            if (propertyData) {
                this.addFailureAtNode(declaration, `Found class "${chalk_1.bold(declaration.name.text)}" which extends class` +
                    ` "${chalk_1.bold(t.symbol.name)}". Please note that the base class property` +
                    ` "${chalk_1.red(propertyData.replace)}" has changed to "${chalk_1.green(propertyData.replaceWith)}".` +
                    ` You may need to update your class as well`);
            }
        });
    }
}
exports.CheckInheritanceWalker = CheckInheritanceWalker;
//# sourceMappingURL=checkInheritanceRule.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
/**
 * Rule that walks through every identifier that is part of Angular Material and replaces the
 * outdated name with the new one.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new CheckIdentifierMiscWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class CheckIdentifierMiscWalker extends tslint_1.ProgramAwareRuleWalker {
    visitIdentifier(identifier) {
        if (identifier.getText() === 'MatDrawerToggleResult') {
            this.addFailureAtNode(identifier, `Found "${chalk_1.bold('MatDrawerToggleResult')}" which has changed from a class type to a` +
                ` string literal type. Code may need to be updated`);
        }
        if (identifier.getText() === 'MatListOptionChange') {
            this.addFailureAtNode(identifier, `Found usage of "${chalk_1.red('MatListOptionChange')}" which has been removed. Please listen` +
                ` for ${chalk_1.bold('selectionChange')} on ${chalk_1.bold('MatSelectionList')} instead`);
        }
    }
}
exports.CheckIdentifierMiscWalker = CheckIdentifierMiscWalker;
//# sourceMappingURL=checkIdentifierMiscRule.js.map
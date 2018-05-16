"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const typescript_specifiers_1 = require("../material/typescript-specifiers");
/**
 * Rule that walks through every identifier that is part of Angular Material and replaces the
 * outdated name with the new one.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new CheckImportMiscWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class CheckImportMiscWalker extends tslint_1.ProgramAwareRuleWalker {
    visitImportDeclaration(declaration) {
        if (typescript_specifiers_1.isMaterialImportDeclaration(declaration)) {
            declaration.importClause.namedBindings.forEachChild(n => {
                let importName = n.getFirstToken() && n.getFirstToken().getText();
                if (importName === 'SHOW_ANIMATION' || importName === 'HIDE_ANIMATION') {
                    this.addFailureAtNode(n, `Found deprecated symbol "${chalk_1.red(importName)}" which has been removed`);
                }
            });
        }
    }
}
exports.CheckImportMiscWalker = CheckImportMiscWalker;
//# sourceMappingURL=checkImportMiscRule.js.map
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
        return this.applyWithWalker(new CheckClassDeclarationMiscWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class CheckClassDeclarationMiscWalker extends tslint_1.ProgramAwareRuleWalker {
    visitClassDeclaration(declaration) {
        if (declaration.heritageClauses) {
            declaration.heritageClauses.forEach(hc => {
                const classes = new Set(hc.types.map(t => t.getFirstToken().getText()));
                if (classes.has('MatFormFieldControl')) {
                    const sfl = declaration.members
                        .filter(prop => prop.getFirstToken().getText() === 'shouldFloatLabel');
                    if (!sfl.length && declaration.name) {
                        this.addFailureAtNode(declaration, `Found class "${chalk_1.bold(declaration.name.text)}" which extends` +
                            ` "${chalk_1.bold('MatFormFieldControl')}". This class must define` +
                            ` "${chalk_1.green('shouldLabelFloat')}" which is now a required property.`);
                    }
                }
            });
        }
    }
}
exports.CheckClassDeclarationMiscWalker = CheckClassDeclarationMiscWalker;
//# sourceMappingURL=checkClassDeclarationMiscRule.js.map
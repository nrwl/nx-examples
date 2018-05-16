"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const ts = require("typescript");
/**
 * Rule that walks through every identifier that is part of Angular Material and replaces the
 * outdated name with the new one.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new CheckPropertyAccessMiscWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class CheckPropertyAccessMiscWalker extends tslint_1.ProgramAwareRuleWalker {
    visitPropertyAccessExpression(prop) {
        // Recursively call this method for the expression of the current property expression.
        // It can happen that there is a chain of property access expressions.
        // For example: "mySortInstance.mdSortChange.subscribe()"
        if (prop.expression && prop.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            this.visitPropertyAccessExpression(prop.expression);
        }
        // TODO(mmalerba): This is probably a bad way to get the property host...
        // Tokens are: [..., <host>, '.', <prop>], so back up 3.
        const propHost = prop.getChildAt(prop.getChildCount() - 3);
        const type = this.getTypeChecker().getTypeAtLocation(propHost);
        const typeSymbol = type && type.getSymbol();
        if (typeSymbol) {
            const typeName = typeSymbol.getName();
            if (typeName === 'MatListOption' && prop.name.text === 'selectionChange') {
                this.addFailureAtNode(prop, `Found deprecated property "${chalk_1.red('selectionChange')}" of class` +
                    ` "${chalk_1.bold('MatListOption')}". Use the "${chalk_1.green('selectionChange')}" property on the` +
                    ` parent "${chalk_1.bold('MatSelectionList')}" instead.`);
            }
            if (typeName === 'MatDatepicker' && prop.name.text === 'selectedChanged') {
                this.addFailureAtNode(prop, `Found deprecated property "${chalk_1.red('selectedChanged')}" of class` +
                    ` "${chalk_1.bold('MatDatepicker')}". Use the "${chalk_1.green('dateChange')}" or` +
                    ` "${chalk_1.green('dateInput')}" methods on "${chalk_1.bold('MatDatepickerInput')}" instead`);
            }
        }
    }
}
exports.CheckPropertyAccessMiscWalker = CheckPropertyAccessMiscWalker;
//# sourceMappingURL=checkPropertyAccessMiscRule.js.map
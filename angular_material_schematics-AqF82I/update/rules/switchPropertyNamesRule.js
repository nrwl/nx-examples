"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const ts = require("typescript");
const component_data_1 = require("../material/component-data");
/**
 * Rule that walks through every property access expression and updates properties that have
 * been changed in favor of the new name.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new SwitchPropertyNamesWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class SwitchPropertyNamesWalker extends tslint_1.ProgramAwareRuleWalker {
    visitPropertyAccessExpression(prop) {
        // Recursively call this method for the expression of the current property expression.
        // It can happen that there is a chain of property access expressions.
        // For example: "mySortInstance.mdSortChange.subscribe()"
        if (prop.expression && prop.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            this.visitPropertyAccessExpression(prop.expression);
        }
        // TODO(mmalerba): This is prrobably a bad way to get the property host...
        // Tokens are: [..., <host>, '.', <prop>], so back up 3.
        const propHost = prop.getChildAt(prop.getChildCount() - 3);
        const type = this.getTypeChecker().getTypeAtLocation(propHost);
        const typeSymbol = type && type.getSymbol();
        const typeName = typeSymbol && typeSymbol.getName();
        const propertyData = component_data_1.propertyNames.find(name => {
            if (prop.name.text === name.replace) {
                // TODO(mmalerba): Verify that this type comes from Angular Material like we do in
                // `switchIdentifiersRule`.
                return !name.whitelist || !!typeName && new Set(name.whitelist.classes).has(typeName);
            }
            return false;
        });
        if (!propertyData) {
            return;
        }
        const replacement = this.createReplacement(prop.name.getStart(), prop.name.getWidth(), propertyData.replaceWith);
        const typeMessage = propertyData.whitelist ? `of class "${chalk_1.bold(typeName || '')}"` : '';
        this.addFailureAtNode(prop.name, `Found deprecated property "${chalk_1.red(propertyData.replace)}" ${typeMessage} which has been` +
            ` renamed to "${chalk_1.green(propertyData.replaceWith)}"`, replacement);
    }
}
exports.SwitchPropertyNamesWalker = SwitchPropertyNamesWalker;
//# sourceMappingURL=switchPropertyNamesRule.js.map
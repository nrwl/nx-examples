"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const ts = require("typescript");
const component_data_1 = require("../material/component-data");
const literal_1 = require("../typescript/literal");
/**
 * Rule that walks through every string literal, which includes the outdated Material name and
 * is part of a call expression. Those string literals will be changed to the new name.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new SwitchStringLiteralElementSelectorsWalker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class SwitchStringLiteralElementSelectorsWalker extends tslint_1.RuleWalker {
    visitStringLiteral(stringLiteral) {
        if (stringLiteral.parent && stringLiteral.parent.kind !== ts.SyntaxKind.CallExpression) {
            return;
        }
        let stringLiteralText = stringLiteral.getFullText();
        component_data_1.elementSelectors.forEach(selector => {
            this.createReplacementsForOffsets(stringLiteral, selector, literal_1.findAll(stringLiteralText, selector.replace)).forEach(replacement => {
                this.addFailureAtNode(stringLiteral, `Found deprecated element selector "${chalk_1.red(selector.replace)}" which has been` +
                    ` renamed to "${chalk_1.green(selector.replaceWith)}"`, replacement);
            });
        });
    }
    createReplacementsForOffsets(node, update, offsets) {
        return offsets.map(offset => this.createReplacement(node.getStart() + offset, update.replace.length, update.replaceWith));
    }
}
exports.SwitchStringLiteralElementSelectorsWalker = SwitchStringLiteralElementSelectorsWalker;
//# sourceMappingURL=switchStringLiteralElementSelectorsRule.js.map
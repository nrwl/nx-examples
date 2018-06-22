"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const component_data_1 = require("../material/component-data");
const component_walker_1 = require("../tslint/component-walker");
const literal_1 = require("../typescript/literal");
/**
 * Rule that walks through every component decorator and updates their inline or external
 * templates.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new SwitchTemplateElementSelectorsWalker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class SwitchTemplateElementSelectorsWalker extends component_walker_1.ComponentWalker {
    visitInlineTemplate(template) {
        this.replaceNamesInTemplate(template, template.getText()).forEach(replacement => {
            const fix = replacement.replacement;
            const ruleFailure = new tslint_1.RuleFailure(template.getSourceFile(), fix.start, fix.end, replacement.message, this.getRuleName(), fix);
            this.addFailure(ruleFailure);
        });
    }
    visitExternalTemplate(template) {
        this.replaceNamesInTemplate(template, template.getFullText()).forEach(replacement => {
            const fix = replacement.replacement;
            const ruleFailure = new tslint_1.RuleFailure(template, fix.start + 1, fix.end + 1, replacement.message, this.getRuleName(), fix);
            this.addFailure(ruleFailure);
        });
    }
    /**
     * Replaces the outdated name in the template with the new one and returns an updated template.
     */
    replaceNamesInTemplate(node, templateContent) {
        const replacements = [];
        component_data_1.elementSelectors.forEach(selector => {
            // Being more aggressive with that replacement here allows us to also handle inline
            // style elements. Normally we would check if the selector is surrounded by the HTML tag
            // characters.
            this.createReplacementsForOffsets(node, selector, literal_1.findAll(templateContent, selector.replace))
                .forEach(replacement => {
                replacements.push({
                    message: `Found deprecated element selector "${chalk_1.red(selector.replace)}" which has` +
                        ` been renamed to "${chalk_1.green(selector.replaceWith)}"`,
                    replacement
                });
            });
        });
        return replacements;
    }
    createReplacementsForOffsets(node, update, offsets) {
        return offsets.map(offset => this.createReplacement(node.getStart() + offset, update.replace.length, update.replaceWith));
    }
}
exports.SwitchTemplateElementSelectorsWalker = SwitchTemplateElementSelectorsWalker;
//# sourceMappingURL=switchTemplateElementSelectorsRule.js.map
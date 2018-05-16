"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const glob_1 = require("glob");
const tslint_1 = require("tslint");
const component_data_1 = require("../material/component-data");
const component_walker_1 = require("../tslint/component-walker");
const literal_1 = require("../typescript/literal");
/**
 * Rule that walks through every component decorator and updates their inline or external
 * stylesheets.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new SwitchStylesheetElementSelectorsWalker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class SwitchStylesheetElementSelectorsWalker extends component_walker_1.ComponentWalker {
    constructor(sourceFile, options) {
        // In some applications, developers will have global stylesheets that are not specified in any
        // Angular component. Therefore we glob up all css and scss files outside of node_modules and
        // dist and check them as well.
        const extraFiles = glob_1.sync('!(node_modules|dist)/**/*.+(css|scss)');
        super(sourceFile, options, extraFiles);
        extraFiles.forEach(styleUrl => this._reportExternalStyle(styleUrl));
    }
    visitInlineStylesheet(stylesheet) {
        this.replaceNamesInStylesheet(stylesheet, stylesheet.getText()).forEach(replacement => {
            const fix = replacement.replacement;
            const ruleFailure = new tslint_1.RuleFailure(stylesheet.getSourceFile(), fix.start, fix.end, replacement.message, this.getRuleName(), fix);
            this.addFailure(ruleFailure);
        });
    }
    visitExternalStylesheet(stylesheet) {
        this.replaceNamesInStylesheet(stylesheet, stylesheet.getFullText()).forEach(replacement => {
            const fix = replacement.replacement;
            const ruleFailure = new tslint_1.RuleFailure(stylesheet, fix.start + 1, fix.end + 1, replacement.message, this.getRuleName(), fix);
            this.addFailure(ruleFailure);
        });
    }
    /**
     * Replaces the outdated name in the stylesheet with the new one and returns an updated
     * stylesheet.
     */
    replaceNamesInStylesheet(node, stylesheetContent) {
        const replacements = [];
        component_data_1.elementSelectors.forEach(selector => {
            this.createReplacementsForOffsets(node, selector, literal_1.findAll(stylesheetContent, selector.replace)).forEach(replacement => {
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
exports.SwitchStylesheetElementSelectorsWalker = SwitchStylesheetElementSelectorsWalker;
//# sourceMappingURL=switchStylesheetElementSelectorsRule.js.map
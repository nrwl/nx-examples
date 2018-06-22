"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const tslint_1 = require("tslint");
const component_walker_1 = require("../tslint/component-walker");
const literal_1 = require("../typescript/literal");
/**
 * Rule that walks through every component decorator and updates their inline or external
 * templates.
 */
class Rule extends tslint_1.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithWalker(new CheckTemplateMiscWalker(sourceFile, this.getOptions()));
    }
}
exports.Rule = Rule;
class CheckTemplateMiscWalker extends component_walker_1.ComponentWalker {
    visitInlineTemplate(template) {
        this.checkTemplate(template.getText()).forEach(failure => {
            const ruleFailure = new tslint_1.RuleFailure(template.getSourceFile(), failure.start, failure.end, failure.message, this.getRuleName());
            this.addFailure(ruleFailure);
        });
    }
    visitExternalTemplate(template) {
        this.checkTemplate(template.getFullText()).forEach(failure => {
            const ruleFailure = new tslint_1.RuleFailure(template, failure.start + 1, failure.end + 1, failure.message, this.getRuleName());
            this.addFailure(ruleFailure);
        });
    }
    /**
     * Replaces the outdated name in the template with the new one and returns an updated template.
     */
    checkTemplate(templateContent) {
        let failures = [];
        failures = failures.concat(literal_1.findAll(templateContent, 'cdk-focus-trap').map(offset => ({
            start: offset,
            end: offset + 'cdk-focus-trap'.length,
            message: `Found deprecated element selector "${chalk_1.red('cdk-focus-trap')}" which has been` +
                ` changed to an attribute selector "${chalk_1.green('[cdkTrapFocus]')}"`
        })));
        failures = failures.concat(literal_1.findAllOutputsInElWithTag(templateContent, 'selectionChange', ['mat-list-option'])
            .map(offset => ({
            start: offset,
            end: offset + 'selectionChange'.length,
            message: `Found deprecated @Output() "${chalk_1.red('selectionChange')}" on` +
                ` "${chalk_1.bold('mat-list-option')}". Use "${chalk_1.green('selectionChange')}" on` +
                ` "${chalk_1.bold('mat-selection-list')}" instead`
        })));
        failures = failures.concat(literal_1.findAllOutputsInElWithTag(templateContent, 'selectedChanged', ['mat-datepicker'])
            .map(offset => ({
            start: offset,
            end: offset + 'selectionChange'.length,
            message: `Found deprecated @Output() "${chalk_1.red('selectedChanged')}" on` +
                ` "${chalk_1.bold('mat-datepicker')}". Use "${chalk_1.green('dateChange')}" or` +
                ` "${chalk_1.green('dateInput')}" on "${chalk_1.bold('<input [matDatepicker]>')}" instead`
        })));
        failures = failures.concat(literal_1.findAllInputsInElWithTag(templateContent, 'selected', ['mat-button-toggle-group'])
            .map(offset => ({
            start: offset,
            end: offset + 'selected'.length,
            message: `Found deprecated @Input() "${chalk_1.red('selected')}" on` +
                ` "${chalk_1.bold('mat-radio-button-group')}". Use "${chalk_1.green('value')}" instead`
        })));
        return failures;
    }
}
exports.CheckTemplateMiscWalker = CheckTemplateMiscWalker;
//# sourceMappingURL=checkTemplateMiscRule.js.map
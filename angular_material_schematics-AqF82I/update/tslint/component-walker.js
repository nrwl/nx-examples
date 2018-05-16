"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * TSLint custom walker implementation that also visits external and inline templates.
 */
const fs_1 = require("fs");
const path_1 = require("path");
const tslint_1 = require("tslint");
const ts = require("typescript");
const literal_1 = require("../typescript/literal");
const component_file_1 = require("./component-file");
/**
 * Custom TSLint rule walker that identifies Angular components and visits specific parts of
 * the component metadata.
 */
class ComponentWalker extends tslint_1.RuleWalker {
    visitInlineTemplate(template) { }
    visitInlineStylesheet(stylesheet) { }
    visitExternalTemplate(template) { }
    visitExternalStylesheet(stylesheet) { }
    constructor(sourceFile, options, skipFiles = []) {
        super(sourceFile, options);
        this.skipFiles = new Set(skipFiles.map(p => path_1.resolve(p)));
    }
    visitNode(node) {
        if (node.kind === ts.SyntaxKind.CallExpression) {
            const callExpression = node;
            const callExpressionName = callExpression.expression.getText();
            if (callExpressionName === 'Component' || callExpressionName === 'Directive') {
                this._visitDirectiveCallExpression(callExpression);
            }
        }
        super.visitNode(node);
    }
    _visitDirectiveCallExpression(callExpression) {
        const directiveMetadata = callExpression.arguments[0];
        if (!directiveMetadata) {
            return;
        }
        for (const property of directiveMetadata.properties) {
            const propertyName = property.name.getText();
            const initializerKind = property.initializer.kind;
            if (propertyName === 'template') {
                this.visitInlineTemplate(property.initializer);
            }
            if (propertyName === 'templateUrl' && initializerKind === ts.SyntaxKind.StringLiteral) {
                this._reportExternalTemplate(property.initializer);
            }
            if (propertyName === 'styles' && initializerKind === ts.SyntaxKind.ArrayLiteralExpression) {
                this._reportInlineStyles(property.initializer);
            }
            if (propertyName === 'styleUrls' && initializerKind === ts.SyntaxKind.ArrayLiteralExpression) {
                this._visitExternalStylesArrayLiteral(property.initializer);
            }
        }
    }
    _reportInlineStyles(inlineStyles) {
        inlineStyles.elements.forEach(element => {
            this.visitInlineStylesheet(element);
        });
    }
    _visitExternalStylesArrayLiteral(styleUrls) {
        styleUrls.elements.forEach(styleUrlLiteral => {
            const styleUrl = literal_1.getLiteralTextWithoutQuotes(styleUrlLiteral);
            const stylePath = path_1.resolve(path_1.join(path_1.dirname(this.getSourceFile().fileName), styleUrl));
            if (!this.skipFiles.has(stylePath)) {
                this._reportExternalStyle(stylePath);
            }
        });
    }
    _reportExternalTemplate(templateUrlLiteral) {
        const templateUrl = literal_1.getLiteralTextWithoutQuotes(templateUrlLiteral);
        const templatePath = path_1.resolve(path_1.join(path_1.dirname(this.getSourceFile().fileName), templateUrl));
        if (this.skipFiles.has(templatePath)) {
            return;
        }
        // Check if the external template file exists before proceeding.
        if (!fs_1.existsSync(templatePath)) {
            console.error(`PARSE ERROR: ${this.getSourceFile().fileName}:` +
                ` Could not find template: "${templatePath}".`);
            process.exit(1);
        }
        // Create a fake TypeScript source file that includes the template content.
        const templateFile = component_file_1.createComponentFile(templatePath, fs_1.readFileSync(templatePath, 'utf8'));
        this.visitExternalTemplate(templateFile);
    }
    _reportExternalStyle(stylePath) {
        // Check if the external stylesheet file exists before proceeding.
        if (!fs_1.existsSync(stylePath)) {
            console.error(`PARSE ERROR: ${this.getSourceFile().fileName}:` +
                ` Could not find stylesheet: "${stylePath}".`);
            process.exit(1);
        }
        // Create a fake TypeScript source file that includes the stylesheet content.
        const stylesheetFile = component_file_1.createComponentFile(stylePath, fs_1.readFileSync(stylePath, 'utf8'));
        this.visitExternalStylesheet(stylesheetFile);
    }
    /** Creates a TSLint rule failure for the given external resource. */
    addExternalResourceFailure(file, message, fix) {
        const ruleFailure = new tslint_1.RuleFailure(file, file.getStart(), file.getEnd(), message, this.getRuleName(), fix);
        this.addFailure(ruleFailure);
    }
}
exports.ComponentWalker = ComponentWalker;
//# sourceMappingURL=component-walker.js.map
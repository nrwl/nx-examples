"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const path_1 = require("path");
const tslint_1 = require("tslint");
const ts = require("typescript");
const component_data_1 = require("../material/component-data");
const typescript_specifiers_1 = require("../material/typescript-specifiers");
const identifiers_1 = require("../typescript/identifiers");
const imports_1 = require("../typescript/imports");
/**
 * Rule that walks through every identifier that is part of Angular Material and replaces the
 * outdated name with the new one.
 */
class Rule extends tslint_1.Rules.TypedRule {
    applyWithProgram(sourceFile, program) {
        return this.applyWithWalker(new SwitchIdentifiersWalker(sourceFile, this.getOptions(), program));
    }
}
exports.Rule = Rule;
class SwitchIdentifiersWalker extends tslint_1.ProgramAwareRuleWalker {
    constructor(sf, opt, prog) {
        super(sf, opt, prog);
        /** List of Angular Material declarations inside of the current source file. */
        this.materialDeclarations = [];
        /** List of Angular Material namespace declarations in the current source file. */
        this.materialNamespaceDeclarations = [];
    }
    /** Method that is called for every identifier inside of the specified project. */
    visitIdentifier(identifier) {
        // Store Angular Material namespace identifers in a list of declarations.
        // Namespace identifiers can be: `import * as md from '@angular/material';`
        this._storeNamespaceImports(identifier);
        // For identifiers that aren't listed in the className data, the whole check can be
        // skipped safely.
        if (!component_data_1.classNames.some(data => data.replace === identifier.text)) {
            return;
        }
        const symbol = identifiers_1.getOriginalSymbolFromNode(identifier, this.getTypeChecker());
        // If the symbol is not defined or could not be resolved, just skip the following identifier
        // checks.
        if (!symbol || !symbol.name || symbol.name === 'unknown') {
            console.error(`Could not resolve symbol for identifier "${identifier.text}" ` +
                `in file ${this._getRelativeFileName()}`);
            return;
        }
        // For export declarations that are referring to Angular Material, the identifier should be
        // switched to the new name.
        if (imports_1.isExportSpecifierNode(identifier) && typescript_specifiers_1.isMaterialExportDeclaration(identifier)) {
            return this.createIdentifierFailure(identifier, symbol);
        }
        // For import declarations that are referring to Angular Material, the value declarations
        // should be stored so that other identifiers in the file can be compared.
        if (imports_1.isImportSpecifierNode(identifier) && typescript_specifiers_1.isMaterialImportDeclaration(identifier)) {
            this.materialDeclarations.push(symbol.valueDeclaration);
        }
        else if (this.materialDeclarations.indexOf(symbol.valueDeclaration) === -1 &&
            !this._isIdentifierFromNamespace(identifier)) {
            return;
        }
        return this.createIdentifierFailure(identifier, symbol);
    }
    /** Creates a failure and replacement for the specified identifier. */
    createIdentifierFailure(identifier, symbol) {
        let classData = component_data_1.classNames.find(data => data.replace === symbol.name || data.replace === identifier.text);
        if (!classData) {
            console.error(`Could not find updated name for identifier "${identifier.getText()}" in ` +
                ` in file ${this._getRelativeFileName()}.`);
            return;
        }
        const replacement = this.createReplacement(identifier.getStart(), identifier.getWidth(), classData.replaceWith);
        this.addFailureAtNode(identifier, `Found deprecated identifier "${chalk_1.red(classData.replace)}" which has been renamed to` +
            ` "${chalk_1.green(classData.replaceWith)}"`, replacement);
    }
    /** Checks namespace imports from Angular Material and stores them in a list. */
    _storeNamespaceImports(identifier) {
        // In some situations, developers will import Angular Material completely using a namespace
        // import. This is not recommended, but should be still handled in the migration tool.
        if (imports_1.isNamespaceImportNode(identifier) && typescript_specifiers_1.isMaterialImportDeclaration(identifier)) {
            const symbol = identifiers_1.getOriginalSymbolFromNode(identifier, this.getTypeChecker());
            if (symbol) {
                return this.materialNamespaceDeclarations.push(symbol.valueDeclaration);
            }
        }
    }
    /** Checks whether the given identifier is part of the Material namespace. */
    _isIdentifierFromNamespace(identifier) {
        if (identifier.parent && identifier.parent.kind !== ts.SyntaxKind.PropertyAccessExpression) {
            return;
        }
        const propertyExpression = identifier.parent;
        const expressionSymbol = identifiers_1.getOriginalSymbolFromNode(propertyExpression.expression, this.getTypeChecker());
        return this.materialNamespaceDeclarations.indexOf(expressionSymbol.valueDeclaration) !== -1;
    }
    /** Returns the current source file path relative to the root directory of the project. */
    _getRelativeFileName() {
        return path_1.relative(this.getProgram().getCurrentDirectory(), this.getSourceFile().fileName);
    }
}
exports.SwitchIdentifiersWalker = SwitchIdentifiersWalker;
//# sourceMappingURL=switchIdentifiersRule.js.map
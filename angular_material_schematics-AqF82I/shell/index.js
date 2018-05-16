"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const ast_1 = require("../utils/ast");
const change_1 = require("../utils/devkit-utils/change");
const config_1 = require("../utils/devkit-utils/config");
const html_1 = require("../utils/html");
const lib_versions_1 = require("../utils/lib-versions");
const package_1 = require("../utils/package");
const theming_1 = require("./theming");
/**
 * Scaffolds the basics of a Angular Material application, this includes:
 *  - Add Packages to package.json
 *  - Adds pre-built themes to styles.ext
 *  - Adds Browser Animation to app.momdule
 */
function default_1(options) {
    return schematics_1.chain([
        options && options.skipPackageJson ? schematics_1.noop() : addMaterialToPackageJson(),
        theming_1.addThemeToAppStyles(options),
        addAnimationRootConfig(options),
        addFontsToIndex(options),
        addBodyMarginToStyles(options),
    ]);
}
exports.default = default_1;
/** Add material, cdk, annimations to package.json if not already present. */
function addMaterialToPackageJson() {
    return (host, context) => {
        package_1.addPackageToPackageJson(host, 'dependencies', '@angular/cdk', lib_versions_1.cdkVersion);
        package_1.addPackageToPackageJson(host, 'dependencies', '@angular/material', lib_versions_1.materialVersion);
        package_1.addPackageToPackageJson(host, 'dependencies', '@angular/animations', lib_versions_1.angularVersion);
        context.addTask(new tasks_1.NodePackageInstallTask());
        return host;
    };
}
/** Add browser animation module to app.module */
function addAnimationRootConfig(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = config_1.getProjectFromWorkspace(workspace, options.project);
        ast_1.addModuleImportToRootModule(host, 'BrowserAnimationsModule', '@angular/platform-browser/animations', project);
        return host;
    };
}
/** Adds fonts to the index.ext file */
function addFontsToIndex(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = config_1.getProjectFromWorkspace(workspace, options.project);
        const fonts = [
            'https://fonts.googleapis.com/css?family=Roboto:300,400,500',
            'https://fonts.googleapis.com/icon?family=Material+Icons',
        ];
        fonts.forEach(f => html_1.addHeadLink(host, project, `\n<link href="${f}" rel="stylesheet">`));
        return host;
    };
}
/** Add 0 margin to body in styles.ext */
function addBodyMarginToStyles(options) {
    return (host) => {
        const workspace = config_1.getWorkspace(host);
        const project = config_1.getProjectFromWorkspace(workspace, options.project);
        const stylesPath = ast_1.getStylesPath(host, project);
        const buffer = host.read(stylesPath);
        if (buffer) {
            const src = buffer.toString();
            const insertion = new change_1.InsertChange(stylesPath, src.length, `\nbody { margin: 0; }\n`);
            const recorder = host.beginUpdate(stylesPath);
            recorder.insertLeft(insertion.pos, insertion.toAdd);
            host.commitUpdate(recorder);
        }
        else {
            console.warn(`Skipped body reset; could not find file: ${stylesPath}`);
        }
    };
}
//# sourceMappingURL=index.js.map
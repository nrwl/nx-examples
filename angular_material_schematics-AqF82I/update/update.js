"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tasks_1 = require("@angular-devkit/schematics/tasks");
const fs_1 = require("fs");
const path = require("path");
const config_1 = require("../utils/devkit-utils/config");
const schematicsSrcPath = 'node_modules/@angular/material/schematics';
const schematicsTmpPath = fs_1.mkdtempSync('angular_material_schematics-');
/** Entry point for `ng update` from Angular CLI. */
function default_1() {
    return (tree, context) => {
        // If this script failed in an earlier run, clear out the temporary files from that failed
        // run before doing anything else.
        tree.getDir(schematicsTmpPath).visit((_, entry) => tree.delete(entry.path));
        // Copy the update schematics to a temporary directory.
        const updateSrcs = [];
        tree.getDir(schematicsSrcPath).visit((_, entry) => updateSrcs.push(entry));
        for (let src of updateSrcs) {
            tree.create(src.path.replace(schematicsSrcPath, schematicsTmpPath), src.content);
        }
        // Downgrade @angular/cdk and @angular/material to 5.x. This allows us to use the 5.x type
        // information in the update script.
        const downgradeTask = context.addTask(new tasks_1.NodePackageInstallTask({
            packageName: '@angular/cdk@">=5 <6" @angular/material@">=5 <6"'
        }));
        const allTsConfigPaths = getTsConfigPaths(tree);
        const allUpdateTasks = [];
        for (const tsconfig of allTsConfigPaths) {
            // Run the update tslint rules.
            allUpdateTasks.push(context.addTask(new tasks_1.TslintFixTask({
                rulesDirectory: path.join(schematicsTmpPath, 'update/rules'),
                rules: {
                    // Automatic fixes.
                    "switch-identifiers": true,
                    "switch-property-names": true,
                    "switch-string-literal-attribute-selectors": true,
                    "switch-string-literal-css-names": true,
                    "switch-string-literal-element-selectors": true,
                    "switch-stylesheet-attribute-selectors": true,
                    "switch-stylesheet-css-names": true,
                    "switch-stylesheet-element-selectors": true,
                    "switch-stylesheet-input-names": true,
                    "switch-stylesheet-output-names": true,
                    "switch-template-attribute-selectors": true,
                    "switch-template-css-names": true,
                    "switch-template-element-selectors": true,
                    "switch-template-export-as-names": true,
                    "switch-template-input-names": true,
                    "switch-template-output-names": true,
                    // Additional issues we can detect but not automatically fix.
                    "check-class-declaration-misc": true,
                    "check-identifier-misc": true,
                    "check-import-misc": true,
                    "check-inheritance": true,
                    "check-method-calls": true,
                    "check-property-access-misc": true,
                    "check-template-misc": true
                }
            }, {
                silent: false,
                ignoreErrors: true,
                tsConfigPath: tsconfig,
            }), [downgradeTask]));
        }
        // Upgrade @angular/material back to 6.x.
        const upgradeTask = context.addTask(new tasks_1.NodePackageInstallTask({
            // TODO(mmalerba): Change "next" to ">=6 <7".
            packageName: '@angular/cdk@next @angular/material@next'
        }), allUpdateTasks);
        // Delete the temporary schematics directory.
        context.addTask(new tasks_1.RunSchematicTask('ng-post-update', {
            deleteFiles: updateSrcs
                .map(entry => entry.path.replace(schematicsSrcPath, schematicsTmpPath))
        }), [upgradeTask]);
    };
}
exports.default = default_1;
/** Post-update schematic to be called when ng update is finished. */
function postUpdate(options) {
    return (tree, context) => {
        for (let file of options.deleteFiles) {
            tree.delete(file);
        }
        context.addTask(new tasks_1.RunSchematicTask('ng-post-post-update', {}));
    };
}
exports.postUpdate = postUpdate;
/** Post-post-update schematic to be called when post-update is finished. */
function postPostUpdate() {
    return () => console.log('\nComplete! Please check the output above for any issues that were detected but could not' +
        ' be automatically fixed.');
}
exports.postPostUpdate = postPostUpdate;
/** Gets the first tsconfig path from possibile locations based on the history of the CLI. */
function getTsConfigPaths(tree) {
    // Start with some tsconfig paths that are generally used.
    const tsconfigPaths = [
        './tsconfig.json',
        './src/tsconfig.json',
        './src/tsconfig.app.json',
    ];
    // Add any tsconfig directly referenced in a build or test task of the angular.json workspace.
    const workspace = config_1.getWorkspace(tree);
    for (const project of Object.values(workspace.projects)) {
        if (project && project.architect) {
            for (const taskName of ['build', 'test']) {
                const task = project.architect[taskName];
                if (task && task.options && task.options.tsConfig) {
                    const tsConfigOption = project.architect.tsConfig;
                    if (typeof tsConfigOption === 'string') {
                        tsconfigPaths.push(tsConfigOption);
                    }
                    else if (Array.isArray(tsConfigOption)) {
                        tsconfigPaths.push(...tsConfigOption);
                    }
                }
            }
        }
    }
    // Filter out tsconfig files that don't exist and remove any duplicates.
    return tsconfigPaths
        .filter(p => fs_1.existsSync(p))
        .filter((value, index, self) => self.indexOf(value) === index);
}
//# sourceMappingURL=update.js.map
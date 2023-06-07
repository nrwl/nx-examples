"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLicenses = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
/**
 * The path segment used to signify that a file is part of a package.
 */
const NODE_MODULE_SEGMENT = 'node_modules';
/**
 * String constant for the NPM recommended custom license wording.
 *
 * See: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#license
 *
 * Example:
 * ```
 * {
 *   "license" : "SEE LICENSE IN <filename>"
 * }
 * ```
 */
const CUSTOM_LICENSE_TEXT = 'SEE LICENSE IN ';
/**
 * A list of commonly named license files found within packages.
 */
const LICENSE_FILES = ['LICENSE', 'LICENSE.txt', 'LICENSE.md'];
/**
 * Header text that will be added to the top of the output license extraction file.
 */
const EXTRACTION_FILE_HEADER = '';
/**
 * The package entry separator to use within the output license extraction file.
 */
const EXTRACTION_FILE_SEPARATOR = '-'.repeat(80) + '\n';
/**
 * Extracts license information for each node module package included in the output
 * files of the built code. This includes JavaScript and CSS output files. The esbuild
 * metafile generated during the bundling steps is used as the source of information
 * regarding what input files where included and where they are located. A path segment
 * of `node_modules` is used to indicate that a file belongs to a package and its license
 * should be include in the output licenses file.
 *
 * The package name and license field are extracted from the `package.json` file for the
 * package. If a license file (e.g., `LICENSE`) is present in the root of the package, it
 * will also be included in the output licenses file.
 *
 * @param metafile An esbuild metafile object.
 * @param rootDirectory The root directory of the workspace.
 * @returns A string containing the content of the output licenses file.
 */
async function extractLicenses(metafile, rootDirectory) {
    let extractedLicenseContent = `${EXTRACTION_FILE_HEADER}\n${EXTRACTION_FILE_SEPARATOR}`;
    const seenPaths = new Set();
    const seenPackages = new Set();
    for (const entry of Object.values(metafile.outputs)) {
        for (const [inputPath, { bytesInOutput }] of Object.entries(entry.inputs)) {
            // Skip if not included in output
            if (bytesInOutput <= 0) {
                continue;
            }
            // Skip already processed paths
            if (seenPaths.has(inputPath)) {
                continue;
            }
            seenPaths.add(inputPath);
            // Skip non-package paths
            if (!inputPath.includes(NODE_MODULE_SEGMENT)) {
                continue;
            }
            // Extract the package name from the path
            let baseDirectory = node_path_1.default.join(rootDirectory, inputPath);
            let nameOrScope, nameOrFile;
            let found = false;
            while (baseDirectory !== node_path_1.default.dirname(baseDirectory)) {
                const segment = node_path_1.default.basename(baseDirectory);
                if (segment === NODE_MODULE_SEGMENT) {
                    found = true;
                    break;
                }
                nameOrFile = nameOrScope;
                nameOrScope = segment;
                baseDirectory = node_path_1.default.dirname(baseDirectory);
            }
            // Skip non-package path edge cases that are not caught in the includes check above
            if (!found || !nameOrScope) {
                continue;
            }
            const packageName = nameOrScope.startsWith('@')
                ? `${nameOrScope}/${nameOrFile}`
                : nameOrScope;
            const packageDirectory = node_path_1.default.join(baseDirectory, packageName);
            // Load the package's metadata to find the package's name, version, and license type
            const packageJsonPath = node_path_1.default.join(packageDirectory, 'package.json');
            let packageJson;
            try {
                packageJson = JSON.parse(await (0, promises_1.readFile)(packageJsonPath, 'utf-8'));
            }
            catch {
                // Invalid package
                continue;
            }
            // Skip already processed packages
            const packageId = `${packageName}@${packageJson.version}`;
            if (seenPackages.has(packageId)) {
                continue;
            }
            seenPackages.add(packageId);
            // Attempt to find license text inside package
            let licenseText = '';
            if (typeof packageJson.license === 'string' &&
                packageJson.license.toLowerCase().startsWith(CUSTOM_LICENSE_TEXT)) {
                // Attempt to load the package's custom license
                let customLicensePath;
                const customLicenseFile = node_path_1.default.normalize(packageJson.license.slice(CUSTOM_LICENSE_TEXT.length + 1).trim());
                if (customLicenseFile.startsWith('..') || node_path_1.default.isAbsolute(customLicenseFile)) {
                    // Path is attempting to access files outside of the package
                    // TODO: Issue warning?
                }
                else {
                    customLicensePath = node_path_1.default.join(packageDirectory, customLicenseFile);
                    try {
                        licenseText = await (0, promises_1.readFile)(customLicensePath, 'utf-8');
                        break;
                    }
                    catch { }
                }
            }
            else {
                // Search for a license file within the root of the package
                for (const potentialLicense of LICENSE_FILES) {
                    const packageLicensePath = node_path_1.default.join(packageDirectory, potentialLicense);
                    try {
                        licenseText = await (0, promises_1.readFile)(packageLicensePath, 'utf-8');
                        break;
                    }
                    catch { }
                }
            }
            // Generate the package's license entry in the output content
            extractedLicenseContent += `Package: ${packageJson.name}\n`;
            extractedLicenseContent += `License: ${JSON.stringify(packageJson.license, null, 2)}\n`;
            extractedLicenseContent += `\n${licenseText}\n`;
            extractedLicenseContent += EXTRACTION_FILE_SEPARATOR;
        }
    }
    return extractedLicenseContent;
}
exports.extractLicenses = extractLicenses;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGljZW5zZS1leHRyYWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvbGljZW5zZS1leHRyYWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBR0gsK0NBQTRDO0FBQzVDLDBEQUE2QjtBQUU3Qjs7R0FFRztBQUNILE1BQU0sbUJBQW1CLEdBQUcsY0FBYyxDQUFDO0FBRTNDOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQztBQUU5Qzs7R0FFRztBQUNILE1BQU0sYUFBYSxHQUFHLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUUvRDs7R0FFRztBQUNILE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0FBRWxDOztHQUVHO0FBQ0gsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUV4RDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSSxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWtCLEVBQUUsYUFBcUI7SUFDN0UsSUFBSSx1QkFBdUIsR0FBRyxHQUFHLHNCQUFzQixLQUFLLHlCQUF5QixFQUFFLENBQUM7SUFFeEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUNwQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBRXZDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDbkQsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLEVBQUUsYUFBYSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxD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VUFBVSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7b0JBQzVFLDREQUE0RDtvQkFDNUQsdUJBQXVCO2lCQUN4QjtxQkFBTTtvQkFDTCxpQkFBaUIsR0FBRyxtQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUNuRSxJQUFJO3dCQUNGLFdBQVcsR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDekQsTUFBTTtxQkFDUDtvQkFBQyxNQUFNLEdBQUU7aUJBQ1g7YUFDRjtpQkFBTTtnQkFDTCwyREFBMkQ7Z0JBQzNELEtBQUssTUFBTSxnQkFBZ0IsSUFBSSxhQUFhLEVBQUU7b0JBQzVDLE1BQU0sa0JBQWtCLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDekUsSUFBSTt3QkFDRixXQUFXLEdBQUcsTUFBTSxJQUFBLG1CQUFRLEVBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQzFELE1BQU07cUJBQ1A7b0JBQUMsTUFBTSxHQUFFO2lCQUNYO2FBQ0Y7WUFFRCw2REFBNkQ7WUFDN0QsdUJBQXVCLElBQUksWUFBWSxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDNUQsdUJBQXVCLElBQUksWUFBWSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDeEYsdUJBQXVCLElBQUksS0FBSyxXQUFXLElBQUksQ0FBQztZQUNoRCx1QkFBdUIsSUFBSSx5QkFBeUIsQ0FBQztTQUN0RDtLQUNGO0lBRUQsT0FBTyx1QkFBdUIsQ0FBQztBQUNqQyxDQUFDO0FBakhELDBDQWlIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE1ldGFmaWxlIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuLyoqXG4gKiBUaGUgcGF0aCBzZWdtZW50IHVzZWQgdG8gc2lnbmlmeSB0aGF0IGEgZmlsZSBpcyBwYXJ0IG9mIGEgcGFja2FnZS5cbiAqL1xuY29uc3QgTk9ERV9NT0RVTEVfU0VHTUVOVCA9ICdub2RlX21vZHVsZXMnO1xuXG4vKipcbiAqIFN0cmluZyBjb25zdGFudCBmb3IgdGhlIE5QTSByZWNvbW1lbmRlZCBjdXN0b20gbGljZW5zZSB3b3JkaW5nLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9kb2NzLm5wbWpzLmNvbS9jbGkvdjkvY29uZmlndXJpbmctbnBtL3BhY2thZ2UtanNvbiNsaWNlbnNlXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICoge1xuICogICBcImxpY2Vuc2VcIiA6IFwiU0VFIExJQ0VOU0UgSU4gPGZpbGVuYW1lPlwiXG4gKiB9XG4gKiBgYGBcbiAqL1xuY29uc3QgQ1VTVE9NX0xJQ0VOU0VfVEVYVCA9ICdTRUUgTElDRU5TRSBJTiAnO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBjb21tb25seSBuYW1lZCBsaWNlbnNlIGZpbGVzIGZvdW5kIHdpdGhpbiBwYWNrYWdlcy5cbiAqL1xuY29uc3QgTElDRU5TRV9GSUxFUyA9IFsnTElDRU5TRScsICdMSUNFTlNFLnR4dCcsICdMSUNFTlNFLm1kJ107XG5cbi8qKlxuICogSGVhZGVyIHRleHQgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSB0b3Agb2YgdGhlIG91dHB1dCBsaWNlbnNlIGV4dHJhY3Rpb24gZmlsZS5cbiAqL1xuY29uc3QgRVhUUkFDVElPTl9GSUxFX0hFQURFUiA9ICcnO1xuXG4vKipcbiAqIFRoZSBwYWNrYWdlIGVudHJ5IHNlcGFyYXRvciB0byB1c2Ugd2l0aGluIHRoZSBvdXRwdXQgbGljZW5zZSBleHRyYWN0aW9uIGZpbGUuXG4gKi9cbmNvbnN0IEVYVFJBQ1RJT05fRklMRV9TRVBBUkFUT1IgPSAnLScucmVwZWF0KDgwKSArICdcXG4nO1xuXG4vKipcbiAqIEV4dHJhY3RzIGxpY2Vuc2UgaW5mb3JtYXRpb24gZm9yIGVhY2ggbm9kZSBtb2R1bGUgcGFja2FnZSBpbmNsdWRlZCBpbiB0aGUgb3V0cHV0XG4gKiBmaWxlcyBvZiB0aGUgYnVpbHQgY29kZS4gVGhpcyBpbmNsdWRlcyBKYXZhU2NyaXB0IGFuZCBDU1Mgb3V0cHV0IGZpbGVzLiBUaGUgZXNidWlsZFxuICogbWV0YWZpbGUgZ2VuZXJhdGVkIGR1cmluZyB0aGUgYnVuZGxpbmcgc3RlcHMgaXMgdXNlZCBhcyB0aGUgc291cmNlIG9mIGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgd2hhdCBpbnB1dCBmaWxlcyB3aGVyZSBpbmNsdWRlZCBhbmQgd2hlcmUgdGhleSBhcmUgbG9jYXRlZC4gQSBwYXRoIHNlZ21lbnRcbiAqIG9mIGBub2RlX21vZHVsZXNgIGlzIHVzZWQgdG8gaW5kaWNhdGUgdGhhdCBhIGZpbGUgYmVsb25ncyB0byBhIHBhY2thZ2UgYW5kIGl0cyBsaWNlbnNlXG4gKiBzaG91bGQgYmUgaW5jbHVkZSBpbiB0aGUgb3V0cHV0IGxpY2Vuc2VzIGZpbGUuXG4gKlxuICogVGhlIHBhY2thZ2UgbmFtZSBhbmQgbGljZW5zZSBmaWVsZCBhcmUgZXh0cmFjdGVkIGZyb20gdGhlIGBwYWNrYWdlLmpzb25gIGZpbGUgZm9yIHRoZVxuICogcGFja2FnZS4gSWYgYSBsaWNlbnNlIGZpbGUgKGUuZy4sIGBMSUNFTlNFYCkgaXMgcHJlc2VudCBpbiB0aGUgcm9vdCBvZiB0aGUgcGFja2FnZSwgaXRcbiAqIHdpbGwgYWxzbyBiZSBpbmNsdWRlZCBpbiB0aGUgb3V0cHV0IGxpY2Vuc2VzIGZpbGUuXG4gKlxuICogQHBhcmFtIG1ldGFmaWxlIEFuIGVzYnVpbGQgbWV0YWZpbGUgb2JqZWN0LlxuICogQHBhcmFtIHJvb3REaXJlY3RvcnkgVGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoZSB3b3Jrc3BhY2UuXG4gKiBAcmV0dXJucyBBIHN0cmluZyBjb250YWluaW5nIHRoZSBjb250ZW50IG9mIHRoZSBvdXRwdXQgbGljZW5zZXMgZmlsZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RMaWNlbnNlcyhtZXRhZmlsZTogTWV0YWZpbGUsIHJvb3REaXJlY3Rvcnk6IHN0cmluZykge1xuICBsZXQgZXh0cmFjdGVkTGljZW5zZUNvbnRlbnQgPSBgJHtFWFRSQUNUSU9OX0ZJTEVfSEVBREVSfVxcbiR7RVhUUkFDVElPTl9GSUxFX1NFUEFSQVRPUn1gO1xuXG4gIGNvbnN0IHNlZW5QYXRocyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzZWVuUGFja2FnZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIE9iamVjdC52YWx1ZXMobWV0YWZpbGUub3V0cHV0cykpIHtcbiAgICBmb3IgKGNvbnN0IFtpbnB1dFBhdGgsIHsgYnl0ZXNJbk91dHB1dCB9XSBvZiBPYmplY3QuZW50cmllcyhlbnRyeS5pbnB1dHMpKSB7XG4gICAgICAvLyBTa2lwIGlmIG5vdCBpbmNsdWRlZCBpbiBvdXRwdXRcbiAgICAgIGlmIChieXRlc0luT3V0cHV0IDw9IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgYWxyZWFkeSBwcm9jZXNzZWQgcGF0aHNcbiAgICAgIGlmIChzZWVuUGF0aHMuaGFzKGlucHV0UGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuUGF0aHMuYWRkKGlucHV0UGF0aCk7XG5cbiAgICAgIC8vIFNraXAgbm9uLXBhY2thZ2UgcGF0aHNcbiAgICAgIGlmICghaW5wdXRQYXRoLmluY2x1ZGVzKE5PREVfTU9EVUxFX1NFR01FTlQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBFeHRyYWN0IHRoZSBwYWNrYWdlIG5hbWUgZnJvbSB0aGUgcGF0aFxuICAgICAgbGV0IGJhc2VEaXJlY3RvcnkgPSBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgaW5wdXRQYXRoKTtcbiAgICAgIGxldCBuYW1lT3JTY29wZSwgbmFtZU9yRmlsZTtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKGJhc2VEaXJlY3RvcnkgIT09IHBhdGguZGlybmFtZShiYXNlRGlyZWN0b3J5KSkge1xuICAgICAgICBjb25zdCBzZWdtZW50ID0gcGF0aC5iYXNlbmFtZShiYXNlRGlyZWN0b3J5KTtcbiAgICAgICAgaWYgKHNlZ21lbnQgPT09IE5PREVfTU9EVUxFX1NFR01FTlQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBuYW1lT3JGaWxlID0gbmFtZU9yU2NvcGU7XG4gICAgICAgIG5hbWVPclNjb3BlID0gc2VnbWVudDtcbiAgICAgICAgYmFzZURpcmVjdG9yeSA9IHBhdGguZGlybmFtZShiYXNlRGlyZWN0b3J5KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBub24tcGFja2FnZSBwYXRoIGVkZ2UgY2FzZXMgdGhhdCBhcmUgbm90IGNhdWdodCBpbiB0aGUgaW5jbHVkZXMgY2hlY2sgYWJvdmVcbiAgICAgIGlmICghZm91bmQgfHwgIW5hbWVPclNjb3BlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IG5hbWVPclNjb3BlLnN0YXJ0c1dpdGgoJ0AnKVxuICAgICAgICA/IGAke25hbWVPclNjb3BlfS8ke25hbWVPckZpbGV9YFxuICAgICAgICA6IG5hbWVPclNjb3BlO1xuICAgICAgY29uc3QgcGFja2FnZURpcmVjdG9yeSA9IHBhdGguam9pbihiYXNlRGlyZWN0b3J5LCBwYWNrYWdlTmFtZSk7XG5cbiAgICAgIC8vIExvYWQgdGhlIHBhY2thZ2UncyBtZXRhZGF0YSB0byBmaW5kIHRoZSBwYWNrYWdlJ3MgbmFtZSwgdmVyc2lvbiwgYW5kIGxpY2Vuc2UgdHlwZVxuICAgICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gcGF0aC5qb2luKHBhY2thZ2VEaXJlY3RvcnksICdwYWNrYWdlLmpzb24nKTtcbiAgICAgIGxldCBwYWNrYWdlSnNvbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShhd2FpdCByZWFkRmlsZShwYWNrYWdlSnNvblBhdGgsICd1dGYtOCcpKSBhcyB7XG4gICAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICAgIHZlcnNpb246IHN0cmluZztcbiAgICAgICAgICAvLyBUaGUgb2JqZWN0IGZvcm0gaXMgZGVwcmVjYXRlZCBhbmQgc2hvdWxkIG9ubHkgYmUgcHJlc2VudCBpbiBvbGQgcGFja2FnZXNcbiAgICAgICAgICBsaWNlbnNlPzogc3RyaW5nIHwgeyB0eXBlOiBzdHJpbmcgfTtcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBJbnZhbGlkIHBhY2thZ2VcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgYWxyZWFkeSBwcm9jZXNzZWQgcGFja2FnZXNcbiAgICAgIGNvbnN0IHBhY2thZ2VJZCA9IGAke3BhY2thZ2VOYW1lfUAke3BhY2thZ2VKc29uLnZlcnNpb259YDtcbiAgICAgIGlmIChzZWVuUGFja2FnZXMuaGFzKHBhY2thZ2VJZCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuUGFja2FnZXMuYWRkKHBhY2thZ2VJZCk7XG5cbiAgICAgIC8vIEF0dGVtcHQgdG8gZmluZCBsaWNlbnNlIHRleHQgaW5zaWRlIHBhY2thZ2VcbiAgICAgIGxldCBsaWNlbnNlVGV4dCA9ICcnO1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgcGFja2FnZUpzb24ubGljZW5zZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgcGFja2FnZUpzb24ubGljZW5zZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoQ1VTVE9NX0xJQ0VOU0VfVEVYVClcbiAgICAgICkge1xuICAgICAgICAvLyBBdHRlbXB0IHRvIGxvYWQgdGhlIHBhY2thZ2UncyBjdXN0b20gbGljZW5zZVxuICAgICAgICBsZXQgY3VzdG9tTGljZW5zZVBhdGg7XG4gICAgICAgIGNvbnN0IGN1c3RvbUxpY2Vuc2VGaWxlID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgcGFja2FnZUpzb24ubGljZW5zZS5zbGljZShDVVNUT01fTElDRU5TRV9URVhULmxlbmd0aCArIDEpLnRyaW0oKSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGN1c3RvbUxpY2Vuc2VGaWxlLnN0YXJ0c1dpdGgoJy4uJykgfHwgcGF0aC5pc0Fic29sdXRlKGN1c3RvbUxpY2Vuc2VGaWxlKSkge1xuICAgICAgICAgIC8vIFBhdGggaXMgYXR0ZW1wdGluZyB0byBhY2Nlc3MgZmlsZXMgb3V0c2lkZSBvZiB0aGUgcGFja2FnZVxuICAgICAgICAgIC8vIFRPRE86IElzc3VlIHdhcm5pbmc/XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VzdG9tTGljZW5zZVBhdGggPSBwYXRoLmpvaW4ocGFja2FnZURpcmVjdG9yeSwgY3VzdG9tTGljZW5zZUZpbGUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsaWNlbnNlVGV4dCA9IGF3YWl0IHJlYWRGaWxlKGN1c3RvbUxpY2Vuc2VQYXRoLCAndXRmLTgnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2VhcmNoIGZvciBhIGxpY2Vuc2UgZmlsZSB3aXRoaW4gdGhlIHJvb3Qgb2YgdGhlIHBhY2thZ2VcbiAgICAgICAgZm9yIChjb25zdCBwb3RlbnRpYWxMaWNlbnNlIG9mIExJQ0VOU0VfRklMRVMpIHtcbiAgICAgICAgICBjb25zdCBwYWNrYWdlTGljZW5zZVBhdGggPSBwYXRoLmpvaW4ocGFja2FnZURpcmVjdG9yeSwgcG90ZW50aWFsTGljZW5zZSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxpY2Vuc2VUZXh0ID0gYXdhaXQgcmVhZEZpbGUocGFja2FnZUxpY2Vuc2VQYXRoLCAndXRmLTgnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSB0aGUgcGFja2FnZSdzIGxpY2Vuc2UgZW50cnkgaW4gdGhlIG91dHB1dCBjb250ZW50XG4gICAgICBleHRyYWN0ZWRMaWNlbnNlQ29udGVudCArPSBgUGFja2FnZTogJHtwYWNrYWdlSnNvbi5uYW1lfVxcbmA7XG4gICAgICBleHRyYWN0ZWRMaWNlbnNlQ29udGVudCArPSBgTGljZW5zZTogJHtKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbi5saWNlbnNlLCBudWxsLCAyKX1cXG5gO1xuICAgICAgZXh0cmFjdGVkTGljZW5zZUNvbnRlbnQgKz0gYFxcbiR7bGljZW5zZVRleHR9XFxuYDtcbiAgICAgIGV4dHJhY3RlZExpY2Vuc2VDb250ZW50ICs9IEVYVFJBQ1RJT05fRklMRV9TRVBBUkFUT1I7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGV4dHJhY3RlZExpY2Vuc2VDb250ZW50O1xufVxuIl19
"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCompatibleAngularVersion = void 0;
/* eslint-disable no-console */
const core_1 = require("@angular-devkit/core");
const semver_1 = require("semver");
function assertCompatibleAngularVersion(projectRoot) {
    let angularCliPkgJson;
    let angularPkgJson;
    const resolveOptions = { paths: [projectRoot] };
    try {
        const angularPackagePath = require.resolve('@angular/core/package.json', resolveOptions);
        angularPkgJson = require(angularPackagePath);
    }
    catch {
        console.error(core_1.tags.stripIndents `
      You seem to not be depending on "@angular/core". This is an error.
    `);
        process.exit(2);
    }
    if (!(angularPkgJson && angularPkgJson['version'])) {
        console.error(core_1.tags.stripIndents `
      Cannot determine versions of "@angular/core".
      This likely means your local installation is broken. Please reinstall your packages.
    `);
        process.exit(2);
    }
    try {
        const angularCliPkgPath = require.resolve('@angular/cli/package.json', resolveOptions);
        angularCliPkgJson = require(angularCliPkgPath);
        if (!(angularCliPkgJson && angularCliPkgJson['version'])) {
            return;
        }
    }
    catch {
        // Not using @angular-devkit/build-angular with @angular/cli is ok too.
        // In this case we don't provide as many version checks.
        return;
    }
    if (angularCliPkgJson['version'] === '0.0.0' || angularPkgJson['version'] === '0.0.0') {
        // Internal CLI testing version or integration testing in the angular/angular
        // repository with the generated development @angular/core npm package which is versioned "0.0.0".
        return;
    }
    const supportedAngularSemver = require('../../package.json')['peerDependencies']['@angular/compiler-cli'];
    const angularVersion = new semver_1.SemVer(angularPkgJson['version']);
    // todo: remove this before committing
    // if (!satisfies(angularVersion, supportedAngularSemver, { includePrerelease: true })) {
    //   console.error(
    //     tags.stripIndents`
    //       This version of CLI is only compatible with Angular versions ${supportedAngularSemver},
    //       but Angular version ${angularVersion} was found instead.
    //
    //       Please visit the link below to find instructions on how to update Angular.
    //       https://update.angular.io/
    //     ` + '\n',
    //   );
    //
    //   process.exit(3);
    // }
}
exports.assertCompatibleAngularVersion = assertCompatibleAngularVersion;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3ZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQStCO0FBRS9CLCtDQUE0QztBQUM1QyxtQ0FBMkM7QUFFM0MsU0FBZ0IsOEJBQThCLENBQUMsV0FBbUI7SUFDaEUsSUFBSSxpQkFBaUIsQ0FBQztJQUN0QixJQUFJLGNBQWMsQ0FBQztJQUNuQixNQUFNLGNBQWMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7SUFFaEQsSUFBSTtRQUNGLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV6RixjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7S0FDOUM7SUFBQyxNQUFNO1FBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFJLENBQUMsWUFBWSxDQUFBOztLQUU5QixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pCO0lBRUQsSUFBSSxDQUFDLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO1FBQ2xELE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBSSxDQUFDLFlBQVksQ0FBQTs7O0tBRzlCLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakI7SUFFRCxJQUFJO1FBQ0YsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZGLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxDQUFDLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7WUFDeEQsT0FBTztTQUNSO0tBQ0Y7SUFBQyxNQUFNO1FBQ04sdUVBQXVFO1FBQ3ZFLHdEQUF3RDtRQUN4RCxPQUFPO0tBQ1I7SUFFRCxJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssT0FBTyxFQUFFO1FBQ3JGLDZFQUE2RTtRQUM3RSxrR0FBa0c7UUFDbEcsT0FBTztLQUNSO0lBRUQsTUFBTSxzQkFBc0IsR0FDMUIsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sY0FBYyxHQUFHLElBQUksZUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRTdELHNDQUFzQztJQUN0Qyx5RkFBeUY7SUFDekYsbUJBQW1CO0lBQ25CLHlCQUF5QjtJQUN6QixnR0FBZ0c7SUFDaEcsaUVBQWlFO0lBQ2pFLEVBQUU7SUFDRixtRkFBbUY7SUFDbkYsbUNBQW1DO0lBQ25DLGdCQUFnQjtJQUNoQixPQUFPO0lBQ1AsRUFBRTtJQUNGLHFCQUFxQjtJQUNyQixJQUFJO0FBQ04sQ0FBQztBQTlERCx3RUE4REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU2VtVmVyLCBzYXRpc2ZpZXMgfSBmcm9tICdzZW12ZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Q29tcGF0aWJsZUFuZ3VsYXJWZXJzaW9uKHByb2plY3RSb290OiBzdHJpbmcpOiB2b2lkIHwgbmV2ZXIge1xuICBsZXQgYW5ndWxhckNsaVBrZ0pzb247XG4gIGxldCBhbmd1bGFyUGtnSnNvbjtcbiAgY29uc3QgcmVzb2x2ZU9wdGlvbnMgPSB7IHBhdGhzOiBbcHJvamVjdFJvb3RdIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBhbmd1bGFyUGFja2FnZVBhdGggPSByZXF1aXJlLnJlc29sdmUoJ0Bhbmd1bGFyL2NvcmUvcGFja2FnZS5qc29uJywgcmVzb2x2ZU9wdGlvbnMpO1xuXG4gICAgYW5ndWxhclBrZ0pzb24gPSByZXF1aXJlKGFuZ3VsYXJQYWNrYWdlUGF0aCk7XG4gIH0gY2F0Y2gge1xuICAgIGNvbnNvbGUuZXJyb3IodGFncy5zdHJpcEluZGVudHNgXG4gICAgICBZb3Ugc2VlbSB0byBub3QgYmUgZGVwZW5kaW5nIG9uIFwiQGFuZ3VsYXIvY29yZVwiLiBUaGlzIGlzIGFuIGVycm9yLlxuICAgIGApO1xuXG4gICAgcHJvY2Vzcy5leGl0KDIpO1xuICB9XG5cbiAgaWYgKCEoYW5ndWxhclBrZ0pzb24gJiYgYW5ndWxhclBrZ0pzb25bJ3ZlcnNpb24nXSkpIHtcbiAgICBjb25zb2xlLmVycm9yKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgQ2Fubm90IGRldGVybWluZSB2ZXJzaW9ucyBvZiBcIkBhbmd1bGFyL2NvcmVcIi5cbiAgICAgIFRoaXMgbGlrZWx5IG1lYW5zIHlvdXIgbG9jYWwgaW5zdGFsbGF0aW9uIGlzIGJyb2tlbi4gUGxlYXNlIHJlaW5zdGFsbCB5b3VyIHBhY2thZ2VzLlxuICAgIGApO1xuXG4gICAgcHJvY2Vzcy5leGl0KDIpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBhbmd1bGFyQ2xpUGtnUGF0aCA9IHJlcXVpcmUucmVzb2x2ZSgnQGFuZ3VsYXIvY2xpL3BhY2thZ2UuanNvbicsIHJlc29sdmVPcHRpb25zKTtcbiAgICBhbmd1bGFyQ2xpUGtnSnNvbiA9IHJlcXVpcmUoYW5ndWxhckNsaVBrZ1BhdGgpO1xuICAgIGlmICghKGFuZ3VsYXJDbGlQa2dKc29uICYmIGFuZ3VsYXJDbGlQa2dKc29uWyd2ZXJzaW9uJ10pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBOb3QgdXNpbmcgQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXIgd2l0aCBAYW5ndWxhci9jbGkgaXMgb2sgdG9vLlxuICAgIC8vIEluIHRoaXMgY2FzZSB3ZSBkb24ndCBwcm92aWRlIGFzIG1hbnkgdmVyc2lvbiBjaGVja3MuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGFuZ3VsYXJDbGlQa2dKc29uWyd2ZXJzaW9uJ10gPT09ICcwLjAuMCcgfHwgYW5ndWxhclBrZ0pzb25bJ3ZlcnNpb24nXSA9PT0gJzAuMC4wJykge1xuICAgIC8vIEludGVybmFsIENMSSB0ZXN0aW5nIHZlcnNpb24gb3IgaW50ZWdyYXRpb24gdGVzdGluZyBpbiB0aGUgYW5ndWxhci9hbmd1bGFyXG4gICAgLy8gcmVwb3NpdG9yeSB3aXRoIHRoZSBnZW5lcmF0ZWQgZGV2ZWxvcG1lbnQgQGFuZ3VsYXIvY29yZSBucG0gcGFja2FnZSB3aGljaCBpcyB2ZXJzaW9uZWQgXCIwLjAuMFwiLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHN1cHBvcnRlZEFuZ3VsYXJTZW12ZXIgPVxuICAgIHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UuanNvbicpWydwZWVyRGVwZW5kZW5jaWVzJ11bJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSddO1xuICBjb25zdCBhbmd1bGFyVmVyc2lvbiA9IG5ldyBTZW1WZXIoYW5ndWxhclBrZ0pzb25bJ3ZlcnNpb24nXSk7XG5cbiAgLy8gdG9kbzogcmVtb3ZlIHRoaXMgYmVmb3JlIGNvbW1pdHRpbmdcbiAgLy8gaWYgKCFzYXRpc2ZpZXMoYW5ndWxhclZlcnNpb24sIHN1cHBvcnRlZEFuZ3VsYXJTZW12ZXIsIHsgaW5jbHVkZVByZXJlbGVhc2U6IHRydWUgfSkpIHtcbiAgLy8gICBjb25zb2xlLmVycm9yKFxuICAvLyAgICAgdGFncy5zdHJpcEluZGVudHNgXG4gIC8vICAgICAgIFRoaXMgdmVyc2lvbiBvZiBDTEkgaXMgb25seSBjb21wYXRpYmxlIHdpdGggQW5ndWxhciB2ZXJzaW9ucyAke3N1cHBvcnRlZEFuZ3VsYXJTZW12ZXJ9LFxuICAvLyAgICAgICBidXQgQW5ndWxhciB2ZXJzaW9uICR7YW5ndWxhclZlcnNpb259IHdhcyBmb3VuZCBpbnN0ZWFkLlxuICAvL1xuICAvLyAgICAgICBQbGVhc2UgdmlzaXQgdGhlIGxpbmsgYmVsb3cgdG8gZmluZCBpbnN0cnVjdGlvbnMgb24gaG93IHRvIHVwZGF0ZSBBbmd1bGFyLlxuICAvLyAgICAgICBodHRwczovL3VwZGF0ZS5hbmd1bGFyLmlvL1xuICAvLyAgICAgYCArICdcXG4nLFxuICAvLyAgICk7XG4gIC8vXG4gIC8vICAgcHJvY2Vzcy5leGl0KDMpO1xuICAvLyB9XG59XG4iXX0=
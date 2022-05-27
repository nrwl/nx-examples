const { readdirSync } = require('fs');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const execSync = require('child_process').execSync;

const gitSha = process.env.GITHUB_SHA;
const workspacePath = process.env.GITHUB_WORKSPACE;
const nxHead = process.env.NX_HEAD;
const nxBase = process.env.NX_BASE;

function buildPackages(nxTasks, version) {
  nxTasks.map((task) => buildIndividualPackage(task, version));
}

async function buildIndividualPackage(task, version) {
  const component = task.target.project;
  const versionedComponent = `zonza5-ui-${component}_${version}_all`;
  const targetDirectory = component.replace(/\-/g, '/');

  const srcDir = `${workspacePath}/dist/apps/${targetDirectory}`;
  const destDir = `${workspacePath}/${gitSha}/${versionedComponent}/usr/share/zonza5/web-docs/${targetDirectory}`;

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  // Create Debian resources
  fs.mkdirSync(`${workspacePath}/${gitSha}/${versionedComponent}/DEBIAN`, {
    recursive: true,
  });
  var controlContent = `
      Package: zonza5-ui-${component}
      Version: ${version}
      Architecture: all
      Maintainer: DevOps Hogarth <devops@hogarthww.com>
      Description: Builds the ${component} component for Zonza5
    `;
  controlContent = controlContent.replace(/^\s+/gm, '');

  fs.writeFile(
    `${workspacePath}/${gitSha}/${versionedComponent}/DEBIAN/control`,
    controlContent,
    (err) => {
      if (err) {
        console.log(err);
      }
    },
  );

  fse.copy(srcDir, destDir, { overwrite: true }, function (err) {
    if (err) {
      console.log(err);
    } else {
      execSync(
        `cd ${workspacePath}/${gitSha} ; dpkg -b ${versionedComponent}`,
        { encoding: 'utf-8' },
      );
    }
  });
}

const packageJson = require(`${workspacePath}/package.json`);
const nxAffected = execSync(
  `npx nx print-affected --target=build --base=${nxBase} --head=${nxHead}`,
  { encoding: 'utf-8' },
);

const nxTasks = JSON.parse(nxAffected).tasks;

buildPackages(nxTasks, packageJson.version);

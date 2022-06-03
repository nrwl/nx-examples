import { existsSync } from 'fs';
import * as minimist from 'minimist';
import * as NetlifyClient from 'netlify';
import { join } from 'path';

const token = process.env.NETLIFY_AUTH_TOKEN;

const argv = minimist(process.argv.slice(2));

const netlifyClient = new NetlifyClient(token);
const root = join(__dirname, '../..');
const outDir = join(root, argv.outputPath);

if (!existsSync(outDir)) {
  throw new Error(`${outDir} does not exist`);
}

(async () => {
  try {
    const sites = await netlifyClient.listSites();
    const site = sites.find((s) => argv.siteName === s.name);
    if (!site) {
      throw Error(`Could not find site ${argv.siteName}`);
    }
    console.log(`Deploying ${argv.siteName} to Netlify...`);
    const deployResult = await netlifyClient.deploy(site.id, outDir);
    console.log(
      `\n🚀 New version of ${argv.siteName} is running at ${deployResult.deploy.ssl_url}!\n`
    );
  } catch (e) {
    console.error('Authentication Failure: Invalid Token');
  }
})();

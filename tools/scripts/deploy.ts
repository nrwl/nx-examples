import * as minimist from 'minimist';
import * as NetlifyClient from 'netlify';
import { join } from 'path';

const argv = minimist(process.argv.splice(0, 2));

argv.token = '9277643cafbe349bda440f9f7779ce917c6c8c49d4e55cb47e4271d7a3e55082';
argv.siteName = 'nrwl-nx-examples-cart';
argv.outputPath = 'dist/apps/cart';

const netlifyClient = new NetlifyClient(argv.token);
const outDir = join(__dirname, '../..', argv.outputPath);

(async () => {
  const sites = await netlifyClient.listSites();
  const site = sites.find(s => argv.siteName === s.name);
  if (!site) {
    throw Error(`Could not find site ${argv.siteName}`);
  }
  const deployResult = await netlifyClient.deploy(site.id, outDir);
  console.log(
    `New version of ${argv.siteName} is running at ${deployResult.deploy.url}`
  );
})();

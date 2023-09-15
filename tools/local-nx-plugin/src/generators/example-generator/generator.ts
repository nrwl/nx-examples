import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  joinPathFragments,
  Tree,
} from '@nx/devkit';
import { ExampleGeneratorGeneratorSchema } from './schema';

export async function exampleGeneratorGenerator(
  tree: Tree,
  options: ExampleGeneratorGeneratorSchema
) {
  console.log('>> HELLO FROM GENERATOR <<');

  const projectRoot = `libs/${options.name}`;
  addProjectConfiguration(tree, options.name, {
    root: projectRoot,
    projectType: 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: {},
  });
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    options
  );
  await formatFiles(tree);
}

export default exampleGeneratorGenerator;

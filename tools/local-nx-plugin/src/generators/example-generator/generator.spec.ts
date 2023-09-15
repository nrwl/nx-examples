import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { exampleGeneratorGenerator } from './generator';
import { ExampleGeneratorGeneratorSchema } from './schema';

describe('example-generator generator', () => {
  let tree: Tree;
  const options: ExampleGeneratorGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await exampleGeneratorGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});

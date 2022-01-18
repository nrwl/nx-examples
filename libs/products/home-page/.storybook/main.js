const rootMain = require('../../../../.storybook/main');

module.exports = {
  ...rootMain,

  core: { ...rootMain.core, builder: 'webpack5' },

  stories: [
    ...rootMain.stories,
    '../src/lib/**/*.stories.mdx',
    '../src/lib/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [...rootMain.addons],
  webpackFinal: async (config, { configType }) => {
    // apply any global webpack configs that might have been specified in .storybook/main.js
    if (rootMain.webpackFinal) {
      config = await rootMain.webpackFinal(config, { configType });
    }

    // remove html raw-loader that breaks Jit compilation
    const rules = (config.module.rules ?? []).filter(
      (rule) =>
        rule.test !== /\.html$/ &&
        rule.exclude !== /\.async\.html$/ &&
        !rule.loader?.includes('raw-loader')
    );
    config.module.rules = [...rules];

    // add your own webpack tweaks if needed

    return config;
  },
};

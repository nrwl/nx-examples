const { runExecutor } = require('@nrwl/devkit');
const combine = require('./combine');

module.exports = {
  /**
   * This is executor is what does not work.
   * I cannot run two `runExecutor`s at the same time
   * using the js:serve executor.
   *
   * Observe that APP_1 never emits anything. This is
   * incorrect behavior.
   *
   * Try:
   * - changing the target to `build` - works!
   *
   *
   */
  default: async function* fooExecutor(_options, ctx) {
    const asyncIterators = await Promise.all([
      runExecutor(
        {
          target: 'serve',
          project: 'dummy',
        },
        { args: 'APP_1' },
        ctx
      ),
      runExecutor(
        {
          target: 'serve',
          project: 'dummy',
        },
        { args: 'APP_2' },
        ctx
      ),
    ]);
    for await (const evt of combine(asyncIterators)) {
      yield evt;
    }
    return { success: true };
  },
};

import { CombineLatestExecutorSchema } from './schema';
import { combineAsyncIterables } from '@nx/devkit/src/utils/async-iterable';

import { ExecutorContext, parseTargetString, runExecutor } from '@nx/devkit';

export default async function* combine(
  options: CombineLatestExecutorSchema,
  context: ExecutorContext
) {
  const iterators: AsyncIterable<{ success: boolean }>[] = [];

  // TODO(caleb): can we make the terminal output better?
  for (const t of options.targets) {
    const target = parseTargetString(
      typeof t === 'string' ? t : t.target,
      context.projectGraph
    );

    // TODO(caleb): this emits when each sub dev server emits. need to wait for all to emit before emitting
    iterators.push(
      // TODO(caleb): runExecutor doesn't load env files in each targets root.
      // if runExecutor does load, nx will already load the env from initial project
      await runExecutor(
        target,
        typeof t === 'string' ? {} : t.overrides,
        context
      )
    );
  }

  // @ts-expect-error - need to update type for combineAsyncIterables
  yield* combineAsyncIterables<{ success: boolean }>(...iterators);
}

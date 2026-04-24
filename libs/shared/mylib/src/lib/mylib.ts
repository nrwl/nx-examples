/**
 * Should throw linting error:
 *
 * Projects should use relative imports to import from other files within the same project.
 * Use "./path/to/file" instead of import from "@nx-example/shared/mylib"  @nx/enforce-module-boundaries
 *
 */
const { add } = require('@nx-example/shared/mylib');

export function mylib(): string {
  return add(2, 3).toString();
}

export async function multiplyInMylib(a: number, b: number): Promise<number> {
  const libName = '@nx-example/shared/mylib';
  /**
   * Should throw linting error:
   *
   * Projects should use relative imports to import from other files within the same project.
   * Use "./path/to/file" instead of import from "@nx-example/shared/mylib"  @nx/enforce-module-boundaries
   *
   */
  const { multiply } = await import(libName);
  return multiply(a, b);
}

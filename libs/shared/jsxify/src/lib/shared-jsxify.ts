type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type JSXify<T extends Element> = Partial<
  Omit<T, 'children'> & { children?: unknown[] }
>;

export interface BufferProvider<T> {
  set(key: string, value: T): Promise<void> | void;
  get(key: string): Promise<T | undefined> | T | undefined;
  has(key: string): Promise<boolean> | boolean;
  delete(key: string): Promise<void> | void;
  clear?(): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  entries(): Promise<[string, T][]> | [string, T][];
  size(): Promise<number> | number;
}

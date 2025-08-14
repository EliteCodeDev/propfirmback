export interface BufferProvider<T> {
  set(key: string, value: T): Promise<void> | void;
  get(key: string): Promise<T | undefined> | T | undefined;
  has(key: string): Promise<boolean> | boolean;
  delete(key: string): Promise<void> | void;
  clear?(): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  entries(): Promise<[string, T][]> | [string, T][];
  size(): Promise<number> | number;
  
  // Métodos optimizados para procesamiento paralelo
  getAll(): Promise<Array<{ id: string; value: T }>> | Array<{ id: string; value: T }>;
  filter(predicate: (key: string, value: T) => boolean): Promise<Array<[string, T]>> | Array<[string, T]>;
  isEmpty(): Promise<boolean> | boolean;
  getMultiple(keys: string[]): Promise<Array<T | undefined>> | Array<T | undefined>;
}

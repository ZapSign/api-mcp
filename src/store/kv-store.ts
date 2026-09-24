export interface KvPutOptions {
  readonly ttlSeconds?: number;
}

export interface KvStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KvPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  getJson(key: string): Promise<unknown | null>;
  putJson(key: string, value: unknown, options?: KvPutOptions): Promise<void>;
}

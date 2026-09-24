import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';

import type { KvPutOptions, KvStore } from './kv-store.js';

const KEY_NAMESPACES = [
  { keyPrefix: 'client:', partitionPrefix: 'CLIENT#' },
  { keyPrefix: 'grant:', partitionPrefix: 'CODE#' },
  { keyPrefix: 'token:', partitionPrefix: 'TOKEN#' },
  { keyPrefix: 'csrf:', partitionPrefix: 'CSRF#' },
  { keyPrefix: 'id-oauth-state:', partitionPrefix: 'IDSTATE#' },
  { keyPrefix: 'id-tokens:', partitionPrefix: 'IDTOK#' },
  { keyPrefix: 'id-refresh-lock:', partitionPrefix: 'IDLOCK#' },
  { keyPrefix: 'telemetry:week:', partitionPrefix: 'TELEM#' },
] as const;

type DynamoClient = Pick<DynamoDBClient, 'send'>;

export interface DynamoKvStoreConfig {
  readonly tableName: string;
  readonly region: string;
  readonly client?: DynamoClient;
  readonly now?: () => number;
}

export class UnsupportedKvKeyError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(`Unsupported KV key prefix: ${key}`);
    this.name = 'UnsupportedKvKeyError';
    this.key = key;
  }
}

export class KvJsonSerializationError extends Error {
  constructor() {
    super('KV JSON value is not serializable.');
    this.name = 'KvJsonSerializationError';
  }
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function buildPartitionKey(key: string): Promise<string> {
  const namespace = KEY_NAMESPACES.find(({ keyPrefix }) => key.startsWith(keyPrefix));
  if (!namespace) {
    throw new UnsupportedKvKeyError(key);
  }
  return `${namespace.partitionPrefix}${await hashKey(key)}`;
}

function isExpired(expiresAt: string | undefined, nowEpochSeconds: number): boolean {
  if (expiresAt === undefined) {
    return false;
  }
  const expiration = Number(expiresAt);
  return !Number.isFinite(expiration) || expiration <= nowEpochSeconds;
}

export class DynamoKvStore implements KvStore {
  private readonly client: DynamoClient;
  private readonly tableName: string;
  private readonly now: () => number;

  constructor(config: DynamoKvStoreConfig) {
    this.client = config.client ?? new DynamoDBClient({ region: config.region });
    this.tableName = config.tableName;
    this.now = config.now ?? Date.now;
  }

  async get(key: string): Promise<string | null> {
    const PK = await buildPartitionKey(key);
    const response = await this.client.send(new GetItemCommand({
      TableName: this.tableName,
      Key: { PK: { S: PK } },
      ConsistentRead: true,
    }));
    const value = response.Item?.['value']?.S;
    if (value === undefined) {
      return null;
    }
    const nowEpochSeconds = Math.floor(this.now() / 1_000);
    if (isExpired(response.Item?.['expiresAt']?.N, nowEpochSeconds)) {
      return null;
    }
    return value;
  }

  async put(key: string, value: string, options?: KvPutOptions): Promise<void> {
    const PK = await buildPartitionKey(key);
    const Item = {
      PK: { S: PK },
      value: { S: value },
      ...(options?.ttlSeconds === undefined ? {} : {
        expiresAt: { N: String(Math.floor(this.now() / 1_000) + options.ttlSeconds) },
      }),
    };
    await this.client.send(new PutItemCommand({ TableName: this.tableName, Item }));
  }

  async delete(key: string): Promise<void> {
    const PK = await buildPartitionKey(key);
    await this.client.send(new DeleteItemCommand({
      TableName: this.tableName,
      Key: { PK: { S: PK } },
    }));
  }

  async getJson(key: string): Promise<unknown | null> {
    const value = await this.get(key);
    if (value === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        return null;
      }
      throw error;
    }
  }

  async putJson(key: string, value: unknown, options?: KvPutOptions): Promise<void> {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new KvJsonSerializationError();
    }
    await this.put(key, serialized, options);
  }
}

import { describe, expect, it, vi } from 'vitest';

import { DynamoKvStore } from '../../../src/store/dynamo-kv-store.js';

const TABLE_NAME = 'oauth-store';
const REGION = 'sa-east-1';
const NOW_MS = 1_700_000_000_000;

type CapturedCommand = {
  readonly constructor: { readonly name: string };
  readonly input: unknown;
};

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createStore(response: unknown = {}) {
  const commands: CapturedCommand[] = [];
  const send = vi.fn(async (command: CapturedCommand) => {
    commands.push(command);
    return response;
  });
  const store = new DynamoKvStore({
    tableName: TABLE_NAME,
    region: REGION,
    client: { send },
    now: () => NOW_MS,
  });
  return { commands, send, store };
}

describe('DynamoKvStore key namespaces', () => {
  it.each([
    ['client:app', 'CLIENT#'],
    ['grant:user:grant', 'CODE#'],
    ['token:user:grant:hash', 'TOKEN#'],
    ['csrf:nonce', 'CSRF#'],
    ['id-oauth-state:state', 'IDSTATE#'],
    ['id-tokens:user', 'IDTOK#'],
    ['id-refresh-lock:user', 'IDLOCK#'],
  ])('should map %s to the %s partition', async (key, namespace) => {
    const { commands, store } = createStore();

    await store.delete(key);

    expect(commands).toHaveLength(1);
    expect(commands[0]?.constructor.name).toBe('DeleteItemCommand');
    expect(commands[0]?.input).toEqual({
      TableName: TABLE_NAME,
      Key: { PK: { S: `${namespace}${await sha256(key)}` } },
    });
  });
});

describe('DynamoKvStore values', () => {
  it('should put a value with an application-readable TTL', async () => {
    const { commands, store } = createStore();

    await store.put('csrf:nonce', 'binding', { ttlSeconds: 300 });

    expect(commands[0]?.constructor.name).toBe('PutItemCommand');
    expect(commands[0]?.input).toEqual({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `CSRF#${await sha256('csrf:nonce')}` },
        value: { S: 'binding' },
        expiresAt: { N: '1700000300' },
      },
    });
  });

  it('should omit expiresAt when no TTL is requested', async () => {
    const { commands, store } = createStore();

    await store.put('id-tokens:user', 'encrypted');

    expect(commands[0]?.input).toEqual({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `IDTOK#${await sha256('id-tokens:user')}` },
        value: { S: 'encrypted' },
      },
    });
  });

  it('should return an unexpired value', async () => {
    const { store } = createStore({
      Item: { value: { S: 'stored' }, expiresAt: { N: '1700000001' } },
    });

    await expect(store.get('token:user:grant:hash')).resolves.toBe('stored');
  });

  it('should treat an expired DynamoDB item as absent', async () => {
    const { store } = createStore({
      Item: { value: { S: 'stale' }, expiresAt: { N: '1700000000' } },
    });

    await expect(store.get('token:user:grant:hash')).resolves.toBeNull();
  });

  it('should return null when DynamoDB has no item', async () => {
    const { store } = createStore({});

    await expect(store.get('client:missing')).resolves.toBeNull();
  });
});

describe('DynamoKvStore JSON helpers', () => {
  it('should parse stored JSON', async () => {
    const { store } = createStore({ Item: { value: { S: '{"active":true}' } } });

    await expect(store.getJson<{ readonly active: boolean }>('client:app'))
      .resolves.toEqual({ active: true });
  });

  it('should return null for malformed JSON', async () => {
    const { store } = createStore({ Item: { value: { S: '{invalid' } } });

    await expect(store.getJson('client:app')).resolves.toBeNull();
  });

  it('should serialize JSON through put', async () => {
    const { commands, store } = createStore();

    await store.putJson('grant:user:grant', { approved: true }, { ttlSeconds: 60 });

    expect(commands[0]?.input).toEqual({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `CODE#${await sha256('grant:user:grant')}` },
        value: { S: '{"approved":true}' },
        expiresAt: { N: '1700000060' },
      },
    });
  });
});

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { expect } from 'vitest';
import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config/env.js';
import type { AuthProvider } from '../../src/shared/types/auth.types.js';
import { NOT_NULL, NOW, TABLE_COLUMNS } from './schema.js';
import { POLICIES, RELATIONS, TRIGGERS } from './policies.js';

/*
 * In-memory stand-in for PostgREST + Storage used by the route tests. The API talks to it through the
 * real supabase-js client (only `fetch` is replaced), so query strings, headers and bodies are the
 * ones the real client sends. Row Level Security is emulated with the policies in policies.ts, which
 * mirror the live policies in supabase/migrations. Unknown tables, columns and embeds are rejected like
 * PostgREST does. No network calls, no real data.
 */

export const SUPABASE_URL = 'https://example.supabase.co';
export const PUBLISHABLE_KEY = 'test-publishable-key';
/** Timestamp the fake database writes for updated_at (set by the BEFORE UPDATE triggers). */
export const LATER = '2026-10-08T11:00:00.000000+00:00';

export type Row = Record<string, unknown>;

export interface FakeAccount {
  id: string;
  email: string;
}

/** The database's view of the caller (auth.uid() + the profile row). */
export interface Caller {
  userId: string | null;
  role: string | null;
  /** current_account_allowed(): profile exists and account_status is active or pending. */
  allowed: boolean;
  /** is_admin(): allowed and role = administrator. */
  isAdmin: boolean;
}

export interface RecordedRequest {
  method: string;
  url: URL;
  /** Table name for /rest/v1 requests, `storage:<bucket>` for storage requests. */
  target: string;
  authorization: string | null;
  apikey: string | null;
  prefer: string | null;
  body: unknown;
}

export interface PgErrorBody {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
}

type Failure = { status: number; body: unknown } | 'network';
interface FailureRule {
  target?: string;
  method?: string;
  failure: Failure;
}

function pgError(code: string, message: string): PgErrorBody {
  return { code, message, details: null, hint: null };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

class PgFailure extends Error {
  constructor(
    readonly status: number,
    readonly body: PgErrorBody,
  ) {
    super(body.message);
  }
}

/** Splits on commas that are not inside parentheses or double quotes. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = '';
  for (const char of input) {
    if (char === '"') quoted = !quoted;
    if (!quoted && char === '(') depth += 1;
    if (!quoted && char === ')') depth -= 1;
    if (!quoted && depth === 0 && char === ',') {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current !== '') parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

type SelectItem =
  | { kind: 'all' }
  | { kind: 'column'; key: string; column: string }
  | { kind: 'embed'; key: string; table: string; items: SelectItem[] };

function parseSelect(select: string): SelectItem[] {
  return splitTopLevel(select).map((item): SelectItem => {
    if (item === '*') return { kind: 'all' };
    const open = item.indexOf('(');
    if (open !== -1 && item.endsWith(')')) {
      const head = item.slice(0, open);
      const [alias, target] = head.includes(':') ? (head.split(':') as [string, string]) : [undefined, head];
      const table = target.split('!')[0] ?? target;
      return { kind: 'embed', key: alias ?? table, table, items: parseSelect(item.slice(open + 1, -1)) };
    }
    const [alias, column] = item.includes(':') ? (item.split(':') as [string, string]) : [item, item];
    return { kind: 'column', key: alias, column };
  });
}

function unquote(value: string): string {
  return value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

function compare(a: unknown, b: string): number {
  const left = typeof a === 'number' ? a : Number(a);
  const right = Number(b);
  if (typeof a !== 'boolean' && a !== null && a !== '' && !Number.isNaN(left) && !Number.isNaN(right) && b.trim() !== '') {
    return left - right;
  }
  return String(a).localeCompare(b);
}

function likeToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*').replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function matchesCondition(row: Row, column: string, expression: string, table: string): boolean {
  if (!(column in (TABLE_COLUMNS[table] ?? {}))) {
    throw new PgFailure(400, pgError('42703', `column ${table}.${column} does not exist`));
  }
  const negate = expression.startsWith('not.');
  const body = negate ? expression.slice(4) : expression;
  const dot = body.indexOf('.');
  const operator = body.slice(0, dot);
  const raw = body.slice(dot + 1);
  const value = row[column];
  let result: boolean;
  switch (operator) {
    case 'eq':
      result = value !== null && value !== undefined && String(value) === unquote(raw);
      break;
    case 'neq':
      result = value !== null && value !== undefined && String(value) !== unquote(raw);
      break;
    case 'gt':
      result = value !== null && compare(value, raw) > 0;
      break;
    case 'gte':
      result = value !== null && compare(value, raw) >= 0;
      break;
    case 'lt':
      result = value !== null && compare(value, raw) < 0;
      break;
    case 'lte':
      result = value !== null && compare(value, raw) <= 0;
      break;
    case 'in': {
      const values = splitTopLevel(raw.slice(1, -1)).map(unquote);
      result = value !== null && value !== undefined && values.includes(String(value));
      break;
    }
    case 'is':
      result = raw === 'null' ? value === null || value === undefined : String(value) === raw;
      break;
    case 'ilike':
    case 'like':
      result = typeof value === 'string' && likeToRegExp(unquote(raw)).test(value);
      break;
    default:
      throw new PgFailure(400, pgError('PGRST100', `unsupported operator ${operator}`));
  }
  return negate ? !result : result;
}

const RESERVED_PARAMS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

function applyFilters(rows: Row[], url: URL, table: string): Row[] {
  let result = rows;
  for (const [key, expression] of url.searchParams.entries()) {
    if (RESERVED_PARAMS.has(key)) continue;
    if (key === 'or') {
      const conditions = splitTopLevel(expression.slice(1, -1)).map((condition) => {
        const dot = condition.indexOf('.');
        return { column: condition.slice(0, dot), expression: condition.slice(dot + 1) };
      });
      result = result.filter((row) => conditions.some((c) => matchesCondition(row, c.column, c.expression, table)));
      continue;
    }
    result = result.filter((row) => matchesCondition(row, key, expression, table));
  }
  return result;
}

function applyOrder(rows: Row[], order: string | null, table: string): Row[] {
  if (order === null) return rows;
  const keys = order.split(',').map((part) => {
    const [column = '', direction = 'asc'] = part.split('.');
    if (!(column in (TABLE_COLUMNS[table] ?? {}))) {
      throw new PgFailure(400, pgError('42703', `column ${table}.${column} does not exist`));
    }
    return { column, descending: direction === 'desc' };
  });
  return [...rows].sort((a, b) => {
    for (const { column, descending } of keys) {
      const left = a[column];
      const right = b[column];
      if (left === right) continue;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      const diff = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
      if (diff !== 0) return descending ? -diff : diff;
    }
    return 0;
  });
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  requests: RecordedRequest[] = [];
  private failures: FailureRule[] = [];

  constructor(private readonly accounts: Record<string, FakeAccount>) {
    this.reset({});
  }

  /** Replaces all data. Missing columns get their database defaults. */
  reset(seed: Record<string, Row[]>): void {
    this.tables = {};
    for (const table of Object.keys(TABLE_COLUMNS)) this.tables[table] = [];
    for (const [table, rows] of Object.entries(seed)) {
      for (const row of rows) this.seed(table, row);
    }
    this.requests = [];
    this.failures = [];
  }

  /** Adds a row directly (no RLS), filling defaults. */
  seed(table: string, partial: Row): Row {
    const row = this.withDefaults(table, partial);
    this.rows(table).push(row);
    return row;
  }

  rows(table: string): Row[] {
    const rows = this.tables[table];
    if (rows === undefined) throw new Error(`Unknown table ${table}`);
    return rows;
  }

  find(table: string, predicate: (row: Row) => boolean): Row | undefined {
    return this.rows(table).find(predicate);
  }

  /** Makes the next matching request fail with this response (or a network error). */
  failNext(failure: Failure, match: { target?: string; method?: string } = {}): void {
    this.failures.push({ ...match, failure });
  }

  requestsTo(target: string, method?: string): RecordedRequest[] {
    return this.requests.filter((r) => r.target === target && (method === undefined || r.method === method));
  }

  readonly authProvider: AuthProvider = {
    getUser: async (token) => {
      const account = this.accounts[token];
      return account === undefined ? null : { id: account.id, email: account.email };
    },
    getProfile: async (userId, token) => {
      const account = this.accounts[token];
      if (account === undefined || account.id !== userId) return null;
      const profile = this.find('profiles', (row) => row.id === userId);
      if (profile === undefined) return null;
      return {
        role: profile.role as never,
        accountStatus: profile.account_status as never,
      };
    },
  };

  readonly createUserClient = (accessToken: string): SupabaseClient =>
    createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: this.fetch, headers: { Authorization: `Bearer ${accessToken}` } },
    });

  /** Builds the app with the fake auth provider and Supabase client. */
  async buildApp(): Promise<FastifyInstance> {
    const app = await buildApp(loadConfig(), { authProvider: this.authProvider, createUserClient: this.createUserClient });
    await app.ready();
    return app;
  }

  callerFor(authorization: string | null): Caller {
    const token = authorization?.replace(/^Bearer /, '') ?? '';
    const account = this.accounts[token];
    if (account === undefined) return { userId: null, role: null, allowed: false, isAdmin: false };
    const profile = this.find('profiles', (row) => row.id === account.id);
    const allowed = profile !== undefined && (profile.account_status === 'active' || profile.account_status === 'pending');
    const role = (profile?.role as string | undefined) ?? null;
    return { userId: account.id, role, allowed, isAdmin: allowed && role === 'administrator' };
  }

  private withDefaults(table: string, partial: Row): Row {
    const columns = TABLE_COLUMNS[table];
    if (columns === undefined) throw new PgFailure(404, pgError('PGRST205', `Could not find the table 'public.${table}'`));
    for (const key of Object.keys(partial)) {
      if (!(key in columns)) {
        throw new PgFailure(400, pgError('PGRST204', `Could not find the '${key}' column of '${table}' in the schema cache`));
      }
    }
    const row: Row = {};
    for (const [column, makeDefault] of Object.entries(columns)) {
      row[column] = column in partial ? partial[column] : makeDefault === null ? null : makeDefault();
    }
    for (const column of NOT_NULL[table] ?? []) {
      if (row[column] === null || row[column] === undefined) {
        throw new PgFailure(400, pgError('23502', `null value in column "${column}" of relation "${table}" violates not-null constraint`));
      }
    }
    return row;
  }

  private canSelect(table: string, row: Row, caller: Caller): boolean {
    const policy = POLICIES[table];
    if (policy === undefined || caller.userId === null || !caller.allowed) return false;
    return policy.select?.(row, caller, this) ?? false;
  }

  private project(table: string, row: Row, items: SelectItem[], caller: Caller): Row {
    const result: Row = {};
    for (const item of items) {
      if (item.kind === 'all') {
        Object.assign(result, row);
      } else if (item.kind === 'column') {
        if (!(item.column in row)) throw new PgFailure(400, pgError('42703', `column ${table}.${item.column} does not exist`));
        result[item.key] = row[item.column];
      } else {
        const relation = RELATIONS[table]?.[item.table];
        if (relation === undefined) {
          throw new PgFailure(400, pgError('PGRST200', `Could not find a relationship between '${table}' and '${item.table}'`));
        }
        const related = this.rows(item.table).filter(
          (candidate) =>
            row[relation.local] !== null && candidate[relation.foreign] === row[relation.local] && this.canSelect(item.table, candidate, caller),
        );
        const projected = related.map((candidate) => this.project(item.table, candidate, item.items, caller));
        result[item.key] = relation.many ? projected : (projected[0] ?? null);
      }
    }
    return result;
  }

  readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const headers = new Headers(init?.headers);
    const method = (init?.method ?? 'GET').toUpperCase();
    const rawBody = typeof init?.body === 'string' ? init.body : undefined;
    const isStorage = url.pathname.startsWith('/storage/v1/');
    const target = isStorage
      ? `storage:${url.pathname.replace('/storage/v1/object/sign/', '').split('/')[0] ?? ''}`
      : url.pathname.replace('/rest/v1/', '');
    const recorded: RecordedRequest = {
      method,
      url,
      target,
      authorization: headers.get('authorization'),
      apikey: headers.get('apikey'),
      prefer: headers.get('prefer'),
      body: rawBody === undefined ? undefined : (JSON.parse(rawBody) as unknown),
    };
    this.requests.push(recorded);

    const ruleIndex = this.failures.findIndex(
      (rule) => (rule.target === undefined || rule.target === target) && (rule.method === undefined || rule.method === method),
    );
    if (ruleIndex !== -1) {
      const [rule] = this.failures.splice(ruleIndex, 1);
      if (rule?.failure === 'network') throw new TypeError('fetch failed');
      if (rule !== undefined) return json(rule.failure.status, rule.failure.body);
    }

    const caller = this.callerFor(recorded.authorization);
    try {
      if (isStorage) return this.handleStorage(url, method, recorded.body, caller);
      if (caller.userId === null) {
        return json(401, pgError('PGRST301', 'JWT is invalid'));
      }
      switch (method) {
        case 'GET':
        case 'HEAD':
          return this.handleSelect(target, url, method, headers);
        case 'POST':
          return this.handleInsert(target, url, recorded.body, headers, caller);
        case 'PATCH':
          return this.handleUpdate(target, url, recorded.body, headers, caller);
        default:
          return json(405, pgError('PGRST117', `Unsupported HTTP method: ${method}`));
      }
    } catch (error) {
      if (error instanceof PgFailure) return json(error.status, error.body);
      throw error;
    }
  };

  private handleSelect(table: string, url: URL, method: string, headers: Headers): Response {
    const caller = this.callerFor(headers.get('authorization'));
    if (POLICIES[table] === undefined) throw new PgFailure(404, pgError('PGRST205', `Could not find the table 'public.${table}'`));
    const items = parseSelect(url.searchParams.get('select') ?? '*');
    const visible = this.rows(table).filter((row) => this.canSelect(table, row, caller));
    const filtered = applyOrder(applyFilters(visible, url, table), url.searchParams.get('order'), table);
    const total = filtered.length;
    const wantsCount = (headers.get('prefer') ?? '').includes('count=exact');
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers: wantsCount ? { 'content-range': `*/${total}` } : {} });
    }
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? total);
    if (offset > 0 && offset >= total) {
      return json(
        416,
        { code: 'PGRST103', message: 'Requested range not satisfiable', details: `An offset of ${offset} was requested, but there are only ${total} rows.`, hint: null },
        { 'content-range': `*/${total}` },
      );
    }
    const page = filtered.slice(offset, offset + limit).map((row) => this.project(table, row, items, caller));
    const range = page.length === 0 ? `*/${wantsCount ? total : '*'}` : `${offset}-${offset + page.length - 1}/${wantsCount ? total : '*'}`;
    return this.respondRows(200, page, headers, { 'content-range': range });
  }

  private respondRows(status: number, rows: Row[], headers: Headers, extra: Record<string, string> = {}): Response {
    if ((headers.get('accept') ?? '').includes('application/vnd.pgrst.object+json')) {
      if (rows.length !== 1) {
        return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows`, hint: null });
      }
      return json(status, rows[0], extra);
    }
    return json(status, rows, extra);
  }

  private handleInsert(table: string, url: URL, body: unknown, headers: Headers, caller: Caller): Response {
    const policy = POLICIES[table];
    if (policy === undefined) throw new PgFailure(404, pgError('PGRST205', `Could not find the table 'public.${table}'`));
    const prefer = headers.get('prefer') ?? '';
    const ignoreDuplicates = prefer.includes('resolution=ignore-duplicates');
    const onConflict = url.searchParams.get('on_conflict')?.split(',');
    const inputs = (Array.isArray(body) ? body : [body]) as Row[];
    const created: Row[] = [];
    const pending: Row[] = [];
    for (const input of inputs) {
      const row = this.withDefaults(table, input);
      const uniqueSets = [['id'], ...(TRIGGERS[table]?.unique ?? [])].filter((set) => set.every((column) => column in row));
      const conflict = uniqueSets.find((set) =>
        [...this.rows(table), ...pending].some((existing) => set.every((column) => existing[column] !== null && existing[column] === row[column])),
      );
      if (conflict !== undefined) {
        if (ignoreDuplicates && (onConflict === undefined || onConflict.join(',') === conflict.join(','))) continue;
        throw new PgFailure(409, pgError('23505', `duplicate key value violates unique constraint "${table}_${conflict.join('_')}_key"`));
      }
      if (!caller.allowed || !(policy.insert?.(row, caller, this) ?? false)) {
        throw new PgFailure(403, pgError('42501', `new row violates row-level security policy for table "${table}"`));
      }
      pending.push(row);
    }
    const returnRows = prefer.includes('return=representation');
    for (const row of pending) {
      if (returnRows && !this.canSelect(table, row, caller)) {
        throw new PgFailure(403, pgError('42501', `new row violates row-level security policy for table "${table}"`));
      }
    }
    for (const row of pending) {
      this.rows(table).push(row);
      created.push(row);
    }
    if (!returnRows) return new Response(null, { status: 201 });
    const items = parseSelect(url.searchParams.get('select') ?? '*');
    return this.respondRows(201, created.map((row) => this.project(table, row, items, caller)), headers);
  }

  private handleUpdate(table: string, url: URL, body: unknown, headers: Headers, caller: Caller): Response {
    const policy = POLICIES[table];
    if (policy === undefined) throw new PgFailure(404, pgError('PGRST205', `Could not find the table 'public.${table}'`));
    const changes = body as Row;
    for (const key of Object.keys(changes)) {
      if (!(key in (TABLE_COLUMNS[table] ?? {}))) {
        throw new PgFailure(400, pgError('PGRST204', `Could not find the '${key}' column of '${table}' in the schema cache`));
      }
    }
    const candidates = applyFilters(
      this.rows(table).filter((row) => this.canSelect(table, row, caller) && (policy.update?.(row, caller, this) ?? false)),
      url,
      table,
    );
    const updates: Array<{ row: Row; next: Row }> = [];
    for (const row of candidates) {
      const next: Row = { ...row, ...changes };
      if ('updated_at' in next && TRIGGERS[table]?.touchUpdatedAt === true) next.updated_at = LATER;
      const triggerError = TRIGGERS[table]?.beforeUpdate?.(row, next, caller);
      if (triggerError !== undefined && triggerError !== null) throw new PgFailure(triggerError.status, triggerError.body);
      for (const column of NOT_NULL[table] ?? []) {
        if (next[column] === null || next[column] === undefined) {
          throw new PgFailure(400, pgError('23502', `null value in column "${column}" of relation "${table}" violates not-null constraint`));
        }
      }
      if (!(policy.update?.(next, caller, this) ?? false)) {
        throw new PgFailure(403, pgError('42501', `new row violates row-level security policy for table "${table}"`));
      }
      updates.push({ row, next });
    }
    for (const { row, next } of updates) {
      const before = { ...row };
      Object.assign(row, next);
      TRIGGERS[table]?.afterUpdate?.(before, row, this);
    }
    if (!(headers.get('prefer') ?? '').includes('return=representation')) return new Response(null, { status: 204 });
    const items = parseSelect(url.searchParams.get('select') ?? '*');
    return this.respondRows(200, updates.map(({ row }) => this.project(table, row, items, caller)), headers);
  }

  private handleStorage(url: URL, method: string, body: unknown, caller: Caller): Response {
    const match = /^\/storage\/v1\/object\/sign\/([^/]+)$/.exec(url.pathname);
    if (method !== 'POST' || match === null) return json(400, { statusCode: '400', error: 'Bad Request', message: 'unsupported' });
    const bucket = match[1] ?? '';
    const { paths, expiresIn } = body as { paths: string[]; expiresIn: number };
    return json(
      200,
      paths.map((path) => {
        const allowed = caller.allowed && (caller.isAdmin || path.split('/')[0] === caller.userId);
        return allowed
          ? { path, signedURL: `/object/sign/${bucket}/${path}?token=signed-${expiresIn}`, error: null }
          : { path, signedURL: null, error: 'Either the object does not exist or you do not have access to it' };
      }),
    );
  }
}

/** Asserts the standard error body. */
export function expectErrorShape(response: LightMyRequestResponse, statusCode: number, code: string): void {
  expect({ status: response.statusCode, body: response.json() as unknown }).toEqual({
    status: statusCode,
    body: { error: { code, message: expect.any(String) } },
  });
}

export { NOW };

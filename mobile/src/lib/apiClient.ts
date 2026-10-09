import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

const DEFAULT_API_URL = "https://tmf-task2-api.azurewebsites.net";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
};

type DataResponse<T> = { data: T };

type ListResponse<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  return (configured || DEFAULT_API_URL).replace(/\/+$/, "");
}

async function accessToken(): Promise<string> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  return token;
}

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

async function errorFromResponse(response: Response): Promise<ApiError> {
  let code = "REQUEST_FAILED";
  let message = response.statusText || "Request failed";
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    if (typeof body.error?.code === "string") code = body.error.code;
    if (typeof body.error?.message === "string" && body.error.message.trim()) message = body.error.message.trim();
  } catch {
    // The body was not JSON. The status line is enough.
  }
  return new ApiError(response.status, code, message);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const token = await accessToken();
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${getApiBaseUrl()}${withQuery(path, options.query)}`, { method, headers, body });
  if (!response.ok) {
    const error = await errorFromResponse(response);
    if (__DEV__) console.error(`[API] ${method} ${path}`, error);
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiData<T>(path: string, options?: RequestOptions): Promise<T> {
  const payload = await apiRequest<DataResponse<T>>(path, options);
  return payload.data;
}

/** Follows page/pageSize until the list is complete, or until `limit` rows are collected. */
export async function apiList<T>(path: string, query?: Query, limit?: number): Promise<T[]> {
  const items: T[] = [];
  const pageSize = 100;

  for (let page = 1; ; page += 1) {
    const payload = await apiRequest<ListResponse<T>>(path, { query: { ...query, page, pageSize } });
    items.push(...payload.data);
    if (limit !== undefined && items.length >= limit) return items.slice(0, limit);
    if (payload.data.length === 0 || page >= payload.meta.totalPages) break;
  }

  return items;
}

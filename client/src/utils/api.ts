const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);

export const TOKEN_KEY = "quickcart-token";

type ApiOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

type ApiErrorBody = {
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isApiErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === "object" &&
  value !== null &&
  "message" in value &&
  (typeof value.message === "string" || value.message === undefined);

export const api = async <T = void>(
  path: string,
  options: ApiOptions = {},
): Promise<T> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      response.ok
        ? "The server returned an invalid response."
        : `Request failed (${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    const message = isApiErrorBody(result)
      ? result.message || `Request failed (${response.status}).`
      : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return result as T;
};

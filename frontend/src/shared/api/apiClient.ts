export type ApiFieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  code: string;
  details: ApiFieldError[];
  status: number;

  constructor(message: string, code: string, status: number, details: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { body, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const init: RequestInit = {
    ...requestOptions,
    credentials: 'include',
    headers
  };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);
  const payload = await readJson(response);

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      error?.message ?? 'The request could not be completed.',
      error?.code ?? 'REQUEST_FAILED',
      response.status,
      error?.details ?? []
    );
  }

  return payload as ApiEnvelope<T>;
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('The server returned an unreadable response.', 'INVALID_JSON', response.status);
  }
}

export type ApiUser = {
  id: number;
  username: string;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const defaultHeaders = {
  "Content-Type": "application/json"
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & T;

  if (!response.ok) {
    throw new ApiError(payload.error?.message ?? "Request failed.", response.status);
  }

  return payload;
}

export const authApi = {
  me: async () => {
    const payload = await request<{ data: { user: ApiUser } }>("/api/auth/me", {
      method: "GET"
    });
    return payload.data.user;
  },
  login: async (values: { username: string; password: string }) => {
    const payload = await request<{ data: { user: ApiUser } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(values)
    });
    return payload.data.user;
  },
  logout: async () => {
    await request<{ data: { success: boolean } }>("/api/auth/logout", {
      method: "POST"
    });
  }
};

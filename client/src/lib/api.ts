export type ApiUser = {
  id: number;
  username: string;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
};

type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type RequestOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

export type MedicineSchedule = {
  id?: number;
  slot: "morning" | "noon" | "evening";
  doseTime: string;
  qty: number;
  enabled: boolean;
};

export type Medicine = {
  id: number;
  rxName: string;
  daysOfSupply: number;
  totalAvailableQty: number;
  remainingQty: number;
  dailyQtyPlanned: number;
  estimatedDepletionDate: string | null;
  notes: string | null;
  schedules: MedicineSchedule[];
  createdAt: string;
  updatedAt: string;
};

export type AlertSettings = {
  morningTime: string;
  noonTime: string;
  eveningTime: string;
  preAlertMinutes: number;
  onTimeEnabled: boolean;
  timezone: string;
};

export type Reminder = {
  id: number;
  medicineId: number;
  rxName: string;
  slot: string;
  alertType: string;
  doseTime: string;
  qty: number;
  scheduledFor: string;
  status: string;
  displayMessage: string;
};

export type ReportRecord = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  analysisStatus: string;
  createdAt: string;
  updatedAt?: string;
};

export type ReportAnalysis = {
  reportId: number;
  summaryLayman: string;
  risks: string[];
  medicineSuggestions: string[];
  vitaminSuggestions: string[];
  importantNotes: string[];
  disclaimer: string;
  aiModel: string;
  createdAt: string;
};

export type UploadResult = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  analysisStatus: string;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const jsonHeaders = {
  "Content-Type": "application/json"
};

async function readPayload<T>(response: Response): Promise<ApiErrorPayload & Partial<ApiResponse<T>>> {
  return (await response.json().catch(() => ({}))) as ApiErrorPayload & Partial<ApiResponse<T>>;
}

function emitUnauthorized(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("healthpartner:unauthorized"));
  }
}

async function request<T>(input: string, init?: RequestOptions): Promise<ApiResponse<T>> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {})
    }
  });

  const payload = await readPayload<T>(response);

  if (!response.ok) {
    if (response.status === 401 && !init?.skipAuthRedirect) {
      emitUnauthorized();
    }

    throw new ApiError(
      payload.error?.message ?? "Request failed.",
      response.status,
      payload.error?.code,
      payload.error?.details
    );
  }

  return {
    data: payload.data as T,
    meta: payload.meta
  };
}

async function requestFormData<T>(input: string, init?: RequestOptions): Promise<ApiResponse<T>> {
  const response = await fetch(input, {
    credentials: "include",
    ...init
  });

  const payload = await readPayload<T>(response);

  if (!response.ok) {
    if (response.status === 401 && !init?.skipAuthRedirect) {
      emitUnauthorized();
    }

    throw new ApiError(
      payload.error?.message ?? "Request failed.",
      response.status,
      payload.error?.code,
      payload.error?.details
    );
  }

  return {
    data: payload.data as T,
    meta: payload.meta
  };
}

export const authApi = {
  me: async () => {
    const payload = await request<{ user: ApiUser }>("/api/auth/me", {
      method: "GET",
      skipAuthRedirect: true
    });
    return payload.data.user;
  },
  login: async (values: { username: string; password: string }) => {
    const payload = await request<{ user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
      skipAuthRedirect: true
    });
    return payload.data.user;
  },
  logout: async () => {
    await request<{ success: boolean }>("/api/auth/logout", {
      method: "POST"
    });
  }
};

export const medicinesApi = {
  list: async (includeInactive = false) => {
    const payload = await request<Medicine[]>(`/api/medicines?includeInactive=${String(includeInactive)}`, {
      method: "GET"
    });
    return payload.data;
  },
  create: async (values: {
    rxName: string;
    daysOfSupply: number;
    totalAvailableQty: number;
    notes?: string;
    schedules: MedicineSchedule[];
  }) => {
    const payload = await request<Medicine>("/api/medicines", {
      method: "POST",
      body: JSON.stringify(values)
    });
    return payload.data;
  },
  update: async (
    id: number,
    values: {
      rxName: string;
      daysOfSupply: number;
      totalAvailableQty: number;
      remainingQty?: number;
      notes?: string;
      schedules: MedicineSchedule[];
    }
  ) => {
    const payload = await request<Medicine>(`/api/medicines/${id}`, {
      method: "PUT",
      body: JSON.stringify(values)
    });
    return payload.data;
  },
  archive: async (id: number) => {
    const payload = await request<{ success: boolean; id: number }>(`/api/medicines/${id}`, {
      method: "DELETE"
    });
    return payload.data;
  },
  logIntake: async (id: number, values: { reminderEventId: number; qtyTaken: number; takenAt: string }) => {
    const payload = await request<{
      medicineId: number;
      remainingQty: number;
      reminderEventId: number;
      reminderStatus: string;
      intakeLogId: number;
    }>(`/api/medicines/${id}/intake`, {
      method: "POST",
      body: JSON.stringify(values)
    });
    return payload.data;
  }
};

export const alertSettingsApi = {
  get: async () => {
    const payload = await request<AlertSettings>("/api/alert-settings", {
      method: "GET"
    });
    return payload.data;
  },
  update: async (values: AlertSettings) => {
    const payload = await request<AlertSettings>("/api/alert-settings", {
      method: "PUT",
      body: JSON.stringify(values)
    });
    return {
      settings: payload.data,
      futureRemindersRebuilt: Boolean(payload.meta?.futureRemindersRebuilt)
    };
  }
};

export const remindersApi = {
  due: async (now: string, windowMinutes = 30) => {
    const payload = await request<Reminder[]>(`/api/reminders/due?now=${encodeURIComponent(now)}&windowMinutes=${windowMinutes}`, {
      method: "GET"
    });
    return payload.data;
  },
  acknowledge: async (id: number) => {
    const payload = await request<{ id: number; status: string }>(`/api/reminders/${id}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({
        acknowledgedAt: new Date().toISOString()
      })
    });
    return payload.data;
  },
  dismiss: async (id: number) => {
    const payload = await request<{ id: number; status: string }>(`/api/reminders/${id}/dismiss`, {
      method: "POST",
      body: JSON.stringify({
        dismissedAt: new Date().toISOString(),
        reason: "user_dismissed"
      })
    });
    return payload.data;
  }
};

export const reportsApi = {
  list: async () => {
    const payload = await request<ReportRecord[]>("/api/reports", {
      method: "GET"
    });
    return payload.data;
  },
  upload: async (file: File) => {
    const form = new FormData();
    form.append("reportFile", file);

    const payload = await requestFormData<UploadResult>("/api/reports/upload", {
      method: "POST",
      body: form
    });
    return payload.data;
  },
  analyze: async (id: number) => {
    const payload = await request<{
      reportId: number;
      analysisStatus: string;
      analysis: ReportAnalysis;
    }>(`/api/reports/${id}/analyze`, {
      method: "POST",
      body: JSON.stringify({
        analysisMode: "sync"
      }),
      headers: jsonHeaders
    });
    return payload.data;
  },
  getAnalysis: async (id: number) => {
    const payload = await request<ReportAnalysis>(`/api/reports/${id}/analysis`, {
      method: "GET"
    });
    return payload.data;
  }
};

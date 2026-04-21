import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertsPage } from "./AlertsPage";

const getMock = vi.fn();
const updateMock = vi.fn();

vi.mock("../../lib/api", () => ({
  alertSettingsApi: {
    get: (...args: unknown[]) => getMock(...args),
    update: (...args: unknown[]) => updateMock(...args)
  },
  ApiError: class ApiError extends Error {
    status: number;
    details?: Array<{ field?: string; message: string }>;

    constructor(message: string, status: number, _code?: string, details?: Array<{ field?: string; message: string }>) {
      super(message);
      this.status = status;
      this.details = details;
    }
  }
}));

describe("AlertsPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    updateMock.mockReset();
  });

  it("shows an error state when loading fails", async () => {
    getMock.mockRejectedValueOnce(new Error("Unable to load alert settings."));

    render(<AlertsPage />);

    expect(await screen.findByText("Unable to load alert settings.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("loads settings and saves changes", async () => {
    const user = userEvent.setup();

    getMock.mockResolvedValueOnce({
      morningTime: "08:00",
      noonTime: "13:00",
      eveningTime: "20:00",
      preAlertMinutes: 15,
      onTimeEnabled: true,
      timezone: "Asia/Kolkata"
    });
    updateMock.mockResolvedValueOnce({
      settings: {
        morningTime: "07:30",
        noonTime: "13:00",
        eveningTime: "20:00",
        preAlertMinutes: 10,
        onTimeEnabled: true,
        timezone: "UTC"
      },
      futureRemindersRebuilt: true
    });

    render(<AlertsPage />);

    expect(await screen.findByDisplayValue("08:00")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Morning time"));
    await user.type(screen.getByLabelText("Morning time"), "07:30");
    await user.clear(screen.getByLabelText("Timezone"));
    await user.type(screen.getByLabelText("Timezone"), "UTC");
    await user.clear(screen.getByLabelText("Pre-alert minutes"));
    await user.type(screen.getByLabelText("Pre-alert minutes"), "10");
    await user.click(screen.getByRole("button", { name: "Save Alert Settings" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
    });

    expect(await screen.findByText("Alert settings saved. Future reminders were rebuilt.")).toBeInTheDocument();
  });
});

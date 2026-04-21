import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MedicinesPage } from "./MedicinesPage";

const listMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const archiveMock = vi.fn();

vi.mock("../../lib/api", () => ({
  medicinesApi: {
    list: (...args: unknown[]) => listMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    archive: (...args: unknown[]) => archiveMock(...args)
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

describe("MedicinesPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    archiveMock.mockReset();
  });

  it("shows loading and then an empty state", async () => {
    listMock.mockResolvedValueOnce([]);

    render(<MedicinesPage />);

    expect(screen.getByText("Loading medicines...")).toBeInTheDocument();
    expect(await screen.findByText("No medicines yet")).toBeInTheDocument();
  });

  it("creates a medicine and shows a success state", async () => {
    const user = userEvent.setup();

    listMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 10,
        rxName: "Metformin",
        daysOfSupply: 30,
        totalAvailableQty: 60,
        remainingQty: 60,
        dailyQtyPlanned: 2,
        estimatedDepletionDate: "2026-05-21",
        notes: null,
        schedules: [
          { id: 1, slot: "morning", doseTime: "08:00", qty: 1, enabled: true },
          { id: 2, slot: "noon", doseTime: "13:00", qty: 0, enabled: false },
          { id: 3, slot: "evening", doseTime: "20:00", qty: 1, enabled: true }
        ],
        createdAt: "2026-04-21T00:00:00.000Z",
        updatedAt: "2026-04-21T00:00:00.000Z"
      }
    ]);
    createMock.mockResolvedValueOnce({
      id: 10,
      rxName: "Metformin"
    });

    render(<MedicinesPage />);

    await screen.findByText("No medicines yet");

    await user.type(screen.getByLabelText("Medicine name"), "Metformin");
    await user.click(screen.getByRole("button", { name: "Create Medicine" }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });

    expect(await screen.findByText("Added Metformin.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Metformin/i })).toBeInTheDocument();
  });
});

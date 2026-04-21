import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";
import { AuthProvider } from "./state/auth-context";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });

const renderApp = (entry = "/login") =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );

describe("App", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the login screen when there is no active session", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({ error: { message: "Authentication is required." } }, 401);
      }

      return jsonResponse({ data: {} });
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("restores an existing session and shows the three authenticated tabs", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({
          data: {
            user: {
              id: 1,
              username: "nikhil"
            }
          }
        });
      }

      if (String(input).includes("/api/reminders/due")) {
        return jsonResponse({ data: [] });
      }

      return jsonResponse({ data: [] });
    });

    renderApp("/app/medicines");

    expect(await screen.findByRole("heading", { name: "Welcome, nikhil" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add Medicine" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Customize Alerts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analyze Reports" })).toBeInTheDocument();
    expect(screen.queryByText(/local demo session/i)).not.toBeInTheDocument();
  });

  it("submits login credentials to the auth contract and routes into the app", async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({ error: { message: "Authentication is required." } }, 401);
      }

      if (String(input).includes("/api/auth/login")) {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ username: "demo", password: "demo123" }));

        return jsonResponse({
          data: {
            user: {
              id: 7,
              username: "demo"
            }
          }
        });
      }

      if (String(input).includes("/api/reminders/due")) {
        return jsonResponse({ data: [] });
      }

      return jsonResponse({ data: [] });
    });

    renderApp("/login");

    await user.click(await screen.findByRole("button", { name: "Login" }));

    expect(await screen.findByRole("heading", { name: "Welcome, demo" })).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include"
        })
      );
    });
  });

  it("surfaces backend session restore failures that are not auth-related", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({ error: { message: "Session lookup failed." } }, 500);
      }

      return jsonResponse({ data: {} });
    });

    renderApp("/login");

    expect(await screen.findByText("Session lookup failed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("redirects back to login when a protected feature request returns 401 after bootstrap", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({
          data: {
            user: {
              id: 1,
              username: "demo"
            }
          }
        });
      }

      if (String(input).includes("/api/reminders/due")) {
        return jsonResponse({ error: { message: "Authentication is required." } }, 401);
      }

      return jsonResponse({ data: [] });
    });

    renderApp("/app/medicines");

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(await screen.findByText("Your session expired. Please log in again.")).toBeInTheDocument();
  });

  it("clears auth state when logout hits an expired session", async () => {
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        return jsonResponse({
          data: {
            user: {
              id: 1,
              username: "demo"
            }
          }
        });
      }

      if (String(input).includes("/api/reminders/due")) {
        return jsonResponse({ data: [] });
      }

      if (String(input).includes("/api/auth/logout")) {
        return jsonResponse({ error: { message: "Authentication is required." } }, 401);
      }

      return jsonResponse({ data: [] });
    });

    renderApp("/app/medicines");

    await screen.findByRole("heading", { name: "Welcome, demo" });
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("Your session expired. Please log in again.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  });
});

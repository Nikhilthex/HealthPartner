import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";
import { AuthProvider } from "./state/auth-context";

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/auth/me")) {
      return new Response(JSON.stringify({ error: { message: "Authentication is required." } }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    return new Response(JSON.stringify({ data: {} }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  })
);

describe("App", () => {
  it("shows the login screen when there is no active session", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });
});

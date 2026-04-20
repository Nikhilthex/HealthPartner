import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "./helpers/test-app";

describe("auth API", () => {
  let app: Awaited<ReturnType<typeof createTestApp>>["app"];
  let db: Awaited<ReturnType<typeof createTestApp>>["db"];

  beforeEach(async () => {
    const context = await createTestApp();
    app = context.app;
    db = context.db;
  });

  afterEach(() => {
    db.close();
  });

  it("returns 422 for an invalid login payload", async () => {
    const response = await request(app).post("/api/auth/login").send({ username: "", password: "" });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "One or more fields are invalid.",
        details: [
          { field: "username", message: "Username is required." },
          { field: "password", message: "Password is required." }
        ]
      }
    });
  });

  it("logs in with valid credentials and returns the current user", async () => {
    const agent = request.agent(app);
    const loginResponse = await agent.post("/api/auth/login").send({ username: "demo", password: "secret123" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual({
      data: {
        user: {
          id: 1,
          username: "demo"
        }
      }
    });
    expect(loginResponse.headers["set-cookie"]).toBeDefined();

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      data: {
        user: {
          id: 1,
          username: "demo"
        }
      }
    });
  });

  it("returns 401 for invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({ username: "demo", password: "wrong-pass" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Username or password is incorrect.",
        details: undefined
      }
    });
  });

  it("protects the current user endpoint", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
        details: undefined
      }
    });
  });

  it("logs out an authenticated user and invalidates the session", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({ username: "demo", password: "secret123" });

    const logoutResponse = await agent.post("/api/auth/logout");
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({
      data: {
        success: true
      }
    });

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(401);
  });

  it("requires authentication for logout", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
        details: undefined
      }
    });
  });
});

import { test, expect } from '@playwright/test';
import { loginAsDemo } from './helpers';

test.describe('Auth APIs', () => {
  test('POST /api/auth/login validates payload', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: '',
        password: ''
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/auth/login creates a session and GET /api/auth/me returns the user', async ({ request }) => {
    const login = await loginAsDemo(request);
    expect(login.response.status()).toBe(200);
    expect(login.json.data.user).toEqual({
      id: 1,
      username: 'demo'
    });

    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.status()).toBe(200);
    const meBody = await meResponse.json();
    expect(meBody.data.user).toEqual({
      id: 1,
      username: 'demo'
    });
  });

  test('POST /api/auth/login rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'demo',
        password: 'wrong-password'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('POST /api/auth/logout clears the session', async ({ request }) => {
    await loginAsDemo(request);

    const logoutResponse = await request.post('/api/auth/logout');
    expect(logoutResponse.status()).toBe(200);

    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.status()).toBe(401);
  });

  test('GET /api/auth/me requires auth', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });
});

type MockResponse = {
  status?: number;
  body?: unknown;
};

export function mockFetch(routes: Record<string, MockResponse | ((init?: RequestInit) => MockResponse)>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const route = routes[url];

    if (!route) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = typeof route === 'function' ? route(init) : route;
    return new Response(JSON.stringify(result.body ?? { data: {} }), {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

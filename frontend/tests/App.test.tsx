import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from './support/fetchMock';
import { App } from '../src/App';

const authenticatedRoutes = {
  '/api/medicines': { body: { data: [] } },
  '/api/reminders/due?windowMinutes=15': { body: { data: [] } },
  '/api/alert-settings': {
    body: {
      data: {
        morningTime: '08:00',
        noonTime: '13:00',
        eveningTime: '20:00',
        preAlertMinutes: 15,
        onTimeEnabled: true,
        timezone: 'Asia/Kolkata'
      }
    }
  },
  '/api/reports': { body: { data: [] } }
};

function expectOnlyPrimaryAuthenticatedTabs() {
  const navigation = screen.getByRole('navigation', { name: 'Authenticated app sections' });
  const tabButtons = within(navigation).getAllByRole('button');

  expect(tabButtons).toHaveLength(3);
  expect(tabButtons.map((button) => button.textContent)).toEqual(['Add Medicine', 'Customize Alerts', 'Analyze Reports']);
}

describe('App', () => {
  it('shows login when no authenticated session exists', async () => {
    mockFetch({
      '/api/auth/me': {
        status: 401,
        body: { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } }
      }
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Authenticated app sections' })).not.toBeInTheDocument();
  });

  it('validates login fields before submitting credentials', async () => {
    const { fetchMock } = mockFetch({
      '/api/auth/me': {
        status: 401,
        body: { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } }
      }
    });

    render(<App />);

    await screen.findByRole('heading', { name: /login/i });
    await userEvent.clear(screen.getByLabelText(/username/i));
    await userEvent.clear(screen.getByLabelText(/password/i));
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('logs in and exposes the three authenticated tabs', async () => {
    mockFetch({
      '/api/auth/me': {
        status: 401,
        body: { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } }
      },
      '/api/auth/login': { body: { data: { user: { id: 1, username: 'demo' } } } },
      ...authenticatedRoutes
    });

    render(<App />);

    await screen.findByRole('heading', { name: /login/i });
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Signed in as demo')).toBeInTheDocument();
    expectOnlyPrimaryAuthenticatedTabs();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Analyze Reports' }));
    expect(await screen.findByText(/upload a report/i)).toBeInTheDocument();
  });

  it('restores an authenticated session directly into the primary tab shell', async () => {
    mockFetch({
      '/api/auth/me': { body: { data: { user: { id: 7, username: 'casey' } } } },
      ...authenticatedRoutes
    });

    render(<App />);

    expect(await screen.findByText('Signed in as casey')).toBeInTheDocument();
    expectOnlyPrimaryAuthenticatedTabs();
    expect(screen.getByRole('button', { name: 'Add Medicine' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: 'Create medicine reminders' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Set default reminder timing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Upload a report for AI-assisted review' })).not.toBeInTheDocument();
  });

  it('switches between only the three authenticated workflows', async () => {
    mockFetch({
      '/api/auth/me': { body: { data: { user: { id: 2, username: 'demo' } } } },
      ...authenticatedRoutes
    });

    render(<App />);

    expect(await screen.findByText('Signed in as demo')).toBeInTheDocument();
    expectOnlyPrimaryAuthenticatedTabs();

    await userEvent.click(screen.getByRole('button', { name: 'Customize Alerts' }));
    expect(screen.getByRole('button', { name: 'Customize Alerts' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { name: 'Set default reminder timing' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create medicine reminders' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Upload a report for AI-assisted review' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Analyze Reports' }));
    expect(screen.getByRole('button', { name: 'Analyze Reports' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { name: 'Upload a report for AI-assisted review' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create medicine reminders' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Set default reminder timing' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add Medicine' }));
    expect(screen.getByRole('button', { name: 'Add Medicine' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { name: 'Create medicine reminders' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Set default reminder timing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Upload a report for AI-assisted review' })).not.toBeInTheDocument();
  });
});

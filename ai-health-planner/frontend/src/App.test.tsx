import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from './test/fetchMock';
import { App } from './App';

describe('App', () => {
  it('exposes the three authenticated tabs without rendering login', async () => {
    mockFetch({
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
    });

    render(<App />);

    expect(screen.getByRole('button', { name: 'Add Medicine' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Customize Alerts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze Reports' })).toBeInTheDocument();
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Analyze Reports' }));
    expect(await screen.findByText(/upload a report/i)).toBeInTheDocument();
  });
});

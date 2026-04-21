import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '../../support/fetchMock';
import { AlertSettingsModule } from '../../../src/features/alerts/AlertSettingsModule';

describe('AlertSettingsModule', () => {
  it('loads and saves alert settings', async () => {
    const { fetchMock } = mockFetch({
      '/api/alert-settings': (init) => {
        if (init?.method === 'PUT') {
          return {
            body: {
              data: {
                morningTime: '07:30',
                noonTime: '13:00',
                eveningTime: '20:00',
                preAlertMinutes: 15,
                onTimeEnabled: true,
                timezone: 'Asia/Kolkata'
              },
              meta: { futureRemindersRebuilt: true }
            }
          };
        }

        return {
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
        };
      }
    });

    render(<AlertSettingsModule />);

    const morning = await screen.findByLabelText(/morning time/i);
    await userEvent.clear(morning);
    await userEvent.type(morning, '07:30');
    await userEvent.click(screen.getByRole('button', { name: /save alert settings/i }));

    expect(await screen.findByText(/future reminders rebuilt/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/alert-settings', expect.objectContaining({ method: 'PUT' })));
  });

  it('shows a loading state and error state', async () => {
    mockFetch({
      '/api/alert-settings': {
        status: 500,
        body: { error: { code: 'SERVER_ERROR', message: 'Alert settings failed.' } }
      }
    });

    render(<AlertSettingsModule />);

    expect(screen.getByText(/loading alert settings/i)).toBeInTheDocument();
    expect(await screen.findByText('Alert settings failed.')).toBeInTheDocument();
  });
});

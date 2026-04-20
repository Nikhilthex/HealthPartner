import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '../../test/fetchMock';
import { ReminderPopup } from './ReminderPopup';

describe('ReminderPopup', () => {
  it('renders and acknowledges a due reminder', async () => {
    const { fetchMock } = mockFetch({
      '/api/reminders/due?windowMinutes=15': {
        body: {
          data: [
            {
              id: 123,
              medicineId: 10,
              rxName: 'Metformin XR',
              slot: 'evening',
              alertType: 'pre',
              doseTime: '20:30',
              qty: 1,
              scheduledFor: '2026-04-20T14:45:00.000Z',
              status: 'pending',
              displayMessage: 'Reminder: Take 1 dose of Metformin XR at 20:30.'
            }
          ]
        }
      },
      '/api/reminders/123/acknowledge': {
        body: { data: { id: 123, status: 'shown' } }
      }
    });

    render(<ReminderPopup />);

    expect(await screen.findByRole('dialog')).toHaveTextContent('Metformin XR');
    await userEvent.click(screen.getByRole('button', { name: /acknowledge/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reminders/123/acknowledge', expect.any(Object)));
  });
});

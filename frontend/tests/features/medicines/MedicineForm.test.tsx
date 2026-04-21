import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicineForm } from '../../../src/features/medicines/MedicineForm';

describe('MedicineForm', () => {
  it('shows field-level validation before saving', async () => {
    const onSubmit = vi.fn();
    render(<MedicineForm isSaving={false} onSubmit={onSubmit} />);

    await userEvent.clear(screen.getByLabelText(/rx name/i));
    await userEvent.click(screen.getByRole('button', { name: /save medicine/i }));

    expect(await screen.findByText('Rx name is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid medicine payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<MedicineForm isSaving={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/rx name/i), 'Metformin');
    await userEvent.click(screen.getByRole('button', { name: /save medicine/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        rxName: 'Metformin',
        daysOfSupply: 30,
        totalAvailableQty: 60,
        schedules: expect.arrayContaining([
          expect.objectContaining({ slot: 'morning', enabled: true, doseTime: '08:00', qty: 1 })
        ])
      })
    );
  });
});

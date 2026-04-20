import type { Medicine } from './types';
import { labelForSlot } from './validation';

type MedicineListProps = {
  medicines: Medicine[];
  isDeletingId: number | null;
  onDelete: (id: number) => void;
};

export function MedicineList({ medicines, isDeletingId, onDelete }: MedicineListProps) {
  if (medicines.length === 0) {
    return <div className="empty-state">No medicines have been added yet.</div>;
  }

  return (
    <div className="medicine-list">
      {medicines.map((medicine) => (
        <article className="medicine-card" key={medicine.id}>
          <div className="card-heading">
            <div>
              <h3>{medicine.rxName}</h3>
              <p>{medicine.dailyQtyPlanned} planned per day</p>
            </div>
            <span className={medicine.remainingQty <= medicine.dailyQtyPlanned * 3 ? 'badge badge-warning' : 'badge'}>
              {medicine.remainingQty} left
            </span>
          </div>

          <dl className="metric-grid">
            <div>
              <dt>Supply</dt>
              <dd>{medicine.daysOfSupply} days</dd>
            </div>
            <div>
              <dt>Depletion</dt>
              <dd>{medicine.estimatedDepletionDate}</dd>
            </div>
          </dl>

          <div className="schedule-chips">
            {medicine.schedules.map((schedule) => (
              <span className="chip" key={`${medicine.id}-${schedule.slot}`}>
                {labelForSlot(schedule.slot)} {schedule.doseTime} · {schedule.qty}
              </span>
            ))}
          </div>

          {medicine.notes && <p className="notes">{medicine.notes}</p>}

          <button className="ghost-button" type="button" onClick={() => onDelete(medicine.id)} disabled={isDeletingId === medicine.id}>
            {isDeletingId === medicine.id ? 'Removing...' : 'Archive'}
          </button>
        </article>
      ))}
    </div>
  );
}

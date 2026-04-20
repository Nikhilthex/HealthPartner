import { useState } from 'react';
import { AlertSettingsModule } from './features/alerts/AlertSettingsModule';
import { MedicineReminderModule } from './features/medicines/MedicineReminderModule';
import { ReminderPopup } from './features/medicines/ReminderPopup';
import { ReportAnalyzerModule } from './features/reports/ReportAnalyzerModule';

type TabId = 'medicines' | 'alerts' | 'reports';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'medicines', label: 'Add Medicine' },
  { id: 'alerts', label: 'Customize Alerts' },
  { id: 'reports', label: 'Analyze Reports' }
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('medicines');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Health Partner</p>
          <h1>Medicine reminders and report analysis</h1>
        </div>
      </header>

      <nav className="tabs" aria-label="Authenticated app sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab tab-active' : 'tab'}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="workspace">
        {activeTab === 'medicines' && <MedicineReminderModule />}
        {activeTab === 'alerts' && <AlertSettingsModule />}
        {activeTab === 'reports' && <ReportAnalyzerModule />}
      </main>

      <ReminderPopup />
    </div>
  );
}

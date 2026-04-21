import { useEffect, useState } from 'react';
import { ApiError } from './shared/api/apiClient';
import { getCurrentUser, login, logout } from './features/auth/api';
import { LoginPage } from './features/auth/LoginPage';
import type { AuthUser, LoginPayload } from './features/auth/types';
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((currentUser) => {
        if (isActive) {
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (!(error instanceof ApiError) || error.status !== 401) {
          setAuthMessage(error instanceof Error ? error.message : 'Unable to restore your session.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLogin(payload: LoginPayload) {
    setIsLoginPending(true);
    setAuthMessage('');

    try {
      const nextUser = await login(payload);
      setUser(nextUser);
      setActiveTab('medicines');
    } catch (error: unknown) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to login.');
    } finally {
      setIsLoginPending(false);
    }
  }

  async function handleLogout() {
    setIsLogoutPending(true);
    setAuthMessage('');

    try {
      await logout();
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return;
      }

      setAuthMessage(error instanceof Error ? error.message : 'Unable to logout.');
    } finally {
      setIsLogoutPending(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="loading-screen" role="status" aria-live="polite">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return <LoginPage errorMessage={authMessage} isSubmitting={isLoginPending} onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Health Partner</p>
          <h1>Medicine reminders and report analysis</h1>
        </div>
        <div className="session-actions">
          <span>Signed in as {user.username}</span>
          <button className="ghost-button" type="button" onClick={() => void handleLogout()} disabled={isLogoutPending}>
            {isLogoutPending ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </header>

      {authMessage && (
        <div className="workspace auth-message">
          <div className="status status-error" role="alert">
            {authMessage}
          </div>
        </div>
      )}

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

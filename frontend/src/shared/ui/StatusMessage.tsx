import type { ReactNode } from 'react';

type StatusMessageProps = {
  children: ReactNode;
  tone?: 'info' | 'success' | 'error';
};

export function StatusMessage({ children, tone = 'info' }: StatusMessageProps) {
  return (
    <div className={`status status-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

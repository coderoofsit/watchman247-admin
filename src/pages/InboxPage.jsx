import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ComplaintsPage from './ComplaintsPage.jsx';

const TABS = [{ id: 'complaints', label: 'Complaints' }];

export default function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return TABS.some((t) => t.id === tab) ? tab : 'complaints';
  }, [searchParams]);

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                isActive
                  ? 'border-[var(--color-blue)] text-[var(--color-blue)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'complaints' ? <ComplaintsPage /> : null}
    </div>
  );
}

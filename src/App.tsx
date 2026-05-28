import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from './design-system/primitives/Button';
import { Card } from './design-system/primitives/Card';
import { Spinner } from './design-system/primitives/Spinner';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { HalBootSequence } from './components/HalBootSequence';
import { useUserStore } from './stores/userStore';

const DesignSystemPlayground = lazy(() =>
  import('./components/DesignSystemPlayground').then((module) => ({
    default: module.DesignSystemPlayground,
  }))
);

const TickerExplorer = lazy(() =>
  import('./features/explorer/TickerExplorer').then((module) => ({
    default: module.TickerExplorer,
  }))
);

const MarketNews = lazy(() =>
  import('./components/MarketNews').then((module) => ({
    default: module.MarketNews,
  }))
);

const AlertsView = lazy(() =>
  import('./features/alerts').then((module) => ({
    default: module.AlertsView,
  }))
);

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [showPlayground, setShowPlayground] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'personal'>('main');
  const { currentUser } = useUserStore();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  if (isBooting) {
    return <HalBootSequence />;
  }

  const moduleFallback = (
    <Card className="flex items-center gap-3">
      <Spinner size="sm" />
      <span className="text-sm text-hal-muted">Loading module...</span>
    </Card>
  );

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-6 py-3 border-b border-hal-border bg-gradient-to-r from-hal-bg-1/40 via-transparent to-hal-bg-1/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-hal-phosphor shadow-hal-phosphor hal-beacon" />
              <div>
                <div className="font-display tracking-[0.32em] text-sm sm:text-base">H.A.L. COMPASS</div>
                <div className="text-[10px] text-hal-muted tracking-[0.2em] -mt-0.5">HIGH ACCURACY LOGIC COMPASS</div>
              </div>
            </div>
            <div className="text-[10px] px-2.5 py-px rounded-full bg-hal-accent/12 text-hal-accent tracking-widest">
              LIVE INTELLIGENCE
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex rounded-md border border-hal-border overflow-hidden text-sm bg-hal-panel-soft/40">
              <button
                onClick={() => setCurrentView('main')}
                className={`px-3 py-1 transition-colors ${currentView === 'main' ? 'bg-hal-primary/14 text-hal-primary' : 'text-hal-text-soft hover:bg-hal-panel-soft hover:text-hal-text'}`}
              >
                Main
              </button>
              <button
                onClick={() => setCurrentView('personal')}
                className={`px-3 py-1 transition-colors border-l border-hal-border ${currentView === 'personal' ? 'bg-hal-primary/14 text-hal-primary' : 'text-hal-text-soft hover:bg-hal-panel-soft hover:text-hal-text'}`}
              >
                My Dashboard
              </button>
            </div>

            <ProfileSwitcher />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAlerts(false);
                  setShowPlayground(!showPlayground);
                }}
              >
                {showPlayground ? 'Hide' : 'Show'} Design System
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPlayground(false);
                  setShowAlerts(!showAlerts);
                }}
              >
                {showAlerts ? 'Hide' : 'Manage'} Alerts
              </Button>
            </div>
          </div>
        </div>
      }
      sidebar={<Sidebar />}
    >
      <div className="max-w-[1400px]">
        {showAlerts ? (
          <Suspense fallback={moduleFallback}>
            <AlertsView />
          </Suspense>
        ) : showPlayground ? (
          <Suspense fallback={moduleFallback}>
            <DesignSystemPlayground />
          </Suspense>
        ) : currentView === 'personal' ? (
          <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-medium tracking-tight mb-2">
              {currentUser ? `${currentUser.name}'s Dashboard` : 'My Dashboard'}
            </h1>
            <p className="text-hal-muted mb-6">
              {currentUser
                ? 'Your personal alerts, saved tickers, and preferences live here.'
                : 'Create a profile using the switcher in the top right to save your alerts and settings.'}
            </p>

            {currentUser ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h3 className="font-medium mb-2">Your Active Alerts</h3>
                  <p className="text-sm text-hal-muted">Go to "Manage Alerts" to create and view your personal smart alerts.</p>
                </Card>
                <Card>
                  <h3 className="font-medium mb-2">Saved Tickers</h3>
                  <p className="text-sm text-hal-muted">Your frequently watched tickers and custom lists will appear here.</p>
                </Card>
              </div>
            ) : (
              <Card>
                <p className="text-hal-muted">Create a profile above to unlock your personal dashboard, saved alerts, and preferences.</p>
              </Card>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="uppercase tracking-[0.2em] text-hal-primary text-xs mb-1">LIVE SYSTEM</div>
                <h1 className="text-3xl font-medium tracking-tight">Command Center</h1>
              </div>
              <div className="text-right text-sm text-hal-muted">
                Universe: <span className="text-hal-text">S&amp;P 500</span>
                <br />
                Last sync: <span className="text-hal-accent">just now</span>
              </div>
            </div>

            <Card className="mb-8 border-hal-primary/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-hal-primary font-medium mb-1">Production Foundation Active</div>
                  <p className="text-hal-text-soft max-w-2xl">
                    This interface is running on the evolvable architecture. Components, layout, and data access
                    follow explicit patterns to keep long-term iteration fast and safe.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => window.open('/docs/architecture/01-frontend-foundation.md', '_blank')}>
                  View Docs
                </Button>
              </div>
            </Card>

            <div className="max-w-[1400px] mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium tracking-tight">Ticker Explorer</h2>
                  <div className="text-xs text-hal-muted">Pulls live data from backend</div>
                </div>
                <Suspense fallback={moduleFallback}>
                  <TickerExplorer />
                </Suspense>
              </div>

              <div>
                <h2 className="text-xl font-medium tracking-tight mb-4">Market Pulse</h2>
                <Suspense fallback={moduleFallback}>
                  <MarketNews />
                </Suspense>
              </div>

              <div className="mt-8 text-[10px] text-hal-muted tracking-widest text-center">
                H.A.L. COMPASS • 2026 EVOLVABLE FOUNDATION • CHANGES HERE ARE VISIBLE IN REAL TIME
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default App;

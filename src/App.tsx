import { lazy, Suspense, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  FlaskConical,
  Home,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './design-system/primitives/Button';
import { Card } from './design-system/primitives/Card';
import { Spinner } from './design-system/primitives/Spinner';
import { AppShell } from './components/AppShell';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { HalBootSequence } from './components/HalBootSequence';
import { LazyBoundary } from './components/LazyBoundary';
import { api } from './lib/api/client';
import { useUserStore } from './stores/userStore';

type AppPage = 'home' | 'dashboard' | 'market' | 'alerts' | 'lab' | 'lab-guide';

interface HubItem {
  id: AppPage;
  label: string;
  mobileLabel: string;
  description: string;
  icon: LucideIcon;
}

interface SystemVersionPayload {
  status: string;
  checked_at: string;
  environment: string | null;
  source: string;
  commit_sha: string | null;
  commit_short: string | null;
  commit_branch: string | null;
  deployment_id: string | null;
  deployment_url: string | null;
}

const BUILD_COMMIT = String(import.meta.env.VITE_BUILD_COMMIT ?? 'unknown');
const BUILD_BRANCH = String(import.meta.env.VITE_BUILD_BRANCH ?? 'unknown');
const BUILD_TIME = String(import.meta.env.VITE_BUILD_TIME ?? '');

const formatBuildTime = (raw: string): string => {
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    return 'unknown';
  }
  return new Date(parsed).toLocaleString();
};

const HUB_ITEMS: HubItem[] = [
  {
    id: 'home',
    label: 'Homepage',
    mobileLabel: 'Home',
    description: 'System overview and top insights',
    icon: Home,
  },
  {
    id: 'dashboard',
    label: 'My Dashboard',
    mobileLabel: 'Dashboard',
    description: 'Your profile and personal workspace',
    icon: LayoutDashboard,
  },
  {
    id: 'market',
    label: 'Live Market',
    mobileLabel: 'Market',
    description: 'Market pulse and live signal summary',
    icon: Activity,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    mobileLabel: 'Alerts',
    description: 'Configure and manage smart alerts',
    icon: Bell,
  },
  {
    id: 'lab',
    label: 'Lab',
    mobileLabel: 'Lab',
    description: 'Build scenarios and decision-ready stock intelligence',
    icon: FlaskConical,
  },
];

const isAppPage = (value: string): value is AppPage =>
  value === 'lab-guide' || HUB_ITEMS.some((item) => item.id === value);

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

const LiveMarketBoard = lazy(() =>
  import('./features/market').then((module) => ({
    default: module.LiveMarketBoard,
  }))
);

const LabGuideView = lazy(() =>
  import('./features/lab/LabGuideView').then((module) => ({
    default: module.LabGuideView,
  }))
);

const MarketContextStrip = lazy(() =>
  import('./components/MarketContextStrip').then((module) => ({
    default: module.MarketContextStrip,
  }))
);

const SystemHealthCard = lazy(() =>
  import('./components/SystemHealthCard').then((module) => ({
    default: module.SystemHealthCard,
  }))
);

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activePage, setActivePage] = useState<AppPage>(() => {
    if (typeof window === 'undefined') {
      return 'home';
    }

    const stored = window.sessionStorage.getItem('hal-active-page');
    return stored && isAppPage(stored) ? stored : 'home';
  });
  const [labTicker, setLabTicker] = useState(() => {
    if (typeof window === 'undefined') {
      return 'MSFT';
    }
    return window.sessionStorage.getItem('hal-lab-ticker') || 'MSFT';
  });
  const [alertsTickerContext, setAlertsTickerContext] = useState(() => {
    if (typeof window === 'undefined') {
      return 'MSFT';
    }
    return window.sessionStorage.getItem('hal-alert-ticker') || 'MSFT';
  });
  const [labReturnPage, setLabReturnPage] = useState<AppPage>('home');
  const [systemVersion, setSystemVersion] = useState<SystemVersionPayload | null>(null);
  const { currentUser } = useUserStore();
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hal-active-page', activePage);
    }
  }, [activePage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hal-lab-ticker', labTicker);
    }
  }, [labTicker]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hal-alert-ticker', alertsTickerContext);
    }
  }, [alertsTickerContext]);

  useEffect(() => {
    window.requestAnimationFrame(() => pageHeadingRef.current?.focus());
  }, [activePage]);

  useEffect(() => {
    let isMounted = true;
    api
      .get<SystemVersionPayload>('/system/version')
      .then((payload) => {
        if (isMounted) {
          setSystemVersion(payload);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSystemVersion(null);
        }
      });

    return () => {
      isMounted = false;
    };
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

  const activeHubItem = HUB_ITEMS.find(
    (item) => item.id === (activePage === 'lab-guide' ? 'lab' : activePage)
  );

  const renderLazyModule = (content: ReactNode) => (
    <LazyBoundary onReset={() => setActivePage('home')}>
      <Suspense fallback={moduleFallback}>{content}</Suspense>
    </LazyBoundary>
  );

  const openLabForTicker = (ticker: string) => {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) {
      return;
    }
    setLabTicker(normalized);
    if (activePage !== 'lab') {
      setLabReturnPage(activePage);
    }
    setActivePage('lab');
  };

  const openAlertsForTicker = (ticker?: string) => {
    const normalized = ticker?.trim().toUpperCase();
    if (normalized) {
      setAlertsTickerContext(normalized);
    }
    setActivePage('alerts');
  };

  const renderHome = () => (
    <>
      <div className="mb-5">
        {renderLazyModule(<MarketContextStrip />)}
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="uppercase tracking-[0.2em] text-hal-primary text-xs mb-1">Live System</div>
          <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
            Command Center
          </h1>
        </div>
        <div className="text-sm text-hal-muted">
          Universe: <span className="text-hal-text">US + Global Markets</span>
          <br />
          Coverage: <span className="text-hal-accent">S&amp;P, Dow, Nasdaq, Russell, global ETFs, commodities</span>
        </div>
      </div>

      <Card className="mb-6 border-hal-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-hal-primary font-medium mb-1">Navigation Hub Always Available</div>
            <p className="text-hal-text-soft max-w-2xl">
              You can always move between Homepage, My Dashboard, Live Market, Alerts, and Lab
              using the top command tabs on desktop or bottom hub on mobile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setActivePage('market')}>
              Open Live Market
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openAlertsForTicker(labTicker)}>
              Open Alerts
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        {renderLazyModule(<SystemHealthCard />)}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium tracking-tight">Ticker Explorer</h2>
            <div className="text-xs text-hal-muted">Live backend data</div>
          </div>
          {renderLazyModule(<TickerExplorer onOpenLabTicker={openLabForTicker} />)}
        </div>

        <div>
          <h2 className="text-xl font-medium tracking-tight mb-4">Market Pulse</h2>
          {renderLazyModule(<MarketNews />)}
        </div>
      </div>
    </>
  );

  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      <div>
        <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight mb-2 focus:outline-none">
          {currentUser ? `${currentUser.name}'s Dashboard` : 'My Dashboard'}
        </h1>
        <p className="text-hal-muted">
          {currentUser
            ? 'Your personal alerts, saved tickers, and preferences live here.'
            : 'Create a profile from the top-right profile menu to unlock saved alerts and personalized settings.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-medium mb-2">Personal Alerts</h3>
          <p className="text-sm text-hal-muted mb-4">
            Configure event-driven alerts tied to your watchlist and signal preferences.
          </p>
          <Button variant="secondary" size="sm" onClick={() => openAlertsForTicker(labTicker)}>
            Manage Alerts
          </Button>
        </Card>
        <Card>
          <h3 className="font-medium mb-2">Market Workspace</h3>
          <p className="text-sm text-hal-muted mb-4">
            Track live sentiment shifts and recent market movement from one view.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setActivePage('market')}>
            Go To Live Market
          </Button>
        </Card>
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
            Live Market
          </h1>
          <p className="text-hal-muted">Real-time context for signals, sentiment, and activity.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setActivePage('home')}>
          Back To Homepage
        </Button>
      </div>

      {renderLazyModule(<LiveMarketBoard onSelectTicker={openLabForTicker} />)}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium tracking-tight">News + Context</h2>
          <Button variant="ghost" size="sm" onClick={() => openAlertsForTicker(labTicker)}>
            Create Alert From This View
          </Button>
        </div>
        {renderLazyModule(<MarketNews />)}
      </Card>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return renderDashboard();
      case 'market':
        return renderMarket();
      case 'alerts':
        return (
          <div className="space-y-4">
            <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
              Alerts
            </h1>
            {renderLazyModule(
              <AlertsView
                onOpenLabTicker={openLabForTicker}
                defaultTicker={alertsTickerContext}
              />
            )}
          </div>
        );
      case 'lab': {
        const returnLabel = HUB_ITEMS.find((item) => item.id === labReturnPage)?.label ?? 'Homepage';
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
                  Lab
                </h1>
                <p className="text-hal-muted">
                  Tune inputs and watch decision outputs update in real time.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setActivePage(labReturnPage)}>
                Back To {returnLabel}
              </Button>
            </div>
            {renderLazyModule(
              <DesignSystemPlayground
                key={labTicker}
                initialTicker={labTicker}
                onOpenGuide={() => setActivePage('lab-guide')}
              />
            )}
          </div>
        );
      }
      case 'lab-guide': {
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
                  Lab Guide
                </h1>
                <p className="text-hal-muted">
                  Learn exactly how to use the Lab and how its intelligence engine improves decision quality.
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setActivePage('lab')}>
                Back To Lab
              </Button>
            </div>
            {renderLazyModule(<LabGuideView onBackToLab={() => setActivePage('lab')} />)}
          </div>
        );
      }
      case 'home':
      default:
        return renderHome();
    }
  };

  const commitLabel = systemVersion?.commit_short || BUILD_COMMIT.slice(0, 12);
  const branchLabel = systemVersion?.commit_branch || BUILD_BRANCH;
  const deploymentLabel = systemVersion?.deployment_id
    ? systemVersion.deployment_id.slice(-8)
    : 'n/a';
  const environmentLabel = systemVersion?.environment || 'unknown';
  const buildTimeLabel = formatBuildTime(BUILD_TIME);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-hal-bg-1 focus:text-hal-text focus:border focus:border-hal-border"
      >
        Skip to main content
      </a>
      <AppShell
        header={
        <div className="px-4 sm:px-6 py-3 border-b border-hal-border bg-gradient-to-r from-hal-bg-1/40 via-transparent to-hal-bg-1/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-2.5 w-2.5 rounded-full bg-hal-phosphor shadow-hal-phosphor hal-beacon" />
              <div className="min-w-0">
                <div className="font-display tracking-[0.28em] text-sm sm:text-base truncate">H.A.L. COMPASS</div>
                <div className="hidden sm:block text-[10px] text-hal-muted tracking-[0.2em] -mt-0.5">
                  HIGH ACCURACY LOGIC COMPASS
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden sm:block text-[10px] px-2.5 py-px rounded-full bg-hal-accent/12 text-hal-accent tracking-widest">
                LIVE INTELLIGENCE
              </div>
              <ProfileSwitcher />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 mt-3">
            {HUB_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'lab'
                ? activePage === 'lab' || activePage === 'lab-guide'
                : activePage === item.id;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={isActive ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActivePage(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="justify-start"
                  title={item.description}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="lg:hidden mt-3 text-xs text-hal-muted">
            {activeHubItem?.label}: <span className="text-hal-text">{activeHubItem?.description}</span>
          </div>
        </div>
        }
      >
        <div className="max-w-[1400px] pb-20 lg:pb-0">
          {renderPage()}
          <footer className="mt-6 border-t border-hal-border pt-3 text-[11px] text-hal-muted">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Build {commitLabel}</span>
              <span>Branch {branchLabel}</span>
              <span>Deployment {deploymentLabel}</span>
              <span>Env {environmentLabel}</span>
              <span>Built {buildTimeLabel}</span>
            </div>
          </footer>
        </div>

        <nav className="fixed bottom-3 left-3 right-3 lg:hidden z-50 rounded-[14px] border border-hal-border bg-hal-bg-1/95 backdrop-blur-md px-2 py-1.5 shadow-xl">
          <div className="grid grid-cols-5 gap-1">
            {HUB_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === 'lab'
                ? activePage === 'lab' || activePage === 'lab-guide'
                : activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[10px] min-h-14 py-2 text-[11px] transition-colors touch-manipulation active:scale-[0.98] ${
                    isActive
                      ? 'bg-hal-primary/15 text-hal-primary'
                      : 'text-hal-text-soft hover:bg-hal-panel-soft hover:text-hal-text'
                  }`}
                  aria-label={`Open ${item.label}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span>{item.mobileLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </AppShell>
    </>
  );
}

export default App;

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
import { Sidebar } from './components/Sidebar';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { HalBootSequence } from './components/HalBootSequence';
import { LazyBoundary } from './components/LazyBoundary';
import { SignalCard } from './features/signals';
import { useUserStore } from './stores/userStore';

type AppPage = 'home' | 'dashboard' | 'market' | 'alerts' | 'lab';

interface HubItem {
  id: AppPage;
  label: string;
  mobileLabel: string;
  description: string;
  icon: LucideIcon;
}

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
  HUB_ITEMS.some((item) => item.id === value);

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
  const [activePage, setActivePage] = useState<AppPage>(() => {
    if (typeof window === 'undefined') {
      return 'home';
    }

    const stored = window.sessionStorage.getItem('hal-active-page');
    return stored && isAppPage(stored) ? stored : 'home';
  });
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
    window.requestAnimationFrame(() => pageHeadingRef.current?.focus());
  }, [activePage]);

  if (isBooting) {
    return <HalBootSequence />;
  }

  const moduleFallback = (
    <Card className="flex items-center gap-3">
      <Spinner size="sm" />
      <span className="text-sm text-hal-muted">Loading module...</span>
    </Card>
  );

  const activeHubItem = HUB_ITEMS.find((item) => item.id === activePage);

  const sidebarNavItems = HUB_ITEMS.map((item) => {
    const Icon = item.icon;
    return {
      id: item.id,
      label: item.label,
      icon: <Icon className="h-4 w-4" />,
      active: activePage === item.id,
      onClick: () => setActivePage(item.id),
    };
  });

  const marketSignals = [
    { ticker: 'NVDA', sentiment: 0.84, change: 0.12 },
    { ticker: 'MSFT', sentiment: 0.63, change: 0.05 },
    { ticker: 'AAPL', sentiment: 0.41, change: -0.03 },
    { ticker: 'AMZN', sentiment: 0.58, change: 0.08 },
  ];

  const renderLazyModule = (content: ReactNode) => (
    <LazyBoundary onReset={() => setActivePage('home')}>
      <Suspense fallback={moduleFallback}>{content}</Suspense>
    </LazyBoundary>
  );

  const renderHome = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="uppercase tracking-[0.2em] text-hal-primary text-xs mb-1">Live System</div>
          <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
            Command Center
          </h1>
        </div>
        <div className="text-sm text-hal-muted">
          Universe: <span className="text-hal-text">S&amp;P 500</span>
          <br />
          Last sync: <span className="text-hal-accent">just now</span>
        </div>
      </div>

      <Card className="mb-6 border-hal-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-hal-primary font-medium mb-1">Navigation Hub Always Available</div>
            <p className="text-hal-text-soft max-w-2xl">
              You can always move between Homepage, My Dashboard, Live Market, Alerts, and Lab
              using the sidebar on desktop or bottom hub on mobile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setActivePage('market')}>
              Open Live Market
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActivePage('alerts')}>
              Open Alerts
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium tracking-tight">Ticker Explorer</h2>
            <div className="text-xs text-hal-muted">Live backend data</div>
          </div>
          {renderLazyModule(<TickerExplorer />)}
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
          <Button variant="secondary" size="sm" onClick={() => setActivePage('alerts')}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {marketSignals.map((signal) => (
          <SignalCard
            key={signal.ticker}
            ticker={signal.ticker}
            sentiment={signal.sentiment}
            change={signal.change}
          />
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium tracking-tight">News + Context</h2>
          <Button variant="ghost" size="sm" onClick={() => setActivePage('alerts')}>
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
            {renderLazyModule(<AlertsView />)}
          </div>
        );
      case 'lab':
        return (
          <div className="space-y-4">
            <h1 ref={pageHeadingRef} tabIndex={-1} className="text-3xl font-medium tracking-tight focus:outline-none">
              Lab
            </h1>
            <p className="text-hal-muted">
              Tune inputs and watch decision outputs update in real time.
            </p>
            {renderLazyModule(<DesignSystemPlayground />)}
          </div>
        );
      case 'home':
      default:
        return renderHome();
    }
  };

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
              const isActive = activePage === item.id;
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
      sidebar={<Sidebar navItems={sidebarNavItems} />}
    >
      <div className="max-w-[1400px] pb-20 lg:pb-0">{renderPage()}</div>

      <nav className="fixed bottom-3 left-3 right-3 lg:hidden z-50 rounded-[14px] border border-hal-border bg-hal-bg-1/95 backdrop-blur-md px-2 py-1.5 shadow-xl">
        <div className="grid grid-cols-5 gap-1">
          {HUB_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-[10px] min-h-12 py-2 text-[10px] transition-colors touch-manipulation active:scale-[0.98] ${
                  isActive
                    ? 'bg-hal-primary/15 text-hal-primary'
                    : 'text-hal-text-soft hover:bg-hal-panel-soft hover:text-hal-text'
                }`}
                aria-label={`Open ${item.label}`}
              >
                <Icon className="h-4 w-4" />
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

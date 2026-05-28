import { useState } from 'react';
import { Button } from './design-system/primitives/Button';
import { Card } from './design-system/primitives/Card';
import { Input } from './design-system/primitives/Input';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';

/**
 * H.A.L. Console — Live Foundation Demo (2026)
 * 
 * This is a working demonstration of the evolvable architecture.
 * Changes here are meant to validate the patterns, not to be permanent product code.
 */
function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-6 py-3 border-b border-hal-border">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display tracking-[0.3em] text-base">H.A.L. COMPASS</div>
              <div className="text-[10px] text-hal-muted tracking-[0.2em] -mt-1">HIGH ACCURACY LOGIC COMPASS</div>
            </div>
            <div className="text-[10px] px-2.5 py-px rounded-full bg-hal-primary/10 text-hal-primary tracking-widest">FOUNDATION</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-72">
              <Input 
                placeholder="Search tickers, signals, or watchlists..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm">New Watchlist</Button>
            <Button size="sm">Run Scenario</Button>
          </div>
        </div>
      }
      sidebar={<Sidebar />}
    >
      <div className="max-w-[1400px]">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="uppercase tracking-[0.2em] text-hal-primary text-xs mb-1">LIVE SYSTEM</div>
            <h1 className="text-3xl font-medium tracking-tight">Command Center</h1>
          </div>
          <div className="text-right text-sm text-hal-muted">
            Universe: <span className="text-hal-text">S&amp;P 500</span><br />
            Last sync: <span className="text-hal-primary">just now</span>
          </div>
        </div>

        {/* Foundation Message */}
        <Card className="mb-8 border-hal-primary/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-hal-primary font-medium mb-1">Production Foundation Active</div>
              <p className="text-hal-text-soft max-w-2xl">
                This interface is running on the new evolvable architecture. All components, layout, and data access 
                follow strict patterns designed to make future development faster and safer.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.open('/docs/architecture/01-frontend-foundation.md', '_blank')}>
              View Docs
            </Button>
          </div>
        </Card>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm uppercase tracking-widest text-hal-muted mb-3">Active Signals</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>MSFT</span> <span className="text-hal-primary">+0.42</span></div>
              <div className="flex justify-between"><span>NVDA</span> <span className="text-hal-danger">-0.18</span></div>
              <div className="flex justify-between"><span>TSLA</span> <span className="text-hal-primary">+0.31</span></div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-full">View All Signals →</Button>
          </Card>

          <Card>
            <div className="text-sm uppercase tracking-widest text-hal-muted mb-3">Watchlist Activity</div>
            <div className="text-sm text-hal-text-soft">
              3 new filings detected in your active watchlists in the last hour.
            </div>
            <Button variant="secondary" size="sm" className="mt-4">Review Alerts</Button>
          </Card>

          <Card>
            <div className="text-sm uppercase tracking-widest text-hal-muted mb-3">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="justify-start">Tune Scenario Thresholds</Button>
              <Button variant="ghost" size="sm" className="justify-start">Run Portfolio Optimization</Button>
              <Button variant="ghost" size="sm" className="justify-start">Export ML Dataset</Button>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-[10px] text-hal-muted tracking-widest text-center">
          H.A.L. COMPASS • 2026 EVOLVABLE FOUNDATION • CHANGES HERE ARE VISIBLE IN REAL TIME
        </div>
      </div>
    </AppShell>
  );
}

export default App;

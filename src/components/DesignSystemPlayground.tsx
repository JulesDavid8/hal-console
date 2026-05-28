import { Button } from '../design-system/primitives/Button';
import { Card } from '../design-system/primitives/Card';
import { Input } from '../design-system/primitives/Input';
import { Badge } from '../design-system/primitives/Badge';
import { Spinner } from '../design-system/primitives/Spinner';
import { Tabs } from '../design-system/primitives/Tabs';
import { CommandBar } from '../design-system/primitives/CommandBar';
import { Combobox } from '../design-system/primitives/Combobox';

export function DesignSystemPlayground() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-medium tracking-tight mb-6">Design System Playground</h2>
        <p className="text-hal-muted max-w-2xl">
          This page exists to test and evolve our component library in isolation. 
          All primitives should be added and documented here.
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      {/* Inputs */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Inputs</h3>
        <div className="max-w-md space-y-4">
          <Input label="Ticker Symbol" placeholder="MSFT" />
          <Input label="With Error" placeholder="Enter value" error="This field is required" />
        </div>
      </Card>

      {/* Badges */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </Card>

      {/* Spinner */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Spinner</h3>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-hal-muted">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-xs text-hal-muted">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs text-hal-muted">lg</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Tabs</h3>
        <Tabs
          tabs={[
            { id: 'signals', label: 'Signals' },
            { id: 'watchlists', label: 'Watchlists' },
            { id: 'scenarios', label: 'Scenarios' },
          ]}
          defaultTab="signals"
        />
      </Card>

      {/* Command Bar */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Command Bar</h3>
        <CommandBar 
          placeholder="Type a command..." 
          onCommand={(cmd) => alert(`Command received: ${cmd}`)} 
        />
        <p className="text-xs text-hal-muted mt-2">Try typing something and pressing Enter</p>
      </Card>

      {/* Combobox */}
      <Card>
        <h3 className="font-medium mb-4 text-hal-primary">Combobox (Searchable Dropdown)</h3>
        <div className="max-w-md">
          <Combobox
            label="Select Company or Ticker"
            options={[
              { value: 'AAPL', label: 'Apple Inc.' },
              { value: 'MSFT', label: 'Microsoft Corporation' },
              { value: 'NVDA', label: 'NVIDIA Corporation' },
              { value: 'TSLA', label: 'Tesla Inc.' },
            ]}
            value=""
            onChange={(val) => console.log('Selected:', val)}
            placeholder="Search stocks or companies..."
          />
        </div>
      </Card>

      {/* Quick Alerts Pattern */}
      <Card>
        <h3 className="font-medium mb-3 text-hal-primary">Quick Alerts (Emerging Pattern)</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">Alert on Buying Cluster</Button>
          <Button variant="secondary" size="sm">Alert on Large Purchase</Button>
          <Button variant="secondary" size="sm">Alert on 10b5-1 Activity</Button>
        </div>
        <p className="text-xs text-hal-muted mt-2">
          This pattern will become one of the app’s biggest differentiators — context-aware alerts, not just price triggers.
        </p>
      </Card>
    </div>
  );
}

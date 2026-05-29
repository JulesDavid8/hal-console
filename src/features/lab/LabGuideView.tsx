import {
  AlertTriangle,
  BookOpen,
  Brain,
  Compass,
  Database,
  LineChart,
  Newspaper,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '../../design-system/primitives/Button';
import { Card } from '../../design-system/primitives/Card';

interface LabGuideViewProps {
  onBackToLab: () => void;
}

const FLOW_STEPS = [
  {
    title: '1. Configure your target',
    body: 'Choose a ticker and set the lookback window. Longer windows provide macro context; shorter windows emphasize tactical movement.',
  },
  {
    title: '2. Read structural price context',
    body: 'Use trend, 20/50-day behavior, 52-week location, and relative volume to identify whether the stock is trending, compressing, or unstable.',
  },
  {
    title: '3. Read flow + scenario pressure',
    body: 'Inspect insider/sentiment pressure and scenario catalysts to understand whether accumulation or distribution is dominant.',
  },
  {
    title: '4. Validate with intelligence drivers',
    body: 'Use macro/event intelligence to pressure-test your idea before execution and manage risk across uncertain headlines.',
  },
];

const DATA_LAYERS = [
  {
    icon: LineChart,
    title: 'Historical market structure',
    body: 'Daily bars, trend structure, volatility, and regime transitions from historical time series.',
  },
  {
    icon: Database,
    title: 'Flow and participation signals',
    body: 'Signal history, notional pressure patterns, and unusual bulk participation checks.',
  },
  {
    icon: Newspaper,
    title: 'Live world event context',
    body: 'Market, economic, political, technology, and conflict-related headlines ranked by impact and relevance.',
  },
  {
    icon: Brain,
    title: 'Reaction outlook synthesis',
    body: 'A composite outlook with direction, confidence, and explicit drivers so users can see why the model leans bullish, bearish, or neutral.',
  },
];

const DECISION_GUIDE = [
  'If trend and scenario align, treat pullbacks differently than if they conflict.',
  'If unusual bulk flow appears with strong event catalysts, expect higher short-term volatility.',
  'If macro pulse is contradictory, reduce sizing and require stronger confirmation before entry.',
  'Use confidence to calibrate risk, not to force conviction.',
];

export function LabGuideView({ onBackToLab }: LabGuideViewProps) {
  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 border-hal-primary/25">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-hal-primary mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              Lab Intelligence Guide
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">How H.A.L. Lab Works</h1>
            <p className="text-sm sm:text-base text-hal-muted mt-2 max-w-3xl">
              The Lab is built to convert high-noise market data into decision-ready structure.
              It combines historical behavior, live context, and catalyst interpretation so users can
              make faster and clearer trading decisions.
            </p>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={onBackToLab}>
            <PlayCircle className="h-4 w-4" />
            Open Lab Workspace
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-hal-primary" />
            <h2 className="text-lg font-medium tracking-tight">Workflow</h2>
          </div>
          <div className="space-y-3">
            {FLOW_STEPS.map((step) => (
              <div key={step.title} className="hal-panel bg-hal-panel-soft px-3 py-3">
                <div className="text-sm font-medium">{step.title}</div>
                <p className="text-sm text-hal-text-soft mt-1">{step.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-hal-primary" />
            <h2 className="text-lg font-medium tracking-tight">Intelligence Layers</h2>
          </div>
          <div className="space-y-3">
            {DATA_LAYERS.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.title} className="hal-panel bg-hal-panel-soft px-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-hal-accent" />
                    {layer.title}
                  </div>
                  <p className="text-sm text-hal-text-soft mt-1">{layer.body}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-hal-primary" />
          <h2 className="text-lg font-medium tracking-tight">Decision Discipline</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DECISION_GUIDE.map((item) => (
            <div key={item} className="hal-panel bg-hal-panel-soft px-3 py-3 text-sm text-hal-text-soft">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 border-hal-warning/35 bg-hal-warning/5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-hal-warning mt-0.5" />
          <p className="text-sm text-hal-text-soft">
            H.A.L. Lab is a decision support system, not financial advice. Always pair outputs with
            risk limits, position sizing rules, and independent judgment.
          </p>
        </div>
      </Card>
    </div>
  );
}

export type AlertRuleType =
  | 'insider_cluster_buy'
  | 'insider_cluster_sell'
  | 'large_single_purchase'
  | 'tenb5_1_activity'
  | 'sentiment_threshold'
  | 'sentiment_reversal'
  | 'net_notional_movement'
  | 'bearish_notional_pressure'
  | 'net_share_surge'
  | 'buy_sell_imbalance'
  | 'price_momentum_breakout'
  | 'daily_price_swing'
  | 'relative_volume_spike'
  | 'volatility_spike';

export type AlertThresholdUnit =
  | 'transactions'
  | 'usd'
  | 'shares'
  | 'sentiment'
  | 'ratio'
  | 'events'
  | 'percent';

export interface AlertThresholdOption {
  unit: AlertThresholdUnit;
  label: string;
  valueLabel: string;
  hint: string;
  defaultThreshold: number;
  min: number;
  max?: number;
  step: number;
  placeholder: string;
}

export interface AlertRule {
  id: string;
  ticker: string;
  ruleType: AlertRuleType;
  threshold: number;
  thresholdUnit: AlertThresholdUnit;
  enabled: boolean;
  createdAt: string;
  description: string;
}

export const RULE_TYPE_LABELS: Record<AlertRuleType, string> = {
  insider_cluster_buy: 'Insider Buying Cluster',
  insider_cluster_sell: 'Insider Selling Cluster',
  large_single_purchase: 'Large Single Purchase',
  tenb5_1_activity: '10b5-1 Filing Activity',
  sentiment_threshold: 'Sentiment Threshold Breach',
  sentiment_reversal: 'Sentiment Reversal',
  net_notional_movement: 'Significant Net Notional Move',
  bearish_notional_pressure: 'Bearish Notional Pressure',
  net_share_surge: 'Net Share Surge',
  buy_sell_imbalance: 'Buy/Sell Imbalance',
  price_momentum_breakout: 'Price Momentum Breakout',
  daily_price_swing: 'Daily Price Swing',
  relative_volume_spike: 'Relative Volume Spike',
  volatility_spike: 'Volatility Spike',
};

export const RULE_TYPE_DESCRIPTIONS: Record<AlertRuleType, string> = {
  insider_cluster_buy: 'Multiple insiders buying within a short window',
  insider_cluster_sell: 'Multiple insiders selling within a short window',
  large_single_purchase: 'Single insider purchase above a size threshold',
  tenb5_1_activity: 'New or amended 10b5-1 plans detected',
  sentiment_threshold: 'Overall sentiment crosses a defined level',
  sentiment_reversal: 'Day-over-day sentiment change exceeds a threshold',
  net_notional_movement: 'Large net dollar buying or selling pressure',
  bearish_notional_pressure: 'Net bearish notional pressure exceeds a threshold',
  net_share_surge: 'Large absolute share imbalance appears in one session',
  buy_sell_imbalance: 'Buy transactions materially outnumber sells',
  price_momentum_breakout: 'Price closes above 20-day trend by a defined percent',
  daily_price_swing: 'Absolute daily price move exceeds a selected percent',
  relative_volume_spike: 'Daily volume exceeds trailing average by a multiple',
  volatility_spike: 'Rolling 20-day realized volatility exceeds threshold',
};

export const ALERT_RULE_THRESHOLD_OPTIONS: Record<AlertRuleType, AlertThresholdOption[]> = {
  insider_cluster_buy: [
    {
      unit: 'transactions',
      label: 'Transaction Count',
      valueLabel: 'Minimum Buy Transactions',
      hint: 'Trigger when buy transactions meet/exceed this count.',
      defaultThreshold: 3,
      min: 1,
      step: 1,
      placeholder: '3',
    },
  ],
  insider_cluster_sell: [
    {
      unit: 'transactions',
      label: 'Transaction Count',
      valueLabel: 'Minimum Sell Transactions',
      hint: 'Trigger when sell transactions meet/exceed this count.',
      defaultThreshold: 3,
      min: 1,
      step: 1,
      placeholder: '3',
    },
  ],
  large_single_purchase: [
    {
      unit: 'usd',
      label: 'Dollar Amount (USD)',
      valueLabel: 'Minimum Bullish Notional (USD)',
      hint: 'Trigger when net bullish notional exceeds this dollar value.',
      defaultThreshold: 500000,
      min: 1000,
      step: 1000,
      placeholder: '500000',
    },
    {
      unit: 'shares',
      label: 'Share Count',
      valueLabel: 'Minimum Net Shares',
      hint: 'Trigger when positive net share imbalance exceeds this amount.',
      defaultThreshold: 12000,
      min: 100,
      step: 100,
      placeholder: '12000',
    },
  ],
  tenb5_1_activity: [
    {
      unit: 'events',
      label: 'Event Count',
      valueLabel: 'Minimum 10b5-1 Events',
      hint: 'Placeholder alert. Data support for 10b5-1 events is limited today.',
      defaultThreshold: 1,
      min: 1,
      step: 1,
      placeholder: '1',
    },
  ],
  sentiment_threshold: [
    {
      unit: 'sentiment',
      label: 'Sentiment Score',
      valueLabel: 'Absolute Sentiment Score',
      hint: 'Trigger when absolute sentiment reaches this value (0.00-1.00).',
      defaultThreshold: 0.35,
      min: 0.01,
      max: 1,
      step: 0.01,
      placeholder: '0.35',
    },
  ],
  sentiment_reversal: [
    {
      unit: 'sentiment',
      label: 'Sentiment Delta',
      valueLabel: 'Sentiment Change Threshold',
      hint: 'Trigger when day-over-day sentiment change exceeds this value.',
      defaultThreshold: 0.25,
      min: 0.01,
      max: 1,
      step: 0.01,
      placeholder: '0.25',
    },
  ],
  net_notional_movement: [
    {
      unit: 'usd',
      label: 'Dollar Amount (USD)',
      valueLabel: 'Absolute Net Notional (USD)',
      hint: 'Trigger when absolute net notional exceeds this dollar amount.',
      defaultThreshold: 750000,
      min: 1000,
      step: 1000,
      placeholder: '750000',
    },
    {
      unit: 'shares',
      label: 'Share Count',
      valueLabel: 'Absolute Net Shares',
      hint: 'Trigger when absolute net share imbalance exceeds this count.',
      defaultThreshold: 15000,
      min: 100,
      step: 100,
      placeholder: '15000',
    },
  ],
  bearish_notional_pressure: [
    {
      unit: 'usd',
      label: 'Dollar Amount (USD)',
      valueLabel: 'Minimum Bearish Notional (USD)',
      hint: 'Trigger when bearish notional exceeds this dollar amount.',
      defaultThreshold: 600000,
      min: 1000,
      step: 1000,
      placeholder: '600000',
    },
    {
      unit: 'shares',
      label: 'Share Count',
      valueLabel: 'Minimum Net Shares Sold',
      hint: 'Trigger when negative net shares exceed this count.',
      defaultThreshold: 12000,
      min: 100,
      step: 100,
      placeholder: '12000',
    },
  ],
  net_share_surge: [
    {
      unit: 'shares',
      label: 'Share Count',
      valueLabel: 'Absolute Net Shares',
      hint: 'Trigger when absolute net shares exceed this threshold.',
      defaultThreshold: 10000,
      min: 100,
      step: 100,
      placeholder: '10000',
    },
  ],
  buy_sell_imbalance: [
    {
      unit: 'ratio',
      label: 'Buy/Sell Ratio',
      valueLabel: 'Minimum Buy-to-Sell Ratio',
      hint: 'Trigger when buy transactions are this multiple of sell transactions.',
      defaultThreshold: 2,
      min: 1,
      step: 0.1,
      placeholder: '2.0',
    },
  ],
  price_momentum_breakout: [
    {
      unit: 'percent',
      label: 'Percent Above SMA-20',
      valueLabel: 'Close Above SMA-20 (%)',
      hint: 'Trigger when close is this percent above the 20-day moving average.',
      defaultThreshold: 2,
      min: 0.1,
      max: 30,
      step: 0.1,
      placeholder: '2.0',
    },
  ],
  daily_price_swing: [
    {
      unit: 'percent',
      label: 'Absolute Daily Move',
      valueLabel: 'Absolute Daily Move (%)',
      hint: 'Trigger when day-over-day move magnitude exceeds this percent.',
      defaultThreshold: 4,
      min: 0.5,
      max: 30,
      step: 0.1,
      placeholder: '4.0',
    },
  ],
  relative_volume_spike: [
    {
      unit: 'ratio',
      label: 'Relative Volume Multiple',
      valueLabel: 'Relative Volume (x)',
      hint: 'Trigger when volume exceeds trailing 20-day average by this multiple.',
      defaultThreshold: 1.8,
      min: 1,
      max: 10,
      step: 0.1,
      placeholder: '1.8',
    },
  ],
  volatility_spike: [
    {
      unit: 'percent',
      label: '20-Day Realized Volatility',
      valueLabel: 'Realized Volatility (%)',
      hint: 'Trigger when rolling 20-day volatility rises above this value.',
      defaultThreshold: 3.5,
      min: 0.5,
      max: 25,
      step: 0.1,
      placeholder: '3.5',
    },
  ],
};

export const ALERT_RULE_DEFAULT_THRESHOLDS: Record<AlertRuleType, number> = {
  insider_cluster_buy: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_buy[0].defaultThreshold,
  insider_cluster_sell: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_sell[0].defaultThreshold,
  large_single_purchase: ALERT_RULE_THRESHOLD_OPTIONS.large_single_purchase[0].defaultThreshold,
  tenb5_1_activity: ALERT_RULE_THRESHOLD_OPTIONS.tenb5_1_activity[0].defaultThreshold,
  sentiment_threshold: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_threshold[0].defaultThreshold,
  sentiment_reversal: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_reversal[0].defaultThreshold,
  net_notional_movement: ALERT_RULE_THRESHOLD_OPTIONS.net_notional_movement[0].defaultThreshold,
  bearish_notional_pressure: ALERT_RULE_THRESHOLD_OPTIONS.bearish_notional_pressure[0].defaultThreshold,
  net_share_surge: ALERT_RULE_THRESHOLD_OPTIONS.net_share_surge[0].defaultThreshold,
  buy_sell_imbalance: ALERT_RULE_THRESHOLD_OPTIONS.buy_sell_imbalance[0].defaultThreshold,
  price_momentum_breakout: ALERT_RULE_THRESHOLD_OPTIONS.price_momentum_breakout[0].defaultThreshold,
  daily_price_swing: ALERT_RULE_THRESHOLD_OPTIONS.daily_price_swing[0].defaultThreshold,
  relative_volume_spike: ALERT_RULE_THRESHOLD_OPTIONS.relative_volume_spike[0].defaultThreshold,
  volatility_spike: ALERT_RULE_THRESHOLD_OPTIONS.volatility_spike[0].defaultThreshold,
};

export const ALERT_RULE_DEFAULT_UNITS: Record<AlertRuleType, AlertThresholdUnit> = {
  insider_cluster_buy: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_buy[0].unit,
  insider_cluster_sell: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_sell[0].unit,
  large_single_purchase: ALERT_RULE_THRESHOLD_OPTIONS.large_single_purchase[0].unit,
  tenb5_1_activity: ALERT_RULE_THRESHOLD_OPTIONS.tenb5_1_activity[0].unit,
  sentiment_threshold: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_threshold[0].unit,
  sentiment_reversal: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_reversal[0].unit,
  net_notional_movement: ALERT_RULE_THRESHOLD_OPTIONS.net_notional_movement[0].unit,
  bearish_notional_pressure: ALERT_RULE_THRESHOLD_OPTIONS.bearish_notional_pressure[0].unit,
  net_share_surge: ALERT_RULE_THRESHOLD_OPTIONS.net_share_surge[0].unit,
  buy_sell_imbalance: ALERT_RULE_THRESHOLD_OPTIONS.buy_sell_imbalance[0].unit,
  price_momentum_breakout: ALERT_RULE_THRESHOLD_OPTIONS.price_momentum_breakout[0].unit,
  daily_price_swing: ALERT_RULE_THRESHOLD_OPTIONS.daily_price_swing[0].unit,
  relative_volume_spike: ALERT_RULE_THRESHOLD_OPTIONS.relative_volume_spike[0].unit,
  volatility_spike: ALERT_RULE_THRESHOLD_OPTIONS.volatility_spike[0].unit,
};

export const ALERT_RULE_THRESHOLD_HINTS: Record<AlertRuleType, string> = {
  insider_cluster_buy: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_buy[0].hint,
  insider_cluster_sell: ALERT_RULE_THRESHOLD_OPTIONS.insider_cluster_sell[0].hint,
  large_single_purchase: ALERT_RULE_THRESHOLD_OPTIONS.large_single_purchase[0].hint,
  tenb5_1_activity: ALERT_RULE_THRESHOLD_OPTIONS.tenb5_1_activity[0].hint,
  sentiment_threshold: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_threshold[0].hint,
  sentiment_reversal: ALERT_RULE_THRESHOLD_OPTIONS.sentiment_reversal[0].hint,
  net_notional_movement: ALERT_RULE_THRESHOLD_OPTIONS.net_notional_movement[0].hint,
  bearish_notional_pressure: ALERT_RULE_THRESHOLD_OPTIONS.bearish_notional_pressure[0].hint,
  net_share_surge: ALERT_RULE_THRESHOLD_OPTIONS.net_share_surge[0].hint,
  buy_sell_imbalance: ALERT_RULE_THRESHOLD_OPTIONS.buy_sell_imbalance[0].hint,
  price_momentum_breakout: ALERT_RULE_THRESHOLD_OPTIONS.price_momentum_breakout[0].hint,
  daily_price_swing: ALERT_RULE_THRESHOLD_OPTIONS.daily_price_swing[0].hint,
  relative_volume_spike: ALERT_RULE_THRESHOLD_OPTIONS.relative_volume_spike[0].hint,
  volatility_spike: ALERT_RULE_THRESHOLD_OPTIONS.volatility_spike[0].hint,
};

export interface AlertExplainabilityEvent {
  id: string;
  ticker: string;
  ruleType: AlertRuleType;
  ruleLabel: string;
  thresholdUnit: AlertThresholdUnit;
  thresholdLabel: string;
  asOf: string;
  observedValue: number;
  threshold: number;
  explanation: string;
  severity: 'info' | 'warning' | 'critical';
}

export type AlertRuleType =
  | 'insider_cluster_buy'
  | 'large_single_purchase'
  | 'tenb5_1_activity'
  | 'sentiment_threshold'
  | 'net_notional_movement';

export interface AlertRule {
  id: string;
  ticker?: string;
  ruleType: AlertRuleType;
  threshold?: number;           // e.g., shares, sentiment score, notional
  enabled: boolean;
  createdAt: string;
  description: string;          // Human readable summary
}

export const RULE_TYPE_LABELS: Record<AlertRuleType, string> = {
  insider_cluster_buy: 'Insider Buying Cluster',
  large_single_purchase: 'Large Single Purchase',
  tenb5_1_activity: '10b5-1 Filing Activity',
  sentiment_threshold: 'Sentiment Threshold Breach',
  net_notional_movement: 'Significant Net Notional Move',
};

export const RULE_TYPE_DESCRIPTIONS: Record<AlertRuleType, string> = {
  insider_cluster_buy: 'Multiple insiders buying within a short window',
  large_single_purchase: 'Single insider purchase above a size threshold',
  tenb5_1_activity: 'New or amended 10b5-1 plans detected',
  sentiment_threshold: 'Overall sentiment crosses a defined level',
  net_notional_movement: 'Large net dollar buying or selling pressure',
};

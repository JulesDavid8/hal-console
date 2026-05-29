import { useEffect, useMemo, useRef, useState } from 'react';

import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Combobox, type ComboboxOption } from '../../design-system/primitives/Combobox';
import { Input } from '../../design-system/primitives/Input';
import { Spinner } from '../../design-system/primitives/Spinner';
import { api } from '../../lib/api/client';
import type { SymbolSuggestion, SymbolSuggestionResponse } from '../market/types';
import {
  ALERT_RULE_DEFAULT_THRESHOLDS,
  ALERT_RULE_DEFAULT_UNITS,
  ALERT_RULE_THRESHOLD_OPTIONS,
  RULE_TYPE_DESCRIPTIONS,
  RULE_TYPE_LABELS,
  type AlertRule,
  type AlertRuleType,
  type AlertThresholdOption,
  type AlertThresholdUnit,
} from './types';

const tickerPattern = /^[A-Z0-9.-]{1,12}$/;

interface AlertRuleBuilderProps {
  onCreateRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  defaultTicker?: string;
}

function parseThresholdValue(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveTickerFromInput(rawInput: string, suggestions: SymbolSuggestion[]): string | null {
  const normalizedInput = rawInput.trim().toUpperCase();
  if (!normalizedInput) {
    return null;
  }

  const exactTickerSuggestion = suggestions.find(
    (suggestion) => suggestion.ticker.toUpperCase() === normalizedInput
  );
  if (exactTickerSuggestion) {
    return exactTickerSuggestion.ticker.toUpperCase();
  }

  if (suggestions.length > 0) {
    const normalizedQuery = rawInput.trim().toLowerCase();
    const companyMatch = suggestions.find((suggestion) =>
      suggestion.name.toLowerCase().includes(normalizedQuery)
    );
    if (companyMatch) {
      return companyMatch.ticker.toUpperCase();
    }

    const themeOrKeywordQuery =
      normalizedQuery.length >= 3 &&
      /^[a-z][a-z\s-]*$/i.test(normalizedQuery) &&
      !/[0-9.]/.test(normalizedQuery);

    if (themeOrKeywordQuery) {
      return suggestions[0].ticker.toUpperCase();
    }
  }

  if (tickerPattern.test(normalizedInput)) {
    return normalizedInput;
  }

  return suggestions.length > 0 ? suggestions[0].ticker.toUpperCase() : null;
}

export function AlertRuleBuilder({ onCreateRule, defaultTicker }: AlertRuleBuilderProps) {
  const [tickerInput, setTickerInput] = useState((defaultTicker || '').toUpperCase());
  const [ruleType, setRuleType] = useState<AlertRuleType>('insider_cluster_buy');
  const [thresholdUnit, setThresholdUnit] = useState<AlertThresholdUnit>(
    ALERT_RULE_DEFAULT_UNITS.insider_cluster_buy
  );
  const [thresholdText, setThresholdText] = useState(
    ALERT_RULE_DEFAULT_THRESHOLDS.insider_cluster_buy.toString()
  );

  const [tickerError, setTickerError] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const trimmed = tickerInput.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const payload = await api.get<SymbolSuggestionResponse>(
          `/search/symbols?q=${encodeURIComponent(trimmed)}&limit=8`
        );
        setSuggestions(payload.suggestions || []);
        setSuggestionsOpen((payload.suggestions || []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [tickerInput]);

  const alertTypeOptions = useMemo<ComboboxOption[]>(
    () =>
      (Object.keys(RULE_TYPE_LABELS) as AlertRuleType[]).map((type) => ({
        value: type,
        label: RULE_TYPE_LABELS[type],
        description: RULE_TYPE_DESCRIPTIONS[type],
      })),
    []
  );

  const activeThresholdOptions = useMemo<AlertThresholdOption[]>(
    () => ALERT_RULE_THRESHOLD_OPTIONS[ruleType],
    [ruleType]
  );

  const activeThresholdOption = useMemo<AlertThresholdOption>(() => {
    return (
      activeThresholdOptions.find((option) => option.unit === thresholdUnit) ||
      activeThresholdOptions[0]
    );
  }, [activeThresholdOptions, thresholdUnit]);

  const thresholdBasisOptions = useMemo<ComboboxOption[]>(
    () =>
      activeThresholdOptions.map((option) => ({
        value: option.unit,
        label: option.label,
        description: option.hint,
      })),
    [activeThresholdOptions]
  );

  const handleRuleTypeChange = (nextRuleType: AlertRuleType) => {
    const nextOptions = ALERT_RULE_THRESHOLD_OPTIONS[nextRuleType];
    const nextUnit = nextOptions[0].unit;
    setRuleType(nextRuleType);
    setThresholdUnit(nextUnit);
    setThresholdText(nextOptions[0].defaultThreshold.toString());
    setThresholdError(null);
  };

  const handleThresholdUnitChange = (nextUnit: AlertThresholdUnit) => {
    const matched = activeThresholdOptions.find((option) => option.unit === nextUnit);
    if (!matched) {
      return;
    }
    setThresholdUnit(nextUnit);
    setThresholdText(matched.defaultThreshold.toString());
    setThresholdError(null);
  };

  const chooseSuggestion = (suggestion: SymbolSuggestion) => {
    setTickerInput(suggestion.ticker.toUpperCase());
    setSuggestionsOpen(false);
    setTickerError(null);
  };

  const handleCreate = () => {
    const ticker = resolveTickerFromInput(tickerInput, suggestions);

    if (!ticker) {
      setTickerError('Enter a valid ticker or choose one of the live suggestions.');
      return;
    }

    const threshold = parseThresholdValue(thresholdText);
    if (threshold === null) {
      setThresholdError('Enter a numeric threshold value.');
      return;
    }

    if (threshold < activeThresholdOption.min) {
      setThresholdError(`Threshold must be at least ${activeThresholdOption.min}.`);
      return;
    }

    if (activeThresholdOption.max !== undefined && threshold > activeThresholdOption.max) {
      setThresholdError(`Threshold must be no more than ${activeThresholdOption.max}.`);
      return;
    }

    const rule = {
      ticker,
      ruleType,
      threshold,
      thresholdUnit,
      enabled: true,
      description: `${RULE_TYPE_LABELS[ruleType]} for ${ticker}`,
    };

    onCreateRule(rule);

    setTickerInput(ticker);
    setTickerError(null);
    setThresholdError(null);
  };

  const thresholdParsed = parseThresholdValue(thresholdText);
  const canCreate =
    tickerInput.trim().length > 0 &&
    thresholdParsed !== null &&
    thresholdParsed >= activeThresholdOption.min &&
    (activeThresholdOption.max === undefined || thresholdParsed <= activeThresholdOption.max);

  return (
    <Card>
      <h3 className="font-medium mb-4">Create Smart Alert</h3>

      <div className="space-y-4">
        <div ref={searchContainerRef} className="relative">
          <Input
            label="Ticker Symbol Or Company"
            value={tickerInput}
            onChange={(event) => {
              const nextValue = event.target.value;
              setTickerInput(nextValue);
              if (nextValue.trim().length < 2) {
                setSuggestions([]);
                setSuggestionsOpen(false);
                setSuggestionsLoading(false);
              }
              setTickerError(null);
            }}
            placeholder='Try "Tesla", "TSLA", "copper", "semiconductors"...'
            onFocus={() => {
              if (suggestions.length > 0) {
                setSuggestionsOpen(true);
              }
            }}
            onKeyDown={(event) => {
              const normalizedTicker = tickerInput.trim().toUpperCase();
              const exactTickerSuggestion = suggestions.some(
                (suggestion) => suggestion.ticker.toUpperCase() === normalizedTicker
              );

              if (event.key === 'Enter' && suggestions.length > 0 && !exactTickerSuggestion) {
                event.preventDefault();
                chooseSuggestion(suggestions[0]);
              }
            }}
            error={tickerError || undefined}
          />

          {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
            <div className="absolute z-30 mt-1 w-full rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-1 shadow-xl">
              {suggestionsLoading && (
                <div className="px-3 py-2 text-xs text-hal-muted flex items-center gap-2">
                  <Spinner size="sm" />
                  Finding ticker matches...
                </div>
              )}
              {!suggestionsLoading && (
                <ul className="max-h-72 overflow-auto py-1">
                  {suggestions.map((suggestion) => (
                    <li key={`${suggestion.ticker}-${suggestion.exchange}`}>
                      <button
                        type="button"
                        onClick={() => chooseSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-hal-panel-soft transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{suggestion.ticker}</div>
                            <div className="text-xs text-hal-text-soft">{suggestion.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-hal-muted">{suggestion.exchange}</div>
                            <div className="text-[10px] text-hal-primary">{suggestion.reason}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-hal-muted -mt-2">
          Type a ticker or company name and pick from live market suggestions.
        </p>

        <Combobox
          label="Alert Type"
          options={alertTypeOptions}
          value={ruleType}
          onChange={(value) => handleRuleTypeChange(value as AlertRuleType)}
          placeholder="Choose alert type"
        />
        <p className="text-xs text-hal-muted -mt-2">
          {RULE_TYPE_DESCRIPTIONS[ruleType]}
        </p>

        <Combobox
          label="Threshold Basis"
          options={thresholdBasisOptions}
          value={thresholdUnit}
          onChange={(value) => handleThresholdUnitChange(value as AlertThresholdUnit)}
          placeholder="Choose threshold basis"
          disabled={thresholdBasisOptions.length <= 1}
        />

        <Input
          label={activeThresholdOption.valueLabel}
          type="text"
          inputMode={activeThresholdOption.step < 1 ? 'decimal' : 'numeric'}
          value={thresholdText}
          onChange={(event) => {
            setThresholdText(event.target.value);
            setThresholdError(null);
          }}
          placeholder={activeThresholdOption.placeholder}
          error={thresholdError || undefined}
        />
        <p className="text-xs text-hal-muted -mt-2">{activeThresholdOption.hint}</p>

        <Button
          onClick={handleCreate}
          disabled={!canCreate}
          className="w-full"
        >
          Create Smart Alert
        </Button>
      </div>
    </Card>
  );
}

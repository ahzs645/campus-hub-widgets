'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget, Skeleton } from '@firstform/campus-hub-widget-sdk';
import { useFitScale } from '@firstform/campus-hub-widget-sdk';
import ExchangeRateOptions from './ExchangeRateOptions';

interface ExchangeRateConfig {
  baseCurrency?: string;
  currencies?: string[];
  cycleInterval?: number;
  amount?: number;
}

const DESIGN_W = 300;
const DESIGN_H = 90;
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColors(base: string, target: string, weight: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) return target;

  const clampedWeight = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clampedWeight);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

export default function ExchangeRate({ config, theme }: WidgetComponentProps) {
  const cfg = config as ExchangeRateConfig | undefined;
  const baseCurrency = cfg?.baseCurrency ?? 'USD';
  const currencies = cfg?.currencies ?? ['EUR', 'GBP', 'JPY', 'INR'];
  const cycleInterval = cfg?.cycleInterval ?? 10;
  const amount = cfg?.amount ?? 1;

  const { containerRef, containerWidth, containerHeight } = useFitScale(DESIGN_W, DESIGN_H);

  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRates(data.rates);
      setError(false);
    } catch {
      setError(true);
    }
  }, [baseCurrency]);

  // Fetch rates on mount and every 60 minutes
  useEffect(() => {
    fetchRates();
    const timer = setInterval(fetchRates, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchRates]);

  // Auto-cycle through currencies with fade transition
  useEffect(() => {
    if (currencies.length <= 1) return;

    const timer = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % currencies.length);
        setVisible(true);
      }, 300);
    }, cycleInterval * 1000);

    return () => clearInterval(timer);
  }, [currencies.length, cycleInterval]);

  // Reset index when currencies change
  useEffect(() => {
    setCurrentIndex(0);
  }, [currencies.join(',')]);

  const targetCurrency = currencies[currentIndex] ?? 'EUR';
  const rate = rates?.[targetCurrency];
  const convertedAmount = rate != null ? (amount * rate).toFixed(2) : '—';
  const panelBg = theme.background;
  const shellBg = mixColors(theme.background, '#ffffff', 0.05);
  const headlineColor = mixColors(theme.background, '#ffffff', 0.96);
  const mutedColor = mixColors(theme.background, '#ffffff', 0.67);
  const subtleColor = mixColors(theme.background, '#ffffff', 0.36);
  const fromPillBg = mixColors(theme.background, '#000000', 0.45);
  const fromBadgeBg = mixColors(theme.background, '#ffffff', 0.08);
  const resultCardBg = mixColors(theme.background, '#ffffff', 0.08);
  const resultCardBorder = mixColors(theme.accent, '#ffffff', 0.28);
  const resultCardText = headlineColor;
  const resultCardMuted = theme.accent;
  const targetBadgeBg = mixColors(theme.background, '#000000', 0.15);
  const frameWidth = Math.max(containerWidth || DESIGN_W, 180);
  const frameHeight = Math.max(containerHeight || DESIGN_H, 60);
  const tinyMode = frameWidth < 250 || frameHeight < 78;
  const bannerMode = frameWidth / frameHeight > 2.3;
  const outerRadius = clamp(Math.min(frameWidth, frameHeight) * 0.22, 14, 22);
  const shellRadius = clamp(Math.min(frameWidth, frameHeight) * 0.2, 12, 20);
  const padX = clamp(frameWidth * 0.055, 10, 18);
  const padY = clamp(frameHeight * 0.11, 8, 14);
  const sectionGap = clamp(frameWidth * 0.025, 8, 14);
  const headerGap = clamp(frameHeight * 0.08, 4, 8);
  const headerDot = clamp(frameHeight * 0.07, 4, 6);
  const headerSize = clamp(frameHeight * 0.115, 8, 11);
  const pillLabelSize = clamp(frameHeight * 0.11, 8, 10);
  const badgeSize = clamp(frameHeight * 0.125, 9, 12);
  const amountSize = clamp(Math.min(frameWidth * 0.12, frameHeight * 0.44), 24, bannerMode ? 56 : 64);
  const convertedSize = clamp(Math.min(frameWidth * 0.11, frameHeight * 0.38), 22, bannerMode ? 50 : 58);
  const resultWidth = clamp(frameWidth * (bannerMode ? 0.38 : 0.44), 112, 220);
  const bodyGap = clamp(frameHeight * 0.05, 3, 6);
  const showIndicators = currencies.length > 1 && !tinyMode;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: panelBg,
          backgroundImage: 'linear-gradient(var(--widget-theme-tint, transparent), var(--widget-theme-tint, transparent))',
          borderRadius: outerRadius,
          padding: 0,
        }}
        className="flex items-center justify-center"
        role="region"
        aria-label="Exchange rate display"
      >
        <div
          className="flex flex-col"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: shellBg,
            borderRadius: shellRadius,
            padding: `${padY}px ${padX}px`,
          }}
        >
          <div
            className="flex items-center"
            style={{
              gap: headerGap,
              marginBottom: clamp(frameHeight * 0.11, 6, 10),
            }}
          >
            <div
              style={{
                width: headerDot,
                height: headerDot,
                borderRadius: '50%',
                backgroundColor: theme.accent,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: mutedColor,
                fontSize: headerSize,
                fontWeight: 700,
                letterSpacing: tinyMode ? 1.4 : 2,
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Exchange
            </span>
          </div>

          {error && !rates ? (
            <div
              className="flex-1 flex items-center justify-center"
              style={{ color: theme.accent, fontSize: pillLabelSize }}
            >
              Unable to load rates
            </div>
          ) : !rates ? (
            <Skeleton width="w-full" height="h-full" rounded="rounded-2xl" className="flex-1" />
          ) : (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div
                className="flex items-stretch transition-all duration-300 ease-in-out"
                style={{
                  gap: sectionGap,
                  minHeight: 0,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(4px)',
                }}
              >
                <div className="flex-1 min-w-0 flex flex-col justify-between" style={{ gap: bodyGap }}>
                  <div
                    style={{
                      backgroundColor: fromPillBg,
                      borderRadius: clamp(frameHeight * 0.28, 14, 22),
                      padding: `${clamp(frameHeight * 0.04, 2, 4)}px ${clamp(frameWidth * 0.03, 8, 12)}px`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      gap: clamp(frameWidth * 0.015, 4, 6),
                    }}
                  >
                    <span
                      style={{
                        fontSize: pillLabelSize,
                        color: subtleColor,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      From
                    </span>
                    <span
                      style={{
                        backgroundColor: fromBadgeBg,
                        borderRadius: clamp(frameHeight * 0.14, 8, 12),
                        padding: `${clamp(frameHeight * 0.02, 1, 3)}px ${clamp(frameWidth * 0.02, 6, 10)}px`,
                        fontSize: badgeSize,
                        fontWeight: 700,
                        color: headlineColor,
                        letterSpacing: 0.8,
                      }}
                    >
                      {baseCurrency}
                    </span>
                  </div>

                  <span
                    className="font-mono"
                    style={{
                      fontSize: amountSize,
                      fontWeight: 700,
                      color: headlineColor,
                      lineHeight: 0.92,
                      letterSpacing: -1,
                    }}
                  >
                    {amount}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: resultCardBg,
                    borderRadius: clamp(frameHeight * 0.26, 14, 18),
                    padding: `${clamp(frameHeight * 0.11, 7, 12)}px ${clamp(frameWidth * 0.038, 10, 16)}px`,
                    width: resultWidth,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: bodyGap,
                    boxShadow: `inset 0 0 0 1px ${resultCardBorder}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: headerSize,
                      fontWeight: 700,
                      color: resultCardMuted,
                      letterSpacing: tinyMode ? 1.2 : 2,
                      textTransform: 'uppercase',
                      lineHeight: 1,
                    }}
                  >
                    Total
                  </span>

                  <span
                    className="font-mono"
                    style={{
                      fontSize: convertedSize,
                      fontWeight: 700,
                      color: resultCardText,
                      lineHeight: 0.95,
                      letterSpacing: -0.6,
                    }}
                  >
                    {convertedAmount}
                  </span>

                  <div
                    style={{
                      backgroundColor: targetBadgeBg,
                      borderRadius: clamp(frameHeight * 0.16, 8, 12),
                      padding: `${clamp(frameHeight * 0.02, 1, 3)}px ${clamp(frameWidth * 0.02, 6, 10)}px`,
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      alignItems: 'center',
                      gap: clamp(frameWidth * 0.012, 3, 5),
                    }}
                  >
                    <span
                      style={{
                        fontSize: pillLabelSize,
                        color: subtleColor,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      To
                    </span>
                    <span
                      style={{
                        fontSize: badgeSize,
                        fontWeight: 700,
                        color: headlineColor,
                        letterSpacing: 0.8,
                      }}
                    >
                      {targetCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {showIndicators && (
                <div
                  className="flex justify-center"
                  style={{
                    gap: clamp(frameWidth * 0.012, 4, 6),
                    marginTop: clamp(frameHeight * 0.07, 4, 8),
                  }}
                >
                  {currencies.map((cur, i) => (
                    <div
                      key={cur}
                      style={{
                        width: i === currentIndex ? clamp(frameWidth * 0.035, 9, 12) : clamp(frameWidth * 0.015, 4, 5),
                        height: clamp(frameHeight * 0.05, 3, 4),
                        borderRadius: 999,
                        backgroundColor: i === currentIndex ? theme.accent : subtleColor,
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Register the widget
registerWidget({
  type: 'exchange-rate',
  name: 'Exchange Rate',
  description: 'Live currency exchange rates',
  icon: 'arrowLeftRight',
  minW: 2,
  minH: 1,
  defaultW: 3,
  defaultH: 1,
  component: ExchangeRate,
  OptionsComponent: ExchangeRateOptions,
  defaultProps: {
    baseCurrency: 'USD',
    currencies: ['EUR', 'GBP', 'JPY', 'INR'],
    cycleInterval: 10,
    amount: 1,
  },
});

'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WidgetComponentProps, registerWidget, ThemedContainer, PillIndicator } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale } from '@firstform/campus-hub-widget-sdk';
import CountdownOptions from './CountdownOptions';

type UnitVisibility = 'auto' | 'show' | 'hide';

export interface Milestone {
  label: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:MM"
  emoji?: string;
}

interface CountdownConfig {
  // Legacy single-event fields (still supported for backwards compat)
  targetDate?: string;
  targetTime?: string;
  eventName?: string;
  // New multi-milestone fields
  milestones?: Milestone[];
  rotationSeconds?: number;
  hideCompleted?: boolean;
  // Unit visibility
  showYears?: UnitVisibility;
  showDays?: UnitVisibility;
  showHours?: UnitVisibility;
  showMinutes?: UnitVisibility;
  showSeconds?: UnitVisibility;
  showMilliseconds?: UnitVisibility;
}

interface TimeRemaining {
  total: number;
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

const EMPTY_REMAINING: TimeRemaining = {
  total: 0,
  years: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeRemaining(target: Date, now: number = Date.now()): TimeRemaining {
  const total = Math.max(0, target.getTime() - now);

  if (total <= 0) {
    return EMPTY_REMAINING;
  }

  let remainder = total;

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const years = Math.floor(remainder / msPerYear);
  remainder -= years * msPerYear;

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor(remainder / msPerDay);
  remainder -= days * msPerDay;

  const hours = Math.floor(remainder / (60 * 60 * 1000));
  remainder -= hours * 60 * 60 * 1000;

  const minutes = Math.floor(remainder / (60 * 1000));
  remainder -= minutes * 60 * 1000;

  const seconds = Math.floor(remainder / 1000);
  const milliseconds = Math.floor(remainder % 1000);

  return { total, years, days, hours, minutes, seconds, milliseconds };
}

function shouldShowUnit(visibility: UnitVisibility, value: number, hasLargerUnit: boolean): boolean {
  if (visibility === 'show') return true;
  if (visibility === 'hide') return false;
  return value > 0 || hasLargerUnit;
}

interface UnitDisplayProps {
  value: number;
  label: string;
  padWidth: number;
  accent: string;
  width?: number;
  valueFontSize?: number;
  labelFontSize?: number;
  chipPaddingX?: number;
  chipPaddingY?: number;
  chipRadius?: number;
  labelMarginTop?: number;
}

function UnitDisplay({
  value,
  label,
  padWidth,
  accent,
  width,
  valueFontSize = 36,
  labelFontSize = 12,
  chipPaddingX = 8,
  chipPaddingY = 6,
  chipRadius = 8,
  labelMarginTop = 6,
}: UnitDisplayProps) {
  const display = String(value).padStart(padWidth, '0');
  return (
    <div className="flex flex-col items-center" style={{ width }}>
      <div
        className="font-bold font-mono tabular-nums leading-none"
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          color: '#ffffff',
          fontSize: valueFontSize,
          padding: `${chipPaddingY}px ${chipPaddingX}px`,
          borderRadius: chipRadius,
          width: width ? '100%' : undefined,
          textAlign: 'center',
        }}
      >
        {display}
      </div>
      <div
        className="uppercase tracking-wider font-medium"
        style={{
          color: accent,
          fontSize: labelFontSize,
          marginTop: labelMarginTop,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Separator({ fontSize = 30, marginX = 2, marginTop = 4, glyph = ':' }: {
  fontSize?: number;
  marginX?: number;
  marginTop?: number;
  glyph?: string;
}) {
  return (
    <div
      className="font-bold text-white/30 self-start"
      style={{
        fontSize,
        marginTop,
        marginInline: marginX,
        lineHeight: 1,
      }}
    >
      {glyph}
    </div>
  );
}

// Default: count down to next New Year
function getDefaultTarget(): Date {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(`${year}-01-01T00:00:00`);
}

function milestoneToTarget(m: Milestone): Date {
  const time = m.time?.trim() || '00:00';
  return new Date(`${m.date}T${time}:00`);
}

/** Migrate legacy single-event config to milestones array */
function getMilestones(cfg: CountdownConfig | undefined): Milestone[] {
  if (cfg?.milestones && cfg.milestones.length > 0) {
    return cfg.milestones;
  }
  // Legacy: convert single event fields to a milestone
  if (cfg?.targetDate?.trim()) {
    return [{
      label: cfg.eventName?.trim() || '',
      date: cfg.targetDate.trim(),
      time: cfg.targetTime?.trim() || '00:00',
    }];
  }
  // Default: next New Year
  const target = getDefaultTarget();
  const y = target.getFullYear();
  return [{ label: `New Year ${y}`, date: `${y}-01-01`, time: '00:00', emoji: '🎉' }];
}

export default function Countdown({ config, theme }: WidgetComponentProps) {
  const cfg = config as CountdownConfig | undefined;

  const showYears = cfg?.showYears ?? 'auto';
  const showDays = cfg?.showDays ?? 'auto';
  const showHours = cfg?.showHours ?? 'auto';
  const showMinutes = cfg?.showMinutes ?? 'auto';
  const showSeconds = cfg?.showSeconds ?? 'auto';
  const showMilliseconds = cfg?.showMilliseconds ?? 'hide';
  const hideCompleted = cfg?.hideCompleted ?? true;
  const rotationSeconds = Math.max(3, Math.min(60, cfg?.rotationSeconds ?? 8));

  const allMilestones = useMemo(() => getMilestones(cfg), [cfg]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Filter out completed milestones if requested
  const activeMilestones = useMemo(() => {
    if (!hideCompleted) return allMilestones;
    const active = allMilestones.filter(m => {
      const t = milestoneToTarget(m);
      return !isNaN(t.getTime()) && t.getTime() > nowMs;
    });
    // If all are completed, show the last one so the widget isn't empty
    return active.length > 0 ? active : allMilestones.slice(-1);
  }, [allMilestones, hideCompleted, nowMs]);

  const [activeIndex, setActiveIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizedActiveIndex =
    activeMilestones.length > 0 ? activeIndex % activeMilestones.length : 0;
  const currentMilestone = activeMilestones[normalizedActiveIndex];
  const target = useMemo(
    () => (currentMilestone ? milestoneToTarget(currentMilestone) : getDefaultTarget()),
    [currentMilestone]
  );
  const isValidTarget = !isNaN(target.getTime());
  const remaining = useMemo(
    () => (isValidTarget ? computeRemaining(target, nowMs) : EMPTY_REMAINING),
    [isValidTarget, nowMs, target]
  );
  const tick = useCallback(() => {
    setNowMs(Date.now());
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!isValidTarget) return;

    const useRaf = showMilliseconds === 'show';

    if (useRaf) {
      const frame = () => {
        tick();
        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      const needsMs = showMilliseconds === 'auto';
      const intervalMs = needsMs ? 100 : 1000;
      rafRef.current = requestAnimationFrame(tick);
      intervalRef.current = setInterval(tick, intervalMs);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isValidTarget, showMilliseconds, tick]);

  // Auto-rotation between milestones
  useEffect(() => {
    if (activeMilestones.length <= 1) return;
    rotationRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % activeMilestones.length);
    }, rotationSeconds * 1000);
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [activeMilestones.length, rotationSeconds]);

  // Landscape: wide banner for all units in a row; portrait: taller with wrapping units
  const {
    containerRef,
    scale,
    designWidth: BASE_W,
    designHeight: DESIGN_H,
    isLandscape,
    containerWidth,
    containerHeight,
  } = useAdaptiveFitScale({
    landscape: { w: 500, h: 220 },
    portrait: { w: 280, h: 360 },
  });
  // Fill the full container width when stretched horizontally
  const DESIGN_W = containerWidth > 0 ? Math.max(BASE_W, containerWidth / scale) : BASE_W;

  const isFinished = remaining.total <= 0;

  // Determine which units to show
  const units: { key: string; value: number; label: string; padWidth: number }[] = [];
  const yearsVisible = shouldShowUnit(showYears, remaining.years, false);
  const daysVisible = shouldShowUnit(showDays, remaining.days, yearsVisible);
  const hoursVisible = shouldShowUnit(showHours, remaining.hours, yearsVisible || daysVisible);
  const minutesVisible = shouldShowUnit(showMinutes, remaining.minutes, yearsVisible || daysVisible || hoursVisible);
  const secondsVisible = shouldShowUnit(showSeconds, remaining.seconds, yearsVisible || daysVisible || hoursVisible || minutesVisible);
  const msVisible = shouldShowUnit(showMilliseconds, remaining.milliseconds, false);

  if (yearsVisible) units.push({ key: 'years', value: remaining.years, label: remaining.years === 1 ? 'Year' : 'Years', padWidth: 1 });
  if (daysVisible) units.push({ key: 'days', value: remaining.days, label: remaining.days === 1 ? 'Day' : 'Days', padWidth: remaining.days >= 100 ? 3 : remaining.days >= 10 ? 2 : 1 });
  if (hoursVisible) units.push({ key: 'hours', value: remaining.hours, label: remaining.hours === 1 ? 'Hour' : 'Hours', padWidth: 2 });
  if (minutesVisible) units.push({ key: 'minutes', value: remaining.minutes, label: remaining.minutes === 1 ? 'Min' : 'Mins', padWidth: 2 });
  if (secondsVisible) units.push({ key: 'seconds', value: remaining.seconds, label: remaining.seconds === 1 ? 'Sec' : 'Secs', padWidth: 2 });
  if (msVisible) units.push({ key: 'ms', value: remaining.milliseconds, label: 'MS', padWidth: 3 });

  const useCompactLayout =
    !isLandscape ||
    (containerWidth > 0 && units.length > 0 && containerWidth / units.length < 92);

  const resolvedWidth = DESIGN_W;
  const resolvedHeight = containerHeight > 0 ? Math.max(DESIGN_H, containerHeight / scale) : DESIGN_H;
  const sidePaddingX = clamp(resolvedWidth * (useCompactLayout ? 0.045 : 0.04), 12, 28);
  const sidePaddingY = clamp(resolvedHeight * (useCompactLayout ? 0.07 : 0.065), 12, 24);
  const contentWidth = Math.max(resolvedWidth - sidePaddingX * 2, 220);
  const expandedLayout = !useCompactLayout && units.length > 0;
  const titleFontSize = clamp(Math.min(resolvedWidth * 0.052, resolvedHeight * 0.19), 16, 34);
  const titleMarginBottom = clamp(resolvedHeight * 0.04, 8, 16);
  const dateFontSize = clamp(Math.min(resolvedWidth * 0.026, resolvedHeight * 0.09), 10, 18);
  const dateMarginTop = clamp(resolvedHeight * 0.038, 8, 14);
  const compactGap = clamp(contentWidth * 0.03, 10, 18);
  const separatorFontSize = clamp(Math.min(contentWidth / 18, resolvedHeight * 0.2), 22, 48);
  const separatorMarginX = clamp(separatorFontSize * 0.12, 2, 8);
  const separatorMarginTop = clamp(resolvedHeight * 0.01, 2, 8);
  const separatorSlot = separatorFontSize * 0.55 + separatorMarginX * 2;
  const expandedGap = clamp(contentWidth * 0.012, 8, 18);
  const compactUnitWidth = useCompactLayout
    ? clamp(
        (contentWidth - compactGap * Math.max(units.length - 1, 0)) /
          Math.max(units.length, 1),
        56,
        108
      )
    : undefined;
  const unitWidth = expandedLayout
    ? clamp(
        (contentWidth - separatorSlot * Math.max(units.length - 1, 0) - expandedGap * Math.max(units.length - 1, 0)) /
          Math.max(units.length, 1),
        64,
        120
      )
    : undefined;
  const valueFontSize = expandedLayout && unitWidth
    ? clamp(Math.min(unitWidth * 0.58, resolvedHeight * 0.28), 36, 64)
    : clamp(
        Math.min((compactUnitWidth ?? 72) * 0.6, resolvedHeight * 0.28),
        34,
        56
      );
  const chipPaddingX = expandedLayout && unitWidth
    ? clamp(unitWidth * 0.12, 10, 16)
    : clamp((compactUnitWidth ?? 72) * 0.14, 8, 14);
  const chipPaddingY = expandedLayout
    ? clamp(valueFontSize * 0.2, 7, 14)
    : clamp(valueFontSize * 0.18, 6, 12);
  const chipRadius = expandedLayout && unitWidth
    ? clamp(unitWidth * 0.14, 10, 18)
    : clamp((compactUnitWidth ?? 72) * 0.16, 8, 16);
  const labelFontSize = expandedLayout
    ? clamp(valueFontSize * 0.27, 11, 16)
    : clamp(valueFontSize * 0.24, 11, 15);
  const labelMarginTop = expandedLayout
    ? clamp(resolvedHeight * 0.03, 6, 12)
    : clamp(resolvedHeight * 0.022, 4, 8);

  const eventLabel = currentMilestone?.label || '';
  const eventEmoji = currentMilestone?.emoji || '';

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="20"
    >
      <div
        style={{
          width: DESIGN_W,
          height: resolvedHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          padding: `${sidePaddingY}px ${sidePaddingX}px`,
        }}
        className="flex flex-col items-center justify-center"
      >
        {/* Event Name with optional emoji */}
        {(eventLabel || eventEmoji) && (
          <div
            className="font-semibold tracking-wide uppercase transition-opacity duration-500"
            style={{
              color: theme.accent,
              fontSize: titleFontSize,
              marginBottom: titleMarginBottom,
            }}
          >
            {eventEmoji && <span className="mr-1.5">{eventEmoji}</span>}
            {eventLabel}
            {eventEmoji && <span className="ml-1.5">{eventEmoji}</span>}
          </div>
        )}

        {!isValidTarget ? (
          <div className="text-white/50 text-lg">Set a target date in options</div>
        ) : isFinished ? (
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {eventEmoji || '🎉'} Time&apos;s Up!
            </div>
            {eventLabel && (
              <div className="text-lg" style={{ color: theme.accent }}>
                {eventLabel} has arrived
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              useCompactLayout
                ? 'flex w-full flex-wrap items-center justify-center'
                : 'flex w-full items-center justify-center'
            }
            style={
              useCompactLayout
                ? {
                    columnGap: compactGap,
                    rowGap: compactGap,
                    maxWidth: Math.min(contentWidth, 420),
                  }
                : {
                    gap: expandedGap,
                  }
            }
          >
            {units.map((unit, i) => (
              <div key={unit.key} className="flex items-center">
                {!useCompactLayout && i > 0 && unit.key !== 'ms' && (
                  <Separator
                    fontSize={separatorFontSize}
                    marginX={separatorMarginX}
                    marginTop={separatorMarginTop}
                  />
                )}
                {!useCompactLayout && i > 0 && unit.key === 'ms' && (
                  <Separator
                    glyph="."
                    fontSize={separatorFontSize}
                    marginX={separatorMarginX}
                    marginTop={separatorMarginTop}
                  />
                )}
                <UnitDisplay
                  value={unit.value}
                  label={unit.label}
                  padWidth={unit.padWidth}
                  accent={theme.accent}
                  width={expandedLayout ? unitWidth : compactUnitWidth}
                  valueFontSize={valueFontSize}
                  labelFontSize={labelFontSize}
                  chipPaddingX={chipPaddingX}
                  chipPaddingY={chipPaddingY}
                  chipRadius={chipRadius}
                  labelMarginTop={labelMarginTop}
                />
              </div>
            ))}
          </div>
        )}

        {/* Target date display */}
        {isValidTarget && !isFinished && (
          <div
            className="text-white/30 text-center"
            style={{
              fontSize: dateFontSize,
              marginTop: dateMarginTop,
            }}
          >
            {target.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {(currentMilestone?.time || '00:00') !== '00:00' && ` at ${currentMilestone?.time}`}
          </div>
        )}

        {/* Dot indicators for multiple milestones */}
        {activeMilestones.length > 1 && (
          <PillIndicator
            theme={theme}
            count={activeMilestones.length}
            active={normalizedActiveIndex}
            className="mt-3"
          />
        )}
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'countdown',
  name: 'Countdown',
  description: 'Countdown timer with multiple milestones, auto-rotation, and dot indicators',
  icon: 'hourglass',
  minW: 2,
  minH: 2,
  defaultW: 4,
  defaultH: 2,
  component: Countdown,
  OptionsComponent: CountdownOptions,
  defaultProps: {
    milestones: [],
    rotationSeconds: 8,
    hideCompleted: true,
    showYears: 'auto',
    showDays: 'auto',
    showHours: 'auto',
    showMinutes: 'auto',
    showSeconds: 'auto',
    showMilliseconds: 'hide',
  },
});

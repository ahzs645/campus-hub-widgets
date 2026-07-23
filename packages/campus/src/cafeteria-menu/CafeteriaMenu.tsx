'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  WidgetComponentProps,
  registerWidget,
  CAFETERIA_DAY_NAMES,
  hasCafeteriaMenuContent,
  loadCafeteriaSource,
  resolveSourceAdapter,
  type CafeteriaMealSection,
  type CafeteriaMenuItem,
  type CafeteriaMenuStatus,
  type ParsedCafeteriaMenu,
} from '@firstform/campus-hub-widget-sdk';
import { getCorsProxyUrl } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import CafeteriaMenuOptions from './CafeteriaMenuOptions';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MealPeriod = 'breakfast' | 'lunch' | 'dinner';
type ServicePeriod = MealPeriod | 'closed';

interface ServiceWindows {
  breakfastStart: string;
  breakfastEnd: string;
  lunchStart: string;
  lunchEnd: string;
  dinnerStart: string;
  dinnerEnd: string;
}

interface CafeteriaConfig {
  menuUrl?: string;
  sourceAdapter?: string;
  danaLocations?: string;    // comma-separated Dana Hospitality loc IDs e.g. "48784"
  refreshInterval?: number;  // minutes
  weekdayBreakfastStart?: string; // HH:MM
  weekdayBreakfastEnd?: string;   // HH:MM
  weekdayLunchStart?: string;     // HH:MM
  weekdayLunchEnd?: string;       // HH:MM
  weekdayDinnerStart?: string;    // HH:MM
  weekdayDinnerEnd?: string;      // HH:MM
  weekendBreakfastStart?: string; // HH:MM
  weekendBreakfastEnd?: string;   // HH:MM
  weekendLunchStart?: string;     // HH:MM
  weekendLunchEnd?: string;       // HH:MM
  weekendDinnerStart?: string;    // HH:MM
  weekendDinnerEnd?: string;      // HH:MM

  useCorsProxy?: boolean;

  // Backwards compatibility with older widget configs
  breakfastEnd?: string;     // HH:MM
  lunchEnd?: string;         // HH:MM
  dinnerEnd?: string;        // HH:MM
}

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const DEFAULT_WEEKDAY_WINDOWS: ServiceWindows = {
  breakfastStart: '07:00',
  breakfastEnd: '10:45',
  lunchStart: '11:00',
  lunchEnd: '15:45',
  dinnerStart: '16:00',
  dinnerEnd: '23:00',
};

const DEFAULT_WEEKEND_WINDOWS: ServiceWindows = {
  breakfastStart: '08:00',
  breakfastEnd: '10:45',
  lunchStart: '11:00',
  lunchEnd: '15:45',
  dinnerStart: '16:00',
  dinnerEnd: '22:00',
};

const readTimeValue = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed && /^\d{1,2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
};

const getServiceWindows = (config: CafeteriaConfig, date = new Date()): ServiceWindows => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const defaults = isWeekend ? DEFAULT_WEEKEND_WINDOWS : DEFAULT_WEEKDAY_WINDOWS;

  if (isWeekend) {
    return {
      breakfastStart: readTimeValue(config.weekendBreakfastStart, defaults.breakfastStart),
      breakfastEnd: readTimeValue(config.weekendBreakfastEnd, defaults.breakfastEnd),
      lunchStart: readTimeValue(config.weekendLunchStart, defaults.lunchStart),
      lunchEnd: readTimeValue(config.weekendLunchEnd, defaults.lunchEnd),
      dinnerStart: readTimeValue(config.weekendDinnerStart, defaults.dinnerStart),
      dinnerEnd: readTimeValue(config.weekendDinnerEnd, defaults.dinnerEnd),
    };
  }

  return {
    breakfastStart: readTimeValue(config.weekdayBreakfastStart, defaults.breakfastStart),
    breakfastEnd: readTimeValue(config.weekdayBreakfastEnd, defaults.breakfastEnd),
    lunchStart: readTimeValue(config.weekdayLunchStart, defaults.lunchStart),
    lunchEnd: readTimeValue(config.weekdayLunchEnd, defaults.lunchEnd),
    dinnerStart: readTimeValue(config.weekdayDinnerStart, defaults.dinnerStart),
    dinnerEnd: readTimeValue(config.weekdayDinnerEnd, defaults.dinnerEnd),
  };
};

const getCurrentServicePeriod = (config: CafeteriaConfig): ServicePeriod => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const windows = getServiceWindows(config, now);

  const breakfastStart = timeToMinutes(windows.breakfastStart);
  const breakfastEnd = timeToMinutes(windows.breakfastEnd);
  const lunchStart = timeToMinutes(windows.lunchStart);
  const lunchEnd = timeToMinutes(windows.lunchEnd);
  const dinnerStart = timeToMinutes(windows.dinnerStart);
  const dinnerEnd = timeToMinutes(windows.dinnerEnd);

  if (mins >= breakfastStart && mins < breakfastEnd) return 'breakfast';
  if (mins >= lunchStart && mins < lunchEnd) return 'lunch';
  if (mins >= dinnerStart && mins < dinnerEnd) return 'dinner';
  return 'closed';
};

const MEAL_LABELS: Record<ServicePeriod, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  closed: 'Closed',
};

const MENU_STATUS_MESSAGES: Record<Exclude<CafeteriaMenuStatus, 'ready'>, string> = {
  seasonClosed: 'Cafeteria is closed for the season.',
  unavailable: 'Cafeteria menu is temporarily unavailable.',
};

const WEEKDAY_PREFIX_PATTERN = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday):\s*/i;

const filterSectionsToToday = (sections: CafeteriaMealSection[], date = new Date()): CafeteriaMealSection[] => {
  const todayLabel = CAFETERIA_DAY_NAMES[date.getDay()];

  return sections
    .map((section) => {
      const hasDayPrefixedItems = section.items.some((item) => WEEKDAY_PREFIX_PATTERN.test(item.name));
      if (!hasDayPrefixedItems) return section;

      const todayItems = section.items
        .filter((item) => item.name.toLowerCase().startsWith(`${todayLabel.toLowerCase()}:`))
        .map((item) => ({
          ...item,
          name: item.name.replace(WEEKDAY_PREFIX_PATTERN, '').trim(),
        }));

      return { ...section, items: todayItems };
    })
    .filter((section) => section.items.length > 0);
};

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const DEMO_MENU: ParsedCafeteriaMenu = {
  weekly: [
    {
      title: 'Weekly Specials',
      items: [
        { name: 'Born of Fire Lunch, Born of Fire Dinner, and Showtime rotate by day.' },
      ],
    },
  ],
  breakfast: [
    {
      title: 'Breakfast',
      items: [
        { name: 'Scrambled Eggs & Toast' },
        { name: 'Pancakes with Maple Syrup' },
        { name: 'Fresh Fruit & Yogurt' },
        { name: 'Breakfast Burrito' },
      ],
    },
  ],
  lunch: [
    {
      title: 'Born of Fire Lunch',
      items: [
        { name: 'Sunday: Chicken Fajitas • Seasoned Rice • Daily Vegetables' },
        { name: 'Monday: Fried Chicken • Seasoned Rice • Baked Beans • Daily Vegetables' },
        { name: 'Tuesday: Build your Own Fish Taco • Seasoned Rice • Taco Fixings' },
        { name: 'Wednesday: Daily Vegetables • Chicken Cordon Bleu Casserole • Roasted herb Potatoes' },
        { name: 'Thursday: Daily Vegetables • Chicken & Sausage Jambalaya • Roasted Sweet Potato • Garlic Toast' },
        { name: 'Friday: Daily Vegetables • Beef and Bean Chimichangas • Seasoned Rice • Daily Vegetables' },
        { name: 'Saturday: Tuscan Beef Ravioli • Seasoned Rice • Daily Vegetables • Garlic Toast' },
      ],
    },
  ],
  dinner: [
    {
      title: 'Born of Fire Dinner',
      items: [
        { name: 'Sunday: Daily Vegetables • Buffalo Chicken Macaroni and Cheese (HALAL) • Garlic Toast' },
        { name: 'Monday: Chipotle Chicken Pasta Cassarole (HALAL) • Roasted Yam and Potato • Garlic Toast • Daily Vegetables' },
        { name: 'Tuesday: Karage Chicken Stir Fry with Orange Ginger Sauce (HALAL) • Seasoned Rice • Daily Vegetables' },
        { name: 'Wednesday: Daily Vegetables • Red Thai Chicken Curry (HALAL)' },
        { name: 'Thursday: Chicken Fettuccine Alfredo (HALAL) • Seasoned Rice • Daily Vegetables • Garlic Toast' },
        { name: 'Friday: Daily Vegetables • Chicken Hunan Kung Pao (HALAL) • Seasoned Rice • Spring Roll' },
        { name: 'Saturday: Daily Vegetables • Baked Beef Lasagna (Halal) • Seasoned Rice • Garlic Toast' },
      ],
    },
  ],
  showtime: [
    {
      title: 'Showtime',
      items: [
        { name: 'Monday: Pizza Dogs' },
        { name: 'Tuesday: Greek Style Power Bowl' },
        { name: 'Wednesday: Custom Chicken or Falafel Pitas' },
        { name: 'Thursday: Quinoa Buddha Bowl' },
        { name: 'Friday: Buffalo Chicken Poutine' },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CafeteriaMenu({
  config,
  theme,
}: WidgetComponentProps) {
  const cfg = config as CafeteriaConfig | undefined;
  const menuUrl = cfg?.menuUrl?.trim() || '';
  const danaLocations = cfg?.danaLocations?.trim() || '48784';
  const refreshInterval = cfg?.refreshInterval ?? 30;
  const useCorsProxy = cfg?.useCorsProxy ?? true;

  const [menu, setMenu] = useState<ParsedCafeteriaMenu>(DEMO_MENU);
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuStatus, setMenuStatus] = useState<CafeteriaMenuStatus>('ready');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [servicePeriod, setServicePeriod] = useState<ServicePeriod>(() =>
    getCurrentServicePeriod(cfg ?? {}),
  );

  const refreshMs = refreshInterval * 60 * 1000;

  // Update meal period every minute
  useEffect(() => {
    const tick = () => setServicePeriod(getCurrentServicePeriod(cfg ?? {}));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [cfg]);

  // ---- Data fetching pipeline ----
  // Priority:
  //   1. Dana Hospitality direct (if loc IDs configured)
  //   2. WordPress REST API discovery → Dana iframe URLs
  //   3. Generic HTML parse of the menu page

  const fetchMenu = useCallback(async () => {
    if (!menuUrl || !useCorsProxy || !getCorsProxyUrl()) return;

    try {
      setError(null);
      const source = await loadCafeteriaSource({
        menuUrl,
        danaLocations,
        ttlMs: refreshMs,
        useCorsProxy,
      });

      setMenuStatus(source.status);
      setIsDemo(false);
      setLastUpdated(new Date());

      if (source.status !== 'ready') return;
      if (hasCafeteriaMenuContent(source.menu)) {
        setMenu(source.menu);
      } else {
        setError('No menu items found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [menuUrl, danaLocations, refreshMs, useCorsProxy]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await fetchMenu();
    };
    run();
    const id = setInterval(run, refreshMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetchMenu, refreshMs]);

  // ---- Display logic ----
  const currentMealSections = useMemo<CafeteriaMealSection[]>(
    () => (servicePeriod === 'closed' ? [] : menu[servicePeriod]),
    [menu, servicePeriod],
  );
  const weeklySections = menu.weekly;
  const isOpen = servicePeriod !== 'closed';
  const statusMessage = menuStatus === 'ready' ? null : MENU_STATUS_MESSAGES[menuStatus];

  const displaySections = useMemo(() => {
    if (menuStatus !== 'ready') return [];

    const showtimeSections = servicePeriod === 'lunch' || servicePeriod === 'dinner'
      ? menu.showtime
      : [];
    const sections: { title: string; items: CafeteriaMenuItem[]; isSpecial: boolean }[] = [];

    const todaysWeekly = filterSectionsToToday(weeklySections);
    const todaysShowtime = filterSectionsToToday(showtimeSections);
    const todaysCurrentMeal = filterSectionsToToday(currentMealSections);

    for (const s of todaysWeekly) {
      sections.push({ title: s.title, items: s.items, isSpecial: true });
    }
    for (const s of todaysShowtime) {
      sections.push({ title: s.title, items: s.items, isSpecial: true });
    }
    for (const s of todaysCurrentMeal) {
      sections.push({ title: s.title, items: s.items, isSpecial: false });
    }

    return sections;
  }, [weeklySections, currentMealSections, menu, servicePeriod, menuStatus]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const START_DELAY_MS = 1500;
    const LOOP_PAUSE_MS = 2200;
    const TICK_MS = 32;
    const STEP_PX = 0.7;

    let tickInterval: number | null = null;
    let startTimeout: number | null = null;
    let loopTimeout: number | null = null;
    let waitingForReset = false;
    let stopped = false;

    const clearTimers = () => {
      if (tickInterval !== null) window.clearInterval(tickInterval);
      if (startTimeout !== null) window.clearTimeout(startTimeout);
      if (loopTimeout !== null) window.clearTimeout(loopTimeout);
      tickInterval = null;
      startTimeout = null;
      loopTimeout = null;
    };

    const tick = () => {
      if (stopped || waitingForReset) return;

      const maxScrollTop = container.scrollHeight - container.clientHeight;
      if (maxScrollTop <= 1) {
        container.scrollTop = 0;
        return;
      }

      if (container.scrollTop + STEP_PX >= maxScrollTop) {
        container.scrollTop = maxScrollTop;
        waitingForReset = true;
        loopTimeout = window.setTimeout(() => {
          if (stopped) return;
          container.scrollTop = 0;
          loopTimeout = window.setTimeout(() => {
            waitingForReset = false;
          }, START_DELAY_MS);
        }, LOOP_PAUSE_MS);
        return;
      }

      container.scrollTop += STEP_PX;
    };

    container.scrollTop = 0;
    startTimeout = window.setTimeout(() => {
      tickInterval = window.setInterval(tick, TICK_MS);
    }, START_DELAY_MS);

    return () => {
      stopped = true;
      clearTimers();
    };
  }, [displaySections, servicePeriod]);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col"
      style={{ backgroundColor: `${theme.primary}20` }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="utensils" className="w-5 h-5 text-white/80" />
        <span className="text-base font-semibold text-white">Cafeteria</span>
        <span
          className="ml-auto text-sm font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isOpen ? `${theme.accent}30` : 'rgba(239,68,68,0.2)',
            color: isOpen ? theme.accent : 'rgb(248,113,113)',
          }}
        >
          {MEAL_LABELS[servicePeriod]}
        </span>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        data-layout-diagnostic-ignore="true"
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-4 min-h-0"
      >
        {statusMessage ? (
          <div className="rounded-md border border-amber-300/30 bg-amber-400/10 px-3 py-3 text-sm font-medium text-amber-100">
            {statusMessage}
          </div>
        ) : !isOpen && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Cafeteria is currently closed.
          </div>
        )}

        {displaySections.length === 0 && !error && !statusMessage && (
          <div className="text-white/50 text-sm text-center mt-4">
            No menu available
          </div>
        )}

        {displaySections.map((section, si) => (
          <div key={`${section.title}-${si}`}>
            <div className="flex items-center gap-2 mb-2">
              {section.isSpecial && (
                <span style={{ color: theme.accent }}>
                  <AppIcon name="sparkles" className="w-4 h-4" />
                </span>
              )}
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{
                  color: section.isSpecial ? theme.accent : 'rgba(255,255,255,0.6)',
                }}
              >
                {section.title}
              </h3>
            </div>

            <div className="space-y-1.5">
              {section.items.map((item, ii) => (
                <div
                  key={`${item.name}-${ii}`}
                  className="flex items-start gap-2 text-white"
                >
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: section.isSpecial
                        ? theme.accent
                        : 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <span className="text-sm leading-relaxed">
                    {item.name}
                    {item.description && (
                      <span className="text-white/50 ml-1">
                        — {item.description}
                      </span>
                    )}
                    {item.dietary && item.dietary.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-white/40">
                        {item.dietary.join(' · ')}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-between text-[11px] text-white/30">
        {isDemo && !error && !statusMessage && (
          <span>Demo data – set CORS proxy for live menu</span>
        )}
        {error && (
          <span className="text-red-400/70 truncate max-w-[70%]">{error}</span>
        )}
        {!isDemo && !error && !statusMessage && lastUpdated && (
          <span>
            Updated{' '}
            {lastUpdated.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        <span className="ml-auto opacity-60">
          {new Date().toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Registration                                                       */
/* ------------------------------------------------------------------ */

registerWidget({
  type: 'cafeteria-menu',
  name: 'Cafeteria Menu',
  description: 'Displays campus cafeteria menu with time-sensitive meals',
  icon: 'utensils',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: CafeteriaMenu,
  OptionsComponent: CafeteriaMenuOptions,
  acceptsSources: [{
    propName: 'menuUrl',
    types: ['api'],
    matchSource: (source) =>
      resolveSourceAdapter({ url: source.url, presetId: source.presetId })?.id === 'unbc-cafeteria-menu',
    applySource: (source) => ({
      menuUrl: source.url,
      sourceAdapter: 'unbc-cafeteria-menu',
    }),
  }],
  defaultProps: {
    menuUrl: '',
    danaLocations: '48784',
    refreshInterval: 30,
    weekdayBreakfastStart: '07:00',
    weekdayBreakfastEnd: '10:45',
    weekdayLunchStart: '11:00',
    weekdayLunchEnd: '15:45',
    weekdayDinnerStart: '16:00',
    weekdayDinnerEnd: '23:00',
    weekendBreakfastStart: '08:00',
    weekendBreakfastEnd: '10:45',
    weekendLunchStart: '11:00',
    weekendLunchEnd: '15:45',
    weekendDinnerStart: '16:00',
    weekendDinnerEnd: '22:00',
    useCorsProxy: true,
  },
});

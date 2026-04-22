'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeLib from 'qrcode';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, fetchJsonWithCache, fetchTextWithCache, buildProxyUrl } from '@firstform/campus-hub-widget-sdk';
import { parseRss } from '@firstform/campus-hub-widget-sdk';
import {
  ThemedCard,
  ProgressBar,
  DotIndicator,
  SectionHeader,
  MarqueeText,
} from '@firstform/campus-hub-widget-sdk';
import JobBoardOptions from './JobBoardOptions';

interface JobPosting {
  id: string | number;
  title: string;
  department: string;
  type: 'work-study' | 'part-time' | 'full-time' | 'volunteer' | 'co-op' | string;
}

type DisplayMode = 'scroll' | 'ticker' | 'paginate';

interface JobBoardConfig {
  apiUrl?: string;
  sourceType?: 'json' | 'rss';
  cacheTtlSeconds?: number;
  maxItems?: number;
  label?: string;
  displayMode?: DisplayMode;
  rotationSeconds?: number;
  /** Seconds per full loop for the auto-infinite vertical scroll mode. */
  speed?: number;
  qrEnabled?: boolean;
  qrUrl?: string;
  qrLabel?: string;
  useCorsProxy?: boolean;
  galleryPreview?: boolean;
  // Legacy field — kept for backward compatibility with saved configs, no longer used.
  scale?: number;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'work-study': { bg: '#7c3aed', text: '#fff' },
  'part-time': { bg: '#0891b2', text: '#fff' },
  'full-time': { bg: '#059669', text: '#fff' },
  volunteer: { bg: '#d97706', text: '#fff' },
  'co-op': { bg: '#2563eb', text: '#fff' },
};

const typeStyle = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] ?? { bg: '#6b7280', text: '#fff' };

const formatType = (type: string) =>
  type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const DEMO_JOBS: JobPosting[] = [
  { id: 1, title: 'Library Circulation Desk Assistant', department: 'Library', type: 'work-study' },
  { id: 2, title: 'Research Assistant — Biology Lab', department: 'Biology', type: 'part-time' },
  { id: 3, title: 'IT Help Desk Technician', department: 'IT Services', type: 'work-study' },
  { id: 4, title: 'Campus Tour Guide', department: 'Admissions', type: 'part-time' },
  { id: 5, title: 'Teaching Assistant — CPSC 100', department: 'Computer Science', type: 'part-time' },
  { id: 6, title: 'Recreation Centre Front Desk', department: 'Athletics', type: 'work-study' },
  { id: 7, title: 'Student Ambassador', department: 'Student Affairs', type: 'volunteer' },
  { id: 8, title: 'Lab Monitor — Chemistry', department: 'Chemistry', type: 'work-study' },
  { id: 9, title: 'Writing Centre Tutor', department: 'Academic Success', type: 'part-time' },
  { id: 10, title: 'Web Developer Co-op', department: 'IT Services', type: 'co-op' },
  { id: 11, title: 'Peer Mentor', department: 'Student Life', type: 'volunteer' },
  { id: 12, title: 'Research Data Entry', department: 'Geography', type: 'work-study' },
];

// Approximate heights (px) used to compute how many cards fit in paginate mode.
const CARD_HEIGHT = 120;
const CHROME_HEIGHT = 170;

const areJobsEqual = (a: JobPosting[], b: JobPosting[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.title !== b[i]?.title || a[i]?.department !== b[i]?.department) return false;
  }
  return true;
};

export default function JobBoard({
  config,
  theme,
}: WidgetComponentProps) {
  const cfg = config as JobBoardConfig | undefined;
  const rawApiUrl = cfg?.apiUrl?.trim();
  const apiUrl = rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : undefined;
  const sourceType = cfg?.sourceType ?? 'json';
  const cacheTtlSeconds = cfg?.cacheTtlSeconds ?? 120;
  const maxItems = cfg?.maxItems ?? 10;
  const label = cfg?.label ?? 'Campus Jobs';
  const displayMode: DisplayMode = cfg?.displayMode ?? 'scroll';
  const rotationSeconds = cfg?.rotationSeconds ?? 5;
  const speed = cfg?.speed ?? 35;
  // Default true for backward compatibility — existing widgets with qrUrl set keep showing the QR.
  const qrEnabled = cfg?.qrEnabled ?? true;
  const qrUrl = cfg?.qrUrl ?? '';
  const qrLabel = cfg?.qrLabel ?? 'Scan to apply';
  const useCorsProxy = cfg?.useCorsProxy ?? true;
  const galleryPreview = cfg?.galleryPreview ?? false;

  const [jobs, setJobs] = useState<JobPosting[]>(DEMO_JOBS);
  const jobsRef = useRef(jobs);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const applyFetchedJobs = useCallback((next: JobPosting[]) => {
    if (!Array.isArray(next) || next.length === 0) return;
    if (areJobsEqual(jobsRef.current, next)) return;
    setJobs(next);
  }, []);

  useEffect(() => {
    if (apiUrl) return;
    setJobs(DEMO_JOBS);
  }, [apiUrl]);

  useEffect(() => {
    if (!apiUrl) return;
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        const fetchUrl = useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl;

        if (sourceType === 'rss') {
          const { text } = await fetchTextWithCache(fetchUrl, {
            cacheKey: buildCacheKey('jobboard-rss', fetchUrl),
            ttlMs: cacheTtlSeconds * 1000,
          });
          const parsed = parseRss(text);
          const mapped: JobPosting[] = parsed.map((item, i) => ({
            id: item.guid ?? item.link ?? `rss-${i}`,
            title: item.title,
            department: item.categories?.[0] ?? '',
            type: item.categories?.[1] ?? 'part-time',
          }));
          if (isMounted) applyFetchedJobs(mapped);
          return;
        }

        // JSON source
        const { data } = await fetchJsonWithCache<unknown>(fetchUrl, {
          cacheKey: buildCacheKey('jobboard-json', fetchUrl),
          ttlMs: cacheTtlSeconds * 1000,
        });

        // Accept either a plain array or { jobs: [...] }
        let rawJobs: unknown[];
        if (Array.isArray(data)) {
          rawJobs = data;
        } else if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).jobs)) {
          rawJobs = (data as Record<string, unknown>).jobs as unknown[];
        } else {
          return;
        }

        const mapped: JobPosting[] = rawJobs
          .filter((j): j is Record<string, unknown> => !!j && typeof j === 'object')
          .map((j, i) => ({
            id: (j.id as string | number) ?? `job-${i}`,
            title: String(j.title ?? ''),
            department: String(j.department ?? ''),
            type: String(j.type ?? 'part-time'),
          }))
          .filter((j) => j.title.length > 0);

        if (isMounted && mapped.length > 0) applyFetchedJobs(mapped);
      } catch (err) {
        console.error('Failed to fetch job postings:', err);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 30_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl, sourceType, cacheTtlSeconds, applyFetchedJobs, useCorsProxy]);

  // QR code generation
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!qrEnabled || !qrUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCodeLib.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
      margin: 1,
      width: 256,
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [qrEnabled, qrUrl]);

  /* ---------- container measurement for paginate mode ---------- */

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.clientHeight;
      const available = h - CHROME_HEIGHT;
      const fits = Math.max(1, Math.floor(available / CARD_HEIGHT));
      setItemsPerPage(fits);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- ticker / paginate logic ---------- */

  const displayJobs = jobs.filter((j) => j.title?.trim()).slice(0, maxItems);
  const totalJobs = displayJobs.length;

  const totalPages = displayMode === 'paginate'
    ? Math.max(1, Math.ceil(totalJobs / itemsPerPage))
    : totalJobs;

  const currentPage = displayMode === 'paginate'
    ? Math.floor(currentIndex / itemsPerPage)
    : currentIndex;

  useEffect(() => {
    setCurrentIndex(0);
  }, [displayMode, totalJobs, itemsPerPage]);

  const advance = useCallback(() => {
    if (totalJobs === 0) return;
    setCurrentIndex((prev) => {
      if (displayMode === 'paginate') {
        const nextPage = Math.floor(prev / itemsPerPage) + 1;
        const nextStart = nextPage * itemsPerPage;
        return nextStart >= totalJobs ? 0 : nextStart;
      }
      return (prev + 1) % totalJobs;
    });
  }, [displayMode, totalJobs, itemsPerPage]);

  useEffect(() => {
    if (displayMode === 'scroll' || totalJobs <= 1) return;
    if (displayMode === 'paginate' && totalPages <= 1) return;
    const interval = setInterval(advance, rotationSeconds * 1000);
    return () => clearInterval(interval);
  }, [displayMode, rotationSeconds, totalJobs, totalPages, advance]);

  /* ---------- shared renderers ---------- */

  const renderJobCard = (job: JobPosting, index: number, grow = false) => {
    const style = typeStyle(job.type);
    return (
      <ThemedCard
        key={job.id ?? index}
        theme={theme}
        accentBarColor={style.bg}
        className={grow ? 'flex-1 min-h-0 flex flex-col justify-center' : ''}
      >
        <div className={`font-semibold text-white leading-snug line-clamp-2 ${grow ? 'text-2xl' : 'text-xl'}`}>
          {job.title}
        </div>
        <div className={`opacity-90 flex items-center gap-3 mt-2 flex-shrink-0 min-w-0 ${grow ? 'text-lg' : 'text-base'}`}>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {formatType(job.type)}
          </span>
          {job.department && (
            <span className="text-white/60 flex items-center gap-1.5 min-w-0 flex-1">
              <svg
                className={`${grow ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <MarqueeText text={job.department} className="flex-1 min-w-0" />
            </span>
          )}
        </div>
      </ThemedCard>
    );
  };

  const renderDots = (count: number, active: number) => (
    <DotIndicator
      theme={theme}
      count={count}
      active={active}
      onSelect={(i) => setCurrentIndex(displayMode === 'paginate' ? i * itemsPerPage : i)}
      className="mt-4"
    />
  );

  const renderProgressBar = () =>
    displayMode !== 'scroll' && totalJobs > 1 && (displayMode !== 'paginate' || totalPages > 1) ? (
      <ProgressBar theme={theme} durationSeconds={rotationSeconds} className="mt-3" />
    ) : null;

  /* ---------- render ---------- */

  return (
    <div
      ref={containerRef}
      data-layout-diagnostic-ignore={galleryPreview ? 'true' : undefined}
      className="w-full h-full overflow-hidden flex flex-col min-h-0 p-6"
    >
      {/* Header */}
      <SectionHeader
        theme={theme}
        title={label}
        className="mb-5"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
        trailing={
          displayMode !== 'scroll' && totalJobs > 1 ? (
            <span className="text-sm font-normal opacity-60 whitespace-nowrap">
              {displayMode === 'ticker'
                ? `${currentIndex + 1} / ${totalJobs}`
                : `Page ${currentPage + 1} / ${totalPages}`}
            </span>
          ) : undefined
        }
      />

      {/* Content row: jobs on the left, optional QR panel on the right */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Scroll mode – auto-infinite vertical marquee */}
          {displayMode === 'scroll' && (
            <div className="flex-1 relative overflow-hidden">
              <div
                className="flex flex-col animate-ticker-vertical will-change-transform"
                style={{ animationDuration: `${speed}s` }}
              >
                {[...displayJobs, ...displayJobs].map((job, i) => (
                  <div key={`${job.id ?? 'job'}-${i}`} className="pb-3">
                    {renderJobCard(job, i)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticker mode – one job at a time, vertical slide, fills the full container */}
          {displayMode === 'ticker' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 relative overflow-hidden">
                {displayJobs.map((job, index) => (
                  <div
                    key={job.id ?? index}
                    data-layout-diagnostic-ignore={index === currentIndex ? undefined : 'true'}
                    className="absolute inset-0 flex flex-col transition-all duration-500 ease-in-out"
                    style={{
                      opacity: index === currentIndex ? 1 : 0,
                      transform: index === currentIndex
                        ? 'translateY(0)'
                        : index < currentIndex
                          ? 'translateY(-100%)'
                          : 'translateY(100%)',
                      pointerEvents: index === currentIndex ? 'auto' : 'none',
                    }}
                  >
                    {renderJobCard(job, index, true)}
                  </div>
                ))}
              </div>
              {renderProgressBar()}
              {totalJobs > 1 && renderDots(totalJobs, currentIndex)}
            </div>
          )}

          {/* Paginate mode – chunks slide horizontally, sized to fit */}
          {displayMode === 'paginate' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 relative overflow-hidden">
                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const pageStart = pageIdx * itemsPerPage;
                  const pageJobs = displayJobs.slice(pageStart, pageStart + itemsPerPage);
                  const isActive = pageIdx === currentPage;
                  return (
                    <div
                      key={pageIdx}
                      data-layout-diagnostic-ignore={isActive ? undefined : 'true'}
                      className="absolute inset-0 transition-all duration-500 ease-in-out"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive
                          ? 'translateX(0)'
                          : pageIdx < currentPage
                            ? 'translateX(-100%)'
                            : 'translateX(100%)',
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    >
                      <div className="h-full flex flex-col gap-3">
                        {pageJobs.map((job, i) => renderJobCard(job, pageStart + i, true))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderProgressBar()}
              {totalPages > 1 && renderDots(totalPages, currentPage)}
            </div>
          )}
        </div>

        {/* QR panel — shows beside the jobs whenever a QR URL is configured */}
        {qrDataUrl && (
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl p-3"
            style={{ width: '150px', backgroundColor: `${theme.primary}1a` }}
          >
            <img
              src={qrDataUrl}
              alt={qrLabel}
              className="w-full aspect-square rounded bg-white p-1.5"
              style={{ objectFit: 'contain' }}
            />
            {qrLabel && (
              <span
                className="text-xs font-medium text-center leading-tight opacity-70"
                style={{ color: theme.accent }}
              >
                {qrLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

registerWidget({
  type: 'job-board',
  name: 'Job Board',
  description: 'Campus job postings with optional QR code link',
  icon: 'newspaper',
  minW: 3,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  component: JobBoard,
  OptionsComponent: JobBoardOptions,
  acceptsSources: [{
    propName: 'apiUrl',
    types: ['api', 'feed'],
    applySource: (source) => ({
      apiUrl: source.url,
      sourceType: source.sourceType === 'feed' ? 'rss' : 'json',
    }),
  }],
  defaultProps: {
    maxItems: 10,
    label: 'Campus Jobs',
    sourceType: 'json',
    cacheTtlSeconds: 120,
    displayMode: 'scroll',
    rotationSeconds: 5,
    speed: 35,
    qrEnabled: false,
    qrUrl: '',
    qrLabel: 'Scan to apply',
    useCorsProxy: true,
  },
});

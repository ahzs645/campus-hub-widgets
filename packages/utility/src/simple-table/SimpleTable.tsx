'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchTextWithCache } from '@firstform/campus-hub-widget-sdk';
import { useFitScale } from '@firstform/campus-hub-widget-sdk';
import SimpleTableOptions from './SimpleTableOptions';

interface SimpleTableConfig {
  source?: 'url' | 'manual';
  csvUrl?: string;
  manualData?: string; // CSV string for manual entry
  title?: string;
  headerStyle?: 'accent' | 'subtle' | 'none';
  striped?: boolean;
  refreshInterval?: number;
  useCorsProxy?: boolean;
  autoScroll?: boolean;
  scrollSpeed?: number;
}

const DEMO_CSV = `Room,Availability,Hours
Library 3A,Available,8am – 10pm
Library 3B,Occupied,8am – 10pm
Study Room 101,Available,9am – 9pm
Computer Lab,Occupied,7am – 11pm
Conference Room B,Available,10am – 6pm`;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map((line) => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    return row;
  });
}

export default function SimpleTable({ config, theme }: WidgetComponentProps) {
  const tableConfig = config as SimpleTableConfig | undefined;
  const source = tableConfig?.source ?? 'manual';
  const csvUrl = tableConfig?.csvUrl?.trim() || '';
  const manualData = tableConfig?.manualData?.trim() || '';
  const title = tableConfig?.title?.trim() || '';
  const headerStyle = tableConfig?.headerStyle ?? 'accent';
  const striped = tableConfig?.striped ?? true;
  const refreshInterval = tableConfig?.refreshInterval ?? 30;
  const useCorsProxy = tableConfig?.useCorsProxy ?? true;
  const autoScroll = tableConfig?.autoScroll ?? true;
  const scrollSpeed = tableConfig?.scrollSpeed ?? 40;
  const [rows, setRows] = useState<string[][]>(() => parseCSV(DEMO_CSV));
  const [error, setError] = useState<string | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ viewportHeight: 0, contentHeight: 0 });

  const { containerRef, containerWidth, containerHeight } = useFitScale(520, 500);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchCSV = useCallback(async () => {
    if (source === 'manual') {
      setRows(parseCSV(manualData || DEMO_CSV));
      setError(null);
      return;
    }
    if (!csvUrl) {
      setRows(parseCSV(DEMO_CSV));
      return;
    }
    try {
      setError(null);
      const url = useCorsProxy ? buildProxyUrl(csvUrl) : csvUrl;
      const { text } = await fetchTextWithCache(url, {
        cacheKey: buildCacheKey('table', csvUrl),
        ttlMs: refreshInterval * 60 * 1000,
      });
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('No data found');
        return;
      }
      setRows(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV');
    }
  }, [source, csvUrl, manualData, refreshInterval, useCorsProxy]);

  useEffect(() => {
    fetchCSV();
    if (source === 'url' && csvUrl) {
      const interval = setInterval(fetchCSV, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchCSV, source, csvUrl, refreshInterval]);

  const hasHeader = rows.length > 1;
  const headerRow = hasHeader ? rows[0] : null;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const colCount = rows[0]?.length ?? 0;
  const resolvedWidth = containerWidth || 520;
  const resolvedHeight = containerHeight || 500;
  const pad = clamp(Math.min(resolvedWidth, resolvedHeight) * 0.04, 8, 16);
  const titleSize = clamp(Math.min(resolvedWidth, resolvedHeight) * 0.05, 14, 22);
  const sourceSize = clamp(Math.min(resolvedWidth, resolvedHeight) * 0.028, 10, 12);
  const headerFontSize = clamp(Math.min(resolvedWidth * 0.03, resolvedHeight * 0.05), 11, 15);
  const cellFontSize = clamp(Math.min(resolvedWidth * 0.028, resolvedHeight * 0.045), 10, 14);
  const headerPadY = clamp(resolvedHeight * 0.03, 8, 14);
  const rowPadY = clamp(resolvedHeight * 0.022, 7, 11);
  const cellPadX = clamp(resolvedWidth * 0.024, 10, 16);
  const columnTemplate = useMemo(() => {
    if (colCount === 0) return '';
    const weights = Array.from({ length: colCount }).map((_, ci) => {
      const sampleValues = [
        headerRow?.[ci] ?? '',
        ...dataRows.slice(0, 12).map((row) => row[ci] ?? ''),
      ];
      const longest = Math.max(...sampleValues.map((value) => value.length), 4);
      return clamp(longest, 4, 24);
    });
    return weights.map((weight) => `minmax(0, ${weight}fr)`).join(' ');
  }, [colCount, dataRows, headerRow]);

  useEffect(() => {
    const measure = () => {
      const viewportHeight = viewportRef.current?.clientHeight ?? 0;
      const contentHeight = contentRef.current?.scrollHeight ?? 0;
      setScrollMetrics((prev) => (
        prev.viewportHeight === viewportHeight && prev.contentHeight === contentHeight
          ? prev
          : { viewportHeight, contentHeight }
      ));
    };

    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [rows, containerWidth, containerHeight, title, error, columnTemplate, headerPadY, rowPadY, cellPadX]);

  const shouldLoop =
    autoScroll
    && dataRows.length > 1
    && scrollMetrics.contentHeight > scrollMetrics.viewportHeight + 4;
  const scrollDuration = shouldLoop
    ? clamp(
      (scrollMetrics.contentHeight / Math.max(cellFontSize * 1.6, 1)) * (scrollSpeed / 10),
      8,
      180,
    )
    : 0;

  const renderBodyRows = (keyPrefix: string, ariaHidden = false) => (
    <div
      ref={ariaHidden ? undefined : contentRef}
      className="flex flex-col"
      aria-hidden={ariaHidden || undefined}
    >
      {dataRows.map((row, ri) => (
        <div
          key={`${keyPrefix}-${ri}`}
          className="grid items-center"
          style={{
            gridTemplateColumns: columnTemplate,
            backgroundColor: striped && ri % 2 === 1 ? `${theme.accent}06` : 'transparent',
            borderBottom: `1px solid ${theme.accent}10`,
          }}
        >
          {Array.from({ length: colCount }).map((_, ci) => (
            <div
              key={ci}
              className="overflow-hidden text-ellipsis whitespace-nowrap text-white/70"
              style={{
                padding: `${rowPadY}px ${cellPadX}px`,
                fontSize: cellFontSize,
                lineHeight: 1.2,
              }}
              title={row[ci] ?? ''}
            >
              {row[ci] ?? ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: `${theme.primary}10` }}
    >
      <style>{`
        @keyframes simpleTableTicker {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(-1 * var(--table-loop-distance, 0px))); }
        }
      `}</style>
      <div
        className="flex h-full flex-col"
        style={{ padding: pad }}
      >
        {/* Title */}
        {title && (
          <div
            className="mb-3 px-1 font-semibold text-white"
            style={{ fontSize: titleSize, lineHeight: 1.1 }}
          >
            {title}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 mb-2 px-1">{error}</div>
        )}

        {/* Table */}
        <div
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg"
          style={{ border: `1px solid ${theme.accent}20` }}
        >
          {headerRow && headerStyle !== 'none' && (
            <div
              className="grid"
              style={{
                gridTemplateColumns: columnTemplate,
                backgroundColor: headerStyle === 'accent' ? `${theme.accent}25` : `${theme.accent}10`,
              }}
            >
              {headerRow.map((cell, i) => (
                <div
                  key={i}
                  className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-white/90"
                  style={{
                    padding: `${headerPadY}px ${cellPadX}px`,
                    fontSize: headerFontSize,
                    lineHeight: 1.15,
                    borderBottom: headerStyle === 'accent'
                      ? `2px solid ${theme.accent}40`
                      : `1px solid ${theme.accent}15`,
                  }}
                  title={cell}
                >
                  {cell}
                </div>
              ))}
            </div>
          )}

          <div ref={viewportRef} className="relative flex-1 overflow-hidden">
            <div
              className={shouldLoop ? 'will-change-transform' : ''}
              style={shouldLoop ? {
                animation: `simpleTableTicker ${scrollDuration}s linear infinite`,
                ['--table-loop-distance' as string]: `${scrollMetrics.contentHeight}px`,
              } : undefined}
            >
              {renderBodyRows('primary')}
              {shouldLoop && renderBodyRows('loop', true)}
            </div>
          </div>
        </div>

        {/* Source indicator */}
        {!csvUrl && source === 'url' && (
          <div className="mt-2 text-right text-white/30" style={{ fontSize: sourceSize }}>
            Demo data
          </div>
        )}
      </div>
    </div>
  );
}

registerWidget({
  type: 'simple-table',
  name: 'Simple Table',
  description: 'Display tabular data from CSV or manual entry',
  icon: 'table',
  minW: 2,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  component: SimpleTable,
  OptionsComponent: SimpleTableOptions,
  defaultProps: {
    source: 'manual',
    csvUrl: '',
    manualData: '',
    title: '',
    headerStyle: 'accent',
    striped: true,
    refreshInterval: 30,
    useCorsProxy: true,
    autoScroll: true,
    scrollSpeed: 40,
  },
});

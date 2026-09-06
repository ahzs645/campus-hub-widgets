'use client';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';

export interface SourceUnavailableProps {
  /** What could not be loaded, e.g. "Calendar" or "Gas prices". */
  label: string;
  /** The error string the widget already tracks; rendered in smaller text. */
  detail?: string | null;
  /** Compact variant for small widgets (smaller icon and type). */
  compact?: boolean;
  className?: string;
}

/**
 * Unavailable state for a *configured* data source that failed to load and
 * has no last-good data to fall back on.
 *
 * Widgets must never fall back to their demo/sample data in this situation:
 * on a public screen fabricated meetings, prices or headlines read as real.
 * Demo data is only for the unconfigured state, and always with a "Demo" badge.
 */
export default function SourceUnavailable({
  label,
  detail,
  compact = false,
  className = '',
}: SourceUnavailableProps) {
  return (
    <div
      role="status"
      data-layout-diagnostic-ignore="true"
      className={`flex h-full w-full min-h-0 flex-col items-center justify-center gap-1.5 px-4 py-3 text-center ${className}`}
    >
      <AppIcon name="cloudOff" className={`${compact ? 'h-6 w-6' : 'h-9 w-9'} text-red-400/80`} />
      <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-white/85`}>
        {label} unavailable
      </div>
      {detail && (
        <div className={`${compact ? 'text-[11px]' : 'text-xs'} max-w-full break-words text-white/50 line-clamp-2`}>
          {detail}
        </div>
      )}
    </div>
  );
}

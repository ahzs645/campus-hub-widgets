'use client';

import type { ReactNode } from 'react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export const MACOS_UI_FONT =
  "var(--font-macos-ui), 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MACOS_MONO_FONT =
  "var(--font-macos-mono), 'SFMono-Regular', 'Monaco', monospace";
export const MACOS_DISPLAY_FONT =
  "var(--font-macos-display), 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const MACOS_INPUT_CLASS_NAME =
  'macos-input font-macos-ui placeholder:text-white/35';
export const MACOS_BUTTON_CLASS_NAME =
  'macos-button font-macos-ui disabled:cursor-not-allowed disabled:opacity-50';
export const MACOS_PRIMARY_BUTTON_CLASS_NAME = cx(
  MACOS_BUTTON_CLASS_NAME,
  'macos-button-primary',
);

export function MacOSWidgetFrame({
  title,
  subtitle,
  toolbar,
  children,
  footer,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="macos-widget-shell font-macos-ui">
      {(title || subtitle || toolbar) ? (
        <div className="macos-widget-titlebar">
          <div className="macos-widget-title">
            <span>{title}</span>
            {subtitle ? (
              <span className="macos-widget-subtitle">{subtitle}</span>
            ) : null}
          </div>
          <div className="macos-widget-toolbar">{toolbar}</div>
        </div>
      ) : null}
      <div className={cx('macos-widget-body', bodyClassName)}>{children}</div>
      {footer ? <div className="macos-widget-footer">{footer}</div> : null}
    </div>
  );
}

export function MacOSDashboardSurface({
  children,
  className,
  showGloss = true,
}: {
  children: ReactNode;
  className?: string;
  showGloss?: boolean;
}) {
  return (
    <div className={cx('macos-dashboard-surface', className)}>
      {children}
      {showGloss ? <div className="macos-dashboard-gloss-top" /> : null}
      {showGloss ? <div className="macos-dashboard-gloss-bottom" /> : null}
    </div>
  );
}

export function MacOSInset({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'blue' | 'dark';
}) {
  return (
    <div
      className={cx(
        'macos-inset',
        tone === 'blue' && 'macos-inset-blue',
        tone === 'dark' && 'macos-inset-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MacOSPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cx('macos-pill', className)}>{children}</span>;
}

export function MacOSSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('macos-segmented', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx(
            'macos-segment',
            option.value === value && 'macos-segment-active',
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <MacOSInset className="flex flex-1 flex-col items-center justify-center px-5 py-6 text-center">
      <div className="font-macos-display text-lg text-white">{title}</div>
      <div className="mt-2 text-[11px] leading-5 text-white/60">
        {description}
      </div>
    </MacOSInset>
  );
}

'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AppIcon,
  FormInput,
  FormSelect,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';
import { VIEWPORT_H, VIEWPORT_W, resolveEmbedUrl } from './WebRegion';

interface WebRegionData {
  url: string;
  refreshInterval: number;
  regionX: number;
  regionY: number;
  regionW: number;
  regionH: number;
  fit: 'cover' | 'contain';
}

type DragMode =
  | { kind: 'move'; startX: number; startY: number; origX: number; origY: number }
  | {
      kind: 'resize';
      handle: 'nw' | 'ne' | 'sw' | 'se';
      startX: number;
      startY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
    }
  | null;

const MIN_REGION = 80;

function clampRegion(x: number, y: number, w: number, h: number) {
  const cw = Math.max(MIN_REGION, Math.min(w, VIEWPORT_W));
  const ch = Math.max(MIN_REGION, Math.min(h, VIEWPORT_H));
  const cx = Math.max(0, Math.min(x, VIEWPORT_W - cw));
  const cy = Math.max(0, Math.min(y, VIEWPORT_H - ch));
  return { x: cx, y: cy, w: cw, h: ch };
}

export default function WebRegionOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<WebRegionData>(() => ({
    url: (data?.url as string) ?? '',
    refreshInterval: (data?.refreshInterval as number) ?? 0,
    regionX: (data?.regionX as number) ?? 0,
    regionY: (data?.regionY as number) ?? 0,
    regionW: (data?.regionW as number) ?? VIEWPORT_W,
    regionH: (data?.regionH as number) ?? VIEWPORT_H,
    fit: ((data?.fit as 'cover' | 'contain') ?? 'cover'),
  }));
  const [committedUrl, setCommittedUrl] = useState(state.url);
  const [lockAspect, setLockAspect] = useState(false);

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0);
  const dragRef = useRef<DragMode>(null);

  useEffect(() => {
    if (data) {
      setState({
        url: (data.url as string) ?? '',
        refreshInterval: (data.refreshInterval as number) ?? 0,
        regionX: (data.regionX as number) ?? 0,
        regionY: (data.regionY as number) ?? 0,
        regionW: (data.regionW as number) ?? VIEWPORT_W,
        regionH: (data.regionH as number) ?? VIEWPORT_H,
        fit: ((data.fit as 'cover' | 'contain') ?? 'cover'),
      });
    }
  }, [data]);

  useLayoutEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPreviewScale(w / VIEWPORT_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const update = useCallback(
    (patch: Partial<WebRegionData>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        onChange(next);
        return next;
      });
    },
    [onChange],
  );

  const handleField = (name: string, value: string | number | boolean) => {
    update({ [name]: value } as Partial<WebRegionData>);
  };

  const commitUrl = () => setCommittedUrl(state.url);

  const resetRegion = () =>
    update({ regionX: 0, regionY: 0, regionW: VIEWPORT_W, regionH: VIEWPORT_H });

  const pxToViewport = (px: number) => (previewScale > 0 ? px / previewScale : 0);

  const onOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const handle = target.dataset.handle as 'nw' | 'ne' | 'sw' | 'se' | undefined;
    const onSelection = !!target.closest('[data-region="selection"]');
    if (!handle && !onSelection) return;

    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (handle) {
      dragRef.current = {
        kind: 'resize',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: state.regionX,
        origY: state.regionY,
        origW: state.regionW,
        origH: state.regionH,
      };
    } else {
      dragRef.current = {
        kind: 'move',
        startX: e.clientX,
        startY: e.clientY,
        origX: state.regionX,
        origY: state.regionY,
      };
    }
  };

  const onOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = pxToViewport(e.clientX - drag.startX);
    const dy = pxToViewport(e.clientY - drag.startY);

    if (drag.kind === 'move') {
      const r = clampRegion(drag.origX + dx, drag.origY + dy, state.regionW, state.regionH);
      update({ regionX: r.x, regionY: r.y });
      return;
    }

    let nx = drag.origX;
    let ny = drag.origY;
    let nw = drag.origW;
    let nh = drag.origH;

    if (drag.handle.includes('e')) nw = drag.origW + dx;
    if (drag.handle.includes('s')) nh = drag.origH + dy;
    if (drag.handle.includes('w')) {
      nx = drag.origX + dx;
      nw = drag.origW - dx;
    }
    if (drag.handle.includes('n')) {
      ny = drag.origY + dy;
      nh = drag.origH - dy;
    }

    if (lockAspect) {
      const aspect = drag.origW / drag.origH;
      if (Math.abs(nw - drag.origW) > Math.abs(nh - drag.origH)) {
        const newH = nw / aspect;
        if (drag.handle.includes('n')) ny = drag.origY + (drag.origH - newH);
        nh = newH;
      } else {
        const newW = nh * aspect;
        if (drag.handle.includes('w')) nx = drag.origX + (drag.origW - newW);
        nw = newW;
      }
    }

    const r = clampRegion(nx, ny, nw, nh);
    update({ regionX: r.x, regionY: r.y, regionW: r.w, regionH: r.h });
  };

  const onOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  const iframeSrc = committedUrl ? resolveEmbedUrl(committedUrl) : '';
  const regionAspect =
    state.regionH > 0 ? (state.regionW / state.regionH).toFixed(2) : '—';

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Web Region Settings</h3>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <FormInput
              label="URL"
              name="url"
              type="url"
              value={state.url}
              placeholder="https://example.com"
              onChange={handleField}
            />
          </div>
          <button
            type="button"
            onClick={commitUrl}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--ui-input-bg)] text-[var(--ui-text)] border border-[var(--ui-input-border)] hover:opacity-90"
          >
            Load
          </button>
        </div>

        <FormInput
          label="Refresh Interval (seconds)"
          name="refreshInterval"
          type="number"
          value={state.refreshInterval}
          min={0}
          max={3600}
          onChange={handleField}
        />

        <FormSelect
          label="Fit Mode"
          name="fit"
          value={state.fit}
          options={[
            { value: 'cover', label: 'Cover (fill tile, may crop region)' },
            { value: 'contain', label: 'Contain (show full region, may letterbox)' },
          ]}
          onChange={(name, value) =>
            update({ [name]: value as 'cover' | 'contain' } as Partial<WebRegionData>)
          }
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-[var(--ui-text)]">Select region</h4>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
              />
              Lock aspect
            </label>
            <button
              type="button"
              onClick={resetRegion}
              className="text-xs px-2 py-1 rounded bg-[var(--ui-input-bg)] text-[var(--ui-text)] border border-[var(--ui-input-border)]"
            >
              Reset
            </button>
          </div>
        </div>

        <div
          ref={previewWrapRef}
          className="relative w-full rounded-lg overflow-hidden bg-[var(--ui-item-bg)] border border-[var(--ui-item-border)] select-none"
          style={{ aspectRatio: `${VIEWPORT_W} / ${VIEWPORT_H}` }}
        >
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              title="Web region preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: VIEWPORT_W,
                height: VIEWPORT_H,
                border: 0,
                transformOrigin: '0 0',
                transform: `scale(${previewScale || 0.0001})`,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--ui-text-muted)]">
              <div className="text-center">
                <AppIcon name="globe" className="w-9 h-9 mx-auto opacity-50" />
                <div className="text-xs mt-2">Enter a URL and click Load to preview</div>
              </div>
            </div>
          )}

          <div
            className="absolute inset-0 touch-none"
            onPointerDown={onOverlayPointerDown}
            onPointerMove={onOverlayPointerMove}
            onPointerUp={onOverlayPointerUp}
            onPointerCancel={onOverlayPointerUp}
          >
            <div
              data-region="selection"
              className="absolute cursor-move"
              style={{
                left: `${(state.regionX / VIEWPORT_W) * 100}%`,
                top: `${(state.regionY / VIEWPORT_H) * 100}%`,
                width: `${(state.regionW / VIEWPORT_W) * 100}%`,
                height: `${(state.regionH / VIEWPORT_H) * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                outline: '2px solid #10b981',
              }}
            >
              {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                <div
                  key={h}
                  data-handle={h}
                  className="absolute w-3 h-3 bg-white border-2 border-emerald-500 rounded-sm"
                  style={{
                    left: h.includes('w') ? -6 : undefined,
                    right: h.includes('e') ? -6 : undefined,
                    top: h.includes('n') ? -6 : undefined,
                    bottom: h.includes('s') ? -6 : undefined,
                    cursor: `${h}-resize`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--ui-text-muted)] flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Position: {Math.round(state.regionX)}, {Math.round(state.regionY)}
          </span>
          <span>
            Size: {Math.round(state.regionW)} × {Math.round(state.regionH)}
          </span>
          <span>Aspect: {regionAspect}:1</span>
        </div>
      </div>

      <div className="bg-[var(--ui-accent-soft)] border border-[var(--ui-accent-strong)] rounded-lg p-4">
        <div className="flex gap-2">
          <AppIcon name="warning" className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[var(--color-accent)]">
            <strong>Note:</strong> Many sites block iframe embedding (X-Frame-Options / CSP).
            If the preview is blank, the site may not allow embedding — the region selector
            still works but you won&apos;t see the page contents.
          </div>
        </div>
      </div>
    </div>
  );
}

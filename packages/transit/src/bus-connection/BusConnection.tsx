'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePixelDisplay } from 'react-pixel-display';
import { WidgetComponentProps, DarkContainer } from '@firstform/campus-hub-widget-sdk';
import { renderTransitDisplay, loadPixollettaFont } from './transit/renderer';
import { createLiveTripProvider, getScheduledTrips, type Trip } from './transit/gtfsService';
import { SERVICE_DATES } from './transit/gtfsData';

interface BusConnectionConfig {
  glow?: boolean;
  scrollHeadsigns?: boolean;
  departureTimeOnly?: boolean;
  hideStationPrefix?: boolean;
  pixelPitch?: number;
  padding?: number;
  entrySpacing?: number;
  proxyUrl?: string;
  simulate?: boolean;
  simMode?: 'weekday' | 'saturday';
  simTime?: number;
  useCorsProxy?: boolean;
}

function findWeekdayDate(): string | null {
  return SERVICE_DATES['4795']?.[0] || null;
}

function findSaturdayDate(): string | null {
  return SERVICE_DATES['4800']?.[0] || null;
}

function parseDateStr(str: string | null): { y: number; m: number; d: number } | null {
  if (!str) return null;
  return {
    y: parseInt(str.slice(0, 4)),
    m: parseInt(str.slice(4, 6)) - 1,
    d: parseInt(str.slice(6, 8)),
  };
}

/**
 * The output is quantised to whole LED pixels, and the fastest-moving element
 * is the headsign scroll at SCROLL_SPEED (10px/s) — so the frame can only
 * change ~10 times a second. Running the loop at the panel's native 60Hz
 * produced ~50 byte-identical frames a second, each paying a full per-pixel
 * colour parse plus a full-canvas ImageData rebuild.
 */
const MIN_FRAME_INTERVAL_MS = 1000 / 15;

/**
 * Even when nothing changed, redraw occasionally so the renderer can re-attach
 * its canvas if the container was emptied out from under it.
 */
const FORCED_REDRAW_INTERVAL_MS = 2000;

function pixelsEqual(next: string[], prev: string[] | null): boolean {
  if (!prev || prev.length !== next.length) return false;
  for (let i = 0; i < next.length; i += 1) {
    if (next[i] !== prev[i]) return false;
  }
  return true;
}

export default function BusConnection({ config, theme }: WidgetComponentProps) {
  const busConfig = config as BusConnectionConfig | undefined;
  const glow = busConfig?.glow ?? true;
  const scrollHeadsigns = busConfig?.scrollHeadsigns ?? true;
  const departureTimeOnly = busConfig?.departureTimeOnly ?? false;
  const hideStationPrefix = busConfig?.hideStationPrefix ?? false;
  const pixelPitch = busConfig?.pixelPitch ?? 6;
  const padding = busConfig?.padding ?? 8;
  const proxyUrl = busConfig?.proxyUrl?.trim() || undefined;
  const entrySpacing = busConfig?.entrySpacing ?? 2;
  const simulate = busConfig?.simulate ?? false;
  const simMode = busConfig?.simMode ?? 'weekday';
  const simTime = busConfig?.simTime ?? 540;
  const useCorsProxy = busConfig?.useCorsProxy ?? true;

  const simulatedTime = useMemo(() => {
    if (!simulate) return null;
    const dateStr = simMode === 'saturday' ? findSaturdayDate() : findWeekdayDate();
    const parsed = parseDateStr(dateStr);
    if (!parsed) return null;
    const hours = Math.floor(simTime / 60);
    const mins = simTime % 60;
    return new Date(parsed.y, parsed.m, parsed.d, hours, mins, 0);
  }, [simulate, simMode, simTime]);

  const simTimeRef = useRef(simulatedTime);
  simTimeRef.current = simulatedTime;

  // Compute simulation trips synchronously (no effect delay)
  const simulatedTrips = useMemo(() => {
    if (!simulatedTime) return null;
    return getScheduledTrips(simulatedTime);
  }, [simulatedTime]);

  const [fontReady, setFontReady] = useState(false);
  const [liveTrips, setLiveTrips] = useState<Trip[]>([]);
  const startTimeRef = useRef(Date.now());
  const tripsRef = useRef<Trip[]>([]);
  // Use simulated trips when available, otherwise live trips
  tripsRef.current = simulatedTrips ?? liveTrips;

  // Derive virtual pixel grid from container size and pixel pitch
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      const w = Math.floor(width / pixelPitch);
      const h = Math.floor(height / pixelPitch);
      if (w < 1 || h < 1) return;
      setDisplaySize(prev => (prev && prev.w === w && prev.h === h) ? prev : { w, h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pixelPitch]);

  const displayW = displaySize?.w ?? 64;
  const displayH = displaySize?.h ?? 16;

  const { containerRef, rendererRef } = usePixelDisplay({
    width: displayW,
    height: displayH,
    renderer: 'imagedata',
    glow,
    scale: pixelPitch,
    pixelGap: 0.15,
  });

  useEffect(() => {
    loadPixollettaFont().then(() => setFontReady(true));
  }, []);

  // Live data provider (only active when not simulating)
  useEffect(() => {
    if (simulate) return;
    const provider = createLiveTripProvider(
      (updatedTrips) => setLiveTrips(updatedTrips),
      proxyUrl,
      undefined,
      useCorsProxy,
    );
    provider.start();
    return () => provider.stop();
  }, [proxyUrl, simulate, useCorsProxy]);

  useEffect(() => {
    if (!fontReady || !displaySize) return;

    let running = true;
    let animId = 0;
    let lastFrameAt = 0;
    let lastPaintAt = 0;
    let lastPixels: string[] | null = null;

    const render = (frameTime: number) => {
      if (!running) return;
      animId = requestAnimationFrame(render);
      if (!rendererRef.current) return;
      if (frameTime - lastFrameAt < MIN_FRAME_INTERVAL_MS) return;
      lastFrameAt = frameTime;

      const simNow = simTimeRef.current;
      const now = simNow ? simNow.getTime() : Date.now();
      const uptimeMs = Date.now() - startTimeRef.current;
      let currentTrips = tripsRef.current.filter(t => t.arrivalTime > now - 30000);

      if (hideStationPrefix) {
        currentTrips = currentTrips.map(t => ({
          ...t,
          headsign: t.headsign.replace(/^[^/]*\//, ''),
        }));
      }

      const pixels = renderTransitDisplay(
        currentTrips, displayW, displayH, now, uptimeMs, null, scrollHeadsigns, departureTimeOnly, entrySpacing
      );

      // Pushing to the renderer is the expensive half: it re-parses every
      // pixel's colour and rewrites the whole ImageData buffer. Skip it
      // outright when the frame is identical to the one already on screen.
      const forced = frameTime - lastPaintAt >= FORCED_REDRAW_INTERVAL_MS;
      if (!forced && pixelsEqual(pixels, lastPixels)) return;

      lastPixels = pixels;
      lastPaintAt = frameTime;
      rendererRef.current.setData(pixels);
      rendererRef.current.renderStatic();
    };

    animId = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, [fontReady, displaySize, displayW, displayH, glow, scrollHeadsigns, departureTimeOnly, hideStationPrefix, entrySpacing, rendererRef]);

  return (
    <DarkContainer bg="#0a0a0a" radius={4} style={{ padding: padding > 0 ? `${padding}px` : undefined }}>
      <div
        ref={wrapperRef}
        className="w-full h-full"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          ref={containerRef}
          style={{
            lineHeight: 0,
            width: displayW * pixelPitch,
            height: displayH * pixelPitch,
          }}
        />
      </div>
    </DarkContainer>
  );
}

// Registration lives in ./meta.ts, which carries the widget's metadata without
// importing this module or its dependencies.

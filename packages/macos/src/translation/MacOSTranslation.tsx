'use client';

import { useEffect, useRef, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSTranslationOptions from './MacOSTranslationOptions';

interface TranslationConfig {
  fromLang?: string;
  toLang?: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-TW', label: 'Traditional Chinese' },
  { value: 'ru', label: 'Russian' },
];

export default function MacOSTranslation({ config }: WidgetComponentProps) {
  const translationConfig = (config ?? {}) as TranslationConfig;
  const [fromLang, setFromLang] = useState(translationConfig.fromLang ?? 'en');
  const [toLang, setToLang] = useState(translationConfig.toLang ?? 'fr');
  const [sourceText, setSourceText] = useState('Welcome to Campus Hub.');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setFromLang(translationConfig.fromLang ?? 'en');
  }, [translationConfig.fromLang]);

  useEffect(() => {
    setToLang(translationConfig.toLang ?? 'fr');
  }, [translationConfig.toLang]);

  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      setError(null);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              sourceText,
            )}&langpair=${fromLang}|${toLang}`,
            { signal: controller.signal },
          );
          const data = (await response.json()) as {
            responseData?: { translatedText?: string };
          };
          setTranslatedText(data.responseData?.translatedText ?? '');
        } catch (nextError) {
          if (!(nextError instanceof DOMException && nextError.name === 'AbortError')) {
            setError(nextError instanceof Error ? nextError.message : 'Translation failed');
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 350);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [fromLang, sourceText, toLang]);

  const font = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const aquaSelectStyle = {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.25)',
    background: 'linear-gradient(180deg, #6AB0F3 0%, #3B82D0 50%, #2E6DB8 100%)',
    color: '#FFF',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
    fontFamily: font,
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    textShadow: '0 -1px 1px rgba(0,0,0,0.25)',
    minWidth: 0,
  } as const;

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[20px]"
      style={{
        fontFamily: font,
        background:
          'linear-gradient(180deg, rgba(80,130,190,0.85) 0%, rgba(55,100,165,0.9) 50%, rgba(40,80,140,0.92) 100%)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: '50%',
          right: -10,
          transform: 'translateY(-50%)',
          width: 180,
          height: 180,
          zIndex: 0,
          opacity: 0.22,
        }}
      >
        <svg viewBox="0 0 180 180" width="180" height="180" fill="none">
          <circle cx="90" cy="90" r="85" stroke="rgba(120,160,220,1)" strokeWidth="1.8" />
          <ellipse cx="90" cy="90" rx="55" ry="85" stroke="rgba(120,160,220,1)" strokeWidth="1.4" />
          <ellipse cx="90" cy="90" rx="28" ry="85" stroke="rgba(120,160,220,1)" strokeWidth="1.2" />
          <line x1="90" y1="5" x2="90" y2="175" stroke="rgba(120,160,220,1)" strokeWidth="1.4" />
          <line x1="5" y1="90" x2="175" y2="90" stroke="rgba(120,160,220,1)" strokeWidth="1.4" />
          <ellipse cx="90" cy="90" rx="85" ry="28" stroke="rgba(120,160,220,1)" strokeWidth="1" />
          <ellipse cx="90" cy="50" rx="72" ry="1" stroke="rgba(120,160,220,1)" strokeWidth="0.8" />
          <ellipse cx="90" cy="130" rx="72" ry="1" stroke="rgba(120,160,220,1)" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="relative z-[1]" style={{ padding: '7px 10px 5px' }}>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Translate from
          </span>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, marginLeft: 'auto' }}>
            <select
              value={fromLang}
              onChange={(event) => setFromLang(event.target.value)}
              style={{ ...aquaSelectStyle, width: '100%', paddingRight: 20 }}
            >
              {LANGUAGES.map((option) => (
                <option key={option.value} value={option.value} style={{ color: '#000', background: '#FFF' }}>
                  {option.label}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 8,
                lineHeight: 1,
              }}
            >
              ▼
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[1]" style={{ padding: '6px 10px 4px' }}>
        <textarea
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Enter text..."
          style={{
            width: '100%',
            fontSize: 13,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            background: 'rgba(255,255,255,0.92)',
            color: '#1A1A1A',
            resize: 'none',
            minHeight: 56,
            fontFamily: font,
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.05)',
            lineHeight: 1.4,
            display: 'block',
          }}
        />
      </div>

      <div className="relative z-[1]" style={{ padding: '5px 10px' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextFrom = toLang;
              const nextTo = fromLang;
              setFromLang(nextFrom);
              setToLang(nextTo);
              setTranslatedText(sourceText);
              setSourceText(translatedText);
            }}
            style={{
              padding: '3px 6px',
              borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.25)',
              background: 'linear-gradient(180deg, #6AB0F3 0%, #3B82D0 50%, #2E6DB8 100%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
              color: '#FFF',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            Swap
          </button>
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            To
          </span>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, marginLeft: 'auto' }}>
            <select
              value={toLang}
              onChange={(event) => setToLang(event.target.value)}
              style={{ ...aquaSelectStyle, width: '100%', paddingRight: 20 }}
            >
              {LANGUAGES.map((option) => (
                <option key={option.value} value={option.value} style={{ color: '#000', background: '#FFF' }}>
                  {option.label}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 8,
                lineHeight: 1,
              }}
            >
              ▼
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] flex-1" style={{ padding: '4px 10px 8px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            fontSize: 13,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.85)',
            color: loading ? 'rgba(0,0,0,0.4)' : '#1A1A1A',
            minHeight: 56,
            maxHeight: '100%',
            fontFamily: font,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.05)',
            lineHeight: 1.4,
          }}
        >
          {loading ? (
            <span style={{ fontStyle: 'italic', color: 'rgba(0,0,0,0.35)' }}>
              Translating...
            </span>
          ) : error ? (
            <span style={{ color: '#C44' }}>{error}</span>
          ) : translatedText ? (
            translatedText
          ) : (
            <span style={{ color: 'rgba(0,0,0,0.25)' }}>Translation</span>
          )}
        </div>
      </div>
    </div>
  );
}

registerWidget({
  type: 'macos-translation',
  name: 'macOS Translate',
  description: 'Aqua-style translation desk with live text conversion',
  icon: 'languages',
  minW: 3,
  minH: 2,
  defaultW: 4,
  defaultH: 3,
  component: MacOSTranslation,
  OptionsComponent: MacOSTranslationOptions,
  tags: ['retro', 'info'],
  defaultProps: {
    fromLang: 'en',
    toLang: 'fr',
  },
});

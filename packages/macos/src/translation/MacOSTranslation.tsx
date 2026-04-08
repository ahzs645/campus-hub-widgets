'use client';

import { useEffect, useRef, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSTranslationOptions from './MacOSTranslationOptions';
import {
  MACOS_INPUT_CLASS_NAME,
  MacOSInset,
  MacOSWidgetFrame,
} from '../shared/ui';

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

  return (
    <MacOSWidgetFrame
      title="Translate"
      subtitle={`${fromLang.toUpperCase()} → ${toLang.toUpperCase()}`}
      footer={
        <div className="flex items-center justify-between text-[11px] text-black/55">
          <span>{loading ? 'Translating…' : 'MyMemory'}</span>
          {error ? <span className="text-[#b5362a]">{error}</span> : null}
        </div>
      }
    >
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
          <select
            className={MACOS_INPUT_CLASS_NAME}
            value={fromLang}
            onChange={(event) => setFromLang(event.target.value)}
          >
            {LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="macos-button font-macos-ui"
            onClick={() => {
              const nextFrom = toLang;
              const nextTo = fromLang;
              setFromLang(nextFrom);
              setToLang(nextTo);
              setTranslatedText(sourceText);
              setSourceText(translatedText);
            }}
          >
            Swap
          </button>
          <select
            className={MACOS_INPUT_CLASS_NAME}
            value={toLang}
            onChange={(event) => setToLang(event.target.value)}
          >
            {LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-h-0 grid-cols-2 gap-3">
          <MacOSInset className="flex min-h-0 flex-col p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
              Source
            </div>
            <textarea
              className={`${MACOS_INPUT_CLASS_NAME} h-full min-h-0 resize-none border-none bg-transparent p-0 shadow-none`}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </MacOSInset>
          <MacOSInset className="flex min-h-0 flex-col p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
              Translation
            </div>
            <textarea
              className={`${MACOS_INPUT_CLASS_NAME} h-full min-h-0 resize-none border-none bg-transparent p-0 shadow-none`}
              value={translatedText}
              readOnly
            />
          </MacOSInset>
        </div>
      </div>
    </MacOSWidgetFrame>
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

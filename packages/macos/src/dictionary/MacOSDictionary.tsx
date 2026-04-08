'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCacheKey,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSDictionaryOptions from './MacOSDictionaryOptions';
import {
  EmptyState,
  MACOS_INPUT_CLASS_NAME,
  MacOSInset,
  MacOSSegmentedControl,
  MacOSWidgetFrame,
} from '../shared/ui';

interface DictionaryConfig {
  initialWord?: string;
  showExamples?: boolean;
}

interface DictionaryApiEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    synonyms?: string[];
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
}

type DictionaryTab = 'definitions' | 'synonyms';

export default function MacOSDictionary({ config }: WidgetComponentProps) {
  const dictionaryConfig = (config ?? {}) as DictionaryConfig;
  const [query, setQuery] = useState(dictionaryConfig.initialWord ?? 'serendipity');
  const [entry, setEntry] = useState<DictionaryApiEntry | null>(null);
  const [tab, setTab] = useState<DictionaryTab>('definitions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(dictionaryConfig.initialWord ?? 'serendipity');
  }, [dictionaryConfig.initialWord]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setEntry(null);
      setError(null);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);

        try {
          const { data } = await fetchJsonWithCache<DictionaryApiEntry[]>(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`,
            {
              cacheKey: buildCacheKey('macos-dictionary', trimmed),
              ttlMs: 7 * 24 * 60 * 60 * 1000,
            },
          );
          setEntry(data[0] ?? null);
          if (!data[0]) {
            setError('No entry found');
          }
        } catch (nextError) {
          setEntry(null);
          setError(nextError instanceof Error ? nextError.message : 'Lookup failed');
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const pronunciation = entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || '';
  const synonyms = useMemo(() => {
    if (!entry) return [];
    return Array.from(
      new Set(
        entry.meanings.flatMap((meaning) => [
          ...(meaning.synonyms ?? []),
          ...meaning.definitions.flatMap((definition) => definition.synonyms ?? []),
        ]),
      ),
    ).slice(0, 18);
  }, [entry]);

  return (
    <MacOSWidgetFrame
      title="Dictionary"
      subtitle={entry?.word || 'Search'}
      toolbar={
        <MacOSSegmentedControl
          value={tab}
          options={[
            { value: 'definitions', label: 'Meaning' },
            { value: 'synonyms', label: 'Synonyms' },
          ]}
          onChange={setTab}
        />
      }
      bodyClassName="gap-3"
    >
      <input
        className={MACOS_INPUT_CLASS_NAME}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search a word"
      />
      {!entry && !loading ? (
        <EmptyState
          title="Look something up"
          description={error || 'Definitions will appear here as you type.'}
        />
      ) : (
        <MacOSInset className="macos-scroll flex min-h-0 flex-1 flex-col overflow-auto p-3">
          {loading ? (
            <div className="text-sm text-black/55">Looking up “{query}”…</div>
          ) : (
            <>
              <div className="pb-3">
                <div className="text-[26px] leading-none font-macos-display text-[#15283c]">
                  {entry?.word}
                </div>
                {pronunciation ? (
                  <div className="mt-1 text-[12px] text-[#4d6984]">
                    {pronunciation}
                  </div>
                ) : null}
              </div>
              {tab === 'definitions' ? (
                <div className="space-y-3">
                  {entry?.meanings.map((meaning) => (
                    <div
                      key={`${entry.word}-${meaning.partOfSpeech}`}
                      className="rounded-[10px] border border-black/8 bg-white/70 p-3"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                        {meaning.partOfSpeech}
                      </div>
                      {meaning.definitions.slice(0, 3).map((definition, index) => (
                        <div key={`${meaning.partOfSpeech}-${index}`} className="mt-2">
                          <div className="text-[12px] text-[#1a1a1a]">
                            {definition.definition}
                          </div>
                          {dictionaryConfig.showExamples !== false && definition.example ? (
                            <div className="mt-1 text-[11px] italic text-black/55">
                              {definition.example}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : synonyms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {synonyms.map((synonym) => (
                    <button
                      key={synonym}
                      type="button"
                      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] text-[#1a1a1a]"
                      onClick={() => setQuery(synonym)}
                    >
                      {synonym}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/55">No synonyms found for this entry.</div>
              )}
            </>
          )}
        </MacOSInset>
      )}
    </MacOSWidgetFrame>
  );
}

registerWidget({
  type: 'macos-dictionary',
  name: 'macOS Dictionary',
  description: 'Aqua-style dictionary and synonym lookup',
  icon: 'type',
  minW: 3,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: MacOSDictionary,
  OptionsComponent: MacOSDictionaryOptions,
  tags: ['retro', 'info'],
  defaultProps: {
    initialWord: 'serendipity',
    showExamples: true,
  },
});

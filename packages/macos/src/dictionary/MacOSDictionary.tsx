'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCacheKey,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSDictionaryOptions from './MacOSDictionaryOptions';

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
  const font = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const serifFont = 'Georgia, "Times New Roman", Times, serif';

  return (
    <div
      style={{
        fontFamily: font,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'inherit',
        height: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #7D5E3F 0%, #6B4C30 40%, #5A3E25 100%)',
          borderBottom: '1px solid #3E2A14',
          padding: '6px 10px 8px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="flex items-center justify-center gap-0"
          style={{ position: 'relative', marginBottom: 6 }}
        >
          <button
            type="button"
            onClick={() => setTab('definitions')}
            style={{
              fontSize: 11,
              fontWeight: tab === 'definitions' ? 700 : 400,
              color: tab === 'definitions' ? '#FFF' : 'rgba(255,255,255,0.55)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 4px',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Dictionary
          </button>
          <span
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: 11,
              margin: '0 4px',
              userSelect: 'none',
            }}
          >
            ·
          </span>
          <button
            type="button"
            onClick={() => setTab('synonyms')}
            style={{
              fontSize: 11,
              fontWeight: tab === 'synonyms' ? 700 : 400,
              color: tab === 'synonyms' ? '#FFF' : 'rgba(255,255,255,0.55)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 4px',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Thesaurus
          </button>
        </div>

        <div
          className="flex items-center gap-1.5"
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 10,
            padding: '3px 8px',
            border: '1px solid rgba(0,0,0,0.2)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a word"
            className="flex-1 bg-transparent outline-none"
            style={{
              color: '#FFF',
              caretColor: 'rgba(255,255,255,0.7)',
              fontFamily: font,
              fontSize: 11,
            }}
          />
        </div>
      </div>

      <div
        className="macos-scroll flex-1 overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #F5F0E8 0%, #EDE7DA 100%)',
          padding: '8px 12px',
          minHeight: 0,
        }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center py-6"
            style={{ color: '#9E9585', fontSize: 11, fontFamily: serifFont }}
          >
            Looking up "{query}"…
          </div>
        ) : error ? (
          <div
            className="flex items-center justify-center py-6 text-center"
            style={{
              color: '#9E9585',
              fontSize: 11,
              fontFamily: serifFont,
              fontStyle: 'italic',
            }}
          >
            {error}
          </div>
        ) : !entry ? (
          <div
            className="flex items-center justify-center py-8 text-center"
            style={{
              color: '#B5AA98',
              fontSize: 12,
              fontFamily: serifFont,
              fontStyle: 'italic',
            }}
          >
            Definitions will appear here as you type.
          </div>
        ) : (
          <div style={{ fontFamily: serifFont }}>
            <div style={{ marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#2C2418',
                  letterSpacing: '-0.01em',
                }}
              >
                {entry.word}
              </span>
              {pronunciation ? (
                <span
                  style={{
                    fontSize: 12,
                    color: '#8C7E6A',
                    marginLeft: 8,
                    fontWeight: 400,
                  }}
                >
                  {pronunciation}
                </span>
              ) : null}
            </div>

            {tab === 'definitions' ? (
              entry.meanings.map((meaning) => (
                <div key={`${entry.word}-${meaning.partOfSpeech}`} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontStyle: 'italic',
                      color: '#6B5D4D',
                      fontSize: 11,
                      marginBottom: 3,
                      fontWeight: 600,
                    }}
                  >
                    {meaning.partOfSpeech}
                  </div>
                  {meaning.definitions.slice(0, 3).map((definition, index) => (
                    <div
                      key={`${meaning.partOfSpeech}-${index}`}
                      style={{
                        marginBottom: 3,
                        color: '#3D3226',
                        fontSize: 12,
                        lineHeight: 1.45,
                        paddingLeft: 10,
                      }}
                    >
                      <span style={{ color: '#9E9585', marginRight: 4, fontSize: 11 }}>
                        {index + 1}.
                      </span>
                      {definition.definition}
                      {dictionaryConfig.showExamples !== false && definition.example ? (
                        <div
                          style={{
                            marginTop: 3,
                            marginLeft: 14,
                            color: '#6B5D4D',
                            fontSize: 11,
                            fontStyle: 'italic',
                          }}
                        >
                          {definition.example}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))
            ) : synonyms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {synonyms.map((synonym) => (
                  <button
                    key={synonym}
                    type="button"
                    onClick={() => setQuery(synonym)}
                    style={{
                      borderRadius: 999,
                      border: '1px solid rgba(60,44,24,0.18)',
                      background: 'rgba(255,255,255,0.66)',
                      padding: '5px 10px',
                      color: '#3D3226',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {synonym}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ color: '#6B5D4D', fontSize: 12 }}>
                No synonyms found for this entry.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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

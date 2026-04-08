'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WidgetComponentProps,
  registerWidget,
  DarkContainer,
  useFitScale,
} from '@firstform/campus-hub-widget-sdk';
import TriviaOptions from './TriviaOptions';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TriviaQuestion {
  question: string;
  options: string[];
  answer: number; // index into options[]
  category?: string;
}

export interface TriviaConfig {
  category?: string;
  rotationInterval?: number; // seconds between auto-advance
  revealDelay?: number; // seconds before showing answer
  shuffle?: boolean;
  customQuestions?: string; // JSON string of TriviaQuestion[]
}

// ─── Built-in question bank ──────────────────────────────────────────────────

const BUILTIN_QUESTIONS: TriviaQuestion[] = [
  // Science
  { question: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1, category: 'science' },
  { question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2, category: 'science' },
  { question: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], answer: 1, category: 'science' },
  { question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2, category: 'science' },
  { question: 'What is the speed of light (approx)?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], answer: 0, category: 'science' },
  { question: 'What is the hardest natural substance?', options: ['Quartz', 'Topaz', 'Diamond', 'Ruby'], answer: 2, category: 'science' },
  { question: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 1, category: 'science' },
  { question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], answer: 2, category: 'science' },

  // History
  { question: 'In what year did the Titanic sink?', options: ['1905', '1912', '1918', '1923'], answer: 1, category: 'history' },
  { question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Da Vinci', 'Donatello'], answer: 2, category: 'history' },
  { question: 'Which ancient wonder was in Alexandria?', options: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Temple of Artemis'], answer: 1, category: 'history' },
  { question: 'What year did the Berlin Wall fall?', options: ['1987', '1989', '1991', '1993'], answer: 1, category: 'history' },
  { question: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], answer: 1, category: 'history' },
  { question: 'What empire built Machu Picchu?', options: ['Aztec', 'Maya', 'Inca', 'Olmec'], answer: 2, category: 'history' },

  // Geography
  { question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3, category: 'geography' },
  { question: 'Which country has the most time zones?', options: ['Russia', 'USA', 'France', 'China'], answer: 2, category: 'geography' },
  { question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], answer: 1, category: 'geography' },
  { question: 'Which river is the longest in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1, category: 'geography' },
  { question: 'What is the driest continent?', options: ['Africa', 'Australia', 'Antarctica', 'Asia'], answer: 2, category: 'geography' },
  { question: 'Mount Everest is on the border of which two countries?', options: ['India & China', 'Nepal & China', 'Nepal & India', 'Bhutan & China'], answer: 1, category: 'geography' },

  // Pop Culture
  { question: 'What is the highest-grossing film of all time?', options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: TFA'], answer: 1, category: 'pop-culture' },
  { question: 'Which band wrote "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], answer: 2, category: 'pop-culture' },
  { question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], answer: 2, category: 'pop-culture' },
  { question: 'Who wrote the Harry Potter series?', options: ['J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis', 'Roald Dahl'], answer: 1, category: 'pop-culture' },

  // Technology
  { question: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'HyperText Transit Program', 'Home Tool Transfer Protocol'], answer: 0, category: 'technology' },
  { question: 'Who co-founded Apple with Steve Jobs?', options: ['Bill Gates', 'Steve Wozniak', 'Tim Cook', 'Larry Page'], answer: 1, category: 'technology' },
  { question: 'What programming language is named after a type of coffee?', options: ['Python', 'C++', 'Java', 'Ruby'], answer: 2, category: 'technology' },
  { question: 'In what year was the World Wide Web invented?', options: ['1985', '1989', '1993', '1997'], answer: 1, category: 'technology' },

  // Food & Drink
  { question: 'What country does sushi originate from?', options: ['China', 'Korea', 'Japan', 'Thailand'], answer: 2, category: 'food' },
  { question: 'What is the main ingredient in guacamole?', options: ['Tomato', 'Avocado', 'Pepper', 'Onion'], answer: 1, category: 'food' },
  { question: 'Which nut is used to make marzipan?', options: ['Walnut', 'Cashew', 'Almond', 'Pistachio'], answer: 2, category: 'food' },
  { question: 'What fruit is traditionally on top of a Hawaiian pizza?', options: ['Mango', 'Pineapple', 'Papaya', 'Banana'], answer: 1, category: 'food' },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  science: 'Science',
  history: 'History',
  geography: 'Geography',
  'pop-culture': 'Pop Culture',
  technology: 'Technology',
  food: 'Food & Drink',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function mixColors(base: string, target: string, weight: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);

  if (!baseRgb || !targetRgb) return target;

  const clampedWeight = Math.max(0, Math.min(1, weight));
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * clampedWeight);

  return `rgb(${mix(baseRgb.r, targetRgb.r)}, ${mix(baseRgb.g, targetRgb.g)}, ${mix(baseRgb.b, targetRgb.b)})`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function parseCustomQuestions(raw: string | undefined): TriviaQuestion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q: unknown): q is TriviaQuestion =>
        typeof q === 'object' &&
        q !== null &&
        typeof (q as TriviaQuestion).question === 'string' &&
        Array.isArray((q as TriviaQuestion).options) &&
        (q as TriviaQuestion).options.length >= 2 &&
        typeof (q as TriviaQuestion).answer === 'number',
    );
  } catch {
    return [];
  }
}

// ─── Option letter labels ────────────────────────────────────────────────────

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TriviaGame({ config, theme }: WidgetComponentProps) {
  const cfg = config as TriviaConfig | undefined;
  const category = cfg?.category ?? 'all';
  const rotationInterval = cfg?.rotationInterval ?? 15;
  const revealDelay = cfg?.revealDelay ?? 6;
  const shuffle = cfg?.shuffle !== false;

  // Merge built-in + custom questions
  const allQuestions = useMemo(() => {
    const custom = parseCustomQuestions(cfg?.customQuestions);
    const builtin =
      category === 'all'
        ? BUILTIN_QUESTIONS
        : BUILTIN_QUESTIONS.filter((q) => q.category === category);
    const merged = [...builtin, ...custom];
    return shuffle ? shuffleArray(merged) : merged;
  }, [category, cfg?.customQuestions, shuffle]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const question = allQuestions[index % allQuestions.length];

  // Auto-reveal answer after delay
  useEffect(() => {
    setRevealed(false);
    if (revealDelay <= 0) return;
    const timer = setTimeout(() => setRevealed(true), revealDelay * 1000);
    return () => clearTimeout(timer);
  }, [index, revealDelay]);

  // Auto-rotate to next question
  const advance = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % allQuestions.length);
      setRevealed(false);
      setTransitioning(false);
    }, 350);
  }, [allQuestions.length]);

  useEffect(() => {
    if (rotationInterval <= 0) return;
    const timer = setInterval(advance, rotationInterval * 1000);
    return () => clearInterval(timer);
  }, [rotationInterval, advance]);

  const { containerRef, scale } = useFitScale(340, 300);
  const accentColor = theme.accent;
  const headlineColor = mixColors(theme.background, '#ffffff', 0.97);
  const bodyColor = mixColors(theme.background, '#ffffff', 0.84);
  const mutedColor = mixColors(theme.background, '#ffffff', 0.44);
  const subtleColor = mixColors(theme.background, '#ffffff', 0.22);
  const surfaceColor = mixColors(theme.background, '#ffffff', 0.07);
  const surfaceBorder = mixColors(theme.background, '#ffffff', 0.14);
  const badgeColor = mixColors(theme.background, '#ffffff', 0.18);
  const revealedSurface = mixColors(theme.background, theme.accent, 0.18);
  const revealedText = mixColors(theme.background, '#ffffff', 0.92);
  const outerPadX = 8;
  const outerPadTop = 8;
  const outerPadBottom = 18;

  if (allQuestions.length === 0) {
    return (
      <DarkContainer ref={containerRef} bg={theme.background} className="flex items-center justify-center">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
          <span style={{ color: mutedColor, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            No questions available
          </span>
        </div>
      </DarkContainer>
    );
  }

  return (
    <DarkContainer ref={containerRef} bg={theme.background} className="flex items-center justify-center">
      <div
        style={{
          width: 340,
          height: 300,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.35s ease',
        }}
        className="relative"
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: `${outerPadTop}px ${outerPadX}px ${outerPadBottom}px`,
            boxSizing: 'border-box',
          }}
          className="flex flex-col"
        >
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-2">
            <div
              style={{
                backgroundColor: accentColor,
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: accentColor,
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}
            >
              {CATEGORY_LABELS[question.category ?? ''] ?? question.category ?? 'Trivia'}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                color: mutedColor,
                fontFamily: 'monospace',
                fontSize: '0.55rem',
                letterSpacing: '0.1em',
              }}
            >
              {String((index % allQuestions.length) + 1).padStart(2, '0')}/{String(allQuestions.length).padStart(2, '0')}
            </span>
          </div>

          {/* Question */}
          <div
            style={{
              backgroundColor: surfaceColor,
              borderRadius: 14,
              border: `1px solid ${surfaceBorder}`,
              padding: '14px 16px',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                color: headlineColor,
                fontSize: '0.85rem',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {question.question}
            </span>
          </div>

          {/* Answer options */}
          <div className="flex flex-col gap-[6px]" style={{ flex: 1 }}>
            {question.options.map((opt, i) => {
              const isCorrect = i === question.answer;
              const showCorrect = revealed && isCorrect;
              const showWrong = revealed && !isCorrect;

              return (
                <div
                  key={`${index}-${i}`}
                  style={{
                    backgroundColor: showCorrect ? revealedSurface : surfaceColor,
                    borderRadius: 10,
                    border: `1px solid ${showCorrect ? accentColor : surfaceBorder}`,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {/* Letter badge */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: showCorrect ? accentColor : badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background-color 0.4s ease',
                    }}
                  >
                    <span
                      style={{
                        color: showCorrect ? theme.background : mutedColor,
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    >
                      {OPTION_LETTERS[i]}
                    </span>
                  </div>

                  <span
                    style={{
                      color: showCorrect ? revealedText : showWrong ? mutedColor : bodyColor,
                      fontSize: '0.75rem',
                      fontWeight: showCorrect ? 600 : 400,
                      transition: 'color 0.4s ease',
                    }}
                  >
                    {opt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-[5px] mt-2">
            {Array.from({ length: Math.min(allQuestions.length, 10) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index % Math.min(allQuestions.length, 10) ? 14 : 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor:
                    i === index % Math.min(allQuestions.length, 10) ? accentColor : surfaceBorder,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </DarkContainer>
  );
}

registerWidget({
  type: 'trivia-game',
  name: 'Trivia Game',
  description: 'Fun trivia questions with auto-rotation and answer reveals',
  icon: 'puzzle',
  minW: 3,
  minH: 3,
  defaultW: 4,
  defaultH: 4,
  component: TriviaGame,
  OptionsComponent: TriviaOptions,
  defaultProps: {
    category: 'all',
    rotationInterval: 15,
    revealDelay: 6,
    shuffle: true,
    customQuestions: '',
  },
});

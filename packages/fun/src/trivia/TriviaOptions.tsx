'use client';
import { useState, useEffect, useRef } from 'react';
import { FormSelect, FormSwitch, FormInput, OptionsSection } from '@firstform/campus-hub-widget-sdk';
import type { WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';
import type { TriviaQuestion } from './TriviaGame';

interface TriviaData {
  category: string;
  rotationInterval: number;
  revealDelay: number;
  shuffle: boolean;
  customQuestions: string;
}

function parseCSV(text: string): TriviaQuestion[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect header
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes('question') || header.includes('answer') || header.includes('option');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      // Handle quoted CSV fields
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());

      // Expected format: question, option1, option2, option3, option4, answerIndex, [category]
      if (fields.length < 4) return null;

      const question = fields[0];
      const options = fields.slice(1, -2).length >= 2 ? fields.slice(1, -1) : fields.slice(1, fields.length - 1);

      // Last field is answer index (0-based) or answer text, optional second-to-last could be category
      let answerRaw = fields[fields.length - 1];
      let category: string | undefined;

      // If there are enough fields, try: question, opts..., answer, category
      // Otherwise: question, opts..., answer
      const answerNum = Number(answerRaw);
      if (!isNaN(answerNum) && answerNum >= 0 && answerNum < options.length) {
        return { question, options, answer: answerNum, category } as TriviaQuestion;
      }

      // Try answer as text match
      const matchIdx = options.findIndex(
        (o) => o.toLowerCase() === answerRaw.toLowerCase(),
      );
      if (matchIdx >= 0) {
        return { question, options, answer: matchIdx, category } as TriviaQuestion;
      }

      return null;
    })
    .filter((q): q is TriviaQuestion => q !== null);
}

export default function TriviaOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<TriviaData>(() => ({
    category: (data?.category as string) ?? 'all',
    rotationInterval: (data?.rotationInterval as number) ?? 15,
    revealDelay: (data?.revealDelay as number) ?? 6,
    shuffle: (data?.shuffle as boolean) ?? true,
    customQuestions: (data?.customQuestions as string) ?? '',
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setState({
        category: (data.category as string) ?? 'all',
        rotationInterval: (data.rotationInterval as number) ?? 15,
        revealDelay: (data.revealDelay as number) ?? 6,
        shuffle: (data.shuffle as boolean) ?? true,
        customQuestions: (data.customQuestions as string) ?? '',
      });
    }
  }, [data]);

  const emit = (newState: TriviaData) => {
    setState(newState);
    onChange(newState as unknown as Record<string, unknown>);
  };

  const handleChange = (name: string, value: string | number | boolean) => {
    emit({ ...state, [name]: value });
  };

  const customCount = (() => {
    try {
      const arr = JSON.parse(state.customQuestions || '[]');
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  })();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      let questions: TriviaQuestion[] = [];

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          questions = Array.isArray(parsed) ? parsed : [];
        } catch {
          // ignore
        }
      } else {
        // CSV / TSV
        questions = parseCSV(text);
      }

      if (questions.length > 0) {
        // Merge with existing custom questions
        let existing: TriviaQuestion[] = [];
        try {
          existing = JSON.parse(state.customQuestions || '[]');
          if (!Array.isArray(existing)) existing = [];
        } catch {
          existing = [];
        }
        const merged = [...existing, ...questions];
        emit({ ...state, customQuestions: JSON.stringify(merged) });
      }
    };
    reader.readAsText(file);

    // Reset input so re-uploading the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearCustom = () => {
    emit({ ...state, customQuestions: '' });
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <FormSelect
        label="Category"
        name="category"
        value={state.category}
        options={[
          { value: 'all', label: 'All Categories' },
          { value: 'science', label: 'Science' },
          { value: 'history', label: 'History' },
          { value: 'geography', label: 'Geography' },
          { value: 'pop-culture', label: 'Pop Culture' },
          { value: 'technology', label: 'Technology' },
          { value: 'food', label: 'Food & Drink' },
        ]}
        onChange={handleChange}
      />

      <FormSelect
        label="Question Rotation"
        name="rotationInterval"
        value={String(state.rotationInterval)}
        options={[
          { value: '8', label: '8 seconds' },
          { value: '10', label: '10 seconds' },
          { value: '15', label: '15 seconds' },
          { value: '20', label: '20 seconds' },
          { value: '30', label: '30 seconds' },
          { value: '60', label: '1 minute' },
        ]}
        onChange={(name, value) => handleChange(name, Number(value))}
      />

      <FormSelect
        label="Answer Reveal Delay"
        name="revealDelay"
        value={String(state.revealDelay)}
        options={[
          { value: '3', label: '3 seconds' },
          { value: '5', label: '5 seconds' },
          { value: '6', label: '6 seconds' },
          { value: '8', label: '8 seconds' },
          { value: '10', label: '10 seconds' },
        ]}
        onChange={(name, value) => handleChange(name, Number(value))}
      />

      <FormSwitch
        label="Shuffle Questions"
        name="shuffle"
        checked={state.shuffle}
        onChange={handleChange}
      />

      {/* Custom questions upload */}
      <OptionsSection title="Custom Questions">
        <p style={{ color: '#9E9E9E', fontSize: '0.75rem', marginBottom: 12 }}>
          Upload a JSON or CSV file to add your own trivia questions. CSV format:
          <br />
          <code style={{ color: '#81C784', fontSize: '0.7rem' }}>
            question, optionA, optionB, optionC, optionD, answerIndex
          </code>
        </p>

        <div className="flex items-center gap-3">
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: '#2A2A2D',
              border: '1px solid #3A3A3D',
              color: '#CDCDCD',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Upload File
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.tsv,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {customCount > 0 && (
            <>
              <span style={{ color: '#81C784', fontSize: '0.75rem', fontWeight: 500 }}>
                {customCount} custom question{customCount !== 1 ? 's' : ''} loaded
              </span>
              <button
                type="button"
                onClick={clearCustom}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  color: '#EF5350',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </>
          )}
        </div>
      </OptionsSection>
    </div>
  );
}

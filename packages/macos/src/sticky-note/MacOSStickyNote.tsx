'use client';

import { useEffect, useState } from 'react';
import {
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSStickyNoteOptions from './MacOSStickyNoteOptions';
import { MacOSWidgetFrame } from '../shared/ui';

interface StickyNoteConfig {
  title?: string;
  text?: string;
  color?: string;
}

function textColorForBackground(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((item) => item + item).join('')
    : normalized;
  const numeric = Number.parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 160 ? '#443605' : '#1d1d1d';
}

export default function MacOSStickyNote({ config }: WidgetComponentProps) {
  const noteConfig = (config ?? {}) as StickyNoteConfig;
  const paperColor = noteConfig.color ?? '#fff8a6';
  const [text, setText] = useState(noteConfig.text ?? 'Add a reminder…');

  useEffect(() => {
    setText(noteConfig.text ?? 'Add a reminder…');
  }, [noteConfig.text]);

  return (
    <MacOSWidgetFrame title={noteConfig.title?.trim() || 'Sticky note'}>
      <div
        className="macos-note-paper h-full p-4"
        style={{
          background: `linear-gradient(180deg, ${paperColor} 0%, color-mix(in srgb, ${paperColor} 82%, #f1dd7b 18%) 100%)`,
          color: textColorForBackground(paperColor),
        }}
      >
        <textarea
          className="h-full w-full resize-none bg-transparent text-[14px] leading-7 outline-none"
          style={{
            fontFamily: '"Marker Felt", "Comic Sans MS", "Bradley Hand", cursive',
          }}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
    </MacOSWidgetFrame>
  );
}

registerWidget({
  type: 'macos-sticky-note',
  name: 'macOS Sticky Note',
  description: 'Classic macOS note paper for quick reminders',
  icon: 'info',
  minW: 2,
  minH: 2,
  defaultW: 2,
  defaultH: 3,
  component: MacOSStickyNote,
  OptionsComponent: MacOSStickyNoteOptions,
  tags: ['retro', 'utility'],
  defaultProps: {
    title: 'Sticky note',
    text: 'Add a reminder…',
    color: '#fff8a6',
  },
});

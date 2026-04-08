'use client';

import { useEffect, useState } from 'react';
import {
  FormInput,
  OptionsPanel,
  OptionsSection,
  type WidgetOptionsProps,
} from '@firstform/campus-hub-widget-sdk';

interface IpodOptionsState {
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  accentColor: string;
}

export default function MacOSIPodOptions({
  data,
  onChange,
}: WidgetOptionsProps) {
  const [state, setState] = useState<IpodOptionsState>({
    title: (data.title as string) ?? 'Campus Groove',
    artist: (data.artist as string) ?? 'Campus Hub',
    album: (data.album as string) ?? 'Aqua Mix',
    audioUrl: (data.audioUrl as string) ?? '',
    coverUrl: (data.coverUrl as string) ?? '',
    accentColor: (data.accentColor as string) ?? '#70b86c',
  });

  useEffect(() => {
    setState({
      title: (data.title as string) ?? 'Campus Groove',
      artist: (data.artist as string) ?? 'Campus Hub',
      album: (data.album as string) ?? 'Aqua Mix',
      audioUrl: (data.audioUrl as string) ?? '',
      coverUrl: (data.coverUrl as string) ?? '',
      accentColor: (data.accentColor as string) ?? '#70b86c',
    });
  }, [data]);

  const handleChange = (name: string, value: string | number | boolean) => {
    const next = { ...state, [name]: value };
    setState(next);
    onChange(next);
  };

  return (
    <OptionsPanel>
      <OptionsSection title="Track details">
        <FormInput label="Title" name="title" value={state.title} onChange={handleChange} />
        <FormInput label="Artist" name="artist" value={state.artist} onChange={handleChange} />
        <FormInput label="Album" name="album" value={state.album} onChange={handleChange} />
        <FormInput label="Audio URL" name="audioUrl" value={state.audioUrl} onChange={handleChange} />
        <FormInput label="Cover art URL" name="coverUrl" value={state.coverUrl} onChange={handleChange} />
        <FormInput label="Accent color" name="accentColor" value={state.accentColor} onChange={handleChange} />
      </OptionsSection>
    </OptionsPanel>
  );
}

import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import MediaPlayerOptions from './MediaPlayerOptions';

interface MediaPlayerConfig {
  url?: string;
  type?: 'video' | 'audio';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  galleryDemo?: boolean;
}

const MEDIA_PLAYER_DEMO_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function MediaPlayerDemo({
  theme,
  type,
  autoplay,
  muted,
  loop,
  controls,
}: {
  theme: WidgetComponentProps['theme'];
  type: 'video' | 'audio';
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
}) {
  const isAudio = type === 'audio';

  return (
    <div
      className="h-full w-full p-6 text-white"
      style={{
        background: `linear-gradient(155deg, ${theme.primary}dd 0%, ${theme.background} 88%)`,
      }}
    >
      <div className="flex h-full flex-col rounded-[30px] border border-white/10 bg-black/25 p-5 shadow-2xl backdrop-blur-sm">
        <div className="relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
          {isAudio ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 42%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 68%)',
                }}
              />
              <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                Demo Playlist
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/14 shadow-lg shadow-black/25">
                  <AppIcon name="music" className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Campus Morning Mix</div>
                  <div className="mt-1 text-sm text-white/60">
                    Streaming audio sample
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <video
                src={MEDIA_PLAYER_DEMO_VIDEO_URL}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                controls={controls}
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Sample Clip
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              {isAudio ? 'Orientation Radio' : 'Campus Courtyard Loop'}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/60">
              <span>{autoplay ? 'Autoplay on' : 'Tap to play'}</span>
              <span>{muted ? 'Muted' : 'Sound on'}</span>
              {controls ? <span>Controls visible</span> : null}
            </div>
          </div>
          <div className="text-xs font-mono text-white/55">
            {isAudio ? '02:48' : '01:32'}
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: isAudio ? '58%' : '42%',
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MediaPlayer({ config, theme }: WidgetComponentProps) {
  const mediaConfig = config as MediaPlayerConfig | undefined;
  const url = mediaConfig?.url ?? '';
  const type = mediaConfig?.type ?? 'video';
  const autoplay = mediaConfig?.autoplay ?? false;
  const muted = mediaConfig?.muted ?? true;
  const loop = mediaConfig?.loop ?? true;
  const controls = mediaConfig?.controls ?? true;
  const galleryDemo = mediaConfig?.galleryDemo ?? false;

  if (!url) {
    if (galleryDemo) {
      return (
        <MediaPlayerDemo
          theme={theme}
          type={type}
          autoplay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
        />
      );
    }

    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon
          name={type === 'audio' ? 'music' : 'film'}
          className="w-9 h-9 mb-3 text-white/70"
        />
        <span className="text-white/70 text-sm">No media configured</span>
        <span className="text-white/50 text-xs mt-1">Add a media URL in settings</span>
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="music" className="w-12 h-12 mb-4 text-white/80" />
        <audio
          src={url}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-lg bg-black">
      <video
        src={url}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        className="w-full h-full object-contain"
        playsInline
      />
    </div>
  );
}

// Register the widget
registerWidget({
  type: 'media-player',
  name: 'Media Player',
  description: 'Play video or audio files',
  icon: 'film',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: MediaPlayer,
  OptionsComponent: MediaPlayerOptions,
  acceptsSources: [{ propName: 'url', types: ['video'] }],
  defaultProps: {
    url: '',
    type: 'video',
    autoplay: false,
    muted: true,
    loop: true,
    controls: true,
  },
});

import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import YouTubeOptions from './YouTubeOptions';

interface YouTubeConfig {
  videoId?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  galleryDemo?: boolean;
}

const YOUTUBE_DEMO_VIDEO = {
  title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
  channel: 'Rick Astley',
  duration: '3:33',
  views: '1.6B views',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
};

function YouTubeDemo({
  muted,
  autoplay,
  loop,
}: {
  muted: boolean;
  autoplay: boolean;
  loop: boolean;
}) {
  return (
    <div className="h-full w-full p-5">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#121316] text-white shadow-2xl">
        <div className="relative flex-1 overflow-hidden bg-black">
          <img
            src={YOUTUBE_DEMO_VIDEO.thumbnail}
            alt={YOUTUBE_DEMO_VIDEO.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
          <div className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            Featured Video
          </div>
          <div className="absolute right-4 top-4 flex gap-2 text-[11px]">
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-white/75">
              {autoplay ? 'Autoplay' : 'Manual'}
            </span>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-white/75">
              {muted ? 'Muted' : 'Sound'}
            </span>
            {loop ? (
              <span className="rounded-full bg-black/35 px-2.5 py-1 text-white/75">
                Looping
              </span>
            ) : null}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 shadow-2xl">
              <div
                className="ml-1 h-0 w-0"
                style={{
                  borderTop: '12px solid transparent',
                  borderBottom: '12px solid transparent',
                  borderLeft: '20px solid white',
                }}
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="h-1.5 rounded-full bg-white/20">
              <div className="h-full w-[44%] rounded-full bg-[#ff3d2e]" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/65">
              <span>0:42 / {YOUTUBE_DEMO_VIDEO.duration}</span>
              <span>{YOUTUBE_DEMO_VIDEO.channel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-white/8 px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2f21]">
            <AppIcon name="brandYoutube" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {YOUTUBE_DEMO_VIDEO.title}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {YOUTUBE_DEMO_VIDEO.channel} • {YOUTUBE_DEMO_VIDEO.views}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractVideoId(url: string): string | null {
  const patterns = [
    // Full YouTube URLs: watch, shorts, embed, youtu.be (from Concerto's video model)
    /(?:youtube\.com\/(?:shorts\/|[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
    // Bare 11-char ID
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTube({ config, theme }: WidgetComponentProps) {
  const youtubeConfig = config as YouTubeConfig | undefined;
  const videoId = youtubeConfig?.videoId ? extractVideoId(youtubeConfig.videoId) : null;
  const autoplay = youtubeConfig?.autoplay ?? false;
  const muted = youtubeConfig?.muted ?? true;
  const loop = youtubeConfig?.loop ?? true;
  const galleryDemo = youtubeConfig?.galleryDemo ?? false;

  if (!videoId) {
    if (galleryDemo) {
      return <YouTubeDemo muted={muted} autoplay={autoplay} loop={loop} />;
    }

    return (
      <div
        className="h-full flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: `${theme.primary}40` }}
      >
        <AppIcon name="tv" className="w-9 h-9 mb-3 text-white/70" />
        <span className="text-white/70 text-sm">No video configured</span>
        <span className="text-white/50 text-xs mt-1">Add a YouTube URL in settings</span>
      </div>
    );
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    playlist: videoId, // Required for loop to work
    controls: '1',
    modestbranding: '1',
    rel: '0',
  });

  return (
    <div className="h-full w-full">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

// Register the widget
registerWidget({
  type: 'youtube',
  name: 'YouTube',
  description: 'Embed YouTube videos',
  icon: 'brandYoutube',
  minW: 3,
  minH: 2,
  defaultW: 6,
  defaultH: 4,
  component: YouTube,
  OptionsComponent: YouTubeOptions,
  acceptsSources: [{ propName: 'videoId', types: ['video'] }],
  defaultProps: {
    videoId: '',
    autoplay: false,
    muted: true,
    loop: true,
  },
});

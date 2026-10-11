import { detectVideoProvider, getVideoSourceInfo, type VideoProvider } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import { EmbedPlayer } from '@/components/EmbedPlayer';

const EMBED_PROVIDERS: VideoProvider[] = [
  'youtube',
  'vimeo',
  'dailymotion',
  'streamable',
  'loom',
  'wistia',
  'screenapp',
  'generic',
];

const NATIVE_PROVIDERS: VideoProvider[] = ['direct', 'hls'];

interface UnifiedPlayerProps {
  url: string;
  title: string;
  poster?: string;
  autoPlay?: boolean;
  initialPosition?: number;
  onProgress?: (current: number, duration: number) => void;
  onEnded?: () => void;
  nextEpisodeLabel?: string;
  onNextEpisode?: () => void;
  subtitleUrl?: string;
}

export function isEmbedProvider(provider: VideoProvider): boolean {
  return EMBED_PROVIDERS.includes(provider);
}

export function isNativeProvider(provider: VideoProvider): boolean {
  return NATIVE_PROVIDERS.includes(provider);
}

export function UnifiedPlayer({
  url,
  title,
  poster,
  autoPlay = false,
  initialPosition = 0,
  onProgress,
  onEnded,
  nextEpisodeLabel,
  onNextEpisode,
  subtitleUrl,
}: UnifiedPlayerProps) {
  const provider = detectVideoProvider(url);
  const sourceInfo = getVideoSourceInfo(url);

  if (isEmbedProvider(provider) && sourceInfo.embedUrl) {
    return <EmbedPlayer url={url} title={title} autoPlay={autoPlay} />;
  }

  if (isNativeProvider(provider) || provider === 'unknown') {
    return (
      <VideoPlayer
        src={url}
        poster={poster}
        autoPlay={autoPlay}
        initialPosition={initialPosition}
        onProgress={onProgress}
        onEnded={onEnded}
        nextEpisodeLabel={nextEpisodeLabel}
        onNextEpisode={onNextEpisode}
        subtitleUrl={subtitleUrl}
      />
    );
  }

  return null;
}

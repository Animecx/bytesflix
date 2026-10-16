import { ExternalLink, AlertTriangle } from 'lucide-react';
import { detectVideoProvider, getVideoSourceInfo, isExternalHlsRedirectUrl, type VideoProvider } from '@/lib/utils';
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

  if (isExternalHlsRedirectUrl(url)) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-black px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <div>
          <p className="text-lg font-semibold text-white">This video can only be played in a new tab.</p>
          <p className="mt-1 text-sm text-neutral-400">The provider does not allow embedded playback on this site.</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          <ExternalLink className="h-5 w-5" /> Open in New Tab
        </a>
      </div>
    );
  }

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

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { getVideoSourceInfo, type VideoProvider } from '@/lib/utils';

interface EmbedPlayerProps {
  url: string;
  title: string;
  autoPlay?: boolean;
}

const KNOWN_PROVIDERS: VideoProvider[] = [
  'youtube',
  'vimeo',
  'dailymotion',
  'streamable',
  'loom',
  'wistia',
  'screenapp',
];

function buildEmbedSrc(provider: VideoProvider, embedUrl: string, autoPlay: boolean): string {
  if (!autoPlay) return embedUrl;
  if (provider === 'youtube') return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
  if (provider === 'vimeo') return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
  if (provider === 'dailymotion') return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
  if (provider === 'streamable') return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
  return embedUrl;
}

export function EmbedPlayer({ url, title, autoPlay = false }: EmbedPlayerProps) {
  const info = getVideoSourceInfo(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBlocked(false);
    setLoading(true);
    if (loadTimer.current) clearTimeout(loadTimer.current);
    // Heuristic: if the iframe never fires a load event within 12s, assume it was blocked.
    loadTimer.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) setBlocked(true);
        return false;
      });
    }, 12000);
    return () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
  }, [url]);

  if (!info.embedUrl) return null;

  const isKnown = KNOWN_PROVIDERS.includes(info.provider);
  const src = buildEmbedSrc(info.provider, info.embedUrl, autoPlay);

  const allow = [
    'accelerometer',
    'autoplay',
    'clipboard-write',
    'encrypted-media',
    'gyroscope',
    'picture-in-picture',
    'web-share',
    'fullscreen',
  ].join('; ');

  const handleLoad = () => {
    if (loadTimer.current) clearTimeout(loadTimer.current);
    setLoading(false);
  };

  if (blocked) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-black px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-warning" />
        <div>
          <p className="text-lg font-semibold text-white">This provider does not allow embedded playback.</p>
          <p className="mt-1 text-sm text-neutral-400">You can still watch the video by opening it in a new tab.</p>
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

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow={allow}
        allowFullScreen
        onLoad={handleLoad}
        referrerPolicy={isKnown ? 'strict-origin-when-cross-origin' : 'no-referrer'}
      />
    </div>
  );
}

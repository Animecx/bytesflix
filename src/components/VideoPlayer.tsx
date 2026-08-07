import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  RotateCcw,
  PictureInPicture,
  Loader2,
} from 'lucide-react';
import { formatSeconds, detectVideoProvider } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  initialPosition?: number;
  onProgress?: (current: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  nextEpisodeLabel?: string;
  onNextEpisode?: () => void;
  subtitleUrl?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_LABELS = ['Auto', '1080p', '720p', '480p'];

export function VideoPlayer({
  src,
  poster,
  initialPosition = 0,
  onProgress,
  onEnded,
  autoPlay = false,
  nextEpisodeLabel,
  onNextEpisode,
  subtitleUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  // Seek to initial position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialPosition) return;
    const onLoaded = () => {
      video.currentTime = initialPosition;
      video.removeEventListener('loadedmetadata', onLoaded);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [initialPosition]);

  // HLS support via hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (detectVideoProvider(src) !== 'hls') {
      video.src = src;
      return;
    }

    // Native HLS support (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // hls.js for other browsers (lazy-loaded so it's only in the HLS chunk)
    let hls: { destroy: () => void } | null = null;
    import('hls.js').then(({ default: Hls }) => {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    });

    return () => {
      hls?.destroy();
    };
  }, [src]);

  // Report progress
  useEffect(() => {
    if (!onProgress) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        onProgress(video.currentTime, video.duration || 0);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [onProgress]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  };

  const changeSpeed = (s: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
  };

  const skipIntro = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 30, video.duration);
    setShowSkipIntro(false);
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // not supported
    }
  };

  // Show skip intro button during first 30s
  useEffect(() => {
    if (current > 5 && current < 30) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
  }, [current]);

  // Auto-hide controls
  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSettings(false);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      onMouseMove={showAndScheduleHide}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        className="h-full w-full object-contain"
        onPlay={() => {
          setPlaying(true);
          showAndScheduleHide();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
        onEnded={onEnded}
      >
        {subtitleUrl && <track kind="subtitles" src={subtitleUrl} label="English" srcLang="en" default />}
      </video>

      {/* Buffering spinner */}
      {buffering && (
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Skip intro */}
      {showSkipIntro && (
        <button
          onClick={skipIntro}
          className="absolute right-4 top-4 z-30 rounded-lg border border-white/30 bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-black/90"
        >
          Skip Intro
        </button>
      )}

      {/* Center play button when paused */}
      {!playing && !buffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-20 grid place-items-center bg-black/20"
          aria-label="Play"
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/90 text-white shadow-lg shadow-primary/40 transition-transform hover:scale-110">
            <Play className="h-8 w-8 fill-current" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-12 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        <div
          className="group/bar relative mb-2 h-1.5 cursor-pointer rounded-full bg-white/20"
          onClick={handleSeek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary"
            style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover/bar:opacity-100"
            style={{ left: `${duration ? (current / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="transition-colors hover:text-primary" aria-label="Play/Pause">
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button onClick={restart} className="transition-colors hover:text-primary" aria-label="Restart">
            <RotateCcw className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="transition-colors hover:text-primary" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="player-range w-20"
              style={{
                background: `linear-gradient(to right, #E50914 ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`,
              }}
            />
          </div>

          <span className="text-xs text-neutral-300">
            {formatSeconds(current)} / {formatSeconds(duration)}
          </span>

          <div className="flex-1" />

          {nextEpisodeLabel && onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">{nextEpisodeLabel}</span>
            </button>
          )}

          <button onClick={togglePip} className="transition-colors hover:text-primary" aria-label="Picture in Picture">
            <PictureInPicture className="h-5 w-5" />
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="transition-colors hover:text-primary"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            {showSettings && (
              <div className="absolute bottom-10 right-0 w-44 rounded-lg border border-ink-border bg-ink-card/95 p-2 backdrop-blur">
                <div className="mb-1 px-2 text-xs font-semibold uppercase text-neutral-500">Speed</div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {PLAYBACK_SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`rounded px-2 py-1 text-xs ${speed === s ? 'bg-primary text-white' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <div className="mb-1 px-2 text-xs font-semibold uppercase text-neutral-500">Quality</div>
                <div className="flex flex-wrap gap-1">
                  {QUALITY_LABELS.map((q, i) => (
                    <button
                      key={q}
                      onClick={() => setQualityIdx(i)}
                      className={`rounded px-2 py-1 text-xs ${qualityIdx === i ? 'bg-primary text-white' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleFullscreen} className="transition-colors hover:text-primary" aria-label="Fullscreen">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

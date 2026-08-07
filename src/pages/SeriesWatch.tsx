import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv, AlertCircle, Loader2, Play, ChevronLeft, ChevronRight,
  Star, Calendar, Clock, Globe, Bookmark, Check, Share2, ListVideo,
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { EmbedPlayer } from '@/components/EmbedPlayer';
import {
  fetchSeriesWithEpisodesBySlug, fetchEpisodeBySlug, incrementViews,
} from '@/lib/videos';
import {
  getResumePosition, saveContinueWatching,
  addToWatchHistory, toggleFavorite, isFavorite,
} from '@/lib/userData';
import { useAuth } from '@/context/AuthContext';
import { formatDuration, formatViews, formatDate, detectVideoProvider } from '@/lib/utils';
import type { SeriesWithEpisodes, EpisodeWithVideo } from '@/types';

export default function SeriesWatch() {
  const { seriesSlug, season, episodeSlug } = useParams<{ seriesSlug: string; season: string; episodeSlug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [series, setSeries] = useState<SeriesWithEpisodes | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumePosition, setResumePosition] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [autoNext, setAutoNext] = useState(true);

  // Load series
  useEffect(() => {
    if (!seriesSlug) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSeriesWithEpisodesBySlug(seriesSlug);
        if (!mounted) return;
        if (!data) {
          setError('Series not found.');
          setLoading(false);
          return;
        }
        setSeries(data);
      } catch {
        if (mounted) setError('Failed to load series.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [seriesSlug]);

  // Determine selected season from URL or default
  useEffect(() => {
    const s = season ? parseInt(season.replace('season-', ''), 10) : 1;
    if (!isNaN(s)) setSelectedSeason(s);
  }, [season]);

  // Load current episode by slug
  useEffect(() => {
    if (!series || !episodeSlug) return;
    let mounted = true;
    (async () => {
      try {
        const ep = await fetchEpisodeBySlug(series.id, episodeSlug);
        if (!mounted) return;
        if (!ep) {
          setError('Episode not found.');
          return;
        }
        setCurrentEpisode(ep);
        setSelectedSeason(ep.season_number);

        // Resume position + favorite
        if (user) {
          const [pos, fav] = await Promise.all([
            getResumePosition(user.id, ep.video_id),
            isFavorite(user.id, ep.video_id),
          ]);
          if (mounted) {
            setResumePosition(pos);
            setIsFav(fav);
          }
        }

        incrementViews(ep.video_id).catch(() => {});
        if (user) addToWatchHistory(user.id, ep.video_id).catch(() => {});
      } catch {
        if (mounted) setError('Failed to load episode.');
      }
    })();
    return () => { mounted = false; };
  }, [series, episodeSlug, user]);

  // Episodes grouped by season
  const seasons = useMemo(() => {
    if (!series?.episodes) return [];
    const map = new Map<number, EpisodeWithVideo[]>();
    for (const ep of series.episodes) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, []);
      map.get(ep.season_number)!.push(ep);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [series]);

  const currentSeasonEpisodes = useMemo(
    () => seasons.find(([s]) => s === selectedSeason)?.[1] ?? [],
    [seasons, selectedSeason]
  );

  // Find current episode index in the current season for prev/next
  const currentIndexInSeason = useMemo(() => {
    if (!currentEpisode) return -1;
    return currentSeasonEpisodes.findIndex((e) => e.id === currentEpisode.id);
  }, [currentEpisode, currentSeasonEpisodes]);

  // Find next episode across seasons (for auto-next at end of season)
  const nextEpisode = useMemo((): EpisodeWithVideo | null => {
    if (!currentEpisode) return null;
    // Next in current season
    if (currentIndexInSeason >= 0 && currentIndexInSeason < currentSeasonEpisodes.length - 1) {
      return currentSeasonEpisodes[currentIndexInSeason + 1];
    }
    // First episode of next season
    const seasonIdx = seasons.findIndex(([s]) => s === selectedSeason);
    if (seasonIdx >= 0 && seasonIdx < seasons.length - 1) {
      return seasons[seasonIdx + 1][1][0] ?? null;
    }
    return null;
  }, [currentEpisode, currentIndexInSeason, currentSeasonEpisodes, seasons, selectedSeason]);

  const prevEpisode = useMemo((): EpisodeWithVideo | null => {
    if (!currentEpisode) return null;
    if (currentIndexInSeason > 0) {
      return currentSeasonEpisodes[currentIndexInSeason - 1];
    }
    // Last episode of previous season
    const seasonIdx = seasons.findIndex(([s]) => s === selectedSeason);
    if (seasonIdx > 0) {
      const prevEps = seasons[seasonIdx - 1][1];
      return prevEps[prevEps.length - 1] ?? null;
    }
    return null;
  }, [currentEpisode, currentIndexInSeason, currentSeasonEpisodes, seasons, selectedSeason]);

  const goToEpisode = useCallback((ep: EpisodeWithVideo) => {
    if (!series) return;
    navigate(`/series/${series.slug}/season-${ep.season_number}/${ep.slug}`);
  }, [series, navigate]);

  const handleProgress = useCallback(
    (current: number, duration: number) => {
      if (!user || !currentEpisode) return;
      saveContinueWatching(user.id, currentEpisode.video_id, current, duration).catch(() => {});
    },
    [user, currentEpisode]
  );

  const handleEnded = useCallback(() => {
    if (autoNext && nextEpisode) {
      goToEpisode(nextEpisode);
    }
  }, [autoNext, nextEpisode, goToEpisode]);

  const handleToggleFav = async () => {
    if (!user || !currentEpisode) return;
    try {
      const result = await toggleFavorite(user.id, currentEpisode.video_id);
      setIsFav(result);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-error" />
        <h1 className="text-xl font-bold text-white">{error ?? 'Series not found'}</h1>
        <Link to="/series" className="btn-outline mt-6">Back to Series</Link>
      </div>
    );
  }

  const video = currentEpisode?.video;
  const hasVideo = video?.video_url;

  return (
    <div className="pt-16">
      {/* Player */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {currentEpisode && hasVideo ? (
          (() => {
            const provider = detectVideoProvider(video!.video_url!);
            if (provider === 'direct' || provider === 'hls') {
              return (
                <VideoPlayer
                  key={currentEpisode.id}
                  src={video!.video_url!}
                  poster={currentEpisode.thumbnail_url ?? video!.poster_url ?? undefined}
                  initialPosition={resumePosition}
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                  autoPlay
                  nextEpisodeLabel={autoNext && nextEpisode ? `Next: S${nextEpisode.season_number} E${nextEpisode.episode_number}` : undefined}
                  onNextEpisode={nextEpisode ? () => goToEpisode(nextEpisode) : undefined}
                  subtitleUrl={video!.subtitle_url ?? undefined}
                />
              );
            }
            if (provider !== 'unknown') {
              return <EmbedPlayer url={video!.video_url!} title={`${series.name} - ${currentEpisode.title ?? `S${currentEpisode.season_number}E${currentEpisode.episode_number}`}`} autoPlay />;
            }
            return (
              <VideoPlayer
                key={currentEpisode.id}
                src={video!.video_url!}
                poster={currentEpisode.thumbnail_url ?? video!.poster_url ?? undefined}
                initialPosition={resumePosition}
                onProgress={handleProgress}
                onEnded={handleEnded}
                autoPlay
                nextEpisodeLabel={autoNext && nextEpisode ? `Next: S${nextEpisode.season_number} E${nextEpisode.episode_number}` : undefined}
                onNextEpisode={nextEpisode ? () => goToEpisode(nextEpisode) : undefined}
                subtitleUrl={video!.subtitle_url ?? undefined}
              />
            );
          })()
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-ink-card">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-warning" />
              <p className="text-neutral-400">No video available for this episode.</p>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="container-page mt-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: series + episode info */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Link to="/series" className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white">
                <Tv className="h-4 w-4" /> All Series
              </Link>
              <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">{series.name}</h1>

              {currentEpisode && (
                <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                  <span className="font-semibold">S{currentEpisode.season_number} · E{currentEpisode.episode_number}</span>
                  {currentEpisode.title && <span className="text-neutral-300">— {currentEpisode.title}</span>}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
                {series.rating ? (
                  <span className="flex items-center gap-1 font-semibold text-secondary">
                    <Star className="h-4 w-4 fill-current" />
                    {Number(series.rating).toFixed(1)}
                  </span>
                ) : null}
                {series.year ? <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{series.year}</span> : null}
                {currentEpisode?.duration_minutes ? (
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(currentEpisode.duration_minutes)}</span>
                ) : null}
                {series.language ? <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{series.language}</span> : null}
                {series.age_rating ? <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">{series.age_rating}</span> : null}
                {video && <span className="text-neutral-500">{formatViews(video.views)}</span>}
              </div>

              {currentEpisode?.description ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                  {currentEpisode.description}
                </p>
              ) : series.description ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                  {series.description}
                </p>
              ) : null}

              {series.genre && (
                <div className="mt-4 text-sm text-neutral-400">{series.genre}</div>
              )}

              {/* Controls */}
              <div className="mt-6 flex flex-wrap gap-3">
                {prevEpisode && (
                  <button onClick={() => goToEpisode(prevEpisode)} className="btn-ghost">
                    <ChevronLeft className="h-5 w-5" /> Previous
                  </button>
                )}
                {nextEpisode && (
                  <button onClick={() => goToEpisode(nextEpisode)} className="btn-ghost">
                    Next <ChevronRight className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setAutoNext(!autoNext)}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    autoNext ? 'bg-primary/20 text-primary' : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                  }`}
                >
                  Auto-Next: {autoNext ? 'On' : 'Off'}
                </button>
                {user && (
                  <button onClick={handleToggleFav} className="btn-ghost">
                    {isFav ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    {isFav ? 'In My List' : 'Add to My List'}
                  </button>
                )}
                <button onClick={handleShare} className="btn-ghost">
                  <Share2 className="h-5 w-5" /> Share
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right: episode list */}
          <div className="card-surface max-h-[600px] overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <ListVideo className="h-5 w-5 text-primary" /> Episodes
              </h3>
              {seasons.length > 1 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="rounded-lg border border-ink-border bg-ink-card px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                  {seasons.map(([s]) => (
                    <option key={s} value={s}>Season {s}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {currentSeasonEpisodes.map((ep) => {
                  const isActive = currentEpisode?.id === ep.id;
                  return (
                    <motion.button
                      key={ep.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => goToEpisode(ep)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                        isActive ? 'bg-primary/20 text-white' : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                        {ep.thumbnail_url ? (
                          <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : ep.video?.poster_url ? (
                          <img src={ep.video.poster_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Play className="h-4 w-4 text-neutral-600" />
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 grid place-items-center bg-primary/40">
                            <Play className="h-4 w-4 fill-current text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-500">E{ep.episode_number}</span>
                          <span className="line-clamp-1 text-sm font-medium">{ep.title || `Episode ${ep.episode_number}`}</span>
                        </div>
                        {ep.duration_minutes && (
                          <span className="text-xs text-neutral-500">{formatDuration(ep.duration_minutes)}</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, Clock, Calendar, Globe, Tag, AlertCircle, Loader2,
  Play, ChevronRight, Bookmark, Check,
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoCard } from '@/components/VideoCard';
import {
  fetchVideoById, fetchRelatedVideos, fetchEpisodesBySeries,
  incrementViews,
} from '@/lib/videos';
import {
  getResumePosition, saveContinueWatching,
  addToWatchHistory, toggleFavorite, isFavorite,
} from '@/lib/userData';
import { useAuth } from '@/context/AuthContext';
import { formatDuration, formatViews, formatDate, detectVideoProvider, getVideoSourceInfo } from '@/lib/utils';
import type { Video, Episode } from '@/types';
import { EmbedPlayer } from '@/components/EmbedPlayer';

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumePosition, setResumePosition] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // Group episodes by season
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>();
    for (const ep of episodes) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, []);
      map.get(ep.season_number)!.push(ep);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  const loadVideo = useCallback(async (videoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const v = await fetchVideoById(videoId);
      if (!v) {
        setError('Video not found.');
        setLoading(false);
        return;
      }
      setVideo(v);
      setCurrentEpisodeId(videoId);

      // Load related, episodes, resume position, favorite status
      const [relatedVids] = await Promise.all([
        fetchRelatedVideos(v),
        v.series_id ? fetchEpisodesBySeries(v.series_id) : Promise.resolve([]),
        user ? getResumePosition(user.id, videoId) : Promise.resolve(0),
        user ? isFavorite(user.id, videoId) : Promise.resolve(false),
      ]);

      setRelated(relatedVids);
      setEpisodes(v.series_id ? await fetchEpisodesBySeries(v.series_id) : []);
      setResumePosition(user ? await getResumePosition(user.id, videoId) : 0);
      setIsFav(await (user ? isFavorite(user.id, videoId) : Promise.resolve(false)));

      void relatedVids; // already set above

      // Increment view count + add to history
      incrementViews(videoId).catch(() => {});
      if (user) addToWatchHistory(user.id, videoId).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (id) loadVideo(id);
  }, [id, loadVideo]);

  const handleProgress = useCallback(
    (current: number, duration: number) => {
      if (!user || !video) return;
      saveContinueWatching(user.id, video.id, current, duration).catch(() => {});
    },
    [user, video]
  );

  const handleEnded = useCallback(() => {
    if (!video || !episodes.length) return;
    // Find next episode
    const currentIdx = episodes.findIndex((ep) => ep.video_id === video.id);
    if (currentIdx >= 0 && currentIdx < episodes.length - 1) {
      const next = episodes[currentIdx + 1];
      loadVideo(next.video_id);
    }
  }, [video, episodes, loadVideo]);

  const handleNextEpisode = useCallback(() => {
    if (!video || !episodes.length) return;
    const currentIdx = episodes.findIndex((ep) => ep.video_id === video.id);
    if (currentIdx >= 0 && currentIdx < episodes.length - 1) {
      loadVideo(episodes[currentIdx + 1].video_id);
    }
  }, [video, episodes, loadVideo]);

  const handleToggleFav = async () => {
    if (!user || !video) return;
    try {
      const result = await toggleFavorite(user.id, video.id);
      setIsFav(result);
    } catch {
      // ignore
    }
  };

  const nextEpisodeLabel = useMemo(() => {
    if (!video || !episodes.length) return undefined;
    const idx = episodes.findIndex((ep) => ep.video_id === video.id);
    if (idx >= 0 && idx < episodes.length - 1) {
      const next = episodes[idx + 1];
      return `Next: S${next.season_number} E${next.episode_number}`;
    }
    return undefined;
  }, [video, episodes]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-error" />
        <h1 className="text-xl font-bold text-white">{error ?? 'Video not found'}</h1>
        <Link to="/" className="btn-outline mt-6">Back to Home</Link>
      </div>
    );
  }

  if (!video.video_url) {
    return (
      <div className="container-page pt-24 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-warning" />
        <h1 className="text-xl font-bold text-white">{video.title}</h1>
        <p className="mt-2 text-neutral-400">This video's file is not available yet. Please check back later.</p>
        <Link to="/" className="btn-outline mt-6">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Player */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {(() => {
          const provider = detectVideoProvider(video.video_url);
          if (provider === 'direct' || provider === 'hls') {
            return (
              <VideoPlayer
                key={video.id}
                src={video.video_url}
                poster={video.poster_url ?? undefined}
                initialPosition={resumePosition}
                onProgress={handleProgress}
                onEnded={handleEnded}
                autoPlay
                nextEpisodeLabel={nextEpisodeLabel}
                onNextEpisode={nextEpisodeLabel ? handleNextEpisode : undefined}
              />
            );
          }
          if (provider !== 'unknown') {
            return <EmbedPlayer url={video.video_url} title={video.title} autoPlay />;
          }
          return (
            <VideoPlayer
              key={video.id}
              src={video.video_url}
              poster={video.poster_url ?? undefined}
              initialPosition={resumePosition}
              onProgress={handleProgress}
              onEnded={handleEnded}
              autoPlay
              nextEpisodeLabel={nextEpisodeLabel}
              onNextEpisode={nextEpisodeLabel ? handleNextEpisode : undefined}
            />
          );
        })()}
      </div>

      {/* Details */}
      <div className="container-page mt-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">{video.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
                {video.rating ? (
                  <span className="flex items-center gap-1 font-semibold text-secondary">
                    <Star className="h-4 w-4 fill-current" />
                    {video.rating.toFixed(1)}
                  </span>
                ) : null}
                {video.year ? (
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{video.year}</span>
                ) : null}
                {video.duration_minutes ? (
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(video.duration_minutes)}</span>
                ) : null}
                {video.language ? (
                  <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{video.language}</span>
                ) : null}
                {video.age_rating ? (
                  <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">{video.age_rating}</span>
                ) : null}
                <span className="text-neutral-500">{formatViews(video.views)}</span>
              </div>

              {video.description && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                  {video.description}
                </p>
              )}

              {video.genre && (
                <div className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
                  <Tag className="h-4 w-4" />
                  <span>{video.genre}</span>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {user && (
                  <button onClick={handleToggleFav} className="btn-ghost">
                    {isFav ? <Check className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    {isFav ? 'In My List' : 'Add to My List'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Episode selector for series */}
          {video.type === 'series' && seasons.length > 0 && (
            <div className="card-surface max-h-[500px] overflow-y-auto p-5">
              <h3 className="mb-3 font-semibold text-white">Episodes</h3>
              {seasons.map(([season, eps]) => (
                <div key={season} className="mb-4">
                  <h4 className="mb-2 text-sm font-semibold text-neutral-400">Season {season}</h4>
                  <div className="space-y-1">
                    {eps.map((ep) => {
                      const isActive = ep.video_id === currentEpisodeId;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => loadVideo(ep.video_id)}
                          className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                            isActive ? 'bg-primary/20 text-white' : 'text-neutral-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-border text-xs font-bold">
                            {ep.episode_number}
                          </div>
                          <span className="line-clamp-1 text-sm">Episode {ep.episode_number}</span>
                          {isActive && <Play className="ml-auto h-4 w-4 fill-current text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related videos */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-2xl tracking-wide text-white">More Like This</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {related.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

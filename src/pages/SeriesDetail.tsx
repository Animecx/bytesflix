import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Tv, AlertCircle, Loader2, Play, Star, Calendar, Globe,
  ChevronRight, ListVideo,
} from 'lucide-react';
import { fetchSeriesWithEpisodesById } from '@/lib/videos';
import { formatDuration, formatViews } from '@/lib/utils';
import type { SeriesWithEpisodes, EpisodeWithVideo } from '@/types';

export default function SeriesDetail() {
  const { seriesId } = useParams<{ seriesId: string }>();

  const [series, setSeries] = useState<SeriesWithEpisodes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  useEffect(() => {
    if (!seriesId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSeriesWithEpisodesById(seriesId);
        if (!mounted) return;
        if (!data) {
          setError('Series not found.');
          setLoading(false);
          return;
        }
        setSeries(data);
        if (data.episodes && data.episodes.length > 0) {
          setSelectedSeason(data.episodes[0].season_number);
        }
      } catch {
        if (mounted) setError('Failed to load series.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [seriesId]);

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

  const firstEpisode = series?.episodes?.[0];

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

  return (
    <div className="pt-16">
      {series.banner_url ? (
        <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
          <img src={series.banner_url} alt={series.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container-page pb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link to="/series" className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white">
                <Tv className="h-4 w-4" /> All Series
              </Link>
              <h1 className="font-display text-3xl tracking-wide text-white sm:text-5xl">{series.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
                {series.rating ? (
                  <span className="flex items-center gap-1 font-semibold text-secondary">
                    <Star className="h-4 w-4 fill-current" />
                    {Number(series.rating).toFixed(1)}
                  </span>
                ) : null}
                {series.year ? <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{series.year}</span> : null}
                {series.language ? <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{series.language}</span> : null}
                {series.age_rating ? <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">{series.age_rating}</span> : null}
                {series.genre && <span className="text-neutral-400">{series.genre}</span>}
              </div>
              {series.description && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{series.description}</p>
              )}
              {firstEpisode && (
                <Link
                  to={`/series/${series.id}/season-${firstEpisode.season_number}/${firstEpisode.id}`}
                  className="btn-primary mt-5"
                >
                  <Play className="h-5 w-5 fill-current" /> Play
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="container-page pt-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/series" className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white">
              <Tv className="h-4 w-4" /> All Series
            </Link>
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="h-48 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-card border border-ink-border">
                {series.poster_url ? (
                  <img src={series.poster_url} alt={series.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Tv className="h-10 w-10 text-neutral-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">{series.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
                  {series.rating ? (
                    <span className="flex items-center gap-1 font-semibold text-secondary">
                      <Star className="h-4 w-4 fill-current" />
                      {Number(series.rating).toFixed(1)}
                    </span>
                  ) : null}
                  {series.year ? <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{series.year}</span> : null}
                  {series.language ? <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{series.language}</span> : null}
                  {series.age_rating ? <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">{series.age_rating}</span> : null}
                  {series.genre && <span className="text-neutral-400">{series.genre}</span>}
                </div>
                {series.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{series.description}</p>
                )}
                {firstEpisode && (
                  <Link
                    to={`/series/${series.id}/season-${firstEpisode.season_number}/${firstEpisode.id}`}
                    className="btn-primary mt-5"
                  >
                    <Play className="h-5 w-5 fill-current" /> Play
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container-page mt-8 pb-12">
        {seasons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListVideo className="mb-4 h-12 w-12 text-neutral-700" />
            <p className="text-neutral-400">No episodes available yet.</p>
          </div>
        ) : (
          <>
            {seasons.length > 1 && (
              <div className="mb-4 flex items-center gap-2">
                {seasons.map(([s]) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      selectedSeason === s ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                    }`}
                  >
                    Season {s}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {currentSeasonEpisodes.map((ep, i) => (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Link
                    to={`/series/${series.id}/season-${ep.season_number}/${ep.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-ink-border bg-ink-card p-3 transition-colors hover:bg-ink-soft"
                  >
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                      {ep.thumbnail_url ? (
                        <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : ep.video?.poster_url ? (
                        <img src={ep.video.poster_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-5 w-5 text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Play className="h-6 w-6 fill-current text-white" />
                      </div>
                      <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        E{ep.episode_number}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 font-semibold text-white">
                        {ep.title || `Episode ${ep.episode_number}`}
                      </h3>
                      {ep.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{ep.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                        {ep.duration_minutes && <span>{formatDuration(ep.duration_minutes)}</span>}
                        {ep.video && <span>{formatViews(ep.video.views)}</span>}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-600 transition-colors group-hover:text-white" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

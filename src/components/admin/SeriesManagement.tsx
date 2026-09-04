import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv, Plus, Pencil, Trash2, Eye, EyeOff,
  Loader2, Search, ArrowLeft, Film, Calendar, Clock, FolderOpen,
} from 'lucide-react';
import {
  fetchAllSeriesAdmin, fetchEpisodesWithVideoAdmin,
  updateEpisode, deleteEpisode, deleteSeries,
} from '@/lib/admin';
import { formatViews, formatDate } from '@/lib/utils';
import type { Series, EpisodeWithVideo } from '@/types';
import { EpisodeForm } from './EpisodeForm';
import { SeriesForm } from './SeriesForm';

export function SeriesManagement() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openSeries, setOpenSeries] = useState<Series | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSeriesAdmin();
      setSeriesList(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = seriesList.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteSeries = async (s: Series) => {
    if (!confirm(`Delete "${s.name}" and ALL its episodes? This cannot be undone.`)) return;
    try {
      await deleteSeries(s.id);
      setSeriesList((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (openSeries) {
    return (
      <SeriesDetail
        series={openSeries}
        onBack={() => { setOpenSeries(null); load(); }}
        onEditSeries={(s) => setEditingSeries(s)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-border bg-ink-card px-3">
          <Search className="h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search series..."
            className="bg-transparent py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0">
          <Plus className="h-5 w-5" /> New Series
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tv className="mb-4 h-12 w-12 text-neutral-700" />
          <p className="text-neutral-400">No series yet. Click "New Series" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group flex items-center gap-4 rounded-xl border border-ink-border bg-ink-card p-3 transition-colors hover:bg-ink-soft"
            >
              <button
                onClick={() => setOpenSeries(s)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                  {s.poster_url ? (
                    <img src={s.poster_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Tv className="h-5 w-5 text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 font-semibold text-white">{s.name}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    {s.genre && <span>{s.genre}</span>}
                    {s.year && <span>· {s.year}</span>}
                    <span className="rounded bg-ink-border px-1.5 py-0.5 uppercase">{s.publish_status}</span>
                  </div>
                </div>
                <FolderOpen className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-primary" />
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setEditingSeries(s)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
                  title="Edit series"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteSeries(s)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-error hover:bg-error/10"
                  title="Delete series"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <SeriesForm
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); load(); }}
          />
        )}
        {editingSeries && (
          <SeriesForm
            series={editingSeries}
            onClose={() => setEditingSeries(null)}
            onSaved={() => { setEditingSeries(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SeriesDetail({
  series,
  onBack,
  onEditSeries,
}: {
  series: Series;
  onBack: () => void;
  onEditSeries: (s: Series) => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<EpisodeWithVideo | null>(null);
  const [filterSeason, setFilterSeason] = useState<number | 'all'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchEpisodesWithVideoAdmin(series.id);
      setEpisodes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series.id]);

  const seasons = useMemo(() => {
    const map = new Map<number, EpisodeWithVideo[]>();
    for (const ep of episodes) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, []);
      map.get(ep.season_number)!.push(ep);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  const filteredSeasons = useMemo(() => {
    if (filterSeason === 'all') return seasons;
    return seasons.filter(([s]) => s === filterSeason);
  }, [seasons, filterSeason]);

  const handleDelete = async (ep: EpisodeWithVideo) => {
    if (!confirm(`Delete "${ep.title || `Episode ${ep.episode_number}`}"? This removes the episode and its video file.`)) return;
    try {
      await deleteEpisode(ep.id);
      setEpisodes((prev) => prev.filter((e) => e.id !== ep.id));
    } catch {
      // ignore
    }
  };

  const handleTogglePublish = async (ep: EpisodeWithVideo) => {
    const newStatus = ep.publish_status === 'published' ? 'draft' : 'published';
    try {
      await updateEpisode(ep.id, { publish_status: newStatus });
      setEpisodes((prev) =>
        prev.map((e) => (e.id === ep.id ? { ...e, publish_status: newStatus } : e))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to series list
      </button>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-ink-border bg-ink-card p-4 sm:flex-row sm:items-center">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-border">
          {series.poster_url ? (
            <img src={series.poster_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Tv className="h-6 w-6 text-neutral-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl tracking-wide text-white">{series.name}</h2>
          {series.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{series.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            {series.genre && <span>{series.genre}</span>}
            {series.year && <span>· {series.year}</span>}
            {series.language && <span>· {series.language}</span>}
            <span className="rounded bg-ink-border px-1.5 py-0.5 uppercase">{series.publish_status}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => onEditSeries(series)} className="btn-ghost">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="h-5 w-5" /> Add Episode
          </button>
        </div>
      </div>

      {seasons.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-neutral-400">Filter:</span>
          <button
            onClick={() => setFilterSeason('all')}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              filterSeason === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {seasons.map(([s]) => (
            <button
              key={s}
              onClick={() => setFilterSeason(s)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                filterSeason === s ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
              }`}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Film className="mb-4 h-12 w-12 text-neutral-700" />
          <p className="text-neutral-400">No episodes yet. Click "Add Episode" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSeasons.map(([season, eps]) => (
            <div key={season}>
              <h3 className="mb-2 flex items-center gap-2 font-display text-xl tracking-wide text-white">
                Season {season}
                <span className="text-sm font-normal text-neutral-500">({eps.length} episode{eps.length !== 1 ? 's' : ''})</span>
              </h3>
              <div className="space-y-2">
                {eps.map((ep, i) => (
                  <motion.div
                    key={ep.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-center gap-4 rounded-xl border border-ink-border bg-ink-card p-3"
                  >
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                      {ep.thumbnail_url ? (
                        <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : ep.video?.poster_url ? (
                        <img src={ep.video.poster_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-5 w-5 text-neutral-600" />
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        E{ep.episode_number}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 font-semibold text-white">
                        {ep.title || `Episode ${ep.episode_number}`}
                      </h4>
                      {ep.description && (
                        <p className="line-clamp-1 text-xs text-neutral-400">{ep.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                        {ep.duration_minutes && (
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{ep.duration_minutes}m</span>
                        )}
                        {ep.video?.release_date && (
                          <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{formatDate(ep.video.release_date)}</span>
                        )}
                        {ep.video && <span>{formatViews(ep.video.views)}</span>}
                        <span className={`rounded px-1.5 py-0.5 uppercase ${
                          ep.publish_status === 'published' ? 'bg-success/20 text-success' :
                          'bg-warning/20 text-warning'
                        }`}>{ep.publish_status}</span>
                        {ep.featured && <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-secondary">Featured</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(ep)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
                        title={ep.publish_status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {ep.publish_status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditing(ep)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ep)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-error hover:bg-error/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <EpisodeForm
            series={series}
            existingEpisodes={episodes}
            onClose={() => setShowAdd(false)}
            onSaved={() => { setShowAdd(false); load(); }}
          />
        )}
        {editing && (
          <EpisodeForm
            series={series}
            existingEpisodes={episodes}
            episode={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

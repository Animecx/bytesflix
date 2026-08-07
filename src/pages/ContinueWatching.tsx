import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, Play, Trash2 } from 'lucide-react';
import { SkeletonGrid } from '@/components/Skeletons';
import { useAuth } from '@/context/AuthContext';
import { fetchContinueWatching, removeContinueWatching } from '@/lib/userData';
import { formatDuration } from '@/lib/utils';
import type { ContinueWatchingItem } from '@/types';

export default function ContinueWatching() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await fetchContinueWatching(user.id);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (videoId: string) => {
    if (!user) return;
    setItems((prev) => prev.filter((item) => item.video_id !== videoId));
    await removeContinueWatching(user.id, videoId);
  };

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 font-display text-4xl tracking-wide text-white">
          <Clock className="h-8 w-8 text-primary" /> Continue Watching
        </h1>
        <p className="mt-1 text-neutral-400">Pick up right where you left off</p>
      </motion.div>

      {loading ? (
        <div className="mt-8"><SkeletonGrid count={6} /></div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-error" />
          <p className="text-neutral-400">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Clock className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">Nothing to continue</h2>
          <p className="mt-1 text-sm text-neutral-600">Start watching something and it'll show up here.</p>
          <Link to="/" className="btn-outline mt-6">Browse Content</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => {
            const video = item.video;
            if (!video) return null;
            const progress = item.duration_seconds ? (item.position_seconds / item.duration_seconds) * 100 : 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="group relative overflow-hidden rounded-xl border border-ink-border bg-ink-card"
              >
                <Link to={`/watch/${video.id}`} className="block">
                  <div className="relative aspect-video overflow-hidden">
                    {video.poster_url ? (
                      <img src={video.poster_url} alt={video.title} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-card to-ink-border">
                        <Play className="h-10 w-10 text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-1 font-semibold text-white">{video.title}</h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      {Math.floor(progress)}% watched
                      {video.duration_minutes ? ` · ${formatDuration(video.duration_minutes)}` : ''}
                    </p>
                  </div>
                </Link>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <button
                  onClick={() => handleRemove(item.video_id)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove from continue watching"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, AlertCircle } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { SkeletonGrid } from '@/components/Skeletons';
import { fetchVideos } from '@/lib/videos';
import type { Video } from '@/types';

export default function Movies() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchVideos({ type: 'movie', genre: genreFilter || undefined, limit: 100 });
        if (mounted) setVideos(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load movies');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [genreFilter]);

  const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Romance', 'Documentary', 'Animation', 'Anime'];

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl tracking-wide text-white">Movies</h1>
        <p className="mt-1 text-neutral-400">Browse our full collection of films</p>

        <div className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setGenreFilter('')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !genreFilter ? 'bg-primary text-white' : 'bg-ink-card text-neutral-300 hover:bg-ink-border'
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                genreFilter === g ? 'bg-primary text-white' : 'bg-ink-card text-neutral-300 hover:bg-ink-border'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="mt-8">
          <SkeletonGrid count={12} />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-error" />
          <p className="text-neutral-400">{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Film className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">No movies found</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {genreFilter ? `No movies in ${genreFilter} yet.` : 'Movies will appear here once uploaded.'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {videos.map((video, i) => (
            <VideoCard key={video.id} video={video} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

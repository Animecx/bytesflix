import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv, AlertCircle } from 'lucide-react';
import { fetchSeries } from '@/lib/videos';
import { SkeletonGrid } from '@/components/Skeletons';
import type { Series } from '@/types';

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchSeries();
        if (mounted) setSeries(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load series');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl tracking-wide text-white">Series</h1>
        <p className="mt-1 text-neutral-400">Explore our collection of original series</p>
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
      ) : series.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Tv className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">No series yet</h2>
          <p className="mt-1 text-sm text-neutral-600">Series will appear here once episodes are uploaded.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {series.map((s, i) => (
            <Link
              key={s.id}
              to={`/series/${s.id}`}
              className="group relative block w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-card border border-ink-border transition-transform duration-300 group-hover:scale-105"
              >
                {s.poster_url ? (
                  <img src={s.poster_url} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-card to-ink-border">
                    <Tv className="h-10 w-10 text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-white">{s.name}</h3>
                  {s.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{s.description}</p>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}

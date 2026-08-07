import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Flame } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { SkeletonGrid } from '@/components/Skeletons';
import { fetchVideos } from '@/lib/videos';
import type { Video } from '@/types';

export default function Trending() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchVideos({ trending: true, limit: 60, orderBy: 'views' });
        if (mounted) setVideos(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load trending content');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 font-display text-4xl tracking-wide text-white">
          <Flame className="h-8 w-8 text-primary" /> Trending
        </h1>
        <p className="mt-1 text-neutral-400">What everyone's watching right now</p>
      </motion.div>

      {loading ? (
        <div className="mt-8"><SkeletonGrid count={12} /></div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-error" />
          <p className="text-neutral-400">{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Flame className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">No trending content</h2>
          <p className="mt-1 text-sm text-neutral-600">Mark videos as trending in the admin dashboard to feature them here.</p>
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, AlertCircle } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { SkeletonGrid } from '@/components/Skeletons';
import { useAuth } from '@/context/AuthContext';
import { fetchFavorites } from '@/lib/userData';
import type { Video } from '@/types';

export default function MyList() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const data = await fetchFavorites(user.id);
        if (mounted) setVideos(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load your list');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 font-display text-4xl tracking-wide text-white">
          <Bookmark className="h-8 w-8 text-primary" /> My List
        </h1>
        <p className="mt-1 text-neutral-400">Your saved titles, all in one place</p>
      </motion.div>

      {loading ? (
        <div className="mt-8"><SkeletonGrid count={8} /></div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-error" />
          <p className="text-neutral-400">{error}</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <Bookmark className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">Your list is empty</h2>
          <p className="mt-1 text-sm text-neutral-600">Add titles to your list by clicking the + button on any video.</p>
          <Link to="/" className="btn-outline mt-6">Browse Content</Link>
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

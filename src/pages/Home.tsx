import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, AlertCircle } from 'lucide-react';
import { HeroBanner } from '@/components/HeroBanner';
import { VideoRow } from '@/components/VideoRow';
import { SkeletonRow, SkeletonHero } from '@/components/Skeletons';
import { fetchVideos, fetchFeaturedHero } from '@/lib/videos';
import { fetchContinueWatchingWithVideos } from '@/lib/userData';
import { useAuth } from '@/context/AuthContext';
import type { Video } from '@/types';

const GENRE_ROWS = ['Action', 'Comedy', 'Drama', 'Documentary', 'Sci-Fi', 'Thriller', 'Romance'];

export default function Home() {
  const { user } = useAuth();
  const [hero, setHero] = useState<Video | null>(null);
  const [trending, setTrending] = useState<Video[]>([]);
  const [recent, setRecent] = useState<Video[]>([]);
  const [popular, setPopular] = useState<Video[]>([]);
  const [continueWatching, setContinueWatching] = useState<Video[]>([]);
  const [genreMap, setGenreMap] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(() => fallback);

    (async () => {
      try {
        const [heroVideo, trendingVids, recentVids, popularVids] = await Promise.all([
          safe(fetchFeaturedHero(), null),
          safe(fetchVideos({ trending: true, limit: 20 }), []),
          safe(fetchVideos({ limit: 20, orderBy: 'created_at' }), []),
          safe(fetchVideos({ limit: 20, orderBy: 'views' }), []),
        ]);

        if (!mounted) return;
        setHero(heroVideo);
        setTrending(trendingVids);
        setRecent(recentVids);
        setPopular(popularVids);

        // Fetch genre rows in parallel — each isolated so one failure doesn't break others
        const genreResults = await Promise.all(
          GENRE_ROWS.map((g) =>
            safe(fetchVideos({ genre: g, limit: 20 }), []).then((v) => [g, v] as const)
          )
        );
        if (!mounted) return;
        const map: Record<string, Video[]> = {};
        for (const [g, vids] of genreResults) map[g] = vids;
        setGenreMap(map);

        // Continue watching (only for logged-in users)
        if (user) {
          const cw = await safe(fetchContinueWatchingWithVideos(user.id), []);
          if (mounted) setContinueWatching(cw);
        }
      } catch {
        // Only show the full-page error if the primary content fetches failed
        if (mounted) setError('Failed to load content');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="pt-0">
        <SkeletonHero />
        <div className="pt-8">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-20 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-error" />
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-neutral-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {hero ? <HeroBanner video={hero} /> : <EmptyHero />}

      <div className="relative z-10 -mt-16 space-y-2 pt-4">
        {continueWatching.length > 0 && (
          <VideoRow title="Continue Watching" videos={continueWatching} viewAllLink="/continue-watching" />
        )}
        <VideoRow title="Trending Now" videos={trending} viewAllLink="/trending" />
        <VideoRow title="Recently Added" videos={recent} viewAllLink="/recently-added" />
        <VideoRow title="Popular on BytesFlix" videos={popular} />

        {GENRE_ROWS.map((genre) =>
          genreMap[genre]?.length ? (
            <VideoRow key={genre} title={genre} videos={genreMap[genre]} />
          ) : null
        )}

        {trending.length === 0 && recent.length === 0 && (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="flex h-[50vh] min-h-[400px] items-center justify-center bg-gradient-to-br from-ink-card via-ink to-black">
      <div className="text-center">
        <Film className="mx-auto mb-4 h-16 w-16 text-neutral-700" />
        <h1 className="font-display text-3xl tracking-wider text-neutral-500">No Content Yet</h1>
        <p className="mt-2 text-neutral-600">Check back soon for new releases.</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="container-page py-20 text-center">
      <Film className="mx-auto mb-4 h-12 w-12 text-neutral-700" />
      <h2 className="text-xl font-semibold text-neutral-400">No videos available</h2>
      <p className="mt-2 text-sm text-neutral-600">
        New content will appear here automatically once uploaded from the admin dashboard.
      </p>
      <Link to="/movies" className="btn-outline mt-6 inline-flex">
        Browse Movies
      </Link>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Check, Star, Clock, Calendar, Globe } from 'lucide-react';
import type { Video } from '@/types';
import { formatDuration, formatViews } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { toggleFavorite } from '@/lib/userData';

interface HeroBannerProps {
  video: Video;
}

export function HeroBanner({ video }: HeroBannerProps) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  const handleFavorite = async () => {
    if (!user) return;
    try {
      const result = await toggleFavorite(user.id, video.id);
      setIsFav(result);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      {/* Background */}
      {video.banner_url ? (
        <img
          src={video.banner_url}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : video.poster_url ? (
        <img
          src={video.poster_url}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-card via-ink to-black" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/30 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 pb-16 pt-24">
        <div className="container-page">
          <div className="max-w-2xl">
            {video.featured && (
              <span className="mb-3 inline-block rounded bg-primary px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Featured
              </span>
            )}
            <h1 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {video.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-300">
              {video.rating ? (
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  <Star className="h-4 w-4 fill-current" />
                  {video.rating.toFixed(1)}
                </span>
              ) : null}
              {video.year ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {video.year}
                </span>
              ) : null}
              {video.duration_minutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration_minutes)}
                </span>
              ) : null}
              {video.language ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {video.language}
                </span>
              ) : null}
              {video.age_rating ? (
                <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">
                  {video.age_rating}
                </span>
              ) : null}
            </div>

            {video.description && (
              <p className="mt-4 line-clamp-3 max-w-xl text-sm text-neutral-200 sm:text-base">
                {video.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={`/watch/${video.id}`} className="btn-primary">
                <Play className="h-5 w-5 fill-current" /> Watch Now
              </Link>
              {user && (
                <button onClick={handleFavorite} className="btn-ghost">
                  {isFav ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {isFav ? 'In My List' : 'My List'}
                </button>
              )}
              <span className="text-sm text-neutral-400">{formatViews(video.views)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

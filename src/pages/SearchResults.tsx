import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, AlertCircle, X } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { SkeletonGrid } from '@/components/Skeletons';
import { searchVideos } from '@/lib/videos';
import type { Video } from '@/types';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    searchVideos(query)
      .catch(() => [] as Video[])
      .then((vids) => {
        if (!mounted) return;
        setResults(vids);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Search failed');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
    }
  };

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl tracking-wide text-white">Search</h1>

        <form onSubmit={handleSubmit} className="mt-4 max-w-2xl">
          <div className="flex items-center gap-2 rounded-xl border border-ink-border bg-ink-card px-4 focus-within:border-primary">
            <SearchIcon className="h-5 w-5 text-neutral-500" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by title, genre, year, actor..."
              autoFocus
              className="w-full bg-transparent py-3.5 text-white placeholder-neutral-500 focus:outline-none"
            />
            {input && (
              <button type="button" onClick={() => setInput('')} className="text-neutral-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {query && (
        <p className="mt-4 text-sm text-neutral-400">
          {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {loading ? (
        <div className="mt-8"><SkeletonGrid count={8} /></div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-10 w-10 text-error" />
          <p className="text-neutral-400">{error}</p>
        </div>
      ) : !query ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <SearchIcon className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">Start searching</h2>
          <p className="mt-1 text-sm text-neutral-600">Type in the search box above to find content.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <SearchIcon className="mb-4 h-12 w-12 text-neutral-700" />
          <h2 className="text-lg font-semibold text-neutral-400">No results found</h2>
          <p className="mt-1 text-sm text-neutral-600">Try a different search term.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {results.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-2xl tracking-wide text-white">Movies & Series</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.map((video, i) => (
                  <VideoCard key={video.id} video={video} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

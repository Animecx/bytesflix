import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2, Pencil, Eye, EyeOff, Check, X, Loader2, Film, Search,
  UploadCloud, Link2,
} from 'lucide-react';
import { fetchAllVideosAdmin, updateVideo, deleteVideo, uploadFile, deleteFile, extractStoragePath } from '@/lib/admin';
import { formatViews, formatDate, detectVideoProvider, getVideoSourceInfo } from '@/lib/utils';
import { FileUpload } from '@/components/FileUpload';
import type { Video, VideoStatus } from '@/types';

export function VideoManagement() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all');
  const [editing, setEditing] = useState<Video | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVideosAdmin();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (video: Video, newStatus: VideoStatus) => {
    try {
      await updateVideo(video.id, { status: newStatus });
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, status: newStatus } : v)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (video: Video) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await deleteVideo(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch {
      // ignore
    }
  };

  const filtered = videos.filter((v) => {
    const matchesSearch = !search || v.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-ink-border bg-ink-card px-3">
          <Search className="h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="bg-transparent py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft', 'hidden'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-ink-card text-neutral-300 hover:bg-ink-border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="mb-4 h-12 w-12 text-neutral-700" />
          <p className="text-neutral-400">No videos found. Upload your first video from the Upload tab.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-4 rounded-xl border border-ink-border bg-ink-card p-3"
            >
              {/* Thumbnail */}
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                {video.poster_url ? (
                  <img src={video.poster_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-5 w-5 text-neutral-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 font-semibold text-white">{video.title}</h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span className="rounded bg-ink-border px-1.5 py-0.5 uppercase">{video.type}</span>
                  {video.genre && <span>{video.genre}</span>}
                  {video.year && <span>{video.year}</span>}
                  <span>{formatViews(video.views)}</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
              </div>

              {/* Status badge */}
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${
                video.status === 'published' ? 'bg-success/20 text-success' :
                video.status === 'draft' ? 'bg-warning/20 text-warning' :
                'bg-neutral-700 text-neutral-300'
              }`}>
                {video.status}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {video.status === 'published' ? (
                  <button onClick={() => handleStatusChange(video, 'hidden')} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white" title="Hide">
                    <EyeOff className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange(video, 'published')} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white" title="Publish">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setEditing(video)} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(video)} className="grid h-8 w-8 place-items-center rounded-lg text-error hover:bg-error/10" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditVideoModal
          video={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              const updated = await updateVideo(editing.id, patch);
              setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
              setEditing(null);
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
}

function EditVideoModal({
  video,
  onClose,
  onSave,
}: {
  video: Video;
  onClose: () => void;
  onSave: (patch: Partial<Video>) => Promise<void>;
}) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? '');
  const [genre, setGenre] = useState(video.genre ?? '');
  const [year, setYear] = useState(video.year ?? '');
  const [duration, setDuration] = useState(video.duration_minutes ?? '');
  const [rating, setRating] = useState(video.rating ?? '');
  const [ageRating, setAgeRating] = useState(video.age_rating ?? 'NR');
  const [featured, setFeatured] = useState(video.featured);
  const [trending, setTrending] = useState(video.trending);
  const [status, setStatus] = useState<VideoStatus>(video.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media replacement state
  const [posterSlot, setPosterSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: video.poster_url ?? null,
  });
  const [bannerSlot, setBannerSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: video.banner_url ?? null,
  });
  const [trailerSlot, setTrailerSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: video.trailer_url ?? null,
  });
  const [videoMode, setVideoMode] = useState<'keep' | 'file' | 'external'>(
    detectVideoProvider(video.video_url ?? '') !== 'unknown' && video.video_url ? 'external' : 'keep'
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFilePreview, setVideoFilePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(
    detectVideoProvider(video.video_url ?? '') !== 'unknown' ? video.video_url ?? '' : ''
  );

  const replaceAndDelete = async (
    bucket: 'posters' | 'banners' | 'trailers' | 'videos',
    newFile: File | null,
    oldUrl: string | null
  ): Promise<string | null> => {
    if (!newFile) return oldUrl;
    const { publicUrl } = await uploadFile(bucket, newFile);
    if (oldUrl) {
      const oldPath = extractStoragePath(oldUrl);
      if (oldPath) {
        try { await deleteFile(bucket, oldPath); } catch { /* best-effort */ }
      }
    }
    return publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const patch: Partial<Video> = {
        title,
        description: description || null,
        genre: genre || null,
        year: typeof year === 'number' ? year : null,
        duration_minutes: typeof duration === 'number' ? duration : null,
        rating: rating ? Number(rating) : 0,
        age_rating: ageRating,
        featured,
        trending,
        status,
      };

      // Replace media files if new ones were selected
      patch.poster_url = await replaceAndDelete('posters', posterSlot.file, video.poster_url);
      patch.banner_url = await replaceAndDelete('banners', bannerSlot.file, video.banner_url);
      patch.trailer_url = await replaceAndDelete('trailers', trailerSlot.file, video.trailer_url);

      if (videoMode === 'file' && videoFile) {
        const { publicUrl } = await uploadFile('videos', videoFile);
        if (video.video_url) {
          const oldPath = extractStoragePath(video.video_url);
          if (oldPath) {
            try { await deleteFile('videos', oldPath); } catch { /* best-effort */ }
          }
        }
        patch.video_url = publicUrl;
      } else if (videoMode === 'external') {
        if (detectVideoProvider(videoUrl.trim()) === 'unknown') {
          setError('Please enter a valid URL. Supports YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct MP4/WebM/HLS, or any embeddable iframe URL.');
          setSaving(false);
          return;
        }
        // If switching from an uploaded file to an external URL, delete the old file
        if (detectVideoProvider(video.video_url ?? '') === 'unknown' && video.video_url) {
          const oldPath = extractStoragePath(video.video_url);
          if (oldPath) {
            try { await deleteFile('videos', oldPath); } catch { /* best-effort */ }
          }
        }
        patch.video_url = videoUrl.trim();
      }
      // 'keep' mode: don't touch video_url

      await onSave(patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-border bg-ink-card p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Edit Video</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            <X className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-neutral-300">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-neutral-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Genre</label>
            <input value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Duration (min)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Rating</label>
            <input type="number" step="0.1" value={rating} onChange={(e) => setRating(e.target.value ? Number(e.target.value) : '')} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Age Rating</label>
            <input value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)} className="input-field">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm text-neutral-300">Featured</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm text-neutral-300">Trending</span>
          </label>
        </div>

        {/* Media replacement section */}
        <div className="mt-6 border-t border-ink-border pt-4">
          <h3 className="mb-3 text-sm font-semibold uppercase text-neutral-500">Media</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileUpload
              label="Poster Image"
              accept="image/*"
              hint="Replace poster (optional)"
              previewUrl={posterSlot.previewUrl}
              previewType="image"
              onFileSelected={(file) => {
                if (file) {
                  const url = URL.createObjectURL(file);
                  setPosterSlot({ file, previewUrl: url });
                } else {
                  setPosterSlot({ file: null, previewUrl: video.poster_url ?? null });
                }
              }}
            />
            <FileUpload
              label="Banner Image"
              accept="image/*"
              hint="Replace banner (optional)"
              previewUrl={bannerSlot.previewUrl}
              previewType="image"
              onFileSelected={(file) => {
                if (file) {
                  const url = URL.createObjectURL(file);
                  setBannerSlot({ file, previewUrl: url });
                } else {
                  setBannerSlot({ file: null, previewUrl: video.banner_url ?? null });
                }
              }}
            />
            <FileUpload
              label="Trailer (optional)"
              accept="video/mp4,video/webm,video/*"
              hint="Replace trailer (optional)"
              previewUrl={trailerSlot.previewUrl}
              previewType="video"
              onFileSelected={(file) => {
                if (file) {
                  const url = URL.createObjectURL(file);
                  setTrailerSlot({ file, previewUrl: url });
                } else {
                  setTrailerSlot({ file: null, previewUrl: video.trailer_url ?? null });
                }
              }}
            />

            {/* Video source replacement */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Video Source</label>
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setVideoMode('keep')}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    videoMode === 'keep' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  Keep Current
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('file')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    videoMode === 'file' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  <UploadCloud className="h-4 w-4" /> Upload MP4
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('external')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    videoMode === 'external' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  <Link2 className="h-4 w-4" /> External Video URL
                </button>
              </div>

              {videoMode === 'keep' && (
                <div className="rounded-lg border border-ink-border bg-ink-soft p-3">
                  {(() => {
                    const info = getVideoSourceInfo(video.video_url ?? '');
                    if (info.embedUrl) {
                      return (
                        <div className="aspect-video w-full overflow-hidden rounded-lg">
                          <iframe
                            src={info.embedUrl}
                            title="Current video"
                            className="h-full w-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    if (video.video_url) {
                      return <video src={video.video_url} poster={video.poster_url ?? undefined} className="max-h-48 w-full rounded-lg" controls />;
                    }
                    return <p className="text-sm text-neutral-500">No video URL set.</p>;
                  })()}
                </div>
              )}

              {videoMode === 'file' && (
                <FileUpload
                  label=""
                  accept="video/mp4,video/webm,video/*"
                  hint="Select a new MP4 to replace the current video"
                  previewUrl={videoFilePreview}
                  previewType="video"
                  onFileSelected={(file) => {
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setVideoFile(file);
                      setVideoFilePreview(url);
                    } else {
                      setVideoFile(null);
                      setVideoFilePreview(null);
                    }
                  }}
                />
              )}

              {videoMode === 'external' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="input-field"
                    placeholder="Paste a YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct video, or any embeddable URL"
                  />
                  {(() => {
                    const info = getVideoSourceInfo(videoUrl.trim());
                    if (!info.embedUrl) return null;
                    return (
                      <div className="rounded-lg border border-ink-border bg-ink-soft p-2">
                        <div className="aspect-video w-full overflow-hidden rounded-lg">
                          <iframe
                            src={info.embedUrl}
                            title="Video preview"
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-neutral-500">Supports YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct MP4/WebM/HLS (.m3u8), and any other embeddable iframe URL.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /> Save Changes</>}
          </button>
          <button onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

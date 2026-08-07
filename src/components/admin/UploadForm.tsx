import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, UploadCloud, Check, X, Film, Tv, Link2 } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { detectVideoProvider, getVideoSourceInfo } from '@/lib/utils';
import { uploadFile, createVideo, createSeries, createEpisode } from '@/lib/admin';
import type { VideoType, VideoStatus } from '@/types';

interface UploadFormProps {
  onUploaded: () => void;
}

interface FileSlot {
  file: File | null;
  previewUrl: string | null;
}

export function UploadForm({ onUploaded }: UploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<VideoType>('movie');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [year, setYear] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [rating, setRating] = useState<number | ''>('');
  const [ageRating, setAgeRating] = useState('NR');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [status, setStatus] = useState<VideoStatus>('published');
  const [tags, setTags] = useState('');
  const [seriesName, setSeriesName] = useState('');
  const [seasonNumber, setSeasonNumber] = useState<number | ''>(1);
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>(1);

  const [posterSlot, setPosterSlot] = useState<FileSlot>({ file: null, previewUrl: null });
  const [bannerSlot, setBannerSlot] = useState<FileSlot>({ file: null, previewUrl: null });
  const [videoSlot, setVideoSlot] = useState<FileSlot>({ file: null, previewUrl: null });
  const [trailerSlot, setTrailerSlot] = useState<FileSlot>({ file: null, previewUrl: null });
  const [videoMode, setVideoMode] = useState<'file' | 'external'>('file');
  const [videoUrl, setVideoUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const GENRES = ['Action', 'Comedy', 'Drama', 'Anime', 'Documentary', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Animation'];
  const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-14', 'TV-MA'];

  const reset = () => {
    setTitle('');
    setDescription('');
    setType('movie');
    setGenre('');
    setLanguage('English');
    setYear('');
    setDuration('');
    setRating('');
    setAgeRating('NR');
    setFeatured(false);
    setTrending(false);
    setStatus('published');
    setTags('');
    setSeriesName('');
    setSeasonNumber(1);
    setEpisodeNumber(1);
    setPosterSlot({ file: null, previewUrl: null });
    setBannerSlot({ file: null, previewUrl: null });
    setVideoSlot({ file: null, previewUrl: null });
    setTrailerSlot({ file: null, previewUrl: null });
    setVideoMode('file');
    setVideoUrl('');
    setProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (videoMode === 'file' && !videoSlot.file) {
      setError('A video file is required.');
      return;
    }
    if (videoMode === 'external' && !videoUrl.trim()) {
      setError('An external video URL is required.');
      return;
    }
    if (videoMode === 'external' && detectVideoProvider(videoUrl.trim()) === 'unknown') {
      setError('Please enter a valid URL. Supports YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct MP4/WebM/HLS, or any embeddable iframe URL.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload files to storage
      const steps = 4;
      let done = 0;
      const bump = () => { done++; setProgress(Math.round((done / steps) * 100)); };

      const posterUrl = posterSlot.file
        ? (await uploadFile('posters', posterSlot.file)).publicUrl
        : null;
      bump();

      const bannerUrl = bannerSlot.file
        ? (await uploadFile('banners', bannerSlot.file)).publicUrl
        : null;
      bump();

      const finalVideoUrl = videoMode === 'external'
        ? videoUrl.trim()
        : (await uploadFile('videos', videoSlot.file!)).publicUrl;
      bump();

      const trailerUrl = trailerSlot.file
        ? (await uploadFile('trailers', trailerSlot.file)).publicUrl
        : null;
      bump();

      // Create series if needed
      let seriesId: string | null = null;
      if (type === 'series' && seriesName.trim()) {
        const series = await createSeries({
          name: seriesName.trim(),
          description: description || null,
          poster_url: posterUrl,
          banner_url: bannerUrl,
        });
        seriesId = series.id;
      }

      // Create the video record
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const video = await createVideo({
        title: title.trim(),
        description: description.trim() || null,
        type,
        series_id: seriesId,
        poster_url: posterUrl,
        banner_url: bannerUrl,
        video_url: finalVideoUrl,
        trailer_url: trailerUrl,
        genre: genre || null,
        language: language || 'English',
        year: year || null,
        duration_minutes: duration || null,
        rating: rating ? Number(rating) : 0,
        age_rating: ageRating,
        featured,
        trending,
        status,
        tags: tagArray,
      });

      // Create episode record if series
      if (type === 'series' && seriesId) {
        await createEpisode({
          video_id: video.id,
          series_id: seriesId,
          season_number: seasonNumber || 1,
          episode_number: episodeNumber || 1,
        });
      }

      setSuccess(true);
      reset();
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <Check className="h-4 w-4" /> Video uploaded successfully! It will appear on the site immediately.
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Content Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('movie')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${
                type === 'movie' ? 'border-primary bg-primary/10 text-white' : 'border-ink-border text-neutral-400 hover:bg-white/5'
              }`}
            >
              <Film className="h-5 w-5" /> Movie
            </button>
            <button
              type="button"
              onClick={() => setType('series')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${
                type === 'series' ? 'border-primary bg-primary/10 text-white' : 'border-ink-border text-neutral-400 hover:bg-white/5'
              }`}
            >
              <Tv className="h-5 w-5" /> Series Episode
            </button>
          </div>
        </div>

        {/* Basic info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Video title" required />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="Video description" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field">
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Language</label>
            <input value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field" placeholder="e.g. English" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="2024" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Duration (minutes)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="120" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Rating (0-10)</label>
            <input type="number" step="0.1" min="0" max="10" value={rating} onChange={(e) => setRating(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="8.5" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Age Rating</label>
            <select value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="input-field">
              {AGE_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="action, thriller, 2024" />
          </div>
        </div>

        {/* Series fields */}
        {type === 'series' && (
          <div className="grid gap-4 rounded-xl border border-ink-border bg-ink-soft/50 p-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Series Name</label>
              <input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className="input-field" placeholder="e.g. The Last Journey" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Season Number</label>
              <input type="number" min="1" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value ? Number(e.target.value) : '')} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Episode Number</label>
              <input type="number" min="1" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value ? Number(e.target.value) : '')} className="input-field" />
            </div>
          </div>
        )}

        {/* File uploads */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FileUpload
            label="Poster Image"
            accept="image/*"
            hint="Portrait image, 2:3 ratio recommended"
            previewUrl={posterSlot.previewUrl}
            previewType="image"
            onFileSelected={(file) => {
              const url = URL.createObjectURL(file);
              setPosterSlot({ file, previewUrl: url });
            }}
          />
          <FileUpload
            label="Banner Image"
            accept="image/*"
            hint="Wide landscape image, 16:9 ratio recommended"
            previewUrl={bannerSlot.previewUrl}
            previewType="image"
            onFileSelected={(file) => {
              const url = URL.createObjectURL(file);
              setBannerSlot({ file, previewUrl: url });
            }}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Video *</label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setVideoMode('file')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  videoMode === 'file' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                }`}
              >
                <UploadCloud className="h-4 w-4" /> Upload File
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
            {videoMode === 'file' ? (
              <FileUpload
                label=""
                accept="video/mp4,video/webm,video/*"
                hint="MP4 format recommended (50MB max)"
                previewUrl={videoSlot.previewUrl}
                previewType="video"
                onFileSelected={(file) => {
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setVideoSlot({ file, previewUrl: url });
                  } else {
                    setVideoSlot({ file: null, previewUrl: null });
                  }
                }}
              />
            ) : (
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
                      <div className="mx-auto max-h-40 overflow-hidden rounded-lg">
                        <iframe
                          src={info.embedUrl}
                          title="Video preview"
                          className="aspect-video w-full"
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
          <FileUpload
            label="Trailer (optional)"
            accept="video/mp4,video/webm,video/*"
            hint="Short preview video"
            previewUrl={trailerSlot.previewUrl}
            previewType="video"
            onFileSelected={(file) => {
              const url = URL.createObjectURL(file);
              setTrailerSlot({ file, previewUrl: url });
            }}
          />
        </div>

        {/* Toggles */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)} className="input-field">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 rounded accent-primary" />
            <span className="text-sm text-neutral-300">Featured</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end">
            <input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} className="h-5 w-5 rounded accent-primary" />
            <span className="text-sm text-neutral-300">Trending</span>
          </label>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="rounded-lg border border-ink-border bg-ink-soft p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-neutral-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading... {progress}%
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button type="submit" disabled={uploading} className="btn-primary w-full">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UploadCloud className="h-5 w-5" /> Upload Video</>}
        </button>
      </form>
    </motion.div>
  );
}

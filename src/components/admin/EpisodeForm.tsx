import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, UploadCloud, Check, X, Link2, Save } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { Modal } from '@/components/Modal';
import {
  detectVideoProvider, getVideoSourceInfo, extractErrorMessage,
} from '@/lib/utils';
import {
  uploadFile, createVideo, createEpisode, updateVideo, updateEpisode,
} from '@/lib/admin';
import type { Series, EpisodeWithVideo, VideoStatus } from '@/types';

interface EpisodeFormProps {
  series: Series;
  existingEpisodes: EpisodeWithVideo[];
  episode?: EpisodeWithVideo;
  onClose: () => void;
  onSaved: () => void;
}

const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-14', 'TV-MA'];

export function EpisodeForm({ series, existingEpisodes, episode, onClose, onSaved }: EpisodeFormProps) {
  const isEdit = !!episode;

  const [seasonNumber, setSeasonNumber] = useState<number | ''>(episode?.season_number ?? 1);
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>(episode?.episode_number ?? nextEpisodeNumber(existingEpisodes));
  const [title, setTitle] = useState(episode?.title ?? '');
  const [description, setDescription] = useState(episode?.description ?? '');
  const [releaseDate, setReleaseDate] = useState(episode?.video?.release_date ?? '');
  const [duration, setDuration] = useState<number | ''>(episode?.duration_minutes ?? episode?.video?.duration_minutes ?? '');
  const [status, setStatus] = useState<VideoStatus>(episode?.publish_status ?? 'published');
  const [featured, setFeatured] = useState(episode?.featured ?? false);
  const [downloadEnabled, setDownloadEnabled] = useState(episode?.download_enabled ?? false);

  // Thumbnail
  const [thumbSlot, setThumbSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: episode?.thumbnail_url ?? episode?.video?.poster_url ?? null,
  });

  // Video source
  const [videoMode, setVideoMode] = useState<'file' | 'external'>(
    episode?.video?.video_url ? 'external' : 'file'
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFilePreview, setVideoFilePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(episode?.video?.video_url ?? '');
  const [subtitleUrl, setSubtitleUrl] = useState(episode?.video?.subtitle_url ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggest next episode number for the chosen season
  useEffect(() => {
    if (isEdit) return;
    setEpisodeNumber(nextEpisodeNumber(existingEpisodes, typeof seasonNumber === 'number' ? seasonNumber : 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonNumber]);

  const previewInfo = useMemo(() => getVideoSourceInfo(videoUrl.trim()), [videoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!seasonNumber || !episodeNumber) {
      setError('Season and episode numbers are required.');
      return;
    }
    if (!isEdit) {
      if (videoMode === 'file' && !videoFile) {
        setError('A video file or URL is required.');
        return;
      }
      if (videoMode === 'external' && !videoUrl.trim()) {
        setError('A video URL is required.');
        return;
      }
    }
    if (videoMode === 'external' && videoUrl.trim() && detectVideoProvider(videoUrl.trim()) === 'unknown') {
      setError('Please enter a valid URL. Supports YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct MP4/WebM/HLS, or any embeddable iframe URL.');
      return;
    }

    setSaving(true);
    try {
      // Upload thumbnail if selected
      let thumbUrl = thumbSlot.previewUrl;
      if (thumbSlot.file) {
        const result = await uploadFile('posters', thumbSlot.file);
        thumbUrl = result.publicUrl;
      }

      if (isEdit && episode) {
        // Update the underlying video row
        const videoPatch: Record<string, unknown> = {
          title: title.trim() || `S${seasonNumber}E${episodeNumber}`,
          description: description.trim() || null,
          release_date: releaseDate || null,
          duration_minutes: typeof duration === 'number' ? duration : null,
          status,
          featured,
          download_enabled: downloadEnabled,
        };

        if (thumbUrl) videoPatch.poster_url = thumbUrl;

        if (videoMode === 'file' && videoFile) {
          const { publicUrl } = await uploadFile('videos', videoFile);
          videoPatch.video_url = publicUrl;
        } else if (videoMode === 'external' && videoUrl.trim()) {
          videoPatch.video_url = videoUrl.trim();
        }
        if (subtitleUrl.trim()) videoPatch.subtitle_url = subtitleUrl.trim();

        await updateVideo(episode.video_id, videoPatch);

        // Update the episode row
        await updateEpisode(episode.id, {
          season_number: Number(seasonNumber),
          episode_number: Number(episodeNumber),
          title: title.trim() || null,
          description: description.trim() || null,
          thumbnail_url: thumbUrl,
          duration_minutes: typeof duration === 'number' ? duration : null,
          publish_status: status,
          featured,
          download_enabled: downloadEnabled,
        });
      } else {
        // Create new: upload video, create video row, create episode row
        let finalVideoUrl = '';
        if (videoMode === 'file' && videoFile) {
          const { publicUrl } = await uploadFile('videos', videoFile);
          finalVideoUrl = publicUrl;
        } else {
          finalVideoUrl = videoUrl.trim();
        }

        const video = await createVideo({
          title: title.trim() || `${series.name} S${seasonNumber}E${episodeNumber}`,
          description: description.trim() || null,
          type: 'series',
          series_id: series.id,
          poster_url: thumbUrl,
          banner_url: null,
          video_url: finalVideoUrl,
          trailer_url: null,
          subtitle_url: subtitleUrl.trim() || null,
          release_date: releaseDate || null,
          genre: series.genre,
          language: series.language ?? 'English',
          year: series.year,
          duration_minutes: typeof duration === 'number' ? duration : null,
          rating: 0,
          age_rating: series.age_rating ?? 'NR',
          featured,
          trending: false,
          status,
          tags: [],
          download_enabled: downloadEnabled,
        });

        await createEpisode({
          video_id: video.id,
          series_id: series.id,
          season_number: Number(seasonNumber),
          episode_number: Number(episodeNumber),
          title: title.trim() || null,
          description: description.trim() || null,
          thumbnail_url: thumbUrl,
          duration_minutes: typeof duration === 'number' ? duration : null,
          publish_status: status,
          featured,
        });
      }

      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save episode.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Episode' : 'Add Episode'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            <X className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Season + Episode number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Season *</label>
            <input
              type="number"
              min="1"
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(e.target.value ? Number(e.target.value) : '')}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Episode Number *</label>
            <input
              type="number"
              min="1"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value ? Number(e.target.value) : '')}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Title + Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Episode Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. The Beginning" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Episode Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="What happens in this episode" />
        </div>

        {/* Thumbnail */}
        <FileUpload
          label="Episode Thumbnail"
          accept="image/*"
          hint="Landscape image, 16:9 ratio recommended"
          previewUrl={thumbSlot.previewUrl}
          previewType="image"
          onFileSelected={(file) => {
            if (file) {
              const url = URL.createObjectURL(file);
              setThumbSlot({ file, previewUrl: url });
            } else {
              setThumbSlot({ file: null, previewUrl: null });
            }
          }}
        />

        {/* Release date + duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Release Date</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Duration (minutes)</label>
            <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="45" />
          </div>
        </div>

        {/* Video source */}
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-300">Video Source *</label>
          <div className="mb-2 flex flex-wrap gap-2">
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
              <Link2 className="h-4 w-4" /> External URL
            </button>
          </div>

          {videoMode === 'file' ? (
            <FileUpload
              label=""
              accept="video/mp4,video/webm,video/*"
              hint="MP4 format recommended"
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
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="input-field"
                placeholder="Paste a YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct video, or any embeddable URL"
              />
              {previewInfo.embedUrl && (
                <div className="rounded-lg border border-ink-border bg-ink-soft p-2">
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <iframe
                      src={previewInfo.embedUrl}
                      title="Video preview"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Detected: {previewInfo.provider}</p>
                </div>
              )}
              <p className="text-xs text-neutral-500">Supports YouTube, Vimeo, Dailymotion, Streamable, Loom, Wistia, ScreenApp, direct MP4/WebM/HLS (.m3u8), and any other embeddable iframe URL.</p>
            </div>
          )}
        </div>

        {/* Subtitle URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Subtitle URL (optional)</label>
          <input
            type="url"
            value={subtitleUrl}
            onChange={(e) => setSubtitleUrl(e.target.value)}
            className="input-field"
            placeholder="https://example.com/subtitles.vtt"
          />
        </div>

        {/* Status + featured */}
        <div className="grid grid-cols-2 gap-4">
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
            <span className="text-sm text-neutral-300">Featured Episode</span>
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={downloadEnabled} onChange={(e) => setDownloadEnabled(e.target.checked)} className="h-5 w-5 rounded accent-primary" />
          <span className="text-sm text-neutral-300">Allow Download — only if BytesFlix is authorized to distribute this file</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> {isEdit ? 'Save Changes' : 'Add Episode'}</>}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function nextEpisodeNumber(episodes: EpisodeWithVideo[], season = 1): number {
  const inSeason = episodes.filter((e) => e.season_number === season);
  if (inSeason.length === 0) return 1;
  return Math.max(...inSeason.map((e) => e.episode_number)) + 1;
}

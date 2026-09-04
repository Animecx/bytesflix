import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { Modal } from '@/components/Modal';
import { uploadFile, createSeries, updateSeries } from '@/lib/admin';
import { extractErrorMessage } from '@/lib/utils';
import type { Series, VideoStatus } from '@/types';

interface SeriesFormProps {
  series?: Series;
  onClose: () => void;
  onSaved: () => void;
}

const GENRES = ['Action', 'Comedy', 'Drama', 'Anime', 'Documentary', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Animation'];
const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-14', 'TV-MA'];

export function SeriesForm({ series, onClose, onSaved }: SeriesFormProps) {
  const isEdit = !!series;

  const [name, setName] = useState(series?.name ?? '');
  const [description, setDescription] = useState(series?.description ?? '');
  const [genre, setGenre] = useState(series?.genre ?? '');
  const [language, setLanguage] = useState(series?.language ?? 'English');
  const [year, setYear] = useState<number | ''>(series?.year ?? '');
  const [rating, setRating] = useState<number | ''>(series?.rating ?? '');
  const [ageRating, setAgeRating] = useState(series?.age_rating ?? 'NR');
  const [featured, setFeatured] = useState(series?.featured ?? false);
  const [trending, setTrending] = useState(series?.trending ?? false);
  const [status, setStatus] = useState<VideoStatus>(series?.publish_status ?? 'published');

  const [posterSlot, setPosterSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: series?.poster_url ?? null,
  });
  const [bannerSlot, setBannerSlot] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: series?.banner_url ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Series name is required.');
      return;
    }

    setSaving(true);
    try {
      let posterUrl = posterSlot.previewUrl;
      if (posterSlot.file) {
        const result = await uploadFile('posters', posterSlot.file);
        posterUrl = result.publicUrl;
      }

      let bannerUrl = bannerSlot.previewUrl;
      if (bannerSlot.file) {
        const result = await uploadFile('banners', bannerSlot.file);
        bannerUrl = result.publicUrl;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        poster_url: posterUrl,
        banner_url: bannerUrl,
        genre: genre || null,
        language: language || 'English',
        year: year || null,
        rating: rating ? Number(rating) : 0,
        age_rating: ageRating,
        featured,
        trending,
        publish_status: status,
      };

      if (isEdit && series) {
        await updateSeries(series.id, payload);
      } else {
        await createSeries(payload);
      }

      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save series.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Series' : 'Create Series'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            <X className="h-4 w-4" /> {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Series Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Bytes Podcast"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="What is this series about?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FileUpload
            label="Poster Image"
            accept="image/*"
            hint="Portrait image, 2:3 ratio recommended"
            previewUrl={posterSlot.previewUrl}
            previewType="image"
            onFileSelected={(file) => {
              if (file) {
                const url = URL.createObjectURL(file);
                setPosterSlot({ file, previewUrl: url });
              } else {
                setPosterSlot({ file: null, previewUrl: null });
              }
            }}
          />
          <FileUpload
            label="Banner Image"
            accept="image/*"
            hint="Wide landscape, 16:9 ratio recommended"
            previewUrl={bannerSlot.previewUrl}
            previewType="image"
            onFileSelected={(file) => {
              if (file) {
                const url = URL.createObjectURL(file);
                setBannerSlot({ file, previewUrl: url });
              } else {
                setBannerSlot({ file: null, previewUrl: null });
              }
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field">
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Language</label>
            <input value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field" placeholder="English" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="2024" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> {isEdit ? 'Save Changes' : 'Create Series'}</>}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

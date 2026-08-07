import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Loader2, Camera, Shield, Clock, Bookmark, Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { fetchWatchHistory, fetchFavorites } from '@/lib/userData';
import { getInitials } from '@/lib/utils';
import type { Video, WatchHistoryItem, FavoriteItem } from '@/types';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    fetchWatchHistory(user.id).then(setHistory).catch(() => {});
    fetchFavorites(user.id).then((vids) => {
      // We need the full favorite items; fetch them
      fetchFavoriteItems(user.id).then(setFavorites).catch(() => {});
      void vids;
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMessage('Failed to save. Please try again.');
    } else {
      setMessage('Profile updated successfully.');
      await refreshProfile();
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKETS.avatars)
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(STORAGE_BUCKETS.avatars).getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
    } catch {
      setMessage('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const historyVideos = history.map((h) => h.video).filter(Boolean) as Video[];

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl tracking-wide text-white">Profile</h1>
        <p className="mt-1 text-neutral-400">Manage your account and preferences</p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="card-surface p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full bg-primary text-2xl font-bold text-white">
                  {getInitials(profile?.display_name ?? user?.email ?? 'U')}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-ink-border text-white transition-colors hover:bg-primary"
                aria-label="Change avatar"
              >
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">{profile?.display_name ?? 'User'}</h2>
            <p className="text-sm text-neutral-400">{user?.email}</p>
            {profile?.is_admin && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-ink-border bg-ink-card/50 px-4 py-3">
                <Mail className="h-4 w-4 text-neutral-500" />
                <span className="text-sm text-neutral-400">{user?.email}</span>
              </div>
            </div>
            {message && (
              <p className={`text-sm ${message.includes('Failed') ? 'text-error' : 'text-success'}`}>{message}</p>
            )}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Stats + history */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard icon={<Clock className="h-5 w-5" />} label="Watched" value={history.length} />
            <StatCard icon={<Bookmark className="h-5 w-5" />} label="My List" value={favorites.length} />
            <StatCard icon={<User className="h-5 w-5" />} label="Member Since" value={profile ? new Date(profile.created_at).getFullYear() : '-'} />
          </div>

          <div className="card-surface p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Clock className="h-5 w-5 text-primary" /> Watch History
            </h3>
            {historyVideos.length === 0 ? (
              <p className="text-sm text-neutral-500">You haven't watched anything yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {historyVideos.slice(0, 8).map((video) => (
                  <Link key={video.id} to={`/watch/${video.id}`} className="group">
                    <div className="aspect-[2/3] overflow-hidden rounded-lg border border-ink-border bg-ink-card">
                      {video.poster_url ? (
                        <img src={video.poster_url} alt={video.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-8 w-8 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-300">{video.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
    </div>
  );
}

async function fetchFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, video:videos(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as FavoriteItem[];
}

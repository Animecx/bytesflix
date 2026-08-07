import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, Loader2, Search } from 'lucide-react';
import { fetchAllProfiles, setUserAdmin } from '@/lib/admin';
import { getInitials, formatDate } from '@/lib/utils';
import type { Profile } from '@/types';

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllProfiles()
      .then(setProfiles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleAdmin = async (profile: Profile) => {
    try {
      await setUserAdmin(profile.id, !profile.is_admin);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p))
      );
    } catch {
      // ignore
    }
  };

  const filtered = profiles.filter((p) =>
    !search || (p.display_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-ink-border bg-ink-card px-3">
        <Search className="h-4 w-4 text-neutral-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="bg-transparent py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="flex items-center gap-4 rounded-xl border border-ink-border bg-ink-card p-3"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {getInitials(profile.display_name ?? 'U')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-semibold text-white">{profile.display_name ?? 'Unknown'}</h3>
              <p className="text-xs text-neutral-400">Joined {formatDate(profile.created_at)}</p>
            </div>
            {profile.is_admin && (
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">Admin</span>
            )}
            <button
              onClick={() => handleToggleAdmin(profile)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                profile.is_admin
                  ? 'bg-error/10 text-error hover:bg-error/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
              }`}
            >
              {profile.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

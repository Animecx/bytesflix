import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Users, Eye, HardDrive, TrendingUp, Clock, UploadCloud, ListVideo, Settings, Users as UsersIcon, CheckCircle, File as FileEdit, EyeOff, Tv, Palette } from 'lucide-react';
import { fetchAdminStats } from '@/lib/admin';
import { formatViews, formatDate } from '@/lib/utils';
import { UploadForm } from '@/components/admin/UploadForm';
import { VideoManagement } from '@/components/admin/VideoManagement';
import { SeriesManagement } from '@/components/admin/SeriesManagement';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { AppearancePanel } from '@/components/admin/AppearancePanel';
import { UserManagement } from '@/components/admin/UserManagement';
import type { AdminStats } from '@/lib/admin';

type Tab = 'overview' | 'upload' | 'videos' | 'series' | 'users' | 'appearance' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'upload', label: 'Upload', icon: <UploadCloud className="h-4 w-4" /> },
  { id: 'videos', label: 'Videos', icon: <ListVideo className="h-4 w-4" /> },
  { id: 'series', label: 'Series', icon: <Tv className="h-4 w-4" /> },
  { id: 'users', label: 'Users', icon: <UsersIcon className="h-4 w-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="container-page pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl tracking-wide text-white">Admin Dashboard</h1>
        <p className="mt-1 text-neutral-400">Manage your streaming platform</p>
      </motion.div>

      {/* Tabs */}
      <div className="scrollbar-hide mt-6 flex gap-2 overflow-x-auto border-b border-ink-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-primary text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <Overview stats={stats} loading={loading} onRefresh={loadStats} />
        )}
        {tab === 'upload' && <UploadForm onUploaded={loadStats} />}
        {tab === 'videos' && <VideoManagement />}
        {tab === 'series' && <SeriesManagement />}
        {tab === 'users' && <UserManagement />}
        {tab === 'appearance' && <AppearancePanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}

function Overview({
  stats, loading, onRefresh,
}: {
  stats: AdminStats | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Videos', value: stats.totalVideos, icon: <Film className="h-6 w-6" />, color: 'text-primary' },
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="h-6 w-6" />, color: 'text-accent' },
    { label: 'Total Views', value: formatViews(stats.totalViews), icon: <Eye className="h-6 w-6" />, color: 'text-secondary' },
    { label: 'Series', value: stats.totalSeries, icon: <HardDrive className="h-6 w-6" />, color: 'text-success' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-white/5 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatusCard icon={<CheckCircle className="h-5 w-5" />} label="Published" value={stats.publishedCount} color="text-success" />
        <StatusCard icon={<FileEdit className="h-5 w-5" />} label="Drafts" value={stats.draftCount} color="text-warning" />
        <StatusCard icon={<EyeOff className="h-5 w-5" />} label="Hidden" value={stats.hiddenCount} color="text-neutral-400" />
      </div>

      {/* Recent uploads */}
      <div className="mt-6 card-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Clock className="h-5 w-5 text-primary" /> Recent Uploads
          </h3>
          <button onClick={onRefresh} className="text-sm text-primary hover:underline">Refresh</button>
        </div>
        {stats.recentUploads.length === 0 ? (
          <p className="text-sm text-neutral-500">No videos uploaded yet. Use the Upload tab to add content.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentUploads.map((video) => (
              <div key={video.id} className="flex items-center gap-3 rounded-lg border border-ink-border bg-ink-soft/50 p-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-border">
                  {video.poster_url ? (
                    <img src={video.poster_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-4 w-4 text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-1 text-sm font-semibold text-white">{video.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="uppercase">{video.type}</span>
                    <span>{formatViews(video.views)}</span>
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  video.status === 'published' ? 'bg-success/20 text-success' :
                  video.status === 'draft' ? 'bg-warning/20 text-warning' :
                  'bg-neutral-700 text-neutral-300'
                }`}>
                  {video.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-lg bg-white/5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X, LogOut, User, Shield, Bookmark, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { getInitials } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Movies', path: '/movies' },
  { label: 'Series', path: '/series' },
  { label: 'Recently Added', path: '/recently-added' },
  { label: 'Trending', path: '/trending' },
  { label: 'My List', path: '/my-list' },
];

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenu(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-ink/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <nav className="container-page flex h-16 items-center justify-between gap-4 md:h-18">
          {/* Left: logo + links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-auto" />
              ) : (
                <span className="font-display text-2xl tracking-wider text-primary">{settings?.site_name ?? 'BytesFlix'}</span>
              )}
            </Link>
            <div className="hidden items-center gap-5 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path) ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: search + profile */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className={`flex items-center overflow-hidden rounded-lg border transition-all ${
                searchOpen ? 'border-ink-border bg-ink-card w-64' : 'border-transparent w-10'
              }`}>
                <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="grid h-10 w-10 place-items-center text-neutral-300 hover:text-white" aria-label="Search">
                  <Search className="h-5 w-5" />
                </button>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, genres..."
                  className={`bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none ${searchOpen ? 'w-full pr-3' : 'w-0'}`}
                />
              </div>
            </form>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenu(!profileMenu)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/10"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
                      {getInitials(profile?.display_name ?? user.email ?? 'U')}
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {profileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-ink-border bg-ink-card shadow-2xl"
                    >
                      <div className="border-b border-ink-border px-4 py-3">
                        <p className="text-sm font-semibold text-white">{profile?.display_name ?? 'User'}</p>
                        <p className="line-clamp-1 text-xs text-neutral-400">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
                          <User className="h-4 w-4" /> Profile
                        </Link>
                        <Link to="/my-list" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
                          <Bookmark className="h-4 w-4" /> My List
                        </Link>
                        <Link to="/continue-watching" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
                          <Clock className="h-4 w-4" /> Continue Watching
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-white/5">
                            <Shield className="h-4 w-4" /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn-primary !px-4 !py-2 text-sm">
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid h-10 w-10 place-items-center text-white lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-ink-border bg-ink/95 backdrop-blur-md lg:hidden"
            >
              <div className="container-page flex flex-col gap-1 py-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.path) ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <form onSubmit={handleSearch} className="mt-2">
                  <div className="flex items-center gap-2 rounded-lg border border-ink-border bg-ink-card px-3">
                    <Search className="h-4 w-4 text-neutral-500" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="bg-transparent py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none"
                    />
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

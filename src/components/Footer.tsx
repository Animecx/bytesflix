import { Link } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';

const FOOTER_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Movies', path: '/movies' },
  { label: 'Series', path: '/series' },
  { label: 'Trending', path: '/trending' },
  { label: 'My List', path: '/my-list' },
];

export function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="mt-16 border-t border-ink-border bg-ink-soft">
      <div className="container-page py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="font-display text-2xl tracking-wider text-primary">
              {settings?.site_name ?? 'BytesFlix'}
            </span>
            <p className="mt-1 text-sm text-neutral-500">
              Stream premium any content, Mail Any Movie it will be uploaded. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-neutral-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-ink-border pt-6 text-center text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} {settings?.site_name ?? 'BytesFlix'}. technoproboizz@gmail.com.
        </div>
      </div>
    </footer>
  );
}

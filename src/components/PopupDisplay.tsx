import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import type { Popup } from '@/types';

function getDismissedKey(popup: Popup): string {
  return `bytesflix_popup_dismissed_${popup.id}`;
}

function shouldShowPopup(popup: Popup): boolean {
  if (!popup.is_enabled) return false;

  const now = Date.now();
  if (popup.start_date && new Date(popup.start_date).getTime() > now) return false;
  if (popup.end_date && new Date(popup.end_date).getTime() < now) return false;

  if (popup.display_frequency === 'once') {
    return !localStorage.getItem(getDismissedKey(popup));
  }
  if (popup.display_frequency === 'session') {
    return !sessionStorage.getItem(getDismissedKey(popup));
  }
  // 'always' — show every visit
  return true;
}

function markDismissed(popup: Popup) {
  if (popup.display_frequency === 'once') {
    localStorage.setItem(getDismissedKey(popup), '1');
  } else if (popup.display_frequency === 'session') {
    sessionStorage.setItem(getDismissedKey(popup), '1');
  }
}

export function PopupDisplay() {
  const { settings, popups } = useSettings();
  const [activePopup, setActivePopup] = useState<Popup | null>(null);

  const dismiss = useCallback(() => {
    if (activePopup) markDismissed(activePopup);
    setActivePopup(null);
  }, [activePopup]);

  useEffect(() => {
    if (!settings?.popups_enabled || popups.length === 0) {
      setActivePopup(null);
      return;
    }

    const eligible = popups.filter(shouldShowPopup);
    if (eligible.length > 0) {
      // Show the most recently created eligible popup
      setActivePopup(eligible[0]);
    }
  }, [settings?.popups_enabled, popups]);

  // Don't show popups on watch pages (don't interrupt video playback)
  const onWatchPage = window.location.pathname.startsWith('/watch/') || window.location.pathname.includes('/season-');
  if (onWatchPage) return null;

  return createPortal(
    <AnimatePresence>
      {activePopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-ink-border bg-ink-card shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            {activePopup.image_url && (
              <div className="relative h-48 w-full overflow-hidden">
                <img src={activePopup.image_url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-card via-transparent to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-white">{activePopup.title}</h2>
              {activePopup.message && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">{activePopup.message}</p>
              )}

              {activePopup.button_text && activePopup.button_url && (
                <a
                  href={activePopup.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="btn-primary mt-5 w-full"
                >
                  {activePopup.button_text}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {activePopup.button_text && !activePopup.button_url && (
                <button onClick={dismiss} className="btn-primary mt-5 w-full">
                  {activePopup.button_text}
                </button>
              )}

              <button
                onClick={dismiss}
                className="mt-3 w-full text-center text-xs text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

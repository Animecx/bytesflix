import { useState, useCallback } from 'react';
import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { detectVideoProvider } from '@/lib/utils';

interface DownloadButtonProps {
  /** The raw video URL (MP4, WebM, HLS, or third-party embed URL) */
  url: string;
  /** Whether the admin has authorized downloads for this content */
  downloadEnabled: boolean;
  /** Filename to use for the downloaded file (without extension) */
  filename: string;
  /** Optional className override */
  className?: string;
}

type DownloadState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Download button for BytesFlix videos.
 *
 * Only shows for direct MP4/WebM sources that are hosted on BytesFlix's
 * own Supabase storage and explicitly authorized by an admin via
 * download_enabled. HLS (.m3u8) and third-party embeds (YouTube, Vimeo,
 * Dailymotion, etc.) are never offered for download — those platforms
 * have their own download restrictions that must not be bypassed.
 */
export function DownloadButton({ url, downloadEnabled, filename, className }: DownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const provider = detectVideoProvider(url);

  // Only direct MP4/WebM files can be downloaded.
  // HLS (.m3u8) requires segmenting and is not downloadable via a simple fetch.
  // Third-party embeds (YouTube, Vimeo, etc.) must not be bypassed.
  const canDownload = downloadEnabled && provider === 'direct';

  const handleClick = useCallback(async () => {
    if (!canDownload) return;
    setState('loading');
    setErrorMsg('');

    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;

      // Derive extension from the URL or blob type
      const ext = url.match(/\.(mp4|webm|ogg)(\?|$)/i)?.[1]?.toLowerCase()
        ?? (blob.type.includes('webm') ? 'webm' : blob.type.includes('ogg') ? 'ogg' : 'mp4');
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      // Fallback: open in a new tab so the browser handles the download
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.mp4`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setState('success');
        setTimeout(() => setState('idle'), 3000);
      } catch {
        setErrorMsg('Download failed. Please try again later.');
        setState('error');
        setTimeout(() => setState('idle'), 4000);
      }
    }
  }, [canDownload, url, filename]);

  if (!canDownload) return null;

  const baseClass = className ?? 'btn-ghost';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={baseClass}
      title="Download this video"
    >
      {state === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
      {state === 'success' && <CheckCircle className="h-5 w-5 text-success" />}
      {state === 'error' && <AlertCircle className="h-5 w-5 text-error" />}
      {state === 'idle' && <Download className="h-5 w-5" />}
      <span>
        {state === 'loading' ? 'Downloading…'
          : state === 'success' ? 'Downloaded!'
          : state === 'error' ? (errorMsg || 'Failed')
          : 'Download'}
      </span>
    </button>
  );
}

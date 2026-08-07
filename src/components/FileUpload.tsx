import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Check } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelected: (file: File) => void;
  previewUrl?: string | null;
  previewType?: 'image' | 'video';
  hint?: string;
}

export function FileUpload({
  label,
  accept = 'image/*',
  onFileSelected,
  previewUrl,
  previewType = 'image',
  hint,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset selected name when preview is cleared
    if (!previewUrl) setSelectedName(null);
  }, [previewUrl]);

  const handleFile = (file: File) => {
    setSelectedName(file.name);
    onFileSelected(file);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragging ? 'border-primary bg-primary/10' : 'border-ink-border hover:border-neutral-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {previewUrl ? (
          <div className="relative">
            {previewType === 'image' ? (
              <img src={previewUrl} alt={label} className="mx-auto max-h-40 rounded-lg object-contain" />
            ) : (
              <video src={previewUrl} className="mx-auto max-h-40 rounded-lg" controls />
            )}
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              <span className="line-clamp-1">{selectedName ?? 'File selected'}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelected(null as unknown as File);
              }}
              className="absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <UploadCloud className="h-8 w-8 text-neutral-500" />
            <p className="text-sm text-neutral-400">
              Click or drag to upload
            </p>
            {hint && <p className="text-xs text-neutral-500">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface ImageUploadFieldProps {
  value?: string;
  artistId: string;
  onChange: (url: string) => void;
  label?: string;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp';

export function ImageUploadField({
  value,
  artistId,
  onChange,
  label = 'Hero Photo',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('artistId', artistId);
      const res = await fetch('/api/upload/artist-image', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Upload failed');
      }
      const { url } = (await res.json()) as { url: string };
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className='block text-sm font-medium text-foreground'>{label}</label>
      <p className='mt-1 text-xs text-muted-foreground'>
        Best fit: <strong>1920 × 1080 px</strong>, 16:9 landscape. Minimum 1200 px wide. The image
        is cropped to a full-width banner at ~40% of screen height.
      </p>

      {/* 16:9 preview / drop zone */}
      <div
        className='relative mt-2 w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/40'
        style={{ aspectRatio: '16/9' }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        {value ? (
          <>
            <Image src={value} alt='Artist hero photo' fill className='object-cover' />
            <button
              type='button'
              className='absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80'
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-muted-foreground'>
            {uploading ? (
              <span className='text-sm'>Uploading…</span>
            ) : (
              <>
                <Upload size={24} />
                <span className='text-sm'>Click or drag an image here</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept={ACCEPTED}
        className='hidden'
        onChange={handleInputChange}
        disabled={uploading}
      />

      {error && (
        <p className='mt-1 text-xs text-red-500' role='alert'>
          {error}
        </p>
      )}

      <button
        type='button'
        className='mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground'
        onClick={() => setShowUrlInput((v) => !v)}
      >
        {showUrlInput ? 'Hide URL input' : 'or paste a URL'}
      </button>

      {showUrlInput && (
        <input
          type='url'
          placeholder='https://example.com/image.jpg'
          defaultValue={value}
          className='mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20'
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

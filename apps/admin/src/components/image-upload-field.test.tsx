import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUploadField } from './image-upload-field';

// next/image needs a mock in tests
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// jsdom doesn't implement these Blob/File URL APIs
global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = vi.fn();

function stubImageDimensions(width: number, height: number) {
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = width;
      naturalHeight = height;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
}

describe('ImageUploadField', () => {
  beforeEach(() => {
    stubImageDimensions(1920, 1080);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders recommended size helper text', () => {
    render(<ImageUploadField value='' artistId='test-id' onChange={vi.fn()} />);
    expect(screen.getByText(/1920 × 1080 px/)).toBeTruthy();
    expect(screen.getByText(/16:9 landscape/)).toBeTruthy();
    expect(screen.getByText(/1200 px wide/)).toBeTruthy();
  });

  it('shows current image when value is set', () => {
    render(
      <ImageUploadField
        value='https://example.com/photo.webp'
        artistId='test-id'
        onChange={vi.fn()}
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.webp');
  });

  it('shows upload prompt when no value', () => {
    render(<ImageUploadField value='' artistId='test-id' onChange={vi.fn()} />);
    expect(screen.getByText(/Click or drag an image here/)).toBeTruthy();
  });

  it('calls onChange with returned URL on successful upload', async () => {
    const onChange = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://cdn.stpetemusic.live/artists/123/abc.webp' }),
    });

    render(<ImageUploadField value='' artistId='123' onChange={onChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        'https://cdn.stpetemusic.live/artists/123/abc.webp',
      );
    });
  });

  it('shows error message when upload fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'File too large' }),
    });

    render(<ImageUploadField value='' artistId='123' onChange={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('File too large')).toBeTruthy();
    });
  });

  it('shows dimension error when image is too small', async () => {
    stubImageDimensions(800, 600);

    render(<ImageUploadField value='' artistId='123' onChange={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'small.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/Image is too small \(800 × 600 px\)/)).toBeTruthy();
    });
  });

  it('shows URL input when "or paste a URL" is clicked', () => {
    render(<ImageUploadField value='' artistId='123' onChange={vi.fn()} />);
    const toggle = screen.getByText('or paste a URL');
    fireEvent.click(toggle);
    expect(screen.getByPlaceholderText(/https:\/\/example.com\/image/)).toBeTruthy();
  });
});

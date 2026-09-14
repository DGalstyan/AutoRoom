import { describe, expect, it } from 'vitest';
import { toYouTubeEmbedUrl } from '@/lib/youtube';

describe('toYouTubeEmbedUrl', () => {
  it('converts a standard watch URL', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('converts a watch URL with extra query params (playlist position etc.)', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ&list=PL123&t=42s')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('converts a youtu.be short link', () => {
    expect(toYouTubeEmbedUrl('https://youtu.be/aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('converts a youtu.be short link with a query string', () => {
    expect(toYouTubeEmbedUrl('https://youtu.be/aqz-KE-bpKQ?t=10')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('passes through an already-correct embed URL, normalized to the nocookie host', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/embed/aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('converts a Shorts link', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/shorts/aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('accepts a bare www-less host and the mobile host', () => {
    expect(toYouTubeEmbedUrl('https://youtube.com/watch?v=aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
    expect(toYouTubeEmbedUrl('https://m.youtube.com/watch?v=aqz-KE-bpKQ')).toBe(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    );
  });

  it('returns null for a non-YouTube URL', () => {
    expect(toYouTubeEmbedUrl('https://example.com/video.mp4')).toBeNull();
  });

  it('returns null for a YouTube URL with no recognizable video id', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/channel/UC123')).toBeNull();
  });

  it('returns null for a malformed URL instead of throwing', () => {
    expect(toYouTubeEmbedUrl('not a url')).toBeNull();
  });
});

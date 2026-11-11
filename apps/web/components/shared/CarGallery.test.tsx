import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CarGallery } from '@/components/shared/CarGallery';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';
import type { CarImage } from '@/lib/types/car';

const t = getMessagesForLocale('hy').common.carDetail.gallery;

const image = (id: string, album: CarImage['album']): CarImage => ({
  id,
  carId: 'car_1',
  url: `https://cdn.example.com/${id}.jpg`,
  thumbnailUrl: null,
  album,
  position: 0,
});

const IMAGES = [
  image('e1', 'EXTERIOR'),
  image('e2', 'EXTERIOR'),
  image('e3', 'EXTERIOR'),
  image('i1', 'INTERIOR'),
  image('i2', 'INTERIOR'),
  image('d1', 'DETAILS'),
];

describe('CarGallery', () => {
  it('has no previous/next buttons or counter over the photo (the design has none)', () => {
    renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    expect(screen.queryByRole('button', { name: t.next })).toBeNull();
    expect(screen.queryByRole('button', { name: t.previous })).toBeNull();
    expect(screen.queryByText('1 / 3')).toBeNull();
  });

  it('always renders all four tabs', () => {
    renderWithLocale(<CarGallery images={[...IMAGES, image('v1', 'VIDEO')]} alt="Li Auto L9" />);
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      t.exterior,
      t.interior,
      t.details,
      t.video,
    ]);
  });

  it('shows the thumbnail strip even when an album has a single photo, the empty tabs disabled', () => {
    renderWithLocale(<CarGallery images={[image('e1', 'EXTERIOR')]} alt="Honda CR-V" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((tab) => (tab as HTMLButtonElement).disabled)).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(document.querySelector('button[aria-current="true"]')).not.toBeNull();
  });

  it('lists the four tabs with their photo counts', () => {
    renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      t.exterior,
      t.interior,
      t.details,
      t.video,
    ]);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      `${t.exterior} (3)`,
      `${t.interior} (2)`,
      `${t.details} (1)`,
      `${t.video} (0)`,
    ]);
    fireEvent.click(screen.getByRole('tab', { name: new RegExp(t.interior) }));
    expect(screen.getByRole('tab', { name: new RegExp(t.interior) })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('names each thumbnail by album and marks the current one', () => {
    renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    const first = screen.getByRole('button', {
      name: `${t.exterior} ${t.photoLabel.replace('{n}', '1')}`,
    });
    expect(first).toHaveAttribute('aria-current', 'true');
  });

  it('moves with the arrow keys', () => {
    const { container } = renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'ArrowRight' });
    const second = screen.getByRole('button', {
      name: `${t.exterior} ${t.photoLabel.replace('{n}', '2')}`,
    });
    expect(second).toHaveAttribute('aria-current', 'true');
  });
});

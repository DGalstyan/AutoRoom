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
  it('shows a counter and named previous/next controls that wrap around', () => {
    renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.next }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.previous }));
    fireEvent.click(screen.getByRole('button', { name: t.previous }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('lists Exterior, Interior and Details as tabs with their photo counts', () => {
    renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([t.exterior, t.interior, t.details]);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      `${t.exterior} (3)`,
      `${t.interior} (2)`,
      `${t.details} (1)`,
    ]);
    fireEvent.click(screen.getByRole('tab', { name: new RegExp(t.interior) }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
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

  it('moves with the arrow keys and has no step buttons for a single photo', () => {
    const { container } = renderWithLocale(<CarGallery images={IMAGES} alt="Li Auto L9" />);
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    renderWithLocale(<CarGallery images={[image('x', 'EXTERIOR')]} alt="Solo" />);
    expect(screen.getAllByRole('button', { name: t.next })).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { renderWithLocale } from '@/lib/test-utils';
import { getMessagesForLocale } from '@/lib/i18n';

const brand = getMessagesForLocale('hy').common.brand;

describe('BrandLogo', () => {
  it('falls back to the bundled logo mark when no admin logo has been uploaded', () => {
    renderWithLocale(<BrandLogo />);
    const img = screen.getByAltText(brand);
    // `unoptimized` bypasses next/image's loader, so `src` is the raw path.
    expect(img).toHaveAttribute('src', '/brand/logo-mark.svg');
  });

  it('falls back to the bundled logo mark when `logo` is explicitly null', () => {
    renderWithLocale(<BrandLogo logo={null} />);
    const img = screen.getByAltText(brand);
    expect(img).toHaveAttribute('src', '/brand/logo-mark.svg');
  });

  it('prefers an admin-uploaded logoLightUrl once one exists', () => {
    renderWithLocale(
      <BrandLogo logo={{ logoLightUrl: 'https://cdn.example.com/light.png', logoDarkUrl: null }} />,
    );
    const img = screen.getByAltText(brand);
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/light.png');
  });

  it('falls back to logoDarkUrl if only that variant was uploaded', () => {
    renderWithLocale(
      <BrandLogo logo={{ logoLightUrl: null, logoDarkUrl: 'https://cdn.example.com/dark.png' }} />,
    );
    const img = screen.getByAltText(brand);
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/dark.png');
  });

  it('still falls back to the bundled mark when both admin fields are null', () => {
    renderWithLocale(<BrandLogo logo={{ logoLightUrl: null, logoDarkUrl: null }} />);
    const img = screen.getByAltText(brand);
    expect(img).toHaveAttribute('src', '/brand/logo-mark.svg');
  });

  it('applies the given box size class so layout never shifts on swap', () => {
    const { container } = renderWithLocale(<BrandLogo className="h-12 w-[126px]" />);
    expect(container.querySelector('span')).toHaveClass('h-12', 'w-[126px]');
  });
});

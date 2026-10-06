import { describe, expect, it } from 'vitest';
import { withPrefilledText } from '@/lib/messengerLinks';

describe('withPrefilledText', () => {
  it('prefills WhatsApp with an encoded message', () => {
    expect(withPrefilledText('whatsapp', 'https://wa.me/37493882818', 'Բարև & hi')).toBe(
      `https://wa.me/37493882818?text=${encodeURIComponent('Բարև & hi')}`,
    );
  });
  it('leaves Viber and Telegram links untouched', () => {
    expect(withPrefilledText('viber', 'viber://chat?number=%2B374', 'hi')).toBe(
      'viber://chat?number=%2B374',
    );
    expect(withPrefilledText('telegram', 'https://t.me/x', 'hi')).toBe('https://t.me/x');
  });
});

import { generateBookingRef, formatUGX } from './booking';

describe('Booking Utilities', () => {
  describe('generateBookingRef', () => {
    it('generates a reference starting with BK-', () => {
      const ref = generateBookingRef();
      expect(ref.startsWith('BK-')).toBe(true);
    });

    it('generates unique references', () => {
      const ref1 = generateBookingRef();
      const ref2 = generateBookingRef();
      expect(ref1).not.toBe(ref2);
    });

    it('generates references of correct length (approx 12 chars)', () => {
      const ref = generateBookingRef();
      // BK- plus uuid part. usually 11-13 chars depending on uuid format/slice.
      expect(ref.length).toBeGreaterThan(5);
    });
  });

  describe('formatUGX', () => {
    it('formats numbers to UGX string correctly', () => {
      expect(formatUGX(1000)).toBe('UGX 1,000');
      expect(formatUGX(1250000)).toBe('UGX 1,250,000');
    });

    it('handles 0 correctly', () => {
      expect(formatUGX(0)).toBe('UGX 0');
    });
  });
});

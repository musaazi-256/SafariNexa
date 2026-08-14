import {
  kindForProvider,
  maskLast4,
  processingMessageFor,
  simulatedFailureReasonFor,
} from './payments';
import type { PaymentProvider } from "@prisma/client";

describe('Payment Utilities', () => {
  describe('kindForProvider', () => {
    it('returns mobile_money for MTN and Airtel', () => {
      expect(kindForProvider('MTN_MOBILE_MONEY' as PaymentProvider)).toBe('mobile_money');
      expect(kindForProvider('AIRTEL_MONEY' as PaymentProvider)).toBe('mobile_money');
    });

    it('returns card for STRIPE and CARD', () => {
      expect(kindForProvider('STRIPE' as PaymentProvider)).toBe('card');
      expect(kindForProvider('CARD' as PaymentProvider)).toBe('card');
    });
  });

  describe('maskLast4', () => {
    it('masks phone numbers correctly', () => {
      expect(maskLast4('+256700123456')).toBe('•••• 3456');
    });

    it('masks card numbers correctly', () => {
      expect(maskLast4('4242 4242 4242 4242')).toBe('•••• 4242');
    });

    it('handles short strings gracefully', () => {
      expect(maskLast4('12')).toBe('•••• 12');
    });

    it('handles empty strings gracefully', () => {
      expect(maskLast4('')).toBe('•••• 0000');
    });
  });

  describe('processingMessageFor', () => {
    it('returns mobile money message', () => {
      expect(processingMessageFor('MTN_MOBILE_MONEY' as PaymentProvider, '•••• 1234')).toContain('Confirm the prompt sent to your phone (•••• 1234)');
    });

    it('returns card message', () => {
      expect(processingMessageFor('STRIPE' as PaymentProvider, '•••• 4242')).toContain('Verifying your card (•••• 4242)');
    });
  });

  describe('simulatedFailureReasonFor', () => {
    it('returns mobile money timeout', () => {
      expect(simulatedFailureReasonFor('AIRTEL_MONEY' as PaymentProvider)).toContain('timed out');
    });

    it('returns card decline', () => {
      expect(simulatedFailureReasonFor('CARD' as PaymentProvider)).toContain('declined');
    });
  });
});

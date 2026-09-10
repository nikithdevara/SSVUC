import { svucStore } from './store';

/**
 * Centralized Receipt Number Generator & Verification Code Utility
 * Format:
 *  - Monetary: SSV-YYYY-D-XXXXX (e.g., SSV-2026-D-00001)
 *  - Material: SSV-YYYY-M-XXXXX (e.g., SSV-2026-M-00001)
 *
 * Dynamically resolves festival year from central committee settings
 * to ensure yearly sequence isolation and prevent year-over-year collisions.
 */

export function generateReceiptNumber(type: 'MONETARY' | 'MATERIAL', sequence: number, year?: string): string {
  let effectiveYear = year;
  if (!effectiveYear && typeof window !== 'undefined') {
    try {
      const settings = svucStore.getSettings();
      effectiveYear = settings?.festivalYear || settings?.year;
    } catch {
      // fallback
    }
  }
  if (!effectiveYear) {
    effectiveYear = '2026';
  }

  const prefix = type === 'MONETARY' ? 'D' : 'M';
  const paddedSeq = String(sequence).padStart(5, '0');
  return `SSV-${effectiveYear}-${prefix}-${paddedSeq}`;
}

export function generateVerificationCode(receiptNumber: string): string {
  // Cryptographic-styled deterministic verification signature
  return `AUTH-${receiptNumber.replace(/[^A-Z0-9]/gi, '')}-SIG`;
}

export function generateQrData(receiptNumber: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/#/receipt/${receiptNumber}`;
  }
  return `https://siddhivinayaka-utsav.org/#/receipt/${receiptNumber}`;
}

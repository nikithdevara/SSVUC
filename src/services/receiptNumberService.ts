/**
 * Centralized Receipt Number Generator & Verification Code Utility
 * Standard Format:
 *  - Cash Offerings: SSV-YYYY-C-XXXXX (e.g., SSV-2026-C-00001)
 *  - UPI / Online Offerings: SSV-YYYY-O-XXXXX (e.g., SSV-2026-O-00001)
 *  - Material Contributions: SSV-YYYY-M-XXXXX (e.g., SSV-2026-M-00001)
 *
 * Fully decoupled and crash-proof.
 */

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function getStoredFestivalYear(): string {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('svuc_settings_2026_clean');
      if (raw) {
        const parsed = JSON.parse(raw);
        return safeStr(parsed?.festivalYear) || safeStr(parsed?.year) || '2026';
      }
    } catch {
      // fallback
    }
  }
  return '2026';
}

export function generateReceiptNumber(
  type: 'MONETARY' | 'MATERIAL' | 'CASH' | 'ONLINE' | 'UPI',
  sequence: number,
  year?: string,
  paymentMethod?: string
): string {
  const effectiveYear = safeStr(year) || getStoredFestivalYear() || '2026';
  const method = safeStr(paymentMethod).toLowerCase();

  let prefix = 'O'; // default to Online/UPI
  if (type === 'MATERIAL') {
    prefix = 'M';
  } else if (
    type === 'CASH' ||
    method === 'cash' ||
    method === 'cash handover'
  ) {
    prefix = 'C';
  } else {
    prefix = 'O';
  }

  const num = Math.max(1, typeof sequence === 'number' && !isNaN(sequence) ? sequence : 1);
  const paddedSeq = String(num).padStart(5, '0');
  return `SSV-${effectiveYear}-${prefix}-${paddedSeq}`;
}

export function standardizeReceiptNumber(
  receiptId: string | undefined,
  type: 'MONETARY' | 'MATERIAL',
  paymentMethod?: string,
  indexFallback: number = 1
): string {
  const raw = safeStr(receiptId);
  const method = safeStr(paymentMethod).toLowerCase();

  if (!raw) {
    return generateReceiptNumber(type, indexFallback, '2026', paymentMethod);
  }

  const clean = raw.toUpperCase();

  // If already matches standard SSV-YYYY-[COM]-XXXXX
  const standardMatch = clean.match(/^SSV-(\d{4})-([COM])-(\d+)$/i);
  if (standardMatch) {
    const yr = standardMatch[1];
    let code = standardMatch[2];
    const num = parseInt(standardMatch[3], 10);
    if (type === 'MONETARY') {
      const isCash = method === 'cash' || method === 'cash handover';
      code = isCash ? 'C' : 'O';
    } else {
      code = 'M';
    }
    return `SSV-${yr}-${code}-${String(num).padStart(5, '0')}`;
  }

  // Parse sequence number from old format (e.g., REC-2026-014, SSV-2026-D-00008, REC-MAT-005)
  const nums = clean.match(/\d+/g);
  let seq = indexFallback;
  if (nums && nums.length > 0) {
    const nonYear = nums.filter((n) => n !== '2026');
    if (nonYear.length > 0) {
      const parsed = parseInt(nonYear[nonYear.length - 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        seq = parsed;
      }
    } else {
      const parsed = parseInt(nums[nums.length - 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        seq = parsed;
      }
    }
  }

  return generateReceiptNumber(type, seq, '2026', paymentMethod);
}

export function generateVerificationCode(receiptNumber: string): string {
  const clean = safeStr(receiptNumber).replace(/[^A-Z0-9]/gi, '');
  return `AUTH-${clean || 'RECEIPT'}-SIG`;
}

export function generateQrData(receiptNumber: string): string {
  const clean = safeStr(receiptNumber);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/#/receipt/${clean}`;
  }
  return `https://siddhivinayaka-utsav.org/#/receipt/${clean}`;
}

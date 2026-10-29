/**
 * PaySocial Account Number Generator & Banking Utilities
 * Provides automatic generation, validation, formatting, and masking
 * for user payment account numbers.
 */

export const PAYSOCIAL_DEFAULT_ROUTING = '021000021';
export const PAYSOCIAL_BANK_NAME = 'PaySocial Federal Digital Clearing';
export const PAYSOCIAL_ACCOUNT_TYPE = 'Checking & Instant Pay';

/**
 * Deterministically or pseudo-randomly generates a unique 10-digit account number.
 * Starts with prefix '88' (PaySocial ecosystem designation).
 */
export function generateAccountNumber(seed?: string): string {
  if (seed && seed.trim()) {
    let hash = 0;
    const str = seed.trim();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    // Produce a positive 8-digit sequence padded with 0s
    const positiveHash = Math.abs(hash);
    const padded = String(positiveHash).padStart(8, '47291845').slice(0, 8);
    return `88${padded}`;
  }

  // 10 digits total: '88' + 8 random digits
  const randomEightDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `88${randomEightDigits}`;
}

/**
 * Formats a 10-digit account number into clean grouped blocks: 8849 201 842
 */
export function formatAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '';
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Masks an account number for security: •••• 8421
 */
export function maskAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return '•••• ----';
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `•••• ${digits.slice(-4)}`;
  }
  return `•••• ${digits}`;
}

/**
 * Validates whether an entered string is a valid PaySocial 10-digit account number
 */
export function isValidAccountNumber(accountNumber?: string): boolean {
  if (!accountNumber) return false;
  const digits = accountNumber.replace(/\D/g, '');
  return digits.length === 10;
}

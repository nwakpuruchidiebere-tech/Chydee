export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', decimals: 0 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', decimals: 2 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', decimals: 2 },
];

export const CURRENCY_MAP: Record<string, CurrencyConfig> = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr;
  return acc;
}, {} as Record<string, CurrencyConfig>);

export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) return '$';
  return CURRENCY_MAP[currencyCode.toUpperCase()]?.symbol || '$';
};

export const getCurrencyFlag = (currencyCode?: string): string => {
  if (!currencyCode) return '💵';
  return CURRENCY_MAP[currencyCode.toUpperCase()]?.flag || '💵';
};

export const formatCurrencyAmount = (amount: number, currencyCode = 'USD'): string => {
  const config = CURRENCY_MAP[currencyCode.toUpperCase()] || { symbol: '$', decimals: 2 };
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  return `${config.symbol}${formattedNumber}`;
};

export interface ExchangeRatesResponse {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  source: string;
  cached?: boolean;
  isFallback?: boolean;
}

/**
 * Fetches real-time exchange rates from server backend proxy.
 */
export async function fetchExchangeRates(base = 'USD', force = false): Promise<ExchangeRatesResponse> {
  const url = `/api/exchange-rates?base=${encodeURIComponent(base)}${force ? '&force=true' : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }
  return response.json();
}

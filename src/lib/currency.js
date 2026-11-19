export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'PKR'];

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: CURRENCIES.includes(currency) ? currency : 'USD',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatCurrencyCode(amount, currency = 'USD') {
  return `${CURRENCIES.includes(currency) ? currency : 'USD'} ${(Number(amount) || 0).toLocaleString()}`;
}

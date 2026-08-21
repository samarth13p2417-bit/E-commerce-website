export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return currency === 'INR' ? '₹0' : '$0';
  }

  const num = Number(amount);
  const symbolMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: '$'
  };

  const symbol = symbolMap[currency] || (currency === 'INR' ? '₹' : '$');
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  return `${symbol}${num.toLocaleString(locale)}`;
};

export const getCurrencySymbol = (currency = 'INR') => {
  const symbolMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: '$'
  };
  return symbolMap[currency] || (currency === 'INR' ? '₹' : '$');
};

/**
 * Currency utility strictly formatting to Indian Rupees (INR).
 * E.g., formatCurrency(1250) -> '₹ 1,250.00'
 */
export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `₹ ${formatted}`;
}

export default formatCurrency;

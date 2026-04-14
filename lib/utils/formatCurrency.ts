export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "es-BO"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPrice(amount: number, currency: string = "USD"): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("es-BO")}`;
  }
  if (currency === "BOB") {
    return `Bs. ${amount.toLocaleString("es-BO")}`;
  }
  return formatCurrency(amount, currency);
}

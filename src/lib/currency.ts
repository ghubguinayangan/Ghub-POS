export function formatToPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

// Locale pinned to 'en-PH' so the server-rendered HTML and the client's
// hydration pass always compute the identical string - relying on the
// runtime's default locale causes a React hydration mismatch when the
// server's Node.js locale differs from the visitor's browser locale.
export function formatNumberPH(value: number): string {
  return new Intl.NumberFormat('en-PH').format(value);
}

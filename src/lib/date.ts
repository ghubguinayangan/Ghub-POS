// Locale and timeZone are pinned explicitly so the server-rendered HTML and
// the client's hydration pass always compute the identical string. Calling
// toLocaleDateString()/toLocaleString() with no arguments uses whatever
// locale/timezone the current runtime defaults to, which differs between
// the server (Node.js) and a visitor's browser - causing a React hydration
// mismatch. See: https://nextjs.org/docs/messages/react-hydration-error

export function formatDatePH(date: Date | string | number): string {
  return new Date(date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' });
}

export function formatDateTimePH(date: Date | string | number): string {
  return new Date(date).toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
}

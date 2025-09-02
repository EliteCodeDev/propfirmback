import { randomInt } from 'crypto';

export function generateRandomPassword(length = 8): string {
  if (length < 4) throw new Error('La longitud mínima del password debe ser 4');

  const sets = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '*@#&%+!?',
  ];

  const pick = (s: string) => s[randomInt(s.length)];
  const pool = sets.join('');

  // 1 de cada set + resto desde el pool
  const chars = [
    ...sets.map(pick),
    ...Array.from({ length: length - 4 }, () => pick(pool)),
  ];

  // Fisher–Yates con randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

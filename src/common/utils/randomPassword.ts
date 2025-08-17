import * as nodeCrypto from 'crypto';
export function generateRandomPassword(length = 8) {
  return nodeCrypto
    .randomBytes(length)
    .toString('base64') // caracteres seguros en base64
    .slice(0, length);
}

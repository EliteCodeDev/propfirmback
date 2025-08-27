import * as nodeCrypto from 'crypto';
export function generateRandomPassword(length = 8) {
  // Caracteres especiales seguros para JSON
  const specialChars = ['*', '@', '#', '&', '%', '+', '=', '!', '?'];
  
  // Generar password base
  let password = nodeCrypto
    .randomBytes(length - 1)
    .toString('base64')
    .replace(/[+/=]/g, '') // Remover caracteres problemáticos de base64
    .slice(0, length - 1);
  
  // Agregar un carácter especial aleatorio
  const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Insertar el carácter especial en una posición aleatoria
  const insertPosition = Math.floor(Math.random() * password.length);
  password = password.slice(0, insertPosition) + randomSpecialChar + password.slice(insertPosition);
  
  return password.slice(0, length);
}

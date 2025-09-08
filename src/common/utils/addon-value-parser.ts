/**
 * Utilidad para parsear valores de addons según su tipo
 */

/**
 * Parsea el valor de un RelationAddon según el valueType de su addon correspondiente
 * @param value - El valor crudo del RelationAddon
 * @param valueType - El tipo de valor esperado del addon
 * @returns El valor parseado según el tipo especificado
 */
export function parseAddonValue(
  value: number | boolean | null | undefined,
  valueType: 'number' | 'boolean' | 'percentage' | null | undefined,
): number | boolean | null {
  // Si no hay valor o tipo, retornar null
  if (value === null || value === undefined || !valueType) {
    return null;
  }

  switch (valueType) {
    case 'boolean':
      // Si el valor es boolean, retornarlo directamente
      if (typeof value === 'boolean') {
        return value;
      }
      // Si es número, convertir: 0 = false, cualquier otro = true
      if (typeof value === 'number') {
        return value !== 0;
      }
      return null;

    case 'number':
    case 'percentage':
      // Si el valor es número, retornarlo directamente
      if (typeof value === 'number') {
        return value;
      }
      // Si es boolean, convertir: true = 1, false = 0
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return null;

    default:
      return null;
  }
}

/**
 * Verifica si un valor es válido para el tipo especificado
 * @param value - El valor a verificar
 * @param valueType - El tipo de valor esperado
 * @returns true si el valor es válido para el tipo
 */
export function isValidAddonValue(
  value: number | boolean | null | undefined,
  valueType: 'number' | 'boolean' | 'percentage' | null | undefined,
): boolean {
  if (value === null || value === undefined || !valueType) {
    return false;
  }

  switch (valueType) {
    case 'boolean':
      return typeof value === 'boolean' || typeof value === 'number';
    case 'number':
    case 'percentage':
      return typeof value === 'number' || typeof value === 'boolean';
    default:
      return false;
  }
}

/**
 * Obtiene el valor numérico de un addon para cálculos matemáticos
 * @param value - El valor del RelationAddon
 * @param valueType - El tipo de valor del addon
 * @returns El valor numérico para usar en cálculos, o null si no es aplicable
 */
export function getNumericAddonValue(
  value: number | boolean | null | undefined,
  valueType: 'number' | 'boolean' | 'percentage' | null | undefined,
): number | null {
  const parsedValue = parseAddonValue(value, valueType);
  
  if (parsedValue === null) {
    return null;
  }

  if (typeof parsedValue === 'number') {
    return parsedValue;
  }

  if (typeof parsedValue === 'boolean') {
    return parsedValue ? 1 : 0;
  }

  return null;
}
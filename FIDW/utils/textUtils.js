// utils/textUtils.js

/**
 * Capitaliza la primera letra de un string.
 * Ejemplo: "hola mundo" → "Hola mundo"
 * @param {string} str - Texto a capitalizar
 * @returns {string}
 */
export function capitalizeFirstLetter(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

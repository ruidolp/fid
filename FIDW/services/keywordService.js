import { pool } from '../database/db.js';
import { GET_FLOW_BY_KEYWORD } from '../database/queries.js';

/**
 * Devuelve el nombre del flujo asociado a una palabra clave registrada.
 * @param {string} keyword - Palabra clave del mensaje (ej. 'registrarme', 'encuesta')
 * @returns {string|null} - Nombre del flujo asociado o null si no hay coincidencia
 */
export const getFlowByKeyword = async (keyword) => {
  try {
    const result = await pool.query(GET_FLOW_BY_KEYWORD, [keyword.toLowerCase()]);
    return result.rows.length > 0 ? result.rows[0].flow_name : null;
  } catch (error) {
    console.error('❌ Error en getFlowByKeyword:', error);
    return null;
  }
};

/**
 * Evalúa si el mensaje contiene alguna palabra clave para iniciar un flujo especial.
 * Actualmente evalúa coincidencia exacta. Se puede mejorar con NLP en el futuro.
 * @param {string} text - Texto del mensaje recibido
 * @returns {string|null} - Nombre del flujo si se detecta uno, o null
 */
export const resolveInitialFlow = async (text) => {
  if (!text) return null;
  return await getFlowByKeyword(text.trim().toLowerCase());
};
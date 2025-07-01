import { pool } from '../database/db.js';
import { logger } from '../utils/logger.js';
import {
  GET_USER_BY_PHONE,
  INSERT_USER,
  GET_ACTIVE_ANSWERS_BY_PHONE
} from '../database/queries.js';


/**
 * Verifica si el usuario está registrado en la base de datos.
 * @param {string} phone - Número de teléfono del usuario
 * @returns {object|null} - Datos del usuario o null si no existe
 */
export const isUserRegistered = async (phone) => {
  try {
    const result = await pool.query(GET_USER_BY_PHONE, [phone]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('❌ Error en isUserRegistered:', error);
    return null;
  }
};

/**
 * Crea un nuevo usuario si no existe previamente.
 * @param {string} phone - Número de teléfono del usuario
 */
export const createUserIfNotExists = async (phone) => {
  try {
    logger.info(`👤 Ejecutando createUserIfNotExists para ${phone}`);
    await pool.query(INSERT_USER, [phone]);
  } catch (error) {
    logger.error('❌ Error en createUserIfNotExists:', error);
  }
};



export const updateUserProfile = async (phone, fieldsToUpdate = {}) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [column, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined && value !== null) {
        fields.push(`${column} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push(`updated_at = NOW()`);
    values.push(phone);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE phone = $${idx};
    `;

    logger.info(`🔧 Ejecutando updateUserProfile para ${phone} con: ${JSON.stringify(fieldsToUpdate)}`);
    await pool.query(query, values);
  } catch (error) {
    logger.error('❌ Error en updateUserProfile:', error);
  }
};

export const getAnswersFromActiveConversation = async (phone) => {
  try {
    const result = await pool.query(GET_ACTIVE_ANSWERS_BY_PHONE, [phone]);
    return result.rows.length > 0 ? result.rows[0].answers : {};
  } catch (error) {
    console.error('❌ Error en getAnswersFromActiveConversation:', error);
    return {};
  }
};
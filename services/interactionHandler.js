import { pool } from './db.js';
import { sendTextMessage } from './whatsappService.js';
import { logger } from '../utils/logger.js';

/**
 * Procesa el mensaje de un usuario:
 * - Si está registrado en uno o más negocios, lo saluda.
 * - Si no, le pide su nombre.
 */
export const handleIncomingMessage = async (from, text, phoneNumberId) => {
  try {
    const result = await pool.query(`
      SELECT u.name, b.name AS business_name
      FROM users u
      JOIN user_business ub ON ub.id_user = u.id
      JOIN business b ON b.id = ub.id_business
      WHERE u.phone = $1
      ORDER BY ub.id DESC
      LIMIT 1
    `, [from]);

    if (result.rows.length === 0) {
      logger.info(`🆕 Usuario no registrado (${from}), solicitando nombre`);
      await sendTextMessage(phoneNumberId, from, '¡Hola! ¿Cuál es tu nombre para completar tu registro?');
    } else {
      const { name, business_name } = result.rows[0];
      logger.info(`🙌 Usuario ya registrado (${from}), saludando`);
      await sendTextMessage(phoneNumberId, from, `¡Hola ${name}! Bienvenido nuevamente a ${business_name}.`);
    }
  } catch (error) {
    logger.error('❌ Error en handleIncomingMessage:', error);
  }
};

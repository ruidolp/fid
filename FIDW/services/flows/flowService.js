import { pool } from '../../database/db.js'; // ajusta si tu db.js está en otra ubicación
import {
  FIND_OR_CREATE_USER,
  EXPIRE_FLOWS_FOR_USER,
  START_USER_FLOW,
  GET_ACTIVE_FLOW_FOR_USER,
  COMPLETE_USER_CONVERSATION,
  GET_FLOW_BY_KEYWORD,
} from '../../database/queries.js';



/**
 * Inicia un flujo nuevo para el usuario. Expira los anteriores.
 */
export const startUserFlow = async (phone, flowName) => {
  // 1. Crear usuario si no existe
  await pool.query(FIND_OR_CREATE_USER, [phone]);

  // 2. Expirar flujos anteriores
  await pool.query(EXPIRE_FLOWS_FOR_USER, [phone]);

  // 3. Iniciar nuevo flujo
  await pool.query(START_USER_FLOW, [phone, flowName, 10]); // 10 minutos por defecto
};

/**
 * Marca un flujo como finalizado, usando ID de conversación.
 */
export const completeUserFlow = async (conversationId) => {
  await pool.query(COMPLETE_USER_CONVERSATION, [conversationId]);
};

/**
 * Devuelve la conversación activa del usuario.
 */
export const getActiveFlowForUser = async (phone) => {
  const result = await pool.query(GET_ACTIVE_FLOW_FOR_USER, [phone]);
  return result.rows[0] || null;
};

/**
 * Devuelve el flujo asociado a una palabra clave si está activo.
 */
export const getFlowByKeyword = async (keyword) => {
  const { rows } = await pool.query(GET_FLOW_BY_KEYWORD, [keyword]);
  return rows.length > 0 ? rows[0].flow_name : null;
};

/**
 * Marca como completadas las conversaciones activas del usuario cuyo tiempo de vida (TTL) ha expirado.
 * 
 * @param {number} userId - ID del usuario cuyas conversaciones deben evaluarse.
 * @returns {void}
 *
 * Esta función actualiza los registros en `user_conversations` donde:
 * - `completed = false`
 * - `expires_at <= NOW()`
 * 
 * Es útil para evitar que flujos anteriores interfieran con nuevos flujos iniciados.
 */
export const expireUserFlows = async (userId) => {
  await pool.query(EXPIRE_FLOWS_FOR_USER, [userId]);
};
import { pool } from '../../database/db.js'; // ajusta si tu db.js está en otra ubicación
import {
  FIND_OR_CREATE_USER,
  EXPIRE_FLOWS_FOR_USER,
  START_USER_FLOW,
  GET_ACTIVE_FLOW_FOR_USER,
  COMPLETE_USER_CONVERSATION,
  GET_FLOW_BY_KEYWORD,
  GET_STEPS_BY_FLOW,
  GET_LAST_USER_STEP,
  UPDATE_USER_CONVERSATION_STEP,
  GET_ACTIVE_CONVERSATION_BY_USER_ID
} from '../../database/queries.js';
import { logger } from '../../utils/logger.js';


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




/**
 * Devuelve el siguiente paso válido (activo) para un flujo dado.
 * 
 * @param {string} flowName - Nombre del flujo.
 * @param {number} currentOrder - Orden actual del paso.
 * @returns {Object|null} - El siguiente paso activo o null.
 */
export const getNextValidStep = async (flowName, currentOrder = 0) => {
  const { rows } = await pool.query(GET_STEPS_BY_FLOW, [flowName]);

  for (const step of rows) {
    if (step.display_order > currentOrder && step.active) {
      return step;
    }
  }

  return null;
};

/**
 * Devuelve el último paso completado por el usuario.
 * 
 * @param {number} userId - ID del usuario.
 * @returns {Object|null} - Último paso registrado por el usuario.
 */
export const getCurrentStep = async (userId) => {
  const { rows } = await pool.query(GET_LAST_USER_STEP, [userId]);
  return rows[0] || null;
};

/**
 * Registra el progreso del usuario en el flujo.
 * Si el paso espera input, guarda el mensaje recibido como respuesta.
 * 
 * @param {number} userId - ID del usuario.
 * @param {Object} step - Paso actual del flujo.
 * @param {string|null} input - Texto ingresado por el usuario.
 */
export const saveStepProgress = async (userId, step, input = null) => {
  try {
    const result = await pool.query(GET_ACTIVE_CONVERSATION_BY_USER_ID, [userId]);
    if (result.rows.length === 0) {
      logger.warn(`⚠️ No se encontró conversación activa para user_id=${userId}`);
      return;
    }

    const { id: conversationId, answers } = result.rows[0];
    const updatedAnswers = { ...answers };
console.log('💾 Paso recibido en saveStepProgress:', {
  step_key: step.step_key,
  expects_input: step.expects_input,
  input
});
    if (step.expects_input && input !== null && input.trim() !== '') {
      updatedAnswers[step.step_key] = input.trim();
      logger.info(`💾 Guardando respuesta: ${step.step_key} = ${input}`);
    }

    await pool.query(UPDATE_USER_CONVERSATION_STEP, [
      conversationId,
      step.step_key,
      updatedAnswers
    ]);
  } catch (error) {
    logger.error('❌ Error en saveStepProgress:', error);
  }
};

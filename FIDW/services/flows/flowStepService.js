import { pool } from '../../database/db.js';
import {
  GET_STEPS_BY_FLOW,
  GET_LAST_USER_STEP,
  UPDATE_USER_CONVERSATION_STEP,
  GET_ACTIVE_CONVERSATION_BY_USER_ID
} from '../../database/queries.js';
import { logger } from '../../utils/logger.js';

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

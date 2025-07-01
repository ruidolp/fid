/*
import { getActiveFlowForUser, completeUserFlow } from './flowService.js';
import { getNextValidStep, getCurrentStep, saveStepProgress } from './flowStepService.js';
import { executeEffect } from './flowEffects.js';
import { sendTextMessage } from '../whatsappService.js'; // 👈 usa la función correcta

/**
 * Resuelve el siguiente paso del flujo para un usuario dado.
 * @param {string} phone - Número de teléfono del usuario.
 * @param {string} message - Mensaje recibido (input del usuario).
 * @param {string} phoneNumberId - ID del número de teléfono de la cuenta de WhatsApp Business.
 *
export const resolveFlowStep = async (phone, message, phoneNumberId) => {
  const flow = await getActiveFlowForUser(phone);
  if (!flow) return;

  let currentStep = await getCurrentStep(flow.user_id);
  let nextStep;

  // Bucle para saltar pasos inactivos
  while (true) {
    nextStep = await getNextValidStep(flow.flow_name, currentStep?.display_order || 0);
    if (!nextStep) return; // flujo mal definido o sin pasos activos
    if (nextStep.active) break;
    currentStep = nextStep;
  }

  // Ejecutar efecto si corresponde (solo si hay input o es paso automático)
  if (nextStep.effect && (!nextStep.expects_input || message.trim())) {
    await executeEffect(nextStep.effect, phone, message, phoneNumberId);
  }

  // Guardar progreso con input del usuario (si aplica)
  await saveStepProgress(flow.user_id, nextStep, message);

  // Si es el paso final, marca la conversación como completada
  if (nextStep.is_final) {
    await completeUserFlow(flow.id);
    return;
  }

  // Si el paso espera input, envía la pregunta al usuario
  if (nextStep.expects_input) {
    return await sendTextMessage(phoneNumberId, phone, nextStep.question_text);
  } else {
    // Si el paso no espera input, continuar automáticamente con el siguiente
    return await resolveFlowStep(phone, message, phoneNumberId);
  }
};
*/


import { getActiveFlowForUser, completeUserFlow } from './flowService.js';
import { getNextValidStep, getCurrentStep, saveStepProgress } from './flowStepService.js';
import { executeEffect } from './flowEffects.js';
import { sendTextMessage } from '../whatsappService.js';

/**
 * Resuelve el siguiente paso del flujo para un usuario dado.
 * @param {string} phone - Número de teléfono del usuario.
 * @param {string} message - Mensaje recibido (input del usuario).
 * @param {string} phoneNumberId - ID del número de teléfono de la cuenta de WhatsApp Business.
 */
export const resolveFlowStep = async (phone, message, phoneNumberId) => {
  const flow = await getActiveFlowForUser(phone);
  if (!flow) return;

  let currentStep = await getCurrentStep(flow.user_id);
  let nextStep;

  // Buscar el siguiente paso activo
  while (true) {
    nextStep = await getNextValidStep(flow.flow_name, currentStep?.display_order || 0);
    if (!nextStep) return; // flujo mal definido
    if (nextStep.active) break;
    currentStep = nextStep;
  }

  // 🚫 No continuar si espera input pero aún no lo recibimos
  if (nextStep.expects_input && (!message || !message.trim())) {
    // Enviar la pregunta si aún no se ha enviado
    return await sendTextMessage(phoneNumberId, phone, nextStep.question_text);
  }

  // ✅ Ejecutar efecto si existe
  if (nextStep.effect) {
    await executeEffect(nextStep.effect, phone, message, phoneNumberId);
  }

  // 💾 Guardar progreso (solo guarda input si corresponde)
  const inputToSave = nextStep.expects_input ? message.trim() : null;
  await saveStepProgress(flow.user_id, nextStep, inputToSave);

  // ✔️ Completa si es final
  if (nextStep.is_final) {
    await completeUserFlow(flow.id);
    return;
  }

  // Si el siguiente paso también es automático, avanza recursivamente
  return await resolveFlowStep(phone, '', phoneNumberId);
};

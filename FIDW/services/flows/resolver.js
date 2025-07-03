
import { getActiveFlowForUser,
  completeUserFlow, 
  getNextValidStep, 
  getCurrentStep, 
  saveStepProgress } 
  from './service.js';
import { executeEffect } from './effects.js';
import { sendTextMessage } from '../whatsapp.js';

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

import {
  createUserIfNotExists,
  updateUserProfile,
  getAnswersFromActiveConversation
} from '../userService.js';

import { sendTextMessage } from '../whatsappService.js';

/**
 * Diccionario de efectos por paso de flujo
 */
const effectHandlers = {
  REGISTER_USER: async (phone) => {
    await createUserIfNotExists(phone);
  },

  SAVE_NAME: async (phone) => {
    const answers = await getAnswersFromActiveConversation(phone);
    const name = answers?.name || '';
    await updateUserProfile(phone, { name });
  },

  SAVE_MAIL: async (phone) => {
    const answers = await getAnswersFromActiveConversation(phone);
    const mail = answers?.mail || '';
    await updateUserProfile(phone, { mail });
  },

  CONFIGURE_CLUB: async (phone, _input, phoneNumberId) => {
    await updateUserProfile(phone, { joined_club: true });

    await sendTextMessage(
      phoneNumberId,
      phone,
      '🎯 ¡Gracias! Hemos terminado tu registro exitosamente. Si necesitas ayuda, escribe "menú".'
    );
  }
};

/**
 * Ejecuta un efecto si está registrado.
 */
export const executeEffect = async (effectName, phone, input, phoneNumberId) => {
  const handler = effectHandlers[effectName];
  if (!handler) return;

  const paramCount = handler.length;
  if (paramCount === 1) {
    await handler(phone);
  } else if (paramCount === 2) {
    await handler(phone, input);
  } else {
    await handler(phone, input, phoneNumberId);
  }
};

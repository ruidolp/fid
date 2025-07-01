import { logger } from '../utils/logger.js';
import { routeMessage } from './router/messageRouter.js';

/**
 * Procesa el cuerpo recibido desde Meta y ejecuta acciones correspondientes
 */
export async function processIncomingMessage(body) {
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (value?.messages?.length > 0) {
    const phoneNumberId = value.metadata.phone_number_id;
    const from = value.messages[0].from;
    const text = value.messages[0].text?.body;

    await routeMessage(from, text, phoneNumberId);
  }
}

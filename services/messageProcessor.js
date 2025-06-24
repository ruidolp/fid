import { logger } from '../utils/logger.js';
import { handleIncomingMessage } from './interactionHandler.js';

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

    logger.info(`📥 Nuevo mensaje de ${from}: "${text}"`);
    await handleIncomingMessage(from, text, phoneNumberId);
  }

  if (value?.statuses?.length > 0) {
    const status = value.statuses[0];
    logger.info(`📦 Estado de mensaje:
🆔 ID: ${status.id}
📬 Destinatario: ${status.recipient_id}
📈 Estado: ${status.status}
🕓 Timestamp: ${status.timestamp}`);

    if (status.conversation) {
      logger.info(`💬 Conversación ID: ${status.conversation.id}`);
    }
    if (status.pricing) {
      logger.info(`💵 Categoría: ${status.pricing.category}`);
    }
  }
}

import fetch from 'node-fetch';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Envía un mensaje de texto a través de la API de WhatsApp
 * @param {string} phoneNumberId - ID del número de teléfono de la API
 * @param {string} recipient - Número del destinatario (ej: 56912345678)
 * @param {string} message - Mensaje a enviar
 * @returns {Object|null} - Respuesta JSON o null si falló
 */
export const sendTextMessage = async (phoneNumberId, recipient, message) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`❌ Fallo al enviar mensaje a ${recipient}: ${response.status} ${response.statusText}`);
      logger.error(`🔍 Respuesta de API: ${JSON.stringify(data)}`);
      return null;
    }

    logger.info(`✅ Mensaje enviado a ${recipient}`);
    return data;

  } catch (error) {
    logger.error(`❌ Error de red enviando mensaje a ${recipient}: ${error.message}`);
    return null;
  }
};

/**
 * Envía un mensaje interactivo (botón o lista) a WhatsApp, ya construido previamente.
 *
 * @param {string} phoneNumberId - ID del número de teléfono.
 * @param {string} recipient - Número del usuario.
 * @param {Object} payload - Objeto completo con el mensaje interactivo ya listo.
 * @returns {Object|null}
 */
export const sendInteractiveMessage = async (phoneNumberId, recipient, payload) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        ...payload
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`❌ Error al enviar mensaje interactivo a ${recipient}: ${response.status}`);
      logger.error(`🔍 Detalle: ${JSON.stringify(data)}`);
      return null;
    }

    logger.info(`✅ Menú interactivo enviado a ${recipient}`);
    return data;

  } catch (error) {
    logger.error(`❌ Error general al enviar mensaje interactivo: ${error.message}`);
    return null;
  }
};



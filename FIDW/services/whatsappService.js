import fetch from 'node-fetch';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getMenuOptionsById } from '../database/queries.js';
import { pool } from '../database/db.js';

const interactiveType = config.interactiveType;

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
 * Envía un mensaje interactivo (botón o lista) según configuración y datos de la base de datos.
 */
export const sendInteractiveMessage = async (phoneNumberId, recipient, menuId) => {
  try {
    const menuOptionsResult = await pool.query(getMenuOptionsById, [menuId]);

    if (menuOptionsResult.rows.length === 0) {
      logger.warn(`⚠️ No se encontraron opciones de menú para '${menuId}'`);
      return;
    }

    const menuOptions = menuOptionsResult.rows;

    let interactive = null;

    if (interactiveType === 'button') {
      interactive = {
        type: 'button',
        body: { text: 'Selecciona una opción:' },
        action: {
          buttons: menuOptions.map(opt => ({
            type: 'reply',
            reply: {
              id: opt.option_id,
              title: opt.option_title
            }
          }))
        }
      };
    } else if (interactiveType === 'list') {
      interactive = {
        type: 'list',
        body: { text: 'Selecciona una opción:' },
        action: {
          button: 'Ver opciones',
          sections: [{
            title: 'Opciones',
            rows: menuOptions.map(opt => ({
              id: opt.option_id,
              title: opt.option_title,
              description: opt.option_description || ''
            }))
          }]
        }
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'interactive',
      interactive
    };

    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`❌ Error al enviar mensaje interactivo: ${response.status} ${response.statusText}`);
      logger.error(`🔍 Respuesta: ${JSON.stringify(data)}`);
    } else {
      logger.info(`✅ Menú interactivo enviado a ${recipient}`);
    }

    return data;
  } catch (error) {
    logger.error(`❌ Error enviando menú interactivo a ${recipient}: ${error.message}`);
  }
};

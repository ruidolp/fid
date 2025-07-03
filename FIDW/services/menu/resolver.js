// services/menu/resolver.js

import { pool } from '../../database/db.js';
import { COMPLETE_ACTIVE_MENU_FOR_USER } from '../../database/queries.js';
import { startUserFlow } from '../flows/service.js';
import { sendInitialMenu } from './service.js';
import { sendTextMessage } from '../whatsapp.js';
import * as effects from './effects.js';

/**
 * Ejecuta la acción correspondiente a una opción seleccionada del menú.
 *
 * @param {Object} option - Opción seleccionada desde la base de datos
 * @param {string} phone - Número del usuario
 * @param {string} phoneNumberId - ID de WhatsApp para enviar respuestas
 */
export const resolveMenuOption = async (option, phone, phoneNumberId) => {
  try {
    const { effect, effect_target } = option;

    // ✅ Cierra el menú actual antes de ejecutar la acción
    await pool.query(COMPLETE_ACTIVE_MENU_FOR_USER, [phone]);

    switch (effect) {
      case 'OPEN_MENU':
        await sendInitialMenu(phone, phoneNumberId, effect_target);
        break;

      case 'START_FLOW':
        await startUserFlow(phone, effect_target);
        break;

      case 'FUNCTION':
        const fn = effects[effect_target];
        if (typeof fn === 'function') {
          await fn(phone, phoneNumberId); // ✅ orden correcto
        } else {
          await sendTextMessage(phoneNumberId, phone, '⚠️ Función no disponible.');
        }
        break;

      default:
        await sendTextMessage(phoneNumberId, phone, '⚠️ Acción no reconocida.');
    }

  } catch (error) {
    console.error('❌ Error en resolveMenuOption:', error);
    await sendTextMessage(phoneNumberId, phone, '⚠️ Hubo un problema al procesar tu solicitud.');
  }
};

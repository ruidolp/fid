import { pool } from '../database/db.js';
import { messages } from '../config/messages.js';
import { sendTextMessage } from '../services/whatsapp.js';
import { GET_LAST_CONVERSATION_FOR_USER, GET_USER_BY_PHONE } from '../database/queries.js';
import { config } from '../config/index.js';
import { capitalizeFirstLetter } from '../utils/textUtils.js';

const TTL_HELLO = config.ttl_hello;

/**
 * Envía un mensaje fijo desde messages.js
 * @param {string} key - Ruta tipo 'fallback.opcionDesconocida'
 * @param {string} phone
 * @param {string} phoneNumberId
 * @param {object} params - Reemplazos tipo { nombre: 'Juan' }
 */
export const sendFixedMessage = async (key, phone, phoneNumberId, params = {}) => {
  const keys = key.split('.');
  let text = messages;

  for (const k of keys) {
    text = text?.[k];
    if (!text) break;
  }

  if (!text) {
    console.error(`❌ Mensaje no encontrado: ${key}`);
    return;
  }

  // Reemplazar {{var}} si vienen parámetros
  const finalMessage = text.replace(/{{(.*?)}}/g, (_, k) => params[k] || '');
  await sendTextMessage(phoneNumberId, phone, finalMessage);
};

/**
 * Envía un saludo personalizado al usuario según su nombre y última conversación.
 * Decide si es un saludo largo o corto, o sin nombre.
 */
export const sendGreeting = async (phone, phoneNumberId) => {
  // Última conversación del usuario
  const { rows: convRows } = await pool.query(GET_LAST_CONVERSATION_FOR_USER, [phone]);
  const last = convRows[0];

  const now = new Date();
  const lastUpdated = last?.updated_at ? new Date(last.updated_at) : null;
  const mins = lastUpdated ? Math.floor((now - lastUpdated) / 60000) : null;

  // Nombre del usuario
  const { rows: userRows } = await pool.query(GET_USER_BY_PHONE, [phone]);
  const nameRaw = userRows[0]?.name;
  const name = nameRaw ? capitalizeFirstLetter(nameRaw) : null;

  if (name) {
    const key = mins === null || mins >= TTL_HELLO
      ? 'saludos.bienvenida'
      : 'saludos.retorno';
    await sendFixedMessage(key, phone, phoneNumberId, { nombre: name });
  } else {
    const key = last?.flow_name === 'registro'
      ? 'saludos.sinNombre'
      : 'saludos.sinNombreOtros';
    await sendFixedMessage(key, phone, phoneNumberId);
  }
};

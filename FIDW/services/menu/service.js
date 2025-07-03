import { pool } from '../../database/db.js';
import {
  FIND_OR_CREATE_USER,
  EXPIRE_MENUS_FOR_USER,
  START_USER_MENU,
  GET_ACTIVE_MENU_FOR_USER,
  COMPLETE_USER_CONVERSATION,
  GET_MENU_OPTIONS,
  GET_MENU_BY_NAME,
  GET_OPTION_BY_ID,
  GET_MENU_BY_KEYWORD
} from '../../database/queries.js';

import { logger } from '../../utils/logger.js';
import { buildInteractivePayload } from '../../utils/interactiveBuilder.js';
import { sendInteractiveMessage } from '../whatsapp.js';
import { resolveMenuOption } from './resolver.js';

export const startUserMenu = async (phone, menuName) => {
  await pool.query(FIND_OR_CREATE_USER, [phone]);
  await pool.query(EXPIRE_MENUS_FOR_USER, [phone]);
  await pool.query(START_USER_MENU, [phone, menuName, 10]);
  logger.info(`📋 Menú '${menuName}' iniciado para ${phone}`);
};

export const getActiveMenuForUser = async (phone) => {
  const result = await pool.query(GET_ACTIVE_MENU_FOR_USER, [phone]);
  return result.rows[0] || null;
};

export const completeUserMenu = async (conversationId) => {
  await pool.query(COMPLETE_USER_CONVERSATION, [conversationId]);
  logger.info(`✅ Conversación de menú ${conversationId} marcada como completada.`);
};

export const expireUserMenus = async (phone) => {
  await pool.query(EXPIRE_MENUS_FOR_USER, [phone]);
};

export const getMenuByName = async (menuName) => {
  const { rows } = await pool.query(GET_MENU_BY_NAME, [menuName]);
  return rows.length > 0 ? rows[0] : null;
};

export const getMenuOptions = async (menuName) => {
  const { rows } = await pool.query(GET_MENU_OPTIONS, [menuName]);
  return rows;
};

export const sendInitialMenu = async (phone, phoneNumberId, menuName) => {
  const menu = await getMenuByName(menuName);
  if (!menu) {
    logger.warn(`⚠️ Menú '${menuName}' no encontrado o inactivo`);
    return;
  }

  const rows = await getMenuOptions(menuName);
  if (rows.length === 0) {
    logger.warn(`⚠️ Menú '${menuName}' no tiene opciones activas`);
    return;
  }

  const options = rows
    .map(row => ({
      id: row.option_id,
      text: row.display_text,
      description: row.effect_target
    }))
    .filter(opt => opt.id && opt.text);

  if (options.length === 0) {
    throw new Error(`No hay opciones válidas para construir el mensaje interactivo para '${menuName}'.`);
  }

  const payload = buildInteractivePayload({
    header: menu.title?.toString().trim(),
    options,
    strategy: 'auto'
  });

  logger.info(`📤 Enviando menú '${menuName}' a ${phone}`);
  await startUserMenu(phone, menuName);
  await sendInteractiveMessage(phoneNumberId, phone, payload);
};

export const handleMenuSelection = async (optionId, phone, phoneNumberId) => {
  try {
    const { rows } = await pool.query(GET_OPTION_BY_ID, [optionId]);
    if (rows.length === 0) {
      logger.warn(`⚠️ Opción '${optionId}' no encontrada en menú`);
      return;
    }

    const option = rows[0];
    logger.info(`🔘 Opción recibida: ${option.option_id} (${option.effect}) → ${option.effect_target}`);
    await resolveMenuOption(option, phone, phoneNumberId);
  } catch (error) {
    logger.error(`❌ Error en handleMenuSelection: ${error.message}`);
  }
};

export const getMenuByKeyword = async (keyword) => {
  const { rows } = await pool.query(GET_MENU_BY_KEYWORD, [keyword]);
  return rows.length > 0 ? rows[0].menu_name : null;
};

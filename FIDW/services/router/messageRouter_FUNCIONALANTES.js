import { isUserRegistered, updateUserProfile, createUserIfNotExists } from '../users.js';
import {
  getActiveFlowForUser,
  startUserFlow,
  getFlowByKeyword,
  expireUserFlows
} from '../flows/service.js';
import { resolveFlowStep } from '../flows/resolver.js';
import {
  getActiveMenuForUser,
  expireUserMenus,
  handleMenuSelection,
  sendInitialMenu,
  getMenuByKeyword
} from '../menu/service.js';
import { sendTextMessage } from '../whatsapp.js';
import { sendGreeting, sendFixedMessage } from '../messaging.js';

/**
 * Enrutador principal de mensajes entrantes.
 * Evalúa estado del usuario, flujo o menú, y decide cómo manejarlo.
 */
export const routeMessage = async (phone, message, phoneNumberId) => {
  console.log('📦 Mensaje completo recibido:', JSON.stringify(message, null, 2));
  try {
    let normalized = null;

    if (typeof message === 'string') {
      normalized = message.trim().toLowerCase();
    } else if (message?.text?.body) {
      normalized = message.text.body.trim().toLowerCase();
    } else if (message?.interactive?.button_reply?.id) {
      normalized = message.interactive.button_reply.id.trim().toLowerCase();
    } else if (message?.interactive?.list_reply?.id) {
      normalized = message.interactive.list_reply.id.trim().toLowerCase();
    }

    if (!normalized) {
      await sendTextMessage(phoneNumberId, phone, '⚠️ No se pudo entender tu mensaje.');
      return;
    }

    // 1. FLUJO ACTIVO → procesar flujo
    const activeFlow = await getActiveFlowForUser(phone);
    if (activeFlow) {
      await resolveFlowStep(phone, normalized, phoneNumberId);
      return;
    }

    // 2. MENÚ ACTIVO → procesar selección interactiva
    const activeMenu = await getActiveMenuForUser(phone);
    if (activeMenu) {
      const type = message?.type;
      const interactive = message?.interactive;

      let optionId = null;
      if (type === 'interactive') {
        if (interactive?.type === 'button_reply') {
          optionId = interactive.button_reply?.id;
        } else if (interactive?.type === 'list_reply') {
          optionId = interactive.list_reply?.id;
        }
      }

      if (optionId) {
        await handleMenuSelection(optionId, phone, phoneNumberId);
      } else {
        await sendTextMessage(phoneNumberId, phone, '⚠️ No se pudo procesar tu selección.');
      }
      return;
    }

    // 3. FLUJO DETECTADO POR PALABRA CLAVE
    const matchedFlow = await getFlowByKeyword(normalized);
    if (matchedFlow) {
      if (matchedFlow === 'registro') {
        let user = await isUserRegistered(phone);

        if (user) {
          await expireUserFlows(user.id);
        } else {
          await createUserIfNotExists(phone);
          user = await isUserRegistered(phone);
        }

        if (!user.name) {
          await sendFixedMessage('saludos.sinNombre', phone, phoneNumberId);
          await startUserFlow(phone, 'registro', 10);
          await resolveFlowStep(phone, '', phoneNumberId);
          return;
        }

        if (!user.joined_club) {
          await updateUserProfile(phone, { joined_club: true });
          await sendTextMessage(
            phoneNumberId,
            phone,
            `${user.name} te hemos registrado exitosamente. Si necesitas ayuda, escribe "menú".`
          );
          return;
        }

        await sendTextMessage(
          phoneNumberId,
          phone,
          `Hola ${user.name}, un gusto verte nuevamente 😊`
        );
        return;
      }

      // Otros flujos a futuro
      await sendTextMessage(phoneNumberId, phone, 'Opción reconocida pero aún no implementada.');
      return;
    }

    // 4. MENÚ DETECTADO POR PALABRA CLAVE
    const matchedMenu = await getMenuByKeyword(normalized);
    if (matchedMenu) {
      await expireUserMenus(phone);
      await sendGreeting(phone, phoneNumberId);
      await sendInitialMenu(phone, phoneNumberId, matchedMenu);
      return;
    }

    // 5. ¿Usuario registrado? → menú por defecto
    let user = await isUserRegistered(phone);
    if (!user) {
      await createUserIfNotExists(phone);
      user = await isUserRegistered(phone);
    }

    if (user?.name) {
      await expireUserMenus(phone);
      await sendGreeting(phone, phoneNumberId);
      await sendInitialMenu(phone, phoneNumberId, 'menu_registrado');
      return;
    }

    // 6. Fallback
    await sendFixedMessage('fallback.opcionDesconocida', phone, phoneNumberId);
  } catch (error) {
    console.error('❌ Error en routeMessage:', error);
  }
};

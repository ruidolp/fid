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
import { capitalizeFirstLetter } from '../../utils/textUtils.js';
import { handleClubInscription } from '../users.js';


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
      await sendFixedMessage('fallback.opcionDesconocida', phone, phoneNumberId);
      return;
    }

    // 1. FLUJO ACTIVO
    const activeFlow = await getActiveFlowForUser(phone);
    if (activeFlow) {
      console.log('➡️ En flujo activo');
      await resolveFlowStep(phone, normalized, phoneNumberId);
      return;
    }

    // 2. MENÚ ACTIVO
    const activeMenu = await getActiveMenuForUser(phone);
    if (activeMenu) {
      console.log('➡️ En menú activo');
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
        await sendFixedMessage('fallback.seleccionInvalida', phone, phoneNumberId);
      }
      return;
    }

    // 3. Palabra clave especial: "club"
    if (normalized === 'club') {
      await handleClubInscription(phone, phoneNumberId);
      return;
    }
    // 4. Usuario general
    let user = await isUserRegistered(phone);
    if (!user) {
      await createUserIfNotExists(phone);
      user = await isUserRegistered(phone);
    }

    // 4a. Sin nombre → iniciar flujo obtenernombre
    if (!user.name) {
      console.log('➡️ Usuario sin nombre → iniciar flujo obtenernombre');
      await sendFixedMessage('saludos.sinNombreOtros', phone, phoneNumberId);
      await startUserFlow(phone, 'obtenernombre', 10);
      await resolveFlowStep(phone, '', phoneNumberId);
      return;
    }

    // 4b. Nombre con joined_club → mostrar menú registrado
    if (user.joined_club) {
      console.log('➡️ Usuario con nombre y joined → menú registrado');
      await expireUserMenus(phone);
      await sendGreeting(phone, phoneNumberId);
      await sendInitialMenu(phone, phoneNumberId, 'menu_registrado');
      return;
    }

    // 4c. Nombre sin joined_club → mostrar menú sin club
    console.log('➡️ Usuario con nombre pero sin joined → menú sinclub');
    await expireUserMenus(phone);
    await sendGreeting(phone, phoneNumberId);
    await sendInitialMenu(phone, phoneNumberId, 'menu_sinclub');
    return;

  } catch (error) {
    console.error('❌ Error en routeMessage:', error);
    await sendFixedMessage('errores.sistema', phone, phoneNumberId);
  }
};

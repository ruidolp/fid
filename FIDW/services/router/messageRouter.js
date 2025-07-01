
import { isUserRegistered, updateUserProfile, createUserIfNotExists } from '../userService.js';
import {
  getActiveFlowForUser,
  startUserFlow,
  getFlowByKeyword,
  expireUserFlows
} from '../flows/flowService.js';
import { sendTextMessage } from '../whatsappService.js';
import { resolveFlowStep } from '../flows/flowResolver.js';

/**
 * Enrutador principal de mensajes entrantes.
 * Evalúa estado del usuario, mensaje, y decide cómo manejarlo.
 */
export const routeMessage = async (phone, message, phoneNumberId) => {
  try {
    const normalized = message.trim().toLowerCase();

    // 1. Si ya tiene flujo activo → ignorar para no duplicar
    const activeFlow = await getActiveFlowForUser(phone);
    if (activeFlow) {
      await resolveFlowStep(phone, message, phoneNumberId);
      return;
    }

    // 2. Detectar flujo asociado a la palabra clave (si existe)
    const matchedFlow = await getFlowByKeyword(normalized);

    if (!matchedFlow) {
      // No se reconoce el flujo → respuesta genérica
      await sendTextMessage(phoneNumberId, phone, 'Opción desconocida por ahora.');
      return;
    }

    // 3. Flujo especial: 'registro'
    if (matchedFlow === 'registro') {
      let user = await isUserRegistered(phone);

      // Expirar flujos vencidos si el usuario ya existe
      if (user) {
        await expireUserFlows(user.id);
      } else {
        await createUserIfNotExists(phone);
        user = await isUserRegistered(phone); // recargar
      }

      if (!user.name) {
        await startUserFlow(phone, 'registro', 10);
        await resolveFlowStep(phone, '', phoneNumberId); // ✅ Enviar primer paso del flujo
        return;
      }

      if (!user.joined_club) {
        await updateUserProfile(phone, { joined_club: true });
        await sendTextMessage(
          phoneNumberId,
          phone,
          `${user.name} te hemos registrado exitosamente. Si tienes cualquier duda escribe "ayuda".`
        );
        return;
      }

      // Ya está registrado y unido al club
      await sendTextMessage(
        phoneNumberId,
        phone,
        `Hola ${user.name}, un gusto verte nuevamente 😊`
      );
      return;
    }

    // 4. Otros flujos detectados (a futuro)
    await sendTextMessage(phoneNumberId, phone, 'Opción desconocida por ahora.');
  } catch (error) {
    console.error('❌ Error en routeMessage:', error);
  }
};

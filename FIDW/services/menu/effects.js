import { sendTextMessage } from '../whatsapp.js';
import { handleClubInscription } from '../users.js';

export const showHorario = async (phone, phoneNumberId) => {
  const mensaje1 = `⏰ Nuestro horario es de 11 am a 8 pm, de lunes a sábado. Cerramos los domingos 🐾`;
  const mensaje2 = `Además, ¡despachamos a todo Chile para compras online! 🛒📦`;

  await sendTextMessage(phoneNumberId, phone, mensaje1);
  await sendTextMessage(phoneNumberId, phone, mensaje2);
};

export const showUbicacion = async (phone, phoneNumberId) => {
  const message = `📍 Estamos en Simón Bolívar 4800. Aquí tienes el mapa 👉 https://maps.app.goo.gl/fM6hhnj8iEnJt6zs7`;
  await sendTextMessage(phoneNumberId, phone, message);
};

export const showPets = async (phone, phoneNumberId) => {
  const message = `Estas son tus mascotas registradas con nosotros 🐕🐈:

• 🐶 *Masticon*, un perruno alegre nacido el *10 de marzo de 2021*
• 🐶 *Flipi*, juguetón y travieso, nacido el *27 de julio de 2022*
• 🐱 *Pelitos*, nuestra elegante gatuna, nacida el *5 de noviembre de 2020*`;
  await sendTextMessage(phoneNumberId, phone, message);
};

export const function1 = async (phone, phoneNumberId) => {
  await sendTextMessage(phoneNumberId, phone, 'Respuesta de función 1');
};

export const function2 = async (phone, phoneNumberId) => {
  await sendTextMessage(phoneNumberId, phone, 'Respuesta de función 2');
};

export const handleInscripcionClub = async (phone, phoneNumberId) => {
  console.log('📲 Ejecutando handleInscripcionClub desde menú para:', phone);
  await handleClubInscription(phone, phoneNumberId);
};
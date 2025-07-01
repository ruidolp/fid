import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  flowTtlMinutes: parseInt(process.env.FLOW_TTL_MINUTES || '10', 10),
  interactiveType: process.env.WHATSAPP_INTERACTIVE_TYPE || 'button',
  saludoRegistrado: process.env.MSG_SALUDO_REGISTRADO || '¡Hola {name}!',
  saludoNoRegistrado: process.env.MSG_SALUDO_NO_REGISTRADO || '¡Hola! ¿Cuál es tu nombre?'
};

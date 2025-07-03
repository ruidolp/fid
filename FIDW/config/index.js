import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  flowTtlMinutes: parseInt(process.env.FLOW_TTL_MINUTES || '10', 10),
  TTL_HELLO: parseInt(process.env.TTL_HELLO || '10', 10),
};

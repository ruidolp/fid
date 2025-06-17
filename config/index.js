import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN
};

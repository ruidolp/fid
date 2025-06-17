import fetch from 'node-fetch';
import { config } from '../config/index.js';

export const sendTextMessage = async (phoneNumberId, recipient, message) => {
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.whatsappToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'text',
      text: { body: message }
    })
  });

  return response.json();
};

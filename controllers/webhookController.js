import { config } from '../config/index.js';
import { sendTextMessage } from '../services/whatsappService.js';

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.verifyToken) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook no verificado');
    res.sendStatus(403);
  }
};

export const handleWebhookEvent = async (req, res) => {
  console.log('📨 Mensaje recibido:', JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.messages?.length > 0) {
      const phoneNumberId = value.metadata.phone_number_id;
      const from = value.messages[0].from;
      const text = value.messages[0].text?.body;

      console.log(`📥 Nuevo mensaje de ${from}: "${text}"`);

      // 🔽 Registro en base de datos
      try {
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'desconocida';
        await pool.query('INSERT INTO registro (ip) VALUES ($1)', [clientIp]);
        console.log(`📝 IP registrada: ${clientIp}`);
      } catch (dbErr) {
        console.error('❌ Error al registrar IP:', dbErr);
      }

      const response = await sendTextMessage(phoneNumberId, from, '¿Cuál es tu nombre?');
      console.log('✅ Respuesta enviada:', response);
    }

    if (value?.statuses?.length > 0) {
      const status = value.statuses[0];
      console.log(`📦 Estado de mensaje:
  🆔 ID: ${status.id}
  📬 Destinatario: ${status.recipient_id}
  📈 Estado: ${status.status}
  🕓 Timestamp: ${status.timestamp}`);

      if (status.conversation) {
        console.log(`  💬 Conversación ID: ${status.conversation.id}`);
      }
      if (status.pricing) {
        console.log(`  💵 Categoría: ${status.pricing.category}`);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error procesando webhook:', err);
    res.sendStatus(500);
  }
};

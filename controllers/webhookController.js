import { config } from '../config/index.js';
import { processIncomingMessage } from '../services/messageProcessor.js';
import { logger } from '../utils/logger.js';

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.verifyToken) {
    logger.info('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Webhook no verificado');
    res.sendStatus(403);
  }
};

export const handleWebhookEvent = async (req, res) => {
  logger.info('📨 Mensaje recibido:', req.body);

  try {
    await processIncomingMessage(req.body);
    res.sendStatus(200);
  } catch (err) {
    logger.error('❌ Error procesando webhook:', err);
    res.sendStatus(500);
  }
};

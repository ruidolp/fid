import express from 'express';
import { verifyWebhook, handleWebhookEvent } from '../controllers/webhookController.js';

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', handleWebhookEvent);

export default router;

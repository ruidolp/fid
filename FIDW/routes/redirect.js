import express from 'express';
import { redirectToWhatsApp } from '../controllers/redirectController.js';

const router = express.Router();

router.get('/', redirectToWhatsApp); // /redirect?pos_id=64

export default router;
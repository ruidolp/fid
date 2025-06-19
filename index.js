import express from 'express';
import { config } from './config/index.js';
import webhookRoutes from './routes/webhook.js';
import redirectRoutes from './routes/redirect.js';

const app = express();
app.use(express.json());

app.use('/webhook', webhookRoutes);
app.use('/redirect', redirectRoutes);

app.listen(config.port, () => {
  console.log(`🚀 Escuchando en http://localhost:${config.port}`);
});






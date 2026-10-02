import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { customerRoutes } from './routes/customers.routes';
import { deviceRoutes } from './routes/devices.routes';
import { orderRoutes } from './routes/orders.routes';
import { estimateRoutes } from './routes/estimates.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { financeRoutes } from './routes/finance.routes';
import { scheduleRoutes } from './routes/schedule.routes';
import { userRoutes } from './routes/users.routes';
import { serviceRoutes } from './routes/services.routes';
import { saleRoutes } from './routes/sales.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/sales', saleRoutes);

// Health check e Rota Inicial
app.get('/', (_req, res) => {
  res.json({ 
    message: '🚀 ControlTec API - Sistema de Assistência Técnica Ativo',
    endpoints: '/api/health',
    status: 'Online'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', service: 'ControlTec API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 ControlTec API rodando na porta ${PORT}`);
});

export default app;

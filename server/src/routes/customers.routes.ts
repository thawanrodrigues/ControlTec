import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const items = await prisma.customer.findMany({ where: { companyId: (req as any).companyId }, orderBy: { createdAt: 'desc' } });
  res.json(items);
});

router.post('/', async (req: Request, res: Response) => {
  const data = { ...req.body, companyId: (req as any).companyId };
  const item = await prisma.customer.create({ data });
  res.status(201).json(item);
});

router.put('/:id', async (req: Request, res: Response) => {
  const item = await prisma.customer.update({ where: { id: (req.params.id as string) }, data: req.body });
  res.json(item);
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id as string;
    const companyId = (req as any).companyId;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // 1. Delete associated orders, estimates, schedules and devices
    await prisma.serviceOrder.deleteMany({ where: { customerId } });
    await prisma.estimate.deleteMany({ where: { customerId } });
    await prisma.schedule.deleteMany({ where: { customerId } });
    await prisma.device.deleteMany({ where: { customerId } });

    // 2. Delete customer
    await prisma.customer.delete({ where: { id: customerId } });
    
    res.json({ ok: true });
  } catch (error: any) {
    console.error('[Delete Customer Error]:', error);
    res.status(400).json({ error: 'Erro ao excluir cliente: ' + error.message });
  }
});

export { router as customerRoutes };

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.fixedVisit.findMany({ 
      where: { companyId: (req as any).companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar visitas fixas' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientName, address, dayOfWeek, time, notes } = req.body;
    const companyId = (req as any).companyId;
    if (!clientName || !dayOfWeek) {
      res.status(400).json({ error: 'Nome do cliente e dia da semana são obrigatórios' });
      return;
    }
    const item = await prisma.fixedVisit.create({
      data: {
        clientName,
        address,
        dayOfWeek,
        time,
        notes,
        companyId
      }
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: 'Erro ao cadastrar visita fixa: ' + error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { clientName, address, dayOfWeek, time, notes } = req.body;
    const item = await prisma.fixedVisit.update({
      where: { id: req.params.id as string },
      data: { clientName, address, dayOfWeek, time, notes }
    });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: 'Erro ao atualizar visita fixa: ' + error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.fixedVisit.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao excluir visita fixa' });
  }
});

export { router as fixedVisitsRoutes };

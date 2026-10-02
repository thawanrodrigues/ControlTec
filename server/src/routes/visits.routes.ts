import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.visit.findMany({ 
      where: { companyId: (req as any).companyId }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar visitas' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientName, address, time, serviceDone } = req.body;
    const companyId = (req as any).companyId;
    const item = await prisma.visit.create({
      data: {
        clientName,
        address,
        time,
        serviceDone,
        companyId
      }
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: 'Erro ao cadastrar visita: ' + error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { clientName, address, time, serviceDone } = req.body;
    const item = await prisma.visit.update({
      where: { id: req.params.id as string },
      data: { clientName, address, time, serviceDone }
    });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: 'Erro ao atualizar visita: ' + error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.visit.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao excluir visita' });
  }
});

export { router as visitsRoutes };

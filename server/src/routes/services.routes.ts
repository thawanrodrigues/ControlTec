import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

// Listar serviços da empresa
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const items = await prisma.service.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Criar serviço
router.post('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { name, description, defaultPrice, active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome do serviço é obrigatório.' });
    }

    const price = parseFloat(defaultPrice) >= 0 ? parseFloat(defaultPrice) : 0;

    const item = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        defaultPrice: price,
        active: active !== undefined ? Boolean(active) : true,
        companyId
      }
    });

    res.status(201).json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Atualizar serviço
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    const { name, description, defaultPrice, active } = req.body;

    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'O nome não pode ser vazio.' });
      data.name = name.trim();
    }
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (defaultPrice !== undefined) data.defaultPrice = parseFloat(defaultPrice) >= 0 ? parseFloat(defaultPrice) : 0;
    if (active !== undefined) data.active = Boolean(active);

    const item = await prisma.service.update({
      where: { id: id as string, companyId },
      data
    });

    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Excluir serviço
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;

    await prisma.service.delete({
      where: { id: id as string, companyId }
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export { router as serviceRoutes };

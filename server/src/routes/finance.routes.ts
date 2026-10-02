import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const items = await prisma.transaction.findMany({ 
    where: { companyId: (req as any).companyId }, 
    orderBy: { date: 'desc' } 
  });
  res.json(items);
});

router.get('/summary', async (req: Request, res: Response) => {
  const companyId = (req as any).companyId;
  const all = await prisma.transaction.findMany({ where: { companyId } });
  const receitas = all.filter(t => (t.type === 'receita' || t.type === 'capital') && t.status === 'Recebido').reduce((s, t) => s + t.value, 0);
  const despesas = all.filter(t => t.type === 'despesa' && t.status === 'Pago').reduce((s, t) => s + t.value, 0);
  const pendente = all.filter(t => t.status === 'Pendente').reduce((s, t) => s + t.value, 0);
  res.json({ receitas, despesas, saldo: receitas - despesas, pendente });
});

router.post('/', async (req: Request, res: Response) => {
  const data = { ...req.body, companyId: (req as any).companyId };
  const item = await prisma.transaction.create({ data });
  res.status(201).json(item);
});

router.put('/:id', async (req: Request, res: Response) => {
  const item = await prisma.transaction.update({ where: { id: (req.params.id as string) }, data: req.body });
  res.json(item);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.transaction.delete({ where: { id: (req.params.id as string) } });
  res.json({ ok: true });
});

export { router as financeRoutes };

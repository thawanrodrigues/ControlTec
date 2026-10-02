import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

// Helper: extract only valid Estimate fields
function pickEstimateFields(body: any) {
  const fields: any = {};
  if (body.description !== undefined) fields.description = body.description;
  if (body.status !== undefined) fields.status = body.status;
  if (body.notes !== undefined) fields.notes = body.notes;
  if (body.items !== undefined) fields.items = String(body.items ?? '[]');
  if (body.validUntil !== undefined) fields.validUntil = body.validUntil;
  if (body.warranty !== undefined) fields.warranty = body.warranty;
  // Accept total OR totalValue (frontend uses totalValue)
  if (body.total !== undefined) fields.total = parseFloat(body.total) || 0;
  if (body.totalValue !== undefined) fields.total = parseFloat(body.totalValue) || 0;
  if (body.customerId) fields.customerId = body.customerId;
  if (body.deviceId) fields.deviceId = body.deviceId;
  return fields;
}

router.get('/', async (req: Request, res: Response) => {
  const items = await prisma.estimate.findMany({
    where: { companyId: (req as any).companyId },
    include: {
      customer: { select: { name: true, document: true, phone: true, email: true, address: true } },
      device: { select: { brand: true, type: true } },
      company: { select: { name: true, cnpj: true, phone: true, email: true, address: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const count = await prisma.estimate.count({ where: { companyId } });
    const code = `ORC-${String(count + 1).padStart(4, '0')}`;
    const fields = pickEstimateFields(req.body);
    const item = await prisma.estimate.create({ data: { ...fields, code, companyId } });
    res.status(201).json(item);
  } catch (e: any) {
    console.error('[estimates POST] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const fields = pickEstimateFields(req.body);
    const item = await prisma.estimate.update({ where: { id: req.params.id as string }, data: fields });
    res.json(item);
  } catch (e: any) {
    console.error('[estimates PUT] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.estimate.delete({ where: { id: (req.params.id as string) } });
  res.json({ ok: true });
});

export { router as estimateRoutes };

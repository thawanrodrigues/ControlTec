import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Não autorizado' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/company
router.get('/company', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, cnpj: true, tradeName: true, phone: true, email: true, address: true, logo: true }
    });
    res.json(company);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/company
router.put('/company', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

    const { name, tradeName, cnpj, phone, email, address, logo } = req.body;
    
    const updateData: any = { name, tradeName, cnpj, phone, email, address };
    if (logo !== undefined) {
      updateData.logo = logo;
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: updateData
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

    const users = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

    const { name, email, password, role } = req.body;
    
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: role || 'Técnico',
        companyId
      },
      select: { id: true, name: true, email: true, role: true }
    });

    res.status(201).json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) return res.status(401).json({ error: 'Não autorizado' });

    const user = await prisma.user.findFirst({
      where: { id: req.params.id as string, companyId }
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export { router as userRoutes };

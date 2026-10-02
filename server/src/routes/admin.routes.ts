import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'controltec-secret-2026';

// Middleware de Autenticação para Admin
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token administrativo não fornecido' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acesso negado: Requer privilégios de super-administrador' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// POST /api/admin/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Usuário "admin" e senha "211895" conforme exigido pelo usuário
    if (username === 'admin' && password === '211895') {
      const token = jwt.sign({ role: 'superadmin' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token });
    }

    return res.status(401).json({ error: 'Usuário ou senha administrativa inválidos' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/companies
router.get('/companies', adminAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            devices: true,
            customers: true,
            orders: true,
            estimates: true,
            finances: true,
            schedules: true,
            inventory: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result = companies.map(c => {
      const employeeCount = c._count.users;
      // Fórmula de cálculo de armazenamento proporcional:
      // (usuários * 50MB) + (aparelhos * 150MB) + (clientes * 20MB) + (ordens * 80MB) + (outros...)
      const storageUsed = 
        (c._count.users * 0.05) + 
        (c._count.devices * 0.15) + 
        (c._count.customers * 0.02) + 
        (c._count.orders * 0.08) + 
        (c._count.estimates * 0.04) + 
        (c._count.finances * 0.01) + 
        (c._count.schedules * 0.02) + 
        (c._count.inventory * 0.03) + 
        0.18; // Base storage in GB

      return {
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        cnpj: c.cnpj,
        email: c.email,
        phone: c.phone,
        createdAt: c.createdAt,
        blocked: c.blocked,
        employeeCount,
        storageUsed: parseFloat(storageUsed.toFixed(3)),
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/companies/:id/toggle-block
router.post('/companies/:id/toggle-block', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const company = await prisma.company.findUnique({ where: { id } });
    
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: { blocked: !company.blocked }
    });

    res.json({
      id: updated.id,
      name: updated.name,
      blocked: updated.blocked
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as adminRoutes };

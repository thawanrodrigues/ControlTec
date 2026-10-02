import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'controltec-secret-2026';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token não fornecido' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string };
    
    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
      select: { blocked: true }
    });

    if (company?.blocked) {
      return res.status(403).json({ error: 'Acesso bloqueado para esta empresa.' });
    }

    (req as any).userId = decoded.userId;
    (req as any).companyId = decoded.companyId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

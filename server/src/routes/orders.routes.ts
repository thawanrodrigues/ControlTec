import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const items = await prisma.serviceOrder.findMany({ 
    where: { companyId: (req as any).companyId }, 
    include: { customer: { select: { name: true } }, device: { select: { brand: true, type: true, model: true } } },
    orderBy: { createdAt: 'desc' } 
  });
  res.json(items);
});

const getOrCreateDeviceId = async (deviceId: string, customerId: string, companyId: string, deviceModel?: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(deviceId)) {
    return deviceId;
  }
  
  if (!deviceId) return null;

  let device = await prisma.device.findFirst({
    where: { customerId, type: deviceId, model: deviceModel || '', companyId }
  });
  
  if (!device) {
    device = await prisma.device.create({
      data: {
        customerId,
        companyId,
        type: deviceId,
        brand: 'Diversos',
        model: deviceModel || '',
        status: 'Em diagnóstico'
      }
    });
  }
  return device.id;
};

const getOrCreateCustomerId = async (customerId: string, companyId: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(customerId)) {
    return customerId;
  }
  if (!customerId) return null;

  let customer = await prisma.customer.findFirst({
    where: { name: customerId, companyId }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: customerId,
        companyId
      }
    });
  }
  return customer.id;
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { deviceId, customerId, deviceModel, ...rest } = req.body;
    
    const actualCustomerId = await getOrCreateCustomerId(customerId, companyId);
    if (!actualCustomerId) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }
    
    const actualDeviceId = await getOrCreateDeviceId(deviceId, actualCustomerId, companyId, deviceModel);
    
    const count = await prisma.serviceOrder.count({ where: { companyId } });
    const code = `OS-${String(count + 1).padStart(4, '0')}`;
    
    const data = {
      code,
      description: rest.description || '',
      techNotes: rest.techNotes || '',
      technician: rest.technician || '',
      status: rest.status || 'Aberto',
      priority: rest.priority || 'Normal',
      defect: rest.defect || '',
      observations: rest.observations || '',
      totalValue: parseFloat(rest.totalValue) || 0,
      customerId: actualCustomerId,
      deviceId: actualDeviceId,
      companyId
    };
    
    const item = await prisma.serviceOrder.create({ data });
    res.status(201).json(item);
  } catch (error) {
    console.error('[Prisma Error Create OS]:', error);
    res.status(400).json({ error: 'Erro ao criar OS' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { deviceId, customerId, device, customer, deviceModel, ...rest } = req.body;
    
    const actualCustomerId = await getOrCreateCustomerId(customerId, companyId);
    if (!actualCustomerId) {
      return res.status(400).json({ error: 'Cliente é obrigatório' });
    }
    
    const actualDeviceId = await getOrCreateDeviceId(deviceId, actualCustomerId, companyId, deviceModel);
    
    const data = {
      description: rest.description,
      techNotes: rest.techNotes,
      technician: rest.technician,
      status: rest.status,
      priority: rest.priority,
      defect: rest.defect,
      observations: rest.observations,
      totalValue: parseFloat(rest.totalValue) || 0,
      customerId: actualCustomerId,
      deviceId: actualDeviceId
    };
    
    const item = await prisma.serviceOrder.update({ 
      where: { id: (req.params.id as string) }, 
      data
    });
    res.json(item);
  } catch (error) {
    console.error('[Prisma Error Update OS]:', error);
    res.status(400).json({ error: 'Erro ao atualizar OS' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.serviceOrder.delete({ where: { id: (req.params.id as string) } });
  res.json({ ok: true });
});

router.post('/:id/finish', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const orderId = req.params.id as string;

    const order = await prisma.serviceOrder.findFirst({
      where: { id: orderId, companyId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'OS não encontrada' });
    }

    if (order.status === 'Concluído') {
      return res.status(400).json({ error: 'OS já está concluída' });
    }

    // 1. Atualizar status da OS
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { status: 'Concluído' }
    });

    // 2. Criar transação financeira
    if (order.totalValue > 0) {
      await prisma.transaction.create({
        data: {
          desc: `Pagamento OS ${order.code}`,
          type: 'receita',
          value: order.totalValue,
          category: 'Serviços',
          client: order.customer?.name || 'Cliente Avulso',
          status: 'Recebido',
          companyId
        }
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao finalizar OS e gerar receita' });
  }
});

export { router as orderRoutes };

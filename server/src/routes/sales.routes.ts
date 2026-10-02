import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authMiddleware);

interface SaleItemInput {
  id?: string;
  type: 'servico' | 'produto' | 'avulso';
  name: string;
  qty: number;
  price: number;
  subtotal?: number;
  originalId?: string;
  productId?: string;
  serviceId?: string;
}

// Listar vendas com filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { search, status, period } = req.query;

    const where: any = { companyId };

    if (status && status !== 'Todos') {
      where.status = status;
    }

    if (period) {
      const now = new Date();
      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.createdAt = { gte: start };
      } else if (period === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        where.createdAt = { gte: start };
      } else if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        where.createdAt = { gte: start };
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true, document: true, address: true }
        },
        company: {
          select: { id: true, name: true, tradeName: true, cnpj: true, phone: true, email: true, address: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtro adicional de texto por cliente, código ou descrição de item
    let result = sales;
    if (search && typeof search === 'string' && search.trim()) {
      const query = search.toLowerCase().trim();
      result = sales.filter((s: any) =>
        s.code.toLowerCase().includes(query) ||
        (s.customerName && s.customerName.toLowerCase().includes(query)) ||
        (s.customer && s.customer.name.toLowerCase().includes(query)) ||
        (s.items && s.items.toLowerCase().includes(query)) ||
        (s.notes && s.notes.toLowerCase().includes(query))
      );
    }

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Autocomplete de itens avulsos e descrições recentes
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const recentSales = await prisma.sale.findMany({
      where: { companyId },
      select: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const suggestionsMap = new Map<string, { name: string; price: number; type: string }>();

    for (const sale of recentSales) {
      try {
        const items: SaleItemInput[] = JSON.parse(sale.items || '[]');
        for (const it of items) {
          if (it.name && it.name.trim()) {
            const key = it.name.trim().toLowerCase();
            if (!suggestionsMap.has(key)) {
              suggestionsMap.set(key, {
                name: it.name.trim(),
                price: it.price || 0,
                type: it.type || 'avulso'
              });
            }
          }
        }
      } catch {}
    }

    res.json(Array.from(suggestionsMap.values()).slice(0, 20));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Obter uma venda específica com detalhes
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
      where: { id: id as string, companyId },
      include: {
        customer: true,
        company: true
      }
    });

    if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });
    res.json(sale);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Criar nova venda / emitir recibo
router.post('/', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const {
      customerId,
      customerName,
      items,
      discount = 0,
      paymentMethod = 'Pix',
      status = 'Pago',
      paidAt,
      notes,
      warranty
    } = req.body;

    const parsedItems: SaleItemInput[] = Array.isArray(items) ? items : JSON.parse(items || '[]');

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ error: 'A venda deve conter ao menos um item ou serviço.' });
    }

    // Validar e calcular subtotais
    let totalServices = 0;
    let totalProducts = 0;

    const sanitizedItems = parsedItems.map((item, idx) => {
      const name = (item.name || '').trim();
      if (!name) {
        throw new Error(`O item #${idx + 1} precisa ter uma descrição válida.`);
      }
      const qty = Math.max(1, parseInt(String(item.qty)) || 1);
      const price = Math.max(0, parseFloat(String(item.price)) || 0);
      const subtotal = qty * price;
      const type = item.type === 'produto' ? 'produto' : item.type === 'servico' ? 'servico' : 'avulso';

      if (type === 'servico') {
        totalServices += subtotal;
      } else {
        totalProducts += subtotal;
      }

      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        type,
        name,
        qty,
        price,
        subtotal,
        originalId: item.originalId || item.productId || item.serviceId || null
      };
    });

    const subtotalBruto = totalServices + totalProducts;
    const discountVal = Math.max(0, parseFloat(String(discount)) || 0);

    if (discountVal > subtotalBruto) {
      return res.status(400).json({ error: 'O valor do desconto não pode ser maior que o subtotal da venda.' });
    }

    const totalValue = Math.max(0, subtotalBruto - discountVal);

    // Gerar código sequencial do recibo (REC-0001, REC-0002, ...)
    const count = await prisma.sale.count({ where: { companyId } });
    const code = `REC-${String(count + 1).padStart(4, '0')}`;

    // Resolver nome do cliente
    let resolvedCustomerName = customerName ? customerName.trim() : null;
    let actualCustomerId = customerId || null;

    if (actualCustomerId) {
      const cust = await prisma.customer.findFirst({ where: { id: actualCustomerId, companyId } });
      if (cust) {
        resolvedCustomerName = cust.name;
      } else {
        actualCustomerId = null;
      }
    }
    if (!resolvedCustomerName) {
      resolvedCustomerName = 'Consumidor Final';
    }

    const isPaid = status === 'Pago';
    const finalPaidAt = isPaid ? (paidAt ? new Date(paidAt) : new Date()) : null;

    // Criar a venda no banco
    const sale = await prisma.sale.create({
      data: {
        code,
        customerId: actualCustomerId,
        customerName: resolvedCustomerName,
        items: JSON.stringify(sanitizedItems),
        totalServices,
        totalProducts,
        discount: discountVal,
        totalValue,
        paymentMethod,
        status: isPaid ? 'Pago' : 'Pendente',
        paidAt: finalPaidAt,
        notes: notes ? notes.trim() : null,
        warranty: warranty ? warranty.trim() : null,
        companyId
      },
      include: {
        customer: true,
        company: true
      }
    });

    // Baixa de estoque apenas para itens do tipo "produto"
    for (const item of sanitizedItems) {
      if (item.type === 'produto' && item.originalId) {
        try {
          const invItem = await prisma.inventoryItem.findFirst({
            where: { id: item.originalId, companyId }
          });
          if (invItem) {
            const newQty = Math.max(0, invItem.qty - item.qty);
            await prisma.inventoryItem.update({
              where: { id: invItem.id },
              data: { qty: newQty }
            });
          }
        } catch (stockErr) {
          console.warn('[Sale] Falha ao dar baixa de estoque no item:', item.name, stockErr);
        }
      }
    }

    // Lançamento financeiro no fluxo de caixa / contas a receber
    try {
      const itemsSummary = sanitizedItems.map(i => `${i.qty}x ${i.name}`).join(', ');
      await prisma.transaction.create({
        data: {
          desc: `Recibo ${code} - ${resolvedCustomerName} (${itemsSummary})`,
          type: 'receita',
          value: totalValue,
          category: isPaid ? 'venda' : 'venda_pendente',
          client: resolvedCustomerName,
          status: isPaid ? 'Recebido' : 'Pendente',
          date: finalPaidAt || new Date(),
          notes: JSON.stringify({ saleId: sale.id, code, paymentMethod }),
          companyId
        }
      });
    } catch (finErr) {
      console.warn('[Sale] Falha ao criar transação financeira:', finErr);
    }

    res.status(201).json(sale);
  } catch (e: any) {
    console.error('[Sale Create Error]:', e);
    res.status(400).json({ error: e.message || 'Erro ao registrar venda' });
  }
});

// Atualizar venda / Marcar como pago
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;
    const { status, paymentMethod, paidAt, notes, warranty } = req.body;

    const existing = await prisma.sale.findFirst({
      where: { id: id as string, companyId }
    });

    if (!existing) return res.status(404).json({ error: 'Venda não encontrada' });

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;
    if (warranty !== undefined) updateData.warranty = warranty;

    // Se marcar como pago
    if (status === 'Pago' && existing.status !== 'Pago') {
      updateData.paidAt = paidAt ? new Date(paidAt) : new Date();

      // Atualizar no financeiro
      try {
        const trans = await prisma.transaction.findFirst({
          where: {
            companyId,
            notes: { contains: existing.id }
          }
        });
        if (trans) {
          await prisma.transaction.update({
            where: { id: trans.id },
            data: {
              status: 'Recebido',
              category: 'venda',
              date: updateData.paidAt
            }
          });
        } else {
          await prisma.transaction.create({
            data: {
              desc: `Recibo ${existing.code} - ${existing.customerName || 'Cliente'}`,
              type: 'receita',
              value: existing.totalValue,
              category: 'venda',
              client: existing.customerName,
              status: 'Recebido',
              date: updateData.paidAt,
              notes: JSON.stringify({ saleId: existing.id, code: existing.code }),
              companyId
            }
          });
        }
      } catch (err) {
        console.warn('[Sale Update] Erro ao sincronizar financeiro:', err);
      }
    }

    const updated = await prisma.sale.update({
      where: { id: id as string },
      data: updateData,
      include: { customer: true, company: true }
    });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Excluir venda
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).companyId;
    const { id } = req.params;

    await prisma.sale.delete({
      where: { id: id as string, companyId }
    });

    // Excluir transação financeira associada
    try {
      const trans = await prisma.transaction.findFirst({
        where: { companyId, notes: { contains: id as string } }
      });
      if (trans) {
        await prisma.transaction.delete({ where: { id: trans.id } });
      }
    } catch {}

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export { router as saleRoutes };

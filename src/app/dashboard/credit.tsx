import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { Theme } from '../../ui/themes';
import { CheckCircle, Clock, X, Printer, CreditCard } from 'lucide-react-native';
import { api } from '../../services/api';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const isOverdue = (iso: string) => new Date(iso) < new Date();

function parseNotes(notes: string | null) {
  try { return notes ? JSON.parse(notes) : {}; } catch { return {}; }
}

function groupBySaleId(parcelas: any[]) {
  const map: Record<string, any[]> = {};
  parcelas.forEach(p => {
    const meta = parseNotes(p.notes);
    const key = meta.saleId || p.id;
    if (!map[key]) map[key] = [];
    map[key].push({ ...p, meta });
  });
  return Object.entries(map).map(([saleId, items]) => ({
    saleId,
    client: items[0].client || 'Cliente',
    products: items[0].meta.products || '',
    totalValue: items[0].meta.totalValue || 0,
    totalInstallments: items[0].meta.totalInstallments || items.length,
    items: items.sort((a, b) => a.meta.installmentNumber - b.meta.installmentNumber),
    paidCount: items.filter(i => i.status === 'Recebido').length,
  }));
}

export default function CreditScreen() {
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptGroup, setReceiptGroup] = useState<any | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const all = await api.getAll('finance');
      setParcelas(all.filter((t: any) => t.category === 'parcela'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (item: any) => {
    setPayLoading(item.id);
    try {
      await api.update('finance', item.id, { status: 'Recebido' });
      fetchData();
    } catch (e: any) { alert(e.message); }
    finally { setPayLoading(null); }
  };

  const handlePrintReceipt = (group: any) => {
    setReceiptGroup(group);
  };

  const printAndClose = () => {
    if (typeof window !== 'undefined') window.print();
    setReceiptGroup(null);
  };

  const groups = groupBySaleId(parcelas);
  const totalPendente = parcelas.filter(p => p.status === 'Pendente').reduce((a, p) => a + (p.value || 0), 0);
  const totalRecebido = parcelas.filter(p => p.status === 'Recebido').reduce((a, p) => a + (p.value || 0), 0);

  if (loading) return <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      {/* Resumo */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.summaryLabel}>A Receber</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{fmt(totalPendente)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.summaryLabel}>Já Recebido</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{fmt(totalRecebido)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#4F46E5' }]}>
          <Text style={styles.summaryLabel}>Contratos</Text>
          <Text style={[styles.summaryValue, { color: '#4F46E5' }]}>{groups.length}</Text>
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <CreditCard size={48} color={Theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma venda a prazo registrada.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {groups.map(group => (
            <View key={group.saleId} style={styles.groupCard}>
              {/* Header do grupo */}
              <View style={styles.groupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupClient}>{group.client}</Text>
                  <Text style={styles.groupProducts} numberOfLines={1}>{group.products}</Text>
                </View>
                <View style={styles.groupRight}>
                  <Text style={styles.groupTotal}>{fmt(group.totalValue)}</Text>
                  <Text style={styles.groupProgress}>{group.paidCount}/{group.totalInstallments} pagas</Text>
                </View>
              </View>

              {/* Barra de progresso */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(group.paidCount / group.totalInstallments) * 100}%` as any }]} />
              </View>

              {/* Parcelas */}
              {group.items.map((item: any) => {
                const overdue = item.status === 'Pendente' && isOverdue(item.meta.dueDate);
                const isPaid = item.status === 'Recebido';
                return (
                  <View key={item.id} style={[styles.parcelaRow, overdue && styles.parcelaOverdue]}>
                    <View style={styles.parcelaIcon}>
                      {isPaid
                        ? <CheckCircle size={18} color="#10B981" />
                        : <Clock size={18} color={overdue ? '#EF4444' : '#F59E0B'} />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.parcelaNum}>Parcela {item.meta.installmentNumber}/{group.totalInstallments}</Text>
                      <Text style={[styles.parcelaDate, overdue && { color: '#EF4444' }]}>
                        Vence: {item.meta.dueDate ? fmtDate(item.meta.dueDate) : '-'}
                        {overdue ? '  ⚠ Vencida' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.parcelaValue, isPaid && { color: '#10B981' }]}>{fmt(item.value || 0)}</Text>
                    {!isPaid && (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => handlePay(item)}
                        disabled={payLoading === item.id}
                      >
                        {payLoading === item.id
                          ? <ActivityIndicator size="small" color="#FFF" />
                          : <Text style={styles.payBtnText}>Dar Baixa</Text>
                        }
                      </TouchableOpacity>
                    )}
                    {isPaid && <View style={styles.paidBadge}><Text style={styles.paidText}>Pago</Text></View>}
                  </View>
                );
              })}

              {/* Botão quitação */}
              {group.paidCount === group.totalInstallments && (
                <TouchableOpacity style={styles.receiptBtn} onPress={() => handlePrintReceipt(group)}>
                  <Printer size={16} color="#FFF" />
                  <Text style={styles.receiptBtnText}>Emitir Cupom de Quitação</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal: Cupom de Quitação */}
      <Modal visible={!!receiptGroup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cupom de Quitação</Text>
              <TouchableOpacity onPress={() => setReceiptGroup(null)}><X size={22} color={Theme.colors.textSecondary} /></TouchableOpacity>
            </View>
            {receiptGroup && (
              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.receiptTitle}>QUITAÇÃO DE DÉBITO</Text>
                <Text style={styles.receiptLine}>Data: {new Date().toLocaleDateString('pt-BR')}</Text>
                <Text style={styles.receiptLine}>Cliente: {receiptGroup.client}</Text>
                <Text style={styles.receiptLine}>Produto(s): {receiptGroup.products}</Text>
                <View style={styles.receiptDivider} />
                {receiptGroup.items.map((item: any) => (
                  <Text key={item.id} style={styles.receiptLine}>
                    Parcela {item.meta.installmentNumber}/{receiptGroup.totalInstallments}:  {fmt(item.value || 0)}  ✓ Pago em {fmtDate(item.meta.dueDate)}
                  </Text>
                ))}
                <View style={styles.receiptDivider} />
                <Text style={styles.receiptTotal}>Total Quitado: {fmt(receiptGroup.totalValue)}</Text>
                <Text style={styles.receiptFooter}>Este documento confirma a quitação total do débito acima.</Text>
              </ScrollView>
            )}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReceiptGroup(null)}>
                <Text style={{ color: Theme.colors.textSecondary, fontWeight: '600' }}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.printButton} onPress={printAndClose}>
                <Printer size={16} color="#FFF" />
                <Text style={styles.printBtnText}>Imprimir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  summaryCard: { flexGrow: 1, minWidth: 140, backgroundColor: Theme.colors.surface, padding: 12, borderRadius: 10, borderLeftWidth: 5 },
  summaryLabel: { fontSize: 11, color: Theme.colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Theme.colors.textSecondary },
  groupCard: { backgroundColor: Theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  groupClient: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary },
  groupProducts: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  groupRight: { alignItems: 'flex-end' },
  groupTotal: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary },
  groupProgress: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
  progressBar: { height: 6, backgroundColor: Theme.colors.inputBackground, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  parcelaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Theme.colors.inputBackground, gap: 8 },
  parcelaOverdue: { backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 8 },
  parcelaIcon: { width: 24, alignItems: 'center' },
  parcelaNum: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  parcelaDate: { fontSize: 12, color: Theme.colors.textSecondary },
  parcelaValue: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textPrimary },
  payBtn: { backgroundColor: Theme.colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  payBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  paidBadge: { backgroundColor: '#D4EDDA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  paidText: { color: '#155724', fontSize: 12, fontWeight: 'bold' },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, marginTop: 12, gap: 8 },
  receiptBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: 12 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  printButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4F46E5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  printBtnText: { color: '#FFF', fontWeight: 'bold' },
  receiptTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 16, color: Theme.colors.textPrimary },
  receiptLine: { fontSize: 14, color: Theme.colors.textPrimary, marginBottom: 6 },
  receiptDivider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 12 },
  receiptTotal: { fontSize: 18, fontWeight: '900', color: '#10B981', marginBottom: 8 },
  receiptFooter: { fontSize: 12, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, ActivityIndicator, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { Search, Plus, FileText, X, Edit2, Trash2, Receipt, ClipboardList } from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import { generateRecibo, generateNotaServico } from '../../services/documentGenerator';

export default function EstimatesScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();

  const [search, setSearch] = useState('');
  const [estimates, setEstimates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: '', status: 'Pendente', description: '', notes: '',
    items: '[]', totalValue: '0', validUntil: '', customerId: '',
    warranty: ''
  });
  const formDataRef = useRef(formData);

  const updateFormData = useCallback((updater: any) => {
    setFormData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      formDataRef.current = next;
      return next;
    });
  }, []);

  const fetchData = async () => {
    try {
      const [estData, custData] = await Promise.all([
        api.getAll('estimates'),
        api.getAll('customers'),
      ]);
      setEstimates(estData);
      setCustomers(custData);
      // Store company info from first customer's company or from token
      if (estData[0]?.company) setCompanyInfo(estData[0].company);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCustomerChange = useCallback((e: any) => {
    const val = e?.target?.value ?? e?.currentTarget?.value ?? '';
    console.log('[Estimates] customerId changed:', val);
    updateFormData((prev: any) => ({ ...prev, customerId: val }));
  }, [updateFormData]);

  const handleSave = async () => {
    const current = formDataRef.current;
    console.log('[Estimates] handleSave — current:', current);
    if (!current.customerId || !current.description) {
      alert('Cliente e Descrição são obrigatórios.');
      return;
    }
    setSaveLoading(true);
    try {
      // Strip nested relation objects that Prisma rejects on update
      const { customer, device, company, code, createdAt, updatedAt, totalValue, id: _id, ...cleanData } = current as any;
      const payload = { 
        ...cleanData, 
        total: parseFloat(current.totalValue) || 0,
        items: String(current.items || '[]')
      };
      if (current.id) {
        await api.update('estimates', current.id, payload);
      } else {
        await api.create('estimates', payload);
      }
      setModalVisible(false);
      fetchData();
      const reset = { id: '', status: 'Pendente', description: '', notes: '', items: '[]', totalValue: '0', validUntil: '', customerId: '', warranty: '' };
      formDataRef.current = reset;
      setFormData(reset);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    const next = { ...item, totalValue: String(item.total || 0), notes: item.notes || '', warranty: item.warranty || '' };
    formDataRef.current = next;
    setFormData(next);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try { await api.remove('estimates', id); fetchData(); } catch (e: any) { alert(e.message); }
    };
    if (Platform.OS === 'web') {
      if (confirm('Deseja excluir este orçamento?')) performDelete();
    } else {
      Alert.alert('Confirmação', 'Deseja excluir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const openDocModal = (item: any) => {
    setSelectedEstimate(item);
    setDocModalVisible(true);
  };

  const buildDocData = (item: any) => ({
    estimate: {
      id: item.id,
      code: item.code,
      description: item.description || '',
      totalValue: item.total || 0,
      status: item.status || 'Pendente',
      items: item.items,
      notes: item.notes,
      createdAt: item.createdAt,
      validUntil: item.validUntil,
      warranty: item.warranty || '',
    },
    customer: {
      name: item.customer?.name || 'Cliente',
      document: item.customer?.document,
      phone: item.customer?.phone,
      email: item.customer?.email,
      address: item.customer?.address,
    },
    company: {
      name: companyInfo?.name || item.company?.name || 'Empresa',
      cnpj: companyInfo?.cnpj || item.company?.cnpj,
      phone: companyInfo?.phone || item.company?.phone,
      email: companyInfo?.email || item.company?.email,
      address: companyInfo?.address || item.company?.address,
    },
  });

  const handleGenerateRecibo = () => {
    if (!selectedEstimate) return;
    setDocModalVisible(false);
    setTimeout(() => generateRecibo(buildDocData(selectedEstimate)), 200);
  };

  const handleGenerateNota = () => {
    if (!selectedEstimate) return;
    setDocModalVisible(false);
    setTimeout(() => generateNotaServico(buildDocData(selectedEstimate)), 200);
  };

  const filtered = estimates.filter(e =>
    (e.customer?.name?.toLowerCase().includes(search.toLowerCase())) ||
    (e.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    if (status === 'Aprovado') return '#10B981';
    if (status === 'Recusado') return '#EF4444';
    return '#F59E0B';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Orçamentos</Text>
        <TouchableOpacity
          style={[styles.addButton, isCompact ? styles.addButtonBlock : undefined]}
          onPress={() => {
            setFormData({ id: '', status: 'Pendente', description: '', notes: '', items: '[]', totalValue: '0', validUntil: '', customerId: '' });
            setModalVisible(true);
          }}
        >
          <Plus color={Theme.colors.textInverse} size={20} />
          <Text style={styles.addButtonText}>Novo Orçamento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por cliente ou descrição..."
            placeholderTextColor={Theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.listContainer}>
            {!useTableLayout && (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente / Descrição</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total</Text>
                <Text style={[styles.tableHeaderText, { width: 120, textAlign: 'center' }]}>Ações</Text>
              </View>
            )}

            {filtered.map((item) => (
              !useTableLayout ? (
                // Desktop table row
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.itemName}>{item.customer?.name}</Text>
                    <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { flex: 1 }]}>
                    R$ {(item.total || 0).toFixed(2)}
                  </Text>
                  <View style={{ width: 120, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openDocModal(item)} title="Gerar Documento">
                      <FileText size={16} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                      <Edit2 size={16} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                      <Trash2 size={16} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Mobile card
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.customer?.name}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <Text style={styles.priceText}>R$ {(item.total || 0).toFixed(2)}</Text>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity style={[styles.docButton]} onPress={() => openDocModal(item)}>
                        <FileText size={14} color="#FFF" />
                        <Text style={styles.docButtonText}>Gerar Doc</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEdit(item)}>
                        <Edit2 size={18} color={Theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            ))}

            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Nenhum orçamento encontrado.</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Modal: Escolher Tipo de Documento ── */}
      <Modal visible={docModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Documento</Text>
              <TouchableOpacity onPress={() => setDocModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: Theme.spacing.lg }}>
              {selectedEstimate && (
                <View style={styles.docInfoBox}>
                  <Text style={styles.docInfoClient}>{selectedEstimate.customer?.name}</Text>
                  <Text style={styles.docInfoDesc} numberOfLines={2}>{selectedEstimate.description}</Text>
                  <Text style={styles.docInfoTotal}>
                    Total: R$ {(selectedEstimate.totalValue || 0).toFixed(2)}
                  </Text>
                </View>
              )}

              <Text style={styles.docChooseLabel}>Escolha o tipo de documento:</Text>

              <TouchableOpacity style={styles.docOptionBtn} onPress={handleGenerateRecibo}>
                <View style={[styles.docOptionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Receipt size={26} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docOptionTitle}>🧾 Recibo de Pagamento</Text>
                  <Text style={styles.docOptionDesc}>
                    Comprova o pagamento pelos serviços prestados. Contém assinatura de ambas as partes.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.docOptionBtn} onPress={handleGenerateNota}>
                <View style={[styles.docOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <ClipboardList size={26} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docOptionTitle}>📋 Nota de Serviço</Text>
                  <Text style={styles.docOptionDesc}>
                    Descreve detalhadamente os serviços executados. Ideal para garantia e controle.
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.docHint}>
                <Text style={styles.docHintText}>
                  💡 O documento abre em nova janela. Use <Text style={{ fontWeight: 'bold' }}>"Salvar como PDF"</Text> no menu de impressão ou compartilhe diretamente via <Text style={{ color: '#25D366', fontWeight: 'bold' }}>WhatsApp</Text>.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Criar/Editar Orçamento ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? 'Editar Orçamento' : 'Novo Orçamento'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.selectWrapper}>
                  <select
                    style={styles.htmlSelect as any}
                    value={formData.customerId}
                    onChange={handleCustomerChange}
                    onInput={handleCustomerChange}
                  >
                    <option value="">-- Selecione um cliente --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </View>
                {!formData.customerId && (
                  <Text style={{ fontSize: 11, color: Theme.colors.error, marginTop: 2 }}>Selecione um cliente para continuar</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição Geral</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Descreva os serviços a serem realizados..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.description}
                  onChangeText={v => updateFormData({ description: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações / Laudos Técnicos</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Observações adicionais, peças usadas, garantia..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.notes}
                  onChangeText={v => updateFormData({ notes: v })}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Valor Total (R$)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={formData.totalValue}
                    onChangeText={v => updateFormData({ totalValue: v })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={formData.status}
                      onChange={(e: any) => updateFormData({ status: e.target.value })}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Recusado">Recusado</option>
                    </select>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Período de Garantia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 90 dias, sem garantia, 1 ano"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.warranty}
                  onChangeText={v => updateFormData({ warranty: v })}
                />
                <View style={styles.shortcutRow}>
                  {['Sem garantia', '30 dias', '90 dias', '180 dias', '1 ano'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.shortcutPill,
                        formData.warranty === period && styles.shortcutPillActive
                      ]}
                      onPress={() => updateFormData({ warranty: period })}
                    >
                      <Text style={[
                        styles.shortcutPillText,
                        formData.warranty === period && styles.shortcutPillTextActive
                      ]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Válido Até (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.validUntil}
                  onChangeText={v => updateFormData({ validUntil: v })}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
                {saveLoading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.saveButtonText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Theme.spacing.lg, backgroundColor: Theme.colors.background, minWidth: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.lg, gap: Theme.spacing.md },
  headerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.textInverse },
  pageTitleBlock: { flexShrink: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.accent, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.borderRadius.sm },
  addButtonBlock: { alignSelf: 'stretch', justifyContent: 'center' },
  addButtonText: { color: Theme.colors.textInverse, fontWeight: 'bold', marginLeft: Theme.spacing.xs },
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.lg, height: 44 },
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  priceText: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptyText: { textAlign: 'center', marginTop: Theme.spacing.xl, color: Theme.colors.textSecondary, fontSize: 16 },
  actionBtn: { padding: 6, borderRadius: 6, backgroundColor: Theme.colors.inputBackground },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  mobileActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6366F1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  docButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  // Document Modal
  docInfoBox: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, borderLeftWidth: 4, borderLeftColor: Theme.colors.accent },
  docInfoClient: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary },
  docInfoDesc: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  docInfoTotal: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary, marginTop: 6 },
  docChooseLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: Theme.spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  docOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1.5, borderColor: Theme.colors.border, marginBottom: Theme.spacing.md, backgroundColor: Theme.colors.surface },
  docOptionIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docOptionTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 4 },
  docOptionDesc: { fontSize: 13, color: Theme.colors.textSecondary, lineHeight: 18 },
  docHint: { backgroundColor: '#FFFBEB', borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, borderWidth: 1, borderColor: '#FDE68A', marginTop: Theme.spacing.sm },
  docHintText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  // Edit/Create Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  inputRow: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  textArea: { height: 80, paddingTop: 10 },
  selectWrapper: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm },
  htmlSelect: { width: '100%', height: '100%', border: 'none', background: 'transparent', padding: '0 10px', fontSize: 16, outline: 'none' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  shortcutPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border },
  shortcutPillActive: { backgroundColor: Theme.colors.accent, borderColor: Theme.colors.accent },
  shortcutPillText: { fontSize: 13, color: Theme.colors.textSecondary },
  shortcutPillTextActive: { color: Theme.colors.textInverse, fontWeight: '600' },
});

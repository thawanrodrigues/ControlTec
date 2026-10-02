import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Switch
} from 'react-native';
import { Theme } from '../../ui/themes';
import {
  Search,
  Plus,
  Wrench,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Tag
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ServicesScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();

  const [search, setSearch] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    defaultPrice: '',
    active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAll('services');
      setServices(data);
    } catch (e) {
      console.error('Erro ao carregar serviços:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (service?: any) => {
    if (service) {
      setFormData({
        id: service.id,
        name: service.name,
        description: service.description || '',
        defaultPrice: String(service.defaultPrice ?? 0),
        active: service.active ?? true
      });
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        defaultPrice: '',
        active: true
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do serviço.');
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        defaultPrice: parseFloat(formData.defaultPrice) || 0,
        active: formData.active
      };

      if (formData.id) {
        await api.update('services', formData.id, payload);
      } else {
        await api.create('services', payload);
      }

      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      alert('Erro ao salvar serviço: ' + (e.message || 'Verifique a conexão.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este serviço?')) {
      try {
        await api.remove('services', id);
        fetchData();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const filtered = services.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAtivos = services.filter(s => s.active).length;
  const mediaValor = services.length > 0
    ? services.reduce((acc, s) => acc + (s.defaultPrice || 0), 0) / services.length
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View>
          <Text style={[styles.pageTitle, isCompact && styles.pageTitleBlock]}>Catálogo de Serviços</Text>
          <Text style={styles.pageSubtitle}>Cadastre serviços com valores padrão para agilizar suas vendas e recibos (não afeta estoque).</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isCompact && styles.addButtonBlock]}
          onPress={() => openModal()}
        >
          <Plus color={Theme.colors.textInverse} size={20} />
          <Text style={styles.addButtonText}>Novo Serviço</Text>
        </TouchableOpacity>
      </View>

      {/* Cards Resumo */}
      <View style={[styles.summaryCards, isCompact && styles.summaryCardsMobile]}>
        <View style={[styles.summaryCard, { borderLeftColor: '#3B82F6' }]}>
          <Wrench size={20} color="#3B82F6" style={{ marginBottom: 4 }} />
          <Text style={styles.summaryLabel}>Total de Serviços</Text>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{services.length}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
          <CheckCircle size={20} color="#10B981" style={{ marginBottom: 4 }} />
          <Text style={styles.summaryLabel}>Serviços Ativos</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{totalAtivos}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Theme.colors.accent }]}>
          <Tag size={20} color={Theme.colors.accent} style={{ marginBottom: 4 }} />
          <Text style={styles.summaryLabel}>Preço Médio Padrão</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.accent }]}>{formatCurrency(mediaValor)}</Text>
        </View>
      </View>

      {/* Lista */}
      <View style={styles.card}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar serviço por nome ou descrição..."
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
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Serviço / Descrição</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor Padrão</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>Ações</Text>
              </View>
            )}

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Wrench size={48} color={Theme.colors.textSecondary} />
                <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
                <Text style={styles.emptySubText}>Clique em "Novo Serviço" para começar.</Text>
              </View>
            ) : filtered.map((item) => (
              !useTableLayout ? (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.itemSub} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                    </View>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
                        <Edit2 size={16} color={Theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                        <Trash2 size={16} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <Text style={[styles.priceText, { color: '#10B981' }]}>
                      {formatCurrency(item.defaultPrice || 0)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.active ? '#D4EDDA' : '#F8D7DA' }]}>
                      <Text style={[styles.statusText, { color: item.active ? '#155724' : '#721C24' }]}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                    ) : (
                      <Text style={[styles.itemSub, { fontStyle: 'italic' }]}>Sem descrição</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.active ? '#D4EDDA' : '#F8D7DA', alignSelf: 'flex-start' }]}>
                      <Text style={[styles.statusText, { color: item.active ? '#155724' : '#721C24' }]}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { flex: 1, textAlign: 'right', color: '#10B981' }]}>
                    {formatCurrency(item.defaultPrice || 0)}
                  </Text>
                  <View style={{ width: 80, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => openModal(item)}>
                      <Edit2 size={18} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Trash2 size={18} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ))}
          </ScrollView>
        )}
      </View>

      {/* ===== MODAL NOVO / EDITAR SERVIÇO ===== */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? 'Editar Serviço' : 'Novo Serviço'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Serviço *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Formatação de Notebook, Troca de Tela..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.name}
                  onChangeText={(v) => setFormData({ ...formData, name: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor Padrão (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.defaultPrice}
                  onChangeText={(v) => setFormData({ ...formData, defaultPrice: v })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição / Detalhes (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 75, paddingTop: 10 }]}
                  multiline
                  placeholder="Ex: Inclui backup e instalação de programas básicos..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.description}
                  onChangeText={(v) => setFormData({ ...formData, description: v })}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Serviço Ativo</Text>
                  <Text style={styles.switchDesc}>Disponível para seleção nas vendas e recibos</Text>
                </View>
                <Switch
                  value={formData.active}
                  onValueChange={(val) => setFormData({ ...formData, active: val })}
                  trackColor={{ false: '#CCC', true: '#10B981' }}
                  thumbColor={formData.active ? '#FFF' : '#F4F3F4'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
                {saveLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar Serviço</Text>
                )}
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
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  pageTitleBlock: { flexShrink: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.accent, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.borderRadius.sm, gap: 6 },
  addButtonBlock: { alignSelf: 'stretch', justifyContent: 'center' },
  addButtonText: { color: Theme.colors.textInverse, fontWeight: 'bold' },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  summaryCardsMobile: { flexDirection: 'column' },
  summaryCard: { flexGrow: 1, flexBasis: 0, minWidth: 160, backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderLeftWidth: 5 },
  summaryLabel: { fontSize: 12, color: Theme.colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4, color: Theme.colors.textPrimary },
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.lg, height: 44 },
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  priceText: { fontSize: 15, fontWeight: 'bold' },
  mobileActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptySubText: { fontSize: 14, color: Theme.colors.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Theme.spacing.sm, marginTop: Theme.spacing.xs },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  switchDesc: { fontSize: 12, color: Theme.colors.textSecondary },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: '#10B981', paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 120, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

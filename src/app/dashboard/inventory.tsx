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
  Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { Search, Plus, Package, X, Edit2, Trash2, AlertTriangle } from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';

export default function InventoryScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();
  
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    qty: '0',
    minQty: '0',
    costPrice: '0',
    sellPrice: '0',
    supplier: ''
  });

  const fetchData = async () => {
    try {
      const data = await api.getAll('inventory');
      setInventory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        qty: parseInt(formData.qty) || 0,
        minQty: parseInt(formData.minQty) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellPrice: parseFloat(formData.sellPrice) || 0,
      };
      if (formData.id) {
        await api.update('inventory', formData.id, payload);
      } else {
        const { id, ...data } = payload;
        await api.create('inventory', data);
      }
      setModalVisible(false);
      fetchData();
      setFormData({ id: '', name: '', category: '', qty: '0', minQty: '0', costPrice: '0', sellPrice: '0', supplier: '' });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      ...item,
      qty: String(item.qty),
      minQty: String(item.minQty),
      costPrice: String(item.costPrice),
      sellPrice: String(item.sellPrice)
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este item?')) {
      try {
        await api.remove('inventory', id);
        fetchData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const filtered = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Estoque</Text>
        <TouchableOpacity 
          style={[styles.addButton, isCompact ? styles.addButtonBlock : undefined]} 
          onPress={() => {
            setFormData({ id: '', name: '', category: '', qty: '0', minQty: '0', costPrice: '0', sellPrice: '0', supplier: '' });
            setModalVisible(true);
          }}
        >
          <Plus color={Theme.colors.textInverse} size={20} />
          <Text style={styles.addButtonText}>Novo Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome ou categoria..."
            placeholderTextColor={Theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.listContainer}>
            {useTableLayout && (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item / Categoria</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qtd</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Preço Venda</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>Ações</Text>
              </View>
            )}

            {filtered.map((item) => (
              !useTableLayout ? (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemSub}>{item.category}</Text>
                    </View>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity onPress={() => handleEdit(item)}><Edit2 size={18} color={Theme.colors.primary} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.qtyText}>Qtd: {item.qty}</Text>
                      {item.qty <= item.minQty && <AlertTriangle size={14} color="#F59E0B" />}
                    </View>
                    <Text style={styles.priceText}>R$ {item.sellPrice.toFixed(2)}</Text>
                  </View>
                </View>
              ) : (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.category}</Text>
                  </View>
                  <Text style={[styles.qtyText, { flex: 1, textAlign: 'center' }]}>{item.qty}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.qty <= item.minQty ? '#FFF3CD' : '#D4EDDA' }]}>
                      <Text style={[styles.statusText, { color: item.qty <= item.minQty ? '#856404' : '#155724' }]}>
                        {item.qty === 0 ? 'Esgotado' : item.qty <= item.minQty ? 'Baixo' : 'Normal'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { flex: 1 }]}>R$ {item.sellPrice.toFixed(2)}</Text>
                  <View style={{ width: 80, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEdit(item)}><Edit2 size={18} color={Theme.colors.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                  </View>
                </View>
              )
            ))}
            
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? 'Editar Item' : 'Novo Item no Estoque'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Produto / Peça</Text>
                <TextInput style={styles.input} value={formData.name} onChangeText={v => setFormData({...formData, name: v})} />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Categoria</Text>
                  <TextInput style={styles.input} value={formData.category} onChangeText={v => setFormData({...formData, category: v})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Fornecedor</Text>
                  <TextInput style={styles.input} value={formData.supplier} onChangeText={v => setFormData({...formData, supplier: v})} />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.qty} onChangeText={v => setFormData({...formData, qty: v})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Qtd. Mínima</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.minQty} onChangeText={v => setFormData({...formData, minQty: v})} />
                </View>
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Preço de Custo</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.costPrice} onChangeText={v => setFormData({...formData, costPrice: v})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Preço de Venda</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.sellPrice} onChangeText={v => setFormData({...formData, sellPrice: v})} />
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
                {saveLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
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
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  priceText: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptyText: { textAlign: 'center', marginTop: Theme.spacing.xl, color: Theme.colors.textSecondary, fontSize: 16 },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  mobileActions: { flexDirection: 'row', gap: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  inputRow: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

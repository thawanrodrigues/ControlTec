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
import { Search, Plus, User, Phone, MapPin, X, Edit2, Trash2 } from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';

export default function CustomersScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();
  
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      const data = await api.getAll('customers');
      setCustomers(data);
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
    console.log('CustomersScreen: handleSave started', formData.id ? 'Edit' : 'Create');
    if (!formData.name) {
      Alert.alert('Aviso', 'Nome é obrigatório');
      return;
    }
    setSaveLoading(true);
    try {
      if (formData.id) {
        console.log('CustomersScreen: updating customer', formData.id);
        await api.update('customers', formData.id, formData);
      } else {
        console.log('CustomersScreen: creating new customer');
        const { id, ...data } = formData;
        await api.create('customers', data);
      }
      console.log('CustomersScreen: save successful');
      setModalVisible(false);
      fetchData();
      setFormData({ id: '', name: '', email: '', phone: '', address: '' });
    } catch (error: any) {
      console.error('CustomersScreen Save Error:', error.message);
      Alert.alert('Erro', error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (customer: any) => {
    setFormData(customer);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try {
        await api.remove('customers', id);
        fetchData();
      } catch (error: any) {
        alert(error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Deseja excluir este cliente?')) {
        performDelete();
      }
    } else {
      Alert.alert('Confirmação', 'Deseja excluir este cliente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Clientes</Text>
        <TouchableOpacity 
          style={[styles.addButton, isCompact ? styles.addButtonBlock : undefined]} 
          onPress={() => {
            setFormData({ id: '', name: '', email: '', phone: '', address: '' });
            setModalVisible(true);
          }}
        >
          <Plus color={Theme.colors.textInverse} size={20} />
          <Text style={styles.addButtonText}>Novo Cliente</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome, e-mail ou telefone..."
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
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nome / E-mail</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Telefone</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Endereço</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>Ações</Text>
              </View>
            )}

            {filtered.map((item) => (
              !useTableLayout ? (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      <Text style={styles.customerEmail}>{item.email || 'Sem e-mail'}</Text>
                    </View>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
                        <Edit2 size={18} color={Theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionIcon}>
                        <Trash2 size={18} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <View style={styles.mobileInfoRow}>
                      <Phone size={14} color={Theme.colors.textSecondary} />
                      <Text style={styles.mobileInfoText}>{item.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.mobileInfoRow}>
                      <MapPin size={14} color={Theme.colors.textSecondary} />
                      <Text style={styles.mobileInfoText} numberOfLines={1}>{item.address || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerEmail}>{item.email || '-'}</Text>
                  </View>
                  <Text style={[styles.customerPhone, { flex: 1 }]}>{item.phone || '-'}</Text>
                  <Text style={[styles.customerAddress, { flex: 2 }]} numberOfLines={1}>{item.address || '-'}</Text>
                  <View style={{ width: 80, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                      <Edit2 size={18} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Trash2 size={18} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ))}
            
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal Cadastro/Edição */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? 'Editar Cliente' : 'Novo Cliente'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.name}
                  onChangeText={(val) => setFormData({...formData, name: val})}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(val) => setFormData({...formData, email: val})}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.phone}
                  onChangeText={(val) => setFormData({...formData, phone: val})}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Endereço</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.address}
                  onChangeText={(val) => setFormData({...formData, address: val})}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
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
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textInverse,
  },
  pageTitleBlock: {
    flexShrink: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  addButtonBlock: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  addButtonText: {
    color: Theme.colors.textInverse,
    fontWeight: 'bold',
    marginLeft: Theme.spacing.xs,
  },
  card: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
    fontSize: 15,
    color: Theme.colors.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  listContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    marginBottom: Theme.spacing.sm,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.inputBackground,
    minWidth: 0,
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  customerEmail: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  customerPhone: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  customerAddress: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
    color: Theme.colors.textSecondary,
    fontSize: 16,
  },
  // Mobile styles
  mobileCard: {
    backgroundColor: Theme.colors.inputBackground,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  mobileActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionIcon: {
    padding: 4,
  },
  mobileCardBody: {
    gap: 6,
  },
  mobileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileInfoText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  modalForm: {
    padding: Theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: Theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: Theme.spacing.md,
  },
  cancelButton: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

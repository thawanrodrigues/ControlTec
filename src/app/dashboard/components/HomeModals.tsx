import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Theme } from '../../../ui/themes';
import { X } from 'lucide-react-native';

type ModalType = 'os' | 'cliente' | 'despesa' | null;

interface HomeModalsProps {
  activeModal: ModalType;
  setActiveModal: (type: ModalType) => void;
  saveLoading: boolean;
  
  // OS
  formOs: any;
  setFormOs: (data: any) => void;
  customers: any[];
  devices: any[];
  handleSaveOs: () => void;

  // Cliente
  formCliente: any;
  setFormCliente: (data: any) => void;
  handleSaveCliente: () => void;

  // Despesa
  formDespesa: any;
  setFormDespesa: (data: any) => void;
  handleSaveDespesa: () => void;
}

export default function HomeModals({
  activeModal,
  setActiveModal,
  saveLoading,
  formOs,
  setFormOs,
  customers,
  devices,
  handleSaveOs,
  formCliente,
  setFormCliente,
  handleSaveCliente,
  formDespesa,
  setFormDespesa,
  handleSaveDespesa
}: HomeModalsProps) {
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);

  const [deviceSearch, setDeviceSearch] = React.useState('');
  const [showDeviceDropdown, setShowDeviceDropdown] = React.useState(false);

  // Sync state when modal opens or selection changes
  React.useEffect(() => {
    if (activeModal === 'os') {
      const cust = customers.find(c => c.id === formOs.customerId);
      if (cust) {
        setCustomerSearch(cust.name);
      } else if (formOs.isNewCustomer) {
        setCustomerSearch(formOs.newCustomerName || '');
      } else {
        setCustomerSearch('');
      }

      const dev = devices.find(d => d.id === formOs.deviceId);
      if (dev) {
        setDeviceSearch(`${dev.type || dev.brand || 'Aparelho'}${dev.model ? ` ${dev.model}` : ''}`);
      } else if (formOs.isNewDevice) {
        setDeviceSearch(formOs.newDeviceType || '');
      } else {
        setDeviceSearch('');
      }
    }
  }, [activeModal, formOs.customerId, formOs.deviceId]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getDeviceDisplayName = (d: any) => `${d.type || d.brand || 'Aparelho'}${d.model ? ` ${d.model}` : ''}`;

  const filteredDevices = devices.filter(d => {
    const belongsToCustomer = !formOs.customerId || formOs.customerId === 'NEW_CUSTOMER' || d.customerId === formOs.customerId;
    const matchesSearch = getDeviceDisplayName(d).toLowerCase().includes(deviceSearch.toLowerCase());
    return belongsToCustomer && matchesSearch;
  });

  return (
    <>
      {/* ===== MODAL: NOVA OS ===== */}
      <Modal visible={activeModal === 'os'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Ordem de Serviço</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Campo: Cliente com Busca / Autocomplete */}
              <View style={[styles.inputGroup, { zIndex: 100 }]}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar ou digitar nome do cliente..."
                    value={customerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    onChangeText={v => {
                      setCustomerSearch(v);
                      setShowCustomerDropdown(true);
                      const match = customers.find(c => c.name.toLowerCase() === v.toLowerCase());
                      if (match) {
                        setFormOs({ ...formOs, customerId: match.id, isNewCustomer: false, newCustomerName: '' });
                      } else {
                        setFormOs({ ...formOs, customerId: 'NEW_CUSTOMER', isNewCustomer: true, newCustomerName: v });
                      }
                    }}
                  />
                  
                  {showCustomerDropdown && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => (
                            <TouchableOpacity
                              key={c.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                                setFormOs({ ...formOs, customerId: c.id, isNewCustomer: false, newCustomerName: '' });
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{c.name}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={{ padding: 12, color: '#888', fontSize: 14 }}>Nenhum cliente cadastrado</Text>
                        )}
                        
                        {customerSearch.trim().length > 0 && !customers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                          <TouchableOpacity
                            style={[styles.dropdownItem, { backgroundColor: Theme.colors.primary + '10', borderTopWidth: 1, borderTopColor: Theme.colors.border }]}
                            onPress={() => {
                              setShowCustomerDropdown(false);
                              setFormOs({ ...formOs, customerId: 'NEW_CUSTOMER', isNewCustomer: true, newCustomerName: customerSearch });
                            }}
                          >
                            <Text style={[styles.dropdownItemText, { color: Theme.colors.primary, fontWeight: 'bold' }]}>
                              + Cadastrar "{customerSearch}" como Novo Cliente
                            </Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                {formOs.isNewCustomer && customerSearch.trim().length > 0 && (
                  <Text style={{ fontSize: 12, color: Theme.colors.primary, marginTop: 4, fontWeight: '600' }}>
                    ✓ Cliente novo será cadastrado: "{formOs.newCustomerName}"
                  </Text>
                )}
              </View>

              {/* Campo: Aparelho com Busca / Autocomplete */}
              <View style={[styles.inputGroup, { zIndex: 90 }]}>
                <Text style={styles.label}>Aparelho *</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar ou digitar tipo do aparelho..."
                    value={deviceSearch}
                    onFocus={() => setShowDeviceDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 200)}
                    onChangeText={v => {
                      setDeviceSearch(v);
                      setShowDeviceDropdown(true);
                      const match = devices.find(d => getDeviceDisplayName(d).toLowerCase() === v.toLowerCase());
                      if (match) {
                        setFormOs({ ...formOs, deviceId: match.id, isNewDevice: false, newDeviceType: '', newDeviceModel: '' });
                      } else {
                        setFormOs({ ...formOs, deviceId: 'NEW_DEVICE', isNewDevice: true, newDeviceType: v, newDeviceModel: '' });
                      }
                    }}
                  />
                  
                  {showDeviceDropdown && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                        {filteredDevices.length > 0 ? (
                          filteredDevices.map(d => (
                            <TouchableOpacity
                              key={d.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                const name = getDeviceDisplayName(d);
                                setDeviceSearch(name);
                                setShowDeviceDropdown(false);
                                setFormOs({ ...formOs, deviceId: d.id, isNewDevice: false, newDeviceType: '', newDeviceModel: '' });
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{getDeviceDisplayName(d)}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={{ padding: 12, color: '#888', fontSize: 14 }}>Nenhum aparelho cadastrado</Text>
                        )}
                        
                        {deviceSearch.trim().length > 0 && !devices.some(d => getDeviceDisplayName(d).toLowerCase() === deviceSearch.toLowerCase()) && (
                          <TouchableOpacity
                            style={[styles.dropdownItem, { backgroundColor: Theme.colors.primary + '10', borderTopWidth: 1, borderTopColor: Theme.colors.border }]}
                            onPress={() => {
                              setShowDeviceDropdown(false);
                              setFormOs({ ...formOs, deviceId: 'NEW_DEVICE', isNewDevice: true, newDeviceType: deviceSearch, newDeviceModel: '' });
                            }}
                          >
                            <Text style={[styles.dropdownItemText, { color: Theme.colors.primary, fontWeight: 'bold' }]}>
                              + Cadastrar "{deviceSearch}" como Novo Aparelho
                            </Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                {formOs.isNewDevice && deviceSearch.trim().length > 0 && (
                  <Text style={{ fontSize: 12, color: Theme.colors.primary, marginTop: 4, fontWeight: '600' }}>
                    ✓ Aparelho novo será cadastrado: "{formOs.newDeviceType}"
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Modelo do Aparelho (Opcional)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: iPhone 13 Preto, Dell Inspiron..." 
                  value={formOs.isNewDevice ? formOs.newDeviceModel : formOs.deviceModel} 
                  onChangeText={v => {
                    if (formOs.isNewDevice) {
                      setFormOs({...formOs, newDeviceModel: v});
                    } else {
                      setFormOs({...formOs, deviceModel: v});
                    }
                  }} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Defeito Relatado</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline value={formOs.defect} onChangeText={v => setFormOs({...formOs, defect: v})} placeholder="Descreva o problema..." placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formOs.totalValue} onChangeText={v => setFormOs({...formOs, totalValue: v})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.selectWrapper}>
                  <select style={styles.htmlSelect as any} value={formOs.status} onChange={(e: any) => setFormOs({...formOs, status: e.target.value})}>
                    <option value="Aberto">Aberto</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Aguardando Peça">Aguardando Peça</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Técnico Responsável</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Nome do técnico responsável" 
                  value={formOs.technician || ''} 
                  onChangeText={v => setFormOs({...formOs, technician: v})} 
                  placeholderTextColor={Theme.colors.textSecondary}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal(null)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveOs} disabled={saveLoading}>
                {saveLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Criar OS</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL: NOVO CLIENTE ===== */}
      <Modal visible={activeModal === 'cliente'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Cliente</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput style={styles.input} value={formCliente.name} onChangeText={v => setFormCliente({...formCliente, name: v})} placeholder="Nome do cliente" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput style={styles.input} keyboardType="phone-pad" value={formCliente.phone} onChangeText={v => setFormCliente({...formCliente, phone: v})} placeholder="(00) 00000-0000" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput style={styles.input} keyboardType="email-address" value={formCliente.email} onChangeText={v => setFormCliente({...formCliente, email: v})} placeholder="email@exemplo.com" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF / CNPJ</Text>
                <TextInput style={styles.input} value={formCliente.document} onChangeText={v => setFormCliente({...formCliente, document: v})} placeholder="000.000.000-00" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Endereço</Text>
                <TextInput style={styles.input} value={formCliente.address} onChangeText={v => setFormCliente({...formCliente, address: v})} placeholder="Rua, Número, Bairro, Cidade" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal(null)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCliente} disabled={saveLoading}>
                {saveLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL: LANÇAR DESPESA ===== */}
      <Modal visible={activeModal === 'despesa'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lançar Despesa</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput style={styles.input} value={formDespesa.description} onChangeText={v => setFormDespesa({...formDespesa, description: v})} placeholder="Ex: Compra de peças" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoria</Text>
                <TextInput style={styles.input} value={formDespesa.category} onChangeText={v => setFormDespesa({...formDespesa, category: v})} placeholder="Ex: Peças, Aluguel, Serviços" placeholderTextColor={Theme.colors.textSecondary} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formDespesa.amount} onChangeText={v => setFormDespesa({...formDespesa, amount: v})} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.selectWrapper}>
                  <select style={styles.htmlSelect as any} value={formDespesa.status} onChange={(e: any) => setFormDespesa({...formDespesa, status: e.target.value})}>
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setActiveModal(null)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#EF4444' }]} onPress={handleSaveDespesa} disabled={saveLoading}>
                {saveLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Lançar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  selectWrapper: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm },
  htmlSelect: { width: '100%', height: '100%', border: 'none', background: 'transparent', padding: '0 10px', fontSize: 16, outline: 'none' } as any,
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  dropdownContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  dropdownItem: {
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
  }
});

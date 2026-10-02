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

interface OSModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  saveLoading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  customers: any[];
  devices: any[];
  handleSave: () => void;
  handleFinish?: (order: any) => Promise<void>;
}

export default function OSModal({
  modalVisible,
  setModalVisible,
  saveLoading,
  formData,
  setFormData,
  customers,
  devices,
  handleSave,
  handleFinish
}: OSModalProps) {
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);

  const [deviceSearch, setDeviceSearch] = React.useState('');
  const [showDeviceDropdown, setShowDeviceDropdown] = React.useState(false);

  // Sync state when modal opens or selection changes
  React.useEffect(() => {
    if (modalVisible) {
      const cust = customers.find(c => c.id === formData.customerId);
      if (cust) {
        setCustomerSearch(cust.name);
      } else if (formData.isNewCustomer) {
        setCustomerSearch(formData.newCustomerName || '');
      } else {
        setCustomerSearch('');
      }

      const dev = devices.find(d => d.id === formData.deviceId);
      if (dev) {
        setDeviceSearch(`${dev.type}${dev.model ? ` ${dev.model}` : ''}`);
      } else if (formData.isNewDevice) {
        setDeviceSearch(formData.newDeviceType || '');
      } else {
        setDeviceSearch('');
      }
    }
  }, [modalVisible, formData.customerId, formData.deviceId]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getDeviceDisplayName = (d: any) => `${d.type}${d.model ? ` ${d.model}` : ''}`;

  const filteredDevices = devices.filter(d => {
    const belongsToCustomer = !formData.customerId || formData.customerId === 'NEW_CUSTOMER' || d.customerId === formData.customerId;
    const matchesSearch = getDeviceDisplayName(d).toLowerCase().includes(deviceSearch.toLowerCase());
    return belongsToCustomer && matchesSearch;
  });

  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{formData.id ? 'Editar OS' : 'Nova Ordem de Serviço'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color={Theme.colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
            {/* Campo: Cliente com Busca / Autocomplete */}
            <View style={[styles.inputGroup, { zIndex: 100 }]}>
              <Text style={styles.label}>Cliente</Text>
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
                      setFormData({ ...formData, customerId: match.id, isNewCustomer: false, newCustomerName: '' });
                    } else {
                      setFormData({ ...formData, customerId: 'NEW_CUSTOMER', isNewCustomer: true, newCustomerName: v });
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
                              setFormData({ ...formData, customerId: c.id, isNewCustomer: false, newCustomerName: '' });
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
                            setFormData({ ...formData, customerId: 'NEW_CUSTOMER', isNewCustomer: true, newCustomerName: customerSearch });
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
              {formData.isNewCustomer && customerSearch.trim().length > 0 && (
                <Text style={{ fontSize: 12, color: Theme.colors.primary, marginTop: 4, fontWeight: '600' }}>
                  ✓ Cliente novo será cadastrado: "{formData.newCustomerName}"
                </Text>
              )}
            </View>

            {/* Campo: Aparelho com Busca / Autocomplete */}
            <View style={[styles.inputGroup, { zIndex: 90 }]}>
              <Text style={styles.label}>Aparelho</Text>
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
                      setFormData({ ...formData, deviceId: match.id, isNewDevice: false, newDeviceType: '', newDeviceModel: '' });
                    } else {
                      setFormData({ ...formData, deviceId: 'NEW_DEVICE', isNewDevice: true, newDeviceType: v, newDeviceModel: '' });
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
                              setFormData({ ...formData, deviceId: d.id, isNewDevice: false, newDeviceType: '', newDeviceModel: '' });
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
                            setFormData({ ...formData, deviceId: 'NEW_DEVICE', isNewDevice: true, newDeviceType: deviceSearch, newDeviceModel: '' });
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
              {formData.isNewDevice && deviceSearch.trim().length > 0 && (
                <Text style={{ fontSize: 12, color: Theme.colors.primary, marginTop: 4, fontWeight: '600' }}>
                  ✓ Aparelho novo será cadastrado: "{formData.newDeviceType}"
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Modelo do Aparelho (Opcional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: iPhone 13 Preto, Dell Inspiron..." 
                value={formData.isNewDevice ? formData.newDeviceModel : formData.deviceModel} 
                onChangeText={v => {
                  if (formData.isNewDevice) {
                    setFormData({...formData, newDeviceModel: v});
                  } else {
                    setFormData({...formData, deviceModel: v});
                  }
                }} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.selectWrapper}>
                <select 
                  style={styles.htmlSelect}
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Aguardando Peça">Aguardando Peça</option>
                  <option value="Pronto">Pronto</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Técnico Responsável</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Nome do técnico responsável" 
                value={formData.technician || ''} 
                onChangeText={v => setFormData({...formData, technician: v})} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Defeito Relatado</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={formData.defect} onChangeText={v => setFormData({...formData, defect: v})} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição do Serviço</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={formData.description} onChangeText={v => setFormData({...formData, description: v})} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valor Total (R$)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={formData.totalValue} onChangeText={v => setFormData({...formData, totalValue: v})} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            {formData.id && formData.status !== 'Concluído' && (
              <TouchableOpacity 
                style={styles.finishButton} 
                onPress={async () => {
                  if (handleFinish) {
                    await handleFinish(formData);
                  } else {
                    if (confirm('Deseja marcar esta Ordem de Serviço como CONCLUÍDA?')) {
                      setFormData({ ...formData, status: 'Concluído' });
                      setTimeout(() => {
                        handleSave();
                      }, 50);
                    }
                  }
                }}
                disabled={saveLoading}
              >
                <Text style={styles.finishButtonText}>✓ Concluir OS</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
              {saveLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Salvar OS</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 600, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  inputRow: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  textArea: { height: 80, paddingTop: 10 },
  selectWrapper: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm },
  htmlSelect: { width: '100%', height: '100%', border: 'none', background: 'transparent', padding: '0 10px', fontSize: 16, outline: 'none' } as any,
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  finishButton: { backgroundColor: '#10B981', paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg, borderRadius: Theme.borderRadius.sm, marginRight: 'auto' },
  finishButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
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

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

interface FinanceModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  saveLoading: boolean;
  activeTab: 'lancamentos' | 'credito' | 'contas_pagar';
  formData: any;
  setFormData: (data: any) => void;
  handleSave: () => void;
}

export default function FinanceModal({
  modalVisible,
  setModalVisible,
  saveLoading,
  activeTab,
  formData,
  setFormData,
  handleSave
}: FinanceModalProps) {
  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeTab === 'contas_pagar' ? 'Nova Conta a Pagar' : 'Novo Lançamento'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput style={styles.input} value={formData.description} onChangeText={v => setFormData({...formData, description: v})} />
            </View>
            <View style={styles.inputRow}>
              {activeTab !== 'contas_pagar' ? (
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Tipo</Text>
                  <View style={styles.selectWrapper}>
                    <select 
                      style={styles.htmlSelect} 
                      value={formData.type} 
                      onChange={(e) => {
                        const type = e.target.value;
                        setFormData({
                          ...formData, 
                          type, 
                          status: (type === 'receita' || type === 'capital') ? 'Recebido' : 'Pago'
                        });
                      }}
                    >
                      <option value="receita">Entrada (+)</option>
                      <option value="capital">Capital (+)</option>
                      <option value="despesa">Despesa (-)</option>
                    </select>
                  </View>
                </View>
              ) : null}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formData.amount} onChangeText={v => setFormData({...formData, amount: v})} />
              </View>
            </View>

            {formData.type === 'despesa' && activeTab !== 'contas_pagar' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status da Despesa</Text>
                <View style={styles.selectWrapper}>
                  <select 
                    style={styles.htmlSelect} 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente (Conta a Pagar)</option>
                  </select>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria</Text>
              <TextInput style={styles.input} value={formData.category} onChangeText={v => setFormData({...formData, category: v})} placeholder="Ex: Aluguel, Internet, Salários, Peças" placeholderTextColor={Theme.colors.textSecondary} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {formData.status === 'Pendente' ? 'Data de Vencimento' : 'Data do Lançamento'}
              </Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  style={{
                    height: 48,
                    backgroundColor: Theme.colors.inputBackground,
                    border: `1px solid ${Theme.colors.border}`,
                    borderRadius: Theme.borderRadius.sm,
                    paddingLeft: 12,
                    fontSize: 16,
                    color: Theme.colors.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    width: '100%'
                  }} 
                />
              ) : (
                <TextInput 
                  style={styles.input} 
                  placeholder="AAAA-MM-DD" 
                  placeholderTextColor={Theme.colors.textSecondary} 
                  value={formData.date} 
                  onChangeText={v => setFormData({...formData, date: v})} 
                />
              )}
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
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  inputRow: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  selectWrapper: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm },
  htmlSelect: { width: '100%', height: '100%', border: 'none', background: 'transparent', padding: '0 10px', fontSize: 16, outline: 'none' } as any,
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

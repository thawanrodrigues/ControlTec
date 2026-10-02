import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Theme } from '../../../ui/themes';
import { Plus, Minus, Trash2, X } from 'lucide-react-native';
import { api } from '../../../services/api';
import { useBreakpoints } from '../../../ui/useBreakpoints';

interface PersonalCashProps {
  transactions: any[];
  fetchData: () => void;
}

export default function PersonalCash({ transactions, fetchData }: PersonalCashProps) {
  const { isCompact, useTableLayout } = useBreakpoints();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    type: 'caixa_entrada',
    amount: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const personalTransactions = transactions.filter(t => t.type === 'caixa_entrada' || t.type === 'caixa_saida');
  
  const totalIn = personalTransactions.filter(t => t.type === 'caixa_entrada').reduce((acc, t) => acc + (t.value || 0), 0);
  const totalOut = personalTransactions.filter(t => t.type === 'caixa_saida').reduce((acc, t) => acc + (t.value || 0), 0);
  const balance = totalIn - totalOut;

  const handleSave = async () => {
    if (!formData.description) return alert('Descrição é obrigatória');
    if (!formData.amount || parseFloat(formData.amount) <= 0) return alert('Valor inválido');
    
    setSaveLoading(true);
    try {
      await api.create('finance', {
        desc: formData.description,
        type: formData.type,
        value: parseFloat(formData.amount),
        category: 'Caixa Pessoal',
        status: 'Recebido', // Status não importa muito aqui, mas mantemos preenchido
        date: new Date(formData.date + 'T12:00:00')
      });
      
      setModalVisible(false);
      fetchData();
      setFormData({ 
        description: '', 
        type: 'caixa_entrada', 
        amount: '0', 
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      alert('Erro: ' + (error.message || 'Verifique a conexão com o servidor.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento do caixa pessoal?')) {
      try {
        await api.remove('finance', id);
        fetchData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.summaryCards, isCompact ? styles.summaryCardsMobile : undefined]}>
        <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.summaryLabel}>Total Adicionado</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>R$ {totalIn.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.summaryLabel}>Total Gasto</Text>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {totalOut.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Theme.colors.accent, flex: 1.5 }]}>
          <Text style={styles.summaryLabel}>Saldo Disponível</Text>
          <Text style={styles.summaryValue}>R$ {balance.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#10B981' }]} 
          onPress={() => {
            setFormData({ ...formData, type: 'caixa_entrada', description: 'Adição de Fundos' });
            setModalVisible(true);
          }}
        >
          <Plus color="#FFF" size={20} />
          <Text style={styles.actionButtonText}>Adicionar Fundo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#EF4444' }]} 
          onPress={() => {
            setFormData({ ...formData, type: 'caixa_saida', description: 'Gasto Pessoal' });
            setModalVisible(true);
          }}
        >
          <Minus color="#FFF" size={20} />
          <Text style={styles.actionButtonText}>Registrar Gasto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Histórico do Caixa Pessoal</Text>
        
        <ScrollView style={styles.listContainer}>
          {useTableLayout && (
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Descrição</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Data</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Valor</Text>
              <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>Ações</Text>
            </View>
          )}

          {personalTransactions.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma movimentação no caixa pessoal.</Text>
          ) : personalTransactions.map((item) => (
            !useTableLayout ? (
              <View key={item.id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.desc}</Text>
                    <Text style={styles.itemSub}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                </View>
                <View style={styles.mobileCardBody}>
                  <Text style={[styles.priceText, { color: item.type === 'caixa_entrada' ? '#10B981' : '#EF4444' }]}>
                    {item.type === 'caixa_entrada' ? '+' : '-'} R$ {(item.value || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.itemName, { flex: 2 }]}>{item.desc}</Text>
                <Text style={{ fontSize: 14, color: Theme.colors.textSecondary, flex: 1 }}>
                  {new Date(item.date).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={[styles.priceText, { flex: 1, color: item.type === 'caixa_entrada' ? '#10B981' : '#EF4444' }]}>
                  {item.type === 'caixa_entrada' ? '+' : '-'} R$ {(item.value || 0).toFixed(2)}
                </Text>
                <View style={{ width: 80, flexDirection: 'row', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                </View>
              </View>
            )
          ))}
        </ScrollView>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formData.type === 'caixa_entrada' ? 'Adicionar Fundo' : 'Registrar Gasto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={Theme.colors.textSecondary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.description} 
                  onChangeText={v => setFormData({...formData, description: v})} 
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Valor (R$)</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={formData.amount} 
                    onChangeText={v => setFormData({...formData, amount: v})} 
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Data</Text>
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
                      value={formData.date} 
                      onChangeText={v => setFormData({...formData, date: v})} 
                    />
                  )}
                </View>
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
  container: { flex: 1, minWidth: 0 },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  summaryCardsMobile: { flexDirection: 'column' },
  summaryCard: { flexGrow: 1, minWidth: 160, backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderLeftWidth: 5 },
  summaryLabel: { fontSize: 12, color: Theme.colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4, color: Theme.colors.textPrimary },
  actionsBar: { flexDirection: 'row', justifyContent: 'flex-start', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: Theme.borderRadius.md, gap: 8 },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.md },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4 },
  priceText: { fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: Theme.spacing.xl, color: Theme.colors.textSecondary, fontSize: 16 },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
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

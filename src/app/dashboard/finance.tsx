import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { Search, Plus, List, CircleDollarSign, CreditCard, Trash2, Check } from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import CreditScreen from './credit';
import FinanceModal from './components/FinanceModal';
import PersonalCash from './components/PersonalCash';
import { Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function FinanceScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'credito' | 'contas_pagar' | 'caixa_pessoal'>('lancamentos');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    description: '',
    type: 'receita',
    amount: '0',
    category: '',
    status: 'Recebido',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const data = await api.getAll('finance');
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      let role = api.getUserRole();
      if (!role) {
        try {
          const profile = await api.getProfile();
          await api.setUserRole(profile.role);
          role = profile.role;
        } catch (e) {
          console.log('Error verifying role:', e);
        }
      }
      if (role && role !== 'admin') {
        router.replace('/dashboard/customers');
      } else {
        fetchData();
      }
    };
    checkAccess();
  }, []);

  const handleSave = async () => {
    if (!formData.description) return alert('Descrição é obrigatória');
    setSaveLoading(true);
    try {
      const payload = {
        desc: formData.description,
        type: formData.type,
        value: parseFloat(formData.amount) || 0,
        category: formData.category,
        status: formData.status,
        date: new Date(formData.date + 'T12:00:00')
      };
      if (formData.id) {
        await api.update('finance', formData.id, payload);
      } else {
        await api.create('finance', payload);
      }
      setModalVisible(false);
      fetchData();
      setFormData({ 
        id: '', 
        description: '', 
        type: 'receita', 
        amount: '0', 
        category: '', 
        status: 'Recebido',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      alert('Erro: ' + (error.message || 'Verifique a conexão com o servidor.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePayBill = async (item: any) => {
    try {
      await api.update('finance', item.id, {
        desc: item.desc,
        type: item.type,
        value: item.value,
        category: item.category,
        status: 'Pago',
        date: new Date()
      });
      fetchData();
      if (Platform.OS === 'web') {
        alert(`Conta "${item.desc}" marcada como PAGA com sucesso!`);
      } else {
        Alert.alert('Sucesso', `Conta "${item.desc}" marcada como PAGA com sucesso!`);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento?')) {
      try {
        await api.remove('finance', id);
        fetchData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const normalTransactions = transactions.filter(t => (t.status === 'Recebido' || t.status === 'Pago') && t.category !== 'parcela');
  const pendingBills = transactions.filter(t => t.type === 'despesa' && t.status === 'Pendente');

  const filtered = (activeTab === 'lancamentos' ? normalTransactions : pendingBills).filter(t => 
    (t.desc || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = transactions.filter(t => 
    (t.type === 'receita' || t.type === 'capital') && (t.category !== 'parcela' || t.status === 'Recebido')
  ).reduce((acc, t) => acc + (t.value || 0), 0);
  
  const totalExpense = normalTransactions.filter(t => t.type === 'despesa' && t.status === 'Pago').reduce((acc, t) => acc + (t.value || 0), 0);
  const totalPendingBills = pendingBills.reduce((acc, t) => acc + (t.value || 0), 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Financeiro</Text>
        {(activeTab === 'lancamentos' || activeTab === 'contas_pagar') && (
          <TouchableOpacity 
            style={[styles.addButton, isCompact ? styles.addButtonBlock : undefined]} 
            onPress={() => {
              setFormData({ 
                id: '', 
                description: '', 
                type: activeTab === 'contas_pagar' ? 'despesa' : 'receita', 
                amount: '0', 
                category: '', 
                status: activeTab === 'contas_pagar' ? 'Pendente' : 'Recebido',
                date: new Date().toISOString().split('T')[0]
              });
              setModalVisible(true);
            }}
          >
            <Plus color={Theme.colors.textInverse} size={20} />
            <Text style={styles.addButtonText}>
              {activeTab === 'contas_pagar' ? 'Nova Conta a Pagar' : 'Novo Lançamento'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'lancamentos' && styles.tabActive]} onPress={() => setActiveTab('lancamentos')}>
            <List size={16} color={activeTab === 'lancamentos' ? Theme.colors.accent : Theme.colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'lancamentos' && styles.tabTextActive]}>Lançamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'contas_pagar' && styles.tabActive]} onPress={() => setActiveTab('contas_pagar')}>
            <CircleDollarSign size={16} color={activeTab === 'contas_pagar' ? Theme.colors.accent : Theme.colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'contas_pagar' && styles.tabTextActive]}>Contas a Pagar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'caixa_pessoal' && styles.tabActive]} onPress={() => setActiveTab('caixa_pessoal')}>
            <Wallet size={16} color={activeTab === 'caixa_pessoal' ? Theme.colors.accent : Theme.colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'caixa_pessoal' && styles.tabTextActive]}>Caixa Pessoal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'credito' && styles.tabActive]} onPress={() => setActiveTab('credito')}>
            <CreditCard size={16} color={activeTab === 'credito' ? Theme.colors.accent : Theme.colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'credito' && styles.tabTextActive]}>Crédito ao Cliente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {(activeTab === 'lancamentos' || activeTab === 'contas_pagar') ? (
        <>
          {activeTab === 'lancamentos' ? (
            <View style={[styles.summaryCards, isCompact ? styles.summaryCardsMobile : undefined]}>
              <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
                <Text style={styles.summaryLabel}>Total Entradas</Text>
                <Text style={[styles.summaryValue, { color: '#10B981' }]}>R$ {totalIncome.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
                <Text style={styles.summaryLabel}>Total Despesas</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {totalExpense.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: Theme.colors.accent }]}>
                <Text style={styles.summaryLabel}>Saldo</Text>
                <Text style={styles.summaryValue}>R$ {(totalIncome - totalExpense).toFixed(2)}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.summaryCards, isCompact ? styles.summaryCardsMobile : undefined]}>
              <View style={[styles.summaryCard, { borderLeftColor: '#EF4444', flex: 2 }]}>
                <Text style={styles.summaryLabel}>Total Contas a Pagar</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {totalPendingBills.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
                <Text style={styles.summaryLabel}>Contas Pendentes</Text>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{pendingBills.length}</Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.searchBar}>
              <Search color={Theme.colors.textSecondary} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === 'contas_pagar' ? "Pesquisar contas a pagar..." : "Pesquisar por descrição ou categoria..."}
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
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Descrição / Categoria</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      {activeTab === 'contas_pagar' ? 'Vencimento' : 'Status'}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Valor</Text>
                    <Text style={[styles.tableHeaderText, { width: activeTab === 'contas_pagar' ? 140 : 80, textAlign: 'center' }]}>Ações</Text>
                  </View>
                )}

                {filtered.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
                ) : filtered.map((item) => (
                  !useTableLayout ? (
                    <View key={item.id} style={styles.mobileCard}>
                      <View style={styles.mobileCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.desc}</Text>
                          <Text style={styles.itemSub}>{item.category || 'Sem Categoria'}</Text>
                          {activeTab === 'contas_pagar' && (
                            <Text style={[styles.itemSub, { color: '#EF4444', fontWeight: '600', marginTop: 4 }]}>
                              Vence em: {new Date(item.date).toLocaleDateString('pt-BR')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.mobileActions}>
                          {activeTab === 'contas_pagar' && (
                            <TouchableOpacity 
                              style={{ marginRight: 5, backgroundColor: '#10B981', padding: 6, borderRadius: 6 }} 
                              onPress={() => handlePayBill(item)}
                            >
                              <Check size={16} color="#FFF" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.mobileCardBody}>
                        <Text style={[styles.priceText, { color: (item.type === 'receita' || item.type === 'capital') ? '#10B981' : '#EF4444' }]}>
                          {(item.type === 'receita' || item.type === 'capital') ? '+' : '-'} R$ {(item.value || 0).toFixed(2)}
                        </Text>
                        {activeTab !== 'contas_pagar' && (
                          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Recebido' || item.status === 'Pago' ? '#D4EDDA' : '#FFF3CD' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Recebido' || item.status === 'Pago' ? '#155724' : '#856404' }]}>{item.status}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View key={item.id} style={styles.tableRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.itemName}>{item.desc}</Text>
                        <Text style={styles.itemSub}>{item.category || 'Sem Categoria'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        {activeTab === 'contas_pagar' ? (
                          <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '500' }}>
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </Text>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Recebido' || item.status === 'Pago' ? '#D4EDDA' : '#FFF3CD', alignSelf: 'flex-start' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Recebido' || item.status === 'Pago' ? '#155724' : '#856404' }]}>{item.status}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.priceText, { flex: 1, color: (item.type === 'receita' || item.type === 'capital') ? '#10B981' : '#EF4444' }]}>
                        {(item.type === 'receita' || item.type === 'capital') ? '+' : '-'} R$ {(item.value || 0).toFixed(2)}
                      </Text>
                      <View style={{ width: activeTab === 'contas_pagar' ? 140 : 80, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                        {activeTab === 'contas_pagar' && (
                          <TouchableOpacity 
                            style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }} 
                            onPress={() => handlePayBill(item)}
                          >
                            <Check size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>Baixar</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#DC3545" /></TouchableOpacity>
                      </View>
                    </View>
                  )
                ))}
              </ScrollView>
            )}
          </View>
        </>
      ) : activeTab === 'caixa_pessoal' ? (
        <PersonalCash transactions={transactions} fetchData={fetchData} />
      ) : (
        <CreditScreen />
      )}

      <FinanceModal 
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        saveLoading={saveLoading}
        activeTab={activeTab}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
      />
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
  tabBar: { flexDirection: 'row', backgroundColor: Theme.colors.surface, borderRadius: 10, padding: 4, gap: 6, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, gap: 6, flexShrink: 0 },
  tabActive: { backgroundColor: Theme.colors.inputBackground },
  tabText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary },
  tabTextActive: { color: Theme.colors.accent },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  summaryCardsMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryCard: { flexGrow: 1, minWidth: 120, backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderLeftWidth: 5 },
  summaryLabel: { fontSize: 12, color: Theme.colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4, color: Theme.colors.textPrimary },
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.lg, height: 44 },
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  priceText: { fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: Theme.spacing.xl, color: Theme.colors.textSecondary, fontSize: 16 },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  mobileActions: { flexDirection: 'row', gap: 15 }
});

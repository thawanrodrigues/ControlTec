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
import { 
  Search, Plus, List, CircleDollarSign, CreditCard, Trash2, Check, 
  Wallet, Coins, ChevronRight, TrendingUp, TrendingDown, ArrowDownLeft, ArrowDown 
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import CreditScreen from './credit';
import FinanceModal from './components/FinanceModal';
import PersonalCash from './components/PersonalCash';
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
        <View style={styles.titleRow}>
          <Coins color="#FFFFFF" size={28} />
          <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Financeiro</Text>
        </View>
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
            <Plus color="#0F172A" size={18} />
            <Text style={styles.addButtonText}>
              {activeTab === 'contas_pagar' ? 'Novo Lançamento' : 'Novo Lançamento'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBarWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBarScrollContent}
        >
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'lancamentos' && styles.tabActive]} 
              onPress={() => setActiveTab('lancamentos')}
            >
              <List size={18} color={activeTab === 'lancamentos' ? '#EAB308' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'lancamentos' && styles.tabTextActive]}>Lançamentos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'contas_pagar' && styles.tabActive]} 
              onPress={() => setActiveTab('contas_pagar')}
            >
              <CircleDollarSign size={18} color={activeTab === 'contas_pagar' ? '#EAB308' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'contas_pagar' && styles.tabTextActive]}>Contas a Pagar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'caixa_pessoal' && styles.tabActive]} 
              onPress={() => setActiveTab('caixa_pessoal')}
            >
              <Wallet size={18} color={activeTab === 'caixa_pessoal' ? '#EAB308' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'caixa_pessoal' && styles.tabTextActive]}>Caixa Pessoal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tab, activeTab === 'credito' && styles.tabActive]} 
              onPress={() => setActiveTab('credito')}
            >
              <CreditCard size={18} color={activeTab === 'credito' ? '#EAB308' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'credito' && styles.tabTextActive]}>Crédito ao Cliente</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {(activeTab === 'lancamentos' || activeTab === 'contas_pagar') ? (
        <>
          {activeTab === 'lancamentos' ? (
            <View style={[styles.summaryCards, isCompact ? styles.summaryCardsMobile : undefined]}>
              <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
                <View style={styles.summaryCardLeft}>
                  <View style={[styles.summaryIconBadge, { backgroundColor: '#DCFCE7' }]}>
                    <ArrowDownLeft color="#10B981" size={22} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>TOTAL ENTRADAS</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>R$ {totalIncome.toFixed(2)}</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>

              <View style={[styles.summaryCard, { borderLeftColor: '#EF4444' }]}>
                <View style={styles.summaryCardLeft}>
                  <View style={[styles.summaryIconBadge, { backgroundColor: '#FEE2E2' }]}>
                    <ArrowDown color="#EF4444" size={22} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>TOTAL DESPESAS</Text>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {totalExpense.toFixed(2)}</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>

              <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
                <View style={styles.summaryCardLeft}>
                  <View style={[styles.summaryIconBadge, { backgroundColor: '#FEF3C7' }]}>
                    <CreditCard color="#F59E0B" size={20} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>SALDO</Text>
                    <Text style={[styles.summaryValue, { color: '#0F172A' }]}>R$ {(totalIncome - totalExpense).toFixed(2)}</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>
            </View>
          ) : (
            <View style={[styles.summaryCards, isCompact ? styles.summaryCardsMobile : undefined]}>
              <View style={[styles.summaryCard, { borderLeftColor: '#EF4444', flex: 2 }]}>
                <View style={styles.summaryCardLeft}>
                  <View style={[styles.summaryIconBadge, { backgroundColor: '#FEE2E2' }]}>
                    <ArrowDown color="#EF4444" size={22} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>TOTAL CONTAS A PAGAR</Text>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>R$ {totalPendingBills.toFixed(2)}</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>

              <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
                <View style={styles.summaryCardLeft}>
                  <View style={[styles.summaryIconBadge, { backgroundColor: '#FEF3C7' }]}>
                    <CircleDollarSign color="#F59E0B" size={20} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>CONTAS PENDENTES</Text>
                    <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{pendingBills.length}</Text>
                  </View>
                </View>
                <ChevronRight color="#94A3B8" size={18} />
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.searchBar}>
              <Search color="#94A3B8" size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === 'contas_pagar' ? "Pesquisar contas a pagar..." : "Pesquisar por descrição ou categoria..."}
                placeholderTextColor="#94A3B8"
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
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>DESCRIÇÃO / CATEGORIA</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      {activeTab === 'contas_pagar' ? 'VENCIMENTO' : 'STATUS'}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>VALOR</Text>
                    <Text style={[styles.tableHeaderText, { width: activeTab === 'contas_pagar' ? 140 : 80, textAlign: 'center' }]}>AÇÕES</Text>
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
                          <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.mobileCardBody}>
                        <Text style={[styles.priceText, { color: (item.type === 'receita' || item.type === 'capital') ? '#10B981' : '#EF4444' }]}>
                          {(item.type === 'receita' || item.type === 'capital') ? '+' : '-'} R$ {(item.value || 0).toFixed(2)}
                        </Text>
                        {activeTab !== 'contas_pagar' && (
                          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Recebido' || item.status === 'Pago' ? '#DCFCE7' : '#FEF3C7' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Recebido' || item.status === 'Pago' ? '#166534' : '#92400E' }]}>{item.status}</Text>
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
                          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Recebido' || item.status === 'Pago' ? '#DCFCE7' : '#FEF3C7', alignSelf: 'flex-start' }]}>
                            <Text style={[styles.statusText, { color: item.status === 'Recebido' || item.status === 'Pago' ? '#166534' : '#92400E' }]}>{item.status}</Text>
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
                        <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: Theme.spacing.md },
  headerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  pageTitleBlock: { flexShrink: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFB703', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  addButtonBlock: { alignSelf: 'stretch', justifyContent: 'center' },
  addButtonText: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  
  // Tab Bar (Pill Card)
  tabBarWrapper: { marginBottom: 20, flexGrow: 0, flexShrink: 0, alignSelf: 'flex-start' },
  tabBarScroll: { flexGrow: 0, flexShrink: 0 },
  tabBarScrollContent: { flexGrow: 0, alignItems: 'center' },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 6, 
    gap: 12, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 9, 
    paddingHorizontal: 18, 
    borderRadius: 10, 
    gap: 8, 
    flexShrink: 0,
    backgroundColor: 'transparent'
  },
  tabActive: { 
    backgroundColor: '#F1F5F9' 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#475569' 
  },
  tabTextActive: { 
    color: '#EAB308', 
    fontWeight: '800' 
  },

  // Summary Cards
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  summaryCardsMobile: { flexDirection: 'column', gap: 10, marginBottom: 16 },
  summaryCard: { 
    flex: 1, 
    minWidth: 220, 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 14, 
    borderLeftWidth: 5, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 3 
  },
  summaryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.4 },
  summaryValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },

  // Table Card
  card: { flex: 1, minHeight: 250, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, marginBottom: 18, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B', ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 6 },
  tableHeaderText: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  itemSub: { fontSize: 12, color: '#64748B', marginTop: 2, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  priceText: { fontSize: 14, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontSize: 15 },
  
  // Mobile Card
  mobileCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  mobileActions: { flexDirection: 'row', gap: 12 }
});

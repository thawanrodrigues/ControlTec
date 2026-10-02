import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle,
  Check,
  CircleDollarSign,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import HomeModals from './components/HomeModals';
import { useRouter } from 'expo-router';

type ModalType = 'os' | 'cliente' | 'despesa' | null;

export default function Home() {
  const { width, isCompact } = useBreakpoints();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pendingBills, setPendingBills] = useState<any[]>([]);

  const [stats, setStats] = useState({
    customers: 0,
    activeOrders: 0,
    monthlyRevenue: 0,
    cashBalance: 0
  });
  const [isAdmin, setIsAdmin] = useState(true);
  const [showValues, setShowValues] = useState(true);

  // Dados para modais
  const [customers, setCustomers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  // Formulários de modais
  const [formOs, setFormOs] = useState({
    status: 'Aberto', description: '', defect: '', totalValue: '0', customerId: '', deviceId: '', technician: '',
    isNewCustomer: false, newCustomerName: '', isNewDevice: false, newDeviceType: '', newDeviceModel: ''
  });
  const [formCliente, setFormCliente] = useState({
    name: '', email: '', phone: '', document: '', address: ''
  });
  const [formDespesa, setFormDespesa] = useState({
    description: '', type: 'despesa', amount: '0', category: '', status: 'Pendente'
  });

  const handlePayBillHome = async (item: any) => {
    try {
      await api.update('finance', item.id, {
        desc: item.desc,
        type: item.type,
        value: item.value,
        category: item.category,
        status: 'Pago',
        date: new Date()
      });
      fetchStats();
      if (Platform.OS === 'web') {
        alert(`Conta "${item.desc}" marcada como PAGA! O valor de R$ ${item.value.toFixed(2)} foi lançado como despesa.`);
      } else {
        Alert.alert('Sucesso', `Conta "${item.desc}" marcada como PAGA!`);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const fetchStats = async () => {
    try {
      const [custData, orders, finance, devData] = await Promise.all([
        api.getAll('customers'),
        api.getAll('orders'),
        api.getAll('finance'),
        api.getAll('devices')
      ]);

      setCustomers(custData);
      setDevices(devData);
      const bills = finance.filter((f: any) => f.type === 'despesa' && f.status === 'Pendente');
      setPendingBills(bills);

      const monthlyRevenue = finance
        .filter((f: any) => f.type === 'receita' && f.status === 'Recebido')
        .reduce((acc: number, f: any) => acc + (f.value || 0), 0);

      const despesas = finance
        .filter((f: any) => f.type === 'despesa' && f.status === 'Pago')
        .reduce((acc: number, f: any) => acc + (f.value || 0), 0);

      setStats({
        customers: custData.length,
        activeOrders: orders.filter((o: any) => o.status !== 'Concluído').length,
        monthlyRevenue,
        cashBalance: monthlyRevenue - despesas
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      const adminCheck = role === 'admin' || role === null || role === undefined || role === '';
      setIsAdmin(adminCheck);
      setShowValues(adminCheck); // Visível para admin por padrão, oculto para funcionário
      fetchStats();
    };
    checkAccess();
  }, []);

  const handleSaveOs = async () => {
    if (!formOs.customerId || !formOs.deviceId) {
      Alert.alert('Aviso', 'Cliente e Aparelho são obrigatórios');
      return;
    }
    setSaveLoading(true);
    try {
      const payload: any = {
        customerId: formOs.customerId,
        deviceId: formOs.deviceId,
        deviceModel: formOs.deviceModel || '',
        status: formOs.status,
        description: formOs.description,
        defect: formOs.defect,
        totalValue: parseFloat(formOs.totalValue) || 0,
        technician: formOs.technician
      };

      if (formOs.isNewCustomer && formOs.newCustomerName) {
        payload.customerId = formOs.newCustomerName;
      }
      if (formOs.isNewDevice && formOs.newDeviceType) {
        payload.deviceId = formOs.newDeviceType;
        payload.deviceModel = formOs.newDeviceModel;
      }

      await api.create('orders', payload);
      setActiveModal(null);
      setFormOs({ 
        status: 'Aberto', description: '', defect: '', totalValue: '0', customerId: '', deviceId: '', technician: '',
        isNewCustomer: false, newCustomerName: '', isNewDevice: false, newDeviceType: '', newDeviceModel: ''
      });
      fetchStats();
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setSaveLoading(false); }
  };

  const handleSaveCliente = async () => {
    if (!formCliente.name) { Alert.alert('Aviso', 'Nome é obrigatório'); return; }
    setSaveLoading(true);
    try {
      await api.create('customers', formCliente);
      setActiveModal(null);
      setFormCliente({ name: '', email: '', phone: '', document: '', address: '' });
      fetchStats();
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setSaveLoading(false); }
  };

  const handleSaveDespesa = async () => {
    if (!formDespesa.description) { Alert.alert('Aviso', 'Descrição é obrigatória'); return; }
    setSaveLoading(true);
    try {
      await api.create('finance', { ...formDespesa, amount: parseFloat(formDespesa.amount) || 0, value: parseFloat(formDespesa.amount) || 0 });
      setActiveModal(null);
      setFormDespesa({ description: '', type: 'despesa', amount: '0', category: '', status: 'Pendente' });
      fetchStats();
    } catch (e: any) { Alert.alert('Erro', e.message); }
    finally { setSaveLoading(false); }
  };

  const kpis = [
    { title: 'Clientes', value: stats.customers, icon: Users, color: '#4F46E5', label: 'Total cadastrados' },
    { title: 'OS Ativas', value: stats.activeOrders, icon: ClipboardList, color: '#10B981', label: 'Em andamento' },
    { title: 'Receita', value: `R$ ${stats.monthlyRevenue.toFixed(2)}`, icon: TrendingUp, color: '#F59E0B', label: 'Este mês' },
    { title: 'Saldo Caixa', value: `R$ ${stats.cashBalance.toFixed(2)}`, icon: CircleDollarSign, color: stats.cashBalance >= 0 ? '#10B981' : '#EF4444', label: 'Caixa atual' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isCompact ? Theme.spacing.md : Math.max(Theme.spacing.md, Math.min(Theme.spacing.xl * 2, width * 0.05)) },
        ]}
      >
        <View style={[styles.header, isCompact && styles.headerMobile]}>
          <View>
            <Text style={[styles.welcomeText, isCompact && styles.welcomeTextMobile]}>Olá, Bem-vindo!</Text>
            <Text style={[styles.dateText, isCompact && styles.dateTextMobile]}>Resumo da assistência hoje.</Text>
          </View>
        </View>

        {pendingBills.length > 0 && (
          <View style={styles.alertPanel}>
            <View style={styles.alertHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.alertTitle}>Contas a Pagar Pendentes ({pendingBills.length})</Text>
              </View>
              <Text style={styles.alertSubtitle}>Lembrete de compromissos financeiros cadastrados no sistema.</Text>
            </View>
            <View style={styles.alertList}>
              {pendingBills.map((bill) => (
                <View key={bill.id} style={styles.alertItem}>
                  <View style={{ flex: 1, minWidth: 150 }}>
                    <Text style={styles.alertItemDesc}>{bill.desc}</Text>
                    <Text style={styles.alertItemMeta}>
                      Vencimento: {new Date(bill.date).toLocaleDateString('pt-BR')} • {bill.category || 'Sem Categoria'}
                    </Text>
                  </View>
                  <View style={styles.alertItemRight}>
                    <Text style={styles.alertItemValue}>R$ {bill.value.toFixed(2)}</Text>
                    <TouchableOpacity 
                      style={styles.alertPayBtn} 
                      onPress={() => handlePayBillHome(bill)}
                    >
                      <Check size={14} color="#FFF" />
                      <Text style={styles.alertPayBtnText}>Baixar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.kpiGrid, isCompact && styles.kpiGridMobile]}>
          {kpis.map((kpi, index) => {
            const isFinancial = kpi.title === 'Receita' || kpi.title === 'Saldo Caixa';
            const displayValue = isFinancial && !showValues ? 'R$ •••••' : kpi.value;
            
            if (isCompact) {
              // Layout mobile (coluna)
              return (
                <View key={index} style={[styles.kpiCard, styles.kpiCardMobile]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
                    <View style={[styles.iconContainer, styles.iconContainerMobile, { backgroundColor: kpi.color + '20' }]}>
                      <kpi.icon size={20} color={kpi.color} />
                    </View>
                    {isFinancial && (
                      <TouchableOpacity
                        onPress={() => {
                          if (isAdmin) {
                            setShowValues(!showValues);
                          } else {
                            Alert.alert('Acesso Restrito', 'Apenas usuários administradores podem visualizar estes dados financeiros.');
                          }
                        }}
                        style={{ padding: 4 }}
                      >
                        {showValues && isAdmin ? (
                          <Eye size={18} color={Theme.colors.textSecondary} />
                        ) : (
                          <EyeOff size={18} color={Theme.colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.kpiInfo, styles.kpiInfoMobile]}>
                    <Text style={[styles.kpiTitle, styles.kpiTitleMobile]}>{kpi.title}</Text>
                    <Text style={[styles.kpiValue, styles.kpiValueMobile]}>{displayValue}</Text>
                  </View>
                </View>
              );
            }

            // Layout desktop (linha)
            return (
              <View key={index} style={styles.kpiCard}>
                <View style={[styles.iconContainer, { backgroundColor: kpi.color + '20' }]}>
                  <kpi.icon size={24} color={kpi.color} />
                </View>
                <View style={styles.kpiInfo}>
                  <Text style={styles.kpiTitle}>{kpi.title}</Text>
                  <Text style={styles.kpiValue}>{displayValue}</Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                </View>
                {isFinancial && (
                  <TouchableOpacity
                    onPress={() => {
                      if (isAdmin) {
                        setShowValues(!showValues);
                      } else {
                        Alert.alert('Acesso Restrito', 'Apenas usuários administradores podem visualizar estes dados financeiros.');
                      }
                    }}
                    style={{ padding: 8, marginLeft: 'auto' }}
                  >
                    {showValues && isAdmin ? (
                      <Eye size={20} color={Theme.colors.textSecondary} />
                    ) : (
                      <EyeOff size={20} color={Theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.mainRow, isCompact ? styles.mainRowMobile : undefined]}>
          <View style={[styles.section, styles.actionsSection, isCompact ? styles.sectionMobile : undefined]}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setActiveModal('os')}>
                <Text style={styles.actionButtonText}>Nova OS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/dashboard/estimates?openModal=true')}>
                <Text style={styles.actionButtonText}>Novo Orçamento</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setActiveModal('cliente')}>
                <Text style={styles.actionButtonText}>Novo Cliente</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border }]}
                onPress={() => setActiveModal('despesa')}
              >
                <Text style={[styles.actionButtonText, { color: Theme.colors.textPrimary }]}>Lançar Despesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <HomeModals 
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        saveLoading={saveLoading}
        formOs={formOs}
        setFormOs={setFormOs}
        customers={customers}
        devices={devices}
        handleSaveOs={handleSaveOs}
        formCliente={formCliente}
        setFormCliente={setFormCliente}
        handleSaveCliente={handleSaveCliente}
        formDespesa={formDespesa}
        setFormDespesa={setFormDespesa}
        handleSaveDespesa={handleSaveDespesa}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { paddingVertical: Theme.spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { marginBottom: Theme.spacing.xl },
  headerMobile: { marginBottom: Theme.spacing.md },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textInverse },
  welcomeTextMobile: { fontSize: 22 },
  dateText: { fontSize: 16, color: Theme.colors.textInverse, opacity: 0.7, marginTop: 4 },
  dateTextMobile: { fontSize: 13 },
  // KPI Grid — 2x2 no mobile
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  kpiGridMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  kpiCard: { flex: 1, minWidth: 200, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  kpiCardMobile: { 
    minWidth: '47%', 
    maxWidth: '49%', 
    flex: 0, 
    width: '48%',
    flexDirection: 'column', 
    alignItems: 'flex-start',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
  },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Theme.spacing.md },
  iconContainerMobile: { width: 36, height: 36, borderRadius: 18, marginRight: 0, marginBottom: 8 },
  kpiInfo: { flex: 1 },
  kpiInfoMobile: { flex: 0 },
  kpiTitle: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiTitleMobile: { fontSize: 10 },
  kpiValue: { fontSize: 20, fontWeight: '900', color: Theme.colors.textPrimary, marginVertical: 2 },
  kpiValueMobile: { fontSize: 18 },
  kpiLabel: { fontSize: 11, color: Theme.colors.textSecondary },
  mainRow: { flexDirection: 'row', gap: Theme.spacing.lg },
  mainRowMobile: { flexDirection: 'column' },
  section: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  sectionMobile: { width: '100%', minWidth: 0 },
  actionsSection: { flex: 1, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  actionsGrid: { gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  actionButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.md, borderRadius: Theme.borderRadius.sm, alignItems: 'center' },
  actionButtonText: { color: Theme.colors.textInverse, fontWeight: 'bold', fontSize: 14 },
  alertPanel: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  alertHeader: {
    marginBottom: Theme.spacing.md
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E'
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2
  },
  alertList: {
    gap: Theme.spacing.sm
  },
  alertItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    gap: Theme.spacing.md
  },
  alertItemDesc: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary
  },
  alertItemMeta: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2
  },
  alertItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0
  },
  alertItemValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626'
  },
  alertPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    gap: 4
  },
  alertPayBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
});

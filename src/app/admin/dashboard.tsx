import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../ui/themes';
import { 
  Building2, 
  Users, 
  HardDrive, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Power, 
  LogOut, 
  RefreshCw 
} from 'lucide-react-native';
import { api } from '../../services/api';

interface CompanyData {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  blocked: boolean;
  employeeCount: number;
  storageUsed: number;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCompanies = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      console.log('[AdminDashboard] Fetching companies...');
      const data = await api.getAdminCompanies();
      setCompanies(data);
    } catch (error: any) {
      console.error('[AdminDashboard] Fetch error:', error);
      if (Platform.OS === 'web') {
        alert('Erro ao carregar dados do servidor. Certifique-se de que o backend está ativo.');
      } else {
        Alert.alert('Erro', 'Não foi possível buscar as empresas. Tente novamente.');
      }
      
      // Se der erro de autenticação, volta pro login admin
      if (error.message && (error.message.includes('Token') || error.message.includes('401') || error.message.includes('403'))) {
        await api.clearAdminToken();
        router.replace('/admin');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      // Pequeno timeout para garantir que o api.init() do RootLayout tenha rodado
      setTimeout(async () => {
        await fetchCompanies();
      }, 200);
    };
    initDashboard();
  }, []);

  const handleLogout = async () => {
    await api.clearAdminToken();
    router.replace('/');
  };

  const handleToggleBlock = async (company: CompanyData) => {
    setActionLoadingId(company.id);
    try {
      console.log(`[AdminDashboard] Toggling block for company: ${company.name}`);
      await api.toggleBlockCompany(company.id);
      
      // Atualizar estado local de forma otimista e elegante
      setCompanies(prev => prev.map(c => {
        if (c.id === company.id) {
          return { ...c, blocked: !c.blocked };
        }
        return c;
      }));
    } catch (error: any) {
      console.error('[AdminDashboard] Toggle block error:', error);
      if (Platform.OS === 'web') {
        alert('Erro ao alterar status de bloqueio da empresa.');
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o status da empresa.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtragem em tempo real
  const filteredCompanies = companies.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(query)) ||
      c.cnpj.replace(/[^\d]/g, '').includes(query) ||
      c.cnpj.includes(query)
    );
  });

  // Métricas Consolidadas
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => !c.blocked).length;
  const blockedCompanies = companies.filter(c => c.blocked).length;
  const totalEmployees = companies.reduce((sum, c) => sum + c.employeeCount, 0);
  const totalStorage = companies.reduce((sum, c) => sum + c.storageUsed, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB703" />
        <Text style={styles.loadingText}>Carregando infraestrutura ControlTec...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Control<Text style={{ color: '#FFB703' }}>Tec</Text></Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>MASTER ADMIN</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchCompanies(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw color="#FFFFFF" size={18} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut color="#FF3B30" size={18} style={{ marginRight: 6 }} />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Painel de Métricas Gerais com Design Premium */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, { backgroundColor: '#0B2246' }]}>
            <View style={styles.metricIconWrap}>
              <Building2 color="#FFB703" size={24} />
            </View>
            <Text style={styles.metricValue}>{totalCompanies}</Text>
            <Text style={styles.metricLabel}>Empresas Parceiras</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>🟢 {activeCompanies} Ativas</Text>
              <Text style={[styles.metricSubText, { marginLeft: 8 }]}>🔴 {blockedCompanies} Bloq.</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#0A313C' }]}>
            <View style={styles.metricIconWrap}>
              <Users color="#34C759" size={24} />
            </View>
            <Text style={styles.metricValue}>{totalEmployees}</Text>
            <Text style={styles.metricLabel}>Funcionários Ativos</Text>
            <Text style={styles.metricSubText}>Soma global de técnicos</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#20163A' }]}>
            <View style={styles.metricIconWrap}>
              <HardDrive color="#5E5CE6" size={24} />
            </View>
            <Text style={styles.metricValue}>{totalStorage.toFixed(2)} GB</Text>
            <Text style={styles.metricLabel}>Espaço de Dados</Text>
            <Text style={styles.metricSubText}>Armazenamento total em uso</Text>
          </View>
        </View>

        {/* Barra de Pesquisa e Tabela */}
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Gerenciamento de Licenças</Text>
            <Text style={styles.cardSubtitle}>
              Bloqueie ou libere acesso instantaneamente e monitore uso de banco de dados
            </Text>
          </View>

          {/* Input de Busca */}
          <View style={styles.searchWrapper}>
            <Search color="#6E6E73" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome da empresa ou CNPJ..."
              placeholderTextColor="#6E6E73"
              value={searchQuery}
              onChangeText={setSearchQuery}
              {...Platform.select({
                web: { outlineStyle: 'none' as any }
              })}
            />
          </View>

          {/* Listagem de Empresas */}
          {filteredCompanies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Building2 color="#6E6E73" size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Text style={styles.emptyText}>Nenhuma empresa encontrada</Text>
              <Text style={styles.emptySubtext}>Verifique os termos digitados na busca</Text>
            </View>
          ) : (
            filteredCompanies.map(company => (
              <View key={company.id} style={[styles.companyRow, company.blocked && styles.companyRowBlocked]}>
                <View style={styles.companyInfoColumn}>
                  <View style={styles.companyNameRow}>
                    <Text style={styles.companyNameText}>{company.name}</Text>
                    {company.blocked ? (
                      <View style={styles.statusBadgeBlocked}>
                        <ShieldAlert color="#FF3B30" size={12} style={{ marginRight: 4 }} />
                        <Text style={styles.statusTextBlocked}>Bloqueada</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadgeActive}>
                        <ShieldCheck color="#34C759" size={12} style={{ marginRight: 4 }} />
                        <Text style={styles.statusTextActive}>Ativa</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.companyDetailText}>
                    CNPJ: {company.cnpj} {company.tradeName ? `• ${company.tradeName}` : ''}
                  </Text>
                  
                  {/* Grid de Uso em tempo real */}
                  <View style={styles.resourceGrid}>
                    <View style={styles.resourceItem}>
                      <Users color="#071630" size={14} style={styles.resourceIcon} />
                      <Text style={styles.resourceText}>{company.employeeCount} Funcionários</Text>
                    </View>
                    <View style={styles.resourceItem}>
                      <HardDrive color="#071630" size={14} style={styles.resourceIcon} />
                      <Text style={styles.resourceText}>{company.storageUsed.toFixed(3)} GB usados</Text>
                    </View>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.actionsColumn}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      company.blocked ? styles.actionButtonUnlock : styles.actionButtonLock
                    ]}
                    onPress={() => handleToggleBlock(company)}
                    disabled={actionLoadingId === company.id}
                    activeOpacity={0.7}
                  >
                    {actionLoadingId === company.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Power color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
                        <Text style={styles.actionButtonText}>
                          {company.blocked ? 'Desbloquear' : 'Bloquear'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071630', // Azul escuro premium espacial
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#071630',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 183, 3, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.25)',
    marginLeft: 10,
  },
  headerBadgeText: {
    color: '#FFB703',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.15)',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  metricsContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.7,
    marginTop: 4,
  },
  metricSubRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metricSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.6,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: Theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#071630',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 4,
    lineHeight: 18,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#1C1C1E',
    fontSize: 15,
  },
  companyRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    padding: Theme.spacing.md,
    borderRadius: 16,
    backgroundColor: '#F9F9FB',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: Theme.spacing.md,
  },
  companyRowBlocked: {
    backgroundColor: 'rgba(255, 59, 48, 0.03)',
    borderColor: 'rgba(255, 59, 48, 0.15)',
  },
  companyInfoColumn: {
    flex: 1,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  statusTextActive: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  statusTextBlocked: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyDetailText: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 4,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: Theme.spacing.md,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 22, 48, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resourceIcon: {
    opacity: 0.6,
    marginRight: 6,
  },
  resourceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#071630',
    opacity: 0.8,
  },
  actionsColumn: {
    justifyContent: 'center',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'stretch',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    minWidth: 130,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonLock: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  actionButtonUnlock: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 4,
  },
});

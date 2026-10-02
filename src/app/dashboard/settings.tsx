import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Switch, Modal, ActivityIndicator, Platform, Image 
} from 'react-native';
import { Theme, setThemeColors, getSidebarMode, setSidebarMode } from '../../ui/themes';
import { useBreakpoints } from '../../ui/useBreakpoints';
import { 
  Building2, User, Bell, Shield, Palette, Printer, 
  Save, ChevronRight, LogOut, Mail, Phone, MapPin,
  Users, Trash2, Plus, X, Search, ArrowLeft, Package,
  FileText, CreditCard, Calendar, Share2, CheckCircle2,
  Lock, AlertTriangle, Sliders, Smartphone, HelpCircle,
  LayoutGrid, MousePointer2, Check, Upload, Image as ImageIcon
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';

export type SectionId = 
  | 'empresa' 
  | 'equipe' 
  | 'usuario' 
  | 'notificacoes' 
  | 'seguranca' 
  | 'aparencia' 
  | 'impressao'
  | 'estoque'
  | 'os'
  | 'pagamentos'
  | 'agendamentos'
  | 'integracoes';

interface SettingCard {
  id: SectionId;
  title: string;
  description: string;
  category: string;
  icon: any;
}

const SETTING_CARDS: SettingCard[] = [
  {
    id: 'empresa',
    title: 'Dados da Empresa',
    description: 'Logo, CNPJ, razão social, endereço, telefone e dados nos documentos.',
    category: 'Empresa & Acessos',
    icon: Building2,
  },
  {
    id: 'equipe',
    title: 'Colaboradores',
    description: 'Perfis, papéis de acesso, técnicos e permissões por empresa.',
    category: 'Empresa & Acessos',
    icon: Users,
  },
  {
    id: 'usuario',
    title: 'Meu Perfil',
    description: 'Nome, e-mail de login, telefone e dados da sua conta.',
    category: 'Empresa & Acessos',
    icon: User,
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Regras de estoque negativo, baixa automática e alertas de validade.',
    category: 'Operação & Serviços',
    icon: Package,
  },
  {
    id: 'os',
    title: 'Ordens de Serviço',
    description: 'Garantia padrão, termos contratuais, numeração e preferências.',
    category: 'Operação & Serviços',
    icon: FileText,
  },
  {
    id: 'agendamentos',
    title: 'Agendamentos',
    description: 'Regras de disponibilidade, horários de operação e visitas técnicas.',
    category: 'Operação & Serviços',
    icon: Calendar,
  },
  {
    id: 'pagamentos',
    title: 'Formas de Pagamento',
    description: 'Cadastre e ative as formas usadas ao registrar vendas e ordens.',
    category: 'Financeiro & Vendas',
    icon: CreditCard,
  },
  {
    id: 'impressao',
    title: 'Impressão & Etiquetas',
    description: 'Modelos de OS em A4/80mm, recibos térmicos e medidas de etiquetas.',
    category: 'Impressão & Documentos',
    icon: Printer,
  },
  {
    id: 'notificacoes',
    title: 'Notificações',
    description: 'Alertas de novas OS, estoque baixo e comunicações automáticas.',
    category: 'Sistema & Segurança',
    icon: Bell,
  },
  {
    id: 'seguranca',
    title: 'Segurança & Acesso',
    description: 'Senha de acesso, autenticação em duas etapas e bloqueio de sessão.',
    category: 'Sistema & Segurança',
    icon: Shield,
  },
  {
    id: 'aparencia',
    title: 'Aparência & Tema',
    description: 'Cores do sistema, barra lateral recolhida apenas com ícones e modo escuro.',
    category: 'Sistema & Segurança',
    icon: Palette,
  },
  {
    id: 'integracoes',
    title: 'Integrações & Backup',
    description: 'Exportação de relatórios, envio via WhatsApp e backups de segurança.',
    category: 'Sistema & Segurança',
    icon: Share2,
  },
];

// Paletas de Cores Expandidas
const PRIMARY_COLORS = [
  { name: 'Azul Marinho', hex: '#0F2A5A' },
  { name: 'Azul Royal', hex: '#1E40AF' },
  { name: 'Azul Oceano', hex: '#0369A1' },
  { name: 'Verde Petróleo', hex: '#0F766E' },
  { name: 'Verde Esmeralda', hex: '#065F46' },
  { name: 'Verde Floresta', hex: '#14532D' },
  { name: 'Vinho Terracota', hex: '#7C2D12' },
  { name: 'Borgonha', hex: '#831843' },
  { name: 'Roxo Real', hex: '#581C87' },
  { name: 'Índigo Profundo', hex: '#4338CA' },
  { name: 'Grafite / Carbono', hex: '#1E293B' },
  { name: 'Preto Ônix', hex: '#09090B' },
  { name: 'Marrom Nobre', hex: '#451A03' },
];

const ACCENT_COLORS = [
  { name: 'Âmbar / Ouro', hex: '#FFB703' },
  { name: 'Azul Elétrico', hex: '#2563EB' },
  { name: 'Verde Esmeralda', hex: '#10B981' },
  { name: 'Ciano Vibrante', hex: '#06B6D4' },
  { name: 'Laranja Sunset', hex: '#F97316' },
  { name: 'Vermelho Rubi', hex: '#EF4444' },
  { name: 'Rosa Pink', hex: '#EC4899' },
  { name: 'Roxo Neon', hex: '#8B5CF6' },
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Turquesa', hex: '#14B8A6' },
  { name: 'Amarelo Sol', hex: '#FACC15' },
  { name: 'Magenta', hex: '#D946EF' },
];

export default function SettingsScreen() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isCompact } = useBreakpoints();
  const router = useRouter();
  const fileInputRef = useRef<any>(null);

  // Estados de Aparência & Sidebar
  const [selectedPrimary, setSelectedPrimary] = useState(Theme.colors.primary);
  const [selectedAccent, setSelectedAccent] = useState(Theme.colors.accent);
  const [currentSidebarMode, setCurrentSidebarMode] = useState<'icons_hover' | 'expanded' | 'topbar'>('icons_hover');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customAccent, setCustomAccent] = useState('');

  // Estados dos toggles
  const [notifOS, setNotifOS] = useState(true);
  const [notifEstoque, setNotifEstoque] = useState(true);
  const [notifFinanceiro, setNotifFinanceiro] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [printLogo, setPrintLogo] = useState(true);
  const [printTerms, setPrintTerms] = useState(true);

  // Estados de estoque e OS
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [defaultWarrantyDays, setDefaultWarrantyDays] = useState('90');
  const [osPrefix, setOsPrefix] = useState('OS-');
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', name: 'Dinheiro', active: true },
    { id: '2', name: 'PIX', active: true },
    { id: '3', name: 'Cartão de Crédito', active: true },
    { id: '4', name: 'Cartão de Débito', active: true },
    { id: '5', name: 'Boleto Bancário', active: true },
    { id: '6', name: 'Transferência / TED', active: false },
  ]);

  // Novos Estados Impressão
  const [paperSizeOs, setPaperSizeOs] = useState('A4');
  const [paperSizeReceipt, setPaperSizeReceipt] = useState('80mm');
  const [labelWidth, setLabelWidth] = useState('50');
  const [labelHeight, setLabelHeight] = useState('30');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [formUser, setFormUser] = useState({ name: '', email: '', password: '', role: 'Técnico' });

  // Estados da Empresa & Logo
  const [companyData, setCompanyData] = useState({ 
    name: '', 
    tradeName: '', 
    cnpj: '', 
    phone: '', 
    email: '', 
    address: '',
    logo: '' 
  });
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    setCurrentSidebarMode(getSidebarMode());
    setSelectedPrimary(Theme.colors.primary);
    setSelectedAccent(Theme.colors.accent);

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
        if (typeof window !== 'undefined' && window.localStorage) {
          if (localStorage.getItem('printSettings_paperSizeOs')) setPaperSizeOs(localStorage.getItem('printSettings_paperSizeOs')!);
          if (localStorage.getItem('printSettings_paperSizeReceipt')) setPaperSizeReceipt(localStorage.getItem('printSettings_paperSizeReceipt')!);
          if (localStorage.getItem('printSettings_labelWidth')) setLabelWidth(localStorage.getItem('printSettings_labelWidth')!);
          if (localStorage.getItem('printSettings_labelHeight')) setLabelHeight(localStorage.getItem('printSettings_labelHeight')!);
          const cachedLogo = localStorage.getItem('controltec_company_logo');
          if (cachedLogo) {
            setCompanyData(prev => ({ ...prev, logo: cachedLogo }));
          }
        }
      }
    };
    checkAccess();
  }, []);

  const handleApplyTheme = () => {
    const primary = customPrimary || selectedPrimary;
    const accent = customAccent || selectedAccent;
    setThemeColors(primary, accent);
    setSidebarMode(currentSidebarMode);
    alert('Aparência e tema atualizados com sucesso!');
  };

  const savePrintSettings = (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
    if (key === 'printSettings_paperSizeOs') setPaperSizeOs(value);
    if (key === 'printSettings_paperSizeReceipt') setPaperSizeReceipt(value);
    if (key === 'printSettings_labelWidth') setLabelWidth(value);
    if (key === 'printSettings_labelHeight') setLabelHeight(value);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getAll('users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'equipe') loadUsers();
    if (activeSection === 'empresa') loadCompany();
  }, [activeSection]);

  const loadCompany = async () => {
    setLoadingCompany(true);
    try {
      const data = await api.getCompany();
      const logo = data.logo || (typeof window !== 'undefined' ? localStorage.getItem('controltec_company_logo') || '' : '');
      setCompanyData({
        name: data.name || '',
        tradeName: data.tradeName || '',
        cnpj: data.cnpj || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        logo: logo || ''
      });
      if (logo && typeof window !== 'undefined') {
        localStorage.setItem('controltec_company_logo', logo);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      await api.updateCompany(companyData);
      if (typeof window !== 'undefined') {
        if (companyData.logo) {
          localStorage.setItem('controltec_company_logo', companyData.logo);
        } else {
          localStorage.removeItem('controltec_company_logo');
        }
      }
      alert('Dados da empresa e logotipo atualizados com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Upload do Logo
  const handleLogoUpload = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCompanyData(prev => ({ ...prev, logo: base64 }));
        if (typeof window !== 'undefined') {
          localStorage.setItem('controltec_company_logo', base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyData(prev => ({ ...prev, logo: '' }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('controltec_company_logo');
    }
  };

  const handleSaveUser = async () => {
    if (!formUser.name || !formUser.email || !formUser.password) return alert("Preencha os campos obrigatórios");
    try {
      await api.create('users', formUser);
      setUserModal(false);
      setFormUser({ name: '', email: '', password: '', role: 'Técnico' });
      loadUsers();
    } catch(err: any) { alert(err.message); }
  };

  const handleDeleteUser = async (id: string) => {
    if(confirm('Deseja excluir este funcionário?')) {
      try {
        await api.remove('users', id);
        loadUsers();
      } catch(err: any) { alert(err.message); }
    }
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  // Filtragem dos cards
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SETTING_CARDS;
    return SETTING_CARDS.filter(
      card => 
        card.title.toLowerCase().includes(q) || 
        card.description.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'empresa':
        return (
          <View>
            <Text style={styles.sectionTitle}>Dados da Empresa & Logotipo</Text>
            <Text style={styles.sectionDesc}>
              Informações e logotipo exibidos no cabeçalho de orçamentos, notas PDF de vendas e como marca d'água nos cupons.
            </Text>
            
            {loadingCompany ? <ActivityIndicator size="large" color={Theme.colors.primary} style={{marginTop: 40}} /> : (
              <View style={styles.formCard}>
                {/* Upload de Logotipo da Empresa */}
                <View style={styles.logoSection}>
                  <Text style={styles.label}>Logotipo da Empresa</Text>
                  <Text style={styles.helperText}>
                    Esta logo aparecerá no cabeçalho de todas as notas PDF de vendas e orçamentos, e como marca d'água transparente nos cupons térmicos (80mm/58mm).
                  </Text>

                  <View style={styles.logoRow}>
                    <View style={styles.logoPreviewContainer}>
                      {companyData.logo ? (
                        <img 
                          src={companyData.logo} 
                          alt="Logo da Empresa" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <View style={styles.logoPlaceholder}>
                          <ImageIcon size={32} color="#94A3B8" />
                          <Text style={styles.logoPlaceholderText}>Sem Logotipo</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.logoActions}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                        style={{ display: 'none' }} 
                      />

                      <TouchableOpacity 
                        style={styles.secondaryBtn} 
                        onPress={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} color={Theme.colors.primary} />
                        <Text style={styles.secondaryBtnText}>
                          {companyData.logo ? 'Alterar Logotipo' : 'Carregar Imagem da Logo'}
                        </Text>
                      </TouchableOpacity>

                      {companyData.logo ? (
                        <TouchableOpacity 
                          style={styles.removeLogoBtn} 
                          onPress={handleRemoveLogo}
                        >
                          <Trash2 size={16} color="#DC2626" />
                          <Text style={styles.removeLogoBtnText}>Remover Logo</Text>
                        </TouchableOpacity>
                      ) : null}

                      <Text style={styles.logoTipText}>
                        Recomendado: Imagem PNG com fundo transparente ou JPG (máx. 2MB).
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Razão Social</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ex: Minha Empresa de Tecnologia Ltda"
                    value={companyData.name} 
                    onChangeText={(t) => setCompanyData({...companyData, name: t})} 
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nome Fantasia</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ex: ControlTec Serviços"
                    value={companyData.tradeName} 
                    onChangeText={(t) => setCompanyData({...companyData, tradeName: t})} 
                  />
                </View>
                <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>CNPJ</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="00.000.000/0001-00"
                      value={companyData.cnpj} 
                      onChangeText={(t) => setCompanyData({...companyData, cnpj: t})} 
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Telefone / WhatsApp</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="(11) 98765-4321"
                      value={companyData.phone} 
                      onChangeText={(t) => setCompanyData({...companyData, phone: t})} 
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>E-mail de Contato</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="contato@empresa.com.br"
                    value={companyData.email} 
                    onChangeText={(t) => setCompanyData({...companyData, email: t})} 
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Endereço Completo</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={companyData.address} 
                    onChangeText={(t) => setCompanyData({...companyData, address: t})} 
                  />
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCompany}>
                  <Save size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Salvar Dados da Empresa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'aparencia':
        return (
          <View>
            <Text style={styles.sectionTitle}>Aparência & Personalização</Text>
            <Text style={styles.sectionDesc}>Personalize o visual, contraste, as cores de destaque e a barra lateral do painel.</Text>
            
            <View style={styles.formCard}>
              {/* Opção da Barra Lateral Solicitada pelo Usuário */}
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Barra Lateral & Navegação</Text>
                <Text style={styles.helperText}>
                  Escolha como a barra lateral de navegação é exibida no sistema:
                </Text>

                <View style={styles.sidebarOptionGrid}>
                  <TouchableOpacity
                    style={[
                      styles.sidebarOptionCard,
                      currentSidebarMode === 'icons_hover' && styles.sidebarOptionCardActive
                    ]}
                    onPress={() => setCurrentSidebarMode('icons_hover')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sidebarOptionHeader}>
                      <MousePointer2 size={20} color={currentSidebarMode === 'icons_hover' ? Theme.colors.primary : '#64748B'} />
                      <Text style={[styles.sidebarOptionTitle, currentSidebarMode === 'icons_hover' && { color: Theme.colors.primary }]}>
                        Apenas Ícones (Nomes no Hover)
                      </Text>
                      {currentSidebarMode === 'icons_hover' && <Check size={18} color={Theme.colors.primary} />}
                    </View>
                    <Text style={styles.sidebarOptionDesc}>
                      A barra lateral fica compacta exibindo somente os ícones. Os nomes das telas aparecem flutuantes ao passar o mouse.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sidebarOptionCard,
                      currentSidebarMode === 'expanded' && styles.sidebarOptionCardActive
                    ]}
                    onPress={() => setCurrentSidebarMode('expanded')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sidebarOptionHeader}>
                      <LayoutGrid size={20} color={currentSidebarMode === 'expanded' ? Theme.colors.primary : '#64748B'} />
                      <Text style={[styles.sidebarOptionTitle, currentSidebarMode === 'expanded' && { color: Theme.colors.primary }]}>
                        Expandida (Fixa)
                      </Text>
                      {currentSidebarMode === 'expanded' && <Check size={18} color={Theme.colors.primary} />}
                    </View>
                    <Text style={styles.sidebarOptionDesc}>
                      Exibe a barra lateral completa com os ícones e nomes das páginas sempre visíveis lado a lado.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sidebarOptionCard,
                      currentSidebarMode === 'topbar' && styles.sidebarOptionCardActive
                    ]}
                    onPress={() => setCurrentSidebarMode('topbar')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sidebarOptionHeader}>
                      <Sliders size={20} color={currentSidebarMode === 'topbar' ? Theme.colors.primary : '#64748B'} />
                      <Text style={[styles.sidebarOptionTitle, currentSidebarMode === 'topbar' && { color: Theme.colors.primary }]}>
                        Menu Superior (TopBar)
                      </Text>
                      {currentSidebarMode === 'topbar' && <Check size={18} color={Theme.colors.primary} />}
                    </View>
                    <Text style={styles.sidebarOptionDesc}>
                      Exibe o menu horizontal no topo da tela estilo barra de ferramentas.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Seletor de Cores Principais Expandido */}
              <View style={styles.subSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.subSectionTitle}>Cor Principal do Sistema</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.colorPreviewSmall, { backgroundColor: customPrimary || selectedPrimary }]} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{customPrimary || selectedPrimary}</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>Usada na barra lateral, login, cabeçalhos e fundo base do sistema.</Text>
                
                <View style={styles.colorPaletteGrid}>
                  {PRIMARY_COLORS.map(c => {
                    const isSelected = selectedPrimary.toLowerCase() === c.hex.toLowerCase() && !customPrimary;
                    return (
                      <TouchableOpacity 
                        key={c.hex} 
                        style={[
                          styles.colorPaletteItem,
                          isSelected && styles.colorPaletteItemActive
                        ]}
                        onPress={() => {
                          setSelectedPrimary(c.hex);
                          setCustomPrimary('');
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.colorCircleLarge, { backgroundColor: c.hex }]}>
                          {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.colorPaletteName, isSelected && { fontWeight: '700', color: '#0F172A' }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Cor Customizada */}
                <View style={[styles.customColorRow, { marginTop: 12 }]}>
                  <Text style={styles.label}>Ou escolha uma cor personalizada:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="color" 
                      value={customPrimary || selectedPrimary} 
                      onChange={(e) => {
                        setCustomPrimary(e.target.value);
                      }}
                      style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                    />
                    <TextInput 
                      style={[styles.input, { width: 140 }]} 
                      placeholder="#000000"
                      value={customPrimary}
                      onChangeText={setCustomPrimary}
                    />
                  </View>
                </View>
              </View>

              {/* Seletor de Cores de Destaque Expandido */}
              <View style={styles.subSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.subSectionTitle}>Cor de Destaque / Ação</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.colorPreviewSmall, { backgroundColor: customAccent || selectedAccent }]} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{customAccent || selectedAccent}</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>Usada nos botões principais de ação, badges e itens ativos selecionados.</Text>
                
                <View style={styles.colorPaletteGrid}>
                  {ACCENT_COLORS.map(c => {
                    const isSelected = selectedAccent.toLowerCase() === c.hex.toLowerCase() && !customAccent;
                    return (
                      <TouchableOpacity 
                        key={c.hex} 
                        style={[
                          styles.colorPaletteItem,
                          isSelected && styles.colorPaletteItemActive
                        ]}
                        onPress={() => {
                          setSelectedAccent(c.hex);
                          setCustomAccent('');
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.colorCircleLarge, { backgroundColor: c.hex }]}>
                          {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.colorPaletteName, isSelected && { fontWeight: '700', color: '#0F172A' }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Cor de Destaque Customizada */}
                <View style={[styles.customColorRow, { marginTop: 12 }]}>
                  <Text style={styles.label}>Ou escolha uma cor de destaque personalizada:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="color" 
                      value={customAccent || selectedAccent} 
                      onChange={(e) => {
                        setCustomAccent(e.target.value);
                      }}
                      style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                    />
                    <TextInput 
                      style={[styles.input, { width: 140 }]} 
                      placeholder="#FFB703"
                      value={customAccent}
                      onChangeText={setCustomAccent}
                    />
                  </View>
                </View>
              </View>

              {/* Toggles de Contraste e Modo */}
              <View style={styles.subSection}>
                <ToggleRow label="Modo Escuro (Dark Mode)" desc="Aplica contraste escuro elegante em todo o sistema" value={darkMode} onToggle={setDarkMode} />
                <ToggleRow label="Modo de Exibição Compacto" desc="Reduz espaçamentos para acomodar mais dados em telas menores" value={compactMode} onToggle={setCompactMode} />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleApplyTheme}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Aplicar Tema & Aparência</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'equipe':
        return (
          <View style={{ flex: 1 }}>
            <View style={[styles.sectionHeaderRow, isCompact ? { flexDirection: 'column', alignItems: 'flex-start', gap: 12 } : null]}>
              <View>
                <Text style={styles.sectionTitle}>Colaboradores & Equipe</Text>
                <Text style={styles.sectionDesc}>Gerencie os acessos, permissões e técnicos autorizados no sistema.</Text>
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setUserModal(true)}>
                <Plus size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Novo Funcionário</Text>
              </TouchableOpacity>
            </View>
            
            {loadingUsers ? <ActivityIndicator size="large" color={Theme.colors.primary} style={{marginTop: 40}} /> : (
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nome / E-mail</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Cargo</Text>
                  <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'center' }]}>Ações</Text>
                </View>
                {users.map(u => (
                  <View key={u.id} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.itemName}>{u.name}</Text>
                      <Text style={styles.itemSub}>{u.email}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.statusBadge, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={[styles.statusText, { color: Theme.colors.primary }]}>{u.role}</Text>
                      </View>
                    </View>
                    <View style={{ width: 80, alignItems: 'center' }}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteUser(u.id)}>
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {users.length === 0 && (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B' }}>Nenhum colaborador cadastrado.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );

      case 'usuario':
        return (
          <View>
            <Text style={styles.sectionTitle}>Meu Perfil</Text>
            <Text style={styles.sectionDesc}>Gerencie suas informações pessoais e credenciais de login.</Text>
            
            <View style={styles.formCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>AD</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>Administrador do Sistema</Text>
                  <Text style={styles.profileRole}>Gerência Técnica • Acesso Total</Text>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput style={styles.input} defaultValue="Administrador do Sistema" />
              </View>
              <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>E-mail de Acesso</Text>
                  <TextInput style={styles.input} defaultValue="admin@controltec.com.br" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Telefone Direto</Text>
                  <TextInput style={styles.input} defaultValue="(11) 98765-4321" />
                </View>
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Perfil atualizado com sucesso!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Meu Perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'estoque':
        return (
          <View>
            <Text style={styles.sectionTitle}>Regras de Estoque</Text>
            <Text style={styles.sectionDesc}>Defina as políticas de baixa, reserva e alertas automáticos de produtos.</Text>
            
            <View style={styles.formCard}>
              <ToggleRow 
                label="Permitir Estoque Negativo" 
                desc="Permite registrar saídas ou concluir OS mesmo sem saldo no estoque" 
                value={allowNegativeStock} 
                onToggle={setAllowNegativeStock} 
              />
              <ToggleRow 
                label="Baixa Automática ao Finalizar OS" 
                desc="Deduz automaticamente as peças aplicadas na finalização da ordem de serviço" 
                value={autoDeductStock} 
                onToggle={setAutoDeductStock} 
              />
              <ToggleRow 
                label="Alertas de Validade de Insumos" 
                desc="Notifica o operador sobre peças e insumos próximos do vencimento" 
                value={true} 
                onToggle={() => {}} 
              />
              <ToggleRow 
                label="Alerta de Nível Mínimo" 
                desc="Exibe aviso de reposição quando a quantidade estiver abaixo do ponto de pedido" 
                value={true} 
                onToggle={() => {}} 
              />

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Configurações de estoque salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Regras de Estoque</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'os':
        return (
          <View>
            <Text style={styles.sectionTitle}>Configurações de Ordens de Serviço</Text>
            <Text style={styles.sectionDesc}>Padronize prazos de garantia, numeração sequencial e termos contratuais.</Text>
            
            <View style={styles.formCard}>
              <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Prefixo da Numeração</Text>
                  <TextInput 
                    style={styles.input} 
                    value={osPrefix} 
                    onChangeText={setOsPrefix} 
                    placeholder="Ex: OS-"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Dias de Garantia Padrão</Text>
                  <TextInput 
                    style={styles.input} 
                    value={defaultWarrantyDays} 
                    onChangeText={setDefaultWarrantyDays} 
                    keyboardType="numeric"
                    placeholder="Ex: 90"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Termo de Condições e Garantia Padrão</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  defaultValue="A garantia cobre exclusivamente defeitos das peças substituídas e serviços executados pelo período informado, não cobrindo danos por mau uso, quedas ou intervenção de terceiros."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Configurações de OS salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Preferências de OS</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'agendamentos':
        return (
          <View>
            <Text style={styles.sectionTitle}>Regras de Agendamento & Visitas</Text>
            <Text style={styles.sectionDesc}>Defina horários de atendimento, tempo padrão de visita e intervalo entre agendamentos.</Text>
            
            <View style={styles.formCard}>
              <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Horário Inicial de Atendimento</Text>
                  <TextInput style={styles.input} defaultValue="08:00" placeholder="08:00" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Horário Final de Atendimento</Text>
                  <TextInput style={styles.input} defaultValue="18:00" placeholder="18:00" />
                </View>
              </View>

              <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Duração Padrão da Visita (Minutos)</Text>
                  <TextInput style={styles.input} defaultValue="60" keyboardType="numeric" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Intervalo de Deslocamento (Minutos)</Text>
                  <TextInput style={styles.input} defaultValue="30" keyboardType="numeric" />
                </View>
              </View>

              <ToggleRow 
                label="Permitir Agendamentos aos Sábados" 
                desc="Habilita escala técnica e agendamentos no final de semana" 
                value={true} 
                onToggle={() => {}} 
              />

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Regras de agendamento salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Regras de Agendamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'pagamentos':
        return (
          <View>
            <Text style={styles.sectionTitle}>Formas de Pagamento</Text>
            <Text style={styles.sectionDesc}>Habilite ou desabilite as formas de pagamento disponíveis para registrar faturamentos.</Text>
            
            <View style={styles.formCard}>
              {paymentMethods.map(method => (
                <View key={method.id} style={styles.paymentMethodRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <CreditCard size={20} color={method.active ? Theme.colors.primary : '#94A3B8'} />
                    <Text style={[styles.paymentMethodText, !method.active && { color: '#94A3B8' }]}>
                      {method.name}
                    </Text>
                  </View>
                  <Switch 
                    value={method.active} 
                    onValueChange={() => togglePaymentMethod(method.id)}
                    trackColor={{ false: '#E2E8F0', true: Theme.colors.primary }}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Formas de pagamento atualizadas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Formas de Pagamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'notificacoes':
        return (
          <View>
            <Text style={styles.sectionTitle}>Notificações do Sistema</Text>
            <Text style={styles.sectionDesc}>Controle quais avisos e alertas você deseja receber em tempo real.</Text>
            
            <View style={styles.formCard}>
              <ToggleRow label="Novas Ordens de Serviço" desc="Aviso ao abrir, despachar ou concluir OS" value={notifOS} onToggle={setNotifOS} />
              <ToggleRow label="Alertas de Estoque Baixo" desc="Quando peças atingirem nível de estoque de segurança" value={notifEstoque} onToggle={setNotifEstoque} />
              <ToggleRow label="Movimentações Financeiras" desc="Recebimentos, faturamentos e despesas registradas" value={notifFinanceiro} onToggle={setNotifFinanceiro} />
              <ToggleRow label="Notificações por E-mail" desc="Receber cópia de relatórios e fechamentos diários por e-mail" value={notifEmail} onToggle={setNotifEmail} />

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Preferências de notificação salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Preferências</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'seguranca':
        return (
          <View>
            <Text style={styles.sectionTitle}>Segurança & Acesso</Text>
            <Text style={styles.sectionDesc}>Proteja sua conta, redefina senhas e controle o tempo de sessão ativa.</Text>
            
            <View style={styles.formCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Senha Atual</Text>
                <TextInput style={styles.input} placeholder="••••••••" secureTextEntry />
              </View>
              <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Nova Senha</Text>
                  <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" secureTextEntry />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Confirmar Nova Senha</Text>
                  <TextInput style={styles.input} placeholder="Repita a nova senha" secureTextEntry />
                </View>
              </View>
              <ToggleRow label="Autenticação em 2 Fatores (2FA)" desc="Exigir código via app autenticador ao fazer login" value={twoFactor} onToggle={setTwoFactor} />
              <ToggleRow label="Bloqueio Automático de Sessão" desc="Desconectar automaticamente após 30 minutos de inatividade" value={autoLock} onToggle={setAutoLock} />
              
              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Senha e configurações de segurança atualizadas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Atualizar Senha & Segurança</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'impressao':
        return (
          <View>
            <Text style={styles.sectionTitle}>Impressão & Etiquetas</Text>
            <Text style={styles.sectionDesc}>Configure formatos de impressão de OS, cupons não fiscais e bobinas térmicas.</Text>
            
            <View style={styles.formCard}>
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Orçamentos e Ordens de Serviço</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tamanho do Papel</Text>
                  <View style={styles.selectWrapper}>
                    <select 
                      style={styles.htmlSelect as any} 
                      value={paperSizeOs} 
                      onChange={(e: any) => savePrintSettings('printSettings_paperSizeOs', e.target.value)}
                    >
                      <option value="A4">Padrão A4 / Folha Inteira</option>
                      <option value="80mm">Bobina Térmica 80mm</option>
                      <option value="58mm">Bobina Térmica 58mm</option>
                    </select>
                  </View>
                </View>
                <ToggleRow label="Incluir Logotipo da Empresa" desc="Exibir logotipo no cabeçalho dos documentos (A4 e cupom)" value={printLogo} onToggle={setPrintLogo} />
                <ToggleRow label="Termos e Condições no Rodapé" desc="Imprimir termos e garantias no rodapé da OS" value={printTerms} onToggle={setPrintTerms} />
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Observações Padrão (Orçamento)</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    defaultValue="Orçamento válido por 15 dias. Valores sujeitos a confirmação de disponibilidade de peças."
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Recibos e Cupons Térmicos</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tamanho do Papel do Recibo</Text>
                  <View style={styles.selectWrapper}>
                    <select 
                      style={styles.htmlSelect as any} 
                      value={paperSizeReceipt} 
                      onChange={(e: any) => savePrintSettings('printSettings_paperSizeReceipt', e.target.value)}
                    >
                      <option value="A4">Padrão A4 / Folha Inteira</option>
                      <option value="80mm">Bobina Térmica 80mm</option>
                      <option value="58mm">Bobina Térmica 58mm</option>
                    </select>
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Texto de Garantia (Rodapé do Recibo)</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    defaultValue="Garantia legal de 90 dias para peças substituídas e mão de obra executada."
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={[styles.subSection, { borderBottomWidth: 0 }]}>
                <Text style={styles.subSectionTitle}>Etiquetas de Identificação de Equipamentos</Text>
                <View style={[styles.formRow, isCompact ? styles.formRowColumn : undefined]}>
                  <View style={[styles.formGroup, {flex: 1}]}>
                    <Text style={styles.label}>Largura da Etiqueta (mm)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={labelWidth} 
                      onChangeText={(t) => savePrintSettings('printSettings_labelWidth', t)} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, {flex: 1}]}>
                    <Text style={styles.label}>Altura da Etiqueta (mm)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={labelHeight} 
                      onChangeText={(t) => savePrintSettings('printSettings_labelHeight', t)} 
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Configurações de impressão salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Configurações de Impressão</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'integracoes':
        return (
          <View>
            <Text style={styles.sectionTitle}>Integrações & Backup</Text>
            <Text style={styles.sectionDesc}>Conecte serviços externos, envie avisos por WhatsApp e faça download de cópias de segurança.</Text>
            
            <View style={styles.formCard}>
              <ToggleRow 
                label="Envio Automático via WhatsApp" 
                desc="Enviar aviso com link de rastreio ao cliente quando a OS mudar de status" 
                value={true} 
                onToggle={() => {}} 
              />
              <ToggleRow 
                label="Backup Diário Automático" 
                desc="Gera cópia criptografada do banco de dados na nuvem todos os dias às 03:00" 
                value={true} 
                onToggle={() => {}} 
              />
              
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                <Text style={styles.label}>Exportação Manual de Dados</Text>
                <Text style={styles.helperText}>Baixe todos os clientes, ordens de serviço e produtos em formato CSV/JSON.</Text>
                
                <TouchableOpacity 
                  style={[styles.secondaryBtn, { marginTop: 10 }]} 
                  onPress={() => alert('Download do backup iniciado!')}
                >
                  <Share2 size={16} color={Theme.colors.primary} />
                  <Text style={styles.secondaryBtnText}>Exportar Base de Dados Completa (JSON)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={() => alert('Configurações de integração salvas!')}>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Integrações</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header com busca */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Configurações</Text>
          <Text style={styles.pageSubtitle}>Gerencie as preferências, dados da empresa, permissões e operação do sistema.</Text>
        </View>
      </View>

      {/* Se estiver no modo Detalhe de Seção */}
      {activeSection ? (
        <View style={styles.detailContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setActiveSection(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={Theme.colors.primary} />
            <Text style={styles.backButtonText}>Voltar para todas as configurações</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            {renderSectionContent()}
          </View>
        </View>
      ) : (
        /* Modo Visualização em Grid de Cards */
        <View>
          {/* Barra de Busca */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar em todas as configurações..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Grid de Cards */}
          <View style={styles.cardGrid}>
            {filteredCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.settingCard}
                  activeOpacity={0.7}
                  onPress={() => setActiveSection(card.id)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                    <View style={styles.cardIconWrapper}>
                      <IconComponent size={24} color="#94A3B8" strokeWidth={1.5} />
                    </View>
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {card.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredCards.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhuma configuração encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Não encontramos nenhuma opção correspondente a "{searchQuery}".
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modal de Novo Usuário */}
      <Modal visible={userModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Colaborador</Text>
              <TouchableOpacity onPress={() => setUserModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Carlos Silva" 
                value={formUser.name} 
                onChangeText={t => setFormUser({...formUser, name: t})} 
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>E-mail de Acesso *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: carlos@empresa.com" 
                value={formUser.email} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                onChangeText={t => setFormUser({...formUser, email: t})} 
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha Provisória *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Mínimo 6 caracteres" 
                secureTextEntry 
                value={formUser.password} 
                onChangeText={t => setFormUser({...formUser, password: t})} 
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cargo / Função</Text>
              <View style={styles.selectWrapper}>
                <select 
                  style={styles.htmlSelect as any} 
                  value={formUser.role} 
                  onChange={(e: any) => setFormUser({...formUser, role: e.target.value})}
                >
                  <option value="Técnico">Técnico</option>
                  <option value="Atendente">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setUserModal(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveUser}>
                <Text style={styles.modalSaveText}>Salvar Colaborador</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Componente Auxiliar para Linhas de Toggle
function ToggleRow({ label, desc, value, onToggle }: {
  label: string;
  desc: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 16 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#CBD5E1', true: Theme.colors.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: Theme.spacing.xl,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
    outlineStyle: 'none' as any,
  },
  clearSearchBtn: {
    padding: 4,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    flexGrow: 1,
    flexBasis: 340,
    minHeight: 120,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease-in-out',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
    paddingRight: 8,
  },
  cardIconWrapper: {
    opacity: 0.8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  detailContainer: {
    marginBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  logoSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  logoPreviewContainer: {
    width: 140,
    height: 90,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  logoActions: {
    flex: 1,
    minWidth: 200,
    gap: 8,
  },
  removeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  removeLogoBtnText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  logoTipText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formRowColumn: {
    flexDirection: 'column',
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectWrapper: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  htmlSelect: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0F172A',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as any,
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryBtnText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  subSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sidebarOptionGrid: {
    gap: 12,
    marginTop: 8,
  },
  sidebarOptionCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  sidebarOptionCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F0F7FF',
  },
  sidebarOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sidebarOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  sidebarOptionDesc: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 30,
    lineHeight: 18,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  colorPaletteItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 82,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  colorPaletteItemActive: {
    borderColor: '#0F172A',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
  },
  colorCircleLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  colorPaletteName: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  colorPreviewSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useMemo, useRef } from 'react';
// @ts-ignore
import ReactDOM from 'react-dom';
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
import { 
  Search, Plus, MonitorSmartphone, User, X, Edit2, Trash2, 
  Printer, Paperclip, ClipboardList, CheckSquare, Square, 
  CheckCircle, FileText, Wrench, Package, Clock, CheckCircle2,
  Tag, AlertCircle, Eye, ChevronRight
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import OSModal from './components/OSModal';

type FilterStatus = 'all' | 'em_bancada' | 'aguardando_peca' | 'pronto' | 'concluido' | 'sem_os';

function ActionButtonWithTooltip({
  tooltip,
  icon,
  onPress,
  bgColor,
  borderColor,
}: {
  tooltip: string;
  icon: React.ReactNode;
  onPress: () => void;
  bgColor: string;
  borderColor: string;
}) {
  const [coords, setCoords] = useState<{ x: number; y: number; isBelow: boolean } | null>(null);
  const btnRef = useRef<any>(null);

  const handleMouseEnter = (e: any) => {
    try {
      let el = btnRef.current;
      if (!el || typeof el.getBoundingClientRect !== 'function') {
        el = e?.currentTarget || e?.target;
      }
      const domEl = el?.getBoundingClientRect ? el : (el?._node || el?.base);
      if (domEl && typeof domEl.getBoundingClientRect === 'function') {
        const rect = domEl.getBoundingClientRect();
        const isTopNear = rect.top < 60;
        setCoords({
          x: rect.left + rect.width / 2,
          y: isTopNear ? rect.bottom + 8 : rect.top - 8,
          isBelow: isTopNear,
        });
      }
    } catch (err) {
      console.error('Tooltip error:', err);
    }
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  return (
    <View 
      ref={btnRef}
      style={styles.actionButtonWrapper}
      // @ts-ignore
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TouchableOpacity
        style={[
          styles.actionIconBtn,
          { backgroundColor: bgColor, borderColor: borderColor }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={tooltip}
        // @ts-ignore
        title={tooltip}
      >
        {icon}
      </TouchableOpacity>

      {coords && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: coords.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            padding: '6px 12px',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            border: '1px solid #CBD5E1',
            zIndex: 99999999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {tooltip}
          <div
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              backgroundColor: '#FFFFFF',
              transform: 'rotate(45deg)',
              ...(coords.isBelow
                ? { top: '-5px', borderLeft: '1px solid #CBD5E1', borderTop: '1px solid #CBD5E1' }
                : { bottom: '-5px', borderRight: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }),
            }}
          />
        </div>,
        document.body
      )}
    </View>
  );
}

export default function EquipmentScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // Dados do sistema
  const [equipment, setEquipment] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [modalVisible, setModalVisible] = useState(false); // Modal Aparelho
  const [osModalVisible, setOsModalVisible] = useState(false); // Modal OS
  const [viewItem, setViewItem] = useState<any>(null); // Visualizar detalhes
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [osSaveLoading, setOsSaveLoading] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);

  // Controle de fluxo
  const [generateOSAfterSave, setGenerateOSAfterSave] = useState(true);

  const [formData, setFormData] = useState({
    id: '', 
    type: 'Smartphone', 
    brand: '', 
    model: '', 
    serialNumber: '',
    customerId: '', 
    checklist: '',
    images: [] as string[]
  });

  const [osFormData, setOsFormData] = useState({
    id: '',
    status: 'Aberto',
    description: '',
    defect: '',
    observations: '',
    totalValue: '0',
    customerId: '',
    deviceId: '',
    deviceModel: '',
    technician: '',
    isNewCustomer: false,
    newCustomerName: '',
    isNewDevice: false,
    newDeviceType: '',
    newDeviceModel: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipData, custData, ordData] = await Promise.all([
        api.getAll('devices'),
        api.getAll('customers'),
        api.getAll('orders')
      ]);
      setEquipment(equipData || []);
      setCustomers(custData || []);
      setOrders(ordData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // União Inteligente de Aparelhos com suas Ordens de Serviço
  const unifiedList = useMemo(() => {
    return equipment.map(device => {
      // Busca todas as ordens vinculadas a este aparelho
      const deviceOrders = orders.filter(o => o.deviceId === device.id);
      
      // Ordena pelas mais recentes primeiro
      const sortedOrders = [...deviceOrders].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      // Pega a ordem ativa (que não está concluída) ou a mais recente
      const activeOrder = sortedOrders.find(o => o.status !== 'Concluído' && o.status !== 'Entregue') || sortedOrders[0] || null;
      
      const customer = customers.find(c => c.id === device.customerId) || device.customer || null;

      return {
        ...device,
        customer,
        activeOrder,
        totalOrdersCount: deviceOrders.length,
        hasActiveOrder: !!activeOrder && activeOrder.status !== 'Concluído',
      };
    });
  }, [equipment, orders, customers]);

  // Contadores para os Cards de Resumo (KPIs)
  const stats = useMemo(() => {
    const totalAparelhos = equipment.length;
    const emManutencao = orders.filter(o => o.status === 'Aberto' || o.status === 'Em Análise' || o.status === 'Em Andamento').length;
    const aguardandoPeca = orders.filter(o => o.status === 'Aguardando Peça').length;
    const prontos = orders.filter(o => o.status === 'Pronto').length;
    const concluidos = orders.filter(o => o.status === 'Concluído').length;

    return { totalAparelhos, emManutencao, aguardandoPeca, prontos, concluidos };
  }, [equipment, orders]);

  // Filtragem e Busca Unificada
  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    return unifiedList.filter(item => {
      // Filtro de Texto
      const matchesText = !q || (
        (item.model && item.model.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.type && item.type.toLowerCase().includes(q)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
        (item.customer?.name && item.customer.name.toLowerCase().includes(q)) ||
        (item.activeOrder?.id && item.activeOrder.id.toLowerCase().includes(q)) ||
        (item.activeOrder?.description && item.activeOrder.description.toLowerCase().includes(q))
      );

      if (!matchesText) return false;

      // Filtro por Chip de Status
      if (filterStatus === 'all') return true;
      if (filterStatus === 'em_bancada') {
        return item.activeOrder && (item.activeOrder.status === 'Aberto' || item.activeOrder.status === 'Em Análise' || item.activeOrder.status === 'Em Andamento');
      }
      if (filterStatus === 'aguardando_peca') {
        return item.activeOrder && item.activeOrder.status === 'Aguardando Peça';
      }
      if (filterStatus === 'pronto') {
        return item.activeOrder && item.activeOrder.status === 'Pronto';
      }
      if (filterStatus === 'concluido') {
        return item.activeOrder && item.activeOrder.status === 'Concluído';
      }
      if (filterStatus === 'sem_os') {
        return !item.activeOrder || item.activeOrder.status === 'Concluído';
      }
      return true;
    });
  }, [unifiedList, search, filterStatus]);

  // Salvar Aparelho
  const handleSave = async () => {
    if (saveLoading) return;
    if (!formData.model || !formData.customerId) {
      alert('Modelo e Cliente são obrigatórios');
      return;
    }
    setSaveLoading(true);
    let savedDevice: any = null;
    try {
      const dataToSave = { 
        ...formData, 
        imageUrl: JSON.stringify(formData.images) 
      };
      // @ts-ignore
      delete dataToSave.images;

      if (formData.id) {
        savedDevice = await api.update('devices', formData.id, dataToSave);
      } else {
        const { id, ...data } = dataToSave;
        savedDevice = await api.create('devices', data);
      }
      
      setModalVisible(false);
      await fetchData();

      // Se marcou para abrir OS imediatamente
      if (generateOSAfterSave && savedDevice) {
        const customer = customers.find(c => c.name === formData.customerId || c.id === formData.customerId);
        setOsFormData({
          id: '',
          status: 'Aberto',
          description: '',
          defect: formData.checklist || '',
          observations: '',
          totalValue: '0',
          customerId: customer ? customer.id : formData.customerId,
          deviceId: savedDevice.id,
          deviceModel: `${savedDevice.type} ${savedDevice.brand} ${savedDevice.model}`,
          technician: '',
          isNewCustomer: false,
          newCustomerName: '',
          isNewDevice: false,
          newDeviceType: '',
          newDeviceModel: ''
        });
        setTimeout(() => setOsModalVisible(true), 350);
      }

      setFormData({ id: '', type: 'Smartphone', brand: '', model: '', serialNumber: '', customerId: '', checklist: '', images: [] });
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    let parsedImages: string[] = [];
    if (item.imageUrl) {
      try {
        const parsed = JSON.parse(item.imageUrl);
        parsedImages = Array.isArray(parsed) ? parsed : [item.imageUrl];
      } catch (e) {
        parsedImages = [item.imageUrl];
      }
    }
    setFormData({
      id: item.id || '',
      type: item.type || 'Smartphone',
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      customerId: item.customerId || item.customer?.id || '',
      checklist: item.checklist || '',
      images: parsedImages
    });
    setGenerateOSAfterSave(false);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este aparelho e seu histórico?')) {
      try {
        await api.remove('devices', id);
        fetchData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  // Ações de Ordem de Serviço
  const openNewOsForDevice = (device: any) => {
    setOsFormData({
      id: '',
      status: 'Aberto',
      description: '',
      defect: device.checklist || '',
      observations: '',
      totalValue: '0',
      customerId: device.customerId || device.customer?.id || '',
      deviceId: device.id,
      deviceModel: `${device.type} ${device.brand} ${device.model}`,
      technician: '',
      isNewCustomer: false,
      newCustomerName: '',
      isNewDevice: false,
      newDeviceType: '',
      newDeviceModel: ''
    });
    setOsModalVisible(true);
  };

  const handleOsEdit = (order: any) => {
    setOsFormData({
      id: order.id,
      status: order.status || 'Aberto',
      description: order.description || '',
      defect: order.defect || '',
      observations: order.observations || '',
      totalValue: String(order.totalValue || 0),
      customerId: order.customerId || '',
      deviceId: order.deviceId || '',
      deviceModel: order.deviceModel || (order.device ? `${order.device.type} ${order.device.brand} ${order.device.model}` : ''),
      technician: order.technician || '',
      isNewCustomer: false,
      newCustomerName: '',
      isNewDevice: false,
      newDeviceType: '',
      newDeviceModel: ''
    });
    setOsModalVisible(true);
  };

  const handleOsSave = async () => {
    if (!osFormData.customerId || !osFormData.deviceId) {
      alert('Cliente e Aparelho são obrigatórios');
      return;
    }
    setOsSaveLoading(true);
    try {
      const payload: any = {
        customerId: osFormData.customerId,
        deviceId: osFormData.deviceId,
        deviceModel: osFormData.deviceModel || '',
        status: osFormData.status,
        description: osFormData.description,
        defect: osFormData.defect,
        observations: osFormData.observations,
        totalValue: parseFloat(osFormData.totalValue) || 0,
        technician: osFormData.technician
      };
      
      if (osFormData.id) {
        await api.update('orders', osFormData.id, payload);
      } else {
        await api.create('orders', payload);
      }
      setOsModalVisible(false);
      fetchData();
    } catch (error: any) {
      alert('Erro ao salvar OS: ' + error.message);
    } finally {
      setOsSaveLoading(false);
    }
  };

  const handleFinishOs = async (order: any) => {
    if (order.status === 'Concluído') {
      alert('Esta OS já está concluída.');
      return;
    }
    const osCode = order.id ? `#OS-${order.id.slice(0, 6).toUpperCase()}` : 'esta OS';
    const totalMsg = order.totalValue > 0 ? ` e registrar o valor de R$ ${Number(order.totalValue).toFixed(2)} no caixa` : '';

    if (confirm(`Deseja marcar a ${osCode} como CONCLUÍDA${totalMsg}?`)) {
      try {
        await api.finishOrder(order.id);
        fetchData();
        alert(`OS ${osCode} concluída com sucesso!`);
      } catch (error: any) {
        try {
          await api.update('orders', order.id, { ...order, status: 'Concluído' });
          fetchData();
          alert(`OS ${osCode} marcada como concluída!`);
        } catch (err: any) {
          alert('Erro ao concluir OS: ' + (err.message || error.message));
        }
      }
    }
  };

  // Impressão de Etiqueta Térmica
  const handlePrintLabel = (item: any) => {
    if (Platform.OS === 'web') {
      const labelWidth = localStorage.getItem('printSettings_labelWidth') || '50';
      const labelHeight = localStorage.getItem('printSettings_labelHeight') || '30';
      const osCode = item.activeOrder ? `#OS-${item.activeOrder.id.slice(0, 6).toUpperCase()}` : 'SEM OS';

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; }
            body { 
              margin: 0; padding: 0; width: ${labelWidth}mm; height: ${labelHeight}mm; 
              font-family: Arial, sans-serif; display: flex; flex-direction: column; 
              justify-content: center; box-sizing: border-box; padding: 1.5mm; 
            }
            .content { 
              border: 1px dashed #333; height: 100%; padding: 2mm; box-sizing: border-box; 
              display: flex; flex-direction: column; justify-content: space-between; 
            }
            .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 1mm; }
            h3 { margin: 0; font-size: 10px; font-weight: 900; }
            .os-badge { font-size: 9px; font-weight: bold; background: #000; color: #fff; padding: 1px 4px; border-radius: 2px; }
            p { margin: 0; font-size: 8.5px; line-height: 1.25; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
            .date { font-size: 7px; text-align: right; color: #444; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header-row">
              <h3>ControlTec</h3>
              <span class="os-badge">${osCode}</span>
            </div>
            <p><strong>CLI:</strong> ${item.customer?.name || 'Cliente'}</p>
            <p><strong>MOD:</strong> ${item.type} ${item.brand} ${item.model}</p>
            <p><strong>S/N:</strong> ${item.serialNumber || 'N/A'}</p>
            <div class="date">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </body>
        </html>
      `;
      const printWindow = window.open('', '', 'width=420,height=420');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      }
    } else {
      alert("A impressão de etiquetas está disponível na versão Web.");
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'Aberto':
        return { bg: '#EEF2FF', text: '#4F46E5', dot: '#6366F1', label: 'Aberto' };
      case 'Em Análise':
      case 'Em Andamento':
        return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B', label: 'Em Análise' };
      case 'Aguardando Peça':
        return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444', label: 'Aguardando Peça' };
      case 'Pronto':
        return { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E', label: 'Pronto p/ Retirada' };
      case 'Concluído':
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8', label: 'Finalizado' };
      default:
        return { bg: '#F8FAFC', text: '#94A3B8', dot: '#CBD5E1', label: 'Sem OS Ativa' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <View>
          <Text style={styles.pageTitle}>Aparelhos & Ordens de Serviço</Text>
          <Text style={styles.pageSubtitle}>Central unificada para controle de equipamentos, manutenções e diagnósticos.</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            setFormData({
              id: '', type: 'Smartphone', brand: '', model: '', serialNumber: '',
              customerId: '', checklist: '', images: []
            });
            setGenerateOSAfterSave(true);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus color="#FFFFFF" size={18} />
          <Text style={styles.addButtonText}>Novo Aparelho / OS</Text>
        </TouchableOpacity>
      </View>

      {/* Cards de Resumo (KPIs) */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Total de Aparelhos</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <MonitorSmartphone size={18} color="#3B82F6" />
            </View>
          </View>
          <Text style={styles.statValue}>{stats.totalAparelhos}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Em Manutenção</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Wrench size={18} color="#D97706" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.emManutencao + stats.aguardandoPeca}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Prontos para Retirada</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={18} color="#15803D" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: '#15803D' }]}>{stats.prontos}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#64748B' }]}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Finalizados / Entregues</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#F1F5F9' }]}>
              <Package size={18} color="#64748B" />
            </View>
          </View>
          <Text style={styles.statValue}>{stats.concluidos}</Text>
        </View>
      </View>

      {/* Barra de Busca e Filtros Rápidos (Chips) */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search color="#94A3B8" size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente, modelo, nº de série ou OS..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              Todos ({unifiedList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'em_bancada' && styles.filterChipActive]}
            onPress={() => setFilterStatus('em_bancada')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.filterChipText, filterStatus === 'em_bancada' && styles.filterChipTextActive]}>
              Em Bancada ({stats.emManutencao})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'aguardando_peca' && styles.filterChipActive]}
            onPress={() => setFilterStatus('aguardando_peca')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.filterChipText, filterStatus === 'aguardando_peca' && styles.filterChipTextActive]}>
              Aguardando Peça ({stats.aguardandoPeca})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'pronto' && styles.filterChipActive]}
            onPress={() => setFilterStatus('pronto')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.filterChipText, filterStatus === 'pronto' && styles.filterChipTextActive]}>
              Pronto ({stats.prontos})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'sem_os' && styles.filterChipActive]}
            onPress={() => setFilterStatus('sem_os')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'sem_os' && styles.filterChipTextActive]}>
              Sem OS Aberta
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista Unificada */}
      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.tableCard}>
          {/* Header da Tabela Desktop */}
          {!isCompact && (
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>CLIENTE</Text>
              <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>APARELHO / MODELO</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Nº DE SÉRIE</Text>
              <Text style={[styles.tableHeaderText, { flex: 2.2 }]}>STATUS / ORDEM DE SERVIÇO</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>ENTRADA</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>AÇÕES</Text>
            </View>
          )}

          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <MonitorSmartphone size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhum aparelho encontrado</Text>
              <Text style={styles.emptySubTitle}>
                {search ? `Nenhum resultado para "${search}"` : 'Clique em "+ Novo Aparelho / OS" para cadastrar o primeiro.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.tableBody}>
              {filteredList.map(item => {
                const badge = getStatusBadgeStyle(item.activeOrder?.status);
                const osIdShort = item.activeOrder ? item.activeOrder.id.slice(0, 6).toUpperCase() : null;

                if (isCompact) {
                  return (
                    <View key={item.id} style={styles.mobileCard}>
                      <View style={styles.mobileCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clientName}>{item.customer?.name || 'Cliente Avulso'}</Text>
                          {item.customer?.phone ? (
                            <Text style={styles.clientSub}>{item.customer.phone}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                      </View>

                      <View style={{ marginVertical: 6 }}>
                        <Text style={styles.deviceModel}>
                          {item.model} <Text style={styles.deviceType}>({item.type}{item.brand ? ` • ${item.brand}` : ''})</Text>
                        </Text>
                        {item.serialNumber ? (
                          <Text style={styles.serialText}>S/N: {item.serialNumber}</Text>
                        ) : null}
                      </View>

                      <View style={{ marginVertical: 6 }}>
                        {item.activeOrder ? (
                          <TouchableOpacity 
                            style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                            onPress={() => handleOsEdit(item.activeOrder)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                            <Text style={[styles.statusBadgeText, { color: badge.text }]} numberOfLines={1}>
                              #OS-{osIdShort} • {badge.label}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={styles.openOsQuickBtn}
                            onPress={() => openNewOsForDevice(item)}
                            activeOpacity={0.7}
                          >
                            <Plus size={12} color="#4F46E5" />
                            <Text style={styles.openOsQuickText}>Abrir OS</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.mobileActionsRow}>
                        <TouchableOpacity style={styles.mobileActionBtn} onPress={() => handlePrintLabel(item)}>
                          <Tag size={15} color="#2563EB" />
                          <Text style={[styles.mobileActionBtnText, { color: '#2563EB' }]}>Etiqueta</Text>
                        </TouchableOpacity>

                        {item.activeOrder ? (
                          <TouchableOpacity style={[styles.mobileActionBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]} onPress={() => handleOsEdit(item.activeOrder)}>
                            <FileText size={15} color="#4F46E5" />
                            <Text style={[styles.mobileActionBtnText, { color: '#4F46E5' }]}>Ver OS</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={[styles.mobileActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]} onPress={() => openNewOsForDevice(item)}>
                            <Plus size={15} color="#16A34A" />
                            <Text style={[styles.mobileActionBtnText, { color: '#16A34A' }]}>Nova OS</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.mobileActionBtn} onPress={() => handleEdit(item)}>
                          <Edit2 size={15} color="#475569" />
                          <Text style={[styles.mobileActionBtnText, { color: '#475569' }]}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.mobileActionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]} onPress={() => handleDelete(item.id)}>
                          <Trash2 size={15} color="#DC2626" />
                          <Text style={[styles.mobileActionBtnText, { color: '#DC2626' }]}>Excluir</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={item.id} style={styles.tableRow}>
                    {/* Cliente */}
                    <View style={{ flex: 2, paddingRight: 8 }}>
                      <Text style={styles.clientName} numberOfLines={1}>
                        {item.customer?.name || 'Cliente Avulso'}
                      </Text>
                      {item.customer?.phone ? (
                        <Text style={styles.clientSub}>{item.customer.phone}</Text>
                      ) : null}
                    </View>

                    {/* Aparelho */}
                    <View style={{ flex: 2.5, paddingRight: 8 }}>
                      <Text style={styles.deviceModel} numberOfLines={1}>
                        {item.model}
                      </Text>
                      <Text style={styles.deviceType}>
                        {item.type} {item.brand ? `• ${item.brand}` : ''}
                      </Text>
                    </View>

                    {/* S/N */}
                    <View style={{ flex: 1.5, paddingRight: 8 }}>
                      <Text style={styles.serialText} numberOfLines={1}>
                        {item.serialNumber || '—'}
                      </Text>
                    </View>

                    {/* Status da OS */}
                    <View style={{ flex: 2.2, paddingRight: 8 }}>
                      {item.activeOrder ? (
                        <TouchableOpacity 
                          style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                          onPress={() => handleOsEdit(item.activeOrder)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                          <Text style={[styles.statusBadgeText, { color: badge.text }]} numberOfLines={1}>
                            #OS-${osIdShort} • {badge.label}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={styles.openOsQuickBtn}
                          onPress={() => openNewOsForDevice(item)}
                          activeOpacity={0.7}
                        >
                          <Plus size={12} color="#4F46E5" />
                          <Text style={styles.openOsQuickText}>Abrir OS</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Data de Entrada */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>

                    {/* Ações */}
                    <View style={styles.actionsCell}>
                      {/* Imprimir Etiqueta */}
                      <ActionButtonWithTooltip
                        tooltip="Imprimir Etiqueta"
                        icon={<Tag size={16} color="#2563EB" />}
                        bgColor="#EFF6FF"
                        borderColor="#BFDBFE"
                        onPress={() => handlePrintLabel(item)}
                      />

                      {/* Ver OS / Criar OS */}
                      {item.activeOrder ? (
                        <ActionButtonWithTooltip
                          tooltip="Ver Detalhes da OS"
                          icon={<FileText size={16} color="#4F46E5" />}
                          bgColor="#EEF2FF"
                          borderColor="#C7D2FE"
                          onPress={() => handleOsEdit(item.activeOrder)}
                        />
                      ) : (
                        <ActionButtonWithTooltip
                          tooltip="Abrir Nova OS"
                          icon={<Plus size={16} color="#16A34A" />}
                          bgColor="#F0FDF4"
                          borderColor="#BBF7D0"
                          onPress={() => openNewOsForDevice(item)}
                        />
                      )}

                      {/* Editar Aparelho */}
                      <ActionButtonWithTooltip
                        tooltip="Editar Aparelho"
                        icon={<Edit2 size={15} color="#475569" />}
                        bgColor="#F8FAFC"
                        borderColor="#E2E8F0"
                        onPress={() => handleEdit(item)}
                      />

                      {/* Excluir Aparelho */}
                      <ActionButtonWithTooltip
                        tooltip="Excluir Aparelho"
                        icon={<Trash2 size={15} color="#DC2626" />}
                        bgColor="#FEF2F2"
                        borderColor="#FECACA"
                        onPress={() => handleDelete(item.id)}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ===== MODAL DE NOVO / EDITAR APARELHO ===== */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formData.id ? 'Editar Aparelho' : 'Novo Aparelho'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Cliente */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cliente Proprietário *</Text>
                <View style={styles.selectWrapper}>
                  <select 
                    style={styles.htmlSelect as any}
                    value={formData.customerId}
                    onChange={(e: any) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">Selecione o cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </View>
              </View>

              {/* Tipo e Marca */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Tipo de Aparelho</Text>
                  <View style={styles.selectWrapper}>
                    <select 
                      style={styles.htmlSelect as any}
                      value={formData.type}
                      onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Smartphone">Smartphone / Celular</option>
                      <option value="Notebook">Notebook / Laptop</option>
                      <option value="Computador">Computador / Desktop</option>
                      <option value="Impressora">Impressora / Multifuncional</option>
                      <option value="Tablet">Tablet / iPad</option>
                      <option value="Console">Videogame / Console</option>
                      <option value="Outro">Outro Equipamento</option>
                    </select>
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Marca / Fabricante</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Samsung, Apple, Epson, Dell..."
                    value={formData.brand}
                    onChangeText={t => setFormData({ ...formData, brand: t })}
                  />
                </View>
              </View>

              {/* Modelo e Serial */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1.4 }]}>
                  <Text style={styles.label}>Modelo do Aparelho *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Galaxy S23, EcoTank L3150, Inspiron 15..."
                    value={formData.model}
                    onChangeText={t => setFormData({ ...formData, model: t })}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Nº de Série (S/N)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Opcional"
                    value={formData.serialNumber}
                    onChangeText={t => setFormData({ ...formData, serialNumber: t })}
                  />
                </View>
              </View>

              {/* Checklist / Defeito relatado */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Defeito Relatado / Checklist de Entrada</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva o problema relatado pelo cliente, estado físico, riscos ou acessórios deixados..."
                  value={formData.checklist}
                  onChangeText={t => setFormData({ ...formData, checklist: t })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Opção de Gerar OS Imediatamente */}
              {!formData.id && (
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setGenerateOSAfterSave(!generateOSAfterSave)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, generateOSAfterSave && styles.checkboxBoxActive]}>
                    {generateOSAfterSave && <CheckCircle size={16} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkboxLabel}>Abrir Ordem de Serviço (OS) imediatamente</Text>
                    <Text style={styles.checkboxDesc}>Abre a tela de OS para preencher laudo e orçamento logo após salvar.</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {formData.id ? 'Salvar Alterações' : 'Cadastrar Aparelho'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL DE ORDEM DE SERVIÇO (OS) ===== */}
      <OSModal
        modalVisible={osModalVisible}
        setModalVisible={setOsModalVisible}
        saveLoading={osSaveLoading}
        formData={osFormData}
        setFormData={setOsFormData}
        customers={customers}
        devices={equipment}
        handleSave={handleOsSave}
        handleFinish={async (order) => {
          await handleFinishOs(order);
          setOsModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      },
    }),
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filterChipActive: {
    backgroundColor: '#0F2A5A',
    borderColor: '#0F2A5A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
    flex: 1,
    zIndex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 0,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableBody: {
    flex: 1,
    overflow: 'visible',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    overflow: 'visible',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'background-color 0.15s ease',
      },
    }),
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  clientSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deviceModel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  deviceType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  serialText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  openOsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  openOsQuickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    overflow: 'visible',
  },
  actionButtonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  whiteTooltipContainer: {
    position: 'absolute',
    bottom: 38,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 9999999,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    whiteSpace: 'nowrap',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
        pointerEvents: 'none',
      },
    }),
  },
  whiteTooltipText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  whiteTooltipArrow: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  whiteTooltipArrowBottom: {
    bottom: -5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  whiteTooltipArrowTop: {
    top: -5,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  actionIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionIconMini: {
    padding: 6,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
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
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
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
    padding: '10px 12px',
    fontSize: '14px',
    color: '#0F172A',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as any,
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkboxDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mobileActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mobileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  mobileActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

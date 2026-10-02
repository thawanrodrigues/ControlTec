import React, { useState, useEffect } from 'react';
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
<<<<<<< HEAD
  KeyboardAvoidingView
=======
  KeyboardAvoidingView,
>>>>>>> origin/master
} from 'react-native';
import { Theme } from '../../ui/themes';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  X,
  CheckCircle,
<<<<<<< HEAD
  Clock,
  Printer,
  Package,
  Wrench,
  FileText,
  User,
  Calendar,
  CreditCard,
  Barcode,
  Edit2,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  DollarSign
=======
  ChevronDown,
  Clock,
>>>>>>> origin/master
} from 'lucide-react-native';
import { api } from '../../services/api';
import { generateReciboVenda } from '../../services/documentGenerator';
import { useBreakpoints } from '../../ui/useBreakpoints';
import { generateRecibo, generateNotaServico } from '../../services/documentGenerator';

const PAYMENT_METHODS = [
  'Dinheiro',
  'Pix',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Fiado / A Prazo',
  'Transferência'
];

interface SaleItem {
  id: string;
  type: 'produto' | 'servico' | 'avulso';
  name: string;
  code?: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
  originalId?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SalesScreen() {
  const { isCompact } = useBreakpoints();

  const [activeCatalogTab, setActiveCatalogTab] = useState<'produtos' | 'servicos' | 'historico'>('produtos');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

<<<<<<< HEAD
  // Dados do backend
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>({ name: 'ControlTec' });
  const [currentUser, setCurrentUser] = useState<string>('Administrador');

  // Formulário do Cabeçalho da Venda
  const [customerSearch, setCustomerSearch] = useState('Consumidor Final');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [sellerName, setSellerName] = useState('Administrador');
  const [saleDate, setSaleDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [installments, setInstallments] = useState('À vista');
  const [observations, setObservations] = useState('');
  const [warranty, setWarranty] = useState('90 dias de garantia');

  // Itens da Venda
  const [items, setItems] = useState<SaleItem[]>([]);

  // Barra de Busca de Itens (Autocomplete)
  const [itemSearchText, setItemSearchText] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Pagamento Lateral
  const [amountReceivedText, setAmountReceivedText] = useState('');

  // Modal de Item Manual / Avulso
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualType, setManualType] = useState<'servico' | 'produto'>('servico');

  // Modal de Novo Cliente Rápido
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Modal de Baixa de Pagamento
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedSaleToPay, setSelectedSaleToPay] = useState<any | null>(null);
  const [payMethodModal, setPayMethodModal] = useState('Pix');

  // Filtros Histórico
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');

  const loadData = async () => {
    try {
      setLoading(true);
      const [custData, invData, servData, salesData] = await Promise.all([
        api.getAll('customers').catch(() => []),
        api.getAll('inventory').catch(() => []),
        api.getAll('services').catch(() => []),
        api.getAll('sales').catch(() => []),
=======
  const [cartItems, setCartItems] = useState<{ productId: string; name: string; price: number; qty: number }[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    status: 'Concluída',
    notes: '',
    paymentMethod: 'Dinheiro',
    installments: '1',
    warrantyPeriod: 0,
  });

  const showInstallments = ['Cartão de Crédito', 'Crédito ao Cliente'].includes(formData.paymentMethod);

  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesData, custData, invData, compData] = await Promise.all([
        api.getAll('finance').then((data: any[]) => data.filter((f) => f.category === 'venda')),
        api.getAll('customers'),
        api.getAll('inventory'),
        api.getCompany().catch(() => null),
>>>>>>> origin/master
      ]);

      setCustomers(custData);
      setInventory(invData);
<<<<<<< HEAD
      setServices(servData.filter((s: any) => s.active !== false));
      setSalesHistory(salesData);

      if (salesData && salesData.length > 0 && salesData[0].company) {
        setCompanyInfo(salesData[0].company);
      }
=======
      if (compData) setCompanyInfo(compData);
>>>>>>> origin/master
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cálculos de Totais
  const totalProducts = items
    .filter((i) => i.type === 'produto')
    .reduce((acc, i) => acc + i.total, 0);

  const totalServices = items
    .filter((i) => i.type === 'servico' || i.type === 'avulso')
    .reduce((acc, i) => acc + i.total, 0);

  const totalDiscounts = items.reduce((acc, i) => acc + (i.discount || 0), 0);
  const subtotal = items.reduce((acc, i) => acc + (i.qty * i.unitPrice), 0);
  const grandTotal = Math.max(0, subtotal - totalDiscounts);

  // Troco
  const amountReceived = parseFloat(amountReceivedText) || grandTotal;
  const changeDue = Math.max(0, amountReceived - grandTotal);

  // Adição de Item pelo Autocomplete / Busca
  const addItemFromCatalog = (itemData: any, type: 'produto' | 'servico') => {
    const isProduct = type === 'produto';
    const price = isProduct ? (itemData.sellPrice || itemData.price || 0) : (itemData.defaultPrice || 0);

    setItems((prev) => {
      const existing = prev.find((i) => i.originalId === itemData.id && i.type === type);
      if (existing) {
<<<<<<< HEAD
        return prev.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                qty: i.qty + 1,
                total: (i.qty + 1) * i.unitPrice - (i.discount || 0)
              }
            : i
        );
=======
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
>>>>>>> origin/master
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          type,
          name: itemData.name,
          code: itemData.category || (isProduct ? 'PEÇA' : 'SERVIÇO'),
          qty: 1,
          unitPrice: price,
          discount: 0,
          total: price,
          originalId: itemData.id
        }
      ];
    });

    setItemSearchText('');
    setSearchDropdownOpen(false);
  };

<<<<<<< HEAD
  // Adição de Item Manual
  const handleAddManualItem = () => {
    if (!manualName.trim()) {
      alert('Informe o nome do item ou serviço.');
=======
  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const cartTotal = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  const openModal = () => {
    setCartItems([]);
    setFormData({ customerId: '', status: 'Concluída', notes: '', paymentMethod: 'Dinheiro', installments: '1', warrantyPeriod: 0 });
    setShowSuccess(false);
    setShowCustomerDropdown(false);
    setShowPaymentDropdown(false);
    setShowStatusDropdown(false);
    setModalVisible(true);
  };

  const handleGenDoc = (type: 'recibo' | 'nota') => {
    if (!lastSale) return;
    const company = { 
      name: companyInfo?.name || 'ControlTec', 
      tradeName: companyInfo?.tradeName || companyInfo?.name || 'ControlTec',
      cnpj: companyInfo?.cnpj || '',
      phone: companyInfo?.phone || '', 
      email: companyInfo?.email || '', 
      address: companyInfo?.address || '',
      logo: companyInfo?.logo || (typeof window !== 'undefined' ? localStorage.getItem('controltec_company_logo') || '' : '')
    };
    const customer = { name: lastSale.clientName };
    const estimate = {
      id: lastSale.id || Date.now().toString(),
      description: lastSale.cartItems.map((i: any) => i.name).join(', '),
      totalValue: lastSale.total,
      status: 'Aprovado',
      items: JSON.stringify(lastSale.cartItems.map((i: any) => ({ name: i.name, qty: i.qty, price: i.price }))),
      notes: lastSale.notes || '',
      createdAt: new Date().toISOString(),
      warrantyPeriod: lastSale.warrantyPeriod,
      paymentMethod: lastSale.paymentMethod,
    };
    if (type === 'recibo') generateRecibo({ estimate, customer, company });
    else generateNotaServico({ estimate, customer, company });
  };

  const handleSave = async () => {
    if (cartItems.length === 0) {
      alert('Adicione ao menos um produto na venda.');
>>>>>>> origin/master
      return;
    }
    const price = Math.max(0, parseFloat(manualPrice) || 0);
    const qty = Math.max(1, parseInt(manualQty) || 1);
    const total = qty * price;

    setItems((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        type: manualType,
        name: manualName.trim(),
        code: manualType === 'servico' ? 'SERVIÇO' : 'PEÇA',
        qty,
        unitPrice: price,
        discount: 0,
        total
      }
    ]);

    setManualName('');
    setManualPrice('');
    setManualQty('1');
    setManualModalVisible(false);
  };

  const updateItemQty = (id: string, qtyText: string) => {
    const qty = Math.max(1, parseInt(qtyText) || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty, total: qty * i.unitPrice - (i.discount || 0) } : i
      )
    );
  };

  const updateItemPrice = (id: string, priceText: string) => {
    const unitPrice = Math.max(0, parseFloat(priceText) || 0);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, unitPrice, total: i.qty * unitPrice - (i.discount || 0) } : i
      )
    );
  };

  const updateItemDiscount = (id: string, discountText: string) => {
    const discount = Math.max(0, parseFloat(discountText) || 0);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, discount, total: Math.max(0, i.qty * i.unitPrice - discount) } : i
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const resetSaleForm = () => {
    setCustomerSearch('Consumidor Final');
    setSelectedCustomerId('');
    setItems([]);
    setPaymentMethod('Dinheiro');
    setInstallments('À vista');
    setObservations('');
    setAmountReceivedText('');
  };

  // Salvar e Finalizar Venda
  const handleFinalizeSale = async (generatePdf = true, resetAfter = true) => {
    if (items.length === 0) {
      alert('Adicione ao menos um produto ou serviço na venda.');
      return;
    }

    setSaveLoading(true);
    try {
      const isFiado = paymentMethod === 'Fiado / A Prazo';
      const salePayload = {
        customerId: selectedCustomerId || null,
        customerName: customerSearch.trim() || 'Consumidor Final',
        items: items.map((i) => ({
          id: i.id,
          type: i.type,
          name: i.name,
          qty: i.qty,
          price: i.unitPrice,
          subtotal: i.total,
          originalId: i.originalId || null
        })),
        discount: totalDiscounts,
        paymentMethod,
        status: isFiado ? 'Pendente' : 'Pago',
        notes: observations.trim() || null,
        warranty: warranty.trim() || null
      };

<<<<<<< HEAD
      const savedSale = await api.create('sales', salePayload);

      if (generatePdf) {
        const fullCustomer = customers.find((c) => c.id === selectedCustomerId);
        generateReciboVenda({
          sale: savedSale,
          customer: fullCustomer || { name: salePayload.customerName },
          company: savedSale.company || companyInfo
        });
      }

      if (resetAfter) {
        resetSaleForm();
      }

      loadData();
=======
      if (formData.paymentMethod === 'Crédito ao Cliente' && numInstallments > 1) {
        const today = new Date();
        for (let i = 1; i <= numInstallments; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);
          await api.create('finance', {
            desc: `Parcela ${i}/${numInstallments} - ${productNames} - ${clientName}`,
            type: 'receita', value: installmentValue, category: 'parcela', client: clientName, status: 'Pendente',
            notes: JSON.stringify({ saleId, installmentNumber: i, totalInstallments: numInstallments, dueDate: dueDate.toISOString(), paymentMethod: formData.paymentMethod, products: productNames, totalValue: cartTotal }),
          });
        }
      } else {
        const installmentLabel = showInstallments && numInstallments > 1
          ? ` ${numInstallments}x de ${formatCurrency(installmentValue)}` : '';
        await api.create('finance', {
          desc: `Venda${customer ? ` - ${clientName}` : ''} (${productNames}) - ${formData.paymentMethod}${installmentLabel}`,
          type: 'receita', value: cartTotal, category: 'venda', client: clientName,
          status: formData.status === 'Concluída' ? 'Recebido' : 'Pendente',
          notes: formData.notes || null,
        });
      }

      setLastSale({
        id: saleId, clientName,
        paymentMethod: formData.paymentMethod,
        cartItems: [...cartItems],
        total: cartTotal,
        notes: formData.notes,
        warrantyPeriod: formData.warrantyPeriod,
        date: new Date().toLocaleString('pt-BR'),
      });
      setShowSuccess(true);
      fetchData();
>>>>>>> origin/master
    } catch (e: any) {
      alert('Erro ao finalizar venda: ' + (e.message || 'Verifique a conexão.'));
    } finally {
      setSaveLoading(false);
    }
  };

<<<<<<< HEAD
  // Cadastrar Cliente Rápido
  const handleSaveQuickCustomer = async () => {
    if (!newCustName.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }
    try {
      const created = await api.create('customers', {
        name: newCustName.trim(),
        phone: newCustPhone.trim() || null
      });
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomerId(created.id);
      setCustomerSearch(created.name);
      setNewCustName('');
      setNewCustPhone('');
      setCustomerModalVisible(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Baixa de Pagamento
  const handleConfirmPay = async () => {
    if (!selectedSaleToPay) return;
    setSaveLoading(true);
    try {
      const updated = await api.update('sales', selectedSaleToPay.id, {
        status: 'Pago',
        paymentMethod: payMethodModal,
        paidAt: new Date().toISOString()
      });

      setPayModalVisible(false);
      loadData();

      generateReciboVenda({
        sale: updated,
        customer: updated.customer || { name: updated.customerName || 'Consumidor Final' },
        company: updated.company || companyInfo
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Filtragem de catálogo para a busca
  const catalogSuggestions = [
    ...inventory.map((p) => ({ ...p, itemType: 'produto' })),
    ...services.map((s) => ({ ...s, itemType: 'servico' }))
  ].filter((item) =>
    item.name.toLowerCase().includes(itemSearchText.toLowerCase())
  );

  // Filtragem do Histórico
  const filteredHistory = salesHistory.filter((s) => {
    const q = historySearch.toLowerCase();
    const matchQ =
      s.code?.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(q));

    const matchSt =
      historyStatus === 'Todos' ||
      (historyStatus === 'Pago' && (s.status === 'Pago' || s.status === 'Recebido')) ||
      (historyStatus === 'Pendente' && s.status === 'Pendente');

    return matchQ && matchSt;
  });
=======
  const filtered = sales.filter((s) => s.desc?.toLowerCase().includes(search.toLowerCase()));
  const totalVendas = sales.reduce((acc, s) => acc + (s.value || 0), 0);
  const totalConcluidas = sales.filter((s) => s.status === 'Recebido').length;
>>>>>>> origin/master

  return (
    <View style={styles.container}>
      {/* ===== CABEÇALHO SUPERIOR ===== */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.cartIconCircle}>
            <ShoppingCart size={22} color="#0F2A5A" />
          </View>
          <View>
            <Text style={styles.pageTitle}>Nova Venda</Text>
            <Text style={styles.pageSubtitle}>Registre uma nova venda de produtos ou serviços</Text>
          </View>
        </View>

        {/* Abas Superiores no Estilo da Imagem */}
        <View style={styles.topTabs}>
          <TouchableOpacity
            style={[styles.tabBtn, activeCatalogTab === 'produtos' && styles.tabBtnActive]}
            onPress={() => setActiveCatalogTab('produtos')}
          >
            <Package size={16} color={activeCatalogTab === 'produtos' ? '#FFF' : '#0F2A5A'} />
            <Text style={[styles.tabBtnText, activeCatalogTab === 'produtos' && styles.tabBtnTextActive]}>
              Produtos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeCatalogTab === 'servicos' && styles.tabBtnActive]}
            onPress={() => setActiveCatalogTab('servicos')}
          >
            <Wrench size={16} color={activeCatalogTab === 'servicos' ? '#FFF' : '#0F2A5A'} />
            <Text style={[styles.tabBtnText, activeCatalogTab === 'servicos' && styles.tabBtnTextActive]}>
              Serviços
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeCatalogTab === 'historico' && styles.tabBtnActive]}
            onPress={() => setActiveCatalogTab('historico')}
          >
            <FileSpreadsheet size={16} color={activeCatalogTab === 'historico' ? '#FFF' : '#0F2A5A'} />
            <Text style={[styles.tabBtnText, activeCatalogTab === 'historico' && styles.tabBtnTextActive]}>
              Histórico / Recibos ({salesHistory.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== CONTEÚDO PRINCIPAL (LAYOUT DE 2 COLUNAS) ===== */}
      {activeCatalogTab !== 'historico' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.mainLayout, isCompact && styles.mainLayoutCompact]}>
            
            {/* COLUNA ESQUERDA: FORMULÁRIO, BUSCA E TABELA DE ITENS */}
            <View style={styles.leftColumn}>
              
              {/* Card 1: Campos do Cabeçalho da Venda */}
              <View style={styles.whiteCard}>
                {/* Linha 1: Cliente, Vendedor, Data */}
                <View style={[styles.formRow, { position: 'relative', zIndex: 9999 }]}>
                  {/* Cliente com Busca em Tempo Real e Cadastro Rápido */}
                  <View style={[styles.formCol, { flex: 2, position: 'relative', zIndex: 9999 }]}>
                    <Text style={styles.label}>Cliente</Text>
                    <View style={{ position: 'relative', width: '100%', zIndex: 9999 }}>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          height: 40,
                          backgroundColor: '#FFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 6,
                          paddingLeft: 10,
                          paddingRight: 38,
                          fontSize: 13,
                          color: '#1C1C1E',
                          outline: 'none',
                          boxSizing: 'border-box' as any,
                        }}
                        placeholder="Digite o nome para buscar ou cadastrar..."
                        value={customerSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerSearch(val);
                          setCustomerDropdownOpen(true);
                          const matched = customers.find(
                            (c) => c.name.toLowerCase() === val.trim().toLowerCase()
                          );
                          if (matched) {
                            setSelectedCustomerId(matched.id);
                          } else if (val === 'Consumidor Final' || val.trim() === '') {
                            setSelectedCustomerId('');
                          } else {
                            setSelectedCustomerId('');
                          }
                        }}
                        onFocus={() => {
                          setCustomerDropdownOpen(true);
                        }}
                        onBlur={() => {
                          // Fecha suavemente após permitir o clique
                          setTimeout(() => setCustomerDropdownOpen(false), 200);
                        }}
                      />

<<<<<<< HEAD
                      <TouchableOpacity
                        style={{ position: 'absolute', right: 8, top: 10, padding: 2 }}
                        onPress={() => {
                          setNewCustName(customerSearch !== 'Consumidor Final' ? customerSearch : '');
                          setCustomerModalVisible(true);
                        }}
                        title="Cadastrar novo cliente"
                      >
                        <Plus size={18} color="#2563EB" />
                      </TouchableOpacity>
=======
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.listContainer}>
            {useTableLayout && (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Descrição</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Valor</Text>
              </View>
            )}
>>>>>>> origin/master

                      {/* Dropdown de Clientes e Opção de Cadastro Rápido */}
                      {customerDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            backgroundColor: '#FFFFFF',
                            borderRadius: 8,
                            border: '1px solid #3B82F6',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.18), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            zIndex: 99999,
                            maxHeight: 280,
                            overflowY: 'auto',
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Opção Consumidor Final */}
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCustomerSearch('Consumidor Final');
                              setSelectedCustomerId('');
                              setCustomerDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #F1F5F9',
                              backgroundColor: customerSearch === 'Consumidor Final' ? '#F8FAFC' : '#FFF',
                            }}
                          >
                            <div style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                              <span style={{ fontSize: 13 }}>👤</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E' }}>Consumidor Final (Sem cadastro)</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>Venda rápida sem identificação de cliente</div>
                            </div>
                          </div>

                          {/* Clientes Filtrados no Banco */}
                          {customers
                            .filter((c) => {
                              if (!customerSearch || customerSearch === 'Consumidor Final') return true;
                              const q = customerSearch.toLowerCase().trim();
                              return (
                                c.name?.toLowerCase().includes(q) ||
                                (c.document && c.document.includes(q)) ||
                                (c.phone && c.phone.includes(q)) ||
                                (c.email && c.email.toLowerCase().includes(q))
                              );
                            })
                            .slice(0, 6)
                            .map((c) => (
                              <div
                                key={c.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCustomerSearch(c.name);
                                  setSelectedCustomerId(c.id);
                                  setCustomerDropdownOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #F1F5F9',
                                  backgroundColor: '#FFF',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFF')}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#DBEAFE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8,
                                    fontWeight: 'bold',
                                    color: '#2563EB',
                                    fontSize: 12,
                                  }}
                                >
                                  {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1E' }}>{c.name}</div>
                                  <div style={{ fontSize: 11, color: '#64748B' }}>
                                    {c.phone ? `📞 ${c.phone}` : ''} {c.document ? `• Doc: ${c.document}` : ''}
                                  </div>
                                </div>
                                <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 'bold' }}>Selecionar ➔</span>
                              </div>
                            ))}

                          {/* Se digitou um nome e não é idêntico a nenhum cliente cadastrado -> Botão de Cadastro Rápido */}
                          {customerSearch.trim() &&
                            customerSearch !== 'Consumidor Final' &&
                            !customers.some((c) => c.name.toLowerCase() === customerSearch.trim().toLowerCase()) && (
                              <div
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCustomerDropdownOpen(false);
                                  setNewCustName(customerSearch.trim());
                                  setCustomerModalVisible(true);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '12px',
                                  cursor: 'pointer',
                                  backgroundColor: '#EFF6FF',
                                  borderTop: '2px solid #BFDBFE',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#DBEAFE')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8,
                                    color: '#FFF',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  +
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>
                                    Cadastrar "{customerSearch}" como novo cliente
                                  </div>
                                  <div style={{ fontSize: 11, color: '#3B82F6' }}>
                                    Clique aqui para abrir o cadastro rápido
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </View>

                    {/* Feedback do cliente selecionado */}
                    {selectedCustomerId ? (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, gap: 6 }}>
                        <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 'bold' }}>
                          ✓ Cliente vinculado
                        </span>
                        <span
                          onClick={() => {
                            setCustomerSearch('Consumidor Final');
                            setSelectedCustomerId('');
                          }}
                          style={{ fontSize: 11, color: '#DC2626', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          (Desvincular / Consumidor Final)
                        </span>
                      </div>
                    ) : null}
                  </View>

                  {/* Vendedor */}
                  <View style={[styles.formCol, { flex: 1.2 }]}>
                    <Text style={styles.label}>Vendedor</Text>
                    <View style={styles.selectWrapper}>
                      <select
                        style={styles.htmlSelect as any}
                        value={sellerName}
                        onChange={(e: any) => setSellerName(e.target.value)}
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Atendente">Atendente</option>
                      </select>
                    </View>
                  </View>

                  {/* Data da Venda */}
                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.label}>Data da Venda</Text>
                    <View style={styles.inputWithIcon}>
                      <TextInput
                        style={styles.inputField}
                        value={saleDate}
                        onChangeText={setSaleDate}
                      />
                      <View style={styles.iconInsideInput}>
                        <Calendar size={16} color="#6E6E73" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Linha 2: Forma de Pagamento, Parcelas, Observações */}
                <View style={[styles.formRow, { marginTop: 12, position: 'relative', zIndex: 1 }]}>
                  {/* Forma de Pagamento */}
                  <View style={[styles.formCol, { flex: 1.2 }]}>
                    <Text style={styles.label}>Forma de Pagamento</Text>
                    <View style={styles.selectWrapper}>
                      <select
                        style={styles.htmlSelect as any}
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm} value={pm}>{pm}</option>
                        ))}
                      </select>
                    </View>
                  </View>

                  {/* Parcelas */}
                  <View style={[styles.formCol, { flex: 1 }]}>
                    <Text style={styles.label}>Parcelas</Text>
                    <View style={styles.selectWrapper}>
                      <select
                        style={styles.htmlSelect as any}
                        value={installments}
                        onChange={(e: any) => setInstallments(e.target.value)}
                      >
                        <option value="À vista">À vista</option>
                        <option value="2x">2x</option>
                        <option value="3x">3x</option>
                        <option value="4x">4x</option>
                        <option value="6x">6x</option>
                        <option value="12x">12x</option>
                      </select>
                    </View>
                  </View>

                  {/* Observações */}
                  <View style={[styles.formCol, { flex: 1.8 }]}>
                    <Text style={styles.label}>Observações</Text>
                    <TextInput
                      style={[styles.inputField, { height: 42 }]}
                      placeholder="Ex.: Entrega, garantia, etc."
                      placeholderTextColor="#8E8E93"
                      value={observations}
                      onChangeText={setObservations}
                    />
                  </View>
                </View>
              </View>
<<<<<<< HEAD

              {/* Card 2: Linha de Busca Rápida de Produto/Serviço */}
              <View style={[styles.whiteCard, { position: 'relative', zIndex: 50 }]}>
                <View style={styles.searchBarRow}>
                  <View style={styles.barcodeSearchWrapper}>
                    <Barcode size={18} color="#6E6E73" style={{ marginLeft: 10 }} />
                    <TextInput
                      style={styles.barcodeInput}
                      placeholder="Digite o código ou nome do produto / serviço..."
                      placeholderTextColor="#8E8E93"
                      value={itemSearchText}
                      onChangeText={(t) => {
                        setItemSearchText(t);
                        setSearchDropdownOpen(t.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (itemSearchText.trim().length > 0) setSearchDropdownOpen(true);
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.btnBlueAdd}
                    onPress={() => {
                      if (catalogSuggestions.length > 0) {
                        addItemFromCatalog(catalogSuggestions[0], catalogSuggestions[0].itemType as any);
                      }
                    }}
                  >
                    <Text style={styles.btnBlueAddText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {/* Dropdown de Sugestões em Tempo Real */}
                {searchDropdownOpen && catalogSuggestions.length > 0 && (
                  <View style={styles.searchDropdown}>
                    {catalogSuggestions.slice(0, 6).map((sug, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.searchDropdownItem}
                        onPress={() => addItemFromCatalog(sug, sug.itemType as any)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.searchDropdownTitle}>{sug.name}</Text>
                          <Text style={styles.searchDropdownSub}>
                            {sug.itemType === 'produto' ? '📦 Peça no Estoque' : '🔧 Serviço'} • {sug.category || ''}
                          </Text>
                        </View>
                        <Text style={styles.searchDropdownPrice}>
                          {formatCurrency(sug.itemType === 'produto' ? (sug.sellPrice || sug.price || 0) : (sug.defaultPrice || 0))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Card 3: Tabela de Itens Adicionados */}
              <View style={styles.whiteCard}>
                {/* Cabeçalho da Tabela */}
                <View style={styles.tableHead}>
                  <Text style={[styles.th, { width: 35 }]}>#</Text>
                  <Text style={[styles.th, { flex: 3 }]}>Produto / Serviço</Text>
                  <Text style={[styles.th, { width: 85, textAlign: 'center' }]}>Quantidade</Text>
                  <Text style={[styles.th, { width: 105, textAlign: 'right' }]}>Valor Unitário</Text>
                  <Text style={[styles.th, { width: 85, textAlign: 'right' }]}>Desconto</Text>
                  <Text style={[styles.th, { width: 105, textAlign: 'right' }]}>Total</Text>
                  <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>Ações</Text>
                </View>

                {/* Linhas da Tabela */}
                {items.length === 0 ? (
                  <View style={styles.emptyTable}>
                    <ShoppingCart size={32} color="#8E8E93" />
                    <Text style={styles.emptyTableText}>Nenhum produto ou serviço adicionado.</Text>
                    <Text style={styles.emptyTableSubText}>Utilize a barra de busca acima ou clique em "Adicionar manualmente".</Text>
                  </View>
                ) : (
                  items.map((item, index) => (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.td, { width: 35, color: '#8E8E93', fontWeight: 'bold' }]}>
                        {index + 1}
                      </Text>

                      {/* Nome e Ícone */}
                      <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.itemBadgeIcon}>
                          {item.type === 'produto' ? (
                            <Package size={14} color="#2563EB" />
                          ) : (
                            <Wrench size={14} color="#10B981" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemNameText}>{item.name}</Text>
                          <Text style={styles.itemSubText}>{item.code || (item.type === 'produto' ? 'Peça' : 'Serviço')}</Text>
                        </View>
                      </View>

                      {/* Quantidade */}
                      <View style={{ width: 85, alignItems: 'center' }}>
                        <TextInput
                          style={styles.tableInputNumber}
                          keyboardType="numeric"
                          defaultValue={String(item.qty)}
                          onBlur={(e) => updateItemQty(item.id, e.nativeEvent.text)}
                        />
                      </View>

                      {/* Valor Unitário */}
                      <View style={{ width: 105, alignItems: 'flex-end' }}>
                        <TextInput
                          style={[styles.tableInputNumber, { width: 85, textAlign: 'right' }]}
                          keyboardType="numeric"
                          defaultValue={String(item.unitPrice)}
                          onBlur={(e) => updateItemPrice(item.id, e.nativeEvent.text)}
                        />
                      </View>

                      {/* Desconto */}
                      <View style={{ width: 85, alignItems: 'flex-end' }}>
                        <TextInput
                          style={[styles.tableInputNumber, { width: 70, textAlign: 'right', color: '#DC2626' }]}
                          keyboardType="numeric"
                          defaultValue={String(item.discount || 0)}
                          onBlur={(e) => updateItemDiscount(item.id, e.nativeEvent.text)}
                        />
                      </View>

                      {/* Total da Linha */}
                      <Text style={[styles.td, { width: 105, textAlign: 'right', fontWeight: 'bold', color: '#1C1C1E' }]}>
                        {formatCurrency(item.total)}
                      </Text>

                      {/* Ações */}
                      <View style={{ width: 60, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <TouchableOpacity onPress={() => removeItem(item.id)}>
                          <Trash2 size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* Rodapé da Tabela: Botão Adicionar Manualmente + Finalizar Venda */}
                <View style={styles.tableFooterRow}>
                  <TouchableOpacity
                    style={styles.btnManualAdd}
                    onPress={() => setManualModalVisible(true)}
                  >
                    <PlusCircle size={20} color="#2563EB" />
                    <View>
                      <Text style={styles.btnManualAddTitle}>Adicionar produto/serviço manualmente</Text>
                      <Text style={styles.btnManualAddSub}>Caso o item não esteja no catálogo</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnFinalizeBig, items.length === 0 && { opacity: 0.6 }]}
                    onPress={() => handleFinalizeSale(true, true)}
                    disabled={saveLoading || items.length === 0}
                  >
                    {saveLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <ShoppingCart size={18} color="#FFF" />
                        <Text style={styles.btnFinalizeBigText}>Finalizar Venda</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* COLUNA DIREITA: CARDS DE RESUMO DA VENDA E PAGAMENTO */}
            <View style={styles.rightColumn}>
              
              {/* Card Resumo da Venda */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Receipt size={18} color="#FFF" />
                  <Text style={styles.summaryHeaderTitle}>Resumo da Venda</Text>
                </View>

                <View style={styles.summaryBody}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Produtos</Text>
                    <Text style={styles.summaryRowValue}>{formatCurrency(totalProducts)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Serviços</Text>
                    <Text style={styles.summaryRowValue}>{formatCurrency(totalServices)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Descontos</Text>
                    <Text style={[styles.summaryRowValue, totalDiscounts > 0 && { color: '#DC2626' }]}>
                      {formatCurrency(totalDiscounts)}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Subtotal</Text>
                    <Text style={styles.summaryRowValue}>{formatCurrency(subtotal)}</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={[styles.summaryRow, { marginTop: 4 }]}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.summaryTotalValue}>{formatCurrency(grandTotal)}</Text>
                  </View>
                </View>
              </View>

              {/* Card Pagamento e Troco */}
              <View style={styles.whiteCard}>
                <View style={styles.cardHeaderSmall}>
                  <CreditCard size={18} color="#0F2A5A" />
                  <Text style={styles.cardHeaderSmallTitle}>Pagamento</Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Forma de Pagamento</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </View>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Valor Recebido</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder={formatCurrency(grandTotal)}
                    keyboardType="numeric"
                    value={amountReceivedText}
                    onChangeText={setAmountReceivedText}
                  />
                </View>

                {/* Box de Troco Verde */}
                <View style={styles.changeDueBox}>
                  <Text style={styles.changeDueLabel}>Troco</Text>
                  <Text style={styles.changeDueValue}>{formatCurrency(changeDue)}</Text>
                </View>

                {/* Botões de Ação na Lateral */}
                <View style={styles.sideButtonsRow}>
                  <TouchableOpacity
                    style={styles.sideBtnPrint}
                    onPress={() => handleFinalizeSale(true, true)}
                    disabled={saveLoading || items.length === 0}
                  >
                    <Printer size={16} color="#0F2A5A" />
                    <Text style={styles.sideBtnPrintText}>Imprimir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sideBtnSubmit}
                    onPress={() => handleFinalizeSale(true, true)}
                    disabled={saveLoading || items.length === 0}
                  >
                    <FileText size={16} color="#FFF" />
                    <Text style={styles.sideBtnSubmitText}>Gerar Recibo</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>

          </View>
        </ScrollView>
      ) : (
        /* ===== ABA HISTÓRICO DE RECIBOS ===== */
        <View style={styles.historyContainer}>
          <View style={styles.historyFilterBar}>
            <View style={styles.searchHistoryWrap}>
              <Search size={18} color="#6E6E73" />
              <TextInput
                style={styles.searchHistoryInput}
                placeholder="Pesquisar por cliente ou código do recibo..."
                placeholderTextColor="#8E8E93"
                value={historySearch}
                onChangeText={setHistorySearch}
              />
            </View>

            <View style={styles.filterStatusGroup}>
              {['Todos', 'Pago', 'Pendente'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.filterStatusBtn,
                    historyStatus === st && styles.filterStatusBtnActive
                  ]}
                  onPress={() => setHistoryStatus(st as any)}
                >
                  <Text
                    style={[
                      styles.filterStatusTxt,
                      historyStatus === st && styles.filterStatusTxtActive
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {filteredHistory.length === 0 ? (
              <View style={styles.emptyTable}>
                <Receipt size={40} color="#8E8E93" />
                <Text style={styles.emptyTableText}>Nenhum recibo encontrado no histórico.</Text>
              </View>
            ) : (
              filteredHistory.map((h) => {
                const isPago = h.status === 'Pago' || h.status === 'Recebido';
                return (
                  <View key={h.id} style={styles.historyItemCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.histCodeText}>{h.code}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isPago ? '#D4EDDA' : '#FFF3CD' }]}>
                          <Text style={[styles.statusBadgeText, { color: isPago ? '#155724' : '#856404' }]}>
                            {isPago ? '✓ PAGO' : '⏳ PENDENTE / FIADO'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.histClientText}>{h.customer?.name || h.customerName || 'Consumidor Final'}</Text>
                      <Text style={styles.histDateText}>
                        {new Date(h.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(h.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                        • {h.paymentMethod}
                      </Text>
                    </View>
=======
            ) : filtered.map((item) => (
              useTableLayout ? (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.itemName, { flex: 3 }]} numberOfLines={1}>{item.desc || 'Venda'}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status === 'Recebido' ? 'Concluída' : 'Pendente']?.bg || '#eee' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[item.status === 'Recebido' ? 'Concluída' : 'Pendente']?.text || '#333' }]}>
                        {item.status === 'Recebido' ? 'Pago' : item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { flex: 1, textAlign: 'right' }]}>{formatCurrency(item.value || 0)}</Text>
                </View>
              ) : (
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.desc || 'Venda'}</Text>
                      <Text style={styles.itemSub}>{item.client}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status === 'Recebido' ? 'Concluída' : 'Pendente']?.bg || '#eee' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[item.status === 'Recebido' ? 'Concluída' : 'Pendente']?.text || '#333' }]}>
                        {item.status === 'Recebido' ? 'Pago' : item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <Text style={styles.priceText}>{formatCurrency(item.value || 0)}</Text>
                    <Text style={styles.itemSub}>{item.category}</Text>
                  </View>
                </View>
              )
            ))}
          </ScrollView>
        )}
      </View>
>>>>>>> origin/master

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.histTotalText}>{formatCurrency(h.totalValue)}</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.btnHistPdf}
                          onPress={() =>
                            generateReciboVenda({
                              sale: h,
                              customer: h.customer || { name: h.customerName || 'Consumidor Final' },
                              company: h.company || companyInfo
                            })
                          }
                        >
                          <Printer size={14} color="#0F2A5A" />
                          <Text style={styles.btnHistPdfTxt}>Recibo PDF</Text>
                        </TouchableOpacity>

                        {!isPago && (
                          <TouchableOpacity
                            style={styles.btnHistPay}
                            onPress={() => {
                              setSelectedSaleToPay(h);
                              setPayModalVisible(true);
                            }}
                          >
                            <CheckCircle size={14} color="#FFF" />
                            <Text style={styles.btnHistPayTxt}>Dar Baixa</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* ===== MODAL ITEM AVULSO / MANUAL ===== */}
      <Modal visible={manualModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Adicionar Item Manualmente</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X size={20} color="#6E6E73" />
              </TouchableOpacity>
            </View>

<<<<<<< HEAD
            <View style={{ padding: 16, gap: 12 }}>
              <View>
                <Text style={styles.label}>Descrição do Produto ou Serviço</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Ex: Formatação, Troca de cabo, Cabo HDMI..."
                  placeholderTextColor="#8E8E93"
                  value={manualName}
                  onChangeText={setManualName}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Valor Unitário (R$)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={manualPrice}
                    onChangeText={setManualPrice}
                  />
                </View>

                <View style={{ flex: 0.7 }}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={manualQty}
                    onChangeText={setManualQty}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tipo</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={manualType}
                      onChange={(e: any) => setManualType(e.target.value)}
                    >
                      <option value="servico">🔧 Serviço</option>
                      <option value="produto">📦 Peça / Produto</option>
                    </select>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFoot}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setManualModalVisible(false)}>
                <Text style={{ color: '#6E6E73', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmBlue} onPress={handleAddManualItem}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Inserir na Venda</Text>
              </TouchableOpacity>
            </View>
=======
            {showSuccess ? (
              // ===== SUCCESS SCREEN =====
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <CheckCircle size={56} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Venda Finalizada!</Text>
                <Text style={styles.successSubtitle}>
                  {lastSale?.clientName} • {formatCurrency(lastSale?.total || 0)}
                </Text>

                <View style={styles.successActions}>
                  <TouchableOpacity style={styles.docButton} onPress={() => handleGenDoc('recibo')}>
                    <View style={styles.docButtonIcon}>
                      <Text style={{ fontSize: 22 }}>🧾</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docButtonTitle}>Cupom / Recibo</Text>
                      <Text style={styles.docButtonSub}>Gerar recibo para impressão</Text>
                    </View>
                    <ChevronDown size={18} color={Theme.colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.docButton} onPress={() => handleGenDoc('nota')}>
                    <View style={styles.docButtonIcon}>
                      <Text style={{ fontSize: 22 }}>📄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docButtonTitle}>Nota de Serviço PDF</Text>
                      <Text style={styles.docButtonSub}>Gerar nota no padrão ControlTec</Text>
                    </View>
                    <ChevronDown size={18} color={Theme.colors.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { marginTop: 8, justifyContent: 'center' }]}
                    onPress={() => { setShowSuccess(false); openModal(); }}
                  >
                    <Text style={styles.saveButtonText}>+ Nova Venda</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.cancelButton, { alignItems: 'center' }]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ScrollView style={styles.modalForm}>
                  {/* Cliente */}
                  <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                    <Text style={styles.label}>Cliente (opcional)</Text>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        style={styles.customDropdownButton}
                        onPress={() => { setShowCustomerDropdown(!showCustomerDropdown); setShowPaymentDropdown(false); setShowStatusDropdown(false); }}
                      >
                        <Text style={styles.customDropdownText}>
                          {customers.find((c: any) => c.id === formData.customerId)?.name || 'Consumidor Final'}
                        </Text>
                        <ChevronDown size={20} color="#8E8E93" />
                      </TouchableOpacity>
                      {showCustomerDropdown && (
                        <ScrollView style={styles.customDropdownList} nestedScrollEnabled>
                          <TouchableOpacity style={styles.customDropdownItem} onPress={() => { setFormData({ ...formData, customerId: '' }); setShowCustomerDropdown(false); }}>
                            <Text style={styles.customDropdownItemText}>Consumidor Final</Text>
                          </TouchableOpacity>
                          {customers.map((c: any) => (
                            <TouchableOpacity key={c.id} style={styles.customDropdownItem} onPress={() => { setFormData({ ...formData, customerId: c.id }); setShowCustomerDropdown(false); }}>
                              <Text style={styles.customDropdownItemText}>{c.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>

                  {/* Forma de Pagamento */}
                  <View style={[styles.inputGroup, { zIndex: 999 }]}>
                    <Text style={styles.label}>Forma de Pagamento</Text>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        style={styles.customDropdownButton}
                        onPress={() => { setShowPaymentDropdown(!showPaymentDropdown); setShowCustomerDropdown(false); setShowStatusDropdown(false); }}
                      >
                        <Text style={styles.customDropdownText}>{formData.paymentMethod}</Text>
                        <ChevronDown size={20} color="#8E8E93" />
                      </TouchableOpacity>
                      {showPaymentDropdown && (
                        <View style={styles.customDropdownList}>
                          {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Transferência', 'Crédito ao Cliente'].map(method => (
                            <TouchableOpacity key={method} style={styles.customDropdownItem} onPress={() => { setFormData({ ...formData, paymentMethod: method }); setShowPaymentDropdown(false); }}>
                              <Text style={styles.customDropdownItemText}>{method}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Parcelas — aparece só para Cartão de Crédito e Crédito ao Cliente */}
                  {showInstallments && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Número de Parcelas</Text>
                      <View style={styles.installmentsGrid}>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((n) => (
                          <TouchableOpacity
                            key={n}
                            style={[styles.installmentBtn, formData.installments === n && styles.installmentBtnActive]}
                            onPress={() => setFormData({ ...formData, installments: n })}
                          >
                            <Text style={[styles.installmentBtnText, formData.installments === n && styles.installmentBtnTextActive]}>{n}x</Text>
                            {cartTotal > 0 && (
                              <Text style={[styles.installmentBtnValue, formData.installments === n && styles.installmentBtnTextActive]}>
                                {formatCurrency(cartTotal / parseInt(n))}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Status */}
                  <View style={[styles.inputGroup, { zIndex: 998 }]}>
                    <Text style={styles.label}>Status</Text>
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity
                        style={styles.customDropdownButton}
                        onPress={() => { setShowStatusDropdown(!showStatusDropdown); setShowCustomerDropdown(false); setShowPaymentDropdown(false); }}
                      >
                        <Text style={styles.customDropdownText}>
                          {formData.status === 'Concluída' ? 'Concluída (Pago)' : 'Aguardando Pagamento'}
                        </Text>
                        <ChevronDown size={20} color="#8E8E93" />
                      </TouchableOpacity>
                      {showStatusDropdown && (
                        <View style={styles.customDropdownList}>
                          <TouchableOpacity style={styles.customDropdownItem} onPress={() => { setFormData({ ...formData, status: 'Concluída' }); setShowStatusDropdown(false); }}>
                            <Text style={styles.customDropdownItemText}>Concluída (Pago)</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.customDropdownItem} onPress={() => { setFormData({ ...formData, status: 'Pendente' }); setShowStatusDropdown(false); }}>
                            <Text style={styles.customDropdownItemText}>Aguardando Pagamento</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Produtos do estoque */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Adicionar Produtos do Estoque</Text>
                    {inventory.length === 0 ? (
                      <Text style={{ color: Theme.colors.textSecondary, fontSize: 13 }}>Nenhum produto no estoque.</Text>
                    ) : (
                      <View style={styles.productList}>
                        {inventory.map((prod: any) => (
                          <TouchableOpacity
                            key={prod.id}
                            style={styles.productItem}
                            onPress={() => addToCart(prod)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.productName}>{prod.name}</Text>
                              <Text style={styles.productPrice}>{formatCurrency(prod.sellPrice || prod.price || 0)}</Text>
                            </View>
                            <View style={styles.addProductBtn}>
                              <Plus size={16} color="#FFF" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Carrinho */}
                  {cartItems.length > 0 && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Itens da Venda</Text>
                      <View style={styles.cartContainer}>
                        {cartItems.map((item) => (
                          <View key={item.productId} style={styles.cartItem}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cartItemName}>{item.name}</Text>
                              <Text style={styles.cartItemPrice}>{item.qty}x {formatCurrency(item.price)}</Text>
                            </View>
                            <Text style={styles.cartItemTotal}>{formatCurrency(item.price * item.qty)}</Text>
                            <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={{ marginLeft: 8 }}>
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        <View style={styles.cartTotal}>
                          <Text style={styles.cartTotalLabel}>Total</Text>
                          <Text style={styles.cartTotalValue}>{formatCurrency(cartTotal)}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Garantia */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Período de Garantia (Meses)</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setFormData({ ...formData, warrantyPeriod: Math.max(0, Number(formData.warrantyPeriod) - 1) })}
                      >
                        <Minus size={20} color={Theme.colors.textPrimary} />
                      </TouchableOpacity>
                      <View style={styles.stepperValueContainer}>
                        <Text style={styles.stepperValue}>{formData.warrantyPeriod}</Text>
                        <Text style={styles.stepperSuffix}>{Number(formData.warrantyPeriod) === 1 ? 'mês' : 'meses'}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setFormData({ ...formData, warrantyPeriod: Number(formData.warrantyPeriod) + 1 })}
                      >
                        <Plus size={20} color={Theme.colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Observações */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observações</Text>
                    <TextInput
                      style={[styles.input, { height: 70 }]}
                      multiline
                      value={formData.notes}
                      onChangeText={(v) => setFormData({ ...formData, notes: v })}
                      placeholder="Anotações da venda..."
                      placeholderTextColor={Theme.colors.textSecondary}
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
                    {saveLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        Finalizar Venda {cartItems.length > 0 ? `• ${formatCurrency(cartTotal)}` : ''}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
>>>>>>> origin/master
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL NOVO CLIENTE RÁPIDO ===== */}
      <Modal visible={customerModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Cadastrar Novo Cliente</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <X size={20} color="#6E6E73" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              <View>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Nome do cliente..."
                  value={newCustName}
                  onChangeText={setNewCustName}
                  autoFocus
                  returnKeyType="next"
                />
              </View>
              <View>
                <Text style={styles.label}>Telefone / WhatsApp</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="(11) 99999-9999"
                  value={newCustPhone}
                  onChangeText={setNewCustPhone}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveQuickCustomer}
                />
              </View>
            </View>

            <View style={styles.modalFoot}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setCustomerModalVisible(false)}>
                <Text style={{ color: '#6E6E73', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmBlue} onPress={handleSaveQuickCustomer}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Salvar Cliente</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== MODAL DAR BAIXA DE PAGAMENTO ===== */}
      <Modal visible={payModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Marcar Recibo como Pago</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <X size={20} color="#6E6E73" />
              </TouchableOpacity>
            </View>

            {selectedSaleToPay && (
              <View style={{ padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 14, color: '#555' }}>
                  Recibo: <strong>{selectedSaleToPay.code}</strong> — {selectedSaleToPay.customerName || 'Cliente'}<br />
                  Valor Total: <strong style={{ color: '#10B981', fontSize: 16 }}>{formatCurrency(selectedSaleToPay.totalValue)}</strong>
                </Text>

                <View>
                  <Text style={styles.label}>Forma de Pagamento Recebida</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={payMethodModal}
                      onChange={(e: any) => setPayMethodModal(e.target.value)}
                    >
                      {PAYMENT_METHODS.filter((m) => m !== 'Fiado / A Prazo').map((pm) => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalFoot}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setPayModalVisible(false)}>
                <Text style={{ color: '#6E6E73', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmGreen} onPress={handleConfirmPay} disabled={saveLoading}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Confirmar Pagamento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: '#F4F6FB', // Fundo cinza suave e moderno como a imagem
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2A5A',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 2,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#2563EB', // Azul vibrante ativo
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2A5A',
  },
  tabBtnTextActive: {
    color: '#FFF',
  },

  // Layout 2 Colunas
  mainLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  mainLayoutCompact: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 2.8,
    gap: 14,
  },
  rightColumn: {
    flex: 1.2,
    gap: 14,
    minWidth: 280,
  },

  // Cards
  whiteCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    overflow: 'visible',
    position: 'relative',
    zIndex: 10,
  },

  // Form Fields
  formRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  formCol: {
    minWidth: 120,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  inputField: {
    height: 40,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1C1C1E',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconInsideInput: {
    position: 'absolute',
    right: 8,
    padding: 4,
  },
  selectWrapper: {
    height: 40,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
  },
  htmlSelect: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#1C1C1E',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },

  // Barra de Busca de Código de Barras
  searchBarRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  barcodeSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
  },
  barcodeInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1C1C1E',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  btnBlueAdd: {
    backgroundColor: '#2563EB',
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBlueAddText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Dropdown de Busca
  searchDropdown: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 100,
  },
  searchDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchDropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  searchDropdownSub: {
    fontSize: 11,
    color: '#6E6E73',
    marginTop: 2,
  },
  searchDropdownPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10B981',
  },

  // Tabela
  tableHead: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  th: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  itemBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  itemSubText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  tableInputNumber: {
    height: 32,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 13,
    color: '#1C1C1E',
    backgroundColor: '#FFF',
    paddingHorizontal: 4,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  emptyTable: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTableText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  emptyTableSubText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Rodapé da Tabela
  tableFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 10,
  },
  btnManualAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnManualAddTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  btnManualAddSub: {
    fontSize: 11,
    color: '#64748B',
  },
  btnFinalizeBig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB', // Azul como na imagem
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  btnFinalizeBigText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Card Resumo Lateral
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  summaryHeader: {
    backgroundColor: '#2563EB', // Azul cabeçalho
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryHeaderTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  summaryBody: {
    padding: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryRowValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F2A5A',
  },

  // Card Pagamento Lateral
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardHeaderSmallTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F2A5A',
  },
  changeDueBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
  },
  changeDueLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
    textTransform: 'uppercase',
  },
  changeDueValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
    marginTop: 2,
  },
  sideButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  sideBtnPrint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    gap: 6,
  },
  sideBtnPrintText: {
    color: '#0F2A5A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sideBtnSubmit: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    gap: 6,
  },
  sideBtnSubmitText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Histórico
  historyContainer: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  historyFilterBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  searchHistoryWrap: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
  },
  searchHistoryInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1C1C1E',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  filterStatusGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterStatusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterStatusBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterStatusTxt: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  filterStatusTxtActive: {
    color: '#FFF',
  },
  historyItemCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histCodeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563EB',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  histClientText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 2,
  },
  histDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  histTotalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  btnHistPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  btnHistPdfTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  btnHistPay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  btnHistPayTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F2A5A',
  },
  modalFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnCancel: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  btnConfirmBlue: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnConfirmGreen: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },

  // Dropdown de Clientes Flutuante
  customerDropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 99999,
    maxHeight: 250,
    overflow: 'hidden',
  },
  customerDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  customerDropdownName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  customerDropdownSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  customerAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarSmallText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
=======
  container: { flex: 1, padding: Theme.spacing.lg, backgroundColor: Theme.colors.background, minWidth: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.lg, gap: Theme.spacing.md },
  headerCompact: { flexDirection: 'column', alignItems: 'stretch' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.textInverse },
  pageTitleBlock: { flexShrink: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.accent, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.borderRadius.sm, gap: 6 },
  addButtonBlock: { alignSelf: 'stretch', justifyContent: 'center' },
  addButtonText: { color: Theme.colors.textInverse, fontWeight: 'bold' },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  summaryCardsMobile: { flexDirection: 'column' },
  summaryCard: { flexGrow: 1, flexBasis: 0, minWidth: 160, backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderLeftWidth: 5 },
  summaryLabel: { fontSize: 12, color: Theme.colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4, color: Theme.colors.textPrimary },
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.lg, height: 44 },
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  priceText: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptySubText: { fontSize: 14, color: Theme.colors.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 560, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary },
  modalForm: { padding: Theme.spacing.lg },
  inputGroup: { marginBottom: Theme.spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: Theme.spacing.xs },
  input: { height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, fontSize: 16, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  installmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  installmentBtn: { minWidth: 68, paddingVertical: 8, paddingHorizontal: 6, borderRadius: Theme.borderRadius.sm, borderWidth: 1.5, borderColor: Theme.colors.border, backgroundColor: Theme.colors.inputBackground, alignItems: 'center' },
  installmentBtnActive: { borderColor: Theme.colors.accent, backgroundColor: Theme.colors.accent + '18' },
  installmentBtnValue: { fontSize: 10, color: Theme.colors.textSecondary, marginTop: 2 },
  installmentBtnText: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textPrimary },
  installmentBtnTextActive: { color: Theme.colors.accent },
  productList: { gap: 8 },
  productItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  productName: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  productPrice: { fontSize: 13, color: Theme.colors.textSecondary },
  addProductBtn: { backgroundColor: Theme.colors.accent, borderRadius: 20, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  cartContainer: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, gap: 8 },
  cartItem: { flexDirection: 'row', alignItems: 'center' },
  cartItemName: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  cartItemPrice: { fontSize: 12, color: Theme.colors.textSecondary },
  cartItemTotal: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textPrimary },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: Theme.colors.border, marginTop: 4 },
  cartTotalLabel: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary },
  cartTotalValue: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: '#10B981', paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 120, alignItems: 'center', flexDirection: 'row', gap: 4 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  // Custom Dropdown
  customDropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md },
  customDropdownText: { fontSize: 16, color: Theme.colors.textPrimary, flex: 1 },
  customDropdownList: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, maxHeight: 200, zIndex: 9999, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  customDropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground },
  customDropdownItemText: { fontSize: 15, color: Theme.colors.textPrimary },
  // Stepper
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, height: 48, width: 220, alignSelf: 'flex-start' },
  stepperBtn: { paddingHorizontal: 16, height: '100%', justifyContent: 'center', alignItems: 'center' },
  stepperValueContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: Theme.colors.border, height: '100%' },
  stepperValue: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary, marginRight: 4 },
  stepperSuffix: { fontSize: 14, color: Theme.colors.textSecondary },
  // Success Screen
  successContainer: { padding: 32, alignItems: 'center' },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#D4F8E8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: Theme.colors.textPrimary, marginBottom: 6 },
  successSubtitle: { fontSize: 15, color: Theme.colors.textSecondary, marginBottom: 24 },
  successActions: { width: '100%', gap: 10 },
  docButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, gap: 12 },
  docButtonIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  docButtonTitle: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  docButtonSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
>>>>>>> origin/master
});

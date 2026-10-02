import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, ActivityIndicator, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { Search, Plus, FileText, X, Edit2, Trash2, Receipt, ClipboardList, Minus, Percent, DollarSign, ShoppingBag, Package } from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';
import { generateRecibo, generateNotaServico } from '../../services/documentGenerator';
import { useLocalSearchParams } from 'expo-router';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  discountType: 'value' | 'percent';
  discountValue: number;
}

export default function EstimatesScreen() {
  const { isCompact, useTableLayout } = useBreakpoints();
  const { openModal } = useLocalSearchParams<{ openModal?: string }>();

  const [search, setSearch] = useState('');
  const [estimates, setEstimates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

  // Cart state for estimate items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  // Global discount
  const [globalDiscountType, setGlobalDiscountType] = useState<'value' | 'percent'>('value');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('0');

  const [formData, setFormData] = useState({
    id: '', status: 'Pendente', description: '', notes: '',
    items: '[]', totalValue: '0', validUntil: '', customerId: '',
    warranty: ''
  });
  const formDataRef = useRef(formData);

  const updateFormData = useCallback((updater: any) => {
    setFormData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      formDataRef.current = next;
      return next;
    });
  }, []);

  const fetchData = async () => {
    try {
      const [estData, custData, invData] = await Promise.all([
        api.getAll('estimates'),
        api.getAll('customers'),
        api.getAll('inventory'),
      ]);
      setEstimates(estData);
      setCustomers(custData);
      setInventory(invData);
      // Store company info from first estimate's company
      if (estData[0]?.company) setCompanyInfo(estData[0].company);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (openModal === 'true') {
      setFormData({
        id: '', status: 'Pendente', description: '', notes: '',
        items: '[]', totalValue: '0', validUntil: '', customerId: ''
      });
      setCartItems([]);
      setGlobalDiscountValue('0');
      setModalVisible(true);
    }
  }, [openModal]);

  // ── Cart helpers ──
  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.sellPrice || product.price || 0,
        qty: 1,
        discountType: 'value' as const,
        discountValue: 0,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const updateCartItemDiscount = (productId: string, type: 'value' | 'percent', value: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId === productId) {
        return { ...i, discountType: type, discountValue: value };
      }
      return i;
    }));
  };

  const getItemSubtotal = (item: CartItem) => {
    const gross = item.price * item.qty;
    if (item.discountType === 'value') {
      return Math.max(0, gross - item.discountValue);
    }
    return Math.max(0, gross * (1 - item.discountValue / 100));
  };

  const getItemDiscountAmount = (item: CartItem) => {
    const gross = item.price * item.qty;
    return gross - getItemSubtotal(item);
  };

  const cartSubtotal = cartItems.reduce((acc, i) => acc + getItemSubtotal(i), 0);
  
  const globalDiscountAmount = globalDiscountType === 'value'
    ? parseFloat(globalDiscountValue) || 0
    : cartSubtotal * ((parseFloat(globalDiscountValue) || 0) / 100);

  const cartTotal = Math.max(0, cartSubtotal - globalDiscountAmount);

  const filteredProducts = productSearch.trim() === ''
    ? []
    : inventory.filter(p =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(productSearch.toLowerCase())
      );

  // ── Handlers ──
  const handleCustomerChange = useCallback((e: any) => {
    const val = e?.target?.value ?? e?.currentTarget?.value ?? '';
    updateFormData((prev: any) => ({ ...prev, customerId: val }));
  }, [updateFormData]);

  const handleSave = async () => {
    const current = formDataRef.current;
    if (!current.customerId || !current.description) {
      alert('Cliente e Descrição são obrigatórios.');
      return;
    }
    try {
      // Build items JSON from cart
      const itemsData = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        discountType: item.discountType,
        discountValue: item.discountValue,
        subtotal: getItemSubtotal(item),
      }));

      const payload = {
        ...current,
        total: cartTotal,
        items: JSON.stringify(itemsData),
        warranty: current.warranty || '',
        notes: (current.notes || '') + (globalDiscountAmount > 0
          ? `\n[Desconto geral: ${globalDiscountType === 'value' ? formatCurrency(globalDiscountAmount) : `${globalDiscountValue}%`}]`
          : ''),
      };
      if (current.id) {
        const { id, totalValue, customer, company, device, createdAt, updatedAt, code, ...updateData } = payload;
        await api.update('estimates', current.id, updateData);
      } else {
        const { id, totalValue, customer, company, device, createdAt, updatedAt, code, ...createData } = payload;
        await api.create('estimates', createData);
      }
      setModalVisible(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const resetForm = () => {
    const reset = { id: '', status: 'Pendente', description: '', notes: '', items: '[]', totalValue: '0', validUntil: '', customerId: '', warranty: '' };
    formDataRef.current = reset;
    setFormData(reset);
    setCartItems([]);
  };
    setCartItems([]);
    setGlobalDiscountType('value');
    setGlobalDiscountValue('0');
    setProductSearch('');
  };

  const handleEdit = (item: any) => {
    const next = { ...item, totalValue: String(item.total || 0), notes: item.notes || '', warranty: item.warranty || '' };
    formDataRef.current = next;
    setFormData(next);

    // Restore cart items from saved JSON
    try {
      const savedItems = JSON.parse(item.items || '[]');
      if (Array.isArray(savedItems) && savedItems.length > 0 && savedItems[0].productId) {
        setCartItems(savedItems.map((si: any) => ({
          productId: si.productId,
          name: si.name,
          price: si.price,
          qty: si.qty,
          discountType: si.discountType || 'value',
          discountValue: si.discountValue || 0,
        })));
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }

    setGlobalDiscountType('value');
    setGlobalDiscountValue('0');
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      try { await api.remove('estimates', id); fetchData(); } catch (e: any) { alert(e.message); }
    };
    if (Platform.OS === 'web') {
      if (confirm('Deseja excluir este orçamento?')) performDelete();
    } else {
      Alert.alert('Confirmação', 'Deseja excluir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const openDocModal = (item: any) => {
    setSelectedEstimate(item);
    setDocModalVisible(true);
  };

  const buildDocData = (item: any) => ({
    estimate: {
      id: item.id,
      code: item.code,
      description: item.description || '',
      totalValue: item.total || 0,
      status: item.status || 'Pendente',
      items: item.items,
      notes: item.notes,
      createdAt: item.createdAt,
      validUntil: item.validUntil,
      warranty: item.warranty || '',
    },
    customer: {
      name: item.customer?.name || 'Cliente',
      document: item.customer?.document,
      phone: item.customer?.phone,
      email: item.customer?.email,
      address: item.customer?.address,
    },
    company: {
      name: companyInfo?.name || item.company?.name || 'Empresa',
      tradeName: companyInfo?.tradeName || item.company?.tradeName || companyInfo?.name || item.company?.name || 'Empresa',
      cnpj: companyInfo?.cnpj || item.company?.cnpj,
      phone: companyInfo?.phone || item.company?.phone,
      email: companyInfo?.email || item.company?.email,
      address: companyInfo?.address || item.company?.address,
      logo: companyInfo?.logo || (typeof window !== 'undefined' ? localStorage.getItem('controltec_company_logo') || '' : ''),
    },
  });

  const handleGenerateRecibo = () => {
    if (!selectedEstimate) return;
    setDocModalVisible(false);
    setTimeout(() => generateRecibo(buildDocData(selectedEstimate)), 200);
  };

  const handleGenerateNota = () => {
    if (!selectedEstimate) return;
    setDocModalVisible(false);
    setTimeout(() => generateNotaServico(buildDocData(selectedEstimate)), 200);
  };

  const filtered = estimates.filter(e =>
    (e.customer?.name?.toLowerCase().includes(search.toLowerCase())) ||
    (e.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    if (status === 'Aprovado') return '#10B981';
    if (status === 'Recusado') return '#EF4444';
    return '#F59E0B';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isCompact ? styles.headerCompact : undefined]}>
        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleBlock : undefined]}>Orçamentos</Text>
        <TouchableOpacity
          style={[styles.addButton, isCompact ? styles.addButtonBlock : undefined]}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus color={Theme.colors.textInverse} size={20} />
          <Text style={styles.addButtonText}>Novo Orçamento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.searchBar}>
          <Search color={Theme.colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por cliente ou descrição..."
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
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Cliente / Descrição</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total</Text>
                <Text style={[styles.tableHeaderText, { width: 120, textAlign: 'center' }]}>Ações</Text>
              </View>
            )}

            {filtered.map((item) => (
              useTableLayout ? (
                // Desktop table row
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.itemName}>{item.customer?.name}</Text>
                    <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.priceText, { flex: 1 }]}>
                    R$ {(item.total || 0).toFixed(2)}
                  </Text>
                  <View style={{ width: 120, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openDocModal(item)}>
                      <FileText size={16} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                      <Edit2 size={16} color={Theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                      <Trash2 size={16} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Mobile card
                <View key={item.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.customer?.name}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.mobileCardBody}>
                    <Text style={styles.priceText}>R$ {(item.total || 0).toFixed(2)}</Text>
                    <View style={styles.mobileActions}>
                      <TouchableOpacity style={[styles.docButton]} onPress={() => openDocModal(item)}>
                        <FileText size={14} color="#FFF" />
                        <Text style={styles.docButtonText}>Gerar Doc</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEdit(item)}>
                        <Edit2 size={18} color={Theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Trash2 size={18} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            ))}

            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Nenhum orçamento encontrado.</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Modal: Escolher Tipo de Documento ── */}
      <Modal visible={docModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Documento</Text>
              <TouchableOpacity onPress={() => setDocModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: Theme.spacing.lg }}>
              {selectedEstimate && (
                <View style={styles.docInfoBox}>
                  <Text style={styles.docInfoClient}>{selectedEstimate.customer?.name}</Text>
                  <Text style={styles.docInfoDesc} numberOfLines={2}>{selectedEstimate.description}</Text>
                  <Text style={styles.docInfoTotal}>
                    Total: R$ {(selectedEstimate.totalValue || 0).toFixed(2)}
                  </Text>
                </View>
              )}

              <Text style={styles.docChooseLabel}>Escolha o tipo de documento:</Text>

              <TouchableOpacity style={styles.docOptionBtn} onPress={handleGenerateRecibo}>
                <View style={[styles.docOptionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Receipt size={26} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docOptionTitle}>🧾 Recibo de Pagamento</Text>
                  <Text style={styles.docOptionDesc}>
                    Comprova o pagamento pelos serviços prestados. Contém assinatura de ambas as partes.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.docOptionBtn} onPress={handleGenerateNota}>
                <View style={[styles.docOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <ClipboardList size={26} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docOptionTitle}>📋 Nota de Serviço</Text>
                  <Text style={styles.docOptionDesc}>
                    Descreve detalhadamente os serviços executados. Ideal para garantia e controle.
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.docHint}>
                <Text style={styles.docHintText}>
                  💡 O documento abre em nova janela. Use <Text style={{ fontWeight: 'bold' }}>{"\"Salvar como PDF\""}</Text> no menu de impressão ou compartilhe diretamente via <Text style={{ color: '#25D366', fontWeight: 'bold' }}>WhatsApp</Text>.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Criar/Editar Orçamento ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 620 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formData.id ? 'Editar Orçamento' : 'Novo Orçamento'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              {/* Cliente */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.selectWrapper}>
                  <select
                    style={styles.htmlSelect as any}
                    value={formData.customerId}
                    onChange={handleCustomerChange}
                    onInput={handleCustomerChange}
                  >
                    <option value="">-- Selecione um cliente --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </View>
                {!formData.customerId && (
                  <Text style={{ fontSize: 11, color: Theme.colors.error, marginTop: 2 }}>Selecione um cliente para continuar</Text>
                )}
              </View>

              {/* Descrição */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição Geral</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Descreva os serviços a serem realizados..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.description}
                  onChangeText={v => updateFormData({ description: v })}
                />
              </View>

              {/* ── Seção: Itens do Estoque ── */}
              <View style={styles.sectionDivider}>
                <View style={styles.sectionDividerLine} />
                <View style={styles.sectionDividerBadge}>
                  <Package size={14} color="#6366F1" />
                  <Text style={styles.sectionDividerText}>Itens / Produtos</Text>
                </View>
                <View style={styles.sectionDividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adicionar Itens do Estoque</Text>
                <View style={styles.productSearchBar}>
                  <Search color={Theme.colors.textSecondary} size={16} />
                  <TextInput
                    style={styles.productSearchInput}
                    placeholder="Buscar produto ou peça..."
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={productSearch}
                    onChangeText={setProductSearch}
                  />
                </View>
                {inventory.length === 0 ? (
                  <View style={styles.emptyProductsBox}>
                    <ShoppingBag size={24} color={Theme.colors.textSecondary} />
                    <Text style={{ color: Theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                      Nenhum produto cadastrado no estoque.
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.productListScroll} nestedScrollEnabled>
                    {productSearch.trim() === '' ? (
                      <Text style={{ color: Theme.colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                        Digite o nome na barra de pesquisa para buscar itens.
                      </Text>
                    ) : (
                      <>
                        {filteredProducts.map((prod: any) => {
                          const inCart = cartItems.find(i => i.productId === prod.id);
                          return (
                            <TouchableOpacity
                              key={prod.id}
                              style={[styles.productItem, inCart && styles.productItemInCart]}
                              onPress={() => addToCart(prod)}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={styles.productName}>{prod.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={styles.productPrice}>{formatCurrency(prod.sellPrice || prod.price || 0)}</Text>
                                  {prod.category ? (
                                    <View style={styles.productCategoryBadge}>
                                      <Text style={styles.productCategoryText}>{prod.category}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                              {inCart ? (
                                <View style={styles.inCartBadge}>
                                  <Text style={styles.inCartBadgeText}>{inCart.qty}x</Text>
                                </View>
                              ) : (
                                <View style={styles.addProductBtn}>
                                  <Plus size={16} color="#FFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <Text style={{ color: Theme.colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                            Nenhum produto encontrado.
                          </Text>
                        )}
                      </>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* ── Carrinho de itens selecionados ── */}
              {cartItems.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Itens do Orçamento ({cartItems.length})</Text>
                  <View style={styles.cartContainer}>
                    {cartItems.map((item) => (
                      <View key={item.productId} style={styles.cartItemCard}>
                        {/* Linha 1: Nome + Remover */}
                        <View style={styles.cartItemHeader}>
                          <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                          <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={styles.cartRemoveBtn}>
                            <Trash2 size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>

                        {/* Linha 2: Preço unit + Qty controls */}
                        <View style={styles.cartItemRow}>
                          <Text style={styles.cartItemUnitPrice}>
                            {formatCurrency(item.price)} /un
                          </Text>
                          <View style={styles.qtyControls}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateCartItemQty(item.productId, -1)}
                            >
                              <Minus size={14} color={Theme.colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{item.qty}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateCartItemQty(item.productId, 1)}
                            >
                              <Plus size={14} color={Theme.colors.textPrimary} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Linha 3: Desconto individual */}
                        <View style={styles.cartItemDiscountRow}>
                          <Text style={styles.cartItemDiscountLabel}>Desconto:</Text>
                          <View style={styles.discountTypeToggle}>
                            <TouchableOpacity
                              style={[
                                styles.discountTypeBtn,
                                item.discountType === 'value' && styles.discountTypeBtnActive
                              ]}
                              onPress={() => updateCartItemDiscount(item.productId, 'value', item.discountValue)}
                            >
                              <Text style={[
                                styles.discountTypeBtnText,
                                item.discountType === 'value' && styles.discountTypeBtnTextActive
                              ]}>R$</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.discountTypeBtn,
                                item.discountType === 'percent' && styles.discountTypeBtnActive
                              ]}
                              onPress={() => updateCartItemDiscount(item.productId, 'percent', item.discountValue)}
                            >
                              <Text style={[
                                styles.discountTypeBtnText,
                                item.discountType === 'percent' && styles.discountTypeBtnTextActive
                              ]}>%</Text>
                            </TouchableOpacity>
                          </View>
                          <TextInput
                            style={styles.discountInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={Theme.colors.textSecondary}
                            value={item.discountValue > 0 ? String(item.discountValue) : ''}
                            onChangeText={v => updateCartItemDiscount(
                              item.productId,
                              item.discountType,
                              parseFloat(v) || 0
                            )}
                          />
                        </View>

                        {/* Linha 4: Subtotal do item */}
                        <View style={styles.cartItemSubtotalRow}>
                          {getItemDiscountAmount(item) > 0 && (
                            <Text style={styles.cartItemDiscountInfo}>
                              -{formatCurrency(getItemDiscountAmount(item))}
                            </Text>
                          )}
                          <Text style={styles.cartItemSubtotal}>
                            {formatCurrency(getItemSubtotal(item))}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Desconto Global ── */}
              {cartItems.length > 0 && (
                <View style={styles.inputGroup}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.sectionDividerLine} />
                    <View style={[styles.sectionDividerBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Percent size={14} color="#D97706" />
                      <Text style={[styles.sectionDividerText, { color: '#D97706' }]}>Desconto Geral</Text>
                    </View>
                    <View style={styles.sectionDividerLine} />
                  </View>

                  <View style={styles.globalDiscountContainer}>
                    <View style={styles.globalDiscountRow}>
                      <View style={styles.discountTypeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.discountTypeBtn,
                            globalDiscountType === 'value' && styles.discountTypeBtnActive
                          ]}
                          onPress={() => setGlobalDiscountType('value')}
                        >
                          <Text style={[
                            styles.discountTypeBtnText,
                            globalDiscountType === 'value' && styles.discountTypeBtnTextActive
                          ]}>R$</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.discountTypeBtn,
                            globalDiscountType === 'percent' && styles.discountTypeBtnActive
                          ]}
                          onPress={() => setGlobalDiscountType('percent')}
                        >
                          <Text style={[
                            styles.discountTypeBtnText,
                            globalDiscountType === 'percent' && styles.discountTypeBtnTextActive
                          ]}>%</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        keyboardType="numeric"
                        placeholder="Valor do desconto geral"
                        placeholderTextColor={Theme.colors.textSecondary}
                        value={globalDiscountValue !== '0' ? globalDiscountValue : ''}
                        onChangeText={setGlobalDiscountValue}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ── Resumo de Valores ── */}
              {cartItems.length > 0 && (
                <View style={styles.totalSummaryBox}>
                  <View style={styles.totalSummaryRow}>
                    <Text style={styles.totalSummaryLabel}>Subtotal dos itens</Text>
                    <Text style={styles.totalSummaryValue}>{formatCurrency(cartSubtotal)}</Text>
                  </View>
                  {globalDiscountAmount > 0 && (
                    <View style={styles.totalSummaryRow}>
                      <Text style={[styles.totalSummaryLabel, { color: '#EF4444' }]}>
                        Desconto geral ({globalDiscountType === 'percent' ? `${globalDiscountValue}%` : 'R$'})
                      </Text>
                      <Text style={[styles.totalSummaryValue, { color: '#EF4444' }]}>
                        -{formatCurrency(globalDiscountAmount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalSummaryDivider} />
                  <View style={styles.totalSummaryRow}>
                    <Text style={styles.totalSummaryLabelBold}>TOTAL</Text>
                    <Text style={styles.totalSummaryValueBold}>{formatCurrency(cartTotal)}</Text>
                  </View>
                </View>
              )}

              {/* Observações */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações / Laudos Técnicos</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Observações adicionais, peças usadas, garantia..."
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.notes}
                  onChangeText={v => updateFormData({ notes: v })}
                />
              </View>

              {/* Status + Validade */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={formData.status}
                      onChange={(e: any) => updateFormData({ status: e.target.value })}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Recusado">Recusado</option>
                    </select>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Período de Garantia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 90 dias, sem garantia, 1 ano"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.warranty}
                  onChangeText={v => updateFormData({ warranty: v })}
                />
                <View style={styles.shortcutRow}>
                  {['Sem garantia', '30 dias', '90 dias', '180 dias', '1 ano'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.shortcutPill,
                        formData.warranty === period && styles.shortcutPillActive
                      ]}
                      onPress={() => updateFormData({ warranty: period })}
                    >
                      <Text style={[
                        styles.shortcutPillText,
                        formData.warranty === period && styles.shortcutPillTextActive
                      ]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Válido Até (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={formData.validUntil}
                  onChangeText={v => updateFormData({ validUntil: v })}
                />
              </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saveLoading}>
                {saveLoading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.saveButtonText}>
                      Salvar {cartItems.length > 0 ? `• ${formatCurrency(cartTotal)}` : ''}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  card: { flex: 1, minHeight: 0, minWidth: 0, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.lg, height: 44 },
  searchInput: { flex: 1, marginLeft: Theme.spacing.sm, fontSize: 15, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  listContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, marginBottom: Theme.spacing.sm },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.inputBackground, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  itemSub: { fontSize: 13, color: Theme.colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  priceText: { fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary },
  emptyText: { textAlign: 'center', marginTop: Theme.spacing.xl, color: Theme.colors.textSecondary, fontSize: 16 },
  actionBtn: { padding: 6, borderRadius: 6, backgroundColor: Theme.colors.inputBackground },
  mobileCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  mobileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  mobileCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  mobileActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#6366F1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  docButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  // Document Modal
  docInfoBox: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, borderLeftWidth: 4, borderLeftColor: Theme.colors.accent },
  docInfoClient: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary },
  docInfoDesc: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  docInfoTotal: { fontSize: 15, fontWeight: '700', color: Theme.colors.primary, marginTop: 6 },
  docChooseLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: Theme.spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  docOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, padding: Theme.spacing.md, borderRadius: Theme.borderRadius.md, borderWidth: 1.5, borderColor: Theme.colors.border, marginBottom: Theme.spacing.md, backgroundColor: Theme.colors.surface },
  docOptionIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docOptionTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 4 },
  docOptionDesc: { fontSize: 13, color: Theme.colors.textSecondary, lineHeight: 18 },
  docHint: { backgroundColor: '#FFFBEB', borderRadius: Theme.borderRadius.sm, padding: Theme.spacing.md, borderWidth: 1, borderColor: '#FDE68A', marginTop: Theme.spacing.sm },
  docHintText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  // Edit/Create Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Theme.spacing.lg },
  modalContent: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, width: '100%', maxWidth: 500, maxHeight: '90%' },
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
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  cancelButton: { paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.lg },
  cancelButtonText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: '600' },
  saveButton: { backgroundColor: Theme.colors.primary, paddingVertical: Theme.spacing.sm, paddingHorizontal: Theme.spacing.xl, borderRadius: Theme.borderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  shortcutPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border },
  shortcutPillActive: { backgroundColor: Theme.colors.accent, borderColor: Theme.colors.accent },
  shortcutPillText: { fontSize: 13, color: Theme.colors.textSecondary },
  shortcutPillTextActive: { color: Theme.colors.textInverse, fontWeight: '600' },

  // ── Section Dividers ──
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: Theme.spacing.md, gap: 8 },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  sectionDividerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sectionDividerText: { fontSize: 12, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Product Search & List ──
  productSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.sm, paddingHorizontal: 10, height: 38, marginBottom: 8 },
  productSearchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: Theme.colors.textPrimary, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  productListScroll: { maxHeight: 180 },
  emptyProductsBox: { alignItems: 'center', paddingVertical: 20, backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, borderWidth: 1, borderColor: Theme.colors.border },
  productItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: 10, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 6 },
  productItemInCart: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  productName: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  productPrice: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '500' },
  productCategoryBadge: { backgroundColor: Theme.colors.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  productCategoryText: { fontSize: 10, color: Theme.colors.textSecondary, fontWeight: '600' },
  addProductBtn: { backgroundColor: Theme.colors.accent, borderRadius: 20, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  inCartBadge: { backgroundColor: '#6366F1', borderRadius: 20, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  inCartBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // ── Cart Items ──
  cartContainer: { gap: 8 },
  cartItemCard: { backgroundColor: Theme.colors.inputBackground, borderRadius: Theme.borderRadius.sm, padding: 12, borderWidth: 1, borderColor: Theme.colors.border },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cartItemName: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary, flex: 1 },
  cartRemoveBtn: { padding: 4 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartItemUnitPrice: { fontSize: 13, color: Theme.colors.textSecondary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary, minWidth: 36, textAlign: 'center' },
  cartItemDiscountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cartItemDiscountLabel: { fontSize: 12, color: Theme.colors.textSecondary, fontWeight: '600' },
  discountTypeToggle: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border },
  discountTypeBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Theme.colors.surface },
  discountTypeBtnActive: { backgroundColor: '#6366F1' },
  discountTypeBtnText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  discountTypeBtnTextActive: { color: '#FFF' },
  discountInput: { height: 32, width: 70, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 6, paddingHorizontal: 8, fontSize: 14, color: Theme.colors.textPrimary, textAlign: 'center', ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  cartItemSubtotalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  cartItemDiscountInfo: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  cartItemSubtotal: { fontSize: 15, fontWeight: '800', color: '#10B981' },

  // ── Global Discount ──
  globalDiscountContainer: { marginTop: 4 },
  globalDiscountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // ── Total Summary ──
  totalSummaryBox: { backgroundColor: '#F8FAFC', borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, borderWidth: 1.5, borderColor: Theme.colors.border, marginBottom: Theme.spacing.md },
  totalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  totalSummaryLabel: { fontSize: 14, color: Theme.colors.textSecondary },
  totalSummaryValue: { fontSize: 14, color: Theme.colors.textPrimary, fontWeight: '600' },
  totalSummaryDivider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 6 },
  totalSummaryLabelBold: { fontSize: 17, fontWeight: '900', color: Theme.colors.textPrimary },
  totalSummaryValueBold: { fontSize: 19, fontWeight: '900', color: '#10B981' },
>>>>>>> origin/master
});

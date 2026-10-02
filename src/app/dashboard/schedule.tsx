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
  Alert
} from 'react-native';
import { Theme } from '../../ui/themes';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  CalendarDays, 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  X, 
  Edit2, 
  Trash2,
  Lock,
  ChevronDown,
  Briefcase,
  Check
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useBreakpoints } from '../../ui/useBreakpoints';

const MONTH_NAMES_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DAYS_MATCH_MAP = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

// Retorna os 5 dias úteis (Segunda a Sexta) a partir de uma data de referência
const getWorkWeekDays = (baseDate: Date) => {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));

  const week = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    week.push(dayDate);
  }
  return week;
};

// Formata intervalo da semana: "31 ago – 4 set 2026"
const formatWeekRange = (weekDays: Date[]) => {
  if (weekDays.length === 0) return '';
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const firstMonth = MONTH_NAMES_SHORT[first.getMonth()];
  const lastMonth = MONTH_NAMES_SHORT[last.getMonth()];
  
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${firstMonth} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${firstMonth} – ${last.getDate()} ${lastMonth} ${last.getFullYear()}`;
};

// Obtém o nome por extenso do dia da semana a partir de string YYYY-MM-DD
const getDayOfWeekFromDate = (dateStr: string) => {
  if (!dateStr) return 'Segunda-feira';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return DAYS_MATCH_MAP[d.getDay()] || 'Segunda-feira';
  }
  return 'Segunda-feira';
};

export default function ScheduleScreen() {
  const { isCompact } = useBreakpoints();
  
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'semana' | 'agenda'>('semana');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Clientes da base (autocomplete)
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Estado para Visita Fixa / Contrato Semanal no Modal
  const [isFixedVisit, setIsFixedVisit] = useState(false);

  // Controle de Data/Semana
  const [currentBaseDate, setCurrentBaseDate] = useState(new Date());
  const weekDays = getWorkWeekDays(currentBaseDate);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(weekDays[0] || new Date());

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    clientPhone: '',
    address: '',
    service: '',
    technician: '',
    date: '',
    time: '',
    duration: '30m',
    status: 'Confirmado',
    priority: 'Normal'
  });

  // Visitas state
  const [visits, setVisits] = useState<any[]>([]);
  const [visitsModalVisible, setVisitsModalVisible] = useState(false);
  const [visitFormVisible, setVisitFormVisible] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitFormData, setVisitFormData] = useState({
    id: '',
    clientName: '',
    address: '',
    time: '',
    serviceDone: ''
  });

  // Fixed Visits state
  const [fixedVisits, setFixedVisits] = useState<any[]>([]);
  const [fixedVisitsViewActive, setFixedVisitsViewActive] = useState(false);
  const [fixedVisitFormVisible, setFixedVisitFormVisible] = useState(false);
  const [fixedVisitLoading, setFixedVisitLoading] = useState(false);
  const [fixedVisitFormData, setFixedVisitFormData] = useState({
    id: '',
    clientName: '',
    address: '',
    dayOfWeek: 'Segunda-feira',
    time: '',
    notes: ''
  });
  // Data do dia clicado ao abrir form de visita fixa (para marcar como realizada)
  const [selectedFixedVisitDate, setSelectedFixedVisitDate] = useState<Date | null>(null);

  const fetchCustomers = async () => {
    try {
      const data = await api.getAll('customers');
      setCustomers(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchFixedVisits = async () => {
    try {
      setFixedVisitLoading(true);
      const data = await api.getFixedVisits();
      setFixedVisits(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setFixedVisitLoading(false);
    }
  };

  const handleSaveFixedVisit = async () => {
    if (!fixedVisitFormData.clientName) return alert('Nome do cliente/empresa é obrigatório');
    try {
      if (fixedVisitFormData.id) {
        await api.updateFixedVisit(fixedVisitFormData.id, fixedVisitFormData);
      } else {
        const { id, ...data } = fixedVisitFormData;
        await api.createFixedVisit(data);
      }
      setFixedVisitFormVisible(false);
      fetchFixedVisits();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteFixedVisit = async (id: string) => {
    const performDelete = async () => {
      try {
        await api.deleteFixedVisit(id);
        fetchFixedVisits();
      } catch (e: any) {
        alert(e.message);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja excluir este registro de visita fixa?')) performDelete();
    } else {
      Alert.alert('Excluir', 'Deseja excluir esta visita fixa?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  // Marca visita fixa como realizada na semana atual: cria um agendamento com status Concluído
  const handleMarkFixedVisitDone = async (fv: any, dayDate: Date) => {
    try {
      const dateKey = formatDateKey(dayDate);
      await api.create('schedules', {
        clientName: fv.clientName,
        address: fv.address || '',
        date: dateKey,
        time: fv.time || '09:00',
        duration: '',
        service: fv.notes || 'Visita de Rotina',
        status: 'Concluído',
        priority: 'Normal',
        technician: '',
        notes: `Visita fixa realizada em ${dateKey}`
      });
      fetchData();
    } catch (error: any) {
      alert('Erro ao marcar visita como realizada: ' + error.message);
    }
  };

  const fetchVisits = async () => {
    try {
      setVisitLoading(true);
      const data = await api.getAll('visits');
      setVisits(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setVisitLoading(false);
    }
  };

  useEffect(() => {
    if (visitsModalVisible) {
      fetchVisits();
      fetchFixedVisits();
    }
  }, [visitsModalVisible]);

  const handleSaveVisit = async () => {
    if (!visitFormData.clientName) return alert('Nome do cliente/empresa é obrigatório');
    try {
      if (visitFormData.id) {
        await api.update('visits', visitFormData.id, visitFormData);
      } else {
        const { id, ...data } = visitFormData;
        await api.create('visits', data);
      }
      setVisitFormVisible(false);
      fetchVisits();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteVisit = async (id: string) => {
    const performDelete = async () => {
      try {
        await api.remove('visits', id);
        fetchVisits();
      } catch (e: any) {
        alert(e.message);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja excluir este registro de visita?')) performDelete();
    } else {
      Alert.alert('Excluir', 'Deseja excluir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAll('schedules');
      setSchedules(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFixedVisits();
    fetchCustomers();
  }, []);

  const handleSave = async () => {
    if (!formData.clientName || !formData.date) return alert('Cliente e Data são obrigatórios');
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Se a caixa "Visita Fixa" estiver marcada, cadastra também como visita fixa recorrente
      if (isFixedVisit) {
        const dayOfWeek = getDayOfWeekFromDate(formData.date);
        await api.createFixedVisit({
          clientName: formData.clientName,
          address: formData.address || '',
          dayOfWeek: dayOfWeek,
          time: formData.time || '09:00',
          notes: formData.service ? `Serviço: ${formData.service}` : 'Contrato Semanal'
        });
      }

      if (formData.id) {
        await api.update('schedules', formData.id, formData);
      } else {
        const { id, ...data } = formData;
        await api.create('schedules', data);
      }

      setShowCustomerDropdown(false);
      setModalVisible(false);
      fetchData();
      fetchFixedVisits();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    const performDelete = async () => {
      try {
        await api.remove('schedules', id);
        fetchData();
      } catch (e: any) {
        alert(e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja excluir este agendamento?')) performDelete();
    } else {
      Alert.alert('Excluir', 'Tem certeza que deseja excluir?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  // Navegação de Semanas
  const handlePrevWeek = () => {
    const prev = new Date(currentBaseDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentBaseDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentBaseDate);
    next.setDate(next.getDate() + 7);
    setCurrentBaseDate(next);
  };

  // Filtragem geral por termo de busca
  const filterMatches = (s: any) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (s.clientName && s.clientName.toLowerCase().includes(term)) ||
      (s.clientPhone && s.clientPhone.toLowerCase().includes(term)) ||
      (s.service && s.service.toLowerCase().includes(term)) ||
      (s.technician && s.technician.toLowerCase().includes(term))
    );
  };

  const filteredSchedules = schedules.filter(filterMatches);

  // Formata data ISO para string YYYY-MM-DD local
  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Abre modal de criação para determinado dia e hora
  const handleOpenNewForSlot = (dateObj: Date, slotTime?: string) => {
    setIsFixedVisit(false);
    setShowCustomerDropdown(false);
    setFormData({
      id: '',
      clientName: '',
      clientPhone: '',
      address: '',
      service: '',
      technician: '',
      date: formatDateKey(dateObj),
      time: slotTime || '09:00',
      duration: '30m',
      status: 'Confirmado',
      priority: 'Normal'
    });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header / Barra de Busca ── */}
      <View style={styles.topHeader}>
        <View style={styles.searchSection}>
          <Text style={styles.inputLabel}>Busca</Text>
          <View style={styles.searchInputWrapper}>
            <Search color={Theme.colors.textSecondary} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nome ou telefone do cliente"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Botão Bloqueios / Visitas */}
          <TouchableOpacity 
            style={styles.bloqueiosButton}
            onPress={() => {
              setVisitFormVisible(false);
              setFixedVisitFormVisible(false);
              setSelectedFixedVisitDate(null);
              setVisitsModalVisible(true);
            }}
          >
            <Lock size={16} color={Theme.colors.primary} />
            <Text style={styles.bloqueiosButtonText}>Bloqueios</Text>
          </TouchableOpacity>

          {/* Botão Novo Agendamento */}
          <TouchableOpacity 
            style={styles.novaConsultaButton}
            onPress={() => handleOpenNewForSlot(selectedDayDate || new Date())}
          >
            <CalendarDays size={16} color="#FFFFFF" />
            <Text style={styles.novaConsultaButtonText}>Novo Agendamento</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sub Header / Controle da Semana & Alternador de Visão ── */}
      <View style={styles.subHeader}>
        <View style={styles.weekNavGroup}>
          <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevWeek}>
            <ChevronLeft size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.weekRangeText}>{formatWeekRange(weekDays)}</Text>
          <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextWeek}>
            <ChevronRight size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewModeToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'semana' && styles.toggleBtnActive]}
            onPress={() => setViewMode('semana')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'semana' && styles.toggleBtnTextActive]}>Semana</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'agenda' && styles.toggleBtnActive]}
            onPress={() => setViewMode('agenda')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'agenda' && styles.toggleBtnTextActive]}>Agenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Conteúdo Principal: Grade Semanal ou Agenda Lista ── */}
      {viewMode === 'semana' ? (
        <View style={styles.gridContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ flex: 1, minWidth: 800 }}>
              {/* Cabeçalho dos Dias da Semana */}
              <View style={styles.gridHeaderRow}>
                <View style={styles.timeColumnHeader}>
                  <Text style={styles.timeHeaderLabel}>Horário</Text>
                </View>
                {weekDays.map((dayDate, index) => {
                  const dayNum = dayDate.getDate();
                  const weekdayName = WEEKDAYS_FULL[dayDate.getDay()];
                  const isToday = formatDateKey(dayDate) === formatDateKey(new Date());

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.dayHeaderCell, isToday && styles.dayHeaderCellActive]}
                      onPress={() => setSelectedDayDate(dayDate)}
                    >
                      <Text style={[styles.dayHeaderText, isToday && styles.dayHeaderTextActive]}>
                        <Text style={{ fontWeight: 'bold' }}>{dayNum}</Text> {weekdayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Corpo da Grade de Horários */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
                {loading ? (
                  <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 40 }} />
                ) : (
                  TIME_SLOTS.map((slotTime) => (
                    <View key={slotTime} style={styles.gridRow}>
                      {/* Coluna da Hora */}
                      <View style={styles.timeCell}>
                        <Text style={styles.timeCellText}>{slotTime}</Text>
                      </View>

                      {/* Células para cada Dia */}
                      {weekDays.map((dayDate, dayIdx) => {
                        const dateKey = formatDateKey(dayDate);
                        const dayOfWeekName = DAYS_MATCH_MAP[dayDate.getDay()];

                        // 1. Busca agendamentos normais para esse dia e horário
                        const slotSchedules = filteredSchedules.filter(s => {
                          if (!s.date) return false;
                          const sDateKey = s.date.split('T')[0];
                          if (sDateKey !== dateKey) return false;
                          
                          if (s.time) {
                            const cleanTime = s.time.trim();
                            return cleanTime === slotTime || cleanTime.startsWith(slotTime.substring(0, 4));
                          }
                          return false;
                        });

                        // 2. Agendamentos deste dia (todos os horários) para checar duplicatas
                        const daySchedulesAll = filteredSchedules.filter(s => {
                          if (!s.date) return false;
                          return s.date.split('T')[0] === dateKey;
                        });

                        // 2. Busca visitas fixas recorrentes para este dia da semana e horário
                        //    Exclui se já existe agendamento normal para o mesmo cliente neste dia
                        const slotFixedVisits = fixedVisits.filter(fv => {
                          if (!fv.clientName) return false;
                          if (search.trim() && !fv.clientName.toLowerCase().includes(search.toLowerCase())) {
                            return false;
                          }
                          const fvDay = fv.dayOfWeek || 'Segunda-feira';
                          const isSameDay = fvDay.toLowerCase().startsWith(dayOfWeekName.substring(0, 3).toLowerCase());
                          if (!isSameDay) return false;

                          // Não exibe se já há agendamento para este cliente hoje
                          const alreadyScheduled = daySchedulesAll.some(
                            s => s.clientName?.toLowerCase() === fv.clientName?.toLowerCase()
                          );
                          if (alreadyScheduled) return false;

                          if (fv.time) {
                            const cleanTime = fv.time.trim();
                            return cleanTime === slotTime || cleanTime.startsWith(slotTime.substring(0, 4));
                          }
                          return false;
                        });

                        // Verifica quais visitas fixas já foram marcadas como concluídas hoje
                        const completedFixedIds = new Set(
                          daySchedulesAll
                            .filter(s => s.status === 'Concluído')
                            .map(s => s.clientName?.toLowerCase())
                        );

                        return (
                          <TouchableOpacity
                            key={dayIdx}
                            style={styles.gridSlotCell}
                            activeOpacity={0.8}
                            onPress={() => handleOpenNewForSlot(dayDate, slotTime)}
                          >
                            {/* Renderiza Agendamentos Normais */}
                            {slotSchedules.map((item) => {
                              const isDoneOrCancelled = item.status === 'Concluído' || item.status === 'Cancelado';
                              return (
                                <TouchableOpacity
                                  key={item.id}
                                  style={[
                                    styles.appointmentCard,
                                    isDoneOrCancelled && styles.appointmentCardDone
                                  ]}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    const formattedDate = item.date ? item.date.split('T')[0] : '';
                                    setIsFixedVisit(false);
                                    setShowCustomerDropdown(false);
                                    setFormData({ ...item, date: formattedDate });
                                    setModalVisible(true);
                                  }}
                                >
                                  <Text 
                                    style={[
                                      styles.cardClientName,
                                      isDoneOrCancelled && styles.cardTextStrikethrough
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {item.clientName}
                                  </Text>
                                  
                                  <View style={styles.cardMetaRow}>
                                    <Clock size={11} color="rgba(255,255,255,0.85)" />
                                    <Text style={styles.cardMetaText}>{item.time || slotTime}</Text>
                                    
                                    {item.technician ? (
                                      <>
                                        <User size={11} color="rgba(255,255,255,0.85)" style={{ marginLeft: 4 }} />
                                        <Text style={styles.cardMetaText} numberOfLines={1}>{item.technician}</Text>
                                      </>
                                    ) : null}
                                  </View>

                                  {item.service ? (
                                    <View style={styles.cardMetaRow}>
                                      <Briefcase size={11} color="rgba(255,255,255,0.85)" />
                                      <Text style={styles.cardMetaText} numberOfLines={1}>{item.service}</Text>
                                    </View>
                                  ) : null}
                                </TouchableOpacity>
                              );
                            })}

                            {/* Renderiza Visitas Fixas Recorrentes */}
                            {slotFixedVisits.map((fv) => {
                              const isDoneThisWeek = completedFixedIds.has(fv.clientName?.toLowerCase());
                              return (
                                <TouchableOpacity
                                  key={`fv-${fv.id}`}
                                  style={[
                                    styles.appointmentCard,
                                    isDoneThisWeek ? styles.appointmentCardFixedDone : styles.appointmentCardFixed
                                  ]}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    setFixedVisitFormData({
                                      id: fv.id,
                                      clientName: fv.clientName,
                                      address: fv.address || '',
                                      dayOfWeek: fv.dayOfWeek || 'Segunda-feira',
                                      time: fv.time || '',
                                      notes: fv.notes || ''
                                    });
                                    setSelectedFixedVisitDate(dayDate);
                                    setFixedVisitFormVisible(true);
                                    setVisitsModalVisible(true);
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                                      <View style={styles.cardFixedBadgeWrapper}>
                                        <Text style={styles.cardFixedBadge}>
                                          {isDoneThisWeek ? '✅ REALIZADA' : '📌 FIXA'}
                                        </Text>
                                      </View>
                                      <Text style={[
                                        styles.cardClientName,
                                        isDoneThisWeek && { textDecorationLine: 'line-through', opacity: 0.7 }
                                      ]} numberOfLines={1}>{fv.clientName}</Text>
                                    </View>

                                    {/* Botão marcar como realizada */}
                                    {!isDoneThisWeek && (
                                      <TouchableOpacity
                                        style={styles.checkDoneBtn}
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleMarkFixedVisitDone(fv, dayDate);
                                        }}
                                      >
                                        <Check size={12} color="#FFF" />
                                      </TouchableOpacity>
                                    )}
                                  </View>

                                  <View style={styles.cardMetaRow}>
                                    <Clock size={11} color="rgba(255,255,255,0.85)" />
                                    <Text style={styles.cardMetaText}>{fv.time || slotTime}</Text>
                                  </View>

                                  {fv.notes ? (
                                    <View style={styles.cardMetaRow}>
                                      <Briefcase size={11} color="rgba(255,255,255,0.85)" />
                                      <Text style={styles.cardMetaText} numberOfLines={1}>{fv.notes}</Text>
                                    </View>
                                  ) : null}
                                </TouchableOpacity>
                              );
                            })}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* ── Visão em Lista (Agenda Mode) ── */
        <ScrollView style={styles.agendaContainer}>
          {weekDays.map((dayDate) => {
            const dateKey = formatDateKey(dayDate);
            const dayOfWeekName = DAYS_MATCH_MAP[dayDate.getDay()];
            const daySchedules = filteredSchedules.filter(s => s.date && s.date.split('T')[0] === dateKey);
            // Não exibe visita fixa se já há agendamento para o mesmo cliente neste dia
            const dayScheduledNames = new Set(
              daySchedules.map((s: any) => s.clientName?.toLowerCase())
            );
            const dayCompletedNames = new Set(
              daySchedules.filter(s => s.status === 'Concluído').map((s: any) => s.clientName?.toLowerCase())
            );
            const dayFixedVisits = fixedVisits.filter(fv =>
              fv.dayOfWeek &&
              fv.dayOfWeek.toLowerCase().startsWith(dayOfWeekName.substring(0, 3).toLowerCase()) &&
              !dayScheduledNames.has(fv.clientName?.toLowerCase())
            );

            return (
              <View key={dateKey} style={styles.agendaDayGroup}>
                <View style={styles.agendaDayHeader}>
                  <Text style={styles.agendaDayTitle}>
                    📅 {dayDate.getDate()} de {MONTH_NAMES_SHORT[dayDate.getMonth()]} ({WEEKDAYS_FULL[dayDate.getDay()]})
                  </Text>
                  <TouchableOpacity onPress={() => handleOpenNewForSlot(dayDate)}>
                    <Text style={styles.agendaAddBtn}>+ Agendar</Text>
                  </TouchableOpacity>
                </View>

                {daySchedules.length === 0 && dayFixedVisits.length === 0 ? (
                  <Text style={styles.emptyAgendaText}>Nenhum agendamento marcado.</Text>
                ) : (
                  <>
                    {/* Renderiza Visitas Fixas na Lista */}
                    {dayFixedVisits.map((fv) => {
                      const isDoneThisDay = dayCompletedNames.has(fv.clientName?.toLowerCase());
                      return (
                        <View
                          key={`agenda-fv-${fv.id}`}
                          style={[styles.agendaItemCard, {
                            borderLeftWidth: 4,
                            borderLeftColor: isDoneThisDay ? '#22C55E' : (Theme.colors.accent || '#FFB703')
                          }]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.cardFixedBadge, isDoneThisDay && { color: '#22C55E' }]}>
                                {isDoneThisDay ? '✅ REALIZADA' : '📌 VISITA FIXA / CONTRATO'}
                              </Text>
                              <Text style={[
                                styles.agendaClientName,
                                isDoneThisDay && { textDecorationLine: 'line-through', opacity: 0.6 }
                              ]}>{fv.clientName}</Text>
                            </View>
                            <Text style={styles.agendaMeta}>
                              🕒 {fv.time || '--:--'} {fv.address ? `• 📍 ${fv.address}` : ''}
                            </Text>
                            {fv.notes ? <Text style={styles.agendaMeta}>Obs: {fv.notes}</Text> : null}
                          </View>
                          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            {/* Botão marcar como realizada na view agenda */}
                            {!isDoneThisDay && (
                              <TouchableOpacity
                                style={[styles.checkDoneBtn, { width: 32, height: 32, borderRadius: 6 }]}
                                onPress={() => handleMarkFixedVisitDone(fv, dayDate)}
                              >
                                <Check size={16} color="#FFF" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => {
                              setFixedVisitFormData({
                                id: fv.id,
                                clientName: fv.clientName,
                                address: fv.address || '',
                                dayOfWeek: fv.dayOfWeek || 'Segunda-feira',
                                time: fv.time || '',
                                notes: fv.notes || ''
                              });
                              setSelectedFixedVisitDate(dayDate);
                              setFixedVisitFormVisible(true);
                              setVisitsModalVisible(true);
                            }}>
                              <Edit2 size={18} color={Theme.colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    {/* Renderiza Agendamentos Normais na Lista */}
                    {daySchedules.map((item) => (
                      <View key={item.id} style={[
                        styles.agendaItemCard,
                        item.status === 'Concluído' && { borderLeftWidth: 4, borderLeftColor: '#22C55E', opacity: 0.85 }
                      ]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            {item.status === 'Concluído' && (
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#22C55E' }}>✅ REALIZADO</Text>
                            )}
                            <Text style={[
                              styles.agendaClientName,
                              item.status === 'Concluído' && { textDecorationLine: 'line-through', opacity: 0.7 }
                            ]}>{item.clientName}</Text>
                          </View>
                          <Text style={styles.agendaMeta}>
                            🕒 {item.time || '--:--'} {item.duration ? `(${item.duration})` : ''} • 💼 {item.service}
                          </Text>
                          {item.technician ? (
                            <Text style={styles.agendaMeta}>👤 Técnico: {item.technician}</Text>
                          ) : null}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                          {item.status !== 'Concluído' && (
                            <TouchableOpacity
                              style={[styles.checkDoneBtn, { width: 32, height: 32, borderRadius: 6 }]}
                              onPress={async () => {
                                await api.update('schedules', item.id, { status: 'Concluído' });
                                fetchData();
                              }}
                            >
                              <Check size={16} color="#FFF" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => {
                            const formattedDate = item.date ? item.date.split('T')[0] : '';
                            setIsFixedVisit(false);
                            setShowCustomerDropdown(false);
                            setFormData({ ...item, date: formattedDate });
                            setModalVisible(true);
                          }}>
                            <Edit2 size={18} color={Theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color={Theme.colors.error || '#EF4444'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Modal: Novo / Editar Agendamento ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} nestedScrollEnabled>
              {/* Campo de Busca / Seleção de Cliente Salvo do Banco */}
              <View style={[styles.inputGroup, { zIndex: 100 }]}>
                <Text style={styles.label}>Cliente *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Busque ou digite o nome do cliente..." 
                  placeholderTextColor="#9CA3AF"
                  value={formData.clientName} 
                  onChangeText={v => {
                    setFormData({...formData, clientName: v});
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />

                {/* Dropdown Autocomplete com Clientes do Banco de Dados */}
                {showCustomerDropdown && formData.clientName.trim().length > 0 && (
                  <View style={styles.customerDropdownList}>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {customers
                        .filter(c => c.name && c.name.toLowerCase().includes(formData.clientName.toLowerCase()))
                        .slice(0, 8)
                        .map((cust) => (
                          <TouchableOpacity
                            key={cust.id || cust.name}
                            style={styles.customerDropdownItem}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                clientName: cust.name,
                                clientPhone: cust.phone || formData.clientPhone,
                                address: cust.address || formData.address
                              });
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <Text style={styles.customerDropdownName}>{cust.name}</Text>
                            {cust.phone ? <Text style={styles.customerDropdownMeta}>📞 {cust.phone}</Text> : null}
                            {cust.address ? <Text style={styles.customerDropdownMeta}>📍 {cust.address}</Text> : null}
                          </TouchableOpacity>
                        ))
                      }
                      {customers.filter(c => c.name && c.name.toLowerCase().includes(formData.clientName.toLowerCase())).length === 0 && (
                        <View style={{ padding: 10 }}>
                          <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                            Nenhum cliente cadastrado com esse nome. Você pode continuar digitando normalmente.
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="(00) 00000-0000" 
                  placeholderTextColor="#9CA3AF"
                  value={formData.clientPhone} 
                  onChangeText={v => setFormData({...formData, clientPhone: v})} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Serviço / Procedimento</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Biorressonância / Manutenção" 
                  placeholderTextColor="#9CA3AF"
                  value={formData.service} 
                  onChangeText={v => setFormData({...formData, service: v})} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Profissional / Técnico</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Nome do profissional" 
                  placeholderTextColor="#9CA3AF"
                  value={formData.technician} 
                  onChangeText={v => setFormData({...formData, technician: v})} 
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Data *</Text>
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="date"
                      style={styles.htmlInputDate as any}
                      value={formData.date}
                      onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Horário</Text>
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="time"
                      style={styles.htmlInputTime as any}
                      value={formData.time}
                      onChange={(e: any) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.selectWrapper}>
                  <select
                    style={styles.htmlSelect as any}
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </View>
              </View>

              {/* Caixa de seleção: Visita Fixa / Contrato Semanal */}
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setIsFixedVisit(!isFixedVisit)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, isFixedVisit && styles.checkboxChecked]}>
                  {isFixedVisit && <Check size={14} color="#FFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxLabel}>📌 Visita Fixa / Contrato Semanal</Text>
                  <Text style={styles.checkboxSubtext}>
                    Salva automaticamente este cliente como visita de rotina em todas as semanas
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              {/* Botão Excluir Agendamento — só aparece ao editar */}
              {formData.id && (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 'auto' }]}
                  onPress={() => {
                    handleDelete(formData.id);
                    setModalVisible(false);
                  }}
                  disabled={isSaving}
                >
                  <Trash2 size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Excluir</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={isSaving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              {/* Botão marcar como realizada — só aparece ao editar */}
              {formData.id && formData.status !== 'Concluído' && (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                  onPress={async () => {
                    setFormData(prev => ({ ...prev, status: 'Concluído' }));
                    await api.update('schedules', formData.id, { ...formData, status: 'Concluído' });
                    setModalVisible(false);
                    fetchData();
                  }}
                  disabled={isSaving}
                >
                  <Check size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Realizada</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Visitas Técnicas / Bloqueios ── */}
      <Modal visible={visitsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 550, maxHeight: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: Theme.colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.textPrimary }}>Visitas Técnicas / Bloqueios</Text>
              <TouchableOpacity onPress={() => setVisitsModalVisible(false)}>
                <X color={Theme.colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Alternador de abas (Tabs) */}
            {!visitFormVisible && !fixedVisitFormVisible && (
              <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4, marginTop: 10 }}>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    paddingVertical: 8, 
                    alignItems: 'center', 
                    borderRadius: 6,
                    backgroundColor: !fixedVisitsViewActive ? '#FFF' : 'transparent',
                  }}
                  onPress={() => setFixedVisitsViewActive(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: !fixedVisitsViewActive ? '#111827' : '#6B7280' }}>
                    Visitas Avulsas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ 
                    flex: 1, 
                    paddingVertical: 8, 
                    alignItems: 'center', 
                    borderRadius: 6,
                    backgroundColor: fixedVisitsViewActive ? '#FFF' : 'transparent',
                  }}
                  onPress={() => setFixedVisitsViewActive(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: fixedVisitsViewActive ? '#111827' : '#6B7280' }}>
                    Visitas Fixas (Rotina)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {visitFormVisible ? (
              /* Form Visitas Avulsas */
              <ScrollView style={{ paddingVertical: 15 }} nestedScrollEnabled>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary, marginBottom: 15 }}>
                  {visitFormData.id ? 'Editar Visita' : 'Registrar Nova Visita'}
                </Text>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Cliente / Empresa *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do cliente ou empresa"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={visitFormData.clientName}
                    onChangeText={v => setVisitFormData({ ...visitFormData, clientName: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Endereço</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Endereço da visita"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={visitFormData.address}
                    onChangeText={v => setVisitFormData({ ...visitFormData, address: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Data / Horário</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 22/06/2026 às 15:30"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={visitFormData.time}
                    onChangeText={v => setVisitFormData({ ...visitFormData, time: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Serviço Realizado</Text>
                  <TextInput
                    style={[styles.input, { height: 80, paddingTop: 10 }]}
                    multiline
                    placeholder="Descreva o serviço que foi realizado..."
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={visitFormData.serviceDone}
                    onChangeText={v => setVisitFormData({ ...visitFormData, serviceDone: v })}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15 }}>
                  <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20 }} onPress={() => setVisitFormVisible(false)}>
                    <Text style={{ color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveVisit}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : fixedVisitFormVisible ? (
              /* Form Visitas Fixas */
              <ScrollView style={{ paddingVertical: 15 }} nestedScrollEnabled>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: Theme.colors.textPrimary, marginBottom: 15 }}>
                  {fixedVisitFormData.id ? 'Editar Visita Fixa' : 'Registrar Nova Visita Fixa'}
                </Text>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Cliente / Empresa *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do cliente ou empresa"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={fixedVisitFormData.clientName}
                    onChangeText={v => setFixedVisitFormData({ ...fixedVisitFormData, clientName: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Endereço</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Endereço da visita"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={fixedVisitFormData.address}
                    onChangeText={v => setFixedVisitFormData({ ...fixedVisitFormData, address: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Dia da Semana *</Text>
                  <View style={styles.selectWrapper}>
                    <select
                      style={styles.htmlSelect as any}
                      value={fixedVisitFormData.dayOfWeek}
                      onChange={(e: any) => setFixedVisitFormData({ ...fixedVisitFormData, dayOfWeek: e.target.value })}
                    >
                      <option value="Segunda-feira">Segunda-feira</option>
                      <option value="Terça-feira">Terça-feira</option>
                      <option value="Quarta-feira">Quarta-feira</option>
                      <option value="Quinta-feira">Quinta-feira</option>
                      <option value="Sexta-feira">Sexta-feira</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </View>
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Horário Padrão</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 09:00"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={fixedVisitFormData.time}
                    onChangeText={v => setFixedVisitFormData({ ...fixedVisitFormData, time: v })}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 5 }}>Observações / Notas</Text>
                  <TextInput
                    style={[styles.input, { height: 80, paddingTop: 10 }]}
                    multiline
                    placeholder="Anotações extras sobre esta visita de rotina..."
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={fixedVisitFormData.notes}
                    onChangeText={v => setFixedVisitFormData({ ...fixedVisitFormData, notes: v })}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15, flexWrap: 'wrap', alignItems: 'center' }}>
                  {fixedVisitFormData.id && (
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 'auto' }]}
                      onPress={() => {
                        handleDeleteFixedVisit(fixedVisitFormData.id);
                        setFixedVisitFormVisible(false);
                      }}
                    >
                      <Trash2 size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Excluir</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 20 }} onPress={() => setFixedVisitFormVisible(false)}>
                    <Text style={{ color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 16 }}>Voltar</Text>
                  </TouchableOpacity>
                  {/* Marcar como Realizada na semana — só aparece se há data selecionada */}
                  {selectedFixedVisitDate && fixedVisitFormData.id && (
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: '#22C55E', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                      onPress={async () => {
                        await handleMarkFixedVisitDone(fixedVisitFormData, selectedFixedVisitDate);
                        setFixedVisitFormVisible(false);
                        setVisitsModalVisible(false);
                      }}
                    >
                      <Check size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Marcar Realizada</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveFixedVisit}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : !fixedVisitsViewActive ? (
              /* Lista Visitas Avulsas */
              <View style={{ flex: 1, paddingTop: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.textSecondary }}>
                    Visitas Registradas ({visits.length})
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#0F2A5A',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      gap: 4
                    }}
                    onPress={() => {
                      setVisitFormData({ id: '', clientName: '', address: '', time: '', serviceDone: '' });
                      setVisitFormVisible(true);
                    }}
                  >
                    <Plus size={14} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>Nova Visita</Text>
                  </TouchableOpacity>
                </View>

                {visitLoading ? (
                  <ActivityIndicator size="large" color="#0F2A5A" style={{ marginVertical: 30 }} />
                ) : (
                  <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                    {visits.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <CalendarDays size={32} color={Theme.colors.textSecondary} />
                        <Text style={{ color: Theme.colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                          Nenhuma visita cadastrada.
                        </Text>
                      </View>
                    ) : (
                      visits.map((visit) => (
                        <View
                          key={visit.id}
                          style={{
                            backgroundColor: Theme.colors.inputBackground,
                            borderRadius: Theme.borderRadius.sm,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: Theme.colors.border,
                            marginBottom: 8
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={{ fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary }}>
                                {visit.clientName}
                              </Text>
                              {visit.time ? (
                                <Text style={{ fontSize: 12, color: '#0F2A5A', fontWeight: '600', marginTop: 2 }}>
                                  🕒 {visit.time}
                                </Text>
                              ) : null}
                              {visit.address ? (
                                <Text style={{ fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4 }}>
                                  📍 {visit.address}
                                </Text>
                              ) : null}
                              {visit.serviceDone ? (
                                <View
                                  style={{
                                    backgroundColor: Theme.colors.surface,
                                    borderRadius: 4,
                                    padding: 8,
                                    marginTop: 8,
                                    borderLeftWidth: 3,
                                    borderLeftColor: '#0F2A5A'
                                  }}
                                >
                                  <Text style={{ fontSize: 13, color: Theme.colors.textPrimary, fontStyle: 'italic' }}>
                                    {visit.serviceDone}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  setVisitFormData({
                                    id: visit.id,
                                    clientName: visit.clientName,
                                    address: visit.address || '',
                                    time: visit.time || '',
                                    serviceDone: visit.serviceDone || ''
                                  });
                                  setVisitFormVisible(true);
                                }}
                              >
                                <Edit2 size={16} color={Theme.colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteVisit(visit.id)}>
                                <Trash2 size={16} color={Theme.colors.error || '#EF4444'} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}
              </View>
            ) : (
              /* Lista Visitas Fixas */
              <View style={{ flex: 1, paddingTop: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.textSecondary }}>
                    Visitas Fixas / Rotina ({fixedVisits.length})
                  </Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#0F2A5A',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      gap: 4
                    }}
                    onPress={() => {
                      setFixedVisitFormData({ id: '', clientName: '', address: '', dayOfWeek: 'Segunda-feira', time: '', notes: '' });
                      setFixedVisitFormVisible(true);
                    }}
                  >
                    <Plus size={14} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>Nova Visita Fixa</Text>
                  </TouchableOpacity>
                </View>

                {fixedVisitLoading ? (
                  <ActivityIndicator size="large" color="#0F2A5A" style={{ marginVertical: 30 }} />
                ) : (
                  <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
                    {fixedVisits.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <CalendarDays size={32} color={Theme.colors.textSecondary} />
                        <Text style={{ color: Theme.colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                          Nenhuma visita fixa cadastrada.
                        </Text>
                      </View>
                    ) : (
                      (() => {
                        const grouped = fixedVisits.reduce((acc: any, visit: any) => {
                          const day = visit.dayOfWeek || 'Segunda-feira';
                          if (!acc[day]) acc[day] = [];
                          acc[day].push(visit);
                          return acc;
                        }, {});

                        const DAYS_ORDER = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

                        return DAYS_ORDER.map((day) => {
                          const dayVisits = grouped[day] || [];
                          if (dayVisits.length === 0) return null;

                          return (
                            <View key={day} style={{ marginBottom: 15 }}>
                              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F2A5A', marginBottom: 8, textTransform: 'uppercase' }}>
                                📅 {day}
                              </Text>
                              {dayVisits.map((visit: any) => (
                                <View
                                  key={visit.id}
                                  style={{
                                    backgroundColor: Theme.colors.inputBackground,
                                    borderRadius: Theme.borderRadius.sm,
                                    padding: 12,
                                    borderWidth: 1,
                                    borderColor: Theme.colors.border,
                                    marginBottom: 8
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: Theme.colors.textPrimary }}>
                                        {visit.clientName}
                                      </Text>
                                      {visit.time ? (
                                        <Text style={{ fontSize: 12, color: '#0F2A5A', fontWeight: '600', marginTop: 2 }}>
                                          🕒 {visit.time}
                                        </Text>
                                      ) : null}
                                      {visit.address ? (
                                        <Text style={{ fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4 }}>
                                          📍 {visit.address}
                                        </Text>
                                      ) : null}
                                      {visit.notes ? (
                                        <View
                                          style={{
                                            backgroundColor: Theme.colors.surface,
                                            borderRadius: 4,
                                            padding: 8,
                                            marginTop: 8,
                                            borderLeftWidth: 3,
                                            borderLeftColor: '#0F2A5A'
                                          }}
                                        >
                                          <Text style={{ fontSize: 13, color: Theme.colors.textPrimary, fontStyle: 'italic' }}>
                                            {visit.notes}
                                          </Text>
                                        </View>
                                      ) : null}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                      <TouchableOpacity
                                        onPress={() => {
                                          setFixedVisitFormData({
                                            id: visit.id,
                                            clientName: visit.clientName,
                                            address: visit.address || '',
                                            dayOfWeek: visit.dayOfWeek || 'Segunda-feira',
                                            time: visit.time || '',
                                            notes: visit.notes || ''
                                          });
                                          setFixedVisitFormVisible(true);
                                        }}
                                      >
                                        <Edit2 size={16} color={Theme.colors.primary} />
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => handleDeleteFixedVisit(visit.id)}>
                                        <Trash2 size={16} color={Theme.colors.error || '#EF4444'} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          );
                        });
                      })()
                    )}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: Theme.spacing.md,
  },

  /* ── Top Header / Search ── */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchSection: {
    flex: 1,
    minWidth: 260,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  bloqueiosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: '#FFFFFF',
  },
  bloqueiosButtonText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  novaConsultaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 42,
  },
  novaConsultaButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* ── Sub Header / Controls ── */
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  weekNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrowBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },

  /* ── Grade Semanal ── */
  gridContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeColumnHeader: {
    width: 70,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  timeHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayHeaderCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  dayHeaderCellActive: {
    borderTopWidth: 3,
    borderTopColor: '#EC4899',
    backgroundColor: '#FFF1F2',
  },
  dayHeaderText: {
    fontSize: 13,
    color: '#374151',
  },
  dayHeaderTextActive: {
    color: '#BE185D',
    fontWeight: 'bold',
  },
  gridRow: {
    flexDirection: 'row',
    minHeight: 55,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  timeCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  gridSlotCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 3,
    minHeight: 55,
  },
  appointmentCard: {
    backgroundColor: Theme.colors.secondary || '#5E5CE6',
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentCardFixed: {
    backgroundColor: '#0F2A5A',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.accent || '#FFB703',
  },
  appointmentCardDone: {
    opacity: 0.65,
    backgroundColor: '#6B7280',
  },
  appointmentCardFixedDone: {
    backgroundColor: '#166534',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    opacity: 0.85,
  },
  checkDoneBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 4,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cardFixedBadgeWrapper: {
    backgroundColor: 'rgba(255, 183, 3, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardFixedBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFB703',
  },
  cardClientName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  cardTextStrikethrough: {
    textDecorationLine: 'line-through',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  cardMetaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },

  /* ── Checkbox Row ── */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  checkboxSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* ── Autocomplete Clientes ── */
  customerDropdownList: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  customerDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customerDropdownName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  customerDropdownMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  /* ── Agenda List View ── */
  agendaContainer: {
    flex: 1,
    padding: 4,
  },
  agendaDayGroup: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agendaDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  agendaDayTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  agendaAddBtn: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyAgendaText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  agendaItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agendaClientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  agendaMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  /* ── Modais ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 480,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  datePickerWrapper: {
    height: 42,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  htmlInputDate: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1C1C1E',
    cursor: 'pointer',
  } as any,
  htmlInputTime: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1C1C1E',
    cursor: 'pointer',
  } as any,
  selectWrapper: {
    height: 42,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  htmlSelect: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1C1C1E',
  } as any,
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

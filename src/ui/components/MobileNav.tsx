import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Theme } from '../themes';
import {
  Home,
  MonitorSmartphone,
  CalendarClock,
  CircleDollarSign,
  Menu,
  X,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { api } from '../../services/api';

const BOTTOM_ITEMS = [
  { id: 'home', label: 'Início', icon: Home, route: '/dashboard' },
  { id: 'equipment', label: 'Aparelhos', icon: MonitorSmartphone, route: '/dashboard/equipment' },
  { id: 'schedule', label: 'Agenda', icon: CalendarClock, route: '/dashboard/schedule' },
  { id: 'finance', label: 'Financeiro', icon: CircleDollarSign, route: '/dashboard/finance' },
];

const DRAWER_ITEMS = [
  { id: 'home', label: 'Início / Dashboard', icon: Home, route: '/dashboard' },
  { id: 'equipment', label: 'Aparelhos & Ordens de Serviço', icon: MonitorSmartphone, route: '/dashboard/equipment' },
  { id: 'schedule', label: 'Agendamentos & Visitas', icon: CalendarClock, route: '/dashboard/schedule' },
  { id: 'estimates', label: 'Orçamentos', icon: FileText, route: '/dashboard/estimates' },
  { id: 'customers', label: 'Clientes', icon: Users, route: '/dashboard/customers' },
  { id: 'sales', label: 'Vendas / PDV', icon: ShoppingCart, route: '/dashboard/sales' },
  { id: 'inventory', label: 'Estoque', icon: Package, route: '/dashboard/inventory' },
  { id: 'finance', label: 'Financeiro & Caixa', icon: CircleDollarSign, route: '/dashboard/finance' },
  { id: 'settings', label: 'Configurações', icon: Settings, route: '/dashboard/settings' },
];

export function MobileTopHeader({ primaryColor, onOpenDrawer }: { primaryColor: string; onOpenDrawer: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.topHeader, { backgroundColor: primaryColor, paddingTop: Math.max(insets.top, 8) }]}>
      <TouchableOpacity 
        style={styles.brandRow} 
        onPress={() => router.push('/dashboard' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>CT</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>Control<Text style={{ color: Theme.colors.accent }}>Tec</Text></Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuIconButton} 
        onPress={onOpenDrawer}
        activeOpacity={0.7}
        accessibilityLabel="Menu principal"
      >
        <Menu size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export function MobileBottomNav({ primaryColor, onOpenDrawer }: { primaryColor: string; onOpenDrawer: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {BOTTOM_ITEMS.map((item) => {
        const isActive = pathname === item.route || (item.route === '/dashboard' && pathname === '/dashboard');
        const Icon = item.icon;
        const color = isActive ? Theme.colors.accent : '#64748B';

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.bottomTab}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Icon size={22} color={color} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.bottomTabLabel, { color }, isActive && { fontWeight: '700' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Botão Mais / Menu */}
      <TouchableOpacity
        style={styles.bottomTab}
        onPress={onOpenDrawer}
        activeOpacity={0.7}
      >
        <Menu size={22} color="#64748B" strokeWidth={2} />
        <Text style={[styles.bottomTabLabel, { color: '#64748B' }]}>
          Mais
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function MobileDrawer({
  visible,
  onClose,
  primaryColor
}: {
  visible: boolean;
  onClose: () => void;
  primaryColor: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleLogout = async () => {
    onClose();
    await api.clearToken();
    router.replace('/');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerOverlay}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} />

        <View style={[styles.drawerContent, { backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, 16) }]}>
          {/* Header do Menu */}
          <View style={[styles.drawerHeader, { backgroundColor: primaryColor }]}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>CT</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>Control<Text style={{ color: Theme.colors.accent }}>Tec</Text></Text>
                <Text style={styles.brandSubtitle}>Menu de Navegação</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Itens do Menu */}
          <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerList}>
            {DRAWER_ITEMS.map((item) => {
              const isActive = pathname === item.route || (item.route === '/dashboard' && pathname === '/dashboard');
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <View style={[styles.drawerItemIconBox, isActive && { backgroundColor: primaryColor }]}>
                    <Icon size={20} color={isActive ? '#FFFFFF' : primaryColor} />
                  </View>
                  <Text style={[styles.drawerItemLabel, isActive && styles.drawerItemLabelActive]}>
                    {item.label}
                  </Text>
                  <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rodapé: Sair */}
          <View style={[styles.drawerFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.drawerLogoutText}>Sair do Sistema</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.accent,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    zIndex: 50,
    ...Platform.select({
      web: {
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerContent: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerList: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  drawerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  drawerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  drawerItemLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  drawerLogoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});

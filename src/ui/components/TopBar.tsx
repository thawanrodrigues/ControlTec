import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../themes';
import { 
  Users, 
  MonitorSmartphone, 
  ClipboardList, 
  FileText, 
  Package, 
  CircleDollarSign, 
  CalendarClock,
  Settings,
  LogOut,
  ShoppingCart,
  Wrench
} from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { api } from '../../services/api';

// Componente customizado para o ícone de Início (Sigla CT)
const CTIcon = ({ size, color }: { size: number, color: string }) => (
  <Text style={[styles.ctIcon, { color: Theme.colors.accent, fontSize: size - 4 }]}>
    CT
  </Text>
);

const MENU_ITEMS = [
  { id: 'home', title: 'Início', icon: CTIcon, route: '/dashboard' },
  { id: 'sales', title: 'Vendas/Recibos', icon: ShoppingCart, route: '/dashboard/sales' },
  { id: 'services', title: 'Serviços', icon: Wrench, route: '/dashboard/services' },
  { id: 'inventory', title: 'Estoque', icon: Package, route: '/dashboard/inventory' },
  { id: 'customers', title: 'Clientes', icon: Users, route: '/dashboard/customers' },
  { id: 'equipment', title: 'Aparelhos', icon: MonitorSmartphone, route: '/dashboard/equipment' },
  { id: 'os', title: 'Ordens (OS)', icon: ClipboardList, route: '/dashboard/os' },
  { id: 'estimates', title: 'Orçamentos', icon: FileText, route: '/dashboard/estimates' },
  { id: 'finance', title: 'Financeiro', icon: CircleDollarSign, route: '/dashboard/finance' },
  { id: 'schedule', title: 'Agendamentos', icon: CalendarClock, route: '/dashboard/schedule' },
  { id: 'settings', title: 'Config.', icon: Settings, route: '/dashboard/settings' },
];

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await api.clearToken();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Barra de Ferramentas com Ícones */}
      <View style={styles.toolbarRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.route;
            const Icon = item.icon;
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.toolbarButton, isActive && styles.toolbarButtonActive]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.iconWrapper}>
                  <Icon 
                     size={24} 
                    color={isActive ? Theme.colors.primary : Theme.colors.textSecondary} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </View>
                <Text style={[styles.toolbarButtonText, isActive && styles.toolbarButtonTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={handleLogout}
          >
            <View style={styles.iconWrapper}>
              <LogOut size={22} color="#DC3545" />
            </View>
            <Text style={[styles.toolbarButtonText, { color: '#DC3545' }]}>
              Sair
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface, // Branco
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100, // Para ficar sobre o conteúdo
  },
  ctIcon: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  toolbarRow: {
    paddingVertical: Theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    minWidth: 65,
    borderRadius: Theme.borderRadius.sm,
  },
  toolbarButtonActive: {
    backgroundColor: Theme.colors.inputBackground,
  },
  iconWrapper: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonText: {
    fontSize: 10,
    marginTop: 2,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  toolbarButtonTextActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, getSidebarMode } from '../themes';
import {
  Users,
  MonitorSmartphone,
  FileText,
  Package,
  CircleDollarSign,
  CalendarClock,
  Settings,
  LogOut,
  ShoppingCart
} from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { api } from '../../services/api';

// Componente customizado para o ícone de Início (Sigla CT)
const CTIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={sidebarStyles.ctIconContainer}>
    <Text style={[sidebarStyles.ctIconText, { fontSize: size - 2, color }]}>CT</Text>
  </View>
);

const MENU_ITEMS = [
  { id: 'customers', title: 'Clientes', icon: Users, route: '/dashboard/customers' },
  { id: 'equipment', title: 'Aparelhos', icon: MonitorSmartphone, route: '/dashboard/equipment' },
  { id: 'estimates', title: 'Orçamentos', icon: FileText, route: '/dashboard/estimates' },
  { id: 'sales', title: 'Vendas', icon: ShoppingCart, route: '/dashboard/sales' },
  { id: 'inventory', title: 'Estoque', icon: Package, route: '/dashboard/inventory' },
  { id: 'finance', title: 'Financeiro', icon: CircleDollarSign, route: '/dashboard/finance' },
  { id: 'schedule', title: 'Agendamentos', icon: CalendarClock, route: '/dashboard/schedule' },
  { id: 'settings', title: 'Configurações', icon: Settings, route: '/dashboard/settings' },
];

export default function MobileSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sidebarMode, setMode] = useState<'icons_hover' | 'expanded' | 'topbar'>('icons_hover');
  const [primaryColor, setPrimaryColor] = useState(Theme.colors.primary);
  const [accentColor, setAccentColor] = useState(Theme.colors.accent);

  useEffect(() => {
    setMode(getSidebarMode());
    setPrimaryColor(Theme.colors.primary);
    setAccentColor(Theme.colors.accent);

    const handleThemeUpdate = () => {
      setPrimaryColor(Theme.colors.primary);
      setAccentColor(Theme.colors.accent);
    };

    const handleModeUpdate = () => {
      setMode(getSidebarMode());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('controltec_theme_updated', handleThemeUpdate);
      window.addEventListener('controltec_sidebar_mode_updated', handleModeUpdate);
      return () => {
        window.removeEventListener('controltec_theme_updated', handleThemeUpdate);
        window.removeEventListener('controltec_sidebar_mode_updated', handleModeUpdate);
      };
    }
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      let role = api.getUserRole();
      if (!role) {
        try {
          const profile = await api.getProfile();
          await api.setUserRole(profile.role);
          role = profile.role;
        } catch (e) {
          console.log('Error verifying role in Sidebar:', e);
        }
      }
      setIsAdmin(role === 'admin' || role === null || role === undefined || role === '');
    };
    checkRole();
  }, [pathname]);

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (!isAdmin) {
      return item.id !== 'home' && item.id !== 'finance' && item.id !== 'settings';
    }
    return true;
  });

  const handleLogout = async () => {
    await api.clearToken();
    router.replace('/');
  };

  const isIconsOnly = sidebarMode === 'icons_hover';
  const isExpanded = sidebarMode === 'expanded';

  return (
    <View 
      style={[
        sidebarStyles.container, 
        { 
          backgroundColor: primaryColor,
          paddingTop: insets.top + 8,
          width: isExpanded ? 200 : 72,
        }
      ]}
    >
      {/* CT Logo / Home no topo */}
      <View style={{ position: 'relative', width: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          style={[
            sidebarStyles.logoContainer,
            isExpanded && { width: '85%', flexDirection: 'row', gap: 10, paddingHorizontal: 12, justifyContent: 'flex-start' }
          ]}
          onPress={() => router.push('/dashboard' as any)}
          // @ts-ignore Web hover props
          onMouseEnter={() => setHoveredId('home')}
          onMouseLeave={() => setHoveredId(null)}
        >
          <CTIcon size={20} color={accentColor} />
          {isExpanded && (
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>ControlTec</Text>
          )}
        </TouchableOpacity>

        {isIconsOnly && hoveredId === 'home' && (
          <View style={sidebarStyles.tooltip}>
            <Text style={sidebarStyles.tooltipText}>Início / Dashboard</Text>
          </View>
        )}
      </View>

      {/* Menu Items com scroll */}
      <ScrollView
        style={sidebarStyles.menuScroll}
        contentContainerStyle={[
          sidebarStyles.menuContent,
          isExpanded && { alignItems: 'stretch', paddingHorizontal: 8 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.route || 
            (item.route === '/dashboard' && pathname === '/dashboard');
          const Icon = item.icon;
          const isHovered = hoveredId === item.id;
          const iconColor = isActive ? accentColor : (isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.7)');

          return (
            <View key={item.id} style={{ position: 'relative', width: '100%', alignItems: isExpanded ? 'stretch' : 'center' }}>
              <TouchableOpacity
                style={[
                  sidebarStyles.menuItem,
                  isExpanded && sidebarStyles.menuItemExpanded,
                  isActive && sidebarStyles.menuItemActive,
                  isHovered && !isActive && sidebarStyles.menuItemHovered,
                ]}
                onPress={() => router.push(item.route as any)}
                // @ts-ignore Web hover props
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <View style={[
                  sidebarStyles.iconWrapper,
                  isActive && { backgroundColor: 'rgba(255,255,255,0.12)' },
                ]}>
                  <Icon size={21} color={iconColor} strokeWidth={isActive ? 2.5 : 2} />
                </View>

                {isExpanded && (
                  <Text
                    style={[
                      sidebarStyles.menuLabelExpanded,
                      isActive && { color: accentColor, fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Tooltip flutuante exibido apenas no hover quando estiver em modo ícones */}
              {isIconsOnly && isHovered && (
                <View style={sidebarStyles.tooltip}>
                  <Text style={sidebarStyles.tooltipText}>{item.title}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Botão Sair fixo no rodapé */}
      <View style={[sidebarStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ position: 'relative', width: '100%', alignItems: isExpanded ? 'stretch' : 'center', paddingHorizontal: isExpanded ? 8 : 0 }}>
          <TouchableOpacity
            style={[
              sidebarStyles.logoutButton,
              isExpanded && sidebarStyles.logoutButtonExpanded
            ]}
            onPress={handleLogout}
            // @ts-ignore Web hover props
            onMouseEnter={() => setHoveredId('logout')}
            onMouseLeave={() => setHoveredId(null)}
          >
            <LogOut size={20} color="#EF4444" strokeWidth={2} />
            {isExpanded && (
              <Text style={sidebarStyles.logoutTextExpanded}>Sair do Sistema</Text>
            )}
          </TouchableOpacity>

          {isIconsOnly && hoveredId === 'logout' && (
            <View style={[sidebarStyles.tooltip, { backgroundColor: '#DC2626' }]}>
              <Text style={sidebarStyles.tooltipText}>Sair do Sistema</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const sidebarStyles = StyleSheet.create({
  container: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 100,
    ...Platform.select({
      web: {
        transition: 'width 0.2s ease-in-out',
        userSelect: 'none',
      },
    }),
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  ctIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctIconText: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  menuScroll: {
    flex: 1,
    width: '100%',
  },
  menuContent: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  menuItem: {
    width: 54,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  menuItemExpanded: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    height: 44,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  menuItemHovered: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabelExpanded: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginLeft: 10,
  },
  tooltip: {
    position: 'absolute',
    left: 76,
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 99999,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      },
    }),
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  logoutButtonExpanded: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  logoutTextExpanded: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
});

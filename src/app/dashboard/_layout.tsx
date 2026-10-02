import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, getSidebarMode } from '../../ui/themes';
import TopBar from '../../ui/components/TopBar';
import MobileSidebar from '../../ui/components/MobileSidebar';
import { MobileTopHeader, MobileBottomNav, MobileDrawer } from '../../ui/components/MobileNav';
import { useBreakpoints } from '../../ui/useBreakpoints';

export default function DashboardLayout() {
  const insets = useSafeAreaInsets();
  const { isCompact } = useBreakpoints();
  const [sidebarMode, setMode] = useState<'icons_hover' | 'expanded' | 'topbar'>('icons_hover');
  const [bgColor, setBgColor] = useState(Theme.colors.primary);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMode(getSidebarMode());
    setBgColor(Theme.colors.primary);

    const handleModeUpdate = () => {
      setMode(getSidebarMode());
    };
    const handleThemeUpdate = () => {
      setBgColor(Theme.colors.primary);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('controltec_sidebar_mode_updated', handleModeUpdate);
      window.addEventListener('controltec_theme_updated', handleThemeUpdate);
      return () => {
        window.removeEventListener('controltec_sidebar_mode_updated', handleModeUpdate);
        window.removeEventListener('controltec_theme_updated', handleThemeUpdate);
      };
    }
  }, []);

  // Se o usuário estiver no mobile, usa TopHeader + Conteúdo Full Width 100% + BottomNav + Drawer
  if (isCompact) {
    return (
      <View style={[styles.mobileWrapper, { backgroundColor: '#F8FAFC' }]}>
        <MobileTopHeader primaryColor={bgColor} onOpenDrawer={() => setMobileDrawerOpen(true)} />
        <View style={styles.mobileMainContent}>
          <Slot />
        </View>
        <MobileBottomNav primaryColor={bgColor} onOpenDrawer={() => setMobileDrawerOpen(true)} />
        <MobileDrawer 
          visible={mobileDrawerOpen} 
          onClose={() => setMobileDrawerOpen(false)} 
          primaryColor={bgColor} 
        />
      </View>
    );
  }

  // Desktop com modo TopBar horizontal
  if (sidebarMode === 'topbar') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <TopBar />
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, Theme.spacing.sm) }]}>
          <Slot />
        </View>
      </View>
    );
  }

  // Desktop com Sidebar Lateral (Apenas Ícones no Hover ou Expandida)
  return (
    <View style={[styles.desktopContainer, { backgroundColor: bgColor }]}>
      <MobileSidebar />
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, Theme.spacing.sm) }]}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    backgroundColor: '#F8FAFC',
  },
  mobileWrapper: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  mobileMainContent: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
});

import { LightTheme } from './light.theme';

// Carrega cores salvas do localStorage se disponível no navegador
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const savedPrimary = localStorage.getItem('controltec_theme_primary');
    if (savedPrimary) {
      LightTheme.colors.primary = savedPrimary;
      LightTheme.colors.background = savedPrimary;
    }
    const savedAccent = localStorage.getItem('controltec_theme_accent');
    if (savedAccent) {
      LightTheme.colors.accent = savedAccent;
    }
  } catch (e) {
    console.error('Error reading theme from localStorage', e);
  }
}

export const Theme = LightTheme;

export function setThemeColors(primary: string, accent: string) {
  Theme.colors.primary = primary;
  Theme.colors.background = primary;
  Theme.colors.accent = accent;

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('controltec_theme_primary', primary);
    localStorage.setItem('controltec_theme_accent', accent);
    window.dispatchEvent(new CustomEvent('controltec_theme_updated', { detail: { primary, accent } }));
  }
}

export function getSidebarMode(): 'icons_hover' | 'expanded' | 'topbar' {
  if (typeof window !== 'undefined' && window.localStorage) {
    const mode = localStorage.getItem('controltec_sidebar_mode');
    if (mode === 'icons_hover' || mode === 'expanded' || mode === 'topbar') {
      return mode;
    }
  }
  return 'icons_hover';
}

export function setSidebarMode(mode: 'icons_hover' | 'expanded' | 'topbar') {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('controltec_sidebar_mode', mode);
    window.dispatchEvent(new CustomEvent('controltec_sidebar_mode_updated', { detail: { mode } }));
  }
}


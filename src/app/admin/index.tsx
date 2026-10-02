import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../ui/themes';
import { Lock, User, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { api } from '../../services/api';
import { storage } from '../../services/storage';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Verificar se o admin já está logado
    const checkLogged = async () => {
      const token = await storage.getItem('adminToken');
      if (token) {
        router.replace('/admin/dashboard');
      }
    };
    checkLogged();
  }, []);

  const handleAdminLogin = async () => {
    setErrorMsg('');
    if (!username || !password) {
      setErrorMsg('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      if (username !== 'admin' || password !== '211895') {
        throw new Error('Credenciais administrativas inválidas');
      }

      console.log('[AdminLogin] Attempting admin login...');
      const response = await api.adminLogin(password);
      console.log('[AdminLogin] Admin login successful!');
      
      await api.setAdminToken(response.token);
      router.replace('/admin/dashboard');
    } catch (error: any) {
      console.error('[AdminLogin] Admin login failed:', error);
      setErrorMsg(error.message || 'Erro ao realizar login administrativo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredWrap}>
            <View style={styles.brandContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PAINEL ADMIN</Text>
              </View>
              <Text style={styles.logoText}>
                Control<Text style={styles.logoAccent}>Tec</Text>
              </Text>
              <Text style={styles.brandSubtitle}>
                Gerenciamento global de parceiros e infraestrutura
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Autenticação do Sistema</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Usuário Master</Text>
                  <View style={styles.inputWrapper}>
                    <User color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="admin"
                      placeholderTextColor={Theme.colors.textSecondary}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha de Segurança</Text>
                  <View style={styles.inputWrapper}>
                    <Lock color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••"
                      placeholderTextColor={Theme.colors.textSecondary}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <AlertCircle color="#dc2626" size={16} style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <TouchableOpacity 
                  style={[styles.loginButton, loading && { opacity: 0.75 }]} 
                  onPress={handleAdminLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={Theme.colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Acessar Painel</Text>
                      <ChevronRight color={Theme.colors.textInverse} size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.replace('/')}
        activeOpacity={0.7}
      >
        <ArrowLeft color={Theme.colors.textInverse} size={20} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071630', // Fundo ainda mais premium e escuro para a área administrativa
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  keyboardRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centeredWrap: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    maxWidth: 400,
    width: '100%',
  },
  badge: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.3)',
    marginBottom: Theme.spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFB703',
    letterSpacing: 1.5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: Theme.colors.textInverse,
    letterSpacing: -1,
  },
  logoAccent: {
    color: Theme.colors.accent,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Theme.colors.textInverse,
    opacity: 0.7,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: Theme.spacing.xl,
    borderRadius: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#071630',
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071630',
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#1F2937',
    fontSize: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' as any }
    }),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0F2A5A', // Botão azul premium escuro para painel admin
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.md,
    shadowColor: '#0F2A5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: Theme.colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: Theme.spacing.xs,
  },
});

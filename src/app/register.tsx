import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../ui/themes';
import { User, Mail, Lock, Building, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { api } from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    cnpj: '',
  });

  const handleRegister = async () => {
    console.log('RegisterScreen: handleRegister started');
    const { name, email, password, companyName, cnpj } = formData;

    if (!name || !email || !password || !companyName || !cnpj) {
      Alert.alert('Aviso', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      console.log('RegisterScreen: calling api.register', { email, companyName });
      const response = await api.register(formData);
      console.log('RegisterScreen: registration successful');
      await api.setToken(response.token);
      await api.setUserRole(response.user.role);
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('RegisterScreen Error:', error.message);
      Alert.alert('Erro', error.message || 'Erro ao realizar cadastro');
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
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandContainer}>
            <Text style={styles.logoText}>
              Control<Text style={styles.logoAccent}>Tec</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Cadastro da sua empresa no sistema</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cadastro de Empresa</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Empresa</Text>
                <View style={styles.inputWrapper}>
                  <Building color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Razão social ou nome fantasia"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={formData.companyName}
                    onChangeText={(val) => setFormData({ ...formData, companyName: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNPJ</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="00.000.000/0001-00"
                    placeholderTextColor={Theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.cnpj}
                    onChangeText={(val) => setFormData({ ...formData, cnpj: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail Corporativo</Text>
                <View style={styles.inputWrapper}>
                  <Mail color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="contato@suaempresa.com.br"
                    placeholderTextColor={Theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do responsável</Text>
                <View style={styles.inputWrapper}>
                  <User color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo do administrador"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={formData.name}
                    onChangeText={(val) => setFormData({ ...formData, name: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Lock color={Theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={Theme.colors.textSecondary}
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(val) => setFormData({ ...formData, password: val })}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
                {!loading && <ChevronRight color={Theme.colors.textInverse} size={20} />}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Já possui conta?</Text>
                <TouchableOpacity 
                  onPress={() => router.replace('/')}
                >
                  <Text style={styles.footerLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={Theme.colors.textInverse} size={24} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  keyboardRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Theme.spacing.sm,
    left: Theme.spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  backButtonText: {
    color: Theme.colors.textInverse,
    fontSize: 16,
    marginLeft: Theme.spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl * 2,
    paddingBottom: Theme.spacing.xl * 2,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    maxWidth: 400,
    width: '100%',
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
    fontSize: 16,
    color: Theme.colors.textInverse,
    opacity: 0.8,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBackground,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    color: Theme.colors.textPrimary,
    fontSize: 16,
    ...Platform.select({
      web: { outlineStyle: 'none' as any },
    }),
  },
  submitButton: {
    backgroundColor: Theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.md,
    shadowColor: Theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: Theme.colors.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: Theme.spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginRight: Theme.spacing.xs,
  },
  footerLink: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
});

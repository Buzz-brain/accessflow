import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter, Redirect } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { Input } from '@/src/components/forms/Input';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { SwitchRow } from '@/src/components/common/SwitchRow';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { getBalance } from '@/src/features/dashboard/services/account.service';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { useScreenGuidance } from '@/src/hooks/useScreenGuidance';
import { useToast } from '@/src/components/common/ToastProvider';
import { toApiError } from '@/src/api/client';
import { formatKoboForSpeech } from '@/src/services/feedback/spokenGuidance';

const accessflowLogo = require('../../temp-assets/accessflow-logo.png');

const schema = z.object({
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { status, signIn } = useAuth();
  const { announceFeedback, announce, announceFinancial } = useFeedback();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' }
  });

  useScreenGuidance('Login', 'Sign in with your email address and password.', 'Login');

  if (status === 'signedIn') return <Redirect href="/home" />;

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setFormError(first?.message ?? 'Check your details and try again.');
      return;
    }
    try {
      const response = await signIn(parsed.data.email.trim(), parsed.data.password, remember);
      if (!response.data) throw new Error('Login response was incomplete.');
      const balanceResponse = await getBalance().catch(() => null);
      const balanceKobo = balanceResponse?.data?.balanceKobo ?? response.data.account.balanceKobo;
      const currency = balanceResponse?.data?.currency ?? response.data.account.currency;

      announceFeedback(response.accessibilityFeedback, { force: true });
      announceFinancial(`Your available balance is ${formatKoboForSpeech(balanceKobo, currency)}.`, {
        force: true,
        key: 'auth:login:balance'
      });
      showToast(response.message, 'success');
      router.replace('/home');
    } catch (error) {
      const apiError = toApiError(error);
      setFormError(apiError.message);
      if (apiError.feedback) announceFeedback(apiError.feedback, { force: true });
      else announce(apiError.message, { type: 'error', force: true });
      showToast(apiError.message, 'error');
    }
  };

  const handleForgotPassword = () => {
    announce('Password recovery is not available in this research prototype.', { type: 'info', force: true });
    showToast('Password recovery is not available in this research prototype.', 'error');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />

        <View style={styles.brandContainer}>
          <Image source={accessflowLogo} style={styles.brandLogo} resizeMode="contain" />
          <Text style={[styles.brandTitle, { color: theme.colors.text }]}>AccessFlow</Text>
          <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>Banking without barriers.</Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>Sign in to your account.</Text>
        </View>

        <Card style={styles.formCard} padded>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                leftAdornment={<Mail size={18} color={theme.colors.textSecondary} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                variant="soft"
                labelMode="floating"
                error={errors.email?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                leftAdornment={<LockKeyhole size={18} color={theme.colors.textSecondary} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="done"
                variant="soft"
                labelMode="floating"
                error={errors.password?.message}
                rightAdornment={
                  <Pressable
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={18} color={theme.colors.textSecondary} /> : <Eye size={18} color={theme.colors.textSecondary} />}
                  </Pressable>
                }
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <SwitchRow
            icon={ShieldCheck}
            title="Remember me"
            value={remember}
            onChange={setRemember}
          />

          {formError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
              {formError}
            </Text>
          ) : null}

          <Button label="Login" onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="large" hint="Sign in to your AccessFlow account" />

          <View style={styles.forgotContainer}>
            <Pressable onPress={handleForgotPassword} accessibilityRole="button" accessibilityLabel="Forgot password" style={styles.forgotLink}>
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
            </Pressable>
          </View>
        </Card>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.bottomContainer}>
          <Text style={[styles.bottomText, { color: theme.colors.textSecondary }]}>Don&apos;t have an account?</Text>
          <Pressable
            onPress={() => router.push('/register')}
            accessibilityRole="button"
            accessibilityLabel="Create a new AccessFlow account"
            style={styles.registerLink}
          >
            <Text style={[styles.registerText, { color: theme.colors.primary }]}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 10, justifyContent: 'center' },
  blobA: { position: 'absolute', top: -120, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E9F6EF', opacity: 0.6 },
  blobB: { position: 'absolute', bottom: -120, right: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: '#E9F6EF', opacity: 0.4 },
  brandContainer: { alignItems: 'center', marginTop: 12, marginBottom: 24 },
  brandLogo: { width: 150, height: 100 },
  brandTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginTop: -8 },
  brandTagline: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  welcomeContainer: { alignItems: 'center', marginBottom: 26 },
  welcomeTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  welcomeSubtitle: { fontSize: 15, marginTop: 6 },
  formCard: { width: '100%', gap: 14, maxWidth: 420, alignSelf: 'center', borderWidth: 0 },
  eyeButton: { padding: 8 },
  error: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  forgotContainer: { alignItems: 'center', marginTop: -6, paddingHorizontal: 4 },
  forgotLink: { minHeight: 44, justifyContent: 'center' },
  forgotText: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, width: '100%', maxWidth: 420, alignSelf: 'center' },
  bottomContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  bottomText: { fontSize: 13, fontWeight: '600' },
  registerLink: { minHeight: 44, justifyContent: 'center' },
  registerText: { fontSize: 13, fontWeight: '700' }
});

import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Redirect, useRouter } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Input } from '@/src/components/forms/Input';
import { Button } from '@/src/components/common/Button';
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
  fullName: z.string().trim().min(2, 'Enter your full name').max(100, 'Name is too long'),
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  phoneNumber: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number')
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { status, register: registerAccount } = useAuth();
  const { announce, announceFinancial } = useFeedback();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { fullName: '', email: '', phoneNumber: '', password: '' }
  });

  useScreenGuidance('Register', 'Create your AccessFlow account with your name, email, phone number and password.', 'Register');

  if (status === 'signedIn') return <Redirect href="/home" />;

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check your details and try again.');
      return;
    }
    try {
      const response = await registerAccount({
        fullName: parsed.data.fullName.trim(),
        email: parsed.data.email.trim(),
        phoneNumber: parsed.data.phoneNumber.trim(),
        password: parsed.data.password
      });
      if (!response.data) throw new Error('Registration response was incomplete.');
      const balanceResponse = await getBalance().catch(() => null);
      const balanceKobo = balanceResponse?.data?.balanceKobo ?? response.data.account.balanceKobo;
      const currency = balanceResponse?.data?.currency ?? response.data.account.currency;

      announce(`Welcome, ${response.data.user.fullName}. Registration complete.`, {
        type: 'success',
        highPriority: true,
        force: true,
        key: 'auth:register'
      });
      announceFinancial(`Your available balance is ${formatKoboForSpeech(balanceKobo, currency)}.`, {
        force: true,
        key: 'auth:register:balance'
      });
      showToast(response.message, 'success');
      router.replace('/home');
    } catch (error) {
      const apiError = toApiError(error);
      setFormError(apiError.message);
      announce(apiError.message, { type: 'error', highPriority: true, force: true });
      showToast(apiError.message, 'error');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AppHeader showBack />
        <View style={styles.intro}>
          <Image source={accessflowLogo} style={styles.brandLogo} resizeMode="contain" />
          <Text style={[styles.brandTitle, { color: theme.colors.text }]}>AccessFlow</Text>
          <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>Banking without barriers.</Text>
          <View style={styles.pageCopy}>
            <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Create Your Account</Text>
            <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>Join AccessFlow today</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <Input
                label="Full name"
                placeholder="Ada Lovelace"
                leftAdornment={<UserRound size={18} color={theme.colors.textSecondary} />}
                autoCapitalize="words"
                textContentType="name"
                variant="soft"
                labelMode="floating"
                error={errors.fullName?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email address"
                placeholder="you@example.com"
                leftAdornment={<Mail size={18} color={theme.colors.textSecondary} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
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
            name="phoneNumber"
            render={({ field }) => (
              <Input
                label="Phone number"
                placeholder="+2348012345678"
                leftAdornment={<Phone size={18} color={theme.colors.textSecondary} />}
                keyboardType="phone-pad"
                autoCorrect={false}
                textContentType="telephoneNumber"
                variant="soft"
                labelMode="floating"
                error={errors.phoneNumber?.message}
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
                placeholder="At least 8 characters"
                leftAdornment={<LockKeyhole size={18} color={theme.colors.textSecondary} />}
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
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                variant="soft"
                labelMode="floating"
                error={errors.password?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          {formError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error }]}>
              {formError}
            </Text>
          ) : null}

          <Button
            label="Register"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            size="large"
          />
        </Card>

        <View style={styles.bottomContainer}>
          <Text style={[styles.bottomText, { color: theme.colors.textSecondary }]}>Already have an account?</Text>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Sign in to your AccessFlow account"
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: theme.colors.primary }]}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 36 },
  intro: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  brandLogo: { width: 130, height: 87, marginBottom: 4 },
  brandTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  pageCopy: { alignItems: 'center', marginTop: 18 },
  pageTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 14, marginTop: 5 },
  card: { gap: 14, borderWidth: 0 },
  eyeButton: { padding: 8 },
  error: { fontSize: 12, fontWeight: '600' },
  bottomContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  bottomText: { fontSize: 13, fontWeight: '600' },
  loginLink: { minHeight: 44, justifyContent: 'center' },
  loginText: { fontSize: 13, fontWeight: '700' }
});

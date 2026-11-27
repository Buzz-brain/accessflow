import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, Redirect, useRouter } from 'expo-router';
import { ArrowRight, LockKeyhole } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Input } from '@/src/components/forms/Input';
import { Button } from '@/src/components/common/Button';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { useToast } from '@/src/components/common/ToastProvider';
import { toApiError } from '@/src/api/client';

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
  const { announceFeedback, announce } = useFeedback();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { fullName: '', email: '', phoneNumber: '', password: '' }
  });

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
      announceFeedback(response.accessibilityFeedback, { force: true });
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

  return (
    <Screen scroll edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AppHeader title="Create account" subtitle="Set up your AccessFlow account" showBack />
        <View style={styles.intro}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>Join AccessFlow</Text>
          <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
            Registration creates a simulated account with a starting balance. No real money is involved.
          </Text>
        </View>

        <Card style={styles.card} elevated>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <Input
                label="Full name"
                placeholder="Ada Lovelace"
                autoCapitalize="words"
                textContentType="name"
                description="This appears on your account and transfer reviews."
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
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                description="You will use this to sign in."
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
                keyboardType="phone-pad"
                autoCorrect={false}
                textContentType="telephoneNumber"
                description="Include the country code if possible."
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
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                description="Use at least 8 characters with a letter and a number."
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
            label="Create account"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            icon={ArrowRight}
            size="large"
          />
        </Card>

        <View style={styles.footer}>
          <LockKeyhole size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Banking data in this app is simulated for research.
          </Text>
        </View>
        <Link href="/login" style={[styles.link, { color: theme.colors.primary }]}>
          Already have an account? Sign in
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36 },
  intro: { marginTop: 22, marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  subheading: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  card: { gap: 18 },
  error: { fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 20 },
  footerText: { fontSize: 11, flexShrink: 1 },
  link: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 18 }
});

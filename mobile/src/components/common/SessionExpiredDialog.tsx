import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AppModal } from './AppModal';
import { Button } from './Button';

export function SessionExpiredDialog({ visible }: { visible: boolean }) {
  const theme = useAppTheme();
  const { dismissSessionExpired } = useAuth();
  const { announce } = useFeedback();

  useEffect(() => {
    if (visible) announce('Your session has expired. Please sign in again.', { type: 'error', force: true });
  }, [announce, visible]);

  return (
    <AppModal
      visible={visible}
      title="Session expired"
      description="For your security, your session ended. Sign in again to continue."
      onClose={dismissSessionExpired}
      closable={false}
    >
      <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
        Your saved sign-in details have been cleared. No transfer was affected by this change.
      </Text>
      <View style={styles.actions}>
        <Button label="Sign in again" onPress={dismissSessionExpired} size="large" />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  detail: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  actions: { gap: 10 }
});

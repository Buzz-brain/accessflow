import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, LogOut } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Button } from '@/src/components/common/Button';
import { AppModal } from '@/src/components/common/AppModal';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { formatAccountNumber } from '@/src/utils/money';
import { initials } from '@/src/utils/format';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, account, logout } = useAuth();
  const { announce } = useFeedback();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    announce('You have been signed out.', { type: 'info', force: true });
    setSigningOut(false);
    setLogoutVisible(false);
  };

  return (
    <Screen scroll={false} edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Profile" subtitle="Your AccessFlow identity and settings" />

        <Card style={styles.profileCard} elevated>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {initials(user?.fullName ?? 'AF')}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.role, { color: theme.colors.textSecondary }]}>
            {user?.role === 'admin' ? 'Administrator' : 'AccessFlow customer'}
          </Text>
        </Card>

        <Card padded={false} style={styles.section}>
          <PressableRow
            icon={ArrowRight}
            label="My Accounts"
            value={account ? formatAccountNumber(account.accountNumber) : '—'}
            onPress={() => router.push('/account')}
          />
          <PressableRow
            icon={ArrowRight}
            label="Accessibility Settings"
            value="Open Accessibility Centre"
            onPress={() => router.push('/accessibility')}
          />
          <PressableRow icon={ArrowRight} label="Security Settings" value="PIN, password and session controls" />
          <PressableRow icon={ArrowRight} label="Help &amp; Support" value="Contact AccessFlow support" />
          <PressableRow icon={ArrowRight} label="About AccessFlow" value="Research prototype v1.0" />
        </Card>

        <Button label="Sign out" onPress={() => setLogoutVisible(true)} variant="destructive" icon={LogOut} />
      </ScrollView>

      <AppModal
        visible={logoutVisible}
        title="Sign out of AccessFlow?"
        description="Your saved session will be removed from this device."
        onClose={() => setLogoutVisible(false)}
      >
        <Button label="Stay signed in" onPress={() => setLogoutVisible(false)} variant="secondary" />
        <View style={styles.modalSpacer} />
        <Button label="Sign out" onPress={() => void handleLogout()} loading={signingOut} variant="destructive" />
      </AppModal>
    </Screen>
  );
}

function PressableRow({
  icon: Icon,
  label,
  value,
  onPress
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const { announce } = useFeedback();
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    announce(`${label}: ${value}`, { force: true });
  };
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.row, { borderBottomColor: theme.colors.border }]}
    >
      <Icon size={17} color={theme.colors.primary} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
          {label}
        </Text>
        <Text style={[styles.rowValue, { color: theme.colors.text, fontSize: theme.typography.body }]}>{value}</Text>
      </View>
      <ArrowRight size={16} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  profileCard: { alignItems: 'center', marginTop: 18, paddingVertical: 26 },
  avatar: { width: 76, height: 76, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '600' },
  name: { fontSize: 18, fontWeight: '600', marginTop: 14, letterSpacing: -0.2 },
  role: { fontSize: 13, marginTop: 4 },
  section: { marginTop: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowCopy: { flex: 1, gap: 4 },
  rowLabel: { fontWeight: '600' },
  rowValue: { fontWeight: '600' },
  modalSpacer: { height: 10 }
});

import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Contrast, Moon, RotateCcw, Sun, Volume2, Wallet } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { SwitchRow } from '@/src/components/common/SwitchRow';
import { Stepper } from '@/src/components/common/Stepper';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { Button } from '@/src/components/common/Button';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useThemeMode } from '@/src/theme/ThemeModeContext';
import { usePreferences } from '@/src/features/accessibility/context/PreferencesContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { useScreenGuidance } from '@/src/hooks/useScreenGuidance';
import { useToast } from '@/src/components/common/ToastProvider';
import type { PreferenceUpdate } from '@/src/types/models';

const speechSpeedLabel = (value: number) => (value <= 0.75 ? 'Slower' : value >= 1.25 ? 'Faster' : 'Normal');
const textSizeLabel = (value: number) => (value <= 1 ? 'Medium' : value < 1.5 ? 'Large' : 'Larger');

export default function AccessibilityScreen() {
  const theme = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const { preferences, loading, lastError, updatePreference, resetAllPreferences } = usePreferences();
  const { announce, announceFeedback } = useFeedback();
  useScreenGuidance('Accessibility centre', 'Personalise voice, financial announcements, visual comfort and text size.', 'Speak important updates');
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  const update = useCallback(
    async (patch: PreferenceUpdate, announcement?: string) => {
      const response = await updatePreference(patch);
      if (response) {
        announceFeedback(response.accessibilityFeedback, { force: false });
        if (announcement) announce(announcement, { type: 'info' });
      } else {
        showToast('Preference could not be saved. Please try again.', 'error');
      }
    },
    [announce, announceFeedback, updatePreference, showToast]
  );

  const handleReset = async () => {
    setResetting(true);
    const response = await resetAllPreferences();
    if (response) {
      announceFeedback(response.accessibilityFeedback, { force: true });
      showToast('Accessibility preferences reset.', 'success');
    }
    setResetting(false);
  };

  return (
    <Screen scroll={false} edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Accessibility Centre" subtitle="Personalise your experience" centerTitle />

        {loading ? (
          <View style={styles.skeletonStack}>
            <Skeleton height={130} radius={20} />
            <Skeleton height={180} radius={20} />
          </View>
        ) : (
          <>
            {lastError ? <ErrorState title="Preferences are unavailable" message={lastError} /> : null}

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionTitle}>
                <Volume2 size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionText, { color: theme.colors.text }]}>Voice guidance</Text>
              </View>
              <SwitchRow
                icon={Volume2}
                title="Speak important updates"
                description="Announce validation errors, progress and transfer results."
                value={preferences.voiceGuidanceEnabled}
                onChange={(value) => void update({ voiceGuidanceEnabled: value }, value ? 'Voice guidance on.' : 'Voice guidance off.')}
              />
              <SwitchRow
                icon={Wallet}
                title="Announce financial details"
                description="Speak balances, amounts, fees and debits. Privacy mode still hides sensitive details."
                value={preferences.financialAnnouncementsEnabled}
                onChange={(value) =>
                  void update(
                    { financialAnnouncementsEnabled: value },
                    value ? 'Financial announcements on.' : 'Financial announcements off.'
                  )
                }
              />
              <View style={styles.settingRow}>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Speech speed</Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>How quickly guidance is spoken.</Text>
                </View>
                <Stepper
                  label="Speech speed"
                  value={preferences.voiceSpeed}
                  displayValue={speechSpeedLabel(preferences.voiceSpeed)}
                  minimum={0.5}
                  maximum={2}
                  step={0.1}
                  onChange={(value) => void update({ voiceSpeed: Number(value.toFixed(1)) })}
                />
              </View>
            </Card>

            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.sectionTitle}>
                <Contrast size={20} color={theme.colors.primary} />
                <Text style={[styles.sectionText, { color: theme.colors.text }]}>Visual comfort</Text>
              </View>
              <SwitchRow
                icon={Contrast}
                title="High contrast"
                description="Stronger boundaries and text contrast across the app."
                value={preferences.highContrastEnabled}
                onChange={(value) => void update({ highContrastEnabled: value }, value ? 'High contrast on.' : 'High contrast off.')}
              />
              <View style={styles.settingRow}>
                <View style={styles.settingCopy}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Text size</Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>Scale typography up to 2x.</Text>
                </View>
                <Stepper
                  label="Text size"
                  value={preferences.textScale}
                  displayValue={textSizeLabel(preferences.textScale)}
                  minimum={1}
                  maximum={2}
                  step={0.1}
                  onChange={(value) => void update({ textScale: Number(value.toFixed(1)) })}
                />
              </View>
              <View style={styles.settingBlock}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Appearance</Text>
                <SegmentedControl
                  label="Colour theme"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' }
                  ]}
                />
              </View>
              <View style={styles.themeHint}>
                {mode === 'dark' ? <Moon size={15} color={theme.colors.textSecondary} /> : <Sun size={15} color={theme.colors.textSecondary} />}
                <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>
                  Theme choice is stored on this device.
                </Text>
              </View>
            </Card>

            <Button
              label="Reset accessibility preferences"
              onPress={() => void handleReset()}
              loading={resetting}
              variant="outline"
              icon={RotateCcw}
              style={styles.resetButton}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  skeletonStack: { gap: 16, marginTop: 20 },
  card: {
    marginTop: 18,
    gap: 4,
    shadowOpacity: 0,
    elevation: 0
  },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14 },
  settingBlock: { gap: 10, paddingVertical: 14 },
  settingCopy: { flex: 1, gap: 3 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingHint: { fontSize: 12, lineHeight: 17 },
  themeHint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  resetButton: { marginTop: 18 }
});

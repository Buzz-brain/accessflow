import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Volume2, VolumeX } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { usePreferences } from '@/src/features/accessibility/context/PreferencesContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';

export function VoiceGuidanceButton({ compact = false }: { compact?: boolean }) {
  const theme = useAppTheme();
  const { preferences } = usePreferences();
  const { previewVoice, stopSpeech } = useFeedback();
  const enabled = preferences.voiceGuidanceEnabled;

  return (
    <Pressable
      onPress={enabled ? previewVoice : stopSpeech}
      accessibilityRole="button"
      accessibilityLabel={enabled ? 'Preview voice guidance' : 'Voice guidance is off'}
      accessibilityHint={enabled ? 'Hear a short voice guidance preview' : 'Enable voice guidance in Accessibility Centre'}
      android_ripple={{ color: theme.colors.primaryLight, borderless: true }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: enabled ? theme.colors.primaryLight : theme.colors.surfaceMuted,
          opacity: pressed ? 0.8 : 1
        }
      ]}
    >
      {enabled ? <Volume2 size={18} color={theme.colors.primary} /> : <VolumeX size={18} color={theme.colors.textSecondary} />}
      {!compact ? <Text style={[styles.label, { color: enabled ? theme.colors.primary : theme.colors.textSecondary }]}>Voice</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 40, borderRadius: 999, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 11, fontWeight: '600' }
});

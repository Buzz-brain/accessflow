import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const STEPS = ['Recipient', 'Amount', 'Review'];

export function TransferStepIndicator({ current }: { current: number }) {
  const theme = useAppTheme();
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Transfer step ${current + 1} of ${STEPS.length}: ${STEPS[current]}`}
    >
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={styles.stepWrap}>
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: done || active ? theme.colors.primary : theme.colors.surfaceMuted,
                  borderColor: active ? theme.colors.primary : 'transparent'
                }
              ]}
            >
              {done ? (
                <Check size={14} color={theme.colors.textOnPrimary} strokeWidth={3} />
              ) : (
                <Text style={[styles.number, { color: active ? theme.colors.textOnPrimary : theme.colors.textSecondary }]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.label, { color: active ? theme.colors.text : theme.colors.textSecondary }]}>{step}</Text>
            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.line,
                  { backgroundColor: index < current ? theme.colors.primary : theme.colors.border }
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepWrap: { flex: 1, alignItems: 'center' },
  circle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  number: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 10, fontWeight: '600', marginTop: 7 },
  line: { position: 'absolute', top: 15, left: '68%', right: '-30%', height: 2 }
});

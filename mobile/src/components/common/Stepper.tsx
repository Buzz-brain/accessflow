import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Minus, Plus } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { IconButton } from './IconButton';

export function Stepper({
  label,
  value,
  displayValue,
  minimum,
  maximum,
  step,
  onChange
}: {
  label: string;
  value: number;
  displayValue: string;
  minimum: number;
  maximum: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const theme = useAppTheme();
  const clamp = (next: number) => Math.min(maximum, Math.max(minimum, Number(next.toFixed(2))));

  return (
    <View style={styles.container} accessible accessibilityRole="group" accessibilityLabel={label}>
      <IconButton
        icon={Minus}
        label={`Decrease ${label}`}
        onPress={() => onChange(clamp(value - step))}
        variant="surface"
        size={38}
        disabled={value <= minimum}
      />
      <Text style={[styles.value, { color: theme.colors.text }]}>{displayValue}</Text>
      <IconButton
        icon={Plus}
        label={`Increase ${label}`}
        onPress={() => onChange(clamp(value + step))}
        variant="surface"
        size={38}
        disabled={value >= maximum}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { minWidth: 72, textAlign: 'center', fontSize: 14, fontWeight: '600' }
});

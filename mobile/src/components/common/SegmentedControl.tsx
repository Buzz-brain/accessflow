import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && { backgroundColor: theme.colors.surface, ...theme.shadows.card }
            ]}
          >
            <Text style={[styles.label, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 15, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600' }
});

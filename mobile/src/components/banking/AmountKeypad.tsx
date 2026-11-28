import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { Delete } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];

export function AmountKeypad({ onPress }: { onPress: (key: string) => void }) {
  const theme = useAppTheme();
  return (
    <View style={styles.grid} accessibilityRole="group" accessibilityLabel="Amount keypad">
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onPress(key)}
          accessibilityRole="button"
          accessibilityLabel={key === 'delete' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key}
          android_ripple={{ color: theme.colors.primaryLight, borderless: true }}
          style={({ pressed }) => [
            styles.key,
            {
              backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text,
              shadowOpacity: pressed ? 0.06 : 0.14,
              shadowRadius: pressed ? 4 : 8,
              shadowOffset: { width: 0, height: pressed ? 1 : 3 },
              elevation: pressed ? 1 : 3,
              transform: pressed ? [{ translateY: 1 }] : []
            }
          ]}
        >
          {key === 'delete' ? (
            <Delete size={23} color={theme.colors.text} />
          ) : (
            <Text style={[styles.keyText, { color: theme.colors.text }]}>{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10, marginBottom: 16 },
  key: { width: '30%', minHeight: 58, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 22, fontWeight: '600' }
});

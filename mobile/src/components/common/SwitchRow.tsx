import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SwitchRowProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ icon: Icon, title, description, value, onChange, disabled }: SwitchRowProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Icon size={19} color={theme.colors.primary} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.surface}
        ios_backgroundColor={theme.colors.border}
        accessibilityLabel={title}
        accessibilityHint={description}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 12, lineHeight: 16 }
});

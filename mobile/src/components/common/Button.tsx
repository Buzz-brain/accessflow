import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  hint?: string;
  size?: 'compact' | 'regular' | 'large';
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon: Icon,
  iconPosition = 'right',
  hint,
  size = 'regular',
  style
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: theme.colors.primary, fg: theme.colors.textOnPrimary, border: theme.colors.primary },
    secondary: { bg: theme.colors.primaryLight, fg: theme.colors.primaryDark, border: theme.colors.primaryLight },
    outline: { bg: 'transparent', fg: theme.colors.text, border: theme.colors.border },
    ghost: { bg: 'transparent', fg: theme.colors.primary, border: 'transparent' },
    destructive: { bg: theme.colors.errorSurface, fg: theme.colors.error, border: theme.colors.errorSurface }
  }[variant];

  const IconNode = Icon ? (
    <Icon size={size === 'compact' ? 16 : size === 'large' ? 20 : 18} color={palette.fg} strokeWidth={2.2} />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      android_ripple={{ color: variant === 'primary' ? 'rgba(255,255,255,0.22)' : theme.colors.primaryLight }}
        style={({ pressed }) => [
          styles.button,
          variant === 'primary' && theme.shadows.raised,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            minHeight: size === 'compact' ? 38 : size === 'large' ? 52 : 54,
            borderRadius: theme.radius.pill,
            opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            paddingHorizontal: size === 'compact' ? 14 : fullWidth ? 20 : 24
          },
          style
        ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={palette.fg} size="small" />
        ) : iconPosition === 'left' && IconNode ? (
          IconNode
        ) : null}
        <Text
          style={[
            styles.label,
            {
              color: palette.fg,
              fontSize: size === 'compact'
                ? theme.typography.secondary
                : size === 'large'
                  ? theme.typography.section
                  : theme.typography.body
            }
          ]}
        >
          {label}
        </Text>
        {!loading && iconPosition === 'right' && IconNode ? IconNode : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontWeight: '600', letterSpacing: -0.1 }
});

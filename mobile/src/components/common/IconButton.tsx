import { Pressable, StyleSheet } from 'react-native';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type Variant = 'surface' | 'ghost' | 'primary' | 'transparent';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: number;
  color?: string;
  disabled?: boolean;
  hint?: string;
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'surface',
  size = 42,
  color,
  disabled,
  hint
}: IconButtonProps) {
  const theme = useAppTheme();
  const background =
    variant === 'surface'
      ? theme.colors.surface
      : variant === 'primary'
        ? theme.colors.primary
        : 'transparent';
  const foreground =
    color ?? (variant === 'primary' ? theme.colors.textOnPrimary : theme.colors.text);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      android_ripple={{ color: theme.colors.primaryLight, borderless: true }}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderColor: variant === 'surface' ? theme.colors.border : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1
        }
      ]}
    >
      <Icon
        size={Math.round(size * 0.46)}
        color={foreground}
        strokeWidth={2.1}
        {...({} as Partial<LucideProps>)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  }
});

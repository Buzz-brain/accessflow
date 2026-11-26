import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label: string;
  description?: string;
  error?: string | null;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  { label, description, error, leftAdornment, rightAdornment, style, ...props },
  ref
) {
  const theme = useAppTheme();
  const errorId = `${props.accessibilityLabel ?? label}-error`;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.typography.secondary }]}>{label}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>{description}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderWidth: error ? 1.5 : 1,
            borderRadius: theme.radius.input
          }
        ]}
      >
        {leftAdornment}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { color: theme.colors.text, fontSize: theme.typography.body }, style]}
          accessible
          accessibilityLabel={label}
          accessibilityHint={error ? `${description ?? ''} ${error}`.trim() : description}
          {...props}
        />
        {rightAdornment}
      </View>
      {error ? (
        <Text
          nativeID={errorId}
          accessibilityRole="alert"
          style={[styles.error, { color: theme.colors.error, fontSize: theme.typography.secondary }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontWeight: '600' },
  description: { lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 },
  input: { flex: 1, paddingVertical: 14, minHeight: 56 },
  error: { fontWeight: '600', lineHeight: 18 }
});

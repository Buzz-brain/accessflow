import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text, scaleFontSize } from '@/src/components/common/AppText';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label: string;
  description?: string;
  error?: string | null;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  variant?: 'outlined' | 'soft' | 'filled';
  labelMode?: 'outside' | 'floating' | 'hidden';
  fieldSize?: 'regular' | 'compact';
}

export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  {
    label,
    description,
    error,
    leftAdornment,
    rightAdornment,
    variant = 'outlined',
    labelMode = 'outside',
    fieldSize = 'regular',
    style,
    onFocus,
    onBlur,
    placeholder,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const theme = useAppTheme();
  const compact = fieldSize === 'compact';
  const [focused, setFocused] = useState(false);
  const errorId = `${props.accessibilityLabel ?? label}-error`;
  const hasValue = String(value ?? defaultValue ?? '').length > 0;
  const floating = labelMode === 'floating';
  const hiddenLabel = labelMode === 'hidden';
  const labelRaised = floating && (focused || hasValue || Boolean(error));
  const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={styles.container}>
      {!floating && !hiddenLabel ? (
        <>
          <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.typography.secondary }]}>{label}</Text>
          {description ? (
            <Text style={[styles.description, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>{description}</Text>
          ) : null}
        </>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: variant === 'filled' ? theme.colors.surfaceMuted : theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderWidth: error ? 1.5 : variant === 'outlined' ? 1 : 0,
            borderRadius: variant === 'filled' ? theme.radius.pill : theme.radius.input,
            minHeight: compact ? 48 : 56
          },
          variant === 'soft' && {
            shadowColor: theme.shadows.card.shadowColor,
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3
          }
        ]}
      >
        {leftAdornment ? <View style={styles.leftAdornment}>{leftAdornment}</View> : null}
        <View style={styles.inputContent}>
          {floating ? (
            <Text
              pointerEvents="none"
              style={[
                styles.floatingLabel,
                {
                  color: labelRaised ? theme.colors.textSecondary : theme.colors.textSecondary,
                  fontSize: labelRaised ? theme.typography.caption : theme.typography.body
                },
                labelRaised && styles.floatingLabelRaised
              ]}
            >
              {label}
            </Text>
          ) : null}
          <TextInput
            ref={ref}
            placeholder={floating ? undefined : placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              compact && styles.compactInput,
              floating && styles.floatingInput,
              labelRaised && styles.floatingInputRaised,
              { color: theme.colors.text, fontSize: scaleFontSize(theme.typography.body), fontFamily: 'Poppins_400Regular' },
              style
            ]}
            accessible
            accessibilityLabel={label}
            accessibilityHint={error ? `${description ?? ''} ${error}`.trim() : description}
            accessibilityValue={props.secureTextEntry ? undefined : { text: String(value ?? defaultValue ?? '') }}
            {...props}
          />
        </View>
        {rightAdornment ? <View style={styles.rightAdornment}>{rightAdornment}</View> : null}
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
  inputContent: { flex: 1, minWidth: 0, justifyContent: 'center' },
  leftAdornment: { marginRight: 12 },
  rightAdornment: { marginLeft: 8 },
  input: { flex: 1, minWidth: 0, paddingVertical: 14, minHeight: 56 },
  compactInput: { paddingVertical: 10, minHeight: 46 },
  floatingInput: { paddingVertical: 0, minHeight: 56 },
  floatingInputRaised: { paddingTop: 18, paddingBottom: 0 },
  floatingLabel: { position: 'absolute', left: 0, top: 18, fontWeight: '500' },
  floatingLabelRaised: { top: 7 },
  error: { fontWeight: '600', lineHeight: 18 }
});

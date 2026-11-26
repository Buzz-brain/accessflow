import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function Card({
  children,
  style,
  elevated = false,
  padded = true
}: {
  children: ReactNode;
  style?: object;
  elevated?: boolean;
  padded?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.card,
            padding: padded ? theme.spacing.lg : 0
        },
        elevated && theme.shadows.card,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1 }
});

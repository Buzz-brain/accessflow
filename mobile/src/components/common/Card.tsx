import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type CardProps = Omit<ViewProps, 'style'> & {
  children: ReactNode;
  style?: object;
  elevated?: boolean;
  padded?: boolean;
};

export function Card({
  children,
  style,
  elevated = false,
  padded = true,
  ...accessibilityProps
}: CardProps) {
  const theme = useAppTheme();
  return (
    <View
      {...accessibilityProps}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: padded ? theme.spacing.lg : 0
        },
        theme.shadows.card,
        elevated && theme.shadows.raised,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20 }
});

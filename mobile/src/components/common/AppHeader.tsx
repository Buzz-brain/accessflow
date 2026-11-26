import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { IconButton } from './IconButton';
import { BrandMark } from './BrandMark';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showBrand?: boolean;
  centerTitle?: boolean;
  actions?: ReactNode;
}

export function AppHeader({ title, subtitle, showBack, showBrand, centerTitle, actions }: AppHeaderProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.container} accessible accessibilityRole="header">
      {centerTitle && (title || subtitle) ? (
        <View
          pointerEvents="box-none"
          style={[styles.centeredTitles, showBack && styles.centeredTitlesWithBack]}
        >
          {title ? (
            <Text style={[styles.title, styles.centeredText, { color: theme.colors.text }]}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.subtitle, styles.centeredText, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.left}>
        {showBack ? (
          <IconButton
            icon={ArrowLeft}
            label="Go back"
            onPress={() => router.back()}
            variant="surface"
            size={40}
          />
        ) : showBrand ? (
          <BrandMark size={38} />
        ) : null}
        {!centerTitle && (title || subtitle) ? (
          <View style={styles.titles}>
            {title ? (
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  centeredTitles: { position: 'absolute', left: 12, right: 12, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  centeredTitlesWithBack: { left: 56, right: 56 },
  titles: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  centeredText: { textAlign: 'center' },
  subtitle: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 }
});

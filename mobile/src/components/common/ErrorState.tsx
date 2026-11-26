import { StyleSheet, Text, View } from 'react-native';
import { CircleX, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  const theme = useAppTheme();
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${message}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.errorSurface }]}>
        <CircleX size={26} color={theme.colors.error} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.section }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary, fontSize: theme.typography.body }]}>{message}</Text>
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" icon={RefreshCw} fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  iconWrap: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontWeight: '600', textAlign: 'center' },
  message: { lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 18 }
});

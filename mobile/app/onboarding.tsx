import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Eye, Hand } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button } from '@/src/components/common/Button';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';

const onboardingOne = require('../temp-assets/onboarding-one.png');
const onboardingTwo = require('../temp-assets/onboarding-two.png');
const onboardingThree = require('../temp-assets/onboarding-three.png');

interface Page {
  key: string;
  title: string;
  body: string;
  bullet: string;
  image: any;
  aspectRatio: number;
}

const PAGES: Page[] = [
  {
    key: 'simple',
    title: 'Banking made simpler',
    body: 'A calm, focused banking home with clear balances, quick actions and transactions you can understand at a glance.',
    bullet: 'Designed around accessible navigation',
    image: onboardingOne,
    aspectRatio: 1308 / 1203
  },
  {
    key: 'control',
    title: 'Your money, your control',
    body: 'Review every transfer before it moves. Confirm deliberately, cancel safely and always know what happened.',
    bullet: 'Secure two-step transfers',
    image: onboardingTwo,
    aspectRatio: 1342 / 1172
  },
  {
    key: 'barriers',
    title: 'Banking without barriers',
    body: 'Voice guidance, screen-reader labels, haptics and adaptable visuals work together so you can bank independently.',
    bullet: 'Built for TalkBack and VoiceOver',
    image: onboardingThree,
    aspectRatio: 1433 / 1098
  }
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { status } = useAuth();
  const { announce } = useFeedback();
  const [index, setIndex] = useState(0);
  const finishing = useRef(false);
  const page = PAGES[index];
  const isLast = index === PAGES.length - 1;
  const availableHeight = windowHeight - insets.top - insets.bottom;
  const topSpacing = Math.round(Math.min(76, Math.max(48, availableHeight * 0.08)));
  const maxIllustrationHeight = (windowWidth * 1.18) / page.aspectRatio;
  const illustrationHeight = Math.max(150, Math.min(maxIllustrationHeight, availableHeight - topSpacing - 285));
  const illustrationWidth = illustrationHeight * page.aspectRatio;
  const illustrationMarginLeft = (windowWidth - illustrationWidth) / 2 - 24;

  const goNext = async () => {
    if (!isLast) {
      const next = index + 1;
      setIndex(next);
      announce(PAGES[next].title, { type: 'info' });
      return;
    }
    if (finishing.current) return;
    finishing.current = true;
    await completeOnboarding();
    router.replace(status === 'signedIn' ? '/home' : '/login');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace(status === 'signedIn' ? '/home' : '/login');
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.page, { paddingTop: topSpacing }]}>
        <Animated.View key={page.key} entering={FadeInRight.duration(320)}>
          <View
            style={[
              styles.illustrationWrap,
              { width: illustrationWidth, marginLeft: illustrationMarginLeft }
            ]}
          >
            <Image
              source={page.image}
              style={[styles.pageImage, { width: illustrationWidth, height: illustrationHeight }]}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>{page.title}</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{page.body}</Text>
          <View style={[styles.bullet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.check, { backgroundColor: theme.colors.successSurface }]}>
              <Check size={15} color={theme.colors.success} strokeWidth={3} />
            </View>
            <Text style={[styles.bulletText, { color: theme.colors.text }]}>{page.bullet}</Text>
            {index === 2 ? <Eye size={17} color={theme.colors.primary} /> : null}
            {index === 2 ? <Hand size={17} color={theme.colors.primary} /> : null}
          </View>
        </Animated.View>

        <View style={styles.bottom}>
          <View style={styles.indicators}>
            {PAGES.map((item, itemIndex) => (
              <View
                key={item.key}
                style={[
                  styles.indicator,
                  {
                    width: itemIndex === index ? 26 : 7,
                    backgroundColor: itemIndex === index ? theme.colors.primary : theme.colors.border
                  }
                ]}
              />
            ))}
          </View>
          <Button
            label={isLast ? 'Get started' : 'Continue'}
            onPress={goNext}
            icon={ArrowRight}
            size="large"
            hint={isLast ? 'Finish onboarding and continue to sign in' : 'Go to the next introduction page'}
          />
          <Pressable onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" style={styles.skipLink}>
            <Text style={[styles.skipLinkText, { color: theme.colors.textSecondary }]}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  skipText: { fontSize: 13, fontWeight: '600' },
  page: { flex: 1, paddingHorizontal: 24 },
  illustrationWrap: { marginBottom: 8, alignItems: 'center' },
  pageImage: { resizeMode: 'contain' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', marginTop: 2 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 4 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 15, padding: 11, marginTop: 8 },
  check: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bulletText: { fontSize: 13, fontWeight: '600' },
  bottom: { marginTop: 4, paddingBottom: 8, gap: 6, alignItems: 'center' },
  indicators: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  indicator: { height: 7, borderRadius: 4 },
  skipLink: { minHeight: 44, justifyContent: 'center' },
  skipLinkText: { fontSize: 13, fontWeight: '600' }
});

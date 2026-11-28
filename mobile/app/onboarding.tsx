import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { Button } from '@/src/components/common/Button';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { useScreenGuidance } from '@/src/hooks/useScreenGuidance';

const onboardingOne = require('../temp-assets/onboarding-one.png');
const onboardingTwo = require('../temp-assets/onboarding-two.png');
const onboardingThree = require('../temp-assets/onboarding-three.png');

interface Page {
  key: string;
  title: string;
  body: string;
  image: any;
  aspectRatio: number;
}

const PAGES: Page[] = [
  {
    key: 'simple',
    title: 'Banking made simpler.',
    body: 'Enjoy a seamless banking experience with voice guidance and easy navigation.',
    image: onboardingOne,
    aspectRatio: 1308 / 1203
  },
  {
    key: 'control',
    title: 'Your money, your control.',
    body: 'Secure, reliable and always in your hands.',
    image: onboardingTwo,
    aspectRatio: 1342 / 1172
  },
  {
    key: 'barriers',
    title: 'Banking without barriers.',
    body: 'Designed for everyone,\nincluding you',
    image: onboardingThree,
    aspectRatio: 1433 / 1098
  }
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { status } = useAuth();
  const { announce } = useFeedback();
  const [index, setIndex] = useState(0);
  const finishing = useRef(false);
  const page = PAGES[index];
  const isLast = index === PAGES.length - 1;
  useScreenGuidance('Welcome to AccessFlow', page.title, isLast ? 'Get started' : 'Continue');
  const illustrationWidth = windowWidth;
  const illustrationHeight = illustrationWidth / page.aspectRatio;
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
    <Screen scroll contentStyle={styles.screenContent} edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <View style={styles.page}>
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

          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{page.title}</Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{page.body}</Text>
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
  screenContent: { paddingBottom: 0 },
  page: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  illustrationWrap: { marginBottom: 8, alignItems: 'center', overflow: 'hidden' },
  pageImage: { resizeMode: 'cover' },
  copy: { width: '88%', alignSelf: 'center' },
  title: { width: '94%', alignSelf: 'center', fontSize: 26, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  bottom: { marginTop: 4, paddingBottom: 8, gap: 6, alignItems: 'center' },
  indicators: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  indicator: { height: 7, borderRadius: 4 },
  skipLink: { minHeight: 44, justifyContent: 'center' },
  skipLinkText: { fontSize: 13, fontWeight: '600' }
});

import { forwardRef, type ComponentProps } from 'react';
import { StyleSheet, Text as RNText, type TextInstance, type TextStyle } from 'react-native';

type TextProps = Omit<ComponentProps<typeof RNText>, 'ref'>;
type FontWeight = TextStyle['fontWeight'];

const GLOBAL_FONT_SCALE = 0.92;
const MIN_FONT_SIZE = 10;

export function scaleFontSize(size: number): number {
  return Math.max(MIN_FONT_SIZE, Math.round(size * GLOBAL_FONT_SCALE));
}

function resolveFontFamily(fontWeight: FontWeight): string {
  const value = fontWeight == null ? 'normal' : String(fontWeight);

  switch (value) {
    case '500':
      return 'Poppins_500Medium';
    case '600':
      return 'Poppins_600SemiBold';
    case 'bold':
    case '700':
    case '800':
    case '900':
      return 'Poppins_700Bold';
    default:
      return 'Poppins_400Regular';
  }
}

function scaleTextStyle(style: TextStyle | undefined): TextStyle | undefined {
  if (!style) return style;

  return {
    ...style,
    fontSize: typeof style.fontSize === 'number' ? scaleFontSize(style.fontSize) : style.fontSize,
    lineHeight: typeof style.lineHeight === 'number'
      ? Math.max(MIN_FONT_SIZE + 2, Math.round(style.lineHeight * GLOBAL_FONT_SCALE))
      : style.lineHeight
  };
}

export const Text = forwardRef<TextInstance, TextProps>(function Text({ style, ...props }, ref) {
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = resolveFontFamily(flattenedStyle?.fontWeight);

  return <RNText ref={ref} style={[{ fontFamily }, scaleTextStyle(flattenedStyle)]} {...props} />;
});

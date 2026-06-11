// Motion primitifleri (motion-design skill) — reanimated 3, reduce-motion kapılı.
// Süre token'ları: mikro 120-150 · standart 200-250 · büyük 300-350 ms.
import { useReduceMotion } from "@/lib/reduce-motion";
import type { ReactNode } from "react";
import { Platform, Pressable, type PressableProps } from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

// Reanimated'in layout `entering` animasyonları React Native Web'de yırtık kare /
// GPU kompozit artefaktı üretiyor (mobil Chrome). Bu yüzden `entering`'i NATIVE'e
// kıstırıyoruz; web'de düz render (reduce-motion ile aynı kapı). PressScale gibi
// transform-tabanlı mikro-etkileşimler her iki platformda da güvenli → kalır.
const SKIP_ENTERING = Platform.OS === "web";

/** Liste kartı girişi: stagger'lı FadeInUp (ilk ~12 öğe), reduce/web'de animasyonsuz. */
export function EnterItem({
  index = 0,
  children,
  className,
}: { index?: number; children: ReactNode; className?: string }): ReactNode {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      className={className}
      entering={
        reduce || SKIP_ENTERING
          ? undefined
          : FadeInUp.delay(Math.min(index, 12) * 40)
              .springify()
              .damping(18)
              .stiffness(180)
      }
    >
      {children}
    </Animated.View>
  );
}

/** Açılır (akordeon) içerik girişi — standart süre (reduce/web'de animasyonsuz). */
export function ExpandIn({
  children,
  className,
}: { children: ReactNode; className?: string }): ReactNode {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      className={className}
      entering={reduce || SKIP_ENTERING ? undefined : FadeIn.duration(200)}
    >
      {children}
    </Animated.View>
  );
}

/** Bası geri bildirimi: scale 0.97 spring (mikro-etkileşim). */
export function PressScale({
  children,
  style,
  ...props
}: PressableProps & { children: ReactNode }): ReactNode {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressableBase
      {...props}
      style={[animStyle, style as object]}
      onPressIn={(e) => {
        if (!reduce) scale.value = withSpring(0.97, { damping: 18, stiffness: 220 });
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduce) scale.value = withSpring(1, { damping: 18, stiffness: 220 });
        props.onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}

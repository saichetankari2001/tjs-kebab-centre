import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const COUNT = 22;
const particles = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  x:     Math.random() * width,
  size:  Math.random() * 3 + 1,
  dur:   Math.random() * 8000 + 6000,
  delay: Math.random() * 10000,
  opacity: Math.random() * 0.4 + 0.1,
}));

function Particle({ x, size, dur, delay, opacity }) {
  const y   = useRef(new Animated.Value(height + 20)).current;
  const op  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      y.setValue(height + 20);
      op.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y,  { toValue: -20,     duration: dur,  useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(op, { toValue: opacity, duration: dur * 0.2, useNativeDriver: true }),
            Animated.timing(op, { toValue: opacity, duration: dur * 0.6, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0,       duration: dur * 0.2, useNativeDriver: true }),
          ]),
        ]),
      ]).start(loop);
    };
    loop();
  }, []);

  return (
    <Animated.View
      style={[styles.particle, {
        left:   x,
        width:  size,
        height: size,
        borderRadius: size / 2,
        opacity: op,
        transform: [{ translateY: y }],
      }]}
    />
  );
}

export default function Particles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

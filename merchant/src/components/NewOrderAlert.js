import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

const { width } = Dimensions.get('window');

export default function NewOrderAlert({ count, onDismiss }) {
  const slideY  = useRef(new Animated.Value(-120)).current;
  const scale   = useRef(new Animated.Value(0.9)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
        Animated.spring(scale,  { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 600, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(scale,  { toValue: 0.9,  duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

  const borderColor = glow.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(245,158,11,0.5)', 'rgba(245,158,11,1)'],
  });

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY: slideY }, { scale }] }]}>
      <TouchableOpacity onPress={onDismiss} activeOpacity={0.9}>
        <Animated.View style={[styles.banner, { borderColor }]}>
          <LinearGradient
            colors={['rgba(245,158,11,0.22)', 'rgba(234,88,12,0.14)', 'rgba(10,5,0,0.97)']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Pulsing ring */}
            <View style={styles.iconWrap}>
              <Animated.View style={[styles.ring, {
                opacity: glow,
                transform: [{ scale: glow.interpolate({ inputRange: [0,1], outputRange: [1, 1.5] }) }],
              }]} />
              <Text style={styles.icon}>🔔</Text>
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>NEW ORDER{count > 1 ? `S (${count})` : '!'}</Text>
              <Text style={styles.sub}>Tap anywhere to dismiss alarm</Text>
            </View>
            <Text style={styles.dismiss}>✕</Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 100 },
  banner:   { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 20 },
  gradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  ring:     { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#f59e0b' },
  icon:     { fontSize: 28 },
  textWrap: { flex: 1 },
  title:    { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  sub:      { color: 'rgba(245,158,11,0.8)', fontSize: 12, fontWeight: '600' },
  dismiss:  { color: 'rgba(255,255,255,0.5)', fontSize: 20, paddingLeft: 8 },
});

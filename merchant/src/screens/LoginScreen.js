import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';
import Particles from '../components/Particles';

const { width } = Dimensions.get('window');

const CORRECT_PIN = '1234'; // Change this to your preferred PIN

const PAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['⌫','0','✓'],
];

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOp    = useRef(new Animated.Value(0)).current;
  const formOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(formOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (key === '✓') {
      if (pin === CORRECT_PIN) {
        onLogin();
      } else {
        doShake();
        setPin('');
        Alert.alert('Wrong PIN', 'Please try again.');
      }
      return;
    }
    if (pin.length < 4) {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === CORRECT_PIN) {
            onLogin();
          } else {
            doShake();
            setPin('');
          }
        }, 200);
      }
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030200', '#0a0500', '#060300']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Particles />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOp, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logo3d}>
          <View style={[styles.logoLayer, { bottom: -6, left: -6, opacity: 0.3 }]}>
            <Text style={styles.logoTJ}>TJ</Text>
          </View>
          <View style={[styles.logoLayer, { bottom: -3, left: -3, opacity: 0.6 }]}>
            <Text style={styles.logoTJ}>TJ</Text>
          </View>
          <View style={styles.logoFront}>
            <Text style={styles.logoTJ}>TJ</Text>
          </View>
        </View>
        <Text style={styles.logoTitle}>TJ'S KEBAB CENTRE</Text>
        <Text style={styles.logoSub}>MERCHANT TABLET</Text>
        <View style={styles.logoDivider} />
      </Animated.View>

      {/* PIN pad */}
      <Animated.View style={[styles.padWrap, { opacity: formOp }]}>
        <Text style={styles.pinLabel}>ENTER PIN</Text>

        {/* Dots */}
        <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
          {[0,1,2,3].map(i => (
            <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
          ))}
        </Animated.View>

        {/* Number pad */}
        <View style={styles.pad}>
          {PAD.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map(key => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    key === '✓' && styles.keyConfirm,
                    key === '⌫' && styles.keyBack,
                  ]}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={key === '✓'
                      ? ['#fbbf24','#f59e0b','#d97706']
                      : ['rgba(255,255,255,0.06)','rgba(255,255,255,0.02)']}
                    style={styles.keyGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.keyText, key === '✓' && styles.keyTextConfirm]}>
                      {key}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const KEY = (width - 120) / 3;

const styles = StyleSheet.create({
  root:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap:      { alignItems: 'center', marginBottom: 40 },
  logo3d:        { width: 90, height: 90, marginBottom: 16, position: 'relative' },
  logoLayer:     { position: 'absolute', width: 80, height: 80, borderRadius: 22, backgroundColor: C.brandDeep, alignItems: 'center', justifyContent: 'center' },
  logoFront:     { width: 80, height: 80, borderRadius: 22, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  logoTJ:        { color: '#0d0600', fontSize: 32, fontWeight: '900' },
  logoTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  logoSub:       { color: C.brand, fontSize: 10, fontWeight: '800', letterSpacing: 4 },
  logoDivider:   { width: 60, height: 2, backgroundColor: C.brand, borderRadius: 1, marginTop: 14, opacity: 0.6 },
  padWrap:       { alignItems: 'center' },
  pinLabel:      { color: C.muted, fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 20 },
  dots:          { flexDirection: 'row', gap: 16, marginBottom: 32 },
  dot:           { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.brand, backgroundColor: 'transparent' },
  dotFilled:     { backgroundColor: C.brand },
  pad:           { gap: 12 },
  row:           { flexDirection: 'row', gap: 12 },
  key:           { width: KEY, height: KEY * 0.65, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(58,32,0,0.8)' },
  keyConfirm:    { borderColor: C.brand },
  keyBack:       { borderColor: 'rgba(255,255,255,0.1)' },
  keyGrad:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyText:       { color: '#fff', fontSize: 22, fontWeight: '700' },
  keyTextConfirm:{ color: '#0d0600', fontWeight: '900' },
});

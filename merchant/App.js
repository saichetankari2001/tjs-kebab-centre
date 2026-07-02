import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    activateKeepAwakeAsync();
    AsyncStorage.getItem('merchant_logged_in').then(val => {
      setLoggedIn(val === 'true');
      setReady(true);
    });
    return () => deactivateKeepAwake();
  }, []);

  const handleLogin = async () => {
    await AsyncStorage.setItem('merchant_logged_in', 'true');
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('merchant_logged_in');
    setLoggedIn(false);
  };

  if (!ready) return <View style={styles.splash} />;

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor="#030200" />
      {loggedIn
        ? <DashboardScreen onLogout={handleLogout} />
        : <LoginScreen onLogin={handleLogin} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#030200' },
  splash: { flex: 1, backgroundColor: '#030200' },
});

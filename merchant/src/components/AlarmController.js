import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

// Generates a repeating beep pattern using expo-av
// Falls back gracefully if audio unavailable
export function useAlarm(active) {
  const soundRef = useRef(null);
  const mounted  = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    if (active) {
      startAlarm();
    } else {
      stopAlarm();
    }
    return () => { stopAlarm(); };
  }, [active]);

  const startAlarm = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:   false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid:    false,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        // Uber Eats style: use a freely licensed alert tone
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      if (!mounted.current) { await sound.unloadAsync(); return; }
      soundRef.current = sound;
    } catch (e) {
      console.warn('Alarm audio error:', e);
    }
  };

  const stopAlarm = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  };
}

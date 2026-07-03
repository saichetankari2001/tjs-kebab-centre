import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

// Try multiple sound sources in order — first one that loads wins
const SOUND_URIS = [
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
];

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
    return () => stopAlarm();
  }, [active]);

  const startAlarm = async () => {
    await stopAlarm(); // ensure clean slate
    for (const uri of SOUND_URIS) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS:      false,
          playsInSilentModeIOS:    true,
          shouldDuckAndroid:       false,
          staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        if (!mounted.current) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
        return; // success — stop trying
      } catch (e) {
        console.warn('Alarm sound failed, trying next:', uri, e?.message);
      }
    }
    console.warn('All alarm sound sources failed');
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

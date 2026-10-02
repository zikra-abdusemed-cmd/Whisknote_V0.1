// Web Audio API harmonic chime tone for baking timer completion
import { triggerHaptic as nativeHaptic, hapticWarning } from './haptics';

export function playBakeChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Warm three-tone major chime (C5, E5, G5) followed by soft octave repeat
    playTone(523.25, now, 0.45);
    playTone(659.25, now + 0.22, 0.45);
    playTone(783.99, now + 0.44, 0.9);
  } catch (e) {
    console.log('Audio chime not permitted or failed', e);
  }
}

export function triggerHaptic(pattern: number | number[] = 15) {
  if (Array.isArray(pattern)) {
    void hapticWarning();
    return;
  }
  void nativeHaptic(pattern);
}

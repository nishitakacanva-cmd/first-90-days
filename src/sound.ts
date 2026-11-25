/** Paper-and-desk sound effects, synthesised with the Web Audio API (no audio files, nothing recorded).
 *  The context is created on the first user gesture, so nothing plays before the visitor interacts. */
let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) { try { ctx = new AC(); } catch { return null; } }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function noise(c: AudioContext) {
  if (noiseBuf) return noiseBuf;
  const len = c.sampleRate * 1.2; noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
/** Filtered noise burst: paper, rustles, slides. */
function burst(dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass', sweepTo?: number, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource(); src.buffer = noise(c);
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}
/** Short tone: pops, chimes, clicks. */
function tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}

export const SFX = {
  flip() { burst(0.32, 1800, 0.7, 0.22, 'bandpass', 600); burst(0.12, 3000, 1, 0.08, 'highpass', undefined, 0.22); },
  rustle() { for (let i = 0; i < 3; i++) burst(0.14, 2200 + i * 500, 1.2, 0.12, 'bandpass', 900, i * 0.09); },
  click() { tone(1800, 0.04, 0.12, 'square'); burst(0.03, 4000, 2, 0.06, 'highpass'); },
  pop() { tone(420, 0.12, 0.22, 'sine', 820); },
  snap() { tone(2600, 0.03, 0.15, 'square'); burst(0.05, 5000, 3, 0.12, 'highpass'); tone(160, 0.08, 0.15, 'sine', 90, 0.01); },
  scribble() { for (let i = 0; i < 5; i++) burst(0.07, 3200 + Math.random() * 1200, 4, 0.07, 'bandpass', undefined, i * 0.07); },
  slide() { burst(0.36, 500, 0.8, 0.2, 'lowpass', 220); tone(110, 0.14, 0.12, 'sine', 80, 0.26); },
  whoosh() { burst(0.42, 400, 0.6, 0.2, 'bandpass', 3200); },
  thud() { tone(140, 0.16, 0.25, 'sine', 70); burst(0.05, 900, 1, 0.08, 'lowpass'); },
  tick() { tone(1200, 0.035, 0.1, 'triangle'); },
  chime() { [659, 880, 1319].forEach((f, i) => tone(f, 0.9, 0.09, 'sine', undefined, i * 0.11)); },
  ding() { tone(1568, 0.5, 0.08, 'sine'); tone(2093, 0.4, 0.05, 'sine', undefined, 0.05); }
};
export type SfxName = keyof typeof SFX;
export function play(name: SfxName | null | undefined) { if (!name) return; try { SFX[name](); } catch { /* audio unavailable: stay silent */ } }

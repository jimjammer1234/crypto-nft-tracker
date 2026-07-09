let audioCtx: AudioContext | null = null;

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Short ascending three-note chime, played when a block_found alert arrives. */
export function playBlockFoundSound() {
  audioCtx ??= new AudioContext();
  const ctx = audioCtx;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, freq, now + i * 0.12, 0.35));
}

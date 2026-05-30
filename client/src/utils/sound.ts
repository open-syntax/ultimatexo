import { SettingsStore } from "@/store/settings";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!SettingsStore.getState().soundEnabled) return null;
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }

  return audioCtx;
}

interface ToneOptions {
  frequency: number;
  type?: OscillatorType;
  duration?: number;
  volume?: number;
  attack?: number;
  decay?: number;
}

function playTone({
  frequency,
  type = "sine",
  duration = 0.1,
  volume = 0.1,
  attack = 0.005,
  decay = 0.08,
}: ToneOptions) {
  const ctx = getCtx();

  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + attack + decay,
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playArpeggio(
  notes: { freq: number; time: number }[],
  type: OscillatorType = "sine",
  volume = 0.12,
  noteDuration = 0.3,
) {
  const ctx = getCtx();

  if (!ctx) return;

  const now = ctx.currentTime;

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(volume, now + time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + noteDuration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + noteDuration + 0.05);
  });
}

/** Crisp, lower-pitched wooden tick for X moves */
export function playMoveX() {
  playTone({
    frequency: 880,
    type: "square",
    duration: 0.06,
    volume: 0.08,
    attack: 0.001,
    decay: 0.05,
  });
}

/** Soft rounded pop for O moves */
export function playMoveO() {
  playTone({
    frequency: 660,
    type: "sine",
    duration: 0.1,
    volume: 0.1,
    attack: 0.005,
    decay: 0.08,
  });
}

/** Triumphant three-note chime when a mini-board is won */
export function playMiniWin() {
  playArpeggio(
    [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.1 },
      { freq: 783.99, time: 0.2 },
    ],
    "sine",
    0.16,
    0.35,
  );
}

/** Full victory fanfare with ascending arpeggio and harmonic shimmer */
export function playGameWin() {
  const ctx = getCtx();

  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0 },
    { freq: 659.25, time: 0.12 },
    { freq: 783.99, time: 0.24 },
    { freq: 1046.5, time: 0.36 },
  ];

  notes.forEach(({ freq, time }) => {
    // Main sine tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + time);
    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.18, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + time);
    osc.stop(now + time + 0.55);

    // Subtle harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now + time);
    gain2.gain.setValueAtTime(0, now + time);
    gain2.gain.linearRampToValueAtTime(0.06, now + time + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + time + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + time);
    osc2.stop(now + time + 0.4);
  });
}

/** Neutral balanced tone for a draw */
export function playDraw() {
  playArpeggio(
    [
      { freq: 440, time: 0 },
      { freq: 554.37, time: 0.12 },
    ],
    "sine",
    0.12,
    0.35,
  );
}

/** Upward chime for player join / reconnection */
export function playJoin() {
  playTone({
    frequency: 880,
    type: "sine",
    duration: 0.2,
    volume: 0.1,
    attack: 0.01,
    decay: 0.15,
  });
}

/** Downward tone for player leave / disconnect */
export function playLeave() {
  playTone({
    frequency: 440,
    type: "sine",
    duration: 0.2,
    volume: 0.08,
    attack: 0.01,
    decay: 0.15,
  });
}

/** Ultra-subtle blip for chat messages */
export function playChat() {
  playTone({
    frequency: 1200,
    type: "sine",
    duration: 0.03,
    volume: 0.05,
    attack: 0.001,
    decay: 0.02,
  });
}

/** Sharp ticking pulse for countdown urgency */
export function playTick() {
  playTone({
    frequency: 600,
    type: "square",
    duration: 0.04,
    volume: 0.06,
    attack: 0.001,
    decay: 0.03,
  });
}

/** Soft two-note notification ping for rematch / draw requests */
export function playRequest() {
  playArpeggio(
    [
      { freq: 800, time: 0 },
      { freq: 1000, time: 0.08 },
    ],
    "sine",
    0.1,
    0.22,
  );
}

/** Nearly imperceptible tactile click for UI buttons */
export function playButton() {
  playTone({
    frequency: 300,
    type: "triangle",
    duration: 0.03,
    volume: 0.04,
    attack: 0.001,
    decay: 0.02,
  });
}

/** Short descending defeat tone for resign */
export function playResign() {
  playArpeggio(
    [
      { freq: 400, time: 0 },
      { freq: 300, time: 0.1 },
    ],
    "triangle",
    0.12,
    0.3,
  );
}

/** Ascending three-tone connection chime */
export function playConnect() {
  playArpeggio(
    [
      { freq: 600, time: 0 },
      { freq: 900, time: 0.1 },
      { freq: 1200, time: 0.2 },
    ],
    "sine",
    0.1,
    0.25,
  );
}

let loaded = false;

function makeBuf(
  ctx: AudioContext,
  type: 'square' | 'triangle',
  freq: number,
  duration: number,
  env: { attack: number; decay: number; sustain: number; release: number }
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sr * duration));
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);

  const envStart = env.attack;
  const envDecayEnd = env.attack + env.decay;
  const envSustainStart = envDecayEnd;
  const envSustainEnd = envDecayEnd + env.sustain;
  const envReleaseStart = envSustainEnd;

  for (let i = 0; i < len; i++) {
    const t = i / sr;
    let amp = 0;
    if (t < envStart) {
      amp = t / envStart;
    } else if (t < envDecayEnd) {
      const p = (t - envStart) / env.decay;
      amp = 1 - (1 - env.sustain) * p;
    } else if (t < envSustainEnd) {
      amp = env.sustain;
    } else if (t < envReleaseStart) {
      const p = (t - envSustainEnd) / env.release;
      amp = env.sustain * (1 - p);
    } else {
      amp = 0;
    }
    amp = Math.max(0, Math.min(1, amp));

    const osc = type === 'square' ? (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) : Math.sin(2 * Math.PI * freq * t);
    const click = Math.exp(-t * 22) * 0.6;
    data[i] = (osc * amp * 0.5 + click * 0.5) * 0.5;
  }

  return buf;
}

let buffers: Map<string, AudioBuffer> | null = null;
let ctx: AudioContext | null = null;

function ensure() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    buffers = new Map();
    buffers.set('ui_click_3d', makeBuf(ctx, 'square', 1880, 0.09, { attack: 0.002, decay: 0.018, sustain: 0.05, release: 0.02 }));
    buffers.set('ui_click_deep', makeBuf(ctx, 'triangle', 1220, 0.11, { attack: 0.002, decay: 0.022, sustain: 0.06, release: 0.03 }));
    loaded = true;
  } catch {
    ctx = null as any;
    buffers = null as any;
  }
  return ctx;
}

function playSound(name: string) {
  const c = ensure();
  if (!c || !buffers) return;
  const buf = buffers.get(name);
  if (!buf) return;
  const src = c.createBufferSource();
  const gain = c.createGain();
  const pan = c.createStereoPanner ? c.createStereoPanner() : null;
  src.buffer = buf;
  gain.gain.value = 0.5;
  gain.connect(c.destination);
  if (pan) {
    pan.pan.value = name === 'ui_click_deep' ? -0.12 : 0;
    src.connect(pan);
    pan.connect(gain);
  } else {
    src.connect(gain);
  }
  src.start(0);
}

function preloadSound(name: string) {
  ensure();
}

export const AudioCtx = {
  play(name: string) {
    return playSound(name);
  },
  preload(...names: string[]) {
    for (const name of names) {
      try {
        preloadSound(name);
      } catch {
        /* ignore */
      }
    }
  },
  get ready() {
    return loaded;
  }
};

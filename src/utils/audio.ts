/**
 * Web Audio API Procedural Synthesizer for Fireworks & Disney Nighttime Spectacular
 * Generates realistic launch whistles (pitch varying with rocket speed),
 * deep explosive booms with simulated castle lagoon reverberation,
 * sharp crackling sparkle pops, and magical orchestral star chimes.
 */

class FireworksAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      // Pre-create 2-second white noise buffer for bursts, friction, and crackles
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch {
      // AudioContext not supported
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.volume, now);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Sound of rocket ascending with a rising pitch whistle that varies with speed
   */
  public playLaunch(duration = 1.0, speedMultiplier = 1.0) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const effectiveDuration = Math.max(0.4, Math.min(1.8, duration));

    // Pitch factor directly tied to speed
    const pitchFactor = Math.max(0.5, Math.min(2.5, speedMultiplier));
    const startFreq = 220 * pitchFactor;
    const endFreq = 1050 * pitchFactor;

    // 1. Dual Whistle Oscillators (Sine + Sawtooth blend)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(startFreq, t);
    osc1.frequency.exponentialRampToValueAtTime(endFreq, t + effectiveDuration * 0.96);

    osc2.frequency.setValueAtTime(startFreq * 1.5, t);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, t + effectiveDuration * 0.96);

    // Whistle volume envelope
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.exponentialRampToValueAtTime(0.14, t + 0.08);
    oscGain.gain.setValueAtTime(0.14, t + effectiveDuration * 0.75);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + effectiveDuration);

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + effectiveDuration + 0.05);
    osc2.stop(t + effectiveDuration + 0.05);

    // 2. Air hiss / motor exhaust noise
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(550 * pitchFactor, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(1500 * pitchFactor, t + effectiveDuration);
      noiseFilter.Q.value = 3.5;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.11, t + 0.06);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + effectiveDuration);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + effectiveDuration + 0.05);
    }
  }

  /**
   * Shell detonation: deep sub-bass thump + explosive shockwave + castle lagoon reverberation
   */
  public playExplosion(power = 1.0, isHeavy = false) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const intensity = Math.min(2.0, Math.max(0.4, power));

    // 1. Deep Sub-bass Thud (sine wave diving to ~28Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';

    const startFreq = isHeavy ? 95 : 140;
    const endFreq = isHeavy ? 26 : 32;
    const subDuration = (isHeavy ? 1.5 : 1.1) * Math.min(1.4, Math.max(0.8, intensity * 0.9));

    subOsc.frequency.setValueAtTime(startFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(endFreq, t + subDuration * 0.7);

    subGain.gain.setValueAtTime(0.48 * intensity, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + subDuration);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + subDuration + 0.05);

    // 2. Blast Noise
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const initialCutoff = (isHeavy ? 800 : 1200) * Math.min(1.5, intensity);
      filter.frequency.setValueAtTime(initialCutoff, t);
      filter.frequency.exponentialRampToValueAtTime(50, t + 0.85);

      const burstGain = this.ctx.createGain();
      burstGain.gain.setValueAtTime(0.55 * intensity, t);
      burstGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      noise.connect(filter);
      filter.connect(burstGain);
      burstGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.95);

      // 3. Castle Lagoon Multi-Tap Echo / Reverb (reflections across water and castle facade)
      const echoDelays = [0.12, 0.24, 0.38, 0.52];
      const echoGains = [0.24 * intensity, 0.16 * intensity, 0.09 * intensity, 0.05 * intensity];

      echoDelays.forEach((delay, idx) => {
        if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
        const echoNoise = this.ctx.createBufferSource();
        echoNoise.buffer = this.noiseBuffer;

        const echoFilter = this.ctx.createBiquadFilter();
        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(480 / (idx + 1), t + delay);
        echoFilter.frequency.exponentialRampToValueAtTime(65, t + delay + 0.8);

        const echoGain = this.ctx.createGain();
        echoGain.gain.setValueAtTime(0.0001, t);
        echoGain.gain.setValueAtTime(echoGains[idx], t + delay);
        echoGain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.9);

        echoNoise.connect(echoFilter);
        echoFilter.connect(echoGain);
        echoGain.connect(this.masterGain);

        echoNoise.start(t + delay);
        echoNoise.stop(t + delay + 0.95);
      });
    }
  }

  /**
   * Sharp crackling sparkle pops ("chisporroteo agudo" / dragon eggs)
   */
  public playCrackles(count = 10, startDelay = 0.2) {
    if (!this.ctx || this.isMuted || !this.masterGain || !this.noiseBuffer) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const baseT = this.ctx.currentTime + startDelay;
    const actualCount = Math.min(30, Math.max(4, count));

    for (let i = 0; i < actualCount; i++) {
      const popTime = baseT + (i / actualCount) * 0.75 + (Math.random() * 0.09 - 0.045);
      if (popTime < this.ctx.currentTime) continue;

      const popSource = this.ctx.createBufferSource();
      popSource.buffer = this.noiseBuffer;

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(3600 + Math.random() * 4000, popTime);
      popFilter.Q.value = 6.0;

      const popGain = this.ctx.createGain();
      const popVol = 0.07 + Math.random() * 0.08;
      popGain.gain.setValueAtTime(0.0001, popTime);
      popGain.gain.setValueAtTime(popVol, popTime + 0.001);
      popGain.gain.exponentialRampToValueAtTime(0.0001, popTime + 0.032);

      popSource.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.masterGain);

      popSource.start(popTime);
      popSource.stop(popTime + 0.038);
    }
  }

  /**
   * Magical Star Chimes (celesta / fairy bell chimes) for Disney enchanted bursts
   */
  public playMagicalChimes() {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    // Magical pentatonic / fairytale notes (E6, G#6, B6, E7, F#7)
    const freqs = [1318.51, 1661.22, 1975.53, 2637.02, 2959.96];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = t + idx * 0.075;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.08, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }
  /**
   * Synthesize rhythmic beat click / kick for BPM Synchronization Mode
   */
  public playRhythmBeat(isDownbeat = false) {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isDownbeat) {
      // Deeper bass beat kick for downbeat (beat 1)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    } else {
      // Woodblock / high rimshot click for beats 2, 3, 4
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isDownbeat ? 0.16 : 0.07));
  }

  /**
   * Sonido de Firma y Nombres Familiares: Acorde majestuoso armónico celestial + campanillas de polvo de estrellas + retumbe épico
   */
  public playFamilyWordSound(word = 'Altair') {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    // 1. Explosión de fondo profunda y resonante
    this.playExplosion(1.85, true);

    // Mapeo tonal según el nombre para dar identidad sonora única a cada familiar
    let chordNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C Mayor por defecto
    const lower = word.toLowerCase();
    if (lower.includes('papá') || lower.includes('papa')) {
      chordNotes = [174.61, 261.63, 349.23, 440.0, 523.25, 698.46]; // F Mayor cálido
    } else if (lower.includes('mamá') || lower.includes('mama')) {
      chordNotes = [196.0, 293.66, 392.0, 493.88, 587.33, 783.99]; // G Mayor amoroso
    } else if (lower.includes('abuelo')) {
      chordNotes = [155.56, 233.08, 311.13, 392.0, 466.16, 622.25]; // Eb Mayor noble y profundo
    } else if (lower.includes('abuela')) {
      chordNotes = [207.65, 261.63, 311.13, 415.3, 523.25, 622.25]; // Ab Mayor dulce
    } else if (lower.includes('sox')) {
      chordNotes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0]; // D Mayor brillante
    } else if (lower.includes('tía') || lower.includes('tia')) {
      chordNotes = [233.08, 293.66, 349.23, 466.16, 587.33, 698.46]; // Bb Mayor alegre
    } else if (lower.includes('sofi')) {
      chordNotes = [329.63, 392.0, 493.88, 659.25, 783.99, 987.77]; // E Mayor radiante
    }

    chordNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Ataque suave y gran caída envolvente
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09 / chordNotes.length, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 4.0);
    });

    // 3. Cascada de campanillas celestiales y polvo de hadas (Disney Fairy Dust Chimes)
    const baseFreq = chordNotes[2] * 2.5;
    const sparkleNotes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0, baseFreq * 2.5, baseFreq * 3.0];
    sparkleNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = t + 0.08 + idx * 0.07;
      const chOsc = this.ctx.createOscillator();
      const chGain = this.ctx.createGain();
      chOsc.type = 'sine';
      chOsc.frequency.setValueAtTime(freq, noteTime);

      chGain.gain.setValueAtTime(0.0001, noteTime);
      chGain.gain.exponentialRampToValueAtTime(0.07, noteTime + 0.03);
      chGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

      chOsc.connect(chGain);
      chGain.connect(this.masterGain);

      chOsc.start(noteTime);
      chOsc.stop(noteTime + 1.85);
    });
  }

  /**
   * Alias de compatibilidad para la firma Altair
   */
  public playAltairSignature() {
    this.playFamilyWordSound('Altair');
  }
}

export const audioEngine = new FireworksAudioEngine();

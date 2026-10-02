import { audioEngine } from './audio';

export type FireworkType =
  | 'chrysanthemum'
  | 'willow'
  | 'magic_shapes'
  | 'double_core'
  | 'ring'
  | 'crossette'
  | 'random'
  | 'altair_signature';

export type DisneyScenario = 'castle' | 'tomorrowland' | 'jungle' | 'minimal';
export type SkyTheme = 'night' | 'twilight' | 'dawn' | 'deep_night';

export interface FireworkConfig {
  type: FireworkType;
  scenario: DisneyScenario;
  colorScheme: string;
  customColor: string;
  particleCount: number; // 40 - 450
  explosionForce: number; // 0.5 - 2.5
  rocketSpeed: number; // 0.5 - 2.5
  trailDuration: number; // 0.10 - 0.35
  soundEnabled: boolean;
  skyTheme: SkyTheme;
  rhythmSync: boolean;
  bpm: number; // 60 - 180
  starrySky?: boolean;
  starIntensity?: number; // 0.5 - 1.5
  willowPersistence?: number; // 0.85 - 0.99 (Retención de luz en el buffer acumulativo)
  willowGlow?: number; // 1.0 - 2.5 (Brillo acumulativo de las estelas)
  cinematicSmoke?: boolean; // Capa de humo grisáceo cinematográfico
  smokeDensity?: number; // 0.5 - 1.5 (Densidad y opacidad del humo)
  deepNightMode?: boolean; // Modo Nocturno Profundo: cielo negro azabache absoluto y luminosidad resaltada
  signatureWord?: string; // Palabra familiar activa ('Altair', 'papá', 'mamá', 'abuelo', 'abuela', 'Sox', 'Tía', 'Sofi')
  dayNightCycle?: boolean; // Ciclo Día-Noche automático cada 2 minutos durante el Auto Show
}

export interface PresetPalette {
  id: string;
  name: string;
  colors: string[];
  primary: string;
  glow: string;
}

export const DISNEY_PALETTES: PresetPalette[] = [
  {
    id: 'gold',
    name: 'Oro Encantado',
    colors: ['#ffe066', '#ffd13b', '#ffb703', '#fb8500', '#fff3b0'],
    primary: '#ffd13b',
    glow: 'rgba(255, 209, 59, 0.45)',
  },
  {
    id: 'blue',
    name: 'Magia Azul',
    colors: ['#00d2ff', '#0099ff', '#2979ff', '#651fff', '#80d8ff'],
    primary: '#00d2ff',
    glow: 'rgba(0, 210, 255, 0.45)',
  },
  {
    id: 'rose',
    name: 'Rosa Real',
    colors: ['#ff2a85', '#f50057', '#ff5252', '#ff80bf', '#ffb3d9'],
    primary: '#ff2a85',
    glow: 'rgba(255, 42, 133, 0.45)',
  },
  {
    id: 'green',
    name: 'Esmeralda Mística',
    colors: ['#00ff88', '#00e676', '#69f0ae', '#76ff03', '#b9f6ca'],
    primary: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.45)',
  },
  {
    id: 'fuchsia',
    name: 'Fucsia Fantasía',
    colors: ['#f50057', '#e040fb', '#d500f9', '#ff4081', '#ff80ab'],
    primary: '#e040fb',
    glow: 'rgba(224, 64, 251, 0.45)',
  },
  {
    id: 'rainbow',
    name: 'Arcoíris Mágico',
    colors: ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00d2ff', '#d500f9'],
    primary: '#ff9100',
    glow: 'rgba(255, 145, 0, 0.45)',
  },
  {
    id: 'silver',
    name: 'Plata Estelar',
    colors: ['#ffffff', '#e0f2fe', '#bae6fd', '#f1f5f9', '#cbd5e1'],
    primary: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.45)',
  },
];

// Nombres Especiales para la Firma Familiar
export const FAMILY_NAMES = ['ALTAIR', 'mamá', 'papá', 'abuela', 'abuelo', 'tía', 'Sofi'] as const;
export type FamilyName = typeof FAMILY_NAMES[number];

// Fases del Ciclo Día-Noche automático durante el Auto Show (cada 2 minutos)
export const DAY_NIGHT_PHASES: { theme: SkyTheme; starIntensity: number; name: string }[] = [
  { theme: 'night', starIntensity: 1.0, name: 'Noche Estelar' },
  { theme: 'deep_night', starIntensity: 1.35, name: 'Noche Profunda OLED' },
  { theme: 'dawn', starIntensity: 0.45, name: 'Amanecer Mágico' },
  { theme: 'twilight', starIntensity: 0.75, name: 'Crepúsculo Dorado' },
];

// Rasterizador de partículas para Nombres Familiares Luminosos
const cachedWordPoints: Record<string, { dx: number; dy: number }[]> = {};

export function getWordLetterPoints(word = 'ALTAIR'): { dx: number; dy: number }[] {
  const cleanWord = (word || 'ALTAIR').trim();
  if (cachedWordPoints[cleanWord] && cachedWordPoints[cleanWord].length > 0) {
    return cachedWordPoints[cleanWord];
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = 600;
  offCanvas.height = 200;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return [];

  offCtx.font = 'bold 80px sans-serif';
  offCtx.fillStyle = 'white';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(cleanWord, 300, 100);

  const points: { dx: number; dy: number }[] = [];
  try {
    const imgData = offCtx.getImageData(0, 0, 600, 200);
    const pixels = imgData.data;
    for (let y = 0; y < 200; y += 4) {
      for (let x = 0; x < 600; x += 4) {
        const index = (y * 600 + x) * 4;
        if (pixels[index + 3] > 128) {
          points.push({ dx: x - 300, dy: y - 100 });
        }
      }
    }
  } catch (e) {
    console.warn('Canvas pixel extraction fallback', e);
  }

  // Salvaguarda: garantiza que siempre existan puntos para la constelación si falla getImageData
  if (points.length < 15) {
    for (let i = 0; i < cleanWord.length; i++) {
      const charOffset = (i - cleanWord.length / 2 + 0.5) * 50;
      for (let gy = -30; gy <= 30; gy += 8) {
        points.push({ dx: charOffset, dy: gy });
        points.push({ dx: charOffset + 16, dy: gy });
      }
      for (let gx = 0; gx <= 16; gx += 4) {
        points.push({ dx: charOffset + gx, dy: -30 });
        points.push({ dx: charOffset + gx, dy: 0 });
        points.push({ dx: charOffset + gx, dy: 30 });
      }
    }
  }

  cachedWordPoints[cleanWord] = points;
  return points;
}

export function getAltairLetterPoints(): { dx: number; dy: number }[] {
  return getWordLetterPoints('ALTAIR');
}

// Background Star with gentle atmospheric fluctuation
export class Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  minAlpha: number;
  maxAlpha: number;
  phase: number;
  secondaryPhase: number;
  twinkleSpeed: number; // Gentle sinusoidal breathing speed
  color: string;
  isJewel: boolean;
  flareSize: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    // Natural celestial distribution: denser in high sky, tapering toward horizon (water is at height * 0.82)
    this.y = Math.pow(Math.random(), 1.25) * (height * 0.74);

    const r = Math.random();
    if (r > 0.93) {
      // Celestial Jewel Star (Evening Star / Sirius style with diffraction spike)
      this.size = Math.random() * 0.7 + 1.5;
      this.minAlpha = 0.50;
      this.maxAlpha = 0.95;
      this.isJewel = true;
      this.flareSize = this.size * 3.2;
    } else if (r > 0.68) {
      // Medium shimmering star
      this.size = Math.random() * 0.5 + 1.0;
      this.minAlpha = 0.25;
      this.maxAlpha = 0.76;
      this.isJewel = false;
      this.flareSize = 0;
    } else {
      // Micro distant galaxy / Milky Way pinpoint star
      this.size = Math.random() * 0.4 + 0.55;
      this.minAlpha = 0.10;
      this.maxAlpha = 0.48;
      this.isJewel = false;
      this.flareSize = 0;
    }

    this.phase = Math.random() * Math.PI * 2;
    this.secondaryPhase = Math.random() * Math.PI * 2;
    // Gentle breathing cycle: ~2 to 5 seconds per full cycle
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    this.alpha = this.minAlpha;

    // Natural celestial star hues
    const cRand = Math.random();
    if (cRand > 0.62) {
      this.color = '#ffffff'; // Diamond white
    } else if (cRand > 0.38) {
      this.color = '#fff6db'; // Warm gold starlight
    } else if (cRand > 0.16) {
      this.color = '#d6eeff'; // Ice blue celestial
    } else {
      this.color = '#f2e8ff'; // Soft lavender
    }
  }

  update() {
    this.phase += this.twinkleSpeed;
    this.secondaryPhase += this.twinkleSpeed * 1.618; // Golden ratio frequency for organic twinkle
    // Compound harmonic oscillation for gentle, smooth continuous fluctuation
    const harmonic = (Math.sin(this.phase) * 0.72 + Math.sin(this.secondaryPhase) * 0.28 + 1) * 0.5;
    this.alpha = this.minAlpha + (this.maxAlpha - this.minAlpha) * Math.max(0, Math.min(1, harmonic));
  }

  draw(ctx: CanvasRenderingContext2D, visibility = 1.0) {
    const finalAlpha = this.alpha * visibility;
    if (finalAlpha <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = finalAlpha;
    ctx.fillStyle = this.color;

    // Circular star core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle soft halo & cross diffraction spike for major jewel stars
    if (this.isJewel && finalAlpha > 0.4) {
      ctx.globalAlpha = finalAlpha * 0.22;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Delicate 4-point cross rays
      ctx.globalAlpha = finalAlpha * 0.32;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(this.x - this.flareSize, this.y);
      ctx.lineTo(this.x + this.flareSize, this.y);
      ctx.moveTo(this.x, this.y - this.flareSize);
      ctx.lineTo(this.x, this.y + this.flareSize);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Enchanted Shooting Star (Wish upon a star)
export class ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  decay: number;
  active: boolean;

  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.length = 0;
    this.speed = 0;
    this.angle = 0;
    this.alpha = 0;
    this.decay = 0;
  }

  spawn(width: number, height: number) {
    this.x = Math.random() * (width * 0.7) + width * 0.1;
    this.y = Math.random() * (height * 0.25) + 15;
    this.length = Math.random() * 55 + 45;
    this.speed = Math.random() * 8 + 10;
    this.angle = Math.PI / 4 + (Math.random() * 0.25 - 0.125);
    this.alpha = 0.85;
    this.decay = 0.024;
    this.active = true;
  }

  update(): boolean {
    if (!this.active) return false;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.alpha -= this.decay;
    if (this.alpha <= 0) {
      this.active = false;
    }
    return this.active;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const tailX = this.x - Math.cos(this.angle) * this.length;
    const tailY = this.y - Math.sin(this.angle) * this.length;

    const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.7, 'rgba(255, 235, 180, 0.4)');
    grad.addColorStop(1, '#ffffff');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.restore();
  }
}

// Sparkle Particle
export class Spark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  drag: number;
  gravity: number;
  flicker: boolean;
  hueShift: number;
  hue: number;
  hasCrackle: boolean;
  isCrossette: boolean;
  isWillow: boolean;
  hasSplit: boolean;
  history: { x: number; y: number }[];
  maxHistory: number;
  isStaticConstellation: boolean;
  constellationBirth: number;
  constellationDuration: number;
  destX: number;
  destY: number;
  phase: number;
  twinkleSpeed: number;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    options?: {
      size?: number;
      decay?: number;
      drag?: number;
      gravity?: number;
      flicker?: boolean;
      hueShift?: number;
      maxHistory?: number;
      hasCrackle?: boolean;
      isCrossette?: boolean;
      isWillow?: boolean;
      isStaticConstellation?: boolean;
      constellationDuration?: number;
      destX?: number;
      destY?: number;
    }
  ) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.alpha = 1;
    this.isWillow = options?.isWillow ?? false;
    this.size = options?.size ?? (this.isWillow ? Math.random() * 2.2 + 1.4 : Math.random() * 2 + 1.2);
    // Sauce Llorón: larga vida útil (~250-320 frames) para permitir que la cascada dorada fluya continuamente
    this.decay = options?.decay ?? (this.isWillow ? Math.random() * 0.0042 + 0.0032 : Math.random() * 0.015 + 0.012);
    this.drag = options?.drag ?? (this.isWillow ? 0.968 : 0.97);
    this.gravity = options?.gravity ?? (this.isWillow ? 0.062 : 0.045);
    this.flicker = options?.flicker ?? true;
    this.hueShift = options?.hueShift ?? 0;
    this.hue = Math.random() * 360;
    this.hasCrackle = options?.hasCrackle ?? false;
    this.isCrossette = options?.isCrossette ?? false;
    this.hasSplit = false;
    this.maxHistory = options?.maxHistory ?? (this.isWillow ? 16 : 4);
    this.history = [{ x, y }];

    this.isStaticConstellation = options?.isStaticConstellation ?? false;
    this.constellationBirth = Date.now();
    this.constellationDuration = options?.constellationDuration ?? 5000;
    this.destX = options?.destX ?? x;
    this.destY = options?.destY ?? y;
    this.phase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.08 + 0.04;
  }

  update(): boolean {
    if (this.isStaticConstellation) {
      const elapsed = Date.now() - this.constellationBirth;
      if (elapsed < 240) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.82;
        this.vy *= 0.82;
      } else {
        this.x = this.destX;
        this.y = this.destY;
        this.vx = 0;
        this.vy = 0;
      }

      this.phase += this.twinkleSpeed;

      // 4. Permanecer estáticas, titilando suavemente como una constelación en el cielo durante exactamente 5 segundos
      if (elapsed <= this.constellationDuration) {
        this.alpha = 0.85 + Math.sin(this.phase) * 0.15;
      } else {
        // Luego desvanecerse progresivamente
        this.alpha -= 0.016;
        if (this.alpha <= 0) {
          this.alpha = 0;
          return false;
        }
      }
      return true;
    }
    this.prevX = this.x;
    this.prevY = this.y;

    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    this.alpha -= this.decay;

    if (this.hueShift > 0) {
      this.hue = (this.hue + this.hueShift) % 360;
    }

    return this.alpha > 0;
  }

  // Dibujado en Buffer Acumulativo de Sauce Llorón (Kamuro Gold Waterfall)
  // Estampa tramos de luz con mezcla aditiva que persisten y se acumulan en el lienzo fuera de pantalla
  drawWillowAccumulative(ctx: CanvasRenderingContext2D, glow = 1.0) {
    if (this.alpha <= 0) return;
    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    if (dx === 0 && dy === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const flickerMod = this.flicker && Math.random() > 0.84 ? 0.55 : 1.0;
    const effectiveAlpha = Math.min(1.0, this.alpha * flickerMod);

    // Pase 1: Halo radiante de oro ámbar cálido (amplitud luminosa acumulativa)
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(3.0, this.size * 3.2 * glow);
    ctx.globalAlpha = effectiveAlpha * 0.38;
    ctx.stroke();

    // Pase 2: Seda dorada incandescente intermedia de alto brillo
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = '#ffe484';
    ctx.lineWidth = Math.max(1.6, this.size * 1.5 * glow);
    ctx.globalAlpha = effectiveAlpha * 0.82;
    ctx.stroke();

    // Pase 3: Núcleo filiforme blanco-oro incandescente
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = '#fffdf5';
    ctx.lineWidth = Math.max(0.85, this.size * 0.8);
    ctx.globalAlpha = effectiveAlpha * 0.98;
    ctx.stroke();

    // Cabeza incandescente activa: chispa ardiente con destello puntual
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1.4, this.size * 0.9), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = effectiveAlpha;
    ctx.fill();

    // Micro-chisporroteo centelleante ocasional
    if (this.hasCrackle && Math.random() > 0.72) {
      ctx.beginPath();
      const sparkDist = (Math.random() * 3 + 1) * glow;
      const sparkAngle = Math.random() * Math.PI * 2;
      ctx.arc(
        this.x + Math.cos(sparkAngle) * sparkDist,
        this.y + Math.sin(sparkAngle) * sparkDist,
        Math.random() * 0.9 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#fffbeb';
      ctx.globalAlpha = effectiveAlpha * 0.9;
      ctx.fill();
    }

    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;

    let displayAlpha = this.alpha;
    if (this.flicker && Math.random() > 0.82) {
      displayAlpha *= 0.35;
    }

    ctx.save();
    ctx.globalAlpha = displayAlpha;

    const strokeColor = this.hueShift > 0 ? `hsl(${this.hue}, 100%, 65%)` : this.color;

    // Willow Particle fallback if drawn directly to standard context
    if (this.isWillow && this.history.length > 1) {
      // Pass 1: Warm amber/gold radiant outer glow
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 0; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = this.size * 2.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = displayAlpha * 0.42;
      ctx.stroke();

      // Pass 2: High-luminance starlight molten gold core
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 0; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = Math.max(1, this.size * 0.9);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = displayAlpha * 0.95;
      ctx.stroke();

      // Incandescent head spark
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1.2, this.size * 0.85), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = displayAlpha;
      ctx.fill();

      ctx.restore();
      return;
    }

    // Standard particle trail stream
    if (this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      for (let i = 0; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw reflection in water surface
  drawReflection(ctx: CanvasRenderingContext2D, waterY: number) {
    if (this.alpha <= 0 || this.y >= waterY) return;
    const dy = waterY - this.y;
    const reflectY = waterY + dy * 0.75;
    if (reflectY < waterY || reflectY > waterY * 1.5) return;

    const jitter = Math.sin(this.x * 0.05 + Date.now() * 0.006) * 3;
    const reflectX = this.x + jitter;

    ctx.save();
    const reflectAlpha = this.isWillow ? this.alpha * 0.42 : this.alpha * 0.28;
    ctx.globalAlpha = reflectAlpha;
    const strokeColor = this.hueShift > 0 ? `hsl(${this.hue}, 100%, 65%)` : this.color;
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    const rx = this.isWillow ? Math.max(1.5, this.size * 2.8) : Math.max(1, this.size * 2);
    const ry = this.isWillow ? Math.max(0.8, this.size * 0.9) : Math.max(0.5, this.size * 0.6);
    ctx.ellipse(reflectX, reflectY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Ascending Rocket
export class Rocket {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  type: FireworkType;
  config: FireworkConfig;
  distanceToTarget: number;
  totalDistance: number;
  trail: { x: number; y: number; alpha: number; color: string }[];

  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    config: FireworkConfig,
    resolvedColor: string
  ) {
    this.x = startX;
    this.y = startY;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.config = config;
    this.color = resolvedColor;
    this.type = config.type;

    const dx = targetX - startX;
    const dy = targetY - startY;
    this.totalDistance = Math.hypot(dx, dy);
    this.distanceToTarget = this.totalDistance;

    const angle = Math.atan2(dy, dx);
    const speed = (Math.hypot(dx, dy) / 38) * config.rocketSpeed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.trail = [];

    // Trigger audio launch whistle with pitch scaling with speed
    if (config.soundEnabled) {
      const flightDuration = Math.max(0.4, Math.min(1.8, this.totalDistance / (speed * 60)));
      audioEngine.playLaunch(flightDuration, config.rocketSpeed);
    }
  }

  update(): boolean {
    this.trail.unshift({
      x: this.x,
      y: this.y,
      alpha: 1,
      color: '#ffd166',
    });

    if (this.trail.length > 10) {
      this.trail.pop();
    }

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= 0.09;
    }

    this.x += this.vx;
    this.y += this.vy;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    this.distanceToTarget = Math.hypot(dx, dy);

    return this.distanceToTarget > 12 && this.y > this.targetY;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      if (p.alpha <= 0) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      const r = 2.5 * (1 - i / this.trail.length);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Sky Ambient Flash (illuminates night clouds & castle when shell detonates)
export class SkyFlash {
  x: number;
  y: number;
  color: string;
  radius: number;
  alpha: number;
  decay: number;

  constructor(x: number, y: number, color: string, radius = 350) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.alpha = 0.38;
    this.decay = 0.038;
  }

  update(): boolean {
    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.save();
    const grad = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, this.radius);
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Cinematic Pyro Smoke Particle (Grisáceo, sutil, expansivo y persistente)
export class SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  expansionRate: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;

  constructor(
    x: number,
    y: number,
    options?: {
      vx?: number;
      vy?: number;
      initialRadius?: number;
      maxRadius?: number;
      alpha?: number;
      decay?: number;
    }
  ) {
    this.x = x;
    this.y = y;
    this.vx = options?.vx ?? (Math.random() * 0.3 - 0.15);
    this.vy = options?.vy ?? (Math.random() * -0.25 - 0.05);
    this.radius = options?.initialRadius ?? (Math.random() * 3.5 + 2.5);
    this.maxRadius = options?.maxRadius ?? (this.radius * (Math.random() * 3.5 + 2.8));
    this.decay = options?.decay ?? (Math.random() * 0.0032 + 0.0022); // ~180-320 frames (~3.0 a 5.5 seg)
    const lifespanFrames = Math.max(80, 1 / this.decay);
    this.expansionRate = (this.maxRadius - this.radius) / (lifespanFrames * 0.75);
    this.alpha = options?.alpha ?? (Math.random() * 0.05 + 0.13);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.008 - 0.004;
  }

  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.985;
    this.vy *= 0.985;
    this.vy -= 0.006; // Corriente térmica suave ascendente

    if (this.radius < this.maxRadius) {
      this.radius += this.expansionRate;
    }
    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
    return this.alpha > 0;
  }

  draw(ctx: CanvasRenderingContext2D, ambientFlashBrightness: number = 0) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    const displayAlpha = Math.min(0.24, this.alpha);

    // Iluminación sutil cuando los destellos del show alumbran el cielo nocturno
    if (ambientFlashBrightness > 0.04) {
      const flashBoost = Math.min(0.12, ambientFlashBrightness * 0.18);
      grad.addColorStop(0, `rgba(215, 222, 238, ${displayAlpha + flashBoost})`);
      grad.addColorStop(0.5, `rgba(165, 175, 195, ${(displayAlpha + flashBoost) * 0.55})`);
      grad.addColorStop(1, 'rgba(120, 130, 150, 0)');
    } else {
      // Tono grisáceo sutil natural de humo pirotécnico nocturno
      grad.addColorStop(0, `rgba(168, 178, 196, ${displayAlpha})`);
      grad.addColorStop(0.5, `rgba(138, 148, 168, ${displayAlpha * 0.52})`);
      grad.addColorStop(1, 'rgba(100, 112, 130, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Main Fireworks Simulation Engine
export class FireworksEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trailCanvas: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private willowCanvas: HTMLCanvasElement;
  private willowCtx: CanvasRenderingContext2D;
  private shootingStar: ShootingStar = new ShootingStar();
  private stars: Star[] = [];
  private rockets: Rocket[] = [];
  private particles: Spark[] = [];
  private secondaryParticles: Spark[] = [];
  private smokeParticles: SmokeParticle[] = [];
  private flashes: SkyFlash[] = [];
  private constellationParticles: {
    x: number;
    y: number;
    destX: number;
    destY: number;
    color: string;
    size: number;
    alpha: number;
    phase: number;
    twinkleSpeed: number;
    spawnTime: number;
  }[] = [];
  private constellationEndTime = 0;
  private wordLifespanTimer: number | null = null;
  private isWordFadingOut: boolean = false;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private config: FireworkConfig;
  private autoShowTimeout: number | null = null;
  private rhythmTimeout: number | null = null;
  private beatCounter: number = 0;
  private dayNightInterval: number | null = null;
  private currentDayNightIndex: number = 0;
  private onStatsUpdate?: (stats: { particles: number; rockets: number }) => void;
  private onBeatUpdate?: (beat: number, isDownbeat: boolean) => void;
  private onSkyThemeChange?: (theme: SkyTheme, starIntensity: number, phaseName: string) => void;

  public setSkyThemeCallback(cb: (theme: SkyTheme, starIntensity: number, phaseName: string) => void) {
    this.onSkyThemeChange = cb;
  }

  constructor(canvas: HTMLCanvasElement, initialConfig: FireworkConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = 360;
    this.trailCanvas.height = 640;
    const tctx = this.trailCanvas.getContext('2d');
    if (!tctx) throw new Error('Could not get trail canvas context');
    this.trailCtx = tctx;

    // Cumulative buffer specifically designed for persistent Sauce Llorón (Golden Willow) waterfalls
    this.willowCanvas = document.createElement('canvas');
    this.willowCanvas.width = 360;
    this.willowCanvas.height = 640;
    const wctx = this.willowCanvas.getContext('2d');
    if (!wctx) throw new Error('Could not get willow canvas context');
    this.willowCtx = wctx;

    this.config = { ...initialConfig };

    this.resize();
    this.initStars();
  }

  public updateConfig(newConfig: Partial<FireworkConfig>) {
    const prevBpm = this.config.bpm;
    const prevRhythm = this.config.rhythmSync;
    const prevIntensity = this.config.starIntensity;
    this.config = { ...this.config, ...newConfig };

    // If star intensity changed, reinitialize star count
    if (newConfig.starIntensity !== undefined && newConfig.starIntensity !== prevIntensity) {
      this.initStars();
    }

    // If BPM changed or rhythm mode was toggled, update rhythm loop
    if (this.config.rhythmSync !== prevRhythm || (this.config.rhythmSync && this.config.bpm !== prevBpm)) {
      this.toggleRhythmSync(this.config.rhythmSync);
    }
  }

  public setStatsCallback(cb: (stats: { particles: number; rockets: number }) => void) {
    this.onStatsUpdate = cb;
  }

  public setBeatCallback(cb: (beat: number, isDownbeat: boolean) => void) {
    this.onBeatUpdate = cb;
  }

  public toggleRhythmSync(enable: boolean) {
    if (this.rhythmTimeout) {
      clearTimeout(this.rhythmTimeout);
      this.rhythmTimeout = null;
    }

    if (!enable) return;

    this.beatCounter = 0;

    const stepBeat = () => {
      if (!this.config.rhythmSync || this.rhythmTimeout === null) return;
      this.triggerRhythmBeat();
      const currentInterval = (60 / Math.max(50, Math.min(200, this.config.bpm || 120))) * 1000;
      this.rhythmTimeout = window.setTimeout(stepBeat, currentInterval);
    };

    const initialInterval = (60 / Math.max(50, Math.min(200, this.config.bpm || 120))) * 1000;
    this.triggerRhythmBeat();
    this.rhythmTimeout = window.setTimeout(stepBeat, initialInterval);
  }

  private triggerRhythmBeat() {
    this.beatCounter = (this.beatCounter + 1) % 4;
    const isDownbeat = this.beatCounter === 0;

    // Trigger audio beat kick/click
    if (this.config.soundEnabled) {
      audioEngine.playRhythmBeat(isDownbeat);
    }

    if (this.onBeatUpdate) {
      this.onBeatUpdate(this.beatCounter, isDownbeat);
    }

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const palettes = DISNEY_PALETTES;
    const pal = palettes[Math.floor(Math.random() * palettes.length)];

    if (isDownbeat) {
      // Beat 1 (Downbeat): Major magical centerpiece shell!
      const targetX = w * 0.5 + (Math.random() * 80 - 40);
      const targetY = h * 0.16 + Math.random() * (h * 0.16);
      const types: FireworkType[] = ['magic_shapes', 'double_core', 'ring', 'chrysanthemum'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      this.launchRocket(
        w * 0.5,
        h + 10,
        targetX,
        targetY,
        { ...this.config, type: chosenType, explosionForce: this.config.explosionForce * 1.15 },
        pal.primary
      );
    } else if (this.beatCounter === 2) {
      // Beat 3: Balanced dual tracers left & right
      this.launchRocket(
        w * 0.35,
        h + 10,
        w * 0.25 + (Math.random() * 40 - 20),
        h * 0.22 + Math.random() * (h * 0.15),
        { ...this.config, type: 'crossette', particleCount: Math.floor(this.config.particleCount * 0.6) },
        pal.colors[0]
      );
      this.launchRocket(
        w * 0.65,
        h + 10,
        w * 0.75 + (Math.random() * 40 - 20),
        h * 0.22 + Math.random() * (h * 0.15),
        { ...this.config, type: 'crossette', particleCount: Math.floor(this.config.particleCount * 0.6) },
        pal.colors[1 % pal.colors.length]
      );
    } else {
      // Beats 2 & 4: Rhythmic side accent firework
      const sideX = this.beatCounter === 1 ? w * 0.32 : w * 0.68;
      this.launchRocket(
        sideX,
        h + 10,
        sideX + (Math.random() * 40 - 20),
        h * 0.25 + Math.random() * (h * 0.15),
        { ...this.config, type: 'chrysanthemum', particleCount: Math.floor(this.config.particleCount * 0.5) },
        pal.primary
      );
    }
  }

  public resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const rawWidth = rect.width > 0 ? rect.width : (typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 360);
    const rawHeight = rect.height > 0 ? rect.height : (typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 640);
    const pixelWidth = Math.max(1, Math.round(rawWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(rawHeight * dpr));

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    if (this.trailCanvas) {
      this.trailCanvas.width = pixelWidth;
      this.trailCanvas.height = pixelHeight;
      this.trailCtx.resetTransform();
      this.trailCtx.scale(dpr, dpr);
    }

    if (this.willowCanvas) {
      this.willowCanvas.width = pixelWidth;
      this.willowCanvas.height = pixelHeight;
      this.willowCtx.resetTransform();
      this.willowCtx.scale(dpr, dpr);
    }

    this.initStars();
  }

  private initStars() {
    this.stars = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    // Organic starfield density (~130 to 240 stars depending on screen resolution)
    const baseDensity = Math.min(260, Math.max(90, Math.floor((width * height) / 4800)));
    const intensity = this.config.starIntensity ?? 1.0;
    const count = Math.floor(baseDensity * intensity);

    for (let i = 0; i < count; i++) {
      this.stars.push(new Star(width, height));
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public toggleAutoShow(enable: boolean) {
    if (this.autoShowTimeout) {
      clearTimeout(this.autoShowTimeout);
      this.autoShowTimeout = null;
    }

    if (this.dayNightInterval) {
      clearInterval(this.dayNightInterval);
      this.dayNightInterval = null;
    }

    if (!enable) return;

    // Ciclo Día-Noche automático durante el Auto Show: cambia la tonalidad del cielo y la intensidad de las estrellas cada 2 minutos (120,000 ms)
    if (this.config.dayNightCycle !== false) {
      this.dayNightInterval = window.setInterval(() => {
        if (!this.isRunning) return;
        this.advanceDayNightCycle();
      }, 120000); // 120,000 ms = 2 minutos
    }

    // Play initial magical star chime fanfare
    if (this.config.soundEnabled) {
      audioEngine.playMagicalChimes();
    }

    const scheduleNext = () => {
      if (this.autoShowTimeout === null) return;
      this.executeDisneyShowAct();
      const nextDelay = 1800 + Math.random() * 1500;
      this.autoShowTimeout = window.setTimeout(scheduleNext, nextDelay);
    };

    this.executeDisneyShowAct();
    this.autoShowTimeout = window.setTimeout(scheduleNext, 2200);
  }

  // Avanzar manualmente o automáticamente de fase en el Ciclo Día-Noche
  public advanceDayNightCycle() {
    this.currentDayNightIndex = (this.currentDayNightIndex + 1) % DAY_NIGHT_PHASES.length;
    const phase = DAY_NIGHT_PHASES[this.currentDayNightIndex];

    this.config.skyTheme = phase.theme;
    this.config.deepNightMode = phase.theme === 'deep_night';
    this.config.starIntensity = phase.starIntensity;

    if (this.onSkyThemeChange) {
      this.onSkyThemeChange(phase.theme, phase.starIntensity, phase.name);
    }
  }

  // Disney Show Coreography Act
  private executeDisneyShowAct() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const actPattern = Math.floor(Math.random() * 6);
    const allTypes: FireworkType[] = ['magic_shapes', 'willow', 'double_core', 'crossette', 'chrysanthemum', 'ring'];
    const palettes = DISNEY_PALETTES;

    const getRandomType = () => allTypes[Math.floor(Math.random() * allTypes.length)];
    const getRandomPalette = () => palettes[Math.floor(Math.random() * palettes.length)];

    switch (actPattern) {
      case 0: {
        // Magical Shapes (Star, Heart, or Mickey) right above Castle Spire
        const pal = getRandomPalette();
        this.launchRocket(
          w * 0.5 + (Math.random() * 30 - 15),
          h + 10,
          w * 0.5 + (Math.random() * 40 - 20),
          h * 0.18 + Math.random() * (h * 0.15),
          { ...this.config, type: 'magic_shapes' },
          pal.primary
        );
        if (this.config.soundEnabled && Math.random() > 0.4) {
          audioEngine.playMagicalChimes();
        }
        break;
      }
      case 1: {
        // Crossette Fan Behind Castle Towers (3 angled shots)
        const pal = getRandomPalette();
        const positions = [0.25, 0.5, 0.75];
        positions.forEach((xFrac, i) => {
          setTimeout(() => {
            this.launchRocket(
              w * 0.5 + (i - 1) * 70,
              h + 10,
              w * xFrac + (Math.random() * 30 - 15),
              h * 0.16 + Math.random() * (h * 0.22),
              { ...this.config, type: 'crossette' },
              pal.colors[i % pal.colors.length]
            );
          }, i * 180);
        });
        break;
      }
      case 2: {
        // Double Core Enchanted Salvo
        const pal1 = getRandomPalette();
        const pal2 = getRandomPalette();
        this.launchRocket(
          w * 0.32,
          h + 10,
          w * 0.35 + (Math.random() * 20 - 10),
          h * 0.2 + (Math.random() * 40 - 20),
          { ...this.config, type: 'double_core' },
          pal1.primary
        );
        setTimeout(() => {
          this.launchRocket(
            w * 0.68,
            h + 10,
            w * 0.65 + (Math.random() * 20 - 10),
            h * 0.2 + (Math.random() * 40 - 20),
            { ...this.config, type: 'double_core' },
            pal2.primary
          );
        }, 220);
        break;
      }
      case 3: {
        // Golden Starlight Willow Curtain Cascading over Castle
        const startX = w * 0.48 + (Math.random() * 40 - 20);
        const targetX = w * 0.5 + (Math.random() * 30 - 15);
        const targetY = h * 0.12 + Math.random() * (h * 0.18);
        this.launchRocket(
          startX,
          h + 10,
          targetX,
          targetY,
          { ...this.config, type: 'willow', explosionForce: 1.3 },
          '#ffd13b'
        );
        break;
      }
      case 4: {
        // Saturn Ring with glowing center
        const pal = getRandomPalette();
        this.launchRocket(
          w * 0.5 + (Math.random() * 100 - 50),
          h + 10,
          w * 0.5 + (Math.random() * 120 - 60),
          h * 0.17 + Math.random() * (h * 0.22),
          { ...this.config, type: 'ring' },
          pal.primary
        );
        break;
      }
      case 5:
      default: {
        // Symphonic Chrysanthemum Pair
        const pal = getRandomPalette();
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const startX = w * 0.25 + i * (w * 0.5) + (Math.random() * 40 - 20);
            const targetX = startX + (Math.random() * 40 - 20);
            const targetY = h * 0.16 + Math.random() * (h * 0.25);
            this.launchRocket(startX, h + 10, targetX, targetY, { ...this.config, type: 'chrysanthemum' }, pal.primary);
          }, i * 320);
        }
        break;
      }
    }
  }

  // Disney Grand Finale: 20+ multi-tier choreographed shells
  public triggerGrandFinale(forcedWord?: string) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (this.config.soundEnabled) {
      audioEngine.playMagicalChimes();
    }

    // 1. Secuencia intensa y masiva de fuegos artificiales de estilo Disney
    const count = 22;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const startX = w * 0.1 + Math.random() * (w * 0.8);
        const targetX = w * 0.08 + Math.random() * (w * 0.84);
        const targetY = h * 0.1 + Math.random() * (h * 0.42);

        const types: FireworkType[] = ['magic_shapes', 'willow', 'double_core', 'crossette', 'chrysanthemum', 'ring'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const palettes = DISNEY_PALETTES;
        const chosenPalette = palettes[Math.floor(Math.random() * palettes.length)];

        const finaleConfig: FireworkConfig = {
          ...this.config,
          type: chosenType,
          particleCount: Math.floor(this.config.particleCount * 0.95),
          explosionForce: this.config.explosionForce * (0.95 + Math.random() * 0.35),
        };

        this.launchRocket(startX, h + 10, targetX, targetY, finaleConfig, chosenPalette.primary);
      }, i * 140 + Math.random() * 70);
    }

    // 2. AL TERMINAR la lluvia de cohetes, el cielo hace una pausa dramática y se limpia.
    const finaleEndTime = count * 140 + 1000;
    setTimeout(() => {
      if (!this.isRunning) return;
      this.clearSkyResiduals();
    }, finaleEndTime);

    // 3. Inmediatamente después (1 segundo exacto de silencio dramático tras limpiarse el cielo):
    // Explota un último cohete especial en el centro de la pantalla que despliega y deja fijas en el cielo, brillando como estrellas estáticas, una palabra elegida al azar
    const dramaticPauseDelay = finaleEndTime + 1000; // 1 segundo exacto de pausa dramática en silencio

    setTimeout(() => {
      if (!this.isRunning) return;
      const chosenRandomWord = forcedWord || FAMILY_NAMES[Math.floor(Math.random() * FAMILY_NAMES.length)];
      this.triggerFamilyWord(chosenRandomWord);
    }, dramaticPauseDelay);
  }

  // Limpieza total del cielo nocturno tras el Gran Final
  public clearSkyResiduals() {
    if (this.wordLifespanTimer !== null) {
      clearTimeout(this.wordLifespanTimer);
      this.wordLifespanTimer = null;
    }
    this.isWordFadingOut = false;
    this.constellationParticles = [];
    this.particles = [];
    this.rockets = [];
    this.smokeParticles = [];
    this.flashes = [];
    if (this.willowCtx && this.willowCanvas.width > 0 && this.willowCanvas.height > 0) {
      this.willowCtx.clearRect(0, 0, this.willowCanvas.width, this.willowCanvas.height);
    }
    if (this.trailCtx && this.trailCanvas.width > 0 && this.trailCanvas.height > 0) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
    }
  }

  // Inicia la transición suave de desvanecimiento (fade-out) para las partículas de la palabra
  public initiateWordFadeOut() {
    this.isWordFadingOut = true;
    this.constellationEndTime = Math.min(this.constellationEndTime, Date.now());
  }

  // Lanzamiento directo del Cohete Especial con Nombre Familiar
  public triggerFamilyWord(word?: string) {
    if (this.wordLifespanTimer !== null) {
      clearTimeout(this.wordLifespanTimer);
      this.wordLifespanTimer = null;
    }
    this.isWordFadingOut = false;

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const chosenWord = word || this.config.signatureWord || FAMILY_NAMES[Math.floor(Math.random() * FAMILY_NAMES.length)];

    const signatureConfig: FireworkConfig = {
      ...this.config,
      type: 'altair_signature',
      signatureWord: chosenWord,
      explosionForce: 1.45,
      rocketSpeed: 1.15,
    };

    // Cohete dorado que asciende majestuoso desde la base hasta el centro del firmamento
    this.launchRocket(w * 0.5, h + 10, w * 0.5, h * 0.28, signatureConfig, '#ffd700');

    // Temporizador de 5 segundos de ciclo de vida para las partículas de la palabra:
    // Estima el tiempo de ascenso del cohete (~550ms) y añade 5000ms de permanencia estelar
    // antes de activar automáticamente el desvanecimiento progresivo suave (smooth fade-out)
    const flightFrames = 38 / signatureConfig.rocketSpeed;
    const estimatedFlightTimeMs = (flightFrames / 60) * 1000;
    const WORD_LIFESPAN_MS = 5000;

    this.constellationEndTime = Date.now() + estimatedFlightTimeMs + WORD_LIFESPAN_MS;

    this.wordLifespanTimer = window.setTimeout(() => {
      this.initiateWordFadeOut();
    }, estimatedFlightTimeMs + WORD_LIFESPAN_MS);
  }

  // Lanzamiento directo del Cohete Especial Firma "ALTAIR" (compatibilidad)
  public triggerAltairSignature() {
    this.triggerFamilyWord('Altair');
  }

  // Golden Rain Starlight Cascade
  public triggerGoldenRain() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const count = 7;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const startX = (w / (count + 1)) * (i + 1) + (Math.random() * 30 - 15);
        const targetX = startX + (Math.random() * 40 - 20);
        const targetY = h * 0.16 + Math.random() * (h * 0.2);

        const willowConfig: FireworkConfig = {
          ...this.config,
          type: 'willow',
          particleCount: Math.floor(this.config.particleCount * 1.2),
          explosionForce: 1.25,
        };

        this.launchRocket(startX, h + 10, targetX, targetY, willowConfig, '#ffd13b');
      }, i * 200);
    }
  }

  public launchAt(targetX: number, targetY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const startX = w * 0.5 + (targetX - w * 0.5) * 0.35 + (Math.random() * 40 - 20);
    const startY = h + 15;

    const resolvedColor = this.resolveColor(this.config);
    this.launchRocket(startX, startY, targetX, targetY, this.config, resolvedColor);
  }

  private launchRocket(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    config: FireworkConfig,
    color: string
  ) {
    this.rockets.push(new Rocket(startX, startY, targetX, targetY, config, color));
  }

  private resolveColor(cfg: FireworkConfig): string {
    if (cfg.colorScheme === 'custom') {
      return cfg.customColor || '#ff2a85';
    }

    if (cfg.colorScheme === 'rainbow') {
      const colors = ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00d2ff', '#d500f9'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    const preset = DISNEY_PALETTES.find((p) => p.id === cfg.colorScheme);
    if (preset) {
      return preset.colors[Math.floor(Math.random() * preset.colors.length)];
    }

    return '#ffd13b';
  }

  private getColorPool(cfg: FireworkConfig): string[] {
    if (cfg.colorScheme === 'custom') {
      return [cfg.customColor || '#ff2a85'];
    }

    if (cfg.colorScheme === 'rainbow' || cfg.type === 'double_core') {
      return ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00d2ff', '#d500f9', '#ffffff'];
    }

    const preset = DISNEY_PALETTES.find((p) => p.id === cfg.colorScheme);
    return preset ? preset.colors : ['#ffd13b', '#ffb703', '#ffffff'];
  }

  private detonate(rocket: Rocket) {
    const { x, y, config, color } = rocket;
    const colors = this.getColorPool(config);

    // Audio explosion sound
    if (config.soundEnabled) {
      const isHeavy = config.type === 'willow' || config.type === 'double_core';
      audioEngine.playExplosion(config.explosionForce, isHeavy);

      if (config.type === 'willow' || config.type === 'chrysanthemum' || Math.random() > 0.35) {
        audioEngine.playCrackles(Math.floor(config.particleCount / 16), 0.35);
      }
    }

    // Sky Flash
    this.flashes.push(new SkyFlash(x, y, color, 320 * config.explosionForce));

    // Capa de humo grisáceo sutil post-explosión con persistencia volumétrica
    if (config.cinematicSmoke !== false) {
      this.emitExplosionSmoke(x, y, config.explosionForce);
    }

    let effectiveType = config.type;
    if (effectiveType === 'random') {
      const pool: FireworkType[] = ['magic_shapes', 'willow', 'double_core', 'crossette', 'chrysanthemum', 'ring'];
      effectiveType = pool[Math.floor(Math.random() * pool.length)];
    }

    const count = config.particleCount;
    const force = config.explosionForce;

    switch (effectiveType) {
      case 'altair_signature': {
        // Cohete Especial Firma y Nombres Familiares: 'ALTAIR', 'mamá', 'papá', 'abuela', 'abuelo', 'tía', 'Sofi'
        const currentWord =
          config.signatureWord ||
          FAMILY_NAMES[Math.floor(Math.random() * FAMILY_NAMES.length)];

        if (config.soundEnabled) {
          audioEngine.playFamilyWordSound(currentWord);
        }

        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || window.innerWidth;
        const letterScale = Math.min(1.0, Math.max(0.65, (w * 0.85) / 540));
        const pts = getWordLetterPoints(currentWord);
        const now = Date.now();

        // Inicializar Constelación Estática para exactamente 5 segundos
        this.constellationParticles = [];
        this.constellationEndTime = now + 5000;
        this.isWordFadingOut = false;

        // Temporizador de 5 segundos de ciclo de vida sincronizado con el estallido
        if (this.wordLifespanTimer !== null) {
          clearTimeout(this.wordLifespanTimer);
        }
        this.wordLifespanTimer = window.setTimeout(() => {
          this.initiateWordFadeOut();
        }, 5000);

        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          const destX = x + pt.dx * letterScale;
          const destY = y + pt.dy * letterScale;
          const isWhite = i % 3 === 0;

          this.constellationParticles.push({
            x: x + (Math.random() * 16 - 8),
            y: y + (Math.random() * 16 - 8),
            destX,
            destY,
            color: isWhite ? '#ffffff' : (i % 2 === 0 ? '#ffd700' : '#ffe484'),
            size: Math.random() * 0.8 + 2.2,
            alpha: 1.0,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.08 + 0.04,
            spawnTime: now,
          });
        }

        // 2. Halo de destellos dorados y micro-estrellas centelleantes que enmarcan la firma
        const haloCount = 28;
        for (let i = 0; i < haloCount; i++) {
          const angle = (i / haloCount) * Math.PI * 2;
          const spd = (Math.random() * 1.6 + 4.0) * force;
          this.particles.push(
            new Spark(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, '#ffea79', {
              size: 2.0,
              decay: 0.016,
              drag: 0.96,
              gravity: 0.035,
              hasCrackle: true,
              flicker: true,
            })
          );
        }
        break;
      }

      case 'magic_shapes': {
        // Disney Magic Shapes: Star, Heart, or Mickey Silhouette!
        const shapeMode = Math.random();

        if (shapeMode < 0.35) {
          // Mickey Silhouette (3 circles: 1 head + 2 ears!)
          const headCount = Math.floor(count * 0.55);
          const earCount = Math.floor(count * 0.22);
          const headR = 3.6 * force;
          const earR = 2.1 * force;
          const earDist = 3.8 * force;

          // Head circle
          for (let i = 0; i < headCount; i++) {
            const angle = (i / headCount) * Math.PI * 2;
            const vx = Math.cos(angle) * headR;
            const vy = Math.sin(angle) * headR;
            this.particles.push(
              new Spark(x, y, vx, vy, color, {
                size: 2.2,
                decay: 0.013,
                drag: 0.965,
                gravity: 0.035,
                maxHistory: 4,
              })
            );
          }

          // Left Ear circle
          const leftEarCenter = { x: -Math.cos(Math.PI / 4) * earDist, y: -Math.sin(Math.PI / 4) * earDist };
          for (let i = 0; i < earCount; i++) {
            const angle = (i / earCount) * Math.PI * 2;
            const vx = leftEarCenter.x + Math.cos(angle) * earR;
            const vy = leftEarCenter.y + Math.sin(angle) * earR;
            this.particles.push(
              new Spark(x, y, vx, vy, color, {
                size: 2.0,
                decay: 0.013,
                drag: 0.965,
                gravity: 0.035,
                maxHistory: 4,
              })
            );
          }

          // Right Ear circle
          const rightEarCenter = { x: Math.cos(Math.PI / 4) * earDist, y: -Math.sin(Math.PI / 4) * earDist };
          for (let i = 0; i < earCount; i++) {
            const angle = (i / earCount) * Math.PI * 2;
            const vx = rightEarCenter.x + Math.cos(angle) * earR;
            const vy = rightEarCenter.y + Math.sin(angle) * earR;
            this.particles.push(
              new Spark(x, y, vx, vy, color, {
                size: 2.0,
                decay: 0.013,
                drag: 0.965,
                gravity: 0.035,
                maxHistory: 4,
              })
            );
          }
        } else if (shapeMode < 0.68) {
          // 5-Pointed Fairy Star
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            // Star radius formula: 5 points
            const starR = (Math.cos(5 * angle) * 0.4 + 0.8) * 4.8 * force;
            const vx = Math.cos(angle - Math.PI / 2) * starR;
            const vy = Math.sin(angle - Math.PI / 2) * starR;
            this.particles.push(
              new Spark(x, y, vx, vy, color, {
                size: 2.2,
                decay: 0.012,
                drag: 0.968,
                gravity: 0.036,
                maxHistory: 5,
                hasCrackle: true,
              })
            );
          }
        } else {
          // Princess Romantic Heart
          for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;
            const hx = 16 * Math.pow(Math.sin(t), 3);
            const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            const scale = 0.32 * force;
            this.particles.push(
              new Spark(x, y, hx * scale, hy * scale, color, {
                size: 2.2,
                decay: 0.012,
                drag: 0.968,
                gravity: 0.034,
                maxHistory: 4,
              })
            );
          }
        }
        break;
      }

      case 'double_core': {
        // Core / Pistil Shell: inner bright sphere + expanding outer shell with secondary pops!
        const innerCount = Math.floor(count * 0.35);
        const outerCount = Math.floor(count * 0.65);
        const innerColor = '#ffffff';
        const outerColor = colors[0];

        // Inner glowing core
        for (let i = 0; i < innerCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 2.2 + 0.5) * force;
          this.particles.push(
            new Spark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, innerColor, {
              size: 2.4,
              decay: 0.018,
              drag: 0.95,
              gravity: 0.03,
              flicker: true,
            })
          );
        }

        // Outer expanding shell
        for (let i = 0; i < outerCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 2.0 + 4.8) * force;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const spark = new Spark(x, y, vx, vy, outerColor, {
            size: 2.2,
            decay: 0.011,
            drag: 0.966,
            gravity: 0.04,
            maxHistory: 5,
            hasCrackle: true,
          });
          this.particles.push(spark);

          // Secondary mini pop at 400ms!
          setTimeout(() => {
            if (this.isRunning) {
              const secondaryColor = colors[i % colors.length];
              for (let s = 0; s < 4; s++) {
                const sAngle = Math.random() * Math.PI * 2;
                const sSpeed = Math.random() * 1.8 + 0.5;
                this.particles.push(
                  new Spark(spark.x, spark.y, Math.cos(sAngle) * sSpeed, Math.sin(sAngle) * sSpeed, secondaryColor, {
                    size: 1.6,
                    decay: 0.022,
                    drag: 0.94,
                    gravity: 0.035,
                    flicker: true,
                  })
                );
              }
            }
          }, 380 + Math.random() * 120);
        }
        break;
      }

      case 'crossette': {
        // Crossette: Comets that cleanly split into 4-way cross bursts at mid-flight!
        const cometCount = 8;
        for (let c = 0; c < cometCount; c++) {
          const baseAngle = (c / cometCount) * Math.PI * 2 + (Math.random() * 0.1 - 0.05);
          const cometSpeed = 5.2 * force;
          const vx = Math.cos(baseAngle) * cometSpeed;
          const vy = Math.sin(baseAngle) * cometSpeed;
          const cometColor = colors[c % colors.length];

          const leadSpark = new Spark(x, y, vx, vy, cometColor, {
            size: 3.0,
            decay: 0.018,
            drag: 0.97,
            gravity: 0.038,
            maxHistory: 8,
          });
          this.particles.push(leadSpark);

          // Split into 4-way cross at 360ms
          setTimeout(() => {
            if (this.isRunning) {
              const crossSpeed = 2.4 * force;
              const crossAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
              crossAngles.forEach((a) => {
                this.particles.push(
                  new Spark(
                    leadSpark.x,
                    leadSpark.y,
                    Math.cos(baseAngle + a) * crossSpeed,
                    Math.sin(baseAngle + a) * crossSpeed,
                    '#ffffff',
                    {
                      size: 2.2,
                      decay: 0.014,
                      drag: 0.96,
                      gravity: 0.04,
                      maxHistory: 5,
                      hasCrackle: true,
                    }
                  )
                );
              });
            }
          }, 360);
        }
        break;
      }

      case 'willow': {
        // Sauce Llorón / Oro Estelar (Kamuro Starlight Gold) con estelas persistentes acumulativas
        const willowColors =
          config.colorScheme === 'silver'
            ? ['#ffffff', '#e0f2fe', '#bae6fd']
            : ['#ffd13b', '#ffb703', '#fff3b0', '#ffe066', '#ffa200'];

        const willowCount = Math.floor(count * 1.35);
        for (let i = 0; i < willowCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 4.6 + 0.9) * force;
          const vx = Math.cos(angle) * speed;
          // Impulso inicial explosivo con caída continua en cascada gravitacional pesada
          const vy = Math.sin(angle) * speed * 0.7 - 1.6;
          const c = willowColors[Math.floor(Math.random() * willowColors.length)];

          this.particles.push(
            new Spark(x, y, vx, vy, c, {
              size: Math.random() * 2.4 + 1.4,
              decay: Math.random() * 0.0036 + 0.0028, // Larga persistencia (~270-360 frames / ~4.5 a 6.0 segundos)
              drag: 0.968,
              gravity: 0.062, // Caída en cascada de sauce llorón suave y fluida
              maxHistory: 20,
              flicker: true,
              hasCrackle: Math.random() > 0.35,
              isWillow: true,
            })
          );
        }
        break;
      }

      case 'ring': {
        // Kikaku / Anillo Saturno
        const ringColor = colors[0];
        const innerColor = colors[colors.length - 1];

        for (let i = 0; i < count * 0.75; i++) {
          const angle = (i / (count * 0.75)) * Math.PI * 2;
          const speed = (5.5 + (Math.random() * 0.4 - 0.2)) * force;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed * 0.88;

          this.particles.push(
            new Spark(x, y, vx, vy, ringColor, {
              size: 2.0,
              decay: Math.random() * 0.014 + 0.012,
              drag: 0.968,
              gravity: 0.035,
              maxHistory: 4,
            })
          );
        }

        for (let i = 0; i < count * 0.25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.2 * force;
          this.particles.push(
            new Spark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, innerColor, {
              size: 2.2,
              decay: Math.random() * 0.018 + 0.014,
              drag: 0.95,
              gravity: 0.03,
              flicker: true,
            })
          );
        }
        break;
      }

      case 'chrysanthemum':
      default: {
        // Classic dense spherical Chrysanthemum
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.pow(Math.random(), 0.5) * 5.6 + 0.8) * force;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const c = colors[Math.floor(Math.random() * colors.length)];

          this.particles.push(
            new Spark(x, y, vx, vy, c, {
              size: Math.random() * 2.2 + 1.2,
              decay: Math.random() * 0.014 + 0.01,
              drag: 0.966,
              gravity: 0.042,
              maxHistory: 5,
              flicker: true,
              hasCrackle: true,
            })
          );
        }
        break;
      }
    }
  }

  // Draw Sky Atmosphere, Twinkling Starfield, Background Scenery and Lagoon Water
  private drawSkyAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    const isDeepNight = this.config.deepNightMode || this.config.skyTheme === 'deep_night';

    // 1. Pristine Full Deep night sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isDeepNight) {
      // Modo Nocturno Profundo: Negro azabache puro y azul abisal ultra-oscuro para contraste OLED infinito
      skyGrad.addColorStop(0, '#000002');
      skyGrad.addColorStop(0.5, '#010207');
      skyGrad.addColorStop(0.82, '#030510');
      skyGrad.addColorStop(1, '#050916');
    } else if (this.config.skyTheme === 'twilight') {
      skyGrad.addColorStop(0, '#0e0820');
      skyGrad.addColorStop(0.55, '#300e3e');
      skyGrad.addColorStop(1, '#691e3a');
    } else if (this.config.skyTheme === 'dawn') {
      skyGrad.addColorStop(0, '#091228');
      skyGrad.addColorStop(0.55, '#1a2b4d');
      skyGrad.addColorStop(1, '#583e58');
    } else {
      skyGrad.addColorStop(0, '#03050e');
      skyGrad.addColorStop(0.55, '#070c1c');
      skyGrad.addColorStop(1, '#0c142a');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cielo Estrellado: Pequeñas estrellas parpadeantes de fondo con opacidad que fluctúa suavemente
    // sin interferir con las explosiones (dimming suave adaptativo durante destellos pirotécnicos)
    if (this.config.starrySky !== false) {
      // Calcular brillo acumulado de los destellos de explosiones en el cielo
      let totalFlash = 0;
      for (let i = 0; i < this.flashes.length; i++) {
        totalFlash += this.flashes[i].alpha;
      }

      // Adaptación pupilar suave: cuando una bomba estalla, las estrellas se atenúan sutilmente
      // para no restar impacto ni interferir con la pirotecnia, y vuelven a emerger suavemente
      const flashDimming = Math.max(0.18, 1.0 - Math.min(0.82, totalFlash * 0.7));

      let themeMultiplier = 1.0;
      if (this.config.skyTheme === 'twilight') themeMultiplier = 0.65;
      else if (this.config.skyTheme === 'dawn') themeMultiplier = 0.35;

      const starVisibility = (this.config.starIntensity ?? 1.0) * flashDimming * themeMultiplier;

      for (let i = 0; i < this.stars.length; i++) {
        this.stars[i].update();
        this.stars[i].draw(ctx, starVisibility);
      }

      // Estrella fugaz ocasional mágica (Wish upon a star)
      if (this.shootingStar) {
        if (this.shootingStar.update()) {
          this.shootingStar.draw(ctx);
        } else if (Math.random() < 0.002) {
          this.shootingStar.spawn(width, height);
        }
      }
    }

    ctx.restore();
  }

  // Draw Thematic Disney Scenarios
  private drawScenario(ctx: CanvasRenderingContext2D, width: number, height: number, waterY: number) {
    const scenario = this.config.scenario || 'castle';
    if (scenario === 'minimal') {
      // Minimalist: distant mountains
      ctx.fillStyle = '#020409';
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        const y = waterY - (i % 2 === 0 ? 15 : 6);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, waterY);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (scenario === 'castle') {
      this.drawDisneyCastle(ctx, width, waterY);
    } else if (scenario === 'tomorrowland') {
      this.drawTomorrowland(ctx, width, waterY);
    } else if (scenario === 'jungle') {
      this.drawJungleKingdom(ctx, width, waterY);
    }
  }

  // 1. Classic Disney Fairy Tale Castle
  private drawDisneyCastle(ctx: CanvasRenderingContext2D, width: number, waterY: number) {
    const cx = width * 0.5;
    const s = Math.min(1.0, Math.max(0.65, width / 420));
    ctx.save();

    // Ambient castle illumination glow
    const castleGlow = ctx.createRadialGradient(cx, waterY - 80 * s, 15 * s, cx, waterY - 80 * s, 200 * s);
    castleGlow.addColorStop(0, 'rgba(0, 162, 255, 0.20)');
    castleGlow.addColorStop(0.5, 'rgba(255, 105, 180, 0.12)');
    castleGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = castleGlow;
    ctx.fillRect(cx - 200 * s, waterY - 240 * s, 400 * s, 240 * s);

    // Castle Silhouette
    ctx.fillStyle = '#030611';
    ctx.beginPath();
    ctx.moveTo(cx - 180 * s, waterY);

    // Left outer wall and gate
    ctx.lineTo(cx - 180 * s, waterY - 30 * s);
    ctx.lineTo(cx - 150 * s, waterY - 30 * s);
    ctx.lineTo(cx - 150 * s, waterY - 70 * s); // Left outer tower
    ctx.lineTo(cx - 135 * s, waterY - 110 * s); // Left cone roof
    ctx.lineTo(cx - 120 * s, waterY - 70 * s);
    ctx.lineTo(cx - 120 * s, waterY - 45 * s);

    // Left mid tower
    ctx.lineTo(cx - 90 * s, waterY - 45 * s);
    ctx.lineTo(cx - 90 * s, waterY - 115 * s);
    ctx.lineTo(cx - 75 * s, waterY - 165 * s); // Left high spire
    ctx.lineTo(cx - 60 * s, waterY - 115 * s);
    ctx.lineTo(cx - 60 * s, waterY - 60 * s);

    // Central Main Spire / Clock tower
    ctx.lineTo(cx - 38 * s, waterY - 85 * s);
    ctx.lineTo(cx - 38 * s, waterY - 155 * s);
    ctx.lineTo(cx - 18 * s, waterY - 185 * s);
    ctx.lineTo(cx, waterY - 235 * s); // Main tallest spire tip
    ctx.lineTo(cx + 18 * s, waterY - 185 * s);
    ctx.lineTo(cx + 38 * s, waterY - 155 * s);
    ctx.lineTo(cx + 38 * s, waterY - 85 * s);

    // Right mid tower
    ctx.lineTo(cx + 60 * s, waterY - 60 * s);
    ctx.lineTo(cx + 60 * s, waterY - 115 * s);
    ctx.lineTo(cx + 75 * s, waterY - 165 * s); // Right high spire
    ctx.lineTo(cx + 90 * s, waterY - 115 * s);
    ctx.lineTo(cx + 90 * s, waterY - 45 * s);

    // Right outer tower
    ctx.lineTo(cx + 120 * s, waterY - 45 * s);
    ctx.lineTo(cx + 120 * s, waterY - 70 * s);
    ctx.lineTo(cx + 135 * s, waterY - 110 * s);
    ctx.lineTo(cx + 150 * s, waterY - 70 * s);
    ctx.lineTo(cx + 150 * s, waterY - 30 * s);
    ctx.lineTo(cx + 180 * s, waterY - 30 * s);
    ctx.lineTo(cx + 180 * s, waterY);

    ctx.closePath();
    ctx.fill();

    // Golden glowing spire tip & royal clock window
    ctx.fillStyle = '#ffecb3';
    ctx.beginPath();
    ctx.arc(cx, waterY - 145 * s, Math.max(3, 5 * s), 0, Math.PI * 2);
    ctx.fill();

    // Spire flag at top
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, waterY - 235 * s);
    ctx.lineTo(cx, waterY - 248 * s);
    ctx.lineTo(cx + 8 * s, waterY - 244 * s);
    ctx.lineTo(cx, waterY - 240 * s);
    ctx.stroke();

    // Castle windows warm glow
    ctx.fillStyle = '#ffdd80';
    ctx.globalAlpha = 0.85;
    const windowPositions = [
      { x: cx - 75 * s, y: waterY - 100 * s },
      { x: cx + 75 * s, y: waterY - 100 * s },
      { x: cx - 15 * s, y: waterY - 115 * s },
      { x: cx + 15 * s, y: waterY - 115 * s },
      { x: cx - 135 * s, y: waterY - 60 * s },
      { x: cx + 135 * s, y: waterY - 60 * s },
      { x: cx, y: waterY - 40 * s },
    ];
    windowPositions.forEach((wp) => {
      ctx.fillRect(wp.x - 2 * s, wp.y - 4 * s, 4 * s, 8 * s);
    });

    // Grand Premiere Searchlights sweeping behind the castle
    const now = Date.now();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const searchlights = [
      { x: cx - 140 * s, y: waterY - 20 * s, speed: 0.0009, offset: 0 },
      { x: cx - 60 * s, y: waterY - 30 * s, speed: 0.0011, offset: 1.2 },
      { x: cx + 60 * s, y: waterY - 30 * s, speed: 0.001, offset: 2.4 },
      { x: cx + 140 * s, y: waterY - 20 * s, speed: 0.0008, offset: 3.6 },
    ];

    searchlights.forEach((sl) => {
      const angle = -Math.PI / 2 + Math.sin(now * sl.speed + sl.offset) * 0.55;
      const beamLen = waterY * 0.95;
      const bx = sl.x + Math.cos(angle) * beamLen;
      const by = sl.y + Math.sin(angle) * beamLen;

      const beamGrad = ctx.createLinearGradient(sl.x, sl.y, bx, by);
      beamGrad.addColorStop(0, 'rgba(255, 235, 180, 0.28)');
      beamGrad.addColorStop(0.6, 'rgba(0, 190, 255, 0.12)');
      beamGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(sl.x - 3 * s, sl.y);
      ctx.lineTo(bx - 26 * s, by);
      ctx.lineTo(bx + 26 * s, by);
      ctx.lineTo(sl.x + 3 * s, sl.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }

  // 2. Tomorrowland: Futuristic Spire, Geodesic Dome, Neon skyline
  private drawTomorrowland(ctx: CanvasRenderingContext2D, width: number, waterY: number) {
    const cx = width * 0.5;
    ctx.save();

    // Neon Cybernetic Glow
    const neoGrad = ctx.createRadialGradient(cx, waterY - 60, 20, cx, waterY - 60, 260);
    neoGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    neoGrad.addColorStop(0.6, 'rgba(255, 0, 180, 0.12)');
    neoGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = neoGrad;
    ctx.fillRect(cx - 260, waterY - 200, 520, 200);

    // Tomorrowland Skyline
    ctx.fillStyle = '#03050e';
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    ctx.lineTo(0, waterY - 25);
    ctx.lineTo(cx - 200, waterY - 25);

    // Geodesic Dome / Space Mountain slope
    ctx.lineTo(cx - 150, waterY - 80);
    ctx.lineTo(cx - 100, waterY - 130);
    ctx.lineTo(cx - 70, waterY - 145); // Space Mountain peak
    ctx.lineTo(cx - 40, waterY - 70);

    // Central Cyber Spire
    ctx.lineTo(cx - 15, waterY - 90);
    ctx.lineTo(cx - 6, waterY - 220); // Needle tip
    ctx.lineTo(cx + 6, waterY - 220);
    ctx.lineTo(cx + 15, waterY - 90);

    // Right futuristic angular towers & monorail pylon
    ctx.lineTo(cx + 60, waterY - 110);
    ctx.lineTo(cx + 80, waterY - 160);
    ctx.lineTo(cx + 110, waterY - 90);
    ctx.lineTo(cx + 160, waterY - 50);
    ctx.lineTo(width, waterY - 20);
    ctx.lineTo(width, waterY);
    ctx.closePath();
    ctx.fill();

    // Neon cyan & magenta rim light beams
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 150, waterY - 80);
    ctx.lineTo(cx - 70, waterY - 145);
    ctx.lineTo(cx - 40, waterY - 70);
    ctx.stroke();

    ctx.strokeStyle = '#ff00aa';
    ctx.beginPath();
    ctx.moveTo(cx - 6, waterY - 220);
    ctx.lineTo(cx, waterY - 240); // Antenna beacon
    ctx.lineTo(cx + 6, waterY - 220);
    ctx.stroke();

    // Monorail elevated line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - 180, waterY - 32);
    ctx.lineTo(cx + 180, waterY - 32);
    ctx.stroke();

    // Tomorrowland Sweeping Laser Beams crossing the night sky!
    const now = Date.now();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const laserOrigins = [
      { x: cx - 70, y: waterY - 145, color: '#00f0ff', speed: 0.0012, phase: 0 },
      { x: cx, y: waterY - 220, color: '#ff00bb', speed: 0.0016, phase: 1.8 },
      { x: cx + 80, y: waterY - 160, color: '#00ff88', speed: 0.0014, phase: 3.2 },
    ];

    laserOrigins.forEach((laser) => {
      const angle = -Math.PI / 2 + Math.sin(now * laser.speed + laser.phase) * 0.72;
      const beamLength = width * 1.1;
      const lx = laser.x + Math.cos(angle) * beamLength;
      const ly = laser.y + Math.sin(angle) * beamLength;

      const grad = ctx.createLinearGradient(laser.x, laser.y, lx, ly);
      grad.addColorStop(0, laser.color);
      grad.addColorStop(0.7, laser.color);
      grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Laser emitter flare
      ctx.fillStyle = laser.color;
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }

  // 3. Adventureland / Jungle Kingdom: Exotic Palms & Ancient Temple
  private drawJungleKingdom(ctx: CanvasRenderingContext2D, width: number, waterY: number) {
    const cx = width * 0.5;
    ctx.save();

    // Warm torchlight ambient atmosphere
    const jungleGrad = ctx.createRadialGradient(cx, waterY - 50, 30, cx, waterY - 50, 240);
    jungleGrad.addColorStop(0, 'rgba(255, 140, 0, 0.2)');
    jungleGrad.addColorStop(0.6, 'rgba(0, 230, 118, 0.1)');
    jungleGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = jungleGrad;
    ctx.fillRect(cx - 240, waterY - 180, 480, 180);

    ctx.fillStyle = '#020608';
    ctx.beginPath();
    ctx.moveTo(0, waterY);

    // Ancient tiered Mayan/Khmer temple pyramid
    ctx.lineTo(cx - 160, waterY - 10);
    ctx.lineTo(cx - 120, waterY - 40);
    ctx.lineTo(cx - 95, waterY - 40);
    ctx.lineTo(cx - 80, waterY - 75);
    ctx.lineTo(cx - 60, waterY - 75);
    ctx.lineTo(cx - 45, waterY - 110);
    ctx.lineTo(cx + 45, waterY - 110); // Temple top sanctuary
    ctx.lineTo(cx + 60, waterY - 75);
    ctx.lineTo(cx + 80, waterY - 75);
    ctx.lineTo(cx + 95, waterY - 40);
    ctx.lineTo(cx + 120, waterY - 40);
    ctx.lineTo(cx + 160, waterY - 10);
    ctx.lineTo(width, waterY);
    ctx.closePath();
    ctx.fill();

    // Torch fire glow at temple peak
    ctx.fillStyle = '#ff9100';
    ctx.beginPath();
    ctx.arc(cx - 30, waterY - 115, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 30, waterY - 115, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Palm tree silhouettes framing the sides
    const drawPalm = (px: number, py: number, scale = 1.0) => {
      ctx.strokeStyle = '#020608';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 15 * scale, py - 40 * scale, px + 25 * scale, py - 90 * scale);
      ctx.stroke();

      // Fronds
      const tx = px + 25 * scale;
      const ty = py - 90 * scale;
      ctx.lineWidth = 2 * scale;
      for (let a = 0; a < 6; a++) {
        const frondAngle = (a / 6) * Math.PI - Math.PI / 1.1;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
          tx + Math.cos(frondAngle) * 35 * scale,
          ty + Math.sin(frondAngle) * 20 * scale,
          tx + Math.cos(frondAngle) * 55 * scale,
          ty + 25 * scale
        );
        ctx.stroke();
      }
    };

    drawPalm(cx - 180, waterY, 1.1);
    drawPalm(cx - 220, waterY, 0.9);
    drawPalm(cx + 180, waterY, 1.1);
    drawPalm(cx + 220, waterY, 0.9);

    ctx.restore();
  }

  // 4. Foreground Lake / Lagoon with Dynamic Fireworks Shimmer Reflection
  private drawWaterSurface(ctx: CanvasRenderingContext2D, width: number, height: number, waterY: number) {
    ctx.save();

    // Dark lagoon base
    const isDeepNight = this.config.deepNightMode || this.config.skyTheme === 'deep_night';
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, height);
    if (isDeepNight) {
      waterGrad.addColorStop(0, '#000104');
      waterGrad.addColorStop(0.35, '#010207');
      waterGrad.addColorStop(1, '#000002');
    } else {
      waterGrad.addColorStop(0, '#02050d');
      waterGrad.addColorStop(0.3, '#030814');
      waterGrad.addColorStop(1, '#010307');
    }
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, width, height - waterY);

    // Shoreline edge glow line
    ctx.strokeStyle = 'rgba(255, 235, 179, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    ctx.lineTo(width, waterY);
    ctx.stroke();

    // Dynamic water reflection of active explosion particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].drawReflection(ctx, waterY);
    }

    // Reflejo acumulativo de la cascada de Sauce Llorón en la superficie de la laguna
    if (this.willowCanvas && this.willowCanvas.width > 0 && this.willowCanvas.height > 0 && width > 0 && height > 0) {
      ctx.save();
      const glowReflect = (this.config.willowGlow ?? 1.25) * 0.26;
      ctx.globalAlpha = glowReflect;
      ctx.translate(0, waterY * 1.95);
      ctx.scale(1, -0.6);
      ctx.drawImage(this.willowCanvas, 0, 0, width, height);
      ctx.restore();
    }
    ctx.restore();

    ctx.restore();
  }

  private loop = () => {
    if (!this.isRunning) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = this.canvas.width / dpr;
    let height = this.canvas.height / dpr;

    if (width <= 0 || height <= 0 || this.canvas.width <= 0 || this.canvas.height <= 0) {
      this.resize();
      width = this.canvas.width / dpr;
      height = this.canvas.height / dpr;
      if (width <= 0 || height <= 0 || this.canvas.width <= 0 || this.canvas.height <= 0) {
        this.animationFrameId = requestAnimationFrame(this.loop);
        return;
      }
    }

    // 1. Trail Buffer: Desvanecimiento suave de estelas de pirotecnia con destination-out
    this.trailCtx.save();
    this.trailCtx.globalCompositeOperation = 'destination-out';
    const fadeRate = Math.max(0.12, Math.min(0.35, this.config.trailDuration));
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${fadeRate})`;
    this.trailCtx.fillRect(0, 0, width, height);
    this.trailCtx.restore();

    // 2. Buffer Acumulativo de Sauce Llorón (Golden Willow):
    // Desvanecimiento ultra-lento que permite a las partículas acumular fotones y dejar estelas incandescentes que perduran varios segundos
    this.willowCtx.save();
    this.willowCtx.globalCompositeOperation = 'destination-out';
    const persistence = this.config.willowPersistence ?? 0.985;
    const willowDecay = Math.max(0.008, Math.min(0.04, 1.0 - persistence));
    this.willowCtx.fillStyle = `rgba(0, 0, 0, ${willowDecay})`;
    this.willowCtx.fillRect(0, 0, width, height);
    this.willowCtx.restore();

    // 3. Renderizar Flashes y Cohetes en el buffer de estelas con mezcla aditiva
    this.trailCtx.save();
    this.trailCtx.globalCompositeOperation = 'lighter';

    // Sky Flashes
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      if (!flash.update()) {
        this.flashes.splice(i, 1);
      } else {
        flash.draw(this.trailCtx);
      }
    }

    // Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      if (!rocket.update()) {
        this.detonate(rocket);
        this.rockets.splice(i, 1);
      } else {
        rocket.draw(this.trailCtx);
        // Estela de humo sutil que sigue al cohete durante su ascenso
        if (this.config.cinematicSmoke !== false && Math.random() > 0.3) {
          this.emitRocketSmoke(rocket);
        }
      }
    }

    // Particles (Sparks) with mobile particle budget clamp (allow up to 800 for rich willow waterfalls)
    if (this.particles.length > 800) {
      this.particles.splice(0, this.particles.length - 800);
    }

    const glowMultiplier = this.config.willowGlow ?? 1.25;

    this.willowCtx.save();
    this.willowCtx.globalCompositeOperation = 'lighter';

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const spark = this.particles[i];
      if (!spark.update()) {
        this.particles.splice(i, 1);
      } else {
        if (spark.isWillow) {
          // Sauce Llorón se estampa incrementalmente en el buffer acumulativo: las estelas se superponen aditivamente
          spark.drawWillowAccumulative(this.willowCtx, glowMultiplier);
        } else {
          // Pirotecnia estándar en el buffer de estelas normales
          spark.draw(this.trailCtx);
        }
      }
    }
    this.willowCtx.restore();
    this.trailCtx.restore();

    // 4. Renderizar Atmósfera Celestial y Cielo Estrellado Parpadeante en el lienzo principal
    this.drawSkyAtmosphere(this.ctx, width, height);

    // 4.5. Capa de Humo Grisáceo Cinemático (detrás de las estelas y chispas de luz)
    if (this.config.cinematicSmoke !== false) {
      this.drawSmoke(this.ctx);
    }

    // 5. Componer Buffer Acumulativo de Sauce Llorón con mezcla aditiva hiper-brillante
    const isDeepNightMode = this.config.deepNightMode || this.config.skyTheme === 'deep_night';

    if (this.willowCanvas && this.willowCanvas.width > 0 && this.willowCanvas.height > 0 && width > 0 && height > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.drawImage(this.willowCanvas, 0, 0, width, height);

      // Pase secundario de resplandor bloom para estelas doradas hiper-brillantes (amplificado en Modo Nocturno Profundo)
      if (glowMultiplier > 1.15 || isDeepNightMode) {
        const extraBloom = isDeepNightMode ? 0.32 : 0;
        this.ctx.globalAlpha = Math.min(0.75, (glowMultiplier - 1.0) * 0.55 + extraBloom);
        this.ctx.drawImage(this.willowCanvas, 0, 0, width, height);
      }
      this.ctx.restore();
    }

    // 6. Componer Buffer de Fuegos Artificiales y Estelas estándar sobre el cielo estrellado
    if (this.trailCanvas && this.trailCanvas.width > 0 && this.trailCanvas.height > 0 && width > 0 && height > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.drawImage(this.trailCanvas, 0, 0, width, height);

      // Resplandor y luminosidad amplificada de partículas en Modo Nocturno Profundo
      if (isDeepNightMode) {
        this.ctx.globalAlpha = 0.32;
        this.ctx.drawImage(this.trailCanvas, 0, 0, width, height);
      }
      this.ctx.restore();
    }

    // 6.5. Renderizar Constelación de Nombres Familiares directamente en el lienzo principal con luz estelar
    if (this.constellationParticles.length > 0) {
      const now = Date.now();
      const remaining = this.constellationEndTime - now;

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';

      for (let i = this.constellationParticles.length - 1; i >= 0; i--) {
        const p = this.constellationParticles[i];
        const timeSinceSpawn = now - p.spawnTime;

        if (timeSinceSpawn < 250) {
          p.x += (p.destX - p.x) * 0.25;
          p.y += (p.destY - p.y) * 0.25;
        } else {
          p.x = p.destX;
          p.y = p.destY;
        }

        p.phase += p.twinkleSpeed;

        // Titilar suavemente como una constelación en el cielo durante exactamente 5 segundos
        if (remaining >= 0 && !this.isWordFadingOut) {
          p.alpha = 0.85 + Math.sin(p.phase) * 0.15;
        } else {
          // Luego desvanecerse progresivamente mediante transición suave
          p.alpha -= 0.016;
          if (p.alpha <= 0) {
            this.constellationParticles.splice(i, 1);
            continue;
          }
        }

        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        if (p.color === '#ffffff' && p.alpha > 0.65) {
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 0.75;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x - 3.5, p.y);
          this.ctx.lineTo(p.x + 3.5, p.y);
          this.ctx.moveTo(p.x, p.y - 3.5);
          this.ctx.lineTo(p.x, p.y + 3.5);
          this.ctx.stroke();
        }
      }

      this.ctx.restore();
    }

    // 7. Escenario Temático Disney en Primer Plano (Silueta de Castillo / Tomorrowland / Minimal)
    const waterY = height * 0.82;
    this.drawScenario(this.ctx, width, height, waterY);

    // 8. Superficie del Lago y Reflejos de Partículas
    this.drawWaterSurface(this.ctx, width, height, waterY);

    // Stats
    if (this.onStatsUpdate && (this.rockets.length > 0 || this.particles.length > 0)) {
      this.onStatsUpdate({
        particles: this.particles.length,
        rockets: this.rockets.length,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // Emisión de humo sutil a lo largo de la estela de ascenso del cohete
  private emitRocketSmoke(rocket: Rocket) {
    const density = this.config.smokeDensity ?? 1.0;
    const jitterX = Math.random() * 4 - 2;
    const jitterY = Math.random() * 4 - 2;
    this.smokeParticles.push(
      new SmokeParticle(rocket.x + jitterX, rocket.y + jitterY, {
        vx: rocket.vx * 0.08 + (Math.random() * 0.24 - 0.12),
        vy: rocket.vy * 0.08 + (Math.random() * -0.16 - 0.04),
        initialRadius: Math.random() * 2.8 + 2.2,
        maxRadius: Math.random() * 11 + 9,
        alpha: (Math.random() * 0.04 + 0.10) * density,
        decay: Math.random() * 0.0035 + 0.0024,
      })
    );
  }

  // Emisión de nube volumétrica de humo grisáceo sutil post-explosión
  private emitExplosionSmoke(x: number, y: number, force: number) {
    const density = this.config.smokeDensity ?? 1.0;
    const puffCount = Math.floor((Math.random() * 5 + 11) * density);
    for (let i = 0; i < puffCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 1.5 + 0.35) * force;
      this.smokeParticles.push(
        new SmokeParticle(
          x + Math.cos(angle) * (Math.random() * 14 * force),
          y + Math.sin(angle) * (Math.random() * 14 * force),
          {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (Math.random() * 0.28 + 0.06),
            initialRadius: (Math.random() * 7 + 8) * force,
            maxRadius: (Math.random() * 24 + 22) * force,
            alpha: (Math.random() * 0.05 + 0.14) * density,
            decay: Math.random() * 0.0026 + 0.0018, // ~4.0 a 6.8 segundos de bruma cinemática
          }
        )
      );
    }
  }

  // Renderizar Capa de Humo Grisáceo Cinemático
  private drawSmoke(ctx: CanvasRenderingContext2D) {
    if (this.smokeParticles.length === 0) return;

    if (this.smokeParticles.length > 250) {
      this.smokeParticles.splice(0, this.smokeParticles.length - 250);
    }

    let ambientFlash = 0;
    for (let i = 0; i < this.flashes.length; i++) {
      if (this.flashes[i].alpha > ambientFlash) {
        ambientFlash = this.flashes[i].alpha;
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const smoke = this.smokeParticles[i];
      if (!smoke.update()) {
        this.smokeParticles.splice(i, 1);
      } else {
        smoke.draw(ctx, ambientFlash);
      }
    }

    ctx.restore();
  }

  public destroy() {
    this.stop();
    if (this.wordLifespanTimer !== null) {
      clearTimeout(this.wordLifespanTimer);
      this.wordLifespanTimer = null;
    }
    if (this.autoShowTimeout) {
      clearTimeout(this.autoShowTimeout);
      this.autoShowTimeout = null;
    }
    if (this.dayNightInterval) {
      clearInterval(this.dayNightInterval);
      this.dayNightInterval = null;
    }
    if (this.rhythmTimeout) {
      clearTimeout(this.rhythmTimeout);
      this.rhythmTimeout = null;
    }
  }
}

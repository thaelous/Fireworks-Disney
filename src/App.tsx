import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Eye,
  EyeOff,
  Flame,
  Zap,
  Disc,
  Heart,
  Palette,
  HelpCircle,
  X,
  Castle,
  Rocket as RocketIcon,
  Moon,
  Radio,
  Download,
  RotateCcw,
  Music,
  Crown,
  Activity,
  Timer,
  ChevronUp,
  Star,
  Wind,
  Cloud,
  Sun,
  Users,
} from 'lucide-react';
import {
  FireworksEngine,
  FireworkConfig,
  FireworkType,
  DisneyScenario,
  DISNEY_PALETTES,
  FAMILY_NAMES,
  FamilyName,
  DAY_NIGHT_PHASES,
} from './utils/fireworks';
import { audioEngine } from './utils/audio';
import { PWAInstallButton } from './components/PWAInstallButton';

interface TargetIndicator {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FireworksEngine | null>(null);

  // Configuration State
  const [config, setConfig] = useState<FireworkConfig>({
    type: 'magic_shapes',
    scenario: 'castle',
    colorScheme: 'rainbow',
    customColor: '#ff2a85',
    particleCount: 160, // Optimized for mobile GPUs
    explosionForce: 1.2,
    rocketSpeed: 1.1,
    trailDuration: 0.18,
    soundEnabled: true,
    skyTheme: 'night',
    rhythmSync: false,
    bpm: 120,
    starrySky: true,
    starIntensity: 1.0,
    willowPersistence: 0.985,
    willowGlow: 1.25,
    cinematicSmoke: true,
    smokeDensity: 1.0,
    deepNightMode: false,
    signatureWord: 'ALTAIR',
    dayNightCycle: true,
  });

  // UI State
  const [isAutoShow, setIsAutoShow] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [showMenu, setShowMenu] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [menuTab, setMenuTab] = useState<'scenarios' | 'types' | 'family' | 'physics' | 'colors' | 'audio'>('scenarios');
  const [stats, setStats] = useState({ particles: 0, rockets: 0 });
  const [targets, setTargets] = useState<TargetIndicator[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [dayNightPhaseName, setDayNightPhaseName] = useState<string>('Noche Estelar');
  const [selectedWord, setSelectedWord] = useState<string>('ALTAIR');

  // Initialize Canvas & Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FireworksEngine(canvas, config);
    engineRef.current = engine;
    engine.start();
    engine.toggleAutoShow(true);

    engine.setStatsCallback((currentStats) => {
      setStats(currentStats);
    });

    engine.setBeatCallback((beat) => {
      setCurrentBeat(beat);
    });

    engine.setSkyThemeCallback((theme, starIntensity, phaseName) => {
      setConfig((prev) => ({
        ...prev,
        skyTheme: theme,
        deepNightMode: theme === 'deep_night',
        starIntensity,
      }));
      setDayNightPhaseName(phaseName);
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvas) {
      resizeObserver = new ResizeObserver(() => {
        engine.resize();
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      engine.destroy();
    };
  }, []);

  // Update engine whenever config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }
  }, [config]);

  // Handle AutoShow toggle
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.toggleAutoShow(isAutoShow);
    }
  }, [isAutoShow]);

  // Handle Rhythm Sync toggle
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.toggleRhythmSync(config.rhythmSync);
    }
  }, [config.rhythmSync]);

  // Handle Audio settings
  useEffect(() => {
    audioEngine.setMuted(isMuted || !config.soundEnabled);
  }, [isMuted, config.soundEnabled]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  // Launch at coordinates
  const triggerLaunch = useCallback(
    (clientX: number, clientY: number) => {
      // Unlock Web Audio context on mobile touch gesture
      audioEngine.init();

      if (!canvasRef.current || !engineRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Launch rocket
      engineRef.current.launchAt(x, y);

      // Add visual click ripple indicator
      const newTargetId = Date.now() + Math.random();
      const currentColor =
        config.colorScheme === 'custom'
          ? config.customColor
          : DISNEY_PALETTES.find((p) => p.id === config.colorScheme)?.primary || '#ffd13b';

      setTargets((prev) => [...prev.slice(-4), { id: newTargetId, x, y, color: currentColor }]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== newTargetId));
      }, 550);
    },
    [config]
  );

  // Canvas pointer down handler
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    triggerLaunch(e.clientX, e.clientY);
  };

  // Disney Grand Finale trigger
  const handleGrandFinale = () => {
    audioEngine.init();
    if (engineRef.current) {
      engineRef.current.triggerGrandFinale();
    }
  };

  // Cohete Especial Firma "ALTAIR" / Nombres Familiares
  const handleAltairSignature = () => {
    audioEngine.init();
    if (engineRef.current) {
      engineRef.current.triggerFamilyWord(selectedWord);
    }
  };

  // Lanzar Cohete Especial con Nombre Familiar
  const handleFamilyWordLaunch = (word?: string) => {
    audioEngine.init();
    const target = word || selectedWord;
    setSelectedWord(target);
    setConfig((prev) => ({ ...prev, signatureWord: target }));
    if (engineRef.current) {
      engineRef.current.triggerFamilyWord(target);
    }
  };

  // Avanzar Fase Ciclo Día-Noche
  const handleAdvanceDayNight = () => {
    if (engineRef.current) {
      engineRef.current.advanceDayNightCycle();
    }
  };

  // Golden Rain trigger
  const handleGoldenRain = () => {
    audioEngine.init();
    if (engineRef.current) {
      engineRef.current.triggerGoldenRain();
    }
  };

  // Reset to default settings
  const handleResetSettings = () => {
    setConfig({
      type: 'magic_shapes',
      scenario: 'castle',
      colorScheme: 'gold',
      customColor: '#ff2a85',
      particleCount: 160,
      explosionForce: 1.2,
      rocketSpeed: 1.1,
      trailDuration: 0.18,
      soundEnabled: true,
      skyTheme: 'night',
      rhythmSync: false,
      bpm: 120,
      starrySky: true,
      starIntensity: 1.0,
      willowPersistence: 0.985,
      willowGlow: 1.25,
      cinematicSmoke: true,
      smokeDensity: 1.0,
      deepNightMode: false,
      signatureWord: 'Altair',
      dayNightCycle: true,
    });
  };

  // Export as standalone single-file HTML for mobile with full PWA embedded
  const handleDownloadStandaloneHtml = async () => {
    try {
      const res = await fetch('/fuegos.html');
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simulador_fuegos_familiar_pwa.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback to inline generated template below
    }

    const iconSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#02040d"/><stop offset="100%" stop-color="#0f172a"/></linearGradient><linearGradient id="gld" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#fef08a"/></linearGradient></defs><rect width="512" height="512" rx="100" fill="url(#bg)"/><circle cx="256" cy="115" r="24" fill="#fde047"/><path d="M256 75 L259 110 L296 115 L259 120 L256 155 L253 120 L216 115 L253 110 Z" fill="#ffffff"/><path d="M165 410 L165 340 L195 340 L195 310 L215 270 L225 310 L225 330 L235 330 L235 240 L250 200 L256 165 L262 200 L277 240 L277 330 L287 330 L287 310 L297 270 L317 310 L317 340 L347 340 L347 410 Z" fill="url(#gld)"/><circle cx="140" cy="180" r="18" fill="#38bdf8" opacity="0.8"/><circle cx="370" cy="175" r="18" fill="#f472b6" opacity="0.8"/></svg>`;
    const iconDataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvgRaw);
    
    const manifestJson = {
      id: "/",
      name: "Disney Fireworks Mobile",
      short_name: "FuegosDisney",
      description: "Simulador de espectáculo de fuegos artificiales estilo Disney ultra-realista para celulares.",
      start_url: "./",
      scope: "./",
      display: "standalone",
      orientation: "portrait",
      background_color: "#03050e",
      theme_color: "#03050e",
      icons: [
        {
          src: iconDataUri,
          sizes: "192x192 512x512",
          type: "image/svg+xml",
          purpose: "any maskable"
        }
      ]
    };
    const manifestDataUri = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifestJson));

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#03050e">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="FuegosDisney">
  <title>Disney Fireworks Mobile - PWA</title>
  
  <!-- Embedded PWA Manifest & App Icons -->
  <link rel="manifest" href="${manifestDataUri}">
  <link rel="icon" type="image/svg+xml" href="${iconDataUri}">
  <link rel="apple-touch-icon" href="${iconDataUri}">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; -webkit-tap-highlight-color: transparent; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #03050e; font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
    canvas { width: 100vw; height: 100vh; display: block; }
    .hud-top { position: absolute; top: calc(env(safe-area-inset-top, 10px) + 8px); left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 20; }
    .hud-bottom { position: absolute; bottom: calc(env(safe-area-inset-bottom, 10px) + 8px); left: 10px; right: 10px; display: flex; justify-content: center; pointer-events: none; z-index: 20; }
    .bar { background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 6px 12px; pointer-events: auto; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
    button { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 14px; min-height: 40px; padding: 6px 12px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; user-select: none; }
    button:active { transform: scale(0.95); background: rgba(255,255,255,0.22); }
    .btn-gold { background: linear-gradient(135deg, #fbbf24, #f43f5e); color: #020617; border: none; font-weight: 800; box-shadow: 0 4px 14px rgba(244,63,94,0.3); }
    .btn-emerald { background: linear-gradient(135deg, #10b981, #06b6d4); color: #020617; border: none; font-weight: 800; }
    .tag { font-size: 9px; padding: 2px 6px; border-radius: 8px; font-weight: 800; text-transform: uppercase; }
    .install-banner { position: fixed; top: 70px; left: 12px; right: 12px; background: rgba(15, 23, 42, 0.94); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 18px; padding: 12px; z-index: 30; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.7); backdrop-filter: blur(12px); }
  </style>
</head>
<body>
  <!-- Top Bar -->
  <div class="hud-top">
    <div class="bar">
      <span style="font-weight:800; color:#fbbf24; font-size:13px;">🏰 Disney Fireworks</span>
      <span id="showTag" class="tag" style="background:rgba(16,185,129,0.2); color:#6ee7b7; border:1px solid rgba(16,185,129,0.4); display:none;">SHOW</span>
    </div>
    <div class="bar">
      <button onclick="toggleDeepNight()" id="deepBtn">🌙 Noche</button>
      <button onclick="toggleSound()" id="soundBtn">🔊 Sonido</button>
      <button onclick="showInstallModal()" id="pwaBtn" style="border-color:#fbbf24; color:#fde047;">📱 Instalar</button>
    </div>
  </div>

  <!-- Bottom Bar -->
  <div class="hud-bottom">
    <div class="bar" style="width: 100%; max-width: 440px; justify-content: space-around;">
      <button class="btn-gold" onclick="toggleAuto()" id="autoBtn">▶ Auto Show</button>
      <button onclick="triggerFinale()" style="color:#fda4af; border-color:rgba(244,63,94,0.4);">🎆 ¡Gran Final!</button>
      <button onclick="cycleType()" id="typeBtn">✨ Forma</button>
      <button onclick="cycleScenario()" id="scenBtn">🏰 Castillo</button>
    </div>
  </div>

  <!-- PWA Install Modal / Instructions -->
  <div id="installModal" class="install-banner">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <strong style="color:#fbbf24; font-size:13px;">📱 Instalar en Pantalla de Inicio (PWA)</strong>
      <button onclick="closeInstallModal()" style="min-height:28px; padding:2px 8px; font-size:11px;">✕</button>
    </div>
    <p style="font-size:11px; color:#cbd5e1; line-height:1.4; margin-bottom:8px;">
      • <strong>iOS Safari:</strong> Toca el botón <strong>Compartir ⎋</strong> abajo y pulsa <strong>"Añadir a pantalla de inicio ⊞"</strong>.<br>
      • <strong>Android Chrome:</strong> Pulsa el botón de abajo o pulsa ⋮ y selecciona <strong>"Instalar aplicación"</strong>.
    </p>
    <button onclick="triggerPWAInstall()" class="btn-gold" style="width:100%; justify-content:center;">Instalar Ahora</button>
  </div>

  <canvas id="c"></canvas>

  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const willowCanvas = document.createElement('canvas');
    const willowCtx = willowCanvas.getContext('2d');
    let w, h;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth || 360; h = window.innerHeight || 640;
      if (w <= 0) w = 360;
      if (h <= 0) h = 640;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.resetTransform(); ctx.scale(dpr, dpr);
      willowCanvas.width = Math.max(1, Math.round(w * dpr)); willowCanvas.height = Math.max(1, Math.round(h * dpr));
      willowCtx.resetTransform(); willowCtx.scale(dpr, dpr);
      initStars();
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    // Procedural Web Audio API
    let actx = null, soundOn = true;
    function initAudio() {
      if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended') actx.resume();
    }
    window.toggleSound = () => {
      soundOn = !soundOn;
      document.getElementById('soundBtn').textContent = soundOn ? '🔊 Sonido' : '🔇 Mudo';
    };

    let deepNight = false;
    window.toggleDeepNight = () => {
      deepNight = !deepNight;
      document.getElementById('deepBtn').textContent = deepNight ? '🌑 Profundo' : '🌙 Noche';
      document.getElementById('deepBtn').style.borderColor = deepNight ? '#818cf8' : 'rgba(255,255,255,0.2)';
    };

    function playWhistle(speed) {
      if(!actx || !soundOn) return;
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 * speed, t);
      osc.frequency.exponentialRampToValueAtTime(1100 * speed, t + 0.75);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t); osc.stop(t + 0.8);
    }

    function playBoom(force) {
      if(!actx || !soundOn) return;
      const t = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(26, t + 1.2);
      gain.gain.setValueAtTime(0.55 * force, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t); osc.stop(t + 1.25);
    }

    // Twinkling Starfield
    let stars = [];
    function initStars() {
      stars = [];
      const count = Math.min(180, Math.floor((w * h) / 4800));
      for(let i=0; i<count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.pow(Math.random(), 1.25) * (h * 0.74),
          size: Math.random() * 0.8 + 0.6,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.01,
          color: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#fff4db' : '#d8eeff'),
          isJewel: Math.random() > 0.92
        });
      }
    }
    resize();

    // Fireworks & Particles
    let rockets = [], particles = [], smoke = [];
    const PALETTES = [
      ['#ffd700', '#ffb703', '#ffffff'], // Gold
      ['#00d2ff', '#2979ff', '#80d8ff'], // Blue
      ['#ff2a85', '#f50057', '#ff80bf'], // Rose
      ['#00ff88', '#00e676', '#b9f6ca'], // Emerald
      ['#e040fb', '#d500f9', '#ff4081'], // Fuchsia
      ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00d2ff'] // Rainbow
    ];

    let currentTypeIndex = 0;
    const FIREWORK_TYPES = ['magic_shapes', 'willow', 'chrysanthemum', 'double_core', 'ring', 'crossette'];
    const TYPE_NAMES = ['✨ Mágico', '🌾 Sauce', '🌸 Crisan', '💥 Core', '🪐 Anillo', '🎆 Cross'];
    window.cycleType = () => {
      currentTypeIndex = (currentTypeIndex + 1) % FIREWORK_TYPES.length;
      document.getElementById('typeBtn').textContent = TYPE_NAMES[currentTypeIndex];
    };

    let scenario = 0; // 0: Castle, 1: Tomorrowland, 2: Minimal
    const SCENARIO_NAMES = ['🏰 Castillo', '🚀 Tomorrow', '🌌 Cielo'];
    window.cycleScenario = () => {
      scenario = (scenario + 1) % 3;
      document.getElementById('scenBtn').textContent = SCENARIO_NAMES[scenario];
    };

    function launch(tx, ty, explicitType) {
      initAudio();
      const sx = w * 0.5 + (tx - w * 0.5) * 0.35;
      const sy = h + 10;
      const angle = Math.atan2(ty - sy, tx - sx);
      const spd = Math.hypot(tx - sx, ty - sy) / 36;
      playWhistle(1.0);
      const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      rockets.push({
        x: sx, y: sy,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        tx, ty,
        color: pal[0],
        pal,
        type: explicitType || FIREWORK_TYPES[currentTypeIndex],
        trail: []
      });
    }

    function detonate(x, y, type, pal) {
      playBoom(1.2);
      const count = 140;

      // Volumetric post-explosion pyrotechnic smoke cloud
      for(let i=0; i<12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 1.4 + 0.3;
        smoke.push({
          x: x + Math.cos(a) * (Math.random() * 12),
          y: y + Math.sin(a) * (Math.random() * 12),
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - (Math.random() * 0.25 + 0.05),
          r: Math.random() * 6 + 7,
          maxR: Math.random() * 20 + 20,
          a: Math.random() * 0.05 + 0.14,
          d: Math.random() * 0.0026 + 0.0018
        });
      }

      if(type === 'magic_shapes') {
        const mode = Math.random();
        if(mode < 0.4) {
          // Mickey Silhouette (3 circles)
          for(let i=0; i<80; i++) {
            const a = (i / 80) * Math.PI * 2;
            particles.push({ x, y, vx: Math.cos(a)*3.6, vy: Math.sin(a)*3.6, c: pal[0], a: 1, d: 0.014, g: 0.035 });
          }
          for(let i=0; i<30; i++) {
            const a = (i / 30) * Math.PI * 2;
            particles.push({ x, y, vx: -2.6 + Math.cos(a)*2.0, vy: -2.6 + Math.sin(a)*2.0, c: pal[1] || pal[0], a: 1, d: 0.014, g: 0.035 });
            particles.push({ x, y, vx: 2.6 + Math.cos(a)*2.0, vy: -2.6 + Math.sin(a)*2.0, c: pal[1] || pal[0], a: 1, d: 0.014, g: 0.035 });
          }
        } else if(mode < 0.7) {
          // 5-Point Fairy Star
          for(let i=0; i<count; i++) {
            const a = (i / count) * Math.PI * 2;
            const r = (Math.cos(5 * a) * 0.4 + 0.8) * 4.6;
            particles.push({ x, y, vx: Math.cos(a - Math.PI/2)*r, vy: Math.sin(a - Math.PI/2)*r, c: pal[0], a: 1, d: 0.013, g: 0.035 });
          }
        } else {
          // Heart
          for(let i=0; i<count; i++) {
            const t = (i / count) * Math.PI * 2;
            const hx = 16 * Math.pow(Math.sin(t), 3);
            const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
            particles.push({ x, y, vx: hx * 0.32, vy: hy * 0.32, c: '#ff2a85', a: 1, d: 0.013, g: 0.033 });
          }
        }
      } else if(type === 'willow') {
        // Lluvia de Sauce Llorón dorada para buffer acumulativo
        const willowColors = ['#ffd13b', '#ffb703', '#fff3b0', '#ffe066', '#ffa200'];
        const willowCount = Math.floor(count * 1.3);
        for(let i=0; i<willowCount; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4.6 + 0.8;
          particles.push({
            x, y, px: x, py: y,
            vx: Math.cos(a)*spd,
            vy: Math.sin(a)*spd * 0.7 - 1.5,
            c: willowColors[Math.floor(Math.random() * willowColors.length)],
            a: 1,
            d: 0.0036, // Persiste más de 270 frames en buffer acumulativo
            g: 0.062,
            isWillow: true,
            size: Math.random() * 1.2 + 1.2
          });
        }
      } else if(type === 'ring') {
        // Saturn ring
        for(let i=0; i<count; i++) {
          const a = (i / count) * Math.PI * 2;
          const spd = 5.2 + (Math.random() * 0.3 - 0.15);
          particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd*0.85, c: pal[0], a: 1, d: 0.014, g: 0.035 });
        }
      } else {
        // Spherical Chrysanthemum / Double Core
        for(let i=0; i<count; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = Math.random() * 5.2 + 0.8;
          particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, c: pal[i % pal.length], a: 1, d: 0.013, g: 0.042 });
        }
      }
    }

    // Touch Interactive Launch
    window.addEventListener('pointerdown', (e) => {
      if(e.clientY < 70 || e.clientY > h - 70) return;
      launch(e.clientX, e.clientY);
    });

    // Auto Show
    let auto = false, autoTimer = null;
    window.toggleAuto = () => {
      auto = !auto;
      document.getElementById('autoBtn').textContent = auto ? '⏸ Pausa' : '▶ Auto Show';
      document.getElementById('showTag').style.display = auto ? 'inline-block' : 'none';
      if(auto) {
        autoTimer = setInterval(() => {
          const rx = w * 0.15 + Math.random() * w * 0.7;
          const ry = h * 0.14 + Math.random() * h * 0.32;
          const rType = FIREWORK_TYPES[Math.floor(Math.random() * FIREWORK_TYPES.length)];
          launch(rx, ry, rType);
        }, 1800);
      } else {
        clearInterval(autoTimer);
      }
    };

    // Grand Finale
    window.triggerFinale = () => {
      initAudio();
      for(let i=0; i<18; i++) {
        setTimeout(() => {
          const rx = w * 0.1 + Math.random() * w * 0.8;
          const ry = h * 0.12 + Math.random() * h * 0.35;
          const rType = FIREWORK_TYPES[Math.floor(Math.random() * FIREWORK_TYPES.length)];
          launch(rx, ry, rType);
        }, i * 140);
      }
    };

    // PWA Install Prompt Handlers
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('pwaBtn').style.display = 'flex';
    });

    window.showInstallModal = () => {
      document.getElementById('installModal').style.display = 'block';
    };
    window.closeInstallModal = () => {
      document.getElementById('installModal').style.display = 'none';
    };
    window.triggerPWAInstall = async () => {
      if(deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if(outcome === 'accepted') closeInstallModal();
      } else {
        alert('En Safari (iOS): Toca Compartir ⎋ y "Añadir a pantalla de inicio".');
      }
    };

    // Main 60 FPS Render Loop
    function loop() {
      // 1. Sky & Stars
      ctx.fillStyle = deepNight ? 'rgba(0, 1, 3, 0.28)' : 'rgba(3, 5, 14, 0.22)';
      ctx.fillRect(0, 0, w, h);

      // Buffer Acumulativo de Sauce Llorón: Desvanecimiento ultra-lento que retiene el 98.4% de la luz por frame
      willowCtx.save();
      willowCtx.globalCompositeOperation = 'destination-out';
      willowCtx.fillStyle = 'rgba(0, 0, 0, 0.016)';
      willowCtx.fillRect(0, 0, w, h);
      willowCtx.restore();

      for(let i=0; i<stars.length; i++) {
        const s = stars[i];
        s.phase += s.speed;
        const alpha = 0.12 + 0.65 * (Math.sin(s.phase) * 0.5 + 0.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        if(s.isJewel && alpha > 0.45) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // Draw Cumulative Willow Buffer onto main sky
      if (willowCanvas && willowCanvas.width > 0 && willowCanvas.height > 0 && w > 0 && h > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(willowCanvas, 0, 0, w, h);
        ctx.globalAlpha = deepNight ? 0.44 : 0.28;
        ctx.drawImage(willowCanvas, 0, 0, w, h);
        ctx.restore();
      }

      // Capa de Humo Grisáceo Cinemático Sutil
      if(smoke.length > 220) smoke.splice(0, smoke.length - 220);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      for(let i=smoke.length-1; i>=0; i--) {
        const sm = smoke[i];
        sm.x += sm.vx; sm.y += sm.vy;
        sm.vx *= 0.985; sm.vy *= 0.985;
        sm.vy -= 0.006;
        if(sm.r < sm.maxR) sm.r += (sm.maxR - sm.r) * 0.012;
        sm.a -= sm.d;

        const grad = ctx.createRadialGradient(sm.x, sm.y, 0, sm.x, sm.y, sm.r);
        const aVal = Math.min(0.22, sm.a);
        grad.addColorStop(0, 'rgba(168, 178, 196, ' + aVal + ')');
        grad.addColorStop(0.5, 'rgba(138, 148, 168, ' + (aVal * 0.52) + ')');
        grad.addColorStop(1, 'rgba(100, 112, 130, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI*2); ctx.fill();

        if(sm.a <= 0) smoke.splice(i, 1);
      }
      ctx.restore();

      const wy = h * 0.81;
      const cx = w * 0.5;
      const scale = Math.min(1.0, Math.max(0.65, w / 420));

      // 2. Disney Themed Scenery Silhouettes
      if(scenario === 0) {
        // Grand Fairy Tale Castle
        ctx.fillStyle = '#020409';
        ctx.beginPath();
        ctx.moveTo(cx - 160*scale, wy);
        ctx.lineTo(cx - 130*scale, wy - 55*scale);
        ctx.lineTo(cx - 75*scale, wy - 110*scale);
        ctx.lineTo(cx - 75*scale, wy - 150*scale); // Left high spire
        ctx.lineTo(cx - 40*scale, wy - 110*scale);
        ctx.lineTo(cx, wy - 220*scale); // Tallest Main Spire
        ctx.lineTo(cx + 40*scale, wy - 110*scale);
        ctx.lineTo(cx + 75*scale, wy - 150*scale); // Right high spire
        ctx.lineTo(cx + 75*scale, wy - 110*scale);
        ctx.lineTo(cx + 130*scale, wy - 55*scale);
        ctx.lineTo(cx + 160*scale, wy);
        ctx.closePath();
        ctx.fill();

        // Warm Glowing Windows
        ctx.fillStyle = '#ffd166';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(cx - 2*scale, wy - 130*scale, 4*scale, 8*scale);
        ctx.fillRect(cx - 75*scale, wy - 90*scale, 3*scale, 6*scale);
        ctx.fillRect(cx + 72*scale, wy - 90*scale, 3*scale, 6*scale);
        ctx.globalAlpha = 1;

        // Castle Flag
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx, wy - 220*scale); ctx.lineTo(cx, wy - 232*scale); ctx.lineTo(cx + 8*scale, wy - 228*scale); ctx.lineTo(cx, wy - 224*scale); ctx.stroke();
      } else if(scenario === 1) {
        // Tomorrowland Neon Spire
        ctx.fillStyle = '#02040a';
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.lineTo(cx - 90*scale, wy - 90*scale);
        ctx.lineTo(cx, wy - 210*scale);
        ctx.lineTo(cx + 90*scale, wy - 90*scale);
        ctx.lineTo(w, wy);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Lagoon Surface
      ctx.fillStyle = deepNight ? '#000103' : '#010307';
      ctx.fillRect(0, wy, w, h - wy);
      ctx.strokeStyle = deepNight ? 'rgba(255, 235, 179, 0.16)' : 'rgba(255, 235, 179, 0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(w, wy); ctx.stroke();

      // Lagoon reflection of cumulative buffer
      if (willowCanvas && willowCanvas.width > 0 && willowCanvas.height > 0 && w > 0 && h > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.28;
        ctx.translate(0, wy * 1.95);
        ctx.scale(1, -0.6);
        ctx.drawImage(willowCanvas, 0, 0, w, h);
        ctx.restore();
      }

      // 4. Update & Draw Fireworks with Additive Glow
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Rockets
      for(let i=rockets.length-1; i>=0; i--) {
        const r = rockets[i];
        r.x += r.vx; r.y += r.vy;
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI*2); ctx.fill();

        // Rocket Trail
        r.trail.unshift({ x: r.x, y: r.y, a: 1 });
        if(r.trail.length > 8) r.trail.pop();
        for(let t=0; t<r.trail.length; t++) {
          ctx.globalAlpha = (1 - t/r.trail.length) * 0.6;
          ctx.fillStyle = '#ffecb3';
          ctx.beginPath(); ctx.arc(r.trail[t].x, r.trail[t].y, 2, 0, Math.PI*2); ctx.fill();
        }

        // Estela de humo grisáceo sutil del cohete
        if(Math.random() > 0.32) {
          smoke.push({
            x: r.x + (Math.random()*4-2),
            y: r.y + (Math.random()*4-2),
            vx: r.vx * 0.08 + (Math.random()*0.2 - 0.1),
            vy: r.vy * 0.08 - (Math.random()*0.15 + 0.05),
            r: Math.random()*2.5 + 2.2,
            maxR: Math.random()*8 + 8,
            a: Math.random()*0.04 + 0.10,
            d: Math.random()*0.0035 + 0.0024
          });
        }

        if(r.y <= r.ty) {
          detonate(r.x, r.y, r.type, r.pal);
          rockets.splice(i, 1);
        }
      }

      // Particles (Sparks)
      if(particles.length > 700) particles.splice(0, particles.length - 700);
      willowCtx.save();
      willowCtx.globalCompositeOperation = 'lighter';

      for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;
        p.vx *= p.isWillow ? 0.968 : 0.965;
        p.vy *= p.isWillow ? 0.968 : 0.965;
        p.vy += p.g || 0.04;
        p.x += p.vx; p.y += p.vy;
        p.a -= p.d;

        if (p.isWillow) {
          // Estampar trazo en buffer acumulativo con halo radiante y núcleo incandescente
          willowCtx.beginPath();
          willowCtx.moveTo(p.px, p.py);
          willowCtx.lineTo(p.x, p.y);
          willowCtx.strokeStyle = p.c;
          willowCtx.lineWidth = p.size * 3.2;
          willowCtx.globalAlpha = p.a * 0.38;
          willowCtx.stroke();

          willowCtx.beginPath();
          willowCtx.moveTo(p.px, p.py);
          willowCtx.lineTo(p.x, p.y);
          willowCtx.strokeStyle = '#ffe484';
          willowCtx.lineWidth = p.size * 1.5;
          willowCtx.globalAlpha = p.a * 0.8;
          willowCtx.stroke();

          willowCtx.beginPath();
          willowCtx.moveTo(p.px, p.py);
          willowCtx.lineTo(p.x, p.y);
          willowCtx.strokeStyle = '#ffffff';
          willowCtx.lineWidth = 0.85;
          willowCtx.globalAlpha = p.a * 0.98;
          willowCtx.stroke();

          // Cabeza incandescente
          willowCtx.beginPath();
          willowCtx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
          willowCtx.fillStyle = '#ffffff';
          willowCtx.globalAlpha = p.a;
          willowCtx.fill();
        } else {
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI*2); ctx.fill();
        }

        // Water reflection
        if(p.y < wy) {
          ctx.globalAlpha = Math.max(0, p.a * (p.isWillow ? 0.36 : 0.25));
          ctx.beginPath();
          ctx.ellipse(p.x, wy + (wy - p.y) * 0.72, p.isWillow ? 4.5 : 3.5, 1.2, 0, 0, Math.PI*2);
          ctx.fill();
        }

        if(p.a <= 0) particles.splice(i, 1);
      }
      willowCtx.restore();

      ctx.restore();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuegos_disney_pwa_movil.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scenarios List
  const scenarios: { id: DisneyScenario; name: string; subtitle: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'castle',
      name: 'El Gran Castillo Mágico',
      subtitle: 'Fairy Tale Castle & Reflecting Lagoon',
      desc: 'Silueta icónica con agujas doradas, reflectores de gala y agua con reflejos hiperrealistas.',
      icon: <Castle className="w-5 h-5 text-amber-300" />,
    },
    {
      id: 'tomorrowland',
      name: 'Tomorrowland Futurista',
      subtitle: 'Cyber Spire & Sweeping Laser Beams',
      desc: 'Rascacielos geométricos, cúpula de Space Mountain y haces láser cruzando el cielo.',
      icon: <RocketIcon className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'minimal',
      name: 'Cielo Nocturno Limpio',
      subtitle: 'Pure Pyrotechnics',
      desc: 'Lienzo oscuro y despejado que maximiza el campo visual para la pirotecnia.',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
    },
  ];

  // Firework Types List
  const fireworkTypes: { id: FireworkType; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'altair_signature',
      name: 'Firma "ALTAIR"',
      desc: 'Palabra luminosa de oro estelar centrada en el cielo',
      icon: <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />,
    },
    {
      id: 'magic_shapes',
      name: 'Formas Mágicas Disney',
      desc: 'Estrellas celestiales, corazones y silueta de Mickey',
      icon: <Crown className="w-4 h-4 text-amber-300" />,
    },
    {
      id: 'double_core',
      name: 'Bomba Core (Doble Explosión)',
      desc: 'Núcleo central luminoso y repuche secundario',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
    },
    {
      id: 'willow',
      name: 'Sauce Llorón / Oro Real',
      desc: 'Lluvia de partículas pesadas de larga duración con gravedad',
      icon: <Flame className="w-4 h-4 text-yellow-400" />,
    },
    {
      id: 'chrysanthemum',
      name: 'Crisantemo & Peonía',
      desc: 'Esfera clásica densa y brillante con estelas',
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'ring',
      name: 'Anillo de Saturno',
      desc: 'Aro circular concéntrico expandiéndose',
      icon: <Disc className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'random',
      name: 'Modo Sorpresa (Variado)',
      desc: 'Secuencia aleatoria de todos los patrones mágicos',
      icon: <Music className="w-4 h-4 text-indigo-400" />,
    },
  ];

  const currentScenarioObj = scenarios.find((s) => s.id === config.scenario) || scenarios[0];
  const currentTypeName = fireworkTypes.find((t) => t.id === config.type)?.name || 'Formas Mágicas';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] select-none text-slate-100 touch-none">
      {/* Background Interactive Sky Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      />

      {/* Target Ripple Indicators */}
      {targets.map((t) => (
        <div
          key={t.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 animate-ping"
          style={{
            left: t.x,
            top: t.y,
            width: '28px',
            height: '28px',
            borderColor: t.color,
            boxShadow: `0 0 14px ${t.color}`,
          }}
        />
      ))}

      {/* Top Floating App Bar (Touch-Optimized for Mobile) */}
      {!cinemaMode && (
        <header className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between pointer-events-none z-20 pt-[env(safe-area-inset-top,0px)]">
          {/* Brand & Mode Status */}
          <div className="pointer-events-auto flex items-center gap-2 backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 shadow-xl rounded-2xl px-3 py-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-md text-slate-950 flex-shrink-0">
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-rose-200 to-cyan-200">
                  Disney Fireworks
                </h1>
                {isAutoShow && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    <Radio className="w-2 h-2" /> SHOW
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none">
                {currentScenarioObj.name.split(' ')[1] || currentScenarioObj.name}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="pointer-events-auto flex items-center gap-1.5 backdrop-blur-xl bg-slate-900/80 border border-slate-700/60 shadow-xl rounded-2xl p-1">
            {/* Quick Auto Show Button */}
            <button
              onClick={() => {
                audioEngine.init();
                setIsAutoShow(!isAutoShow);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                isAutoShow
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-slate-950 shadow-sm'
              }`}
              title="Iniciar / pausar show automático"
            >
              {isAutoShow ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAutoShow ? 'Pausa' : 'Auto Show'}</span>
            </button>

            {/* Sound Toggle (Big touch target) */}
            <button
              onClick={() => {
                audioEngine.init();
                const newMute = !isMuted;
                setIsMuted(newMute);
                setConfig((prev) => ({ ...prev, soundEnabled: !newMute }));
              }}
              className={`p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
                isMuted || !config.soundEnabled
                  ? 'text-slate-500 bg-slate-800/60'
                  : 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
              }`}
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted || !config.soundEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Quick Starry Sky Toggle */}
            <button
              onClick={() => {
                setConfig((prev) => ({ ...prev, starrySky: !prev.starrySky }));
              }}
              className={`p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
                config.starrySky !== false
                  ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-sm shadow-amber-400/25'
                  : 'text-slate-500 bg-slate-800/60'
              }`}
              title={config.starrySky !== false ? 'Cielo Estrellado activado' : 'Cielo Estrellado desactivado'}
            >
              <Star className={`w-4 h-4 ${config.starrySky !== false ? 'fill-amber-300' : ''}`} />
            </button>

            {/* Quick Deep Night Mode Toggle */}
            <button
              onClick={() => {
                setConfig((prev) => {
                  const newDeep = !(prev.deepNightMode || prev.skyTheme === 'deep_night');
                  return {
                    ...prev,
                    deepNightMode: newDeep,
                    skyTheme: newDeep ? 'deep_night' : 'night',
                  };
                });
              }}
              className={`p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
                config.deepNightMode || config.skyTheme === 'deep_night'
                  ? 'text-indigo-200 bg-indigo-950/90 border border-indigo-500/60 shadow-sm shadow-indigo-500/40'
                  : 'text-slate-500 bg-slate-800/60'
              }`}
              title={
                config.deepNightMode || config.skyTheme === 'deep_night'
                  ? 'Modo Nocturno Profundo activado'
                  : 'Activar Modo Nocturno Profundo'
              }
            >
              <Moon
                className={`w-4 h-4 ${
                  config.deepNightMode || config.skyTheme === 'deep_night'
                    ? 'fill-indigo-300 text-indigo-300'
                    : ''
                }`}
              />
            </button>

            {/* In-App PWA Install Button */}
            <PWAInstallButton compact />

            {/* Options Menu Toggle */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-all ${
                showMenu
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25'
                  : 'bg-slate-800/80 text-amber-300 border border-amber-500/30'
              }`}
              title="Abrir menú de configuración"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Cinema Mode Toggle */}
            <button
              onClick={() => setCinemaMode(true)}
              className="p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-200 bg-slate-800/40"
              title="Ocultar interfaz"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Cinema Mode Restore Button */}
      {cinemaMode && (
        <button
          onClick={() => setCinemaMode(false)}
          className="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-200 shadow-2xl active:scale-95 transition-all"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Ver Controles</span>
        </button>
      )}

      {/* BOTTOM FLOATING DOCK (Mobile-First Ergonomic Bar) */}
      {!cinemaMode && !showMenu && (
        <div className="absolute bottom-3 left-2 right-2 flex justify-center pointer-events-none z-20 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="pointer-events-auto backdrop-blur-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between gap-1.5 max-w-md w-full">
            {/* Quick Scenario Switcher */}
            <button
              onClick={() => {
                const nextScenario: Record<DisneyScenario, DisneyScenario> = {
                  castle: 'tomorrowland',
                  tomorrowland: 'minimal',
                  minimal: 'castle',
                  jungle: 'castle',
                };
                setConfig((prev) => ({ ...prev, scenario: nextScenario[prev.scenario] || 'castle' }));
              }}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-800/70 active:bg-slate-700 border border-slate-700/50 text-slate-200 min-h-[44px]"
              title="Cambiar escenario"
            >
              {currentScenarioObj.icon}
              <span className="text-[10px] font-bold mt-0.5 truncate w-full text-center">
                {config.scenario === 'castle' ? 'Castillo' : config.scenario === 'tomorrowland' ? 'Tomorrow' : 'Cielo'}
              </span>
            </button>

            {/* Quick Firework Type Pill */}
            <button
              onClick={() => {
                setMenuTab('types');
                setShowMenu(true);
              }}
              className="flex-[1.2] flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-800/70 active:bg-slate-700 border border-slate-700/50 text-slate-200 min-h-[44px]"
              title="Cambiar tipo de pirotecnia"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-bold mt-0.5 truncate w-full text-center">
                {currentTypeName.split(' ')[0]}
              </span>
            </button>

            {/* Quick Grand Finale */}
            <button
              onClick={handleGrandFinale}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-tr from-rose-500/25 to-pink-500/25 active:scale-95 border border-rose-500/40 text-rose-200 min-h-[44px] shadow-sm"
              title="Lanzar Gran Final con Cierre de Nombres Especiales"
            >
              <Zap className="w-4 h-4 text-rose-300" />
              <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap">Gran Final</span>
            </button>

            {/* Quick Family Word Launcher */}
            <button
              onClick={() => {
                setMenuTab('family');
                setShowMenu(true);
              }}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/25 active:scale-95 border border-amber-500/50 text-amber-200 min-h-[44px] shadow-sm"
              title="Selector de Nombres Especiales"
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-bold mt-0.5 whitespace-nowrap truncate max-w-[50px]">{selectedWord}</span>
            </button>

            {/* Quick Settings Drawer Open */}
            <button
              onClick={() => setShowMenu(true)}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-500/20 active:bg-amber-500/35 border border-amber-500/35 text-amber-300 min-h-[44px]"
              title="Abrir panel completo"
            >
              <ChevronUp className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold mt-0.5">Ajustes</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL RESPONSIVE MOBILE-FIRST DRAWER / OPTIONS MODAL */}
      {showMenu && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
            
            {/* Mobile Sheet Handle Bar */}
            <div className="pt-2 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 font-bold">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Configuración del Show</h2>
                  <p className="text-[11px] text-slate-400">Personaliza la magia Disney a tu gusto</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownloadStandaloneHtml}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  title="Descargar código HTML autocontenido"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HTML</span>
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60"
                  title="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Touch-friendly horizontal scroll) */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setMenuTab('scenarios')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'scenarios'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Castle className="w-3.5 h-3.5" />
                <span>Escenarios</span>
              </button>
              <button
                onClick={() => setMenuTab('family')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'family'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nombres Especiales</span>
              </button>
              <button
                onClick={() => setMenuTab('types')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'types'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pirotecnia</span>
              </button>
              <button
                onClick={() => setMenuTab('physics')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'physics'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Física y BPM</span>
              </button>
              <button
                onClick={() => setMenuTab('colors')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'colors'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colores</span>
              </button>
              <button
                onClick={() => setMenuTab('audio')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[38px] ${
                  menuTab === 'audio'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 bg-slate-800/40'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>
            </div>

            {/* In-App PWA Install Banner */}
            <div className="px-4 pt-3 pb-0">
              <PWAInstallButton />
            </div>

            {/* Tab Contents */}
            <div className="p-4 overflow-y-auto space-y-3.5 max-h-[58vh]">
              {/* TAB 1: SCENARIOS */}
              {menuTab === 'scenarios' && (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-slate-400 mb-1">
                    Escenarios adaptados a la proporción vertical de la pantalla de tu celular:
                  </div>
                  {scenarios.map((scen) => {
                    const isSelected = config.scenario === scen.id;
                    return (
                      <button
                        key={scen.id}
                        onClick={() => setConfig((prev) => ({ ...prev, scenario: scen.id }))}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left min-h-[54px] transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                          {scen.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100">{scen.name}</span>
                            {isSelected && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{scen.desc}</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* EFECTO CIELO ESTRELLADO */}
                  <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/70 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          <Star className="w-4 h-4 fill-amber-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100">Cielo Estrellado</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Fluctuación Suave
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Estrellas que titilan suavemente sin interferir con las explosiones
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, starrySky: !prev.starrySky }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] ${
                          config.starrySky !== false
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {config.starrySky !== false ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    {/* Star Intensity Slider */}
                    {config.starrySky !== false && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Intensidad / Brillo de Estrellas</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {Math.round((config.starIntensity ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.starIntensity ?? 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, starIntensity: Number(e.target.value) }))}
                          className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Sutil (50%)</span>
                          <span>Estándar (100%)</span>
                          <span>Brillante (150%)</span>
                        </div>
                      </div>
                    )}

                    {/* Sky Theme Selector */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
                      <span className="text-[11px] font-bold text-slate-300 block">Gradiente y Tono del Cielo</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            { id: 'deep_night', label: 'Noche Profunda', desc: 'Negro OLED puro y resplandor' },
                            { id: 'night', label: 'Noche Clásica', desc: 'Azul oscuro estelar' },
                            { id: 'twilight', label: 'Crepúsculo', desc: 'Violeta / Magenta' },
                            { id: 'dawn', label: 'Amanecer', desc: 'Azul alba suave' },
                          ] as const
                        ).map((theme) => {
                          const isCurrent =
                            (config.skyTheme || 'night') === theme.id ||
                            (theme.id === 'deep_night' && config.deepNightMode);
                          return (
                            <button
                              key={theme.id}
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  skyTheme: theme.id,
                                  deepNightMode: theme.id === 'deep_night',
                                }))
                              }
                              className={`p-2 rounded-xl text-center border min-h-[44px] transition-all ${
                                isCurrent
                                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-md'
                                  : 'bg-slate-800/50 text-slate-300 border-slate-700/60'
                              }`}
                            >
                              <span className="text-xs block font-bold">{theme.label}</span>
                              <span className={`text-[9px] block ${isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                                {theme.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* BOTÓN MODO NOCTURNO PROFUNDO */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border border-indigo-500/40 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/35">
                            <Moon className="w-4 h-4 fill-indigo-300 text-indigo-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100">Modo Nocturno Profundo</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-500/25 text-indigo-200 border border-indigo-400/35 font-bold">
                                Cine OLED
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Oscurece al máximo el cielo a negro azabache, resaltando el brillo y la luminosidad de todas las partículas
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setConfig((prev) => {
                              const newDeep = !(prev.deepNightMode || prev.skyTheme === 'deep_night');
                              return {
                                ...prev,
                                deepNightMode: newDeep,
                                skyTheme: newDeep ? 'deep_night' : 'night',
                              };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] ${
                            config.deepNightMode || config.skyTheme === 'deep_night'
                              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/35 ring-1 ring-indigo-400'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {config.deepNightMode || config.skyTheme === 'deep_night' ? 'Activado' : 'Desactivado'}
                        </button>
                      </div>
                    </div>

                    {/* CICLO DÍA-NOCHE (AUTO SHOW - 2 MINUTOS) */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/40 space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/35">
                            <Sun className="w-4 h-4 text-amber-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100">Ciclo Día-Noche</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/25 text-amber-200 border border-amber-400/35 font-bold">
                                Cada 2 min
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block leading-tight">
                              Fase activa: <strong className="text-amber-300">{dayNightPhaseName}</strong>. Cambia cielo y estrellas dinámicamente.
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfig((prev) => ({ ...prev, dayNightCycle: !prev.dayNightCycle }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] ${
                            config.dayNightCycle !== false
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {config.dayNightCycle !== false ? 'Activo' : 'Pausa'}
                        </button>
                      </div>
                      <button
                        onClick={handleAdvanceDayNight}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800/80 active:bg-slate-700 border border-amber-500/30 text-amber-200 text-xs font-semibold"
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Avanzar al siguiente cielo ahora</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: NOMBRES ESPECIALES FAMILIARES */}
              {menuTab === 'family' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-amber-500/40">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/35">
                        <Users className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">Cierre con Nombres Especiales</h3>
                        <p className="text-[10px] text-slate-400">
                          Forman en el cielo estas palabras con partículas de luz brillantes y centradas en el Gran Final o al tocarlas directamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {FAMILY_NAMES.map((name) => {
                      const isSelected = selectedWord === name;
                      return (
                        <div
                          key={name}
                          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'bg-slate-800/90 border-amber-400 shadow-md ring-1 ring-amber-400'
                              : 'bg-slate-800/40 border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-extrabold tracking-wide text-slate-100 font-serif">
                              "{name}"
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedWord(name);
                                setConfig((prev) => ({ ...prev, signatureWord: name }));
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all min-h-[32px] ${
                                isSelected
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-slate-700/60 text-slate-300'
                              }`}
                            >
                              {isSelected ? 'Activo' : 'Elegir'}
                            </button>
                            <button
                              onClick={() => handleFamilyWordLaunch(name)}
                              className="py-1.5 px-2.5 rounded-xl text-[10px] font-bold bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 shadow-sm active:scale-95 min-h-[32px]"
                              title={`Lanzar fuegos artificiales de "${name}"`}
                            >
                              ¡Lanzar!
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón Lanzar Aleatorio */}
                  <button
                    onClick={() => {
                      const randomWord = FAMILY_NAMES[Math.floor(Math.random() * FAMILY_NAMES.length)];
                      handleFamilyWordLaunch(randomWord);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xs shadow-md active:scale-95 min-h-[42px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lanzar Nombre Sorpresa Aleatorio</span>
                  </button>
                </div>
              )}

              {/* TAB 2: FIREWORK TYPES */}
              {menuTab === 'types' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fireworkTypes.map((type) => {
                    const isSelected = config.type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          audioEngine.init();
                          setConfig((prev) => ({ ...prev, type: type.id }));
                        }}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left min-h-[50px] transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">{type.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100">{type.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{type.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: PHYSICS & BPM */}
              {menuTab === 'physics' && (
                <div className="space-y-3">
                  {/* RHYTHMIC SYNC */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-100">Sincronización Rítmica</span>
                      </div>
                      <button
                        onClick={() => {
                          audioEngine.init();
                          setConfig((prev) => ({ ...prev, rhythmSync: !prev.rhythmSync }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          config.rhythmSync ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {config.rhythmSync ? 'Activado' : 'Desactivado'}
                      </button>
                    </div>
                    {/* BPM Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Tempo (BPM)</span>
                        <span className="font-mono text-amber-300 font-bold">{config.bpm} BPM</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        step="4"
                        value={config.bpm}
                        onChange={(e) => setConfig((prev) => ({ ...prev, bpm: Number(e.target.value) }))}
                        className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Particle Count Slider */}
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-bold">Partículas por Detonación</span>
                      <span className="font-mono text-amber-300 font-bold">{config.particleCount}</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="350"
                      step="10"
                      value={config.particleCount}
                      onChange={(e) => setConfig((prev) => ({ ...prev, particleCount: Number(e.target.value) }))}
                      className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>40 (Rápido)</span>
                      <span>160 (Móvil Óptimo)</span>
                      <span>350 (Intenso)</span>
                    </div>
                  </div>

                  {/* Rocket Speed Slider */}
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-bold">Velocidad / Tono Silbido</span>
                      <span className="font-mono text-orange-300 font-bold">{config.rocketSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.1"
                      value={config.rocketSpeed}
                      onChange={(e) => setConfig((prev) => ({ ...prev, rocketSpeed: Number(e.target.value) }))}
                      className="w-full accent-orange-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Explosion Force Slider */}
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-bold">Fuerza de la Explosión</span>
                      <span className="font-mono text-rose-300 font-bold">{config.explosionForce.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.0"
                      step="0.1"
                      value={config.explosionForce}
                      onChange={(e) => setConfig((prev) => ({ ...prev, explosionForce: Number(e.target.value) }))}
                      className="w-full accent-rose-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* SAUCE LLORÓN - BUFFER ACUMULATIVO */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-slate-900/80 border border-amber-400/40 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/35">
                          <Flame className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100">Sauce Llorón (Buffer Acumulativo)</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-amber-400/25 text-amber-300 border border-amber-400/35 font-bold">
                              60 FPS
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Buffer acumulativo de luz que estampa estelas doradas hiper-persistentes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Persistence Slider */}
                    <div className="space-y-1 pt-1.5 border-t border-amber-400/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200">Persistencia de Estelas (Buffer)</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {Math.round(((config.willowPersistence ?? 0.985) - 0.95) / 0.045 * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.955"
                        max="0.995"
                        step="0.002"
                        value={config.willowPersistence ?? 0.985}
                        onChange={(e) => setConfig((prev) => ({ ...prev, willowPersistence: Number(e.target.value) }))}
                        className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Estándar (95.5%)</span>
                        <span>Cascada Disney (98.5%)</span>
                        <span>Oro Infinito (99.5%)</span>
                      </div>
                    </div>

                    {/* Willow Glow Slider */}
                    <div className="space-y-1 pt-1.5 border-t border-amber-400/20">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200">Brillo de Estelas Acumulativas</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {(config.willowGlow ?? 1.25).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.2"
                        step="0.05"
                        value={config.willowGlow ?? 1.25}
                        onChange={(e) => setConfig((prev) => ({ ...prev, willowGlow: Number(e.target.value) }))}
                        className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1.0x (Natural)</span>
                        <span>1.25x (Radiante)</span>
                        <span>2.2x (Incandescente)</span>
                      </div>
                    </div>

                    {/* Test Button */}
                    <button
                      onClick={() => {
                        audioEngine.init();
                        engineRef.current?.triggerGoldenRain();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 mt-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Probar Cascada de Sauce Llorón</span>
                    </button>
                  </div>

                  {/* HUMO CINEMATOGRÁFICO */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/70 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-slate-700/60 text-slate-200 border border-slate-600/40">
                          <Wind className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100">Humo Cinematográfico</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-slate-700/80 text-slate-300 border border-slate-600/50">
                              Realismo Fotorrealista
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Bruma grisácea sutil tras los cohetes y explosiones con iluminación ambiental
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig((prev) => ({ ...prev, cinematicSmoke: prev.cinematicSmoke === false }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[34px] ${
                          config.cinematicSmoke !== false
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {config.cinematicSmoke !== false ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    {/* Smoke Density Slider */}
                    {config.cinematicSmoke !== false && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">Densidad de Humo Grisáceo</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {Math.round((config.smokeDensity ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={config.smokeDensity ?? 1.0}
                          onChange={(e) => setConfig((prev) => ({ ...prev, smokeDensity: Number(e.target.value) }))}
                          className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Sutil (50%)</span>
                          <span>Estándar (100%)</span>
                          <span>Volumétrico (150%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PALETTES */}
              {menuTab === 'colors' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {DISNEY_PALETTES.map((pal) => {
                      const isSelected = config.colorScheme === pal.id;
                      return (
                        <button
                          key={pal.id}
                          onClick={() => setConfig((prev) => ({ ...prev, colorScheme: pal.id }))}
                          className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left min-h-[46px] ${
                            isSelected
                              ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400'
                              : 'bg-slate-800/40 border-slate-700/60'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-xl border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span className="text-xs font-bold text-slate-200 truncate">{pal.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Color Personalizado</span>
                    <input
                      type="color"
                      value={config.customColor}
                      onChange={(e) => setConfig((prev) => ({ ...prev, colorScheme: 'custom', customColor: e.target.value }))}
                      className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: AUDIO */}
              {menuTab === 'audio' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Web Audio API</span>
                      <span className="text-[10px] text-slate-400">Silbidos, estruendo y chisporroteo</span>
                    </div>
                    <button
                      onClick={() => {
                        audioEngine.init();
                        const nextState = !config.soundEnabled;
                        setConfig((prev) => ({ ...prev, soundEnabled: nextState }));
                        setIsMuted(!nextState);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        config.soundEnabled && !isMuted ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {config.soundEnabled && !isMuted ? 'Activado' : 'Silenciado'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-bold">Volumen Maestro</span>
                      <span className="font-mono text-amber-300 font-bold">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => {
                        audioEngine.init();
                        setVolume(Number(e.target.value));
                      }}
                      className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
              <button
                onClick={handleGoldenRain}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-yellow-500/20 active:bg-yellow-500/35 border border-yellow-500/40 text-yellow-300"
              >
                Lluvia de Oro
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md"
              >
                Ver Fuegos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Center Tap Prompt (if no rockets active) */}
      {!isAutoShow && !showMenu && stats.particles === 0 && stats.rockets === 0 && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xs text-slate-300 font-medium tracking-wide w-[80%] max-w-xs">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-slate-700/60 shadow-xl flex items-center justify-center gap-2 animate-bounce">
            <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Toca la pantalla para disparar fuegos mágicos</span>
          </div>
        </div>
      )}
    </div>
  );
}

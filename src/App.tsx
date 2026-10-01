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
} from 'lucide-react';
import {
  FireworksEngine,
  FireworkConfig,
  FireworkType,
  DisneyScenario,
  DISNEY_PALETTES,
} from './utils/fireworks';
import { audioEngine } from './utils/audio';

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
    colorScheme: 'gold',
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
  });

  // UI State
  const [isAutoShow, setIsAutoShow] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [showMenu, setShowMenu] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [menuTab, setMenuTab] = useState<'scenarios' | 'types' | 'physics' | 'colors' | 'audio'>('scenarios');
  const [stats, setStats] = useState({ particles: 0, rockets: 0 });
  const [targets, setTargets] = useState<TargetIndicator[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Initialize Canvas & Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FireworksEngine(canvas, config);
    engineRef.current = engine;
    engine.start();

    engine.setStatsCallback((currentStats) => {
      setStats(currentStats);
    });

    engine.setBeatCallback((beat) => {
      setCurrentBeat(beat);
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
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
    });
  };

  // Export as standalone single-file HTML for mobile
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#03050e">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Disney Fireworks Mobile</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; -webkit-tap-highlight-color: transparent; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #03050e; font-family: -apple-system, system-ui, sans-serif; }
    canvas { width: 100vw; height: 100vh; display: block; }
    .hud-top { position: absolute; top: calc(env(safe-area-inset-top, 12px) + 8px); left: 12px; right: 12px; display: flex; justify-content: space-between; pointer-events: none; z-index: 10; }
    .hud-bottom { position: absolute; bottom: calc(env(safe-area-inset-bottom, 12px) + 8px); left: 12px; right: 12px; display: flex; justify-content: center; pointer-events: none; z-index: 10; }
    .bar { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 8px 14px; pointer-events: auto; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
    button { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 14px; min-height: 42px; padding: 8px 14px; font-weight: bold; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    button:active { transform: scale(0.96); background: rgba(255,255,255,0.25); }
    .btn-gold { background: linear-gradient(135deg, #f59e0b, #ef4444); color: #000; border: none; font-weight: 800; }
  </style>
</head>
<body>
  <div class="hud-top">
    <div class="bar">
      <span style="font-weight:bold; color:#fbbf24; font-size:13px;">✨ Disney Fireworks</span>
    </div>
    <div class="bar">
      <button onclick="toggleSound()" id="soundBtn">🔊 Sonido</button>
    </div>
  </div>
  <div class="hud-bottom">
    <div class="bar">
      <button class="btn-gold" onclick="toggleAuto()" id="autoBtn">▶ Auto Show</button>
      <button onclick="triggerFinale()">🎆 ¡Gran Final!</button>
      <button onclick="cycleScenario()">🏰 Escenario</button>
    </div>
  </div>
  <canvas id="c"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.resetTransform(); ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    resize();

    let actx = null, soundOn = true;
    function initAudio() { if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); }
    window.toggleSound = () => { soundOn = !soundOn; document.getElementById('soundBtn').textContent = soundOn ? '🔊 Sonido' : '🔇 Mudo'; };

    function playLaunch(spd) {
      if(!actx || !soundOn) return;
      const t = actx.currentTime;
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(260*spd, t); o.frequency.exponentialRampToValueAtTime(1050*spd, t+0.8);
      g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.12, t+0.05); g.gain.exponentialRampToValueAtTime(0.001, t+0.8);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+0.85);
    }

    function playBoom() {
      if(!actx || !soundOn) return;
      const t = actx.currentTime;
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(28, t+1.1);
      g.gain.setValueAtTime(0.48, t); g.gain.exponentialRampToValueAtTime(0.001, t+1.1);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+1.15);
    }

    let rockets = [], particles = [];
    let stars = [];
    function initStars() {
      stars = [];
      for(let i=0; i<130; i++) {
        stars.push({
          x: Math.random()*w,
          y: Math.pow(Math.random(), 1.25) * (h * 0.74),
          r: Math.random()*0.8 + 0.6,
          phase: Math.random()*Math.PI*2,
          speed: Math.random()*0.02 + 0.01,
          c: Math.random() > 0.4 ? '#ffffff' : (Math.random() > 0.5 ? '#fff4db' : '#d8eeff')
        });
      }
    }
    initStars();
    const colors = ['#ffd700', '#ff2a85', '#00d2ff', '#00ff88', '#d500f9'];
    let scenario = 0; // 0: Castle, 1: Tomorrowland, 2: Minimal
    window.cycleScenario = () => { scenario = (scenario + 1) % 3; };

    function launch(tx, ty) {
      initAudio();
      const sx = w*0.5 + (tx - w*0.5)*0.3; const sy = h + 10;
      const angle = Math.atan2(ty - sy, tx - sx); const spd = Math.hypot(tx-sx, ty-sy)/36;
      playLaunch(1.0);
      rockets.push({ x: sx, y: sy, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, tx, ty, c: colors[Math.floor(Math.random()*colors.length)] });
    }

    function detonate(x, y, color) {
      playBoom();
      const count = 130;
      for(let i=0; i<count; i++) {
        const a = Math.random()*Math.PI*2; const spd = Math.random()*5.2 + 0.8;
        particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, c: color, a: 1, d: Math.random()*0.015 + 0.011 });
      }
    }

    window.addEventListener('pointerdown', e => launch(e.clientX, e.clientY));
    let auto = false, autoTimer = null;
    window.toggleAuto = () => {
      auto = !auto;
      document.getElementById('autoBtn').textContent = auto ? '⏸ Pausar' : '▶ Auto Show';
      if(auto) autoTimer = setInterval(() => launch(w*0.15 + Math.random()*w*0.7, h*0.14 + Math.random()*h*0.35), 1800);
      else clearInterval(autoTimer);
    };

    window.triggerFinale = () => {
      initAudio();
      for(let i=0; i<16; i++) setTimeout(() => launch(w*0.1 + Math.random()*w*0.8, h*0.1 + Math.random()*h*0.4), i*150);
    };

    function loop() {
      ctx.fillStyle = 'rgba(3, 5, 14, 0.20)';
      ctx.fillRect(0, 0, w, h);

      // Twinkling Starfield in background with smooth opacity fluctuation
      for(let i=0; i<stars.length; i++) {
        const s = stars[i];
        s.phase += s.speed;
        const alpha = 0.12 + 0.65 * (Math.sin(s.phase)*0.5 + 0.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r*0.5, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      
      const wy = h * 0.80; const cx = w * 0.5;
      const s = Math.min(1.0, w / 400);

      // Scenery
      if(scenario === 0) {
        // Castle
        ctx.fillStyle = '#020409';
        ctx.beginPath();
        ctx.moveTo(cx - 160*s, wy); ctx.lineTo(cx - 130*s, wy - 60*s);
        ctx.lineTo(cx - 80*s, wy - 110*s); ctx.lineTo(cx, wy - 220*s);
        ctx.lineTo(cx + 80*s, wy - 110*s); ctx.lineTo(cx + 130*s, wy - 60*s);
        ctx.lineTo(cx + 160*s, wy);
        ctx.fill();
      } else if(scenario === 1) {
        // Tomorrowland
        ctx.fillStyle = '#020409';
        ctx.beginPath();
        ctx.moveTo(0, wy); ctx.lineTo(cx - 80*s, wy - 130*s); ctx.lineTo(cx, wy - 210*s);
        ctx.lineTo(cx + 90*s, wy - 90*s); ctx.lineTo(w, wy);
        ctx.fill();
      }

      // Lagoon
      ctx.fillStyle = '#020308';
      ctx.fillRect(0, wy, w, h - wy);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for(let i=rockets.length-1; i>=0; i--) {
        const r = rockets[i];
        r.x += r.vx; r.y += r.vy;
        ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI*2); ctx.fill();
        if(r.y <= r.ty) { detonate(r.x, r.y, r.c); rockets.splice(i, 1); }
      }
      if(particles.length > 500) particles.splice(0, particles.length - 500);
      for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.vx *= 0.965; p.vy *= 0.965; p.vy += 0.045; p.x += p.vx; p.y += p.vy; p.a -= p.d;
        ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        if(p.y < wy) {
          ctx.globalAlpha = Math.max(0, p.a*0.28);
          ctx.beginPath(); ctx.ellipse(p.x, wy + (wy - p.y)*0.75, 4, 1.5, 0, 0, Math.PI*2); ctx.fill();
        }
        if(p.a <= 0) particles.splice(i, 1);
      }
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
    a.download = 'fuegos_disney_movil.html';
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
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-rose-500/20 active:bg-rose-500/35 border border-rose-500/35 text-rose-300 min-h-[44px]"
              title="Lanzar Gran Final"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-bold mt-0.5">Final!</span>
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
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'night', label: 'Noche', desc: 'Oscura y profunda' },
                            { id: 'twilight', label: 'Crepúsculo', desc: 'Violeta / Magenta' },
                            { id: 'dawn', label: 'Amanecer', desc: 'Azul alba suave' },
                          ] as const
                        ).map((theme) => {
                          const isCurrent = (config.skyTheme || 'night') === theme.id;
                          return (
                            <button
                              key={theme.id}
                              onClick={() => setConfig((prev) => ({ ...prev, skyTheme: theme.id }))}
                              className={`p-2 rounded-xl text-center border min-h-[42px] transition-all ${
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
                  </div>
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

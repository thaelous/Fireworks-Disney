import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already running in standalone mode on device
  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
        <Check className="w-3.5 h-3.5" />
        <span>App Instalada</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 3500);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions fallback
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {compact ? (
        <button
          onClick={handleInstallClick}
          className="p-2.5 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition-all bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-400/40 text-amber-300 shadow-md shadow-amber-500/10 active:scale-95"
          title="Instalar App en el teléfono (PWA)"
        >
          <Smartphone className="w-4 h-4 text-amber-300 animate-pulse" />
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
        >
          <Smartphone className="w-4 h-4 fill-slate-950" />
          <span>Instalar App en el Celular (PWA)</span>
        </button>
      )}

      {/* Guided Installation Modal (for iOS & unsupported auto-prompt browsers) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 font-bold">
                  <Smartphone className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instalar en la Pantalla de Inicio</h3>
                  <p className="text-[11px] text-slate-400">PWA 100% Offline para Celular</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white">En iPhone/iPad (Safari):</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    Toca el botón <Share2 className="w-3.5 h-3.5 text-sky-400 inline" /> <strong>Compartir</strong> en la barra inferior.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white">Añadir a Inicio:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    Baja en el menú y selecciona <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> <strong>Añadir a pantalla de inicio</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white">En Android (Chrome):</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toca los tres puntos ⋮ arriba a la derecha y pulsa <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
              ✨ Se abrirá como una aplicación nativa a pantalla completa y funcionará sin conexión.
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {installedNotice && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Aplicación instalada exitosamente!</span>
        </div>
      )}
    </>
  );
};

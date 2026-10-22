import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';
import { TajLogo } from './TajLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isAppInstalled, installApp } = usePOS();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('taj_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      setCanPrompt(Boolean((window as any).deferredInstallPrompt));
    };
    checkPrompt();
    window.addEventListener('beforeinstallprompt', checkPrompt);
    window.addEventListener('taj_pwa_prompt_ready', checkPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', checkPrompt);
      window.removeEventListener('taj_pwa_prompt_ready', checkPrompt);
    };
  }, []);

  // If app is running inside standalone installed window, do not render banner at all
  if (isAppInstalled || isDismissed) {
    return (
      <PWAInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onNativeInstall={installApp}
        canNativeInstall={canPrompt}
      />
    );
  }

  const handleInstallClick = async () => {
    if (typeof (window as any).triggerPwaInstall === 'function' && (window as any).deferredInstallPrompt) {
      const ok = await (window as any).triggerPwaInstall();
      if (ok) return;
    }
    const success = await installApp();
    if (!success) {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('taj_pwa_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-[#1b263b] via-[#2c3e50] to-[#1b263b] text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3 backdrop-blur-md">
          {/* Logo & Text */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <TajLogo size="sm" showSubtitle={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white truncate">
                  Taj POS ایپ انسٹال کریں
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-bold uppercase tracking-wider shrink-0 border border-emerald-400/30">
                  App
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate">
                فون اور کمپیوٹر میں بغیر براؤزر تیز چلائیں
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span>انسٹال</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PWAInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onNativeInstall={installApp}
        canNativeInstall={canPrompt}
      />
    </>
  );
};

import React from 'react';
import { X, Smartphone, Monitor, Apple, ArrowUpRight, CheckCircle2, Download } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const InstallGuideModal: React.FC = () => {
  const { showInstallGuideModal, setShowInstallGuideModal } = usePOS();

  if (!showInstallGuideModal) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0d1b2a] text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Install Taj POS App</h3>
              <p className="text-[11px] text-emerald-400">تاج پوائنٹ آف سیل ایپ انسٹال کریں</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallGuideModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isInIframe && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col gap-2">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                <span>⚠️ Note: Running inside Preview Frame</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Browsers only permit direct PWA app installation from full browser tabs. Click below to open directly in your browser:
              </p>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Open in Full Browser Tab</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Apple className="w-4 h-4 text-slate-700" />
                <span>iPhone / iPad (Safari) instructions:</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Tap the <strong className="text-slate-800 font-semibold">Share</strong> button (box with an arrow pointing up ⎋) at the bottom.
                </li>
                <li>
                  Scroll down and tap <strong className="text-emerald-700 font-semibold">&ldquo;Add to Home Screen&rdquo;</strong> (ہوم اسکرین پر شامل کریں).
                </li>
                <li>
                  Tap <strong className="text-slate-800 font-semibold">&ldquo;Add&rdquo;</strong> at the top right. Taj POS icon will appear on your device!
                </li>
              </ol>
            </div>
          )}

          {/* Android Instructions */}
          {isAndroid && !isIOS && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android (Chrome) instructions:</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Tap the <strong className="text-slate-800 font-semibold">three dots (⋮)</strong> menu in top-right of Chrome.
                </li>
                <li>
                  Select <strong className="text-emerald-700 font-semibold">&ldquo;Install app&rdquo;</strong> or <strong className="text-emerald-700 font-semibold">&ldquo;Add to Home Screen&rdquo;</strong>.
                </li>
                <li>
                  Confirm <strong className="text-slate-800 font-semibold">&ldquo;Install&rdquo;</strong> to access Taj POS directly like a native app.
                </li>
              </ol>
            </div>
          )}

          {/* Desktop Instructions */}
          {!isIOS && !isAndroid && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Chrome / Edge Desktop instructions:</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Look at the right side of your browser <strong className="text-slate-800 font-semibold">Address Bar</strong>.
                </li>
                <li>
                  Click the <strong className="text-emerald-700 font-semibold">Install</strong> icon (computer with down arrow or ⊕).
                </li>
                <li>
                  Or click browser menu (<strong className="text-slate-800 font-semibold">⋮</strong>) &rarr; <strong className="text-emerald-700 font-semibold">&ldquo;Install Taj POS&rdquo;</strong>.
                </li>
              </ol>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Offline working supported</span>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallGuideModal(false)}
              className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              OK, Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

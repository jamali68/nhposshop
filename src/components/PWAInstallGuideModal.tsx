import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Share2, MoreVertical, PlusSquare, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { TajLogo } from './TajLogo';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => Promise<boolean | void> | void;
  canNativeInstall?: boolean;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall = false
}) => {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b263b] via-[#2c3e50] to-[#1b263b] text-white p-4 sm:p-5 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
              <TajLogo size="sm" showSubtitle={false} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Taj POS ایپ انسٹال کریں
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium">
                فون اور کمپیوٹر میں عام ایپس کی طرح چلائیں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1.5 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setDeviceType('android')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceType === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-500/20'
                : 'hover:bg-slate-200/60 text-slate-500'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceType('ios')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceType === 'ios'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-500/20'
                : 'hover:bg-slate-200/60 text-slate-500'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceType('desktop')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceType === 'desktop'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-500/20'
                : 'hover:bg-slate-200/60 text-slate-500'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>PC / Laptop</span>
          </button>
        </div>

        {/* Instructions Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 text-xs leading-relaxed">
          {/* Direct Install Button */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col items-center text-center gap-2">
            <span className="text-emerald-950 font-bold text-xs">
              براؤزر سے فوری انسٹالیشن شروع کریں:
            </span>
            <button
              type="button"
              onClick={async () => {
                if (typeof (window as any).triggerPwaInstall === 'function') {
                  const res = await (window as any).triggerPwaInstall();
                  if (res) {
                    onClose();
                    return;
                  }
                }
                if (onNativeInstall) {
                  const res = await onNativeInstall();
                  if (Boolean(res)) {
                    onClose();
                    return;
                  }
                }
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 animate-bounce" />
              <span>📲 ابھی ایپ انسٹال کریں (Install Now)</span>
            </button>
          </div>

          {/* Android Step-by-Step */}
          {deviceType === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">کروم براؤزر کے اوپر کونے میں 3 ڈاٹس پر کلک کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    Chrome screen top right: <MoreVertical className="w-3.5 h-3.5 text-slate-700 inline" /> <strong>(⋮ Menu)</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">"Install app" یا "Add to Home screen" منتخب کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    مینو میں <strong>"ایپ انسٹال کریں"</strong> یا <strong>"ہوم اسکرین میں شامل کریں"</strong> پر ٹیپ کریں۔
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">"Install" پر کلک کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    چند سیکنڈز میں ایپ کا آئیکن آپ کے فون کی مین اسکرین پر عام ایپس کی طرح شو ہو جائے گا!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iOS Safari Step-by-Step */}
          {deviceType === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">سفاری براؤزر کے نیچے "Share" بٹن پر ٹیپ کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    Safari bottom bar: <Share2 className="w-3.5 h-3.5 text-blue-600 inline" /> <strong>(Share Icon)</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">نیچے اسکرول کریں اور "Add to Home Screen" دبائیں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" /> <strong>"Add to Home Screen"</strong> منتخب کریں۔
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">اوپر دائیں کونے میں "Add" پر کلک کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Taj POS کا آئیکن آپ کی ہوم اسکرین پر شامل ہو جائے گا۔
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Step-by-Step */}
          {deviceType === 'desktop' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">ایڈریس بار کے دائیں طرف انسٹال آئیکن دیکھیں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Chrome ya Edge براؤزر میں URL بار کے آخر پر <strong>[⊞ Install]</strong> کا نشان آتا ہے۔
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">"Install" بٹن پر کلک کریں</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    ایپ ڈیسک ٹاپ ونڈو کی طرح الگ کھل جائے گی اور ڈیسک ٹاپ پر شارٹ کٹ بن جائے گا۔
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-800 block">✨ انسٹال کرنے کے فائدے:</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> فل اسکرین، بغیر براؤزر بار
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> آف لائن کیش بک سپورٹ
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> فوری 1-کلک اوپن
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> موبائل اور پی سی دونوں پر
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            سمجھ آ گئی (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

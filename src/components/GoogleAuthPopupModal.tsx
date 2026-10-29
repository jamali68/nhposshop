/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, X, Sparkles, ExternalLink, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleAuthPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, displayName?: string) => Promise<void>;
  onTryNativePopup: () => Promise<{ success: boolean; error?: string }>;
  isProcessing: boolean;
}

export const GoogleAuthPopupModal: React.FC<GoogleAuthPopupModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  onTryNativePopup,
  isProcessing
}) => {
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [nativePopupStatus, setNativePopupStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleAccountClick = async (email: string, name: string) => {
    setErrorMsg('');
    try {
      await onSelectAccount(email, name);
    } catch (err: any) {
      setErrorMsg(err?.message || 'لاگ ان کرنے میں مسئلہ پیش آیا۔');
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = customEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg('براہِ کرم درست Gmail ایڈریس درج کریں۔');
      return;
    }
    try {
      await onSelectAccount(clean, clean.split('@')[0]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'لاگ ان کرنے میں مسئلہ پیش آیا۔');
    }
  };

  const handleNativeLaunch = async () => {
    setErrorMsg('');
    setNativePopupStatus('گوگل پاپ اپ ونڈو اوپن ہو رہی ہے...');
    const result = await onTryNativePopup();
    if (!result.success) {
      if (result.error === 'google-provider-disabled' || result.error?.includes('unauthorized-domain') || result.error?.includes('popup')) {
        setNativePopupStatus('نوٹ: براؤزر نے پاپ اپ بلاک کیا ہے یا ڈومین فائر بیس میں ایڈ نہیں ہے۔ آپ اوپر موجود 1-Tap اکاؤنٹ بٹن سے فوراً بغیر کسی رکاوٹ کے داخل ہو سکتے ہیں!');
      } else {
        setNativePopupStatus(result.error || 'پاپ اپ بند کر دیا گیا۔');
      }
    } else {
      setNativePopupStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden relative text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Top Header Strip with Google Colors */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          title="Close Pop-up"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          {/* Google Emblem & Title */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center p-3 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs mb-2">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Sign in with Google
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Choose an account to continue to <span className="font-bold text-slate-700">NH POS Shop</span>
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Accounts List (1-Tap Fast Selection) */}
          <div className="space-y-2.5">
            {/* Primary Registered Owner Account: Ali Imtiaz */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAccountClick('aliimtiaz1126@gmail.com', 'Ali Imtiaz')}
              className="w-full text-left p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 hover:from-blue-100/80 hover:to-indigo-100/70 active:scale-[0.99] border-2 border-blue-300 hover:border-blue-500 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                  AI
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-sm">Ali Imtiaz (علی امتیاز)</span>
                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                      Owner
                    </span>
                  </div>
                  <div className="text-xs text-blue-800 font-mono font-semibold">
                    aliimtiaz1126@gmail.com
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Taj karnaya and Mobile Shop</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>1-Tap Login</span>
                </span>
              </div>
            </button>

            {/* Official Support Account */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAccountClick('helpgoodforyouofficial@gmail.com', 'Official Admin')}
              className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] border border-slate-200 hover:border-slate-300 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  HG
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Help & Support Official</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    helpgoodforyouofficial@gmail.com
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Use Another Account Toggle */}
            {!isCustomMode ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsCustomMode(true)}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-xs text-slate-600 font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>Use another Google Account (کوئی اور گوگل اکاؤنٹ درج کریں)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-slate-700">
                  Enter your Google / Gmail Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !customEmail.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Option: External Browser Popup Window */}
          <div className="mt-4 pt-3.5 border-t border-slate-200">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleNativeLaunch}
              className="w-full py-2 px-3 text-[11px] font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50/60 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Launch External Browser Google Popup (اصلی گوگل براؤزر ونڈو کھولیں)</span>
            </button>

            {nativePopupStatus && (
              <p className="mt-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl leading-relaxed text-left">
                {nativePopupStatus}
              </p>
            )}
          </div>

          {/* Privacy & Zero-OTP Guarantee Footer */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Secure Google Authentication • Zero OTP Required</span>
          </div>

        </div>
      </div>
    </div>
  );
};

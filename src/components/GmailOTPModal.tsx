/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, ArrowRight, RefreshCw, KeyRound, ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';
import { TajLogo } from './TajLogo';

interface GmailOTPModalProps {
  email: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; otp?: string; error?: string }>;
  onCancel: () => void;
}

export const GmailOTPModal: React.FC<GmailOTPModalProps> = ({
  email,
  onVerify,
  onResend,
  onCancel
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendNotification, setResendNotification] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric
    const clean = val.replace(/\D/g, '');
    setError('');

    if (clean.length > 1) {
      // Handle paste of whole OTP
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    // Auto advance to next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newDigits = [...digits];
      for (let i = 0; i < pasteData.length; i++) {
        newDigits[i] = pasteData[i];
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pasteData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullCode = digits.join('').trim();
    if (fullCode.length !== 6) {
      setError('براہِ کرم اپنی ای میل سے موصول شدہ 6 ہندسوں کا مکمل OTP کوڈ درج کریں۔');
      return;
    }

    setIsVerifying(true);
    const result = await onVerify(fullCode);
    setIsVerifying(false);

    if (!result.success) {
      setError(result.error || 'درج کردہ کوڈ غلط ہے یا ایکسپائر ہو چکا ہے۔ برائے مہربانی اپنا Gmail ان باکس چیک کر کے دوبارہ کوڈ درج کریں۔');
    }
  };

  const handleResendClick = async () => {
    if (resendCountdown > 0 || isResending) return;
    setError('');
    setResendNotification('');
    setIsResending(true);
    const result = await onResend();
    setIsResending(false);

    if (result.success) {
      setResendCountdown(60);
      setDigits(['', '', '', '', '', '']);
      setResendNotification('نیا تصدیقی کوڈ آپ کے Gmail پر دوبارہ بھیج دیا گیا ہے۔');
      setTimeout(() => setResendNotification(''), 4000);
      inputRefs.current[0]?.focus();
    } else {
      setError(result.error || 'دوبارہ کوڈ بھیجنے میں مسئلہ پیش آیا۔');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-slate-800 text-center relative">
        {/* Taj POS Emblem */}
        <div className="flex justify-center mb-3">
          <TajLogo size="md" />
        </div>

        {/* Header */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>1st Time Sign Up • پہلی بار رجسٹریشن</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Gmail OTP Verification
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            اپنی دکان کے رجسٹریشن کی تصدیق کے لیے ای میل کوڈ درج کریں
          </p>
        </div>

        {/* Target Email Badge with Change Button */}
        <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-mono font-bold text-slate-800 truncate text-[11px] sm:text-xs">
              {email}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>ای میل تبدیل کریں</span>
          </button>
        </div>

        {/* Real Email Check Instructions Card (No open code shown on screen!) */}
        <div className="mt-4 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 rounded-2xl text-left space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
              <MailCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-950">
                تصدیقی کوڈ آپ کی ای میل (Gmail) پر بھیج دیا گیا ہے
              </h4>
              <p className="text-[11px] text-blue-900/90 font-normal mt-1 leading-relaxed">
                اپنے فون یا کمپیوٹر میں <strong>Gmail ایپ / ان باکس</strong> کھولیں۔ وہاں آیا ہوا 6 ہندسوں کا کوڈ کاپی کر کے نیچے باکس میں درج کریں۔
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[10px] text-blue-700 font-medium">
            <span className="font-bold text-blue-800">💡 نوٹ:</span>
            <span>اگر ان باکس میں ای میل نہ ملے تو <strong>Spam / Junk</strong> فولڈر بھی چیک کریں۔</span>
          </div>
        </div>

        {/* Resend notification */}
        {resendNotification && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-left animate-in fade-in flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resendNotification}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-left animate-in fade-in flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form with 6 Digit Input Boxes (Allows Copy/Paste or Manual Typing) */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2">
              6 ہندسوں کا OTP کوڈ درج کریں (Enter 6-Digit Code)
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  placeholder="•"
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-black text-xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl text-slate-900 shadow-xs focus:outline-none transition-all placeholder:text-slate-300"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || digits.join('').length !== 6}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'تصدیق ہو رہی ہے...' : 'کوڈ تصدیق کریں (Verify & Launch Store)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Resend and Cancel Actions Row */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <button
              type="button"
              disabled={resendCountdown > 0 || isResending}
              onClick={handleResendClick}
              className="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {resendCountdown > 0
                  ? `دوبارہ کوڈ بھیجیں (${resendCountdown}s)`
                  : 'دوبارہ کوڈ بھیجیں (Resend Code)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              منسوخ کریں (Cancel)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

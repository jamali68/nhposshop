/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ForcePasswordChangeModal
 * Mandatory security prompt that requires legacy accounts (using temporary 123456)
 * to set a new, persistent, cryptographically hashed secure password.
 * Cannot be bypassed or dismissed until a valid password is saved.
 */

import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TajLogo } from './TajLogo';

export const ForcePasswordChangeModal: React.FC = () => {
  const { mustChangePassword, changeOwnerPassword, currentUser } = usePOS();

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!mustChangePassword || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPass = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPass.length < 6) {
      setError('پاس ورڈ کم از کم 6 ہندسوں یا حروف کا ہونا لازمی ہے۔ (Password must be at least 6 characters)');
      return;
    }

    if (trimmedPass === '123456') {
      setError('عارضی پاس ورڈ (123456) کا دوبارہ استعمال ممنوع ہے۔ براہِ کرم ایک نیا مضبوط پاس ورڈ بنائیں۔ (Cannot reuse 123456)');
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      setError('دونوں پاس ورڈز آپس میں میل نہیں کھاتے۔ براہِ کرم دوبارہ چیک کریں۔ (Passwords do not match)');
      return;
    }

    setIsSubmitting(true);
    const result = await changeOwnerPassword(trimmedPass);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'پاس ورڈ محفوظ کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-300 text-slate-800 relative overflow-hidden">
        {/* Top Warning Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <div className="flex items-center justify-center mb-3">
          <TajLogo size="md" />
        </div>

        <div className="text-center space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-black uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>سیکیورٹی نوٹس: نیا پاس ورڈ بنانا لازمی ہے</span>
          </span>

          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Create Your Permanent Shop Password
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            آپ کے اکاؤنٹ کو عارضی پاس ورڈ <code className="px-1.5 py-0.5 bg-slate-100 text-rose-600 font-mono font-bold rounded">123456</code> سے اپ گریڈ کیا جا رہا ہے۔ براہِ کرم اپنی دکان کے لیے کم از کم 6 ہندسوں کا نیا محفوظ پاس ورڈ بنائیں تاکہ آپ اور صرف آپ اس دکان کو کھول سکیں۔
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-left animate-in fade-in">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-black">نیا پاس ورڈ کامیابی سے محفوظ ہو گیا!</p>
            <p className="text-[11px] text-emerald-700">آپ کا اکاؤنٹ اب محفوظ ہے۔ سسٹم اوپن ہو رہا ہے...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-left text-xs">
            {/* New Password */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                نیا پاس ورڈ (New Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="نیا پاس ورڈ درج کریں"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                دوبارہ نیا پاس ورڈ لکھیں (Confirm Password) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="دوبارہ نیا پاس ورڈ درج کریں"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Tips */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">یاد دہانی:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li>پاس ورڈ کم از کم 6 ہندسوں یا حروف کا ہو</li>
                <li>یہ پاس ورڈ آپ اپنے پاس محفوظ رکھیں</li>
                <li>آئندہ آپ بغیر گوگل کے بھی اسی پاس ورڈ سے لاگ ان کر سکیں گے</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-black text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>نیا پاس ورڈ محفوظ کریں اور جاری رکھیں</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

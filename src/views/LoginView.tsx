/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  LogIn,
  AlertCircle,
  Sparkles,
  Store,
  Users,
  Mail,
  ArrowRight,
  Download
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TajLogo } from '../components/TajLogo';
import { useAppVersion } from '../utils/version';
import { GmailOTPModal } from '../components/GmailOTPModal';
import { PWAInstallGuideModal } from '../components/PWAInstallGuideModal';

export const LoginView: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithGmail,
    verifyGmailOTP,
    resendGmailOTP,
    cancelOtpVerification,
    isOtpVerificationRequired,
    pendingOtpEmail,
    pendingOtpCode,
    loginStaff,
    loginDemoStore,
    isAppInstalled,
    installApp
  } = usePOS();
  const { version: appVersion } = useAppVersion();

  // Tab State: 'admin_google' | 'staff_login' | 'demo_store'
  const [activeTab, setActiveTab] = useState<'admin_google' | 'staff_login' | 'demo_store'>('admin_google');
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  // Dynamic Gmail Input Form State
  const [gmailInput, setGmailInput] = useState<string>('');
  const [isGmailLoading, setIsGmailLoading] = useState<boolean>(false);

  // Staff Form State
  const [staffUsername, setStaffUsername] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [isStaffLoading, setIsStaffLoading] = useState<boolean>(false);

  // Loading & Error
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    setIsGoogleLoading(false);
    if (!result.success) {
      if (result.error === 'google-provider-disabled') {
        setError('گوگل پاپ اپ براؤزر نے روکا ہے یا فائر بیس ڈومین محدود ہے۔ برائے مہربانی نیچے اپنا جی میل ایڈریس لکھیں — بغیر کسی OTP کے فوری ڈائریکٹ لاگ ان ہوگا!');
      } else {
        setError(result.error || 'Google sign in failed. Please try again.');
      }
    }
  };

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = gmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('برائے مہربانی درست ای میل ایڈریس (Gmail) درج کریں۔');
      return;
    }

    setIsGmailLoading(true);
    // Explicitly pass skipOtp = true: Zero OTP required!
    const result = await loginWithGmail(cleanEmail, undefined, true);
    setIsGmailLoading(false);

    if (!result.success) {
      setError(result.error || 'لاگ ان کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUser = staffUsername.trim();
    const cleanPass = staffPassword.trim();
    if (!cleanUser || !cleanPass) {
      setError('برائے مہربانی یوزر نیم اور پاس ورڈ دونوں درج کریں۔ (Please provide username and password)');
      return;
    }
    if (cleanPass.length < 6) {
      setError('پاس ورڈ کم از کم 6 ہندسوں یا حروف کا ہونا لازمی ہے۔ (Password must be at least 6 characters)');
      return;
    }
    setIsStaffLoading(true);
    const result = await loginStaff(cleanUser, cleanPass);
    setIsStaffLoading(false);
    if (!result.success) {
      setError(result.error || 'درج کردہ تفصیلات غلط ہیں۔ دکان کے مالک سے درست تفصیلات حاصل کریں۔');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* 1st Time Sign Up Gmail OTP Verification Modal */}
      {isOtpVerificationRequired && pendingOtpEmail && (
        <GmailOTPModal
          email={pendingOtpEmail}
          onVerify={(code) => verifyGmailOTP(pendingOtpEmail, code)}
          onResend={resendGmailOTP}
          onCancel={cancelOtpVerification}
        />
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 w-full max-w-md text-center relative overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600" />

        {/* Taj Logo Emblem */}
        <div className="flex justify-center mb-3">
          <TajLogo size="lg" />
        </div>

        <h2 className="text-2xl font-black text-[#2c3e50] tracking-tight flex items-center justify-center gap-1.5">
          <span>NH POS Shop</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold">
            {appVersion}
          </span>
        </h2>
        <p className="text-xs text-[#95a5a6] font-medium mt-0.5">Multi-User Cloud POS & Retail SaaS</p>

        {/* PWA Direct Install Button for First-Time Users */}
        {!isAppInstalled && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                const ok = await installApp();
                if (!ok) {
                  setShowInstallGuide(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              <span>📱 فون میں ایپ انسٹال کریں (Install App)</span>
            </button>
          </div>
        )}

        {/* Login Type Tabs (Shop Owner | Staff Member | Demo Store) */}
        <div className="mt-5 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin_google');
              setError('');
            }}
            className={`py-2 px-1.5 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'admin_google'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 text-slate-900 font-bold">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>👑 Owner</span>
            </div>
            <span className="text-[8px] font-normal text-slate-500">Google / Gmail</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff_login');
              setError('');
            }}
            className={`py-2 px-1.5 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'staff_login'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 text-slate-900 font-bold">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>💼 Staff</span>
            </div>
            <span className="text-[8px] font-normal text-slate-500">Shop ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('demo_store');
              setError('');
            }}
            className={`py-2 px-1.5 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'demo_store'
                ? 'bg-white text-slate-900 shadow-sm border border-amber-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 text-amber-700 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>🧪 Demo</span>
            </div>
            <span className="text-[8px] font-normal text-amber-700">Auto-Reset 30m</span>
          </button>
        </div>

        {/* Error Notice */}
        {error ? (
          <div className="mt-4 p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold text-left flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        ) : null}

        {/* Tab 1: Real Admin Shop Owner Login via Google / Gmail */}
        {activeTab === 'admin_google' && (
          <div className="mt-6 space-y-4 text-left">
            <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/60 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-2.5 shadow-xs">
              <div className="font-extrabold flex items-center justify-between text-blue-900 text-sm">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Shop Owner Sign In & Sign Up</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  Multi-Store SaaS
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-normal">
                اپنی گوگل یا جی میل (Gmail) سے سائن ان کریں۔ بغیر کسی OTP کے فوری داخلہ ہوگا!
              </p>
              <div className="pt-2 border-t border-blue-200/70 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ایک جی میل = ایک مکمل خود مختار کلاؤڈ دکان</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium text-[10px]">
                  <span className="text-blue-600 font-black">✓</span>
                  <span>100% بغیر کسی OTP کوڈ کے فوری اور ڈائریکٹ لاگ ان</span>
                </div>
              </div>
            </div>

            {/* Method 3 Button: Universal Google Sign-In / Sign-Up */}
            <div>
              <button
                type="button"
                disabled={isGoogleLoading || isGmailLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-300 hover:border-blue-500 rounded-2xl font-black text-slate-800 text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {/* Google G SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isGoogleLoading ? 'Connecting Google...' : 'Sign in with Google (بغیر OTP ڈائریکٹ داخل ہوں)'}</span>
              </button>
            </div>

            {/* Clean Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                یا اپنا جی میل لکھیں (Or Enter Gmail)
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Dynamic Multi-Tenant Gmail Input Form (Any user can enter their Gmail) */}
            <form onSubmit={handleGmailSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Owner Gmail Address (دکان کے مالک کی ای میل)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={gmailInput}
                    onChange={e => {
                      setGmailInput(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. aliimtiaz1126@gmail.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGmailLoading || !gmailInput.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md shadow-blue-600/25 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <span>{isGmailLoading ? 'Signing in...' : 'Continue with Gmail (بغیر OTP فوری داخل ہوں)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Multi-Tenant How-it-Works Explanatory Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[11px] text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ملٹی یوزر سسٹم کیسے کام کرتا ہے؟</span>
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-600 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span><strong>فوری ڈائریکٹ لاگ ان (No OTP):</strong> چاہے آپ گوگل بٹن دبائیں یا نیچے اپنا جی میل لکھیں — کسی OTP کی ضرورت نہیں ہے۔</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-black">✓</span>
                  <span><strong>خودکار ڈیٹا لوڈ:</strong> اگر پہلے سے دکان کا ڈیٹا موجود ہے تو تمام ریکارڈز فوراً کلاؤڈ سے کھل جائیں گے، اور نئی دکان ہو تو فوری دکان کے نام کا فارم آئے گا۔</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Staff Login (Created by Admin) */}
        {activeTab === 'staff_login' && (
          <form onSubmit={handleStaffSubmit} className="mt-6 space-y-3.5 text-xs text-left">
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-900">
              <span className="font-bold">💼 Staff Member Login:</span>
              <p className="mt-0.5 text-purple-700">
                دکان کے مالک کا فراہم کردہ یوزر نیم (NH-...) اور پاس ورڈ درج کریں۔
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Staff Username (شناختی آئی ڈی)
                </label>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded font-mono">
                  NH- Prefix
                </span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={staffUsername}
                  onChange={e => {
                    setStaffUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. NH-ali01 (یا صرف ali01)"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                * تمام عملے کا یوزر نیم NH سے شروع ہوتا ہے۔ آپ NH- کے ساتھ یا بغیر بھی لکھ سکتے ہیں۔
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Password (پاس ورڈ)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  کم از کم 6 ہندسے
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={staffPassword}
                  onChange={e => {
                    setStaffPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="پاس ورڈ (Min 6 characters)"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isStaffLoading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isStaffLoading ? 'Checking Credentials...' : 'Staff Login'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Dedicated Live Interactive Demo Account Screen */}
        {activeTab === 'demo_store' && (
          <div className="mt-6 space-y-4 text-left">
            <div className="p-4 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 border-2 border-dashed border-amber-400 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      تاج ڈیمو سپر سٹور (Live Demo)
                    </h3>
                    <p className="text-[11px] text-amber-900 font-semibold">
                      مکمل بھری ہوئی دکان • فوری رسائی بغیر پاسورڈ
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 border border-amber-400/50 shrink-0">
                  Auto-Reset 30m
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                اگر آپ کو سسٹم سمجھ نہیں آ رہا تو اس ڈیمو اکاؤنٹ میں جا کر دیکھیں۔ تمام کھاتے، کیش بک، ادھار، کسٹمرز اور پی او ایس پہلے سے بھرے ہوئے ہیں۔ آپ نیا ڈیٹا شامل بھی کر سکتے ہیں اور ڈیلیٹ بھی کر سکتے ہیں۔ ہر ۳۰ منٹ بعد یہ خود بخود دوبارہ اصل حالت میں بحال ہو جائے گا۔
              </p>

              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>پی او ایس کاؤنٹر، بارکوڈ اور تھرمل رسیدیں</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>یومیہ کیش بک اور بیک کیش والٹ بیلنس</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>گاہکوں اور ہول سیلرز کے لائیو ادھار کھاتے</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>ایزی لوڈ کمیشن اور بوتل کریٹس انوینٹری</span>
                </div>
              </div>

              <button
                type="button"
                onClick={loginDemoStore}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg shadow-amber-500/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>ڈیمو دکان میں داخل ہوں (Start Live Demo)</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Interactive Demo Account Card (Shown below if on Google or Staff tab for easy 1-click access) */}
        {activeTab !== 'demo_store' && (
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-dashed border-amber-400/60 rounded-2xl p-4 text-left relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏪</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">
                      تجرباتی دکان (Live Demo Account)
                    </h3>
                    <p className="text-[10px] text-amber-800 font-medium">
                      بغیر لاگ ان کے دیکھیں • تمام کھاتے پہلے سے بھرے ہوئے ہیں
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/30 shrink-0">
                  Auto-Reset 30m
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                کوئی بھی دکاندار اس ڈیمو میں جا کر تمام کھاتے، کیش بک، ایزی لوڈ اور سیلز چیک کر سکتا ہے، نیا ڈیٹا ڈال سکتا ہے اور ڈیلیٹ کر کے ٹیسٹ کر سکتا ہے۔ ہر ۳۰ منٹ بعد یہ ڈیٹا خود بخود اصل حالت میں بحال ہو جائے گا۔
              </p>

              <button
                type="button"
                onClick={loginDemoStore}
                className="mt-3.5 w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>ڈیمو دکان میں داخل ہوں (Explore Demo Store)</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Text */}
        <div className="mt-6 text-[10px] text-[#bdc3c7] font-bold tracking-widest uppercase">
          POWERED BY WASI DEVELOPER • NH POS SHOP
        </div>
      </div>

      {/* Guide Modal for Login View */}
      <PWAInstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        onNativeInstall={installApp}
        canNativeInstall={Boolean((window as any).deferredInstallPrompt)}
      />
    </div>
  );
};

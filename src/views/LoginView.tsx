/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Download,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  UserPlus,
  Languages
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TajLogo } from '../components/TajLogo';
import { useAppVersion } from '../utils/version';
import { GmailOTPModal } from '../components/GmailOTPModal';
import { PWAInstallGuideModal } from '../components/PWAInstallGuideModal';
import { getStoredAuthorizedEmail } from '../utils/deviceSecurity';

export const LoginView: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithGmail,
    registerNewShop,
    verifyGmailOTP,
    resendGmailOTP,
    cancelOtpVerification,
    isOtpVerificationRequired,
    pendingOtpEmail,
    loginStaff,
    loginDemoStore,
    isAppInstalled,
    installApp,
    authRedirectError,
    setAuthRedirectError
  } = usePOS();
  const { version: appVersion } = useAppVersion();

  // Language Switch State: default is 'en' (English) as requested
  const [lang, setLang] = useState<'en' | 'ur'>(() => {
    try {
      const saved = localStorage.getItem('taj_login_lang');
      return saved === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('taj_login_lang', lang);
    } catch {}
  }, [lang]);

  // Temporary flag to hide Google Sign In as requested by user
  const SHOW_GOOGLE_SIGNIN = false;

  // Tab State: 'login' | 'signup' | 'staff_login' | 'demo_store'
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'staff_login' | 'demo_store'>('login');
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  // Login Form State
  const [gmailInput, setGmailInput] = useState<string>(() => getStoredAuthorizedEmail() || '');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);
  const [isGmailLoading, setIsGmailLoading] = useState<boolean>(false);

  // Sign Up / New Shop Registration Form State
  const [signupShopName, setSignupShopName] = useState<string>('');
  const [signupOwnerName, setSignupOwnerName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>(() => getStoredAuthorizedEmail() || '');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupAddress, setSignupAddress] = useState<string>('');
  const [isSignupLoading, setIsSignupLoading] = useState<boolean>(false);

  // Staff Form State
  const [staffUsername, setStaffUsername] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [isStaffLoading, setIsStaffLoading] = useState<boolean>(false);

  // Google Loading & Error
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('taj_pos_google_redirecting') === 'true';
    } catch {
      return false;
    }
  });
  const [error, setError] = useState<string>('');

  const activeError = error || authRedirectError || '';

  const handleGoogleSignIn = async () => {
    setError('');
    if (setAuthRedirectError) setAuthRedirectError(null);
    setIsGoogleLoading(true);

    let safetyTimer: any = null;

    try {
      const result = await loginWithGoogle();
      if (result?.redirecting) {
        safetyTimer = setTimeout(() => {
          setIsGoogleLoading(false);
          try { sessionStorage.removeItem('taj_pos_google_redirecting'); } catch {}
        }, 12000);
        return;
      }
      if (!result.success) {
        setError(result.error || (lang === 'en' ? 'Google sign in failed. Please try again.' : 'گوگل سائن ان میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔'));
      }
    } catch (e: any) {
      setError(e?.message || (lang === 'en' ? 'Google sign in encountered an error.' : 'گوگل سائن ان میں خرابی پیش آئی۔'));
    } finally {
      if (!sessionStorage.getItem('taj_pos_google_redirecting')) {
        setIsGoogleLoading(false);
        if (safetyTimer) clearTimeout(safetyTimer);
      }
    }
  };

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = gmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError(lang === 'en' ? 'Please enter a valid email address.' : 'برائے مہربانی درست ای میل ایڈریس درج کریں۔');
      return;
    }
    const cleanPass = ownerPassword.trim();
    if (!cleanPass) {
      setError(lang === 'en' ? 'Please enter the shop password.' : 'برائے مہربانی دکان کا پاس ورڈ درج کریں۔');
      return;
    }

    setIsGmailLoading(true);
    const result = await loginWithGmail(cleanEmail, undefined, true, false, cleanPass);
    setIsGmailLoading(false);

    if (!result.success) {
      setError(result.error || (lang === 'en' ? 'Login failed. Please check your email and password.' : 'لاگ ان کرنے میں مسئلہ پیش آیا۔ ای میل اور پاس ورڈ چیک کریں۔'));
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanShop = signupShopName.trim();
    const cleanOwner = signupOwnerName.trim();
    const cleanPass = signupPassword.trim();

    if (!cleanShop) {
      setError(lang === 'en' ? 'Please enter your shop name.' : 'برائے مہربانی دکان کا نام درج کریں۔');
      return;
    }
    if (!cleanOwner) {
      setError(lang === 'en' ? 'Please enter owner name.' : 'برائے مہربانی دکاندار کا نام درج کریں۔');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError(lang === 'en' ? 'Please enter a valid email address.' : 'برائے مہربانی درست ای میل ایڈریس درج کریں۔');
      return;
    }
    if (cleanPass.length < 6) {
      setError(lang === 'en' ? 'Password must be at least 6 characters.' : 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا ضروری ہے۔');
      return;
    }

    setIsSignupLoading(true);
    const result = await registerNewShop({
      shopName: cleanShop,
      ownerName: cleanOwner,
      email: cleanEmail,
      password: cleanPass,
      phone: signupPhone.trim(),
      address: signupAddress.trim()
    });
    setIsSignupLoading(false);

    if (!result.success) {
      setError(result.error || (lang === 'en' ? 'Failed to register shop. Please try again.' : 'دکان رجسٹر کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔'));
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUser = staffUsername.trim();
    const cleanPass = staffPassword.trim();
    if (!cleanUser || !cleanPass) {
      setError(lang === 'en' ? 'Please provide both username and password.' : 'برائے مہربانی یوزر نیم اور پاس ورڈ دونوں درج کریں۔');
      return;
    }
    if (cleanPass.length < 6) {
      setError(lang === 'en' ? 'Password must be at least 6 characters.' : 'پاس ورڈ کم از کم 6 ہندسوں کا ہونا ضروری ہے۔');
      return;
    }
    setIsStaffLoading(true);
    const result = await loginStaff(cleanUser, cleanPass);
    setIsStaffLoading(false);
    if (!result.success) {
      setError(result.error || (lang === 'en' ? 'Invalid credentials. Contact the shop owner for details.' : 'درج کردہ تفصیلات غلط ہیں۔ دکان کے مالک سے درست تفصیلات حاصل کریں۔'));
    }
  };

  const isUrdu = lang === 'ur';

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-3 sm:p-4 selection:bg-blue-600 selection:text-white">
      {/* 1st Time Sign Up Gmail OTP Verification Modal (if ever triggered) */}
      {isOtpVerificationRequired && pendingOtpEmail && (
        <GmailOTPModal
          email={pendingOtpEmail}
          onVerify={(code) => verifyGmailOTP(pendingOtpEmail, code)}
          onResend={resendGmailOTP}
          onCancel={cancelOtpVerification}
        />
      )}

      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80 w-full max-w-lg text-center relative overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600" />

        {/* Top Header Row with Language Switcher */}
        <div className="flex items-center justify-between mb-3 pt-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <Languages className="w-4 h-4 text-slate-500" />
            <span className="hidden xs:inline">{isUrdu ? 'زبان منتخب کریں:' : 'Language:'}</span>
          </div>

          {/* Language Toggle: English (Default) | اردو */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setLang('en');
                setError('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLang('ur');
                setError('');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lang === 'ur'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇵🇰</span>
              <span>اردو</span>
            </button>
          </div>
        </div>

        {/* Taj Logo Emblem */}
        <div className="flex justify-center mb-2">
          <TajLogo size="lg" />
        </div>

        <h2 className="text-2xl font-black text-[#2c3e50] tracking-tight flex items-center justify-center gap-1.5">
          <span>NH POS Shop</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold">
            {appVersion}
          </span>
        </h2>
        <p className="text-xs text-[#95a5a6] font-medium mt-0.5">
          {isUrdu ? 'کلاؤڈ ریٹیل اور پوائنٹ آف سیل سسٹم' : 'Multi-User Cloud POS & Retail SaaS'}
        </p>

        {/* PWA Direct Install Button */}
        {!isAppInstalled && (
          <div className="mt-2.5 flex justify-center">
            <button
              type="button"
              onClick={async () => {
                const ok = await installApp();
                if (!ok) {
                  setShowInstallGuide(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
              <span>{isUrdu ? '📱 فون میں ایپ انسٹال کریں' : '📱 Install App on Device'}</span>
            </button>
          </div>
        )}

        {/* 4 Portions Navigation Tabs: 1. Login | 2. Sign Up | 3. Staff | 4. Demo */}
        <div className="mt-4 grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
          {/* Tab 1: Login */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 font-bold">
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>{isUrdu ? 'لاگ ان' : 'Sign In'}</span>
            </div>
            <span className="text-[8px] font-normal text-slate-500">
              {isUrdu ? 'دکان کا مالک' : 'Owner Login'}
            </span>
          </button>

          {/* Tab 2: Sign Up */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-emerald-50/50 hover:bg-emerald-100/50'
            }`}
          >
            <div className="flex items-center gap-1 font-bold">
              <UserPlus className={`w-3.5 h-3.5 ${activeTab === 'signup' ? 'text-white' : 'text-emerald-600'}`} />
              <span>{isUrdu ? 'نئی دکان' : 'Sign Up'}</span>
            </div>
            <span className={`text-[8px] font-normal ${activeTab === 'signup' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              {isUrdu ? 'رجسٹریشن' : 'New Shop'}
            </span>
          </button>

          {/* Tab 3: Staff */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff_login');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'staff_login'
                ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 font-bold">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>{isUrdu ? 'عملہ' : 'Staff'}</span>
            </div>
            <span className="text-[8px] font-normal text-slate-500">
              {isUrdu ? 'اسٹاف ID' : 'Staff ID'}
            </span>
          </button>

          {/* Tab 4: Demo */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('demo_store');
              setError('');
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'demo_store'
                ? 'bg-white text-amber-800 shadow-sm border border-amber-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1 text-amber-700 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isUrdu ? 'ڈیمو' : 'Demo'}</span>
            </div>
            <span className="text-[8px] font-normal text-amber-700">
              {isUrdu ? 'ٹیسٹ POS' : 'Live Test'}
            </span>
          </button>
        </div>

        {/* Error Notice */}
        {activeError ? (
          <div className="mt-3.5 p-3 bg-rose-50 text-rose-700 border-2 border-rose-300 rounded-2xl text-xs font-bold text-left flex items-start gap-2.5 animate-in fade-in shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span className="leading-relaxed block">{activeError}</span>
              {(activeError.includes('already') || activeError.includes('رجسٹرڈ') || activeError.includes('registered')) && activeTab === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    if (signupEmail) setGmailInput(signupEmail.trim().toLowerCase());
                    setError('');
                  }}
                  className="mt-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isUrdu ? '🔑 لاگ ان اسکرین پر جائیں (Go to Sign In)' : '🔑 Go to Sign In Screen'}</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* PORTION 1: OWNER EMAIL & PASSWORD LOGIN                  */}
        {/* ======================================================== */}
        {activeTab === 'login' && (
          <div className={`mt-5 space-y-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
            {/* Google Sign In Button (Temporarily hidden per request, code preserved) */}
            {SHOW_GOOGLE_SIGNIN && (
              <div>
                <button
                  type="button"
                  disabled={isGoogleLoading || isGmailLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-300 hover:border-blue-500 rounded-2xl font-black text-slate-800 text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-3 transition-all active:scale-98 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? (isUrdu ? 'گوگل سے تصدیق ہو رہی ہے...' : 'Connecting...') : 'Sign in with Google'}</span>
                </button>
              </div>
            )}

            {/* Direct Email & Password Login Form */}
            <form onSubmit={handleGmailSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isUrdu ? 'دکان کے مالک کا ای میل ایڈریس (Email)' : 'Owner Email Address'}
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
                    placeholder={isUrdu ? 'مثلاً: your-email@gmail.com' : 'e.g. your-email@gmail.com'}
                    required
                    dir="ltr"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isUrdu ? 'دکان کا پاس ورڈ (Password)' : 'Owner Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showOwnerPassword ? 'text' : 'password'}
                    value={ownerPassword}
                    onChange={e => {
                      setOwnerPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={isUrdu ? 'پاس ورڈ درج کریں' : 'Enter password'}
                    required
                    dir="ltr"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showOwnerPassword ? 'Hide password' : 'Show password'}
                  >
                    {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGmailLoading || !gmailInput.trim() || !ownerPassword.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md shadow-blue-600/25 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <span>
                  {isGmailLoading
                    ? (isUrdu ? 'داخل ہو رہے ہیں...' : 'Signing in...')
                    : (isUrdu ? 'لاگ ان کریں' : 'Sign In to Shop')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Switch to Sign Up */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
              <div className={isUrdu ? 'text-right' : 'text-left'}>
                <span className="text-xs font-bold text-emerald-900 block">
                  {isUrdu ? 'نئے دکاندار ہیں؟' : 'New Shop Owner?'}
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  {isUrdu ? 'اپنی نئی دکان بنائیں اور فوری شروع کریں (Zero OTP)' : 'Register your new shop in 1 minute (No OTP)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                {isUrdu ? '✨ نیا اکاؤنٹ بنائیں' : '✨ Create New Shop'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PORTION 2: SIGN UP / NEW SHOP REGISTRATION               */}
        {/* ======================================================== */}
        {activeTab === 'signup' && (
          <div className={`mt-5 space-y-3.5 animate-in fade-in duration-200 ${isUrdu ? 'text-right' : 'text-left'}`}>
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-1.5 font-black text-emerald-900 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isUrdu ? 'نئی دکان کا فوری اندراج' : 'New Shop Registration'}</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                {isUrdu
                  ? 'کوئی OTP نہیں! تفصیلات درج کریں، فوری دکان رجسٹر کریں اور سسٹم میں داخل ہوں۔'
                  : 'No OTP required! Enter details, create password & launch instantly.'}
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isUrdu ? 'دکان کا نام *' : 'Shop Name *'}
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={signupShopName}
                    onChange={e => {
                      setSignupShopName(e.target.value);
                      setError('');
                    }}
                    placeholder={isUrdu ? 'مثلاً: تاج کریانہ اینڈ موبائل شاپ' : 'e.g. Super Retail Store'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isUrdu ? 'دکاندار کا نام *' : 'Owner Name *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={signupOwnerName}
                    onChange={e => {
                      setSignupOwnerName(e.target.value);
                      setError('');
                    }}
                    placeholder={isUrdu ? 'مثلاً: محمد وصی' : 'e.g. Muhammad Wasi'}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isUrdu ? 'ای میل ایڈریس *' : 'Owner Email Address *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => {
                      setSignupEmail(e.target.value);
                      setError('');
                    }}
                    placeholder={isUrdu ? 'مثلاً: owner@gmail.com' : 'e.g. owner@gmail.com'}
                    dir="ltr"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    {isUrdu ? 'اکاؤنٹ پاس ورڈ *' : 'Account Password *'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isUrdu ? 'کم از کم 6 ہندسے' : 'Min 6 characters'}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={e => {
                      setSignupPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={isUrdu ? 'نیا پاس ورڈ بنائیں (کم از کم 6 ہندسے)' : 'Create password (Min 6 chars)'}
                    dir="ltr"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isUrdu ? 'فون یا واٹس ایپ نمبر' : 'Phone / WhatsApp (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={signupPhone}
                      onChange={e => setSignupPhone(e.target.value)}
                      placeholder="0300-1234567"
                      dir="ltr"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isUrdu ? 'شہر یا پتہ' : 'City / Address (Optional)'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={signupAddress}
                      onChange={e => setSignupAddress(e.target.value)}
                      placeholder={isUrdu ? 'مثلاً: مین بازار، صادق آباد' : 'e.g. Main Bazar, Sadiqabad'}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSignupLoading || !signupShopName.trim() || !signupOwnerName.trim() || !signupEmail.trim() || !signupPassword.trim()}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>
                  {isSignupLoading
                    ? (isUrdu ? 'دکان رجسٹر ہو رہی ہے...' : 'Registering shop...')
                    : (isUrdu ? '🚀 دکان رجسٹر کریں اور داخل ہوں' : '🚀 Register & Launch Shop')}
                </span>
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                {isUrdu
                  ? '← پہلے سے دکان بنی ہوئی ہے؟ یہاں لاگ ان کریں'
                  : '← Already have an account? Sign In here'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PORTION 3: STAFF LOGIN                                   */}
        {/* ======================================================== */}
        {activeTab === 'staff_login' && (
          <form onSubmit={handleStaffSubmit} className={`mt-5 space-y-3.5 text-xs ${isUrdu ? 'text-right' : 'text-left'}`}>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-900">
              <span className="font-bold">
                {isUrdu ? '💼 اسٹاف لاگ ان:' : '💼 Staff Member Login:'}
              </span>
              <p className="mt-0.5 text-purple-700">
                {isUrdu
                  ? 'دکان کے مالک کا فراہم کردہ یوزر نیم (NH-...) اور پاس ورڈ درج کریں۔'
                  : 'Enter the staff username (NH-...) and password provided by the shop owner.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  {isUrdu ? 'شناختی آئی ڈی (یوزر نیم)' : 'Staff Username'}
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
                  placeholder={isUrdu ? 'مثلاً: NH-ali01 (یا صرف ali01)' : 'e.g. NH-ali01 (or ali01)'}
                  required
                  dir="ltr"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-mono text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isUrdu
                  ? '* تمام عملے کا یوزر نیم NH سے شروع ہوتا ہے۔ آپ NH- کے ساتھ یا بغیر بھی لکھ سکتے ہیں۔'
                  : '* All staff usernames start with NH. You may type with or without NH-.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  {isUrdu ? 'پاس ورڈ' : 'Password'}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isUrdu ? 'کم از کم 6 ہندسے' : 'Min 6 characters'}
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
                  placeholder={isUrdu ? 'پاس ورڈ درج کریں' : 'Enter staff password'}
                  required
                  minLength={6}
                  dir="ltr"
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
              <span>
                {isStaffLoading
                  ? (isUrdu ? 'تصدیق ہو رہی ہے...' : 'Checking Credentials...')
                  : (isUrdu ? 'اسٹاف لاگ ان' : 'Staff Login')}
              </span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* PORTION 4: DEMO STORE                                    */}
        {/* ======================================================== */}
        {activeTab === 'demo_store' && (
          <div className={`mt-5 space-y-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
            <div className="p-4 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 border-2 border-dashed border-amber-400 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      {isUrdu ? 'تاج ڈیمو سپر سٹور' : 'Live Demo Store'}
                    </h3>
                    <p className="text-[11px] text-amber-900 font-semibold">
                      {isUrdu ? 'مکمل بھری ہوئی دکان • فوری رسائی بغیر پاسورڈ' : 'Fully loaded store • Instant access with no password'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-950 border border-amber-400/50 shrink-0">
                  {isUrdu ? 'ری سیٹ: ۳۰ منٹ' : 'Auto-Reset 30m'}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {isUrdu
                  ? 'اگر آپ کو سسٹم سمجھ نہیں آ رہا تو اس ڈیمو اکاؤنٹ میں جا کر دیکھیں۔ تمام کھاتے، کیش بک، ادھار، کسٹمرز اور پی او ایس پہلے سے بھرے ہوئے ہیں۔ آپ نیا ڈیٹا شامل بھی کر سکتے ہیں اور ڈیلیٹ بھی کر سکتے ہیں۔ ہر ۳۰ منٹ بعد یہ خود بخود دوبارہ اصل حالت میں بحال ہو جائے گا۔'
                  : 'Explore all features: daily cash book, POS sales, customer ledger, easyload, and stock. You can add or delete data freely. It will automatically reset to original state every 30 minutes.'}
              </p>

              <button
                type="button"
                onClick={loginDemoStore}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg shadow-amber-500/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>{isUrdu ? 'ڈیمو دکان میں داخل ہوں' : 'Start Live Demo'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Informative Security Card (Always visible at bottom) */}
        <div className={`mt-5 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-[11px] text-slate-700 ${isUrdu ? 'text-right' : 'text-left'}`}>
          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isUrdu ? 'آزاد اور محفوظ کلاؤڈ کھاتہ (100% Private)' : '100% Private & Isolated Cloud Account'}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {isUrdu
              ? 'ہر دکان کا ڈیٹا کلاؤڈ پر علیحدہ اور محفوظ ہے۔ آپ کسی بھی وقت اپنے ای میل اور پاس ورڈ سے لاگ ان ہو سکتے ہیں۔'
              : 'Each shop data is securely isolated on cloud. You can log in anytime with your registered email and password.'}
          </p>
        </div>

        {/* Footer Text */}
        <div className="mt-5 text-[10px] text-[#bdc3c7] font-bold tracking-widest uppercase">
          {isUrdu
            ? 'تیار کردہ: محمد وصی • این ایچ پی او ایس شاپ'
            : 'POWERED BY WASI DEVELOPER • NH POS SHOP'}
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

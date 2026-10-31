/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Store, User, Phone, MapPin, Sparkles, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TajLogo } from './TajLogo';

export const ShopSetupModal: React.FC = () => {
  const { isNewShopSetupRequired, completeShopSetup, currentUser } = usePOS();

  const [shopName, setShopName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>(currentUser?.name || '');
  const [password, setPassword] = useState<string>('123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isNewShopSetupRequired) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) {
      setError('Please enter your shop name.');
      return;
    }
    if (password.trim().length < 6) {
      setError('پاس ورڈ کم از کم 6 ہندسوں کا ہونا ضروری ہے۔ (Password must be at least 6 characters)');
      return;
    }

    setIsSubmitting(true);
    const success = await completeShopSetup(shopName.trim(), phone.trim(), address.trim(), ownerName.trim(), password.trim());
    setIsSubmitting(false);

    if (!success) {
      setError('Failed to initialize shop account. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-slate-800 relative">
        <div className="flex items-center justify-center mb-4">
          <TajLogo size="lg" />
        </div>

        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Welcome New Shop Owner</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            Setup Your Shop Account
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Enter your business details below. Your new account starts completely fresh with 0 balance.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              دکان کا نام (Shop Name) *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="مثلاً: تاج سپر سٹور اینڈ ایزی لوڈ"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              مالک کا نام (Owner Name)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="مثلاً: محمد وصی"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                اکاؤنٹ لاگ ان پاس ورڈ (Password) *
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                ڈیفالٹ: 123456
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm font-mono"
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
            <p className="text-[10px] text-slate-500 mt-1">
              * آپ یہ پاس ورڈ استعمال کر کے کسی بھی وقت اپنی جی میل اور پاس ورڈ سے لاگ ان کر سکتے ہیں۔
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                واٹس ایپ یا فون نمبر (Phone / WhatsApp)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                شہر یا پتہ (City / Address)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="مثلاً: مین بازار، صادق آباد"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>100% علیحدہ کلاؤڈ کھاتہ (Private Isolated Cloud)</span>
            </div>
            <p className="text-blue-700 leading-relaxed text-[10px]">
              آپ کی دکان کا تمام ریکارڈ (یومیہ کیش، ادھار کھاتے، ایزی لوڈ، بوتلیں) کلاؤڈ پر 100% محفوظ ہے اور صرف آپ کی اس جی میل اور مجاز عملے کے لیے دستیاب ہوگا۔
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <span>{isSubmitting ? 'دکان شروع ہو رہی ہے...' : '🚀 نئی دکان شروع کریں (Create & Launch Shop)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

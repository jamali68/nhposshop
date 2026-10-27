/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  User as UserIcon,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TajLogo } from './TajLogo';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentShop, currentUser, updateShopProfile } = usePOS();

  const [shopName, setShopName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Format permanent system registration date (uneditable)
  const registrationDateFormatted = (() => {
    const raw = currentShop?.created_at;
    if (raw) {
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
        return String(raw).slice(0, 10);
      } catch {
        return String(raw).slice(0, 10);
      }
    }
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  })();

  // Sync state whenever modal opens or currentShop changes
  useEffect(() => {
    if (isOpen && currentShop) {
      setShopName(currentShop.shop_name || '');
      setOwnerName(currentShop.owner_name || currentUser?.name || '');
      setPhone(currentShop.phone || '');
      setAddress(currentShop.address || '');
      setSuccessMessage('');
      setError('');
    }
  }, [isOpen, currentShop, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!shopName.trim()) {
      setError('دکان کا نام درج کرنا لازمی ہے۔ (Shop name is required)');
      return;
    }
    if (!ownerName.trim()) {
      setError('مالک کا نام درج کرنا لازمی ہے۔ (Owner name is required)');
      return;
    }

    setIsSaving(true);
    try {
      await updateShopProfile({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim()
      });

      setSuccessMessage('✓ دکان کا نام اور مالک کا نام کامیابی سے محفوظ ہو گیا!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'تفصیلات محفوظ کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔');
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email === 'aliimtiaz1126@gmail.com';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-800 relative my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="بند کریں (Close)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <TajLogo size="sm" showSubtitle={false} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ایڈمن پروفائل اور دکان کی ترتیبات
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isSuperAdmin
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isSuperAdmin ? '👑 Super Admin' : '👤 Admin'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              دکان کا نام اور مالک کا نام تبدیل کریں (رجسٹریشن تاریخ مستقل ہے)
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold text-left flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs text-left">
          {/* Registered Email (Protected Google Account) */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-blue-900 font-bold block">
                  رجسٹرڈ گوگل اکاؤنٹ (Primary Email)
                </span>
                <span className="font-mono font-bold text-blue-950 text-xs truncate block">
                  {currentUser?.email || currentShop?.owner_email || 'aliimtiaz1126@gmail.com'}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>تصدیق شدہ (Verified)</span>
            </span>
          </div>

          {/* Shop Name Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              دکان کا نام (Shop Name) *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="مثلاً: Taj karnaya and Mobile Shop"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              * رسیدوں، بلوں اور پی او ایس ہیڈر پر یہی نام پرنٹ اور ظاہر ہوگا۔
            </p>
          </div>

          {/* Owner Name Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              مالک کا نام (Owner / Admin Name) *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="مثلاً: Ali Imtiaz"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          {/* Account Registration Date (Permanent System Date - Uneditable, Dim, No Lock Icon) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                اکاؤنٹ رجسٹریشن تاریخ (Registration Date)
              </label>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                مستقل سسٹم تاریخ (Permanent)
              </span>
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <div className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl font-mono text-sm select-none cursor-default">
                {registrationDateFormatted}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * یہ تاریخ اکاؤنٹ رجسٹریشن کے وقت سسٹم میں محفوظ ہوئی تھی اور ہمیشہ کے لیے غیر تبدیل شدہ (Permanent) رہے گی۔
            </p>
          </div>

          {/* Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                رابطہ / واٹس ایپ نمبر
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثلاً: 03001234567"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                دکان کا پتہ / شہر
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="مثلاً: مین بازار، صادق آباد"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white text-xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              منسوخ کریں (Cancel)
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{isSaving ? 'محفوظ ہو رہا ہے...' : 'تبدیلیاں محفوظ کریں (Save Changes)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

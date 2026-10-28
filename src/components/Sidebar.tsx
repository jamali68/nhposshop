/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Wallet,
  Building2,
  Smartphone,
  TrendingUp,
  Wine,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  Trash2,
  Power,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Flag,
  Wrench,
  Download,
  Upload,
  Cloud,
  UserCheck,
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { useAppVersion, refreshAppVersion } from '../utils/version';
import { usePOS, ActiveView } from '../context/POSContext';
import { formatTime12h, formatRelativeTime } from '../utils/syncTime';
import { TajLogo } from './TajLogo';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';
import { SqlImportModal } from './SqlImportModal';
import { superAdminService } from '../superadmin/superAdminService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeView,
    setActiveView,
    currentUser,
    currentShop,
    setShowAdminProfileModal,
    logout,
    setShowWhatsNewModal,
    setShowIndependenceModal,
    toggleMaintenanceMode,
    isMaintenanceMode,
    maintenanceNotice,
    setMaintenanceNotice,
    exportDataJSON,
    importDataJSON,
    isFirebaseConnected,
    saveCurrentAsDemoTemplate,
    lastSyncTime,
    hasPendingChanges,
    pendingSyncCount,
    isSyncing,
    syncNow,
    isAppInstalled,
    installApp
  } = usePOS();

  const { version: appVersion } = useAppVersion();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [showSqlImportModal, setShowSqlImportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [demoTemplateSavedMessage, setDemoTemplateSavedMessage] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [relativeTimeStr, setRelativeTimeStr] = useState<string>('');

  useEffect(() => {
    setRelativeTimeStr(formatRelativeTime(lastSyncTime));
    const timer = setInterval(() => {
      setRelativeTimeStr(formatRelativeTime(lastSyncTime));
    }, 15000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  const handleManualSync = async () => {
    if (isSyncing || isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      const res = await syncNow(true);
      if (res.success) {
        setSyncFeedback('✓ تمام ریکارڈز کلاؤڈ پر اپڈیٹ ہو چکے ہیں');
      } else {
        setSyncFeedback(res.error || 'سنک نہ ہو سکا۔ کنکشن چیک کریں۔');
      }
    } catch {
      setSyncFeedback('سنک نہیں ہو سکا۔ دوبارہ کوشش کریں۔');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshAppVersion();
    }
  }, [isOpen]);

  const handleNav = (view: ActiveView) => {
    setActiveView(view);
    onClose();
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onClose();
    logout();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importDataJSON(text);
      if (success) {
        setImportNotification('ڈیٹا بیک اپ کامیابی سے ری اسٹور ہو گیا ہے!');
        setTimeout(() => setImportNotification(null), 4000);
      } else {
        setImportNotification('غلط فائل فارمیٹ۔ برائے مہربانی درست JSON فائل منتخب کریں۔');
        setTimeout(() => setImportNotification(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const allNavItems: Array<{ id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'daily_cash', label: 'Daily Cash Book', icon: Wallet },
    { id: 'back_cash', label: 'Back Cash Manager', icon: Building2 },
    { id: 'easyload', label: 'Easy Load Ledger', icon: Smartphone },
    { id: 'bottle_stock', label: 'Bottle Stock', icon: Wine },
    { id: 'items_price', label: 'Items Price List', icon: Tags },
    { id: 'wholesaler', label: 'Wholesaler Ledger', icon: Truck },
    { id: 'customer', label: 'Customer Ledger', icon: Users },
    { id: 'pos', label: 'New Sale (POS Counter)', icon: ShoppingCart },
    { id: 'monthly_summary', label: 'Monthly Cash & Trends', icon: TrendingUp },
    { id: 'staff_management', label: 'Staff & Users', icon: UserCheck },
    { id: 'deleted_history', label: 'Deleted Logs (Trash)', icon: Trash2 }
  ];

  const isStoreAdmin = Boolean(currentUser?.isGoogleUser || currentUser?.role === 'admin' || currentUser?.role === 'super_admin');
  const userRole = currentUser?.role || (isStoreAdmin ? 'admin' : 'cashier');
  const navItems = allNavItems.filter(item => {
    if (item.id === 'staff_management') return isStoreAdmin;
    if (isStoreAdmin) return true;
    if (userRole === 'manager') return item.id !== 'deleted_history';
    if (userRole === 'cashier') {
      return ['dashboard', 'daily_cash', 'easyload', 'pos', 'items_price'].includes(item.id);
    }
    if (userRole === 'salesman') {
      return ['dashboard', 'customer', 'items_price', 'pos'].includes(item.id);
    }
    return false;
  });

  return (
    <>
      {/* Dark Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-300 md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#1b263b] text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 bg-[#0d1b2a] border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <TajLogo size="sm" showSubtitle={false} />
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{currentShop?.shop_name || currentUser?.shopName || 'NH POS Shop'}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-mono font-bold shrink-0">
                  {appVersion}
                </span>
              </h1>
              <p className="text-[10px] text-amber-300 font-medium truncate">
                {currentShop?.owner_name ? `Owner: ${currentShop.owner_name}` : 'Point of Sale Pro'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User Card - Clickable Admin Area */}
        <div
          onClick={() => {
            setShowAdminProfileModal(true);
            onClose();
          }}
          className="px-4 py-3 bg-[#162235] hover:bg-[#1f2e46] border-b border-slate-700/40 flex items-center justify-between text-xs cursor-pointer transition-colors group"
          title="ایڈمن پروفائل، دکان کا نام اور مالک کا نام تبدیل کرنے کے لیے کلک کریں (Click to Edit Details)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-bold text-blue-200 uppercase shrink-0">
              {currentUser?.username.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-200 truncate group-hover:text-blue-300 transition-colors flex items-center gap-1">
                <span className="truncate">{currentUser?.name || currentUser?.username}</span>
                <span className="text-[9px] text-slate-400 group-hover:text-white shrink-0">✏️</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.email ? currentUser.email : `@${currentUser?.username}`}
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 group-hover:scale-105 transition-transform ${
              userRole === 'super_admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : userRole === 'admin'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : userRole === 'manager'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : userRole === 'cashier'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
            }`}
          >
            {userRole === 'super_admin' ? 'Super Admin' : userRole}
          </span>
        </div>

        {/* Firebase Cloud Sync Status Bar (Hidden for normal admin/staff, visible ONLY for Super Admin) */}
        {userRole === 'super_admin' && (
          <div className="px-4 py-2 bg-[#121e30] border-b border-slate-700/50 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Cloud className={`w-3.5 h-3.5 ${isFirebaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Firebase Cloud:</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <span className={isFirebaseConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isFirebaseConnected ? 'Connected' : 'Connecting...'}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2980b9] text-white shadow-md shadow-[#2980b9]/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Cloud Sync & Shift Handoff Card */}
          <div className="pt-2 pb-1">
            <div className={`p-3 rounded-2xl border transition-all ${
              (!navigator.onLine || (hasPendingChanges && pendingSyncCount > 0))
                ? 'bg-rose-950/30 border-rose-500/40'
                : 'bg-slate-800/60 border-slate-700/70'
            }`}>
              {/* Header: Title and Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Cloud className={`w-3.5 h-3.5 ${
                    (!navigator.onLine || (hasPendingChanges && pendingSyncCount > 0)) ? 'text-rose-400' : 'text-emerald-400'
                  }`} />
                  <span className="text-xs font-bold text-slate-200">کلاؤڈ سنک اور شفٹ</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  (!navigator.onLine || (hasPendingChanges && pendingSyncCount > 0))
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    (!navigator.onLine || (hasPendingChanges && pendingSyncCount > 0)) ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
                  }`} />
                  {(!navigator.onLine)
                    ? 'آف لائن (Offline)'
                    : (hasPendingChanges && pendingSyncCount > 0)
                    ? `${pendingSyncCount} باقی (Pending)`
                    : 'کلاؤڈ محفوظ (Synced)'}
                </span>
              </div>

              {/* Status explanation line */}
              <div className="text-[10px] mb-2 leading-relaxed text-slate-300">
                {(!navigator.onLine || (hasPendingChanges && pendingSyncCount > 0)) ? (
                  <div className="flex items-start gap-1.5 text-rose-300 bg-rose-900/30 p-1.5 rounded-lg border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <span>
                      کچھ ریکارڈز کلاؤڈ پر منتقل ہونا باقی ہیں۔ یہ ڈیوائس پر محفوظ ہیں۔
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-900/20 p-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>تمام ریکارڈز کلاؤڈ پر 100% اپڈیٹ ہیں۔</span>
                  </div>
                )}
              </div>

              {/* Last Updated Time Display */}
              <div className="space-y-1 py-1.5 px-2 bg-[#0d1b2a]/70 rounded-xl border border-slate-700/50 mb-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>آخری اپڈیٹ (Last Updated):</span>
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {formatTime12h(lastSyncTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">کتنی دیر پہلے:</span>
                  <span className="text-cyan-300 font-semibold">
                    {relativeTimeStr || 'ابھی ابھی'}
                  </span>
                </div>
              </div>

              {/* Auto 30m indication */}
              <div className="text-[9.5px] text-slate-400 flex items-center justify-between mb-2 px-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>⏱️ آٹو سنک:</span>
                  <span className="text-amber-400 font-medium">ہر 30 منٹ بعد</span>
                </span>
                <span className="text-[9px] text-slate-500">یا بٹن دبائیں</span>
              </div>

              {/* Update Now / Sync Now Button for Shift Handover */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing || isManualSyncing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${(isSyncing || isManualSyncing) ? 'animate-spin' : ''}`} />
                <span>
                  {(isSyncing || isManualSyncing) ? 'اپڈیٹ ہو رہا ہے...' : '🔄 ابھی اپڈیٹ کریں (Update Now)'}
                </span>
              </button>
              <p className="text-[9px] text-slate-400 text-center mt-1 leading-tight">
                کیشیئر / شفٹ بدلتے وقت فوری سنک کریں
              </p>

              {/* Toast Feedback for Sync */}
              {syncFeedback && (
                <div className="mt-2 py-1.5 px-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-lg text-[10px] text-center font-bold animate-in fade-in">
                  {syncFeedback}
                </div>
              )}
            </div>
          </div>

          {/* Data Backup & Restore Collapsible Sub-menu (Visible ONLY to Admin / Store Owner, NEVER to Staff) */}
          {isStoreAdmin && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsBackupOpen(prev => !prev)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isBackupOpen
                    ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">Data Backup & Restore</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isBackupOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Sub-menu sliding downwards */}
              {isBackupOpen && (
                <div className="mt-1 ml-3 pl-3 border-l-2 border-cyan-500/40 space-y-1 py-1">
                  {/* Download Backup Sub-menu Item */}
                  <button
                    type="button"
                    onClick={exportDataJSON}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left group"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="block font-semibold text-slate-200">Data Backup</span>
                      <span className="block text-[10px] text-slate-400">Download JSON backup</span>
                    </div>
                  </button>

                  {/* Restore Backup Sub-menu Item */}
                  <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer text-left group">
                    <Upload className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="block font-semibold text-slate-200">Data Restore</span>
                      <span className="block text-[10px] text-slate-400">Import backup JSON</span>
                    </div>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>

                  {/* Smart SQL Import (.sql) Sub-menu Item */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSqlImportModal(true);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left group cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">Smart SQL Import</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded font-bold uppercase">
                          .sql
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-400 truncate">Convert & import .sql dump</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Super Admin Special Controls (Hidden for regular accounts) */}
          {userRole === 'super_admin' && (
            <>
              <div className="pt-2 pb-1 px-3">
                <div className="h-px bg-slate-700/60" />
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block mt-1.5">
                  Super Admin Controls
                </span>
              </div>

              {/* What's New trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowWhatsNewModal(true);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-amber-300 hover:bg-amber-950/30 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>What&apos;s New ({appVersion})</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">View</span>
              </button>

              {/* Independence Celebration trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowIndependenceModal(true);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-950/30 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Flag className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Independence Banner</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">View</span>
              </button>

              {/* System Maintenance with ON/OFF Toggle Switch & Broadcast Control */}
              <div className="px-3.5 py-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block leading-tight">
                        System Maintenance
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isMaintenanceMode ? 'Lockdown active on all accounts' : 'Normal operations'}
                      </span>
                    </div>
                  </div>

                  {/* Compact ON / OFF Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleMaintenanceMode()}
                    title={isMaintenanceMode ? "Turn Maintenance Mode OFF" : "Turn Maintenance Mode ON"}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isMaintenanceMode ? 'bg-orange-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isMaintenanceMode && (
                  <div className="pt-1.5 border-t border-slate-700/50">
                    <label className="text-[10px] text-amber-300 font-medium block mb-1">
                      Maintenance Notice (Broadcasted):
                    </label>
                    <textarea
                      rows={2}
                      value={maintenanceNotice}
                      onChange={(e) => setMaintenanceNotice(e.target.value)}
                      placeholder="Enter maintenance message for all users..."
                      className="w-full text-[11px] p-2 bg-[#0d1b2a] border border-amber-500/40 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                    />
                    <div className="flex items-center justify-between mt-1 text-[9px] text-emerald-400">
                      <span>✓ PWA offline mode safe</span>
                      <span>Live sync paused</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Store Baseline Manager (Super Admin can enrich demo data) */}
              <div className="px-3.5 py-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block leading-tight">
                      Demo Store Baseline
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Add records & save as new demo template
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    saveCurrentAsDemoTemplate();
                    setDemoTemplateSavedMessage(true);
                    setTimeout(() => setDemoTemplateSavedMessage(false), 3000);
                  }}
                  className="w-full mt-1 py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer active:scale-95"
                >
                  {demoTemplateSavedMessage ? '✓ Demo Baseline Saved!' : '💾 Save Current Data as Demo Template'}
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Footer Area: Already Installed & Logout */}
        <div className="p-3 bg-[#0d1b2a] border-t border-slate-700/60 space-y-2">
          {importNotification && (
            <div className="py-2 px-3 bg-blue-600/20 border border-blue-500/40 text-blue-200 rounded-xl text-[11px] text-center font-medium animate-in fade-in">
              {importNotification}
            </div>
          )}



          {/* PWA Install Button when not running standalone */}
          {!isAppInstalled && (
            <button
              type="button"
              onClick={async () => {
                const success = await installApp();
                if (!success) {
                  setShowInstallGuideModal(true);
                }
              }}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer border border-emerald-400/30"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-200 animate-bounce" />
                <span>انسٹال NH POS Shop ایپ</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Install
              </span>
            </button>
          )}

          {/* Super Admin Master Portal Entry Button (Visible ONLY to verified Super Admin, 100% hidden for all other users/staff) */}
          {currentUser?.role === 'super_admin' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveView('super_admin');
              }}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 hover:from-indigo-900 hover:to-indigo-850 text-indigo-200 border border-indigo-700/50 rounded-xl text-xs font-bold shadow-md shadow-indigo-950/40 transition-all active:scale-95 cursor-pointer group"
              title="Super Admin Master Portal"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Super Admin Portal</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                MASTER
              </span>
            </button>
          )}

          {/* Modern Safe Logout Button at the very end */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Logout System</span>
          </button>
        </div>
      </aside>

      {/* PWA Install Guide Modal for Sidebar */}
      <PWAInstallGuideModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        onNativeInstall={installApp}
        canNativeInstall={Boolean((window as any).deferredInstallPrompt)}
      />

      {/* Safe in-app Logout Confirmation Modal (works reliably in all iframes and mobile browsers) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Power className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800">لاگ آؤٹ کی تصدیق</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              کیا آپ واقعی سسٹم سے لاگ آؤٹ کرنا چاہتے ہیں؟
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
              >
                جی ہاں، لاگ آؤٹ
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                منسوخ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart SQL Import Modal (.sql files) */}
      <SqlImportModal
        isOpen={showSqlImportModal}
        onClose={() => setShowSqlImportModal(false)}
      />
    </>
  );
};

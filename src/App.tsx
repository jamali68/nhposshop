/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Zap, Download, RefreshCw, CheckCircle2, AlertCircle, Cloud, Clock } from 'lucide-react';
import { POSProvider, usePOS } from './context/POSContext';
import { formatTime12h, formatRelativeTime } from './utils/syncTime';
import { Sidebar } from './components/Sidebar';
import { TajLogo } from './components/TajLogo';
import { WhatsNewModal } from './components/WhatsNewModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { IndependenceOverlay } from './components/IndependenceOverlay';
import { ShopSetupModal } from './components/ShopSetupModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallGuideModal } from './components/PWAInstallGuideModal';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { DailyCashView } from './views/DailyCashView';
import { BackCashView } from './views/BackCashView';
import { EasyloadLedgerView } from './views/EasyloadLedgerView';
import { BottleStockView } from './views/BottleStockView';
import { ItemsPriceView } from './views/ItemsPriceView';
import { WholesalerBillsView } from './views/WholesalerBillsView';
import { CustomerBillsView } from './views/CustomerBillsView';
import { POSSaleView } from './views/POSSaleView';
import { DeletedHistoryView } from './views/DeletedHistoryView';
import { EditHistoryLogsView } from './views/EditHistoryLogsView';
import { StaffManagementView } from './views/StaffManagementView';
import { MonthlySummaryView } from './views/MonthlySummaryView';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    currentShop,
    activeView,
    setActiveView,
    isFirebaseConnected,
    firebaseSyncStatus,
    lastSyncTime,
    hasPendingChanges,
    pendingSyncCount,
    isSyncing,
    syncNow,
    isDemoMode,
    demoTimeLeft,
    resetDemoData,
    saveCurrentAsDemoTemplate,
    logout,
    isAppInstalled,
    installApp
  } = usePOS();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showStatusToast, setShowStatusToast] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Auto-tick every 30s so relative times ("Just now", "2 mins ago") stay fresh
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!currentUser) {
    return (
      <>
        <LoginView />
        <PWAInstallBanner />
      </>
    );
  }

  const handleStatusClick = () => {
    setShowStatusToast(prev => !prev);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'daily_cash':
        return <DailyCashView />;
      case 'back_cash':
        return <BackCashView />;
      case 'easyload':
        return <EasyloadLedgerView />;
      case 'bottle_stock':
        return <BottleStockView />;
      case 'items_price':
        return <ItemsPriceView />;
      case 'wholesaler':
        return <WholesalerBillsView />;
      case 'customer':
        return <CustomerBillsView />;
      case 'pos':
        return <POSSaleView />;
      case 'deleted_history':
        return <DeletedHistoryView />;
      case 'edit_logs':
        return <EditHistoryLogsView />;
      case 'staff_management':
        return <StaffManagementView />;
      case 'monthly_summary':
        return <MonthlySummaryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">


      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="md:ml-64 flex-1 flex flex-col min-w-0">
        {/* Interactive Demo Mode Top Banner with Auto-Reset Countdown */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm z-30">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 font-bold text-[10px] uppercase tracking-wider">
                🧪 Live Demo Mode
              </span>
              <span className="text-[11px] font-medium hidden sm:inline">
                یہ تجرباتی دکان ہے! آپ آزادانہ ڈیٹا شامل یا ڈیلیٹ کر سکتے ہیں۔
              </span>
              <span className="text-[10px] text-amber-200 font-mono font-semibold">
                (Auto-reset: {Math.floor(demoTimeLeft / 60)}m {String(demoTimeLeft % 60).padStart(2, '0')}s)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              {currentUser?.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => {
                    saveCurrentAsDemoTemplate();
                    setTemplateSavedMsg(true);
                    setTimeout(() => setTemplateSavedMsg(false), 3000);
                  }}
                  title="Super Admin: Save current state as new demo baseline"
                  className="px-2.5 py-1 bg-amber-300 hover:bg-amber-200 text-amber-950 font-bold rounded-lg transition-colors shadow-xs active:scale-95 cursor-pointer"
                >
                  {templateSavedMsg ? '✓ Baseline Saved!' : 'Save Demo Baseline'}
                </button>
              )}
              <button
                type="button"
                onClick={resetDemoData}
                title="تمام ڈیٹا کو اصل ڈیمو حالت میں واپس لائیں"
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-lg transition-colors shadow-xs active:scale-95 cursor-pointer"
              >
                Reset Demo Now
              </button>
              <button
                type="button"
                onClick={logout}
                title="ڈیمو سے باہر نکل کر اصلی لاگ ان پیج پر جائیں"
                className="px-2.5 py-1 bg-rose-900/70 hover:bg-rose-900 text-white border border-rose-400/40 rounded-lg transition-colors active:scale-95 cursor-pointer"
              >
                Exit Demo / Sign In
              </button>
            </div>
          </div>
        )}

        {/* Top Sticky Navbar */}
        <header className="bg-white px-4 py-3 border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-[#2c3e50] hover:bg-slate-100 rounded-xl transition-colors md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="hidden md:flex p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <TajLogo size="sm" showSubtitle={false} />
              <div>
                <span className="font-black text-sm text-[#2c3e50] block tracking-tight leading-tight">
                  {currentShop?.shop_name || currentUser.shopName || 'NH POS Shop'}
                </span>
                <span className="text-[10px] text-amber-600 font-medium block leading-tight">
                  {currentShop?.owner_name ? `Owner: ${currentShop.owner_name}` : 'Point of Sale System'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Install App button visible whenever not running in standalone mode */}
            {!isAppInstalled && (
              <button
                type="button"
                onClick={async () => {
                  const success = await installApp();
                  if (!success) {
                    setShowInstallGuide(true);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                title="NH POS Shop ایپ فون یا کمپیوٹر میں انسٹال کریں"
              >
                <Download className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-[11px]">Install</span>
              </button>
            )}

            <div className="relative flex flex-col items-center">
            {/* Online / Offline Status Dot with Outer Ring & Red Line Below ONLY if Unsynced Pending Entries */}
            <button
              type="button"
              onClick={handleStatusClick}
              title={
                !isOnline
                  ? "آف لائن (Offline)"
                  : hasPendingChanges && pendingSyncCount > 0
                  ? `آن لائن - کلاؤڈ سنک باقی ہے: ${pendingSyncCount} اینٹریز`
                  : "آن لائن: تمام ڈیٹا کلاؤڈ پر محفوظ ہے (Online)"
              }
              className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
              aria-label={isOnline ? "Online Status" : "Offline Status"}
            >
              {/* Outer bareek (fine) circle with inner dot - STRICTLY Online (Green) / Offline (Red) */}
              <div
                className={`relative flex items-center justify-center w-5 h-5 rounded-full border border-[1.5px] transition-all duration-300 ${
                  isOnline
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs shadow-emerald-500/20'
                    : 'border-rose-500 bg-rose-50/60 shadow-xs shadow-rose-500/20'
                }`}
              >
                {/* Subtle pulse effect */}
                <span
                  className={`absolute w-full h-full rounded-full opacity-40 animate-ping ${
                    isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ animationDuration: '2.5s' }}
                />
                
                {/* Central solid dot */}
                <span
                  className={`relative w-2 h-2 rounded-full transition-colors duration-300 ${
                    isOnline
                      ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                      : 'bg-rose-500 shadow-xs shadow-rose-500/50'
                  }`}
                />
              </div>

              {/* Dedicated Pending Line: Appears ONLY if there is at least one unsynced pending entry (NO text label) */}
              {hasPendingChanges && pendingSyncCount > 0 && (
                <div className="w-full flex justify-center mt-1">
                  <span className="h-[2.5px] w-5 bg-rose-500 rounded-full shadow-xs shadow-rose-500/50 animate-pulse" />
                </div>
              )}
            </button>

            {/* Click Message Popup / Tooltip Card */}
            {showStatusToast && (
              <div
                className="absolute top-full right-0 mt-2 z-50 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left"
              >
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-xs font-black text-slate-800">
                      {isOnline ? 'آن لائن (Online)' : 'آف لائن (Offline)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusToast(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Cloud Sync Status Info */}
                <div className="mt-2.5 space-y-2.5 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    hasPendingChanges && pendingSyncCount > 0
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}>
                    {hasPendingChanges && pendingSyncCount > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[11px] leading-tight">
                        {hasPendingChanges && pendingSyncCount > 0
                          ? `کلاؤڈ پر ${pendingSyncCount} اینٹریز سنک ہونا باقی ہیں`
                          : 'تمام ڈیٹا کلاؤڈ پر محفوظ ہے (100% Synced)'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {hasPendingChanges && pendingSyncCount > 0
                          ? 'نیچے والا بٹن دبا کر فوری کلاؤڈ پر بھیجیں۔'
                          : 'تمام یوزرز اور ڈیوائسز پر ڈیٹا ہم آہنگ ہے۔'}
                      </p>
                    </div>
                  </div>

                  {/* Last Updated Time info */}
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>آخری اپڈیٹ (Last Sync):</span>
                      </span>
                      <span className="font-bold font-mono text-slate-800">
                        {lastSyncTime ? formatTime12h(lastSyncTime) : 'Just now'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right font-medium">
                      {formatRelativeTime(lastSyncTime)}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                    <span>⏱️ خودکار اپڈیٹ: ہر 30 منٹ</span>
                    <span>شفٹ منتقلی کیلئے محفوظ</span>
                  </div>

                  {/* Update Now Button */}
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await syncNow(true);
                    }}
                    className="w-full mt-1 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'کلاؤڈ اپڈیٹ ہو رہا ہے...' : '🔄 ابھی اپڈیٹ کریں (Sync Now)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

        {/* View Content Container */}
        <main className="p-3 sm:p-5 max-w-4xl mx-auto w-full flex-1">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <ShopSetupModal />
      <WhatsNewModal />
      <MaintenanceModal />
      <IndependenceOverlay />
      <PWAInstallBanner />
      <PWAInstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        onNativeInstall={installApp}
        canNativeInstall={Boolean((window as any).deferredInstallPrompt)}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainAppContent />
    </POSProvider>
  );
}

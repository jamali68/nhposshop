/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Zap, Download } from 'lucide-react';
import { POSProvider, usePOS } from './context/POSContext';
import { Sidebar } from './components/Sidebar';
import { TajLogo } from './components/TajLogo';
import { WhatsNewModal } from './components/WhatsNewModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { IndependenceOverlay } from './components/IndependenceOverlay';
import { ShopSetupModal } from './components/ShopSetupModal';

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

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    currentShop,
    activeView,
    setActiveView,
    isAppInstalled,
    installApp,
    showTopInstallBanner,
    setShowTopInstallBanner,
    isFirebaseConnected,
    isDemoMode,
    demoTimeLeft,
    resetDemoData,
    saveCurrentAsDemoTemplate,
    logout
  } = usePOS();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showStatusToast, setShowStatusToast] = useState<boolean>(false);

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
    return <LoginView />;
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
                  {currentShop?.shop_name || currentUser.shopName || 'Taj POS Pro'}
                </span>
                <span className="text-[10px] text-amber-600 font-medium block leading-tight">
                  {currentShop?.owner_name ? `Owner: ${currentShop.owner_name}` : 'Point of Sale System'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center">
            {/* Online / Offline Status Dot with Fine Outer Circle (reduced by 20%) */}
            <button
              type="button"
              onClick={handleStatusClick}
              title={isOnline ? "You are online (Click to view status)" : "You are offline (Click to view status)"}
              className="group relative flex items-center justify-center p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label={isOnline ? "Online Status" : "Offline Status"}
            >
              {/* Outer bareek (fine) circle with inner dot - 20% smaller (w-5 h-5 instead of w-6 h-6) */}
              <div
                className={`relative flex items-center justify-center w-5 h-5 rounded-full border border-[1.5px] transition-all duration-300 ${
                  isOnline
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-rose-500 bg-rose-50/50'
                }`}
              >
                {/* Subtle pulse effect for active connectivity */}
                <span
                  className={`absolute w-full h-full rounded-full opacity-40 animate-ping ${
                    isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                  style={{ animationDuration: '2.5s' }}
                />
                
                {/* Central solid dot (reduced by 20% to w-2 h-2) */}
                <span
                  className={`relative w-2 h-2 rounded-full transition-colors duration-300 ${
                    isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-rose-500 shadow-xs shadow-rose-500/50'
                  }`}
                />
              </div>
            </button>

            {/* Click Message Popup / Tooltip Card */}
            {showStatusToast && (
              <div
                className="absolute top-full right-0 mt-2 z-50 w-52 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border shrink-0 ${
                      isOnline ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-rose-500 bg-rose-50 text-rose-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isOnline ? 'You are online' : 'You are offline'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {isOnline
                        ? 'All services & cloud sync are active.'
                        : 'Offline mode active. Your local data is safe.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusToast(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
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

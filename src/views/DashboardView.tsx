/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  PlusCircle,
  TrendingUp,
  Bolt,
  Circle,
  Leaf,
  Radio,
  Calendar,
  Sparkles
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const DashboardView: React.FC = () => {
  const {
    filterDate,
    setFilterDate,
    yesterdayDate,
    isPrivacyOn,
    togglePrivacy,
    setActiveView,
    getShopCashStats,
    getBackCashTotal,
    getYesterdayClosingCash,
    getCalculatedYesterdaySale,
    getEasyloadSaleSummary,
    getBachatProfit,
    getRemainingPets,
    getTotalBottleSalesValue,
    getTotalPendingMarketBalance,
    dailyTransactions,
    easyloadRecords,
    currentUser,
    currentShop
  } = usePOS();

  // Easyload network live records (defaults to 0 for clean accounts)
  const currentLoadRecord = easyloadRecords[filterDate] || {
    jazz_opening: 0,
    jazz_purchase: 0,
    jazz_closing: 0,
    telenor_opening: 0,
    telenor_purchase: 0,
    telenor_closing: 0,
    zong_opening: 0,
    zong_purchase: 0,
    zong_closing: 0,
    ufone_opening: 0,
    ufone_purchase: 0,
    ufone_closing: 0
  };

  // Calculations
  const shopStats = getShopCashStats(filterDate);
  const backCashTotal = getBackCashTotal(filterDate);
  const remainingPets = getRemainingPets();
  const totalSalesVal = getTotalBottleSalesValue();
  const pendingBalance = getTotalPendingMarketBalance();

  const yesterdayClosing = getYesterdayClosingCash(filterDate);
  const yesterdayOpening = getShopCashStats(yesterdayDate).opening;
  const todayOpening = shopStats.opening;
  const calculatedYesterdaySale = getCalculatedYesterdaySale(filterDate);

  const easyloadToday = getEasyloadSaleSummary(filterDate);
  const easyloadYesterday = getEasyloadSaleSummary(yesterdayDate);
  const bachat = getBachatProfit(filterDate);

  // Individual box privacy state (true = hidden with ****, false = visible amount)
  const [boxPrivacy, setBoxPrivacy] = useState<{
    backCash: boolean;
    shopCash: boolean;
    pending: boolean;
    petsStock: boolean;
    totalSales: boolean;
  }>({
    backCash: isPrivacyOn,
    shopCash: isPrivacyOn,
    pending: isPrivacyOn,
    petsStock: isPrivacyOn,
    totalSales: isPrivacyOn
  });

  // Are all boxes currently hidden?
  const areAllHidden =
    boxPrivacy.backCash &&
    boxPrivacy.shopCash &&
    boxPrivacy.pending &&
    boxPrivacy.petsStock &&
    boxPrivacy.totalSales;

  // Master toggle:
  // If all are currently hidden -> reveal all
  // If any or all are currently visible -> hide all
  const handleMasterPrivacyToggle = () => {
    const nextVal = !areAllHidden;
    setBoxPrivacy({
      backCash: nextVal,
      shopCash: nextVal,
      pending: nextVal,
      petsStock: nextVal,
      totalSales: nextVal
    });
  };

  // Toggle privacy for a single box only
  const toggleSingleBoxPrivacy = (
    key: keyof typeof boxPrivacy,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    setBoxPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatBoxAmount = (val: number, isHidden: boolean, isCurrency = true) => {
    if (isHidden) return isCurrency ? 'Rs. ****' : '****';
    return isCurrency ? `Rs. ${val.toLocaleString()}` : val.toLocaleString();
  };

  const formattedDate = new Date(filterDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-4 pb-10">
      {/* Welcome Card with Date Picker */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Assalam-o-Alaikum, {currentUser?.name || 'Owner'}! 👋
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-semibold text-slate-500">
            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              🏪 {currentShop?.shop_name || currentUser?.shopName || 'Taj karnaya and Mobile Shop'}
            </span>
            <span>•</span>
            <span>Date:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Dynamic Date Filter Picker */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-[155px] py-1.5 px-3 bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold text-xs rounded-full shadow-xs cursor-pointer focus:outline-none focus:border-emerald-600 transition-colors text-center"
            />
          </div>

          <button
            type="button"
            onClick={handleMasterPrivacyToggle}
            title={areAllHidden ? 'Show All Values' : 'Hide All Values (Privacy)'}
            className={`p-2 rounded-full text-xs font-bold transition-colors ${
              areAllHidden
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {areAllHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Dashboard Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Back Cash Box */}
        <div className="relative rounded-2xl p-4 text-center text-white bg-[#2980b9] shadow-md shadow-[#2980b9]/20 flex flex-col justify-center min-h-[105px]">
          <button
            type="button"
            onClick={(e) => toggleSingleBoxPrivacy('backCash', e)}
            title={boxPrivacy.backCash ? 'Show Back Cash' : 'Hide Back Cash'}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
          >
            {boxPrivacy.backCash ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div
            onClick={() => setActiveView('back_cash')}
            className="cursor-pointer select-none group"
          >
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight group-hover:scale-105 transition-transform">
              {formatBoxAmount(backCashTotal, boxPrivacy.backCash)}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Back Cash
            </p>
          </div>
        </div>

        {/* Shop Cash Box */}
        <div className="relative rounded-2xl p-4 text-center text-white bg-[#27ae60] shadow-md shadow-[#27ae60]/20 flex flex-col justify-center min-h-[105px]">
          <button
            type="button"
            onClick={(e) => toggleSingleBoxPrivacy('shopCash', e)}
            title={boxPrivacy.shopCash ? 'Show Shop Counter Cash' : 'Hide Shop Counter Cash'}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
          >
            {boxPrivacy.shopCash ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div
            onClick={() => setActiveView('daily_cash')}
            className="cursor-pointer select-none group"
          >
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight group-hover:scale-105 transition-transform">
              {formatBoxAmount(shopStats.balance, boxPrivacy.shopCash)}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Shop Counter Cash
            </p>
          </div>
        </div>

        {/* Pending Box (Yellow / Orange Box) */}
        <div className="relative rounded-2xl p-4 text-center text-white bg-[#e67e22] shadow-md shadow-[#e67e22]/20 flex flex-col justify-center min-h-[105px]">
          <button
            type="button"
            onClick={(e) => toggleSingleBoxPrivacy('pending', e)}
            title={boxPrivacy.pending ? 'Show Pending Market' : 'Hide Pending Market'}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
          >
            {boxPrivacy.pending ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div
            onClick={() => setActiveView('customer')}
            className="cursor-pointer select-none group"
          >
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight group-hover:scale-105 transition-transform">
              {formatBoxAmount(pendingBalance, boxPrivacy.pending)}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Pending Market
            </p>
          </div>
        </div>

        {/* Pets / Bottle Stock Box */}
        <div className="relative rounded-2xl p-4 text-center text-white bg-[#2c3e50] shadow-md shadow-[#2c3e50]/20 flex flex-col justify-center min-h-[105px]">
          <button
            type="button"
            onClick={(e) => toggleSingleBoxPrivacy('petsStock', e)}
            title={boxPrivacy.petsStock ? 'Show Pets Stock' : 'Hide Pets Stock'}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
          >
            {boxPrivacy.petsStock ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div
            onClick={() => setActiveView('bottle_stock')}
            className="cursor-pointer select-none group"
          >
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight group-hover:scale-105 transition-transform">
              {formatBoxAmount(remainingPets, boxPrivacy.petsStock, false)} <span className="text-xs font-normal">Pets</span>
            </h3>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
              Pets Stock
            </p>
          </div>
        </div>

        {/* Total Sales Value Box (Span 2 cols) */}
        <div className="col-span-2 relative rounded-2xl p-4 text-center text-white bg-[#00BFA5] shadow-md shadow-[#00BFA5]/20 flex flex-col justify-center">
          <button
            type="button"
            onClick={(e) => toggleSingleBoxPrivacy('totalSales', e)}
            title={boxPrivacy.totalSales ? 'Show Total Sales' : 'Hide Total Sales'}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
          >
            {boxPrivacy.totalSales ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div onClick={() => setActiveView('bottle_stock')} className="cursor-pointer select-none">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {formatBoxAmount(totalSalesVal, boxPrivacy.totalSales)}
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
              Total Sales Value
            </p>
          </div>
        </div>
      </div>

      {/* Easyload Ledger Section (Matching load_index.php) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#e67e22]" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
              Easy Load Ledger ({formattedDate})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('daily_cash')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Load Purchase</span>
          </button>
        </div>

        {/* 4 Network Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Jazz */}
          <div className="p-3 rounded-xl border-l-4 border-amber-400 bg-amber-50/60 text-xs space-y-1">
            <span className="font-bold text-amber-800 flex items-center gap-1">
              <Bolt className="w-3.5 h-3.5" /> JAZZ
            </span>
            <div className="flex justify-between text-slate-500">
              <span>Open:</span>
              <b>Rs. {(currentLoadRecord.jazz_opening || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Purchase:</span>
              <b>Rs. {(currentLoadRecord.jazz_purchase || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Close:</span>
              <b>Rs. {(currentLoadRecord.jazz_closing || 0).toLocaleString()}</b>
            </div>
            <div className="pt-1 border-t border-amber-200/60 flex justify-between font-bold text-emerald-700">
              <span>Today Sale:</span>
              <span>Rs. {easyloadToday.jazz.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Yest Sale:</span>
              <span>Rs. {easyloadYesterday.jazz.toLocaleString()}</span>
            </div>
          </div>

          {/* Telenor */}
          <div className="p-3 rounded-xl border-l-4 border-blue-500 bg-blue-50/60 text-xs space-y-1">
            <span className="font-bold text-blue-700 flex items-center gap-1">
              <Circle className="w-3.5 h-3.5" /> TELENOR
            </span>
            <div className="flex justify-between text-slate-500">
              <span>Open:</span>
              <b>Rs. {(currentLoadRecord.telenor_opening || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Purchase:</span>
              <b>Rs. {(currentLoadRecord.telenor_purchase || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Close:</span>
              <b>Rs. {(currentLoadRecord.telenor_closing || 0).toLocaleString()}</b>
            </div>
            <div className="pt-1 border-t border-blue-200/60 flex justify-between font-bold text-emerald-700">
              <span>Today Sale:</span>
              <span>Rs. {easyloadToday.telenor.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Yest Sale:</span>
              <span>Rs. {easyloadYesterday.telenor.toLocaleString()}</span>
            </div>
          </div>

          {/* Zong */}
          <div className="p-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/60 text-xs space-y-1">
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" /> ZONG
            </span>
            <div className="flex justify-between text-slate-500">
              <span>Open:</span>
              <b>Rs. {(currentLoadRecord.zong_opening || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Purchase:</span>
              <b>Rs. {(currentLoadRecord.zong_purchase || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Close:</span>
              <b>Rs. {(currentLoadRecord.zong_closing || 0).toLocaleString()}</b>
            </div>
            <div className="pt-1 border-t border-emerald-200/60 flex justify-between font-bold text-emerald-700">
              <span>Today Sale:</span>
              <span>Rs. {easyloadToday.zong.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Yest Sale:</span>
              <span>Rs. {easyloadYesterday.zong.toLocaleString()}</span>
            </div>
          </div>

          {/* Ufone */}
          <div className="p-3 rounded-xl border-l-4 border-orange-500 bg-orange-50/60 text-xs space-y-1">
            <span className="font-bold text-orange-700 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" /> UFONE
            </span>
            <div className="flex justify-between text-slate-500">
              <span>Open:</span>
              <b>Rs. {(currentLoadRecord.ufone_opening || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Purchase:</span>
              <b>Rs. {(currentLoadRecord.ufone_purchase || 0).toLocaleString()}</b>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Close:</span>
              <b>Rs. {(currentLoadRecord.ufone_closing || 0).toLocaleString()}</b>
            </div>
            <div className="pt-1 border-t border-orange-200/60 flex justify-between font-bold text-emerald-700">
              <span>Today Sale:</span>
              <span>Rs. {easyloadToday.ufone.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Yest Sale:</span>
              <span>Rs. {easyloadYesterday.ufone.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Load Sales Overview Bar */}
        <div className="bg-[#34495e] text-white p-3 rounded-xl text-center">
          <small className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block mb-1">
            Total Load Sales Overview
          </small>
          <div className="flex items-center justify-around text-xs">
            <div>
              <span className="text-emerald-400 font-bold block text-[11px]">Selected Date</span>
              <b className="text-sm">Rs. {easyloadToday.total.toLocaleString()}</b>
            </div>
            <div className="h-6 w-px bg-slate-600 border-dashed" />
            <div>
              <span className="text-slate-300 font-bold block text-[11px]">Day Before</span>
              <b className="text-sm">Rs. {easyloadYesterday.total.toLocaleString()}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Yesterday Report / Calculation Boxes Layout (3 purple boxes) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#7d3c98] text-white p-3 rounded-xl text-center shadow-xs">
          <h4 className="text-xs font-extrabold sm:text-sm">Rs. {yesterdayOpening.toLocaleString()}</h4>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Yest. Opening</p>
        </div>

        <div className="bg-[#6c3483] text-white p-3 rounded-xl text-center shadow-xs">
          <h4 className="text-xs font-extrabold sm:text-sm">Rs. {yesterdayClosing.toLocaleString()}</h4>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Yest. Closing</p>
        </div>

        <div className="bg-[#512e5f] text-white p-3 rounded-xl text-center shadow-xs">
          <h4 className="text-xs font-extrabold sm:text-sm">Rs. {todayOpening.toLocaleString()}</h4>
          <p className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Today Opening</p>
        </div>
      </div>

      {/* Calculated Yesterday Sale Box */}
      <div className="bg-[#8e44ad] text-white p-4 rounded-2xl text-center shadow-md shadow-[#8e44ad]/20">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight">
          Rs. {calculatedYesterdaySale.toLocaleString()}
        </h3>
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 mt-1">
          Calculated Yesterday Sale
        </p>
      </div>

      {/* DAILY PROFIT / SAVINGS SUMMARY BOX */}
      <div className="bg-[#16a085] text-white p-4 sm:p-5 rounded-2xl shadow-md shadow-[#16a085]/20 space-y-3">
        <div className="flex items-center justify-between border-b border-white/20 pb-2.5 text-xs font-bold uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>📊 Daily Profit / Savings Summary</span>
          </span>
          <span className="text-white/80 font-mono">(Profit Report)</span>
        </div>

        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-white/90">
              Load Profit (2.4% of Rs. {bachat.dayBeforeLoadSale.toLocaleString()}):
            </span>
            <b className="font-mono">Rs. {bachat.calculatedLoadBachat.toFixed(2)}</b>
          </div>

          <div className="flex justify-between">
            <span className="text-white/90">
              Shop Profit (8% of Rs. {bachat.calculatedShopSale.toLocaleString()}):
            </span>
            <b className="font-mono">Rs. {bachat.calculatedShopBachat.toFixed(2)}</b>
          </div>

          <div className="flex justify-between">
            <span className="text-white/90">
              Sending &amp; Receiving Profit (100% of Rs. {bachat.dayBeforeCommission.toLocaleString()}):
            </span>
            <b className="font-mono text-emerald-200">Rs. {bachat.commissionBachat.toFixed(2)}</b>
          </div>

          <div className="flex items-center justify-between text-sm sm:text-base border-t border-dashed border-white/30 pt-2.5 mt-2">
            <span className="font-bold">Total Net Profit:</span>
            <b className="text-[#f1c40f] font-mono text-lg font-black drop-shadow-xs">
              Rs. {bachat.totalNetBachat.toFixed(2)}
            </b>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('monthly_summary')}
            className="w-full mt-3 py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/30 shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>📈 View Monthly Summary & Recharts Trends (ماہانہ خلاصہ اور گراف)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

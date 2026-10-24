/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { usePOS } from '../context/POSContext';

interface MonthDataPoint {
  monthKey: string; // YYYY-MM
  label: string; // e.g. Oct 2026
  cashIn: number;
  cashOut: number;
  netFlow: number;
  netProfit: number;
  commission: number;
  profitMargin: number;
  txCount: number;
}

interface DayDataPoint {
  date: string; // YYYY-MM-DD
  dayNum: string; // e.g. "19" or "Oct 19"
  cashIn: number;
  cashOut: number;
  netFlow: number;
  netProfit: number;
  commission: number;
  profitMargin: number;
}

export const MonthlySummaryView: React.FC = () => {
  const {
    dailyTransactions,
    backCashTransactions,
    getCommissionTotal,
    getBachatProfit,
    getShopCashStats,
    filterDate,
    setActiveView,
    goBack
  } = usePOS();

  // Mode: 'monthly' (12 months of year) or 'daily' (30 days of selected month)
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');

  // Currently selected year and month
  const currentYearStr = filterDate ? filterDate.split('-')[0] : new Date().getFullYear().toString();
  const currentMonthStr = filterDate ? filterDate.substring(0, 7) : new Date().toISOString().substring(0, 7);

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Available Years list derived from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(new Date().getFullYear().toString());
    dailyTransactions.forEach(t => {
      if (t.transaction_date) {
        yearsSet.add(t.transaction_date.split('-')[0]);
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [dailyTransactions]);

  // Available Months list for selected year
  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, '0');
      return {
        key: `${selectedYear}-${mm}`,
        label: `${monthNames[i]} ${selectedYear}`,
        shortLabel: `${shortMonthNames[i]} ${selectedYear}`
      };
    });
  }, [selectedYear]);

  // Aggregate Month-by-Month data for selected year
  const monthlyData: MonthDataPoint[] = useMemo(() => {
    const monthsMap: Record<string, { cashIn: number; cashOut: number; txCount: number; dates: Set<string> }> = {};

    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      const key = `${selectedYear}-${mm}`;
      monthsMap[key] = { cashIn: 0, cashOut: 0, txCount: 0, dates: new Set() };
    }

    dailyTransactions.forEach(t => {
      if (!t.transaction_date || !t.transaction_date.startsWith(selectedYear)) return;
      const mKey = t.transaction_date.substring(0, 7);
      if (monthsMap[mKey]) {
        monthsMap[mKey].txCount++;
        monthsMap[mKey].dates.add(t.transaction_date);
        if (t.type === 'in' || (t.type === 'payment' && t.party_type === 'customer')) {
          monthsMap[mKey].cashIn += t.amount;
        } else if (t.type === 'out' || (t.type === 'payment' && t.party_type === 'wholesaler')) {
          monthsMap[mKey].cashOut += t.amount;
        }
      }
    });

    return Object.keys(monthsMap)
      .sort()
      .map(key => {
        const item = monthsMap[key];
        const monthIndex = parseInt(key.split('-')[1], 10) - 1;
        const netFlow = item.cashIn - item.cashOut;

        // Calculate estimated profit by summing daily profits or using 8% margin + load
        let totalMonthBachat = 0;
        if (item.dates.size > 0) {
          item.dates.forEach(d => {
            const b = getBachatProfit(d);
            totalMonthBachat += (b.totalNetBachat || 0);
          });
        }
        // If no explicit bachat calculated, derive standard retail gross margin (8%)
        if (totalMonthBachat === 0 && item.cashIn > 0) {
          totalMonthBachat = Math.round(item.cashIn * 0.08);
        }

        const profitMargin = item.cashIn > 0 ? (totalMonthBachat / item.cashIn) * 100 : 0;

        const monthCommission = (backCashTransactions || [])
          .filter(t => t.type === 'commission' && t.transaction_date && t.transaction_date.startsWith(key))
          .reduce((sum, curr) => sum + (curr.amount || 0), 0);

        return {
          monthKey: key,
          label: shortMonthNames[monthIndex],
          cashIn: item.cashIn,
          cashOut: item.cashOut,
          netFlow,
          netProfit: totalMonthBachat,
          commission: monthCommission,
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          txCount: item.txCount
        };
      });
  }, [dailyTransactions, backCashTransactions, selectedYear, getBachatProfit]);

  // Aggregate Day-by-Day data for selected month
  const dailyData: DayDataPoint[] = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(selectedMonth.split('-')[0], 10),
      parseInt(selectedMonth.split('-')[1], 10),
      0
    ).getDate();

    const daysMap: Record<string, { cashIn: number; cashOut: number }> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const fullDate = `${selectedMonth}-${dd}`;
      daysMap[fullDate] = { cashIn: 0, cashOut: 0 };
    }

    dailyTransactions.forEach(t => {
      if (t.transaction_date && t.transaction_date.startsWith(selectedMonth)) {
        if (!daysMap[t.transaction_date]) {
          daysMap[t.transaction_date] = { cashIn: 0, cashOut: 0 };
        }
        if (t.type === 'in' || (t.type === 'payment' && t.party_type === 'customer')) {
          daysMap[t.transaction_date].cashIn += t.amount;
        } else if (t.type === 'out' || (t.type === 'payment' && t.party_type === 'wholesaler')) {
          daysMap[t.transaction_date].cashOut += t.amount;
        }
      }
    });

    return Object.keys(daysMap)
      .sort()
      .map(dStr => {
        const stats = daysMap[dStr];
        const dayNum = dStr.split('-')[2];
        const netFlow = stats.cashIn - stats.cashOut;
        const b = getBachatProfit(dStr);
        let netProfit = b.totalNetBachat || 0;
        if (netProfit === 0 && stats.cashIn > 0) {
          netProfit = Math.round(stats.cashIn * 0.08);
        }
        const profitMargin = stats.cashIn > 0 ? (netProfit / stats.cashIn) * 100 : 0;
        const dayCommission = getCommissionTotal(dStr);

        return {
          date: dStr,
          dayNum: `${parseInt(dayNum, 10)}`,
          cashIn: stats.cashIn,
          cashOut: stats.cashOut,
          netFlow,
          netProfit,
          commission: dayCommission,
          profitMargin: parseFloat(profitMargin.toFixed(1))
        };
      });
  }, [dailyTransactions, selectedMonth, getBachatProfit, getCommissionTotal]);

  // Active dataset depending on mode
  const currentChartData: any[] = viewMode === 'monthly' ? monthlyData : dailyData;

  // Totals for the active view
  const summaryTotals = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    let profitTotal = 0;
    let commissionTotal = 0;

    if (viewMode === 'monthly') {
      monthlyData.forEach(m => {
        inTotal += m.cashIn;
        outTotal += m.cashOut;
        profitTotal += m.netProfit;
        commissionTotal += (m.commission || 0);
      });
    } else {
      dailyData.forEach(d => {
        inTotal += d.cashIn;
        outTotal += d.cashOut;
        profitTotal += d.netProfit;
        commissionTotal += (d.commission || 0);
      });
    }

    const netCashFlow = inTotal - outTotal;
    const overallMargin = inTotal > 0 ? (profitTotal / inTotal) * 100 : 0;

    return {
      inTotal,
      outTotal,
      netCashFlow,
      profitTotal,
      commissionTotal,
      overallMargin: parseFloat(overallMargin.toFixed(1))
    };
  }, [viewMode, monthlyData, dailyData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-sm min-w-[170px]">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex justify-between">
            <span>{viewMode === 'monthly' ? `Month: ${label}` : `Day ${label}`}</span>
            <span className="text-[10px] text-slate-400">PKR</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </span>
              <span className="font-mono font-bold" style={{ color: entry.color }}>
                Rs. {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-10">
      {/* View Header & Title */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Monthly Cash & Profit Analytics
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                آمدن، اخراجات اور خالص منافع کا ماہانہ تجزیہ اور گراف چارٹس
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Months (سالانہ)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Trend (ماہانہ روزانہ)
            </button>
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={e => {
              setSelectedYear(e.target.value);
              setSelectedMonth(`${e.target.value}-01`);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Month Selector (Enabled in daily view) */}
          {viewMode === 'daily' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl font-bold text-xs text-blue-900 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          )}

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print Monthly Summary"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Cash In Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Cash In (آمدن)</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              Rs. {summaryTotals.inTotal.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {viewMode === 'monthly' ? `All 12 Months (${selectedYear})` : `Full Month (${selectedMonth})`}
            </p>
          </div>
        </div>

        {/* Total Cash Out Card */}
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Cash Out (خرچ)</span>
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600">
              Rs. {summaryTotals.outTotal.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              ادائیگیاں، سپلائر بلز اور اخراجات
            </p>
          </div>
        </div>

        {/* Net Cash Flow Card */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -z-0 opacity-80" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Cash Flow (خالص فلو)</span>
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono ${
                summaryTotals.netCashFlow >= 0 ? 'text-blue-700' : 'text-amber-600'
              }`}
            >
              {summaryTotals.netCashFlow >= 0 ? '+' : ''} Rs. {summaryTotals.netCashFlow.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              آمدن منہا اخراجات (Cash In - Cash Out)
            </p>
          </div>
        </div>

        {/* Sending & Receiving Commission Card */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-4 rounded-2xl shadow-xs relative overflow-hidden border border-emerald-500/40">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between text-emerald-200">
              <span className="text-[11px] font-bold uppercase tracking-wider">Commission (کمیشن)</span>
              <span className="p-1 bg-white/10 text-amber-300 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
              Rs. {summaryTotals.commissionTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-200 font-semibold pt-0.5">
              <span>Sending &amp; Receiving</span>
              <span className="bg-emerald-500/30 border border-emerald-400/40 px-1.5 py-0.2 rounded font-extrabold text-[9px] uppercase">
                100% Profit
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit / Bachat Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-amber-100">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Profit (خالص بچت)</span>
              <span className="p-1 bg-white/20 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono">
              Rs. {summaryTotals.profitTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[10px] text-amber-100 font-semibold pt-0.5">
              <span>مارجن: {summaryTotals.overallMargin}%</span>
              <span>سیلز + لوڈ + کمیشن</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Card 1: Composed Bar & Line Trend (Cash In, Cash Out, Net Profit) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>
                {viewMode === 'monthly'
                  ? `Cash Flow, Commission & Net Profit Trend (Year ${selectedYear})`
                  : `Daily Cash & Commission Breakdown (${selectedMonth})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              سبز رنگ: آمدن • سرخ رنگ: اخراجات • فیروزی رنگ: کمیشن • گولڈن لائن: خالص بچت (Net Profit)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cash In
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Cash Out
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> Commission
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Net Profit
            </span>
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="w-full h-72 sm:h-80 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={currentChartData}
              margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey={viewMode === 'monthly' ? 'label' : 'dayNum'}
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="cashIn"
                name="Cash In (آمدن)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={viewMode === 'monthly' ? 18 : 8}
              />
              <Bar
                dataKey="cashOut"
                name="Cash Out (اخراجات)"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={viewMode === 'monthly' ? 18 : 8}
              />
              <Line
                type="monotone"
                dataKey="commission"
                name="Commission (کمیشن)"
                stroke="#0d9488"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#0d9488' }}
              />
              <Line
                type="monotone"
                dataKey="netProfit"
                name="Net Profit (بچت)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Card 2: Net Profit Trend Curve (AreaChart) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Net Profit Growth Curve (منافع اور بچت کا گراف)</span>
            </h2>
            <p className="text-xs text-slate-500">
              ماہ بہ ماہ خالص بچت کی رفتار اور مسلسل ترقی کا تجزیہ
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
            Avg Profit: Rs. {Math.round(summaryTotals.profitTotal / (viewMode === 'monthly' ? 12 : 30)).toLocaleString()} / per {viewMode === 'monthly' ? 'month' : 'day'}
          </span>
        </div>

        <div className="w-full h-56 sm:h-64 text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentChartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="netFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey={viewMode === 'monthly' ? 'label' : 'dayNum'}
                stroke="#64748b"
                tick={{ fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netProfit"
                name="Net Profit (بچت)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#profitGradient)"
              />
              <Area
                type="monotone"
                dataKey="netFlow"
                name="Net Flow (خالص فلو)"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#netFlowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Ledger Breakdown Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {viewMode === 'monthly' ? 'Monthly Ledger Summary' : 'Daily Transaction Ledger Breakdown'}
            </h2>
            <p className="text-xs text-slate-500">
              مکمل کھاتے کی تفصیل، خالص فلو اور منافع کا تناسب
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            {currentChartData.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">
                  {viewMode === 'monthly' ? 'Month (مہینہ)' : 'Date (تاریخ)'}
                </th>
                <th className="py-3 px-3 text-right">Cash In (آمدن)</th>
                <th className="py-3 px-3 text-right">Cash Out (خرچ)</th>
                <th className="py-3 px-3 text-right">Net Flow (خالص)</th>
                <th className="py-3 px-3 text-right">Commission (کمیشن)</th>
                <th className="py-3 px-3 text-right">Net Profit (بچت)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentChartData.map((row: any, idx) => {
                const label = viewMode === 'monthly' ? `${row.label} ${selectedYear}` : row.date;
                const isProfitable = row.netFlow >= 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {label}
                      {row.txCount !== undefined && row.txCount > 0 && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          {row.txCount} transactions
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      Rs. {row.cashIn.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      Rs. {row.cashOut.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-black ${
                        isProfitable ? 'text-blue-700' : 'text-amber-600'
                      }`}
                    >
                      {isProfitable ? '+' : ''} Rs. {row.netFlow.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-600">
                      Rs. {(row.commission || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                      Rs. {row.netProfit.toLocaleString()}
                      {row.cashIn > 0 && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {row.profitMargin}% margin
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.cashIn === 0 && row.cashOut === 0 && (!row.commission || row.commission === 0) ? (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          No Activity
                        </span>
                      ) : isProfitable ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Positive
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Deficit
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
              <tr>
                <td className="py-3 px-3 uppercase text-slate-700">Total (مجموعہ)</td>
                <td className="py-3 px-3 text-right font-mono font-black text-emerald-700">
                  Rs. {summaryTotals.inTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-rose-700">
                  Rs. {summaryTotals.outTotal.toLocaleString()}
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono font-black ${
                    summaryTotals.netCashFlow >= 0 ? 'text-blue-800' : 'text-amber-700'
                  }`}
                >
                  {summaryTotals.netCashFlow >= 0 ? '+' : ''} Rs. {summaryTotals.netCashFlow.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-teal-700">
                  Rs. {summaryTotals.commissionTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-amber-700">
                  Rs. {summaryTotals.profitTotal.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center text-slate-500 text-[10px]">
                  Margin {summaryTotals.overallMargin}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

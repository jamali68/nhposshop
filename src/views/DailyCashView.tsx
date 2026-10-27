/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Truck,
  Users,
  Smartphone,
  Save,
  Edit2,
  Trash2,
  Share2,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  History
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { HistoryModal } from '../components/HistoryModal';
import { ReportModal } from '../components/ReportModal';
import { DateNavigator } from '../components/DateNavigator';

export const DailyCashView: React.FC = () => {
  const {
    filterDate,
    setFilterDate,
    yesterdayDate,
    currentUser,
    systemSettings,
    setSystemSettings,
    dailyTransactions,
    addDailyTransaction,
    updateDailyTransaction,
    deleteDailyTransaction,
    transferBetweenCashAccounts,
    saveEasyloadPurchase,
    getShopCashStats,
    getYesterdayClosingCash,
    setActiveView,
    goBack,
    registerBackHandler
  } = usePOS();

  // New Transaction Form State
  const [entryType, setEntryType] = useState<'out' | 'in' | 'opening' | 'from_back_cash' | 'to_back_cash'>('out');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const formCardRef = useRef<HTMLDivElement>(null);
  const [isFormFocused, setIsFormFocused] = useState<boolean>(false);

  // Handle mobile keyboard open/close so the form and Save button remain comfortably in view
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let initialHeight = vv.height;
    const handleViewportResize = () => {
      // When keyboard is dismissed (viewport height expands), keep the active form in full view
      if (vv.height >= initialHeight - 60 && isFormFocused) {
        setTimeout(() => {
          formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    vv.addEventListener('resize', handleViewportResize);
    return () => vv.removeEventListener('resize', handleViewportResize);
  }, [isFormFocused]);

  // Easyload Purchase Form State
  const [showLoadForm, setShowLoadForm] = useState<boolean>(false);
  const [loadNetwork, setLoadNetwork] = useState<'jazz' | 'telenor' | 'zong' | 'ufone'>('jazz');
  const [loadAmount, setLoadAmount] = useState<string>('');
  const [loadNote, setLoadNote] = useState<string>('');

  // Edit Modal State
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<string>('out');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  // Sub-Modals
  const [selectedHisTxId, setSelectedHisTxId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Hardware back closes edit modal first
  useEffect(() => {
    if (!editId) return;
    return registerBackHandler(() => {
      setEditId(null);
      return true;
    });
  }, [editId, registerBackHandler]);

  // Hardware back closes history sub-modal first
  useEffect(() => {
    if (!selectedHisTxId) return;
    return registerBackHandler(() => {
      setSelectedHisTxId(null);
      return true;
    });
  }, [selectedHisTxId, registerBackHandler]);

  // Hardware back closes report modal first
  useEffect(() => {
    if (!showReportModal) return;
    return registerBackHandler(() => {
      setShowReportModal(false);
      return true;
    });
  }, [showReportModal, registerBackHandler]);

  const stats = getShopCashStats(filterDate);
  const yesterdayBal = getYesterdayClosingCash(filterDate);
  const filteredList = dailyTransactions.filter(t => t.transaction_date === filterDate);

  // Transfers between Shop Cash and Back Cash for current filterDate
  const backCashTransfers = useMemo(() => {
    const txs = dailyTransactions.filter(t => t.transaction_date === filterDate);
    const fromBack = txs
      .filter(t => t.transfer_direction === 'from_back_cash' || (t.type === 'in' && t.description?.includes('Back Cash')))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const toBack = txs
      .filter(t => t.transfer_direction === 'to_back_cash' || (t.type === 'out' && t.description?.includes('Back Cash')))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const net = fromBack - toBack;
    return {
      fromBack,
      toBack,
      net,
      hasTransfers: fromBack > 0 || toBack > 0
    };
  }, [dailyTransactions, filterDate]);

  // Auto-fill description when opening or transfer is selected
  const handleTypeChange = (newType: 'out' | 'in' | 'opening' | 'from_back_cash' | 'to_back_cash') => {
    setEntryType(newType);
    if (newType === 'opening' && (!description || description === '')) {
      setDescription('Subha Ka Opening Cash ⭐');
    } else if (newType === 'from_back_cash' && (!description || description === '' || description === 'Subha Ka Opening Cash ⭐' || description === 'Back Cash ko Cash Diya (Counter Out)')) {
      setDescription('Back Cash se Cash Liya (Counter In)');
    } else if (newType === 'to_back_cash' && (!description || description === '' || description === 'Subha Ka Opening Cash ⭐' || description === 'Back Cash se Cash Liya (Counter In)')) {
      setDescription('Back Cash ko Cash Diya (Counter Out)');
    } else if (description === 'Subha Ka Opening Cash ⭐' || description === 'Back Cash se Cash Liya (Counter In)' || description === 'Back Cash ko Cash Diya (Counter Out)') {
      setDescription('');
    }
  };

  const handleSubmitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    if (entryType === 'from_back_cash') {
      transferBetweenCashAccounts({
        from: 'back',
        to: 'shop',
        amount: val,
        note: description.trim(),
        transaction_date: filterDate
      });
    } else if (entryType === 'to_back_cash') {
      transferBetweenCashAccounts({
        from: 'shop',
        to: 'back',
        amount: val,
        note: description.trim(),
        transaction_date: filterDate
      });
    } else {
      addDailyTransaction({
        type: entryType,
        amount: val,
        description: description.trim() || (entryType === 'opening' ? 'Today Opening Cash ⭐' : 'General Cash Entry'),
        transaction_date: filterDate
      });
    }

    setAmount('');
    setDescription('');
  };

  const handleEasyloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(loadAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter purchase amount!');
      return;
    }

    saveEasyloadPurchase(loadNetwork, val, loadNote);
    setLoadAmount('');
    setLoadNote('');
    setShowLoadForm(false);
  };

  const openEditModal = (t: typeof dailyTransactions[0]) => {
    setEditId(t.id);
    setEditType(t.type);
    setEditAmount(t.amount.toString());
    setEditDesc(t.description);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const val = parseFloat(editAmount);
    if (isNaN(val) || val <= 0) return;

    updateDailyTransaction(editId, val, editDesc, editType);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction record?')) {
      deleteDailyTransaction(id);
    }
  };

  const toggleUserDeletePerm = () => {
    if (currentUser?.role !== 'admin') return;
    setSystemSettings(prev => ({
      ...prev,
      user_can_delete: !prev.user_can_delete
    }));
  };

  const loadValNum = parseFloat(loadAmount) || 0;
  const loadSimBalance = loadValNum > 0 ? loadValNum + loadValNum * 0.024 : 0;

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base sm:text-lg font-black text-slate-800 text-center tracking-tight">
          Daily Cash Book
        </h2>

        {currentUser?.role === 'admin' ? (
          <button
            type="button"
            onClick={() => setActiveView('deleted_history')}
            title="Deleted Audit Logs"
            className="text-lg p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            📜
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Admin Delete Permission Box */}
      {currentUser?.role === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            {systemSettings.user_can_delete ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-rose-600" />}
            <span>User Delete Permission: </span>
            <span className={systemSettings.user_can_delete ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
              {systemSettings.user_can_delete ? 'ALLOWED' : 'LOCKED'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleUserDeletePerm}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Fast Shortcut Buttons for Wholesaler & Customer */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveView('wholesaler')}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
        >
          <Truck className="w-4 h-4" />
          <span>WHOLESALER</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('customer')}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
        >
          <Users className="w-4 h-4" />
          <span>CUSTOMERS</span>
        </button>
      </div>

      {/* Easyload Purchase Toggle Button */}
      <button
        type="button"
        onClick={() => setShowLoadForm(prev => !prev)}
        className="w-full py-3 px-4 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
      >
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span>Easy Load Purchase Form (+)</span>
      </button>

      {/* Collapsible Easyload Purchase Form */}
      {showLoadForm && (
        <div className="bg-[#fffaf5] border-l-4 border-[#e67e22] rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-sm text-[#d35400] flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>Easy Load Purchase (Stock Added)</span>
          </h3>

          <form onSubmit={handleEasyloadSubmit} className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Network</label>
              <select
                value={loadNetwork}
                onChange={e => setLoadNetwork(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-[#e67e22] rounded-xl font-bold focus:outline-none"
              >
                <option value="jazz">⭐ JAZZ (2.4%)</option>
                <option value="telenor">🔹 TELENOR (2.4%)</option>
                <option value="zong">🟢 ZONG (2.4%)</option>
                <option value="ufone">🔸 UFONE (2.4%)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Purchase Amount (Paid from Cash Counter)</label>
              <input
                type="number"
                value={loadAmount}
                onChange={e => setLoadAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                className="w-full p-2.5 bg-white border border-[#e67e22] rounded-xl font-bold focus:outline-none"
              />
            </div>

            {/* Live commission status */}
            {loadValNum > 0 && (
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 font-bold text-center text-xs border border-emerald-200">
                Cash Out: Rs. {loadValNum.toLocaleString()} | Sim Balance Credited: Rs. {loadSimBalance.toLocaleString()}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Note (Optional)</label>
              <input
                type="text"
                value={loadNote}
                onChange={e => setLoadNote(e.target.value)}
                placeholder="e.g. Paid from Cash Counter / Dealer Name"
                className="w-full p-2.5 bg-white border border-[#e67e22] rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#d35400] hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Record Load Purchase
            </button>
          </form>
        </div>
      )}

      {/* Date Filter */}
      <DateNavigator
        value={filterDate}
        onChange={setFilterDate}
        accentColor="emerald"
      />

      {/* Main Green Shop Cash Banner */}
      <div className="bg-[#27ae60] text-white p-5 rounded-2xl text-center shadow-lg shadow-emerald-600/20">
        <h2 className="text-3xl font-black tracking-tight font-mono">
          Rs. {stats.balance.toLocaleString()}
        </h2>
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 mt-1">
          TOTAL SHOP CASH ({new Date(filterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
        </p>

        {/* 3 Metrics Grid below Banner */}
        <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs text-left bg-white text-slate-800 p-3 rounded-xl shadow-xs">
          <div className="border-r border-dashed border-slate-200 pr-2">
            <small className="text-[#2980b9] font-bold block text-[10px] uppercase">Today Opening Cash</small>
            <b className="text-sm">Rs. {stats.opening.toLocaleString()}</b>
          </div>
          <div>
            <small className="text-[#e67e22] font-bold block text-[10px] uppercase">Cash Added (In)</small>
            <b className="text-sm text-emerald-600">Rs. {stats.cashIn.toLocaleString()}</b>
          </div>
          <div className="col-span-2 border-t border-dashed border-slate-200 pt-2 mt-1 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 font-semibold">Yesterday Closing Cash:</span>
            <span className="font-bold font-mono">Rs. {yesterdayBal.toLocaleString()}</span>
          </div>
        </div>

        {/* Back Cash Transfer / Leen Deen Record (بیک کیش لین دین ریکارڈ) */}
        <div className="mt-3 text-left bg-black/25 backdrop-blur-xs border border-white/20 rounded-xl p-2.5 text-xs text-white">
          <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1 border-b border-white/15">
            <span className="font-bold flex items-center gap-1.5 text-white/95 text-[11px]">
              <span className="text-amber-300 text-sm">🔁</span>
              <span>Back Cash لین دین (Transfer Record):</span>
            </span>
            <span
              className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border ${
                backCashTransfers.net === 0
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                  : backCashTransfers.net > 0
                  ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                  : 'bg-amber-500/30 text-amber-200 border-amber-400/40'
              }`}
            >
              {backCashTransfers.net === 0
                ? 'Net: Rs. 0 (برابر / صاف)'
                : backCashTransfers.net > 0
                ? `Net: +Rs. ${backCashTransfers.net.toLocaleString()} (بیک کیش سے آیا)`
                : `Net: -Rs. ${Math.abs(backCashTransfers.net).toLocaleString()} (بیک کیش کو دیا)`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="bg-white/10 rounded-lg py-1 px-1.5 border border-white/5">
              <span className="text-blue-200 block font-semibold truncate">بیک کیش سے آیا (+)</span>
              <span className="font-mono font-bold text-white text-[12px]">
                Rs. {backCashTransfers.fromBack.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/10 rounded-lg py-1 px-1.5 border border-white/5">
              <span className="text-amber-200 block font-semibold truncate">بیک کیش کو دیا (-)</span>
              <span className="font-mono font-bold text-white text-[12px]">
                Rs. {backCashTransfers.toBack.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Entry Card */}
      <div ref={formCardRef} className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3 scroll-mt-16">
        <h3 className="font-black text-center text-sm sm:text-base text-slate-800">
          Add New Entry
        </h3>

        {/* Quick Leen Deen / Shortcut Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => handleTypeChange('from_back_cash')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              entryType === 'from_back_cash'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">🔄</span>
            <span className="truncate">Back Cash se Aya (+)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('to_back_cash')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              entryType === 'to_back_cash'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">🔁</span>
            <span className="truncate">Back Cash ko Diya (-)</span>
          </button>
        </div>

        <form onSubmit={handleSubmitNewEntry} className="space-y-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Transaction Type</label>
            <select
              value={entryType}
              onChange={e => handleTypeChange(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
            >
              <option value="out">Cash Out (-)</option>
              <option value="in">Cash Add (+)</option>
              <option value="opening">Today Opening Cash (★)</option>
              <option value="from_back_cash">🔄 Back Cash se Aya / Liya (Shop In + | Back Cash -)</option>
              <option value="to_back_cash">🔄 Back Cash ko Diya / Bheja (Shop Out - | Back Cash +)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Amount (Raqam)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onFocus={() => setIsFormFocused(true)}
              onBlur={() => {
                setIsFormFocused(false);
                setTimeout(() => {
                  formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 80);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitNewEntry(e);
                }
              }}
              placeholder="Raqam Likhein"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Note (Detail/Name)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={() => setIsFormFocused(true)}
              onBlur={() => {
                setIsFormFocused(false);
                setTimeout(() => {
                  formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 80);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitNewEntry(e);
                }
              }}
              placeholder="Note (Detail/Name)"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Cash Entry (محفوظ کریں)</span>
          </button>
        </form>
      </div>

      {/* Transaction History Table with clear top margin */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-800">
            Transaction History ({new Date(filterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">{filteredList.length} Entries</span>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              title="Share Statement"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredList.length > 0 ? (
            filteredList.map(t => {
              const isOut = t.type.toLowerCase() === 'out';
              const isOpening = t.type.toLowerCase() === 'opening';
              const isFromBack = t.transfer_direction === 'from_back_cash' || t.description?.includes('[Back Cash se Liya]') || t.description?.includes('[From Back Cash]');
              const isToBack = t.transfer_direction === 'to_back_cash' || t.description?.includes('[Back Cash ko Diya]') || t.description?.includes('[To Back Cash]');
              return (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isFromBack
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : isToBack
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isOpening
                            ? 'bg-blue-100 text-blue-800'
                            : isOut
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFromBack
                          ? '🔄 FROM BACK CASH (+)'
                          : isToBack
                          ? '🔄 TO BACK CASH (-)'
                          : isOpening
                          ? 'OPENING CASH'
                          : t.type.toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded text-white ${
                          t.created_by === 'admin' ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        {t.created_by.toUpperCase()}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800 text-[13px] truncate mt-1">
                      {t.description || 'No Note'}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedHisTxId(t.id)}
                        className="text-slate-500 font-semibold hover:text-blue-600 flex items-center gap-0.5"
                      >
                        <History className="w-3 h-3 text-blue-500" /> His
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-black font-mono ${
                        isOut ? 'text-rose-600' : isOpening ? 'text-blue-600' : 'text-emerald-600'
                      }`}
                    >
                      {isOut ? '-' : isOpening ? '★ ' : '+'} Rs. {t.amount.toLocaleString()}
                    </div>

                    {(currentUser?.role === 'admin' || systemSettings.user_can_delete) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 mt-1 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aaj ki koi transaction record nahi hui.
            </div>
          )}
        </div>

        {/* Generate Statement & Share Button - Distinct Dark Navy style so it is never confused with Save Cash Entry */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full py-3 bg-[#1e293b] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>GENERATE STATEMENT & SHARE (روزنامچہ رپورٹ)</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 mb-3 pb-2 border-b border-slate-100">
              Shop Cash Entry Edit
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Transaction Type</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="in">Cash Add (+)</option>
                  <option value="out">Cash Out (-)</option>
                  <option value="opening">Today Opening Cash (★)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Amount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    required
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedHisTxId(editId)}
                    className="px-3 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs"
                  >
                    His
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Note (Detail)</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Sub-Modal */}
      {selectedHisTxId && (
        <HistoryModal
          isOpen={true}
          onClose={() => setSelectedHisTxId(null)}
          transactionId={selectedHisTxId}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={true}
          onClose={() => setShowReportModal(false)}
          title="Daily Shop Cash Account Statement"
          dateStr={filterDate}
          closingBalance={stats.balance}
          items={filteredList.map(t => ({
            id: t.id,
            note: t.description,
            type: t.type,
            amount: t.amount
          }))}
        />
      )}
    </div>
  );
};

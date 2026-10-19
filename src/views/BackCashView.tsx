/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Edit2,
  Trash2,
  History,
  Lock,
  Unlock,
  Bell,
  Save,
  PlusCircle,
  MinusCircle,
  Sparkles,
  LockKeyhole
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BackCashType, BackCashTransaction } from '../types/pos';
import { HistoryModal } from '../components/HistoryModal';
import { ReportModal } from '../components/ReportModal';
import { DateNavigator } from '../components/DateNavigator';

export const BackCashView: React.FC = () => {
  const {
    filterDate,
    setFilterDate,
    yesterdayDate,
    currentUser,
    systemSettings,
    setSystemSettings,
    backCashTransactions,
    addBackCash,
    updateBackCash,
    deleteBackCash,
    transferBetweenCashAccounts,
    getBackCashTotal,
    getBackCashClosingDetails,
    getYesterdayBackCashClosing,
    getLastBackCashClosingInfo,
    editHistory,
    setActiveView
  } = usePOS();

  // New Entry Form State
  const [type, setType] = useState<BackCashType>('receiving');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const formCardRef = useRef<HTMLDivElement>(null);
  const [isFormFocused, setIsFormFocused] = useState<boolean>(false);

  // Handle mobile keyboard open/close so form stays in comfortable view
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let initialHeight = vv.height;
    const handleViewportResize = () => {
      if (vv.height >= initialHeight - 60 && isFormFocused) {
        setTimeout(() => {
          formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    vv.addEventListener('resize', handleViewportResize);
    return () => vv.removeEventListener('resize', handleViewportResize);
  }, [isFormFocused]);

  // Edit Modal State
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<BackCashType>('receiving');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  // Sub-Modals
  const [selectedHisTxId, setSelectedHisTxId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const bcTotal = getBackCashTotal(filterDate);
  const closingInfo = getLastBackCashClosingInfo(filterDate);
  const bcLastClosingAmount = closingInfo.amount;
  const bcLastClosingDate = closingInfo.lastDate;
  const todayBreakdown = getBackCashClosingDetails(filterDate);
  const yesterdayBreakdown = getBackCashClosingDetails(closingInfo.lastDate);
  const filteredList = backCashTransactions.filter(t => t.transaction_date === filterDate);

  const unreadEditsCount = editHistory.filter(h => !h.is_read).length;

  const handleTypeSelect = (newType: BackCashType) => {
    setType(newType);
    const userLabel = currentUser?.name || (currentUser?.role === 'admin' ? 'Admin' : 'Cashier');
    if (newType === 'opening' && (!note || note === 'Back Cash Entry' || note.includes('Closing') || note.includes('Shop Cash'))) {
      setNote('Account Opening Balance');
    } else if (newType === 'closing' && (!note || note === 'Back Cash Entry' || note === 'Account Opening Balance' || note.includes('Shop Cash') || note.includes('Minus'))) {
      setNote(`${userLabel} Closing Balance`);
    } else if (newType === 'closing_minus' && (!note || note === 'Back Cash Entry' || note === 'Account Opening Balance' || note.includes('Shop Cash') || !note.includes('Minus'))) {
      setNote(`${userLabel} Closing Minus (-)`);
    } else if (newType === 'transfer_to_shop' && (!note || note === 'Back Cash Entry' || note.includes('Opening') || note.includes('Closing') || note.includes('se Liya'))) {
      setNote('Shop Cash / Counter ko Diya');
    } else if (newType === 'transfer_from_shop' && (!note || note === 'Back Cash Entry' || note.includes('Opening') || note.includes('Closing') || note.includes('ko Diya'))) {
      setNote('Shop Cash / Counter se Liya');
    } else if ((newType === 'receiving' || newType === 'out') && (note.includes('Opening') || note.includes('Closing') || note.includes('Shop Cash'))) {
      setNote('');
    }
  };

  const handleSubmitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    if (type === 'transfer_to_shop') {
      transferBetweenCashAccounts({
        from: 'back',
        to: 'shop',
        amount: val,
        note: note.trim() || 'Shop Counter ko Diya',
        transaction_date: filterDate
      });
    } else if (type === 'transfer_from_shop') {
      transferBetweenCashAccounts({
        from: 'shop',
        to: 'back',
        amount: val,
        note: note.trim() || 'Shop Counter se Liya',
        transaction_date: filterDate
      });
    } else {
      let defaultNote = 'Back Cash Entry';
      const userLabel = currentUser?.name || (currentUser?.role === 'admin' ? 'Admin' : 'Cashier');
      if (type === 'opening') defaultNote = 'Account Opening Balance';
      else if (type === 'closing') defaultNote = `${userLabel} Closing Balance`;
      else if (type === 'closing_minus') defaultNote = `${userLabel} Closing Minus (-)`;

      addBackCash({
        type,
        amount: val,
        note: note.trim() || defaultNote,
        transaction_date: filterDate
      });
    }

    setAmount('');
    setNote('');
  };

  const openEditModal = (t: BackCashTransaction) => {
    setEditId(t.id);
    setEditType(t.type);
    setEditAmount(t.amount.toString());
    setEditNote(t.note);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const val = parseFloat(editAmount);
    if (isNaN(val) || val <= 0) return;

    updateBackCash(editId, val, editNote, editType);
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this back cash entry?')) {
      deleteBackCash(id);
    }
  };

  const toggleUserDeletePerm = () => {
    if (currentUser?.role !== 'admin') return;
    setSystemSettings(prev => ({
      ...prev,
      user_can_delete: !prev.user_can_delete
    }));
  };

  const getRoleBadge = (roleStr?: string, nameStr?: string) => {
    const role = (roleStr || 'user').toLowerCase();
    let bg = 'bg-slate-700';
    let label = role.toUpperCase();
    if (role === 'admin' || role === 'super_admin') {
      bg = 'bg-emerald-600';
      label = 'ADMIN';
    } else if (role === 'cashier') {
      bg = 'bg-blue-600';
      label = 'CASHIER';
    } else if (role === 'manager') {
      bg = 'bg-amber-600';
      label = 'MANAGER';
    } else if (role === 'salesman') {
      bg = 'bg-purple-600';
      label = 'SALESMAN';
    } else {
      bg = 'bg-slate-600';
      label = 'USER';
    }

    const displayName = nameStr && nameStr.toLowerCase() !== role ? `${label}: ${nameStr}` : label;
    return { bg, label, displayName };
  };

  const getTypeBadge = (entryType: string) => {
    switch (entryType) {
      case 'transfer_to_shop':
        return { label: 'SHOP CASH KO DIYA (-)', bg: 'bg-amber-100 text-amber-900 border-amber-300', isNegative: true, isClosing: false };
      case 'transfer_from_shop':
        return { label: 'SHOP CASH SE LIYA (+)', bg: 'bg-blue-100 text-blue-900 border-blue-300', isNegative: false, isClosing: false };
      case 'out':
        return { label: 'CASH OUT (-)', bg: 'bg-rose-100 text-rose-800 border-rose-200', isNegative: true, isClosing: false };
      case 'closing_minus':
        return { label: 'CLOSING MINIS (-)', bg: 'bg-[#ea580c] text-white border-orange-600', isNegative: true, isClosing: true };
      case 'opening':
        return { label: 'OPENING BAL (+)', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', isNegative: false, isClosing: false };
      case 'closing':
        return { label: 'CLOSING BAL (+)', bg: 'bg-[#ea580c] text-white border-orange-600', isNegative: false, isClosing: true };
      case 'receiving':
      default:
        return { label: 'CASH ADD (+)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', isNegative: false, isClosing: false };
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base sm:text-lg font-black text-slate-800 text-center tracking-tight">
          Back Cash Manager
        </h2>

        {currentUser?.role === 'admin' ? (
          <button
            type="button"
            onClick={() => setActiveView('edit_logs')}
            className={`flex items-center gap-1 px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-colors ${
              unreadEditsCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-slate-700'
            }`}
          >
            <span>History</span>
            <Bell className="w-3.5 h-3.5" />
            {unreadEditsCount > 0 && <span>({unreadEditsCount})</span>}
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Admin Permission Card */}
      {currentUser?.role === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            {systemSettings.user_can_delete ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-rose-600" />}
            <span>User Delete: </span>
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

      {/* Date Filter */}
      <DateNavigator
        value={filterDate}
        onChange={setFilterDate}
        accentColor="blue"
      />

      {/* Main Blue Banner */}
      <div className="bg-[#2980b9] text-white p-5 rounded-2xl shadow-lg shadow-[#2980b9]/20 relative">
        {/* Top bar with CLB Badge on left side */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-mono font-black text-xs sm:text-sm rounded-xl shadow-md border border-amber-300/50"
            title="Active Closing Balance (CLB)"
          >
            <span className="tracking-wide">CLB-{todayBreakdown.activeClosing.toLocaleString()}</span>
          </div>

          {todayBreakdown.activeClosing > 0 ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-md shadow-2xs border border-orange-400">
              Held: Rs. {todayBreakdown.activeClosing.toLocaleString()}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-white/75 uppercase tracking-wider">
              Counter Active
            </span>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight font-mono">
            Rs. {bcTotal.toLocaleString()}
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider opacity-90 mt-0.5">
            TOTAL BACK CASH
          </p>

          {/* Today breakdown if closing was added */}
          {todayBreakdown.activeClosing > 0 && (
            <div className="flex justify-center gap-2 text-xs mt-2 font-bold flex-wrap">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-white">
                Counter: Rs. {todayBreakdown.remainingCounter.toLocaleString()}
              </span>
              <span className="bg-amber-400/30 border border-amber-300/40 px-2.5 py-0.5 rounded-lg text-amber-200">
                Closed: Rs. {todayBreakdown.activeClosing.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Bottom lines in Blue Box: Yesterday Closing details */}
        <div className="mt-3.5 pt-2.5 border-t border-white/25 text-xs text-white/95 font-medium space-y-1">
          {/* Line 1: Yesterday Closing Counter Cash (jo 450 bachay thay) */}
          <div className="flex justify-between items-center">
            <span>
              {bcLastClosingDate === yesterdayDate
                ? (yesterdayBreakdown.activeClosing > 0 ? 'Yesterday Closing (Counter Cash):' : 'Yesterday Closing Cash:')
                : (yesterdayBreakdown.activeClosing > 0 ? `Last Closing Counter (${bcLastClosingDate}):` : `Last Closing Cash (${bcLastClosingDate}):`)}
            </span>
            <span className="font-bold font-mono text-white">
              Rs. {(yesterdayBreakdown.activeClosing > 0 ? yesterdayBreakdown.remainingCounter : bcLastClosingAmount).toLocaleString()}
            </span>
          </div>

          {/* Line 2 (thori chuti c blue box k end per bilkull nechay): Admin / User Closing Line */}
          {yesterdayBreakdown.userClosings.length > 0 ? (
            yesterdayBreakdown.userClosings.map((uc, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px] text-amber-200 font-semibold pt-0.5 border-t border-white/10">
                <span>Yesterday Closing ({uc.userRole ? uc.userRole.toUpperCase() : 'ADMIN'}: {uc.userName}):</span>
                <span className="font-bold font-mono text-amber-300">
                  Rs. {uc.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : yesterdayBreakdown.activeClosing > 0 ? (
            <div className="flex justify-between items-center text-[11px] text-amber-200 font-semibold pt-0.5 border-t border-white/10">
              <span>Yesterday Closing (Admin/User Closing):</span>
              <span className="font-bold font-mono text-amber-300">
                Rs. {yesterdayBreakdown.activeClosing.toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-[10px] text-white/70 pt-0.5">
              <span>Yesterday Closing Staff:</span>
              <span className="font-bold font-mono">Rs. 0</span>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Last / Yesterday Closing Balance Card */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2980b9] text-white flex flex-col items-center justify-center font-bold shadow-xs">
              <span className="text-[9px] leading-tight uppercase font-medium">
                {bcLastClosingDate === yesterdayDate ? 'Kal' : 'Last'}
              </span>
              <span className="text-xs leading-tight font-mono font-black">Cash</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {bcLastClosingDate === yesterdayDate ? 'Yesterday Closing Balance' : 'Last Closing Balance'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-white">
                  AUTO CARRIED
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                {bcLastClosingDate === yesterdayDate
                  ? `Previous Day Closing (${bcLastClosingDate})`
                  : `Last Closed Date (${bcLastClosingDate})`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-base sm:text-lg font-black font-mono text-[#2980b9]">
              Rs. {bcLastClosingAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-300/50 inline-block mt-0.5">
              Today Main Shamil
            </span>
          </div>
        </div>

        {/* Detailed Breakdown for Yesterday: Counter Cash + Staff Closing lines */}
        {yesterdayBreakdown.activeClosing > 0 && (
          <div className="mt-2.5 pt-2 border-t border-blue-200/70 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Counter Cash Left</span>
              <span className="font-mono font-black text-slate-800 text-xs sm:text-sm">
                Rs. {yesterdayBreakdown.remainingCounter.toLocaleString()}
              </span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 block uppercase">
                {yesterdayBreakdown.userClosings[0]?.userName || 'Admin'} Closing
              </span>
              <span className="font-mono font-black text-amber-700 text-xs sm:text-sm">
                Rs. {yesterdayBreakdown.activeClosing.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nayi Entry Card */}
      <div ref={formCardRef} className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3 scroll-mt-16">
        <h3 className="font-black text-center text-sm sm:text-base text-slate-800">
          Nayi Entry
        </h3>

        {/* Quick Type Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleTypeSelect('receiving')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'receiving'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Cash Add (+)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('out')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'out'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Cash Out (-)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('opening')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'opening'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">Opening Balance</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('closing')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'closing'
                ? 'bg-[#ea580c] text-white border-orange-600 shadow-xs'
                : 'bg-orange-50/70 text-orange-900 border-orange-200 hover:bg-orange-100'
            }`}
          >
            <LockKeyhole className="w-3.5 h-3.5 text-orange-500" />
            <span className="truncate">Closing Bal (+)</span>
          </button>
        </div>

        {/* Quick Closing Minis & Leen Deen with Shop Cash Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-dashed border-slate-200 mt-2">
          <button
            type="button"
            onClick={() => handleTypeSelect('closing_minus')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'closing_minus'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="truncate">Closing Minis (-)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('transfer_to_shop')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'transfer_to_shop'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">🔄</span>
            <span className="truncate">Shop Cash Ko Diya (-)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('transfer_from_shop')}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
              type === 'transfer_from_shop'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">🔁</span>
            <span className="truncate">Shop Cash Se Liya (+)</span>
          </button>
        </div>

        <form onSubmit={handleSubmitNewEntry} className="space-y-2.5 text-xs pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Type (Selector)
            </label>
            <select
              value={type}
              onChange={e => handleTypeSelect(e.target.value as BackCashType)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
            >
              <option value="receiving">Cash Add (+)</option>
              <option value="out">Cash Out (-)</option>
              <option value="opening">Account Opening Balance (+)</option>
              <option value="closing">Account Closing Balance (+)</option>
              <option value="closing_minus">Account Closing Balance (- / Minis)</option>
              <option value="transfer_to_shop">🔄 Shop Cash Ko Diya (Back Cash - | Shop +)</option>
              <option value="transfer_from_shop">🔄 Shop Cash Se Liya / Aya (Back Cash + | Shop -)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Amount (Raqam)
            </label>
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Note (Detail/Name)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
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
              placeholder="Note (JazzCash/Name/Detail)"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#2c3e50] hover:bg-slate-700 active:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Back Cash Entry (محفوظ کریں)</span>
          </button>
        </form>
      </div>

      {/* Transaction List Table with clear top margin */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-800">
            Transaction List ({filteredList.length})
          </h3>
        </div>

        {/* Pinned Last / Yesterday Closing Balance Row in List */}
        <div className="py-2.5 px-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {bcLastClosingDate === yesterdayDate ? 'YESTERDAY CLOSING' : 'PREVIOUS CLOSING'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-white">
                  AUTO CARRIED
                </span>
              </div>
              <p className="font-bold text-slate-800 text-[12px] truncate mt-1">
                Previous Closing Balance ({bcLastClosingDate})
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black font-mono text-blue-700">
                Rs. {bcLastClosingAmount.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-500 font-medium">Last Closed Total</span>
            </div>
          </div>

          {/* Detailed breakdown if yesterday had staff closing */}
          {yesterdayBreakdown.activeClosing > 0 && (
            <div className="pt-1.5 border-t border-blue-100/90 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
              <span>
                Counter Cash Left: <b className="font-mono text-slate-800">Rs. {yesterdayBreakdown.remainingCounter.toLocaleString()}</b>
              </span>
              <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                {yesterdayBreakdown.userClosings[0]?.userName || 'Admin'} Closing: <b className="font-mono text-amber-700">Rs. {yesterdayBreakdown.activeClosing.toLocaleString()}</b>
              </span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredList.length > 0 ? (
            filteredList.map(t => {
              const typeInfo = getTypeBadge(t.type);
              const isClosing = t.type === 'closing' || t.type === 'closing_minus';
              const creatorBadge = getRoleBadge(t.created_by_role || t.created_by, t.created_by_name);
              const editorBadge = t.edited_by ? getRoleBadge(t.edited_by_role || t.edited_by, t.edited_by_name) : null;

              return (
                <div
                  key={t.id}
                  className={`py-3 px-2 sm:px-3 rounded-xl flex items-center justify-between text-xs gap-3 transition-colors ${
                    isClosing
                      ? 'bg-orange-50/90 border border-orange-300 shadow-2xs my-1.5'
                      : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${typeInfo.bg}`}>
                        {typeInfo.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white shadow-2xs ${creatorBadge.bg}`}
                        title={`Added by: ${t.created_by_name || t.created_by}`}
                      >
                        {creatorBadge.displayName}
                      </span>
                      {t.edited_by && editorBadge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                          title={`Edited by: ${t.edited_by_name || t.edited_by}`}
                        >
                          ✏️ Edit: {editorBadge.displayName}
                        </span>
                      )}
                      {isClosing && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300">
                          ORANGE CLOSING
                        </span>
                      )}
                    </div>

                    <p className={`font-bold text-[13px] truncate mt-1 ${isClosing ? 'text-orange-950 font-black' : 'text-slate-800'}`}>
                      {t.note || 'No Note'}
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
                      className={`text-sm sm:text-base font-black font-mono ${
                        isClosing
                          ? 'text-orange-600 font-black'
                          : typeInfo.isNegative
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {typeInfo.isNegative ? '-' : '+'} Rs. {t.amount.toLocaleString()}
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
            <div className="py-6 text-center text-slate-400 text-xs">
              Aaj ki koi nayi entry nahi mili.
            </div>
          )}
        </div>

        {/* Generate Report Button - Distinct Dark Navy style with divider */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="w-full py-3 bg-[#1e293b] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>GENERATE IMAGE & SHARE (رپورٹ شیئر)</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 mb-3 pb-2 border-b border-slate-100">
              Back Cash Entry Edit
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Transaction Type</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as BackCashType)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="receiving">Cash Add (+)</option>
                  <option value="out">Cash Out (-)</option>
                  <option value="opening">Account Opening Balance (+)</option>
                  <option value="closing">Account Closing Balance (+)</option>
                  <option value="closing_minus">Account Closing Balance (- / Minis)</option>
                  <option value="transfer_to_shop">🔄 Shop Cash Ko Diya (Back Cash - | Shop +)</option>
                  <option value="transfer_from_shop">🔄 Shop Cash Se Liya / Aya (Back Cash + | Shop -)</option>
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
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
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
          title="Back Cash Manager Statement"
          dateStr={filterDate}
          closingBalance={bcTotal}
          items={[
            ...(bcLastClosingAmount !== undefined
              ? [
                  {
                    id: 'yesterday-closing',
                    note: `Previous Closing Balance (${bcLastClosingDate})`,
                    type: 'opening',
                    amount: bcLastClosingAmount
                  }
                ]
              : []),
            ...filteredList.map(t => ({
              id: t.id,
              note: `${t.note || 'Back Cash Entry'} [${t.created_by_designation || t.created_by || 'Staff'}]${
                t.edited_by ? ` (Edit: ${t.edited_by_role || t.edited_by})` : ''
              }`,
              type: t.type,
              amount: t.amount
            }))
          ]}
        />
      )}
    </div>
  );
};

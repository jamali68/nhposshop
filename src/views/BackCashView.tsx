/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Edit2,
  Trash2,
  History,
  Lock,
  Unlock,
  Bell,
  Save
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { HistoryModal } from '../components/HistoryModal';
import { ReportModal } from '../components/ReportModal';

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
    getBackCashTotal,
    editHistory,
    setActiveView
  } = usePOS();

  // New Entry Form State
  const [type, setType] = useState<'receiving' | 'out'>('receiving');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Edit Modal State
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'receiving' | 'out'>('receiving');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

  // Sub-Modals
  const [selectedHisTxId, setSelectedHisTxId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const bcTotal = getBackCashTotal(filterDate);
  const bcYesterdayTotal = getBackCashTotal(yesterdayDate);
  const filteredList = backCashTransactions.filter(t => t.transaction_date === filterDate);

  const unreadEditsCount = editHistory.filter(h => !h.is_read).length;

  const handleSubmitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount!');
      return;
    }

    addBackCash({
      type,
      amount: val,
      note: note.trim() || 'Back Cash Entry',
      transaction_date: filterDate
    });

    setAmount('');
    setNote('');
  };

  const openEditModal = (t: typeof backCashTransactions[0]) => {
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
      <div className="text-center">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="py-1.5 px-4 bg-white border border-slate-300 font-bold text-xs rounded-full shadow-xs cursor-pointer focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Main Blue Banner */}
      <div className="bg-[#2980b9] text-white p-5 rounded-2xl text-center shadow-lg shadow-[#2980b9]/20">
        <h2 className="text-3xl font-black tracking-tight font-mono">
          Rs. {bcTotal.toLocaleString()}
        </h2>
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 mt-1">
          TOTAL BACK CASH
        </p>

        <div className="mt-3 pt-2 border-t border-white/20 text-xs text-white/90 font-medium">
          Yesterday Closing Cash:{' '}
          <span className="font-bold font-mono text-white">Rs. {bcYesterdayTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Nayi Entry Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3">
        <h3 className="font-black text-center text-sm sm:text-base text-slate-800">
          Nayi Entry
        </h3>

        <form onSubmit={handleSubmitNewEntry} className="space-y-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
            >
              <option value="receiving">Cash Add (+)</option>
              <option value="out">Cash Out (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Amount (Raqam)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Raqam Likhein"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Note (Detail/Name)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (JazzCash/Name/Detail)"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2c3e50] hover:bg-slate-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Back Cash Entry</span>
          </button>
        </form>
      </div>

      {/* Transaction List Table */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-800">
            Transaction List ({filteredList.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredList.length > 0 ? (
            filteredList.map(t => {
              const isOut = t.type === 'out';
              return (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isOut ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'CASH OUT' : 'CASH ADD'}
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
                    <div className={`text-sm font-black font-mono ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isOut ? '-' : '+'} Rs. {t.amount.toLocaleString()}
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
              Koi record nahi mila.
            </div>
          )}
        </div>

        {/* Generate Report Button */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full py-3 bg-[#e67e22] hover:bg-orange-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Share2 className="w-4 h-4" />
          <span>GENERATE IMAGE & SHARE</span>
        </button>
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
                  onChange={e => setEditType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="receiving">Cash Add (+)</option>
                  <option value="out">Cash Out (-)</option>
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
          items={filteredList.map(t => ({
            id: t.id,
            note: t.note,
            type: t.type,
            amount: t.amount
          }))}
        />
      )}
    </div>
  );
};

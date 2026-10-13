/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle2, Bolt, Circle, Leaf, Radio } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { EasyloadRecord } from '../types/pos';

export const EasyloadLedgerView: React.FC = () => {
  const {
    filterDate,
    setFilterDate,
    yesterdayDate,
    easyloadRecords,
    saveEasyloadRecord,
    setActiveView
  } = usePOS();

  const [activeState, setActiveState] = useState<'closing' | 'opening'>('closing');
  const [successMsg, setSuccessMsg] = useState(false);

  const currentData = easyloadRecords[filterDate] || {
    date_recorded: filterDate,
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
    ufone_closing: 0,
    total_commission_earned: 0
  };

  const yesterdayData = easyloadRecords[yesterdayDate] || {
    date_recorded: yesterdayDate,
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
    ufone_closing: 0,
    total_commission_earned: 0
  };

  // State values for form inputs
  const [formData, setFormData] = useState<Partial<EasyloadRecord>>({
    jazz_closing: currentData.jazz_closing,
    telenor_closing: currentData.telenor_closing,
    zong_closing: currentData.zong_closing,
    ufone_closing: currentData.ufone_closing,
    jazz_opening: currentData.jazz_opening || yesterdayData.jazz_closing,
    telenor_opening: currentData.telenor_opening || yesterdayData.telenor_closing,
    zong_opening: currentData.zong_opening || yesterdayData.zong_closing,
    ufone_opening: currentData.ufone_opening || yesterdayData.ufone_closing
  });

  useEffect(() => {
    setFormData({
      jazz_closing: currentData.jazz_closing,
      telenor_closing: currentData.telenor_closing,
      zong_closing: currentData.zong_closing,
      ufone_closing: currentData.ufone_closing,
      jazz_opening: currentData.jazz_opening || yesterdayData.jazz_closing,
      telenor_opening: currentData.telenor_opening || yesterdayData.telenor_closing,
      zong_opening: currentData.zong_opening || yesterdayData.zong_closing,
      ufone_opening: currentData.ufone_opening || yesterdayData.ufone_closing
    });
  }, [filterDate, easyloadRecords]);

  const totalOpening =
    (formData.jazz_opening || 0) +
    (formData.telenor_opening || 0) +
    (formData.zong_opening || 0) +
    (formData.ufone_opening || 0);

  const totalClosing =
    (formData.jazz_closing || 0) +
    (formData.telenor_closing || 0) +
    (formData.zong_closing || 0) +
    (formData.ufone_closing || 0);

  const handleInputChange = (field: keyof EasyloadRecord, val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(val) || 0
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveEasyloadRecord(filterDate, formData);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
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
          Easy Load Balance Manager
        </h2>

        <div className="w-8" />
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Record Saved Successfully!</span>
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white p-3 rounded-2xl text-center shadow-xs border border-slate-200/80">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="py-1.5 px-4 bg-slate-50 border border-slate-300 font-bold text-xs rounded-full shadow-xs cursor-pointer focus:outline-none"
        />
      </div>

      {/* Toggle Slider (Matching PHP: Closing vs Opening) */}
      <div className="bg-slate-200 p-1.5 rounded-full flex relative select-none cursor-pointer">
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-300 shadow-md ${
            activeState === 'closing'
              ? 'left-1.5 bg-gradient-to-r from-purple-600 to-purple-500'
              : 'left-[calc(50%+1.5px)] bg-gradient-to-r from-blue-600 to-blue-500'
          }`}
        />
        <button
          type="button"
          onClick={() => setActiveState('closing')}
          className={`flex-1 py-2 text-xs font-bold z-10 text-center transition-colors ${
            activeState === 'closing' ? 'text-white' : 'text-slate-600'
          }`}
        >
          TOTAL CLOSING
        </button>
        <button
          type="button"
          onClick={() => setActiveState('opening')}
          className={`flex-1 py-2 text-xs font-bold z-10 text-center transition-colors ${
            activeState === 'opening' ? 'text-white' : 'text-slate-600'
          }`}
        >
          TOTAL OPENING
        </button>
      </div>

      {/* Live Total Display Banner */}
      <div
        className={`p-4 rounded-2xl text-white text-center shadow-md transition-all duration-300 ${
          activeState === 'closing'
            ? 'bg-gradient-to-r from-[#8e44ad] to-[#9b59b6]'
            : 'bg-gradient-to-r from-[#2980b9] to-[#3498db]'
        }`}
      >
        <div className="text-2xl font-black font-mono tracking-tight">
          Rs. {(activeState === 'closing' ? totalClosing : totalOpening).toLocaleString()}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
          {activeState === 'closing' ? 'Total Closing Balance Loaded' : 'Total Opening Balance Loaded'}
        </p>
      </div>

      {/* 4 Networks Form Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* JAZZ */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 gap-3">
            <div>
              <span className="font-bold text-amber-700 text-sm flex items-center gap-1">
                <Bolt className="w-4 h-4 text-amber-500" /> JAZZ
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                Yesterday: Rs. {yesterdayData.jazz_closing.toLocaleString()}
              </span>
            </div>
            <div className="w-36">
              <input
                type="number"
                step="any"
                value={activeState === 'closing' ? formData.jazz_closing || '' : formData.jazz_opening || ''}
                onChange={e =>
                  handleInputChange(activeState === 'closing' ? 'jazz_closing' : 'jazz_opening', e.target.value)
                }
                placeholder="0.00"
                className="w-full p-2 bg-slate-50 border-2 border-amber-300 rounded-xl font-bold text-right text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* TELENOR */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 gap-3">
            <div>
              <span className="font-bold text-blue-700 text-sm flex items-center gap-1">
                <Circle className="w-4 h-4 text-blue-500" /> TELENOR
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                Yesterday: Rs. {yesterdayData.telenor_closing.toLocaleString()}
              </span>
            </div>
            <div className="w-36">
              <input
                type="number"
                step="any"
                value={activeState === 'closing' ? formData.telenor_closing || '' : formData.telenor_opening || ''}
                onChange={e =>
                  handleInputChange(activeState === 'closing' ? 'telenor_closing' : 'telenor_opening', e.target.value)
                }
                placeholder="0.00"
                className="w-full p-2 bg-slate-50 border-2 border-blue-300 rounded-xl font-bold text-right text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* ZONG */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 gap-3">
            <div>
              <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                <Leaf className="w-4 h-4 text-emerald-500" /> ZONG
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                Yesterday: Rs. {yesterdayData.zong_closing.toLocaleString()}
              </span>
            </div>
            <div className="w-36">
              <input
                type="number"
                step="any"
                value={activeState === 'closing' ? formData.zong_closing || '' : formData.zong_opening || ''}
                onChange={e =>
                  handleInputChange(activeState === 'closing' ? 'zong_closing' : 'zong_opening', e.target.value)
                }
                placeholder="0.00"
                className="w-full p-2 bg-slate-50 border-2 border-emerald-300 rounded-xl font-bold text-right text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* UFONE */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200 gap-3">
            <div>
              <span className="font-bold text-orange-700 text-sm flex items-center gap-1">
                <Radio className="w-4 h-4 text-orange-500" /> UFONE
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                Yesterday: Rs. {yesterdayData.ufone_closing.toLocaleString()}
              </span>
            </div>
            <div className="w-36">
              <input
                type="number"
                step="any"
                value={activeState === 'closing' ? formData.ufone_closing || '' : formData.ufone_opening || ''}
                onChange={e =>
                  handleInputChange(activeState === 'closing' ? 'ufone_closing' : 'ufone_opening', e.target.value)
                }
                placeholder="0.00"
                className="w-full p-2 bg-slate-50 border-2 border-orange-300 rounded-xl font-bold text-right text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#27ae60] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Balance Records</span>
          </button>
        </form>
      </div>
    </div>
  );
};

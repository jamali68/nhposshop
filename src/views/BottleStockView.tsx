/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Wine,
  Package,
  TrendingUp,
  X,
  History,
  Plus,
  Minus
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BottleItem } from '../types/pos';

export const BottleStockView: React.FC = () => {
  const {
    currentUser,
    bottleItems,
    stockTransactions,
    updateItemStock,
    getRemainingPets,
    getTotalBottleSalesValue,
    setActiveView
  } = usePOS();

  const [managingItem, setManagingItem] = useState<BottleItem | null>(null);
  const [stockType, setStockType] = useState<'remove' | 'add'>('remove');
  const [qty, setQty] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const remainingPets = getRemainingPets();
  const totalSalesValue = getTotalBottleSalesValue();

  // Calculations for Admin Stats
  let totalCommission = 0;
  let totalInventoryValue = 0;
  bottleItems.forEach(item => {
    totalCommission += item.total_stock * item.commission_per_unit;
    totalInventoryValue += item.total_stock * item.unit_price;
  });

  const allOutCommission = stockTransactions
    .filter(t => t.action_type === 'remove')
    .reduce((acc, t) => {
      const it = bottleItems.find(b => b.id === t.item_id);
      return acc + (it ? t.quantity * it.commission_per_unit : 0);
    }, 0);

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingItem) return;
    const num = parseInt(qty, 10);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid quantity!');
      return;
    }

    const success = updateItemStock(managingItem.id, num, stockType, note);
    if (!success) {
      alert('Insufficient stock! Cannot deduct more than available balance.');
      return;
    }

    setQty('');
    setNote('');
    // refresh item reference
    const updated = bottleItems.find(b => b.id === managingItem.id);
    setManagingItem(updated || null);
  };

  const itemHistory = managingItem
    ? stockTransactions.filter(t => t.item_id === managingItem.id).slice(0, 6)
    : [];

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

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <Wine className="w-4 h-4 text-purple-600" />
            <span>Bottle Stock Manager</span>
          </h2>
          <small className="text-[10px] text-slate-400 font-semibold">NH POS Shop Inventory System</small>
        </div>

        <div className="w-8" />
      </div>

      {/* Admin Stats Grid */}
      {currentUser?.role === 'admin' ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 rounded-2xl text-white text-center shadow-md bg-gradient-to-br from-[#a4508b] to-[#5f0a87]">
              <small className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                Total Commission
              </small>
              <div className="text-lg sm:text-xl font-extrabold mt-1">Rs. {totalCommission.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-2xl text-slate-800 text-center shadow-md bg-gradient-to-br from-[#f6d365] to-[#fda085]">
              <small className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                Stock Value
              </small>
              <div className="text-lg sm:text-xl font-extrabold mt-1">Rs. {totalInventoryValue.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 rounded-2xl text-white text-center shadow-md bg-gradient-to-br from-[#FF9100] to-[#F4511E]">
              <small className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                All Out Commission
              </small>
              <div className="text-lg sm:text-xl font-extrabold mt-1">Rs. {allOutCommission.toLocaleString()}</div>
            </div>

            <div className="p-4 rounded-2xl text-white text-center shadow-md bg-gradient-to-br from-[#00BFA5] to-[#00796B]">
              <small className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                Remaining Stock
              </small>
              <div className="text-lg sm:text-xl font-extrabold mt-1">
                {remainingPets.toLocaleString()} <span className="text-xs font-normal">Pets</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl text-white text-center shadow-md bg-gradient-to-br from-[#00BFA5] to-[#00796B]">
          <small className="text-xs font-bold uppercase tracking-wider opacity-90 block">
            Total Remaining Stock
          </small>
          <div className="text-2xl font-black mt-1 font-mono">{remainingPets.toLocaleString()} Pets</div>
        </div>
      )}

      {/* 5th Box - Total Sale */}
      <div className="p-4 rounded-2xl text-white text-center shadow-lg bg-gradient-to-r from-[#11998e] to-[#38ef7d]">
        <small className="text-[10px] font-bold uppercase tracking-wider opacity-90 flex items-center justify-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Total Sale</span>
        </small>
        <div className="text-2xl sm:text-3xl font-black mt-0.5 font-mono">
          Rs. {totalSalesValue.toLocaleString()}
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <h3 className="font-black text-sm text-slate-800">Available Stock Items</h3>

        <div className="divide-y divide-slate-100">
          {bottleItems.map(item => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 block">{item.category}</span>
                <b className="text-sm font-black text-slate-800 block">{item.item_name}</b>
                <span className="text-[11px] text-slate-500">
                  Rate: Rs. {item.unit_price} | Whole: Rs. {item.commission_per_unit}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-[#27ae60] text-white px-3 py-1 rounded-full font-bold text-xs font-mono shadow-xs">
                  {item.total_stock} Pets
                </span>

                <button
                  type="button"
                  onClick={() => setManagingItem(item)}
                  className="px-3.5 py-1.5 bg-[#3498db] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Item Modal (Matching manage_item.php) */}
      {managingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400">Stock Adjustment</span>
              <button
                type="button"
                onClick={() => setManagingItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Pets Display */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-slate-900">{managingItem.item_name}</h2>
              <div className="w-20 h-20 bg-emerald-600 text-white rounded-full mx-auto flex items-center justify-center text-2xl font-black font-mono border-4 border-emerald-100 shadow-md">
                {managingItem.total_stock}
              </div>
              <small className="text-slate-400 text-xs font-semibold block">Current Total Pets</small>
            </div>

            {/* Update Form */}
            <form onSubmit={handleStockUpdate} className="space-y-2.5 text-xs">
              <select
                value={stockType}
                onChange={e => setStockType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
              >
                <option value="remove">Stock Out (Minus -)</option>
                <option value="add">Stock In (Plus +)</option>
              </select>

              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="Enter Quantity (Pets)"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none"
              />

              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note (e.g. Sold to ABC / Fresh Batch)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              />

              <button
                type="submit"
                className="w-full py-3 bg-[#2c3e50] hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Update Now
              </button>
            </form>

            {/* Recent Activity */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recent Activity</span>
              </h4>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {itemHistory.length > 0 ? (
                  itemHistory.map(h => (
                    <div key={h.id} className="p-2 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            h.action_type === 'add'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.action_type.toUpperCase()}
                        </span>
                        <b className="font-mono">{h.quantity} Pets</b>
                      </span>
                      <span className="text-[10px] text-slate-400">{h.note}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">No activity recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  History,
  CheckCircle,
  FileText,
  Calendar,
  X,
  Printer
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { WholesalerBill } from '../types/pos';
import { PrintReceiptModal } from '../components/PrintReceiptModal';

export const WholesalerBillsView: React.FC = () => {
  const {
    wholesalers,
    addWholesaler,
    payWholesaler,
    addNewBillWholesaler,
    updateWholesaler,
    deleteWholesaler,
    getTotalWholesalerPayable,
    dailyTransactions,
    setActiveView
  } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Wholesaler Form
  const [name, setName] = useState<string>('');
  const [totalBill, setTotalBill] = useState<string>('');
  const [invNum, setInvNum] = useState<string>('');
  const [agencyNum, setAgencyNum] = useState<string>('');
  const [supplierNum, setSupplierNum] = useState<string>('');
  const [orderDay, setOrderDay] = useState<string>('');
  const [supplyDay, setSupplyDay] = useState<string>('');

  // Payment inputs per row
  const [payInputs, setPayInputs] = useState<Record<string, string>>({});
  const [addBillInputs, setAddBillInputs] = useState<Record<string, string>>({});

  // Edit Modal
  const [editItem, setEditItem] = useState<WholesalerBill | null>(null);
  const [editBillStr, setEditBillStr] = useState<string>('');
  const [editRemainingStr, setEditRemainingStr] = useState<string>('');

  const sanitizeNumberInput = (rawVal: string): string => {
    if (rawVal === '') return '';
    if (rawVal.length > 1 && rawVal.startsWith('0') && rawVal[1] !== '.') {
      return rawVal.replace(/^0+/, '') || '0';
    }
    return rawVal;
  };

  const openEditWholesalerModal = (w: WholesalerBill) => {
    setEditItem(w);
    setEditBillStr(w.total_bill === 0 ? '' : w.total_bill.toString());
    setEditRemainingStr(w.remaining_balance === 0 ? '' : w.remaining_balance.toString());
  };

  // Statement Ledger Modal
  const [statementWholesaler, setStatementWholesaler] = useState<WholesalerBill | null>(null);
  const [printReceiptBill, setPrintReceiptBill] = useState<WholesalerBill | null>(null);

  const totalPayable = getTotalWholesalerPayable();
  const totalCount = wholesalers.length;
  const activeCount = wholesalers.filter(w => w.remaining_balance > 0).length;
  const inactiveCount = wholesalers.filter(w => w.remaining_balance <= 0).length;

  const filteredList = wholesalers.filter(w => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      w.customer_name.toLowerCase().includes(q) ||
      (w.invoice_number && w.invoice_number.toLowerCase().includes(q)) ||
      (w.agency_dealer_number && w.agency_dealer_number.toLowerCase().includes(q)) ||
      w.remaining_balance.toString().includes(q)
    );
  });

  const handleAddWholesaler = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Wholesaler ka naam zaroori hai!');
      return;
    }
    const billVal = totalBill.trim() === '' ? 0 : parseFloat(totalBill);
    if (isNaN(billVal) || billVal < 0) {
      alert('Baraye meharbani durust bill amount (0 ya us se zyada) darj karein!');
      return;
    }

    addWholesaler({
      customer_name: name.trim(),
      total_bill: billVal,
      invoice_number: invNum.trim() || undefined,
      agency_dealer_number: agencyNum.trim() || undefined,
      supplier_number: supplierNum.trim() || undefined,
      order_day: orderDay.trim() || undefined,
      supply_day: supplyDay.trim() || undefined
    });

    setName('');
    setTotalBill('');
    setInvNum('');
    setAgencyNum('');
    setSupplierNum('');
    setOrderDay('');
    setSupplyDay('');
    setShowAddForm(false);
  };

  const handlePay = (bill: WholesalerBill) => {
    const inputVal = payInputs[bill.id] !== undefined ? parseFloat(payInputs[bill.id]) : bill.remaining_balance;
    if (isNaN(inputVal) || inputVal <= 0) {
      alert('Sahi payment amount likhein!');
      return;
    }
    if (inputVal > bill.remaining_balance) {
      alert('Payment cannot exceed remaining balance!');
      return;
    }

    if (window.confirm(`Record payment of Rs. ${inputVal.toLocaleString()} to ${bill.customer_name}?`)) {
      payWholesaler(bill.id, inputVal);
      setPayInputs(prev => ({ ...prev, [bill.id]: '' }));
    }
  };

  const handleAddNewBill = (bill: WholesalerBill) => {
    const inputVal = parseFloat(addBillInputs[bill.id]);
    if (isNaN(inputVal) || inputVal <= 0) {
      alert('Please enter new bill amount!');
      return;
    }

    addNewBillWholesaler(bill.id, inputVal);
    setAddBillInputs(prev => ({ ...prev, [bill.id]: '' }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this wholesaler record?')) {
      deleteWholesaler(id);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const trimmedName = editItem.customer_name?.trim();
    if (!trimmedName) {
      alert('Wholesaler ka naam zaroori hai!');
      return;
    }

    const totalBillVal = editBillStr.trim() === '' ? 0 : parseFloat(editBillStr);
    const remainingVal = editRemainingStr.trim() === '' ? 0 : parseFloat(editRemainingStr);

    if (isNaN(totalBillVal) || totalBillVal < 0 || isNaN(remainingVal) || remainingVal < 0) {
      alert('Baraye meharbani durust raqam (0 ya us se zyada) darj karein!');
      return;
    }

    const updatedWholesaler: WholesalerBill = {
      ...editItem,
      customer_name: trimmedName,
      total_bill: totalBillVal,
      remaining_balance: remainingVal,
      status: remainingVal <= 0 ? 'paid' : 'pending'
    };

    updateWholesaler(updatedWholesaler);
    setEditItem(null);
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
          Wholesaler Ledger
        </h2>

        <div className="w-8" />
      </div>

      {/* Red Summary Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-rose-700 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="space-y-0.5 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 opacity-80" />
            <span>Total Wholesalers: {totalCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Active: {activeCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-200">
            <span>Inactive: {inactiveCount}</span>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
            Rs. {totalPayable.toLocaleString()}
          </h2>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-90">
            TOTAL PAYABLE
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, amount, or invoice..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-blue-500 rounded-xl font-medium text-xs shadow-xs focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Toggle Add Wholesaler Form Button */}
      <button
        type="button"
        onClick={() => setShowAddForm(prev => !prev)}
        className="w-full py-3 bg-[#1e293b] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
      >
        <PlusCircle className="w-4 h-4 text-emerald-400" />
        <span>{showAddForm ? '× Close Form' : '+ Add New Wholesaler'}</span>
      </button>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
          <h3 className="font-black text-sm text-slate-800 text-center">New Wholesaler Details</h3>
          <form onSubmit={handleAddWholesaler} className="space-y-2.5 text-xs">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Wholesaler / Company Name *"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            />
            <input
              type="number"
              value={totalBill}
              onChange={e => setTotalBill(e.target.value)}
              placeholder="Total Bill Amount (0 ya raqam)"
              min="0"
              step="any"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm"
            />

            <div className="pt-1 text-[11px] text-slate-400 font-semibold">Optional Details:</div>
            <input
              type="text"
              value={invNum}
              onChange={e => setInvNum(e.target.value)}
              placeholder="Invoice Number (e.g. PEP-101)"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={agencyNum}
                onChange={e => setAgencyNum(e.target.value)}
                placeholder="Agency/Dealer Phone No"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={supplierNum}
                onChange={e => setSupplierNum(e.target.value)}
                placeholder="Supplier Phone No"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={orderDay}
                onChange={e => setOrderDay(e.target.value)}
                placeholder="Order Day (e.g. Monday)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={supplyDay}
                onChange={e => setSupplyDay(e.target.value)}
                placeholder="Supply Day (e.g. Tuesday)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Save Wholesaler
            </button>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <h3 className="font-black text-sm text-slate-800">Payables Ledger ({filteredList.length})</h3>

        <div className="divide-y divide-slate-100">
          {filteredList.length > 0 ? (
            filteredList.map(w => {
              const isPaid = w.remaining_balance <= 0;
              return (
                <div key={w.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Info Column */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-sm font-black text-slate-900">{w.customer_name}</b>
                      {w.invoice_number && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">
                          Inv: {w.invoice_number}
                        </span>
                      )}
                      {w.agency_dealer_number && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {w.agency_dealer_number}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      Bill: Rs. {w.total_bill.toLocaleString()} | Date: {w.created_date}
                    </div>

                    {(w.order_day || w.supply_day) && (
                      <div className="text-sky-700 text-[11px] flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Order: {w.order_day || '-'} | Supply: {w.supply_day || '-'}</span>
                      </div>
                    )}

                    <div>
                      {isPaid ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3" /> Rs. 0 (Nil / Clear)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs">
                          Baqi Dena Hai: <b className="font-mono text-sm">Rs. {w.remaining_balance.toLocaleString()}</b>
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => openEditWholesalerModal(w)}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatementWholesaler(w)}
                        className="text-purple-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintReceiptBill(w)}
                        className="text-slate-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Printer className="w-3 h-3" /> Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="text-rose-500 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Payment & Add Bill Controls */}
                  <div className="sm:w-48 space-y-2 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {/* Pay Form */}
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Raqam"
                        value={payInputs[w.id] ?? (isPaid ? '' : w.remaining_balance.toString())}
                        onChange={e => setPayInputs(prev => ({ ...prev, [w.id]: e.target.value }))}
                        disabled={isPaid}
                        className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                      <button
                        type="button"
                        disabled={isPaid}
                        onClick={() => handlePay(w)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          isPaid ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        PAY
                      </button>
                    </div>

                    {/* Add New Bill Form */}
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Naya Bill"
                        value={addBillInputs[w.id] || ''}
                        onChange={e => setAddBillInputs(prev => ({ ...prev, [w.id]: e.target.value }))}
                        className="w-24 p-1.5 bg-white border border-blue-300 rounded-lg text-center font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewBill(w)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching wholesaler records found!
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
              Edit Wholesaler Details
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Wholesaler Name</label>
                <input
                  type="text"
                  value={editItem.customer_name}
                  onChange={e => setEditItem({ ...editItem, customer_name: e.target.value })}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Bill</label>
                  <input
                    type="number"
                    value={editBillStr}
                    onChange={e => setEditBillStr(sanitizeNumberInput(e.target.value))}
                    onFocus={e => {
                      if (e.target.value === '0') {
                        setEditBillStr('');
                      } else {
                        e.target.select();
                      }
                    }}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Remaining Balance</label>
                  <input
                    type="number"
                    value={editRemainingStr}
                    onChange={e => setEditRemainingStr(sanitizeNumberInput(e.target.value))}
                    onFocus={e => {
                      if (e.target.value === '0') {
                        setEditRemainingStr('');
                      } else {
                        e.target.select();
                      }
                    }}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editItem.invoice_number || ''}
                  onChange={e => setEditItem({ ...editItem, invoice_number: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement History Modal (PDF View matching get_history.php) */}
      {statementWholesaler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-800">
                  History Ledger: {statementWholesaler.customer_name}
                </h3>
                <p className="text-[11px] text-slate-500">Party Type: Wholesaler</p>
              </div>
              <button
                type="button"
                onClick={() => setStatementWholesaler(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 my-3 rounded-xl flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Opening Balance: <b className="font-mono text-slate-900">Rs. {statementWholesaler.total_bill.toLocaleString()}</b></span>
              <span className="font-bold text-rose-600">
                Remaining Payable: <b className="font-mono">Rs. {statementWholesaler.remaining_balance.toLocaleString()}</b>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs divide-y divide-slate-100 pr-1">
              {(() => {
                const wholesalerTxs = dailyTransactions.filter(
                  t => t.bill_id === statementWholesaler.id && t.party_type === 'wholesaler'
                );

                if (wholesalerTxs.length === 0) {
                  return (
                    <div className="pt-2 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">
                          {statementWholesaler.total_bill === 0
                            ? 'Khata Started (Opening Balance: Rs. 0)'
                            : 'Opening Bill / Payable'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {statementWholesaler.created_date} | Khata Created
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Rs. {statementWholesaler.total_bill.toLocaleString()}
                      </div>
                    </div>
                  );
                }

                return wholesalerTxs.map(tx => (
                  <div key={tx.id} className="pt-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400">{tx.transaction_date} | By: {tx.created_by}</div>
                    </div>
                    <div>
                      {tx.amount === 0 ? (
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Rs. 0 (Opening)
                        </span>
                      ) : (
                        <div className={`font-mono font-bold ${tx.type === 'out' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {tx.type === 'out' ? 'Paid: -' : 'Added: +'} Rs. {tx.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Thermal Slip Modal */}
      {printReceiptBill && (
        <PrintReceiptModal
          isOpen={true}
          onClose={() => setPrintReceiptBill(null)}
          billNumber={printReceiptBill.invoice_number || `WH-${printReceiptBill.id}`}
          customerName={printReceiptBill.customer_name}
          items={[{ name: `Wholesaler Stock Bill`, price: printReceiptBill.total_bill, qty: 1 }]}
          totalAmount={printReceiptBill.total_bill}
          paidAmount={printReceiptBill.total_bill - printReceiptBill.remaining_balance}
          remainingBalance={printReceiptBill.remaining_balance}
        />
      )}
    </div>
  );
};

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
  Phone,
  MapPin,
  Printer,
  X
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { CustomerBill } from '../types/pos';
import { PrintReceiptModal } from '../components/PrintReceiptModal';

export const CustomerBillsView: React.FC = () => {
  const {
    customers,
    addCustomer,
    receiveCustomerPayment,
    payMoreCustomer,
    updateCustomer,
    deleteCustomer,
    getTotalCustomerReceivable,
    dailyTransactions,
    setActiveView
  } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Customer Form State
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [invNum, setInvNum] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderDay, setOrderDay] = useState<string>('');
  const [supplyDay, setSupplyDay] = useState<string>('');

  // Per row input amounts
  const [receiveInputs, setReceiveInputs] = useState<Record<string, string>>({});
  const [payMoreInputs, setPayMoreInputs] = useState<Record<string, string>>({});

  // Edit Modal
  const [editItem, setEditItem] = useState<CustomerBill | null>(null);

  // Statement Ledger Modal & Slip Modal
  const [statementCustomer, setStatementCustomer] = useState<CustomerBill | null>(null);
  const [printReceiptBill, setPrintReceiptBill] = useState<CustomerBill | null>(null);

  const totalReceivable = getTotalCustomerReceivable();
  const totalCount = customers.length;
  const activeCount = customers.filter(c => c.remaining_balance > 0).length;
  const inactiveCount = customers.filter(c => c.remaining_balance <= 0).length;

  const filteredList = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(q) ||
      (c.phone_number && c.phone_number.toLowerCase().includes(q)) ||
      (c.invoice_number && c.invoice_number.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      c.remaining_balance.toString().includes(q)
    );
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!name.trim() || isNaN(val) || val <= 0) {
      alert('Naam aur raqam zaroori hain!');
      return;
    }

    addCustomer({
      customer_name: name.trim(),
      total_bill: val,
      invoice_number: invNum.trim() || undefined,
      phone_number: phone.trim() || undefined,
      address: address.trim() || undefined,
      order_day: orderDay.trim() || undefined,
      supply_day: supplyDay.trim() || undefined
    });

    setName('');
    setAmount('');
    setInvNum('');
    setPhone('');
    setAddress('');
    setOrderDay('');
    setSupplyDay('');
    setShowAddForm(false);
  };

  const handleReceive = (bill: CustomerBill) => {
    const inputVal = receiveInputs[bill.id] !== undefined ? parseFloat(receiveInputs[bill.id]) : bill.remaining_balance;
    if (isNaN(inputVal) || inputVal <= 0) {
      alert('Please enter a valid payment amount!');
      return;
    }
    if (inputVal > bill.remaining_balance) {
      alert('Payment cannot exceed remaining balance!');
      return;
    }

    if (window.confirm(`Record receipt of Rs. ${inputVal.toLocaleString()} from ${bill.customer_name}?`)) {
      receiveCustomerPayment(bill.id, inputVal);
      setReceiveInputs(prev => ({ ...prev, [bill.id]: '' }));
    }
  };

  const handlePayMore = (bill: CustomerBill) => {
    const inputVal = parseFloat(payMoreInputs[bill.id]);
    if (isNaN(inputVal) || inputVal <= 0) {
      alert('Please enter credit amount!');
      return;
    }

    payMoreCustomer(bill.id, inputVal);
    setPayMoreInputs(prev => ({ ...prev, [bill.id]: '' }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer record?')) {
      deleteCustomer(id);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateCustomer(editItem);
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
          Customer Credit Ledger
        </h2>

        <div className="w-8" />
      </div>

      {/* Emerald Box Banner matching PHP #407a22 */}
      <div className="bg-[#407a22] text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="space-y-0.5 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 opacity-80" />
            <span>Total: {totalCount}</span>
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
            Rs. {totalReceivable.toLocaleString()}
          </h2>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-90">
            TOTAL RECEIVABLE
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, amount, or invoice..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-emerald-500 rounded-xl font-medium text-xs shadow-xs focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Toggle Add Customer Button */}
      <button
        type="button"
        onClick={() => setShowAddForm(prev => !prev)}
        className="w-full py-3 bg-[#1e293b] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
      >
        <PlusCircle className="w-4 h-4 text-emerald-400" />
        <span>{showAddForm ? '× Close Form' : '+ Add New Customer Bill'}</span>
      </button>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
          <h3 className="font-black text-sm text-slate-800 text-center">New Customer Bill Details</h3>
          <form onSubmit={handleAddCustomer} className="space-y-2.5 text-xs">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Customer Name *"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Bill / Credit Amount *"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm"
            />

            <div className="pt-1 text-[11px] text-slate-400 font-semibold">Optional Details:</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={invNum}
                onChange={e => setInvNum(e.target.value)}
                placeholder="Invoice Number"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Customer Address"
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl resize-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Payment Date</label>
                <input
                  type="date"
                  value={orderDay}
                  onChange={e => setOrderDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Return Date</label>
                <input
                  type="date"
                  value={supplyDay}
                  onChange={e => setSupplyDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Save Customer Bill
            </button>
          </form>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <h3 className="font-black text-sm text-slate-800">Receivables Ledger ({filteredList.length})</h3>

        <div className="divide-y divide-slate-100">
          {filteredList.length > 0 ? (
            filteredList.map(c => {
              const isPaid = c.remaining_balance <= 0;
              return (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Info Column */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-sm font-black text-slate-900">{c.customer_name}</b>
                      {c.phone_number && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {c.phone_number}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      Bill: Rs. {c.total_bill.toLocaleString()} | Date: {c.created_date}
                    </div>

                    {c.invoice_number && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                        Inv: {c.invoice_number}
                      </span>
                    )}

                    {c.address && (
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.address}</span>
                      </div>
                    )}

                    {(c.order_day || c.supply_day) && (
                      <div className="text-blue-600 text-[11px] flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Payment: {c.order_day || '-'} | Return: {c.supply_day || '-'}</span>
                      </div>
                    )}

                    <div>
                      {isPaid ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3" /> Rs. 0 (Nil / Clear)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs">
                          Baqi Lena Hai: <b className="font-mono text-sm">Rs. {c.remaining_balance.toLocaleString()}</b>
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEditItem(c)}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatementCustomer(c)}
                        className="text-purple-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <History className="w-3 h-3" /> History
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintReceiptBill(c)}
                        className="text-slate-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Printer className="w-3 h-3" /> Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-rose-500 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Payment & Pay More Controls */}
                  <div className="sm:w-52 space-y-2 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {/* Receive Payment Form */}
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="Raqam"
                        value={receiveInputs[c.id] ?? (isPaid ? '' : c.remaining_balance.toString())}
                        onChange={e => setReceiveInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                        disabled={isPaid}
                        className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                      <button
                        type="button"
                        disabled={isPaid}
                        onClick={() => handleReceive(c)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          isPaid ? 'bg-slate-200 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        Receive
                      </button>
                    </div>

                    {/* Additional Credit Form */}
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        placeholder="New Bill"
                        value={payMoreInputs[c.id] || ''}
                        onChange={e => setPayMoreInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-24 p-1.5 bg-white border border-blue-300 rounded-lg text-center font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handlePayMore(c)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        Pay
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching customer records found!
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
              Edit Customer Details
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Customer Name</label>
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
                    value={editItem.total_bill}
                    onChange={e => setEditItem({ ...editItem, total_bill: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Remaining Balance</label>
                  <input
                    type="number"
                    value={editItem.remaining_balance}
                    onChange={e => setEditItem({ ...editItem, remaining_balance: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={editItem.invoice_number || ''}
                    onChange={e => setEditItem({ ...editItem, invoice_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editItem.phone_number || ''}
                    onChange={e => setEditItem({ ...editItem, phone_number: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Address</label>
                <input
                  type="text"
                  value={editItem.address || ''}
                  onChange={e => setEditItem({ ...editItem, address: e.target.value })}
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

      {/* Statement History Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-800">
                  History Ledger: {statementCustomer.customer_name}
                </h3>
                <p className="text-[11px] text-slate-500">Party Type: Customer</p>
              </div>
              <button
                type="button"
                onClick={() => setStatementCustomer(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 my-3 rounded-xl flex justify-between items-center text-xs">
              <span>Opening Bill: Rs. {statementCustomer.total_bill.toLocaleString()}</span>
              <span className="font-bold text-emerald-700">
                Remaining Receivable: Rs. {statementCustomer.remaining_balance.toLocaleString()}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs divide-y divide-slate-100">
              {dailyTransactions
                .filter(t => t.bill_id === statementCustomer.id && t.party_type === 'customer')
                .map(tx => (
                  <div key={tx.id} className="pt-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400">{tx.transaction_date} | By: {tx.created_by}</div>
                    </div>
                    <div className={`font-mono font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'in' ? 'Received: -' : 'Given: +'} Rs. {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
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
          billNumber={printReceiptBill.invoice_number || `CUST-${printReceiptBill.id}`}
          customerName={printReceiptBill.customer_name}
          items={[{ name: `Customer Credit Bill`, price: printReceiptBill.total_bill, qty: 1 }]}
          totalAmount={printReceiptBill.total_bill}
          paidAmount={printReceiptBill.total_bill - printReceiptBill.remaining_balance}
          remainingBalance={printReceiptBill.remaining_balance}
        />
      )}
    </div>
  );
};

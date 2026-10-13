/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X } from 'lucide-react';
import { TajLogo } from './TajLogo';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billNumber?: string;
  customerName?: string;
  dateStr?: string;
  items: Array<{ name: string; price: number; qty: number }>;
  totalAmount: number;
  paidAmount?: number;
  remainingBalance?: number;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  billNumber = 'BILL-001',
  customerName = 'Counter Customer',
  dateStr = new Date().toLocaleDateString(),
  items,
  totalAmount,
  paidAmount = totalAmount,
  remainingBalance = 0
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold">POS Thermal Receipt</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm Receipt Body */}
        <div className="p-6 font-mono text-xs bg-white space-y-4 print:p-0">
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <TajLogo size="sm" className="mx-auto mb-1" />
            <h2 className="text-base font-black tracking-tight font-sans">Taj POS Retail & Mobile</h2>
            <p className="text-[11px] text-slate-600">Point of Sale System</p>
            <p className="text-[10px] text-slate-500">Retail & Wholesale Terminal</p>
          </div>

          {/* Meta Info */}
          <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold">{billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{dateStr}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] text-slate-500 pb-1 border-b border-slate-200">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/4 text-center">QTY</span>
              <span className="w-1/4 text-right">TOTAL</span>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span className="w-1/2 truncate font-medium">{it.name}</span>
                <span className="w-1/4 text-center">{it.qty}</span>
                <span className="w-1/4 text-right font-bold">Rs. {(it.price * it.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-1.5">
              <span>GRAND TOTAL:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cash Paid:</span>
              <span>Rs. {paidAmount.toLocaleString()}</span>
            </div>
            {remainingBalance > 0 && (
              <div className="flex justify-between font-bold text-rose-600">
                <span>Remaining Balance:</span>
                <span>Rs. {remainingBalance.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Barcode Mock */}
          <div className="pt-3 text-center border-t border-dashed border-slate-300 space-y-1">
            <div className="h-8 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_7px,#fff_7px,#fff_9px)] mx-auto w-48 opacity-80" />
            <div className="text-[10px] tracking-widest text-slate-500 font-mono">*{billNumber}*</div>
            <p className="text-[10px] text-slate-600 font-sans mt-2">
              Thank you for your business! Please visit again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

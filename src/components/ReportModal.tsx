/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { X, Printer, Share2, Check } from 'lucide-react';
import { TajLogo } from './TajLogo';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dateStr: string;
  closingBalance: number;
  items: Array<{
    id: string;
    note: string;
    type: string;
    amount: number;
    time?: string;
  }>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  dateStr,
  closingBalance,
  items
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let summaryText = `*${title} - NH POS Shop*\n`;
    summaryText += `Date: ${dateStr}\n`;
    summaryText += `Total Closing Balance: Rs. ${closingBalance.toLocaleString()}\n\n`;
    summaryText += `*Breakdown / Details:*\n`;

    items.forEach((item, idx) => {
      const isNegative = item.type === 'out' || item.type === 'closing_minus' || item.type === 'transfer_to_shop';
      const sign = isNegative ? '-' : '+';
      summaryText += `${idx + 1}. ${item.note || 'Entry'} (${item.type.toUpperCase()}): ${sign}Rs. ${item.amount.toLocaleString()}\n`;
    });

    summaryText += `\n_Generated via NH POS Shop System_`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Top Actions */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Statement Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied & Opening WhatsApp' : 'WhatsApp Share'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div ref={reportRef} className="p-6 overflow-y-auto flex-1 bg-white print:p-0">
          {/* Header */}
          <div className="text-center pb-5 border-b-2 border-slate-800 mb-5">
            <TajLogo size="md" className="mx-auto mb-2" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">NH POS Shop Retail & Mobile</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Account & Cash Book Statement</p>
            <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">{title}</p>
            <p className="text-xs text-slate-600 font-mono mt-1 font-bold">
              Date: <span className="text-slate-900">{dateStr}</span>
            </p>
          </div>

          {/* Banner Box */}
          <div className="bg-[#2980b9] text-white p-4 rounded-xl text-center shadow-sm mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Closing Cash Balance</div>
            <div className="text-2xl font-black mt-1">Rs. {closingBalance.toLocaleString()}</div>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 text-left w-10">Sr#</th>
                <th className="py-2.5 px-3 text-left">Description / Note</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <b className="text-slate-800 text-[13px] block">{item.note || 'General Entry'}</b>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.type}</span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold text-[13px] ${
                        item.type === 'out' || item.type === 'closing_minus' || item.type === 'transfer_to_shop'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {item.type === 'out' || item.type === 'closing_minus' || item.type === 'transfer_to_shop' ? '-' : '+'} Rs. {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No transactions recorded for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer Note */}
          <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 space-y-1">
            <p>This is a computer-generated account statement from NH POS Shop System.</p>
            <p className="font-mono">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

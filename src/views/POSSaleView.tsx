/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Printer,
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePOS } from '../context/POSContext';
import { PrintReceiptModal } from '../components/PrintReceiptModal';

export const POSSaleView: React.FC = () => {
  const {
    bottleItems,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    completeSale,
    setActiveView
  } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [lastSaleReceipt, setLastSaleReceipt] = useState<{
    saleId: string;
    total: number;
    items: Array<{ name: string; price: number; qty: number }>;
  } | null>(null);

  const filteredProducts = bottleItems.filter(p => {
    if (!search.trim()) return true;
    return p.item_name.toLowerCase().includes(search.toLowerCase());
  });

  const cartTotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert('Cart is empty! Please add items first.');
      return;
    }

    const currentCartCopy = [...cart];
    const res = completeSale();

    if (res.success && res.saleId) {
      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setLastSaleReceipt({
        saleId: res.saleId,
        total: res.total || cartTotal,
        items: currentCartCopy
      });
    }
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

        <h2 className="text-base sm:text-lg font-black text-slate-800 text-center tracking-tight flex items-center justify-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span>New Sale / POS Billing Counter</span>
        </h2>

        <div className="w-8" />
      </div>

      {/* POS Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Product Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Item ka naam likhein (e.g. Pepsi, Cola)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          {/* Product Cards Grid */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold">Select Products</span>
              <span>{filteredProducts.length} items found</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map(product => {
                const isOutOfStock = product.total_stock <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/80 hover:border-emerald-500 hover:shadow-xs hover:bg-emerald-50/20 active:scale-[0.99]'
                    }`}
                  >
                    <div>
                      <b className="text-slate-800 text-sm block">{product.item_name}</b>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                        <span className="text-emerald-700 font-bold font-mono">Rs. {product.unit_price}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            product.total_stock <= 5 ? 'text-amber-600' : 'text-slate-500'
                          }`}
                        >
                          Stock: {product.total_stock} Pets
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={e => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-[#27ae60] hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Current Bill & Cart (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col min-h-[420px] justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Current Bill</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-rose-500 font-bold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="py-3 max-h-72 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-800 truncate block">{item.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Rs. {item.price} each
                        </span>
                      </div>

                      {/* Qty +/- Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          className="w-5 h-5 bg-white text-slate-600 rounded-lg flex items-center justify-center font-bold hover:bg-slate-200 shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold font-mono px-1 min-w-5 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          className="w-5 h-5 bg-white text-slate-600 rounded-lg flex items-center justify-center font-bold hover:bg-slate-200 shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total & Delete */}
                      <div className="text-right flex items-center gap-2">
                        <b className="font-mono text-[13px] text-slate-900">
                          Rs. {(item.price * item.qty).toLocaleString()}
                        </b>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                    <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                    <p>Cart is empty. Select items to add to bill.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Total Section & Complete Button */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-base font-black text-slate-900">
                <span>Total Bill:</span>
                <span className="text-2xl font-mono text-emerald-700 font-black">
                  Rs. {cartTotal.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  cart.length > 0
                    ? 'bg-[#27ae60] hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete Sale (Save & Cash In)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Complete Thermal Slip Modal */}
      {lastSaleReceipt && (
        <PrintReceiptModal
          isOpen={true}
          onClose={() => setLastSaleReceipt(null)}
          billNumber={lastSaleReceipt.saleId}
          customerName="Counter Customer"
          items={lastSaleReceipt.items}
          totalAmount={lastSaleReceipt.total}
          paidAmount={lastSaleReceipt.total}
          remainingBalance={0}
        />
      )}
    </div>
  );
};

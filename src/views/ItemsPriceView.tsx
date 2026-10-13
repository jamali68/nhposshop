/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Edit2,
  Save,
  Trash2,
  PlusCircle,
  Tag
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BottleItem } from '../types/pos';

export const ItemsPriceView: React.FC = () => {
  const {
    bottleItems,
    addBottleItem,
    updateBottleItem,
    deleteBottleItem,
    currentUser,
    setActiveView
  } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BottleItem>>({});

  // Add Item State
  const [newName, setNewName] = useState<string>('');
  const [newRetail, setNewRetail] = useState<string>('');
  const [newWhole, setNewWhole] = useState<string>('');
  const [newSalesman, setNewSalesman] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Cold Drinks');

  // Filtered List
  const filteredItems = bottleItems.filter(item => {
    if (!search.trim()) return true;
    return item.item_name.toLowerCase().includes(search.toLowerCase());
  });

  const handleStartEdit = (item: BottleItem) => {
    setEditingId(item.id);
    setEditValues({
      item_name: item.item_name,
      unit_price: item.unit_price,
      commission_per_unit: item.commission_per_unit,
      salesman_price: item.salesman_price,
      category: item.category
    });
  };

  const handleSaveEdit = (item: BottleItem) => {
    if (!editingId) return;

    const updatedItem: BottleItem = {
      ...item,
      item_name: editValues.item_name || item.item_name,
      unit_price: Number(editValues.unit_price) || item.unit_price,
      commission_per_unit: Number(editValues.commission_per_unit) || item.commission_per_unit,
      salesman_price: Number(editValues.salesman_price) || 0,
      category: editValues.category || item.category
    };

    const success = updateBottleItem(updatedItem);
    if (!success) {
      alert('Error: An item with this name already exists!');
      return;
    }

    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteBottleItem(id);
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const ret = parseFloat(newRetail) || 0;
    const whole = parseFloat(newWhole) || 0;
    const sm = parseFloat(newSalesman) || 0;

    const success = addBottleItem({
      item_name: newName.trim(),
      unit_price: ret,
      commission_per_unit: whole,
      salesman_price: sm,
      category: newCategory
    });

    if (!success) {
      alert('Error: An item with this name already exists!');
      return;
    }

    setNewName('');
    setNewRetail('');
    setNewWhole('');
    setNewSalesman('');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Nav */}
      <div className="flex items-center justify-between bg-[#2c3e50] text-white p-3 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3498db] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-amber-400" />
          <span>🏷️ Manage Items Price</span>
        </div>

        <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-lg font-mono">
          {currentUser?.username || 'User'}
        </span>
      </div>

      {/* Search Input with Auto Suggest */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search item name (e.g. Pepsi, Cola)..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-full text-xs font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Existing Items Price List */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-sm text-slate-800">Existing Items Price List</h3>
          <span className="text-xs text-slate-400 font-bold">{filteredItems.length} Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#2c3e50] text-white uppercase text-[11px]">
                <th className="py-2.5 px-3 text-left rounded-l-xl">Item Name</th>
                <th className="py-2.5 px-2 text-center">Retail Price</th>
                <th className="py-2.5 px-2 text-center">Whole Price</th>
                <th className="py-2.5 px-2 text-center">Salesman Price</th>
                <th className="py-2.5 px-3 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.item_name ?? item.item_name}
                          onChange={e => setEditValues({ ...editValues, item_name: e.target.value })}
                          className="w-36 p-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        />
                      ) : (
                        <b className="text-slate-800 text-[13px]">{item.item_name}</b>
                      )}
                    </td>

                    {/* Retail */}
                    <td className="py-2.5 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.unit_price ?? item.unit_price}
                          onChange={e => setEditValues({ ...editValues, unit_price: parseFloat(e.target.value) || 0 })}
                          className="w-20 p-1 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                        />
                      ) : (
                        <span className="font-bold font-mono">Rs. {item.unit_price}</span>
                      )}
                    </td>

                    {/* Wholesale */}
                    <td className="py-2.5 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.commission_per_unit ?? item.commission_per_unit}
                          onChange={e =>
                            setEditValues({ ...editValues, commission_per_unit: parseFloat(e.target.value) || 0 })
                          }
                          className="w-20 p-1 bg-emerald-50 border border-emerald-300 rounded text-center font-bold text-xs text-emerald-800"
                        />
                      ) : (
                        <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Rs. {item.commission_per_unit}
                        </span>
                      )}
                    </td>

                    {/* Salesman */}
                    <td className="py-2.5 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.salesman_price ?? item.salesman_price}
                          onChange={e =>
                            setEditValues({ ...editValues, salesman_price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-20 p-1 bg-amber-50 border border-amber-300 rounded text-center font-bold text-xs text-amber-800"
                        />
                      ) : (
                        <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Rs. {item.salesman_price || 0}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <Save className="w-3 h-3" /> Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.item_name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border-t-4 border-[#27ae60] space-y-3">
        <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>Add New Item</span>
        </h3>

        <form onSubmit={handleAddNew} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Item Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Cola Next 1.5L / Sugar 1kg"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Retail Price (Rs)</label>
              <input
                type="number"
                step="0.01"
                value={newRetail}
                onChange={e => setNewRetail(e.target.value)}
                placeholder="0.00"
                required
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-center focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Whole Price (Rs)</label>
              <input
                type="number"
                step="0.01"
                value={newWhole}
                onChange={e => setNewWhole(e.target.value)}
                placeholder="0.00"
                required
                className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-center text-emerald-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Salesman (Rs)</label>
              <input
                type="number"
                step="0.01"
                value={newSalesman}
                onChange={e => setNewSalesman(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 bg-amber-50 border border-amber-300 rounded-xl font-bold text-center text-amber-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#27ae60] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Add New Item
          </button>
        </form>
      </div>
    </div>
  );
};

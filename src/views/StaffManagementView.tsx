/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Copy,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { StaffAccount, UserRole } from '../types/pos';

export const StaffManagementView: React.FC = () => {
  const {
    currentUser,
    staffAccounts,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount
  } = usePOS();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [phone, setPhone] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('cashier');
    setPhone('');
    setFormError('');
    setEditingAccount(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (acc: StaffAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setUsername(acc.username);
    setPassword(acc.password);
    setRole(acc.role);
    setPhone(acc.phone || '');
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (editingAccount) {
      const success = updateStaffAccount({
        ...editingAccount,
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || undefined
      });
      if (success) {
        setShowAddModal(false);
        resetForm();
      }
    } else {
      const success = addStaffAccount({
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || undefined,
        is_active: true
      });
      if (success) {
        setShowAddModal(false);
        resetForm();
      }
    }
  };

  const handleCopyDetails = (acc: StaffAccount) => {
    const text = `NH POS Shop Staff Login Details:\n• Name: ${acc.name}\n• Username: ${acc.username}\n• Password: ${acc.password}\n• Role: ${acc.role.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return { label: 'Super Admin', color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
      case 'admin':
        return { label: 'Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'manager':
        return { label: 'Manager', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'cashier':
        return { label: 'Cashier', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'salesman':
        return { label: 'Salesman', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: r, color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Staff & User Accounts</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage login credentials for cashiers, managers, and salespersons with role-based permissions.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create New User</span>
        </button>
      </div>

      {/* Main Admin Card Info */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1b263b] text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-emerald-300 text-base">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{currentUser?.name || currentUser?.username}</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500 text-slate-900 font-bold rounded-full uppercase">
                Main Admin / Owner
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              {currentUser?.email ? currentUser.email : 'Google Account (Store Owner)'}
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-400">Total Staff Accounts</div>
          <div className="text-xl font-black text-amber-400">{staffAccounts.length}</div>
        </div>
      </div>

      {/* Staff Accounts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            All Registered Staff Accounts ({staffAccounts.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Staff members sign in using their assigned ID
          </span>
        </div>

        {staffAccounts.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
            <p className="font-bold text-sm text-slate-600">No staff members added yet.</p>
            <p className="text-xs mt-1">
              You can run the store independently as owner, or click &ldquo;+ Create New User&rdquo; to add cashiers and managers.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors"
            >
              + Add First Staff User
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {staffAccounts.map(acc => {
              const badge = getRoleBadge(acc.role);
              return (
                <div key={acc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase text-sm mt-0.5">
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{acc.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {!acc.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300">
                            Disabled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                        <div>
                          <span className="text-slate-400">Username: </span>
                          <span className="font-bold text-slate-700">{acc.username}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Password: </span>
                          <span className="font-bold text-slate-700">•••••••</span>
                        </div>
                        {acc.phone && (
                          <div className="flex items-center gap-1 font-sans text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{acc.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyDetails(acc)}
                      title="Copy login details"
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 text-xs flex items-center gap-1 font-medium"
                    >
                      {copiedId === acc.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold text-[11px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Copy Login</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStaffAccount({ ...acc, is_active: !acc.is_active })}
                      title={acc.is_active ? 'Disable Account' : 'Enable Account'}
                      className={`p-2 rounded-lg transition-colors border text-xs font-bold ${
                        acc.is_active
                          ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {acc.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${acc.name}'s account?`)) {
                          deleteStaffAccount(acc.id);
                        }
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#2c3e50] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingAccount ? 'Edit Staff Account' : 'Create New Staff Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Muhammad Bilal"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Username (Login ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. bilal_cashier"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="e.g. 123456"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Role / Permissions <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none"
                >
                  <option value="cashier">💵 Cashier (Counter Sales, Daily Cash, and Easy Load)</option>
                  <option value="manager">📋 Manager (Ledgers, Receivables, Payables, Stock, and Daily Cash)</option>
                  <option value="salesman">🚚 Salesman (Customer Credit, Price List, and Counter Sales)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {role === 'cashier' && '• Cashier can access Daily Cash Book, Easy Load, and POS counter billing.'}
                  {role === 'manager' && '• Manager can access all customer/wholesaler ledgers, stock, and daily transactions.'}
                  {role === 'salesman' && '• Salesman can access customer ledgers, rate list, and counter POS.'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  {editingAccount ? 'Update Account' : 'Save & Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

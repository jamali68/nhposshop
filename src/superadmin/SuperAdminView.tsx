/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Activity,
  KeyRound,
  Download,
  Search,
  RefreshCw,
  Power,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Users,
  Eye,
  Check,
  X,
  FileJson,
  Database,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { superAdminService, MASTER_EMAIL } from './superAdminService';
import { TenantShopInfo, AuditLogEntry, PlatformMetrics, AuditSeverity } from './types';

export const SuperAdminView: React.FC = () => {
  const {
    currentUser,
    setActiveView,
    isMaintenanceMode,
    toggleMaintenanceMode,
    maintenanceNotice,
    setMaintenanceNotice,
    isFirebaseConnected,
    firebaseSyncStatus
  } = usePOS();

  // Active Tab representing the 3 Parts
  const [activeTab, setActiveTab] = useState<'security' | 'shops' | 'analytics'>('shops');

  // Data States
  const [shops, setShops] = useState<TenantShopInfo[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Change Secret Key Form
  const [newSecretKey, setNewSecretKey] = useState<string>('');
  const [secretUpdateMsg, setSecretUpdateMsg] = useState<string | null>(null);

  // Store Inspection Modal
  const [inspectShop, setInspectShop] = useState<TenantShopInfo | null>(null);

  // Load Data on Mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedShops = await superAdminService.fetchAllShops();
      setShops(fetchedShops);

      const logs = await superAdminService.fetchLiveAuditLogs(fetchedShops);
      setAuditLogs(logs);

      const computed = superAdminService.computePlatformMetrics(fetchedShops, logs);
      setMetrics(computed);
    } catch (err) {
      console.error('Error loading Super Admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Shops
  const filteredShops = useMemo(() => {
    if (!searchTerm.trim()) return shops;
    const term = searchTerm.toLowerCase();
    return shops.filter(s =>
      s.shop_name.toLowerCase().includes(term) ||
      s.owner_name.toLowerCase().includes(term) ||
      s.owner_email.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    );
  }, [shops, searchTerm]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      const matchesSearch = !searchTerm.trim() ||
        log.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [auditLogs, selectedSeverity, searchTerm]);

  // Toggle Store Status
  const handleToggleStatus = async (shop: TenantShopInfo) => {
    const nextStatus = !shop.is_active;
    const success = await superAdminService.setShopStatus(shop.id, nextStatus);
    if (success) {
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, is_active: nextStatus } : s));
    }
  };

  // Change Secret Key
  const handleUpdateSecretKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecretKey.length < 6) {
      setSecretUpdateMsg('Secret key must be at least 6 characters.');
      return;
    }
    const ok = superAdminService.setMasterSecretKey(newSecretKey);
    if (ok) {
      setSecretUpdateMsg('Master Secret Key updated successfully!');
      setNewSecretKey('');
      setTimeout(() => setSecretUpdateMsg(null), 3000);
    }
  };

  const handleLogoutMaster = () => {
    superAdminService.logoutSession();
    setActiveView('dashboard');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Top Super Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
            title="Return to Shop POS"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Super Admin Command Portal</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold uppercase">
                Master Root
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized Master: <span className="font-mono text-indigo-300 font-semibold">{currentUser?.email || MASTER_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
            title="Refresh All Store Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutMaster}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all"
            title="Lock & Exit Master Portal"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Lock Master</span>
          </button>
        </div>
      </div>

      {/* 3-Part Modular Tab Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-sm text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('shops')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'shops'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Part 2: Store Controls</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {shops.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Part 3: Live Logs &amp; Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Part 1: Security &amp; Auth</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PART 2: SHOP & STORE CONTROLS TAB                                         */}
      {/* ========================================================================= */}
      {activeTab === 'shops' && (
        <div className="space-y-4">
          {/* Quick Metrics & Search Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by store name, owner, or email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 w-full sm:w-auto justify-end">
              <span>Total Stores: <b className="text-slate-900 font-mono">{shops.length}</b></span>
              <span>·</span>
              <span>Active: <b className="text-emerald-600 font-mono">{shops.filter(s => s.is_active).length}</b></span>
              <span>·</span>
              <span>Suspended: <b className="text-rose-600 font-mono">{shops.filter(s => !s.is_active).length}</b></span>
            </div>
          </div>

          {/* High-Density Shops Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Store Profile</th>
                    <th className="py-3 px-4">Owner &amp; Email</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShops.length > 0 ? (
                    filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {shop.shop_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>ID: {shop.id.slice(0, 16)}...</span>
                            {shop.phone && <span>· 📞 {shop.phone}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{shop.owner_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{shop.owner_email || 'No email provided'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {shop.created_at ? new Date(shop.created_at).toLocaleDateString() : 'Active'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(shop)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              shop.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            }`}
                            title="Click to toggle store status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${shop.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{shop.is_active ? 'Active' : 'Suspended'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectShop(shop)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                              title="Inspect Store Metadata"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => superAdminService.exportShopBackup(shop.id, shop.shop_name)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                              title="Download complete JSON backup for this store"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Backup</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No stores found matching your search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: LIVE DATABASE & AUDIT LOGS TAB                                    */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Platform Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Registered Shops</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {metrics?.totalShops || shops.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">100% Multi-Tenant Isolated</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Active Stores</span>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                {metrics?.activeShopsCount || shops.filter(s => s.is_active).length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Real-time operation ready</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Database Health</span>
              <div className="text-base font-black text-indigo-600 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Cloud Synced</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Status: {firebaseSyncStatus}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-500 font-bold block uppercase">Live Audit Events</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {auditLogs.length}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Multi-store activity feed</span>
            </div>
          </div>

          {/* Audit Logs Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Filter Severity:</span>
              <div className="flex gap-1">
                {(['all', 'info', 'warn'] as const).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-500 text-[11px]">
              Showing <b className="text-slate-800 font-mono">{filteredLogs.length}</b> live events
            </div>
          </div>

          {/* Real-time Audit Logs Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Live System Audit Log Stream (All Stores)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Auto-refreshed</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          log.severity === 'warn'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">{log.shop_name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">By {log.user_name} ({log.user_role})</span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                        {log.details}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No audit logs recorded for this criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 1: SECURITY & MASTER AUTH TAB                                        */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Master Key Configuration Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Master Secret Security Key</h3>
                <p className="text-[11px] text-slate-500">Configure the master unlock passkey for Super Admin access</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Active Secret</span>
                <span className="font-mono font-bold text-slate-800 text-sm">•••••••••••••</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">Active</span>
            </div>

            <form onSubmit={handleUpdateSecretKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  New Master Secret Key (Minimum 6 characters)
                </label>
                <input
                  type="text"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  placeholder="e.g. NH-MASTER-2026-X"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {secretUpdateMsg && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[11px]">
                  {secretUpdateMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Save New Master Secret Key
              </button>
            </form>
          </div>

          {/* Global Broadcast & Maintenance Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Global System Maintenance Broadcast</h3>
                <p className="text-[11px] text-slate-500">Lock cashier mutations across all stores during server updates</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="font-bold text-xs text-slate-800 block">Maintenance Lockdown</span>
                <span className="text-[11px] text-slate-500">
                  {isMaintenanceMode ? 'Currently active across all shops' : 'Normal operations running'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleMaintenanceMode()}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isMaintenanceMode ? 'bg-orange-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Broadcasted Maintenance Message:
              </label>
              <textarea
                rows={3}
                value={maintenanceNotice}
                onChange={(e) => setMaintenanceNotice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                placeholder="Enter alert message displayed on all cashier screens..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Store Inspection Modal */}
      {inspectShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base text-slate-900">{inspectShop.shop_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectShop(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner Name</span>
                <span className="font-bold text-slate-800">{inspectShop.owner_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Owner Email</span>
                <span className="font-bold text-slate-800 font-mono truncate block">{inspectShop.owner_email || 'None'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unique Shop ID</span>
                <span className="font-mono text-[10px] text-slate-600 truncate block">{inspectShop.id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Operating Status</span>
                <span className={`font-bold ${inspectShop.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {inspectShop.is_active ? 'Active & Running' : 'Suspended'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectShop(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => superAdminService.exportShopBackup(inspectShop.id, inspectShop.shop_name)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

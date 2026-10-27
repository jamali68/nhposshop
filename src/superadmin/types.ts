/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SuperAdminSession {
  isAuthenticated: boolean;
  masterEmail: string;
  loginTime: string;
  token?: string;
}

export interface TenantShopInfo {
  id: string; // shop ID (usually owner UID)
  shop_name: string;
  owner_name: string;
  owner_email: string;
  phone?: string;
  address?: string;
  created_at: string;
  is_active: boolean;
  total_transactions?: number;
  total_staff?: number;
  last_activity?: string;
  estimated_balance?: number;
}

export type AuditSeverity = 'info' | 'warn' | 'alert';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  shop_id: string;
  shop_name: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  severity: AuditSeverity;
}

export interface PlatformMetrics {
  totalShops: number;
  activeShopsCount: number;
  suspendedShopsCount: number;
  totalPlatformStaff: number;
  totalTransactionsRecorded: number;
  systemSyncHealth: 'healthy' | 'degraded' | 'offline';
  lastHealthCheck: string;
}

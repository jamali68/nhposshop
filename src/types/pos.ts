/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'salesman' | 'user';

export interface ShopProfile {
  id: string; // Shop ID (matches Owner UID)
  shop_name: string;
  owner_name: string;
  owner_email: string;
  owner_uid: string;
  password?: string; // Owner password (defaults to 123456 for all existing accounts)
  phone?: string;
  address?: string;
  created_at: string;
}

export interface User {
  username: string;
  role: UserRole;
  name?: string;
  email?: string;
  password?: string;
  isGoogleUser?: boolean;
  photoURL?: string;
  shopId: string;
  shopName?: string;
  isDemo?: boolean;
}

export interface StaffAccount {
  id: string;
  shop_id?: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export type TransactionType = 'opening' | 'in' | 'out' | 'bill_add' | 'payment' | 'shift_closing';

export interface DailyTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string; // YYYY-MM-DD
  created_by: string;
  created_by_name?: string;
  created_at?: string;
  party_type?: 'customer' | 'wholesaler' | 'none';
  bill_id?: string;
  linked_transfer_id?: string;
  transfer_direction?: 'from_back_cash' | 'to_back_cash';
  extra_fields?: Record<string, any>;
}

export type BackCashType = 'receiving' | 'out' | 'opening' | 'closing' | 'closing_minus' | 'commission' | 'transfer_to_shop' | 'transfer_from_shop' | string;

export interface BackCashTransaction {
  id: string;
  type: 'receiving' | 'out' | 'opening' | 'closing' | 'closing_minus' | 'commission' | 'transfer_to_shop' | 'transfer_from_shop' | string;
  amount: number;
  note: string;
  transaction_date: string; // YYYY-MM-DD
  created_by: string;
  created_by_role?: string;
  created_by_name?: string;
  created_by_designation?: string;
  edited_by?: string;
  edited_by_role?: string;
  edited_by_name?: string;
  edited_at?: string;
  linked_transfer_id?: string;
  transfer_direction?: 'to_shop' | 'from_shop';
  extra_fields?: Record<string, any>;
}

export interface BackCashClosingBreakdown {
  totalBalance: number;
  activeClosing: number;
  remainingCounter: number;
  userClosings: {
    userId: string;
    userName: string;
    userRole: string;
    amount: number;
  }[];
}

export interface WholesalerBill {
  id: string;
  customer_name: string;
  total_bill: number;
  remaining_balance: number;
  created_date: string;
  status: 'pending' | 'paid';
  invoice_number?: string;
  agency_dealer_number?: string;
  supplier_number?: string;
  order_day?: string;
  supply_day?: string;
  extra_fields?: Record<string, any>;
}

export interface CustomerBill {
  id: string;
  customer_name: string;
  total_bill: number;
  remaining_balance: number;
  created_date: string;
  status: 'pending' | 'paid';
  invoice_number?: string;
  phone_number?: string;
  address?: string;
  order_day?: string;
  supply_day?: string;
  extra_fields?: Record<string, any>;
}

export interface EasyloadRecord {
  date_recorded: string; // YYYY-MM-DD
  jazz_opening: number;
  jazz_purchase: number;
  jazz_closing: number;
  telenor_opening: number;
  telenor_purchase: number;
  telenor_closing: number;
  zong_opening: number;
  zong_purchase: number;
  zong_closing: number;
  ufone_opening: number;
  ufone_purchase: number;
  ufone_closing: number;
  total_commission_earned: number;
}

export interface BottleItem {
  id: string;
  item_name: string;
  category: string;
  total_stock: number;
  unit_price: number; // Retail sale price
  commission_per_unit: number; // Wholesale price
  salesman_price: number;
  extra_fields?: Record<string, any>;
}

export interface StockTransaction {
  id: string;
  item_id: string;
  item_name: string;
  user_name: string;
  action_type: 'add' | 'remove' | 'reverse';
  quantity: number;
  note: string;
  created_at: string;
}

export interface EditHistoryRecord {
  id: string;
  transaction_id: string;
  source: 'shop' | 'back';
  old_amount: number;
  new_amount: number;
  edited_by: string;
  edited_at: string;
  is_read: boolean;
  note?: string;
  transaction_date?: string;
}

export interface DeletedHistoryRecord {
  id: string;
  original_id: string;
  source: 'shop_cash' | 'back_cash' | 'wholesaler_khata' | 'customer_khata';
  type: string;
  amount: number;
  note: string;
  transaction_date: string;
  deleted_by: string;
  deleted_at: string;
  bill_id?: string;
  party_type?: 'customer' | 'wholesaler' | 'none';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface SystemSettings {
  user_can_delete: boolean;
  maintenance_mode: boolean;
  maintenance_end_time?: string;
}

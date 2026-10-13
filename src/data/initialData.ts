/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DailyTransaction,
  BackCashTransaction,
  WholesalerBill,
  CustomerBill,
  EasyloadRecord,
  BottleItem,
  StockTransaction,
  SystemSettings
} from '../types/pos';

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (dateStr: string): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// All collections start completely empty with 0 records
export const initialBottleItems: BottleItem[] = [];
export const initialEasyloadRecords: Record<string, EasyloadRecord> = {};
export const initialDailyTransactions: DailyTransaction[] = [];
export const initialBackCashTransactions: BackCashTransaction[] = [];
export const initialWholesalers: WholesalerBill[] = [];
export const initialCustomers: CustomerBill[] = [];
export const initialStockTransactions: StockTransaction[] = [];

export const initialSystemSettings: SystemSettings = {
  user_can_delete: true,
  maintenance_mode: false
};

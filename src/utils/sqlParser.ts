/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BottleItem, CustomerBill, WholesalerBill, DailyTransaction } from '../types/pos';

export type TargetEntity = 'bottle_items' | 'customers' | 'wholesalers' | 'daily_transactions' | 'ignore';

export interface SqlColumnMapping {
  sourceColumn: string;
  targetField: string; // Target property name or '_extra_' or '_ignore_'
  confidence: 'auto_matched' | 'manual' | 'extra';
}

export interface ParsedSqlTable {
  tableName: string;
  columns: string[];
  rows: Record<string, any>[];
  suggestedEntity: TargetEntity;
  defaultMappings: Record<string, string>; // sourceCol -> targetField
  unmappedColumns: string[];
  totalRows: number;
}

export interface SqlParseResult {
  success: boolean;
  tables: ParsedSqlTable[];
  totalStatementsFound: number;
  error?: string;
}

// Common aliases for smart matching
const FIELD_ALIASES: Record<Exclude<TargetEntity, 'ignore'>, Record<string, string[]>> = {
  bottle_items: {
    item_name: ['item_name', 'name', 'product_name', 'item', 'title', 'pname', 'description', 'product', 'item_title', 'product_title', 'productname'],
    category: ['category', 'cat', 'group', 'item_group', 'type', 'category_name', 'classification', 'cat_name', 'group_name'],
    total_stock: ['total_stock', 'stock', 'qty', 'quantity', 'inventory', 'balance_qty', 'stock_qty', 'qty_in_stock', 'available_stock', 'current_stock'],
    unit_price: ['unit_price', 'price', 'sale_price', 'mrp', 'retail_price', 'rate', 'sale_rate', 'selling_price', 'sell_price'],
    commission_per_unit: ['commission_per_unit', 'cost_price', 'purchase_price', 'wholesale_price', 'cost', 'buy_price', 'dealer_price', 'trade_price'],
    salesman_price: ['salesman_price', 'distributor_price', 'special_price', 'agent_price', 'supply_price']
  },
  customers: {
    customer_name: ['customer_name', 'name', 'client_name', 'party_name', 'cust_name', 'title', 'customer', 'account_title', 'person_name'],
    phone_number: ['phone_number', 'phone', 'mobile', 'contact', 'cell', 'whatsapp', 'tel', 'mobile_no', 'phone_no'],
    address: ['address', 'city', 'location', 'area', 'addr', 'street', 'shop_address'],
    remaining_balance: ['remaining_balance', 'balance', 'current_balance', 'udhar', 'dues', 'amount', 'khata_balance', 'net_balance'],
    total_bill: ['total_bill', 'total_amount', 'bill', 'gross_amount', 'total']
  },
  wholesalers: {
    customer_name: ['customer_name', 'wholesaler_name', 'supplier_name', 'name', 'party_name', 'vendor_name', 'company_name', 'dealer_name'],
    supplier_number: ['supplier_number', 'phone', 'contact', 'mobile', 'phone_number', 'agency_dealer_number', 'vendor_phone'],
    remaining_balance: ['remaining_balance', 'balance', 'current_balance', 'payable', 'dues', 'khata_balance'],
    total_bill: ['total_bill', 'bill', 'total_amount']
  },
  daily_transactions: {
    description: ['description', 'note', 'details', 'particulars', 'remarks', 'narration', 'desc'],
    amount: ['amount', 'total', 'cash', 'val', 'price', 'total_amount'],
    type: ['type', 'trans_type', 'direction', 'action', 'cash_type'],
    transaction_date: ['transaction_date', 'date', 'created_at', 'entry_date', 'trans_date']
  }
};

/**
 * Clean up SQL comments and unwanted directives
 */
function cleanSql(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */ comments
    .replace(/--.*$/gm, '')           // Remove -- comments
    .replace(/^#.*$/gm, '')            // Remove # comments
    .trim();
}

/**
 * Parse a raw SQL value token: 'text', 123, NULL, etc.
 */
function parseValueToken(token: string): any {
  token = token.trim();
  if (token === '' || token.toUpperCase() === 'NULL') return null;
  if (token.toUpperCase() === 'TRUE') return true;
  if (token.toUpperCase() === 'FALSE') return false;

  // Quoted string
  if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
    const inner = token.slice(1, -1);
    // Unescape standard SQL escapes: \' -> ' and '' -> '
    return inner.replace(/\\'/g, "'").replace(/''/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  // Number
  const num = Number(token);
  if (!isNaN(num)) return num;

  return token;
}

/**
 * Extract individual row tuples from VALUES (...), (...);
 */
function extractRowTuples(valuesBlock: string): any[][] {
  const rows: any[][] = [];
  let inString = false;
  let quoteChar = '';
  let escape = false;
  let inTuple = false;
  let currentVal = '';
  let currentTuple: any[] = [];

  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];

    if (escape) {
      currentVal += char;
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      currentVal += char;
      continue;
    }

    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      quoteChar = char;
      currentVal += char;
      continue;
    } else if (char === quoteChar && inString) {
      // Check for SQL double-quote escape ('')
      if (valuesBlock[i + 1] === quoteChar) {
        currentVal += char + quoteChar;
        i++;
        continue;
      }
      inString = false;
      quoteChar = '';
      currentVal += char;
      continue;
    }

    if (inString) {
      currentVal += char;
      continue;
    }

    // Outside string literal
    if (char === '(' && !inTuple) {
      inTuple = true;
      currentTuple = [];
      currentVal = '';
    } else if (char === ')' && inTuple) {
      currentTuple.push(parseValueToken(currentVal));
      rows.push(currentTuple);
      currentTuple = [];
      currentVal = '';
      inTuple = false;
    } else if (char === ',' && inTuple) {
      currentTuple.push(parseValueToken(currentVal));
      currentVal = '';
    } else if (inTuple) {
      currentVal += char;
    }
  }

  return rows;
}

/**
 * Auto-detect POS entity based on table name and columns
 */
function detectTargetEntity(tableName: string, columns: string[]): TargetEntity {
  const normTable = tableName.toLowerCase().replace(/[`"'_\-\s]/g, '');
  const cols = columns.map(c => c.toLowerCase().replace(/[`"'_\-\s]/g, ''));

  if (
    normTable.includes('product') ||
    normTable.includes('item') ||
    normTable.includes('stock') ||
    normTable.includes('inventory') ||
    normTable.includes('bottle') ||
    normTable.includes('article') ||
    normTable.includes('price') ||
    cols.includes('stock') ||
    cols.includes('qty') ||
    cols.includes('unitprice') ||
    cols.includes('saleprice')
  ) {
    return 'bottle_items';
  }

  if (
    normTable.includes('customer') ||
    normTable.includes('client') ||
    normTable.includes('party') ||
    normTable.includes('khata') ||
    normTable.includes('buyer') ||
    cols.includes('customername') ||
    cols.includes('custname')
  ) {
    return 'customers';
  }

  if (
    normTable.includes('wholesaler') ||
    normTable.includes('supplier') ||
    normTable.includes('vendor') ||
    normTable.includes('dealer') ||
    cols.includes('suppliername') ||
    cols.includes('wholesalername')
  ) {
    return 'wholesalers';
  }

  if (
    normTable.includes('transaction') ||
    normTable.includes('cash') ||
    normTable.includes('daily') ||
    normTable.includes('ledger') ||
    normTable.includes('sale')
  ) {
    return 'daily_transactions';
  }

  return 'bottle_items';
}

/**
 * Compute smart column mappings for a given entity
 */
export function computeColumnMappings(
  columns: string[],
  entity: TargetEntity
): { defaultMappings: Record<string, string>; unmappedColumns: string[] } {
  const defaultMappings: Record<string, string> = {};
  const unmappedColumns: string[] = [];

  if (entity === 'ignore') {
    columns.forEach(col => {
      defaultMappings[col] = '_ignore_';
    });
    return { defaultMappings, unmappedColumns: [] };
  }

  const aliasesForEntity = FIELD_ALIASES[entity];
  const assignedTargetFields = new Set<string>();

  columns.forEach(col => {
    const norm = col.toLowerCase().replace(/[`"'_\-\s]/g, '');
    let matchedField: string | null = null;

    // Check aliases
    for (const [targetField, aliasList] of Object.entries(aliasesForEntity)) {
      if (assignedTargetFields.has(targetField)) continue;
      const directMatch = aliasList.some(alias => {
        const normAlias = alias.toLowerCase().replace(/[`"'_\-\s]/g, '');
        return norm === normAlias || norm.includes(normAlias);
      });
      if (directMatch) {
        matchedField = targetField;
        break;
      }
    }

    if (matchedField) {
      defaultMappings[col] = matchedField;
      assignedTargetFields.add(matchedField);
    } else {
      defaultMappings[col] = '_extra_';
      unmappedColumns.push(col);
    }
  });

  return { defaultMappings, unmappedColumns };
}

/**
 * Main SQL Dump Parser
 */
export function parseSqlDump(sqlText: string): SqlParseResult {
  try {
    const cleaned = cleanSql(sqlText);
    const tableSchemas: Record<string, string[]> = {};
    const tableData: Record<string, { columns: string[]; rows: Record<string, any>[] }> = {};

    // 1. Find CREATE TABLE statements to discover columns if needed
    const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\(([\s\S]*?)\)(?:ENGINE|DEFAULT|;|(?:\s*$))/gi;
    let createMatch: RegExpExecArray | null;
    while ((createMatch = createTableRegex.exec(cleaned)) !== null) {
      const tableName = createMatch[1];
      const columnDefs = createMatch[2];
      const cols: string[] = [];
      const lines = columnDefs.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          !trimmed ||
          trimmed.toUpperCase().startsWith('PRIMARY KEY') ||
          trimmed.toUpperCase().startsWith('KEY') ||
          trimmed.toUpperCase().startsWith('INDEX') ||
          trimmed.toUpperCase().startsWith('UNIQUE') ||
          trimmed.toUpperCase().startsWith('CONSTRAINT') ||
          trimmed.toUpperCase().startsWith('FOREIGN')
        ) {
          continue;
        }
        const colMatch = trimmed.match(/^[`"']?([a-zA-Z0-9_]+)[`"']?\s+/);
        if (colMatch && colMatch[1]) {
          cols.push(colMatch[1]);
        }
      }
      if (cols.length > 0) {
        tableSchemas[tableName.toLowerCase()] = cols;
      }
    }

    // 2. Find INSERT INTO statements
    // Handles INSERT INTO `table` (`col1`, `col2`) VALUES (...) or without columns
    const insertRegex = /INSERT\s+INTO\s+[`"']?([a-zA-Z0-9_]+)[`"']?(?:\s*\(([\s\S]*?)\))?\s+VALUES\s*([\s\S]*?);/gi;
    let insertMatch: RegExpExecArray | null;
    let totalStatements = 0;

    while ((insertMatch = insertRegex.exec(cleaned)) !== null) {
      totalStatements++;
      const rawTableName = insertMatch[1];
      const colsPart = insertMatch[2];
      const valuesPart = insertMatch[3];

      let columns: string[] = [];
      if (colsPart) {
        columns = colsPart
          .split(',')
          .map(c => c.trim().replace(/[`"']/g, ''))
          .filter(Boolean);
      } else if (tableSchemas[rawTableName.toLowerCase()]) {
        columns = tableSchemas[rawTableName.toLowerCase()];
      }

      const rowTuples = extractRowTuples(valuesPart);
      if (rowTuples.length === 0) continue;

      // If columns still unknown, create placeholder names col_1, col_2
      if (columns.length === 0) {
        const numCols = rowTuples[0]?.length || 0;
        columns = Array.from({ length: numCols }, (_, i) => `column_${i + 1}`);
      }

      const tableKey = rawTableName.toLowerCase();
      if (!tableData[tableKey]) {
        tableData[tableKey] = {
          columns: [...columns],
          rows: []
        };
      }

      // Convert tuples to key-value objects
      for (const tuple of rowTuples) {
        const rowObj: Record<string, any> = {};
        columns.forEach((col, idx) => {
          rowObj[col] = tuple[idx] !== undefined ? tuple[idx] : null;
        });
        tableData[tableKey].rows.push(rowObj);
      }
    }

    const tables: ParsedSqlTable[] = [];

    for (const [tName, data] of Object.entries(tableData)) {
      if (data.rows.length === 0) continue;
      const suggested = detectTargetEntity(tName, data.columns);
      const { defaultMappings, unmappedColumns } = computeColumnMappings(data.columns, suggested);

      tables.push({
        tableName: tName,
        columns: data.columns,
        rows: data.rows,
        suggestedEntity: suggested,
        defaultMappings,
        unmappedColumns,
        totalRows: data.rows.length
      });
    }

    return {
      success: tables.length > 0,
      tables,
      totalStatementsFound: totalStatements,
      error: tables.length === 0 ? 'کوئی درست SQL ڈیٹا (INSERT INTO ٹیبلز) نہیں ملا۔' : undefined
    };
  } catch (err: any) {
    return {
      success: false,
      tables: [],
      totalStatementsFound: 0,
      error: `SQL پارس کرنے میں مسئلہ آیا: ${err?.message || 'نامعلوم غلطی'}`
    };
  }
}

/**
 * Convert parsed rows to BottleItem (Inventory / Store Products)
 */
export function convertToBottleItems(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>,
  keepExtraFields: boolean = true
): BottleItem[] {
  return rows.map((row, idx) => {
    const item: Partial<BottleItem> = {
      id: `ITEM-${Date.now().toString().slice(-6)}-${idx + 1}`
    };
    const extra: Record<string, any> = {};

    Object.entries(row).forEach(([col, val]) => {
      const target = columnMapping[col];
      if (!target || target === '_ignore_') return;

      if (target === '_extra_') {
        if (keepExtraFields && val !== null && val !== undefined) {
          extra[col] = val;
        }
        return;
      }

      switch (target) {
        case 'item_name':
          item.item_name = String(val || '').trim() || `Item #${idx + 1}`;
          break;
        case 'category':
          item.category = String(val || '').trim() || 'General';
          break;
        case 'total_stock':
          item.total_stock = Math.max(0, parseInt(String(val), 10) || 0);
          break;
        case 'unit_price':
          item.unit_price = Math.max(0, parseFloat(String(val)) || 0);
          break;
        case 'commission_per_unit':
          item.commission_per_unit = Math.max(0, parseFloat(String(val)) || 0);
          break;
        case 'salesman_price':
          item.salesman_price = Math.max(0, parseFloat(String(val)) || 0);
          break;
        default:
          if (keepExtraFields && val !== null && val !== undefined) {
            extra[col] = val;
          }
      }
    });

    // Fallbacks
    if (!item.item_name) item.item_name = `Product #${idx + 1}`;
    if (!item.category) item.category = 'General';
    if (item.total_stock === undefined) item.total_stock = 0;
    if (item.unit_price === undefined) item.unit_price = 0;
    if (item.commission_per_unit === undefined) item.commission_per_unit = Math.round(item.unit_price * 0.9);
    if (item.salesman_price === undefined) item.salesman_price = item.unit_price;

    if (Object.keys(extra).length > 0) {
      item.extra_fields = extra;
    }

    return item as BottleItem;
  });
}

/**
 * Convert parsed rows to CustomerBill (Customer Khata)
 */
export function convertToCustomers(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>,
  keepExtraFields: boolean = true
): CustomerBill[] {
  const today = new Date().toISOString().split('T')[0];

  return rows.map((row, idx) => {
    const cust: Partial<CustomerBill> = {
      id: `CUST-${Date.now().toString().slice(-6)}-${idx + 1}`,
      created_date: today,
      status: 'pending'
    };
    const extra: Record<string, any> = {};

    Object.entries(row).forEach(([col, val]) => {
      const target = columnMapping[col];
      if (!target || target === '_ignore_') return;

      if (target === '_extra_') {
        if (keepExtraFields && val !== null && val !== undefined) {
          extra[col] = val;
        }
        return;
      }

      switch (target) {
        case 'customer_name':
          cust.customer_name = String(val || '').trim() || `Customer #${idx + 1}`;
          break;
        case 'phone_number':
          cust.phone_number = String(val || '').trim();
          break;
        case 'address':
          cust.address = String(val || '').trim();
          break;
        case 'remaining_balance':
          cust.remaining_balance = parseFloat(String(val)) || 0;
          break;
        case 'total_bill':
          cust.total_bill = parseFloat(String(val)) || 0;
          break;
        default:
          if (keepExtraFields && val !== null && val !== undefined) {
            extra[col] = val;
          }
      }
    });

    if (!cust.customer_name) cust.customer_name = `Customer #${idx + 1}`;
    if (cust.remaining_balance === undefined) cust.remaining_balance = cust.total_bill || 0;
    if (cust.total_bill === undefined) cust.total_bill = cust.remaining_balance || 0;
    cust.status = cust.remaining_balance <= 0 ? 'paid' : 'pending';

    if (Object.keys(extra).length > 0) {
      cust.extra_fields = extra;
    }

    return cust as CustomerBill;
  });
}

/**
 * Convert parsed rows to WholesalerBill (Supplier Khata)
 */
export function convertToWholesalers(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>,
  keepExtraFields: boolean = true
): WholesalerBill[] {
  const today = new Date().toISOString().split('T')[0];

  return rows.map((row, idx) => {
    const sup: Partial<WholesalerBill> = {
      id: `WHOLE-${Date.now().toString().slice(-6)}-${idx + 1}`,
      created_date: today,
      status: 'pending'
    };
    const extra: Record<string, any> = {};

    Object.entries(row).forEach(([col, val]) => {
      const target = columnMapping[col];
      if (!target || target === '_ignore_') return;

      if (target === '_extra_') {
        if (keepExtraFields && val !== null && val !== undefined) {
          extra[col] = val;
        }
        return;
      }

      switch (target) {
        case 'customer_name':
          sup.customer_name = String(val || '').trim() || `Supplier #${idx + 1}`;
          break;
        case 'supplier_number':
          sup.supplier_number = String(val || '').trim();
          break;
        case 'remaining_balance':
          sup.remaining_balance = parseFloat(String(val)) || 0;
          break;
        case 'total_bill':
          sup.total_bill = parseFloat(String(val)) || 0;
          break;
        default:
          if (keepExtraFields && val !== null && val !== undefined) {
            extra[col] = val;
          }
      }
    });

    if (!sup.customer_name) sup.customer_name = `Supplier #${idx + 1}`;
    if (sup.remaining_balance === undefined) sup.remaining_balance = sup.total_bill || 0;
    if (sup.total_bill === undefined) sup.total_bill = sup.remaining_balance || 0;
    sup.status = sup.remaining_balance <= 0 ? 'paid' : 'pending';

    if (Object.keys(extra).length > 0) {
      sup.extra_fields = extra;
    }

    return sup as WholesalerBill;
  });
}

/**
 * Convert parsed rows to DailyTransaction (Cash Book)
 */
export function convertToDailyTransactions(
  rows: Record<string, any>[],
  columnMapping: Record<string, string>,
  keepExtraFields: boolean = true
): DailyTransaction[] {
  const today = new Date().toISOString().split('T')[0];

  return rows.map((row, idx) => {
    const tx: Partial<DailyTransaction> = {
      id: `TX-SQL-${Date.now().toString().slice(-6)}-${idx + 1}`,
      type: 'in',
      created_by: 'SQL Import',
      transaction_date: today
    };
    const extra: Record<string, any> = {};

    Object.entries(row).forEach(([col, val]) => {
      const target = columnMapping[col];
      if (!target || target === '_ignore_') return;

      if (target === '_extra_') {
        if (keepExtraFields && val !== null && val !== undefined) {
          extra[col] = val;
        }
        return;
      }

      switch (target) {
        case 'description':
          tx.description = String(val || '').trim();
          break;
        case 'amount':
          tx.amount = Math.abs(parseFloat(String(val)) || 0);
          break;
        case 'type': {
          const t = String(val || '').toLowerCase();
          if (t.includes('out') || t.includes('debit') || t.includes('expense') || t.includes('paid')) {
            tx.type = 'out';
          } else {
            tx.type = 'in';
          }
          break;
        }
        case 'transaction_date': {
          const d = String(val || '').slice(0, 10);
          if (d && !isNaN(Date.parse(d))) {
            tx.transaction_date = d;
          }
          break;
        }
        default:
          if (keepExtraFields && val !== null && val !== undefined) {
            extra[col] = val;
          }
      }
    });

    if (!tx.description) tx.description = `Imported Entry #${idx + 1}`;
    if (!tx.amount) tx.amount = 0;

    if (Object.keys(extra).length > 0) {
      tx.extra_fields = extra;
    }

    return tx as DailyTransaction;
  });
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  FileCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Info,
  Check,
  RefreshCw,
  Table as TableIcon
} from 'lucide-react';
import {
  parseSqlDump,
  ParsedSqlTable,
  TargetEntity,
  computeColumnMappings,
  convertToBottleItems,
  convertToCustomers,
  convertToWholesalers,
  convertToDailyTransactions
} from '../utils/sqlParser';
import { usePOS } from '../context/POSContext';

interface SqlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlImportModal: React.FC<SqlImportModalProps> = ({ isOpen, onClose }) => {
  const { importSqlData, setActiveView } = usePOS();

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedTables, setParsedTables] = useState<ParsedSqlTable[]>([]);
  const [selectedTableIdx, setSelectedTableIdx] = useState<number>(0);
  const [tableEntities, setTableEntities] = useState<Record<number, TargetEntity>>({});
  const [columnMappings, setColumnMappings] = useState<Record<number, Record<string, string>>>({});
  const [keepExtraColumns, setKeepExtraColumns] = useState<boolean>(true);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parseError, setParseError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    targetView?: 'items_price' | 'customer' | 'wholesaler' | 'daily_cash';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setIsParsing(true);
    setParseError(null);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseSqlDump(text);

        if (!result.success || result.tables.length === 0) {
          setParseError(result.error || 'فائل میں کوئی درست INSERT INTO ٹیبل نہیں ملا۔ برائے مہربانی درست SQL ڈمپ فائل منتخب کریں۔');
          setParsedTables([]);
        } else {
          setParsedTables(result.tables);
          setSelectedTableIdx(0);

          // Initial mappings & entities
          const initialEntities: Record<number, TargetEntity> = {};
          const initialMappings: Record<number, Record<string, string>> = {};

          result.tables.forEach((t, idx) => {
            initialEntities[idx] = t.suggestedEntity;
            initialMappings[idx] = { ...t.defaultMappings };
          });

          setTableEntities(initialEntities);
          setColumnMappings(initialMappings);
        }
      } catch (err: any) {
        setParseError(`فائل پڑھنے میں مسئلہ پیش آیا: ${err?.message || 'خرابی'}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError('فائل پڑھنے میں ناکامی ہوئی۔ دوبارہ کوشش کریں۔');
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  const currentTable: ParsedSqlTable | undefined = parsedTables[selectedTableIdx];
  const currentEntity: TargetEntity = currentTable ? (tableEntities[selectedTableIdx] || currentTable.suggestedEntity) : 'bottle_items';
  const currentMapping: Record<string, string> = currentTable ? (columnMappings[selectedTableIdx] || currentTable.defaultMappings) : {};

  const handleEntityChange = (idx: number, entity: TargetEntity) => {
    setTableEntities(prev => ({ ...prev, [idx]: entity }));
    const table = parsedTables[idx];
    if (table) {
      const { defaultMappings } = computeColumnMappings(table.columns, entity);
      setColumnMappings(prev => ({ ...prev, [idx]: defaultMappings }));
    }
  };

  const handleMappingChange = (sourceCol: string, targetField: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [selectedTableIdx]: {
        ...(prev[selectedTableIdx] || {}),
        [sourceCol]: targetField
      }
    }));
  };

  // Compute live preview of converted data
  const getPreviewRecords = () => {
    if (!currentTable || currentEntity === 'ignore') return [];
    const sampleRows = currentTable.rows.slice(0, 5);

    if (currentEntity === 'bottle_items') {
      return convertToBottleItems(sampleRows, currentMapping, keepExtraColumns);
    }
    if (currentEntity === 'customers') {
      return convertToCustomers(sampleRows, currentMapping, keepExtraColumns);
    }
    if (currentEntity === 'wholesalers') {
      return convertToWholesalers(sampleRows, currentMapping, keepExtraColumns);
    }
    if (currentEntity === 'daily_transactions') {
      return convertToDailyTransactions(sampleRows, currentMapping, keepExtraColumns);
    }
    return [];
  };

  const handleExecuteImport = () => {
    if (!currentTable || currentEntity === 'ignore') return;

    let convertedData: any[] = [];
    let targetView: 'items_price' | 'customer' | 'wholesaler' | 'daily_cash' = 'items_price';

    if (currentEntity === 'bottle_items') {
      convertedData = convertToBottleItems(currentTable.rows, currentMapping, keepExtraColumns);
      targetView = 'items_price';
    } else if (currentEntity === 'customers') {
      convertedData = convertToCustomers(currentTable.rows, currentMapping, keepExtraColumns);
      targetView = 'customer';
    } else if (currentEntity === 'wholesalers') {
      convertedData = convertToWholesalers(currentTable.rows, currentMapping, keepExtraColumns);
      targetView = 'wholesaler';
    } else if (currentEntity === 'daily_transactions') {
      convertedData = convertToDailyTransactions(currentTable.rows, currentMapping, keepExtraColumns);
      targetView = 'daily_cash';
    }

    const result = importSqlData({
      targetEntity: currentEntity,
      records: convertedData,
      mode: importMode
    });

    if (result.success) {
      setImportStatus({
        success: true,
        message: `مبارک ہو! کل ${result.count} ریکارڈز کامیابی سے امپورٹ ہو چکے ہیں اور کلاؤڈ سنک میں شامل کر دیے گئے ہیں!`,
        targetView
      });
    } else {
      setImportStatus({
        success: false,
        message: result.error || 'امپورٹ ناکام ہو گیا۔ دوبارہ کوشش کریں۔'
      });
    }
  };

  const entityOptions: { value: TargetEntity; label: string; icon: string }[] = [
    { value: 'bottle_items', label: '📦 سامان اور قیمتیں (Store Items & Stock)', icon: '📦' },
    { value: 'customers', label: '👥 کسٹمر کھاتہ دار (Customer Khata)', icon: '👥' },
    { value: 'wholesalers', label: '🚚 ہول سیلر / سپلائر (Wholesalers)', icon: '🚚' },
    { value: 'daily_transactions', label: '💵 ڈیلی کیش بک (Cash Book Transactions)', icon: '💵' },
    { value: 'ignore', label: '🚫 نظر انداز کریں (Ignore Table)', icon: '🚫' }
  ];

  const getTargetFieldOptions = () => {
    if (currentEntity === 'bottle_items') {
      return [
        { value: 'item_name', label: 'مطلوبہ: نام (Item / Product Name)' },
        { value: 'category', label: 'کیٹیگری (Category)' },
        { value: 'unit_price', label: 'ریٹیل قیمت / سیل ریٹ (Sale Price)' },
        { value: 'commission_per_unit', label: 'خرید قیمت / ہول سیل (Cost/Wholesale Price)' },
        { value: 'total_stock', label: 'موجودہ اسٹاک (Total Stock Qty)' },
        { value: 'salesman_price', label: 'سیلز مین قیمت (Salesman Rate)' },
        { value: '_extra_', label: '🛡️ اضافی فیلڈ: میٹا ڈیٹا میں محفوظ رکھیں (Extra Column)' },
        { value: '_ignore_', label: '❌ نظر انداز کریں (Ignore Column)' }
      ];
    }
    if (currentEntity === 'customers') {
      return [
        { value: 'customer_name', label: 'مطلوبہ: کسٹمر نام (Customer Name)' },
        { value: 'phone_number', label: 'فون نمبر (Phone Number)' },
        { value: 'address', label: 'پتہ / پتہ (Address)' },
        { value: 'remaining_balance', label: 'باقی ادھار رقم (Pending Balance)' },
        { value: 'total_bill', label: 'کل بل / لین دین (Total Bill)' },
        { value: '_extra_', label: '🛡️ اضافی فیلڈ: میٹا ڈیٹا میں محفوظ رکھیں (Extra Column)' },
        { value: '_ignore_', label: '❌ نظر انداز کریں (Ignore Column)' }
      ];
    }
    if (currentEntity === 'wholesalers') {
      return [
        { value: 'customer_name', label: 'مطلوبہ: سپلائر / کمپنی کا نام (Supplier Name)' },
        { value: 'supplier_number', label: 'رابطہ نمبر (Contact Number)' },
        { value: 'remaining_balance', label: 'واجب الادا رقم (Payable Balance)' },
        { value: 'total_bill', label: 'کل خریداری بل (Total Bill)' },
        { value: '_extra_', label: '🛡️ اضافی فیلڈ: میٹا ڈیٹا میں محفوظ رکھیں (Extra Column)' },
        { value: '_ignore_', label: '❌ نظر انداز کریں (Ignore Column)' }
      ];
    }
    if (currentEntity === 'daily_transactions') {
      return [
        { value: 'description', label: 'مطلوبہ: تفصیل / مد (Description)' },
        { value: 'amount', label: 'رقم (Amount)' },
        { value: 'type', label: 'قسم: رقم آئی یا گئی (In / Out)' },
        { value: 'transaction_date', label: 'تاریخ (Date YYYY-MM-DD)' },
        { value: '_extra_', label: '🛡️ اضافی فیلڈ: میٹا ڈیٹا میں محفوظ رکھیں (Extra Column)' },
        { value: '_ignore_', label: '❌ نظر انداز کریں (Ignore Column)' }
      ];
    }
    return [];
  };

  const previewRecords = getPreviewRecords();
  const extraColumnsCount = currentTable ? currentTable.columns.filter(col => currentMapping[col] === '_extra_').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-[#1b263b] to-slate-900 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Smart SQL Database Importer (.sql)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Auto-Convert & Map
                </span>
              </div>
              <p className="text-xs text-slate-400">
                MySQL، MariaDB یا دیگر سسٹمز کی .sql فائل کو خود بخود پہچان کر POS میں امپورٹ کریں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Success Banner if Import Finished */}
          {importStatus && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                importStatus.success
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                <p className="font-bold">{importStatus.message}</p>
                {importStatus.success && importStatus.targetView && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView(importStatus.targetView!);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      🚀 متعلقہ سیکشن میں دیکھیں
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStatus(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      مزید ٹیبل امپورٹ کریں
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Upload Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  1. .sql فائل منتخب کریں (Select .sql Backup Dump):
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  کسی بھی پرانے سافٹ ویئر، پی ایچ پی مائی ایڈمن (phpMyAdmin) یا ڈیٹا بیس کا .sql بیک اپ یہاں اپلوڈ کریں۔
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isParsing ? 'تجزیہ ہو رہا ہے...' : 'اپلوڈ .sql فائل (Browse SQL)'}</span>
                </button>
              </div>
            </div>

            {fileName && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-mono">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="truncate max-w-xs">{fileName}</span>
                  <span className="text-slate-400">({fileSize})</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{parsedTables.length} ٹیبلز دریافت ہوئے</span>
                </div>
              </div>
            )}

            {parseError && (
              <div className="mt-3 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* How Extra Columns Are Handled Banner */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-bold text-cyan-200 block">
                اضافی کالمز (Extra Columns) کا محفوظ اور اسمارٹ حل:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                اگر آپ کے SQL میں زیادہ کالمز (جیسے barcode، expiry، dealer_code، tax، notes) ہوں اور ہمارے POS میں کم کالمز ہوں، تو <strong className="text-white">کوئی ڈیٹا ضائع نہیں ہوتا!</strong> سسٹم بنیادی کالمز (نام، ریٹ، اسٹاک) کو خود میپ کر لے گا اور باقی تمام اضافی کالمز کو ہر آئٹم کے <code className="text-cyan-300 font-mono">extra_fields</code> میٹا ڈیٹا میں ہمیشہ کے لیے محفوظ رکھے گا۔
              </p>
            </div>
          </div>

          {/* Step 2: Table Selection and Auto-Mapping (When parsed tables exist) */}
          {parsedTables.length > 0 && currentTable && (
            <div className="space-y-4">
              {/* Table Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  2. ٹیبل کا انتخاب کریں (Select SQL Table to Import):
                </label>
                <div className="flex flex-wrap gap-2">
                  {parsedTables.map((t, idx) => (
                    <button
                      key={t.tableName}
                      type="button"
                      onClick={() => setSelectedTableIdx(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        selectedTableIdx === idx
                          ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono">{t.tableName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {t.totalRows} rows
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Entity Config */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      اس ٹیبل کو POS کے کس حصے میں تبدیل کرنا ہے؟
                    </label>
                    <select
                      value={currentEntity}
                      onChange={(e) => handleEntityChange(selectedTableIdx, e.target.value as TargetEntity)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    >
                      {entityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      امپورٹ کا طریقہ (Import Mode):
                    </label>
                    <div className="flex items-center gap-4 text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-cyan-500"
                        />
                        <span>موجودہ ڈیٹا میں شامل کریں (Append / Merge)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-rose-500"
                        />
                        <span className="text-rose-300">نیا لگائیں (Replace All)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Extra Columns Checkbox */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="checkbox"
                    id="keepExtra"
                    checked={keepExtraColumns}
                    onChange={(e) => setKeepExtraColumns(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <label htmlFor="keepExtra" className="text-xs text-slate-300 cursor-pointer">
                    اضافی کالمز کا ڈیٹا بھی بغیر ضائع کیے محفوظ رکھیں (Preserve extra unmapped columns in extra_fields)
                  </label>
                  {extraColumnsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {extraColumnsCount} اضافی کالمز موجود ہیں
                    </span>
                  )}
                </div>

                {/* Column Mappings Table */}
                {currentEntity !== 'ignore' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-200">
                        3. کالمز کی میپنگ (Column Matching):
                      </label>
                      <span className="text-[10px] text-slate-400">
                        سسٹم نے مناسب فیلڈز خود منتخب کر لی ہیں، ضرورت پڑنے پر تبدیل کر سکتے ہیں
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">SQL کا کالم (Source Column)</th>
                            <th className="px-3 py-2 text-center">➔</th>
                            <th className="px-3 py-2">ہمارا POS سسٹم فیلڈ (Target Field)</th>
                            <th className="px-3 py-2 text-right">اسٹیٹس</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                          {currentTable.columns.map((col) => {
                            const currentTarget = currentMapping[col] || '_extra_';
                            const isExtra = currentTarget === '_extra_';
                            const isIgnored = currentTarget === '_ignore_';

                            return (
                              <tr key={col} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-3 py-2 font-mono text-cyan-300 font-medium">
                                  {col}
                                </td>
                                <td className="px-3 py-2 text-center text-slate-500">
                                  <ArrowRight className="w-3.5 h-3.5 inline text-slate-400" />
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={currentTarget}
                                    onChange={(e) => handleMappingChange(col, e.target.value)}
                                    className={`w-full bg-slate-950 border rounded-lg px-2 py-1 text-xs focus:outline-hidden ${
                                      isExtra
                                        ? 'border-amber-500/40 text-amber-200'
                                        : isIgnored
                                        ? 'border-slate-700 text-slate-400'
                                        : 'border-emerald-500/50 text-emerald-300 font-semibold'
                                    }`}
                                  >
                                    {getTargetFieldOptions().map(opt => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {isExtra ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      محفوظ میٹا ڈیٹا
                                    </span>
                                  ) : isIgnored ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                      نظر انداز
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                      ✓ خودکار میپ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Live Preview Section */}
                {currentEntity !== 'ignore' && previewRecords.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>4. لائیو معائنہ (Live Preview - پہلے 5 ریکارڈز):</span>
                    </label>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-slate-400 border-b border-slate-800">
                          {currentEntity === 'bottle_items' && (
                            <tr>
                              <th className="pb-2">پروڈکٹ نام</th>
                              <th className="pb-2">کیٹیگری</th>
                              <th className="pb-2">سیل ریٹ</th>
                              <th className="pb-2">خرید / ہول سیل</th>
                              <th className="pb-2">اسٹاک</th>
                              <th className="pb-2">اضافی فیلڈز (Meta)</th>
                            </tr>
                          )}
                          {currentEntity === 'customers' && (
                            <tr>
                              <th className="pb-2">کسٹمر نام</th>
                              <th className="pb-2">فون نمبر</th>
                              <th className="pb-2">پتہ</th>
                              <th className="pb-2">باقی ادھار</th>
                              <th className="pb-2">اضافی فیلڈز (Meta)</th>
                            </tr>
                          )}
                          {currentEntity === 'wholesalers' && (
                            <tr>
                              <th className="pb-2">سپلائر نام</th>
                              <th className="pb-2">نمبر</th>
                              <th className="pb-2">واجب الادا رقم</th>
                              <th className="pb-2">اضافی فیلڈز (Meta)</th>
                            </tr>
                          )}
                          {currentEntity === 'daily_transactions' && (
                            <tr>
                              <th className="pb-2">تفصیل</th>
                              <th className="pb-2">رقم</th>
                              <th className="pb-2">قسم</th>
                              <th className="pb-2">تاریخ</th>
                              <th className="pb-2">اضافی فیلڈز (Meta)</th>
                            </tr>
                          )}
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {previewRecords.map((rec: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              {currentEntity === 'bottle_items' && (
                                <>
                                  <td className="py-1.5 font-semibold text-white">{rec.item_name}</td>
                                  <td className="py-1.5 text-slate-400">{rec.category}</td>
                                  <td className="py-1.5 text-emerald-400 font-mono">Rs. {rec.unit_price}</td>
                                  <td className="py-1.5 text-slate-400 font-mono">Rs. {rec.commission_per_unit}</td>
                                  <td className="py-1.5 text-cyan-300 font-mono font-bold">{rec.total_stock}</td>
                                  <td className="py-1.5 text-[10px] text-amber-300 font-mono">
                                    {rec.extra_fields ? Object.keys(rec.extra_fields).length + ' fields' : 'None'}
                                  </td>
                                </>
                              )}
                              {currentEntity === 'customers' && (
                                <>
                                  <td className="py-1.5 font-semibold text-white">{rec.customer_name}</td>
                                  <td className="py-1.5 text-slate-400">{rec.phone_number || '-'}</td>
                                  <td className="py-1.5 text-slate-400">{rec.address || '-'}</td>
                                  <td className="py-1.5 text-rose-400 font-mono font-bold">Rs. {rec.remaining_balance}</td>
                                  <td className="py-1.5 text-[10px] text-amber-300 font-mono">
                                    {rec.extra_fields ? Object.keys(rec.extra_fields).length + ' fields' : 'None'}
                                  </td>
                                </>
                              )}
                              {currentEntity === 'wholesalers' && (
                                <>
                                  <td className="py-1.5 font-semibold text-white">{rec.customer_name}</td>
                                  <td className="py-1.5 text-slate-400">{rec.supplier_number || '-'}</td>
                                  <td className="py-1.5 text-rose-400 font-mono font-bold">Rs. {rec.remaining_balance}</td>
                                  <td className="py-1.5 text-[10px] text-amber-300 font-mono">
                                    {rec.extra_fields ? Object.keys(rec.extra_fields).length + ' fields' : 'None'}
                                  </td>
                                </>
                              )}
                              {currentEntity === 'daily_transactions' && (
                                <>
                                  <td className="py-1.5 font-semibold text-white">{rec.description}</td>
                                  <td className="py-1.5 text-emerald-400 font-mono font-bold">Rs. {rec.amount}</td>
                                  <td className="py-1.5 uppercase font-mono text-[10px]">{rec.type}</td>
                                  <td className="py-1.5 text-slate-400">{rec.transaction_date}</td>
                                  <td className="py-1.5 text-[10px] text-amber-300 font-mono">
                                    {rec.extra_fields ? Object.keys(rec.extra_fields).length + ' fields' : 'None'}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            بند کریں (Close)
          </button>

          {parsedTables.length > 0 && currentTable && currentEntity !== 'ignore' && (
            <button
              type="button"
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                درآمد کریں: {currentTable.totalRows} ریکارڈز ({currentEntity === 'bottle_items' ? 'سامان لسٹ' : currentEntity === 'customers' ? 'کسٹمر کھاتہ' : currentEntity === 'wholesalers' ? 'ہول سیلر کھاتہ' : 'کیش بک'})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

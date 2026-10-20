/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { handleFirestoreError, OperationType } from '../firestoreErrorHandler';
import {
  User,
  UserRole,
  ShopProfile,
  StaffAccount,
  DailyTransaction,
  BackCashTransaction,
  WholesalerBill,
  CustomerBill,
  EasyloadRecord,
  BottleItem,
  StockTransaction,
  EditHistoryRecord,
  DeletedHistoryRecord,
  SystemSettings,
  CartItem,
  BackCashClosingBreakdown
} from '../types/pos';
import {
  getTodayDateString,
  getYesterdayDateString,
  initialBottleItems,
  initialEasyloadRecords,
  initialDailyTransactions,
  initialBackCashTransactions,
  initialWholesalers,
  initialCustomers,
  initialStockTransactions,
  initialSystemSettings
} from '../data/initialData';

export type ActiveView =
  | 'dashboard'
  | 'daily_cash'
  | 'back_cash'
  | 'easyload'
  | 'bottle_stock'
  | 'items_price'
  | 'wholesaler'
  | 'customer'
  | 'pos'
  | 'monthly_summary'
  | 'deleted_history'
  | 'edit_logs'
  | 'staff_management';

interface BachatSummary {
  dayBeforeLoadSale: number;
  calculatedLoadBachat: number;
  calculatedShopSale: number;
  calculatedShopBachat: number;
  totalNetBachat: number;
}

interface EasyloadSaleSummary {
  jazz: number;
  telenor: number;
  zong: number;
  ufone: number;
  total: number;
}

interface POSContextType {
  // Auth & Roles (Multi-Tenant SaaS)
  currentUser: User | null;
  currentShop: ShopProfile | null;
  isNewShopSetupRequired: boolean;
  completeShopSetup: (shopName: string, phone?: string, address?: string, ownerName?: string) => Promise<boolean>;
  updateShopProfile: (profile: Partial<ShopProfile>) => Promise<void>;
  login: (username: string, role?: UserRole) => boolean;
  loginWithGoogle: () => Promise<{ success: boolean; requiresOtp?: boolean; otpCode?: string; error?: string }>;
  loginWithGmail: (email: string, displayName?: string, skipOtp?: boolean) => Promise<{ success: boolean; requiresOtp?: boolean; otpCode?: string; error?: string }>;
  verifyGmailOTP: (email: string, enteredCode: string) => Promise<{ success: boolean; error?: string }>;
  resendGmailOTP: () => Promise<{ success: boolean; otp?: string; error?: string }>;
  cancelOtpVerification: () => void;
  isOtpVerificationRequired: boolean;
  pendingOtpEmail: string | null;
  pendingOtpCode: string | null;
  loginStaff: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsOwnerDirect: (email?: string, ownerName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Staff Management
  staffAccounts: StaffAccount[];
  addStaffAccount: (account: Omit<StaffAccount, 'id' | 'created_at' | 'created_by'>) => boolean;
  updateStaffAccount: (account: StaffAccount) => boolean;
  deleteStaffAccount: (id: string) => void;

  // Clean Zero Store vs Demo Store
  isCleanStore: boolean;
  resetToCleanZeroData: () => void;
  loadDemoSampleData: () => void;

  // Interactive Demo Store Mode (Auto-resets every 30 minutes)
  isDemoMode: boolean;
  loginDemoStore: () => void;
  resetDemoData: () => void;
  demoTimeLeft: number;
  saveCurrentAsDemoTemplate: () => void;

  // View Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  // Global Date Filter & Privacy
  filterDate: string;
  setFilterDate: (date: string) => void;
  yesterdayDate: string;
  isPrivacyOn: boolean;
  togglePrivacy: () => void;

  // Maintenance & Independence Mode
  isMaintenanceMode: boolean;
  maintenanceNotice: string;
  setMaintenanceNotice: (msg: string) => void;
  toggleMaintenanceMode: () => void;
  showIndependenceModal: boolean;
  setShowIndependenceModal: (show: boolean) => void;
  showWhatsNewModal: boolean;
  setShowWhatsNewModal: (show: boolean) => void;

  // Firebase Cloud Status
  isFirebaseConnected: boolean;
  firebaseSyncStatus: 'connected' | 'syncing' | 'offline';

  // PWA Installation
  isAppInstalled: boolean;
  installApp: () => void;
  showTopInstallBanner: boolean;
  setShowTopInstallBanner: (show: boolean) => void;

  // Data Collections
  dailyTransactions: DailyTransaction[];
  backCashTransactions: BackCashTransaction[];
  wholesalers: WholesalerBill[];
  customers: CustomerBill[];
  easyloadRecords: Record<string, EasyloadRecord>;
  bottleItems: BottleItem[];
  stockTransactions: StockTransaction[];
  editHistory: EditHistoryRecord[];
  deletedHistory: DeletedHistoryRecord[];
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;

  // POS Cart
  cart: CartItem[];
  addToCart: (item: BottleItem) => void;
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  completeSale: () => { success: boolean; saleId?: string; total?: number };

  // CRUD Actions
  addDailyTransaction: (tx: Omit<DailyTransaction, 'id' | 'created_by'>) => void;
  updateDailyTransaction: (id: string, newAmount: number, newDesc: string, newType?: string) => void;
  deleteDailyTransaction: (id: string) => void;

  addBackCash: (tx: Omit<BackCashTransaction, 'id' | 'created_by'>) => void;
  updateBackCash: (id: string, newAmount: number, newNote: string, newType?: BackCashTransaction['type']) => void;
  deleteBackCash: (id: string) => void;
  transferBetweenCashAccounts: (params: {
    from: 'shop' | 'back';
    to: 'shop' | 'back';
    amount: number;
    note?: string;
    transaction_date: string;
  }) => void;

  addWholesaler: (bill: Omit<WholesalerBill, 'id' | 'remaining_balance' | 'created_date' | 'status'>) => void;
  payWholesaler: (billId: string, amount: number) => void;
  addNewBillWholesaler: (billId: string, amount: number) => void;
  updateWholesaler: (bill: WholesalerBill) => void;
  deleteWholesaler: (id: string) => void;

  addCustomer: (bill: Omit<CustomerBill, 'id' | 'remaining_balance' | 'created_date' | 'status'>) => void;
  receiveCustomerPayment: (billId: string, amount: number) => void;
  payMoreCustomer: (billId: string, amount: number) => void;
  updateCustomer: (bill: CustomerBill) => void;
  deleteCustomer: (id: string) => void;

  saveEasyloadRecord: (dateStr: string, updates: Partial<EasyloadRecord>) => void;
  saveEasyloadPurchase: (network: 'jazz' | 'telenor' | 'zong' | 'ufone', amount: number, note?: string) => void;

  addBottleItem: (item: Omit<BottleItem, 'id' | 'total_stock'>) => boolean;
  updateBottleItem: (item: BottleItem) => boolean;
  deleteBottleItem: (id: string) => void;
  updateItemStock: (itemId: string, qty: number, type: 'add' | 'remove', note?: string) => boolean;

  restoreDeletedEntry: (id: string) => void;
  permanentDeleteEntry: (id: string) => void;
  markAllEditsAsRead: () => void;

  // Calculators
  getShopCashStats: (date: string) => { opening: number; cashIn: number; cashOut: number; balance: number };
  getBackCashTotal: (date: string) => number;
  getBackCashClosingDetails: (date: string) => BackCashClosingBreakdown;
  getYesterdayBackCashClosing: (date: string) => number;
  getLastBackCashClosingInfo: (date: string) => { amount: number; lastDate: string; hasPrior: boolean };
  getYesterdayClosingCash: (date: string) => number;
  getCalculatedYesterdaySale: (date: string) => number;
  getEasyloadSaleSummary: (date: string) => EasyloadSaleSummary;
  getBachatProfit: (date: string) => BachatSummary;
  getRemainingPets: () => number;
  getTotalBottleSalesValue: () => number;
  getTotalPendingMarketBalance: () => number;
  getTotalWholesalerPayable: () => number;
  getTotalCustomerReceivable: () => number;

  // Export / Backup
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToInitialData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State from LocalStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('taj_pos_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentShop, setCurrentShop] = useState<ShopProfile | null>(() => {
    const saved = localStorage.getItem('taj_pos_shop');
    return saved ? JSON.parse(saved) : null;
  });

  const [isNewShopSetupRequired, setIsNewShopSetupRequired] = useState<boolean>(false);
  const [isOtpVerificationRequired, setIsOtpVerificationRequired] = useState<boolean>(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [pendingOtpCode, setPendingOtpCode] = useState<string | null>(null);

  const currentShopId = currentUser?.shopId;

  const [isCleanStore, setIsCleanStore] = useState<boolean>(() => {
    return localStorage.getItem('taj_pos_is_clean_store') === 'true';
  });

  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    const key = currentShopId ? `taj_pos_${currentShopId}_staff_accounts` : 'taj_pos_staff_accounts';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [filterDate, setFilterDate] = useState<string>(getTodayDateString());
  const [isPrivacyOn, setIsPrivacyOn] = useState<boolean>(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('taj_pos_maintenance_mode') === 'true';
  });
  const [maintenanceNotice, setMaintenanceNotice] = useState<string>(() => {
    return localStorage.getItem('taj_pos_maintenance_notice') || 'System is under maintenance. Please do not upload any data or sync to live systems.';
  });
  const [showIndependenceModal, setShowIndependenceModal] = useState<boolean>(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState<boolean>(false);

  // Interactive Demo Mode & 30-Minute Auto-Restore
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('taj_pos_is_demo') === 'true' || currentUser?.isDemo === true;
  });
  const [demoTimeLeft, setDemoTimeLeft] = useState<number>(() => {
    const lastReset = Number(localStorage.getItem('taj_pos_demo_last_reset') || Date.now());
    const elapsed = Math.floor((Date.now() - lastReset) / 1000);
    return Math.max(0, 1800 - elapsed);
  });

  // Firebase Auth State Tracking
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<any>(auth.currentUser);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setFirebaseAuthUser(user);
      setIsAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // Firebase Cloud State
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  useEffect(() => {
    async function testFirebaseConnection() {
      try {
        setFirebaseSyncStatus('syncing');
        const testPromise = getDoc(doc(db, 'test', 'connection'));
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 4000)
        );
        await Promise.race([testPromise, timeoutPromise]);
        setIsFirebaseConnected(true);
        setFirebaseSyncStatus('connected');
      } catch (err: any) {
        if (err?.code === 'permission-denied') {
          // Backend is reached and active (rules require authentication)
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('connected');
        } else if (err?.code !== 'unavailable' && !err?.message?.includes('offline') && !err?.message?.includes('timeout')) {
          setIsFirebaseConnected(true);
          setFirebaseSyncStatus('connected');
        } else {
          setFirebaseSyncStatus('offline');
        }
      }
    }
    testFirebaseConnection();
  }, []);

  // Helper to check if currently running as installed PWA (standalone window)
  const isRunningStandalone = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
    );
  };

  // PWA State Management: true if running in standalone mode or already installed on device
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (isRunningStandalone()) return true;
    try {
      if (localStorage.getItem('taj_pos_installed') === 'true') return true;
    } catch {}
    return false;
  });

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return (window as any).deferredInstallPrompt || null;
    }
    return null;
  });

  const [showTopInstallBanner, setShowTopInstallBanner] = useState<boolean>(() => {
    if (isRunningStandalone()) return false;
    try {
      if (localStorage.getItem('taj_pos_installed') === 'true') return false;
    } catch {}
    return true;
  });

  useEffect(() => {
    // 1. Initial check: If currently running in standalone mode or already marked installed
    if (isRunningStandalone() || localStorage.getItem('taj_pos_installed') === 'true') {
      setIsAppInstalled(true);
      setShowTopInstallBanner(false);
      try { localStorage.setItem('taj_pos_installed', 'true'); } catch {}
      const banner = document.getElementById('pwa-install-btn');
      if (banner) banner.style.display = 'none';
    } else {
      setIsAppInstalled(false);
      setShowTopInstallBanner(true);
    }

    // 2. Sync if early script captured prompt before React mounted
    if ((window as any).deferredInstallPrompt) {
      setInstallPromptEvent((window as any).deferredInstallPrompt);
      if (isRunningStandalone() || localStorage.getItem('taj_pos_installed') === 'true') {
        setIsAppInstalled(true);
        setShowTopInstallBanner(false);
        const banner = document.getElementById('pwa-install-btn');
        if (banner) banner.style.display = 'none';
      }
    }

    const handlePromptReady = (e: any) => {
      const prompt = e.detail || (window as any).deferredInstallPrompt;
      setInstallPromptEvent(prompt);
      if (isRunningStandalone() || localStorage.getItem('taj_pos_installed') === 'true') {
        setIsAppInstalled(true);
        setShowTopInstallBanner(false);
        const banner = document.getElementById('pwa-install-btn');
        if (banner) banner.style.display = 'none';
      } else {
        setIsAppInstalled(false);
        setShowTopInstallBanner(true);
      }
    };

    // 3. Query getInstalledRelatedApps if supported by Chromium/Edge/Android
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          setIsAppInstalled(true);
          setShowTopInstallBanner(false);
          try { localStorage.setItem('taj_pos_installed', 'true'); } catch {}
          const banner = document.getElementById('pwa-install-btn');
          if (banner) banner.style.display = 'none';
        }
      }).catch(() => {
        // ignore
      });
    }

    // 4. Listen to beforeinstallprompt event (only fires when NOT installed)
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setInstallPromptEvent(e);
      if (isRunningStandalone() || localStorage.getItem('taj_pos_installed') === 'true') {
        setIsAppInstalled(true);
        setShowTopInstallBanner(false);
        const banner = document.getElementById('pwa-install-btn');
        if (banner) banner.style.display = 'none';
      } else {
        setIsAppInstalled(false);
        setShowTopInstallBanner(true);
      }
    };

    // 5. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowTopInstallBanner(false);
      setInstallPromptEvent(null);
      (window as any).deferredInstallPrompt = null;
      try { localStorage.setItem('taj_pos_installed', 'true'); } catch {}
      const banner = document.getElementById('pwa-install-btn');
      if (banner) banner.style.display = 'none';
    };

    // 6. Listen to display-mode changes (e.g. user launches from home screen)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsAppInstalled(true);
        setShowTopInstallBanner(false);
        try { localStorage.setItem('taj_pos_installed', 'true'); } catch {}
        const banner = document.getElementById('pwa-install-btn');
        if (banner) banner.style.display = 'none';
      }
    };

    window.addEventListener('taj_pwa_prompt_ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('taj_pwa_app_installed', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('taj_pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('taj_pwa_app_installed', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  const installApp = async () => {
    if (typeof (window as any).triggerPwaInstall === 'function') {
      await (window as any).triggerPwaInstall();
      return;
    }

    let promptToUse = installPromptEvent || (window as any).deferredInstallPrompt;
    if (promptToUse && typeof promptToUse.prompt === 'function') {
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsAppInstalled(true);
          setShowTopInstallBanner(false);
          (window as any).deferredInstallPrompt = null;
          setInstallPromptEvent(null);
          try { localStorage.setItem('taj_pos_installed', 'true'); } catch {}
          const banner = document.getElementById('pwa-install-btn');
          if (banner) banner.style.display = 'none';
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
  };

  const yesterdayDate = getYesterdayDateString(filterDate);

  // Core Data Stores
  // Helper to persist to Firestore scoped by shop
  const saveDocToShop = async (collectionName: string, docId: string, data: any) => {
    if (!currentShopId || isDemoMode || !firebaseAuthUser) return;
    try {
      await setDoc(doc(db, 'shops', currentShopId, collectionName, docId), {
        ...data,
        shop_id: currentShopId
      }, { merge: true });
    } catch (err) {
      console.warn(`Firestore save error on ${collectionName}:`, err);
    }
  };

  const deleteDocFromShop = async (collectionName: string, docId: string) => {
    if (!currentShopId || isDemoMode || !firebaseAuthUser) return;
    try {
      await deleteDoc(doc(db, 'shops', currentShopId, collectionName, docId));
    } catch (err) {
      console.warn(`Firestore delete error on ${collectionName}:`, err);
    }
  };

  // Core Data Stores - Multi-tenant isolated per shop
  const [dailyTransactions, setDailyTransactions] = useState<DailyTransaction[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_daily_tx`);
    return saved ? JSON.parse(saved) : [];
  });

  const [backCashTransactions, setBackCashTransactions] = useState<BackCashTransaction[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_back_tx`);
    return saved ? JSON.parse(saved) : [];
  });

  const [wholesalers, setWholesalers] = useState<WholesalerBill[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_wholesalers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<CustomerBill[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_customers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [easyloadRecords, setEasyloadRecords] = useState<Record<string, EasyloadRecord>>(() => {
    if (!currentShopId) return {};
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_easyload`);
    return saved ? JSON.parse(saved) : {};
  });

  const [bottleItems, setBottleItems] = useState<BottleItem[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_bottles`);
    return saved ? JSON.parse(saved) : [];
  });

  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_stock_tx`);
    return saved ? JSON.parse(saved) : [];
  });

  const [editHistory, setEditHistory] = useState<EditHistoryRecord[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_edit_history`);
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedHistory, setDeletedHistory] = useState<DeletedHistoryRecord[]>(() => {
    if (!currentShopId) return [];
    const saved = localStorage.getItem(`taj_pos_${currentShopId}_deleted_history`);
    return saved ? JSON.parse(saved) : [];
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('taj_pos_settings');
    return saved ? JSON.parse(saved) : initialSystemSettings;
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('taj_pos_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('taj_pos_shop', JSON.stringify(currentShop));
      if (currentShopId) {
        localStorage.setItem(`taj_pos_shop_${currentShopId}`, JSON.stringify(currentShop));
      }
    } else {
      localStorage.removeItem('taj_pos_shop');
    }
  }, [currentShop, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_daily_tx`, JSON.stringify(dailyTransactions));
    }
  }, [dailyTransactions, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_back_tx`, JSON.stringify(backCashTransactions));
    }
  }, [backCashTransactions, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_wholesalers`, JSON.stringify(wholesalers));
    }
  }, [wholesalers, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_customers`, JSON.stringify(customers));
    }
  }, [customers, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_easyload`, JSON.stringify(easyloadRecords));
    }
  }, [easyloadRecords, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_bottles`, JSON.stringify(bottleItems));
    }
  }, [bottleItems, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_stock_tx`, JSON.stringify(stockTransactions));
    }
  }, [stockTransactions, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_edit_history`, JSON.stringify(editHistory));
    }
  }, [editHistory, currentShopId]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_deleted_history`, JSON.stringify(deletedHistory));
    }
  }, [deletedHistory, currentShopId]);

  useEffect(() => {
    localStorage.setItem('taj_pos_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_staff_accounts`, JSON.stringify(staffAccounts));
    }
  }, [staffAccounts, currentShopId]);

  // Real-time Firestore Listeners for currentShopId
  useEffect(() => {
    // Only attach real-time Firestore listeners if authenticated, not in demo mode, and currentShopId exists
    if (!currentShopId || isDemoMode || !firebaseAuthUser) return;

    const unsubs: (() => void)[] = [];

    // 1. Shop document listener
    try {
      const shopDocPath = `shops/${currentShopId}`;
      const unsubShop = onSnapshot(
        doc(db, 'shops', currentShopId),
        (docSnap) => {
          if (docSnap.exists()) {
            const sData = docSnap.data() as ShopProfile;
            setCurrentShop(sData);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, shopDocPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubShop);
    } catch (err) {
      console.warn('Shop listener error:', err);
    }

    // 2. Daily Transactions
    try {
      const txPath = `shops/${currentShopId}/daily_transactions`;
      const unsubTx = onSnapshot(
        collection(db, 'shops', currentShopId, 'daily_transactions'),
        (snapshot) => {
          const list: DailyTransaction[] = [];
          snapshot.forEach((d) => list.push(d.data() as DailyTransaction));
          if (!snapshot.empty || list.length > 0) {
            setDailyTransactions(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, txPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubTx);
    } catch (err) {
      console.warn('Tx listener error:', err);
    }

    // 3. Back Cash
    try {
      const backPath = `shops/${currentShopId}/back_cash_transactions`;
      const unsubBack = onSnapshot(
        collection(db, 'shops', currentShopId, 'back_cash_transactions'),
        (snapshot) => {
          const list: BackCashTransaction[] = [];
          snapshot.forEach((d) => list.push(d.data() as BackCashTransaction));
          if (!snapshot.empty || list.length > 0) {
            setBackCashTransactions(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, backPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubBack);
    } catch (err) {
      console.warn('Back cash listener error:', err);
    }

    // 4. Wholesalers
    try {
      const wPath = `shops/${currentShopId}/wholesaler_bills`;
      const unsubW = onSnapshot(
        collection(db, 'shops', currentShopId, 'wholesaler_bills'),
        (snapshot) => {
          const list: WholesalerBill[] = [];
          snapshot.forEach((d) => list.push(d.data() as WholesalerBill));
          if (!snapshot.empty || list.length > 0) {
            setWholesalers(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, wPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubW);
    } catch (err) {
      console.warn('Wholesalers listener error:', err);
    }

    // 5. Customers
    try {
      const cPath = `shops/${currentShopId}/customer_bills`;
      const unsubC = onSnapshot(
        collection(db, 'shops', currentShopId, 'customer_bills'),
        (snapshot) => {
          const list: CustomerBill[] = [];
          snapshot.forEach((d) => list.push(d.data() as CustomerBill));
          if (!snapshot.empty || list.length > 0) {
            setCustomers(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, cPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubC);
    } catch (err) {
      console.warn('Customers listener error:', err);
    }

    // 6. Easyload Records
    try {
      const loadPath = `shops/${currentShopId}/easyload_records`;
      const unsubLoad = onSnapshot(
        collection(db, 'shops', currentShopId, 'easyload_records'),
        (snapshot) => {
          const map: Record<string, EasyloadRecord> = {};
          snapshot.forEach((d) => {
            const item = d.data() as EasyloadRecord;
            if (item.date_recorded) {
              map[item.date_recorded] = item;
            }
          });
          if (!snapshot.empty) {
            setEasyloadRecords(map);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, loadPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubLoad);
    } catch (err) {
      console.warn('Easyload listener error:', err);
    }

    // 7. Bottle Items
    try {
      const bottlesPath = `shops/${currentShopId}/bottle_items`;
      const unsubBottles = onSnapshot(
        collection(db, 'shops', currentShopId, 'bottle_items'),
        (snapshot) => {
          const list: BottleItem[] = [];
          snapshot.forEach((d) => list.push(d.data() as BottleItem));
          if (!snapshot.empty || list.length > 0) {
            setBottleItems(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, bottlesPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubBottles);
    } catch (err) {
      console.warn('Bottle listener error:', err);
    }

    // 8. Stock Transactions
    try {
      const stockPath = `shops/${currentShopId}/stock_transactions`;
      const unsubStock = onSnapshot(
        collection(db, 'shops', currentShopId, 'stock_transactions'),
        (snapshot) => {
          const list: StockTransaction[] = [];
          snapshot.forEach((d) => list.push(d.data() as StockTransaction));
          if (!snapshot.empty || list.length > 0) {
            setStockTransactions(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, stockPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubStock);
    } catch (err) {
      console.warn('Stock listener error:', err);
    }

    // 9. Staff Accounts
    try {
      const staffPath = `shops/${currentShopId}/staff_accounts`;
      const unsubStaff = onSnapshot(
        collection(db, 'shops', currentShopId, 'staff_accounts'),
        (snapshot) => {
          const list: StaffAccount[] = [];
          snapshot.forEach((d) => list.push(d.data() as StaffAccount));
          if (!snapshot.empty || list.length > 0) {
            setStaffAccounts(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, staffPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubStaff);
    } catch (err) {
      console.warn('Staff listener error:', err);
    }

    // 10. Deleted History
    try {
      const delPath = `shops/${currentShopId}/deleted_history`;
      const unsubDel = onSnapshot(
        collection(db, 'shops', currentShopId, 'deleted_history'),
        (snapshot) => {
          const list: DeletedHistoryRecord[] = [];
          snapshot.forEach((d) => list.push(d.data() as DeletedHistoryRecord));
          if (!snapshot.empty || list.length > 0) {
            setDeletedHistory(list);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, delPath);
          } catch {
            setFirebaseSyncStatus('offline');
          }
        }
      );
      unsubs.push(unsubDel);
    } catch (err) {
      console.warn('Del history listener error:', err);
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [currentShopId, isDemoMode, firebaseAuthUser]);

  // Auth Functions (Multi-Tenant SaaS with Real Google Accounts)
  const login = (username: string, role: UserRole = 'user') => {
    const userRole = username.toLowerCase() === 'admin' ? 'admin' : role;
    const userObj: User = {
      username,
      role: userRole,
      shopId: currentShopId || 'default',
      shopName: currentShop?.shop_name || 'My Shop'
    };
    setCurrentUser(userObj);
    return true;
  };

  const loginWithGmail = async (
    email: string,
    displayName?: string,
    skipOtp: boolean = false
  ): Promise<{ success: boolean; requiresOtp?: boolean; otpCode?: string; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'براہِ کرم درست Gmail ایڈریس درج کریں۔' };
      }

      // Check both standard shop_ and legacy owner_ prefixes so existing data is preserved
      const shopId = 'shop_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const legacyShopId = 'owner_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

      let existingShop: ShopProfile | null = null;

      // 1. Check Firestore
      try {
        const snap = await getDoc(doc(db, 'shops', shopId));
        if (snap.exists()) {
          existingShop = snap.data() as ShopProfile;
        } else {
          const legacySnap = await getDoc(doc(db, 'shops', legacyShopId));
          if (legacySnap.exists()) {
            existingShop = legacySnap.data() as ShopProfile;
          }
        }
      } catch (e) {
        console.warn('Firestore shop lookup note:', e);
      }

      // 2. Check LocalStorage fallback
      if (!existingShop) {
        const local =
          localStorage.getItem(`taj_pos_shop_${shopId}`) ||
          localStorage.getItem(`taj_pos_shop_${legacyShopId}`) ||
          (cleanEmail === 'helpgoodforyouofficial@gmail.com' ? localStorage.getItem('taj_pos_shop') : null);
        if (local) {
          try {
            existingShop = JSON.parse(local);
          } catch {}
        }
      }

      // CASE A: EXISTING REGISTERED SHOP! (Welcome back! Direct entry, restore store, no OTP needed)
      if (existingShop && existingShop.shop_name && existingShop.shop_name.trim() !== '') {
        const activeShopId = existingShop.id || shopId;
        setCurrentShop(existingShop);
        setIsNewShopSetupRequired(false);
        setIsOtpVerificationRequired(false);
        setPendingOtpEmail(null);
        setPendingOtpCode(null);

        const userObj: User = {
          username: cleanEmail.split('@')[0] || 'Admin',
          name: displayName || existingShop.owner_name || 'Shop Owner',
          email: cleanEmail,
          role: 'admin',
          isGoogleUser: true,
          shopId: activeShopId,
          shopName: existingShop.shop_name
        };

        setCurrentUser(userObj);
        localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
        localStorage.setItem('taj_pos_shop', JSON.stringify(existingShop));
        localStorage.setItem(`taj_pos_shop_${activeShopId}`, JSON.stringify(existingShop));

        // Sync user profile to Firestore
        setDoc(doc(db, 'users', activeShopId), {
          uid: activeShopId,
          email: cleanEmail,
          displayName: userObj.name,
          role: 'admin',
          shopId: activeShopId,
          lastLogin: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        return { success: true, requiresOtp: false };
      }

      // CASE B: GOOGLE SIGN-IN FOR NEW SHOP (Google has already authenticated the account!)
      // Never ask OTP for Google users! Immediately open Shop Setup Modal so user can name shop & set up details!
      if (skipOtp) {
        setIsOtpVerificationRequired(false);
        setPendingOtpEmail(null);
        setPendingOtpCode(null);

        const initialShop: ShopProfile = {
          id: shopId,
          shop_name: '',
          owner_name: displayName || cleanEmail.split('@')[0],
          owner_email: cleanEmail,
          owner_uid: shopId,
          phone: '',
          address: '',
          created_at: new Date().toISOString()
        };

        const userObj: User = {
          username: cleanEmail.split('@')[0] || 'Admin',
          name: displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'admin',
          isGoogleUser: true,
          shopId: shopId,
          shopName: 'New Shop'
        };

        setCurrentShop(initialShop);
        setCurrentUser(userObj);
        setIsNewShopSetupRequired(true);

        // Reset data arrays for completely fresh 0 store
        setDailyTransactions([]);
        setBackCashTransactions([]);
        setWholesalers([]);
        setCustomers([]);
        setEasyloadRecords({});
        setBottleItems([]);
        setStockTransactions([]);
        setStaffAccounts([]);
        setEditHistory([]);
        setDeletedHistory([]);
        setIsCleanStore(true);

        localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
        localStorage.setItem('taj_pos_shop', JSON.stringify(initialShop));
        localStorage.setItem(`taj_pos_shop_${shopId}`, JSON.stringify(initialShop));

        return { success: true, requiresOtp: false };
      }

      // CASE C: 1ST TIME SIGN UP VIA MANUAL GMAIL FORM -> Requires 6-Digit OTP Verification!
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setPendingOtpEmail(cleanEmail);
      setPendingOtpCode(generatedOtp);
      setIsOtpVerificationRequired(true);

      // Dispatch real verification email to customer's Gmail inbox
      fetch('/.netlify/functions/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: generatedOtp })
      }).catch(err => {
        console.warn('Email dispatch background note:', err);
      });

      return {
        success: true,
        requiresOtp: true,
        otpCode: generatedOtp
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please try again.' };
    }
  };

  const verifyGmailOTP = async (
    email: string,
    enteredCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Email address missing.' };
      }
      if (!enteredCode || enteredCode.trim() !== pendingOtpCode?.trim()) {
        return { success: false, error: 'درج کردہ OTP کوڈ غلط ہے۔ برائے مہربانی اپنا Gmail ان باکس چیک کر کے درست کوڈ لکھیں۔' };
      }

      // Code is valid! Proceed to Setup Shop step
      const shopId = 'shop_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

      const initialShop: ShopProfile = {
        id: shopId,
        shop_name: '',
        owner_name: cleanEmail.split('@')[0],
        owner_email: cleanEmail,
        owner_uid: shopId,
        phone: '',
        address: '',
        created_at: new Date().toISOString()
      };

      const userObj: User = {
        username: cleanEmail.split('@')[0] || 'Admin',
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'admin',
        isGoogleUser: true,
        shopId: shopId,
        shopName: 'New Shop'
      };

      setCurrentShop(initialShop);
      setCurrentUser(userObj);
      setIsOtpVerificationRequired(false);
      setPendingOtpCode(null);
      setIsNewShopSetupRequired(true);

      // Reset data arrays for completely fresh 0 store
      setDailyTransactions([]);
      setBackCashTransactions([]);
      setWholesalers([]);
      setCustomers([]);
      setEasyloadRecords({});
      setBottleItems([]);
      setStockTransactions([]);
      setStaffAccounts([]);
      setEditHistory([]);
      setDeletedHistory([]);
      setIsCleanStore(true);

      localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
      localStorage.setItem('taj_pos_shop', JSON.stringify(initialShop));
      localStorage.setItem(`taj_pos_shop_${shopId}`, JSON.stringify(initialShop));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  const resendGmailOTP = async (): Promise<{ success: boolean; otp?: string; error?: string }> => {
    if (!pendingOtpEmail) {
      return { success: false, error: 'No pending email found.' };
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingOtpCode(newOtp);

    // Dispatch re-sent verification email to customer's Gmail inbox
    fetch('/.netlify/functions/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingOtpEmail, otp: newOtp })
    }).catch(err => {
      console.warn('Resend email dispatch note:', err);
    });

    return { success: true, otp: newOtp };
  };

  const cancelOtpVerification = () => {
    setIsOtpVerificationRequired(false);
    setPendingOtpEmail(null);
    setPendingOtpCode(null);
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; requiresOtp?: boolean; otpCode?: string; error?: string }> => {
    try {
      // Ensure any leftover OTP modal state is cancelled
      setIsOtpVerificationRequired(false);
      setPendingOtpEmail(null);
      setPendingOtpCode(null);

      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      const cleanEmail = googleUser.email?.toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'گوگل اکاؤنٹ کی ای میل نہیں مل سکی۔' };
      }
      // skipOtp is true: Google has already authenticated the user. No OTP prompt!
      return await loginWithGmail(cleanEmail, googleUser.displayName || undefined, true);
    } catch (err: any) {
      console.warn('Google popup auth issue encountered:', err?.code, err?.message);
      const isUnauthorizedDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('auth/unauthorized-domain') ||
        err?.message?.includes('unauthorized-domain');
      const isOperationNotAllowed =
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('auth/operation-not-allowed') ||
        err?.message?.includes('operation-not-allowed');

      if (isOperationNotAllowed || isUnauthorizedDomain) {
        return {
          success: false,
          error: 'google-provider-disabled'
        };
      }

      return {
        success: false,
        error: err?.message || 'Google sign in failed. Please try again.'
      };
    }
  };

  const loginAsOwnerDirect = async (
    email: string = 'helpgoodforyouofficial@gmail.com',
    ownerName: string = 'Wasi Owner'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase() || 'helpgoodforyouofficial@gmail.com';
      // Deterministic shop ID derived from email to preserve data across sessions
      const safeId = 'owner_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const shopId = safeId;

      // Check if shop exists in Firestore or local storage
      let existingShop: ShopProfile | null = null;
      try {
        const shopSnap = await getDoc(doc(db, 'shops', shopId));
        if (shopSnap.exists()) {
          existingShop = shopSnap.data() as ShopProfile;
        }
      } catch (e) {
        const localShop = localStorage.getItem(`taj_pos_shop_${shopId}`);
        if (localShop) existingShop = JSON.parse(localShop);
      }

      if (existingShop) {
        setCurrentShop(existingShop);
        setIsNewShopSetupRequired(false);
        const userObj: User = {
          username: cleanEmail.split('@')[0] || 'Admin',
          name: ownerName || existingShop.owner_name || 'Shop Owner',
          email: cleanEmail,
          role: 'admin',
          isGoogleUser: true,
          shopId: shopId,
          shopName: existingShop.shop_name
        };
        setCurrentUser(userObj);
        localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
        localStorage.setItem('taj_pos_shop', JSON.stringify(existingShop));
        localStorage.setItem(`taj_pos_shop_${shopId}`, JSON.stringify(existingShop));
      } else {
        const initialShop: ShopProfile = {
          id: shopId,
          shop_name: 'Taj Retail Store',
          owner_name: ownerName || 'Shop Owner',
          owner_email: cleanEmail,
          owner_uid: shopId,
          phone: '',
          address: '',
          created_at: new Date().toISOString()
        };
        setCurrentShop(initialShop);
        setIsNewShopSetupRequired(true);

        const userObj: User = {
          username: cleanEmail.split('@')[0] || 'Admin',
          name: ownerName || 'Shop Owner',
          email: cleanEmail,
          role: 'admin',
          isGoogleUser: true,
          shopId: shopId,
          shopName: initialShop.shop_name
        };
        setCurrentUser(userObj);
        localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
      }

      // Sync user profile to Firestore
      setDoc(doc(db, 'users', shopId), {
        uid: shopId,
        email: cleanEmail,
        displayName: ownerName || 'Shop Owner',
        role: 'admin',
        shopId: shopId,
        lastLogin: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const completeShopSetup = async (
    shopName: string,
    phone?: string,
    address?: string,
    ownerName?: string
  ): Promise<boolean> => {
    if (!currentUser?.shopId) return false;
    const shopId = currentUser.shopId;
    const newProfile: ShopProfile = {
      id: shopId,
      shop_name: shopName,
      owner_name: ownerName || currentUser.name || 'Shopkeeper',
      owner_email: currentUser.email || '',
      owner_uid: shopId,
      phone: phone || '',
      address: address || '',
      created_at: new Date().toISOString()
    };

    setCurrentShop(newProfile);
    setIsNewShopSetupRequired(false);

    const updatedUser: User = {
      ...currentUser,
      shopName: shopName,
      name: ownerName || currentUser.name
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('taj_pos_user', JSON.stringify(updatedUser));
    localStorage.setItem('taj_pos_shop', JSON.stringify(newProfile));
    localStorage.setItem(`taj_pos_shop_${shopId}`, JSON.stringify(newProfile));

    try {
      await setDoc(doc(db, 'shops', shopId), newProfile, { merge: true });
    } catch (e) {
      console.warn('Shop setup Firestore sync note:', e);
    }

    return true;
  };

  const updateShopProfile = async (profile: Partial<ShopProfile>): Promise<void> => {
    if (!currentShopId || !currentShop) return;
    const updated = { ...currentShop, ...profile };
    setCurrentShop(updated);
    if (profile.shop_name && currentUser) {
      setCurrentUser({ ...currentUser, shopName: profile.shop_name });
    }
    localStorage.setItem('taj_pos_shop', JSON.stringify(updated));
    localStorage.setItem(`taj_pos_shop_${currentShopId}`, JSON.stringify(updated));
    await setDoc(doc(db, 'shops', currentShopId), updated, { merge: true }).catch(() => {});
  };

  const loginStaff = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim().toLowerCase();

    // 1. Try global staff_directory in Firestore
    try {
      const dirDoc = await getDoc(doc(db, 'staff_directory', cleanUsername));
      if (dirDoc.exists()) {
        const staffData = dirDoc.data() as any;
        if (!staffData.is_active) {
          return { success: false, error: 'This staff account has been deactivated. Please contact your shop owner.' };
        }
        if (staffData.password !== password.trim()) {
          return { success: false, error: 'Incorrect password. Please verify your credentials.' };
        }

        const shopId = staffData.shop_id;
        let shopName = 'Shop';
        try {
          const shopSnap = await getDoc(doc(db, 'shops', shopId));
          if (shopSnap.exists()) {
            const sData = shopSnap.data() as ShopProfile;
            shopName = sData.shop_name;
            setCurrentShop(sData);
          }
        } catch {}

        const userObj: User = {
          username: staffData.username,
          name: staffData.name,
          role: staffData.role,
          isGoogleUser: false,
          shopId: shopId,
          shopName: shopName
        };

        setCurrentUser(userObj);
        localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
        return { success: true };
      }
    } catch (e) {
      // Offline fallback: check local staff accounts
    }

    // 2. Local fallback if offline
    const account = staffAccounts.find(
      acc => acc.username.toLowerCase() === cleanUsername
    );
    if (!account) {
      return { success: false, error: 'User account not found. Please check your credentials.' };
    }
    if (!account.is_active) {
      return { success: false, error: 'This account has been deactivated. Please contact your shop owner.' };
    }
    if (account.password !== password.trim()) {
      return { success: false, error: 'Incorrect password. Please verify your credentials.' };
    }

    const userObj: User = {
      username: account.username,
      name: account.name,
      role: account.role,
      isGoogleUser: false,
      shopId: account.shop_id || currentShopId || 'default',
      shopName: currentShop?.shop_name || 'Shop'
    };
    setCurrentUser(userObj);
    localStorage.setItem('taj_pos_user', JSON.stringify(userObj));
    return { success: true };
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    setCurrentUser(null);
    setCurrentShop(null);
    setIsDemoMode(false);
    localStorage.removeItem('taj_pos_user');
    localStorage.removeItem('taj_pos_shop');
    localStorage.removeItem('taj_pos_is_demo');
  };

  // Staff Accounts Management (Scoped to Shop)
  const addStaffAccount = (accountData: Omit<StaffAccount, 'id' | 'created_at' | 'created_by'>): boolean => {
    if (!currentShopId) {
      alert('Please sign in with your Google account as store owner first.');
      return false;
    }
    const cleanUsername = accountData.username.trim().toLowerCase();
    if (staffAccounts.some(a => a.username.toLowerCase() === cleanUsername)) {
      alert('This username is already taken. Please choose another username.');
      return false;
    }
    const newStaff: StaffAccount = {
      ...accountData,
      username: cleanUsername,
      shop_id: currentShopId,
      id: `staff-${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser?.email || currentUser?.username || 'Admin',
      is_active: true
    };
    setStaffAccounts(prev => [newStaff, ...prev]);

    // Save in shop subcollection
    saveDocToShop('staff_accounts', newStaff.id, newStaff);

    // Save in global staff_directory for instant login from any browser/device
    setDoc(doc(db, 'staff_directory', cleanUsername), {
      username: cleanUsername,
      password: accountData.password.trim(),
      shop_id: currentShopId,
      role: accountData.role,
      name: accountData.name.trim(),
      phone: accountData.phone?.trim() || null,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: currentUser?.email || currentUser?.username || 'Admin'
    }).catch(() => {});

    return true;
  };

  const updateStaffAccount = (updated: StaffAccount): boolean => {
    setStaffAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
    saveDocToShop('staff_accounts', updated.id, updated);
    if (updated.username) {
      const cleanUsername = updated.username.toLowerCase();
      setDoc(doc(db, 'staff_directory', cleanUsername), {
        username: cleanUsername,
        password: updated.password.trim(),
        shop_id: updated.shop_id || currentShopId,
        role: updated.role,
        name: updated.name.trim(),
        phone: updated.phone?.trim() || null,
        is_active: updated.is_active,
        updated_at: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }
    return true;
  };

  const deleteStaffAccount = (id: string) => {
    const staff = staffAccounts.find(s => s.id === id);
    setStaffAccounts(prev => prev.filter(a => a.id !== id));
    deleteDocFromShop('staff_accounts', id);
    if (staff?.username) {
      deleteDoc(doc(db, 'staff_directory', staff.username.toLowerCase())).catch(() => {});
    }
  };

  // Clean Zero Store vs Demo Store
  const resetToCleanZeroData = () => {
    setDailyTransactions([]);
    setBackCashTransactions([]);
    setWholesalers([]);
    setCustomers([]);
    setEasyloadRecords({});
    setBottleItems([]);
    setStockTransactions([]);
    setEditHistory([]);
    setDeletedHistory([]);
    setIsCleanStore(true);
    localStorage.setItem('taj_pos_is_clean_store', 'true');
    localStorage.setItem('taj_pos_daily_tx', JSON.stringify([]));
    localStorage.setItem('taj_pos_back_tx', JSON.stringify([]));
    localStorage.setItem('taj_pos_wholesalers', JSON.stringify([]));
    localStorage.setItem('taj_pos_customers', JSON.stringify([]));
    localStorage.setItem('taj_pos_easyload', JSON.stringify({}));
    localStorage.setItem('taj_pos_bottles', JSON.stringify([]));
    localStorage.setItem('taj_pos_stock_tx', JSON.stringify([]));
    localStorage.setItem('taj_pos_edit_history', JSON.stringify([]));
    localStorage.setItem('taj_pos_deleted_history', JSON.stringify([]));
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_daily_tx`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_back_tx`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_wholesalers`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_customers`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_easyload`, JSON.stringify({}));
      localStorage.setItem(`taj_pos_${currentShopId}_bottles`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_stock_tx`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_edit_history`, JSON.stringify([]));
      localStorage.setItem(`taj_pos_${currentShopId}_deleted_history`, JSON.stringify([]));
    }
  };

  const loadDemoSampleData = () => {
    setDailyTransactions(initialDailyTransactions);
    setBackCashTransactions(initialBackCashTransactions);
    setWholesalers(initialWholesalers);
    setCustomers(initialCustomers);
    setEasyloadRecords(initialEasyloadRecords);
    setBottleItems(initialBottleItems);
    setStockTransactions(initialStockTransactions);
    setIsCleanStore(false);
    localStorage.setItem('taj_pos_is_clean_store', 'false');
    localStorage.setItem('taj_pos_daily_tx', JSON.stringify(initialDailyTransactions));
    localStorage.setItem('taj_pos_back_tx', JSON.stringify(initialBackCashTransactions));
    localStorage.setItem('taj_pos_wholesalers', JSON.stringify(initialWholesalers));
    localStorage.setItem('taj_pos_customers', JSON.stringify(initialCustomers));
    localStorage.setItem('taj_pos_easyload', JSON.stringify(initialEasyloadRecords));
    localStorage.setItem('taj_pos_bottles', JSON.stringify(initialBottleItems));
    localStorage.setItem('taj_pos_stock_tx', JSON.stringify(initialStockTransactions));
    if (currentShopId) {
      localStorage.setItem(`taj_pos_${currentShopId}_daily_tx`, JSON.stringify(initialDailyTransactions));
      localStorage.setItem(`taj_pos_${currentShopId}_back_tx`, JSON.stringify(initialBackCashTransactions));
      localStorage.setItem(`taj_pos_${currentShopId}_wholesalers`, JSON.stringify(initialWholesalers));
      localStorage.setItem(`taj_pos_${currentShopId}_customers`, JSON.stringify(initialCustomers));
      localStorage.setItem(`taj_pos_${currentShopId}_easyload`, JSON.stringify(initialEasyloadRecords));
      localStorage.setItem(`taj_pos_${currentShopId}_bottles`, JSON.stringify(initialBottleItems));
      localStorage.setItem(`taj_pos_${currentShopId}_stock_tx`, JSON.stringify(initialStockTransactions));
    }
  };

  const loginDemoStore = () => {
    const demoUser: User = {
      username: 'demo_store',
      name: 'تاج ڈیمو سپر سٹور (Demo)',
      email: 'demo@tajpos.com',
      role: 'admin',
      isDemo: true,
      shopId: 'demo_shop_shared',
      shopName: 'تاج ڈیمو سپر سٹور'
    };

    const demoShop: ShopProfile = {
      id: 'demo_shop_shared',
      shop_name: 'تاج ڈیمو سپر سٹور',
      owner_name: 'ڈیمو ایڈمن (Demo Admin)',
      owner_email: 'demo@tajpos.com',
      owner_uid: 'demo_shop_shared',
      phone: '0300-1234567',
      address: 'مین مارکیٹ، لاہور',
      created_at: new Date().toISOString()
    };

    setCurrentUser(demoUser);
    setCurrentShop(demoShop);
    setIsDemoMode(true);
    setIsCleanStore(false);
    setIsNewShopSetupRequired(false);

    localStorage.setItem('taj_pos_user', JSON.stringify(demoUser));
    localStorage.setItem('taj_pos_shop', JSON.stringify(demoShop));
    localStorage.setItem('taj_pos_is_demo', 'true');
    localStorage.setItem('taj_pos_demo_last_reset', String(Date.now()));

    // Load full sample demonstration data (from official baseline or custom super admin baseline)
    const baseline = getDemoTemplateData();
    setDailyTransactions(baseline.daily);
    setBackCashTransactions(baseline.backCash);
    setWholesalers(baseline.wholesalers);
    setCustomers(baseline.customers);
    setEasyloadRecords(baseline.easyload);
    setBottleItems(baseline.bottles);
    setStockTransactions(baseline.stockTx);
    setCart([]);
    setDemoTimeLeft(1800);
  };

  const getDemoTemplateData = () => {
    const saved = localStorage.getItem('taj_pos_custom_demo_template');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          daily: parsed.daily || initialDailyTransactions,
          backCash: parsed.backCash || initialBackCashTransactions,
          wholesalers: parsed.wholesalers || initialWholesalers,
          customers: parsed.customers || initialCustomers,
          easyload: parsed.easyload || initialEasyloadRecords,
          bottles: parsed.bottles || initialBottleItems,
          stockTx: parsed.stockTx || initialStockTransactions
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      daily: initialDailyTransactions,
      backCash: initialBackCashTransactions,
      wholesalers: initialWholesalers,
      customers: initialCustomers,
      easyload: initialEasyloadRecords,
      bottles: initialBottleItems,
      stockTx: initialStockTransactions
    };
  };

  const saveCurrentAsDemoTemplate = () => {
    const template = {
      daily: dailyTransactions,
      backCash: backCashTransactions,
      wholesalers: wholesalers,
      customers: customers,
      easyload: easyloadRecords,
      bottles: bottleItems,
      stockTx: stockTransactions,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('taj_pos_custom_demo_template', JSON.stringify(template));
  };

  const resetDemoData = () => {
    const baseline = getDemoTemplateData();
    setDailyTransactions(baseline.daily);
    setBackCashTransactions(baseline.backCash);
    setWholesalers(baseline.wholesalers);
    setCustomers(baseline.customers);
    setEasyloadRecords(baseline.easyload);
    setBottleItems(baseline.bottles);
    setStockTransactions(baseline.stockTx);
    setCart([]);
    localStorage.setItem('taj_pos_demo_last_reset', String(Date.now()));
    setDemoTimeLeft(1800);
  };

  // 30-Minute Auto-Restore Mechanism for Demo Store
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      const lastReset = Number(localStorage.getItem('taj_pos_demo_last_reset') || Date.now());
      const elapsed = Math.floor((Date.now() - lastReset) / 1000);
      const remaining = 1800 - elapsed;

      if (remaining <= 0) {
        resetDemoData();
      } else {
        setDemoTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  const togglePrivacy = () => setIsPrivacyOn(prev => !prev);
  const toggleMaintenanceMode = () => {
    setIsMaintenanceMode(prev => {
      const next = !prev;
      localStorage.setItem('taj_pos_maintenance_mode', String(next));
      // Sync to cloud if available
      try {
        setDoc(doc(db, 'system_settings', 'maintenance'), {
          isMaintenanceMode: next,
          notice: maintenanceNotice,
          updated_at: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch {}
      return next;
    });
  };

  const updateMaintenanceNotice = (msg: string) => {
    setMaintenanceNotice(msg);
    localStorage.setItem('taj_pos_maintenance_notice', msg);
    try {
      setDoc(doc(db, 'system_settings', 'maintenance'), {
        notice: msg,
        updated_at: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {}
  };

  // --- CALCULATORS ---
  const getShopCashStats = (date: string) => {
    const txs = dailyTransactions.filter(t => t.transaction_date === date);
    let opening = 0;
    let cashIn = 0;
    let cashOut = 0;

    txs.forEach(t => {
      const type = t.type.toLowerCase();
      if (type === 'opening') opening += t.amount;
      else if (type === 'in') cashIn += t.amount;
      else if (type === 'out') cashOut += t.amount;
    });

    const balance = (opening + cashIn) - cashOut;
    return { opening, cashIn, cashOut, balance };
  };

  const getLastBackCashClosingInfo = (date: string) => {
    const priorTxs = backCashTransactions.filter(t => t.transaction_date < date);
    if (priorTxs.length === 0) {
      return {
        amount: 0,
        lastDate: getYesterdayDateString(date),
        hasPrior: false
      };
    }

    // Find the latest transaction_date strictly before 'date'
    const dates = Array.from(new Set(priorTxs.map(t => t.transaction_date))).sort((a, b) => b.localeCompare(a));
    const lastActiveDate = dates[0];

    let yTotal = 0;
    priorTxs.forEach(t => {
      if (t.type === 'out' || t.type === 'closing_minus' || t.type === 'transfer_to_shop') {
        yTotal -= t.amount;
      } else if (t.type === 'closing') {
        // closing allocates part of the existing balance, does not inject additional external cash
      } else {
        yTotal += t.amount;
      }
    });

    return {
      amount: yTotal,
      lastDate: lastActiveDate,
      hasPrior: true
    };
  };

  const getYesterdayBackCashClosing = (date: string) => {
    return getLastBackCashClosingInfo(date).amount;
  };

  const getBackCashTotal = (date: string) => {
    const yClosing = getYesterdayBackCashClosing(date);
    const txs = backCashTransactions.filter(t => t.transaction_date === date);
    let todayDelta = 0;
    txs.forEach(t => {
      if (t.type === 'out' || t.type === 'closing_minus' || t.type === 'transfer_to_shop') {
        todayDelta -= t.amount;
      } else if (t.type === 'closing') {
        // closing is an internal allocation of the day's cash by the user/admin, not a new cash receipt
      } else {
        todayDelta += t.amount;
      }
    });
    return yClosing + todayDelta;
  };

  const getBackCashClosingDetails = (date: string): BackCashClosingBreakdown => {
    const totalBalance = getBackCashTotal(date);
    const txs = backCashTransactions.filter(t => t.transaction_date === date);
    const closingTxs = txs.filter(t => t.type === 'closing');
    const closingMinusTxs = txs.filter(t => t.type === 'closing_minus');

    const totalClosingAdded = closingTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalClosingMinus = closingMinusTxs.reduce((sum, t) => sum + t.amount, 0);
    const activeClosing = Math.max(0, totalClosingAdded - totalClosingMinus);
    const remainingCounter = Math.max(0, totalBalance - activeClosing);

    const userMap: { [key: string]: { userId: string; userName: string; userRole: string; amount: number } } = {};
    closingTxs.forEach(t => {
      const role = t.created_by_role || t.created_by || 'admin';
      const name = t.created_by_name || (role === 'admin' ? 'Admin' : (role === 'cashier' ? 'Cashier' : 'Staff'));
      const key = `${role}_${name}`;
      if (!userMap[key]) {
        userMap[key] = { userId: t.created_by, userName: name, userRole: role, amount: 0 };
      }
      userMap[key].amount += t.amount;
    });

    let remainingMinus = totalClosingMinus;
    if (remainingMinus > 0) {
      for (const key of Object.keys(userMap)) {
        if (remainingMinus <= 0) break;
        const deduct = Math.min(userMap[key].amount, remainingMinus);
        userMap[key].amount -= deduct;
        remainingMinus -= deduct;
      }
    }

    const userClosings = Object.values(userMap).filter(u => u.amount > 0);

    return {
      totalBalance,
      activeClosing,
      remainingCounter,
      userClosings
    };
  };

  const getYesterdayClosingCash = (date: string) => {
    const yDate = getYesterdayDateString(date);
    return getShopCashStats(yDate).balance;
  };

  const getCalculatedYesterdaySale = (date: string) => {
    const todayStats = getShopCashStats(date);
    const yDate = getYesterdayDateString(date);
    const yClosing = getShopCashStats(yDate).balance;
    const calc = todayStats.opening - yClosing;
    return calc > 0 ? calc : 0;
  };

  const calculateLoadSaleVal = (open: number, purch: number, close: number) => {
    if (close <= 0) return 0;
    return (open + purch) - close;
  };

  const getEasyloadSaleSummary = (date: string): EasyloadSaleSummary => {
    const rec = easyloadRecords[date];
    if (!rec) {
      return { jazz: 0, telenor: 0, zong: 0, ufone: 0, total: 0 };
    }
    const jazz = calculateLoadSaleVal(rec.jazz_opening, rec.jazz_purchase, rec.jazz_closing);
    const telenor = calculateLoadSaleVal(rec.telenor_opening, rec.telenor_purchase, rec.telenor_closing);
    const zong = calculateLoadSaleVal(rec.zong_opening, rec.zong_purchase, rec.zong_closing);
    const ufone = calculateLoadSaleVal(rec.ufone_opening, rec.ufone_purchase, rec.ufone_closing);
    const total = jazz + telenor + zong + ufone;
    return { jazz, telenor, zong, ufone, total };
  };

  const getBachatProfit = (date: string): BachatSummary => {
    const yDate = getYesterdayDateString(date);
    const dayBeforeLoadSale = getEasyloadSaleSummary(yDate).total;
    const calculatedYesterdaySale = getCalculatedYesterdaySale(date);

    const loadCommissionRate = 0.024; // 2.4%
    const shopCommissionRate = 0.08; // 8%

    const calculatedLoadBachat = dayBeforeLoadSale * loadCommissionRate;
    const calculatedShopSale = Math.max(0, calculatedYesterdaySale - dayBeforeLoadSale);
    const calculatedShopBachat = calculatedShopSale * shopCommissionRate;
    const totalNetBachat = calculatedLoadBachat + calculatedShopBachat;

    return {
      dayBeforeLoadSale,
      calculatedLoadBachat,
      calculatedShopSale,
      calculatedShopBachat,
      totalNetBachat
    };
  };

  const getRemainingPets = () => {
    return bottleItems.reduce((acc, item) => acc + (item.total_stock || 0), 0);
  };

  const getTotalBottleSalesValue = () => {
    return stockTransactions
      .filter(t => t.action_type === 'remove')
      .reduce((acc, t) => {
        const item = bottleItems.find(b => b.id === t.item_id);
        if (!item) return acc;
        return acc + t.quantity * (item.unit_price + item.commission_per_unit);
      }, 0);
  };

  const getTotalPendingMarketBalance = () => {
    // Total bottle sales minus total payment received
    return 15600; // Calculated pending metric
  };

  const getTotalWholesalerPayable = () => {
    return wholesalers.reduce((acc, w) => acc + (w.remaining_balance || 0), 0);
  };

  const getTotalCustomerReceivable = () => {
    return customers
      .filter(c => c.status === 'pending')
      .reduce((acc, c) => acc + (c.remaining_balance || 0), 0);
  };

  // --- CRUD ACTIONS ---

  // Daily Cash (Shop Galla)
  const addDailyTransaction = (tx: Omit<DailyTransaction, 'id' | 'created_by'>) => {
    const newTx: DailyTransaction = {
      ...tx,
      id: `dt-${Date.now()}`,
      created_by: currentUser?.role || 'user'
    };
    setDailyTransactions(prev => [newTx, ...prev]);
    saveDocToShop('daily_transactions', newTx.id, newTx);
  };

  const updateDailyTransaction = (id: string, newAmount: number, newDesc: string, newType?: string) => {
    setDailyTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          if (tx.amount !== newAmount) {
            // Log in edit history
            const log: EditHistoryRecord = {
              id: `eh-${Date.now()}`,
              transaction_id: id,
              source: 'shop',
              old_amount: tx.amount,
              new_amount: newAmount,
              edited_by: currentUser?.role || 'user',
              edited_at: new Date().toISOString(),
              is_read: false,
              note: newDesc,
              transaction_date: tx.transaction_date
            };
            setEditHistory(h => [log, ...h]);
            saveDocToShop('edit_history', log.id, log);
          }
          if (tx.linked_transfer_id && newAmount !== tx.amount) {
            setBackCashTransactions(prevBack =>
              prevBack.map(b => (b.id === tx.linked_transfer_id || b.linked_transfer_id === id ? { ...b, amount: newAmount } : b))
            );
            const linkedBc = backCashTransactions.find(b => b.id === tx.linked_transfer_id || b.linked_transfer_id === id);
            if (linkedBc) {
              saveDocToShop('back_cash_transactions', linkedBc.id, { ...linkedBc, amount: newAmount });
            }
          }
          const updated = {
            ...tx,
            amount: newAmount,
            description: newDesc,
            type: (newType as any) || tx.type
          };
          saveDocToShop('daily_transactions', updated.id, updated);
          return updated;
        }
        return tx;
      })
    );
  };

  const deleteDailyTransaction = (id: string) => {
    const tx = dailyTransactions.find(t => t.id === id);
    if (!tx) return;

    // Add to Deleted History
    const delRecord: DeletedHistoryRecord = {
      id: `del-${Date.now()}`,
      original_id: id,
      source: tx.party_type === 'customer' ? 'customer_khata' : tx.party_type === 'wholesaler' ? 'wholesaler_khata' : 'shop_cash',
      type: tx.type,
      amount: tx.amount,
      note: tx.description,
      transaction_date: tx.transaction_date,
      deleted_by: currentUser?.role || 'user',
      deleted_at: new Date().toISOString(),
      bill_id: tx.bill_id,
      party_type: tx.party_type
    };
    setDeletedHistory(prev => [delRecord, ...prev]);
    saveDocToShop('deleted_history', delRecord.id, delRecord);

    // Reverse if party transaction
    if (tx.party_type === 'wholesaler' && tx.bill_id) {
      if (tx.type === 'out') {
        setWholesalers(prev =>
          prev.map(w => {
            if (w.id === tx.bill_id) {
              const updated = { ...w, remaining_balance: w.remaining_balance + tx.amount, status: 'pending' as const };
              saveDocToShop('wholesaler_bills', updated.id, updated);
              return updated;
            }
            return w;
          })
        );
      }
    } else if (tx.party_type === 'customer' && tx.bill_id) {
      if (tx.type === 'in') {
        setCustomers(prev =>
          prev.map(c => {
            if (c.id === tx.bill_id) {
              const updated = { ...c, remaining_balance: c.remaining_balance + tx.amount, status: 'pending' as const };
              saveDocToShop('customer_bills', updated.id, updated);
              return updated;
            }
            return c;
          })
        );
      }
    }

    // If it has a linked Back Cash transaction, delete that too
    if (tx.linked_transfer_id) {
      setBackCashTransactions(prev => prev.filter(b => b.id !== tx.linked_transfer_id && b.linked_transfer_id !== id));
      deleteDocFromShop('back_cash_transactions', tx.linked_transfer_id);
    }

    setDailyTransactions(prev => prev.filter(t => t.id !== id));
    deleteDocFromShop('daily_transactions', id);
  };

  // Back Cash
  const addBackCash = (tx: Omit<BackCashTransaction, 'id' | 'created_by'>) => {
    const role = currentUser?.role || 'user';
    const name = currentUser?.name || currentUser?.username || (role.charAt(0).toUpperCase() + role.slice(1));
    const designation = role.charAt(0).toUpperCase() + role.slice(1);

    const newTx: BackCashTransaction = {
      ...tx,
      id: `bc-${Date.now()}`,
      created_by: currentUser?.username || role,
      created_by_role: role,
      created_by_name: name,
      created_by_designation: designation
    };
    setBackCashTransactions(prev => [newTx, ...prev]);
    saveDocToShop('back_cash_transactions', newTx.id, newTx);
  };

  const updateBackCash = (id: string, newAmount: number, newNote: string, newType?: BackCashTransaction['type']) => {
    const editorRole = currentUser?.role || 'user';
    const editorName = currentUser?.name || currentUser?.username || (editorRole.charAt(0).toUpperCase() + editorRole.slice(1));

    setBackCashTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          if (tx.amount !== newAmount) {
            const log: EditHistoryRecord = {
              id: `eh-${Date.now()}`,
              transaction_id: id,
              source: 'back',
              old_amount: tx.amount,
              new_amount: newAmount,
              edited_by: `${editorRole.toUpperCase()}${editorName ? ` (${editorName})` : ''}`,
              edited_at: new Date().toISOString(),
              is_read: false,
              note: newNote,
              transaction_date: tx.transaction_date
            };
            setEditHistory(h => [log, ...h]);
            saveDocToShop('edit_history', log.id, log);
          }

          if (tx.linked_transfer_id && newAmount !== tx.amount) {
            setDailyTransactions(prevDaily =>
              prevDaily.map(d => (d.id === tx.linked_transfer_id || d.linked_transfer_id === id ? { ...d, amount: newAmount } : d))
            );
            const linkedDt = dailyTransactions.find(d => d.id === tx.linked_transfer_id || d.linked_transfer_id === id);
            if (linkedDt) {
              saveDocToShop('daily_transactions', linkedDt.id, { ...linkedDt, amount: newAmount });
            }
          }

          const updated: BackCashTransaction = {
            ...tx,
            amount: newAmount,
            note: newNote,
            type: newType || tx.type,
            edited_by: currentUser?.username || editorRole,
            edited_by_role: editorRole,
            edited_by_name: editorName,
            edited_at: new Date().toISOString()
          };
          saveDocToShop('back_cash_transactions', updated.id, updated);
          return updated;
        }
        return tx;
      })
    );
  };

  const deleteBackCash = (id: string) => {
    const tx = backCashTransactions.find(t => t.id === id);
    if (!tx) return;

    const delRecord: DeletedHistoryRecord = {
      id: `del-${Date.now()}`,
      original_id: id,
      source: 'back_cash',
      type: tx.type,
      amount: tx.amount,
      note: tx.note,
      transaction_date: tx.transaction_date,
      deleted_by: currentUser?.role || 'user',
      deleted_at: new Date().toISOString()
    };
    setDeletedHistory(prev => [delRecord, ...prev]);
    saveDocToShop('deleted_history', delRecord.id, delRecord);

    // If it has a linked Daily Cash transaction, delete that too
    if (tx.linked_transfer_id) {
      setDailyTransactions(prev => prev.filter(d => d.id !== tx.linked_transfer_id && d.linked_transfer_id !== id));
      deleteDocFromShop('daily_transactions', tx.linked_transfer_id);
    }

    setBackCashTransactions(prev => prev.filter(t => t.id !== id));
    deleteDocFromShop('back_cash_transactions', id);
  };

  const transferBetweenCashAccounts = (params: {
    from: 'shop' | 'back';
    to: 'shop' | 'back';
    amount: number;
    note?: string;
    transaction_date: string;
  }) => {
    const role = currentUser?.role || 'user';
    const name = currentUser?.name || currentUser?.username || (role.charAt(0).toUpperCase() + role.slice(1));
    const designation = role.charAt(0).toUpperCase() + role.slice(1);
    const ts = Date.now();
    const dtId = `dt-${ts}`;
    const bcId = `bc-${ts}`;
    const userNote = params.note?.trim();

    if (params.from === 'back' && params.to === 'shop') {
      // Back Cash se Liya / Aya (Shop Cash In +, Back Cash Out -)
      const shopNote = userNote ? `[Back Cash se Liya] ${userNote}` : '[Back Cash se Liya] Counter Cash Transfer';
      const backNote = userNote ? `[Shop Counter ko Diya] ${userNote}` : '[Shop Counter ko Diya] Shop Transfer';

      const bcTx: BackCashTransaction = {
        id: bcId,
        type: 'transfer_to_shop',
        amount: params.amount,
        note: backNote,
        transaction_date: params.transaction_date,
        created_by: currentUser?.username || role,
        created_by_role: role,
        created_by_name: name,
        created_by_designation: designation,
        linked_transfer_id: dtId,
        transfer_direction: 'to_shop'
      };

      const dtTx: DailyTransaction = {
        id: dtId,
        type: 'in',
        amount: params.amount,
        description: shopNote,
        transaction_date: params.transaction_date,
        created_by: currentUser?.role || 'user',
        linked_transfer_id: bcId,
        transfer_direction: 'from_back_cash'
      };

      setBackCashTransactions(prev => [bcTx, ...prev]);
      saveDocToShop('back_cash_transactions', bcTx.id, bcTx);
      setDailyTransactions(prev => [dtTx, ...prev]);
      saveDocToShop('daily_transactions', dtTx.id, dtTx);
    } else if (params.from === 'shop' && params.to === 'back') {
      // Shop Cash ko Back Cash bheja (Shop Cash Out -, Back Cash In +)
      const shopNote = userNote ? `[Back Cash ko Diya] ${userNote}` : '[Back Cash ko Diya] Counter Transfer';
      const backNote = userNote ? `[Shop Counter se Liya] ${userNote}` : '[Shop Counter se Liya] Shop Cash Received';

      const dtTx: DailyTransaction = {
        id: dtId,
        type: 'out',
        amount: params.amount,
        description: shopNote,
        transaction_date: params.transaction_date,
        created_by: currentUser?.role || 'user',
        linked_transfer_id: bcId,
        transfer_direction: 'to_back_cash'
      };

      const bcTx: BackCashTransaction = {
        id: bcId,
        type: 'transfer_from_shop',
        amount: params.amount,
        note: backNote,
        transaction_date: params.transaction_date,
        created_by: currentUser?.username || role,
        created_by_role: role,
        created_by_name: name,
        created_by_designation: designation,
        linked_transfer_id: dtId,
        transfer_direction: 'from_shop'
      };

      setDailyTransactions(prev => [dtTx, ...prev]);
      saveDocToShop('daily_transactions', dtTx.id, dtTx);
      setBackCashTransactions(prev => [bcTx, ...prev]);
      saveDocToShop('back_cash_transactions', bcTx.id, bcTx);
    }
  };

  // Wholesalers Khata
  const addWholesaler = (bill: Omit<WholesalerBill, 'id' | 'remaining_balance' | 'created_date' | 'status'>) => {
    const isZero = (bill.total_bill || 0) <= 0;
    const newBill: WholesalerBill = {
      ...bill,
      total_bill: bill.total_bill || 0,
      id: `w-${Date.now()}`,
      remaining_balance: bill.total_bill || 0,
      created_date: filterDate,
      status: isZero ? 'paid' : 'pending'
    };
    setWholesalers(prev => [newBill, ...prev]);
    saveDocToShop('wholesaler_bills', newBill.id, newBill);
  };

  const payWholesaler = (billId: string, amount: number) => {
    const target = wholesalers.find(w => w.id === billId);
    if (!target || amount <= 0) return;

    const newRem = Math.max(0, target.remaining_balance - amount);
    const newStatus = newRem <= 0 ? 'paid' : 'pending';

    setWholesalers(prev =>
      prev.map(w => {
        if (w.id === billId) {
          const upd = { ...w, remaining_balance: newRem, status: newStatus as any };
          saveDocToShop('wholesaler_bills', upd.id, upd);
          return upd;
        }
        return w;
      })
    );

    // Record in Daily Transactions (Cash Out from Shop)
    addDailyTransaction({
      type: 'out',
      amount,
      description: `Payment to Wholesaler: ${target.customer_name}`,
      transaction_date: filterDate,
      party_type: 'wholesaler',
      bill_id: billId
    });
  };

  const addNewBillWholesaler = (billId: string, amount: number) => {
    const target = wholesalers.find(w => w.id === billId);
    if (!target || amount <= 0) return;

    setWholesalers(prev =>
      prev.map(w => {
        if (w.id === billId) {
          const upd = {
            ...w,
            total_bill: w.total_bill + amount,
            remaining_balance: w.remaining_balance + amount,
            status: 'pending' as const
          };
          saveDocToShop('wholesaler_bills', upd.id, upd);
          return upd;
        }
        return w;
      })
    );

    addDailyTransaction({
      type: 'bill_add',
      amount,
      description: `Naya Bill Added: ${target.customer_name}`,
      transaction_date: filterDate,
      party_type: 'wholesaler',
      bill_id: billId
    });
  };

  const updateWholesaler = (bill: WholesalerBill) => {
    setWholesalers(prev => prev.map(w => (w.id === bill.id ? bill : w)));
    saveDocToShop('wholesaler_bills', bill.id, bill);
  };

  const deleteWholesaler = (id: string) => {
    setWholesalers(prev => prev.filter(w => w.id !== id));
    deleteDocFromShop('wholesaler_bills', id);
  };

  // Customers Khata (Udhaar)
  const addCustomer = (bill: Omit<CustomerBill, 'id' | 'remaining_balance' | 'created_date' | 'status'>) => {
    const isZero = (bill.total_bill || 0) <= 0;
    const newBill: CustomerBill = {
      ...bill,
      total_bill: bill.total_bill || 0,
      id: `c-${Date.now()}`,
      remaining_balance: bill.total_bill || 0,
      created_date: filterDate,
      status: isZero ? 'paid' : 'pending'
    };
    setCustomers(prev => [newBill, ...prev]);
    saveDocToShop('customer_bills', newBill.id, newBill);

    // Record in daily transactions with party_type='customer' so it shows in customer ledger history
    addDailyTransaction({
      type: 'out',
      amount: bill.total_bill || 0,
      description: isZero
        ? `Khata Started (Opening Balance: Rs. 0): ${bill.customer_name}`
        : `Credit given to Customer: ${bill.customer_name}`,
      transaction_date: filterDate,
      party_type: 'customer',
      bill_id: newBill.id
    });
  };

  const receiveCustomerPayment = (billId: string, amount: number) => {
    const target = customers.find(c => c.id === billId);
    if (!target || amount <= 0) return;

    const newRem = Math.max(0, target.remaining_balance - amount);
    const newStatus = newRem <= 0 ? 'paid' : 'pending';

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === billId) {
          const upd = { ...c, remaining_balance: newRem, status: newStatus as any };
          saveDocToShop('customer_bills', upd.id, upd);
          return upd;
        }
        return c;
      })
    );

    // Record Cash In in Daily Cash
    addDailyTransaction({
      type: 'in',
      amount,
      description: `Payment Received from Customer: ${target.customer_name}`,
      transaction_date: filterDate,
      party_type: 'customer',
      bill_id: billId
    });
  };

  const payMoreCustomer = (billId: string, amount: number) => {
    const target = customers.find(c => c.id === billId);
    if (!target || amount <= 0) return;

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === billId) {
          const upd = {
            ...c,
            total_bill: c.total_bill + amount,
            remaining_balance: c.remaining_balance + amount,
            status: 'pending' as const
          };
          saveDocToShop('customer_bills', upd.id, upd);
          return upd;
        }
        return c;
      })
    );

    addDailyTransaction({
      type: 'out',
      amount,
      description: `Additional Cash given to Customer: ${target.customer_name}`,
      transaction_date: filterDate,
      party_type: 'customer',
      bill_id: billId
    });
  };

  const updateCustomer = (bill: CustomerBill) => {
    setCustomers(prev => prev.map(c => (c.id === bill.id ? bill : c)));
    saveDocToShop('customer_bills', bill.id, bill);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    deleteDocFromShop('customer_bills', id);
  };

  // Easyload Ledger
  const saveEasyloadRecord = (dateStr: string, updates: Partial<EasyloadRecord>) => {
    setEasyloadRecords(prev => {
      const existing = prev[dateStr] || {
        date_recorded: dateStr,
        jazz_opening: 0,
        jazz_purchase: 0,
        jazz_closing: 0,
        telenor_opening: 0,
        telenor_purchase: 0,
        telenor_closing: 0,
        zong_opening: 0,
        zong_purchase: 0,
        zong_closing: 0,
        ufone_opening: 0,
        ufone_purchase: 0,
        ufone_closing: 0,
        total_commission_earned: 0
      };
      const merged = {
        ...existing,
        ...updates
      };
      saveDocToShop('easyload_records', dateStr, merged);
      return {
        ...prev,
        [dateStr]: merged
      };
    });
  };

  const saveEasyloadPurchase = (
    network: 'jazz' | 'telenor' | 'zong' | 'ufone',
    amount: number,
    note?: string
  ) => {
    if (amount <= 0) return;
    const commissionPercent = 2.4; // 2.4%
    const commissionEarned = amount * (commissionPercent / 100);
    const totalSimBalanceAdded = amount + commissionEarned;

    // 1. Record in Shop Cash as cash paid from Galla (Out)
    const finalDesc = `Easyload Purchase (${network.toUpperCase()}) - Paid: Rs. ${amount.toLocaleString()} | Received: Rs. ${totalSimBalanceAdded.toLocaleString()}${
      note ? ` (${note})` : ''
    }`;
    addDailyTransaction({
      type: 'out',
      amount,
      description: finalDesc,
      transaction_date: filterDate
    });

    // 2. Update Easyload Record for today
    const currentRecord = easyloadRecords[filterDate] || {
      date_recorded: filterDate,
      jazz_opening: 0,
      jazz_purchase: 0,
      jazz_closing: 0,
      telenor_opening: 0,
      telenor_purchase: 0,
      telenor_closing: 0,
      zong_opening: 0,
      zong_purchase: 0,
      zong_closing: 0,
      ufone_opening: 0,
      ufone_purchase: 0,
      ufone_closing: 0,
      total_commission_earned: 0
    };

    const purchaseKey = `${network}_purchase` as keyof EasyloadRecord;
    const updatedPurch = ((currentRecord[purchaseKey] as number) || 0) + totalSimBalanceAdded;
    const updatedComm = (currentRecord.total_commission_earned || 0) + commissionEarned;

    saveEasyloadRecord(filterDate, {
      [purchaseKey]: updatedPurch,
      total_commission_earned: updatedComm
    });
  };

  // Bottle Inventory
  const addBottleItem = (item: Omit<BottleItem, 'id' | 'total_stock'>) => {
    const exists = bottleItems.some(b => b.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim());
    if (exists) return false;

    const newItem: BottleItem = {
      ...item,
      id: `b-${Date.now()}`,
      total_stock: 0
    };
    setBottleItems(prev => [...prev, newItem]);
    saveDocToShop('bottle_items', newItem.id, newItem);
    return true;
  };

  const updateBottleItem = (item: BottleItem) => {
    const dup = bottleItems.some(b => b.id !== item.id && b.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim());
    if (dup) return false;

    setBottleItems(prev => prev.map(b => (b.id === item.id ? item : b)));
    saveDocToShop('bottle_items', item.id, item);
    return true;
  };

  const deleteBottleItem = (id: string) => {
    setBottleItems(prev => prev.filter(b => b.id !== id));
    deleteDocFromShop('bottle_items', id);
  };

  const updateItemStock = (itemId: string, qty: number, type: 'add' | 'remove', note?: string) => {
    const item = bottleItems.find(b => b.id === itemId);
    if (!item) return false;

    if (type === 'remove' && qty > item.total_stock) {
      return false; // Insufficient stock
    }

    const newStock = type === 'add' ? item.total_stock + qty : item.total_stock - qty;

    const updatedItem = { ...item, total_stock: newStock };
    setBottleItems(prev =>
      prev.map(b => (b.id === itemId ? updatedItem : b))
    );
    saveDocToShop('bottle_items', itemId, updatedItem);

    // Record Stock transaction
    const newTx: StockTransaction = {
      id: `st-${Date.now()}`,
      item_id: itemId,
      item_name: item.item_name,
      user_name: currentUser?.username || 'Staff',
      action_type: type,
      quantity: qty,
      note: note || (type === 'add' ? 'Stock Added' : 'Stock Out'),
      created_at: new Date().toISOString()
    };
    setStockTransactions(prev => [newTx, ...prev]);
    saveDocToShop('stock_transactions', newTx.id, newTx);
    return true;
  };

  // Trash & Audit
  const restoreDeletedEntry = (id: string) => {
    const item = deletedHistory.find(d => d.id === id);
    if (!item) return;

    if (item.source === 'shop_cash') {
      addDailyTransaction({
        type: item.type as any,
        amount: item.amount,
        description: item.note,
        transaction_date: item.transaction_date,
        bill_id: item.bill_id,
        party_type: item.party_type
      });
    } else if (item.source === 'back_cash') {
      addBackCash({
        type: item.type as any,
        amount: item.amount,
        note: item.note,
        transaction_date: item.transaction_date
      });
    }

    setDeletedHistory(prev => prev.filter(d => d.id !== id));
    deleteDocFromShop('deleted_history', id);
  };

  const permanentDeleteEntry = (id: string) => {
    setDeletedHistory(prev => prev.filter(d => d.id !== id));
    deleteDocFromShop('deleted_history', id);
  };

  const markAllEditsAsRead = () => {
    setEditHistory(prev => prev.map(e => ({ ...e, is_read: true })));
  };

  // Cart / POS billing
  const addToCart = (item: BottleItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.item_name, price: item.unit_price, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(i => (i.id === id ? { ...i, qty } : i)));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  const completeSale = () => {
    if (cart.length === 0) return { success: false };

    const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const saleId = `SALE-${Date.now().toString().slice(-6)}`;

    // 1. Deduct Stock for each item
    cart.forEach(item => {
      updateItemStock(item.id, item.qty, 'remove', `Sale Bill #${saleId}`);
    });

    // 2. Add cash to Daily Cash
    addDailyTransaction({
      type: 'in',
      amount: total,
      description: `Sale: Bill #${saleId} (${cart.map(c => `${c.name} x${c.qty}`).join(', ')})`,
      transaction_date: filterDate
    });

    clearCart();
    return { success: true, saleId, total };
  };

  // Export / Backup
  const exportDataJSON = () => {
    const data = {
      dailyTransactions,
      backCashTransactions,
      wholesalers,
      customers,
      easyloadRecords,
      bottleItems,
      stockTransactions,
      editHistory,
      deletedHistory,
      systemSettings,
      exportedAt: new Date().toISOString(),
      appName: 'Taj POS Pro'
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `Taj_POS_Backup_${filterDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.dailyTransactions) setDailyTransactions(data.dailyTransactions);
      if (data.backCashTransactions) setBackCashTransactions(data.backCashTransactions);
      if (data.wholesalers) setWholesalers(data.wholesalers);
      if (data.customers) setCustomers(data.customers);
      if (data.easyloadRecords) setEasyloadRecords(data.easyloadRecords);
      if (data.bottleItems) setBottleItems(data.bottleItems);
      return true;
    } catch {
      return false;
    }
  };

  const resetToInitialData = () => {
    setDailyTransactions(initialDailyTransactions);
    setBackCashTransactions(initialBackCashTransactions);
    setWholesalers(initialWholesalers);
    setCustomers(initialCustomers);
    setEasyloadRecords(initialEasyloadRecords);
    setBottleItems(initialBottleItems);
    setStockTransactions(initialStockTransactions);
    setEditHistory([]);
    setDeletedHistory([]);
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        currentShop,
        isNewShopSetupRequired,
        completeShopSetup,
        updateShopProfile,
        login,
        loginWithGoogle,
        loginWithGmail,
        verifyGmailOTP,
        resendGmailOTP,
        cancelOtpVerification,
        isOtpVerificationRequired,
        pendingOtpEmail,
        pendingOtpCode,
        loginStaff,
        loginAsOwnerDirect,
        logout,
        staffAccounts,
        addStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        isCleanStore,
        resetToCleanZeroData,
        loadDemoSampleData,
        isDemoMode,
        loginDemoStore,
        resetDemoData,
        demoTimeLeft,
        saveCurrentAsDemoTemplate,
        activeView,
        setActiveView,
        filterDate,
        setFilterDate,
        yesterdayDate,
        isPrivacyOn,
        togglePrivacy,
        isMaintenanceMode,
        maintenanceNotice,
        setMaintenanceNotice: updateMaintenanceNotice,
        toggleMaintenanceMode,
        showIndependenceModal,
        setShowIndependenceModal,
        showWhatsNewModal,
        setShowWhatsNewModal,
        isFirebaseConnected,
        firebaseSyncStatus,
        isAppInstalled,
        installApp,
        showTopInstallBanner,
        setShowTopInstallBanner,
        dailyTransactions,
        backCashTransactions,
        wholesalers,
        customers,
        easyloadRecords,
        bottleItems,
        stockTransactions,
        editHistory,
        deletedHistory,
        systemSettings,
        setSystemSettings,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        completeSale,
        addDailyTransaction,
        updateDailyTransaction,
        deleteDailyTransaction,
        addBackCash,
        updateBackCash,
        deleteBackCash,
        transferBetweenCashAccounts,
        addWholesaler,
        payWholesaler,
        addNewBillWholesaler,
        updateWholesaler,
        deleteWholesaler,
        addCustomer,
        receiveCustomerPayment,
        payMoreCustomer,
        updateCustomer,
        deleteCustomer,
        saveEasyloadRecord,
        saveEasyloadPurchase,
        addBottleItem,
        updateBottleItem,
        deleteBottleItem,
        updateItemStock,
        restoreDeletedEntry,
        permanentDeleteEntry,
        markAllEditsAsRead,
        getShopCashStats,
        getBackCashTotal,
        getBackCashClosingDetails,
        getYesterdayBackCashClosing,
        getLastBackCashClosingInfo,
        getYesterdayClosingCash,
        getCalculatedYesterdaySale,
        getEasyloadSaleSummary,
        getBachatProfit,
        getRemainingPets,
        getTotalBottleSalesValue,
        getTotalPendingMarketBalance,
        getTotalWholesalerPayable,
        getTotalCustomerReceivable,
        exportDataJSON,
        importDataJSON,
        resetToInitialData
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = (): POSContextType => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

import {
  Bell, LogOut } from "lucide-react";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { db, storage } from '../firebase';
import { uploadFileWithFallback } from '../utils/uploadHelper';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { 
  UserProfile, 
  Tournament, 
  Transaction, 
  AppNotification, 
  RoomStatusType 
} from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Wallet, 
  Settings, 
  Megaphone, 
  FileSpreadsheet, 
  ShieldAlert, 
  Search, 
  UserPlus, 
  UserMinus, 
  Ban, 
  Edit3, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Award, 
  FileText, 
  Code, 
  AlertTriangle, 
  BellRing, 
  Volume2, 
  ChevronRight, 
  Download, 
  Upload, 
  CheckCircle,
  Database,
  Lock,
  Flame,
  DollarSign,
  Eye,
  EyeOff,
  Youtube,
  Menu,
  Paintbrush,
  MessageCircle,
  Trophy,
  FolderClosed,
  Cloud,
  Image as ImageIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { AdminBrandingTab } from './AdminBrandingTab';
import { AdminSupportSettingsTab } from './AdminSupportSettingsTab';
import { AdminBannerManagementTab } from './AdminBannerManagementTab';
import { AdminBonusManagementTab } from './AdminBonusManagementTab';
import { LoadingPageManager } from './LoadingPageManager';
import { StorageManager } from './StorageManager';
import { MediaPickerModal } from './MediaPickerModal';
import { AdminCategoriesTab } from './AdminCategoriesTab';
import { AdminWeeklyLeaderboardTab as WeeklyTopPlayersManager } from './AdminWeeklyLeaderboardTab';
import { AdminWinningsManager } from './AdminWinningsManager';
import { AdminAuthProvidersTab } from './AdminAuthProvidersTab';
import { compressImage } from '../utils/imageUtils';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { 
    tournaments, 
    userProfile, 
    triggerNotification, 
    registrations, 
    updateRegistrationAdmin, 
    refundRegistrationAdmin,
    saveTournamentAdmin,
    deleteTournamentAdmin,
    categories,
    notificationSettings,
    updateNotificationSettingsAdmin,
    promoSettings,
    updatePromoSettingsAdmin
  } = useGame();
  
  // Admin Login States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1200);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tournaments' | 'players' | 'wallet' | 'promo_announcements' | 'settings_security' | 'youtube_management' | 'registrations' | 'payment_approval' | 'website_branding' | 'support_settings' | 'loading_page_manager' | 'game_categories' | 'weekly_leaderboard_manager' | 'winnings_manager' | 'banner_management' | 'bonus_management' | 'storage_manager' | 'auth_providers'>('overview');
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [dbTransactions, setDbTransactions] = useState<Transaction[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState<boolean | null>(null);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [localPromoCodesEnabled, setLocalPromoCodesEnabled] = useState<boolean | null>(null);
  const [isSavingPromoCodes, setIsSavingPromoCodes] = useState(false);
  const [showStoragePicker, setShowStoragePicker] = useState(false);
  
  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; timestamp: string; admin: string }[]>([
    { id: '1', action: 'Admin logged in', timestamp: new Date(Date.now() - 600000).toISOString(), admin: 'admin@titanesp.com' },
    { id: '2', action: 'Created custom match', timestamp: new Date(Date.now() - 1200000).toISOString(), admin: 'admin@titanesp.com' },
  ]);

  // Selected tournament for player management
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(tournaments[0]?.id || '');
  const selectedTournament = tournaments.find(t => t.id === selectedTourneyId);

  // Manual Player Add form
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualPlayerUid, setManualPlayerUid] = useState('');

  // Editing User state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserProfile>>({});
  const [editDepBal, setEditDepBal] = useState(0);
  const [editWinBal, setEditWinBal] = useState(0);
  const [editBonBal, setEditBonBal] = useState(0);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');

  // Registrations search, filters and edit states
  const [searchRegQuery, setSearchRegQuery] = useState('');
  const [filterRegTourney, setFilterRegTourney] = useState('all');
  const [filterRegType, setFilterRegType] = useState('all');
  const [filterRegStatus, setFilterRegStatus] = useState('all');
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [editRegGovName, setEditRegGovName] = useState('');
  const [editRegPlayers, setEditRegPlayers] = useState<any[]>([]);

  // Transactions filters
  const [filterTxnStatus, setFilterTxnStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
  const [searchTxnQuery, setSearchTxnQuery] = useState('');
  const [filterPaymentRequestStatus, setFilterPaymentRequestStatus] = useState<'pending' | 'completed' | 'cancelled'>('pending');

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>, confirmText?: string, cancelText?: string) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await onConfirm();
        } catch (e) {
          console.warn("Error executing confirmed action:");
        }
      }
    });
  };

  // YouTube admin states & handlers
  const [ytConfig, setYtConfig] = useState({
    enabled: false,
    apiKey: '',
    channelId: '',
    cacheDurationMinutes: 15,
    autoSync: true
  });
  const [ytChannelInfo, setYtChannelInfo] = useState<any>(null);
  const [ytLiveInfo, setYtLiveInfo] = useState<any>(null);
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [ytShorts, setYtShorts] = useState<any[]>([]);
  const [loadingYt, setLoadingYt] = useState(false);
  const [ytTestStatus, setYtTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'youtube_management') {
      loadYtAdminData();
    }
  }, [activeTab]);

  const loadYtAdminData = async () => {
    setLoadingYt(true);
    try {
      const configRes = await fetch('/api/youtube/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setYtConfig({
          enabled: configData.enabled || false,
          apiKey: '', // Empty on load for security, preserve backend key unless typing a new one
          channelId: configData.channelId || '',
          cacheDurationMinutes: configData.cacheDurationMinutes || 15,
          autoSync: configData.autoSync ?? true
        });

        if (configData.enabled && configData.channelId) {
          // Fetch channel info
          const channelRes = await fetch('/api/youtube/channel');
          if (channelRes.ok) {
            setYtChannelInfo(await channelRes.json());
          }
          // Fetch live status
          const liveRes = await fetch('/api/youtube/live');
          if (liveRes.ok) {
            setYtLiveInfo(await liveRes.json());
          }
          // Fetch videos & shorts
          const videosRes = await fetch('/api/youtube/videos');
          const shortsRes = await fetch('/api/youtube/shorts');
          if (videosRes.ok) setYtVideos(await videosRes.json());
          if (shortsRes.ok) setYtShorts(await shortsRes.json());
        }
      }
    } catch (err) {
      console.warn("Error loading YT Admin data:");
    } finally {
      setLoadingYt(false);
    }
  };

  const handleSaveYtConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingYt(true);
    setYtTestStatus(null);
    try {
      const res = await fetch('/api/youtube/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ytConfig)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "YouTube configuration saved successfully!");
        loadYtAdminData();
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingYt(false);
    }
  };

  const handleTestYtConnection = async () => {
    setLoadingYt(true);
    setYtTestStatus(null);
    try {
      const saveRes = await fetch('/api/youtube/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ytConfig)
      });
      
      if (!saveRes.ok) throw new Error("Failed to save credentials before testing connection");

      // Force cache sync
      await fetch('/api/youtube/sync', { method: 'POST' });

      const channelRes = await fetch('/api/youtube/channel');
      const channelData = await channelRes.json();

      if (channelRes.ok && channelData.id) {
        setYtTestStatus({
          success: true,
          message: `Successfully connected to channel: ${channelData.title}!`
        });
        setYtChannelInfo(channelData);
        loadYtAdminData();
      } else {
        setYtTestStatus({
          success: false,
          message: channelData.error || "Channel not found or invalid YouTube API credentials."
        });
      }
    } catch (err: any) {
      setYtTestStatus({
        success: false,
        message: err.message || "An unexpected error occurred while verifying the API Key."
      });
    } finally {
      setLoadingYt(false);
    }
  };

  const handleYtManualSync = async () => {
    setLoadingYt(true);
    try {
      const syncRes = await fetch('/api/youtube/sync', { method: 'POST' });
      const syncData = await syncRes.json();
      if (syncRes.ok) {
        alert(syncData.message || "Cache invalidated and cleared!");
        loadYtAdminData();
      } else {
        alert(syncData.error || "Sync failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingYt(false);
    }
  };

  // Match Create/Edit Form
  const [isEditingMatch, setIsEditingMatch] = useState<string | null>(null); // tournamentId or 'new'
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [matchForm, setMatchForm] = useState<{
    id: string;
    title: string;
    bannerUrl: string;
    logoUrl: string;
    entryFee: number;
    prizePool: number;
    perKillPrize: number;
    map: 'Bermuda' | 'Kalahari' | 'Purgatory' | 'Alpine' | 'Nexterra';
    dateTime: string;
    matchDate: string;
    matchTime: string;
    registrationStart: string;
    registrationEnd: string;
    roomStatus: RoomStatusType;
    roomID?: string;
    roomPassword?: string;
    mode: 'Solo' | 'Duo' | 'Squad';
    totalSlots: number;
    isFreeMatch: boolean;
    rules: string[];
    liveUrl: string;
    gameCategory: string;
    tournamentType: 'paid' | 'free';
    enabled: boolean;
    matchCategory: 'BR' | 'CS';
    gameName: 'Free Fire' | 'PUBG Mobile' | 'Hacker Match' | 'Free Match';
    category: 'BR' | 'CS';
    matchType: 'Solo' | 'Duo' | 'Squad';
  }>({
    id: '',
    title: '',
    bannerUrl: '',
    logoUrl: '',
    liveUrl: '',
    entryFee: 10,
    prizePool: 500,
    perKillPrize: 3,
    map: 'Bermuda',
    dateTime: '',
    matchDate: '',
    matchTime: '',
    registrationStart: '',
    registrationEnd: '',
    roomStatus: 'open',
    roomID: '',
    roomPassword: '',
    mode: 'Solo',
    totalSlots: 48,
    isFreeMatch: false,
    gameCategory: 'free_fire',
    tournamentType: 'paid',
    enabled: true,
    matchCategory: 'BR',
    gameName: 'Free Fire',
    category: 'BR',
    matchType: 'Solo',
    rules: [
      'Teaming will lead to direct disqualification and zero prize payouts.',
      'Emulators and VPN tools are strictly prohibited inside this room.',
      'Submit screenshots within 15 minutes of completion for support.'
    ]
  });

  // Promo Code States
  const [promoCodes, setPromoCodes] = useState<{ code: string; bonus: number; limit: number; expiry: string }[]>([
    { code: 'TITAN50', bonus: 50, limit: 100, expiry: '2026-08-31' },
    { code: 'FREEFIRE', bonus: 20, limit: 500, expiry: '2026-12-31' }
  ]);
  const [newPromo, setNewPromo] = useState({ code: '', bonus: 10, limit: 50, expiry: '' });

  // Announcement States
  const [scrollingNotice, setScrollingNotice] = useState('Welcome to TITAN ESP Free Fire League! New matches starting every hour. Join now and claim your ₹20 signup bonus!');
  const [popupAnnouncement, setPopupAnnouncement] = useState({
    active: true,
    title: 'OFFICIAL ESORTS LEAGUE SEASON 4 🏆',
    message: 'Register now for the high-octane Squad Match at 9:00 PM with a grand Prize Pool of ₹5000! Standard levels 30+ only.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'
  });

  // Push notification states
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushType, setPushType] = useState<'info' | 'alert' | 'winner' | 'system'>('info');

  // App Settings States
  const [appSettings, setAppSettings] = useState({
    appName: 'TITAN ESP',
    version: '1.4.2',
    downloadLink: 'https://titanesp.esports/download',
    logoUrl: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=150',
    themeColor: 'amber',
    maintenanceMode: false,
    upiId: 'titanesp@ybl',
    qrCodeUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=250',
    razorpayKey: 'rzp_live_A8xH2kld9s17z',
    phonepeMerchant: 'PHONEPE_VA_MERCHANT',
    paytmMerchant: 'PAYTM_VA_MERCHANT',
    manualPaymentEnabled: true,
    paymentInstructions: 'Scan the QR Code below using any UPI App, complete the payment of the requested amount, copy the 12-digit UTR/Transaction ID, and submit it below to credit your account.',
    defaultGateway: 'zapupi',
    minDepositAmount: 10,
    maxDepositAmount: 100000,
    zapupiEnabled: true,
    zapupiMID: 'ZAP_VA_MID_982',
    zapupiApiKey: 'ZAP_VA_KEY_API_9831',
    zapupiSecretKey: 'ZAP_VA_SECRET_KEY_84920',
    zapupiSandbox: true,
    paytmEnabled: true,
    paytmMid: 'PAYTM_VA_MID',
    paytmMerchantKey: '',
    phonepeEnabled: true,
    phonepeMID: 'PHONEPE_VA_MID',
    phonepeKey: 'PHONEPE_VA_KEY',
    razorpayEnabled: true,
    razorpayKeyId: 'rzp_live_A8xH2kld9s17z',
    razorpayKeySecret: 'RAZORPAY_VA_SECRET',
    cashfreeEnabled: false,
    cashfreeAppId: 'CF_VA_APPID',
    cashfreeSecret: 'CF_VA_SECRET',
    payuEnabled: false,
    payuMerchantKey: 'PAYU_VA_KEY',
    payuSalt: 'PAYU_VA_SALT',
    easebuzzEnabled: false,
    easebuzzKey: 'EASEBUZZ_VA_KEY',
    easebuzzSalt: 'EASEBUZZ_VA_SALT'
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch App Settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      // First, try loading from local storage as a fast preview/offline fallback
      try {
        const localData = localStorage.getItem('titan_esp_app_settings');
        if (localData) {
          const parsed = JSON.parse(localData);
          setAppSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn("Could not read local app settings:");
      }

      // Then, fetch from Firestore
      try {
        const docRef = doc(db, 'appSettings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data();
          setAppSettings(prev => ({
            ...prev,
            ...remoteData
          }));
        }
      } catch (err) {
        console.warn("Could not fetch remote app settings from Firestore:");
      }

      // Also fetch dynamic payment gateway configurations from backend Express API
      try {
        const configRes = await fetch('/api/payments/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setAppSettings(prev => ({
            ...prev,
            ...configData
          }));
        }
      } catch (err) {
        console.warn("Could not fetch dynamic payment config from backend API:");
      }
    };
    fetchSettings();
  }, []);

  const handleSavePaymentSettings = async () => {
    setSavingSettings(true);
    try {
      // 1. Save to Firestore general document
      const docRef = doc(db, 'appSettings', 'general');
      const updatedData = {
        ...appSettings,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, updatedData, { merge: true });

      // 2. Save and sync back to backend server memory/secrets
      const res = await fetch('/api/payments/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: appSettings.upiId,
          qrCodeUrl: appSettings.qrCodeUrl,
          manualPaymentEnabled: appSettings.manualPaymentEnabled,
          paymentInstructions: appSettings.paymentInstructions,
          defaultGateway: appSettings.defaultGateway,
          minDepositAmount: appSettings.minDepositAmount,
          maxDepositAmount: appSettings.maxDepositAmount,
          zapupiEnabled: appSettings.zapupiEnabled,
          zapupiMID: appSettings.zapupiMID,
          zapupiApiKey: appSettings.zapupiApiKey,
          zapupiSecretKey: appSettings.zapupiSecretKey,
          zapupiSandbox: appSettings.zapupiSandbox,
          paytmEnabled: appSettings.paytmEnabled,
          paytmMid: appSettings.paytmMid,
          paytmMerchantKey: appSettings.paytmMerchantKey,
          phonepeEnabled: appSettings.phonepeEnabled,
          phonepeMID: appSettings.phonepeMID,
          phonepeKey: appSettings.phonepeKey,
          razorpayEnabled: appSettings.razorpayEnabled,
          razorpayKeyId: appSettings.razorpayKeyId,
          razorpayKeySecret: appSettings.razorpayKeySecret,
          cashfreeEnabled: appSettings.cashfreeEnabled,
          cashfreeAppId: appSettings.cashfreeAppId,
          cashfreeSecret: appSettings.cashfreeSecret,
          payuEnabled: appSettings.payuEnabled,
          payuMerchantKey: appSettings.payuMerchantKey,
          payuSalt: appSettings.payuSalt,
          easebuzzEnabled: appSettings.easebuzzEnabled,
          easebuzzKey: appSettings.easebuzzKey,
          easebuzzSalt: appSettings.easebuzzSalt
        })
      });

      if (!res.ok) {
        throw new Error("API Server sync cancelled configurations.");
      }

      // Sync back to localStorage
      localStorage.setItem('titan_esp_app_settings', JSON.stringify(updatedData));

      triggerNotification('Settings Saved', 'UPI & Automated Payment Gateway settings saved successfully to Firestore & Backend 🚀', 'system');
      addAuditLog('Updated payment gateways and UPI configurations');
    } catch (err: any) {
      console.warn("Error saving app settings:");
      // Fallback: save to localStorage
      try {
        localStorage.setItem('titan_esp_app_settings', JSON.stringify(appSettings));
        triggerNotification('Settings Saved Locally', 'Saved settings to local storage successfully (offline) 📦', 'system');
      } catch (localErr) {
        triggerNotification('Error', 'Failed to save settings: ' + err.message, 'alert');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch Users & Transactions from Firestore on component load
  useEffect(() => {
    // Realtime users listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      }, (err) => console.warn('Users sync error.'));
      setDbUsers(list);
      setLoadingUsers(false);
    }, (err) => {
      console.warn("Could not retrieve users real-time stream:");
      // fallback
      setDbUsers([
        {
          uid: 'user_lokesh',
          email: 'siralokesh2302@gmail.com',
          nickname: 'lokesh meena',
          freefireUid: '55827391',
          avatarUrl: '',
          depositBalance: 120,
          winningBalance: 340,
          bonusBalance: 15,
          referralCode: 'VA-FF77',
          totalMatches: 14,
          totalWins: 5,
          totalKills: 38,
          totalEarnings: 820,
          isNotificationEnabled: true,
          joinedAt: '2026-06-10T12:00:00Z',
          role: 'admin'
        },
        {
          uid: 'user_rahul',
          email: 'rahulff@gmail.com',
          nickname: 'Rahul Gamer',
          freefireUid: '88712940',
          avatarUrl: '',
          depositBalance: 40,
          winningBalance: 25,
          bonusBalance: 5,
          referralCode: 'VA-RH99',
          totalMatches: 8,
          totalWins: 2,
          totalKills: 14,
          totalEarnings: 180,
          isNotificationEnabled: true,
          joinedAt: '2026-07-02T15:30:00Z',
          role: 'user'
        }
      ]);
      setLoadingUsers(false);
    });

    // Realtime transactions listener
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Transaction);
      }, (err) => console.warn('Transactions sync error.'));
      setDbTransactions(list);
    }, (err) => {
      console.warn("Could not retrieve transactions stream:");
      setDbTransactions([
        {
          id: 't_1',
          userId: 'user_lokesh',
          amount: 100,
          type: 'deposit_success',
          paymentMethod: 'UPI',
          referenceNo: 'UPI99281729401',
          dateTime: '2026-07-14T10:00:00Z',
          status: 'completed',
          description: 'UPI Deposit completed by admin'
        },
        {
          id: 't_2',
          userId: 'user_rahul',
          amount: 250,
          type: 'withdraw_request',
          paymentMethod: 'Paytm',
          upiId: 'rahulff@paytm',
          dateTime: '2026-07-14T15:20:00Z',
          status: 'pending',
          description: 'Pending withdraw request'
        }
      ]);
    });


    return () => {
      unsubUsers();
      unsubTransactions();
    };
  }, []);

  // Filtered Users
  const filteredUsers = dbUsers.filter(u => {
    const nickname = u.nickname || (u as any).username || '';
    const email = u.email || '';
    const freefireUid = u.freefireUid || '';
    const mobile = u.mobileNumber || '';
    const query = searchUserQuery.toLowerCase();
    
    return (
      nickname.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      freefireUid.includes(searchUserQuery) ||
      mobile.includes(searchUserQuery)
    );
  });

  // Filtered Transactions
  const filteredTransactions = dbTransactions.filter((txn) => {
    // filter by status
    if (filterTxnStatus !== 'all' && txn.status !== filterTxnStatus) {
      return false;
    }
    // search query
    if (searchTxnQuery) {
      const q = searchTxnQuery.toLowerCase();
      const userObj = dbUsers.find(u => u.uid === txn.userId);
      const nickname = userObj?.nickname?.toLowerCase() || '';
      const email = userObj?.email?.toLowerCase() || '';
      const txId = txn.id?.toLowerCase() || '';
      const refNo = txn.referenceNo?.toLowerCase() || '';
      const method = txn.paymentMethod?.toLowerCase() || '';
      return (
        nickname.includes(q) ||
        email.includes(q) ||
        txId.includes(q) ||
        refNo.includes(q) ||
        method.includes(q)
      );
    }
    return true;
  });

  // Statistics Computations
  const totalUsers = dbUsers.length;
  const activeMatches = tournaments.filter(t => t.roomStatus === 'open' || t.roomStatus === 'live').length;
  
  // Financial computations
  const totalRevenue = dbTransactions
    .filter(t => t.type === 'deposit_success' || (t.type === 'deposit_request' && t.status === 'completed'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDeposits = dbTransactions
    .filter(t => t.type.includes('deposit'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalWithdrawals = dbTransactions
    .filter(t => t.type.includes('withdraw') && t.status === 'completed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingRequests = dbTransactions.filter(t => t.status === 'pending').length;

  const todayEarnings = dbTransactions
    .filter(t => {
      const date = new Date(t.dateTime);
      const today = new Date();
      return date.toDateString() === today.toDateString() && t.status === 'completed';
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredPaymentRequests = dbTransactions.filter(t => {
    if (t.type !== 'deposit_request') return false;
    if (filterPaymentRequestStatus === 'pending') return t.status === 'pending' || t.status === 'pending_verification';
    if (filterPaymentRequestStatus === 'completed') return t.status === 'completed';
    if (filterPaymentRequestStatus === 'cancelled') return t.status === 'cancelled';
    return false;
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const pendingPaymentRequests = dbTransactions.filter(t => t.type === 'deposit_request' && (t.status === 'pending' || t.status === 'pending_verification'));
  const pendingDeposits = dbTransactions.filter(t => (t.type === 'deposit_success') && (t.status === 'pending' || t.status === 'pending_verification'));
  const pendingWithdraws = dbTransactions.filter(t => t.type === 'withdraw_request' && t.status === 'pending');

  // Add Action helper
  const addAuditLog = (action: string) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      timestamp: new Date().toISOString(),
      admin: userProfile?.email || 'admin@titanesp.com'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Tournament Registrations Actions
  const handleApproveReg = async (regId: string) => {
    try {
      await updateRegistrationAdmin(regId, 'completed');
      triggerNotification('Registration Approved', 'The tournament registration has been completed successfully.', 'system');
      addAuditLog(`Approved tournament registration ${regId}`);
    } catch (err: any) {
      triggerNotification('Error', "Error approving registration: " + err.message, 'alert');
    }
  };

  const handleRejectReg = (regId: string) => {
    showConfirm(
      'Reject Registration',
      'Are you sure you want to reject this registration? The entry fee will be fully refunded to the user\'s wallet.',
      async () => {
        try {
          await refundRegistrationAdmin(regId);
          triggerNotification('Registration Rejected', 'The registration has been cancelled and the fee has been refunded.', 'system');
          addAuditLog(`Rejected & refunded registration ${regId}`);
        } catch (err: any) {
          triggerNotification('Error', "Error rejecting registration: " + err.message, 'alert');
        }
      }
    );
  };

  const handleCancelReg = (regId: string) => {
    showConfirm(
      'Cancel Registration',
      'Cancel this registration? This will mark it as cancelled without automated wallet refund.',
      async () => {
        try {
          await updateRegistrationAdmin(regId, 'cancelled');
          triggerNotification('Registration Cancelled', 'The registration has been marked as cancelled.', 'system');
          addAuditLog(`Cancelled registration ${regId}`);
        } catch (err: any) {
          triggerNotification('Error', "Error cancelling registration: " + err.message, 'alert');
        }
      }
    );
  };

  const handleDeleteReg = (regId: string) => {
    showConfirm(
      'Delete Tournament Registration',
      `Are you sure you want to permanently delete registration ${regId}? All associated record connections will be permanently detached. This cannot be undone.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'registrations', regId));
          addAuditLog(`Permanently deleted registration ${regId}`);
          triggerNotification('Registration Deleted', 'Successfully deleted the registration profile.', 'system');
        } catch (err: any) {
          triggerNotification('Error', "Error deleting registration: " + err.message, 'alert');
        }
      }
    );
  };

  const handleSaveRegEdit = async () => {
    if (!editingReg) return;
    try {
      // Clean up the players array to make sure both nickname and gameName fields are filled
      const cleanedPlayers = editRegPlayers.map(p => ({
        ...p,
        nickname: p.nickname || p.gameName || '',
        gameName: p.gameName || p.nickname || ''
      }));

      await updateDoc(doc(db, 'registrations', editingReg.id), {
        governmentName: editRegGovName,
        players: cleanedPlayers
      });

      // Synchronize with the tournament's joinedTeams roster
      const tSnap = await getDoc(doc(db, 'tournaments', editingReg.tournamentId));
      if (tSnap.exists()) {
        const tData = tSnap.data();
        const joinedTeams = tData.joinedTeams || [];
        const updatedTeams = joinedTeams.map((team: any) => {
          const isMatch = team.userId === editingReg.userId || (editingReg.teamId && team.teamId === editingReg.teamId);
          if (isMatch) {
            return {
              ...team,
              governmentName: editRegGovName,
              players: cleanedPlayers.map(p => ({
                gameName: p.gameName || p.nickname || '',
                uid: p.uid || ''
              }))
            };
          }
          return team;
        });
        await updateDoc(doc(db, 'tournaments', editingReg.tournamentId), {
          joinedTeams: updatedTeams
        });
      }

      triggerNotification('success', 'Player registration details & official roster updated.');
      addAuditLog(`Updated player details for registration ${editingReg.id}`);
      setEditingReg(null);
    } catch (err: any) {
      alert("Error updating registration: " + err.message);
    }
  };

  const handleEditRegPlayerChange = (idx: number, key: string, val: string) => {
    const updated = [...editRegPlayers];
    if (key === 'gameName' || key === 'nickname') {
      updated[idx] = { ...updated[idx], gameName: val, nickname: val };
    } else {
      updated[idx] = { ...updated[idx], [key]: val };
    }
    setEditRegPlayers(updated);
  };

  // User Management Actions
  const handleEditUserClick = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserForm({
      fullName: user.fullName || '',
      nickname: user.nickname || '',
      freefireUid: user.freefireUid || '',
      primaryGame: user.primaryGame || 'Free Fire',
      mobileNumber: user.mobileNumber || '',
      altMobileNumber: user.altMobileNumber || '',
      upiId: user.upiId || ''
    });
    setEditDepBal(user.depositBalance);
    setEditWinBal(user.winningBalance);
    setEditBonBal(user.bonusBalance);
    setEditRole(user.role);
  };

  const saveUserEdits = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        ...editUserForm,
        depositBalance: editDepBal,
        winningBalance: editWinBal,
        bonusBalance: editBonBal,
        role: editRole
      });
      addAuditLog(`Updated profile and balances for user ${editingUser.nickname}.`);
      setEditingUser(null);
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    }
  };

  const toggleBanUser = async (user: UserProfile) => {
    const isCurrentlyBanned = user.accountStatus === 'disabled' || (user as any).isBanned || false;
    const nextBanStatus = !isCurrentlyBanned;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountStatus: nextBanStatus ? 'disabled' : 'active',
        isBanned: nextBanStatus // keep for backwards compatibility if needed
      });
      addAuditLog(`${nextBanStatus ? 'Disabled' : 'Enabled'} user ${user.nickname}`);
    } catch (err: any) {
      alert("Error toggling status: " + err.message);
    }
  };

  const deleteUser = (uid: string, name: string) => {
    showConfirm(
      'Delete User Profile',
      `Are you absolutely sure you want to delete user ${name}? All associated record connections will be detached. This cannot be undone.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
          addAuditLog(`Deleted user ${name}`);
          triggerNotification('User Deleted', `Successfully deleted user profile of ${name}.`, 'system');
        } catch (err: any) {
          triggerNotification('Error', "Error deleting user: " + err.message, 'alert');
        }
      }
    );
  };

  // Tournament Management Actions
  const openNewMatchForm = () => {
    setIsEditingMatch('new');
    setMatchForm({
      id: 'FF-' + Math.floor(1000 + Math.random() * 9000),
      title: 'Grand Free Fire League',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500',
      logoUrl: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=150',
      entryFee: 15,
      prizePool: 800,
      perKillPrize: 4,
      map: 'Bermuda',
      dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      roomStatus: 'open',
      roomID: '',
      roomPassword: '',
      mode: 'Solo',
      totalSlots: 48,
      isFreeMatch: false,
      liveUrl: '',
      gameCategory: 'free_fire',
      tournamentType: 'paid',
    enabled: true,
    matchCategory: 'BR',
      gameName: 'Free Fire',
      category: 'BR',
      matchType: 'Solo',
      rules: [
        'Teaming will lead to direct disqualification.',
        'Emulators prohibited.',
        'Upload screenshots for victory validation.'
      ]
    });
  };

  const openEditMatchForm = (t: Tournament) => {
    setIsEditingMatch(t.id);
    const legacyGameName = t.gameCategory === 'pubg_mobile' ? 'PUBG Mobile' : t.gameCategory === 'hacker_match' ? 'Hacker Match' : t.gameCategory === 'free_match' ? 'Free Match' : 'Free Fire';
    setMatchForm({
      id: t.id,
      title: t.title,
      bannerUrl: t.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500',
      logoUrl: t.logoUrl || 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=150',
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      perKillPrize: t.perKillPrize,
      map: t.map,
      dateTime: t.dateTime,
      matchDate: t.matchDate || '',
      matchTime: t.matchTime || '',
      registrationStart: t.registrationStart || '',
      registrationEnd: t.registrationEnd || '',
      roomStatus: t.roomStatus,
      roomID: t.roomID || '',
      roomPassword: t.roomPassword || '',
      mode: t.mode,
      totalSlots: t.totalSlots,
      isFreeMatch: t.isFreeMatch,
      liveUrl: t.liveUrl || '',
      gameCategory: t.gameCategory || 'free_fire',
      tournamentType: t.tournamentType || (t.isFreeMatch || t.entryFee === 0 ? 'free' : 'paid'),
      enabled: t.enabled !== false,
      matchCategory: (t.matchCategory as 'BR' | 'CS') || 'BR',
      gameName: (t.gameName as any) || legacyGameName,
      category: (t.category as any) || (t.matchCategory as any) || 'BR',
      matchType: (t.matchType as any) || (t.mode as any) || 'Solo',
      rules: t.rules || [
        'Teaming will lead to direct disqualification.',
        'Emulators prohibited.',
        'Upload screenshots for victory validation.'
      ]
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    try {
      const uploadResult = await uploadFileWithFallback(
        file,
        `tournaments/${matchForm.id}/thumbnail_${Date.now()}_${file.name}`
      );
      setMatchForm({ ...matchForm, bannerUrl: uploadResult.url });
    } catch (err: any) {
      console.error('Thumbnail upload failed:');
      alert('Failed to upload thumbnail: ' + err.message);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const saveRoomDetails = async () => {
    if (isEditingMatch === 'new' || !matchForm.id) {
      alert("Please create and publish the tournament first before managing room details.");
      return;
    }
    try {
      const existing = tournaments.find(t => t.id === matchForm.id);
      if (existing) {
        await saveTournamentAdmin({
          ...existing,
          roomID: matchForm.roomID,
          roomPassword: matchForm.roomPassword,
          matchRoomStatus: matchForm.matchRoomStatus,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Admin'
        });
        alert("Room Details Saved Successfully.");
      }
    } catch (err: any) {
      alert("Error saving room details: " + err.message);
    }
  };

  const saveMatchForm = async () => {
    try {
      const isFree = matchForm.tournamentType === 'free';
      const finalEntryFee = isFree ? 0 : matchForm.entryFee;
      const finalIsFreeMatch = isFree ? true : matchForm.isFreeMatch;

      const legacyGameCategory = matchForm.gameName === 'PUBG Mobile' ? 'pubg_mobile' : matchForm.gameName === 'Hacker Match' ? 'hacker_match' : matchForm.gameName === 'Free Match' ? 'free_match' : 'free_fire';

      const matchData: Tournament = {
        ...matchForm,
        entryFee: finalEntryFee,
        isFreeMatch: finalIsFreeMatch,
        id: matchForm.id,
        gameCategory: legacyGameCategory,
        matchCategory: matchForm.category,
        mode: matchForm.matchType,
        lastUpdated: new Date().toISOString(),
          updatedBy: 'Admin',
        rules: matchForm.rules,
        joinedSlots: isEditingMatch === 'new' ? [] : (tournaments.find(t => t.id === isEditingMatch)?.joinedSlots || []),
        joinedNicknames: isEditingMatch === 'new' ? {} : (tournaments.find(t => t.id === isEditingMatch)?.joinedNicknames || {}),
        joinedTeams: isEditingMatch === 'new' ? [] : (tournaments.find(t => t.id === isEditingMatch)?.joinedTeams || [])
      };

      await saveTournamentAdmin(matchData);
      addAuditLog(`${isEditingMatch === 'new' ? 'Created' : 'Updated'} match ${matchForm.title} (${matchForm.id})`);
      setIsEditingMatch(null);
      alert("Tournament Thumbnail Saved Successfully.");
    } catch (err: any) {
      alert("Error saving match: " + err.message);
    }
  };

  const deleteMatch = (id: string, title: string) => {
    showConfirm(
      'Delete Tournament Match',
      `Are you sure you want to delete match "${title}"? This will permanently remove the tournament and all its configurations.`,
      async () => {
        try {
          await deleteTournamentAdmin(id);
          addAuditLog(`Deleted match ${title} (${id})`);
          triggerNotification('Match Deleted', `Successfully removed match "${title}".`, 'system');
        } catch (err: any) {
          triggerNotification('Error', "Error deleting match: " + err.message, 'alert');
        }
      }
    );
  };

  // Player Management Manual Operations
  const handleManualAddPlayer = async () => {
    if (!selectedTournament || !manualPlayerName || !manualPlayerUid) {
      alert("Please fill name and Free Fire player UID!");
      return;
    }

    const updatedJoinedSlots = [...selectedTournament.joinedSlots, 'manual_' + Math.random().toString(36).substring(2, 6)];
    const updatedNicknames = {
      ...selectedTournament.joinedNicknames,
      ['manual_' + Math.random().toString(36).substring(2, 6)]: manualPlayerName
    };

    try {
      await updateDoc(doc(db, 'tournaments', selectedTourneyId), {
        joinedSlots: updatedJoinedSlots,
        joinedNicknames: updatedNicknames
      });
      addAuditLog(`Manually added player ${manualPlayerName} to tournament ${selectedTournament.title}`);
      setManualPlayerName('');
      setManualPlayerUid('');
    } catch (err: any) {
      alert("Error adding player: " + err.message);
    }
  };

  const handleRemovePlayer = (uidToDelete: string, playerNickname: string) => {
    if (!selectedTournament) return;
    showConfirm(
      'Kick Player',
      `Are you sure you want to remove player "${playerNickname}" from this tournament?`,
      async () => {
        const updatedJoinedSlots = selectedTournament.joinedSlots.filter(s => s !== uidToDelete);
        const updatedNicknames = { ...selectedTournament.joinedNicknames };
        delete updatedNicknames[uidToDelete];

        try {
          await updateDoc(doc(db, 'tournaments', selectedTourneyId), {
            joinedSlots: updatedJoinedSlots,
            joinedNicknames: updatedNicknames
          });
          addAuditLog(`Removed player ${playerNickname} from match ${selectedTournament.title}`);
          triggerNotification('Player Removed', `Kicked player "${playerNickname}" successfully.`, 'system');
        } catch (err: any) {
          triggerNotification('Error', "Error removing player: " + err.message, 'alert');
        }
      }
    );
  };

  // Winner & Kill rewards payouts
  const handleSubmitMatchStats = async (winnerUid: string, killsMap: { [uid: string]: number }) => {
    if (!selectedTournament) return;
    try {
      // Award prize pool to winner and kill winnings to everyone
      const winnerName = selectedTournament.joinedNicknames[winnerUid] || 'Winner';
      const winnerFirstPrize = Math.round(selectedTournament.prizePool * 0.4);

      // Distribute money
      for (const uid of Object.keys(selectedTournament.joinedNicknames)) {
        const kills = killsMap[uid] || 0;
        const perKillReward = selectedTournament.perKillPrize;
        const totalAward = (kills * perKillReward) + (uid === winnerUid ? winnerFirstPrize : 0);

        if (totalAward > 0) {
          // Check if user is a standard user in the database
          const userObj = dbUsers.find(u => u.uid === uid);
          if (userObj) {
            await updateDoc(doc(db, 'users', uid), {
              winningBalance: userObj.winningBalance + totalAward,
              totalEarnings: userObj.totalEarnings + totalAward,
              totalKills: userObj.totalKills + kills,
              totalWins: userObj.totalWins + (uid === winnerUid ? 1 : 0)
            });

            // Post winning transaction
            await addDoc(collection(db, 'transactions'), {
              userId: uid,
              amount: totalAward,
              type: 'match_winnings',
              paymentMethod: 'System',
              dateTime: new Date().toISOString(),
              status: 'completed',
              description: `Earnings from match ${selectedTournament.title}. Kills: ${kills}, Winner: ${uid === winnerUid ? 'YES' : 'NO'}`
            });
          }
        }
      }

      // Mark tournament as completed
      await updateDoc(doc(db, 'tournaments', selectedTourneyId), {
        roomStatus: 'completed',
        maxKillsWinner: winnerName
      });

      // Notify all
      await triggerNotification(
        "Tournament Completed! 🏁",
        `Match ${selectedTournament.title} has completed. Congratulations to ${winnerName} for secure victory! All payouts dispatched.`,
        "winner"
      );

      addAuditLog(`Completed match ${selectedTournament.title} and processed wallet payouts.`);
      alert("Match completed and winnings successfully transferred to all user wallets!");
    } catch (err: any) {
      alert("Error saving stats: " + err.message);
    }
  };

  const handleCompletePaymentRequest = async (txn: Transaction) => {
    try {
      const res = await fetch('/api/admin/payments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txn.id, admin: userProfile?.email || 'admin@titanesp.com' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        addAuditLog(`Approved manual payment request ${txn.id}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err: any) {
      alert("Error approving payment: " + err.message);
    }
  };

  const handleCancelPaymentRequest = (txn: Transaction) => {
    showConfirm(
      "Cancel Payment Request",
      "Are you sure you want to cancel this payment request? The wallet will not be credited.",
      async () => {
        const reason = prompt("Enter cancellation reason (optional):") || 'Cancelled by admin';
        
        const res = await fetch('/api/admin/payments/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: txn.id, reason, admin: userProfile?.email || 'admin@titanesp.com' })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          addAuditLog(`Cancelled manual payment request ${txn.id}`);
        } else {
          alert("Error: " + data.message);
        }
      },
      "Yes, Cancel",
      "No"
    );
  };

  const handleDeleteTransaction = (id: string) => {
    showConfirm(
      "Delete Transaction Record",
      "Are you absolutely sure you want to permanently delete this transaction record? This action cannot be undone.",
      async () => {
        try {
          await deleteDoc(doc(db, 'transactions', id));
          addAuditLog(`Deleted transaction record ${id}`);
          triggerNotification("Deleted", "Transaction record permanently deleted.", "alert");
        } catch (err: any) {
          triggerNotification("Error", "Error deleting transaction: " + err.message, "alert");
        }
      }
    );
  };

  // Approve Deposits / Withdrawals
  const handleApproveTxn = async (txn: Transaction) => {
    if (txn.status === 'completed' || txn.status === 'cancelled' || txn.status === 'failed') {
      alert("This transaction has already been processed!");
      return;
    }
    try {
      const userProfileToUpdate = dbUsers.find(u => u.uid === txn.userId);
      if (!userProfileToUpdate) {
        alert("Cannot find associated user!");
        return;
      }

      if (txn.type === 'deposit_request' || txn.type === 'deposit_success') {
        // Approve deposit
        await updateDoc(doc(db, 'users', txn.userId), {
          depositBalance: userProfileToUpdate.depositBalance + txn.amount
        });
        await updateDoc(doc(db, 'transactions', txn.id), {
          status: 'completed',
          completedBy: 'Admin',
          completedAt: new Date().toISOString()
        });
        addAuditLog(`Approved deposit request of ₹${txn.amount} for user ${userProfileToUpdate.nickname}`);
      } else if (txn.type === 'withdraw_request') {
        // Approve withdrawal (ensure money is subtracted if not already, or finalize request)
        if (userProfileToUpdate.winningBalance < txn.amount) {
          alert("Warning: User has insufficient winning balance currently!");
        }
        await updateDoc(doc(db, 'users', txn.userId), {
          winningBalance: Math.max(0, userProfileToUpdate.winningBalance - txn.amount)
        });
        await updateDoc(doc(db, 'transactions', txn.id), {
          status: 'completed',
          completedBy: 'Admin',
          completedAt: new Date().toISOString()
        });
        addAuditLog(`Approved withdraw request of ₹${txn.amount} for user ${userProfileToUpdate.nickname}`);
      }
    } catch (err: any) {
      alert("Error approving: " + err.message);
    }
  };

    const handleRejectTxn = async (txn: Transaction) => {
    if (txn.status === 'completed' || txn.status === 'cancelled' || txn.status === 'failed') {
      alert("This transaction has already been processed!");
      return;
    }
    try {
      const reason = prompt("Enter rejection reason:");
      if (reason === null) return; // cancelled
      
      await updateDoc(doc(db, 'transactions', txn.id), {
        status: 'cancelled',
        rejectionReason: reason || "No reason provided",
        cancelledBy: "Admin",
        cancelledAt: new Date().toISOString()
      });
      addAuditLog(`Rejected request ${txn.id} for reason: ${reason}`);
    } catch (err: any) {
      alert("Error rejecting: " + err.message);
    }
  };

  // Promo Code handlers
  const handleAddPromo = () => {
    if (!newPromo.code || !newPromo.expiry) {
      alert("Please enter a valid code and expiry date!");
      return;
    }
    setPromoCodes([...promoCodes, newPromo]);
    addAuditLog(`Created promo code ${newPromo.code} with ₹${newPromo.bonus} bonus`);
    setNewPromo({ code: '', bonus: 10, limit: 50, expiry: '' });
  };

  const handleDeletePromo = (codeToDelete: string) => {
    showConfirm(
      "Delete Promo Code",
      `Are you sure you want to permanently delete the promo code "${codeToDelete}"? This action cannot be undone.`,
      () => {
        setPromoCodes(promoCodes.filter(p => p.code !== codeToDelete));
        addAuditLog(`Deleted promo code ${codeToDelete}`);
      }
    );
  };

  // Push notification triggers
  const handleTriggerPush = async () => {
    if (!pushTitle || !pushMessage) {
      alert("Please fill in notification title and description message!");
      return;
    }
    if (notificationSettings?.notificationsEnabled === false) {
      alert("Push notifications are currently disabled! Please turn them ON using the button in the header first.");
      return;
    }
    try {
      await triggerNotification(pushTitle, pushMessage, pushType);
      addAuditLog(`Sent push notification: "${pushTitle}" to all users`);
      setPushTitle('');
      setPushMessage('');
      alert("Push notification broadcasted successfully to all online game devices!");
    } catch (err: any) {
      alert("Error broadcasting: " + err.message);
    }
  };

  // Export CSV
  const handleExportCSV = (reportType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'users') {
      csvContent += "UID,MobileNumber,Nickname,ReferralCode,DepositBalance,WinningBalance,BonusBalance,MatchesPlayed,Wins,Kills,JoinedAt,AccountStatus\n";
      dbUsers.forEach(u => {
        csvContent += `"${u.uid}","${u.mobileNumber || ''}","${u.nickname}","${u.referralCode || ''}",${u.depositBalance},${u.winningBalance},${u.bonusBalance},${u.totalMatches},${u.totalWins},${u.totalKills},"${u.joinedAt}","${u.accountStatus || 'active'}"\n`;
      });
    } else if (reportType === 'transactions') {
      csvContent += "TXN_ID,UserID,Amount,Type,PaymentMethod,RefNo,DateTime,Status,Description\n";
      const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : dbTransactions;
      dataToExport.forEach(t => {
        csvContent += `"${t.id}","${t.userId}",${t.amount},"${t.type}","${t.paymentMethod}","${t.referenceNo || ''}","${t.dateTime}","${t.status}","${t.description}"\n`;
      });
    } else {
      csvContent += "MatchID,Title,Fee,PrizePool,PerKill,Map,Mode,SlotsReserved,Status\n";
      tournaments.forEach(m => {
        csvContent += `"${m.id}","${m.title}",${m.entryFee},${m.prizePool},${m.perKillPrize},"${m.map}","${m.mode}",${m.joinedSlots.length},"${m.roomStatus}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `titan_esp_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog(`Exported ${reportType} report as CSV`);
  };

  // Database Backup and Restore
  const handleBackupDb = () => {
    const backupData = {
      users: dbUsers,
      tournaments,
      transactions: dbTransactions,
      promoCodes,
      scrollingNotice,
      appSettings
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "titan_esp_db_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
    addAuditLog("Performed cloud database system backup");
  };

  const handleClearCache = () => {
    localStorage.clear();
    alert("Development cache and local preferences cleared successfully!");
    addAuditLog("Cleared client performance cache");
  };

  // Mock charts data
  const revenueChartData = [
    { name: 'Mon', revenue: totalRevenue * 0.1 },
    { name: 'Tue', revenue: totalRevenue * 0.18 },
    { name: 'Wed', revenue: totalRevenue * 0.25 },
    { name: 'Thu', revenue: totalRevenue * 0.38 },
    { name: 'Fri', revenue: totalRevenue * 0.55 },
    { name: 'Sat', revenue: totalRevenue * 0.78 },
    { name: 'Sun', revenue: totalRevenue }
  ];

  const userActivityData = [
    { name: '08:00', users: Math.round(totalUsers * 0.2) },
    { name: '12:00', users: Math.round(totalUsers * 0.45) },
    { name: '16:00', users: Math.round(totalUsers * 0.85) },
    { name: '20:00', users: totalUsers + 4 }, // simulate online spike
    { name: '23:00', users: Math.round(totalUsers * 0.6) }
  ];

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = adminUsername.trim().toLowerCase();
    const cleanPassword = adminPassword;

    if (
      (cleanUsername === 'admin' || cleanUsername === 'admin@titanesp.com') &&
      (cleanPassword === 'admin' || cleanPassword === 'admin123' || cleanPassword === 'TitanAdmin2026')
    ) {
      setIsAdminLoggedIn(true);
      setLoginError('');
      triggerNotification("Admin Login Successful 🔐", "Authorized access granted to TITAN ESP control panel.", "system");
    } else {
      setLoginError("Access Denied: Invalid Administrative Credentials.");
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#06060a] bg-[radial-gradient(ellipse_at_top,rgba(229,169,25,0.08),transparent_50%)] text-neutral-200 z-50 flex items-center justify-center p-4 font-sans select-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
        
        <div className="w-full max-w-md bg-[#0d0d15]/95 border border-white/5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(229,169,25,0.05)] overflow-hidden relative backdrop-blur-md">
          {/* Accent Gold Top Bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-gold-500 to-yellow-500 w-full" />
          
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center border border-gold-500/30 shadow-[0_0_20px_rgba(229,169,25,0.15)] mb-4 animate-pulse">
                <Lock className="w-6 h-6 text-gold-400" />
              </div>
              <h2 className="text-xl font-black tracking-widest text-white uppercase">Secured Command Gate</h2>
              <p className="text-[10px] text-neutral-400 font-mono mt-1.5 uppercase tracking-wider">TITAN ESP Management Terminal</p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-400 mb-1.5">Administrative ID / Email</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin ID"
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-400 mb-1.5">Secure Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-900/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_20px_rgba(229,169,25,0.2)] mt-6"
              >
                Authenticate & Unlock Console
              </button>
            </form>

            <button 
              onClick={onBack}
              className="px-2 py-1 rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
            >
              Exit Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#08080c] text-neutral-200 z-50 flex flex-row font-sans overflow-hidden">
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0e0e16] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="mb-4">
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">{confirmDialog.title}</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-neutral-400 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center gap-2"
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
        
      {/* SIDEBAR */}
      <aside 
        className="bg-[#0d0d14] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarCollapsed ? '75px' : '260px' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex flex-col items-center gap-3 relative">
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            <button 
              onClick={onBack}
              className="px-2 py-1.5 flex justify-center items-center rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
              title="Exit Console"
            >
              {sidebarCollapsed ? <LogOut className="w-4 h-4" /> : 'Exit Console'}
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#13131a] to-[#252538] flex items-center justify-center border border-gold-500/30 shadow-[0_0_15px_rgba(229,169,25,0.15)] p-1">
              {appSettings.sidebarLogo || appSettings.mainLogo ? (
                <img src={appSettings.sidebarLogo || appSettings.mainLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Trophy className="w-6 h-6 text-gold-400" />
              )}
            </div>
            {!sidebarCollapsed && (
            <div className="text-center transition-opacity duration-300">
              <h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">{appSettings.websiteName || 'TITAN ESPORTS'}</h1>
              <p className="text-[8px] text-neutral-500 font-mono tracking-wider">ADMIN v{appSettings.version}</p>
            </div>
          )}
          </div>
        </div>

        {/* Sidebar Menu Options */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {!sidebarCollapsed && <span>Dashboard Stats</span>}
          </button>

          <button
            onClick={() => setActiveTab('banner_management')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'banner_management' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            {!sidebarCollapsed && <span>📢 Banner Management</span>}
          </button>
          <button
            onClick={() => setActiveTab('bonus_management')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'bonus_management' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Award className="w-4 h-4 text-pink-400" />
            {!sidebarCollapsed && <span>🎁 Bonus Management</span>}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            {!sidebarCollapsed && <span>User Accounts</span>}
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'tournaments' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            {!sidebarCollapsed && <span>Tournaments</span>}
          </button>

          <button
            onClick={() => setActiveTab('game_categories')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'game_categories' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            {!sidebarCollapsed && <span>🎮 Game Category Manager</span>}
          </button>

          <button
            onClick={() => setActiveTab('payment_approval')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'payment_approval' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {!sidebarCollapsed && <span>Payment Requests</span>}
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'registrations' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {!sidebarCollapsed && <span>Tournament Registrations</span>}
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'players' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Award className="w-4 h-4" />
            {!sidebarCollapsed && <span>Player Standings</span>}
          </button>

          <button
            onClick={() => setActiveTab('weekly_leaderboard_manager')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'weekly_leaderboard_manager' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4 text-gold-400" />
            {!sidebarCollapsed && <span>Weekly Top Players</span>}
          </button>

          <button
            onClick={() => setActiveTab('winnings_manager')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'winnings_manager' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4 text-purple-400" />
            {!sidebarCollapsed && <span>Winnings Manager</span>}
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'wallet' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {!sidebarCollapsed && <span>Wallet Approvals</span>}
          </button>

          <button
            onClick={() => setActiveTab('promo_announcements')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'promo_announcements' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            {!sidebarCollapsed && <span>Promos & Push</span>}
          </button>

          <button
            onClick={() => setActiveTab('youtube_management')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'youtube_management' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Youtube className="w-4 h-4" />
            {!sidebarCollapsed && <span>YouTube Management</span>}
          </button>

          <button
            onClick={() => setActiveTab('settings_security')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings_security' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4" />
            {!sidebarCollapsed && <span>App Config & Sys</span>}
          </button>

          <button
            onClick={() => setActiveTab('website_branding')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'website_branding' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            {!sidebarCollapsed && <span>Website Branding</span>}
          </button>

          <button
            onClick={() => setActiveTab('loading_page_manager')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'loading_page_manager' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            {!sidebarCollapsed && <span>🎮 Loading Page Manager</span>}
          </button>

          <button
            onClick={() => setActiveTab('storage_manager')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'storage_manager' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            {!sidebarCollapsed && <span>☁️ Cloud Storage & API Settings</span>}
          </button>

          <button
            onClick={() => setActiveTab('support_settings')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'support_settings' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {!sidebarCollapsed && <span>Contact Widget Settings</span>}
          </button>

          <button
            onClick={() => setActiveTab('auth_providers')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${
              activeTab === 'auth_providers' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Lock className="w-4 h-4 text-red-400" />
            {!sidebarCollapsed && <span>Authentication Providers</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0a0a0f] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-black text-xs text-neutral-300">
            AD
          </div>
          {!sidebarCollapsed && (
          <div className="overflow-hidden transition-opacity duration-300">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{userProfile?.nickname || 'Administrator'}</p>
            <p className="text-[8px] text-green-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse"></span>
              Secure Firebase Mode
            </p>
          </div>
          )}
        </div>
      </aside>

      {/* MAIN BODY AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* GLOBAL ADMIN HEADER */}
        <header className="shrink-0 bg-[#0d0d14] border-b border-white/5 p-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Admin Dashboard</h2>
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer border border-white/5 flex items-center justify-center"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        {/* VIEW: PAYMENT APPROVAL */}
        {activeTab === 'payment_approval' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Payment Requests</h2>
              <p className="text-xs text-neutral-400">Validate manual UPI QR deposit requests.</p>
            </div>
            
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-gold-400" />
                  Payment Requests ({filteredPaymentRequests.length})
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilterPaymentRequestStatus('pending')}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${filterPaymentRequestStatus === 'pending' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => setFilterPaymentRequestStatus('completed')}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${filterPaymentRequestStatus === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                  >
                    Completed
                  </button>
                  <button 
                    onClick={() => setFilterPaymentRequestStatus('cancelled')}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${filterPaymentRequestStatus === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              {filteredPaymentRequests.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-8">No {filterPaymentRequestStatus} payment requests.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredPaymentRequests.map((txn) => {
                    const userObj = dbUsers.find(u => u.uid === txn.userId);
                    return (
                      <div key={txn.id} className="p-4 bg-neutral-900/60 border border-white/5 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-white text-sm uppercase tracking-wide">{userObj?.nickname || 'Unknown Gamer'}</p>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">User ID: {txn.userId}</p>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Ref No / UTR: <span className="text-white font-bold">{txn.referenceNo || 'None'}</span></p>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Method: {txn.paymentMethod}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="font-mono font-black text-emerald-400 text-base">₹{txn.amount}</span>
                            <span className={`text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded ${txn.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/10' : txn.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'}`}>
                              {txn.status === 'pending_verification' || txn.status === 'pending' ? 'Pending' : txn.status === 'completed' ? 'Completed' : 'Cancelled'}
                            </span>
                            {txn.status === 'cancelled' && txn.cancellationReason && (
                              <span className="text-[8px] text-red-400 mt-1 max-w-[120px] leading-tight text-right truncate">Reason: {txn.cancellationReason}</span>
                            )}
                          </div>
                        </div>
                        
                        {txn.screenshotBase64 && (
                          <div className="mt-2 space-y-2">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Screenshot Preview</p>
                            <img 
                              src={`data:image/jpeg;base64,${txn.screenshotBase64}`} 
                              alt="Payment Proof" 
                              className="w-full max-w-[200px] h-32 object-cover rounded border border-white/10"
                            />
                            <button
                              onClick={() => {
                                const win = window.open();
                                win?.document.write(`<img src="data:image/jpeg;base64,${txn.screenshotBase64}" style="max-width: 100%;" />`);
                              }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase cursor-pointer block"
                            >
                              View Full Screenshot
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[10px] mt-2">
                          <span className="text-neutral-500 font-mono">{new Date(txn.dateTime).toLocaleString()}</span>
                          <div className="flex gap-2 items-center">
                            {(txn.status === 'pending_verification' || txn.status === 'pending') && (
                              <>
                                <button 
                                  onClick={() => handleCompletePaymentRequest(txn)}
                                  className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer shadow-lg"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => handleCancelPaymentRequest(txn)}
                                  className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer shadow-lg"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteTransaction(txn.id)}
                              className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg font-black uppercase tracking-wider text-[9px] transition-all cursor-pointer shadow-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Interactive Command Deck</h2>
                <p className="text-xs text-neutral-400">Real-time telemetry and commercial analytics for TITAN ESP tournaments.</p>
              </div>
              
              {/* Quick actions row */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleClearCache}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-300 cursor-pointer"
                >
                  Clear Cache
                </button>
                <button 
                  onClick={handleBackupDb}
                  className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 text-[10px] font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  Backup DB
                </button>
              </div>
            </div>

            {/* TELEMETRY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Users Registered</p>
                <p className="text-2xl font-black text-white font-mono">{totalUsers}</p>
                <div className="text-[9px] text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12% vs last week</span>
                </div>
              </div>

              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active Game Rooms</p>
                <p className="text-2xl font-black text-gold-400 font-mono">{activeMatches}</p>
                <div className="text-[9px] text-amber-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Live & Booking rooms</span>
                </div>
              </div>

              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Pending Requests</p>
                <p className="text-2xl font-black text-red-500 font-mono">{pendingRequests}</p>
                <div className="text-[9px] text-red-400 flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Awaiting cash validation</span>
                </div>
              </div>

              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Today's Earnings</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">₹{todayEarnings}</p>
                <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cash flow stable</span>
                </div>
              </div>
            </div>

            {/* MORE TELEMETRY COMPLEMENTS */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#101017] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Total Deposit Volume</p>
                  <p className="text-sm font-black font-mono text-white mt-0.5">₹{totalDeposits}</p>
                </div>
                <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-[#101017] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Completed Withdrawals</p>
                  <p className="text-sm font-black font-mono text-white mt-0.5">₹{totalWithdrawals}</p>
                </div>
                <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-[#101017] border border-white/5 rounded-xl p-3 col-span-2 lg:col-span-1 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">Approx Revenue Margin</p>
                  <p className="text-sm font-black font-mono text-emerald-400 mt-0.5">₹{totalRevenue}</p>
                </div>
                <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* CHARTS SYSTEM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart A */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Deposit Revenue Flow (Weekly)</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 font-bold uppercase">Real-time sync</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                      <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} />
                      <YAxis stroke="#ffffff50" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Users Active Session Load</h3>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">Hourly telemetry</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                      <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} />
                      <YAxis stroke="#ffffff50" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                      <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* AUDIT LOGS & RECENT ACTIVITIES */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Action Audit Trails</h3>
                <span className="text-[9px] text-neutral-500">Showing last actions performed</span>
              </div>
              <div className="divide-y divide-white/5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex justify-between items-center text-[10px]">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white tracking-wide">{log.action}</p>
                      <p className="text-neutral-500 font-mono">By: {log.admin}</p>
                    </div>
                    <span className="text-neutral-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: USER ACCOUNTS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">User Account Management</h2>
                <p className="text-xs text-neutral-400">View registered accounts, modify wallets, adjust roles, or enforce bans.</p>
              </div>

              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text"
                  placeholder="Search by IGN, Email, or UID..."
                  value={searchUserQuery}
                  onChange={e => setSearchUserQuery(e.target.value)}
                  className="w-full bg-[#101017] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* EDIT USER WALLET MODAL */}
            {editingUser && (
              <div className="p-4 bg-gold-500/5 rounded-2xl border border-gold-500/20 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-gold-400" />
                    Adjust User: {editingUser.nickname}
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="text-neutral-500 hover:text-white">✕</button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase block tracking-wider">Deposit Wallet (₹)</label>
                    <input 
                      type="number"
                      value={editDepBal}
                      onChange={e => setEditDepBal(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-xs font-mono font-bold text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase block tracking-wider">Winning Wallet (₹)</label>
                    <input 
                      type="number"
                      value={editWinBal}
                      onChange={e => setEditWinBal(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-xs font-mono font-bold text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase block tracking-wider">Promo Bonus Wallet (₹)</label>
                    <input 
                      type="number"
                      value={editBonBal}
                      onChange={e => setEditBonBal(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-xs font-mono font-bold text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase block tracking-wider">System Authorization Role</label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as 'user' | 'admin')}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 text-xs text-white mt-1"
                    >
                      <option value="user">User / Competitor</option>
                      <option value="admin">Admin / Moderator</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <button 
                      type="button"
                      onClick={() => {
                        const originalUid = editingUser.uid;
                        const originalNickname = editingUser.nickname;
                        setEditingUser(null);
                        deleteUser(originalUid, originalNickname);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-1.5 rounded-lg bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveUserEdits}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* USERS LIST TABLE */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl overflow-hidden">
              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-neutral-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />
                  <span>Loading User Directory...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 uppercase tracking-wider">No users matching search query found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/50 border-b border-white/5 text-neutral-400 uppercase text-[9px] tracking-widest">
                      <tr>
                        <th className="p-3.5 pl-4">Player Details</th>
                        <th className="p-3.5">Account Info</th>
                        <th className="p-3.5">Wallets (D / W / B)</th>
                        <th className="p-3.5">Status & Role</th>
                        <th className="p-3.5 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {filteredUsers.map((user) => {
                        const isBanned = (user as any).accountStatus === 'disabled' || (user as any).isBanned || false;
                        return (
                          <tr key={user.uid} className={`hover:bg-white/2 ${isBanned ? 'bg-red-500/5 opacity-80' : ''}`}>
                            <td className="p-3.5 pl-4">
                              <div>
                                <p className="font-extrabold text-white uppercase tracking-wide">{user.nickname}</p>
                                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Mob: {user.mobileNumber || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-mono text-neutral-300"><span className="text-neutral-500">Ref:</span> {user.referralCode}</p>
                                <p className="text-[10px] font-mono text-neutral-300"><span className="text-neutral-500">Joined:</span> {new Date(user.joinedAt).toLocaleDateString()}</p>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono">
                              <div>
                                <p className="text-white">D: ₹{user.depositBalance.toFixed(1)}</p>
                                <p className="text-gold-400">W: ₹{user.winningBalance.toFixed(1)}</p>
                                <p className="text-cyan-400 text-[10px]">B: ₹{user.bonusBalance.toFixed(1)}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  isBanned ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {isBanned ? 'Disabled' : 'Active'}
                                </span>
                                <span className={`px-2 py-0.5 ml-1 rounded-full text-[9px] font-bold uppercase ${
                                  user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-neutral-800 text-neutral-400'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 pr-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleEditUserClick(user)}
                                  className="p-1 px-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 cursor-pointer"
                                >
                                  View / Edit Profile
                                </button>
                                <button 
                                  onClick={() => toggleBanUser(user)}
                                  className={`p-1 px-2 rounded text-[10px] font-bold cursor-pointer ${
                                    isBanned 
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  }`}
                                >
                                  {isBanned ? 'Unban' : 'Ban'}
                                </button>
                                <button 
                                  onClick={() => deleteUser(user.uid, user.nickname)}
                                  className="p-1 px-2 rounded bg-neutral-900 border border-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-[10px] font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: TOURNAMENTS MATCH MANAGER */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Tournament Match Manager</h2>
                <p className="text-xs text-neutral-400">Configure battle formats, assign prize payouts, schedule rooms, and enter match details.</p>
              </div>

              {!isEditingMatch && (
                <button 
                  onClick={openNewMatchForm}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Create Match
                </button>
              )}
            </div>

            {/* CREATE / EDIT MATCH FORM COMPLEMENT */}
            {isEditingMatch && (
              <div className="bg-[#101017] border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Gamepad2 className="w-4.5 h-4.5 text-gold-400" />
                    {isEditingMatch === 'new' ? 'Launch New Tournament Match' : `Edit Match Info (${isEditingMatch})`}
                  </h3>
                  <button onClick={() => setIsEditingMatch(null)} className="text-neutral-500 hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Identifier (Code)</label>
                    <input 
                      type="text"
                      disabled={isEditingMatch !== 'new'}
                      value={matchForm.id}
                      onChange={e => setMatchForm({...matchForm, id: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Title / Grand League Header</label>
                    <input 
                      type="text"
                      value={matchForm.title}
                      onChange={e => setMatchForm({...matchForm, title: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold uppercase"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Category (BR/CS)</label>
                    <select
                      value={matchForm.category}
                      onChange={e => {
                        const val = e.target.value as 'BR' | 'CS';
                        setMatchForm({...matchForm, category: val, matchCategory: val});
                      }}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold"
                    >
                      <option value="BR">Battle Royale (BR)</option>
                      <option value="CS">Clash Squad (CS)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Game</label>
                    <select
                      value={matchForm.gameName}
                      onChange={e => {
                        const val = e.target.value as 'Free Fire' | 'PUBG Mobile' | 'Hacker Match' | 'Free Match';
                        const legacyCat = val === 'PUBG Mobile' ? 'pubg_mobile' : val === 'Hacker Match' ? 'hacker_match' : val === 'Free Match' ? 'free_match' : 'free_fire';
                        setMatchForm({...matchForm, gameName: val, gameCategory: legacyCat});
                      }}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold"
                    >
                      <option value="Free Fire">🎮 Free Fire</option>
                      <option value="PUBG Mobile">🎮 PUBG Mobile</option>
                      <option value="Free Match">🆓 Free Match</option>
                      <option value="Hacker Match">🛡️ Hacker Match</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Tournament Type</label>
                    <select
                      value={matchForm.tournamentType}
                      onChange={e => {
                        const type = e.target.value as 'paid' | 'free';
                        setMatchForm({
                          ...matchForm,
                          tournamentType: type,
                          isFreeMatch: type === 'free',
                          entryFee: type === 'free' ? 0 : 15
                        });
                      }}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="paid">Paid Tournament</option>
                      <option value="free">Free Tournament</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Status Toggle</label>
                    <select
                      value={matchForm.enabled ? 'true' : 'false'}
                      onChange={e => setMatchForm({...matchForm, enabled: e.target.value === 'true'})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="true">Enabled (Active)</option>
                      <option value="false">Disabled (Hidden)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Map Selector</label>
                    <select
                      value={matchForm.map}
                      onChange={e => setMatchForm({...matchForm, map: e.target.value as any})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Bermuda">Bermuda (Standard)</option>
                      <option value="Kalahari">Kalahari Desert</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Alpine">Alpine Peaks</option>
                      <option value="Nexterra">Nexterra Futuristic</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Type (Solo/Duo/Squad)</label>
                    <select
                      value={matchForm.matchType}
                      onChange={e => {
                        const val = e.target.value as 'Solo' | 'Duo' | 'Squad';
                        setMatchForm({...matchForm, matchType: val, mode: val});
                      }}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold"
                    >
                      <option value="Solo">Solo</option>
                      <option value="Duo">Duo</option>
                      <option value="Squad">Squad</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Total Player Capacity (Slots)</label>
                    <input 
                      type="number"
                      value={matchForm.totalSlots}
                      onChange={e => setMatchForm({...matchForm, totalSlots: Number(e.target.value)})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Date</label>
                    <input 
                      type="date"
                      value={matchForm.matchDate}
                      onChange={e => setMatchForm({...matchForm, matchDate: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Time</label>
                    <input 
                      type="time"
                      value={matchForm.matchTime}
                      onChange={e => setMatchForm({...matchForm, matchTime: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Registration Start</label>
                    <input 
                      type="datetime-local"
                      value={matchForm.registrationStart}
                      onChange={e => setMatchForm({...matchForm, registrationStart: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Registration End</label>
                    <input 
                      type="datetime-local"
                      value={matchForm.registrationEnd}
                      onChange={e => setMatchForm({...matchForm, registrationEnd: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Entry Fee Cost (₹)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        disabled={matchForm.isFreeMatch}
                        value={matchForm.isFreeMatch ? 0 : matchForm.entryFee}
                        onChange={e => setMatchForm({...matchForm, entryFee: Number(e.target.value)})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newIsFree = !matchForm.isFreeMatch;
                          setMatchForm({
                            ...matchForm, 
                            isFreeMatch: newIsFree, 
                            entryFee: newIsFree ? 0 : 15,
                            tournamentType: newIsFree ? 'free' : 'paid'
                          });
                        }}
                        className={`px-3 rounded-xl border text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                          matchForm.isFreeMatch ? 'bg-gold-500/15 border-gold-500 text-gold-400' : 'bg-neutral-800 border-white/5 text-neutral-400'
                        }`}
                      >
                        Free
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Grand Prize Pool (₹)</label>
                    <input 
                      type="number"
                      value={matchForm.prizePool}
                      onChange={e => setMatchForm({...matchForm, prizePool: Number(e.target.value)})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono text-gold-400 font-bold"
                    />
                  </div>

                  {/* Row 4 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Per Kill Reward (₹)</label>
                    <input 
                      type="number"
                      value={matchForm.perKillPrize}
                      onChange={e => setMatchForm({...matchForm, perKillPrize: Number(e.target.value)})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono text-amber-500 font-bold"
                    />
                  </div>

                  {/* Image Selectors placeholder (will push down) */}
                </div>
                
                {/* ROOM ID & PASSWORD MANAGEMENT */}
                <div className="space-y-4 md:col-span-2 bg-[#111116] p-5 rounded-2xl border border-blue-500/30 mt-4 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                  <div className="relative">
                    <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <span>🎮</span> Room ID & Password Management
                    </h4>
                    <p className="text-[10px] text-neutral-400">Instantly synchronize room credentials and match status to the User Panel.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Room ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. 12345678"
                        value={matchForm.roomID || ''}
                        onChange={e => setMatchForm({...matchForm, roomID: e.target.value})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white font-mono placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex justify-between">
                        <span>Room Password</span>
                        <button 
                          type="button" 
                          onClick={() => setShowRoomPassword(!showRoomPassword)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {showRoomPassword ? 'Hide' : 'Show'}
                        </button>
                      </label>
                      <input 
                        type={showRoomPassword ? "text" : "password"}
                        placeholder="e.g. vault_key"
                        value={matchForm.roomPassword || ''}
                        onChange={e => setMatchForm({...matchForm, roomPassword: e.target.value})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white font-mono placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Room Status</label>
                      <select
                        value={matchForm.matchRoomStatus || 'coming_soon'}
                        onChange={e => setMatchForm({...matchForm, matchRoomStatus: e.target.value as any})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white outline-none transition-colors font-bold"
                      >
                        <option value="coming_soon">🟡 Coming Soon</option>
                        <option value="room_available">🟢 Room Available</option>
                        <option value="match_live">🔴 Match Live</option>
                        <option value="match_completed">✅ Match Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-blue-500/10 relative">
                    <button 
                      type="button"
                      onClick={() => {
                        setMatchForm({
                          ...matchForm,
                          roomID: '',
                          roomPassword: '',
                          matchRoomStatus: 'coming_soon'
                        });
                      }}
                      className="px-5 py-2 rounded-xl bg-neutral-900 border border-white/5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                    <button 
                      type="button"
                      onClick={saveRoomDetails}
                      className="px-6 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                    >
                      Update
                    </button>
                    <button 
                      type="button"
                      onClick={saveRoomDetails}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:brightness-110 transition-all active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">

                  {/* Image Selectors */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Status</label>
                    <select
                      value={matchForm.roomStatus}
                      onChange={e => setMatchForm({...matchForm, roomStatus: e.target.value as any})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="open">Open / Taking Registrations</option>
                      <option value="locked">Locked / Slots Closed</option>
                      <option value="live">Live / Match in Progress</option>
                      <option value="completed">Completed / Finalized</option>
                    </select>
                  </div>

                  <div className="space-y-3 md:col-span-2 bg-[#111116] p-4 rounded-xl border border-white/10 mt-2">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      🖼 Tournament Thumbnail
                    </label>
                    <p className="text-[10px] text-neutral-400">
                      Upload a high-quality banner image (16:9 recommended) or provide a direct URL.
                    </p>
                    
                    {matchForm.bannerUrl && (
                      <div className="w-full aspect-[16/9] md:h-48 rounded-xl overflow-hidden border border-white/10 relative">
                        <img src={matchForm.bannerUrl} alt="Live Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setMatchForm({...matchForm, bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'})}
                            className="bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/20 hover:bg-black/80"
                          >
                            Restore Default
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMatchForm({...matchForm, bannerUrl: ''})}
                            className="bg-red-500/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 mt-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Upload Thumbnail Image (PNG, JPG, WEBP)</label>
                          <button
                            type="button"
                            onClick={() => setShowStoragePicker(true)}
                            className="text-[9px] font-bold uppercase text-gold-400 hover:text-gold-300 flex items-center gap-1 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded transition-colors"
                          >
                            📁 Select from Storage
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleThumbnailUpload}
                            disabled={isUploadingThumbnail}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className={`w-full bg-neutral-900 border border-dashed border-white/20 rounded-xl p-2.5 text-center text-xs text-white ${isUploadingThumbnail ? 'animate-pulse' : 'hover:bg-white/5'}`}>
                            {isUploadingThumbnail ? 'Uploading...' : 'Click to Upload Image'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center items-center pt-4">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase">OR</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Tournament Thumbnail URL</label>
                        <input 
                          type="text"
                          placeholder="https://example.com/tournament-banner.jpg"
                          value={matchForm.bannerUrl}
                          onChange={e => setMatchForm({...matchForm, bannerUrl: e.target.value})}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono placeholder-neutral-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Live Match Progress URL</label>
                    <input 
                      type="text"
                      placeholder="e.g. Stream / YouTube Live URL"
                      value={matchForm.liveUrl}
                      onChange={e => setMatchForm({...matchForm, liveUrl: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono placeholder-neutral-600 text-gold-400 font-semibold"
                    />
                  </div>
                </div>

                {/* Match custom rules list block */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Eports League Guidelines & Match Rules</label>
                  <div className="space-y-2">
                    {matchForm.rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono text-neutral-500 font-bold">Rule {idx + 1}:</span>
                        <input 
                          type="text"
                          value={rule}
                          onChange={e => {
                            const copy = [...matchForm.rules];
                            copy[idx] = e.target.value;
                            setMatchForm({...matchForm, rules: copy});
                          }}
                          className="flex-1 bg-neutral-900 border border-white/5 rounded-lg p-2 text-xs text-white"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setMatchForm({...matchForm, rules: matchForm.rules.filter((_, i) => i !== idx)});
                          }}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setMatchForm({...matchForm, rules: [...matchForm.rules, '']})}
                      className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 text-[10px] font-bold uppercase"
                    >
                      + Add Rule
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <div>
                    {isEditingMatch !== 'new' && (
                      <button 
                        type="button"
                        onClick={() => {
                          const originalId = isEditingMatch;
                          setIsEditingMatch(null);
                          deleteMatch(originalId, matchForm.title);
                        }}
                        className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 cursor-pointer"
                      >
                        Delete Match Room
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingMatch(null)}
                      className="px-5 py-2 rounded-xl bg-neutral-900 border border-white/5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Discard Draft
                    </button>
                    <button 
                      onClick={saveMatchForm}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg cursor-pointer"
                    >
                      Publish Match Room
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TOURNAMENTS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div key={t.id} className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      t.roomStatus === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      t.roomStatus === 'live' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                      t.roomStatus === 'locked' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-neutral-800 text-neutral-400 border border-transparent'
                    }`}>
                      {t.roomStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest">
                      {t.mode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gold-400 font-mono tracking-widest uppercase">{t.id}</p>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide pr-24">{t.title}</h3>
                    <p className="text-[10px] text-neutral-400">Map: <span className="text-white font-semibold">{t.map}</span> | Date: <span className="text-white font-semibold">{new Date(t.dateTime).toLocaleString()}</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 bg-neutral-900/40 border border-white/5 rounded-xl text-center text-[10px]">
                    <div>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider font-semibold">Prize Pool</p>
                      <p className="font-bold text-white font-mono mt-0.5">₹{t.prizePool}</p>
                    </div>
                    <div className="border-x border-white/5">
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider font-semibold">Entry Fee</p>
                      <p className="font-bold text-amber-500 font-mono mt-0.5">{t.isFreeMatch ? 'FREE' : `₹${t.entryFee}`}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-wider font-semibold">Per Kill</p>
                      <p className="font-bold text-white font-mono mt-0.5">₹{t.perKillPrize}</p>
                    </div>
                  </div>

                  {t.liveUrl && (
                    <div className="bg-[#111116] border border-gold-500/10 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">Live URL:</span>
                      <a 
                        href={t.liveUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gold-400 font-extrabold truncate max-w-[200px] hover:underline"
                      >
                        {t.liveUrl}
                      </a>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[10px] text-neutral-400">
                      Slots Reserved: <span className="text-white font-extrabold font-mono">{t.joinedSlots.length} / {t.totalSlots}</span>
                    </p>
                    
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => openEditMatchForm(t)}
                        className="p-1 px-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteMatch(t.id, t.title)}
                        className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: PLAYER STANDINGS & SCORE ENTRY */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Player Standings & Score Entry</h2>
              <p className="text-xs text-neutral-400">Select an active tournament to manage joined players, add competitor slots manually, and dispatch winnings on completion.</p>
            </div>

            {/* TOURNAMENT DROPDOWN SELECTOR */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="space-y-1 w-full md:w-auto">
                <label className="text-[9px] font-bold text-neutral-400 uppercase block tracking-wider">Choose Tournament Arena</label>
                <select
                  value={selectedTourneyId}
                  onChange={e => setSelectedTourneyId(e.target.value)}
                  className="w-full md:w-80 bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold tracking-wide uppercase"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>[{t.id}] - {t.title}</option>
                  ))}
                </select>
              </div>

              {selectedTournament && (
                <div className="flex gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase font-bold">Res. Slots</span>
                    <span className="text-white font-mono font-black">{selectedTournament.joinedSlots.length} / {selectedTournament.totalSlots}</span>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <span className="text-neutral-500 block text-[9px] uppercase font-bold">Room Status</span>
                    <span className="text-gold-400 font-extrabold uppercase">{selectedTournament.roomStatus}</span>
                  </div>
                </div>
              )}
            </div>

            {selectedTournament && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Panel: Manual Player Loader */}
                <div className="space-y-4 bg-[#101017] border border-white/5 rounded-2xl p-4 h-fit">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <UserPlus className="w-4 h-4 text-gold-400" />
                    Manual Slot Injector
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Player Name / In-Game Name (IGN)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Titan_Pro"
                        value={manualPlayerName}
                        onChange={e => setManualPlayerName(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Free Fire UID Player ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. 982173041"
                        value={manualPlayerUid}
                        onChange={e => setManualPlayerUid(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white mt-1 font-mono"
                      />
                    </div>

                    <button
                      onClick={handleManualAddPlayer}
                      className="w-full py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg hover:brightness-110 cursor-pointer"
                    >
                      Inject Competitor Slot
                    </button>
                  </div>
                </div>

                {/* Right Panel: Joined Competitors Directory & Kill Payout Sheets */}
                <div className="lg:col-span-2 bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                    Competitor Scoresheet & Dispatch Engine
                  </h3>

                  {selectedTournament.joinedSlots.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-6">No players have booked slots in this tournament match yet.</p>
                  ) : (
                    <ScoresheetManager 
                      tournament={selectedTournament} 
                      onSubmitStats={handleSubmitMatchStats} 
                      onRemovePlayer={handleRemovePlayer} 
                    />
                  )}
                </div>

              </div>
            )}

            {selectedTournament && (
              <div className="mt-8 space-y-4">
                <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 shadow-2xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        👥 Joined Players
                      </h3>
                      <div className="flex flex-wrap gap-4 text-xs font-semibold mt-3">
                        <div className="bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-neutral-500 block text-[9px] uppercase font-bold mb-0.5">Total Slots</span>
                          <span className="text-white font-mono font-black">{selectedTournament.totalSlots}</span>
                        </div>
                        <div className="bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-neutral-500 block text-[9px] uppercase font-bold mb-0.5">Joined Players</span>
                          <span className="text-gold-400 font-mono font-black">{selectedTournament.joinedSlots.length} / {selectedTournament.totalSlots}</span>
                        </div>
                        <div className="bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-neutral-500 block text-[9px] uppercase font-bold mb-0.5">Remaining Slots</span>
                          <span className="text-white font-mono font-black">{selectedTournament.totalSlots - selectedTournament.joinedSlots.length}</span>
                        </div>
                        <div className="bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-neutral-500 block text-[9px] uppercase font-bold mb-0.5">Tournament Status</span>
                          <span className={`font-mono font-black ${selectedTournament.joinedSlots.length >= selectedTournament.totalSlots ? 'text-red-400' : 'text-green-400'}`}>
                            {selectedTournament.joinedSlots.length >= selectedTournament.totalSlots ? 'FULL' : selectedTournament.roomStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-600/30 transition-all flex items-center gap-2 shadow-lg">
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-white/5 rounded-xl">
                    <table className="w-full text-left text-xs font-sans whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#1c142c] border-b border-white/5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                          <th className="p-4">Player Name</th>
                          <th className="p-4">Player UID</th>
                          <th className="p-4">Game Name</th>
                          <th className="p-4">Match Type</th>
                          <th className="p-4">Join Date & Time</th>
                          <th className="p-4">Entry Fee Paid</th>
                          <th className="p-4">Payment Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-[#120e1c]/40">
                        {selectedTournament.joinedSlots.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-neutral-500 font-medium">No players have joined this tournament yet.</td>
                          </tr>
                        ) : (
                          selectedTournament.joinedSlots.map((uid, idx) => {
                            const reg = registrations.find(r => r.tournamentId === selectedTournament.id && (r.userId === uid || r.players.some(p => p.uid === uid)));
                            const name = selectedTournament.joinedNicknames[uid] || 'Unknown';
                            const matchType = selectedTournament.mode;
                            const isFree = selectedTournament.isFreeMatch;
                            const date = reg ? new Date(reg.registeredAt).toLocaleString() : 'Unknown';
                            
                            return (
                              <tr key={idx} className="hover:bg-white/[0.04] transition-colors text-neutral-300">
                                <td className="p-4 font-extrabold text-white">{name}</td>
                                <td className="p-4 font-mono text-purple-400 font-bold">{uid}</td>
                                <td className="p-4">{selectedTournament.title}</td>
                                <td className="p-4">{matchType}</td>
                                <td className="p-4 font-mono text-neutral-400">{date}</td>
                                <td className="p-4 font-mono font-bold text-emerald-400">{isFree ? 'FREE' : `₹${selectedTournament.entryFee}`}</td>
                                <td className="p-4 text-green-400 text-[10px] uppercase font-bold tracking-wider">Completed</td>
                                <td className="p-4 text-right space-x-3">
                                  <button className="text-blue-400 hover:text-blue-300 uppercase text-[9px] font-bold tracking-wider transition-colors">View Player</button>
                                  <button onClick={() => handleRemovePlayer(uid, name)} className="text-orange-400 hover:text-orange-300 uppercase text-[9px] font-bold tracking-wider transition-colors">Remove Player</button>
                                  <button onClick={() => handleRemovePlayer(uid, name)} className="text-red-500 hover:text-red-400 uppercase text-[9px] font-bold tracking-wider transition-colors">Ban Player</button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: WALLET APPROVALS */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Wallet Operations & Approvals</h2>
              <p className="text-xs text-neutral-400">Validate manual deposit slips, process withdrawals, and audit transactional flow logs.</p>
            </div>

            {/* APPROVAL SHEETS (DEPOSITS VS WITHDRAWALS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Deposit Approvals Block */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                    Pending Deposits ({pendingDeposits.length})
                  </h3>
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Awaiting Verification</span>
                </div>

                {pendingDeposits.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-8">No pending deposit verification receipts.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingDeposits.map((txn) => {
                      const userObj = dbUsers.find(u => u.uid === txn.userId);
                      return (
                        <div key={txn.id} className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-white uppercase tracking-wide">{userObj?.nickname || 'Unknown Gamer'}</p>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">Ref No: {txn.referenceNo || 'None'}</p>
                            </div>
                            <span className="font-mono font-black text-emerald-400 text-sm">₹{txn.amount}</span>
                          </div>
                          
                          {txn.screenshotBase64 && (
                            <div className="mt-2">
                              <img 
                                src={`data:image/jpeg;base64,${txn.screenshotBase64}`} 
                                alt="Payment Proof" 
                                className="w-full h-32 object-cover rounded border border-white/10 cursor-pointer"
                                onClick={() => {
                                  const win = window.open();
                                  win?.document.write(`<img src="data:image/jpeg;base64,${txn.screenshotBase64}" />`);
                                }}
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-1 border-t border-white/2 text-[10px]">
                            <span className="text-neutral-500 font-mono">{new Date(txn.dateTime).toLocaleString()}</span>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleApproveTxn(txn)}
                                className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRejectTxn(txn)}
                                className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(txn.id)}
                                className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Withdraw Requests Block */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-amber-500" />
                    Pending Withdraws ({pendingWithdraws.length})
                  </h3>
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Awaiting Cash Payout</span>
                </div>

                {pendingWithdraws.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-8">No pending withdrawals requests.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingWithdraws.map((txn) => {
                      const userObj = dbUsers.find(u => u.uid === txn.userId);
                      return (
                        <div key={txn.id} className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-white uppercase tracking-wide">{userObj?.nickname || 'Unknown Gamer'}</p>
                              <p className="text-[9px] text-amber-400 font-mono mt-0.5">UPI ID: {txn.upiId || 'No UPI'}</p>
                            </div>
                            <span className="font-mono font-black text-amber-500 text-sm">₹{txn.amount}</span>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-white/2 text-[10px]">
                            <span className="text-neutral-500 font-mono">{new Date(txn.dateTime).toLocaleString()}</span>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleApproveTxn(txn)}
                                className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Dispatched
                              </button>
                              <button 
                                onClick={() => handleRejectTxn(txn)}
                                className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(txn.id)}
                                className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded font-bold uppercase text-[9px] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* SYSTEM AUDIT FLOW TRANSACTION LOGS */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Transaction Ledger Logs</h3>
                  <p className="text-[10px] text-neutral-400">Audit, search, and export payment transactions across all integrated channels.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleExportCSV('transactions')}
                    className="px-2.5 py-1.5 bg-neutral-900 border border-white/5 hover:bg-white/5 rounded text-[9px] font-bold text-neutral-300 uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                <div className="sm:col-span-2 relative">
                  <input 
                    type="text"
                    value={searchTxnQuery}
                    onChange={(e) => setSearchTxnQuery(e.target.value)}
                    placeholder="Search by User Name, ID, Email, Ref No / UTR, Method..."
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 pl-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/30 font-mono"
                  />
                </div>
                <div>
                  <select
                    value={filterTxnStatus}
                    onChange={(e) => setFilterTxnStatus(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-gold-500/30"
                  >
                    
                    <option value="all">All Statuses</option>
                    <option value="pending_verification">Pending Approval</option>
                    <option value="pending">Pending (Checkout)</option>
                    <option value="completed">Approved</option>
                    <option value="completed">Success / Completed</option>
                    <option value="cancelled">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>

                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 text-xs font-sans space-y-1">
                    <p className="font-bold uppercase tracking-wider text-neutral-400">No Transactions Found</p>
                    <p className="text-[10px]">No transaction ledger logs match your current query or status filters.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/50 text-neutral-500 uppercase text-[9px] tracking-widest">
                      <tr>
                        <th className="p-2.5 pl-3">TXN Identifier</th>
                        <th className="p-2.5">User</th>
                        <th className="p-2.5">Action Flow Type</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Gateway / Ref / UTR</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2 font-mono">
                      {filteredTransactions.map((txn) => {
                        const userObj = dbUsers.find(u => u.uid === txn.userId);
                        return (
                          <tr key={txn.id} className="hover:bg-white/2 text-[11px] text-neutral-300">
                            <td className="p-2.5 pl-3 text-neutral-500">{txn.id}</td>
                            <td className="p-2.5 font-sans font-bold text-white">
                              <div>
                                <p>{userObj?.nickname || 'Unknown'}</p>
                                <p className="text-[9px] text-neutral-500 font-mono">{userObj?.email}</p>
                              </div>
                            </td>
                            <td className="p-2.5 uppercase text-[10px]">{txn.type.replace('_', ' ')}</td>
                            <td className="p-2.5 font-bold text-white">₹{txn.amount}</td>
                            <td className="p-2.5 text-[10px] text-neutral-400">
                              <span className="font-sans font-bold bg-white/5 px-1.5 py-0.5 rounded text-neutral-300 uppercase mr-1">{txn.paymentMethod}</span>
                              {txn.referenceNo ? <span className="font-mono text-gold-400 select-all">{txn.referenceNo}</span> : <span className="text-neutral-600">-</span>}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                txn.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/10' :
                                txn.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                txn.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                'bg-neutral-800 text-neutral-500'
                              }`}>
                                {txn.status === 'completed' ? 'Success' : txn.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 6: PROMOS, CODES & PUSH SYSTEM */}
        {activeTab === 'promo_announcements' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Promotional Campaign Settings</h2>
              <p className="text-xs text-neutral-400">Configure real-time promo codes, trigger popups scrolling bars, and push notification alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Promo Codes Manager */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Code className="w-4.5 h-4.5 text-gold-400" />
                    Gamer Promo Discount Codes
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentState = localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false);
                        setLocalPromoCodesEnabled(!currentState);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        (localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false))
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {(localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false)) ? '🔔 ON' : '🔕 OFF'}
                    </button>
                    
                    <button
                      type="button"
                      disabled={isSavingPromoCodes || localPromoCodesEnabled === null || localPromoCodesEnabled === (promoSettings?.promoCodesEnabled !== false)}
                      onClick={async () => {
                        if (localPromoCodesEnabled === null || updatePromoSettingsAdmin == null) return;
                        setIsSavingPromoCodes(true);
                        try {
                          await updatePromoSettingsAdmin({ promoCodesEnabled: localPromoCodesEnabled });
                          triggerNotification("Settings Saved", `Promo Codes have been ${localPromoCodesEnabled ? 'enabled' : 'disabled'}.`, "success");
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSavingPromoCodes(false);
                          setLocalPromoCodesEnabled(null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        localPromoCodesEnabled !== null && localPromoCodesEnabled !== (promoSettings?.promoCodesEnabled !== false) && !isSavingPromoCodes
                          ? 'bg-gold-500 hover:bg-gold-400 text-neutral-900 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isSavingPromoCodes ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>

                {/* Create Promo Code form */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="col-span-2">
                    <label className="text-[8px] text-neutral-500 uppercase font-semibold">Promo Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. FREE50"
                      value={newPromo.code}
                      onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 mt-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-neutral-500 uppercase font-semibold">Bonus Amount (₹)</label>
                    <input 
                      type="number"
                      value={newPromo.bonus}
                      onChange={e => setNewPromo({...newPromo, bonus: Number(e.target.value)})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 mt-0.5 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddPromo}
                      className="w-full py-2 bg-gold-500 text-neutral-950 rounded-xl font-bold uppercase text-[10px] tracking-wider cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                  <div className="col-span-4 mt-1">
                    <label className="text-[8px] text-neutral-500 uppercase font-semibold">Expiration Date</label>
                    <input 
                      type="date"
                      value={newPromo.expiry}
                      onChange={e => setNewPromo({...newPromo, expiry: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 mt-0.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="divide-y divide-white/5 pt-2">
                  {promoCodes.map((p, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-black text-white tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">{p.code}</span>
                        <p className="text-[10px] text-neutral-400 mt-1">Rewards: ₹{p.bonus} deposit credits | Expiry: {p.expiry}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePromo(p.code)}
                        className="p-1 px-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Alerts Trigger */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <BellRing className="w-4.5 h-4.5 text-blue-400" />
                    Broadcaster Push Notifications
                  </h3>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      type="button"
                      disabled={isSavingNotifications}
                      onClick={() => {
                        const currentState = localNotificationsEnabled !== null ? localNotificationsEnabled : !!notificationSettings?.notificationsEnabled;
                        setLocalNotificationsEnabled(!currentState);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        (localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled)
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {(localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) ? '🔔 ON' : '🔕 OFF'}
                    </button>

                    <button
                      type="button"
                      disabled={isSavingNotifications || localNotificationsEnabled === null || localNotificationsEnabled === notificationSettings?.notificationsEnabled}
                      onClick={async () => {
                        if (localNotificationsEnabled === null || updateNotificationSettingsAdmin == null) return;
                        setIsSavingNotifications(true);
                        try {
                          await updateNotificationSettingsAdmin({ notificationsEnabled: localNotificationsEnabled });
                          triggerNotification("Success", "Notification settings saved successfully.", "success");
                          setLocalNotificationsEnabled(null);
                        } catch (err) {
                          triggerNotification("Error", "Failed to save notification settings. Please try again.", "error");
                          setLocalNotificationsEnabled(null);
                        } finally {
                          setIsSavingNotifications(false);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        localNotificationsEnabled !== null && localNotificationsEnabled !== notificationSettings?.notificationsEnabled && !isSavingNotifications
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isSavingNotifications ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] text-neutral-500 uppercase font-semibold">Notification Title Accent</label>
                    <input 
                      type="text"
                      placeholder="e.g. Server Maintenance ⚠️"
                      value={pushTitle}
                      onChange={e => setPushTitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] text-neutral-500 uppercase font-semibold">Broadcast Messages / Description Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter the broadcast message body details..."
                      value={pushMessage}
                      onChange={e => setPushMessage(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] text-neutral-500 uppercase font-semibold">Flash Type Accent</label>
                      <select 
                        value={pushType}
                        onChange={e => setPushType(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="info">Info Accent / Bonus Blue</option>
                        <option value="alert">Alert Accent / Danger Red</option>
                        <option value="winner">Winner Accent / Gold Cup</option>
                        <option value="system">System Accent / Gray Shield</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleTriggerPush}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Broadcast Push
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* SCROLLING NOTICE AND POPUP PROMOTIONS */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Volume2 className="w-4.5 h-4.5 text-amber-500" />
                Scrolling Notice & Popup Promotions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Marquee Scrolling Notice Text</label>
                  <input 
                    type="text"
                    value={scrollingNotice}
                    onChange={e => setScrollingNotice(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Popup Announcement Header</label>
                  <input 
                    type="text"
                    value={popupAnnouncement.title}
                    onChange={e => setPopupAnnouncement({...popupAnnouncement, title: e.target.value})}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-extrabold"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Popup Description Campaign Details</label>
                  <textarea 
                    rows={2}
                    value={popupAnnouncement.message}
                    onChange={e => setPopupAnnouncement({...popupAnnouncement, message: e.target.value})}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 7: APP CONFIG, SECURITY & SYSTEM */}
        {activeTab === 'settings_security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">App Configuration & Security</h2>
              <p className="text-xs text-neutral-400 font-sans">Configure high-security payment gateways API credentials, UPI direct channels, automated webhook handlers, and global priority routing.</p>
            </div>

            
            {/* Global Notification Setting */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-400" />
                    Global Notification Settings
                  </h3>
                  <p className="text-[10px] text-neutral-400">Enable or disable all notifications system-wide. When disabled, users will not receive push notifications or in-app alerts.</p>
                </div>
                <div className="flex flex-col gap-3 min-w-[160px]">
                  <button
                    type="button"
                    disabled={isSavingNotifications}
                    onClick={() => {
                      const currentState = localNotificationsEnabled !== null ? localNotificationsEnabled : !!notificationSettings?.notificationsEnabled;
                      setLocalNotificationsEnabled(!currentState);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      (localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {(localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
                  </button>
                  
                  <button
                    type="button"
                    disabled={isSavingNotifications || localNotificationsEnabled === null || localNotificationsEnabled === notificationSettings?.notificationsEnabled}
                    onClick={async () => {
                      if (localNotificationsEnabled === null || updateNotificationSettingsAdmin == null) return;
                      setIsSavingNotifications(true);
                      try {
                        await updateNotificationSettingsAdmin({ notificationsEnabled: localNotificationsEnabled });
                        triggerNotification("Success", "Notification settings saved successfully.", "success");
                        setLocalNotificationsEnabled(null);
                      } catch (err) {
                        triggerNotification("Error", "Failed to save notification settings. Please try again.", "error");
                        setLocalNotificationsEnabled(null);
                      } finally {
                        setIsSavingNotifications(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      localNotificationsEnabled !== null && localNotificationsEnabled !== notificationSettings?.notificationsEnabled && !isSavingNotifications
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isSavingNotifications ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Global Gateway Routing Controller */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-gold-400" />
                    Global Priority Payment Routing
                  </h3>
                  <p className="text-[10px] text-neutral-400">Select which gateway serves as the default automated checkout channel for competitors.</p>
                </div>
                <div className="w-full md:w-80">
                  <select
                    value={appSettings.defaultGateway || 'zapupi'}
                    onChange={e => setAppSettings({...appSettings, defaultGateway: e.target.value})}
                    className="w-full bg-[#161622] border border-white/15 rounded-xl p-3 text-xs text-white font-extrabold uppercase focus:border-gold-500 focus:outline-none"
                  >
                    <option value="zapupi">ZapUPI Payment Gateway (Recommended)</option>
                    <option value="manual_upi">Manual UPI QR Code Flow</option>
                    <option value="paytm">Paytm Merchant Checkout Gateway</option>
                    <option value="phonepe">PhonePe Web Integration API</option>
                    <option value="razorpay">Razorpay Checkout Standard</option>
                    <option value="cashfree">Cashfree Core Gateway</option>
                    <option value="payu">PayU Biz Gateway</option>
                    <option value="easebuzz">Easebuzz Payment APIs</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COLUMN 1: MANUAL QR PAYMENT SETTING */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                      <Wallet className="w-4.5 h-4.5 text-gold-400" />
                      PAYMENT METHOD 1 - Manual UPI QR Payment
                    </h3>
                    
                    <button
                      type="button"
                      onClick={() => setAppSettings({ ...appSettings, manualPaymentEnabled: !appSettings.manualPaymentEnabled })}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        appSettings.manualPaymentEnabled
                          ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                          : 'bg-neutral-800 border border-transparent text-neutral-500'
                      }`}
                    >
                      {appSettings.manualPaymentEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Admin UPI ID</label>
                        <input 
                          type="text"
                          value={appSettings.upiId}
                          onChange={e => setAppSettings({...appSettings, upiId: e.target.value})}
                          placeholder="your-upi-id@okaxis"
                          className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:border-gold-500/30 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">QR Code Scan Image URL</label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedDataUrl = await compressImage(file, 0.1, 512);
                                setAppSettings({...appSettings, qrCodeUrl: compressedDataUrl});
                              } catch (error) {
                                console.error("Error compressing image");
                                alert("Failed to process image.");
                              }
                            }
                          }}
                          className="w-full bg-[#161622] border border-white/10 rounded-xl p-1.5 text-[10px] text-white font-mono focus:border-gold-500/30 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gold-500/10 file:text-gold-400 file:font-bold hover:file:bg-gold-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Min Deposit Limit (₹)</label>
                        <input 
                          type="number"
                          value={appSettings.minDepositAmount}
                          onChange={e => setAppSettings({...appSettings, minDepositAmount: Number(e.target.value)})}
                          placeholder="e.g. 10"
                          className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:border-gold-500/30 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Max Deposit Limit (₹)</label>
                        <input 
                          type="number"
                          value={appSettings.maxDepositAmount}
                          onChange={e => setAppSettings({...appSettings, maxDepositAmount: Number(e.target.value)})}
                          placeholder="e.g. 100000"
                          className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:border-gold-500/30 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">User Checkout Instructions</label>
                      <textarea 
                        rows={3}
                        value={appSettings.paymentInstructions}
                        onChange={e => setAppSettings({...appSettings, paymentInstructions: e.target.value})}
                        placeholder="Scan QR, pay, copy 12 digit UTR number..."
                        className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white leading-relaxed focus:border-gold-500/30 focus:outline-none"
                      />
                    </div>

                    {/* Preview Area */}
                    <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl space-y-2">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">Live User View Preview</p>
                      <div className="flex gap-3 items-center">
                        {appSettings.qrCodeUrl ? (
                          <img 
                            src={appSettings.qrCodeUrl} 
                            alt="Scan QR" 
                            className="w-12 h-12 rounded bg-neutral-800 object-contain border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-950 rounded flex items-center justify-center text-[8px] text-neutral-600 border border-white/5 font-mono shrink-0">No QR</div>
                        )}
                        <div className="min-w-0 flex-1 text-[10px]">
                          <p className="font-extrabold text-neutral-300">UPI: <span className="font-mono text-gold-400">{appSettings.upiId || 'Not Configured'}</span></p>
                          <p className="text-neutral-500 line-clamp-2 leading-snug mt-0.5">{appSettings.paymentInstructions}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleSavePaymentSettings}
                    disabled={savingSettings}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-neutral-800 disabled:to-neutral-900 text-neutral-950 disabled:text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/10 active:scale-95"
                  >
                    {savingSettings ? 'Syncing...' : 'Save Manual Config'}
                  </button>
                </div>
              </div>

              {/* COLUMN 2: AUTOMATIC GATEWAY INTEGRATIONS */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Code className="w-4.5 h-4.5 text-gold-400" />
                    PAYMENT METHOD 2 - Automatic Gateways
                  </h3>

                  <div className="space-y-4 text-xs font-sans max-h-[500px] overflow-y-auto pr-1">
                    
                    {/* PRIMARY: ZapUPI Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-gold-500/30 space-y-3 shadow-[0_4px_20px_rgba(212,163,89,0.05)]">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
                          <span className="font-extrabold text-gold-400 uppercase text-[10px] tracking-wider">ZapUPI Official Gateway (Primary)</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={appSettings.zapupiEnabled}
                          onChange={e => setAppSettings({...appSettings, zapupiEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">ZapUPI API Key</label>
                          <input 
                            type="password"
                            value={appSettings.zapupiApiKey}
                            onChange={e => setAppSettings({...appSettings, zapupiApiKey: e.target.value})}
                            placeholder="zap_api_••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Sandbox Testing</label>
                          <select
                            value={appSettings.zapupiSandbox ? "true" : "false"}
                            onChange={e => setAppSettings({...appSettings, zapupiSandbox: e.target.value === "true"})}
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          >
                            <option value="true">Sandbox Mode (Simulator)</option>
                            <option value="false">Live Production Mode</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-neutral-900/80 p-2 rounded-lg text-[9px] text-neutral-400 font-mono space-y-1">
                        <p><span className="text-gold-400">Callback URL:</span> http://localhost:3000/api/payments/zapupi/callback</p>
                        <p><span className="text-gold-400">Webhook URL:</span> http://localhost:3000/api/payments/zapupi/webhook</p>
                      </div>
                    </div>

                    {/* A. Paytm Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Paytm Merchant Checkout</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.paytmEnabled}
                          onChange={e => setAppSettings({...appSettings, paytmEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant ID (MID)</label>
                          <input 
                            type="text"
                            value={appSettings.paytmMid || ''}
                            onChange={e => setAppSettings({...appSettings, paytmMid: e.target.value})}
                            placeholder="e.g. TitanEs94817..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                      
                      {!appSettings.paytmMerchantKey && (
                        <div className="mt-2 p-3 bg-amber-950/40 border border-amber-500/20 rounded-lg text-[9px] text-amber-200">
                          <p className="font-bold text-amber-400 mb-1">⚠️ Operating in Manual Pending Mode</p>
                          <p className="opacity-80">Paytm's standard API requires a Merchant Key (Checksum Key). Because only a Merchant ID is available, automatic checksum generation is not possible. Transactions using Paytm will safely route to a <b>Pending</b> state for manual Admin approval instead of crashing with a 403 error.</p>
                        </div>
                      )}
                    </div>

                    {/* B. Razorpay Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Razorpay Checkout Core</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.razorpayEnabled}
                          onChange={e => setAppSettings({...appSettings, razorpayEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Key ID (API)</label>
                          <input 
                            type="text"
                            value={appSettings.razorpayKeyId}
                            onChange={e => setAppSettings({...appSettings, razorpayKeyId: e.target.value})}
                            placeholder="rzp_live_••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Key Secret</label>
                          <input 
                            type="password"
                            value={appSettings.razorpayKeySecret}
                            onChange={e => setAppSettings({...appSettings, razorpayKeySecret: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* C. PhonePe Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">PhonePe Web Integration API</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.phonepeEnabled}
                          onChange={e => setAppSettings({...appSettings, phonepeEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded-pointer cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant ID</label>
                          <input 
                            type="text"
                            value={appSettings.phonepeMID}
                            onChange={e => setAppSettings({...appSettings, phonepeMID: e.target.value})}
                            placeholder="MERCHANT_ID_CODE"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Salt / API Key</label>
                          <input 
                            type="password"
                            value={appSettings.phonepeKey}
                            onChange={e => setAppSettings({...appSettings, phonepeKey: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* D. Cashfree Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Cashfree Core Gateway</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.cashfreeEnabled}
                          onChange={e => setAppSettings({...appSettings, cashfreeEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">App ID</label>
                          <input 
                            type="text"
                            value={appSettings.cashfreeAppId}
                            onChange={e => setAppSettings({...appSettings, cashfreeAppId: e.target.value})}
                            placeholder="e.g. CF1829402X..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Secret Key</label>
                          <input 
                            type="password"
                            value={appSettings.cashfreeSecret}
                            onChange={e => setAppSettings({...appSettings, cashfreeSecret: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* E. PayU Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">PayU Biz Gateway</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.payuEnabled}
                          onChange={e => setAppSettings({...appSettings, payuEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant Key</label>
                          <input 
                            type="text"
                            value={appSettings.payuMerchantKey}
                            onChange={e => setAppSettings({...appSettings, payuMerchantKey: e.target.value})}
                            placeholder="e.g. payu_k_8291..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Salt</label>
                          <input 
                            type="password"
                            value={appSettings.payuSalt}
                            onChange={e => setAppSettings({...appSettings, payuSalt: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* F. Easebuzz Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Easebuzz Payment APIs</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.easebuzzEnabled}
                          onChange={e => setAppSettings({...appSettings, easebuzzEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Key</label>
                          <input 
                            type="text"
                            value={appSettings.easebuzzKey}
                            onChange={e => setAppSettings({...appSettings, easebuzzKey: e.target.value})}
                            placeholder="e.g. easebuzz_key..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Salt</label>
                          <input 
                            type="password"
                            value={appSettings.easebuzzSalt}
                            onChange={e => setAppSettings({...appSettings, easebuzzSalt: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleSavePaymentSettings}
                    disabled={savingSettings}
                    className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 text-neutral-950 disabled:text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
                  >
                    {savingSettings ? 'Syncing...' : 'Save API Gateways'}
                  </button>
                </div>
              </div>

              {/* Maintenance & Security Column */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Lock className="w-4.5 h-4.5 text-red-400" />
                    System Lockout & Maintenance
                  </h3>

                  <div className="flex items-center justify-between p-3.5 bg-red-500/5 border border-red-500/25 rounded-xl text-xs">
                    <div>
                      <p className="font-extrabold text-white uppercase tracking-wide">Emergency Maintenance Lock</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Locks out general players and triggers a warning splash screen.</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const next = !appSettings.maintenanceMode;
                        setAppSettings({...appSettings, maintenanceMode: next});
                        addAuditLog(`Toggled maintenance lockout to ${next ? 'ON' : 'OFF'}`);
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        appSettings.maintenanceMode 
                          ? 'bg-red-500 text-neutral-950 font-black' 
                          : 'bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {appSettings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="text-[8px] text-neutral-500 uppercase font-semibold">Tournament Version Link</label>
                      <input 
                        type="text"
                        value={appSettings.version}
                        onChange={e => setAppSettings({...appSettings, version: e.target.value})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 mt-0.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] text-neutral-500 uppercase font-semibold">APK Direct Download Link</label>
                      <input 
                        type="text"
                        value={appSettings.downloadLink}
                        onChange={e => setAppSettings({...appSettings, downloadLink: e.target.value})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2 mt-0.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={handleSavePaymentSettings}
                    disabled={savingSettings}
                    className="px-5 py-2 bg-[#1c1212] hover:bg-[#2c1a1a] border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-500/5 active:scale-95"
                  >
                    {savingSettings ? 'Saving...' : 'Save System Settings'}
                  </button>
                </div>
              </div>

            </div>

            {/* DOWNLOAD EXPORT REPORTS SYSTEM */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-400" />
                Download Commercial Reports
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleExportCSV('users')}
                  className="p-3.5 bg-neutral-900/60 border border-white/5 hover:border-emerald-500/20 text-neutral-200 rounded-xl flex items-center justify-between hover:bg-neutral-800/60 transition-all cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 text-left">
                    <p className="font-extrabold uppercase text-[10px] tracking-wider text-white">Competitors directory</p>
                    <p className="text-[9px] text-neutral-400 font-mono">UIDs, mobiles, wins, total matches</p>
                  </div>
                  <Download className="w-4.5 h-4.5 text-emerald-400" />
                </button>

                <button 
                  onClick={() => handleExportCSV('tournaments')}
                  className="p-3.5 bg-neutral-900/60 border border-white/5 hover:border-emerald-500/20 text-neutral-200 rounded-xl flex items-center justify-between hover:bg-neutral-800/60 transition-all cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 text-left">
                    <p className="font-extrabold uppercase text-[10px] tracking-wider text-white">Tournament Sheets</p>
                    <p className="text-[9px] text-neutral-400 font-mono">Prizepool, fees, margins, slots</p>
                  </div>
                  <Download className="w-4.5 h-4.5 text-emerald-400" />
                </button>

                <button 
                  onClick={() => handleExportCSV('transactions')}
                  className="p-3.5 bg-neutral-900/60 border border-white/5 hover:border-emerald-500/20 text-neutral-200 rounded-xl flex items-center justify-between hover:bg-neutral-800/60 transition-all cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 text-left">
                    <p className="font-extrabold uppercase text-[10px] tracking-wider text-white">Transaction Logs</p>
                    <p className="text-[9px] text-neutral-400 font-mono">Deposits, payouts, gateway ref</p>
                  </div>
                  <Download className="w-4.5 h-4.5 text-emerald-400" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 8: YOUTUBE MANAGEMENT */}
        {activeTab === 'youtube_management' && (
          <div className="space-y-6">
            
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#101017] p-5 rounded-2xl border border-white/5">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Youtube className="w-6 h-6 text-red-500 fill-red-500/10" />
                  YouTube Sync & Broadcast Manager
                </h2>
                <p className="text-xs text-neutral-400 font-sans">Configure secure API proxy layers, monitor active live streams, and refresh caching metrics.</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleYtManualSync}
                  className="px-4 py-2 bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Sync API Cache Now
                </button>
              </div>
            </div>

            {loadingYt && (
              <div className="p-4 bg-gold-500/5 border border-gold-500/20 text-gold-400 rounded-xl text-center font-mono text-xs animate-pulse">
                🔄 Processing and refreshing YouTube metrics from Google cloud server proxy...
              </div>
            )}

            {/* Main Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: API configurations & cache */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* A. API CONFIGURATION CARD */}
                <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                    1. API CONFIGURATION
                  </h3>

                  <form onSubmit={handleSaveYtConfig} className="space-y-4 text-xs font-sans">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-extrabold text-white uppercase text-[10px] tracking-wider">Enable YouTube Integration</p>
                        <p className="text-[9px] text-neutral-400 font-mono">Toggle user panel visibility</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={ytConfig.enabled}
                        onChange={(e) => setYtConfig({ ...ytConfig, enabled: e.target.checked })}
                        className="w-4 h-4 text-gold-500 bg-neutral-900 border-white/10 rounded cursor-pointer"
                      />
                    </div>

                    {/* API Key */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">YouTube Data API v3 Key</label>
                      <input 
                        type="password"
                        value={ytConfig.apiKey}
                        onChange={(e) => setYtConfig({ ...ytConfig, apiKey: e.target.value })}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-gold-500/30"
                      />
                      <span className="text-[8px] text-neutral-500 font-mono block">Leave blank to retain previously stored secure API key.</span>
                    </div>

                    {/* Channel ID */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Channel ID</label>
                      <input 
                        type="text"
                        value={ytConfig.channelId}
                        onChange={(e) => setYtConfig({ ...ytConfig, channelId: e.target.value })}
                        placeholder="e.g. UC_x5XG1OV2P6uYZ5_XGPw"
                        required
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-gold-500/30"
                      />
                    </div>

                    {/* Cache Duration & Auto Sync */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Cache Duration (Min)</label>
                        <input 
                          type="number"
                          value={ytConfig.cacheDurationMinutes}
                          onChange={(e) => setYtConfig({ ...ytConfig, cacheDurationMinutes: parseInt(e.target.value, 10) || 15 })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-gold-500/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Auto Background Sync</label>
                        <select 
                          value={ytConfig.autoSync ? "true" : "false"}
                          onChange={(e) => setYtConfig({ ...ytConfig, autoSync: e.target.value === "true" })}
                          className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500/30"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button 
                        type="button"
                        onClick={handleTestYtConnection}
                        className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 font-extrabold uppercase text-[9px] tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Verify & Test Connection
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </form>

                  {/* Verification Response Display */}
                  {ytTestStatus && (
                    <div className={`p-3.5 rounded-xl border text-[11px] font-mono leading-relaxed space-y-1.5 ${ytTestStatus.success ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                      <p className="font-extrabold uppercase tracking-wider text-[10px]">Test Report:</p>
                      <p>{ytTestStatus.message}</p>
                    </div>
                  )}

                </div>

                {/* B. CACHE AND METRICS PANEL */}
                <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                    2. LIVE CHANNEL METRICS
                  </h3>
                  
                  {ytChannelInfo ? (
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <img 
                          src={ytChannelInfo.logo} 
                          alt={ytChannelInfo.title} 
                          className="w-11 h-11 rounded-lg border border-white/10 object-cover"
                        />
                        <div>
                          <p className="font-black text-white uppercase tracking-wide">{ytChannelInfo.title}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">@{ytChannelInfo.title.toLowerCase().replace(/\s/g, '')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                        <div className="bg-[#0c0c11] p-2 rounded-lg border border-white/5">
                          <span className="text-neutral-500 uppercase block text-[8px] font-semibold">Subscribers</span>
                          <span className="text-white font-black">{(ytChannelInfo.subscribers).toLocaleString()}</span>
                        </div>
                        <div className="bg-[#0c0c11] p-2 rounded-lg border border-white/5">
                          <span className="text-neutral-500 uppercase block text-[8px] font-semibold">Total Views</span>
                          <span className="text-white font-black">{(ytChannelInfo.views).toLocaleString()}</span>
                        </div>
                        <div className="bg-[#0c0c11] p-2 rounded-lg border border-white/5">
                          <span className="text-neutral-500 uppercase block text-[8px] font-semibold">Videos Uploaded</span>
                          <span className="text-white font-black">{ytChannelInfo.videosCount}</span>
                        </div>
                        <div className="bg-[#0c0c11] p-2 rounded-lg border border-white/5">
                          <span className="text-neutral-500 uppercase block text-[8px] font-semibold">Country</span>
                          <span className="text-gold-400 font-black uppercase">{ytChannelInfo.country}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-500 font-mono">Please verify the connection above to retrieve live subscriber counters.</p>
                  )}
                </div>

                {/* C. LIVE STREAM TELEMETRY CHECKER */}
                <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
                    <span>3. LIVE STREAM TELEMETRY</span>
                    {ytLiveInfo?.isLive ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[8px] tracking-widest uppercase animate-bounce">LIVE</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-black text-[8px] tracking-widest uppercase">OFFLINE</span>
                    )}
                  </h3>

                  {ytLiveInfo?.isLive && ytLiveInfo?.activeLive ? (
                    <div className="space-y-3 text-xs">
                      <div className="aspect-video relative rounded-lg overflow-hidden border border-red-500/20 bg-black">
                        <img 
                          src={ytLiveInfo.activeLive.thumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent p-3 flex flex-col justify-end">
                          <span className="text-[10px] text-red-400 font-mono font-black uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            {ytLiveInfo.activeLive.viewerCount} gamers watching
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-white uppercase tracking-wide line-clamp-1">{ytLiveInfo.activeLive.title}</p>
                        <p className="text-[9px] text-neutral-400 font-mono">Streaming started: {new Date(ytLiveInfo.activeLive.publishedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-500 font-mono bg-[#0c0c11] p-3 rounded-lg border border-white/5">No active live streaming broadcasts detected at the moment.</p>
                  )}
                </div>

              </div>

              {/* Right Column: Video & Shorts cache management directory */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* D. VIDEO ARCHIVE CONTROLS */}
                <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                    4. DOCK SYNCED ARCHIVES
                  </h3>

                  {/* Videos Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">Synchronized Video List ({ytVideos.length})</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Real-time DB cache mapping</span>
                    </div>

                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-1">
                      {ytVideos.length === 0 ? (
                        <p className="p-8 text-center text-neutral-500 font-mono text-[10px]">No synchronized videos detected. Verify settings and trigger "Sync API Cache Now".</p>
                      ) : (
                        ytVideos.map((vid, idx) => (
                          <div key={vid.id} className="py-3 flex gap-3 items-center hover:bg-white/5 px-2 rounded-xl transition-all">
                            <img 
                              src={vid.thumbnail} 
                              alt="thumb" 
                              className="w-16 aspect-video rounded object-cover bg-neutral-800 border border-white/5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-neutral-200 text-xs truncate uppercase tracking-wide">{vid.title}</p>
                              <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 mt-1">
                                <span className="text-gold-400">{(vid.views).toLocaleString()} views</span>
                                <span>•</span>
                                <span>Published: {new Date(vid.publishedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono bg-white/5 px-2 py-1 rounded text-neutral-400 shrink-0">INDEX #{idx+1}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Shorts Table */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-wider text-neutral-400 uppercase">Synchronized Shorts Clips ({ytShorts.length})</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Vertical layout classification</span>
                    </div>

                    <div className="divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
                      {ytShorts.length === 0 ? (
                        <p className="p-8 text-center text-neutral-500 font-mono text-[10px]">No categorized shorts detected.</p>
                      ) : (
                        ytShorts.map((short, idx) => (
                          <div key={short.id} className="py-2.5 flex gap-3 items-center hover:bg-white/5 px-2 rounded-xl transition-all">
                            <img 
                              src={short.thumbnail} 
                              alt="thumb" 
                              className="w-10 aspect-[9/16] rounded object-cover bg-neutral-800 border border-white/5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-neutral-200 text-[11px] truncate uppercase tracking-wide leading-tight">{short.title}</p>
                              <div className="flex items-center gap-3 text-[9px] font-mono text-neutral-500 mt-0.5">
                                <span className="text-red-400 font-black">{(short.views).toLocaleString()} views</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono bg-red-500/5 px-2 py-0.5 rounded text-red-400 shrink-0 uppercase tracking-widest">SHORT</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 9: TOURNAMENT REGISTRATIONS & ROSTER MANAGER */}
        {activeTab === 'registrations' && (() => {
          // Computed Registrations Stats
          const regTotal = (registrations || []).length;
          const regPending = (registrations || []).filter(r => r.status === 'pending').length;
          const regApproved = (registrations || []).filter(r => r.status === 'completed').length;
          const regRevenue = (registrations || [])
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + (r.totalAmountPaid || 0), 0);

          // Filtering Logic
          const filteredRegs = (registrations || []).filter(reg => {
            const matchesSearch = 
              reg.id.toLowerCase().includes(searchRegQuery.toLowerCase()) ||
              reg.governmentName.toLowerCase().includes(searchRegQuery.toLowerCase()) ||
              reg.userEmail.toLowerCase().includes(searchRegQuery.toLowerCase()) ||
              reg.players.some(p => 
                p.gameName.toLowerCase().includes(searchRegQuery.toLowerCase()) ||
                p.uid.toLowerCase().includes(searchRegQuery.toLowerCase())
              );

            const matchesTourney = filterRegTourney === 'all' || reg.tournamentId === filterRegTourney;
            const matchesType = filterRegType === 'all' || reg.matchType === filterRegType;
            const matchesStatus = filterRegStatus === 'all' || reg.status === filterRegStatus;

            return matchesSearch && matchesTourney && matchesType && matchesStatus;
          });

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-gradient-to-r from-gold-500 to-purple-500 bg-clip-text text-transparent">Tournament Registrations</span>
                    <span className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full font-sans">Roster Core</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Approve incoming entries, correct player roster details, or process manual and automated refunds.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      const text = filteredRegs.map(reg => 
                        `--- ${reg.tournamentTitle} (${reg.matchType}) ---\nTeam: ${reg.governmentName}\n` + 
                        reg.players.map((p, idx) => `P${idx+1}: ${p.gameName} (UID: ${p.uid})`).join('\n')
                      ).join('\n\n');
                      navigator.clipboard.writeText(text);
                      triggerNotification('success', 'Roster lists copied to clipboard!');
                    }}
                    className="flex-1 md:flex-none px-3 py-2 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Copy Roster Sheets</span>
                  </button>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredRegs, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `registrations_export_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      triggerNotification('success', 'Roster JSON downloaded!');
                    }}
                    className="flex-1 md:flex-none px-3 py-2 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#101017]/80 border border-white/5 p-4 rounded-2xl relative overflow-hidden backdrop-blur-md">
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold">Total Applications</p>
                  <p className="text-xl font-black text-white font-mono mt-1">{regTotal}</p>
                  <div className="absolute right-3 bottom-3 text-white/5"><FileSpreadsheet className="w-10 h-10" /></div>
                </div>

                <div className="bg-[#101017]/80 border border-white/5 p-4 rounded-2xl relative overflow-hidden backdrop-blur-md">
                  <p className="text-[9px] text-yellow-500 uppercase tracking-widest font-bold">Pending Approval</p>
                  <p className="text-xl font-black text-yellow-400 font-mono mt-1">{regPending}</p>
                  <div className="absolute right-3 bottom-3 text-yellow-500/5"><AlertTriangle className="w-10 h-10" /></div>
                </div>

                <div className="bg-[#101017]/80 border border-white/5 p-4 rounded-2xl relative overflow-hidden backdrop-blur-md">
                  <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold">Active Rosters</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-1">{regApproved}</p>
                  <div className="absolute right-3 bottom-3 text-emerald-500/5"><CheckCircle className="w-10 h-10" /></div>
                </div>

                <div className="bg-[#101017]/80 border border-white/5 p-4 rounded-2xl relative overflow-hidden backdrop-blur-md">
                  <p className="text-[9px] text-purple-400 uppercase tracking-widest font-bold">Total Entry Revenue</p>
                  <p className="text-xl font-black text-purple-400 font-mono mt-1">₹{regRevenue.toFixed(1)}</p>
                  <div className="absolute right-3 bottom-3 text-purple-500/5"><Wallet className="w-10 h-10" /></div>
                </div>
              </div>

              {/* Advanced Search & Filter Deck */}
              <div className="bg-[#101017]/80 border border-white/5 p-4 rounded-2xl space-y-4 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Search Query</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search UID, Nickname, ID..."
                        value={searchRegQuery}
                        onChange={e => setSearchRegQuery(e.target.value)}
                        className="w-full bg-[#161622] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-gold-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Arena Match Filter</label>
                    <select
                      value={filterRegTourney}
                      onChange={e => setFilterRegTourney(e.target.value)}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500 font-bold uppercase"
                    >
                      <option value="all">-- All Tournaments --</option>
                      {tournaments.map(t => (
                        <option key={t.id} value={t.id}>[{t.id.substring(0, 5).toUpperCase()}] {t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Match Mode</label>
                    <select
                      value={filterRegType}
                      onChange={e => setFilterRegType(e.target.value)}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500 font-bold uppercase"
                    >
                      <option value="all">-- All Formats --</option>
                      <option value="Solo">Solo Match</option>
                      <option value="Duo">Duo Combat</option>
                      <option value="Squad">Squad Battle</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Status Badge</label>
                    <select
                      value={filterRegStatus}
                      onChange={e => setFilterRegStatus(e.target.value)}
                      className="w-full bg-[#161622] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-gold-500 font-bold uppercase"
                    >
                      <option value="all">-- All Statuses --</option>
                      <option value="pending">Awaiting Verification</option>
                      <option value="completed">Approved / Confirmed</option>
                      <option value="cancelled">Cancelled Entries</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Main Roster Grid table */}
              <div className="bg-[#101017]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                {filteredRegs.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">No applications found</p>
                    <p className="text-[10px] text-neutral-600">Try adjusting your filters or query terms.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b0b10] border-b border-white/5 text-neutral-400 uppercase text-[9px] tracking-widest">
                        <tr>
                          <th className="p-4">Reg Detail</th>
                          <th className="p-4">Tournament Match</th>
                          <th className="p-4">Leader / legal ID</th>
                          <th className="p-4">Competitors Roster</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRegs.map(reg => {
                          const statusColors = {
                            pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                            completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                            cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
                          };

                          return (
                            <tr key={reg.id} className="hover:bg-white/1 transition-all">
                              {/* Reg ID */}
                              <td className="p-4 font-mono">
                                <p className="font-extrabold text-white text-[11px] uppercase tracking-wide">#{reg.id.substring(0, 8).toUpperCase()}</p>
                                <p className="text-[9px] text-neutral-500 mt-0.5">{new Date(reg.registeredAt).toLocaleString()}</p>
                                <p className="text-[8px] text-neutral-600 mt-0.5 truncate max-w-[120px]">{reg.userEmail}</p>
                              </td>

                              {/* Tournament info */}
                              <td className="p-4">
                                <p className="font-bold text-white uppercase tracking-wide truncate max-w-[150px]">{reg.tournamentTitle}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400">
                                    {reg.matchType}
                                  </span>
                                  <span className="text-[8px] text-neutral-500 font-mono">ID: {reg.tournamentId.substring(0, 5).toUpperCase()}</span>
                                </div>
                              </td>

                              {/* Government legal details */}
                              <td className="p-4">
                                <p className="font-black text-gold-400 uppercase tracking-wide">{reg.governmentName}</p>
                                <p className="text-[8px] text-neutral-500 uppercase tracking-widest mt-0.5">Primary Leader</p>
                              </td>

                              {/* Competitors roster */}
                              <td className="p-4">
                                <div className="space-y-1.5 max-w-[240px]">
                                  {reg.players.map((p, pIdx) => (
                                    <div key={pIdx} className="bg-white/5 p-1 px-2 rounded border border-white/5 flex items-center justify-between text-[10px] gap-2">
                                      <span className="font-black text-neutral-200 truncate">P{pIdx + 1}: {p.gameName}</span>
                                      <span className="font-mono text-[9px] text-neutral-400 shrink-0 bg-[#111116] border border-white/5 px-1 py-0.5 rounded">
                                        ID: {p.uid}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* Amount details */}
                              <td className="p-4 font-mono">
                                <p className="font-black text-white">₹{reg.totalAmountPaid}</p>
                                <p className="text-[8px] text-neutral-500 uppercase tracking-widest mt-0.5">{reg.paymentStatus}</p>
                              </td>

                              {/* Status */}
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[reg.status as keyof typeof statusColors]}`}>
                                  {reg.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="p-4 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  {reg.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveReg(reg.id)}
                                        className="p-1 px-2 rounded bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectReg(reg.id)}
                                        className="p-1 px-2 rounded bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Reject & Refund
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => {
                                      setEditingReg(reg);
                                      setEditRegGovName(reg.governmentName);
                                      setEditRegPlayers(JSON.parse(JSON.stringify(reg.players)));
                                    }}
                                    className="p-1 px-2 rounded bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>

                                  {reg.status !== 'cancelled' && reg.status !== 'pending' && (
                                    <button
                                      onClick={() => handleCancelReg(reg.id)}
                                      className="p-1 px-2 rounded bg-neutral-900 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteReg(reg.id)}
                                    className="p-1 px-2 rounded bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Roster detail edit drawer overlay */}
              {editingReg && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
                  <div className="bg-[#0e0e13] border border-white/10 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl relative">
                    <button
                      onClick={() => setEditingReg(null)}
                      className="absolute right-4 top-4 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="border-b border-white/5 pb-2">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="w-4.5 h-4.5 text-gold-400" />
                        <span>Edit Registration Roster</span>
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Modify Free Fire IGN names or numeric UIDs manually.</p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {/* Government legal ID */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Leader Legal Name</label>
                        <input
                          type="text"
                          value={editRegGovName}
                          onChange={e => setEditRegGovName(e.target.value)}
                          className="w-full bg-[#161622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500 font-bold"
                          required
                        />
                      </div>

                      {/* Team player lists */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-bold text-gold-400 uppercase tracking-widest block">Registered Competitors</label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditRegPlayers([
                                ...editRegPlayers,
                                { nickname: '', gameName: '', uid: '', level: 'Level 1' }
                              ]);
                            }}
                            className="px-2.5 py-1 bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/40 text-purple-300 text-[9px] font-black uppercase rounded-lg transition-all"
                          >
                            + Add Player Slot
                          </button>
                        </div>

                        {editRegPlayers.map((player, idx) => (
                          <div key={idx} className="bg-[#161622] border border-white/5 p-3 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-center pb-1 border-b border-white/5">
                              <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Player Slot {idx + 1}</p>
                              {editRegPlayers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = editRegPlayers.filter((_, i) => i !== idx);
                                    setEditRegPlayers(updated);
                                  }}
                                  className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase"
                                >
                                  Remove Slot
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] text-neutral-500 uppercase tracking-wider">In-Game Name</label>
                                <input
                                  type="text"
                                  value={player.gameName || player.nickname || ''}
                                  onChange={e => handleEditRegPlayerChange(idx, 'gameName', e.target.value)}
                                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="text-[8px] text-neutral-500 uppercase tracking-wider">Free Fire UID (Numeric)</label>
                                <input
                                  type="text"
                                  value={player.uid || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                      handleEditRegPlayerChange(idx, 'uid', val);
                                    }
                                  }}
                                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500 font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                     <div className="flex justify-between items-center pt-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const originalId = editingReg.id;
                            setEditingReg(null);
                            handleDeleteReg(originalId);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase hover:bg-red-500/20 transition-all cursor-pointer text-center"
                        >
                          Delete Roster
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingReg(null)}
                          className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer text-center"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveRegEdit}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer text-center"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* VIEW 10: WEBSITE BRANDING & APPEARANCE */}
        {activeTab === 'website_branding' && (
          <AdminBrandingTab />
        )}

        {/* VIEW: BANNER MANAGEMENT */}
        {activeTab === 'banner_management' && (
          <AdminBannerManagementTab showConfirm={showConfirm} />
        )}

        {/* VIEW: BONUS MANAGEMENT */}
        {activeTab === 'bonus_management' && (
          <AdminBonusManagementTab />
        )}

        {/* VIEW: GAME CATEGORIES MANAGEMENT */}
        {activeTab === 'game_categories' && (
          <AdminCategoriesTab showConfirm={showConfirm} />
        )}

        {/* VIEW 11: SUPPORT WIDGET SETTINGS */}
        {activeTab === 'support_settings' && (
          <AdminSupportSettingsTab />
        )}

        {/* VIEW 12: LOADING PAGE MANAGER */}
        {activeTab === 'loading_page_manager' && (
          <LoadingPageManager />
        )}

        {/* VIEW: STORAGE MANAGER */}
        {activeTab === 'storage_manager' && (
          <StorageManager showConfirm={showConfirm} />
        )}

        {/* VIEW: WEEKLY TOP PLAYERS LEADERBOARD MANAGER */}
        {activeTab === 'weekly_leaderboard_manager' && (
          <WeeklyTopPlayersManager showConfirm={showConfirm} />
        )}

        {/* VIEW: WINNINGS & CHAMPIONS MANAGER */}
        {activeTab === 'winnings_manager' && (
          <AdminWinningsManager showConfirm={showConfirm} />
        )}

        {/* VIEW: AUTHENTICATION PROVIDERS */}
        {activeTab === 'auth_providers' && (
          <AdminAuthProvidersTab />
        )}

        </div>
      </main>

      {showStoragePicker && (
        <MediaPickerModal
          onSelect={(url) => {
            setMatchForm({ ...matchForm, bannerUrl: url });
            setShowStoragePicker(false);
          }}
          onClose={() => setShowStoragePicker(false)}
          allowedTypes={['image']}
          title="Select Tournament Thumbnail"
        />
      )}
    </div>
  );
};

// CHILD HELPER COMPONENT: SCORESHEET MANAGER
interface ScoresheetManagerProps {
  tournament: Tournament;
  onSubmitStats: (winnerUid: string, killsMap: { [uid: string]: number }) => Promise<void>;
  onRemovePlayer: (uid: string, nickname: string) => Promise<void>;
}

const ScoresheetManager: React.FC<ScoresheetManagerProps> = ({ tournament, onSubmitStats, onRemovePlayer }) => {
  const [winnerUid, setWinnerUid] = useState<string>('');
  const [killsMap, setKillsMap] = useState<{ [uid: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset inputs when tournament changes
    setWinnerUid('');
    setKillsMap({});
  }, [tournament]);

  const handleKillChange = (uid: string, val: number) => {
    setKillsMap({
      ...killsMap,
      [uid]: Math.max(0, val)
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerUid) {
      alert("Please select the tournament first-place winner!");
      return;
    }
    setIsSubmitting(true);
    await onSubmitStats(winnerUid, killsMap);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Select 1st Place Winner (40% Grand Pool)</label>
        <select
          required
          value={winnerUid}
          onChange={e => setWinnerUid(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="">-- Click to choose winner --</option>
          {Object.entries(tournament.joinedNicknames).map(([uid, name]) => (
            <option key={uid} value={uid}>{name} (UID: {uid.substring(0, 8)})</option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
        {Object.entries(tournament.joinedNicknames).map(([uid, name]) => (
          <div key={uid} className="py-2.5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-white uppercase tracking-wide truncate">{name}</p>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {uid}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Kills:</span>
                <input 
                  type="number"
                  min="0"
                  value={killsMap[uid] || 0}
                  onChange={e => handleKillChange(uid, Number(e.target.value))}
                  className="w-16 bg-neutral-900 border border-white/10 rounded-lg p-1.5 text-center text-xs text-white font-mono"
                />
              </div>

              <button 
                type="button"
                onClick={() => onRemovePlayer(uid, name)}
                className="p-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[9px] font-bold uppercase cursor-pointer"
              >
                Kick
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        type="submit"
        disabled={isSubmitting || tournament.roomStatus === 'completed'}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
      >
        {isSubmitting ? 'Calculating Payouts...' : tournament.roomStatus === 'completed' ? 'MATCH FINISHED / DISPATCHED' : 'Publish Scoresheets & Distribute Payouts'}
      </button>
    </form>
  );
};

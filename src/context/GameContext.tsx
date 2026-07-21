/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationSettings, PromoSettings } from '../types';
import { 
  auth, 
  db, 
  googleProvider, 
  signOut, 
  signInWithPopup 
} from '../firebase';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  query,
  where,
  orderBy,
  arrayUnion,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  BonusSettings,
  BonusHistory,
  UserProfile, 
  Tournament, 
  Transaction, 
  AppNotification, 
  LeaderboardEntry,
  RoomStatusType,
  PlayerRegistration,
  BrandingSettings, LoadingScreenSettings,
  SupportSettings,
  ContactWidgetSettings,
  GameCategory,
  WeeklyPlayer,
  WeeklyLeaderboardConfig,
  TournamentWinner,
  HomepageBanner,
  StorageFile,
  StorageSettings,
  AuthProvidersPublic,
  AuthProvidersPrivate
} from '../types';
import { 
  MOCK_TOURNAMENTS, 
  MOCK_LEADERBOARD, 
  MOCK_NOTIFICATIONS, 
  FF_AVATARS,
  DEFAULT_BRANDING,
  DEFAULT_SUPPORT_SETTINGS,
  DEFAULT_CONTACT_WIDGET_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_WEEKLY_LEADERBOARD_CONFIG,
  SEED_WEEKLY_PLAYERS,
  SEED_WINNERS
} from '../dataStore';

interface GameContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  tournaments: Tournament[];
  transactions: Transaction[];
  notifications: AppNotification[];
  leaderboard: LeaderboardEntry[];
  bonusSettings: BonusSettings | null;
  loading: boolean;
  error: string | null;
  registrations: PlayerRegistration[];
  registeringTournament: Tournament | null;
  setRegisteringTournament: (t: Tournament | null) => void;
  // Auth Functions
  loginWithCredentials: (usernameOrMobile: string, pass: string) => Promise<void>;
  registerWithCredentials: (username: string, mobile: string, pass: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  // Wallet & Game Actions
  depositMoney: (amount: number, method: 'UPI' | 'Paytm' | 'PhonePe' | 'GPay' | 'Razorpay', refNo?: string) => Promise<void>;
  withdrawMoney: (amount: number, upiId: string) => Promise<{ success: boolean; message: string }>;
  joinTournament: (
    tournamentId: string,
    governmentName?: string,
    players?: { gameName: string; uid: string }[]
  ) => Promise<{ success: boolean; message: string }>;
  triggerNotification: (title: string, message: string, type: 'info' | 'alert' | 'winner' | 'system') => Promise<void>;
  refreshTransactions: () => Promise<void>;
  // Manual status change helper for demonstration/interactivity
  simulateMatchCompletion: (tournamentId: string) => Promise<void>;
  initiateJoinTournament: (tournamentId: string) => Promise<{ success: boolean; redirectWallet?: boolean; requireConfirmation?: boolean; entryFee?: number; message?: string }>;
  processJoinPayment: (tournamentId: string) => Promise<{ success: boolean; message: string }>;
  submitRegistration: (players: { nickname: string; uid: string; level?: string }[]) => Promise<{ success: boolean; message: string; registrationId?: string; teamId?: string }>;
  updateRegistrationAdmin: (id: string, updates: Partial<PlayerRegistration>) => Promise<void>;
  refundRegistrationAdmin: (id: string) => Promise<void>;
  saveTournamentAdmin: (tournament: Tournament) => Promise<void>;
  deleteTournamentAdmin: (id: string) => Promise<void>;

  categories: GameCategory[];
  saveCategoryAdmin: (category: GameCategory) => Promise<void>;
  deleteCategoryAdmin: (id: string) => Promise<void>;

  brandingSettings: BrandingSettings;
  loadingScreenSettings: LoadingScreenSettings;
  updateLoadingScreenSettings: (updates: Partial<LoadingScreenSettings>) => Promise<void>;
  updateBrandingSettings: (updates: Partial<BrandingSettings>) => Promise<void>;
  supportSettings: SupportSettings;
  updateSupportSettings: (updates: Partial<SupportSettings>) => Promise<void>;
  contactWidgetSettings: ContactWidgetSettings;
  updateContactWidgetSettings: (updates: Partial<ContactWidgetSettings>) => Promise<void>;
  weeklyPlayers: WeeklyPlayer[];
  weeklyLeaderboardConfig: WeeklyLeaderboardConfig;
  saveWeeklyPlayerAdmin: (player: WeeklyPlayer) => Promise<void>;
  deleteWeeklyPlayerAdmin: (id: string) => Promise<void>;
  updateWeeklyLeaderboardConfigAdmin: (updates: Partial<WeeklyLeaderboardConfig>) => Promise<void>;
  winners: TournamentWinner[];
  saveWinnerAdmin: (winner: TournamentWinner) => Promise<void>;
  deleteWinnerAdmin: (id: string) => Promise<void>;
  homepageBanners: HomepageBanner[];
  saveHomepageBannerAdmin: (banner: HomepageBanner) => Promise<void>;
  deleteHomepageBannerAdmin: (id: string) => Promise<void>;

  storageFiles: StorageFile[];
  storageSettings: StorageSettings;
  saveStorageFileAdmin: (file: Omit<StorageFile, 'id'> & { id?: string }) => Promise<void>;
  deleteStorageFileAdmin: (id: string) => Promise<void>;
  updateStorageSettingsAdmin: (settings: Partial<StorageSettings>) => Promise<void>;
  notificationSettings: NotificationSettings;
  updateNotificationSettingsAdmin: (settings: Partial<NotificationSettings>) => Promise<void>;
  promoSettings: PromoSettings;
  updatePromoSettingsAdmin: (settings: Partial<PromoSettings>) => Promise<void>;
  authProviders: AuthProvidersPublic;
  updateAuthProvidersAdmin: (publicSettings: AuthProvidersPublic, privateSettings: AuthProvidersPrivate) => Promise<void>;
}

export const DEFAULT_PROMO_SETTINGS = { promoCodesEnabled: true };

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [bonusSettings, setBonusSettings] = useState<BonusSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState<boolean>(false);
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([]);
  const [registeringTournament, setRegisteringTournament] = useState<Tournament | null>(null);
  
const DEFAULT_LOADING_SCREEN: LoadingScreenSettings = {
  loadingLogoUrl: '',
  loadingLogoSource: 'url',
  loadingTitle: 'TITAN ESPORTS',
  loadingSubtitle: 'PREMIUM GAMING',
  loadingText: 'INITIALIZING SYSTEM',
  backgroundColor: '#08080c',
  backgroundImage: '',
  progressBarEnabled: true,
  animationEnabled: true,
  uploadedLogoUrl: '',
  directLogoUrl: '',
  loadingLogoType: 'default'
};

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loadingScreenSettings, setLoadingScreenSettings] = useState<LoadingScreenSettings>(DEFAULT_LOADING_SCREEN);
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);
  const [contactWidgetSettings, setContactWidgetSettings] = useState<ContactWidgetSettings>(DEFAULT_CONTACT_WIDGET_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [promoSettings, setPromoSettings] = useState<PromoSettings>(DEFAULT_PROMO_SETTINGS);
  const [authProviders, setAuthProviders] = useState<AuthProvidersPublic>({
    email: true,
    google: true,
    facebook: false,
    apple: false,
    github: false,
    twitter: false,
    microsoft: false,
    phone: false
  });
  const [categories, setCategories] = useState<GameCategory[]>(DEFAULT_CATEGORIES);
  const [weeklyPlayers, setWeeklyPlayers] = useState<WeeklyPlayer[]>([]);
  const [weeklyLeaderboardConfig, setWeeklyLeaderboardConfig] = useState<WeeklyLeaderboardConfig>(DEFAULT_WEEKLY_LEADERBOARD_CONFIG);
  const [winners, setWinners] = useState<TournamentWinner[]>([]);
  const [homepageBanners, setHomepageBanners] = useState<HomepageBanner[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [storageSettings, setStorageSettings] = useState<StorageSettings>({ provider: 'firebase' });


  // Helper: Create initial database structure (Seed Data) if empty in Firestore
  const checkAndSeedDatabase = async (): Promise<boolean> => {
    try {
      console.log("[GameContext] Checking database state...");
      
      // Parallelize all initial collection/doc checks
      console.log("[GameContext] Starting initial document checks...");
      const [
        tournSnap,
        testRegSnap,
        lbSnap,
        notSnap,
        catSnap,
        wpSnap,
        wlcSnap,
        tUpcomingSnap
      ] = await Promise.all([
        getDocs(collection(db, 'tournaments')).catch(err => { console.warn("Notice reading tournaments:", err); return { empty: true, docs: [] } as any; }),
        getDoc(doc(db, 'registrations', 'REG-882930')).catch(err => { console.warn("Notice reading registration:", err); return { exists: () => false, data: () => null } as any; }),
        getDocs(collection(db, 'leaderboard')).catch(err => { console.warn("Notice reading leaderboard:", err); return { empty: true, docs: [] } as any; }),
        getDocs(collection(db, 'notifications')).catch(err => { console.warn("Notice reading notifications:", err); return { empty: true, docs: [] } as any; }),
        getDocs(collection(db, 'categories')).catch(err => { console.warn("Notice reading categories:", err); return { empty: true, docs: [] } as any; }),
        getDocs(collection(db, 'weekly_players')).catch(err => { console.warn("Notice reading weekly_players:", err); return { empty: true, docs: [] } as any; }),
        getDoc(doc(db, 'settings', 'weekly_leaderboard')).catch(err => { console.warn("Notice reading settings/weekly_leaderboard:", err); return { exists: () => false, data: () => null } as any; }),
        getDoc(doc(db, 'tournaments', 't_upcoming_1')).catch(err => { console.warn("Notice reading tournaments/t_upcoming_1:", err); return { exists: () => false, data: () => null } as any; })
      ]);
      console.log("[GameContext] Initial document checks complete.");

      const seedPromises: Promise<any>[] = [];

      // 1. Tournaments
      if (tournSnap.empty) {
        console.log("Seeding Firestore with initial tournaments...");
        MOCK_TOURNAMENTS.forEach(t => {
          seedPromises.push(setDoc(doc(db, 'tournaments', t.id), t));
        });
      } else if (tUpcomingSnap.exists()) {
        // Update t_upcoming_1 if needed
        const currentData = tUpcomingSnap.data();
        if (!currentData.joinedTeams || currentData.joinedTeams.length === 0 || (currentData.joinedSlots && currentData.joinedSlots.length < 16)) {
          const updatedTournamentInfo = MOCK_TOURNAMENTS.find(m => m.id === 't_upcoming_1');
          if (updatedTournamentInfo) {
            console.log("Updating Firestore t_upcoming_1...");
            seedPromises.push(setDoc(doc(db, 'tournaments', 't_upcoming_1'), updatedTournamentInfo, { merge: true }));
          }
        }
      }

      // 2. Registrations
      if (!testRegSnap.exists()) {
        console.log("Seeding Firestore with squad team registrations...");
        const squadRegistrations: PlayerRegistration[] = [
          {
            id: 'REG-882930',
            teamId: 'TEAM-991203',
            userId: 'u_sim_1',
            userEmail: 'viper_ff@arena.com',
            tournamentId: 't_upcoming_1',
            tournamentName: 'TITAN ESP Grand Cup - Bermuda Squad',
            matchType: 'Squad',
            entryFee: 20,
            prizePool: 1000,
            map: 'Bermuda',
            dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            players: [
              { nickname: 'ViperFF', uid: '827463920', level: 'Level 71' },
              { nickname: 'AlphaGamer', uid: '984729410', level: 'Level 68' },
              { nickname: 'SoulMortal', uid: '109283742', level: 'Level 72' },
              { nickname: 'GyanSujjan', uid: '55827391', level: 'Level 64' }
            ],
            registeredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            status: 'completed',
            paymentStatus: 'completed',
            governmentName: 'Lokesh Kumar'
          },
          {
            id: 'REG-449302',
            teamId: 'TEAM-228391',
            userId: 'u_sim_5',
            userEmail: 'killer_ff@arena.com',
            tournamentId: 't_upcoming_1',
            tournamentName: 'TITAN ESP Grand Cup - Bermuda Squad',
            matchType: 'Squad',
            entryFee: 20,
            prizePool: 1000,
            map: 'Bermuda',
            dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            players: [
              { nickname: 'KillerFF', uid: '304918274', level: 'Level 65' },
              { nickname: 'GarenaKing', uid: '948201938', level: 'Level 61' },
              { nickname: 'ThunderDuo', uid: '482019283', level: 'Level 58' },
              { nickname: 'SniperGod', uid: '773910293', level: 'Level 70' }
            ],
            registeredAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            status: 'completed',
            paymentStatus: 'completed',
            governmentName: 'Ayush Sharma'
          },
          {
            id: 'REG-119302',
            teamId: 'TEAM-552839',
            userId: 'u_sim_9',
            userEmail: 'titan_gaming@arena.com',
            tournamentId: 't_upcoming_1',
            tournamentName: 'TITAN ESP Grand Cup - Bermuda Squad',
            matchType: 'Squad',
            entryFee: 20,
            prizePool: 1000,
            map: 'Bermuda',
            dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            players: [
              { nickname: 'TitanFF', uid: '667281930', level: 'Level 62' },
              { nickname: 'SlateGamer', uid: '889302194', level: 'Level 65' },
              { nickname: 'BermudaKing', uid: '443920193', level: 'Level 63' },
              { nickname: 'GrandCupPro', uid: '122938475', level: 'Level 67' }
            ],
            registeredAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            status: 'completed',
            paymentStatus: 'completed',
            governmentName: 'Rajesh Yadav'
          },
          {
            id: 'REG-662930',
            teamId: 'TEAM-882039',
            userId: 'u_sim_13',
            userEmail: 'shadow_gamer@arena.com',
            tournamentId: 't_upcoming_1',
            tournamentName: 'TITAN ESP Grand Cup - Bermuda Squad',
            matchType: 'Squad',
            entryFee: 20,
            prizePool: 1000,
            map: 'Bermuda',
            dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            players: [
              { nickname: 'ShadowGamer', uid: '110293049', level: 'Level 69' },
              { nickname: 'DynamoFF', uid: '334455667', level: 'Level 69' },
              { nickname: 'KrontenFF', uid: '223344556', level: 'Level 62' },
              { nickname: 'HeistKing', uid: '998877665', level: 'Level 66' }
            ],
            registeredAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
            status: 'completed',
            paymentStatus: 'completed',
            governmentName: 'Karan Singh'
          }
        ];
        squadRegistrations.forEach(reg => {
          seedPromises.push(setDoc(doc(db, 'registrations', reg.id), reg));
        });
      }

      // 3. Leaderboard
      if (lbSnap.empty) {
        console.log("Seeding Firestore with leaderboard entries...");
        MOCK_LEADERBOARD.forEach(entry => {
          seedPromises.push(setDoc(doc(db, 'leaderboard', entry.userId), entry));
        });
      }

      // 4. Notifications
      if (notSnap.empty) {
        console.log("Seeding Firestore with announcements...");
        MOCK_NOTIFICATIONS.forEach(n => {
          seedPromises.push(setDoc(doc(db, 'notifications', n.id), n));
        });
      }

      // 5. Categories
      if (catSnap.empty) {
        console.log("Seeding Firestore with categories...");
        DEFAULT_CATEGORIES.forEach(cat => {
          seedPromises.push(setDoc(doc(db, 'categories', cat.id), cat));
        });
      }

      // 6. Weekly Players
      if (wpSnap.empty) {
        console.log("Seeding Firestore with weekly players...");
        SEED_WEEKLY_PLAYERS.forEach(player => {
          seedPromises.push(setDoc(doc(db, 'weekly_players', player.id), player));
        });
      }

      // 7. Weekly Leaderboard Config
      if (!wlcSnap.exists()) {
        console.log("Seeding Firestore with weekly leaderboard configuration...");
        seedPromises.push(setDoc(doc(db, 'settings', 'weekly_leaderboard'), DEFAULT_WEEKLY_LEADERBOARD_CONFIG));
      }

      // Execute all seeding concurrently if any
      if (seedPromises.length > 0) {
        console.log(`[GameContext] Executing ${seedPromises.length} seed operations...`);
        await Promise.all(seedPromises.map(p => p.catch(err => {
          console.error("Seed operation failed:", err);
          throw err;
        })));
        console.log("[GameContext] Seeding complete.");
      }

      return true;
    } catch (e: any) {
      console.warn("Database seeding failed or timed out:", e);
      return false;
    }
  };

  // Sync state with Firestore in real-time, or use local state if fallback is active
  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    const initApp = async () => {
      console.log("[GameContext] Initializing...");
      
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout during initialization")), 25000)
      );

      try {
        if (useLocalFallback) {
          console.log("[GameContext] Using local fallback, skipping Firestore init");
          setLoading(false);
          return;
        }

        // Try to check database state, but don't let it block the entire app forever
        let success = false;
        try {
          console.log("[GameContext] Starting database check...");
          success = await Promise.race([
            checkAndSeedDatabase(),
            timeoutPromise
          ]);
          console.log("[GameContext] Database check completed, success:", success);
        } catch (dbErr) {
          console.warn("[GameContext] Database check failed or timed out, proceeding anyway:", dbErr);
          // We proceed anyway; if listeners fail, handleSnapshotError will trigger fallback
          success = true; 
        }
        
        if (!isMounted) return;

        const handleSnapshotError = (err: any, context: string) => {
          console.warn(`${context} sync error: Firebase unavailable.`, err);
          // Only switch to local fallback for critical quota issues
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
            console.error("[GameContext] Critical quota error detected");
            setUseLocalFallback(true);
          }
        };

        // Setup real-time listeners and store unsubs
        console.log("[GameContext] Setting up listeners...");
        unsubs.push(onSnapshot(collection(db, 'tournaments'), 
          (snapshot) => {
            const list: Tournament[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() } as Tournament);
            });
            setTournaments(list);
          },
          (err) => handleSnapshotError(err, "Tournaments")
        ));

        unsubs.push(onSnapshot(doc(db, 'appSettings', 'bonus'), (docSnap) => {
          if (docSnap.exists()) {
            setBonusSettings(docSnap.data());
          } else {
            setBonusSettings(null);
          }
        }, (err) => handleSnapshotError(err, "Bonus")));

        unsubs.push(onSnapshot(collection(db, 'leaderboard'),
          (snapshot) => {
            const list: LeaderboardEntry[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as LeaderboardEntry);
            });
            setLeaderboard(list.length > 0 ? list.sort((a,b) => b.totalEarnings - a.totalEarnings) : MOCK_LEADERBOARD);
          },
          (err) => {
            console.warn("Leaderboard sync error: Firebase unavailable.");
            setUseLocalFallback(true);
          }
        ));

        unsubs.push(onSnapshot(collection(db, 'notifications'),
          (snapshot) => {
            const list: AppNotification[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() } as AppNotification);
            });
            setNotifications(list.length > 0 ? list : MOCK_NOTIFICATIONS);
          }, (err) => handleSnapshotError(err, "Notifications")
        ));

        unsubs.push(onSnapshot(doc(db, 'settings', 'branding'), (docSnap) => {
          if (docSnap.exists()) {
            setBrandingSettings(docSnap.data() as BrandingSettings);
          } else {
            setDoc(doc(db, 'settings', 'branding'), DEFAULT_BRANDING).catch(console.error);
            setBrandingSettings(DEFAULT_BRANDING);
          }
        }, (err) => handleSnapshotError(err, "Branding")));

        unsubs.push(onSnapshot(doc(db, "loading_settings", "config"), (docSnap) => {
          if (docSnap.exists()) {
            setLoadingScreenSettings(docSnap.data() as LoadingScreenSettings);
          } else {
            setLoadingScreenSettings(DEFAULT_LOADING_SCREEN);
          }
        }, (err) => handleSnapshotError(err, "LoadingScreen")));

        unsubs.push(onSnapshot(doc(db, 'support_settings', 'config'), (docSnap) => {
          if (docSnap.exists()) {
            setSupportSettings(docSnap.data() as SupportSettings);
          } else {
            setSupportSettings(DEFAULT_SUPPORT_SETTINGS);
          }
        }, (err) => handleSnapshotError(err, "Support")));

        unsubs.push(onSnapshot(doc(db, 'contact_widget_settings', 'config'), (docSnap) => {
          if (docSnap.exists()) {
            setContactWidgetSettings(docSnap.data() as ContactWidgetSettings);
          } else {
            setContactWidgetSettings(DEFAULT_CONTACT_WIDGET_SETTINGS);
          }
        }, (err) => handleSnapshotError(err, "ContactWidget")));

        unsubs.push(onSnapshot(collection(db, 'categories'), (snapshot) => {
          const list: GameCategory[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as GameCategory);
          });
          setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
        }, (err) => handleSnapshotError(err, "Categories")));

        unsubs.push(onSnapshot(collection(db, 'weekly_players'), (snapshot) => {
          const list: WeeklyPlayer[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as WeeklyPlayer);
          });
          setWeeklyPlayers(list);
        }, (err) => handleSnapshotError(err, "WeeklyPlayers")));

        unsubs.push(onSnapshot(collection(db, 'winners'), (snapshot) => {
          const list: TournamentWinner[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as TournamentWinner);
          });
          setWinners(list.length > 0 ? list : SEED_WINNERS);
        }, (err) => handleSnapshotError(err, "Winners")));

        unsubs.push(onSnapshot(doc(db, 'settings', 'weekly_leaderboard'), (docSnap) => {
          if (docSnap.exists()) {
            setWeeklyLeaderboardConfig(docSnap.data() as WeeklyLeaderboardConfig);
          } else {
            setWeeklyLeaderboardConfig(DEFAULT_WEEKLY_LEADERBOARD_CONFIG);
          }
        }, (err) => handleSnapshotError(err, "WeeklyLeaderboardConfig")));

        unsubs.push(onSnapshot(collection(db, 'homepage_banners'), (snapshot) => {
          const list: HomepageBanner[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as HomepageBanner);
          });
          setHomepageBanners(list);
        }, (err) => handleSnapshotError(err, "Banners")));

        unsubs.push(onSnapshot(collection(db, 'storage_files'), (snapshot) => {
          const list: StorageFile[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as StorageFile);
          });
          setStorageFiles(list);
        }, (err) => handleSnapshotError(err, "StorageFiles")));

        unsubs.push(onSnapshot(doc(db, 'settings', 'promo'), (docSnap) => {
          if (docSnap.exists()) {
            setPromoSettings(docSnap.data() as PromoSettings);
          } else {
            setPromoSettings(DEFAULT_PROMO_SETTINGS);
          }
        }, (err) => handleSnapshotError(err, "PromoSettings")));
        
        unsubs.push(onSnapshot(doc(db, 'settings', 'notifications'), (docSnap) => {
          if (docSnap.exists()) {
            setNotificationSettings(docSnap.data() as NotificationSettings);
          } else {
            setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
          }
        }, (err) => handleSnapshotError(err, "NotificationSettings")));

        unsubs.push(onSnapshot(doc(db, 'settings', 'storage'), (docSnap) => {
          if (docSnap.exists()) {
            setStorageSettings(docSnap.data() as StorageSettings);
          } else {
            setStorageSettings({ provider: 'firebase' });
          }
        }, (err) => handleSnapshotError(err, "StorageSettings")));

        unsubs.push(onSnapshot(doc(db, 'settings', 'auth_public'), (docSnap) => {
          if (docSnap.exists()) {
            setAuthProviders(docSnap.data() as AuthProvidersPublic);
          } else {
            const defaultProviders: AuthProvidersPublic = {
              email: true,
              google: true,
              facebook: false,
              apple: false,
              github: false,
              twitter: false,
              microsoft: false,
              phone: false
            };
            setDoc(doc(db, 'settings', 'auth_public'), defaultProviders).catch(console.error);
            setAuthProviders(defaultProviders);
          }
        }, (err) => handleSnapshotError(err, "AuthPublic")));

        setLoading(false);
      } catch (err) {
        console.error("[GameContext] Initialization failed:", err);
        if (isMounted) {
          setUseLocalFallback(true);
          setLoading(false);
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
      unsubs.forEach(unsub => unsub());
    };
  }, [useLocalFallback]);

  // Handle Redirect Result on Mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log("Checking for Google redirect sign-in result...");
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Successfully signed in via redirect:", result.user);
          setCurrentUser(result.user);
        }
      } catch (err: any) {
        console.error("Error retrieving Google redirect sign-in result:");
        let friendlyMessage = err.message || "Google Redirect Sign-In failed.";
        if (err.code === 'auth/unauthorized-domain' || friendlyMessage.includes('unauthorized-domain') || friendlyMessage.includes('authDomain')) {
          friendlyMessage = "This domain is not authorized for Google Sign-In. Please contact the administrator to add this domain to the Firebase Console Authorized Domains list.";
        } else if (err.code === 'auth/invalid-oauth-client-id' || friendlyMessage.includes('client-id')) {
          friendlyMessage = "Invalid OAuth Client ID configuration in Firebase.";
        } else if (err.code === 'auth/network-request-failed') {
          friendlyMessage = "Network error. Please check your internet connection.";
        }
        setError(friendlyMessage);
        triggerNotification("Authentication Error", friendlyMessage, "alert");
      }
    };
    
    if (!useLocalFallback) {
      handleRedirect();
    }
  }, [useLocalFallback]);

  // Auth Status listener
  useEffect(() => {
    let unsubUserSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Clear custom auth if Google sign in is active
        localStorage.removeItem('custom_auth_user');
        try {
          if (!useLocalFallback) {
            const userDocRef = doc(db, 'users', user.uid);
            
            if (unsubUserSnapshot) {
              unsubUserSnapshot();
            }

            // Set up real-time listener for user profile (for instant wallet updates)
            unsubUserSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
              }
            }, (err) => {
              console.warn("User profile sync error: Firebase unavailable.");
              if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
                setUseLocalFallback(true);
              }
            });

            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              await updateDoc(userDocRef, { 
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              syncTransactions(user.uid);
            } else {
              // Create user profile on first sign in (Google sign-in)
              const uniqueReferral = 'VA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
              const initialProfile = {
                uid: user.uid,
                userId: user.uid,
                username: user.displayName || 'Gamer_' + Math.random().toString(36).substring(2, 6),
                email: user.email || '',
                nickname: user.displayName || 'Gamer_' + Math.random().toString(36).substring(2, 6),
                displayName: user.displayName || 'Gamer',
                photoURL: user.photoURL || '',
                profilePhoto: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                mobileNumber: '',
                referralCode: uniqueReferral,
                walletBalance: 0,
                provider: 'Google',
                accountStatus: 'Active',
                createdAt: new Date().toISOString(),
                joinedAt: new Date().toISOString(), // For backwards compatibility
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                // Default fields for backwards compatibility with the UI:
                freefireUid: '',
                avatarUrl: user.photoURL || FF_AVATARS[0],
                profileImage: user.photoURL || FF_AVATARS[0],
                depositBalance: 0,
                winningBalance: 0,
                bonusBalance: 0,
                totalMatches: 0,
                totalWins: 0,
                totalKills: 0,
                totalEarnings: 0,
                isNotificationEnabled: true,
                role: 'user',
              };

              await setDoc(userDocRef, initialProfile);

              // Add a sign-up transaction
              const transRef = collection(db, 'transactions');
              await addDoc(transRef, {
                userId: user.uid,
                amount: 0,
                type: 'bonus_coins',
                paymentMethod: 'System',
                dateTime: new Date().toISOString(),
                status: 'completed',
                description: 'Google Sign up complete!'
              });

              syncTransactions(user.uid);
              
              // Push signup welcome notification
              await triggerNotification(
                "Welcome to TITAN ESP! 🎁",
                "Your account is created successfully via Google Sign-In. Add Free Fire UID and enter battles!",
                "info"
              );
            }
          } else {
            // Local fallback mock user
            setupLocalProfile(user);
          }
        } catch (e) {
          console.warn("Failed to retrieve or create profile, fallback to local:");
          setupLocalProfile(user);
        }
      } else {
        // Firebase Auth user is null, check for custom Username/Mobile auth user
        const storedCustomUserStr = localStorage.getItem('custom_auth_user');
        if (storedCustomUserStr && !useLocalFallback) {
          try {
            const customUser = JSON.parse(storedCustomUserStr);
            const userDocRef = doc(db, 'users', customUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              if (data.accountStatus?.toLowerCase() !== 'disabled') {
                setCurrentUser({ uid: customUser.uid, email: data.email || '' } as any);
                setUserProfile(data as UserProfile);
                
                if (unsubUserSnapshot) {
                  unsubUserSnapshot();
                }

                unsubUserSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
              }
            }, (err) => {
              console.warn("User profile sync error: Firebase unavailable.");
              if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
                setUseLocalFallback(true);
              }
            });
                syncTransactions(customUser.uid);
                return;
              } else {
                localStorage.removeItem('custom_auth_user');
              }
            } else {
              localStorage.removeItem('custom_auth_user');
            }
          } catch (e) {
            console.warn("Failed to retrieve custom user session");
            localStorage.removeItem('custom_auth_user');
          }
        }

        // Truly logged out
        if (unsubUserSnapshot) {
          unsubUserSnapshot();
          unsubUserSnapshot = null;
        }
        setCurrentUser(null);
        setUserProfile(null);
        setTransactions([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserSnapshot) {
        unsubUserSnapshot();
      }
    };
  }, [useLocalFallback]);

  // Realtime registrations synchronization
  useEffect(() => {
    if (useLocalFallback) {
      const localRegs = localStorage.getItem('registrations');
      if (localRegs) {
        try {
          setRegistrations(JSON.parse(localRegs));
        } catch (e) {
          console.warn("An error occurred");
        }
      }
      return;
    }

    if (!currentUser) {
      setRegistrations([]);
      return;
    }

    let q;
    if (userProfile?.role === 'admin') {
      q = query(collection(db, 'registrations'), orderBy('registeredAt', 'desc'));
    } else {
      q = query(
        collection(db, 'registrations'),
        where('userId', '==', currentUser.uid),
        orderBy('registeredAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PlayerRegistration[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PlayerRegistration);
      });
      setRegistrations(list);
    }, (err) => {
      console.warn("Registrations sync error, using local fallback. Firebase unavailable.");
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) setUseLocalFallback(true);
      const localRegs = localStorage.getItem('registrations');
      if (localRegs) {
        try {
          setRegistrations(JSON.parse(localRegs));
        } catch (e) {
          console.warn("An error occurred");
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, userProfile?.role, useLocalFallback]);

  // Handle transaction sync
  const syncTransactions = (uid: string) => {
    if (useLocalFallback) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', uid), orderBy('dateTime', 'desc'));
    onSnapshot(q, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(list);
    }, (err) => { console.warn("Transactions sync error: Firebase unavailable."); if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) setUseLocalFallback(true); });
  };

  const setupLocalProfile = (user: User) => {
    // Check if we have standard cached profile
    const cached = localStorage.getItem(`profile_${user.uid}`);
    if (cached) {
      setUserProfile(JSON.parse(cached));
    } else {
      const localProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        nickname: user.displayName || 'lokesh meena',
        freefireUid: '55827391',
        avatarUrl: user.photoURL || FF_AVATARS[0],
        depositBalance: 50, // Starts with some cash for testing
        winningBalance: 25,
        bonusBalance: 15,
        referralCode: 'VA-LOK88',
        totalMatches: 2,
        totalWins: 1,
        totalKills: 8,
        totalEarnings: 150,
        isNotificationEnabled: true,
        joinedAt: new Date().toISOString(),
        role: 'user'
      };
      setUserProfile(localProfile);
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(localProfile));
    }

    // Sync mock local transactions
    const mockTrans: Transaction[] = [
      {
        id: 'trans_init',
        userId: user.uid,
        amount: 50,
        type: 'deposit_success',
        paymentMethod: 'UPI',
        referenceNo: 'UPI98427391',
        dateTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        status: 'completed',
        description: 'UPI Add Cash Success'
      },
      {
        id: 'trans_bonus',
        userId: user.uid,
        amount: 15,
        type: 'referral_bonus',
        paymentMethod: 'System',
        dateTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        status: 'completed',
        description: 'Referral signup reward code used'
      },
      {
        id: 'trans_match',
        userId: user.uid,
        amount: 20,
        type: 'match_join_fee',
        paymentMethod: 'System',
        dateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'completed',
        description: 'Joined Ultimate Battle Clash Squad'
      }
    ];
    setTransactions(mockTrans);
  };

  const refreshTransactions = async () => {
    if (currentUser) {
      if (useLocalFallback) {
        // Mock simple transaction reload
        return;
      }
      syncTransactions(currentUser.uid);
    }
  };

  // Auth Operations
  const hashPassword = async (password: string): Promise<string> => {
    try {
      console.log("[Auth] Hashing password...");
      if (!window.crypto || !window.crypto.subtle) {
        console.warn("[Auth] crypto.subtle not available, using fallback");
        throw new Error("subtle_crypto_missing");
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      console.log("[Auth] Password hashed");
      return hash;
    } catch (err) {
      console.warn("[Auth] SHA-256 hashing failed, using fallback hash:", err);
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return 'fb-' + Math.abs(hash).toString(16);
    }
  };

  const getAuthErrorMessage = (error: any) => {
    const code = error.code || error.message || '';
    if (code.includes('auth/email-already-in-use')) return 'Email already exists.';
    if (code.includes('auth/invalid-email')) return 'Invalid email address.';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) return 'Incorrect password or user not found.';
    if (code.includes('auth/user-not-found')) return 'User not found.';
    if (code.includes('auth/operation-not-allowed')) return 'Username/Mobile login method is currently unavailable. Please use Google Sign-In instead.';
    if (code.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
    return error.message || 'An authentication error occurred.';
  };


  const loginWithCredentials = async (usernameOrMobile: string, pass: string) => {
    setError(null);
    console.log("[Auth] Login attempt for:", usernameOrMobile);

    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Login timed out. Please check your connection.")), 20000)
    );

    const loginPromise = (async () => {
      try {
        if (useLocalFallback) {
          console.warn("[Auth] Using local fallback for login");
          throw new Error("Cloud connection is currently unstable. Please try again in a few minutes.");
        }

        let userDoc = null;
        let userDocId = null;
        const usersRef = collection(db, 'users');
        
        console.log("[Auth] Querying users...");
        const qUsername = query(usersRef, where('username', '==', usernameOrMobile));
        const snapUsername = await getDocs(qUsername);
        if (!snapUsername.empty) {
          userDoc = snapUsername.docs[0].data();
          userDocId = snapUsername.docs[0].id;
        } else {
          const qNickname = query(usersRef, where('nickname', '==', usernameOrMobile));
          const snapNickname = await getDocs(qNickname);
          if (!snapNickname.empty) {
            userDoc = snapNickname.docs[0].data();
            userDocId = snapNickname.docs[0].id;
          } else {
            const qMobile = query(usersRef, where('mobileNumber', '==', usernameOrMobile));
            const snapMobile = await getDocs(qMobile);
            if (!snapMobile.empty) {
              userDoc = snapMobile.docs[0].data();
              userDocId = snapMobile.docs[0].id;
            }
          }
        }

        if (!userDoc || !userDocId) {
          throw new Error('Username or Mobile Number not found.');
        }
        
        const status = userDoc.accountStatus || 'active';
        if (status.toLowerCase() === 'disabled') {
          throw new Error('Account Disabled. Please contact support.');
        }

        // Verify custom password hash
        const inputHash = await hashPassword(pass);
        if (userDoc.passwordHash && userDoc.passwordHash !== inputHash) {
          throw new Error('Incorrect password.');
        }

        console.log("[Auth] Credentials verified, updating session...");
        await updateDoc(doc(db, 'users', userDocId), { 
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Login custom session
        localStorage.setItem('custom_auth_user', JSON.stringify({ uid: userDocId }));
        setCurrentUser({ uid: userDocId, email: userDoc.email || '' } as any);
        setUserProfile(userDoc as UserProfile);
        syncTransactions(userDocId);
        console.log("[Auth] Login completed successfully");
      } catch (e: any) {
        throw e;
      }
    })();

    try {
      await Promise.race([loginPromise, timeout]);
    } catch (e: any) {
      console.error("[Auth] Login error:", e);
      const msg = e.message || 'An authentication error occurred.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerWithCredentials = async (
    username: string, 
    mobile: string, 
    pass: string, 
    referralCode?: string
  ) => {
    setError(null);
    console.log("[Auth] Starting registration for:", username);
    
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Registration timed out. Please check your connection.")), 20000)
    );

    const registrationPromise = (async () => {
      try {
        if (useLocalFallback) {
          console.warn("[Auth] Registration attempted during local fallback");
          throw new Error("Cloud connection is currently unstable. Please try again in a few minutes.");
        }

        const usersRef = collection(db, 'users');
        
        // Check username and nickname uniqueness
        console.log("[Auth] Checking username uniqueness...");
        const qNickname = query(usersRef, where('nickname', '==', username));
        const snapNickname = await getDocs(qNickname);
        const qUsername = query(usersRef, where('username', '==', username));
        const snapUsername = await getDocs(qUsername);
        if (!snapNickname.empty || !snapUsername.empty) {
          throw new Error('Username already exists. Please choose a different one.');
        }
        
        // Check mobile uniqueness
        console.log("[Auth] Checking mobile uniqueness...");
        const qMobile = query(usersRef, where('mobileNumber', '==', mobile));
        const snapMobile = await getDocs(qMobile);
        if (!snapMobile.empty) {
          throw new Error('Mobile Number already exists.');
        }

        console.log("[Auth] All uniqueness checks passed");

        // Generate hidden email format (saved in DB for backwards compatibility)
        const hiddenEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@titanesp.app`;
        const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const uniqueReferral = 'TE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const passwordHash = await hashPassword(pass);
        const depBal = referralCode ? 35 : 20;
        const bonBal = referralCode ? 15 : 10;
        const walletBal = depBal + bonBal;
        const avatar = FF_AVATARS[Math.floor(Math.random() * FF_AVATARS.length)];

        const initialProfile = {
          uid: uid,
          userId: uid,
          email: hiddenEmail,
          nickname: username,
          username: username,
          mobileNumber: mobile,
          passwordHash: passwordHash,
          freefireUid: '',
          avatarUrl: avatar,
          profileImage: avatar,
          depositBalance: depBal,
          winningBalance: 0,
          bonusBalance: bonBal,
          walletBalance: walletBal,
          referralCode: uniqueReferral,
          referredBy: referralCode || undefined,
          totalMatches: 0,
          totalWins: 0,
          totalKills: 0,
          totalEarnings: 0,
          isNotificationEnabled: true,
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          accountStatus: 'active',
          lastLogin: new Date().toISOString()
        };

        console.log("[Auth] Writing user profile to Firestore...");
        await setDoc(doc(db, 'users', uid), initialProfile);
        
        console.log("[Auth] Adding initial transaction...");
        await addDoc(collection(db, 'transactions'), {
          userId: uid,
          amount: referralCode ? 50 : 30,
          type: 'referral_bonus',
          paymentMethod: 'System',
          dateTime: new Date().toISOString(),
          status: 'completed',
          description: referralCode ? 'Referred signup promo added!' : 'Sign up promotional balance added!'
        });

        console.log("[Auth] Registration successful, finishing up...");
        // Login custom session
        localStorage.setItem('custom_auth_user', JSON.stringify({ uid }));
        setCurrentUser({ uid, email: hiddenEmail } as any);
        setUserProfile(initialProfile as UserProfile);
        syncTransactions(uid);
      } catch (e: any) {
        throw e;
      }
    })();

    try {
      await Promise.race([registrationPromise, timeout]);
    } catch (e: any) {
      console.error("[Auth] Registration error:", e);
      const msg = e.message || 'An authentication error occurred.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    
    // Check if we are running in an iframe or WebView / embedded browser
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }
    const ua = window.navigator.userAgent.toLowerCase();
    const isWebView = /wv|fbav|instagram|linkedin|twitter|gsa|messenger/i.test(ua);

    // WebView / Embedded environments completely block popup windows, so we go straight to redirect
    if (isWebView) {
      console.log("WebView detected. Launching Google Redirect Sign-In directly...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (err: any) {
        console.error("Direct signInWithRedirect failed:", err);
        setError(err.message || "Failed to launch Google Redirect Sign-In.");
        throw err;
      }
    }

    try {
      console.log("Attempting Google Popup Sign-In...");
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.warn("Popup authentication failed or was blocked:", e);
      const errCode = e?.code;
      const errMsg = e?.message || "";
      
      // Check if popup was blocked, cancelled by frame constraints, or not supported
      const isPopupBlocked = 
        errCode === 'auth/popup-blocked' || 
        errCode === 'auth/cancelled-popup-request' ||
        errCode === 'auth/operation-not-supported-in-this-environment' ||
        errCode === 'auth/iframe-userAgent-blocked' ||
        errMsg.includes('popup') || 
        errMsg.includes('iframe') ||
        errMsg.includes('blocked');

      if (isPopupBlocked) {
        console.log("Popup blocked by environment or browser. Automatically switching to Google Redirect Sign-In...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          console.error("Redirect sign-in fallback failed:", redirectErr);
          setError(redirectErr.message || "Failed to launch Google Redirect Sign-In fallback.");
          throw redirectErr;
        }
      } else {
        setError(e.message || "Google Authentication failed.");
        throw e;
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('custom_auth_user');
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const updated = { ...userProfile, ...updates };
    
    if (!useLocalFallback) {
      // Create a clean object without undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'users', currentUser.uid), cleanUpdates);
    } else {
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updated));
    }
    setUserProfile(updated);
  };

  // Action: Add Money (Deposit Simulation)
  const depositMoney = async (
    amount: number, 
    method: 'UPI' | 'Paytm' | 'PhonePe' | 'GPay' | 'Razorpay',
    refNo?: string
  ) => {
    if (!currentUser || !userProfile) return;
    
    const reference = refNo || 'TXN-' + Math.floor(Math.random() * 1000000000);
    const updated = {
      ...userProfile,
      depositBalance: userProfile.depositBalance + amount
    };

    if (!useLocalFallback) {
      // Update User balance
      await updateDoc(doc(db, 'users', currentUser.uid), {
        depositBalance: updated.depositBalance
      });

      // Post completed transaction to Firestore
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount,
        type: 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: `Deposit via ${method} Instant Add`
      });
    } else {
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updated));
      const localTrans: Transaction = {
        id: 'trans_' + Date.now(),
        userId: currentUser.uid,
        amount,
        type: 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: `Deposit via ${method} Instant Add`
      };
      setTransactions([localTrans, ...transactions]);
    }

    setUserProfile(updated);

    await triggerNotification(
      "Deposit Successful! 💰",
      `₹${amount} has been added to your deposit balance via ${method}. Good luck in your matches!`,
      "info"
    );
  };

  // Action: Withdraw Money (simulated secure deduction)
  const withdrawMoney = async (amount: number, upiId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) return { success: false, message: "User not logged in" };

    if (userProfile.winningBalance < amount) {
      return { success: false, message: "Insufficient winning balance." };
    }

    const updated = {
      ...userProfile,
      winningBalance: userProfile.winningBalance - amount
    };

    if (!useLocalFallback) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        winningBalance: updated.winningBalance
      });

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount,
        type: 'withdraw_request',
        paymentMethod: 'UPI',
        upiId: upiId,
        dateTime: new Date().toISOString(),
        status: 'pending',
        description: `Withdrawal request submitted for UPI ID: ${upiId}`
      });
    } else {
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updated));
      const localTrans: Transaction = {
        id: 'trans_' + Date.now(),
        userId: currentUser.uid,
        amount,
        type: 'withdraw_request',
        paymentMethod: 'UPI',
        upiId: upiId,
        dateTime: new Date().toISOString(),
        status: 'pending',
        description: `Withdrawal request submitted for UPI: ${upiId}`
      };
      setTransactions([localTrans, ...transactions]);
    }

    setUserProfile(updated);

    await triggerNotification(
      "Withdrawal Pending! ⏳",
      `Your withdrawal request of ₹${amount} has been received and is being processed by our auto-payout API (Takes 5-30 mins).`,
      "info"
    );

    return { success: true, message: "Withdrawal request submitted successfully!" };
  };

  // Action: Join Tournament
  const joinTournament = async (
    tournamentId: string,
    governmentName?: string,
    players?: { gameName: string; uid: string }[]
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) return { success: false, message: "Please log in to join matches." };

    if (!userProfile.freefireUid) {
      return { success: false, message: "Please set your Free Fire Player UID in your Profile tab first." };
    }

    // Find tournament
    const targetTourney = tournaments.find(t => t.id === tournamentId);
    if (!targetTourney) return { success: false, message: "Tournament not found." };

    if (targetTourney.joinedSlots.includes(currentUser.uid)) {
      return { success: false, message: "You have already joined this tournament." };
    }

    const slotsCount = players ? players.length : 1;
    if (targetTourney.joinedSlots.length + slotsCount > targetTourney.totalSlots) {
      return { success: false, message: `Only ${targetTourney.totalSlots - targetTourney.joinedSlots.length} slots are left in this tournament.` };
    }

    const totalCost = targetTourney.entryFee * slotsCount;
    
    // Check if user has enough balance (deposit first, then winning, then bonus as fallback)
    let tempDep = userProfile.depositBalance;
    let tempWin = userProfile.winningBalance;
    let tempBon = userProfile.bonusBalance;

    if (tempDep + tempWin + tempBon < totalCost) {
      return { success: false, message: "Insufficient balance! Please add funds to your wallet." };
    }

    // Deduct entry fee
    let remaining = totalCost;
    if (tempDep >= remaining) {
      tempDep -= remaining;
      remaining = 0;
    } else {
      remaining -= tempDep;
      tempDep = 0;
      if (tempWin >= remaining) {
        tempWin -= remaining;
        remaining = 0;
      } else {
        remaining -= tempWin;
        tempWin = 0;
        tempBon -= remaining;
        remaining = 0;
      }
    }

    const updatedUser: UserProfile = {
      ...userProfile,
      depositBalance: tempDep,
      winningBalance: tempWin,
      bonusBalance: tempBon,
      totalMatches: userProfile.totalMatches + 1
    };

    // Update tournament info
    const updatedJoinedSlots = [...targetTourney.joinedSlots];
    for (let i = 0; i < slotsCount; i++) {
      updatedJoinedSlots.push(currentUser.uid);
    }
    const updatedJoinedNicknames = {
      ...targetTourney.joinedNicknames,
      [currentUser.uid]: players && players[0] ? players[0].gameName : userProfile.nickname
    };

    // Prepare RegistrationTeam
    const registrationTeam = {
      userId: currentUser.uid,
      governmentName: governmentName || userProfile.nickname,
      players: players || [{ gameName: userProfile.nickname, uid: userProfile.freefireUid }],
      registeredAt: new Date().toISOString()
    };

    const updatedJoinedTeams = [...(targetTourney.joinedTeams || []), registrationTeam];

    const isFullNow = updatedJoinedSlots.length >= targetTourney.totalSlots;
    const updatedTourney: Tournament = {
      ...targetTourney,
      joinedSlots: updatedJoinedSlots,
      joinedNicknames: updatedJoinedNicknames,
      joinedTeams: updatedJoinedTeams,
      roomStatus: isFullNow ? 'locked' : targetTourney.roomStatus
    };

    if (!useLocalFallback) {
      // Write user profile updates
      await updateDoc(doc(db, 'users', currentUser.uid), {
        depositBalance: tempDep,
        winningBalance: tempWin,
        bonusBalance: tempBon,
        totalMatches: updatedUser.totalMatches
      });

      // Write tournament updates
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        joinedSlots: updatedJoinedSlots,
        joinedNicknames: updatedJoinedNicknames,
        joinedTeams: updatedJoinedTeams,
        roomStatus: isFullNow ? 'locked' : targetTourney.roomStatus
      });

      // Post transaction
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount: totalCost,
        type: 'match_join_fee',
        paymentMethod: 'System',
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: `Registration fee for ${targetTourney.title}`
      });
    } else {
      // Local state fallback
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedUser));
      
      const updatedTourneyList = tournaments.map(t => t.id === tournamentId ? updatedTourney : t);
      setTournaments(updatedTourneyList);

      const localTrans: Transaction = {
        id: 'trans_' + Date.now(),
        userId: currentUser.uid,
        amount: totalCost,
        type: 'match_join_fee',
        paymentMethod: 'System',
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: `Registration fee for ${targetTourney.title}`
      };
      setTransactions([localTrans, ...transactions]);
    }

    setUserProfile(updatedUser);

    await triggerNotification(
      "Tournament Joined! 🎮",
      `Successfully registered for ${targetTourney.title}. Room ID & Password will unlock 15 minutes before match starts.`,
      "info"
    );

    return { success: true, message: `Successfully registered for ${targetTourney.title}!` };
  };

  // Submit Support ticket (simulated or direct Firestore)
  // Quick push real-time notifications
  const triggerNotification = async (
    title: string, 
    message: string, 
    type: 'info' | 'alert' | 'winner' | 'system'
  ) => {
    if (!notificationSettings.notificationsEnabled) return;

    const notifyObj: AppNotification = {
      id: 'not_' + Date.now(),
      title,
      message,
      type,
      dateTime: new Date().toISOString(),
      isRead: false
    };

    if (!useLocalFallback) {
      try {
        await setDoc(doc(db, 'notifications', notifyObj.id), notifyObj);
      } catch (e) {
        setNotifications(prev => [notifyObj, ...prev]);
      }
    } else {
      setNotifications(prev => [notifyObj, ...prev]);
    }
  };

  // Simulate complete/live match for testing & visual wow factor
  const simulateMatchCompletion = async (tournamentId: string) => {
    const index = tournaments.findIndex(t => t.id === tournamentId);
    if (index === -1) return;
    
    const t = tournaments[index];
    let nextStatus: RoomStatusType = 'live';
    let winnerText = undefined;
    
    if (t.roomStatus === 'open' || t.roomStatus === 'locked') {
      nextStatus = 'live';
    } else if (t.roomStatus === 'live') {
      nextStatus = 'completed';
      // Pick a random player nickname from joined slots or default sim
      const nicknames = Object.values(t.joinedNicknames);
      const winnerName = nicknames.length > 0 
        ? nicknames[Math.floor(Math.random() * nicknames.length)] 
        : 'ViperFF';
      const killCount = Math.floor(Math.random() * 8) + 6;
      winnerText = `${winnerName} (${killCount} Kills)`;

      // If current logged-in user joined, award them mock prize!
      if (currentUser && t.joinedSlots.includes(currentUser.uid)) {
        const userKills = Math.floor(Math.random() * 4) + 1; // 1-4 kills
        const killWinnings = userKills * t.perKillPrize;
        const placePrize = Math.random() > 0.5 ? 80 : 0; // chance to win placement
        const totalPrize = killWinnings + placePrize;

        if (totalPrize > 0 && userProfile) {
          const updatedUser: UserProfile = {
            ...userProfile,
            winningBalance: userProfile.winningBalance + totalPrize,
            totalKills: userProfile.totalKills + userKills,
            totalWins: placePrize > 0 ? userProfile.totalWins + 1 : userProfile.totalWins,
            totalEarnings: userProfile.totalEarnings + totalPrize
          };

          if (!useLocalFallback) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              winningBalance: updatedUser.winningBalance,
              totalKills: updatedUser.totalKills,
              totalWins: updatedUser.totalWins,
              totalEarnings: updatedUser.totalEarnings
            });

            await addDoc(collection(db, 'transactions'), {
              userId: currentUser.uid,
              amount: totalPrize,
              type: 'match_winnings',
              paymentMethod: 'System',
              dateTime: new Date().toISOString(),
              status: 'completed',
              description: `Match Rewards for ${t.title} - ${userKills} Kills`
            });
          } else {
            localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedUser));
            const localTrans: Transaction = {
              id: 'trans_' + Date.now(),
              userId: currentUser.uid,
              amount: totalPrize,
              type: 'match_winnings',
              paymentMethod: 'System',
              dateTime: new Date().toISOString(),
              status: 'completed',
              description: `Match Rewards for ${t.title} - ${userKills} Kills`
            };
            setTransactions([localTrans, ...transactions]);
          }
          setUserProfile(updatedUser);

          await triggerNotification(
            "MATCH COMPLETED! 🎉🏆",
            `You secured ${userKills} Kills and won a total of ₹${totalPrize} from ${t.title}! Winnings added to your wallet.`,
            "winner"
          );
        }
      }
    } else {
      nextStatus = 'open';
    }

    const updatedTourney: Tournament = {
      ...t,
      roomStatus: nextStatus,
      maxKillsWinner: winnerText
    };

    if (!useLocalFallback) {
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        roomStatus: nextStatus,
        maxKillsWinner: winnerText || null
      });
    } else {
      setTournaments(tournaments.map(tour => tour.id === tournamentId ? updatedTourney : tour));
    }

    await triggerNotification(
      `Match Status Updated! 🏟️`,
      `Tournament "${t.title}" is now ${nextStatus.toUpperCase()}!`,
      "info"
    );
  };

  // 1. Initiate Join Tournament
  const initiateJoinTournament = async (
    tournamentId: string
  ): Promise<{ success: boolean; redirectWallet?: boolean; requireConfirmation?: boolean; entryFee?: number; message?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: "Please log in to join matches." };
    }

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      return { success: false, message: "Tournament not found." };
    }

    // Check duplicate registrations (already joined)
    const alreadyRegistered = registrations.some(r => r.tournamentId === tournamentId && r.status !== 'cancelled' && r.status !== 'cancelled');
    if (alreadyRegistered || tournament.joinedSlots.includes(currentUser.uid)) {
      return { success: false, message: "You have already joined this tournament." };
    }

    // Check if slot count exceeds limit
    if (tournament.joinedSlots.length >= tournament.totalSlots) {
      return { success: false, message: "Tournament is fully booked!" };
    }

    // Calculate slots count based on tournament mode
    const slotsCount = tournament.mode === 'Solo' ? 1 : tournament.mode === 'Duo' ? 2 : 4;
    if (tournament.joinedSlots.length + slotsCount > tournament.totalSlots) {
      return { success: false, message: `Only ${tournament.totalSlots - tournament.joinedSlots.length} slots left. Duo/Squad requires full slots!` };
    }

    if (tournament.isFreeMatch || tournament.entryFee === 0) {
      return { success: true, requireConfirmation: false, entryFee: 0 };
    }

    // Check balance
    const totalBalance = userProfile.depositBalance + userProfile.winningBalance + userProfile.bonusBalance;
    if (totalBalance < tournament.entryFee) {
      return { success: false, redirectWallet: true, message: "Insufficient balance! Please add funds to your wallet." };
    }

    return { success: true, requireConfirmation: true, entryFee: tournament.entryFee };
  };

  // 2. Process join payment
  const processJoinPayment = async (
    tournamentId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) return { success: false, message: "Please log in." };

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return { success: false, message: "Tournament not found." };

    const cost = tournament.isFreeMatch ? 0 : tournament.entryFee;

    if (cost > 0) {
      let tempDep = userProfile.depositBalance;
      let tempWin = userProfile.winningBalance;
      let tempBon = userProfile.bonusBalance;

      if (tempDep + tempWin + tempBon < cost) {
        return { success: false, message: "Insufficient balance!" };
      }

      // Deduct
      let remaining = cost;
      if (tempDep >= remaining) {
        tempDep -= remaining;
        remaining = 0;
      } else {
        remaining -= tempDep;
        tempDep = 0;
        if (tempWin >= remaining) {
          tempWin -= remaining;
          remaining = 0;
        } else {
          remaining -= tempWin;
          tempWin = 0;
          tempBon -= remaining;
          remaining = 0;
        }
      }

      const updatedUser = {
        ...userProfile,
        depositBalance: tempDep,
        winningBalance: tempWin,
        bonusBalance: tempBon
      };

      if (!useLocalFallback) {
        // Update user profile in Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          depositBalance: tempDep,
          winningBalance: tempWin,
          bonusBalance: tempBon
        });

        // Add Transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: currentUser.uid,
          amount: cost,
          type: 'match_join_fee',
          paymentMethod: 'System',
          dateTime: new Date().toISOString(),
          status: 'completed',
          description: `Entry payment for ${tournament.title}`
        });
      } else {
        // Local state fallback
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedUser));
        const localTrans: Transaction = {
          id: 'trans_' + Date.now(),
          userId: currentUser.uid,
          amount: cost,
          type: 'match_join_fee',
          paymentMethod: 'System',
          dateTime: new Date().toISOString(),
          status: 'completed',
          description: `Entry payment for ${tournament.title}`
        };
        setTransactions([localTrans, ...transactions]);
      }

      setUserProfile(updatedUser);
    }

    setRegisteringTournament(tournament);
    return { success: true, message: "Payment successful!" };
  };

  // Helper generator
  const generateId = (prefix: 'REG' | 'TEAM') => {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // 3. Submit final registration details
  const submitRegistration = async (
    players: { nickname: string; uid: string; level?: string }[]
  ): Promise<{ success: boolean; message: string; registrationId?: string; teamId?: string }> => {
    if (!currentUser || !userProfile || !registeringTournament) {
      return { success: false, message: "No tournament in registration session." };
    }

    const t = registeringTournament;
    const regId = generateId('REG');
    const teamId = t.mode !== 'Solo' ? generateId('TEAM') : undefined;

    const newReg: PlayerRegistration = {
      id: regId,
      teamId,
      userId: currentUser.uid,
      userEmail: currentUser.email || '',
      tournamentId: t.id,
      tournamentName: t.title,
      matchType: t.mode,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      map: t.map,
      dateTime: t.dateTime,
      players,
      registeredAt: new Date().toISOString(),
      status: 'completed',
      paymentStatus: t.isFreeMatch ? 'free' : 'completed'
    };

    // Update tournament info (slots, joinedTeams, joinedNicknames)
    const slotsCount = players.length;
    const updatedJoinedSlots = [...t.joinedSlots];
    for (let i = 0; i < slotsCount; i++) {
      updatedJoinedSlots.push(currentUser.uid);
    }

    const updatedJoinedNicknames = {
      ...t.joinedNicknames,
      [currentUser.uid]: players[0]?.nickname || userProfile.nickname
    };

    // Team structure to register
    const registrationTeam = {
      userId: currentUser.uid,
      governmentName: userProfile.nickname,
      players: players.map(p => ({ gameName: p.nickname, uid: p.uid })),
      registeredAt: new Date().toISOString()
    };
    const updatedJoinedTeams = [...(t.joinedTeams || []), registrationTeam];

    const isFullNow = updatedJoinedSlots.length >= t.totalSlots;
    const updatedTourney: Tournament = {
      ...t,
      joinedSlots: updatedJoinedSlots,
      joinedNicknames: updatedJoinedNicknames,
      joinedTeams: updatedJoinedTeams,
      roomStatus: isFullNow ? 'locked' : t.roomStatus
    };

    if (!useLocalFallback) {
      // 1. Save PlayerRegistration
      await setDoc(doc(db, 'registrations', regId), newReg);

      // 2. Update Tournament
      await updateDoc(doc(db, 'tournaments', t.id), {
        joinedSlots: updatedJoinedSlots,
        joinedNicknames: updatedJoinedNicknames,
        joinedTeams: updatedJoinedTeams,
        roomStatus: isFullNow ? 'locked' : t.roomStatus
      });

      // 3. Update User Profile totalMatches
      await updateDoc(doc(db, 'users', currentUser.uid), {
        totalMatches: userProfile.totalMatches + 1
      });
    } else {
      // Fallback
      const allRegs = [newReg, ...registrations];
      setRegistrations(allRegs);
      localStorage.setItem('registrations', JSON.stringify(allRegs));

      const updatedTournamentsList = tournaments.map(item => item.id === t.id ? updatedTourney : item);
      setTournaments(updatedTournamentsList);
    }

    // Also update current state
    setUserProfile(prev => prev ? { ...prev, totalMatches: prev.totalMatches + 1 } : null);
    setRegisteringTournament(null);

    await triggerNotification(
      "Registration Successful! 🎮",
      `You are successfully registered for ${t.title}. Reg ID: ${regId}`,
      "system"
    );

    return {
      success: true,
      message: "Registration Successful",
      registrationId: regId,
      teamId
    };
  };

  // 4. Update registration details (Admin action)
  const updateRegistrationAdmin = async (id: string, updates: Partial<PlayerRegistration>) => {
    if (useLocalFallback) {
      const updated = registrations.map(r => r.id === id ? { ...r, ...updates } : r);
      setRegistrations(updated as PlayerRegistration[]);
      localStorage.setItem('registrations', JSON.stringify(updated));
      return;
    }
    await updateDoc(doc(db, 'registrations', id), updates as any);
  };

  // 5. Refund registration (Admin Action)
  const refundRegistrationAdmin = async (id: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;

    const userToRefund = reg.userId;
    const amt = reg.entryFee;

    if (useLocalFallback) {
      const updatedRegs = registrations.map(r => r.id === id ? { ...r, status: 'cancelled', paymentStatus: 'refunded' } as PlayerRegistration : r);
      setRegistrations(updatedRegs);
      localStorage.setItem('registrations', JSON.stringify(updatedRegs));

      const userProfileKey = `profile_${userToRefund}`;
      const cached = localStorage.getItem(userProfileKey);
      if (cached) {
        const u = JSON.parse(cached) as UserProfile;
        u.depositBalance += amt;
        localStorage.setItem(userProfileKey, JSON.stringify(u));
        if (currentUser?.uid === userToRefund) {
          setUserProfile(u);
        }
      }
      return;
    }

    await updateDoc(doc(db, 'registrations', id), {
      status: 'cancelled',
      paymentStatus: 'refunded'
    });

    const userSnap = await getDoc(doc(db, 'users', userToRefund));
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const newBalance = userData.depositBalance + amt;
      await updateDoc(doc(db, 'users', userToRefund), {
        depositBalance: newBalance
      });

      if (currentUser?.uid === userToRefund) {
        setUserProfile(prev => prev ? { ...prev, depositBalance: newBalance } : null);
      }
    }

    await addDoc(collection(db, 'transactions'), {
      userId: userToRefund,
      amount: amt,
      type: 'match_refund',
      paymentMethod: 'System',
      dateTime: new Date().toISOString(),
      status: 'completed',
      description: `Refund for tournament registration ${id}`
    });
  };

  // 6. Save/Update Tournament (Admin Action)
  const saveTournamentAdmin = async (tournament: Tournament) => {
    // Always update local state first for instant UI responsiveness
    setTournaments(prev => {
      const exists = prev.some(t => t.id === tournament.id);
      if (exists) {
        return prev.map(t => t.id === tournament.id ? tournament : t);
      } else {
        return [...prev, tournament];
      }
    });

    if (!useLocalFallback) {
      await setDoc(doc(db, 'tournaments', tournament.id), tournament);
    }
  };

  // 7. Delete Tournament (Admin Action)
  const deleteTournamentAdmin = async (id: string) => {
    // Always update local state first for instant UI responsiveness
    setTournaments(prev => prev.filter(t => t.id !== id));

    if (!useLocalFallback) {
      await deleteDoc(doc(db, 'tournaments', id));
    }
  };

  // 7.5 Save/Update Game Category (Admin Action)
  const saveCategoryAdmin = async (category: GameCategory) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      let updated;
      if (exists) {
        updated = prev.map(c => c.id === category.id ? category : c);
      } else {
        updated = [...prev, category];
      }
      return updated.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    if (!useLocalFallback) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
  };

  // 7.6 Delete Game Category (Admin Action)
  const deleteCategoryAdmin = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));

    if (!useLocalFallback) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  
  const updateLoadingScreenSettings = async (updates: Partial<LoadingScreenSettings>) => {
    try {
      const timestamp = Date.now();
      const mergedUpdates = { ...updates, updatedAt: timestamp };
      
      // Concurrently update both documents for 100% database compatibility
      await setDoc(doc(db, 'settings', 'loading_screen'), mergedUpdates, { merge: true });
      await setDoc(doc(db, 'loading_settings', 'config'), mergedUpdates, { merge: true });
    } catch (err: any) {
      console.error("Error updating loading screen settings:");
      throw err;
    }
  };

  const updateBrandingSettings = async (updates: Partial<BrandingSettings>) => {
    setBrandingSettings(prev => ({ ...prev, ...updates }));
    if (!useLocalFallback) {
      try {
        await updateDoc(doc(db, 'settings', 'branding'), updates);
      } catch (e: any) {
        if (e.code === 'not-found') {
          await setDoc(doc(db, 'settings', 'branding'), { ...DEFAULT_BRANDING, ...updates });
        } else {
          console.error("Failed to update branding settings:");
          throw e;
        }
      }
    }
  };

  const updateSupportSettings = async (updates: Partial<SupportSettings>) => {
    // Optimistic UI update
    setSupportSettings(prev => ({ ...prev, ...updates }));
    if (!useLocalFallback) {
      try {
        await updateDoc(doc(db, 'support_settings', 'config'), updates);
      } catch (e: any) {
        if (e.code === 'not-found') {
          await setDoc(doc(db, 'support_settings', 'config'), { ...DEFAULT_SUPPORT_SETTINGS, ...updates });
        } else {
          console.error("Failed to update support settings:");
          throw e;
        }
      }
    }
  };

  const updateContactWidgetSettings = async (updates: Partial<ContactWidgetSettings>) => {
    // Optimistic UI update
    setContactWidgetSettings(prev => ({ ...prev, ...updates }));
    if (!useLocalFallback) {
      try {
        await updateDoc(doc(db, 'contact_widget_settings', 'config'), updates);
      } catch (e: any) {
        if (e.code === 'not-found') {
          await setDoc(doc(db, 'contact_widget_settings', 'config'), { ...DEFAULT_CONTACT_WIDGET_SETTINGS, ...updates });
        } else {
          console.error("Failed to update contact widget settings:");
          throw e;
        }
      }
    }
  };

  const saveStorageFileAdmin = async (fileData: Omit<StorageFile, 'id'> & { id?: string }) => {
    const docId = fileData.id || fileData.fileId || `file_${Date.now()}`;
    const timestamp = Date.now();
    const completeFile: StorageFile = {
      ...fileData,
      id: docId,
      updatedAt: timestamp,
      uploadedAt: fileData.uploadedAt || timestamp
    };

    setStorageFiles(prev => {
      const exists = prev.some(f => f.id === docId);
      if (exists) {
        return prev.map(f => f.id === docId ? completeFile : f);
      }
      return [completeFile, ...prev];
    });

    if (!useLocalFallback) {
      await setDoc(doc(db, 'storage_files', docId), completeFile);
    }
  };

  const deleteStorageFileAdmin = async (id: string) => {
    setStorageFiles(prev => prev.filter(f => f.id !== id));
    if (!useLocalFallback) {
      await deleteDoc(doc(db, 'storage_files', id));
    }
  };

  const updatePromoSettingsAdmin = async (settings: Partial<PromoSettings>) => {
    setPromoSettings(prev => ({ ...prev, ...settings }));
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'promo'), settings, { merge: true });
    }
  };

  const updateNotificationSettingsAdmin = async (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'notifications'), settings, { merge: true });
    }
  };

  const updateStorageSettingsAdmin = async (settings: Partial<StorageSettings>) => {
    setStorageSettings(prev => ({ ...prev, ...settings }));
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'storage'), settings, { merge: true });
    }
  };

  const updateAuthProvidersAdmin = async (publicSettings: AuthProvidersPublic, privateSettings: AuthProvidersPrivate) => {
    setAuthProviders(publicSettings);
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'auth_public'), publicSettings);
      await setDoc(doc(db, 'settings', 'auth_private'), privateSettings);
    }
  };

  // 7.7 Weekly Leaderboard Admin Actions
  const saveWeeklyPlayerAdmin = async (player: WeeklyPlayer) => {
    setWeeklyPlayers(prev => {
      const exists = prev.some(p => p.id === player.id);
      if (exists) {
        return prev.map(p => p.id === player.id ? player : p);
      } else {
        return [...prev, player];
      }
    });

    if (!useLocalFallback) {
      await setDoc(doc(db, 'weekly_players', player.id), player);
    }
  };

  const deleteWeeklyPlayerAdmin = async (id: string) => {
    setWeeklyPlayers(prev => prev.filter(p => p.id !== id));

    if (!useLocalFallback) {
      await deleteDoc(doc(db, 'weekly_players', id));
    }
  };

  const updateWeeklyLeaderboardConfigAdmin = async (updates: Partial<WeeklyLeaderboardConfig>) => {
    setWeeklyLeaderboardConfig(prev => ({ ...prev, ...updates }));
    if (!useLocalFallback) {
      try {
        await updateDoc(doc(db, 'settings', 'weekly_leaderboard'), updates);
      } catch (e: any) {
        if (e.code === 'not-found') {
          await setDoc(doc(db, 'settings', 'weekly_leaderboard'), { ...DEFAULT_WEEKLY_LEADERBOARD_CONFIG, ...updates });
        } else {
          console.error("Failed to update weekly leaderboard config:");
          throw e;
        }
      }
    }
  };

  const saveWinnerAdmin = async (winner: TournamentWinner) => {
    setWinners(prev => {
      const exists = prev.some(w => w.id === winner.id);
      if (exists) {
        return prev.map(w => w.id === winner.id ? winner : w);
      } else {
        return [...prev, winner];
      }
    });

    if (!useLocalFallback) {
      try {
        await setDoc(doc(db, 'winners', winner.id), winner);
      } catch (err) {
        console.error("Error saving winner:");
      }
    }
  };

  const deleteWinnerAdmin = async (id: string) => {
    setWinners(prev => prev.filter(w => w.id !== id));

    if (!useLocalFallback) {
      try {
        await deleteDoc(doc(db, 'winners', id));
      } catch (err) {
        console.error("Error deleting winner:");
      }
    }
  };

  const saveHomepageBannerAdmin = async (banner: HomepageBanner) => {
    setHomepageBanners(prev => {
      const exists = prev.some(b => b.id === banner.id);
      if (exists) {
        return prev.map(b => b.id === banner.id ? banner : b).sort((a, b) => a.displayOrder - b.displayOrder);
      } else {
        return [...prev, banner].sort((a, b) => a.displayOrder - b.displayOrder);
      }
    });

    if (!useLocalFallback) {
      try {
        await setDoc(doc(db, 'homepage_banners', banner.id), banner);
      } catch (err) {
        console.error("Error saving homepage banner:");
      }
    }
  };

  const deleteHomepageBannerAdmin = async (id: string) => {
    setHomepageBanners(prev => prev.filter(b => b.id !== id));

    if (!useLocalFallback) {
      try {
        await deleteDoc(doc(db, 'homepage_banners', id));
      } catch (err) {
        console.error("Error deleting homepage banner:");
      }
    }
  };

  return (
    <GameContext.Provider value={{
      currentUser,
      userProfile,
      tournaments,
      transactions,
      notifications,
      leaderboard,
      loading,
      error,
      registrations,
      registeringTournament,
      setRegisteringTournament,
      loginWithCredentials,
      registerWithCredentials,
      loginWithGoogle,
      logout,
      resetPassword,
      updateProfile,
      depositMoney,
      withdrawMoney,
      joinTournament,
      triggerNotification,
      refreshTransactions,
      simulateMatchCompletion,
      initiateJoinTournament,
      processJoinPayment,
      submitRegistration,
      updateRegistrationAdmin,
      refundRegistrationAdmin,
      saveTournamentAdmin,
      deleteTournamentAdmin,
      categories,
      saveCategoryAdmin,
      deleteCategoryAdmin,
      brandingSettings,
      updateBrandingSettings,
      loadingScreenSettings,
      updateLoadingScreenSettings,
      supportSettings,
      updateSupportSettings,
      contactWidgetSettings,
      updateContactWidgetSettings,
      weeklyPlayers,
      weeklyLeaderboardConfig,
      saveWeeklyPlayerAdmin,
      deleteWeeklyPlayerAdmin,
      updateWeeklyLeaderboardConfigAdmin,
      winners,
      saveWinnerAdmin,
      deleteWinnerAdmin,
      homepageBanners,
      saveHomepageBannerAdmin,
      deleteHomepageBannerAdmin,
      storageFiles,
      storageSettings,
      saveStorageFileAdmin,
      deleteStorageFileAdmin,
      updateStorageSettingsAdmin,
      notificationSettings,
      updateNotificationSettingsAdmin,
      promoSettings,
      updatePromoSettingsAdmin,
      authProviders,
      updateAuthProvidersAdmin
    }}>
      {children}
    </GameContext.Provider>
  );
};

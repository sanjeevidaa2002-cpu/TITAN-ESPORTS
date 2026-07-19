/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tournament, LeaderboardEntry, AppNotification, GameCategory } from './types';

export const DEFAULT_CATEGORIES: GameCategory[] = [
  { id: 'free_fire', name: 'Free Fire', icon: 'Gamepad2', enabled: true, order: 1 },
  { id: 'pubg_mobile', name: 'PUBG Mobile', icon: 'Flame', enabled: true, order: 2 },
  { id: 'clash_of_clans', name: 'Clash of Clans', icon: 'Trophy', enabled: true, order: 3 },
  { id: 'free_tournaments', name: 'Free Tournaments', icon: 'Award', enabled: true, order: 4 },
  { id: 'free_match', name: 'Free Match', icon: '🆓', enabled: true, order: 5 },
  { id: 'hacker_match', name: 'Hacker Match', icon: '🛡️', enabled: true, order: 6 }
];

export const FF_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', // Man avatar
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', // Woman avatar
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', // Gamer avatar
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', // Pro avatar
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'  // Girl gamer avatar
];

export const FF_BANNERS = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80', // esports stage
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80', // red/blue gaming neon
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80', // purple cyber neon
  'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=800&auto=format&fit=crop&q=80', // golden trophy controllers
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'  // dark fantasy battle glow
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 't_ongoing_1',
    title: 'Ultimate Battle - Clash Squad (Live)',
    bannerUrl: FF_BANNERS[0],
    logoUrl: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=150&auto=format&fit=crop&q=80',
    entryFee: 15,
    prizePool: 600,
    perKillPrize: 3,
    map: 'Bermuda',
    dateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // started 30 mins ago
    roomStatus: 'live',
    roomID: 'FF-4091873',
    roomPassword: 'live_titan',
    mode: 'Squad',
    minLevel: 50,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 48,
    joinedSlots: ['user_lokesh', 'u_sim_1', 'u_sim_2', 'u_sim_3', 'u_sim_4'],
    joinedNicknames: {
      'user_lokesh': 'Lkehw',
      'u_sim_1': 'ViperFF',
      'u_sim_2': 'AlphaGamer',
      'u_sim_3': 'SoulMortal',
      'u_sim_4': 'GyanSujjan'
    },
    isFreeMatch: false,
    rules: [
      'Teaming up is strictly forbidden. Custom rooms are heavily moderated.',
      'Hacks or scripts will result in an immediate device ban and wallet freeze.',
      'Only mobile/tablet players are allowed in this match (no emulator).',
      'Minimum Level 50 is required to participate.',
      'VPN is strictly prohibited. Play on native Indian server regions only.',
      'If you drop out or disconnect, no refund will be provided.'
    ]
  },
  {
    id: 't_upcoming_1',
    title: 'TITAN ESP Grand Cup - Bermuda Squad',
    bannerUrl: FF_BANNERS[1],
    logoUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80',
    entryFee: 20,
    prizePool: 1000,
    perKillPrize: 5,
    map: 'Bermuda',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // in 2 hours
    roomStatus: 'open',
    roomID: 'FF-8846392',
    roomPassword: 'vault_gold_99',
    mode: 'Squad',
    minLevel: 50,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 48,
    joinedSlots: [
      'u_sim_1', 'u_sim_2', 'u_sim_3', 'u_sim_4',
      'u_sim_5', 'u_sim_6', 'u_sim_7', 'u_sim_8',
      'u_sim_9', 'u_sim_10', 'u_sim_11', 'u_sim_12',
      'u_sim_13', 'u_sim_14', 'u_sim_15', 'u_sim_16'
    ],
    joinedNicknames: {
      'u_sim_1': 'ViperFF',
      'u_sim_2': 'AlphaGamer',
      'u_sim_3': 'SoulMortal',
      'u_sim_4': 'GyanSujjan',
      'u_sim_5': 'KillerFF',
      'u_sim_6': 'GarenaKing',
      'u_sim_7': 'ThunderDuo',
      'u_sim_8': 'SniperGod',
      'u_sim_9': 'TitanFF',
      'u_sim_10': 'SlateGamer',
      'u_sim_11': 'BermudaKing',
      'u_sim_12': 'GrandCupPro',
      'u_sim_13': 'ShadowGamer',
      'u_sim_14': 'DynamoFF',
      'u_sim_15': 'KrontenFF',
      'u_sim_16': 'HeistKing'
    },
    joinedTeams: [
      {
        userId: 'u_sim_1',
        governmentName: 'Lokesh Kumar',
        registeredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        players: [
          { gameName: 'ViperFF', uid: '827463920' },
          { gameName: 'AlphaGamer', uid: '984729410' },
          { gameName: 'SoulMortal', uid: '109283742' },
          { gameName: 'GyanSujjan', uid: '55827391' }
        ]
      },
      {
        userId: 'u_sim_5',
        governmentName: 'Ayush Sharma',
        registeredAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        players: [
          { gameName: 'KillerFF', uid: '304918274' },
          { gameName: 'GarenaKing', uid: '948201938' },
          { gameName: 'ThunderDuo', uid: '482019283' },
          { gameName: 'SniperGod', uid: '773910293' }
        ]
      },
      {
        userId: 'u_sim_9',
        governmentName: 'Rajesh Yadav',
        registeredAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        players: [
          { gameName: 'TitanFF', uid: '667281930' },
          { gameName: 'SlateGamer', uid: '889302194' },
          { gameName: 'BermudaKing', uid: '443920193' },
          { gameName: 'GrandCupPro', uid: '122938475' }
        ]
      },
      {
        userId: 'u_sim_13',
        governmentName: 'Karan Singh',
        registeredAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        players: [
          { gameName: 'ShadowGamer', uid: '110293049' },
          { gameName: 'DynamoFF', uid: '334455667' },
          { gameName: 'KrontenFF', uid: '223344556' },
          { gameName: 'HeistKing', uid: '998877665' }
        ]
      }
    ],
    isFreeMatch: false,
    rules: [
      'Standard Esports competitive settings apply.',
      'All squads must register FF UIDs correctly before entering.',
      'Anti-hack active. Room ID and password revealed 15 minutes before the match start time.',
      'Emulators strictly disallowed. Mobile-only match.',
      'Teaming will lead to direct disqualification and zero prize payouts.'
    ]
  },
  {
    id: 't_upcoming_2',
    title: 'Kalahari Rumble Duo Special',
    bannerUrl: FF_BANNERS[2],
    logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    entryFee: 10,
    prizePool: 500,
    perKillPrize: 2,
    map: 'Kalahari',
    dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // in 5 hours
    roomStatus: 'open',
    roomID: 'FF-3304192',
    roomPassword: 'kalahari_duo_7',
    mode: 'Duo',
    minLevel: 45,
    isEmulatorAllowed: true,
    isVpnAllowed: false,
    totalSlots: 50,
    joinedSlots: ['user_lokesh', 'u_sim_7', 'u_sim_8'],
    joinedNicknames: {
      'user_lokesh': 'Lkehw',
      'u_sim_7': 'ThunderDuo',
      'u_sim_8': 'SniperGod'
    },
    isFreeMatch: false,
    rules: [
      'Emulator is ALLOWED for this duo tournament.',
      'Map: Kalahari. No active character skill cooldown modifications.',
      'Teaming up is strictly forbidden. We monitor in-game telemetry.',
      'Minimum Level 45 is required.'
    ]
  },
  {
    id: 't_upcoming_3',
    title: 'Alpine Free Entry Tournament',
    bannerUrl: FF_BANNERS[3],
    logoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80',
    entryFee: 0,
    prizePool: 200,
    perKillPrize: 1,
    map: 'Alpine',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // in 1 day
    roomStatus: 'open',
    roomID: 'FF-1002930',
    roomPassword: 'free_battle_2',
    mode: 'Solo',
    minLevel: 30,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 50,
    joinedSlots: ['u_sim_9', 'u_sim_10', 'u_sim_11', 'u_sim_12'],
    joinedNicknames: {
      'u_sim_9': 'DynamoFF',
      'u_sim_10': 'KrontenFF',
      'u_sim_11': 'HeistKing',
      'u_sim_12': 'ShadowGamer'
    },
    isFreeMatch: true,
    rules: [
      'FREE MATCH. Entry fee is 0 ₹.',
      'Prize pool is 200 ₹, Per Kill is 1 ₹.',
      'Solo format, Mobile/Tablet only.',
      'Rules are the same as regular matches.'
    ]
  },
  {
    id: 't_upcoming_4',
    title: 'Nexterra Cyber Clash',
    bannerUrl: FF_BANNERS[4],
    logoUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=150&auto=format&fit=crop&q=80',
    entryFee: 15,
    prizePool: 800,
    perKillPrize: 4,
    map: 'Nexterra',
    dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // in 2 days
    roomStatus: 'open',
    roomID: 'FF-5590123',
    roomPassword: 'nexterra_cyber',
    mode: 'Squad',
    minLevel: 50,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 48,
    joinedSlots: [],
    joinedNicknames: {},
    isFreeMatch: false,
    rules: [
      'Nexterra Competitive Settings.',
      'Level 50 limit. Mobile only.',
      'Anti-Cheat active. Active moderation in-game.'
    ]
  },
  {
    id: 't_completed_1',
    title: 'Elite Fire Championship - Purgatory Squad',
    bannerUrl: FF_BANNERS[2],
    logoUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=150&auto=format&fit=crop&q=80',
    entryFee: 25,
    prizePool: 1500,
    perKillPrize: 8,
    map: 'Purgatory',
    dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // completed 1 day ago
    roomStatus: 'completed',
    roomID: 'FF-1129302',
    roomPassword: 'purgatory_elite',
    mode: 'Squad',
    minLevel: 50,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 48,
    joinedSlots: ['user_lokesh', 'u_sim_1', 'u_sim_2', 'u_sim_3', 'u_sim_4', 'u_sim_5'],
    joinedNicknames: {
      'user_lokesh': 'Lkehw',
      'u_sim_1': 'ViperFF',
      'u_sim_2': 'AlphaGamer',
      'u_sim_3': 'SoulMortal',
      'u_sim_4': 'GyanSujjan',
      'u_sim_5': 'KillerFF'
    },
    maxKillsWinner: 'ViperFF (12 Kills)',
    isFreeMatch: false,
    rules: []
  },
  {
    id: 't_completed_2',
    title: 'Midnight Carnage Solo Special',
    bannerUrl: FF_BANNERS[4],
    logoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
    entryFee: 10,
    prizePool: 500,
    perKillPrize: 3,
    map: 'Bermuda',
    dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // completed 2 days ago
    roomStatus: 'completed',
    roomID: 'FF-2201932',
    roomPassword: 'midnight_carnage',
    mode: 'Solo',
    minLevel: 45,
    isEmulatorAllowed: false,
    isVpnAllowed: false,
    totalSlots: 50,
    joinedSlots: ['u_sim_1', 'u_sim_2', 'u_sim_7', 'u_sim_8'],
    joinedNicknames: {
      'u_sim_1': 'ViperFF',
      'u_sim_2': 'AlphaGamer',
      'u_sim_7': 'ThunderDuo',
      'u_sim_8': 'SniperGod'
    },
    maxKillsWinner: 'SoulMortal (9 Kills)',
    isFreeMatch: false,
    rules: []
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    userId: 'u_sim_1',
    nickname: 'ViperFF',
    freefireUid: '827463920',
    avatarUrl: FF_AVATARS[2],
    totalKills: 382,
    totalWins: 45,
    totalEarnings: 8240
  },
  {
    userId: 'user_lokesh',
    nickname: 'lokesh meena',
    freefireUid: '55827391',
    avatarUrl: FF_AVATARS[0],
    totalKills: 145,
    totalWins: 18,
    totalEarnings: 3120
  },
  {
    userId: 'u_sim_2',
    nickname: 'AlphaGamer',
    freefireUid: '984729410',
    avatarUrl: FF_AVATARS[3],
    totalKills: 295,
    totalWins: 32,
    totalEarnings: 5910
  },
  {
    userId: 'u_sim_3',
    nickname: 'SoulMortal',
    freefireUid: '109283742',
    avatarUrl: FF_AVATARS[1],
    totalKills: 284,
    totalWins: 29,
    totalEarnings: 4820
  },
  {
    userId: 'u_sim_5',
    nickname: 'KillerFF',
    freefireUid: '304918274',
    avatarUrl: FF_AVATARS[4],
    totalKills: 210,
    totalWins: 22,
    totalEarnings: 3500
  },
  {
    userId: 'u_sim_6',
    nickname: 'GarenaKing',
    freefireUid: '948201938',
    avatarUrl: FF_AVATARS[0],
    totalKills: 195,
    totalWins: 15,
    totalEarnings: 2980
  },
  {
    userId: 'u_sim_7',
    nickname: 'ThunderDuo',
    freefireUid: '482019283',
    avatarUrl: FF_AVATARS[2],
    totalKills: 168,
    totalWins: 12,
    totalEarnings: 2210
  }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n_1',
    title: 'Welcome to TITAN ESP!',
    message: 'Explore dynamic custom Free Fire tournaments, play live, and earn real-time cash payouts. Join our Telegram channel for direct DM support!',
    type: 'info',
    dateTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'n_2',
    title: 'Winner Announcement! 🎉',
    message: 'Congratulations to ViperFF for securing 12 kills and winning the Elite Fire Championship - Purgatory Squad match!',
    type: 'winner',
    dateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'n_3',
    title: 'Custom Room Alert ⚠️',
    message: 'Room ID and Password are now live for the upcoming Clash Squad match! Join inside the Game App now.',
    type: 'alert',
    dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true
  }
];

export const DEFAULT_BRANDING = {
  websiteName: 'TITAN ESP',
  websiteShortName: 'TE',
  websiteTitle: 'TITAN ESP | Premier Free Fire Tournaments',
  browserTabTitle: 'TITAN ESP',
  websiteTagline: 'Play. Compete. Win Real Cash.',
  footerCopyrightText: '© 2026 TITAN ESP Esports. All rights reserved.',
  footerDescription: 'Join the most competitive and secure Free Fire tournaments in the region. Play daily custom rooms, clash squads, and elite championships to win real cash rewards directly to your wallet.',
  websiteVersion: '1.0.0',
  organizationName: 'TITAN ESP',
  contactEmail: 'contact@titanesp.com',
  supportEmail: 'support@titanesp.com',

  mainLogo: '',
  headerLogo: '',
  sidebarLogo: '',
  mobileLogo: '',
  footerLogo: '',
  loginLogo: '',
  registerLogo: '',
  dashboardLogo: '',

  splashLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  splashBgImage: '',
  splashBgColor: '#07070a',
  splashTitle: 'TITAN ESP',
  splashSubtitle: 'PREPARE FOR BATTLE',
  splashLoadingText: 'Initializing Secure Connection...',
  splashLoadingAnimation: 'Pulse',
  splashProgressBarColor: '#e5a919',
  splashProgressBarStyle: 'solid',
  splashLoadingDuration: 2500,
  splashAutoRedirectTime: 800,

  splashWebsiteName: 'TITAN ESP',
  splashMainTitle: 'TITAN',
  splashSecondaryTitle: 'ESP',
  splashFooterText: 'SECURE CONNECTION ACTIVE',
  splashMainLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  splashCenterIcon: 'Trophy',
  splashFallbackLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  splashBadges: [
    { id: '1', text: 'Tournaments', icon: 'Trophy', iconColor: '#e5a919', bgColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)', enabled: true, order: 1 },
    { id: '2', text: 'Instant Pay', icon: 'Zap', iconColor: '#fbbf24', bgColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)', enabled: true, order: 2 },
    { id: '3', text: 'Authentic', icon: 'ShieldAlert', iconColor: '#4ade80', bgColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)', enabled: true, order: 3 }
  ],
  splashBgGradient: 'linear-gradient(to bottom, #07070a, #0d0d14)',
  splashBgOverlayColor: 'rgba(0, 0, 0, 0.4)',
  splashBgOverlayOpacity: 0.4,
  splashBgBlur: 0,
  splashMainTitleColor: '#e5a919',
  splashSecondaryTitleColor: '#ffffff',
  splashSubtitleColor: '#a855f7',
  splashLoadingTextColor: '#a3a3a3',
  splashProgressBarBgColor: '#171717',
  splashGlowColor: '#e5a919',
  splashShowProgressBar: true,
  splashProgressBarHeight: 6,
  splashProgressBarWidth: '100%',
  splashProgressBarRadius: 9999,
  splashProgressBarAnimation: 'linear',
  splashMinLoadingTime: 1000,
  splashMaxLoadingTime: 5000,
  splashAllowSkip: false,
  splashShowPercentage: true,
  splashShowLoadingText: true,
  splashLogoAnimation: 'pulse',
  splashTextAnimation: 'fade-in',
  splashLogoType: 'titan' as const,

  browserFavicon: '',
  pwaAppIcon: '',
  androidIcon: '',
  iphoneIcon: '',

  headerTitle: 'TITAN ESP',
  headerSubtitle: 'Premium Esports Platform',
  headerBgColor: 'rgba(13, 13, 20, 0.9)',
  headerSticky: true,
  headerShowNotifIcon: true,
  headerShowWalletIcon: true,
  headerShowProfileIcon: true,

  footerSocialFacebook: '#',
  footerSocialInstagram: '#',
  footerSocialTelegram: '#',
  footerSocialDiscord: '#',
  footerSocialWhatsapp: '#',
  footerSocialYoutube: '#',

  loginBgImage: '',
  loginWelcomeText: 'Welcome Back Commander',
  loginSubtitle: 'Login to access your dashboard and active matches',
  loginButtonText: 'Secure Login',

  registerBgImage: '',
  registerWelcomeText: 'Join the Elite',
  registerDescription: 'Create your account to participate in premium tournaments.',

  loadingLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  loadingMainLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  loadingCenterLogo: 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png',
  loadingCenterLogoUrl: '',
  loadingBackgroundImage: '',
  loadingText: 'Loading...',
  loadingLoadingText: 'INITIALIZING SECURE CONNECTION...',
  loadingProgressText: 'LOADING...',
  loadingSubtitle: 'Please wait...',
  loadingTitle: 'TITAN ESP',
  loadingBackgroundColor: '#07070a',
  loadingDuration: 2500,
  loadingPercentageStyle: 'text',
  loadingAnimation: 'Pulse',
  loadingProgressBarColor: '#e5a919',
  loadingProgressBarPosition: 'bottom',
  loadingBgImage: '',
  loadingBgOverlay: 'rgba(0,0,0,0.8)',
  loadingBgMusic: '',
  loadingSoundEffect: '',
  updatedAt: 0,

  primaryColor: '#e5a919',
  secondaryColor: '#1a1a24',
  accentColor: '#4ade80',
  bgColor: '#0d0d14',
  cardColor: '#111116',
  textColor: '#ffffff',
  buttonColor: '#e5a919',
  borderColor: 'rgba(255, 255, 255, 0.05)',
  themeMode: 'dark' as const
};

export const DEFAULT_SUPPORT_SETTINGS: import('./types').SupportSettings = {
  whatsappLink: 'https://wa.me/1234567890',
  telegramLink: 'https://t.me/yourusername',
  whatsappStatus: true,
  telegramStatus: true,
  updatedAt: Date.now()
};

export const DEFAULT_CONTACT_WIDGET_SETTINGS: import('./types').ContactWidgetSettings = {
  whatsappIconUrl: '',
  telegramIconUrl: '',
  whatsappLink: 'https://wa.me/1234567890',
  telegramLink: 'https://t.me/yourusername',
  widgetEnabled: true,
  iconSize: 'medium',
  iconPosition: 'bottom-right',
  updatedAt: Date.now(),
  whatsappUploadedUrl: '',
  whatsappDirectUrl: '',
  telegramUploadedUrl: '',
  telegramDirectUrl: ''
};

export const DEFAULT_WEEKLY_LEADERBOARD_CONFIG: import('./types').WeeklyLeaderboardConfig = {
  rankingCriteria: 'weeklyPoints',
  autoRankingEnabled: true
};

export const SEED_WEEKLY_PLAYERS: import('./types').WeeklyPlayer[] = [
  {
    id: 'wp_1',
    name: 'GodL_Jonathan',
    uid: '539128301',
    gameCategory: 'PUBG Mobile',
    matchesPlayed: 45,
    wins: 18,
    kills: 142,
    prizeWon: 12500,
    weeklyPoints: 2450,
    winRate: 40,
    kdRatio: 4.8,
    rank: 1,
    status: 'active',
    verified: true,
    mvp: true,
    profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_2',
    name: 'TX_Mortal',
    uid: '291038591',
    gameCategory: 'PUBG Mobile',
    matchesPlayed: 42,
    wins: 14,
    kills: 112,
    prizeWon: 9500,
    weeklyPoints: 2100,
    winRate: 33.3,
    kdRatio: 4.1,
    rank: 2,
    status: 'active',
    verified: true,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_3',
    name: 'Vasi_Karan',
    uid: '928410294',
    gameCategory: 'Free Fire',
    matchesPlayed: 38,
    wins: 15,
    kills: 120,
    prizeWon: 8000,
    weeklyPoints: 1950,
    winRate: 39.4,
    kdRatio: 3.8,
    rank: 3,
    status: 'active',
    verified: true,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_4',
    name: 'CoC_Clasher',
    uid: '381948201',
    gameCategory: 'Clash of Clans',
    matchesPlayed: 30,
    wins: 25,
    kills: 0,
    prizeWon: 6000,
    weeklyPoints: 1800,
    winRate: 83.3,
    kdRatio: 0,
    rank: 4,
    status: 'active',
    verified: false,
    mvp: true,
    profileImage: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_5',
    name: 'ScoutOP',
    uid: '482019482',
    gameCategory: 'PUBG Mobile',
    matchesPlayed: 35,
    wins: 10,
    kills: 98,
    prizeWon: 5000,
    weeklyPoints: 1650,
    winRate: 28.5,
    kdRatio: 3.5,
    rank: 5,
    status: 'active',
    verified: true,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_6',
    name: 'TSG_Ritika',
    uid: '104928402',
    gameCategory: 'Free Fire',
    matchesPlayed: 32,
    wins: 11,
    kills: 84,
    prizeWon: 4500,
    weeklyPoints: 1500,
    winRate: 34.3,
    kdRatio: 3.1,
    rank: 6,
    status: 'active',
    verified: false,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_7',
    name: 'CoC_Master',
    uid: '810482910',
    gameCategory: 'Clash of Clans',
    matchesPlayed: 28,
    wins: 22,
    kills: 0,
    prizeWon: 4000,
    weeklyPoints: 1400,
    winRate: 78.5,
    kdRatio: 0,
    rank: 7,
    status: 'active',
    verified: false,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_8',
    name: 'Total_Gaming',
    uid: '674829104',
    gameCategory: 'Free Fire',
    matchesPlayed: 30,
    wins: 12,
    kills: 90,
    prizeWon: 3500,
    weeklyPoints: 1350,
    winRate: 40,
    kdRatio: 3.6,
    rank: 8,
    status: 'active',
    verified: true,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_9',
    name: 'Dynamo_YT',
    uid: '104829481',
    gameCategory: 'PUBG Mobile',
    matchesPlayed: 33,
    wins: 9,
    kills: 78,
    prizeWon: 3000,
    weeklyPoints: 1200,
    winRate: 27.2,
    kdRatio: 2.9,
    rank: 9,
    status: 'active',
    verified: true,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    timeframe: 'this_week'
  },
  {
    id: 'wp_10',
    name: 'Slayer_Clash',
    uid: '291049281',
    gameCategory: 'Clash of Clans',
    matchesPlayed: 25,
    wins: 18,
    kills: 0,
    prizeWon: 2000,
    weeklyPoints: 1100,
    winRate: 72,
    kdRatio: 0,
    rank: 10,
    status: 'active',
    verified: false,
    mvp: false,
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    timeframe: 'this_week'
  }
];

export const SEED_WINNERS: any[] = [
  {
    id: 'w_1',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    name: 'ViperFF',
    uid: '827463920',
    gameCategory: 'Free Fire',
    tournamentName: 'TITAN ESP Grand Cup - Bermuda Squad',
    matchType: 'Squad',
    tournamentBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    winnerDate: new Date().toISOString().split('T')[0],
    rank: 1,
    prizeWon: 5000,
    kills: 15,
    matchesPlayed: 5,
    mvp: true,
    verified: true,
    pinned: true,
    displayOrder: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w_2',
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    name: 'Mortal_PUBG',
    uid: '109283742',
    gameCategory: 'PUBG Mobile',
    tournamentName: 'Sanhok Showdown - Solo Arena',
    matchType: 'Solo',
    tournamentBanner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    winnerDate: new Date().toISOString().split('T')[0],
    rank: 1,
    prizeWon: 3500,
    kills: 12,
    matchesPlayed: 4,
    mvp: false,
    verified: true,
    pinned: true,
    displayOrder: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w_3',
    profileImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    name: 'CoC_Chief',
    uid: '810482910',
    gameCategory: 'Clash of Clans',
    tournamentName: 'Clan War Championship Clash',
    matchType: 'Clan',
    tournamentBanner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    winnerDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
    rank: 1,
    prizeWon: 2500,
    kills: 0,
    matchesPlayed: 6,
    mvp: true,
    verified: false,
    pinned: true,
    displayOrder: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w_4',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    name: 'Gyan_Sujjan',
    uid: '55827391',
    gameCategory: 'Free Fire',
    tournamentName: 'Ultimate Battle - Clash Squad',
    matchType: 'Squad',
    tournamentBanner: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=800&auto=format&fit=crop&q=80',
    winnerDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    rank: 2,
    prizeWon: 1500,
    kills: 8,
    matchesPlayed: 5,
    mvp: false,
    verified: true,
    pinned: false,
    displayOrder: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w_5',
    profileImage: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
    name: 'Dynamo_Gamer',
    uid: '104829481',
    gameCategory: 'PUBG Mobile',
    tournamentName: 'Erangel Combat League',
    matchType: 'Duo',
    tournamentBanner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    winnerDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    rank: 3,
    prizeWon: 1000,
    kills: 9,
    matchesPlayed: 6,
    mvp: false,
    verified: false,
    pinned: false,
    displayOrder: 5,
    createdAt: new Date().toISOString()
  }
];


export const DEFAULT_NOTIFICATION_SETTINGS = {
  notificationsEnabled: true
};

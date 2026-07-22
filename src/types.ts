/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  freefireUid: string; // Free Fire Player ID
  avatarUrl: string;
  depositBalance: number; // For match entries only
  winningBalance: number; // Withdraw-able
  bonusBalance: number; // Dynamic promo balance
  referralCode: string; // Dynamic unique referral code (e.g., "VA-XXXX")
  referredBy?: string; // Referral code used during signup
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number;
  isNotificationEnabled: boolean;
  joinedAt: string;
  role: 'user' | 'admin';
  fullName?: string;
  primaryGame?: string;
  mobileNumber?: string;
  accountStatus?: 'active' | 'disabled';
  lastLogin?: string;
  altMobileNumber?: string;
  upiId?: string;
  accountHolderName?: string;
  state?: string;
  country?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  profilePhoto?: string;
  walletBalance?: number;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RoomStatusType = 'open' | 'locked' | 'live' | 'completed';

export interface RegistrationTeam {
  userId: string;
  governmentName: string;
  players: {
    gameName: string;
    uid: string;
  }[];
  registeredAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  bannerUrl: string;
  logoUrl: string;
  entryFee: number;
  prizePool: number;
  perKillPrize: number;
  map: string; // Dynamic maps
  dateTime: string; // ISO String or human readable
  roomStatus: RoomStatusType; // "open", "locked" (slots full), "live", "completed"
  roomID?: string; // Revealed when joined and match is near
  roomPassword?: string; // Revealed when joined and match is near
  matchRoomStatus?: "coming_soon" | "room_available" | "match_live" | "match_completed";
  mode: string;
  minLevel: number;
  isEmulatorAllowed: boolean;
  lastUpdated?: string;
  updatedBy?: string;
  isVpnAllowed: boolean;
  totalSlots: number;
  joinedSlots: string[]; // List of user UIDs who joined
  joinedNicknames: {[uid: string]: string}; // UID -> Free Fire Nickname mapping
  gameName?: string; // e.g. "Free Fire"
  category?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)
  matchType?: "Solo" | "Duo" | "Squad" | string;
  tournamentName?: string; // mapped from title
  thumbnailUrl?: string; // mapped from logoUrl
  description?: string;
  registrationStart?: string;
  registrationEnd?: string;
  matchDate?: string;
  matchTime?: string;
  timeZone?: string;
  status?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  enabled?: boolean; // Enable/Disable Tournament
  matchCategory?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)
  joinedTeams?: RegistrationTeam[]; // Detailed team player registrations
  maxKillsWinner?: string; // Player Nickname with highest kills
  isFreeMatch: boolean;
  rules: string[];
  liveUrl?: string;
  gameCategory?: string; // e.g. "Free Fire", "PUBG Mobile", "Clash of Clans"
  tournamentType?: 'paid' | 'free';
}

export type TransactionType =
  | 'deposit_request'
  | 'deposit_success'
  | 'deposit_failed'
  | 'withdraw_request'
  | 'withdraw_success'
  | 'withdraw_failed'
  | 'match_join_fee'
  | 'match_refund'
  | 'match_winnings'
  | 'referral_bonus'
  | 'bonus_coins'
  | 'deposit_bonus';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  paymentMethod: 'UPI' | 'Razorpay' | 'Paytm' | 'PhonePe' | 'GPay' | 'System';
  upiId?: string; // For withdraw or manual deposits
  referenceNo?: string; // UPI Ref / Transaction ID
  dateTime: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'pending_verification';
  description: string;
}

export interface MatchActivity {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentTitle: string;
  entryFee: number;
  prizePool: number;
  perKillPrize: number;
  map: string;
  dateTime: string;
  status: 'joined' | 'ongoing' | 'completed';
  kills?: number;
  winnings?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'winner' | 'system';
  dateTime: string;
  isRead: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  freefireUid: string;
  avatarUrl: string;
  totalKills: number;
  totalWins: number;
  totalEarnings: number;
}


export interface PlayerRegistration {
  id: string; // REG-XXXXXX
  teamId?: string; // TEAM-XXXXXX
  userId: string; // User account link
  userEmail: string; // Account email
  tournamentId: string;
  tournamentName: string;
  matchType: string;
  entryFee: number;
  prizePool: number;
  map: string;
  dateTime: string; // combined date & time
  players: {
    nickname: string;
    uid: string;
    level?: string;
  }[];
  registeredAt: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'completed' | 'refunded' | 'free';
  governmentName?: string;
  totalAmountPaid?: number;
}

export interface SplashBadge {
  id: string;
  text: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  enabled: boolean;
  order: number;
}

export interface BrandingSettings {
  // 1. Website Information
  websiteName: string;
  websiteShortName: string;
  websiteTitle: string;
  browserTabTitle: string;
  websiteTagline: string;
  footerCopyrightText: string;
  footerDescription: string;
  websiteVersion: string;
  organizationName: string;
  contactEmail: string;
  supportEmail: string;

  // 2. Website Logo (Base64 or URL)
  mainLogo: string;
  headerLogo: string;
  sidebarLogo: string;
  mobileLogo: string;
  footerLogo: string;
  loginLogo: string;
  registerLogo: string;
  dashboardLogo: string;

  // 3. Splash Screen
  splashLogo: string;
  splashBgImage: string;
  splashBgColor: string;
  splashTitle: string;
  splashSubtitle: string;
  splashLoadingText: string;
  splashLoadingAnimation: string; // Fade, Zoom, Glow, Pulse, Slide, Rotate
  splashProgressBarColor: string;
  splashProgressBarStyle: string;
  splashLoadingDuration: number;
  splashAutoRedirectTime: number;

  // Loading Screen Manager additions
  splashWebsiteName?: string;
  splashMainTitle?: string;
  splashSecondaryTitle?: string;
  splashFooterText?: string;
  splashMainLogo?: string;
  splashCenterIcon?: string;
  splashFallbackLogo?: string;
  splashBadges?: SplashBadge[];
  splashBgGradient?: string;
  splashBgOverlayColor?: string;
  splashBgOverlayOpacity?: number;
  splashBgBlur?: number;
  splashMainTitleColor?: string;
  splashSecondaryTitleColor?: string;
  splashSubtitleColor?: string;
  splashLoadingTextColor?: string;
  splashProgressBarBgColor?: string;
  splashGlowColor?: string;
  splashShowProgressBar?: boolean;
  splashProgressBarHeight?: number;
  splashProgressBarWidth?: string;
  splashProgressBarRadius?: number;
  splashProgressBarAnimation?: string;
  splashMinLoadingTime?: number;
  splashMaxLoadingTime?: number;
  splashAllowSkip?: boolean;
  splashShowPercentage?: boolean;
  splashShowLoadingText?: boolean;
  splashLogoAnimation?: string;
  splashTextAnimation?: string;
  splashLogoType?: 'titan' | 'custom' | 'icon';

  // 4. Favicon
  browserFavicon: string;
  pwaAppIcon: string;
  androidIcon: string;
  iphoneIcon: string;

  // 5. Header Settings
  headerTitle: string;
  headerSubtitle: string;
  headerBgColor: string;
  headerSticky: boolean;
  headerShowNotifIcon: boolean;
  headerShowWalletIcon: boolean;
  headerShowProfileIcon: boolean;

  // 6. Footer Settings
  footerSocialFacebook: string;
  footerSocialInstagram: string;
  footerSocialTelegram: string;
  footerSocialDiscord: string;
  footerSocialWhatsapp: string;
  footerSocialYoutube: string;

  // 7. Login Page
  loginBgImage: string;
  loginWelcomeText: string;
  loginSubtitle: string;
  loginButtonText: string;

  // 8. Register Page
  registerBgImage: string;
  registerWelcomeText: string;
  registerDescription: string;

  // 9. Loading Screen
  loadingLogo: string;
  loadingMainLogo: string;
  loadingCenterLogo: string;
  loadingCenterLogoUrl?: string;
  loadingBackgroundImage: string;
  loadingText: string;
  loadingLoadingText?: string;
  loadingProgressText?: string;
  loadingSubtitle: string;
  loadingTitle: string;
  loadingBackgroundColor: string;
  loadingDuration: number;
  loadingPercentageStyle: string;
  loadingAnimation: string;
  loadingProgressBarColor: string;
  loadingProgressBarPosition: string;
  loadingBgImage: string;
  loadingBgOverlay: string;
  loadingBgMusic: string;
  loadingSoundEffect: string;
  updatedAt?: number;

  // 10. Color & Theme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  cardColor: string;
  textColor: string;
  buttonColor: string;
  borderColor: string;
  themeMode: 'dark' | 'light' | 'auto';
}

export interface SupportSettings {
  whatsappLink: string;
  telegramLink: string;
  whatsappStatus: boolean;
  telegramStatus: boolean;
  updatedAt: number;
}

export interface GameCategory {
  id: string;
  name: string;
  icon?: string; // Lucide icon or URL
  banner?: string; // Banner URL or Base64
  logo?: string; // Game Logo (PNG/JPG/WEBP/SVG/Base64/URL)
  enabled: boolean;
  order: number;
  updatedAt?: number;
}

export interface WeeklyPlayer {
  id: string;
  name: string;
  uid: string;
  gameCategory: 'Free Fire' | 'PUBG Mobile' | 'Clash of Clans';
  matchesPlayed: number;
  wins: number;
  kills: number;
  prizeWon: number;
  weeklyPoints: number;
  winRate: number;
  kdRatio?: number;
  rank: number;
  status: 'active' | 'disabled';
  verified: boolean;
  mvp: boolean;
  profileImage: string;
  timeframe: 'this_week' | 'last_week' | 'this_month';
  createdAt?: string;
}

export interface WeeklyLeaderboardConfig {
  rankingCriteria: 'weeklyPoints' | 'totalKills' | 'totalWins' | 'totalPrizeWon' | 'matchesPlayed' | 'manual';
  autoRankingEnabled: boolean;
}

export interface TournamentWinner {
  id: string;
  profileImage: string;
  name: string;
  uid: string;
  gameCategory: 'Free Fire' | 'PUBG Mobile' | 'Clash of Clans';
  tournamentName: string;
  matchType: string;
  tournamentBanner: string;
  winnerDate: string; // "YYYY-MM-DD" or ISO
  rank: number;
  prizeWon: number;
  kills: number;
  matchesPlayed: number;
  mvp: boolean;
  verified: boolean;
  pinned: boolean;
  displayOrder: number;
  createdAt?: string;
  
  // Database fields requested
  winnerId?: string;
  tournamentId?: string;
  position?: string;
  prizeAmount?: number;
  userId?: string;
  username?: string;
  gameName?: string;
  gameUid?: string;
  profilePhoto?: string;
}

export interface HomepageBanner {
  id: string;
  title: string;
  imageUrl: string;
  redirectUrl: string;
  displayOrder: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}




export interface BonusSettings {
  depositBonusEnabled: boolean;
  depositBonusType: 'fixed' | 'percentage';
  depositBonusValue: number;
  minimumDeposit: number;
  maximumDeposit?: number;
  maximumBonus?: number;
  referralBonusEnabled: boolean;
  referrerBonusAmount: number;
  referredUserBonusAmount: number;
  minimumReferralDeposit: number;
  updatedAt: string;
}

export interface BonusHistory {
  id: string;
  userId: string;
  userName: string;
  bonusType: 'deposit_bonus' | 'referral_bonus';
  depositAmount?: number;
  bonusAmount: number;
  referralCode?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface LoadingScreenSettings {
  loadingLogoUrl: string;
  loadingLogoSource: 'upload' | 'url';
  loadingTitle: string;
  loadingSubtitle: string;
  loadingText: string;
  backgroundColor: string;
  backgroundImage: string;
  progressBarEnabled: boolean;
  animationEnabled: boolean;
  updatedAt?: number;
  uploadedLogoUrl?: string;
  directLogoUrl?: string;
  loadingLogoType?: 'upload' | 'url' | 'default';
  loadingImageUrl?: string;
  updatedBy?: string;
}

export interface StorageFile {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageProvider: 'firebase' | 'gdrive' | 's3' | 'r2';
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: number;
  updatedAt: number;
}

export interface StorageSettings {
  provider: 'firebase' | 'gdrive' | 's3' | 'r2';
  gdriveFolderId?: string;
  gdriveApiKey?: string;
  gdriveClientId?: string;
  s3Bucket?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Endpoint?: string;
  
  // Advanced database fields matching user's spec
  activeProvider?: 'firebase' | 'gdrive' | 's3' | 'r2';
  googleDriveApiKey?: string;
  googleDriveFolderId?: string;
  googleOAuthClientId?: string;
  googleOAuthClientSecret?: string;
  googleRedirectUri?: string;
  googleProjectId?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'error' | 'pending';
  updatedAt?: number;
  updatedBy?: string;
}

export interface ContactWidgetSettings {
  whatsappIconUrl: string;
  telegramIconUrl: string;
  whatsappLink: string;
  telegramLink: string;
  widgetEnabled: boolean;
  iconSize: 'small' | 'medium' | 'large';
  iconPosition: 'bottom-right' | 'bottom-left';
  updatedAt: number;
  whatsappUploadedUrl?: string;
  whatsappDirectUrl?: string;
  telegramUploadedUrl?: string;
  telegramDirectUrl?: string;
}



export interface NotificationSettings {
  notificationsEnabled: boolean;
}
export interface PromoSettings {
  promoCodesEnabled: boolean;
}

export interface ProviderConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  appId?: string;
  appSecret?: string;
  serviceId?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
  tenantId?: string;
  countryConfig?: string;
}

export interface AuthProvidersPublic {
  email: boolean;
  google: boolean;
  facebook: boolean;
  apple: boolean;
  github: boolean;
  twitter: boolean;
  microsoft: boolean;
  phone: boolean;
}

export interface AuthProvidersPrivate {
  email: ProviderConfig;
  google: ProviderConfig;
  facebook: ProviderConfig;
  apple: ProviderConfig;
  github: ProviderConfig;
  twitter: ProviderConfig;
  microsoft: ProviderConfig;
  phone: ProviderConfig;
}


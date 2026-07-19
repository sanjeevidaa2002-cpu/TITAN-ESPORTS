/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { SplashScreen } from './components/SplashScreen';
import { Auth } from './components/Auth';
import { HomeTab } from './components/HomeTab';
import { MatchesTab } from './components/MatchesTab';
import { WalletTab } from './components/WalletTab';
import { ProfileTab } from './components/ProfileTab';
import { ReferralSystem } from './components/ReferralSystem';
import { Leaderboard } from './components/Leaderboard';
import { Support } from './components/Support';
import { TournamentDetailsModal } from './components/TournamentDetailsModal';
import { PlayerDetailsForm } from './components/PlayerDetailsForm';
import { AdminDashboard } from './components/AdminDashboard';
import { YouTubeTab, preloadYouTubeData } from './components/YouTubeTab';
import { FloatingSupportWidget } from './components/FloatingSupportWidget';
import { Tournament } from './types';
import { 
  Home, 
  Gamepad2, 
  Wallet, 
  User, 
  Bell, 
  Trophy, 
  LogOut, 
  X,
  AlertCircle,
  HelpCircle,
  Shield,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Menu,
  Gift,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function DashboardContent() {
  const { currentUser, userProfile, tournaments, logout, notifications, brandingSettings, notificationSettings } = useGame();
  
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [matchesFilter, setMatchesFilter] = useState<'all' | 'live' | 'open' | 'completed' | 'my_matches'>('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1200);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setDeviceType('mobile');
      } else if (w < 1200) {
        setDeviceType('tablet');
        setSidebarCollapsed(true);
      } else {
        setDeviceType('desktop');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const latestSelectedTournament = selectedTournament ? (tournaments.find(t => t.id === selectedTournament.id) || null) : null;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, onClick: () => setActiveTab('home') },
    { id: 'matches', label: 'Tournament', icon: Gamepad2, onClick: () => { setMatchesFilter('all'); setActiveTab('matches'); } },
    { id: 'youtube', label: 'YouTube', icon: Youtube, onClick: () => setActiveTab('youtube') },
    { id: 'wallet', label: 'Wallet', icon: Wallet, onClick: () => setActiveTab('wallet') },
    { id: 'profile', label: 'Profile', icon: User, onClick: () => setActiveTab('profile') },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, onClick: () => setActiveTab('leaderboard') },
    { id: 'referral', label: 'Referral', icon: Gift, onClick: () => setActiveTab('referral') },
    { id: 'support', label: 'Live', icon: HelpCircle, onClick: () => setActiveTab('support') },
        { id: 'logout', label: 'Logout', icon: LogOut, onClick: logout },
  ];

  // Active push toast alerts
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const [dismissedToasts, setDismissedToasts] = useState<string[]>([]);

  // Preload YouTube Data
  useEffect(() => {
    if (currentUser) {
      preloadYouTubeData();
    }
  }, [currentUser]);

  // Update document title and favicon
  useEffect(() => {
    if (brandingSettings?.browserTabTitle) {
      document.title = brandingSettings.browserTabTitle;
    }
    
    if (brandingSettings?.browserFavicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = brandingSettings.browserFavicon;
    }
  }, [brandingSettings?.browserTabTitle, brandingSettings?.browserFavicon]);

  // Listen to incoming notifications and trigger a slide-down banner
  useEffect(() => {
    if (notifications.length > 0 && notificationSettings?.notificationsEnabled !== false) {
      const latest = notifications[0];
      if (!dismissedToasts.includes(latest.id)) {
        setActiveToast({
          id: latest.id,
          title: latest.title,
          message: latest.message,
          type: latest.type
        });

        // Auto hide toast after 5 seconds
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, dismissedToasts, notificationSettings]);

  // Handle URL callback parameters for automated payment gateways
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const amt = params.get('amount');

    if (status) {
      setActiveTab('wallet'); // Switch straight to wallet tab
      
      if (status === 'success') {
        setActiveToast({
          id: 'pay_success_' + Date.now(),
          title: 'Deposit Cash Success! 🎉',
          message: `₹${amt ? Number(amt).toFixed(2) : '0.00'} has been successfully credited to your wallet balance.`,
          type: 'info'
        });
      } else {
        setActiveToast({
          id: 'pay_failed_' + Date.now(),
          title: 'Transaction Declined ❌',
          message: 'The automated payment request was declined. No amount has been charged.',
          type: 'alert'
        });
      }

      // Clean up URL parameters without forcing a reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Path-based routing sync for /
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/') {
        setActiveTab('home');
      }
    };

    // Check on mount
    const path = window.location.pathname;
    if (path === '/') {
      setActiveTab('home');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (activeTab === 'home' && currentPath !== '/') {
      window.history.pushState(null, '', '/');
    } else if (activeTab !== 'home' && currentPath !== '/') {
      window.history.pushState(null, '', '/');
    }
  }, [activeTab]);

  const handleDismissToast = () => {
    if (activeToast) {
      setDismissedToasts([...dismissedToasts, activeToast.id]);
      setActiveToast(null);
    }
  };

  const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) {
      const path = window.location.pathname;
      if (path === '/login' || path === '/signup') {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  // If no logged in user, show auth form
  if (!currentUser) {
    const isSignup = window.location.pathname === '/signup';
    return <Auth initialMode={isSignup ? 'signup' : 'login'} />;
  }

  

  return (
    <div className="min-h-screen bg-[#08080c] text-white flex flex-col md:flex-row font-sans selection:bg-gold-500 selection:text-neutral-950 relative overflow-x-hidden">
      
      {/* Background Graphic Orbits */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-neon-purple/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Slide-down push notification banner */}
      {activeToast && notificationSettings?.notificationsEnabled !== false ? (
        <div className="fixed top-4 left-4 right-4 z-50 animate-[slide-down_0.3s_ease-out] flex justify-center pointer-events-none">
          <div className="glass-card-gold border-gold-500/30 p-4 rounded-2xl w-full max-w-md pointer-events-auto flex gap-3 shadow-2xl relative overflow-hidden">
            {/* Ambient flash glow */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-500 to-amber-600" />
            
            <div className="shrink-0 p-1.5 rounded-lg bg-gold-500/10 text-gold-400">
              <Bell className="w-5 h-5 animate-swing" />
            </div>

            <div className="space-y-1 pr-6 flex-1">
              <p className="text-xs font-black text-white uppercase tracking-wider">{activeToast.title}</p>
              <p className="text-[10px] text-neutral-300 leading-relaxed font-sans">{activeToast.message}</p>
            </div>

            <button 
              onClick={handleDismissToast}
              className="absolute top-3.5 right-3 text-neutral-500 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* --- DESKTOP / LAPTOP / TABLET SIDEBAR --- */}
      <aside 
        className="hidden md:flex flex-col shrink-0 border-r border-white/5 backdrop-blur-lg transition-all duration-300 ease-in-out z-40 fixed left-0 top-0 h-screen overflow-hidden" 
        style={{ 
          backgroundColor: brandingSettings?.headerBgColor || 'rgba(13, 13, 20, 0.9)',
          width: sidebarCollapsed ? '75px' : '260px'
        }}
      >
        {/* Sidebar Header */}
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center p-4 border-b border-white/5 gap-3.5 shrink-0 w-full">
            {/* Logo */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#13131a] to-[#252538] flex items-center justify-center border border-gold-500/30 shadow-[0_0_15px_rgba(229,169,25,0.15)] p-0.5">
              {brandingSettings?.sidebarLogo ? (
                <img src={brandingSettings.sidebarLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : brandingSettings?.mainLogo ? (
                <img src={brandingSettings.mainLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Trophy className="w-5 h-5 text-gold-400" />
              )}
            </div>
            {/* Hamburger Button below the Logo */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/5"
              title="Expand Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center p-4 border-b border-white/5 gap-3 shrink-0 w-full">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#13131a] to-[#252538] flex items-center justify-center border border-gold-500/30 shadow-[0_0_15px_rgba(229,169,25,0.15)] p-1">
              {brandingSettings?.sidebarLogo ? (
                <img src={brandingSettings.sidebarLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : brandingSettings?.mainLogo ? (
                <img src={brandingSettings.mainLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Trophy className="w-6 h-6 text-gold-400" />
              )}
            </div>
            {/* Website Name */}
            <span className="font-extrabold text-xs tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase text-center max-w-[200px] truncate">
              {brandingSettings?.websiteName || 'TITAN ESPORTS'}
            </span>
            {deviceType === 'desktop' && (

                <button 

                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}

                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-white/5 mt-1"

                  title="Collapse Sidebar"

                >

                  <Menu className="w-5 h-5" />

                </button>

              )}
          </div>
        )}

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'profile' && ['referral', 'leaderboard'].includes(activeTab));
            
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center transition-all duration-200 cursor-pointer ${
                  sidebarCollapsed 
                    ? 'justify-center py-3 px-0 rounded-xl' 
                    : 'justify-start gap-3.5 px-3.5 py-3 rounded-xl'
                } ${
                  isActive 
                    ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400 shadow-[inset_0_1px_1px_rgba(229,169,25,0.15)] font-extrabold' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold-400' : 'text-neutral-400'}`} />
                {!sidebarCollapsed && (
                  <span className="text-xs uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Profile/Footer */}
        <div className={`p-4 border-t border-white/5 bg-[#0a0a0f] flex items-center shrink-0 w-full ${
          sidebarCollapsed ? 'justify-center' : 'gap-3 justify-start'
        }`}>
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-black text-xs text-neutral-300 overflow-hidden shrink-0 border border-white/5">
            <img 
              src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                {userProfile?.nickname || 'lokesh meena'}
              </p>
              <button 
                onClick={logout}
                className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold uppercase tracking-wider transition-all mt-0.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* --- CONTENT PANE & MOBILE LAYOUT WRAPPER --- */}
      <div 
        className="flex-1 flex flex-col min-h-screen relative overflow-y-auto transition-all duration-300 ease-in-out" 
        style={{ 
          backgroundColor: brandingSettings?.bgColor || 'transparent',
          paddingLeft: deviceType === 'mobile' ? '0px' : sidebarCollapsed ? '75px' : '260px'
        }}
      >
        
        {/* Mobile top bar header (hidden on desktop) */}
        <header className={`md:hidden ${brandingSettings?.headerSticky === false ? 'relative' : 'sticky top-0 z-40'} backdrop-blur-md border-b border-white/5 py-3.5 px-4 flex items-center justify-between shrink-0`} style={{ backgroundColor: brandingSettings?.headerBgColor || 'rgba(8, 8, 12, 0.8)' }}>
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#13131a] to-[#252538] flex items-center justify-center border border-gold-500/30 shadow-[0_0_15px_rgba(229,169,25,0.15)] p-0.5">
              {brandingSettings?.mobileLogo ? (
                <img src={brandingSettings.mobileLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : brandingSettings?.mainLogo ? (
                <img src={brandingSettings.mainLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Trophy className="w-4.5 h-4.5 text-gold-400 group-hover:rotate-12 transition-all" />
              )}
            </div>
            <span className="font-extrabold text-xs tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">
              {brandingSettings?.websiteShortName || brandingSettings?.websiteName || 'TITAN ESPORTS'}
            </span>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 w-full max-w-full lg:max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 z-10 relative pb-24 md:pb-8">
          {activeTab === 'home' ? (
            <HomeTab onSwitchTab={setActiveTab} onSetMatchFilter={setMatchesFilter} />
          ) : null}

          {activeTab === 'matches' ? (
            <MatchesTab 
              initialFilter={matchesFilter} 
              onResetInitialFilter={() => setMatchesFilter('all')} 
              onOpenDetailsModal={setSelectedTournament} 
            />
          ) : null}

          {activeTab === 'wallet' ? (
            <WalletTab />
          ) : null}

          {activeTab === 'youtube' ? (
            <YouTubeTab />
          ) : null}

          {activeTab === 'profile' ? (
            <ProfileTab onSwitchTab={setActiveTab} />
          ) : null}

          {activeTab === 'referral' ? (
            <ReferralSystem onBack={() => setActiveTab('profile')} />
          ) : null}

          {activeTab === 'leaderboard' ? (
            <Leaderboard onBack={() => setActiveTab('profile')} />
          ) : null}

          {activeTab === 'support' ? (
            <Support onBack={() => setActiveTab('home')} />
          ) : null}

          {activeTab === 'player-details' ? (
            <PlayerDetailsForm 
              onBackToMatches={() => setActiveTab('matches')} 
              onGoToMyMatches={() => { setMatchesFilter('my_matches'); setActiveTab('matches'); }} 
            />
          ) : null}
        </main>

        {/* Fixed bottom navigation (hidden on desktop) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08080c]/90 border-t border-white/5 backdrop-blur-md pb-safe">
          <div className="max-w-lg mx-auto flex justify-evenly h-16 items-center w-full">
            
            {/* Home */}
            <button 
              onClick={() => setActiveTab('home')}
              className={`bottom-nav-item flex-1 h-full flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${activeTab === 'home' ? 'text-gold-400' : 'text-neutral-500 hover:text-white'}`}
            >
              <Home className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
            </button>

            {/* Matches */}
            <button 
              onClick={() => { setMatchesFilter('all'); setActiveTab('matches'); }}
              className={`bottom-nav-item flex-1 h-full flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${activeTab === 'matches' ? 'text-gold-400' : 'text-neutral-500 hover:text-white'}`}
            >
              <Gamepad2 className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Matches</span>
            </button>

            {/* YouTube Stream */}
            <button 
              onClick={() => setActiveTab('youtube')}
              className={`bottom-nav-item flex-1 h-full flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${activeTab === 'youtube' ? 'text-gold-400' : 'text-neutral-500 hover:text-white'}`}
            >
              <Youtube className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">YouTube</span>
            </button>

            {/* Wallet */}
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`bottom-nav-item flex-1 h-full flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${activeTab === 'wallet' ? 'text-gold-400' : 'text-neutral-500 hover:text-white'}`}
            >
              <Wallet className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wallet</span>
            </button>

            {/* Profile */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`bottom-nav-item flex-1 h-full flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${['profile', 'referral', 'leaderboard'].includes(activeTab) ? 'text-gold-400' : 'text-neutral-500 hover:text-white'}`}
            >
              <User className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
            </button>

          </div>
        </nav>
      </div>

      {/* Global details rules modal */}
      {latestSelectedTournament ? (
        <TournamentDetailsModal 
          tournament={latestSelectedTournament} 
          onClose={() => setSelectedTournament(null)} 
          onSwitchTab={setActiveTab}
        />
      ) : null}

    </div>
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard onBack={() => {}} />} />
          
          <Route path="/login" element={<DashboardContent />} />
          <Route path="/signup" element={<DashboardContent />} />
          <Route path="/*" element={<DashboardContent />} />
        </Routes>
        <FloatingSupportWidget />
      </GameProvider>
    </BrowserRouter>
  );
}

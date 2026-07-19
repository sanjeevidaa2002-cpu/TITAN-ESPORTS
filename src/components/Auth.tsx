/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Trophy, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  AlertTriangle, 
  ChevronRight, 
  CornerDownRight,
  Phone
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  FacebookAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider, 
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from '../firebase';

// Colored SVGs for social sign-in buttons
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.1 3.81.22 1.25.5 2.23 1.66 2.72 2.77-2.54 1.51-2.13 4.96.44 6 .11-.26.24-.51.36-.74.34-.69.69-1.38.74-2.08H18.7c-.01.07-.01.14-.01.21-.01.69-.19 1.37-.53 1.99a9.63 9.63 0 01-1.31 1.74l1.86 1.85zm-4.3-16.14c.67-.81 1.12-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.27-.58 2.97-1.4z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f35325" d="M0 0h11v11H0z" />
    <path fill="#81bc06" d="M12 0h11v11H12z" />
    <path fill="#05a6f0" d="M0 12h11v11H0z" />
    <path fill="#ffba08" d="M12 12h11v11H12z" />
  </svg>
);

export const Auth: React.FC<{ initialMode?: 'login' | 'signup' }> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    userProfile, 
    loginWithCredentials, 
    registerWithCredentials, 
    loginWithGoogle, 
    error, 
    brandingSettings,
    authProviders
  } = useGame();
  
  React.useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);
  
  const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');

  React.useEffect(() => {
    setIsRegistering(location.pathname === '/signup');
  }, [location.pathname]);

  const handleTabChange = (signup: boolean) => {
    setIsRegistering(signup);
    setLocalErr(null);
    navigate(signup ? '/signup' : '/login');
  };

  // Form fields
  const [usernameOrMobile, setUsernameOrMobile] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Phone Authentication State
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const activeProviders = authProviders || {
    email: true,
    google: true,
    facebook: false,
    apple: false,
    github: false,
    twitter: false,
    microsoft: false,
    phone: false
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) {
          setLocalErr("Username is required.");
          setLoading(false); return;
        }
        if (!mobile.trim()) {
          setLocalErr("Mobile Number is required.");
          setLoading(false); return;
        }
        if (password.length < 6) {
          setLocalErr("Password must be at least 6 characters.");
          setLoading(false); return;
        }
        if (password !== confirmPassword) {
          setLocalErr("Passwords do not match.");
          setLoading(false); return;
        }
        console.log("[AuthUI] Triggering registration...");
        await registerWithCredentials(username, mobile, password, refCode.trim());
        console.log("[AuthUI] Registration call finished");
      } else {
        if (!usernameOrMobile.trim()) {
          setLocalErr("Please enter your Username or Mobile Number.");
          setLoading(false); return;
        }
        console.log("[AuthUI] Triggering login...");
        await loginWithCredentials(usernameOrMobile, password);
        console.log("[AuthUI] Login call finished");
      }
    } catch (err: any) {
      console.error("[AuthUI] Auth operation failed:", err);
      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/wrong-password' || errorMessage.toLowerCase().includes('password')) {
        setLocalErr("Incorrect password. Please verify and try again.");
      } else if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('user')) {
        setLocalErr("User not found or credentials invalid.");
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('unavailable')) {
        setLocalErr("Network connection failed. Please check your internet and try again.");
      } else if (errorMessage) {
        setLocalErr(`Error: ${errorMessage}`);
      } else {
        setLocalErr("An unexpected authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalErr(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      let friendlyMessage = err?.message || "Google Authentication failed.";
      
      if (err?.code === 'auth/popup-closed-by-user') {
        friendlyMessage = "Google Sign-In was cancelled. The window was closed before completion.";
      } else if (err?.code === 'auth/unauthorized-domain' || friendlyMessage.includes('unauthorized-domain') || friendlyMessage.includes('authDomain')) {
        friendlyMessage = "This domain is not authorized for Google Sign-In. Please add " + window.location.hostname + " to the Firebase Console Authorized Domains list.";
      } else if (err?.code === 'auth/network-request-failed') {
        friendlyMessage = "Network error. Please check your internet connection.";
      } else if (err?.code === 'auth/invalid-oauth-client-id') {
        friendlyMessage = "Invalid OAuth Client ID configuration in Firebase.";
      } else if (err?.code === 'auth/popup-blocked') {
        friendlyMessage = "Google sign-in popup was blocked by your browser. Please enable popups or try again.";
      }
      
      setLocalErr(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: string) => {
    setLocalErr(null);
    setLoading(true);
    try {
      let provider;
      if (providerName === 'facebook') {
        provider = new FacebookAuthProvider();
      } else if (providerName === 'github') {
        provider = new GithubAuthProvider();
      } else if (providerName === 'twitter') {
        provider = new TwitterAuthProvider();
      } else if (providerName === 'apple') {
        provider = new OAuthProvider('apple.com');
      } else if (providerName === 'microsoft') {
        provider = new OAuthProvider('microsoft.com');
      } else {
        throw new Error("Unsupported provider");
      }

      let inIframe = false;
      try {
        inIframe = window.self !== window.top;
      } catch (e) {
        inIframe = true;
      }

      if (inIframe) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      console.error(`${providerName} login failed:`, err);
      setLocalErr(err?.message || `${providerName} Sign-In failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPhoneLoading(true);
    try {
      let recaptchaVerifier = (window as any).recaptchaVerifier;
      if (!recaptchaVerifier) {
        recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
        (window as any).recaptchaVerifier = recaptchaVerifier;
      }

      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.error("SMS OTP dispatch failed:", err);
      setPhoneError(err?.message || "Failed to send SMS OTP. Please check your phone number.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPhoneLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No active phone verification session found.");
      }
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      console.error("OTP Code validation failed:", err);
      setPhoneError(err?.message || "Incorrect verification code. Please check and retry.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const socialButtons = [
    { key: 'google', label: 'Continue with Google', icon: <GoogleIcon />, onClick: handleGoogleLogin },
    { key: 'facebook', label: 'Continue with Facebook', icon: <FacebookIcon />, onClick: () => handleSocialLogin('facebook') },
    { key: 'apple', label: 'Continue with Apple', icon: <AppleIcon />, onClick: () => handleSocialLogin('apple') },
    { key: 'github', label: 'Continue with GitHub', icon: <GithubIcon />, onClick: () => handleSocialLogin('github') },
    { key: 'twitter', label: 'Continue with X / Twitter', icon: <TwitterIcon />, onClick: () => handleSocialLogin('twitter') },
    { key: 'microsoft', label: 'Continue with Microsoft', icon: <MicrosoftIcon />, onClick: () => handleSocialLogin('microsoft') },
    { key: 'phone', label: 'Continue with Phone OTP', icon: <Phone className="w-4 h-4 text-indigo-400 shrink-0" />, onClick: () => setShowPhoneLogin(true) }
  ].filter(p => activeProviders[p.key as keyof typeof activeProviders]);

  const hasSocialProviders = socialButtons.length > 0;

  return (
    <div id="auth_container" className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ 
      backgroundColor: brandingSettings?.bgColor || '#07070a',
      backgroundImage: (isRegistering ? brandingSettings?.registerBgImage : brandingSettings?.loginBgImage) ? `url(${isRegistering ? brandingSettings?.registerBgImage : brandingSettings?.loginBgImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* Dynamic graphic backgrounds */}
      {!(isRegistering ? brandingSettings?.registerBgImage : brandingSettings?.loginBgImage) && (
        <>
          <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-neon-purple/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* TITAN ESP Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#13131a] to-[#252538] flex items-center justify-center border border-gold-500/30 shadow-[0_0_20px_rgba(229,169,25,0.1)] mb-3 p-1">
            {brandingSettings?.loginLogo && !isRegistering ? (
              <img src={brandingSettings.loginLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : brandingSettings?.registerLogo && isRegistering ? (
              <img src={brandingSettings.registerLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : brandingSettings?.mainLogo ? (
              <img src={brandingSettings.mainLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Trophy className="w-8 h-8 text-gold-400" />
            )}
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-amber-500 to-yellow-300 tracking-widest uppercase">
            {brandingSettings?.websiteName || 'TITAN ESP'}
          </h1>
          <p className="text-xs text-neutral-400 font-mono uppercase tracking-[0.15em] mt-1">
            {isRegistering 
              ? (brandingSettings?.registerWelcomeText || 'Join the Elite') 
              : (brandingSettings?.loginWelcomeText || 'Welcome Back Commander')}
          </p>
        </div>

        {/* Login Card wrapper */}
        <div className="glass-card-gold rounded-3xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-gold-500/20 bg-[#0d0d14]/90">
          
          {showPhoneLogin ? (
            /* Phone OTP Login Screen */
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center mb-2">
                <h3 className="text-sm font-black uppercase text-gold-400 tracking-wider">Phone Verification</h3>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">
                  Get a secure SMS code to log in instantly.
                </p>
              </div>

              {phoneError && (
                <div className="bg-red-950/40 border border-red-500/20 p-3 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-red-200">
                    {phoneError}
                  </div>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +919876543210"
                        required
                        className="w-full bg-[#111116] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div id="recaptcha-container" className="my-2"></div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black py-3 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {phoneLoading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="e.g. 123456"
                        required
                        className="w-full bg-[#111116] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono tracking-[0.5em] text-center font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 font-black py-3 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {phoneLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider font-bold transition-all mt-2 cursor-pointer bg-transparent border-none"
                  >
                    Resend Code / Change Number
                  </button>
                </form>
              )}

              <div className="border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneLogin(false);
                    setOtpSent(false);
                    setPhoneError(null);
                  }}
                  className="w-full text-center text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider font-bold transition-all cursor-pointer bg-transparent border-none"
                >
                  Back to normal Sign In
                </button>
              </div>
            </div>
          ) : (
            /* Normal Credentials / Social Sign In Screens */
            <>
              {/* Premium Tab Switcher - only show if email login is active */}
              {activeProviders.email && (
                <div className="relative flex bg-[#111116] p-1 rounded-2xl mb-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <motion.div 
                    className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                    layout
                    initial={false}
                    animate={{
                      left: isRegistering ? 'calc(50% + 2px)' : '4px',
                      width: 'calc(50% - 6px)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                  />
                  
                  <button 
                    type="button"
                    onClick={() => handleTabChange(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider relative z-10 transition-colors duration-200 cursor-pointer ${!isRegistering ? 'text-[#0d0d11]' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleTabChange(true)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider relative z-10 transition-colors duration-200 cursor-pointer ${isRegistering ? 'text-[#0d0d11]' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* General Errors */}
              {(error || localErr) ? (
                <div className="bg-red-950/40 border border-red-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-200">
                    {localErr || error}
                  </div>
                </div>
              ) : null}

              {/* Auth Credentials Form - Render only if email is enabled */}
              {activeProviders.email ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegistering ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Profile Username</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            placeholder="e.g. TitanGamer"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Mobile Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="tel" 
                            value={mobile}
                            onChange={e => setMobile(e.target.value)}
                            required
                            placeholder="e.g. 9876543210"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Referral Code (Optional)</label>
                        <p className="text-[10px] text-amber-500/80 mb-2 flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3" /> Get ₹15 instant deposit cash!
                        </p>
                        <input 
                          type="text" 
                          value={refCode}
                          onChange={e => setRefCode(e.target.value)}
                          placeholder="e.g. VA-LOK88"
                          className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-xs text-white uppercase focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Username OR Mobile Number</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="text" 
                            value={usernameOrMobile}
                            onChange={e => setUsernameOrMobile(e.target.value)}
                            required
                            placeholder="TitanGamer or 9876543210"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 text-neutral-950 font-bold py-3 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-sm uppercase tracking-wider mt-4 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In To Battle')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => handleTabChange(!isRegistering)}
                      className="text-xs text-neutral-400 hover:text-gold-400 transition-colors uppercase tracking-wider font-bold cursor-pointer bg-transparent border-none"
                    >
                      {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Elegant prompt if only SSO is available */
                <div className="text-center py-4 space-y-1">
                  <h3 className="text-xs font-black uppercase text-gold-400 tracking-wider">Secure Portal Sign In</h3>
                  <p className="text-[10px] text-neutral-400 leading-relaxed uppercase tracking-wider font-semibold">
                    Credential logins are disabled. Please sign in using an authorized SSO method:
                  </p>
                </div>
              )}

              {/* Dynamic Separator Line */}
              {activeProviders.email && hasSocialProviders && (
                <div className="flex items-center my-5">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="px-3 text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                    OR
                  </span>
                  <div className="flex-1 border-t border-white/10"></div>
                </div>
              )}

              {/* Dynamic rendering of Social SSO Buttons */}
              {hasSocialProviders ? (
                <div className="space-y-3">
                  {socialButtons.map((provider) => (
                    <button
                      key={provider.key}
                      type="button"
                      onClick={provider.onClick}
                      disabled={loading}
                      className="w-full bg-[#111116] hover:bg-[#16161f] text-white border border-white/10 hover:border-white/20 font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      {provider.icon}
                      <span>{provider.label}</span>
                    </button>
                  ))}
                </div>
              ) : !activeProviders.email ? (
                /* Fallback if ALL login methods are disabled */
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-center text-xs text-red-200">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-500" />
                  No login methods currently enabled by the System Administrator. Please contact support.
                </div>
              ) : null}
            </>
          )}

          {/* Verification / Anti-cheat Banner */}
          <p className="text-[10px] text-center text-neutral-500 mt-6 leading-relaxed">
            By joining, you agree to our 100% Active Anti-Cheat & Teaming Prevention Rules. Players with modified files are permanently hardware blocked.
          </p>
        </div>
      </div>
    </div>
  );
};

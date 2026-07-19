import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Save, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Info,
  Loader2
} from 'lucide-react';
import { AuthProvidersPublic, AuthProvidersPrivate, ProviderConfig } from '../types';

// SVGs for social platforms
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.1 3.81.22 1.25.5 2.23 1.66 2.72 2.77-2.54 1.51-2.13 4.96.44 6 .11-.26.24-.51.36-.74.34-.69.69-1.38.74-2.08H18.7c-.01.07-.01.14-.01.21-.01.69-.19 1.37-.53 1.99a9.63 9.63 0 01-1.31 1.74l1.86 1.85zm-4.3-16.14c.67-.81 1.12-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.27-.58 2.97-1.4z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23">
    <path fill="#f35325" d="M0 0h11v11H0z" />
    <path fill="#81bc06" d="M12 0h11v11H12z" />
    <path fill="#05a6f0" d="M0 12h11v11H0z" />
    <path fill="#ffba08" d="M12 12h11v11H12z" />
  </svg>
);

export const AdminAuthProvidersTab: React.FC = () => {
  const { authProviders, updateAuthProvidersAdmin, triggerNotification } = useGame();
  
  const [privateConfigs, setPrivateConfigs] = useState<AuthProvidersPrivate | null>(null);
  const [publicConfigs, setPublicConfigs] = useState<AuthProvidersPublic>(authProviders);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Accordion expanded state tracking
  const [expandedId, setExpandedId] = useState<string | null>('email');

  // Input visibility toggle states
  const [showSecret, setShowSecret] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setPublicConfigs(authProviders);
  }, [authProviders]);

  useEffect(() => {
    const fetchPrivateConfigs = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'auth_private');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPrivateConfigs(docSnap.data() as AuthProvidersPrivate);
        } else {
          // Default fallbacks if not yet initialized in Firestore
          const defaultPrivate: AuthProvidersPrivate = {
            email: { enabled: true },
            google: { enabled: true, clientId: '', clientSecret: '', redirectUri: window.location.origin + '/__/auth/handler' },
            facebook: { enabled: false, appId: '', appSecret: '', redirectUri: window.location.origin + '/__/auth/handler' },
            apple: { enabled: false, serviceId: '', teamId: '', keyId: '', privateKey: '' },
            github: { enabled: false, clientId: '', clientSecret: '' },
            twitter: { enabled: false, clientId: '', clientSecret: '' },
            microsoft: { enabled: false, clientId: '', clientSecret: '', tenantId: '' },
            phone: { enabled: false, countryConfig: '+91' }
          };
          setPrivateConfigs(defaultPrivate);
        }
      } catch (err: any) {
        console.error("Error fetching private auth configs:", err);
        triggerNotification("Error", "Failed to load authentication secrets.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateConfigs();
  }, []);

  const handleToggleEnable = (providerKey: keyof AuthProvidersPublic) => {
    if (!privateConfigs) return;

    const currentStatus = publicConfigs[providerKey];
    const newStatus = !currentStatus;

    setPublicConfigs(prev => ({
      ...prev,
      [providerKey]: newStatus
    }));

    setPrivateConfigs(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [providerKey]: {
          ...prev[providerKey],
          enabled: newStatus
        }
      };
    });
  };

  const handleFieldChange = (providerKey: keyof AuthProvidersPrivate, field: string, value: string) => {
    setPrivateConfigs(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [providerKey]: {
          ...prev[providerKey],
          [field]: value
        }
      };
    });
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecret(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveProviderSettings = async (providerKey: keyof AuthProvidersPublic) => {
    if (!privateConfigs) return;
    
    setSavingId(providerKey);
    try {
      // Create single provider updates
      const updatedPublic: AuthProvidersPublic = {
        ...publicConfigs,
        [providerKey]: privateConfigs[providerKey].enabled
      };

      // Push both up
      await updateAuthProvidersAdmin(updatedPublic, privateConfigs);
      
      triggerNotification(
        "Success", 
        `${providerNameMap[providerKey]} configuration saved successfully.`, 
        "success"
      );
    } catch (err: any) {
      console.error(`Error saving auth provider ${providerKey}:`, err);
      triggerNotification("Error", `Failed to save ${providerNameMap[providerKey]} settings.`, "error");
    } finally {
      setSavingId(null);
    }
  };

  const providerNameMap: Record<keyof AuthProvidersPublic, string> = {
    email: "Email & Password",
    google: "Google Login",
    facebook: "Facebook Login",
    apple: "Apple Login",
    github: "GitHub Login",
    twitter: "X (Twitter) Login",
    microsoft: "Microsoft Login",
    phone: "Phone Number Login"
  };

  const providerIcons: Record<keyof AuthProvidersPublic, React.ReactNode> = {
    email: <Mail className="w-5 h-5 text-teal-400" />,
    google: <GoogleIcon />,
    facebook: <FacebookIcon />,
    apple: <AppleIcon />,
    github: <GithubIcon />,
    twitter: <TwitterIcon />,
    microsoft: <MicrosoftIcon />,
    phone: <Phone className="w-5 h-5 text-indigo-400" />
  };

  if (loading || !privateConfigs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
          Loading authentication providers...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="glass-card-gold rounded-3xl p-6 border border-gold-500/20 bg-[#0d0d14]/90 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-gold-500/10 border border-gold-500/30 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-gold-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white uppercase tracking-wider">Authentication Provider Manager</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enable, disable, and configure advanced OAuth / SSO integrations for client sign-in methods. 
              Sensitive fields such as Client Secrets are kept securely in private system variables, bypassing client exposure.
            </p>
          </div>
        </div>
      </div>

      {/* Main Accordion List */}
      <div className="space-y-4">
        {(Object.keys(providerNameMap) as Array<keyof AuthProvidersPublic>).map((key) => {
          const isExpanded = expandedId === key;
          const isEnabled = publicConfigs[key];
          const config = privateConfigs[key] || { enabled: false };
          const isSaving = savingId === key;

          return (
            <div 
              key={key} 
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded 
                  ? 'border-gold-500/30 bg-[#0a0a0f] shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
                  : 'border-white/5 bg-[#0e0e15] hover:border-white/10'
              }`}
            >
              {/* Accordion Header */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : key)}
                className="p-5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {providerIcons[key]}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white tracking-wider uppercase">
                      {providerNameMap[key]}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isEnabled ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {/* Quick Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isEnabled} 
                      onChange={() => handleToggleEnable(key)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-gold-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500/20 border border-white/5 peer-checked:border-gold-500/30"></div>
                  </label>

                  {/* Toggle Chevron */}
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-white/5 bg-[#07070a]/50 space-y-5 animate-fadeIn">
                  {/* Info / Description */}
                  <div className="text-xs text-neutral-400 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      {key === 'email' && "Configure credential system allowing users to register or login using their standard username/mobile and custom passwords."}
                      {key === 'google' && "Google OAuth allows seamless, rapid sign-ins. Provide your Client ID and Client Secret from Google Cloud Console."}
                      {key === 'facebook' && "Integrate Facebook Login. Provide the App ID and Secret Key from the Meta Developers Portal."}
                      {key === 'apple' && "Highly secure Sign In with Apple. Complete fields utilizing standard identifiers from the Apple Developer Account."}
                      {key === 'github' && "Standard GitHub OAuth application. Register a developer application on GitHub and provide the Client keys."}
                      {key === 'twitter' && "Enable Twitter/X SSO. Create developer portal credentials and supply them below."}
                      {key === 'microsoft' && "Microsoft Azure AD / Microsoft Account single sign-on system. Supply Tenant, Client ID, and Secret."}
                      {key === 'phone' && "Phone login utilizing direct mobile OTP verification via standard international carrier routing. Setup default country configurations."}
                    </div>
                  </div>

                  {/* Settings Fields */}
                  {key === 'email' && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-neutral-400 text-center uppercase tracking-widest font-black py-8">
                      No additional credentials required
                    </div>
                  )}

                  {key === 'phone' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Default Country Code Config
                        </label>
                        <input 
                          type="text" 
                          value={config.countryConfig || ''} 
                          onChange={(e) => handleFieldChange('phone', 'countryConfig', e.target.value)}
                          placeholder="e.g. +91" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {key === 'google' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          OAuth Client ID
                        </label>
                        <input 
                          type="text" 
                          value={config.clientId || ''} 
                          onChange={(e) => handleFieldChange('google', 'clientId', e.target.value)}
                          placeholder="Enter Google OAuth Client ID" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          OAuth Client Secret
                        </label>
                        <div className="relative">
                          <input 
                            type={showSecret['google'] ? 'text' : 'password'} 
                            value={config.clientSecret || ''} 
                            onChange={(e) => handleFieldChange('google', 'clientSecret', e.target.value)}
                            placeholder="Enter Google OAuth Client Secret" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('google')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                          >
                            {showSecret['google'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Authorized Redirect URI
                        </label>
                        <input 
                          type="text" 
                          value={config.redirectUri || ''} 
                          onChange={(e) => handleFieldChange('google', 'redirectUri', e.target.value)}
                          placeholder="Redirect URI" 
                          className="w-full bg-[#111116]/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-neutral-400 font-mono focus:outline-none cursor-not-allowed"
                          readOnly
                        />
                      </div>
                    </div>
                  )}

                  {key === 'facebook' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          App ID
                        </label>
                        <input 
                          type="text" 
                          value={config.appId || ''} 
                          onChange={(e) => handleFieldChange('facebook', 'appId', e.target.value)}
                          placeholder="Enter Facebook App ID" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          App Secret
                        </label>
                        <div className="relative">
                          <input 
                            type={showSecret['facebook'] ? 'text' : 'password'} 
                            value={config.appSecret || ''} 
                            onChange={(e) => handleFieldChange('facebook', 'appSecret', e.target.value)}
                            placeholder="Enter Facebook App Secret" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('facebook')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                          >
                            {showSecret['facebook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'github' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Client ID
                        </label>
                        <input 
                          type="text" 
                          value={config.clientId || ''} 
                          onChange={(e) => handleFieldChange('github', 'clientId', e.target.value)}
                          placeholder="Enter GitHub Client ID" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Client Secret
                        </label>
                        <div className="relative">
                          <input 
                            type={showSecret['github'] ? 'text' : 'password'} 
                            value={config.clientSecret || ''} 
                            onChange={(e) => handleFieldChange('github', 'clientSecret', e.target.value)}
                            placeholder="Enter GitHub Client Secret" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('github')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                          >
                            {showSecret['github'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'twitter' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          API Key / Client ID
                        </label>
                        <input 
                          type="text" 
                          value={config.clientId || ''} 
                          onChange={(e) => handleFieldChange('twitter', 'clientId', e.target.value)}
                          placeholder="Enter X / Twitter Client ID" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          API Secret Key / Client Secret
                        </label>
                        <div className="relative">
                          <input 
                            type={showSecret['twitter'] ? 'text' : 'password'} 
                            value={config.clientSecret || ''} 
                            onChange={(e) => handleFieldChange('twitter', 'clientSecret', e.target.value)}
                            placeholder="Enter X / Twitter Client Secret" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility('twitter')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                          >
                            {showSecret['twitter'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'microsoft' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                            Client ID
                          </label>
                          <input 
                            type="text" 
                            value={config.clientId || ''} 
                            onChange={(e) => handleFieldChange('microsoft', 'clientId', e.target.value)}
                            placeholder="Enter Azure Application Client ID" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                            Client Secret
                          </label>
                          <div className="relative">
                            <input 
                              type={showSecret['microsoft'] ? 'text' : 'password'} 
                              value={config.clientSecret || ''} 
                              onChange={(e) => handleFieldChange('microsoft', 'clientSecret', e.target.value)}
                              placeholder="Enter Azure Client Secret Key" 
                              className="w-full bg-[#111116] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => toggleSecretVisibility('microsoft')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-all"
                            >
                              {showSecret['microsoft'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                            Directory Tenant ID (e.g. common, organizations, or specific ID)
                          </label>
                          <input 
                            type="text" 
                            value={config.tenantId || ''} 
                            onChange={(e) => handleFieldChange('microsoft', 'tenantId', e.target.value)}
                            placeholder="common" 
                            className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {key === 'apple' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Service ID / Client ID
                        </label>
                        <input 
                          type="text" 
                          value={config.serviceId || ''} 
                          onChange={(e) => handleFieldChange('apple', 'serviceId', e.target.value)}
                          placeholder="e.g. com.example.app.signin" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Team ID
                        </label>
                        <input 
                          type="text" 
                          value={config.teamId || ''} 
                          onChange={(e) => handleFieldChange('apple', 'teamId', e.target.value)}
                          placeholder="e.g. ABC123XYZ4" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Key ID
                        </label>
                        <input 
                          type="text" 
                          value={config.keyId || ''} 
                          onChange={(e) => handleFieldChange('apple', 'keyId', e.target.value)}
                          placeholder="e.g. 10CHARKEYID" 
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          Private Key Content (.p8 file text content)
                        </label>
                        <textarea 
                          value={config.privateKey || ''} 
                          onChange={(e) => handleFieldChange('apple', 'privateKey', e.target.value)}
                          placeholder="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n-----END PRIVATE KEY-----" 
                          rows={4}
                          className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Save Provider Settings Button */}
                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => saveProviderSettings(key)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer text-center disabled:opacity-55"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

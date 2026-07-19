import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Paintbrush, Save, RotateCcw, Image as ImageIcon, Check, X, RefreshCw } from 'lucide-react';
import { ImageField } from './ImageField';
import { BrandingSettings } from '../types';
import { DEFAULT_BRANDING } from '../dataStore';
import { uploadFileWithFallback } from '../utils/uploadHelper';

import { compressImage } from '../utils/imageUtils';

export const AdminBrandingTab: React.FC = () => {
  const { brandingSettings, updateBrandingSettings, triggerNotification } = useGame();
  
  // Local state for edits
  const [localSettings, setLocalSettings] = useState<BrandingSettings>(brandingSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activeSection, setActiveSection] = useState<'info' | 'logos' | 'splash' | 'favicon' | 'header' | 'footer' | 'login' | 'register' | 'loading' | 'colors'>('info');

  useEffect(() => {
    setLocalSettings(brandingSettings);
  }, [brandingSettings]);

  const handleChange = (field: keyof BrandingSettings, value: any) => {
    setLocalSettings(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'loadingMainLogo') {
        updated.loadingLogo = value;
        updated.splashLogo = value;
      } else if (field === 'loadingLogo') {
        updated.loadingMainLogo = value;
        updated.splashLogo = value;
      } else if (field === 'splashLogo') {
        updated.loadingMainLogo = value;
        updated.loadingLogo = value;
      } else if (field === 'loadingCenterLogo' || field === 'splashFallbackLogo' || field === 'loadingCenterLogoUrl') {
        updated.loadingCenterLogo = value;
        updated.splashFallbackLogo = value;
        updated.loadingCenterLogoUrl = value;
      } else if (field === 'loadingBackgroundImage') {
        updated.loadingBgImage = value;
        updated.splashBgImage = value;
      } else if (field === 'loadingBgImage') {
        updated.loadingBackgroundImage = value;
        updated.splashBgImage = value;
      } else if (field === 'splashBgImage') {
        updated.loadingBackgroundImage = value;
        updated.loadingBgImage = value;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const processed = { ...localSettings };
      
      // Synchronize image properties
      if (processed.loadingMainLogo) {
        processed.splashLogo = processed.loadingMainLogo;
        processed.loadingLogo = processed.loadingMainLogo;
      } else if (processed.splashLogo) {
        processed.loadingMainLogo = processed.splashLogo;
        processed.loadingLogo = processed.splashLogo;
      }
      
      if (processed.loadingCenterLogo) {
        processed.splashFallbackLogo = processed.loadingCenterLogo;
        processed.loadingCenterLogoUrl = processed.loadingCenterLogo;
      } else if (processed.splashFallbackLogo) {
        processed.loadingCenterLogo = processed.splashFallbackLogo;
        processed.loadingCenterLogoUrl = processed.splashFallbackLogo;
      } else if (processed.loadingCenterLogoUrl) {
        processed.loadingCenterLogo = processed.loadingCenterLogoUrl;
        processed.splashFallbackLogo = processed.loadingCenterLogoUrl;
      }
      
      if (processed.loadingBackgroundImage) {
        processed.splashBgImage = processed.loadingBackgroundImage;
        processed.loadingBgImage = processed.loadingBackgroundImage;
      } else if (processed.splashBgImage) {
        processed.loadingBackgroundImage = processed.splashBgImage;
        processed.loadingBgImage = processed.splashBgImage;
      }
      
      // Synchronize text, layout, colors, and duration properties
      const defaultTitle = `${processed.splashMainTitle || 'TITAN'} ${processed.splashSecondaryTitle || 'ESP'}`.trim();
      processed.loadingTitle = processed.loadingTitle || defaultTitle || 'TITAN ESP';
      processed.loadingSubtitle = processed.loadingSubtitle || processed.splashSubtitle || 'PREPARE FOR BATTLE';
      processed.loadingLoadingText = processed.loadingLoadingText || processed.splashLoadingText || 'INITIALIZING SECURE CONNECTION...';
      processed.loadingText = processed.loadingLoadingText;
      processed.loadingProgressText = processed.loadingProgressText || '';
      processed.loadingProgressBarColor = processed.splashProgressBarColor || '#e5a919';
      processed.loadingBackgroundColor = processed.splashBgColor || '#07070a';
      processed.loadingDuration = Number(processed.splashLoadingDuration) || 2500;
      processed.loadingAnimation = processed.splashLogoAnimation || 'pulse';
      processed.updatedAt = Date.now();

      await updateBrandingSettings(processed);
      setLocalSettings(processed);
      
      if (activeSection === 'loading' || activeSection === 'splash') {
        triggerNotification("Success", "Loading Page Updated Successfully.", "success" as any);
      } else {
        triggerNotification("Branding Updated", "Your website branding settings have been saved successfully.", "success" as any);
      }
    } catch (e: any) {
      triggerNotification("Error", e.message, "alert");
    }
    setIsSaving(false);
  };

  const handleRestoreDefault = async () => {
    if (window.confirm("Are you sure you want to restore default branding settings? This action cannot be undone.")) {
      setIsSaving(true);
      try {
        await updateBrandingSettings(DEFAULT_BRANDING);
        triggerNotification("Restored", "Default branding settings restored.", "info");
      } catch (e: any) {
        triggerNotification("Error", e.message, "alert");
      }
      setIsSaving(false);
    }
  };

  // Generic Image Upload Handler
  const handleImageUpload = async (file: File | null, field: keyof BrandingSettings) => {
    if (file) {
      setIsSaving(true);
      setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      try {
        // Compress first
        const compressedDataUrl = await compressImage(file, 0.1, 512);
        
        // Convert DataURL to Blob/File
        const response = await fetch(compressedDataUrl);
        const blob = await response.blob();
        const uploadFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
        
        // Upload to storage with fallback
        const uploadResult = await uploadFileWithFallback(
          uploadFile,
          `branding/${field}/${Date.now()}_${file.name}`,
          (progress) => setUploadProgress(prev => ({ ...prev, [field]: progress }))
        );
        
        const downloadURL = uploadResult.url;
        const cacheBustedUrl = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}v=${Date.now()}`;
        const newSettings = { ...localSettings, [field]: cacheBustedUrl };
        
        if (field === 'loadingMainLogo') {
          newSettings.loadingLogo = cacheBustedUrl;
          newSettings.splashLogo = cacheBustedUrl;
        } else if (field === 'loadingLogo') {
          newSettings.loadingMainLogo = cacheBustedUrl;
          newSettings.splashLogo = cacheBustedUrl;
        } else if (field === 'splashLogo') {
          newSettings.loadingMainLogo = cacheBustedUrl;
          newSettings.loadingLogo = cacheBustedUrl;
        } else if (field === 'loadingCenterLogo') {
          newSettings.splashFallbackLogo = cacheBustedUrl;
        } else if (field === 'splashFallbackLogo') {
          newSettings.loadingCenterLogo = cacheBustedUrl;
        } else if (field === 'loadingBackgroundImage') {
          newSettings.loadingBgImage = cacheBustedUrl;
          newSettings.splashBgImage = cacheBustedUrl;
        } else if (field === 'loadingBgImage') {
          newSettings.loadingBackgroundImage = cacheBustedUrl;
          newSettings.splashBgImage = cacheBustedUrl;
        } else if (field === 'splashBgImage') {
          newSettings.loadingBackgroundImage = cacheBustedUrl;
          newSettings.loadingBgImage = cacheBustedUrl;
        }

        try {
          await updateBrandingSettings(newSettings);
          handleChange(field, cacheBustedUrl);
          triggerNotification("Success", "Branding image updated successfully.", "success");
        } catch (e: any) {
          triggerNotification("Error", "Failed to save image configuration to database.", "alert");
        }
        setIsSaving(false);
        setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      } catch (error) {
        console.error("Error processing/uploading image");
        triggerNotification("Error", "Failed to process image.", "alert");
        setIsSaving(false);
        setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, field: keyof BrandingSettings) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleImageUpload(file || null, field);
  };

  const renderInput = (label: string, field: keyof BrandingSettings, type: string = 'text') => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={localSettings[field] as any}
        onChange={(e) => handleChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
      />
    </div>
  );

  const renderImageUpload = (label: string, field: keyof BrandingSettings) => (
    <ImageField
      label={label}
      value={localSettings[field] as string}
      onChange={(value) => handleChange(field, value)}
      onUpload={(file) => handleImageUpload(file, field)}
      onSave={async (value) => {
          const newSettings = { ...localSettings, [field]: value };
          await updateBrandingSettings(newSettings);
          triggerNotification("Image Saved", "Image URL updated successfully.", "success" as any);
      }}
      progress={uploadProgress[field]}
      isSaving={isSaving}
    />
  );

  const renderColorInput = (label: string, field: keyof BrandingSettings) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={localSettings[field] as string}
          onChange={(e) => handleChange(field, e.target.value)}
          className="h-10 w-12 rounded bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={localSettings[field] as string}
          onChange={(e) => handleChange(field, e.target.value)}
          className="flex-1 bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-gold-500" />
            Website Branding & Appearance
          </h2>
          <p className="text-xs text-neutral-400 font-sans">Full control over website assets, colors, strings and theme without modifying code.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreDefault}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold uppercase rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black text-xs font-black uppercase rounded-lg shadow-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar for Branding */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
          {[
            { id: 'info', label: 'Website Info' },
            { id: 'logos', label: 'Logos' },
            { id: 'splash', label: 'Splash Screen' },
            { id: 'favicon', label: 'Favicon & App Icons' },
            { id: 'header', label: 'Header Settings' },
            { id: 'footer', label: 'Footer Settings' },
            { id: 'loading', label: 'Loading Screen' },
            { id: 'colors', label: 'Color & Theme' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
                activeSection === tab.id 
                  ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                  : 'bg-[#101017] border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#101017] border border-white/5 rounded-2xl p-6">
          {activeSection === 'info' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Website Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput('Website Name', 'websiteName')}
                {renderInput('Website Short Name', 'websiteShortName')}
                {renderInput('Website Title (SEO)', 'websiteTitle')}
                {renderInput('Browser Tab Title', 'browserTabTitle')}
                {renderInput('Website Tagline', 'websiteTagline')}
                {renderInput('Website Version', 'websiteVersion')}
                {renderInput('Organization Name', 'organizationName')}
                {renderInput('Contact Email', 'contactEmail')}
                {renderInput('Support Email', 'supportEmail')}
              </div>
            </div>
          )}

          {activeSection === 'logos' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Website Logos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderImageUpload('Main Website Logo', 'mainLogo')}
                {renderImageUpload('Header Logo', 'headerLogo')}
                {renderImageUpload('Sidebar Logo', 'sidebarLogo')}
                {renderImageUpload('Mobile Logo', 'mobileLogo')}
                {renderImageUpload('Footer Logo', 'footerLogo')}
                {renderImageUpload('Dashboard Logo', 'dashboardLogo')}
              </div>
            </div>
          )}

          {activeSection === 'splash' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Splash Screen Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImageUpload('Splash Logo', 'splashLogo')}
                {renderImageUpload('Splash Background Image', 'splashBgImage')}
                {renderColorInput('Splash Background Color', 'splashBgColor')}
                {renderInput('Splash Title', 'splashTitle')}
                {renderInput('Splash Subtitle', 'splashSubtitle')}
                {renderInput('Loading Text', 'splashLoadingText')}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Loading Animation</label>
                  <select 
                    value={localSettings.splashLoadingAnimation}
                    onChange={(e) => handleChange('splashLoadingAnimation', e.target.value)}
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  >
                    {['Fade', 'Zoom', 'Glow', 'Pulse', 'Slide', 'Rotate'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {renderColorInput('Progress Bar Color', 'splashProgressBarColor')}
                {renderInput('Auto Redirect Time (ms)', 'splashAutoRedirectTime', 'number')}
              </div>
            </div>
          )}

          {activeSection === 'favicon' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Favicon & App Icons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderImageUpload('Browser Favicon (.ico/.png)', 'browserFavicon')}
                {renderImageUpload('PWA App Icon (512x512)', 'pwaAppIcon')}
                {renderImageUpload('Android Icon (192x192)', 'androidIcon')}
                {renderImageUpload('iPhone Icon (180x180)', 'iphoneIcon')}
              </div>
            </div>
          )}

          {activeSection === 'header' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Header Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput('Header Title', 'headerTitle')}
                {renderInput('Header Subtitle', 'headerSubtitle')}
                {renderColorInput('Header Background Color', 'headerBgColor')}
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="headerSticky" checked={localSettings.headerSticky} onChange={(e) => handleChange('headerSticky', e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="headerSticky" className="text-sm text-neutral-300">Enable Sticky Header</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="headerShowNotifIcon" checked={localSettings.headerShowNotifIcon} onChange={(e) => handleChange('headerShowNotifIcon', e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="headerShowNotifIcon" className="text-sm text-neutral-300">Show Notification Icon</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="headerShowWalletIcon" checked={localSettings.headerShowWalletIcon} onChange={(e) => handleChange('headerShowWalletIcon', e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="headerShowWalletIcon" className="text-sm text-neutral-300">Show Wallet Icon</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="headerShowProfileIcon" checked={localSettings.headerShowProfileIcon} onChange={(e) => handleChange('headerShowProfileIcon', e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="headerShowProfileIcon" className="text-sm text-neutral-300">Show Profile Icon</label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'footer' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Footer Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderInput('Footer Copyright Text', 'footerCopyrightText')}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Footer Description</label>
                  <textarea
                    value={localSettings.footerDescription}
                    onChange={(e) => handleChange('footerDescription', e.target.value)}
                    rows={3}
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInput('Facebook Link', 'footerSocialFacebook')}
                  {renderInput('Instagram Link', 'footerSocialInstagram')}
                  {renderInput('Telegram Link', 'footerSocialTelegram')}
                  {renderInput('Discord Link', 'footerSocialDiscord')}
                  {renderInput('WhatsApp Link', 'footerSocialWhatsapp')}
                  {renderInput('YouTube Link', 'footerSocialYoutube')}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'login' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Login Page Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImageUpload('Login Logo', 'loginLogo')}
                {renderImageUpload('Login Background Image', 'loginBgImage')}
                {renderInput('Login Welcome Text', 'loginWelcomeText')}
                {renderInput('Login Subtitle', 'loginSubtitle')}
                {renderInput('Login Button Text', 'loginButtonText')}
              </div>
            </div>
          )}

          {activeSection === 'register' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Register Page Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImageUpload('Register Logo', 'registerLogo')}
                {renderImageUpload('Register Background Image', 'registerBgImage')}
                {renderInput('Register Welcome Text', 'registerWelcomeText')}
                {renderInput('Register Description', 'registerDescription')}
              </div>
            </div>
          )}

          {activeSection === 'loading' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Loading Screen Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImageUpload('Loading Screen Main Logo', 'loadingMainLogo')}
                {renderImageUpload('Loading Screen Center Logo', 'loadingCenterLogo')}
                {renderImageUpload('Loading Screen Background Image', 'loadingBackgroundImage')}
                {renderInput('Loading Text', 'loadingText')}
                {renderInput('Loading Subtitle', 'loadingSubtitle')}
                {renderColorInput('Progress Bar Color', 'loadingProgressBarColor')}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Progress Bar Position</label>
                  <select 
                    value={localSettings.loadingProgressBarPosition}
                    onChange={(e) => handleChange('loadingProgressBarPosition', e.target.value)}
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  >
                    {['top', 'bottom', 'center'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'colors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white uppercase border-b border-white/10 pb-2">Color & Theme Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderColorInput('Primary Color', 'primaryColor')}
                {renderColorInput('Secondary Color', 'secondaryColor')}
                {renderColorInput('Accent Color', 'accentColor')}
                {renderColorInput('Background Color', 'bgColor')}
                {renderColorInput('Card Color', 'cardColor')}
                {renderColorInput('Text Color', 'textColor')}
                {renderColorInput('Button Color', 'buttonColor')}
                {renderColorInput('Border Color', 'borderColor')}
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Theme Mode</label>
                  <select 
                    value={localSettings.themeMode}
                    onChange={(e) => handleChange('themeMode', e.target.value)}
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="auto">Auto (System Default)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gold-600 hover:bg-gold-500 text-black text-sm font-black uppercase rounded-lg shadow-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

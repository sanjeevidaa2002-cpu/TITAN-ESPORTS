/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Upload, Check, Loader2, Save, RotateCcw, X } from 'lucide-react';
import { uploadFileWithFallback } from '../utils/uploadHelper';
import { LoadingScreenSettings } from '../types';
import { TitanEsportsLogo } from './TitanEsportsLogo';

export const LoadingPageManager: React.FC = () => {
  const { loadingScreenSettings, updateLoadingScreenSettings } = useGame();
  
  const [localSettings, setLocalSettings] = useState<LoadingScreenSettings>(loadingScreenSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // File Upload State Tracking
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (loadingScreenSettings) {
      setLocalSettings(loadingScreenSettings);
    }
  }, [loadingScreenSettings]);

  const handleFieldChange = (field: keyof LoadingScreenSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(null);
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // empty falls back to default
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

    // Check size limit: 10 MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return 'File Too Large (Maximum size allowed is 10MB)';
    }

    const fileType = file.type?.toLowerCase();
    const fileName = file.name?.toLowerCase();
    const hasValidType = allowedTypes.includes(fileType);
    const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidType && !hasValidExt) {
      return 'Invalid File Type (Supported formats: JPG, JPEG, PNG, WEBP, SVG)';
    }

    return null;
  };

  const processAndUploadFile = async (file: File) => {
    setUploadStatus('idle');
    setUploadError(null);
    setUploadProgress(0);

    const validationErr = validateFile(file);
    if (validationErr) {
      setUploadStatus('error');
      setUploadError(validationErr);
      return;
    }

    setUploadStatus('uploading');
    try {
      const uploadResult = await uploadFileWithFallback(
        file,
        `loading_screens/${Date.now()}_${file.name}`,
        (progress) => setUploadProgress(progress)
      );

      const downloadURL = uploadResult.url;
      const timestamp = Date.now();

      // Create updated settings
      const updatedSettings: LoadingScreenSettings = {
        ...localSettings,
        loadingLogoUrl: downloadURL,
        uploadedLogoUrl: downloadURL,
        loadingLogoType: 'upload',
        loadingLogoSource: 'upload',
        updatedAt: timestamp,
      };

      // Update local state first for real-time responsiveness
      setLocalSettings(updatedSettings);
      setImgError(false);
      setUploadStatus('success');
      setSaveSuccess("Logo Uploaded! Click 'Save' to apply changes.");
      setTimeout(() => {
        setSaveSuccess(null);
        setUploadStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error("Upload error:");
      setUploadStatus('error');
      setUploadError(`Upload Error: ${err.message || err}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleUrlChange = (val: string) => {
    const timestamp = Date.now();
    setLocalSettings(prev => ({
      ...prev,
      loadingLogoUrl: val,
      directLogoUrl: val,
      loadingLogoType: val ? 'url' : 'default',
      updatedAt: timestamp,
    }));
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleResetToDefaults = () => {
    const defaultSettings: LoadingScreenSettings = {
      loadingLogoUrl: '',
      loadingTitle: 'TITAN ESPORTS',
      loadingSubtitle: 'PREMIUM GAMING',
      loadingText: 'INITIALIZING SYSTEM',
      backgroundColor: '#08080c',
      backgroundImage: '',
      progressBarEnabled: true,
      animationEnabled: true,
      uploadedLogoUrl: '',
      directLogoUrl: '',
      loadingLogoType: 'default',
      loadingLogoSource: 'url',
      updatedAt: Date.now(),
    };
    setLocalSettings(defaultSettings);
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const timestamp = Date.now();
      const settingsToSave = {
        ...localSettings,
        updatedAt: timestamp,
      };
      
      await updateLoadingScreenSettings(settingsToSave);
      setSaveSuccess("Loading Screen Config Saved Successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error saving loading settings:");
      alert("Failed to save settings: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewLogoUrl = () => {
    if (imgError) return '';
    const baseUrl = localSettings.loadingLogoUrl;
    if (baseUrl) {
      if (baseUrl.startsWith('data:')) return baseUrl;
      const version = localSettings.updatedAt || Date.now();
      const cleanUrl = baseUrl.split('?v=')[0].split('&v=')[0];
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}v=${version}`;
    }
    return '';
  };

  const currentImageUrl = getPreviewLogoUrl();

  return (
    <div className="bg-[#0d0d15] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-[#111116] border-b border-white/5 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            ☁️ Loading Screen Manager
          </h2>
          <p className="text-[10px] text-neutral-400 mt-1">
            Customize the logo, title, subtitle, and text for the initial loading screen.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(229,169,25,0.3)] hover:shadow-[0_0_30px_rgba(229,169,25,0.5)] disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save & Update'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Settings Panel */}
        <div className="w-full lg:w-1/2 space-y-6">
          
          {/* Logo Section */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Upload Logo</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Drag & drop or upload a custom Mascot Logo.</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-gold-500 bg-gold-500/5' 
                  : 'border-white/10 hover:border-white/20 bg-[#111116]/50'
              }`}
              onClick={() => document.getElementById('logo-upload-input')?.click()}
            >
              <input
                id="logo-upload-input"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleImageUpload}
              />
              <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-300 font-medium">Click to upload or drag & drop</p>
              <p className="text-[10px] text-neutral-500 mt-1">PNG, JPG, WEBP, or SVG up to 10MB</p>
            </div>

            {uploadStatus === 'uploading' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#111116] rounded-full h-1">
                  <div className="bg-gold-500 h-1 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadStatus === 'error' && uploadError && (
              <div className="text-[10px] text-red-400 font-semibold bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg">
                {uploadError}
              </div>
            )}

            {localSettings.uploadedLogoUrl && (
              <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono break-all bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Uploaded URL: {localSettings.uploadedLogoUrl}</span>
              </div>
            )}
          </div>

          {/* Logo URL Section */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Loading Logo Image URL</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Paste Firebase Storage Image URL or any direct image link.</p>
            </div>
            <input
              type="text"
              value={localSettings.loadingLogoUrl || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://firebasestorage.googleapis.com/..."
              className={`w-full bg-[#111116] border rounded-lg px-3 py-2 text-xs text-white focus:border-gold-500 outline-none font-mono ${
                localSettings.loadingLogoUrl 
                  ? isValidUrl(localSettings.loadingLogoUrl)
                    ? 'border-emerald-500/50'
                    : 'border-red-500/50'
                  : 'border-white/10'
              }`}
            />
            {localSettings.loadingLogoUrl && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                {isValidUrl(localSettings.loadingLogoUrl) ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid Image URL
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Invalid URL Format
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Text Settings */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">Text Customizations</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Title</label>
                <input
                  type="text"
                  value={localSettings.loadingTitle}
                  onChange={(e) => handleFieldChange('loadingTitle', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Subtitle</label>
                <input
                  type="text"
                  value={localSettings.loadingSubtitle}
                  onChange={(e) => handleFieldChange('loadingSubtitle', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Text</label>
                <input
                  type="text"
                  value={localSettings.loadingText}
                  onChange={(e) => handleFieldChange('loadingText', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex justify-start">
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10 hover:border-white/25 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>
          </div>

        </div>

        {/* Live Preview Panel */}
        <div className="w-full lg:w-1/2 bg-[#08080c] border border-white/10 rounded-2xl overflow-hidden relative min-h-[450px] flex items-center justify-center">
          
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest z-10">
            Live Preview (Original Design)
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-sm text-center">
            
            {/* Original Centered Logo Container */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              {currentImageUrl && !imgError ? (
                <img 
                  src={currentImageUrl} 
                  alt="Loading Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <TitanEsportsLogo className="w-full h-full object-contain" />
              )}
            </div>

            {/* Texts */}
            <h1 className="text-3xl font-extrabold tracking-widest text-[#e5a919] uppercase font-sans mb-2">
              {localSettings.loadingTitle}
            </h1>
            
            {localSettings.loadingSubtitle && (
              <p className="text-xs tracking-[0.3em] font-semibold uppercase text-neutral-400">
                {localSettings.loadingSubtitle}
              </p>
            )}

            {/* Progress */}
            <div className="w-full mt-8">
              <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-4 overflow-hidden">
                <div className="h-full rounded-full bg-[#e5a919] w-[45%]" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e5a919] animate-pulse" />
                  <span>{localSettings.loadingText}</span>
                </div>
                <span className="font-bold text-[#e5a919]">45%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {saveSuccess && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md z-50 animate-fade-in">
          <Check className="w-4 h-4" />
          {saveSuccess}
        </div>
      )}
    </div>
  );
};

export default LoadingPageManager;

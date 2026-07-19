import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Save, RotateCcw, Upload, X, Loader2, Info, MessageCircle, Send } from 'lucide-react';
import { ContactWidgetSettings } from '../types';
import { DEFAULT_CONTACT_WIDGET_SETTINGS } from '../dataStore';
import { uploadFileWithFallback } from '../utils/uploadHelper';

const OfficialWhatsAppLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-white fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.451 5.416 1.453 5.485.002 9.948-4.461 9.95-9.95.002-2.66-1.033-5.161-2.908-7.04C17.228 1.776 14.73 .74 12.004.74 6.516.74 2.053 5.202 2.051 10.69c-.001 1.918.5 3.784 1.451 5.39l-.995 3.633 3.722-.975zm11.367-7.426c-.302-.15-1.785-.882-2.056-.98-.271-.1-.469-.15-.665.15-.196.3-.758.98-.93 1.18-.171.2-.343.224-.645.075-.302-.15-1.274-.469-2.427-1.496-.897-.8-1.502-1.788-1.678-2.088-.177-.3-.019-.462.132-.612.136-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.238-.57-.499-.491-.665-.5-.157-.007-.338-.008-.52-.008-.182 0-.478.068-.728.34-.25.271-.954.933-.954 2.274 0 1.341.975 2.637 1.111 2.82.136.183 1.918 2.929 4.646 4.108.649.28 1.156.447 1.55.572.652.207 1.246.177 1.715.107.523-.078 1.597-.653 1.821-1.282.224-.63.224-1.17.157-1.282-.068-.112-.25-.196-.552-.346z"/>
  </svg>
);

const OfficialTelegramLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-white fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.53.26l.204-3.04 5.53-5.001c.24-.213-.054-.33-.373-.117L6.883 12.78l-2.94-.92c-.64-.201-.65-.64.135-.946l11.47-4.42c.53-.19.99.13.846.807z"/>
  </svg>
);

export const AdminSupportSettingsTab: React.FC = () => {
  const { contactWidgetSettings, updateContactWidgetSettings, triggerNotification } = useGame();
  
  const [localSettings, setLocalSettings] = useState<ContactWidgetSettings>(contactWidgetSettings || DEFAULT_CONTACT_WIDGET_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // File Upload State Tracking
  const [waUploadStatus, setWaUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [waProgress, setWaProgress] = useState(0);
  const [waError, setWaError] = useState<string | null>(null);

  const [tgUploadStatus, setTgUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [tgProgress, setTgProgress] = useState(0);
  const [tgError, setTgError] = useState<string | null>(null);

  const waInputRef = useRef<HTMLInputElement>(null);
  const tgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contactWidgetSettings) {
      setLocalSettings(contactWidgetSettings);
    }
  }, [contactWidgetSettings]);

  const handleChange = (field: keyof ContactWidgetSettings, value: any) => {
    setLocalSettings(prev => {
      const updated = { ...prev, [field]: value };
      
      // Implement Priority Display Rule:
      // If uploaded exists: Use uploaded.
      // Otherwise: Use Image URL.
      // If neither exists: Use official default.
      if (field === 'whatsappUploadedUrl' || field === 'whatsappDirectUrl') {
        updated.whatsappIconUrl = updated.whatsappUploadedUrl || updated.whatsappDirectUrl || '';
      }
      if (field === 'telegramUploadedUrl' || field === 'telegramDirectUrl') {
        updated.telegramIconUrl = updated.telegramUploadedUrl || updated.telegramDirectUrl || '';
      }
      
      return updated;
    });
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const hasValidType = allowedTypes.includes(fileType);
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      return "Invalid format. Supported formats: PNG, SVG, WEBP, JPG.";
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File is too large. Max size allowed is 5MB.";
    }
    
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'whatsapp' | 'telegram') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const errorMsg = validateFile(file);
    if (errorMsg) {
      if (type === 'whatsapp') {
        setWaError(errorMsg);
        setWaUploadStatus('error');
      } else {
        setTgError(errorMsg);
        setTgUploadStatus('error');
      }
      return;
    }

    if (type === 'whatsapp') {
      setWaUploadStatus('uploading');
      setWaError(null);
    } else {
      setTgUploadStatus('uploading');
      setTgError(null);
    }

    try {
      const path = `contact_widgets/${type}_${Date.now()}_${file.name}`;
      const uploadResult = await uploadFileWithFallback(file, path, (progress) => {
        if (type === 'whatsapp') setWaProgress(progress);
        else setTgProgress(progress);
      });

      const downloadURL = uploadResult.url;
      
      setLocalSettings(prev => {
        const updated = {
          ...prev,
          [`${type}UploadedUrl`]: downloadURL,
          [`${type}IconUrl`]: downloadURL // Priority display rule: uploaded takes immediate precedence
        };
        return updated;
      });

      if (type === 'whatsapp') {
        setWaUploadStatus('success');
      } else {
        setTgUploadStatus('success');
      }
      triggerNotification("Success", `${type === 'whatsapp' ? 'WhatsApp' : 'Telegram'} icon uploaded successfully.`, "success");
    } catch (err: any) {
      console.error("An error occurred");
      if (type === 'whatsapp') {
        setWaError(err.message || "Upload failed");
        setWaUploadStatus('error');
      } else {
        setTgError(err.message || "Upload failed");
        setTgUploadStatus('error');
      }
      triggerNotification("Error", "Failed to upload icon.", "error");
    } finally {
      e.target.value = '';
    }
  };

  const clearUploadedIcon = (type: 'whatsapp' | 'telegram') => {
    setLocalSettings(prev => {
      const updated = {
        ...prev,
        [`${type}UploadedUrl`]: ''
      };
      // Re-evaluate display rule:
      updated[`${type}IconUrl`] = updated[`${type}DirectUrl`] || '';
      return updated;
    });
    if (type === 'whatsapp') setWaUploadStatus('idle');
    else setTgUploadStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const processed = {
        ...localSettings,
        updatedAt: Date.now()
      };
      await updateContactWidgetSettings(processed);
      triggerNotification("Success", "Contact widget settings updated successfully.", "success");
    } catch (err) {
      console.error("An error occurred");
      triggerNotification("Error", "Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to default contact widget settings?")) {
      setLocalSettings(DEFAULT_CONTACT_WIDGET_SETTINGS);
      setWaUploadStatus('idle');
      setTgUploadStatus('idle');
    }
  };

  // Preview formatting
  const isLeft = localSettings.iconPosition === 'bottom-left';
  const sizeMap = {
    small: { btn: '40px', icon: 'w-4 h-4', logoCircle: 'w-8 h-8' },
    medium: { btn: '48px', icon: 'w-5 h-5', logoCircle: 'w-9 h-9' },
    large: { btn: '56px', icon: 'w-6 h-6', logoCircle: 'w-10 h-10' }
  };
  const currentSize = sizeMap[localSettings.iconSize || 'medium'] || sizeMap.medium;

  const getCacheBustedPreviewUrl = (url: string) => {
    if (!url) return '';
    return url.includes('?') ? `${url}&v=${localSettings.updatedAt || Date.now()}` : `${url}?v=${localSettings.updatedAt || Date.now()}`;
  };

  const activeWhatsappIcon = localSettings.whatsappUploadedUrl || localSettings.whatsappDirectUrl || '';
  const activeTelegramIcon = localSettings.telegramUploadedUrl || localSettings.telegramDirectUrl || '';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Contact Widget Settings</h2>
          <p className="text-xs text-neutral-400 mt-1">Configure your floating support contact widget with custom options and real-time synchronization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Widget Options */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">Widget Display Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Enable Widget</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.widgetEnabled}
                    onChange={(e) => handleChange('widgetEnabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Icon Size</label>
                <select 
                  value={localSettings.iconSize || 'medium'}
                  onChange={(e) => handleChange('iconSize', e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:border-gold-500 focus:outline-none transition-all"
                >
                  <option value="small">Small (48px)</option>
                  <option value="medium">Medium (56px)</option>
                  <option value="large">Large (64px)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Icon Position</label>
                <select 
                  value={localSettings.iconPosition || 'bottom-right'}
                  onChange={(e) => handleChange('iconPosition', e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:border-gold-500 focus:outline-none transition-all"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="bg-[#111116] border border-[#25D366]/20 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(37,211,102,0.02)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#25D366]"></div>
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] text-xs">WA</span>
                WhatsApp Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">WhatsApp Direct Link</label>
                  <input 
                    type="text" 
                    value={localSettings.whatsappLink} 
                    onChange={(e) => handleChange('whatsappLink', e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366] transition-all"
                    placeholder="https://wa.me/yournumber"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  {/* Upload option */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Option 1: Upload Custom Icon</label>
                    
                    {localSettings.whatsappUploadedUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-xl border border-[#25D366]/30">
                        <img 
                          src={getCacheBustedPreviewUrl(localSettings.whatsappUploadedUrl)} 
                          alt="WA Custom Icon" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-neutral-950" 
                        />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs text-white truncate">custom_whatsapp.png</p>
                          <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Active Icon</p>
                        </div>
                        <button 
                          onClick={() => clearUploadedIcon('whatsapp')}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          ref={waInputRef}
                          onChange={(e) => handleFileUpload(e, 'whatsapp')}
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          className="hidden"
                        />
                        <button 
                          onClick={() => waInputRef.current?.click()}
                          disabled={waUploadStatus === 'uploading'}
                          className="w-full h-12 rounded-xl border border-dashed border-white/15 hover:border-[#25D366]/50 bg-neutral-900/30 hover:bg-neutral-900 flex items-center justify-center gap-2 text-neutral-300 hover:text-white transition-all text-xs font-bold"
                        >
                          {waUploadStatus === 'uploading' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                              Uploading ({Math.round(waProgress)}%)
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Icon (PNG, SVG, JPG, WEBP)
                            </>
                          )}
                        </button>
                        {waError && <p className="text-[10px] text-red-400 mt-1">{waError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Direct URL option */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Option 2: Direct Image URL</label>
                    <input 
                      type="text" 
                      value={localSettings.whatsappDirectUrl || ''} 
                      onChange={(e) => handleChange('whatsappDirectUrl', e.target.value)}
                      disabled={!!localSettings.whatsappUploadedUrl}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-[#25D366] focus:outline-none transition-all disabled:opacity-40"
                      placeholder="https://example.com/whatsapp.png"
                    />
                    {localSettings.whatsappUploadedUrl && (
                      <p className="text-[9px] text-neutral-500 mt-1">Uploaded icon is currently active and overrides this URL.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram Settings */}
          <div className="bg-[#111116] border border-[#0088cc]/20 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(0,136,204,0.02)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#0088cc]"></div>
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc] text-xs">TG</span>
                Telegram Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Telegram Username or Invite Link</label>
                  <input 
                    type="text" 
                    value={localSettings.telegramLink} 
                    onChange={(e) => handleChange('telegramLink', e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#0088cc] focus:outline-none focus:ring-1 focus:ring-[#0088cc] transition-all"
                    placeholder="https://t.me/yourusername"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  {/* Upload option */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Option 1: Upload Custom Icon</label>
                    
                    {localSettings.telegramUploadedUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-xl border border-[#0088cc]/30">
                        <img 
                          src={getCacheBustedPreviewUrl(localSettings.telegramUploadedUrl)} 
                          alt="TG Custom Icon" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-neutral-950" 
                        />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs text-white truncate">custom_telegram.png</p>
                          <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Active Icon</p>
                        </div>
                        <button 
                          onClick={() => clearUploadedIcon('telegram')}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          ref={tgInputRef}
                          onChange={(e) => handleFileUpload(e, 'telegram')}
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          className="hidden"
                        />
                        <button 
                          onClick={() => tgInputRef.current?.click()}
                          disabled={tgUploadStatus === 'uploading'}
                          className="w-full h-12 rounded-xl border border-dashed border-white/15 hover:border-[#0088cc]/50 bg-neutral-900/30 hover:bg-neutral-900 flex items-center justify-center gap-2 text-neutral-300 hover:text-white transition-all text-xs font-bold"
                        >
                          {tgUploadStatus === 'uploading' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                              Uploading ({Math.round(tgProgress)}%)
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Icon (PNG, SVG, JPG, WEBP)
                            </>
                          )}
                        </button>
                        {tgError && <p className="text-[10px] text-red-400 mt-1">{tgError}</p>}
                      </div>
                    )}
                  </div>

                  {/* Direct URL option */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Option 2: Direct Image URL</label>
                    <input 
                      type="text" 
                      value={localSettings.telegramDirectUrl || ''} 
                      onChange={(e) => handleChange('telegramDirectUrl', e.target.value)}
                      disabled={!!localSettings.telegramUploadedUrl}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:border-[#0088cc] focus:outline-none transition-all disabled:opacity-40"
                      placeholder="https://example.com/telegram.png"
                    />
                    {localSettings.telegramUploadedUrl && (
                      <p className="text-[9px] text-neutral-500 mt-1">Uploaded icon is currently active and overrides this URL.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-300 leading-normal">
              <strong>Display Rules Summary:</strong> Uploaded custom icons always take absolute precedence. If no file is uploaded, the widget falls back to the pasted Direct URL. If that is also empty, the widget reverts gracefully to the official default vectors.
            </p>
          </div>

        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-6 sticky top-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">Live Mobile Preview</h3>
            
            <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
              This panel simulates how the float widget appears on the active client dashboard screen in real-time. Change your options on the left to watch it shift!
            </p>

            <div className="relative mt-5 aspect-[9/16] w-full max-w-[260px] mx-auto bg-[#0a0a0e] rounded-3xl border-4 border-neutral-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
              {/* Header Status Bar mock */}
              <div className="flex items-center justify-between text-[8px] text-neutral-500 border-b border-white/5 pb-1 select-none">
                <span>TITAN ESP CLIENT</span>
                <span>02:40 PM</span>
              </div>

              {/* Game Lobby content mockup */}
              <div className="flex-1 flex flex-col justify-center items-center text-center px-2 py-6 select-none opacity-25">
                <div className="w-10 h-10 rounded-lg bg-gold-500/20 border border-gold-500/40 mb-2"></div>
                <h4 className="text-[10px] text-white font-black uppercase">Battleground Lobby</h4>
                <p className="text-[8px] text-neutral-400 mt-1">Click support to begin instant chat</p>
              </div>

              {/* FLOATING SUPPORT WIDGET SIMULATION */}
              {localSettings.widgetEnabled && (
                <div className={`absolute z-10 ${isLeft ? 'left-3' : 'right-3'} bottom-12 flex flex-col items-end`}>
                  {/* Floating Panel simulation (Always open in preview for clarity!) */}
                  <div className={`mb-2 w-[180px] bg-[#0d0d14] border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col`}>
                    <div className="bg-gradient-to-r from-gold-600/10 to-purple-600/10 p-2 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-[9px] text-white font-bold uppercase tracking-wider">Support</h4>
                        <p className="text-[7px] text-neutral-400">Choose a platform</p>
                      </div>
                    </div>
                    <div className="p-2 space-y-1.5 text-[8px]">
                      {localSettings.whatsappLink && (
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gradient-to-r from-[#25D366]/10 to-transparent border border-[#25D366]/20">
                          <div className={`${currentSize.logoCircle} rounded-full bg-[#25D366] flex items-center justify-center overflow-hidden`}>
                            {activeWhatsappIcon ? (
                              <img src={getCacheBustedPreviewUrl(activeWhatsappIcon)} alt="WA Preview" className="w-full h-full object-cover" />
                            ) : (
                              <OfficialWhatsAppLogo className="w-3.5 h-3.5 text-white fill-current" />
                            )}
                          </div>
                          <div>
                            <span className="text-white font-bold block">WhatsApp</span>
                            <span className="text-[7px] text-[#25D366]">Fastest Response</span>
                          </div>
                        </div>
                      )}

                      {localSettings.telegramLink && (
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gradient-to-r from-[#0088cc]/10 to-transparent border border-[#0088cc]/20">
                          <div className={`${currentSize.logoCircle} rounded-full bg-[#0088cc] flex items-center justify-center overflow-hidden`}>
                            {activeTelegramIcon ? (
                              <img src={getCacheBustedPreviewUrl(activeTelegramIcon)} alt="TG Preview" className="w-full h-full object-cover" />
                            ) : (
                              <OfficialTelegramLogo className="w-3.5 h-3.5 text-white fill-current" />
                            )}
                          </div>
                          <div>
                            <span className="text-white font-bold block">Telegram</span>
                            <span className="text-[7px] text-[#0088cc]">Join Community</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main trigger button simulation */}
                  <div 
                    className="flex items-center justify-center rounded-full bg-[#0d0d14] border border-gold-500/30 shadow-lg"
                    style={{
                      width: currentSize.btn,
                      height: currentSize.btn,
                    }}
                  >
                    <MessageCircle className={`${currentSize.icon} text-gold-400`} />
                  </div>
                </div>
              )}

              {/* Bottom Nav mock */}
              <div className="border-t border-white/5 pt-1 flex justify-around text-[8px] text-neutral-500 select-none">
                <span>Home</span>
                <span className="text-gold-500 font-bold">Matches</span>
                <span>Profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/5">
        <button 
          onClick={handleReset}
          className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset defaults
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 rounded-xl bg-gold-500 text-black font-black text-xs uppercase tracking-widest hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,25,0.3)] disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

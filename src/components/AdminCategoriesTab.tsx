import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { GameCategory } from '../types';
import { 
  Gamepad2, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Link as LinkIcon,
  Eye, 
  EyeOff,
  Sparkles,
  Info,
  Upload,
  RefreshCw,
  X,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

// Helper to determine original fallback emoji based on Category ID / Name
const getCategoryDefaultEmoji = (id: string, name: string): string => {
  const normId = id.toLowerCase();
  const normName = name.toLowerCase();
  if (normId === 'free_fire' || normName.includes('free fire')) return '🔥';
  if (normId === 'pubg_mobile' || normName.includes('pubg')) return '🎯';
  if (normId === 'clash_of_clans' || normName.includes('clash')) return '🏰';
  if (normId === 'free_tournaments' || normName.includes('free tournament')) return '🆓';
  if (normId === 'free_match' || normName.includes('free match')) return '🆓';
  if (normId === 'hacker_match' || normName.includes('hacker')) return '🛡️';
  return '🎮';
};

// Subcomponent for each Game Category Card to isolate state and enable smooth instant live previewing
interface CategoryCardProps {
  category: GameCategory;
  onSave: (updated: GameCategory) => Promise<void>;
  onDelete: (id: string) => void;
  onMove: (cat: GameCategory, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  triggerNotification: (title: string, message: string, type: any) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onSave,
  onDelete,
  onMove,
  isFirst,
  isLast,
  triggerNotification
}) => {
  const isDefaultCategory = ['free_fire', 'pubg_mobile', 'clash_of_clans', 'free_tournaments', 'free_match', 'hacker_match'].includes(category.id);

  // Determine current active icon format
  const getIconFormat = (iconVal: string): 'emoji' | 'url' | 'upload' => {
    if (!iconVal) return 'emoji';
    if (iconVal.startsWith('data:image')) return 'upload';
    if (iconVal.startsWith('http')) return 'url';
    return 'emoji';
  };

  // Local state for interactive editing
  const [name, setName] = useState(category.name);
  const [iconType, setIconType] = useState<'emoji' | 'url' | 'upload'>(getIconFormat(category.icon || ''));
  const [iconUrl, setIconUrl] = useState(category.icon && (category.icon.startsWith('http') || category.icon.startsWith('data:image')) ? category.icon : '');
  const [iconEmoji, setIconEmoji] = useState(!category.icon || category.icon.startsWith('http') || category.icon.startsWith('data:image') ? '🎮' : category.icon);
  const [enabled, setEnabled] = useState(category.enabled !== false);
  const [order, setOrder] = useState(category.order || 1);
  const [bannerUrl, setBannerUrl] = useState(category.banner || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Check if anything has been modified but not saved yet
  const originalIconType = getIconFormat(category.icon || '');
  const hasUnsavedChanges = 
    name !== category.name ||
    enabled !== (category.enabled !== false) ||
    order !== (category.order || 1) ||
    bannerUrl !== (category.banner || '') ||
    iconType !== originalIconType ||
    (iconType === 'emoji' && iconEmoji !== (category.icon && !category.icon.startsWith('http') && !category.icon.startsWith('data:') ? category.icon : '')) ||
    ((iconType === 'url' || iconType === 'upload') && iconUrl !== (category.icon && (category.icon.startsWith('http') || category.icon.startsWith('data:')) ? category.icon : ''));

  // Handler for uploading and auto-optimizing/resizing image file to base64 URL
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleBannerUploadClick = () => {
    bannerFileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed file extensions
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      alert('Supported formats: PNG, JPG, JPEG, WEBP, SVG, ICO.');
      return;
    }

    setIsUploading(true);
    try {
      // Auto-resize and compress square icon to ultra light optimized structure (128x128 max, low file size)
      const optimizedBase64 = await compressImage(file, 0.4, 128);
      setIconUrl(optimizedBase64);
      setIconType('upload');
      triggerNotification("Icon Processed", "Custom icon compressed and loaded into live preview.", "info");
    } catch (err) {
      console.error("An error occurred");
      alert('Failed to optimize icon. Please try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed file extensions
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Supported formats: PNG, JPG, JPEG, WEBP, SVG.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      // Banners can be wider, max 800px width
      const optimizedBase64 = await compressImage(file, 0.6, 800);
      setBannerUrl(optimizedBase64);
      triggerNotification("Banner Processed", "Custom banner compressed and loaded.", "info");
    } catch (err) {
      console.error("An error occurred");
      alert('Failed to optimize banner. Please try another image.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Restore Default Icon
  const handleRestoreDefault = () => {
    const defaultEmoji = getCategoryDefaultEmoji(category.id, name);
    setIconEmoji(defaultEmoji);
    setIconType('emoji');
    setIconUrl('');
    triggerNotification("Default Restored", "Restored standard default emoji icon.", "info");
  };

  // Remove Custom Icon
  const handleRemoveIcon = () => {
    setIconUrl('');
    setIconType('emoji');
    setIconEmoji('🎮');
    triggerNotification("Icon Removed", "Removed custom icon. Falling back to placeholder.", "info");
  };

  // Save changes
  const handleSaveClick = async () => {
    if (!name.trim()) {
      alert('Category Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    // Simulate natural processing delay (150ms) for high-end feel
    await new Promise(resolve => setTimeout(resolve, 150));

    let finalIconVal = '🎮';
    if (iconType === 'emoji') {
      finalIconVal = iconEmoji;
    } else {
      finalIconVal = iconUrl.trim();
      if (!finalIconVal) {
        alert('Please enter a valid Icon URL or upload an image.');
        setIsSaving(false);
        return;
      }
    }

    const updatedCategory: GameCategory = {
      ...category,
      name: name.trim(),
      icon: finalIconVal,
      banner: bannerUrl.trim(),
      enabled,
      order: Number(order) || 1,
      updatedAt: Date.now() // Force Cache Busting
    };

    try {
      await onSave(updatedCategory);
      triggerNotification("Success", "Game Category Icon Updated Successfully.", "success" as any);
    } catch (err) {
      console.error("An error occurred");
      alert('Failed to save category configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render the Live Preview image/emoji
  const renderLivePreview = () => {
    if (iconType === 'emoji') {
      return (
        <span className="text-4xl select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
          {iconEmoji}
        </span>
      );
    }

    if (iconUrl) {
      // Append cache-buster if it's an external url and not a base64
      const previewUrl = iconUrl.startsWith('data:') ? iconUrl : `${iconUrl}${iconUrl.includes('?') ? '&' : '?'}v=${category.updatedAt || Date.now()}`;
      return (
        <img 
          src={previewUrl} 
          alt="Preview" 
          className="w-16 h-16 object-contain rounded-xl border border-white/10 shadow-lg bg-neutral-900/60"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    return <Gamepad2 className="w-10 h-10 text-neutral-600 animate-pulse" />;
  };

  return (
    <div className="bg-[#111116] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group/card hover:border-white/10 transition-all duration-300">
      {/* Decorative Top Accent */}
      <div className={`absolute top-0 inset-x-0 h-[2.5px] transition-all duration-300 ${
        hasUnsavedChanges 
          ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 shadow-[0_1px_5px_rgba(245,158,11,0.5)]' 
          : 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600'
      }`} />

      {/* Header Info */}
      <div className="flex justify-between items-start mb-5">
        <div className="space-y-1 max-w-[70%]">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-[10px] font-mono font-bold tracking-wider uppercase bg-[#16161f] px-2 py-0.5 rounded border border-white/5">
              RANK {order}
            </span>
            {hasUnsavedChanges && (
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Unsaved
              </span>
            )}
          </div>
          <h3 className="font-black text-white text-base tracking-wide truncate mt-1">
            {name || 'New Game Category'}
          </h3>
          <span className="text-[9px] text-neutral-500 font-mono block truncate">ID: {category.id}</span>
        </div>

        {/* Ordering and Delete Actions */}
        <div className="flex items-center gap-1.5 bg-[#0a0a0f] p-1 rounded-xl border border-white/5">
          <button
            disabled={isFirst}
            onClick={() => onMove(category, 'up')}
            className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-purple-400 disabled:opacity-10 disabled:hover:bg-transparent cursor-pointer transition-all"
            title="Move Rank Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={isLast}
            onClick={() => onMove(category, 'down')}
            className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-purple-400 disabled:opacity-10 disabled:hover:bg-transparent cursor-pointer transition-all"
            title="Move Rank Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          {!isDefaultCategory && (
            <button
              onClick={() => onDelete(category.id)}
              className="p-1.5 rounded-lg hover:bg-red-950/30 text-neutral-500 hover:text-red-400 cursor-pointer transition-all border border-transparent hover:border-red-500/20"
              title="Delete custom category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Form Fields and Live Preview Layout */}
      <div className="space-y-4 flex-1">
        
        {/* Dynamic Category Name Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">Category Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Apex Legends"
            className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-semibold"
          />
        </div>

        {/* Interactive Live Preview Box */}
        <div className="relative bg-[#0a0a0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[110px] overflow-hidden group/preview">
          <div className="absolute top-2 left-3 text-[8px] font-black uppercase tracking-wider text-purple-400 select-none">
            Live Preview
          </div>

          <div className="flex flex-col items-center gap-2">
            {renderLivePreview()}
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider bg-[#111116] border border-white/5 px-2.5 py-1 rounded-full shadow-inner mt-1">
              {iconType === 'emoji' ? `Emoji: ${iconEmoji}` : iconType === 'upload' ? 'Uploaded Image' : 'External Web URL'}
            </span>
          </div>

          {/* Quick Clear Icon action overlays if custom */}
          {(iconType !== 'emoji' || iconEmoji !== getCategoryDefaultEmoji(category.id, name)) && (
            <button
              onClick={handleRestoreDefault}
              className="absolute bottom-2 right-2 p-1 bg-[#111116] hover:bg-purple-950/30 border border-white/10 rounded-lg text-neutral-400 hover:text-purple-400 text-[8px] font-bold uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all"
              title="Restore to system default emoji"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Restore Default</span>
            </button>
          )}
        </div>

        {/* Method Toggler Tabs */}
        <div className="space-y-3 bg-[#0c0c11] border border-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Icon Source Method</span>
            <div className="flex bg-[#111116] p-0.5 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setIconType('emoji')}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${iconType === 'emoji' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400'}`}
              >
                Emoji
              </button>
              <button
                type="button"
                onClick={() => setIconType('url')}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${iconType === 'url' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400'}`}
              >
                Icon URL
              </button>
              <button
                type="button"
                onClick={() => setIconType('upload')}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer transition-all ${iconType === 'upload' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400'}`}
              >
                Upload
              </button>
            </div>
          </div>

          {/* Content Pane Based on Selection */}
          {iconType === 'emoji' && (
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {['🎮', '🔥', '🎯', '🏰', '🆓', '⚔️', '👾', '🎖️', '🚀', '💣', '🛡️', '🏆'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconEmoji(emoji)}
                  className={`p-1.5 bg-[#111116] border rounded-lg text-sm hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center ${iconEmoji === emoji ? 'border-purple-500 bg-purple-500/10 text-white scale-105' : 'border-white/5 text-neutral-400'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {iconType === 'url' && (
            <div className="relative pt-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="url"
                value={iconUrl}
                onChange={e => setIconUrl(e.target.value)}
                placeholder="https://example.com/images/icon.png"
                className="w-full bg-[#111116] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-all font-mono font-semibold"
              />
            </div>
          )}

          {iconType === 'upload' && (
            <div className="space-y-2 pt-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/x-icon, image/vnd.microsoft.icon" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 rounded-xl py-3 px-4 bg-[#111116] hover:bg-neutral-800 hover:border-purple-500/20 text-neutral-400 hover:text-white transition-all cursor-pointer text-xs font-black uppercase tracking-wider"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Compressing Image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Upload PNG / JPG / SVG</span>
                  </>
                )}
              </button>
              
              {iconUrl && iconUrl.startsWith('data:') && (
                <div className="flex items-center justify-between bg-[#111116] p-2 rounded-xl border border-white/5 text-[9px] font-mono text-neutral-400">
                  <span className="truncate max-w-[70%]">base64_optimized_icon.webp</span>
                  <button 
                    type="button" 
                    onClick={handleRemoveIcon} 
                    className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                  >
                    Remove Icon
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Landscape Banner Setting */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">Category Banner Image (Optional)</label>
          <div className="space-y-2">
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banners/freefire.jpg"
                className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition-all font-mono font-semibold"
              />
            </div>
            
            <input 
              type="file" 
              ref={bannerFileInputRef} 
              onChange={handleBannerFileChange} 
              accept="image/png, image/jpeg, image/webp, image/svg+xml" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={handleBannerUploadClick}
              disabled={isUploadingBanner}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 rounded-xl py-2 px-4 bg-[#111116] hover:bg-neutral-800 hover:border-purple-500/20 text-neutral-400 hover:text-white transition-all cursor-pointer text-xs font-black uppercase tracking-wider"
            >
              {isUploadingBanner ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Compressing Banner...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Upload Banner Image</span>
                </>
              )}
            </button>
            
            {bannerUrl && bannerUrl.startsWith('data:') && (
              <div className="flex items-center justify-between bg-[#111116] p-2 rounded-xl border border-white/5 text-[9px] font-mono text-neutral-400">
                <span className="truncate max-w-[70%]">base64_optimized_banner.webp</span>
                <button 
                  type="button" 
                  onClick={() => setBannerUrl('')} 
                  className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
            
            {bannerUrl && !bannerUrl.startsWith('data:') && (
              <div className="rounded-xl overflow-hidden border border-white/10 opacity-75">
                <img src={bannerUrl} alt="Banner Preview" className="w-full h-12 object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Category Visibility Status Switch */}
        <div className="flex items-center justify-between p-3.5 bg-[#0a0a0f] border border-white/5 rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">Active Status</span>
            <span className="text-[9px] text-neutral-500 block leading-tight">Toggle visibility in User Panel.</span>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${enabled ? 'bg-green-600' : 'bg-neutral-800'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
          </button>
        </div>

      </div>

      {/* Save Action Block */}
      <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={() => {
              // Cancel / Revert local changes to match current database state
              setName(category.name);
              setIconType(getIconFormat(category.icon || ''));
              setIconUrl(category.icon && (category.icon.startsWith('http') || category.icon.startsWith('data:image')) ? category.icon : '');
              setIconEmoji(!category.icon || category.icon.startsWith('http') || category.icon.startsWith('data:image') ? '🎮' : category.icon);
              setEnabled(category.enabled !== false);
              setOrder(category.order || 1);
              setBannerUrl(category.banner || '');
              triggerNotification("Reverted", "Changes discarded.", "info");
            }}
            className="flex-1 py-2.5 rounded-xl border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Revert
          </button>
        )}
        <button
          type="button"
          disabled={isSaving || !name.trim()}
          onClick={handleSaveClick}
          className={`flex-1 py-2.5 rounded-xl text-neutral-950 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-[0.98] ${
            hasUnsavedChanges 
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 font-bold text-black border-amber-400/40' 
              : 'bg-neutral-800 text-neutral-400 border-white/5 cursor-not-allowed hover:brightness-100 active:scale-100'
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};


// Main Component
interface GameLogoCardProps {
  gameId: string;
  defaultName: string;
  category: GameCategory | undefined;
  onSave: (updated: GameCategory) => Promise<void>;
  triggerNotification: (title: string, message: string, type: any) => void;
}

const GameLogoCard: React.FC<GameLogoCardProps> = ({
  gameId,
  defaultName,
  category,
  onSave,
  triggerNotification
}) => {
  const [localLogo, setLocalLogo] = useState<string>(category?.logo || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare local state with the saved value to see if there are unsaved changes
  const hasUnsavedChanges = localLogo !== (category?.logo || '');

  // Handle file selections
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported Formats check
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      triggerNotification("Invalid Format", "Only PNG, JPG, JPEG, WEBP, and SVG formats are supported.", "alert");
      return;
    }

    // Max 10 MB limit check
    if (file.size > 10 * 1024 * 1024) {
      triggerNotification("File Too Large", "Maximum file size allowed is 10 MB.", "alert");
      return;
    }

    setIsUploading(true);
    try {
      let base64Result = '';
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        base64Result = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      } else {
        base64Result = await compressImage(file, 0.5, 512);
      }

      setLocalLogo(base64Result);
      triggerNotification("Preview Loaded", "New logo loaded. Please click 'Save Changes' to apply.", "info");
    } catch (err) {
      console.error("Image loading failed:", err);
      triggerNotification("Upload Failed", "Could not process image file.", "alert");
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setLocalLogo('');
    triggerNotification("Removed", "Logo removed from preview. Click 'Save Changes' to apply.", "info");
  };

  const handleSaveLogo = async () => {
    setIsSaving(true);
    try {
      const currentCat = category || {
        id: gameId,
        name: defaultName,
        enabled: true,
        order: 99,
      };

      const updatedCategory: GameCategory = {
        ...currentCat,
        logo: localLogo,
        updatedAt: Date.now()
      };

      await onSave(updatedCategory);
      triggerNotification("Success", `${defaultName} Logo updated successfully!`, "success");
    } catch (err) {
      console.error("Save logo failed:", err);
      triggerNotification("Error Saving", `Failed to save ${defaultName} logo.`, "alert");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalLogo(category?.logo || '');
    triggerNotification("Reset", "Unsaved changes discarded.", "info");
  };

  return (
    <div className="bg-[#111116] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group/card hover:border-white/10 transition-all duration-300">
      <div className={`absolute top-0 inset-x-0 h-[2px] transition-all duration-300 ${
        hasUnsavedChanges 
          ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 shadow-[0_1px_5px_rgba(245,158,11,0.5)]' 
          : 'bg-gradient-to-r from-gold-500/30 to-amber-600/30'
      }`} />

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-white text-base tracking-wide truncate">{defaultName}</h3>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mt-0.5">Database ID: {gameId}</span>
          </div>
          {hasUnsavedChanges && (
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="relative bg-[#0a0a0f] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] overflow-hidden group/preview">
          {localLogo ? (
            <div className="relative">
              <img 
                src={localLogo} 
                alt={`${defaultName} Logo`} 
                className="w-24 h-24 object-contain rounded-xl border border-white/10 shadow-lg bg-neutral-900/60"
                referrerPolicy="no-referrer"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-gold-400 animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-500">
              <ImageIcon className="w-10 h-10 stroke-[1.5]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">No Logo Configured</span>
            </div>
          )}
        </div>

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".png,.jpg,.jpeg,.webp,.svg"
          className="hidden"
        />

        <div className="flex gap-2.5">
          {localLogo ? (
            <>
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5"
              >
                Change Logo
              </button>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border border-red-500/10 flex items-center justify-center gap-1.5"
              >
                Remove Logo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 rounded-xl py-3 px-4 bg-[#111116] hover:bg-neutral-800 hover:border-gold-500/20 text-neutral-400 hover:text-white transition-all cursor-pointer text-xs font-black uppercase tracking-wider"
            >
              <Upload className="w-4 h-4 text-gold-400" />
              <span>Upload Logo</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 pt-4 mt-5 flex gap-2.5">
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Discard changes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          disabled={isSaving || !hasUnsavedChanges}
          onClick={handleSaveLogo}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-md ${
            hasUnsavedChanges
              ? 'bg-gradient-to-r from-gold-500 to-amber-600 hover:brightness-110 text-neutral-950 cursor-pointer'
              : 'bg-neutral-800/50 text-neutral-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export const AdminCategoriesTab: React.FC<{ showConfirm?: (title: string, message: string, onConfirm: () => void | Promise<void>) => void }> = ({ showConfirm }) => {
  const { categories, saveCategoryAdmin, deleteCategoryAdmin, triggerNotification } = useGame();
  
  // Sub-Tab selection
  const [activeSubTab, setActiveSubTab] = useState<'logos' | 'categories'>('logos');

  // Create New Category drawer state
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🎮');

  const SUPPORTED_LOGO_GAMES = [
    { id: 'free_fire', name: 'Free Fire' },
    { id: 'pubg_mobile', name: 'PUBG Mobile' },
    { id: 'clash_of_clans', name: 'Clash of Clans' },
    { id: 'free_match', name: 'Free Match' },
    { id: 'hacker_match', name: 'Hacker Match' }
  ];

  const handleOpenAdd = () => {
    setNewCatName('');
    setNewCatId('');
    setNewCatEmoji('🎮');
    setIsAdding(true);
  };

  const handleNameChange = (val: string) => {
    setNewCatName(val);
    const sanitizedId = val.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    setNewCatId(sanitizedId);
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Category Name is required.');
      return;
    }
    if (!newCatId.trim()) {
      alert('Category ID is required.');
      return;
    }

    if (categories.some(c => c.id === newCatId)) {
      alert(`A category with ID "${newCatId}" already exists. Please choose a different name.`);
      return;
    }

    const newCategory: GameCategory = {
      id: newCatId.trim(),
      name: newCatName.trim(),
      icon: newCatEmoji,
      enabled: true,
      order: categories.length + 1,
      updatedAt: Date.now()
    };

    try {
      await saveCategoryAdmin(newCategory);
      setIsAdding(false);
      triggerNotification("Success", "Game Category Created Successfully.", "success" as any);
    } catch (err) {
      console.error("An error occurred");
      alert('Failed to create game category.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (['free_fire', 'pubg_mobile', 'clash_of_clans', 'free_tournaments'].includes(id)) {
      alert('Default core game categories cannot be deleted to ensure system integrity. You can disable them instead.');
      return;
    }

    const performDelete = () => {
      deleteCategoryAdmin(id);
      triggerNotification("Deleted", "Category permanently deleted.", "alert");
    };

    if (showConfirm) {
      showConfirm(
        "Confirm Deletion",
        "Are you sure you want to permanently delete this game category? This action cannot be undone.",
        performDelete
      );
    } else if (window.confirm('Are you sure you want to permanently delete this game category? This action cannot be undone.')) {
      performDelete();
    }
  };

  const handleMoveOrder = async (cat: GameCategory, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const otherCat = categories[targetIndex];
    
    const tempOrder = cat.order || 1;
    const catUpdated = { ...cat, order: otherCat.order || 1, updatedAt: Date.now() };
    const otherUpdated = { ...otherCat, order: tempOrder, updatedAt: Date.now() };

    if (catUpdated.order === otherUpdated.order) {
      catUpdated.order = direction === 'up' ? (otherCat.order || 1) - 1 : (otherCat.order || 1) + 1;
    }

    await saveCategoryAdmin(catUpdated);
    await saveCategoryAdmin(otherUpdated);
    triggerNotification("Order Replaced", "Display ranks modified successfully.", "info");
  };

  return (
    <div id="game_category_manager_view" className="space-y-6 font-sans">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-wider">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
            <span className="uppercase">Game Category Manager</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Super Admin center to upload custom category icons, logos, and toggle tournament visibility dynamically without touching source code.
          </p>
        </div>
        
        {activeSubTab === 'categories' && !isAdding && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-white/5 pb-1 gap-6">
        <button
          onClick={() => setActiveSubTab('logos')}
          className={`pb-3 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'logos'
              ? 'border-gold-500 text-gold-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          🛡️ Game Logo Manager
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`pb-3 px-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'categories'
              ? 'border-gold-500 text-gold-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          🎮 Category Structure
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'logos' ? (
        <div className="space-y-6">
          <div className="bg-[#111116] border border-white/5 rounded-3xl p-5 shadow-xl flex items-start gap-3 text-xs text-neutral-400 leading-relaxed">
            <Info className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-bold">Game Logo Manager:</strong>
              <p>
                Configure separate game-specific logos for major combat arenas. Supported formats include <strong>PNG, JPG, JPEG, WEBP, and SVG</strong> up to <strong>10 MB</strong>. Preview is generated immediately upon file selection, and changes take effect on the user panel instantly once you click <strong>Save Changes</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUPPORTED_LOGO_GAMES.map((game) => {
              const cat = categories.find(c => c.id === game.id);
              return (
                <GameLogoCard
                  key={game.id}
                  gameId={game.id}
                  defaultName={game.name}
                  category={cat}
                  onSave={saveCategoryAdmin}
                  triggerNotification={triggerNotification}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Option to create a new category drawer form */}
          {isAdding && (
            <div className="bg-[#111116] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-lg">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-gold-500" />
              
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-purple-400">❖</span>
                  <span>Create New Game Category</span>
                </h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Call of Duty Mobile"
                    className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">Category Database ID</label>
                  <input
                    type="text"
                    required
                    value={newCatId}
                    onChange={e => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. cod_mobile"
                    className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-purple-500 transition-all font-mono font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">Default Placeholder Emoji</label>
                  <div className="grid grid-cols-6 gap-2 bg-[#0a0a0f] p-3 rounded-2xl border border-white/5">
                    {['🎮', '🔥', '🎯', '🏰', '🆓', '⚔️', '👾', '🎖️', '🚀', '💣', '🛡️', '🏆'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatEmoji(emoji)}
                        className={`p-2 bg-[#111116] border rounded-lg text-lg hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center ${newCatEmoji === emoji ? 'border-purple-500 bg-purple-500/10' : 'border-white/5'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid List of Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSave={saveCategoryAdmin}
                onDelete={handleDeleteCategory}
                onMove={handleMoveOrder}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
                triggerNotification={triggerNotification}
              />
            ))}
          </div>

          {/* Informative Footer Block */}
          <div className="bg-[#111116] border border-white/5 rounded-3xl p-5 shadow-xl flex items-start gap-3 text-xs text-neutral-400 leading-relaxed">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-bold">Dynamic Synchronization Note:</strong>
              <p>
                When icons or active states are updated here, changes are synchronized immediately in Firebase. Any visitor on the platform will instantly view the new category icons, orders, and statuses without requiring a manual page refresh. Clean cached images are busted instantly using updated-at timestamps.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

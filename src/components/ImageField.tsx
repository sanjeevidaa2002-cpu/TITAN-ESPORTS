import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload, Link, Save, RefreshCw, FolderClosed } from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
  onSave?: (value: string) => Promise<void>;
  progress?: number;
  isSaving?: boolean;
}

export const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange, onUpload, onSave, progress, isSaving }) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleUrlSave = async () => {
    setSavingUrl(true);
    onChange(urlInput);
    if (onSave) {
        await onSave(urlInput);
    }
    setSavingUrl(false);
  };

  const handleMediaPick = async (url: string) => {
    onChange(url);
    if (onSave) {
      await onSave(url);
    }
    setShowPicker(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</label>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="text-[9px] font-bold uppercase text-gold-400 hover:text-gold-300 flex items-center gap-1 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded transition-colors"
        >
          <FolderClosed className="w-2.5 h-2.5" /> Select from Storage
        </button>
      </div>
      
      {/* Mode Switcher */}
      <div className="flex bg-[#111116] rounded-lg p-1 border border-white/5">
        <button 
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'upload' ? 'bg-gold-500/20 text-gold-400' : 'text-neutral-500 hover:text-white'}`}
        >
          <Upload className="w-3 h-3" /> Upload
        </button>
        <button 
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'url' ? 'bg-gold-500/20 text-gold-400' : 'text-neutral-500 hover:text-white'}`}
        >
          <Link className="w-3 h-3" /> URL
        </button>
      </div>

      {/* Content */}
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-16 h-16 bg-[#111116] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={value} alt={label} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            <button 
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 bg-red-500/80 p-0.5 rounded-full hover:bg-red-500"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 bg-[#111116] rounded-xl border border-dashed border-white/20 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-neutral-500" />
          </div>
        )}

        <div className="flex-1">
          {mode === 'upload' ? (
            <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 px-4 rounded-lg inline-block transition-colors">
              Choose File
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          ) : (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={urlInput} 
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.png"
                className="flex-1 bg-[#111116] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
              />
              <button 
                type="button"
                onClick={handleUrlSave} 
                disabled={savingUrl || isSaving}
                className="bg-gold-600 hover:bg-gold-500 text-black px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5"
              >
                {savingUrl ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
          
          {progress !== undefined && progress > 0 && progress < 100 && (
            <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2">
              <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Media Picker Modal */}
      {showPicker && (
        <MediaPickerModal 
          onSelect={handleMediaPick}
          onClose={() => setShowPicker(false)}
          allowedTypes={['image']}
          title={`Select ${label}`}
        />
      )}
    </div>
  );
};

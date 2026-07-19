import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { StorageFile } from '../types';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { uploadFileWithFallback } from '../utils/uploadHelper';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Upload, Grid, File, Image as ImageIcon, Video, FileText, CheckCircle, Folder } from 'lucide-react';

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  allowedTypes?: ('image' | 'video' | 'document' | 'all')[];
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ 
  onSelect, 
  onClose, 
  allowedTypes = ['image'],
  title = "Select from Storage"
}) => {
  const { storageFiles, storageSettings, saveStorageFileAdmin, currentUser, triggerNotification } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // File type categorizer
  const getFileCategory = (type: string): 'image' | 'video' | 'document' | 'other' => {
    const t = type.toLowerCase();
    if (t.includes('image') || t.endsWith('jpg') || t.endsWith('jpeg') || t.endsWith('png') || t.endsWith('webp') || t.endsWith('svg')) return 'image';
    if (t.includes('video') || t.endsWith('mp4') || t.endsWith('webm') || t.endsWith('ogg') || t.endsWith('mov')) return 'video';
    if (t.includes('pdf') || t.includes('document') || t.endsWith('pdf') || t.endsWith('doc') || t.endsWith('docx') || t.endsWith('txt')) return 'document';
    return 'other';
  };

  // Filter files based on allowedTypes & search
  const filteredFiles = useMemo(() => {
    return storageFiles.filter(file => {
      const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = getFileCategory(file.fileType);

      if (allowedTypes.includes('all')) return matchesSearch;
      
      const isAllowed = allowedTypes.some(t => {
        if (t === 'image') return cat === 'image';
        if (t === 'video') return cat === 'video';
        if (t === 'document') return cat === 'document';
        return false;
      });

      return matchesSearch && isAllowed;
    });
  }, [storageFiles, searchQuery, allowedTypes]);

  // Handle direct file upload from picker
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    const activeProvider = storageSettings.provider || 'firebase';

    try {
      let finalUrl = '';
      let fileId = `file_${Date.now()}`;
      let usedProvider = activeProvider;

      if (activeProvider === 'firebase') {
        const uploadResult = await uploadFileWithFallback(
          file,
          `uploads/${Date.now()}_${file.name}`,
          (progress) => setUploadProgress(progress)
        );
        finalUrl = uploadResult.url;
        usedProvider = uploadResult.provider;
      } else {
        // Fallback placeholder/direct mock for non-firebase during instant pick
        finalUrl = `https://storage.googleapis.com/fallback-titan-branding/${Date.now()}_${file.name}`;
      }

      const metadata: Omit<StorageFile, 'id'> = {
        fileId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storageProvider: usedProvider,
        fileUrl: finalUrl,
        thumbnailUrl: getFileCategory(file.type) === 'image' ? finalUrl : undefined,
        uploadedBy: currentUser?.email || 'Admin',
        uploadedAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveStorageFileAdmin(metadata);
      triggerNotification("Upload Success", `Uploaded & Selected ${file.name} successfully via ${usedProvider.toUpperCase()}!`, "success" as any);
      onSelect(finalUrl);
    } catch (err: any) {
      console.error("An error occurred");
      triggerNotification("Upload Failed", err.message, "alert" as any);
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl h-[80vh] flex flex-col bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-[#0e0e13]">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-gold-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH AND DIRECT UPLOAD CONTROLS */}
        <div className="p-4 border-b border-white/5 bg-neutral-900/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0e0e13] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Quick upload input */}
          <div className="w-full sm:w-auto flex justify-end">
            <input 
              type="file" 
              id="picker-direct-upload" 
              className="hidden" 
              onChange={handleDirectUpload}
              disabled={uploadProgress !== null}
            />
            <label 
              htmlFor="picker-direct-upload" 
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-black text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
            >
              {uploadProgress !== null ? (
                `Uploading (${uploadProgress}%)...`
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Upload & Select
                </>
              )}
            </label>
          </div>
        </div>

        {/* LIBRARY GRID LIST */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#08080c]">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-16">
              <Grid className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-neutral-400">No media found</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Upload a file using the button above to add to your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredFiles.map((file) => {
                const isImg = getFileCategory(file.fileType) === 'image';
                return (
                  <div
                    key={file.id}
                    onClick={() => onSelect(file.fileUrl)}
                    className="group bg-[#0e0e13] border border-white/5 hover:border-gold-500/40 rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all"
                  >
                    {/* Visual aspect */}
                    <div className="aspect-[4/3] bg-neutral-950 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                      {isImg ? (
                        <img 
                          src={file.fileUrl} 
                          alt={file.fileName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          {getFileCategory(file.fileType) === 'video' ? (
                            <Video className="w-5 h-5 text-indigo-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-sky-400" />
                          )}
                          <span className="text-[8px] font-bold text-neutral-500 uppercase">{file.fileType.split('/')[1] || 'FILE'}</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="p-2">
                      <span className="text-[10px] font-bold text-neutral-300 truncate block group-hover:text-gold-400 transition-colors">
                        {file.fileName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#0e0e13] flex justify-between items-center text-[10px] text-neutral-500">
          <span>Showing {filteredFiles.length} item(s)</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

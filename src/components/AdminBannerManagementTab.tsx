import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Plus, Edit2, Trash2, Save, X, Image as ImageIcon, CheckCircle, Upload, FolderClosed
} from 'lucide-react';
import { HomepageBanner } from '../types';
import { uploadFileWithFallback } from '../utils/uploadHelper';
import { MediaPickerModal } from './MediaPickerModal';

export const AdminBannerManagementTab: React.FC<{ showConfirm?: (title: string, message: string, onConfirm: () => void | Promise<void>) => void }> = ({ showConfirm }) => {
  const { homepageBanners, saveHomepageBannerAdmin, deleteHomepageBannerAdmin } = useGame();
  
  const [editingBanner, setEditingBanner] = useState<Partial<HomepageBanner> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const activeBanners = [...homepageBanners].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleCreateNew = () => {
    setEditingBanner({
      title: '',
      imageUrl: '',
      redirectUrl: '',
      displayOrder: (activeBanners[activeBanners.length - 1]?.displayOrder || 0) + 1,
      enabled: true
    });
  };

  const handleEdit = (banner: HomepageBanner) => {
    setEditingBanner({ ...banner });
  };

  const handleDelete = async (id: string) => {
    const performDelete = async () => {
      await deleteHomepageBannerAdmin(id);
    };

    if (showConfirm) {
      showConfirm(
        "Confirm Deletion",
        "Are you sure you want to permanently delete this banner? This action cannot be undone.",
        performDelete
      );
    } else if (window.confirm("Are you sure you want to delete this banner?")) {
      await performDelete();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title || !editingBanner.imageUrl) {
      alert("Please fill in the title and image URL");
      return;
    }

    setIsSaving(true);
    
    try {
      const bannerData: HomepageBanner = {
        id: editingBanner.id || `banner_${Date.now()}`,
        title: editingBanner.title,
        imageUrl: editingBanner.imageUrl,
        redirectUrl: editingBanner.redirectUrl || '',
        displayOrder: Number(editingBanner.displayOrder) || 0,
        enabled: editingBanner.enabled ?? true,
        createdAt: editingBanner.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await saveHomepageBannerAdmin(bannerData);
      setEditingBanner(null);
    } catch (err) {
      console.error("An error occurred");
      alert("Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (banner: HomepageBanner) => {
    await saveHomepageBannerAdmin({
      ...banner,
      enabled: !banner.enabled,
      updatedAt: Date.now()
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBanner) {
      setUploadProgress(0);
      try {
        const uploadResult = await uploadFileWithFallback(
          file,
          `banners/banner_${Date.now()}_${file.name}`,
          (progress) => setUploadProgress(progress)
        );
        setEditingBanner(prev => prev ? { ...prev, imageUrl: uploadResult.url } : null);
      } catch (err: any) {
        console.error("Upload error:");
        alert(`Failed to upload image: ${err.message || err}`);
      } finally {
        setUploadProgress(null);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Homepage Banners</h2>
          <p className="text-xs text-neutral-400 mt-1">Manage the premium sliding banners on the homepage.</p>
        </div>
        {!editingBanner && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Banner
          </button>
        )}
      </div>

      {editingBanner ? (
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingBanner.id ? 'Edit Banner' : 'Create New Banner'}
            </h3>
            <button
              onClick={() => setEditingBanner(null)}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-2">Banner Title</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                    placeholder="e.g., Grand Finals 2026"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-2">Redirect URL (Optional)</label>
                  <input
                    type="url"
                    value={editingBanner.redirectUrl || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, redirectUrl: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                    placeholder="https://example.com/tournament"
                  />
                  <p className="text-[9px] text-neutral-500 mt-1">If provided, users will be redirected here when they click the banner.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-2">Display Order</label>
                    <input
                      type="number"
                      required
                      value={editingBanner.displayOrder || 0}
                      onChange={e => setEditingBanner({ ...editingBanner, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBanner.enabled ?? true}
                        onChange={e => setEditingBanner({ ...editingBanner, enabled: e.target.checked })}
                        className="w-4 h-4 rounded bg-neutral-900 border-white/10 text-gold-500 focus:ring-gold-500 focus:ring-offset-neutral-900"
                      />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Enable Banner</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Banner Image</label>
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className="text-[9px] font-bold uppercase text-gold-400 hover:text-gold-300 flex items-center gap-1 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded transition-colors"
                    >
                      <FolderClosed className="w-2.5 h-2.5" /> Select from Storage
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={editingBanner.imageUrl || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold-500"
                      placeholder="Direct Image URL (https://...)"
                    />
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#111116] text-neutral-500 text-[9px] font-bold uppercase">OR</span>
                      </div>
                    </div>

                    <label className="flex items-center justify-center gap-2 w-full bg-neutral-900 border border-dashed border-white/20 hover:border-gold-500/50 rounded-xl p-4 cursor-pointer transition-colors">
                      <ImageIcon className="w-5 h-5 text-neutral-400" />
                      <span className="text-xs text-neutral-300 font-medium">
                        {uploadProgress !== null ? `Uploading (${Math.round(uploadProgress)}%)...` : 'Upload Image from Device'}
                      </span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploadProgress !== null} />
                    </label>

                    {uploadProgress !== null && (
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>

                {editingBanner.imageUrl && (
                  <div className="mt-4">
                    <label className="text-[9px] text-neutral-500 uppercase tracking-wider block mb-2">Live Preview (1600x500 Desktop aspect)</label>
                    <div className="w-full aspect-[16/5] rounded-xl overflow-hidden border border-white/10 bg-black">
                      <img src={editingBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBanners.map(banner => (
            <div key={banner.id} className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden group">
              <div className="relative aspect-[16/7] w-full">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${banner.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {banner.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="px-2 py-1 rounded bg-black/50 text-white text-[9px] font-bold uppercase backdrop-blur-sm">
                    Order: {banner.displayOrder}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-sm truncate">{banner.title}</h3>
                  {banner.redirectUrl && (
                    <p className="text-[9px] text-blue-400 mt-0.5 truncate flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Redirect set
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-neutral-900/50 flex gap-2">
                <button
                  onClick={() => handleToggleStatus(banner)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                    banner.enabled ? 'bg-white/5 text-neutral-400 hover:text-white' : 'bg-gold-500/20 text-gold-400'
                  }`}
                >
                  {banner.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleEdit(banner)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {activeBanners.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
              <ImageIcon className="w-12 h-12 text-neutral-500 mb-3" />
              <p className="text-neutral-400 text-sm font-medium">No banners found</p>
              <button
                onClick={handleCreateNew}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Create Your First Banner
              </button>
            </div>
          )}
        </div>
      )}

      {showPicker && editingBanner && (
        <MediaPickerModal
          onSelect={(url) => {
            setEditingBanner({ ...editingBanner, imageUrl: url });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
          allowedTypes={['image']}
          title="Select Banner Image"
        />
      )}
    </div>
  );
};

const fs = require('fs');
const path = require('path');

const managerPath = path.join(__dirname, 'src/components/LoadingPageManager.tsx');
let content = fs.readFileSync(managerPath, 'utf8');

// Replace the Logo Section & Logo URL section with a combined section featuring radio buttons
const oldLogoSection = `          {/* Logo Section */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Upload Logo</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Drag & drop or upload a custom Mascot Logo.</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={\`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all \${
                isDragging 
                  ? 'border-gold-500 bg-gold-500/5' 
                  : 'border-white/10 hover:border-white/20 bg-[#111116]/50'
              }\`}
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
                  <div className="bg-gold-500 h-1 rounded-full transition-all duration-150" style={{ width: \`\${uploadProgress}%\` }} />
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
              value={localSettings.loadingLogoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="e.g. https://firebasestorage.googleapis.com/... or https://i.imgur.com/logo.png"
              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 font-mono focus:border-gold-500 focus:outline-none transition-colors"
            />
          </div>`;

const newLogoSection = `          {/* Image Source Selection */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Image Source</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Choose how to provide the loading page image.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <label className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all \${
                localSettings.loadingLogoSource === 'upload' || !localSettings.loadingLogoSource
                  ? 'bg-gold-500/10 border-gold-500/50 text-gold-400'
                  : 'bg-[#111116] border-white/5 text-neutral-400 hover:bg-white/5'
              }\`}>
                <input
                  type="radio"
                  name="loadingLogoSource"
                  checked={localSettings.loadingLogoSource === 'upload' || !localSettings.loadingLogoSource}
                  onChange={() => handleFieldChange('loadingLogoSource', 'upload')}
                  className="hidden"
                />
                <Upload className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Upload to Firebase Storage</span>
              </label>

              <label className={\`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all \${
                localSettings.loadingLogoSource === 'url'
                  ? 'bg-gold-500/10 border-gold-500/50 text-gold-400'
                  : 'bg-[#111116] border-white/5 text-neutral-400 hover:bg-white/5'
              }\`}>
                <input
                  type="radio"
                  name="loadingLogoSource"
                  checked={localSettings.loadingLogoSource === 'url'}
                  onChange={() => handleFieldChange('loadingLogoSource', 'url')}
                  className="hidden"
                />
                <span className="text-xs font-bold uppercase tracking-wider">Use Direct Image URL</span>
              </label>
            </div>

            {(localSettings.loadingLogoSource === 'upload' || !localSettings.loadingLogoSource) && (
              <div className="pt-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={\`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all \${
                    isDragging 
                      ? 'border-gold-500 bg-gold-500/5' 
                      : 'border-white/10 hover:border-white/20 bg-[#111116]/50'
                  }\`}
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
                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                      <span>Uploading file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#111116] rounded-full h-1">
                      <div className="bg-gold-500 h-1 rounded-full transition-all duration-150" style={{ width: \`\${uploadProgress}%\` }} />
                    </div>
                  </div>
                )}

                {uploadStatus === 'error' && uploadError && (
                  <div className="text-[10px] text-red-400 font-semibold bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg mt-4">
                    {uploadError}
                  </div>
                )}

                {localSettings.uploadedLogoUrl && (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono break-all bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg mt-4">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Uploaded URL: {localSettings.uploadedLogoUrl}</span>
                  </div>
                )}
              </div>
            )}

            {localSettings.loadingLogoSource === 'url' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Loading Image URL</label>
                  <input
                    type="text"
                    value={localSettings.loadingLogoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/loading-image.png"
                    className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 font-mono focus:border-gold-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>`;

content = content.replace(oldLogoSection, newLogoSection);

fs.writeFileSync(managerPath, content);
console.log("LoadingPageManager patched");

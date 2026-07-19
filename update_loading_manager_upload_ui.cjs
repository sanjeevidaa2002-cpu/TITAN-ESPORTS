const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const targetStr = `<input
                            type="text"
                            value={imageSrc || ''}
                            onChange={e => handleFieldChange(item.key as any, e.target.value)}
                            placeholder="Enter image web URL"
                            className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-gold-500 outline-none w-48 font-mono"
                          />
                          `;

const replaceStr = `<input
                            type="text"
                            value={imageSrc || ''}
                            onChange={e => handleFieldChange(item.key as any, e.target.value)}
                            placeholder="Enter image web URL"
                            className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-gold-500 outline-none w-48 font-mono"
                          />
                          <span className="text-[10px] text-neutral-500 font-bold uppercase">OR</span>
                          <label className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            Upload
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/x-icon, image/vnd.microsoft.icon"
                              onChange={e => handleImageUpload(e, item.key as any)}
                              className="hidden"
                            />
                          </label>
                          `;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

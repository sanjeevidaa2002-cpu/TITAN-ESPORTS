const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const inputToReplace = `<input
                            type="text"
                            value={imageSrc || ''}
                            onChange={e => handleFieldChange(item.key as any, e.target.value)}
                            placeholder="Enter image web URL"
                            className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-gold-500 outline-none w-48 font-mono"
                          />`;
                          
const inputReplacement = `<input
                            type="text"
                            value={imageSrc || ''}
                            onChange={e => {
                                handleFieldChange(item.key as any, e.target.value);
                                setImgErrors(prev => ({ ...prev, [item.key]: false }));
                            }}
                            placeholder="Enter image web URL"
                            className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-gold-500 outline-none w-48 font-mono"
                          />`;
                          
content = content.replace(inputToReplace, inputReplacement);

const previewToReplace = `{imageSrc && (
                          <div className="flex gap-1.5">`;

const previewReplacement = `{imgErrors[item.key] && imageSrc && (
                          <div className="text-[10px] text-red-400 font-bold max-w-[80px] text-center leading-tight">
                            Invalid or inaccessible URL
                          </div>
                        )}
                        {imageSrc && (
                          <div className="flex gap-1.5">`;

content = content.replace(previewToReplace, previewReplacement);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

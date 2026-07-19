const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const targetStr = `<button
                              onClick={() => handleFieldChange(item.key as any, '')}
                              className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-500/20 text-[9px] font-extrabold uppercase rounded hover:bg-red-900"
                            >
                              Delete
                            </button>`;
                            
const replaceStr = `<button
                              onClick={() => handleFieldChange(item.key as any, '')}
                              className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-500/20 text-[9px] font-extrabold uppercase rounded hover:bg-red-900"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => handleFieldChange(item.key as any, DEFAULT_BRANDING[item.key as keyof BrandingSettings])}
                              className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 border border-white/10 text-[9px] font-extrabold uppercase rounded hover:bg-neutral-700"
                            >
                              Default
                            </button>`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

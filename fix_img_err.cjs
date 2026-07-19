const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const targetStr = `onChange={e => handleFieldChange(item.key as any, e.target.value)}`;
const replaceStr = `onChange={e => {
                              handleFieldChange(item.key as any, e.target.value);
                              setImgErrors(prev => ({ ...prev, [item.key]: false }));
                            }}`;

content = content.replace(new RegExp(targetStr.replace(/[.*+?^$\/{}()|[\\]\\]/g, '\\$&'), 'g'), replaceStr);

const imgTarget = `<img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" />`;
const imgReplace = `<img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" onError={() => setImgErrors(prev => ({ ...prev, [item.key]: true }))} />`;

content = content.replace(new RegExp(imgTarget.replace(/[.*+?^$\/{}()|[\\]\\]/g, '\\$&'), 'g'), imgReplace);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

content = content.replace(/<div className="flex bg-\[#111116\] p-1 rounded-xl mb-6 border border-white\/5">/, 
"{!adminMode && <div className=\"flex bg-[#111116] p-1 rounded-xl mb-6 border border-white/5\">");

content = content.replace(/Sign Up\s*<\/button>\s*<\/div>/,
"Sign Up\n              </button>\n            </div>}");

fs.writeFileSync('src/components/Auth.tsx', content);

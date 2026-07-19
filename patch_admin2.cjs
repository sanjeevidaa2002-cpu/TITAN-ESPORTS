const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Remove Hamburger button from Sidebar Header
content = content.replace(
/(\s*)<button\s*onClick=\{\(\) => setShowMobileMenu\(!showMobileMenu\)\}[\s\S]*?<Menu className="w-4 h-4" \/>\n\s*<\/button>\n/m,
``
);

// 2. Make nav always block
content = content.replace(
/className=\{\`flex-1 p-3 space-y-1 overflow-y-auto \$\{showMobileMenu \? 'block' : 'hidden md:block'\}\`\}/g,
'className="flex-1 p-3 space-y-1 overflow-y-auto"'
);

// 3. Make footer always flex
content = content.replace(
/className=\{\`p-4 border-t border-white\/5 bg-\[\#0a0a0f\] flex items-center gap-2\.5 \$\{showMobileMenu \? 'flex' : 'hidden md:flex'\}\`\}/g,
'className="p-4 border-t border-white/5 bg-[#0a0a0f] flex items-center gap-2.5"'
);

// 4. Remove state
content = content.replace(
/  const \[showMobileMenu, setShowMobileMenu\] = useState\(false\);\n/,
''
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

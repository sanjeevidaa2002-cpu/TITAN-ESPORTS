const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Fix extra div at the end
content = content.replace(
  /              <\/div>\n      <\/main>\n    <\/div>\n  \);\n\};\n/m,
  `      </main>\n    </div>\n  );\n};\n`
);

// 2. Fix the login form's Exit Console button
content = content.replace(
  /<button\s+onClick=\{onBack\}\s+className="px-2 py-1\.5 flex justify-center items-center rounded bg-white\/5 text-\[9px\] uppercase font-bold text-neutral-400 hover:text-white border border-white\/5 cursor-pointer"\s+title="Exit Console"\s+>\s+\{sidebarCollapsed \? <LogOut className="w-4 h-4" \/> : 'Exit Console'\}\s+<\/button>/m,
  `<button 
              onClick={onBack}
              className="px-2 py-1 rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
            >
              Exit Console
            </button>`
);

// 3. Fix the login form's Logo text
content = content.replace(
  /\{\!sidebarCollapsed && \(\s*<div className="text-center transition-opacity duration-300">\s*<h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">\{appSettings.websiteName \|\| 'TITAN ESPORTS'\}<\/h1>\s*<p className="text-\[8px\] text-neutral-500 font-mono tracking-wider">ADMIN v\{appSettings.version\}<\/p>\s*<\/div>\s*\)\}/m,
  `<div className="text-center">
              <h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">{appSettings.websiteName || 'TITAN ESPORTS'}</h1>
              <p className="text-[8px] text-neutral-500 font-mono tracking-wider">ADMIN v{appSettings.version}</p>
            </div>`
);

// 4. Actually update the sidebar's Exit Console button!
content = content.replace(
  /<div className="absolute right-4 top-4 flex items-center gap-1\.5">\s*<button\s+onClick=\{onBack\}\s+className="px-2 py-1 rounded bg-white\/5 text-\[9px\] uppercase font-bold text-neutral-400 hover:text-white border border-white\/5 cursor-pointer"\s+>\s+Exit Console\s+<\/button>\s*<\/div>/m,
  `<div className="absolute right-4 top-4 flex items-center gap-1.5">
            <button 
              onClick={onBack}
              className="px-2 py-1.5 flex justify-center items-center rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
              title="Exit Console"
            >
              {sidebarCollapsed ? <LogOut className="w-4 h-4" /> : 'Exit Console'}
            </button>
          </div>`
);

// 5. Actually update the sidebar's Logo text!
content = content.replace(
  /<div className="text-center">\s*<h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">\{appSettings.websiteName \|\| 'TITAN ESPORTS'\}<\/h1>\s*<p className="text-\[8px\] text-neutral-500 font-mono tracking-wider">ADMIN v\{appSettings.version\}<\/p>\s*<\/div>/m,
  `{!sidebarCollapsed && (
            <div className="text-center transition-opacity duration-300">
              <h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">{appSettings.websiteName || 'TITAN ESPORTS'}</h1>
              <p className="text-[8px] text-neutral-500 font-mono tracking-wider">ADMIN v{appSettings.version}</p>
            </div>
          )}`
);

// 6. Fix `overflow-y-auto` missing from nav block - it was changed to just flex-1 earlier, but let's make sure it's there
content = content.replace(
  /<nav className="flex-1 p-3 space-y-1">/m,
  `<nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">`
);
content = content.replace(
  /<nav className="flex-1 p-3 space-y-1 overflow-y-auto">/m,
  `<nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

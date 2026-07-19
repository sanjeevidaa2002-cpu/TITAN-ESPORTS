const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Update Exit Console button
content = content.replace(
  /<button\s+onClick=\{onBack\}[\s\S]*?Exit Console\n\s*<\/button>/m,
  `<button 
              onClick={onBack}
              className="px-2 py-1.5 flex justify-center items-center rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
              title="Exit Console"
            >
              {sidebarCollapsed ? <LogOut className="w-4 h-4" /> : 'Exit Console'}
            </button>`
);

// Add LogOut import if needed
if (!content.includes('LogOut')) {
  content = content.replace(/import \{ /, 'import { LogOut, ');
}

// Update Logo text
content = content.replace(
  /<div className="text-center">\n\s*<h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">\{appSettings.websiteName \|\| 'TITAN ESPORTS'\}<\/h1>\n\s*<p className="text-\[8px\] text-neutral-500 font-mono tracking-wider">ADMIN v\{appSettings.version\}<\/p>\n\s*<\/div>/g,
  `{!sidebarCollapsed && (
            <div className="text-center transition-opacity duration-300">
              <h1 className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500 uppercase">{appSettings.websiteName || 'TITAN ESPORTS'}</h1>
              <p className="text-[8px] text-neutral-500 font-mono tracking-wider">ADMIN v{appSettings.version}</p>
            </div>
          )}`
);

// Update all menu items to hide span when collapsed
content = content.replace(
  /<span(.*?)>(.*?)<\/span>/g,
  (match, p1, p2) => {
    // only hide text spans inside the nav
    if (p1.includes('w-1.5 h-1.5')) return match; // skip pulse dot
    if (p2.includes('Secure Firebase Mode')) return match; // skip footer text
    return `{!sidebarCollapsed && <span${p1}>${p2}</span>}`;
  }
);

// Add justify-center if collapsed on menu buttons
content = content.replace(
  /className=\{\`w-full flex items-center gap-2\.5 px-3\.5 py-2\.5 rounded-xl/g,
  'className={`w-full flex items-center ${sidebarCollapsed ? \'justify-center px-0\' : \'gap-2.5 px-3.5\'} py-2.5 rounded-xl'
);

// Update footer
content = content.replace(
  /<div className="overflow-hidden">\n\s*<p className="text-\[10px\] font-bold text-white uppercase tracking-wider truncate">\{userProfile\?\.nickname \|\| 'Administrator'\}<\/p>\n\s*<p className="text-\[8px\] text-green-400 flex items-center gap-1 font-semibold">\n\s*<span className="w-1\.5 h-1\.5 rounded-full bg-green-500 block animate-pulse"><\/span>\n\s*Secure Firebase Mode\n\s*<\/p>\n\s*<\/div>/m,
  `{!sidebarCollapsed && (
          <div className="overflow-hidden transition-opacity duration-300">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{userProfile?.nickname || 'Administrator'}</p>
            <p className="text-[8px] text-green-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse"></span>
              Secure Firebase Mode
            </p>
          </div>
          )}`
);

// Add Global Header to MAIN BODY AREA
content = content.replace(
  /\{\/\* MAIN BODY AREA \*\/\}\n\s*<main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">/,
  `{/* MAIN BODY AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* GLOBAL ADMIN HEADER */}
        <header className="shrink-0 bg-[#0d0d14] border-b border-white/5 p-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Admin Dashboard</h2>
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer border border-white/5 flex items-center justify-center"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">`
);

// Close the new flex-1 div wrapper
content = content.replace(
  /<\/main>\n\s*<\/div>/,
  `        </div>\n      </main>\n    </div>`
);


fs.writeFileSync('src/components/AdminDashboard.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!content.includes('bonus_management')) {
  content = content.replace(/\| 'banner_management'>\('overview'\);/g, "| 'banner_management' | 'bonus_management'>('overview');");
}

if (!content.includes('<span>🎁 Bonus Management</span>')) {
  // Find a good place to insert the sidebar button, e.g., after banner_management
  const bannerBtnRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('banner_management'\)\}[\s\S]*?<\/button>/;
  const match = content.match(bannerBtnRegex);
  if (match) {
    const bonusBtn = `
          <button
            onClick={() => setActiveTab('bonus_management')}
            className={\`w-full flex items-center \${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-xl text-left text-xs uppercase font-black tracking-wider transition-all cursor-pointer \${
              activeTab === 'bonus_management' 
                ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
            }\`}
          >
            <Award className="w-4 h-4 text-pink-400" />
            {!sidebarCollapsed && <span>🎁 Bonus Management</span>}
          </button>`;
    content = content.replace(match[0], match[0] + bonusBtn);
  }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

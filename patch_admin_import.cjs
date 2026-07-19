const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!content.includes('AdminBonusManagementTab')) {
  content = content.replace(/import \{ AdminBannerManagementTab \} from '\.\/AdminBannerManagementTab';/g, "import { AdminBannerManagementTab } from './AdminBannerManagementTab';\nimport { AdminBonusManagementTab } from './AdminBonusManagementTab';");
  
  content = content.replace(
    /\{activeTab === 'banner_management' && \(\s*<AdminBannerManagementTab \/>\s*\)\}/,
    `{activeTab === 'banner_management' && (\n          <AdminBannerManagementTab />\n        )}\n\n        {/* VIEW: BONUS MANAGEMENT */}\n        {activeTab === 'bonus_management' && (\n          <AdminBonusManagementTab />\n        )}`
  );
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add sidebarCollapsed state
if (!content.includes('sidebarCollapsed')) {
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState/,
    `const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1200);\n  const [activeTab, setActiveTab] = useState`
  );
}

// 2. Change root flex layout
content = content.replace(
  /<div className="fixed inset-0 bg-\[\#08080c\] text-neutral-200 z-50 flex flex-col md:flex-row font-sans overflow-hidden">/g,
  `<div className="fixed inset-0 bg-[#08080c] text-neutral-200 z-50 flex flex-row font-sans overflow-hidden">`
);

// 3. Update aside element to support collapsing
content = content.replace(
  /<aside className="w-full md:w-64 bg-\[\#0d0d14\] border-b md:border-b-0 md:border-r border-white\/5 flex flex-col shrink-0">/g,
  `<aside className="bg-[#0d0d14] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden" style={{ width: sidebarCollapsed ? '75px' : '260px' }}>`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

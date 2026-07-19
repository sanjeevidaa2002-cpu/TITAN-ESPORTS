const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = content.replace(
  /import \{ BrowserRouter, Routes, Route, Navigate, useLocation \} from 'react-router-dom';\n*/g,
  ""
);
content = content.replace(
  /import \{ GameProvider, useGame \} from '.\/context\/GameContext';/,
  "import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';\nimport { GameProvider, useGame } from './context/GameContext';"
);

// Remove Admin Tab
content = content.replace(
  /\{ id: 'admin', label: 'Admin', icon: Shield, onClick: \(\) => setActiveTab\('admin'\) \},\n/g,
  ""
);

// Remove activeTab === 'admin' render block
content = content.replace(
  /if \(activeTab === 'admin'\) \{\n\s*return <AdminDashboard onBack=\{\(\) => setActiveTab\('profile'\)\} \/>;\n\s*\}/g,
  ""
);

// Create Admin App components
const adminComponents = `
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading } = useGame();
  
  if (loading) return null;
  if (!currentUser) return <Navigate to="/admin/login" replace />;
  if (userProfile?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  
  return <>{children}</>;
}

function AdminApp() {
  return (
    <AdminAuthGuard>
      <AdminDashboard onBack={() => {}} />
    </AdminAuthGuard>
  );
}
`;

content = content.replace(/export default function App\(\) \{/, adminComponents + '\nexport default function App() {');

// Wrap with router
const newAppRender = `export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/admin/login" element={<Auth initialMode="login" adminMode={true} />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/login" element={<DashboardContent />} />
          <Route path="/signup" element={<DashboardContent />} />
          <Route path="/*" element={<DashboardContent />} />
        </Routes>
        <FloatingSupportWidget />
      </GameProvider>
    </BrowserRouter>
  );
}`;

content = content.replace(/export default function App\(\) \{[\s\S]*?\}\n/, newAppRender + '\n');

fs.writeFileSync('src/App.tsx', content);

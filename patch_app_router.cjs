const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard onBack={() => {}} />} />
          
          <Route path="/login" element={<DashboardContent />} />
          <Route path="/signup" element={<DashboardContent />} />
          <Route path="/*" element={<DashboardContent />} />
        </Routes>
        <FloatingSupportWidget />
      </GameProvider>
    </BrowserRouter>
  );
}`;

content = content.replace(/export default function App\(\) \{[\s\S]*?\}\n/, replacement + '\n');
fs.writeFileSync('src/App.tsx', content);

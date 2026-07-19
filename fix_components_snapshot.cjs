const fs = require('fs');
const path = require('path');

const files = [
  'src/components/StorageManager.tsx',
  'src/components/AdminBonusManagementTab.tsx',
  'src/components/AdminDashboard.tsx',
  'src/components/AdminWinningsManager.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all onSnapshot calls and add an error handler to them
  // We'll use a regex to find onSnapshot(..., (snap) => {...}) without an error handler
  // Since regex on multiline can be tricky, let's do a simple replace on the string `})` that ends the onSnapshot block?
  // Actually, we can just replace the specific calls.

  if (file.includes('StorageManager.tsx')) {
    content = content.replace(
      /const unsub = onSnapshot\(q, \(snapshot\) => \{([\s\S]*?)\}\);/g,
      `const unsub = onSnapshot(q, (snapshot) => {$1}, (err) => console.warn('Storage sync error.'));`
    );
  } else if (file.includes('AdminBonusManagementTab.tsx')) {
    content = content.replace(
      /const unsub = onSnapshot\(q, \(snap\) => \{([\s\S]*?)\}\);/g,
      `const unsub = onSnapshot(q, (snap) => {$1}, (err) => console.warn('Bonus sync error.'));`
    );
  } else if (file.includes('AdminDashboard.tsx')) {
    content = content.replace(
      /const unsubUsers = onSnapshot\(collection\(db, 'users'\), \(snapshot\) => \{([\s\S]*?)\}\);/g,
      `const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {$1}, (err) => console.warn('Users sync error.'));`
    );
    content = content.replace(
      /const unsubTransactions = onSnapshot\(collection\(db, 'transactions'\), \(snapshot\) => \{([\s\S]*?)\}\);/g,
      `const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {$1}, (err) => console.warn('Transactions sync error.'));`
    );
  } else if (file.includes('AdminWinningsManager.tsx')) {
    content = content.replace(
      /const unsub = onSnapshot\(collection\(db, 'users'\), \(snapshot\) => \{([\s\S]*?)\}\);/g,
      `const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {$1}, (err) => console.warn('Users sync error.'));`
    );
  }
  
  fs.writeFileSync(filePath, content);
}

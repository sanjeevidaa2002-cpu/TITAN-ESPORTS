const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

content = content.replace(/  SupportMessage,\n/g, '');
content = content.replace(/  const \[dbSupport, setDbSupport\] = useState<SupportMessage\[\]>\(\[\]\);\n/g, '');
content = content.replace(/    \/\/ Realtime support listener\n    const unsubSupport = onSnapshot\(collection\(db, 'support_messages'\), \(snapshot\) => \{\n      const list: SupportMessage\[\] = \[\];\n      snapshot\.forEach\(\(doc\) => \{\n        list\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as SupportMessage\);\n      \}\);\n      setDbSupport\(list\);\n    \}, \(err\) => \{\n      console\.warn\("Support messages sync failed:", err\);\n    \}\);\n/g, '');
content = content.replace(/      unsubSupport\(\);\n/g, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

const targetStr = "const [searchUserQuery, setSearchUserQuery] = useState('');";
const replaceStr = "const [searchUserQuery, setSearchUserQuery] = useState('');\n  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState<boolean | null>(null);\n  const [isSavingNotifications, setIsSavingNotifications] = useState(false);";

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(dashPath, content);
console.log("State injected");

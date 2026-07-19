const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

// Remove from interface
content = content.replace(/  submitSupportMessage: \(name: string, email: string, message: string, channel: 'telegram' \| 'whatsapp' \| 'discord' \| 'instagram' \| 'contact_form'\) => Promise<void>;\n/, '');

// Remove function
const funcRegex = /  \/\/ Submit Support ticket \(simulated or direct Firestore\)\n  const submitSupportMessage = async \([\s\S]*?\}\n    \}\n  \};\n/m;
content = content.replace(funcRegex, '');

// Remove from context value
content = content.replace(/      submitSupportMessage,\n/, '');

fs.writeFileSync('src/context/GameContext.tsx', content);

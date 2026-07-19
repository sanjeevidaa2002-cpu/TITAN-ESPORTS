const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

content = content.replace(/adminMode\?: boolean/, "");
content = content.replace(/, adminMode = false/, "");
content = content.replace(/, adminMode/, "");
content = content.replace(/\{\!adminMode && \(/g, "{true && (");
content = content.replace(/adminMode \?\s*\(userProfile\?\.role === 'admin' \? navigate\('\/admin\/dashboard', \{ replace: true \}\) : navigate\('\/', \{ replace: true \}\)\)\s*:\s*/, "");
content = content.replace(/if \(adminMode\) \{[\s\S]*?\} else \{/g, "");
content = content.replace(/        navigate\('\/', \{ replace: true \}\);\n      \}/g, "        navigate('/', { replace: true });");
fs.writeFileSync('src/components/Auth.tsx', content);

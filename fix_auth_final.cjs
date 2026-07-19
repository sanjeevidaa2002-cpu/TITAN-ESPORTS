const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

content = content.replace(/\{\!adminMode && \(/g, "{true && (");
content = content.replace(/\{\!adminMode && </g, "{true && <");
content = content.replace(/adminMode/g, "false");

fs.writeFileSync('src/components/Auth.tsx', content);

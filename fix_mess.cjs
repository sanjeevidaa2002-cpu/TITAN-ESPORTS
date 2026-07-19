const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /  return \{ videos: parsedVideos, shorts: parsedShorts \};\n  \}\n/g;
content = content.replace(regex, "  });\n");

fs.writeFileSync(file, content);

const fs = require('fs');
const path = require('path');

const splashPath = path.join(__dirname, 'src/components/SplashScreen.tsx');
let content = fs.readFileSync(splashPath, 'utf8');

content = content.replace(
  "if (baseUrl) {",
  "if (baseUrl) {\n      if (baseUrl.startsWith('data:')) return baseUrl;"
);

fs.writeFileSync(splashPath, content);
console.log("SplashScreen patched");

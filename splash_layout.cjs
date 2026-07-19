const fs = require('fs');
const content = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');
console.log(content.split('\n').filter((_, i) => i > 200 && i < 280).join('\n'));

const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

code = code.replace(/brandingSettings\?\.splashShowProgressBar !== false/g, "showProgressBar !== false");

fs.writeFileSync('src/components/SplashScreen.tsx', code);

const fs = require('fs');
let content = fs.readFileSync('src/dataStore.ts', 'utf8');

const imgUrl = 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png';

content = content.replace(/splashLogo: '',/g, `splashLogo: '${imgUrl}',`);
content = content.replace(/splashMainLogo: '',/g, `splashMainLogo: '${imgUrl}',`);
content = content.replace(/splashFallbackLogo: '',/g, `splashFallbackLogo: '${imgUrl}',`);
content = content.replace(/loadingMainLogo: '',/g, `loadingMainLogo: '${imgUrl}',`);
content = content.replace(/loadingCenterLogo: '',/g, `loadingCenterLogo: '${imgUrl}',`);
content = content.replace(/loadingLogo: '',/g, `loadingLogo: '${imgUrl}',`);

fs.writeFileSync('src/dataStore.ts', content);

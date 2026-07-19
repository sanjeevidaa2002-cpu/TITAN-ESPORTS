const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace('{/* Option 2: Custom Upload */}', '{/* Option 2: Custom URL */}');
content = content.replace('{/* Column 2: Custom Mascot Upload */}', '{/* Column 2: Custom Mascot URL */}');

const cropStart = content.indexOf('const handleCropToSquare = async');
if (cropStart !== -1) {
  const cropEnd = content.indexOf('};', content.indexOf('img.onerror = () => {', cropStart)) + 2;
  if (cropEnd > 2) {
    content = content.substring(0, cropStart) + content.substring(cropEnd);
  }
}

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

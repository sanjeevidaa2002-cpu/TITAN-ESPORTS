const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code += `\nexport interface LoadingScreenSettings {
  loadingLogoUrl: string;
  loadingLogoSource: 'upload' | 'url';
  loadingTitle: string;
  loadingSubtitle: string;
  loadingText: string;
  backgroundColor: string;
  backgroundImage: string;
  progressBarEnabled: boolean;
  animationEnabled: boolean;
  updatedAt?: number;
}\n`;
fs.writeFileSync('src/types.ts', code);

const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

const targetContent = `                {[
                  { key: 'splashLogo', label: 'Main Loading Logo', desc: 'Appears inside the decorative orbital ring' },
                  { key: 'splashFallbackLogo', label: 'Fallback Brand Logo', desc: 'Displays if main logo fails to render' }
                ].map((item) => {`;

const newContent = `                {[
                  { key: 'loadingMainLogo', label: 'Loading Logo 1', desc: 'Appears at the top of the loading screen' },
                  { key: 'loadingCenterLogo', label: 'Loading Logo 2', desc: 'Appears inside the decorative orbital ring in the center' },
                  { key: 'loadingLogo', label: 'Loading Logo 3', desc: 'Appears at the bottom above the progress bar' }
                ].map((item) => {`;

content = content.replace(targetContent, newContent);
fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const hook = `  // Preload YouTube Data
  useEffect(() => {
    if (currentUser) {
      preloadYouTubeData();
    }
  }, [currentUser]);

`;

const target = `  // Update document title and favicon`;
const newContent = content.replace(target, hook + target);

fs.writeFileSync('src/App.tsx', newContent);
console.log('App.tsx updated');

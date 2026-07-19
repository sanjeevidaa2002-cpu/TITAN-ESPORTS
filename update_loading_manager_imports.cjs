const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace(
  "import { useGame } from '../context/GameContext';",
  "import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../firebase';\nimport { useGame } from '../context/GameContext';"
);

content = content.replace(
  "Trash2,",
  "Trash2,\n  Upload,"
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);

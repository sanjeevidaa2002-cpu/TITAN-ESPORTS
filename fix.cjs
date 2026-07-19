const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const badBlock = `  }
      }
  });
  // ==========================================
  // API ENDPOINTS FOR YOUTUBE SYSTEM
      }
  });
  // ==========================================`;

const goodBlock = `  }
  // ==========================================
  // API ENDPOINTS FOR YOUTUBE SYSTEM
  // ==========================================`;

content = content.replace(badBlock, goodBlock);
fs.writeFileSync(file, content);

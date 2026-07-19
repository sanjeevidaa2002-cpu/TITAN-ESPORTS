const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /    videosCache = \{ data: parsedVideos, timestamp: Date\.now\(\) \};[\s\S]*?  \/\/ ==========================================/g;

content = content.replace(regex, `    videosCache = { data: parsedVideos, timestamp: Date.now() };
    shortsCache = { data: parsedShorts, timestamp: Date.now() };
    return { videos: parsedVideos, shorts: parsedShorts };
  }
  // ==========================================`);

fs.writeFileSync(file, content);

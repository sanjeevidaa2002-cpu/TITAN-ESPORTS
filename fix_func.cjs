const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    videosCache = { data: parsedVideos, timestamp: Date.now() };
    shortsCache = { data: parsedShorts, timestamp: Date.now() };
  });
  });
  // ==========================================`;

const replacement = `    videosCache = { data: parsedVideos, timestamp: Date.now() };
    shortsCache = { data: parsedShorts, timestamp: Date.now() };
    return { videos: parsedVideos, shorts: parsedShorts };
  } catch (err) {
    console.error("Error fetching YouTube content:", err);
    return { videos: [], shorts: [] };
  }
}
// ==========================================`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);

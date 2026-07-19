const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// The lines 216-222 are:
//    videosCache = { data: parsedVideos, timestamp: Date.now() };
//    return { videos: parsedVideos, shorts: parsedShorts };
//  } catch (err) {
//    console.error("Error fetching YouTube content:", err);
//    return { videos: [], shorts: [] };
//  }
//}
//  });
//  });

// Let's replace the whole bottom part of fetchYouTubeContent starting from videosCache =
const regex = /    videosCache = \{ data: parsedVideos, timestamp: Date\.now\(\) \};[\s\S]*?  \}\);\n  \}\);/g;

content = content.replace(regex, `    videosCache = { data: parsedVideos, timestamp: Date.now() };
    shortsCache = { data: parsedShorts, timestamp: Date.now() };
    return { videos: parsedVideos, shorts: parsedShorts };
  } catch (err) {
    console.error("YouTube parse error:", err);
    return { videos: parsedVideos, shorts: parsedShorts };
  }
}`);

fs.writeFileSync(file, content);

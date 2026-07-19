const fs = require('fs');
const content = fs.readFileSync('src/components/YouTubeTab.tsx', 'utf8');

const preloadFn = `export const preloadYouTubeData = async () => {
  if (isFetchingYT) return;
  const cachedStr = localStorage.getItem(YT_CACHE_KEY);
  if (cachedStr && Date.now() - lastYtFetch < CACHE_TTL) return;

  isFetchingYT = true;
  try {
    const configRes = await fetch('/api/youtube/config');
    if (!configRes.ok) return;
    const configData = await configRes.json();
    
    if (!configData.enabled || !configData.hasApiKey || !configData.channelId) {
      isFetchingYT = false;
      return; 
    }

    const [channelRes, videosRes, shortsRes, liveRes] = await Promise.all([
      fetch('/api/youtube/channel'),
      fetch('/api/youtube/videos'),
      fetch('/api/youtube/shorts'),
      fetch('/api/youtube/live')
    ]);

    const newChannel = channelRes.ok ? await channelRes.json() : null;
    const newVideos = videosRes.ok ? await videosRes.json() : [];
    const newShorts = shortsRes.ok ? await shortsRes.json() : [];
    const newLive = liveRes.ok ? await liveRes.json() : null;

    localStorage.setItem(YT_CACHE_KEY, JSON.stringify({
      config: configData,
      channel: newChannel,
      videos: newVideos,
      shorts: newShorts,
      liveData: newLive
    }));
    
    lastYtFetch = Date.now();
  } catch (err) {
    console.warn("Error preloading YouTube metadata:", err);
  } finally {
    isFetchingYT = false;
  }
};
`;

const replaceTarget = 'export const YouTubeTab: React.FC = () => {';
const newContent = content.replace(replaceTarget, preloadFn + '\n' + replaceTarget);
fs.writeFileSync('src/components/YouTubeTab.tsx', newContent);
console.log('Successfully injected preload function');
